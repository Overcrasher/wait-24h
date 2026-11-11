# Chrome Web Store listing: Wait 24h (v1.0.2)

Everything below is checked against manifest.json, sites.json, config.js, background.js, README.md, PRIVACY.md and docs/privacy.html. Character counts are stated next to each limited field. Copy only what is inside the code blocks.

---

## 1. Name and short description (shipped inside the package)

From 1.0.2 the store takes the item name (limit 75) and short summary (limit 132) from the package's `_locales/<locale>/messages.json` (`extName`, `extDescription`, referenced from manifest.json as `__MSG_extName__` and `__MSG_extDescription__`). Do NOT paste them in the dashboard. They appear in the store after the 1.0.2 review. Exact strings and character counts:

| Locale | Name | Chars | Summary | Chars |
|---|---|---|---|---|
| en | Wait 24h – Stop Impulse Buying & Save Money | 43 | Stop impulse buying online. A 24-hour pause before you buy, a reminder tomorrow, and a running total of the money you saved. | 124 |
| ro | Wait 24h – Oprește cumpărăturile din impuls | 43 | Oprește cumpărăturile din impuls. O pauză de 24 de ore înainte să cumperi, un memento a doua zi și totalul banilor economisiți. | 127 |
| de | Wait 24h – Impulskäufe stoppen & Geld sparen | 44 | Stoppe Impulskäufe im Netz. 24 Stunden Pause vor dem Kauf, eine Erinnerung am nächsten Tag und die Summe deines gesparten Geldes. | 129 |
| fr | Wait 24h – Stop aux achats impulsifs | 36 | Stop aux achats impulsifs en ligne. Une pause de 24 heures avant d'acheter, un rappel le lendemain et le total de l'argent épargné. | 131 |
| es | Wait 24h – Frena las compras impulsivas | 39 | Frena las compras impulsivas online. Una pausa de 24 horas antes de comprar, un recordatorio mañana y el total del dinero ahorrado. | 131 |

## 2. Rules for the public descriptions

Do not name shop brands in any language's public description or summary. The Chrome Web Store flagged that as keyword spam (violation 'Yellow Argon', Nov 2026). Shop names are fine in the reviewer notes and permission justifications only. Wait 24h's public text contains no shop names at all.

## 3. Detailed description (EN)

Opening paragraph replaced for 1.0.2. A "Share" bullet was added to HOW IT WORKS (the Share button for savings; the shared text ends with the store link). Over the 1,200–1,800 target, but within the store's limit.

```
Wait 24h helps you stop impulse buying with the 24-hour rule: a short pause before you buy, a reminder tomorrow, and a running total of the money you saved.

When you click Buy now or Add to cart on a supported shop, a calm overlay asks: do you really need this right now? You choose:
• Remind me tomorrow (or in 12 hours or 2 days, as you set it)
• I need this, continue
• Never mind, I'll skip it

HOW IT WORKS
• Money counts as saved only when you confirm that you skipped an item. Reminding yourself later saves nothing until you decide.
• Savings are tracked per currency and never mixed. Your main currency is the big number in the popup.
• When a reminder is due, you get a "Still want it?" notification. Then buy it or skip it from the popup.
• Options: turn shops on or off, pause only above a minimum price, pick a 12 h, 24 h or 2-day delay, or pause the extension for an hour.
• Share: press "Share" in the popup to copy a short text about your savings, with a link to the extension.

WHERE IT WORKS
A selection of popular online shops. See the full list, and turn each shop on or off, in Options. Wait 24h is an independent project and is not affiliated with any shop.

PRIVACY
• Everything stays on your device, in your browser's local extension storage.
• No ads, no tracking, no analytics, no accounts, and no network requests by the extension.
• Only three permissions: storage, alarms and notifications. No access to all sites.

OPTIONAL SUPPORT
Wait 24h is free and built by one developer. If it helps, you can support it with a one-time payment (€3, €5, €10 or 1% of what you saved) through Stripe. The ask appears in the popup only when your savings pass 50, 100, 250, 500 or 1000 in your main currency, at most once per milestone and 30 days apart, never right after install. Choose "Don't ask again" and it stops for good. The same links are always available in Options. Payments happen on Stripe's page; the extension never sees them.

Open source: https://github.com/Overcrasher/wait-24h
```
Characters: 2011

---

## 4. Translations (paste per language in the dashboard)

### Detailed description (ro, Romanian)

