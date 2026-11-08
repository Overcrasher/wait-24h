// Runs only on the thank-you page. Marks the user as a supporter if the page was
// reached through a Stripe Payment Link redirect (?session_id=cs_...).
(() => {
  const id = new URLSearchParams(location.search).get("session_id");
  if (id && id.startsWith("cs_")) {
    chrome.storage.local.set({ supporter: true });
  }
})();
