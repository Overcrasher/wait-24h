# Chrome Web Store listing: Wait 24h (v1.0.0)

Everything below is checked against manifest.json, sites.json, config.js, background.js, README.md, PRIVACY.md and docs/privacy.html. Character counts are stated next to each limited field. Copy only what is inside the code blocks.

---

## 1. Name (limit 75)

```
Wait 24h – Pause before impulse buys
```
Characters: 36

## 2. Short description / summary (limit 132)

```
Pause before you buy. Get a calm reminder tomorrow and see how much you kept by skipping impulse purchases.
```
Characters: 107

## 3. Detailed description (EN)

```
Wait 24h adds a small pause between "I want it" and "I bought it".

When you click Buy now or Add to cart on a supported shop, a calm overlay asks: do you really need this right now? You choose:
• Remind me tomorrow (or in 12 hours or 2 days, as you set it)
• I need this, continue
• Never mind, I'll skip it

HOW IT WORKS
• Money counts as saved only when you confirm that you skipped an item. Reminding yourself later saves nothing until you decide.
• Savings are tracked per currency and never mixed. Your main currency is the big number in the popup.
• When a reminder is due, you get a "Still want it?" notification. Then buy it or skip it from the popup.
• Options: turn shops on or off, pause only above a minimum price, pick a 12 h, 24 h or 2-day delay, or pause the extension for an hour.

WORKS ON
Amazon (18 country sites), eMAG, AliExpress, Temu, Shein and eBay (13 country sites). Wait 24h is an independent project and is not affiliated with, endorsed by or sponsored by any of these shops.

PRIVACY
• Everything stays on your device, in your browser's local extension storage.
• No ads, no tracking, no analytics, no accounts, and no network requests by the extension.
• Only three permissions: storage, alarms and notifications. No access to all sites.

OPTIONAL SUPPORT
Wait 24h is free and built by one developer. If it helps, you can support it with a one-time payment (€3, €5, €10 or 1% of what you saved) through Stripe. The ask appears in the popup only when your savings pass 50, 100, 250, 500 or 1000 in your main currency, at most once per milestone and 30 days apart, never right after install. Choose "Don't ask again" and it stops for good. The same links are always available in Options. Payments happen on Stripe's page; the extension never sees them.

Open source: https://github.com/Overcrasher/wait-24h
```
Characters: 1835 (target 1,200–1,800)

---

## 4. Romanian translation (ro)

### Name
```
Wait 24h – Pauză înainte de cumpărăturile impulsive
```
Characters: 51

### Short description
```
Fă o pauză înainte să cumperi. Primești o reamintire liniștită mâine și vezi cât ai păstrat renunțând la achizițiile impulsive.
```
Characters: 127

### Detailed description
```
Wait 24h adaugă o mică pauză între „îl vreau” și „l-am cumpărat”.

Când apeși pe Cumpără acum sau Adaugă în coș într-un magazin acceptat, un mesaj liniștit te întreabă: chiar ai nevoie de asta acum? Alegi tu:
• Amintește-mi mâine („Remind me tomorrow”) (sau peste 12 ore ori 2 zile, cum ai setat)
• Am nevoie, continuă („I need this, continue”)
• Las-o baltă, renunț („Never mind, I'll skip it”)

CUM FUNCȚIONEAZĂ
• Banii contează ca economisiți doar când confirmi că ai renunțat la un produs. O simplă reamintire nu economisește nimic până nu decizi.
• Economiile se țin pe monede și nu se amestecă. Moneda principală este suma mare din fereastra extensiei.
• Când vine momentul, primești o notificare „Mai vrei produsul?”. Apoi îl cumperi sau renunți din fereastra extensiei.
• Opțiuni: activezi sau dezactivezi magazinele, pui pauză doar peste un preț minim, alegi o întârziere de 12 ore, 24 de ore sau 2 zile ori oprești extensia o oră.

FUNCȚIONEAZĂ PE
Amazon (18 site-uri naționale), eMAG, AliExpress, Temu, Shein și eBay (13 site-uri naționale). Wait 24h este un proiect independent și nu este afiliat, aprobat sau sponsorizat de aceste magazine.

CONFIDENȚIALITATE
• Totul rămâne pe dispozitivul tău, în spațiul local de stocare al extensiei.
• Fără reclame, fără urmărire, fără analiză, fără conturi și fără cereri de rețea din partea extensiei.
• Doar trei permisiuni: storage, alarms și notifications. Fără acces la toate site-urile.

SUSȚINERE OPȚIONALĂ
Wait 24h este gratuită și făcută de un singur dezvoltator. Dacă ți-a fost de folos, o poți susține printr-o plată unică (3 €, 5 €, 10 € sau 1% din cât ai economisit), prin Stripe. Propunerea apare în fereastra extensiei doar când economiile trec de 50, 100, 250, 500 sau 1000 în moneda principală, cel mult o dată pe prag, la minimum 30 de zile distanță, niciodată imediat după instalare. Cu „Nu mai întreba” se oprește definitiv. Aceleași linkuri sunt mereu în Opțiuni. Plata se face pe pagina Stripe; extensia nu o vede.

Interfața extensiei este în limba engleză.

Cod sursă deschis: https://github.com/Overcrasher/wait-24h
```
Characters: 2092

