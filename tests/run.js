// Run from the wait-24h folder:  jsc tests/run.js
load("lib/price.js");
load("lib/donation.js");
load("lib/validate.js");
load("lib/growth.js");

let pass = 0, fail = 0;
const failures = [];
function eq(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) pass++; else { fail++; failures.push(name + ": got " + g + " want " + w); }
}
const P = (t, d) => WaitPrice.parsePrice(t, d);
const D = WaitDonation;

// ---- price parsing
eq("eur prefix", P("€12,99"), { amount: 12.99, currency: "EUR" });
eq("eur suffix", P("12,99 €"), { amount: 12.99, currency: "EUR" });
eq("eur thousands", P("€1.299,99"), { amount: 1299.99, currency: "EUR" });
eq("ron Lei", P("1.299,99 Lei"), { amount: 1299.99, currency: "RON" });
eq("ron lei lower", P("1.299,99 lei"), { amount: 1299.99, currency: "RON" });
eq("ron prefix", P("RON 49,90"), { amount: 49.9, currency: "RON" });
eq("ron suffix", P("49,90 RON"), { amount: 49.9, currency: "RON" });
eq("usd thousands", P("$1,299.99"), { amount: 1299.99, currency: "USD" });
eq("gbp", P("£19.99"), { amount: 19.99, currency: "GBP" });
eq("US $", P("US $5.00"), { amount: 5, currency: "USD" });
eq("yen", P("¥1,980"), { amount: 1980, currency: "JPY" });
eq("inr", P("₹499"), { amount: 499, currency: "INR" });
eq("brl", P("R$ 59,90"), { amount: 59.9, currency: "BRL" });
eq("pln", P("129,00 zł"), { amount: 129, currency: "PLN" });
eq("sek", P("1 299,00 kr", "SEK"), { amount: 1299, currency: "SEK" });
eq("nok via default", P("499 kr", "NOK"), { amount: 499, currency: "NOK" });
eq("try", P("1.499,90 TL"), { amount: 1499.9, currency: "TRY" });
eq("chf", P("CHF 89.90"), { amount: 89.9, currency: "CHF" });
eq("nbsp", P("49,90 RON"), { amount: 49.9, currency: "RON" });
eq("bare $ default CAD", P("$25.00", "CAD"), { amount: 25, currency: "CAD" });
eq("bare number default RON", P("249,99", "RON"), { amount: 249.99, currency: "RON" });
eq("eur dot thousands only", P("1.299 €"), { amount: 1299, currency: "EUR" });
eq("null empty", P(""), null);
eq("null no digits", P("Free", "EUR"), null);
eq("null no currency no default", P("12,99"), null);
eq("null non-string", P(null), null);
eq("null zero", P("€0,00"), null);

// ---- pickAsk
const DAY = 86400000, T0 = 1700000000000;
const fresh = () => ({ supporter: false, dontAskAgain: false, asked: [], lastAskAt: 0 });
eq("fresh below 50", D.pickAsk(fresh(), 49.99, T0), null);
let st = fresh();
eq("crossing 50", D.pickAsk(st, 50, T0), 50);
st = D.applyAsk(st, 50, T0);
eq("same milestone again", D.pickAsk(st, 60, T0 + 100 * DAY), null);
eq("next within 30 days", D.pickAsk(st, 120, T0 + 10 * DAY), null);
eq("next after 30 days", D.pickAsk(st, 120, T0 + 31 * DAY), 100);
let j = fresh();
eq("jump to 300", D.pickAsk(j, 300, T0), 250);
j = D.applyAsk(j, 250, T0);
eq("lower marked asked", j.asked, [50, 100, 250]);
eq("after jump nothing", D.pickAsk(j, 300, T0 + 60 * DAY), null);
eq("supporter", D.pickAsk(Object.assign(fresh(), { supporter: true }), 600, T0), null);
eq("dontAskAgain", D.pickAsk(Object.assign(fresh(), { dontAskAgain: true }), 600, T0), null);
eq("1000 milestone", D.pickAsk(fresh(), 1000, T0), 1000);

// ---- 1% custom amount
eq("custom 0", D.customAmount(0), 3);
eq("custom 120", D.customAmount(120), 3);
eq("custom 450", D.customAmount(450), 5);
eq("custom 1000", D.customAmount(1000), 10);
eq("custom 1001", D.customAmount(1001), 11);
eq("custom 10000 -> 100", D.customAmount(10000), 100);
eq("custom 10001 capped at 100", D.customAmount(10001), 100);
eq("custom 25000 capped at 100", D.customAmount(25000), 100);
eq("label capped", D.customLabel("EUR", "EUR", 25000, "€").text, "1% of what you saved: €100");
eq("label eur", D.customLabel("EUR", "EUR", 450, "€").text, "1% of what you saved: €5");
eq("label other currency", D.customLabel("RON", "EUR", 450, "€"), { amount: null, text: "Pick your own amount" });

