// Content script: intercepts buy / add-to-cart clicks and shows a pause overlay.
(() => {
  "use strict";
  const { parsePrice, joinPriceParts, fromJsonLd, structPrice } = globalThis.WaitPrice;
  const BYPASS_MS = 15 * 60 * 1000;
  const host = location.hostname;

  let config = null;           // site config from the service worker
  let settings = { sites: {}, minPrice: 0, delayHours: 24, mainCurrency: "EUR" };
  let pausedUntil = 0;
  let bypass = {};             // { [hostname]: { checkoutUntil } }  (old `urls` field is ignored)
  let ready = false;           // state loaded; until then never intercept (fail open)
  let overlayOpen = false;
  let overlayHost = null;      // current overlay host element
  let closeOverlay = () => { overlayOpen = false; };
  const allowed = new WeakSet(); // elements whose next click must pass through

  // ---- state (cached so the click handler can stay synchronous) ----
  // Storage is not reachable from content scripts: the service worker owns it and we get
  // { settings, pausedUntil, bypass } through messages (on load, on focus / visible, and pushed on change).
  function applyState(d) {
    if (!d || typeof d !== "object") return;
    if (d.settings && typeof d.settings === "object") settings = Object.assign({}, settings, d.settings, { sites: Object.assign({}, d.settings.sites) });
    if ("pausedUntil" in d) pausedUntil = Number(d.pausedUntil) || 0;
    if ("bypass" in d) bypass = d.bypass && typeof d.bypass === "object" ? d.bypass : {};
  }
  async function refreshState() {
    try {
      const r = await chrome.runtime.sendMessage({ type: "getState" });
      if (r && r.ok) { applyState(r); ready = true; }
    } catch (e) { /* extension context gone: stay in the current (fail-open) state */ }
  }
  function init() {
    try {
      chrome.runtime.onMessage.addListener((msg, sender) => {
        if (sender.id !== chrome.runtime.id || sender.tab) return;   // only from our service worker
        if (msg && msg.type === "state") { applyState(msg); ready = true; }
      });
      refreshState();
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshState(); });
      window.addEventListener("focus", refreshState);
      chrome.runtime.sendMessage({ type: "getConfig" }).then((r) => {
        config = r && r.config;
      }).catch(() => {});
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
      if (out.length > 200) break;
      if (n.nodeType === 3) out.push({ text: n.nodeValue });
      else if (n.nodeType === 1) {
        const cls = n.getAttribute("class") || "";
        if (n.tagName === "SUP" || /decimal|fraction|cents/i.test(cls)) out.push({ text: n.textContent, fraction: true });
        else priceParts(n, out);
      }
    }
    return out;
  }
  function parseEl(el, def) {
    const text = String(joinPriceParts(priceParts(el, []), def) || el.getAttribute("content") || "").slice(0, 200);
    return text.trim() ? parsePrice(text, def) : null;
  }
  // First parseable price among `selectors`, searched inside `scope` (default: whole page).
  function priceFromSelectors(def, selectors, scope) {
    for (const sel of selectors || []) {
      try {
        const el = (scope || document).querySelector(sel);
        if (!el) continue;
        const p = parseEl(el, def);
        if (p) return p;
      } catch (e) { /* ignore */ }
    }
    return null;
  }
  // Schema.org data: the most reliable source for the page's MAIN product (never used for cards).
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
  const clean = (t) => String(t || "").replace(/\s+/g, " ").trim().slice(0, 200);

  function pageProduct(def) {
    const sel = (config && config.selectors) || {};
    let title = firstText(sel.title);
    if (!title) {
      const og = document.querySelector("meta[property='og:title']");
      title = (og && og.content) || document.title || "";
    }
    const price = priceFromStructured(def) || priceFromSelectors(def, sel.price);
    return { title: clean(title), price };
  }

  const CARD_TITLE_DEFAULT = ["h2", "h3", "[class*='title']"];
  function scopedTitle(scope) {
    const sel = (config && config.selectors) || {};
    for (const s of (sel.cardTitle || []).concat(CARD_TITLE_DEFAULT)) {
      try {
        const el = scope.querySelector(s);
        const t = el && clean(el.textContent);
        if (t) return t;
      } catch (e) { /* ignore */ }
    }
    const a = scope.querySelector("a[title]");
    if (a && clean(a.getAttribute("title"))) return clean(a.getAttribute("title"));
    const img = scope.querySelector("img[alt]");
    return img ? clean(img.getAttribute("alt")) : "";
  }
  // Title and price from inside one product container. Unknown price stays null.
  function scopedProduct(scope, def) {
    const sel = (config && config.selectors) || {};
    const price = priceFromSelectors(def, (sel.cardPrice || []).concat(sel.price || []), scope);
    return { title: scopedTitle(scope), price };
  }
  // Distinct parseable prices inside `scope` (by the site's price selectors).
  function pricesIn(scope, def) {
    const sels = ((config && config.selectors) || {}).price || [];
    const els = new Set();
    for (const s of sels) {
      try { scope.querySelectorAll(s).forEach((e) => els.add(e)); } catch (e) { /* ignore */ }
    }
    const seen = new Set();
    for (const e of els) {
      let nested = false;
      for (let p = e.parentElement; p && !nested; p = p.parentElement) nested = els.has(p);
      if (nested) continue;
      const p = parseEl(e, def);
      if (p) seen.add(p.amount + " " + p.currency);
    }
    return seen.size;
  }
  function hasPageTitle() {
    for (const s of ((config && config.selectors) || {}).title || []) {
      try { if (document.querySelector(s)) return true; } catch (e) { /* ignore */ }
    }
    return false;
  }

  // Product for the clicked button: from its card on listing pages / carousels / side sheets,
  // from page-level data on a product page. An unknown price is better than a wrong one.
  function getProduct(el) {
    const sel = (config && config.selectors) || {};
    const def = config && config.currency;
    if (bySelector(el, sel.main)) return pageProduct(def);         // main buy box
    const card = bySelector(el, sel.card);
    if (card) return scopedProduct(card, def);
    // Unknown context: smallest nearby ancestor holding exactly one distinct price.
    let anc = el.parentElement;
    for (let i = 0; anc && i < 6; i++, anc = anc.parentElement) {
      if (pricesIn(anc, def) !== 1) continue;
      let hasTitle = false;
      for (const s of sel.title || []) {
        try { if (anc.querySelector(s)) { hasTitle = true; break; } } catch (e) { /* ignore */ }
      }
      if (hasTitle) return pageProduct(def);                       // it is the page's own product
      return scopedProduct(anc, def);
    }
    if (hasPageTitle()) return pageProduct(def);
    return { title: "", price: null };
  }

  // ---- click handling ----
  // Only checkout-type clicks (proceed to checkout / place order) are waved through after a
  // "continue"; every buy / add-to-cart click is paused again, same product or not.
  function isBypassed(kind, now) {
    const b = bypass[host];
    return kind === "checkout" && !!b && b.checkoutUntil > now;
  }

  function onClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (overlayOpen && overlayHost && !overlayHost.isConnected) closeOverlay(); // host removed behind our back: self-heal
    let hit, product;
    try {
      hit = findButton(target);
      if (!hit) return;
      const el = hit.el;
      if (allowed.has(el)) return;                              // our own re-click
      if (!e.isTrusted) return;                                 // only real user clicks
      if (!ready || !config) return;                            // state not loaded yet: fail open
      if (overlayOpen) { block(e); return; }
      const now = Date.now();
      if (settings.sites[config.siteId] === false) return;      // site disabled
      if (pausedUntil > now) return;                            // extension paused
      if (isBypassed(hit.kind, now)) return;                    // user just chose "continue"
      product = getProduct(el);
      const p = product.price;
      if (p && p.currency === settings.mainCurrency && p.amount < settings.minPrice) return;
    } catch (err) { return; }                                   // any DOM-walk failure: fail open
    block(e);
    showOverlay(hit.el, product);
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
    *, *::before, *::after { box-sizing: border-box; }
    .backdrop { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px;
      background: rgba(52,40,22,.55); color: #23282a; text-align: left; letter-spacing: normal; text-transform: none;
      font: 15px/1.45 ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
      -webkit-font-smoothing: antialiased; animation: wt-fade .18s ease-out; }
    @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .backdrop { background: rgba(52,40,22,.4); -webkit-backdrop-filter: blur(6px) saturate(.9); backdrop-filter: blur(6px) saturate(.9); }
    }
    .card { width: min(420px, 100%); max-height: 100%; overflow: auto; background: #fffdf9; color: #23282a;
      border: 1px solid #e6dfd2; border-radius: 20px; padding: 24px;
      box-shadow: 0 2px 6px rgba(60,45,20,.1), 0 24px 70px rgba(40,28,10,.35); animation: wt-rise .18s ease-out; }
    .head { display: flex; align-items: center; gap: 14px; margin: 0 0 18px; }
    .mark { flex: none; width: 44px; height: 44px; filter: drop-shadow(0 3px 6px rgba(11,94,87,.3)); }
    h2 { margin: 0; font-size: 20px; line-height: 1.2; font-weight: 700; letter-spacing: -.01em; color: inherit; }
    .sub { margin: 3px 0 0; font-size: 14px; color: #5f6663; }
    .product { background: #f7f3ec; border: 1px solid #e6dfd2; border-radius: 14px; padding: 12px 14px; margin: 0 0 16px; }
    .title { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.3; word-break: break-word;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .price { margin: 6px 0 0; font-size: 28px; line-height: 1.15; font-weight: 800; letter-spacing: -.02em; color: #0f766e;
      font-variant-numeric: tabular-nums; }
    .price.unknown { display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: 0; color: #5f6663;
      background: #ece6da; border-radius: 99px; padding: 2px 10px; margin-top: 8px; }
    .err { margin: 12px 0 0; padding: 8px 12px; font-size: 13px; line-height: 1.35; color: #a12b1c; background: #fdeae6;
      border: 1px solid #f3c3ba; border-radius: 10px; }
    .err[hidden] { display: none; }
    button { display: block; width: 100%; margin: 8px 0 0; padding: 12px 14px; font: inherit; font-size: 15px; font-weight: 600;
      line-height: 1.2; border-radius: 12px; cursor: pointer; border: 1px solid #e6dfd2; background: #fffdf9; color: #23282a;
      transition: background .15s, border-color .15s; }
    button:hover { background: #f0ebe1; }
    button:focus-visible { outline: 3px solid #0f766e; outline-offset: 2px; }
    button:disabled { opacity: .6; cursor: default; }
    button.primary { background: #0f766e; border-color: #0f766e; color: #fff; padding: 14px; }
    button.primary:hover { background: #0b5e57; border-color: #0b5e57; }
    button.ghost { background: transparent; border-color: transparent; color: #5f6663; font-weight: 500; }
    button.ghost:hover { background: #f0ebe1; color: #23282a; }
    @keyframes wt-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes wt-rise { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
    @media (max-width: 360px) { .card { padding: 18px; } .price { font-size: 24px; } }
    @media (prefers-reduced-motion: reduce) { .backdrop, .card { animation: none; } button { transition: none; } }
    @media (prefers-color-scheme: dark) {
      .backdrop { background: rgba(5,9,8,.7); color: #edf1ee; }
      @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .backdrop { background: rgba(5,9,8,.5); }
      }
      .card { background: #1c2423; color: #edf1ee; border-color: #2e3b39; box-shadow: 0 2px 6px rgba(0,0,0,.3), 0 24px 70px rgba(0,0,0,.6); }
      .sub, button.ghost { color: #a3b0ac; }
      .product { background: #141a19; border-color: #2e3b39; }
      .price { color: #5fd1b8; }
      .price.unknown { color: #a3b0ac; background: #243030; }
      .err { color: #ffb4a8; background: #3a1f1b; border-color: #5a2d27; }
      button { background: #243030; border-color: #2e3b39; color: #edf1ee; }
      button:hover { background: #2e3d3b; }
      button:focus-visible { outline-color: #5fd1b8; }
      button.primary { background: #5fd1b8; border-color: #5fd1b8; color: #08231e; }
      button.primary:hover { background: #86e0cc; border-color: #86e0cc; }
      button.ghost { background: transparent; border-color: transparent; }
      button.ghost:hover { background: #243030; color: #edf1ee; }
    }`;

  const MARK_SVG = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="wt-mk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b9588"/><stop offset="1" stop-color="#0b5e57"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#wt-mk)"/><path d="M9 6.5h14a1 1 0 0 1 0 2h-1c0 4.2-2.6 6.2-4.6 7.5 2 1.3 4.6 3.3 4.6 7.5h1a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h1c0-4.2 2.6-6.2 4.6-7.5C12.6 14.7 10 12.7 10 8.5H9a1 1 0 0 1 0-2z" fill="#fff8ec"/><path d="M12 23.5c.5-1.8 2-2.8 4-4 2 1.2 3.5 2.2 4 4z" fill="#f4b740"/><path d="M13.2 9c.4 1.5 1.3 2.3 2.8 3.2 1.5-.9 2.4-1.7 2.8-3.2z" fill="#f4b740"/></svg>';

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
    host_.style.cssText = "all: initial !important; display: block !important; position: fixed !important; inset: 0 !important; " +
      "z-index: 2147483647 !important; pointer-events: auto !important; visibility: visible !important; opacity: 1 !important;";
    root.appendChild(h("style", {}, CSS));

    const title = product.title.length > 140 ? product.title.slice(0, 137) + "..." : product.title;
    const price = product.price;
    const card = h("div", { className: "card", role: "dialog" });
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "wt-h");
    const heading = h("h2", { id: "wt-h" }, "Wait a moment");
    const sub = h("p", { className: "sub" }, "Do you really need this right now?");
    const titleEl = h("p", { className: "title" }, title || "This item");
    const priceEl = h("p", { className: "price" + (price ? "" : " unknown") }, price ? formatPrice(price) : "Price unknown");
    const bRemind = h("button", { className: "primary", type: "button" }, remindLabel(settings.delayHours));
    const bGo = h("button", { type: "button" }, "I need this, continue");
    const bNever = h("button", { className: "ghost", type: "button" }, "Never mind, I'll skip it");
    const errEl = h("p", { className: "err", role: "alert" });
    errEl.hidden = true;
    const head = h("div", { className: "head" });
    head.insertAdjacentHTML("beforeend", MARK_SVG);
    const headText = h("div"); headText.append(heading, sub);
    head.appendChild(headText);
    const product_ = h("div", { className: "product" });
    product_.append(titleEl, priceEl);
    card.append(head, product_, bRemind, bGo, bNever, errEl);
    const backdrop = h("div", { className: "backdrop" });
    backdrop.appendChild(card);
    root.appendChild(backdrop);

    let observer = null;
    function close() {
      overlayOpen = false;
      if (observer) { observer.disconnect(); observer = null; }
      document.removeEventListener("keydown", onKey, true);
      host_.remove();
      if (overlayHost === host_) overlayHost = null;
    }
    overlayHost = host_;
    closeOverlay = close;
    const buttons = [bRemind, bGo, bNever];
    function onKey(ev) {
      if (!ev.isTrusted) return;
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
    const ptitle = product.title.slice(0, 200);
    bRemind.addEventListener("click", (ev) => { if (ev.isTrusted) save({ type: "remind", item: {
      title: ptitle, url: location.href, ...money() } }); });
    bNever.addEventListener("click", (ev) => { if (ev.isTrusted) save({ type: "never", title: ptitle, url: location.href, ...money() }); });
    bGo.addEventListener("click", async (ev) => {
      if (!ev.isTrusted) return;
      bypass[host] = { checkoutUntil: Date.now() + BYPASS_MS };
      close();
      await request({ type: "continue" });
      allowed.add(triggerEl);
      triggerEl.click();
      setTimeout(() => allowed.delete(triggerEl), 1000);
    });

    document.documentElement.appendChild(host_);
    // Keep the overlay alive and on top: closed if the page removes it, re-appended if something lands after it.
    observer = new MutationObserver(() => {
      if (!host_.isConnected) { close(); return; }
      if (document.documentElement.lastElementChild !== host_) document.documentElement.appendChild(host_);
    });
    observer.observe(document.documentElement, { childList: true });
    bRemind.focus();
  }

  document.addEventListener("click", onClick, true);
  init();
})();
