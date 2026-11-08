// Content script: intercepts buy / add-to-cart clicks and shows a pause overlay.
(() => {
  "use strict";
  const { parsePrice, joinPriceParts, fromJsonLd, structPrice } = globalThis.WaitPrice;
  const BYPASS_MS = 15 * 60 * 1000;
  const host = location.hostname;

  let config = null;           // site config from the service worker
  let settings = { sites: {}, minPrice: 0, delayHours: 24, mainCurrency: "EUR" };
  let pausedUntil = 0;
  let bypass = {};             // { [hostname]: { checkoutUntil, urls: { [origin+pathname]: ms } } }
  let ready = false;           // state loaded; until then never intercept (fail open)
  let overlayOpen = false;
  const allowed = new WeakSet(); // elements whose next click must pass through

  // ---- state (cached so the click handler can stay synchronous) ----
  function applyState(d) {
    if (d.settings) settings = Object.assign({}, settings, d.settings);
    if ("pausedUntil" in d) pausedUntil = d.pausedUntil || 0;
    if ("bypass" in d) bypass = d.bypass || {};
  }
  function init() {
    try {
      chrome.storage.local.get(["settings", "pausedUntil", "bypass"]).then((d) => { applyState(d); ready = true; });
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        const d = {};
        for (const k of Object.keys(changes)) d[k] = changes[k].newValue;
        applyState(d);
      });
      chrome.runtime.sendMessage({ type: "getConfig", hostname: host }).then((r) => {
        config = r && r.config;
      });
    } catch (e) { /* extension context gone */ }
  }

  // ---- button detection ----
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const BUY_PHRASES = ["buy now", "add to cart", "add to basket", "add to bag",
    "cumpara acum", "adauga in cos"];
  const CHECKOUT_PHRASES = ["place order", "place your order", "proceed to checkout",
    "plaseaza comanda", "finalizeaza comanda", "trimite comanda", "continua spre plata"];
  const CLICKABLE = "button, a, input[type=submit], input[type=button], [role=button]";

  function textHas(el, phrases) {
    const t = norm((el.tagName === "INPUT" ? el.value : "") || el.getAttribute("aria-label") || el.textContent);
    return t.length > 0 && t.length <= 40 && phrases.some((p) => t.includes(p));
  }

  function bySelector(target, sels) {
    for (const sel of sels || []) {
      try { const el = target.closest(sel); if (el) return el; } catch (e) { /* bad selector */ }
    }
    return null;
  }

  // Returns { el, kind: "buy" | "checkout" } or null.
  function findButton(target) {
    const sel = (config && config.selectors) || {};
    let el = bySelector(target, sel.checkout);
    if (el) return { el, kind: "checkout" };
    el = bySelector(target, sel.buy);
    if (el) return { el, kind: "buy" };
    // Heuristic fallback: nearest clickable ancestors (a few levels) with matching text.
    el = target.closest(CLICKABLE);
    for (let i = 0; el && i < 3; i++) {
      if (textHas(el, CHECKOUT_PHRASES)) return { el, kind: "checkout" };
      if (textHas(el, BUY_PHRASES)) return { el, kind: "buy" };
      el = el.parentElement && el.parentElement.closest(CLICKABLE);
    }
    return null;
  }

  // ---- product info ----
  function firstText(selectors) {
    for (const sel of selectors || []) {
      try {
        const el = document.querySelector(sel);
        const t = el && (el.textContent || el.getAttribute("content") || "").trim();
        if (t) return t;
      } catch (e) { /* ignore */ }
    }
    return "";
  }
  // Flattens a price element into [{ text, fraction }] so <sup> cents can be joined correctly.
  function priceParts(node, out) {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) out.push({ text: n.nodeValue });
      else if (n.nodeType === 1) {
        const cls = n.getAttribute("class") || "";
        if (n.tagName === "SUP" || /decimal|fraction|cents/i.test(cls)) out.push({ text: n.textContent, fraction: true });
        else priceParts(n, out);
      }
    }
    return out;
  }
  function priceFromSelectors(def) {
    for (const sel of ((config && config.selectors) || {}).price || []) {
      try {
        const el = document.querySelector(sel);
        if (!el) continue;
        const text = joinPriceParts(priceParts(el, []), def) || el.getAttribute("content") || "";
        const p = text.trim() ? parsePrice(text, def) : null;
        if (p) return p;
      } catch (e) { /* ignore */ }
    }
    return null;
  }
  // Schema.org data: the most reliable source across shops.
  function priceFromStructured(def) {
    try {
      const metas = document.querySelectorAll("meta[itemprop='price'][content], [itemprop='price'][content]");
      for (const m of metas) {
        const scope = m.closest("[itemscope]") || document;
        const c = scope.querySelector("[itemprop='priceCurrency']") || document.querySelector("[itemprop='priceCurrency']");
        const cur = c && (c.getAttribute("content") || c.textContent);
        const p = structPrice(m.getAttribute("content"), cur, def);
        if (p) return p;
      }
    } catch (e) { /* ignore */ }
    for (const s of document.querySelectorAll("script[type='application/ld+json']")) {
      try {
        const p = fromJsonLd(JSON.parse(s.textContent), def);
        if (p) return p;
      } catch (e) { /* malformed JSON-LD */ }
    }
    return null;
  }
  function getProduct() {
    const sel = (config && config.selectors) || {};
    let title = firstText(sel.title);
    if (!title) {
      const og = document.querySelector("meta[property='og:title']");
      title = (og && og.content) || document.title || "";
    }
    const def = config && config.currency;
    const price = priceFromStructured(def) || priceFromSelectors(def);
    return { title: title.replace(/\s+/g, " ").trim(), price };
  }

  // ---- click handling ----
  const pageKey = () => location.origin + location.pathname;
  function isBypassed(kind, now) {
    const b = bypass[host];
    if (!b) return false;
    if (kind === "checkout") return b.checkoutUntil > now;     // place order after a continue
    return !!(b.urls && b.urls[pageKey()] > now);              // this product only
  }

  function onClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const hit = findButton(target);
    if (!hit) return;
    const el = hit.el;
    if (allowed.has(el)) return;                                // our own re-click
    if (!e.isTrusted) return;                                   // only real user clicks
    if (!ready || !config) return;                              // state not loaded yet: fail open
    if (overlayOpen) { block(e); return; }
    const now = Date.now();
    if (settings.sites[config.siteId] === false) return;        // site disabled
    if (pausedUntil > now) return;                              // extension paused
    if (isBypassed(hit.kind, now)) return;                      // user just chose "continue"
    const product = getProduct();
    const p = product.price;
    if (p && p.currency === settings.mainCurrency && p.amount < settings.minPrice) return;
    block(e);
    showOverlay(el, product);
  }
  function block(e) { e.preventDefault(); e.stopImmediatePropagation(); }

  // Resolves true only if the service worker answered ok.
  async function request(msg) {
    try {
      const r = await chrome.runtime.sendMessage(msg);
      return !!(r && r.ok && !r.error);
    } catch (e) { return false; }
  }

  // ---- overlay (Shadow DOM) ----
  const CSS = `
    :host { all: initial; }
    .backdrop { position: fixed; inset: 0; background: rgba(20,24,40,.55); display: flex;
      align-items: center; justify-content: center; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .card { box-sizing: border-box; width: min(420px, calc(100vw - 32px)); background: #fff; color: #1f2430;
      border-radius: 18px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
    h2 { margin: 0 0 4px; font-size: 20px; }
    .sub { margin: 0 0 16px; font-size: 14px; color: #5b6275; }
    .title { font-size: 15px; font-weight: 600; margin: 0 0 4px; word-break: break-word; }
    .price { font-size: 26px; font-weight: 700; margin: 0 0 18px; color: #4f46e5; }
    .err { margin: 12px 0 0; font-size: 13px; color: #b42318; }
    .price.unknown { font-size: 15px; font-weight: 500; color: #5b6275; }
    button { display: block; width: 100%; box-sizing: border-box; margin: 8px 0 0; padding: 12px 14px;
      font: inherit; font-size: 15px; border-radius: 12px; cursor: pointer; border: 1px solid #d5d9e6;
      background: #f4f5fa; color: inherit; }
    button:hover { background: #eaecf6; }
    button:focus-visible { outline: 3px solid #a5b4fc; outline-offset: 2px; }
    button.primary { background: #4f46e5; border-color: #4f46e5; color: #fff; font-weight: 600; }
    button.primary:hover { background: #4338ca; }
    button.ghost { background: transparent; border-color: transparent; color: #5b6275; }
    @media (prefers-color-scheme: dark) {
      .card { background: #1e2230; color: #eceef7; }
      .sub, .price.unknown, button.ghost { color: #a3a9bd; }
      .price { color: #a5b4fc; }
      .err { color: #fda29b; }
      button { background: #2a2f42; border-color: #3a4058; }
      button:hover { background: #343a52; }
      button.primary { background: #6366f1; border-color: #6366f1; }
      button.primary:hover { background: #4f52d9; }
      button.ghost { background: transparent; border-color: transparent; }
    }`;

  function formatPrice(p) {
    try { return new Intl.NumberFormat(navigator.language || "en", { style: "currency", currency: p.currency }).format(p.amount); }
    catch (e) { return p.amount.toFixed(2) + " " + p.currency; }
  }
  function remindLabel(h) {
    return h === 12 ? "Remind me in 12 hours" : h === 48 ? "Remind me in 2 days" : "Remind me tomorrow";
  }
  function h(tag, props, text) {
    const n = document.createElement(tag);
    Object.assign(n, props || {});
    if (text != null) n.textContent = text;
    return n;
  }

  function showOverlay(triggerEl, product) {
    overlayOpen = true;
    const host_ = document.createElement("div");
    const root = host_.attachShadow({ mode: "closed" });
    host_.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647;";
    root.appendChild(h("style", {}, CSS));

    const title = product.title.length > 140 ? product.title.slice(0, 137) + "..." : product.title;
    const price = product.price;
    const card = h("div", { className: "card", role: "dialog" });
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "wt-h");
    const heading = h("h2", { id: "wt-h" }, "Wait a moment");
    const sub = h("p", { className: "sub" }, "Is this something you really need right now?");
    const titleEl = h("p", { className: "title" }, title || "This item");
    const priceEl = h("p", { className: "price" + (price ? "" : " unknown") }, price ? formatPrice(price) : "Price unknown");
    const bRemind = h("button", { className: "primary", type: "button" }, remindLabel(settings.delayHours));
    const bGo = h("button", { type: "button" }, "I need this, continue");
    const bNever = h("button", { className: "ghost", type: "button" }, "Never mind");
    const errEl = h("p", { className: "err", role: "alert" });
    errEl.hidden = true;
    card.append(heading, sub, titleEl, priceEl, bRemind, bGo, bNever, errEl);
    const backdrop = h("div", { className: "backdrop" });
    backdrop.appendChild(card);
    root.appendChild(backdrop);

    function close() {
      overlayOpen = false;
      document.removeEventListener("keydown", onKey, true);
      host_.remove();
    }
    const buttons = [bRemind, bGo, bNever];
    function onKey(ev) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); } // blocks, no savings
      else if (ev.key === "Tab") {
        const active = root.activeElement;
        const i = buttons.indexOf(active);
        ev.preventDefault();
        const next = ev.shiftKey ? (i <= 0 ? buttons.length - 1 : i - 1) : (i + 1) % buttons.length;
        buttons[next].focus();
      }
    }
    document.addEventListener("keydown", onKey, true);

    // Saves via the service worker; closes only on success, otherwise shows an inline error.
    async function save(msg) {
      buttons.forEach((b) => { b.disabled = true; });
      errEl.hidden = true;
      const ok = await request(msg);
      if (ok) { close(); return; }
      buttons.forEach((b) => { b.disabled = false; });
      errEl.textContent = "Couldn't save \u2014 please try again";
      errEl.hidden = false;
    }
    const money = () => ({ price: price ? price.amount : null, currency: price ? price.currency : null });
    bRemind.addEventListener("click", () => save({ type: "remind", item: {
      title: product.title, url: location.href, ...money() } }));
    bNever.addEventListener("click", () => save({ type: "never", title: product.title, ...money() }));
    bGo.addEventListener("click", async () => {
      const now = Date.now(), key = pageKey();
      const b = bypass[host] || { checkoutUntil: 0, urls: {} };
      bypass[host] = { checkoutUntil: now + BYPASS_MS, urls: Object.assign({}, b.urls, { [key]: now + BYPASS_MS }) };
      close();
      await request({ type: "continue", hostname: host, url: key });
      allowed.add(triggerEl);
      triggerEl.click();
      setTimeout(() => allowed.delete(triggerEl), 1000);
    });

    document.documentElement.appendChild(host_);
    bRemind.focus();
  }

  document.addEventListener("click", onClick, true);
  init();
})();
