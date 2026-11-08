import { getAll, formatMoney, PAUSE_MS } from "./lib/store.js";
import { renderDonateButtons, hasDonateLinks } from "./lib/support.js";

const $ = (id) => document.getElementById(id);
const D = globalThis.WaitDonation;
let state;

function dueText(item, now) {
  if (item.dueAt <= now) return "Ready for your decision";
  const mins = Math.ceil((item.dueAt - now) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return "Due in " + (h ? h + "h " : "") + m + "m";
}

function renderSavings() {
  const main = state.settings.mainCurrency;
  $("total").textContent = formatMoney(state.savings[main] || 0, main);
  const others = Object.entries(state.savings).filter(([c, v]) => c !== main && v > 0);
  $("others").textContent = others.map(([c, v]) => formatMoney(v, c)).join("  ·  ");
  $("skipped").textContent = state.itemsSkipped;
  $("pendingCount").textContent = state.pending.length;
}

function renderPending() {
  const now = Date.now();
  const list = $("pendingList");
  list.textContent = "";
  const items = state.pending.slice().sort((a, b) => {
    const da = a.dueAt <= now, db = b.dueAt <= now;
    return da !== db ? (da ? -1 : 1) : a.dueAt - b.dueAt;
  });
  $("pendingEmpty").hidden = items.length > 0;
  for (const item of items) {
    const li = document.createElement("li");
    if (item.dueAt <= now) li.className = "due";
    const t = document.createElement("div"); t.className = "t"; t.textContent = item.title || item.url;
    const m = document.createElement("div"); m.className = "m";
    const price = typeof item.price === "number" && item.currency ? formatMoney(item.price, item.currency) : "price unknown";
    m.textContent = price + " · " + dueText(item, now);
    const row = document.createElement("div"); row.className = "row";
    const want = document.createElement("button"); want.type = "button"; want.className = "primary"; want.textContent = "Still want it";
    want.addEventListener("click", async () => {
      chrome.tabs.create({ url: item.url });
      await chrome.runtime.sendMessage({ type: "keepItem", id: item.id });
      await refresh();
    });
    const skip = document.createElement("button"); skip.type = "button"; skip.textContent = "Skip it";
    skip.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({ type: "skipItem", id: item.id });
      await refresh();
    });
    row.append(want, skip);
    li.append(t, m, row);
    list.appendChild(li);
  }
}

function renderPause() {
  const left = state.pausedUntil - Date.now();
  $("pause").checked = left > 0;
  $("pauseLeft").textContent = left > 0 ? Math.ceil(left / 60000) + " min left" : "";
}

async function maybeShowBanner() {
  if (state.supporter) return;
  const main = state.settings.mainCurrency;
  const total = state.savings[main] || 0;
  const now = Date.now();
  const dstate = Object.assign({}, state.donation, { supporter: state.supporter });
  const milestone = D.pickAsk(dstate, total, now);
  if (!milestone) return;
  // Unconfigured build: don't show the banner and don't burn the milestone.
  if (!hasDonateLinks()) return;
  // Persist right away: showing the banner is the ask (max one per milestone).
  const next = D.applyAsk(state.donation, milestone, now);
  state.donation = next;
  await chrome.storage.local.set({ donation: next });
  $("banner-text").textContent = "You've saved " + formatMoney(milestone, main, true) +
    " with Wait 24h. Built by one developer, no ads, no tracking. If this helped, a coffee keeps it going.";
  renderDonateButtons($("banner-buttons"), main, total, $("banner-note"));
  $("banner").hidden = false;
}

async function refresh() {
  state = await getAll();
  renderSavings(); renderPending(); renderPause();
  $("supporter").hidden = !state.supporter;
}

async function init() {
  await refresh();
  await maybeShowBanner();
  $("banner-close").addEventListener("click", () => { $("banner").hidden = true; });
  $("banner-never").addEventListener("click", async (e) => {
    e.preventDefault();
    const donation = Object.assign({}, state.donation, { dontAskAgain: true });
    await chrome.storage.local.set({ donation });
    $("banner").hidden = true;
  });
  $("pause").addEventListener("change", async (e) => {
    state.pausedUntil = e.target.checked ? Date.now() + PAUSE_MS : 0;
    await chrome.storage.local.set({ pausedUntil: state.pausedUntil });
    renderPause();
  });
  if (new URLSearchParams(location.search).get("view") === "pending") {
    const s = $("pendingSection");
    s.scrollIntoView();
    s.classList.add("highlight");
  }
  setInterval(() => { renderPause(); renderPending(); }, 30000);
}
init();
