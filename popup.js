import { getAll, formatMoney, PAUSE_MS } from "./lib/store.js";
import { renderDonateButtons, hasDonateLinks } from "./lib/support.js";

const $ = (id) => document.getElementById(id);
const D = globalThis.WaitDonation;
let state;

function dueText(item, now) {
  if (item.dueAt <= now) return "due now";
  const mins = Math.ceil((item.dueAt - now) / 60000);
  if (mins < 60) return "due in " + mins + "m";
  const h = Math.floor(mins / 60), m = mins % 60;
  return "due in " + h + "h" + (h < 6 && m ? " " + m + "m" : "");
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let firstRender = true, countToken = 0;

// Gentle count-up for the hero total; only on the first render after the popup opens.
function countUp(el, target, currency) {
  if (reducedMotion() || !(target > 0)) { el.textContent = formatMoney(target, currency); return; }
  const start = performance.now(), dur = 600, token = ++countToken;
  const step = (t) => {
    if (token !== countToken) return;
    const k = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = formatMoney(k < 1 ? target * eased : target, currency);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function relDate(ts) {
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return days + " days ago";
  return new Date(ts).toLocaleDateString(navigator.language || "en", { month: "short", day: "numeric" });
}

function safeUrl(u) {
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:" ? x : null; } catch { return null; }
}

// Title link (same look as the pending cards): opens in a new tab through chrome.tabs.create.
function titleLink(label, link) {
  const a = document.createElement("a"); a.className = "plink"; a.href = link.href; a.rel = "noopener"; a.target = "_blank";
  a.append(document.createTextNode(label));
  const ico = document.createElement("span"); ico.className = "ext";
  ico.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  a.append(ico);
  a.addEventListener("click", (e) => { e.preventDefault(); chrome.tabs.create({ url: link.href }); });
  return a;
}

function renderRecent() {
  const list = $("recentList");
  list.textContent = "";
  const wins = state.history.filter((h) => h && typeof h.price === "number" && h.price > 0 && h.currency).slice(-3).reverse();
  $("recentSection").hidden = wins.length === 0;
  for (const w of wins) {
    const li = document.createElement("li");
    const ico = document.createElement("span"); ico.className = "ico";
    ico.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>';
    const t = document.createElement("span"); t.className = "rt"; t.title = w.title || "";
    const wl = safeUrl(w.url);
    if (wl) { t.title = (w.title ? w.title + " - " : "") + wl.hostname.replace(/^www\./, ""); t.appendChild(titleLink(w.title || "Item", wl)); }
    else t.textContent = w.title || "Item";
    const a = document.createElement("span"); a.className = "ra"; a.textContent = formatMoney(w.price, w.currency);
    const d = document.createElement("span"); d.className = "rd"; d.textContent = relDate(w.date);
    li.append(ico, t, a, d);
    list.appendChild(li);
  }
}

function renderSavings() {
  const main = state.settings.mainCurrency;
  const mainTotal = state.savings[main] || 0;
  if (firstRender) { firstRender = false; countUp($("total"), mainTotal, main); }
  else { countToken++; $("total").textContent = formatMoney(mainTotal, main); }
  const others = Object.entries(state.savings).filter(([c, v]) => c !== main && v > 0);
  const wrap = $("others");
  wrap.textContent = "";
  for (const [c, v] of others) {
    const chip = document.createElement("span"); chip.className = "chip"; chip.textContent = formatMoney(v, c);
    wrap.appendChild(chip);
  }
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
    const t = document.createElement("div"); t.className = "t";
    const label = item.title || item.url || "Item";
    const link = safeUrl(item.url);
    let host = null;
    if (link) {
      const a = titleLink(label, link);
      t.appendChild(a);
      host = document.createElement("div"); host.className = "host"; host.textContent = link.hostname.replace(/^www\./, "");
    } else t.textContent = label;
    const m = document.createElement("div"); m.className = "m";
    const known = typeof item.price === "number" && item.currency;
    const price = document.createElement("span"); price.className = "price" + (known ? "" : " unknown");
    price.textContent = known ? formatMoney(item.price, item.currency) : "price unknown";
    const pill = document.createElement("span"); pill.className = "pill" + (item.dueAt <= now ? " due" : "");
    pill.textContent = dueText(item, now);
    m.append(price, pill);
    const row = document.createElement("div"); row.className = "row";
    const want = document.createElement("button"); want.type = "button"; want.className = "primary"; want.textContent = "Still want it";
    want.addEventListener("click", async () => {
      if (!link) return;   // unsafe or malformed url: keep the item, do nothing
      chrome.tabs.create({ url: link.href });
      await chrome.runtime.sendMessage({ type: "keepItem", id: item.id });
      await refresh();
    });
    const skip = document.createElement("button"); skip.type = "button"; skip.className = "skip"; skip.textContent = "Skip it";
    skip.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({ type: "skipItem", id: item.id });
      await refresh();
    });
    row.append(want, skip);
    if (host) li.append(t, host, m, row); else li.append(t, m, row);
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
  $("banner-text").textContent = "You've kept " + formatMoney(milestone, main, true) +
    " with Wait 24h. Built by one developer, no ads, no tracking. If this helped, a coffee keeps it going.";
  renderDonateButtons($("banner-buttons"), main, total, $("banner-note"));
  $("banner").hidden = false;
}

async function refresh() {
  state = await getAll();
  renderSavings(); renderPending(); renderRecent(); renderPause();
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
