// Pure price parsing. Classic script: attaches to globalThis (content script + jsc tests).
(function (root) {
  "use strict";

  const CODES = "RON|EUR|USD|GBP|CHF|PLN|SEK|NOK|DKK|CZK|HUF|JPY|INR|CAD|AUD|MXN|BRL|TRY|CNY";
  const CODE_RE = new RegExp("\\b(" + CODES + ")\\b", "i");
  const DOLLAR_FAMILY = ["USD", "CAD", "AUD", "MXN"];
  const KRONA_FAMILY = ["SEK", "NOK", "DKK"];

  // Detects the ISO currency in `text`; falls back to `def` for ambiguous symbols.
  function detectCurrency(text, def) {
    if (/R\$/i.test(text)) return "BRL";
    if (/\bUS\s*\$|US\$/i.test(text)) return "USD";
    if (/\bCA\s*\$|\bC\$|CA\$/i.test(text)) return "CAD";
    if (/\bAU\s*\$|\bA\$|AU\$/i.test(text)) return "AUD";
    if (/\bMX\s*\$|\bMex\s*\$|MX\$/i.test(text)) return "MXN";
    const code = text.match(CODE_RE);
    if (code) return code[1].toUpperCase();
    if (/\blei\b|\bleu\b/i.test(text)) return "RON";
    if (/zł|\bzl\b/i.test(text)) return "PLN";
    if (/\bTL\b|₺/i.test(text)) return "TRY";
    if (/Kč/i.test(text)) return "CZK";
    if (/\bFt\b/.test(text)) return "HUF";
    if (/\bkr\b/i.test(text)) return KRONA_FAMILY.includes(def) ? def : "SEK";
    if (text.includes("€")) return "EUR";
    if (text.includes("£")) return "GBP";
    if (/[¥￥]/.test(text)) return def === "CNY" ? "CNY" : "JPY";
    if (text.includes("₹")) return "INR";
    if (text.includes("$")) return DOLLAR_FAMILY.includes(def) ? def : "USD";
    return def || null;
  }

  // Turns "1.299,99" / "1,299.99" / "12,99" / "1,980" into a number.
  function toNumber(s) {
    s = s.replace(/[\s']/g, "");
    const dots = (s.match(/\./g) || []).length;
    const commas = (s.match(/,/g) || []).length;
    let dec = null;
    if (dots && commas) {
      dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    } else if (dots + commas === 1) {
      const sep = dots ? "." : ",";
      const after = s.length - s.indexOf(sep) - 1;
      const intPart = s.slice(0, s.indexOf(sep));
      // Exactly 3 digits after a lone separator means thousands, unless the int part is 0.
      if (after !== 3 || intPart === "0") dec = sep;
    }
    let out = s;
    if (dec) {
      const other = dec === "." ? /,/g : /\./g;
      out = out.replace(other, "");
      if (dec === ",") out = out.replace(",", ".");
    } else {
      out = out.replace(/[.,]/g, "");
    }
    return parseFloat(out);
  }

  // Candidates: space-grouped thousands | dot/comma/apostrophe-grouped | plain | bare ".99".
  const NUM_G = /\d{1,3}(?: \d{3})+(?:[.,]\d{1,2})?(?!\d)|\d{1,3}(?:[.,']\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)?|[.,]\d{1,2}(?!\d)/g;
  const SYMBOLS = "R\\$|[€£¥￥₹₺$]";
  const WORDS = "(?:" + CODES + "|lei|leu|zł|zl|TL|Ft|kr|Kč)";
  const CUR_BEFORE = new RegExp("(?:(?:" + SYMBOLS + ")|(?:^|[^A-Za-z])" + WORDS + ")\\s*$", "i");
  const CUR_AFTER = new RegExp("^\\s*(?:(?:" + SYMBOLS + ")|" + WORDS + "(?![A-Za-z]))", "i");
  const MAX_PRICE = 100000;

  // Returns the best amount in `t`: the first number adjacent to a currency symbol/code,
  // else the first number. Space-grouped thousands count only when adjacent to the currency.
  function pickNumber(t) {
    NUM_G.lastIndex = 0;
    let first = null, m;
    while ((m = NUM_G.exec(t))) {
      let s = m[0];
      const end = m.index + s.length;
      let adj = CUR_BEFORE.test(t.slice(0, m.index)) || CUR_AFTER.test(t.slice(end));
      if (s.includes(" ") && !adj) {
        // Not a price-like group: keep only the leading group, rescan after it.
        s = s.split(" ")[0];
        NUM_G.lastIndex = m.index + s.length;
        adj = CUR_BEFORE.test(t.slice(0, m.index)) || CUR_AFTER.test(t.slice(m.index + s.length));
      }
      if (adj) return s;
      if (first === null) first = s;
    }
    return first;
  }

  function parsePrice(text, defaultCurrency) {
    if (typeof text !== "string") return null;
    const t = text.replace(/[\u00a0\u202f\u2009]/g, " ").trim();
    const num = pickNumber(t);
    if (num === null) return null;
    const amount = toNumber(num);
    if (!isFinite(amount) || amount <= 0 || amount > MAX_PRICE) return null;
    const currency = detectCurrency(t, defaultCurrency || null);
    if (!currency) return null;
    return { amount: Math.round(amount * 100) / 100, currency };
  }

  // ---- price element -> text. `parts` = [{ text, fraction? }] flattened from the DOM:
  // a fraction part (<sup>, class decimal/fraction/cents) is joined with a decimal separator.
  const DOT_DEC = ["USD", "GBP", "CAD", "AUD", "MXN", "JPY", "INR", "CNY", "CHF"];
  function joinPriceParts(parts, currency) {
    let out = "";
    for (const p of parts) {
      const txt = String(p.text || "");
      if (p.fraction && /^\s*\d{1,2}\s*$/.test(txt) && /\d\s*$/.test(out)) {
        out = out.replace(/\s+$/, "");
        const tail = out.match(/\d[\d.,' ]*$/)[0];
        // Use the separator the integer part does not already use for thousands.
        const sep = tail.includes(",") ? "." : tail.includes(".") ? "," : DOT_DEC.includes(currency) ? "." : ",";
        out += sep + txt.trim();
      } else {
        out += txt;
      }
    }
    return out;
  }

  // ---- structured data (schema.org) ----
  function structNumber(v) {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return NaN;
    const s = v.trim();
    return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : /^[\d.,' ]+$/.test(s) ? toNumber(s) : NaN;
  }
  function structPrice(price, currency, def) {
    const amount = structNumber(price);
    const cur = typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency.trim())
      ? currency.trim().toUpperCase() : (def || null);
    if (!isFinite(amount) || amount <= 0 || amount > MAX_PRICE || !cur) return null;
    return { amount: Math.round(amount * 100) / 100, currency: cur };
  }

  // Finds a Product's offer price in parsed JSON-LD (object, array or @graph).
  function fromJsonLd(data, def) {
    const queue = Array.isArray(data) ? data.slice() : [data];
    let guard = 0;
    while (queue.length && guard++ < 200) {
      const n = queue.shift();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n)) { queue.push(...n); continue; }
      if (n["@graph"]) queue.push(...[].concat(n["@graph"]));
      const types = [].concat(n["@type"] || []);
      if (!types.includes("Product")) continue;
      for (const o of [].concat(n.offers || [])) {
        if (!o || typeof o !== "object") continue;
        const spec = o.priceSpecification && !Array.isArray(o.priceSpecification) ? o.priceSpecification : {};
        const r = structPrice(o.price != null ? o.price : (o.lowPrice != null ? o.lowPrice : spec.price),
          o.priceCurrency || spec.priceCurrency, def);
        if (r) return r;
      }
    }
    return null;
  }

  root.WaitPrice = { parsePrice, joinPriceParts, fromJsonLd, structPrice };
})(globalThis);
