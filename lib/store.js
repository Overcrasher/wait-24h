// Shared storage helpers (ES module, used by background, popup, options).
import "./validate.js"; // classic script: defines globalThis.WaitValidate
const V = globalThis.WaitValidate;
export const DEFAULT_SETTINGS = { sites: {}, minPrice: 0, delayHours: 24, mainCurrency: "EUR" };
export const DEFAULT_DONATION = { asked: [], lastAskAt: 0, dontAskAgain: false };
export const CURRENCIES = ["EUR", "USD", "GBP", "RON", "PLN", "SEK", "NOK", "DKK", "CZK", "HUF", "CHF", "CAD", "AUD", "JPY", "INR", "MXN", "BRL", "TRY"];
export const BYPASS_MS = 15 * 60 * 1000;
export const PAUSE_MS = 60 * 60 * 1000;

// Reads everything with defaults applied (fresh install safe).
export async function getAll() {
  const d = await chrome.storage.local.get(["settings", "pausedUntil", "pending", "savings", "itemsSkipped", "history", "donation", "supporter", "bypass"]);
  const num = (n) => (typeof n === "number" && isFinite(n) ? n : 0);
  return {
    settings: V.sanitizeSettings(d.settings, DEFAULT_SETTINGS),
    pausedUntil: num(d.pausedUntil),
    pending: V.sanitizePending(d.pending),
    savings: V.sanitizeSavings(d.savings),
    itemsSkipped: Math.max(0, num(d.itemsSkipped)),
    history: V.sanitizeHistory(d.history),
    donation: Object.assign({}, DEFAULT_DONATION, d.donation && typeof d.donation === "object" ? d.donation : {}),
    supporter: d.supporter === true,
    bypass: V.sanitizeBypass(d.bypass),
  };
}

// Serializes read-modify-write operations within one context.
let chain = Promise.resolve();
export function mutate(fn) {
  const p = chain.then(fn);
  chain = p.catch(() => {});
  return p;
}

export function formatMoney(amount, currency, wholeOnly) {
  try {
    const opts = { style: "currency", currency };
    if (wholeOnly) opts.maximumFractionDigits = 0;
    return new Intl.NumberFormat(navigator.language || "en", opts).format(amount);
  } catch (e) {
    return amount.toFixed(2) + " " + currency;
  }
}

export function delayLabel(hours) {
  if (hours === 12) return "Remind me in 12 hours";
  if (hours === 48) return "Remind me in 2 days";
  return "Remind me tomorrow";
}
