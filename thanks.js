// Runs only on the thank-you page. Asks the service worker to mark the user as a supporter if the page
// was reached through a Stripe Payment Link redirect (?session_id=cs_...). The worker validates the
// sender page and the session id shape; this script never touches storage.
(() => {
  const id = new URLSearchParams(location.search).get("session_id");
  if (id) chrome.runtime.sendMessage({ type: "supporter", sessionId: id }).catch(() => {});
})();
