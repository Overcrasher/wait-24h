// Run from the wait-24h folder:  jsc tests/run.js
load("lib/price.js");
load("lib/donation.js");

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

print("passed " + pass + ", failed " + fail);
failures.forEach((f) => print("FAIL " + f));
if (fail) throw new Error(fail + " test(s) failed");
