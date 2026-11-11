#!/usr/bin/env python3
"""Build dist/wait-24h-<version>.zip containing only the runtime files."""
import json
import os
import posixpath
import re
import subprocess
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOP_FILES = [
    "manifest.json", "background.js", "content.js", "thanks.js", "config.js",
    "sites.json", "popup.html", "popup.css", "popup.js",
    "options.html", "options.css", "options.js",
    "welcome.html", "welcome.css", "welcome.js",
]


def fail(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def collect():
    files = [f for f in TOP_FILES if os.path.isfile(os.path.join(ROOT, f))]
    for sub, ext in (("lib", ".js"), ("icons", ".png")):
        d = os.path.join(ROOT, sub)
        if os.path.isdir(d):
            for name in os.listdir(d):
                if name.endswith(ext) and os.path.isfile(os.path.join(d, name)):
                    files.append(sub + "/" + name)
    loc = os.path.join(ROOT, "_locales")
    if os.path.isdir(loc):
        for dp, _, names in os.walk(loc):
            for name in names:
                files.append(os.path.relpath(os.path.join(dp, name), ROOT).replace(os.sep, "/"))
    return sorted(set(files), key=lambda p: (p != "manifest.json", p))


def manifest_refs(m):
    refs = []
    bg = m.get("background", {})
    if "service_worker" in bg:
        refs.append(bg["service_worker"])
    for cs in m.get("content_scripts", []):
        refs += cs.get("js", []) + cs.get("css", [])
    act = m.get("action", {})
    if "default_popup" in act:
        refs.append(act["default_popup"])
    di = act.get("default_icon", {})
    refs += list(di.values()) if isinstance(di, dict) else [di]
    if "page" in m.get("options_ui", {}):
        refs.append(m["options_ui"]["page"])
    ic = m.get("icons", {})
    refs += list(ic.values())
    return refs


def main():
    with open(os.path.join(ROOT, "manifest.json"), encoding="utf-8") as fh:
        manifest = json.load(fh)
    version = manifest.get("version")
    if not version:
        fail("manifest.json has no version")

    r = subprocess.run(
        [sys.executable, os.path.join(ROOT, "tools", "check_release.py"), "--release"],
        cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout + r.stderr)
        fail("release check failed; not packaging")

    files = collect()
    inzip = set(files)
    missing = []

    for ref in manifest_refs(manifest):
        if ref not in inzip:
            missing.append("manifest.json -> " + ref)

    for page in [f for f in files if f.endswith(".html")]:
        text = open(os.path.join(ROOT, page), encoding="utf-8").read()
        for m in re.finditer(r'<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["\']([^"\']+)["\']', text, re.I):
            u = m.group(1)
            if re.match(r"^([a-z][a-z0-9+.-]*:|//|#)", u, re.I):
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(page), u.split("#")[0].split("?")[0]))
            if target not in inzip:
                missing.append("%s -> %s" % (page, u))

    imp = re.compile(r'(?:^|[\s;])(?:import|export)\b[^"\';]*?\bfrom\s*["\']([^"\']+)["\']|(?:^|[\s;])import\s*["\']([^"\']+)["\']|\bimport\(\s*["\']([^"\']+)["\']\s*\)', re.M)
    for js in [f for f in files if f.endswith(".js")]:
        text = open(os.path.join(ROOT, js), encoding="utf-8").read()
        for m in imp.finditer(text):
            u = next(g for g in m.groups() if g)
            if not u.startswith("."):
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(js), u))
            if target not in inzip:
                missing.append("%s imports %s" % (js, u))

    dl = manifest.get("default_locale")
    used = set(re.findall(r"__MSG_(\w+)__", json.dumps(manifest)))
    if used or dl:
        if not dl:
            missing.append("manifest uses __MSG_ but has no default_locale")
        elif "_locales/%s/messages.json" % dl not in inzip:
            missing.append("_locales/%s/messages.json (default_locale)" % dl)
        locs = sorted({f.split("/")[1] for f in files if f.startswith("_locales/")})
        for loc_name in locs:
            p = "_locales/%s/messages.json" % loc_name
            if p not in inzip:
                missing.append(p)
                continue
            with open(os.path.join(ROOT, p), encoding="utf-8") as fh:
                msgs = json.load(fh)
            for k in sorted(used):
                if k not in msgs:
                    missing.append("%s: message %s not defined" % (p, k))

    if missing:
        fail("referenced files missing from package:\n  " + "\n  ".join(missing))

    dist = os.path.join(ROOT, "dist")
    os.makedirs(dist, exist_ok=True)
    out = os.path.join(dist, "wait-24h-%s.zip" % version)
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            zi = zipfile.ZipInfo(f, date_time=(1980, 1, 1, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            with open(os.path.join(ROOT, f), "rb") as fh:
                z.writestr(zi, fh.read())

    print("Zip:   " + out)
    print("Files: %d" % len(files))
    print("Size:  %d bytes" % os.path.getsize(out))
    for f in files:
        print("  " + f)


if __name__ == "__main__":
    main()