```
Wait 24h te ajută să oprești cumpărăturile din impuls cu regula celor 24 de ore: o scurtă pauză înainte să cumperi, un memento mâine și totalul banilor economisiți.

Când apeși pe Cumpără acum sau Adaugă în coș într-un magazin acceptat, un mesaj liniștit te întreabă: chiar ai nevoie de asta acum? Alegi tu:
• Amintește-mi mâine („Remind me tomorrow”) (sau peste 12 ore ori 2 zile, cum ai setat)
• Am nevoie, continuă („I need this, continue”)
• Las-o baltă, renunț („Never mind, I'll skip it”)

CUM FUNCȚIONEAZĂ
• Banii contează ca economisiți doar când confirmi că ai renunțat la un produs. O simplă reamintire nu economisește nimic până nu decizi.
• Economiile se țin pe monede și nu se amestecă. Moneda principală este suma mare din fereastra extensiei.
• Când vine momentul, primești o notificare „Still want it?”. Apoi îl cumperi sau renunți din fereastra extensiei.
• Opțiuni: activezi sau dezactivezi magazinele, pui pauză doar peste un preț minim, alegi o întârziere de 12 ore, 24 de ore sau 2 zile ori oprești extensia o oră.
• Distribuire: apasă „Share” în fereastra extensiei ca să copiezi un text scurt despre economiile tale, cu un link către extensie.

UNDE FUNCȚIONEAZĂ
Pe o selecție de magazine online populare. Lista completă o găsești în Opțiuni, unde poți activa sau dezactiva fiecare magazin. Wait 24h este un proiect independent și nu este afiliat cu niciun magazin.

CONFIDENȚIALITATE
• Totul rămâne pe dispozitivul tău, în spațiul local de stocare al extensiei.
• Fără reclame, fără urmărire, fără analiză, fără conturi și fără cereri de rețea din partea extensiei.
• Doar trei permisiuni: storage, alarms și notifications. Fără acces la toate site-urile.

SUSȚINERE OPȚIONALĂ
Wait 24h este gratuită și făcută de un singur dezvoltator. Dacă ți-a fost de folos, o poți susține printr-o plată unică (3 €, 5 €, 10 € sau 1% din cât ai economisit), prin Stripe. Propunerea apare în fereastra extensiei doar când economiile trec de 50, 100, 250, 500 sau 1000 în moneda principală, cel mult o dată pe prag, la minimum 30 de zile distanță, niciodată imediat după instalare. Cu „Don't ask again” se oprește definitiv. Aceleași linkuri sunt mereu în Opțiuni. Plata se face pe pagina Stripe; extensia nu o vede.

Interfața extensiei este în limba engleză.

Cod sursă deschis: https://github.com/Overcrasher/wait-24h
```
Characters: 2328

### Detailed description (de, German)

```
Wait 24h hilft dir, Impulskäufe mit der 24-Stunden-Regel zu stoppen: eine kurze Pause vor dem Kauf, eine Erinnerung am nächsten Tag und eine laufende Summe des Geldes, das du gespart hast.

Wenn du in einem unterstützten Shop auf „Jetzt kaufen“ oder „In den Warenkorb“ klickst, fragt dich ein ruhiges Overlay: Brauchst du das wirklich jetzt? Du entscheidest:
• Erinnere mich morgen („Remind me tomorrow“) (oder in 12 Stunden bzw. 2 Tagen, wie eingestellt)
• Ich brauche das, weiter („I need this, continue“)
• Egal, ich verzichte („Never mind, I'll skip it“)

SO FUNKTIONIERT ES
• Geld zählt nur dann als gespart, wenn du bestätigst, dass du auf einen Artikel verzichtet hast. Eine bloße Erinnerung spart nichts, bis du dich entscheidest.
• Ersparnisse werden pro Währung erfasst und nie vermischt. Deine Hauptwährung ist die große Zahl im Popup.
• Wenn eine Erinnerung fällig ist, erhältst du die Benachrichtigung „Still want it?“. Danach kaufst du den Artikel oder verzichtest im Popup darauf.
• Optionen: Shops ein- oder ausschalten, nur oberhalb eines Mindestpreises pausieren, eine Verzögerung von 12 Stunden, 24 Stunden oder 2 Tagen wählen oder die Erweiterung für eine Stunde pausieren.
• Teilen: Mit „Share“ im Popup kopierst du einen kurzen Text über deine Ersparnisse, mit einem Link zur Erweiterung.

WO ES FUNKTIONIERT
Auf einer Auswahl beliebter Online-Shops. Die vollständige Liste siehst du in den Optionen, wo du jeden Shop ein- oder ausschalten kannst. Wait 24h ist ein unabhängiges Projekt und mit keinem Shop verbunden.

DATENSCHUTZ
• Alles bleibt auf deinem Gerät, im lokalen Erweiterungsspeicher deines Browsers.
• Keine Werbung, kein Tracking, keine Analysen, keine Konten und keine Netzwerkanfragen der Erweiterung.
• Nur drei Berechtigungen: storage, alarms und notifications. Kein Zugriff auf alle Websites.

FREIWILLIGE UNTERSTÜTZUNG
Wait 24h ist kostenlos und von einem einzelnen Entwickler gebaut. Wenn sie dir hilft, kannst du sie mit einer einmaligen Zahlung unterstützen (3 €, 5 €, 10 € oder 1 % deiner Ersparnisse) über Stripe. Die Bitte erscheint im Popup nur, wenn deine Ersparnisse in deiner Hauptwährung 50, 100, 250, 500 oder 1000 überschreiten, höchstens einmal pro Schwelle und mit mindestens 30 Tagen Abstand, nie direkt nach der Installation. Wähle „Don't ask again“, und sie hört für immer auf. Dieselben Links findest du immer in den Optionen. Die Zahlung läuft auf der Seite von Stripe; die Erweiterung sieht sie nie.

Die Oberfläche der Erweiterung ist auf Englisch.

Open Source: https://github.com/Overcrasher/wait-24h
```
Characters: 2565

