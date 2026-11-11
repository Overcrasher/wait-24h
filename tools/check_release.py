#!/usr/bin/env python3
"""Pre-publish checks for config.js. Usage: python3 tools/check_release.py [--release]

Fails (exit 1) if a donation link is not an https://buy.stripe.com/ or https://donate.stripe.com/ link, looks like a test-mode /
placeholder link, or THANKS_URL does not correspond to the manifest's thanks content-script match.
With --release the four EUR links (small, medium, large, custom) must also be set.
"""
import json, os, re, sys

# Mirrors ALLOWED_DONATION_ORIGINS in lib/support.js.
ALLOWED_ORIGINS = ("https://buy.stripe.com", "https://donate.stripe.com")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
release = "--release" in sys.argv
errors = []

cfg = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
manifest = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))

def link_set(name):
    m = re.search(r"export const " + name + r"\s*=\s*\{([^}]*)\}", cfg)
    if not m:
        errors.append("config.js: %s not found" % name)
        return {}
    return dict(re.findall(r'(\w+)\s*:\s*"([^"]*)"', m.group(1)))

sets = {"DONATE_LINKS": link_set("DONATE_LINKS"), "DONATE_LINKS_USD": link_set("DONATE_LINKS_USD")}
for name, links in sets.items():
    for key, url in links.items():
        if not url:
            continue
        where = "%s.%s" % (name, key)
        if not url.startswith(tuple(o + "/" for o in ALLOWED_ORIGINS)):
            errors.append("%s: must start with one of %s (got %r)" % (where, ", ".join(o + "/" for o in ALLOWED_ORIGINS), url))
        if "test_" in url:
            errors.append("%s: looks like a Stripe test-mode link (contains 'test_')" % where)
        if re.search(r"TODO|PLACEHOLDER", url, re.I):
            errors.append("%s: contains TODO/PLACEHOLDER" % where)

if release:
    for key in ("small", "medium", "large", "custom"):
        if not sets["DONATE_LINKS"].get(key):
            errors.append("--release: DONATE_LINKS.%s (EUR) is empty - create the Stripe Payment Link and set it" % key)

m = re.search(r'export const THANKS_URL\s*=\s*"([^"]*)"', cfg)
thanks = m.group(1) if m else None
if not thanks:
    errors.append("config.js: THANKS_URL not found")
else:
    matches = []
    for cs in manifest.get("content_scripts", []):
        if "thanks.js" in cs.get("js", []):
            matches += cs.get("matches", [])
    if not matches:
        errors.append("manifest.json: no content script match for thanks.js")
    for pat in matches:
        base = re.sub(r"\?session_id=\*$|\*$", "", pat)
        if base != thanks:
            errors.append("THANKS_URL %r does not correspond to the manifest thanks match %r" % (thanks, pat))
    if not thanks.startswith("https://"):
        errors.append("THANKS_URL must be https")

# Localized store name/description (limits enforced by the Chrome Web Store).
LOCALES = ("en", "ro", "de", "fr", "es")
for loc in LOCALES:
    mp = os.path.join(ROOT, "_locales", loc, "messages.json")
    try:
        msgs = json.load(open(mp, encoding="utf-8"))
    except (OSError, ValueError) as e:
        errors.append("_locales/%s/messages.json: %s" % (loc, e))
        continue
    for key, limit in (("extName", 75), ("extDescription", 132)):
        text = msgs.get(key, {}).get("message")
        if not text:
            errors.append("_locales/%s: %s missing" % (loc, key))
        elif len(text) > limit:
            errors.append("_locales/%s: %s is %d chars (max %d)" % (loc, key, len(text), limit))
if manifest.get("default_locale") != "en":
    errors.append("manifest.json: default_locale must be 'en'")
if manifest.get("name") != "__MSG_extName__" or manifest.get("description") != "__MSG_extDescription__":
    errors.append("manifest.json: name/description must be __MSG_extName__/__MSG_extDescription__")

if errors:
    print("check_release: FAILED")
    for e in errors:
        print("  - " + e)
    sys.exit(1)
print("check_release: OK" + (" (release)" if release else ""))
