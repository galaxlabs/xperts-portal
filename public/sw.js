const CACHE = "xperts-shell-v2";

self.addEventListener("install", () => self.skipWaiting());
async function cacheResponse(request, response) {
  if (!response.ok) return response;
  // Clone before returning: the browser may consume the original immediately.
  const copy = response.clone();
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, copy);
  } catch {
    // Offline cache failures must not prevent the live response from rendering.
  }
  return response;
}

self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("xperts-shell-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => cacheResponse(request, response)).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => cacheResponse(request, response));
    return cached || network;
  }));
});