### Detailed description (fr, French)

```
Wait 24h vous aide à arrêter les achats impulsifs grâce à la règle des 24 heures : une courte pause avant d'acheter, un rappel demain et le total cumulé de l'argent que vous avez économisé.

Quand vous cliquez sur « Acheter maintenant » ou « Ajouter au panier » dans une boutique prise en charge, un message calme vous demande : en avez-vous vraiment besoin tout de suite ? Vous choisissez :
• Me le rappeler demain (« Remind me tomorrow ») (ou dans 12 heures ou 2 jours, selon votre réglage)
• J'en ai besoin, continuer (« I need this, continue »)
• Tant pis, j'y renonce (« Never mind, I'll skip it »)

COMMENT ÇA MARCHE
• L'argent n'est compté comme économisé que lorsque vous confirmez avoir renoncé à un article. Se faire rappeler plus tard n'économise rien tant que vous n'avez pas décidé.
• Les économies sont suivies par devise et jamais mélangées. Votre devise principale est le grand chiffre dans la fenêtre de l'extension.
• Quand un rappel arrive à échéance, vous recevez une notification « Still want it? ». Vous achetez ensuite l'article ou y renoncez depuis la fenêtre de l'extension.
• Options : activer ou désactiver des boutiques, ne faire la pause qu'au-dessus d'un prix minimum, choisir un délai de 12 h, 24 h ou 2 jours, ou mettre l'extension en pause pendant une heure.
• Partage : « Share » dans la fenêtre de l'extension copie un court texte sur vos économies, avec un lien vers l'extension.

OÙ ÇA FONCTIONNE
Sur une sélection de boutiques en ligne populaires. Retrouvez la liste complète, et activez ou désactivez chaque boutique, dans les Options. Wait 24h est un projet indépendant, sans affiliation avec aucune boutique.

CONFIDENTIALITÉ
• Tout reste sur votre appareil, dans le stockage local de l'extension de votre navigateur.
• Aucune publicité, aucun suivi, aucune analyse, aucun compte et aucune requête réseau de l'extension.
• Seulement trois autorisations : storage, alarms et notifications. Aucun accès à tous les sites.

SOUTIEN FACULTATIF
Wait 24h est gratuite et conçue par un seul développeur. Si elle vous est utile, vous pouvez la soutenir par un paiement unique (3 €, 5 €, 10 € ou 1 % de ce que vous avez économisé) via Stripe. La demande n'apparaît dans la fenêtre de l'extension que lorsque vos économies dépassent 50, 100, 250, 500 ou 1000 dans votre devise principale, au plus une fois par palier et à 30 jours d'intervalle, jamais juste après l'installation. Choisissez « Don't ask again » et elle s'arrête définitivement. Les mêmes liens sont toujours dans les Options. Le paiement se fait sur la page de Stripe ; l'extension ne le voit jamais.

L'interface de l'extension est en anglais.

Code source ouvert : https://github.com/Overcrasher/wait-24h
```
Characters: 2702

