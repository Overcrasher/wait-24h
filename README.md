# Wait 24h

A Manifest V3 Chrome extension that adds a pause before impulse purchases. When you click
"Buy now" / "Add to cart" / "Place order" on a supported shop, an overlay asks whether you
really need it. You can be reminded tomorrow, continue, or skip it. Money counts as saved
**only** when you explicitly confirm skipping. Plain JavaScript, no build step, no libraries.

Supported: Amazon (many country domains), eMAG, AliExpress, Temu, Shein, eBay (many domains).

## Load it unpacked

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and pick this `wait-24h` folder.
3. Pin the extension; visit a supported shop and click a buy button.

Regenerate icons with `python3 tools/make_icons.py`. Run unit tests from this folder with
`/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/run.js`.

## Publishing the thank-you and privacy pages

The pages live in `docs/` and are served by GitHub Pages. In the repo `Overcrasher/wait-24h` go to
**Settings -> Pages**, choose **Deploy from a branch -> `main` -> `/docs`**. That gives:

- `https://overcrasher.github.io/wait-24h/thanks.html`
- `https://overcrasher.github.io/wait-24h/privacy.html`

Stripe redirect for every Payment Link:
`https://overcrasher.github.io/wait-24h/thanks.html?session_id={CHECKOUT_SESSION_ID}`

If the extension is ever moved to another repo or username, change **both** `THANKS_URL` in
`config.js` and the thanks page match in `manifest.json` (`content_scripts`; it is not a host permission).
Then fill the Stripe links in `config.js`.

## Stripe Payment Links and supporter detection

Per currency, create **4** Payment Links in Stripe:

| Key      | Type                                | Used for                      |
|----------|-------------------------------------|-------------------------------|
| `small`  | fixed price, 3                      | the 3 button                  |
| `medium` | fixed price, 5 (emphasized)         | the 5 button                  |
| `large`  | fixed price, 10                     | the 10 button                 |
| `custom` | "Customer chooses what to pay"      | "1% of what you saved" button |

Do this in EUR for `DONATE_LINKS`, and optionally again in USD for `DONATE_LINKS_USD`.
For every link, under **After payment** choose *Don't show confirmation page* and set the redirect to:

```
https://overcrasher.github.io/wait-24h/thanks.html?session_id={CHECKOUT_SESSION_ID}
```

`thanks.js` sets `supporter: true` only when `session_id` starts with `cs_`.

**1% button.** It shows 1% of the main-currency savings total, rounded up to a whole unit,
minimum 3 (e.g. 120 saved -> 3, 450 -> 5, 1001 -> 11). Clicking opens the `custom` link and the
popup shows "Enter X on the next page" (only after the link was actually opened). If the main currency differs from the link currency
(EUR links by default; USD links when used), no figure can be computed (no conversion is done), so the button
reads **"Pick your own amount"**.

**EUR vs USD.** USD links are used only if `DONATE_LINKS_USD` has `small`, `medium` AND `large` all
non-empty **and** `navigator.language` is a USD locale: any locale with region US or PR (e.g. `en-US`,
`es-US`, `en-PR`). Otherwise EUR. Labels become $3 / $5 / $10. A button whose link is empty is hidden
(including the 1% button when `custom` is empty). If the selected set has no links at all, the popup
shows no banner and does not consume the milestone or update `lastAskAt` (so unconfigured dev builds
do not burn asks), and Options shows "Donation links not configured yet".

Donation asks happen only in the popup banner, at milestones 50 / 100 / 250 / 500 / 1000 of the main
currency, at most once per milestone, at least 30 days apart, never for supporters or after "Don't ask again".

## Add a new shop to `sites.json`

Add an entry to the `sites` array. Optionally list `currencies` per domain; `currency` is the fallback
used when a price has an ambiguous or missing symbol.

