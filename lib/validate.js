// Pure validators / sanitizers. Classic script: attaches WaitValidate to globalThis.
// Used by the service worker (via `import "./lib/validate.js"`), lib/store.js and the jsc tests.
(function (root) {
  "use strict";

  const CUR_RE = /^[A-Z]{3}$/;
  const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{20,}$/;
  const THANKS_PAGE = "https://overcrasher.github.io/wait-24h/thanks.html";
  const MAX_TITLE = 200, MAX_URL = 2048, MAX_PRICE = 100000;
  const DELAYS = [12, 24, 48];
  // Control chars, line/paragraph separators, zero-width and bidi override characters.
  const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;

  const isObj = (o) => !!o && typeof o === "object" && !Array.isArray(o);
  const isNum = (n) => typeof n === "number" && isFinite(n);

  function cleanTitle(s) {
    if (typeof s !== "string") return "";
    return s.replace(BAD_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE).trim();
  }
  // null/undefined -> null; valid number -> number; anything else -> undefined (invalid).
  function price(p) {
    if (p === null || p === undefined) return null;
    return isNum(p) && p > 0 && p <= MAX_PRICE ? p : undefined;
  }
  // null/undefined -> null; valid ISO-like code -> code; anything else -> undefined (invalid).
  function currency(c) {
    if (c === null || c === undefined) return null;
    return typeof c === "string" && CUR_RE.test(c) ? c : undefined;
  }
  // WHATWG URL where available (browsers); minimal http(s)-only fallback for engines without it (jsc tests).
  function parseUrl(u) {
    if (typeof URL === "function") return new URL(u);
    const m = /^(https?:)\/\/([^\/?#:@\s]+)(:\d+)?(\/[^?#\s]*)?(\?[^#\s]*)?(#\S*)?$/i.exec(u);
    if (!m) throw new Error("bad url");
    const proto = m[1].toLowerCase(), host = m[2].toLowerCase(), path = m[4] || "/";
    return { protocol: proto, hostname: host, pathname: path, origin: proto + "//" + host + (m[3] || ""),
      href: proto + "//" + host + (m[3] || "") + path + (m[5] || "") + (m[6] || "") };
  }
  function parseWeb(u) {
    if (typeof u !== "string" || u.length > MAX_URL) return null;
    try {
      const x = parseUrl(u);
      return (x.protocol === "https:" || x.protocol === "http:") && x.href.length <= MAX_URL ? x : null;
    } catch (e) { return null; }
  }
  // href of `u` if it is http(s), <= 2048 chars and (when `host` is given) on exactly that host; else null.
  function urlOn(u, host) {
    const x = parseWeb(u);
    return x && (!host || x.hostname === host) ? x.href : null;
  }
  // The message url if valid for `host`, else the sender tab url (if valid), else null.
  function shopUrl(u, tabUrl, host) {
    return urlOn(u, host) || urlOn(tabUrl, host);
  }
  function hostOf(u) {
    try { return parseUrl(u).hostname || null; } catch (e) { return null; }
  }
  const matchesDomain = (host, d) => host === d || host.endsWith("." + d);
  function isThanksUrl(u) {
    try { const x = parseUrl(u); return x.origin + x.pathname === THANKS_PAGE; } catch (e) { return false; }
  }
  const validSession = (s) => typeof s === "string" && SESSION_RE.test(s);

  // ---- stored data (read side) ----
  function sanitizeSettings(s, defaults) {
    const d = defaults || { sites: {}, minPrice: 0, delayHours: 24, mainCurrency: "EUR" };
    s = isObj(s) ? s : {};
    const sites = {};
    if (isObj(s.sites)) {
      for (const k of Object.keys(s.sites)) {
        if (k !== "__proto__" && typeof s.sites[k] === "boolean") sites[k] = s.sites[k];
      }
    }
    return {
      sites,
      minPrice: isNum(s.minPrice) && s.minPrice >= 0 ? s.minPrice : d.minPrice,
      delayHours: DELAYS.includes(s.delayHours) ? s.delayHours : d.delayHours,
      mainCurrency: typeof s.mainCurrency === "string" && CUR_RE.test(s.mainCurrency) ? s.mainCurrency : d.mainCurrency,
    };
  }
  function sanitizeSavings(s) {
    const out = {};
    if (!isObj(s)) return out;
    for (const k of Object.keys(s)) if (CUR_RE.test(k) && isNum(s[k]) && s[k] >= 0) out[k] = s[k];
    return out;
  }
  function sanitizeBypass(b) {
    const out = {};
    if (!isObj(b)) return out;
    for (const k of Object.keys(b)) {
      if (k !== "__proto__" && isObj(b[k]) && isNum(b[k].checkoutUntil)) out[k] = { checkoutUntil: b[k].checkoutUntil };
    }
    return out;
  }
  function pendingEntry(p) {
    if (!isObj(p) || typeof p.id !== "string" || typeof p.title !== "string" || typeof p.url !== "string") return null;
    if (p.id.length > 100 || p.url.length > MAX_URL) return null;
    const pr = p.price === undefined ? null : p.price, cu = p.currency === undefined ? null : p.currency;
    if (!(pr === null || isNum(pr)) || !(cu === null || (typeof cu === "string" && CUR_RE.test(cu)))) return null;
    if (!isNum(p.timestamp) || !isNum(p.dueAt)) return null;
    return { id: p.id, title: cleanTitle(p.title), url: p.url, price: pr, currency: cu,
      timestamp: p.timestamp, dueAt: p.dueAt, notified: p.notified === true };
  }
  function historyEntry(h) {
    if (!isObj(h) || typeof h.title !== "string" || !isNum(h.date)) return null;
    const pr = h.price === undefined ? null : h.price, cu = h.currency === undefined ? null : h.currency;
    if (!(pr === null || isNum(pr)) || !(cu === null || (typeof cu === "string" && CUR_RE.test(cu)))) return null;
    const out = { title: cleanTitle(h.title), price: pr, currency: cu, date: h.date };
    const u = urlOn(h.url);
    if (u) out.url = u;
    return out;
  }
  const sanitizeList = (list, fn) => (Array.isArray(list) ? list : []).map(fn).filter(Boolean);

  root.WaitValidate = {
    MAX_TITLE, MAX_URL, MAX_PRICE, THANKS_PAGE,
    cleanTitle, price, currency, urlOn, shopUrl, hostOf, matchesDomain, isThanksUrl, validSession,
    sanitizeSettings, sanitizeSavings, sanitizeBypass, pendingEntry, historyEntry,
    sanitizePending: (l) => sanitizeList(l, pendingEntry),
    sanitizeHistory: (l) => sanitizeList(l, historyEntry),
  };
})(globalThis);
