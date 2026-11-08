// Donation configuration. Fill in the placeholders before publishing.
// Stripe Payment Links in EUR: small = EUR 3, medium = EUR 5 (emphasized), large = EUR 10,
// custom = "customer chooses price" link (used by the "1% of what you saved" button).
// An empty string hides that button; if no link is set at all the popup never shows the ask.
export const DONATE_LINKS = { small: "", medium: "", large: "", custom: "" };

// Optional USD set (same four links created in USD). Used only if small, medium AND large
// are all non-empty AND the browser language is a US locale (region US or PR, e.g. en-US, es-US).
export const DONATE_LINKS_USD = { small: "", medium: "", large: "", custom: "" };

// Static GitHub Pages thank-you page (served from docs/thanks.html).
// If the extension moves to another repo/username, change this AND the thanks.html match in
// manifest.json (content_scripts), then run tools/check_release.py.
export const THANKS_URL = "https://overcrasher.github.io/wait-24h/thanks.html";
