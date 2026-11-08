// Service worker (module). Owns all mutations of pending items / savings.
import { getAll, mutate, BYPASS_MS } from "./lib/store.js";

const V = globalThis.WaitValidate; // defined by lib/validate.js (imported through store.js)
const MAX_PENDING = 100;
const FAIL = { ok: false };

// Content scripts must not read or write storage: only trusted extension pages and this worker.
async function lockStorage() {
  try { await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }); }
  catch (e) { console.warn("setAccessLevel failed", e); }
}
lockStorage();

const ICON = "icons/icon128.png";
const round2 = (n) => Math.round(n * 100) / 100;

// ---- sites.json (content scripts cannot fetch it; they ask us) ----
let sitesCache = null;
async function loadSites() {
  if (!sitesCache) {
    const res = await fetch(chrome.runtime.getURL("sites.json"));
    sitesCache = (await res.json()).sites || [];
  }
  return sitesCache;
}

const matchesDomain = (host, d) => host === d || host.endsWith("." + d);

async function getConfig(hostname) {
  const sites = await loadSites();
  for (const site of sites) {
    // Longest matching domain wins (so amazon.com.au is not confused with amazon.com).
    const hits = site.domains.filter((d) => matchesDomain(hostname, d)).sort((a, b) => b.length - a.length);
    if (!hits.length) continue;
    const currency = (site.currencies && site.currencies[hits[0]]) || site.currency || null;
    return { siteId: site.id, name: site.name, selectors: site.selectors, currency };
  }
  return null;
}

// ---- savings ----
async function addSavings(title, price, currency, url) {
  return mutate(async () => {
    const { savings, itemsSkipped, history } = await getAll();
    // Only a known price in a known currency counts as money saved.
    if (typeof price === "number" && price > 0 && currency) {
      savings[currency] = round2((savings[currency] || 0) + price);
    }
    const entry = { title: V.cleanTitle(title), price: typeof price === "number" ? price : null,
      currency: currency || null, date: Date.now() };
    if (url) entry.url = url;
    await chrome.storage.local.set({ savings, itemsSkipped: itemsSkipped + 1, history: history.concat(entry).slice(-200) });
  });
}

// ---- reminders ----
// Returns the item id, or null if the pending list is full. Same URL again updates the existing item.
async function addReminder(item) {
  return mutate(async () => {
    const { settings, pending } = await getAll();
    const now = Date.now();
    const fields = { title: item.title, url: item.url, price: item.price, currency: item.currency,
      timestamp: now, dueAt: now + settings.delayHours * 3600 * 1000, notified: false };
    const existing = pending.find((p) => p.url === item.url);
    if (existing) {
      Object.assign(existing, fields);
      await chrome.storage.local.set({ pending });
      chrome.notifications.clear(existing.id);
      chrome.alarms.create("reminder:" + existing.id, { when: existing.dueAt });
      return existing.id;
    }
    if (pending.length >= MAX_PENDING) return null;
    const entry = Object.assign({ id: crypto.randomUUID() }, fields);
    await chrome.storage.local.set({ pending: pending.concat(entry) });
    chrome.alarms.create("reminder:" + entry.id, { when: entry.dueAt });
    return entry.id;
  });
}

async function takePending(id) {
  return mutate(async () => {
    const { pending } = await getAll();
    const item = pending.find((p) => p.id === id);
    if (!item) return null;
    await chrome.storage.local.set({ pending: pending.filter((p) => p.id !== id) });
    chrome.alarms.clear("reminder:" + id);
    chrome.notifications.clear(id);
    return item;
  });
}

async function notify(item) {
  await mutate(async () => {
    const { pending } = await getAll();
    const it = pending.find((p) => p.id === item.id);
    if (!it || it.notified) return;
    it.notified = true;
    await chrome.storage.local.set({ pending });
    chrome.notifications.create(it.id, {
      type: "basic", iconUrl: ICON,
      title: "Still want it?",
      message: (it.title || "An item you paused") + " is waiting for your decision.",
    });
  });
}

// Recreate missing alarms; notify items already due.
async function reconcile() {
  const { pending } = await getAll();
  const alarms = await chrome.alarms.getAll();
  const names = new Set(alarms.map((a) => a.name));
  const now = Date.now();
  for (const item of pending) {
    if (item.dueAt <= now) {
      if (!item.notified) await notify(item);
    } else if (!names.has("reminder:" + item.id)) {
      chrome.alarms.create("reminder:" + item.id, { when: item.dueAt });
    }
  }
}

chrome.runtime.onInstalled.addListener(() => { lockStorage(); reconcile(); });
chrome.runtime.onStartup.addListener(() => { lockStorage(); reconcile(); });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith("reminder:")) return;
  const id = alarm.name.slice("reminder:".length);
  const { pending } = await getAll();
  const item = pending.find((p) => p.id === id);
  if (item) await notify(item);
});

chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  try {
    await chrome.action.openPopup();
  } catch (e) {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?view=pending") });
  }
});

// ---- state pushed to content scripts ----
async function currentState() {
  const { settings, pausedUntil, bypass } = await getAll();
  return { settings, pausedUntil, bypass };
}
async function broadcastState() {
  try {
    const state = await currentState();
    const tabs = await chrome.tabs.query({}); // no "tabs" permission: ids only, which is all we need
    for (const t of tabs) {
      if (t.id == null) continue;
      chrome.tabs.sendMessage(t.id, Object.assign({ type: "state" }, state)).catch(() => {});
    }
  } catch (e) { /* ignore */ }
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if ("settings" in changes || "pausedUntil" in changes || "bypass" in changes) broadcastState();
});

// ---- messages ----
// Sender classes: "extension" (popup/options pages, sender.url on our origin) and "content"
// (content scripts: sender.tab set, web url). Anything else is rejected.
function classify(sender) {
  if (!sender || sender.id !== chrome.runtime.id) return null;
  if (typeof sender.url === "string" && sender.url.startsWith("chrome-extension://" + chrome.runtime.id + "/")) {
    return { kind: "extension" };
  }
  if (sender.tab && typeof sender.tab.url === "string") return { kind: "content", tabUrl: sender.tab.url };
  return null;
}

const validId = (id) => typeof id === "string" && id.length > 0 && id.length <= 100;

async function handleExtension(msg) {
  switch (msg.type) {
    case "skipItem": {
      if (!validId(msg.id)) return FAIL;
      const item = await takePending(msg.id);
      if (item) await addSavings(item.title, item.price, item.currency, V.urlOn(item.url));
      return { ok: true };
    }
    case "keepItem":
      if (!validId(msg.id)) return FAIL;
      await takePending(msg.id);
      return { ok: true };
    default:
      return FAIL;
  }
}

// Title/price/currency from an untrusted message; null if any field is invalid.
function readProduct(src) {
  if (!src || typeof src !== "object") return null;
  if (src.title !== undefined && typeof src.title !== "string") return null;
  const price = V.price(src.price), currency = V.currency(src.currency);
  if (price === undefined || currency === undefined) return null;
  if (price !== null && currency === null) return null; // a price needs its currency
  return { title: V.cleanTitle(src.title || ""), price, currency };
}

async function handleContent(msg, ctx) {
  if (msg.type === "supporter") {
    // Cosmetic flag, honour system: only from the real thank-you page with a Stripe-shaped session id.
    if (!V.isThanksUrl(ctx.tabUrl) || !V.validSession(msg.sessionId)) return FAIL;
    await chrome.storage.local.set({ supporter: true });
    return { ok: true };
  }
  // Everything else: the host comes from the sender's tab, never from the message.
  const proto = (() => { try { return new URL(ctx.tabUrl).protocol; } catch (e) { return ""; } })();
  const host = proto === "https:" ? V.hostOf(ctx.tabUrl) : null;
  if (!host) return FAIL;
  const config = await getConfig(host);
  if (!config) return FAIL;
  switch (msg.type) {
    case "getConfig":
      return { config };
    case "getState":
      return Object.assign({ ok: true }, await currentState());
    case "remind": {
      const p = readProduct(msg.item);
      const url = V.shopUrl(msg.item && msg.item.url, ctx.tabUrl, host);
      if (!p || !url) return FAIL;
      const id = await addReminder(Object.assign(p, { url }));
      return id ? { ok: true, id } : FAIL;
    }
    case "never": {
      const p = readProduct(msg);
      if (!p) return FAIL;
      await addSavings(p.title, p.price, p.currency, V.shopUrl(msg.url, ctx.tabUrl, host));
      return { ok: true };
    }
    case "continue":
      await mutate(async () => {
        const { bypass } = await getAll();
        const now = Date.now();
        // Shape: { [hostname]: { checkoutUntil: ms } }. Expired entries are pruned; only this host is set.
        for (const h of Object.keys(bypass)) if (!(bypass[h].checkoutUntil > now)) delete bypass[h];
        bypass[host] = { checkoutUntil: now + BYPASS_MS };
        await chrome.storage.local.set({ bypass });
      });
      return { ok: true };
    default:
      return FAIL;
  }
}

async function handle(msg, sender) {
  const ctx = classify(sender);
  if (!ctx || !msg || typeof msg !== "object" || typeof msg.type !== "string") return FAIL;
  return ctx.kind === "extension" ? handleExtension(msg) : handleContent(msg, ctx);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handle(msg, sender).then(sendResponse).catch(() => sendResponse(FAIL));
  return true;
});
