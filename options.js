import { getAll, DEFAULT_SETTINGS, CURRENCIES } from "./lib/store.js";
import { renderDonateButtons } from "./lib/support.js";

const G = globalThis.WaitGrowth;

const $ = (id) => document.getElementById(id);
let settings;
let savedTimer;

async function save() {
  await chrome.storage.local.set({ settings });
  const el = $("saved");
  el.classList.add("show");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => el.classList.remove("show"), 1200);
}

async function init() {
  const state = await getAll();
  settings = Object.assign({}, DEFAULT_SETTINGS, state.settings, { sites: Object.assign({}, state.settings.sites) });

  const sites = (await (await fetch(chrome.runtime.getURL("sites.json"))).json()).sites;
  const wrap = $("sites");
  for (const s of sites) {
    const label = document.createElement("label");
    label.className = "shop";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.setAttribute("role", "switch");
    cb.checked = settings.sites[s.id] !== false;
    cb.addEventListener("change", () => { settings.sites[s.id] = cb.checked; save(); });
    const track = document.createElement("span"); track.className = "track"; track.setAttribute("aria-hidden", "true");
    const text = document.createElement("span"); text.className = "shop-text";
    const name = document.createElement("span"); name.className = "shop-name"; name.textContent = s.name;
    const doms = s.domains || [];
    const hint = document.createElement("span"); hint.className = "shop-dom";
    hint.textContent = (doms[0] || "") + (doms.length > 1 ? " +" + (doms.length - 1) + " more" : "");
    text.append(name, hint);
    label.append(cb, track, text);
    wrap.appendChild(label);
  }

  const min = $("minPrice");
  min.value = settings.minPrice;
  min.addEventListener("change", () => {
    const v = parseFloat(min.value);
    settings.minPrice = isFinite(v) && v >= 0 ? v : 0;
    min.value = settings.minPrice;
    save();
  });

  for (const r of document.querySelectorAll("input[name=delay]")) {
    r.checked = Number(r.value) === settings.delayHours;
    r.addEventListener("change", () => { if (r.checked) { settings.delayHours = Number(r.value); save(); } });
  }

  const sel = $("mainCurrency");
  for (const c of CURRENCIES) {
    const o = document.createElement("option");
    o.value = o.textContent = c;
    sel.appendChild(o);
  }
  sel.value = settings.mainCurrency;
  $("minCur").textContent = settings.mainCurrency;
  sel.addEventListener("change", () => {
    settings.mainCurrency = sel.value;
    $("minCur").textContent = sel.value;
    save();
  });

  $("thanks").hidden = !state.supporter;
  const shown = renderDonateButtons($("donate"), settings.mainCurrency, state.savings[settings.mainCurrency] || 0, $("donate-note"));
  // Cross-promotion links: only exact allow-listed URLs are ever opened.
  for (const id of ["rate-link", "other-link"]) {
    const a = $(id);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (G.ALLOWED_URLS.includes(a.href)) chrome.tabs.create({ url: a.href });
    });
  }
  if (!shown) $("donate-note").textContent = "Donation links not configured yet";
}
init();