// ---- link selection
const E = { small: "e1", medium: "e2", large: "e3", custom: "e4" };
const U = { small: "u1", medium: "u2", large: "u3", custom: "" };
const UP = { small: "u1", medium: "", large: "", custom: "" };
const U0 = { small: "", medium: "", large: "", custom: "" };
eq("en-US + usd", D.selectLinks("en-US", E, U).currency, "USD");
eq("en-US partial usd -> EUR", D.selectLinks("en-US", E, UP).currency, "EUR");
eq("en-US no custom but s/m/l -> USD", D.selectLinks("en-US", E, U).links.small, "u1");
eq("en-US no usd", D.selectLinks("en-US", E, U0).currency, "EUR");
eq("ro-RO", D.selectLinks("ro-RO", E, U).currency, "EUR");
eq("en-GB", D.selectLinks("en-GB", E, U).currency, "EUR");
eq("es-US", D.selectLinks("es-US", E, U).currency, "USD");
eq("en-PR", D.selectLinks("en-PR", E, U).currency, "USD");
eq("en alone", D.selectLinks("en", E, U).currency, "EUR");

// ---- available links
eq("availableKeys all", D.availableKeys(E), ["small", "medium", "large", "custom"]);
eq("availableKeys no custom", D.availableKeys(U), ["small", "medium", "large"]);
eq("availableKeys none", D.availableKeys(U0), []);
eq("availableKeys null", D.availableKeys(null), []);
eq("hasAnyLink none", D.hasAnyLink(U0), false);
eq("hasAnyLink some", D.hasAnyLink(UP), true);

// ---- price: multi-number text, thousands, sanity
eq("2 for 10", P("2 for €10"), { amount: 10, currency: "EUR" });
eq("-20% 50", P("-20% €50"), { amount: 50, currency: "EUR" });
eq("reviews then price", P("12 100 reviews €5"), { amount: 5, currency: "EUR" });
eq("space thousands adjacent", P("12 100 Lei", "RON"), { amount: 12100, currency: "RON" });
eq("space thousands prefix", P("€ 1 299,50"), { amount: 1299.5, currency: "EUR" });
eq("space group not 3 digits", P("12 10 Lei", "RON"), { amount: 10, currency: "RON" });
eq("space group no currency", P("12 100 reviews", "EUR"), { amount: 12, currency: "EUR" });
eq("price before count", P("49,99 Lei (120 reviews)"), { amount: 49.99, currency: "RON" });
eq("bare .99", P("$.99"), { amount: 0.99, currency: "USD" });
eq("over 100000 -> null", P("€250.000,00"), null);
eq("exactly 100000", P("€100.000"), { amount: 100000, currency: "EUR" });
eq("8999 inflated text is still parsed as-is", P("8999 Lei"), { amount: 8999, currency: "RON" });

// ---- joinPriceParts (sup / fraction)
const J = WaitPrice.joinPriceParts;
const sup = (a, b, c, cur) => P(J([{ text: a }, { text: b, fraction: true }, { text: c }], cur), cur);
eq("emag sup", sup("89", "99", " Lei", "RON"), { amount: 89.99, currency: "RON" });
eq("emag sup thousands", sup("3.499", "99", " Lei", "RON"), { amount: 3499.99, currency: "RON" });
eq("usd sup", sup("$49", "99", "", "USD"), { amount: 49.99, currency: "USD" });
eq("usd sup thousands", sup("$1,299", "00", "", "USD"), { amount: 1299, currency: "USD" });
eq("eur sup thousands dot", sup("1.299", "50", " €", "EUR"), { amount: 1299.5, currency: "EUR" });
eq("sup with space before", sup("89 ", "99", " Lei", "RON"), { amount: 89.99, currency: "RON" });
eq("join text", J([{ text: "89" }, { text: "99", fraction: true }, { text: " Lei" }], "RON"), "89,99 Lei");
eq("non-digit fraction left alone", J([{ text: "89" }, { text: "bani", fraction: true }], "RON"), "89bani");

