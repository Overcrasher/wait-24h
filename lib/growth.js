// Growth helpers (rating prompt, share text, store URLs). Classic script on globalThis (popup/options <script> tag + jsc tests).
(function (root) {
  "use strict";

  const STORE_URL = "https://chromewebstore.google.com/detail/wait-24h/pkgdjohoemjkejcbfbkfobbbjcpdabme";
  const REVIEWS_URL = STORE_URL + "/reviews";
  const OTHER_STORE_URL = "https://chromewebstore.google.com/detail/meeting-meter/ffkniocclnaojfdcoofnjkfnihnpgnlb";
  const RATING_THRESHOLD = 3;
  const ALLOWED_URLS = [STORE_URL, REVIEWS_URL, OTHER_STORE_URL];

  // Stored rating state -> { shown: boolean, at: number }; anything malformed means "not shown yet".
  function sanitizeRating(r) {
    if (!r || typeof r !== "object" || r.shown !== true) return { shown: false, at: 0 };
    return { shown: true, at: typeof r.at === "number" && isFinite(r.at) ? r.at : 0 };
  }

  // True when the rating card may be shown: enough skipped items and never shown before.
  function shouldAskRating(state, count, threshold) {
    if (sanitizeRating(state).shown) return false;
    return typeof count === "number" && isFinite(count) && count >= threshold;
  }

  // Share text. `fmt(amount, currency, wholeOnly)` formats money (the popup passes formatMoney).
  // Whole units from 100 up, otherwise 2 decimals.
  function shareText(amount, currency, fmt) {
    return "I kept " + fmt(amount, currency, amount >= 100) + " by waiting a day before buying. #Wait24h " + STORE_URL;
  }

  const api = { STORE_URL, REVIEWS_URL, OTHER_STORE_URL, RATING_THRESHOLD, ALLOWED_URLS, sanitizeRating, shouldAskRating, shareText };
  root.WaitGrowth = api;
})(globalThis);