### Detailed description (es, Spanish)

```
Wait 24h te ayuda a frenar las compras impulsivas con la regla de las 24 horas: una pausa breve antes de comprar, un recordatorio mañana y el total acumulado del dinero que has ahorrado.

Cuando haces clic en «Comprar ahora» o «Añadir al carrito» en una tienda compatible, un aviso tranquilo te pregunta: ¿de verdad lo necesitas ahora mismo? Tú eliges:
• Recuérdamelo mañana («Remind me tomorrow») (o en 12 horas o 2 días, según lo configures)
• Lo necesito, continuar («I need this, continue»)
• Da igual, lo dejo («Never mind, I'll skip it»)

CÓMO FUNCIONA
• El dinero cuenta como ahorrado solo cuando confirmas que has renunciado a un artículo. Un simple recordatorio no ahorra nada hasta que decides.
• Los ahorros se registran por moneda y nunca se mezclan. Tu moneda principal es la cifra grande de la ventana de la extensión.
• Cuando un recordatorio vence, recibes una notificación «Still want it?». Después compras el artículo o renuncias a él desde la ventana de la extensión.
• Opciones: activar o desactivar tiendas, pausar solo por encima de un precio mínimo, elegir una demora de 12 h, 24 h o 2 días, o pausar la extensión durante una hora.
• Compartir: «Share» en la ventana de la extensión copia un texto breve sobre tus ahorros, con un enlace a la extensión.

DÓNDE FUNCIONA
En una selección de tiendas online populares. Consulta la lista completa, y activa o desactiva cada tienda, en Opciones. Wait 24h es un proyecto independiente y no está afiliado a ninguna tienda.

PRIVACIDAD
• Todo se queda en tu dispositivo, en el almacenamiento local de extensiones de tu navegador.
• Sin anuncios, sin seguimiento, sin analítica, sin cuentas y sin solicitudes de red por parte de la extensión.
• Solo tres permisos: storage, alarms y notifications. Sin acceso a todos los sitios.

APOYO OPCIONAL
Wait 24h es gratuita y la ha creado un solo desarrollador. Si te resulta útil, puedes apoyarla con un pago único (3 €, 5 €, 10 € o el 1 % de lo que has ahorrado) a través de Stripe. La petición aparece en la ventana de la extensión solo cuando tus ahorros superan 50, 100, 250, 500 o 1000 en tu moneda principal, como máximo una vez por hito y con 30 días de separación, nunca justo después de instalar. Elige «Don't ask again» y se detiene para siempre. Los mismos enlaces están siempre en Opciones. El pago se hace en la página de Stripe; la extensión nunca lo ve.

La interfaz de la extensión está en inglés.

Código abierto: https://github.com/Overcrasher/wait-24h
```
Characters: 2476

---

## 5. Category and language

- Category: Shopping. Justification: the extension acts only on online-shop pages at the moment of purchase, so people looking for shopping tools will find it there (Productivity would be the runner-up).
- Languages: English (default); Romanian (ro), German (de), French (fr) and Spanish (es) as added localized listings (new in 1.0.2).

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
- Homepage URL: https://overcrasher.github.io/wait-24h/
- Support URL: https://github.com/Overcrasher/wait-24h/issues (if GitHub is slow, the homepage https://overcrasher.github.io/wait-24h/ can also be used as the support URL)

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
- [ ] Paste the detailed description in each language (EN, RO, DE, FR, ES; name and short summary come from the package), category, single purpose, permission justifications, data disclosures and reviewer notes.
- [ ] Tick the three certification statements and set remote code to No.
- [ ] Set visibility (Public) and distribution regions, then submit for review.

Published store URL: https://chromewebstore.google.com/detail/wait-24h/pkgdjohoemjkejcbfbkfobbbjcpdabme

## 13. 1.0.2 submission steps

- [ ] Upload `dist/wait-24h-1.0.2.zip` (Package tab, upload new package).
- [ ] In Store listing, choose each language from the language dropdown (English, Romanian, German, French, Spanish) and paste its detailed description from sections 3 and 4. Name and summary are not pasted: they come from `_locales` in the package.
- [ ] Add the YouTube promo video URL if available.
- [ ] In Account, set the publisher name to Quantumbyte Labs.
- [ ] Submit for review.