---

## 5. Category and language

- Category: Shopping. Justification: the extension acts only on online-shop pages at the moment of purchase, so people looking for shopping tools will find it there (Productivity would be the runner-up).
- Language: English (default); Romanian (ro) as an added localized listing.

## 6. Single purpose statement (Privacy practices tab)

```
Wait 24h has one purpose: to add a short pause before impulse purchases on supported online shops. When the user clicks a buy or add-to-cart button, it shows an overlay so they can choose to be reminded later, continue, or skip, and it keeps a local tally of the money the user confirmed they did not spend.
```

## 7. Permission justifications

### storage
```
Stores the user's settings (per-shop toggles, minimum price, reminder delay, main currency), the list of pending reminders, savings totals, a short history of skipped items and the state of the optional support prompt. All of it is kept in chrome.storage.local on the device and is never transmitted.
```

### alarms
```
Schedules the reminder for each item the user chose to be reminded about (12 hours, 24 hours or 2 days later, per the user's setting), so the "Still want it?" reminder fires at the right time even when the service worker is not running.
```

### notifications
```
Shows the "Still want it?" notification when a reminder the user requested comes due. It is shown only for items the user explicitly paused, and nothing is shown at any other time.
```

### Host permission / content scripts
The extension declares NO host_permissions. It uses content scripts only.
```
Wait 24h requests no host permissions. It declares two content-script match groups, both https only. (1) The shop pages where the pause overlay must appear: Amazon (amazon.com, .co.uk, .de, .fr, .it, .es, .nl, .pl, .se, .ca, .com.au, .co.jp, .in, .com.mx, .com.br, .com.tr, .com.be, .ie), eMAG (emag.ro), AliExpress (aliexpress.com), Temu (temu.com), Shein (shein.com) and eBay (ebay.com, .co.uk, .de, .fr, .it, .es, .ca, .com.au, .pl, .at, .ch, .ie, .nl). The script has to run there to detect a click on a buy or add-to-cart button and read the product title and price shown on the page, so it can display the overlay and save a reminder if the user asks. It does nothing on any other site. (2) A single static thank-you page, https://overcrasher.github.io/wait-24h/thanks.html?session_id=*, which a supporter reaches after an optional voluntary payment; a tiny script there reports the Stripe session id to the extension so a local "supporter" badge can be shown. The service worker only accepts it from that exact page and validates the id format. No data is read from or sent to these pages beyond this, and content scripts cannot access extension storage.
```

### Are you using remote code?
Answer: **No**
```
No. All JavaScript is bundled in the extension package. It does not load or evaluate remote scripts, remote modules or WebAssembly, uses no eval, and its extension-page CSP is script-src 'self'. It makes no network requests of its own.
```

## 8. Data usage disclosures (Privacy practices tab)

Recommended answers. Reasoning: CWS defines "collect" as data transmitted off the user's device or handled by the developer. Wait 24h never transmits anything and has no server, so strictly nothing is collected. The only data it touches (product title, price and page URL of items the user chose to pause) lives in chrome.storage.local and is used on the device only.

Recommended checkboxes:
- Personally identifiable information: leave unchecked
- Health information: leave unchecked
- Financial and payment information: leave unchecked (the extension never sees payment details; Stripe handles them on its own page)
- Authentication information: leave unchecked
- Personal communications: leave unchecked
- Location: leave unchecked
- Web history: leave unchecked (page URLs are saved only for items the user chose to pause and only on the device; no browsing history is read or sent)
- User activity: leave unchecked
- Website content: TICK (the extension reads product titles and prices from shop pages; this is the honest, low-risk disclosure)