// ---- structured data
const F = WaitPrice.fromJsonLd;
eq("ld object offers", F({ "@type": "Product", offers: { "@type": "Offer", price: "19.90", priceCurrency: "EUR" } }), { amount: 19.9, currency: "EUR" });
eq("ld array offers", F({ "@type": "Product", offers: [{ price: 0 }, { price: 25, priceCurrency: "gbp" }] }), { amount: 25, currency: "GBP" });
eq("ld graph", F({ "@graph": [{ "@type": "WebSite" }, { "@type": ["Thing", "Product"], offers: { price: "1299.99", priceCurrency: "RON" } }] }), { amount: 1299.99, currency: "RON" });
eq("ld top-level array", F([{ "@type": "BreadcrumbList" }, { "@type": "Product", offers: { lowPrice: 5, priceCurrency: "USD" } }]), { amount: 5, currency: "USD" });
eq("ld default currency", F({ "@type": "Product", offers: { price: 7 } }, "RON"), { amount: 7, currency: "RON" });
eq("ld no currency no default", F({ "@type": "Product", offers: { price: 7 } }), null);
eq("ld zero", F({ "@type": "Product", offers: { price: "0" , priceCurrency: "EUR" } }), null);
eq("ld garbage", F({ "@type": "Product", offers: { price: "abc", priceCurrency: "EUR" } }), null);
eq("ld not product", F({ "@type": "Offer", price: 5, priceCurrency: "EUR" }), null);
eq("ld null", F(null), null);
eq("ld huge", F({ "@type": "Product", offers: { price: 999999, priceCurrency: "EUR" } }), null);
eq("struct meta", WaitPrice.structPrice("19.90", "EUR", null), { amount: 19.9, currency: "EUR" });
eq("struct bad", WaitPrice.structPrice("", "EUR", null), null);

// ---- validators
const V = WaitValidate;
eq("title strips control/newlines", V.cleanTitle("  a\n\tb\u0000c   d\u202e "), "a b c d");
eq("title cap 200", V.cleanTitle("x".repeat(10000)).length, 200);
eq("title non-string", V.cleanTitle(42), "");
eq("price null", V.price(null), null);
eq("price undefined", V.price(undefined), null);
eq("price ok", V.price(12.5), 12.5);
eq("price 1e308", V.price(1e308), undefined);
eq("price max ok", V.price(100000), 100000);
eq("price over max", V.price(100000.01), undefined);
eq("price zero", V.price(0), undefined);
eq("price negative", V.price(-1), undefined);
eq("price NaN", V.price(NaN), undefined);
eq("price string", V.price("5"), undefined);
eq("currency ok", V.currency("EUR"), "EUR");
eq("currency null", V.currency(null), null);
eq("currency html", V.currency("<img>"), undefined);
eq("currency lower", V.currency("eur"), undefined);
eq("currency long", V.currency("EURO"), undefined);
eq("url same host", V.urlOn("https://www.amazon.com/dp/X", "www.amazon.com"), "https://www.amazon.com/dp/X");
eq("url other host", V.urlOn("https://evil.example/", "www.amazon.com"), null);
eq("url javascript", V.urlOn("javascript:alert(1)", "www.amazon.com"), null);
eq("url too long", V.urlOn("https://www.amazon.com/" + "a".repeat(2100), "www.amazon.com"), null);
eq("url garbage", V.urlOn("not a url", "x"), null);
eq("shopUrl fallback to tab", V.shopUrl("javascript:alert(1)", "https://www.amazon.com/dp/T", "www.amazon.com"), "https://www.amazon.com/dp/T");
eq("shopUrl none", V.shopUrl("javascript:1", "javascript:2", "www.amazon.com"), null);
eq("hostOf", V.hostOf("https://www.emag.ro/x?y=1"), "www.emag.ro");
eq("matchesDomain sub", V.matchesDomain("www.amazon.com", "amazon.com"), true);
eq("matchesDomain evil", V.matchesDomain("notamazon.com", "amazon.com"), false);
eq("thanks url ok", V.isThanksUrl("https://overcrasher.github.io/wait-24h/thanks.html?session_id=x"), true);
eq("thanks url other path", V.isThanksUrl("https://overcrasher.github.io/wait-24h/other.html"), false);
eq("thanks url other origin", V.isThanksUrl("https://evil.github.io/wait-24h/thanks.html"), false);
eq("thanks url http", V.isThanksUrl("http://overcrasher.github.io/wait-24h/thanks.html"), false);
eq("session ok", V.validSession("cs_test_" + "a1B2".repeat(10)), true);
eq("session live ok", V.validSession("cs_live_" + "Z".repeat(20)), true);
eq("session short", V.validSession("cs_test_123"), false);
eq("session bogus", V.validSession("bogus"), false);
eq("session charset", V.validSession("cs_test_" + "a".repeat(19) + "-"), false);
eq("settings defaults", V.sanitizeSettings(undefined), { sites: {}, minPrice: 0, delayHours: 24, mainCurrency: "EUR" });
eq("settings coerced", V.sanitizeSettings({ delayHours: 7, minPrice: -3, sites: [1], mainCurrency: "eur" }), { sites: {}, minPrice: 0, delayHours: 24, mainCurrency: "EUR" });
eq("settings kept", V.sanitizeSettings({ delayHours: 48, minPrice: 5.5, sites: { amazon: false, x: "no" }, mainCurrency: "USD" }), { sites: { amazon: false }, minPrice: 5.5, delayHours: 48, mainCurrency: "USD" });
eq("savings filtered", V.sanitizeSavings({ EUR: 5, usd: 1, GBP: -1, JPY: "x", RON: Infinity }), { EUR: 5 });
eq("savings non-object", V.sanitizeSavings("x"), {});
const goodP = { id: "a", title: "T", url: "https://x.y/", price: 5, currency: "EUR", timestamp: 1, dueAt: 2, notified: false };
eq("pending keeps good", V.sanitizePending([goodP, null, { id: 1 }, Object.assign({}, goodP, { currency: "x" }), Object.assign({}, goodP, { dueAt: NaN }), Object.assign({}, goodP, { price: "5" })]), [goodP]);
eq("pending null price", V.sanitizePending([Object.assign({}, goodP, { price: null, currency: null })]).length, 1);
eq("pending non-array", V.sanitizePending({}), []);
eq("history keeps good + url", V.sanitizeHistory([{ title: "T", price: 5, currency: "EUR", date: 1, url: "https://x.y/a" }]), [{ title: "T", price: 5, currency: "EUR", date: 1, url: "https://x.y/a" }]);
eq("history drops bad url field", V.sanitizeHistory([{ title: "T", price: null, currency: null, date: 1, url: "javascript:1" }]), [{ title: "T", price: null, currency: null, date: 1 }]);
eq("history drops malformed", V.sanitizeHistory([{ title: 1, date: 1 }, { title: "T", date: "x" }, { title: "T", price: 1, currency: "bad", date: 1 }, 5]), []);
eq("bypass sanitized", V.sanitizeBypass({ "a.com": { checkoutUntil: 5, urls: {} }, "b.com": { checkoutUntil: "x" }, "c.com": 1 }), { "a.com": { checkoutUntil: 5 } });

