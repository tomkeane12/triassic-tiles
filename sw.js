// Triassic Tiles — service worker
// Bump CACHE_VERSION whenever you ship a new build so users get the update.
const CACHE_VERSION = "triassic-tiles-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
];

// Install: pre-cache the shell.
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop any caches from older versions.
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first, network fallback, with offline shell fallback for navigations.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Cache any successful same-origin GET so subsequent loads are offline-safe.
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline fallback: navigations get the cached shell, others fail naturally.
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
