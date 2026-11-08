// Service worker (module). Owns all mutations of pending items / savings.
import { getAll, mutate, BYPASS_MS } from "./lib/store.js";

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
async function addSavings(title, price, currency) {
  return mutate(async () => {
    const d = await chrome.storage.local.get(["savings", "itemsSkipped", "history"]);
    const savings = d.savings || {};
    // Only a known price in a known currency counts as money saved.
    if (typeof price === "number" && price > 0 && currency) {
      savings[currency] = round2((savings[currency] || 0) + price);
    }
    const history = (d.history || []).concat({
      title: title || "", price: typeof price === "number" ? price : null,
      currency: currency || null, date: Date.now(),
    }).slice(-200);
    await chrome.storage.local.set({ savings, itemsSkipped: (d.itemsSkipped || 0) + 1, history });
  });
}

// ---- reminders ----
async function addReminder(item) {
  return mutate(async () => {
    const { settings, pending } = await getAll();
    const now = Date.now();
    const entry = {
      id: crypto.randomUUID(),
      title: item.title || "",
      url: item.url,
      price: typeof item.price === "number" ? item.price : null,
      currency: item.currency || null,
      timestamp: now,
      dueAt: now + settings.delayHours * 3600 * 1000,
      notified: false,
    };
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

chrome.runtime.onInstalled.addListener(reconcile);
chrome.runtime.onStartup.addListener(reconcile);

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

// ---- messages ----
async function handle(msg) {
  switch (msg && msg.type) {
    case "getConfig":
      return { config: await getConfig(msg.hostname) };
    case "remind":
      return { ok: true, id: await addReminder(msg.item) };
    case "never":
      await addSavings(msg.title, msg.price, msg.currency);
      return { ok: true };
    case "continue":
      await mutate(async () => {
        const { bypass } = await getAll();
        const now = Date.now();
        // Shape: { [hostname]: { checkoutUntil: ms, urls: { [origin+pathname]: ms } } }
        for (const h of Object.keys(bypass)) {
          const b = bypass[h] || {};
          for (const u of Object.keys(b.urls || {})) if (b.urls[u] < now) delete b.urls[u];
          if (!(b.checkoutUntil > now) && !Object.keys(b.urls || {}).length) delete bypass[h];
        }
        const entry = bypass[msg.hostname] || { checkoutUntil: 0, urls: {} };
        entry.urls = entry.urls || {};
        if (typeof msg.url === "string" && msg.url) entry.urls[msg.url] = now + BYPASS_MS;
        entry.checkoutUntil = now + BYPASS_MS;
        bypass[msg.hostname] = entry;
        await chrome.storage.local.set({ bypass });
      });
      return { ok: true };
    case "skipItem": {
      const item = await takePending(msg.id);
      if (item) await addSavings(item.title, item.price, item.currency);
      return { ok: true };
    }
    case "keepItem":
      await takePending(msg.id);
      return { ok: true };
    default:
      return { error: "unknown message" };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Only accept messages from our own extension contexts.
  if (sender.id !== chrome.runtime.id) return false;
  handle(msg).then(sendResponse).catch((e) => sendResponse({ error: String(e) }));
  return true;
});