// ---- growth (rating prompt, share text, store URL)
const G = WaitGrowth;
eq("store url exact", G.STORE_URL, "https://chromewebstore.google.com/detail/wait-24h/pkgdjohoemjkejcbfbkfobbbjcpdabme");
eq("reviews url", G.REVIEWS_URL, "https://chromewebstore.google.com/detail/wait-24h/pkgdjohoemjkejcbfbkfobbbjcpdabme/reviews");
eq("other url", G.OTHER_STORE_URL, "https://chromewebstore.google.com/detail/meeting-meter/ffkniocclnaojfdcoofnjkfnihnpgnlb");
eq("rating below", G.shouldAskRating(undefined, 2, 3), false);
eq("rating at", G.shouldAskRating(undefined, 3, 3), true);
eq("rating above", G.shouldAskRating({ shown: false, at: 0 }, 9, 3), true);
eq("rating already shown", G.shouldAskRating({ shown: true, at: 5 }, 9, 3), false);
eq("rating malformed string", G.shouldAskRating("yes", 3, 3), true);
eq("rating malformed shown string", G.shouldAskRating({ shown: "true" }, 3, 3), true);
eq("rating bad count", G.shouldAskRating(undefined, NaN, 3), false);
eq("rating sanitize junk", G.sanitizeRating(5), { shown: false, at: 0 });
eq("rating sanitize ok", G.sanitizeRating({ shown: true, at: 7, x: 1 }), { shown: true, at: 7 });
eq("rating sanitize bad at", G.sanitizeRating({ shown: true, at: "x" }), { shown: true, at: 0 });
const fmtUS = (a, c, whole) => new Intl.NumberFormat("en-US", Object.assign({ style: "currency", currency: c }, whole ? { maximumFractionDigits: 0 } : {})).format(a);
eq("share eur whole", G.shareText(187, "EUR", fmtUS), "I kept \u20AC187 by waiting a day before buying. #Wait24h " + G.STORE_URL);
eq("share eur decimals", G.shareText(42.5, "EUR", fmtUS), "I kept \u20AC42.50 by waiting a day before buying. #Wait24h " + G.STORE_URL);
eq("share usd", G.shareText(250.4, "USD", fmtUS), "I kept $250 by waiting a day before buying. #Wait24h " + G.STORE_URL);
eq("share ron", G.shareText(99.99, "RON", fmtUS), "I kept RON\u00A099.99 by waiting a day before buying. #Wait24h " + G.STORE_URL);
eq("share exact eur text", G.shareText(187, "EUR", fmtUS), "I kept \u20AC187 by waiting a day before buying. #Wait24h https://chromewebstore.google.com/detail/wait-24h/pkgdjohoemjkejcbfbkfobbbjcpdabme");

print("passed " + pass + ", failed " + fail);
failures.forEach((f) => print("FAIL " + f));
if (fail) throw new Error(fail + " test(s) failed");
