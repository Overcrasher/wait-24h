// Pure donation logic. Classic script on globalThis (popup/options <script> tag + jsc tests).
(function (root) {
  "use strict";

  const MILESTONES = [50, 100, 250, 500, 1000];
  const MIN_GAP_MS = 30 * 24 * 60 * 60 * 1000;
  const MIN_CUSTOM = 3;
  const MAX_CUSTOM = 100; // max quantity of the custom (EUR/USD 1 each) link
  // Locales that use USD links (in addition to any locale whose region is US or PR).
  const USD_LOCALES = ["en-US", "es-US", "en-PR", "es-PR"];

  // state: { supporter, dontAskAgain, asked: number[], lastAskAt: number|0 }
  // Returns the milestone to ask about, or null.
  function pickAsk(state, mainTotal, now) {
    state = state || {};
    if (state.supporter || state.dontAskAgain) return null;
    const asked = state.asked || [];
    if (state.lastAskAt && now - state.lastAskAt < MIN_GAP_MS) return null;
    let best = null;
    for (const m of MILESTONES) {
      if (mainTotal >= m && !asked.includes(m)) best = m; // highest reached, unasked
    }
    return best;
  }

  // Returns a new state with `milestone` and all lower ones marked as asked.
  function applyAsk(state, milestone, now) {
    const asked = new Set((state && state.asked) || []);
    for (const m of MILESTONES) if (m <= milestone) asked.add(m);
    return Object.assign({}, state, { asked: [...asked].sort((a, b) => a - b), lastAskAt: now });
  }

  // 1% of the main-currency total, rounded up to a whole unit, min 3, max 100.
  function customAmount(total) {
    const t = Number(total) || 0;
    // Epsilon guards against float noise (e.g. 1000 * 0.01 = 10.000000000000002).
    return Math.min(MAX_CUSTOM, Math.max(MIN_CUSTOM, Math.ceil(t * 0.01 - 1e-9)));
  }

  function hasAnyLink(links) {
    return !!links && Object.values(links).some((v) => typeof v === "string" && v !== "");
  }

  const KEYS = ["small", "medium", "large", "custom"];
  const filled = (links, k) => !!links && typeof links[k] === "string" && links[k] !== "";
  // Keys of `links` that have a non-empty URL (buttons for the others are hidden).
  function availableKeys(links) {
    return KEYS.filter((k) => filled(links, k));
  }

  function isUsdLocale(language) {
    if (typeof language !== "string") return false;
    const lang = language.replace("_", "-");
    if (USD_LOCALES.includes(lang)) return true;
    const region = lang.split("-").slice(1).find((p) => /^[A-Za-z]{2}$/.test(p));
    return !!region && ["US", "PR"].includes(region.toUpperCase());
  }

  // Chooses the link set: USD only if small, medium AND large USD links are set and the locale is USD.
  function selectLinks(language, eurLinks, usdLinks) {
    const usdComplete = ["small", "medium", "large"].every((k) => filled(usdLinks, k));
    if (usdComplete && isUsdLocale(language)) {
      return { currency: "USD", symbol: "$", links: usdLinks };
    }
    return { currency: "EUR", symbol: "€", links: eurLinks };
  }

  // Label for the 1% button. Figure only when main currency equals the link currency.
  function customLabel(mainCurrency, linkCurrency, mainTotal, symbol) {
    if (mainCurrency === linkCurrency) {
      const amt = customAmount(mainTotal);
      return { amount: amt, text: "1% of what you saved: " + symbol + amt };
    }
    return { amount: null, text: "Pick your own amount" };
  }

  root.WaitDonation = {
    MILESTONES, MIN_GAP_MS, USD_LOCALES, pickAsk, applyAsk,
    customAmount, isUsdLocale, selectLinks, customLabel, hasAnyLink, availableKeys,
  };
})(globalThis);
