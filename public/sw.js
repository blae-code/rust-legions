// Rust Legions field terminal service worker.
// Minimal by design: it makes the app installable and takes control immediately,
// but passes all traffic straight to the network so live war state is never stale.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