```json
{
  "id": "myshop",
  "name": "My Shop",
  "domains": ["myshop.ro", "myshop.de"],
  "currency": "RON",
  "currencies": { "myshop.ro": "RON", "myshop.de": "EUR" },
  "selectors": {
    "buy":      ["#buy-btn", "button.add-to-cart"],
    "checkout": ["#place-order"],
    "title":    ["h1.product-title"],
    "price":    [".price-now"],
    "main":     ["#buybox"],
    "card":     [".product-card"]
  }
}
```

Then add `"*://*.myshop.ro/*"` (one per domain) to **both** `content_scripts[0].matches` and
`host_permissions` in `manifest.json`, and reload the extension. Selector arrays are tried in order. If
selectors miss, the text heuristic (EN + RO button texts) still catches common buttons.

- `buy`: buy now / add to cart buttons. Restrict them to the product-detail container where possible,
  so product-list and carousel buttons do not match.
- `checkout`: place order / proceed to checkout buttons. The heuristic has separate buy and checkout
  phrase lists (EN + RO).
- "I need this, continue" lets exactly that one click through and bypasses, for 15 minutes,
  checkout-type clicks (proceed to checkout / place order) on the same hostname, so add to cart ->
  checkout -> place order is not nagged repeatedly. Every buy / add-to-cart click is paused again,
  whether it is the same product or another one (listing pages and carousels share one URL).
- `main` (optional): selectors for the main buy box of a product page. A button inside it always
  uses page-level title and price.
- `card` (optional): product containers on listing pages, carousels and side sheets. A button inside a
  card (and outside `main`) takes title and price from that card only, never from page-level data
  (no JSON-LD / `itemprop`). `cardTitle` / `cardPrice` (optional) are tried inside the card first, then
  `h2`, `h3`, `[class*='title']`, `a[title]`, `img[alt]` for the title and `price` for the price.
  No price in the card means "price unknown" (nothing is counted as saved), never a page-level price.
  Without `card`, the script looks at most 6 ancestors up for one holding exactly one distinct price.
- `price`: only used when the page has no structured price. The content script first reads schema.org
  data (`itemprop="price"` + `priceCurrency`, then JSON-LD `Product` offers). From a price element,
  `<sup>` / `decimal` / `fraction` / `cents` parts are joined as decimals ("89<sup>99</sup> Lei" = 89.99).
  Prices above 100000 are treated as unknown.
`*://*.example.com/*` matches the bare domain too.

## Chrome Web Store permission justification

- `storage`: keeps settings, reminders and savings on the device.
- `alarms`: fires the reminder when the delay elapses.
- `notifications`: shows the "Still want it?" reminder.
- Host permissions: only the listed shops (to run the content script). The thank-you page needs no host permission (it is a content script match).
- No `tabs` permission: opening links uses `chrome.tabs.create` which needs none.

## Storage schema (`chrome.storage.local`)

All keys are optional; defaults apply on a fresh install.

| Key | Shape |
|-----|-------|
| `settings` | `{ sites: { [siteId]: boolean }, minPrice: number, delayHours: 12\|24\|48, mainCurrency: "EUR" }` (a missing site id means enabled) |
| `pausedUntil` | epoch ms; 0 or past = not paused |
| `pending` | `[{ id, title, url, price: number\|null, currency: string\|null, timestamp, dueAt, notified }]` |
| `savings` | `{ [ISO currency]: number }` |
| `itemsSkipped` | number |
| `history` | `[{ title, price, currency, date }]`, last 200 |
| `bypass` | `{ [hostname]: { checkoutUntil: epoch ms } }` – after "I need this, continue": checkout-type clicks on the host are not paused until then (15 min). Buy / add-to-cart clicks are always paused. A legacy `urls` field is ignored |
| `donation` | `{ asked: number[], lastAskAt: epoch ms, dontAskAgain: boolean }` |
| `supporter` | boolean, set by `thanks.js` |

Alarms are named `reminder:<id>`; the notification id equals the item id.

## Minimum price threshold

The minimum price applies only to prices in the main currency. Items in other currencies, or with an
unknown price, are always paused.

## Notes

- sites.json is loaded by the service worker only and is not web accessible.
- Selectors for shops change often; expect to maintain `sites.json`.
- See `PRIVACY.md`: no data leaves the device.