If asked, explain for "Website content": product titles and prices read from the shop page are processed on-device only, never transmitted, and used only to show the overlay and the reminder. The privacy policy already describes this. Keep "Web history" unticked (page URLs are saved only for items the user chose to pause, only on the device); if a reviewer asks you to tick it, the same explanation applies.

Certifications (tick all three):
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## 9. URLs

- Privacy policy URL: https://overcrasher.github.io/wait-24h/privacy.html
- Homepage URL: https://github.com/Overcrasher/wait-24h
- Support URL: https://github.com/Overcrasher/wait-24h/issues

## 10. Screenshots, promo tiles and icon (upload order)

The Chrome Web Store has no per-screenshot caption field. This section documents the upload order and what is on each image in store/images/.

1. screenshot-1-overlay.png: the "Wait a moment" overlay on a product page (no headline text on the image)
2. screenshot-2-popup.png: "See what you didn't spend" / "Savings are counted only when you decide to skip — never guessed."
3. screenshot-3-reminders.png: "Sleep on it. Decide tomorrow." / "Get a reminder after 12, 24 or 48 hours, then keep it or skip it."
4. screenshot-4-options.png: "Your shops, your rules" / "Choose shops, a minimum price and the reminder delay."
5. screenshot-5-privacy.png: "Private by design": Everything stays on your device · No ads, no tracking, no accounts · Open source on GitHub

Promo tiles: promo-small-440x280.png and promo-marquee-1400x560.png use the tagline "A deep breath before you buy" (28 chars).

Store icon: store-icon-128.png (96px artwork in a 128px canvas).

## 11. Notes for the reviewer

```
Wait 24h adds a pause before purchases on a fixed list of shops. No account or login is needed and nothing is sent anywhere.

Quick test (about 2 minutes):
1. Load the extension and pin it.
2. Open any Amazon product page (for example on amazon.com) and click "Add to cart" or "Buy Now". The Wait 24h overlay appears with three choices: "Remind me tomorrow", "I need this, continue" and "Never mind, I'll skip it". Content scripts run only on the shop domains listed in the manifest.
3. Click "Remind me tomorrow". The item appears in the toolbar popup under "Waiting for your decision", where you can open it again or press "Skip it". Money counts as saved only when the user confirms a skip ("Never mind, I'll skip it" in the overlay, or "Skip it" in the popup); "Remind me" saves nothing. The "Still want it?" notification fires when the delay elapses (minimum option is 12 hours), so it cannot be seen instantly.
4. Open Options (right-click the icon, Options, or the link in the popup) to see per-shop toggles, minimum price and reminder delay.

Optional support: the extension is free. In the popup, a small support banner appears only when the main-currency savings reach a milestone (50, 100, 250, 500 or 1000), at most once per milestone, at least 30 days apart, never on install, and never after "Don't ask again". To see the support links without reaching €50: open Options and scroll to "Support this project". The same Stripe Payment Links (€3, €5, €10 and "1% of what you saved") are always visible there. They open buy pages on donate.stripe.com in a normal tab; the extension never handles payment data. A supporter badge appears only after the user lands on https://overcrasher.github.io/wait-24h/thanks.html with a valid Stripe session id.

Permissions: storage, alarms, notifications. No host_permissions, no tabs permission, no remote code, no network requests by the extension. Source: https://github.com/Overcrasher/wait-24h
```

## 12. Pre-submission checklist

- [ ] Run `python3 tools/check_release.py --release` and confirm it exits 0 (Stripe links valid and non-test, THANKS_URL matches the manifest).
- [ ] Run the unit tests (see README) and load the unpacked folder one last time; test an Amazon product page and the eMAG page.
- [ ] Run `python3 tools/package.py`, which runs the release check and writes dist/wait-24h-<version>.zip; upload that zip.
- [ ] Confirm the manifest version is correct (1.0.0 for the first upload; bump for every later upload).
- [ ] Register a Chrome Web Store developer account (one-time US$5 fee) and verify the contact email.
- [ ] Confirm GitHub Pages is live: https://overcrasher.github.io/wait-24h/privacy.html and thanks.html both open.
- [ ] Upload 5 screenshots (1280x800 or 640x400) matching the captions above, plus the small promo tile (440x280); marquee tile (1400x560) is optional.
- [ ] Paste name, short description, detailed description (EN and RO), category, single purpose, permission justifications, data disclosures and reviewer notes.
- [ ] Tick the three certification statements and set remote code to No.
- [ ] Set visibility (Public) and distribution regions, then submit for review.
