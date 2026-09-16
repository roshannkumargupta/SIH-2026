/**
 * SmritiSetu Progressive Web App Service Worker
 * Provides offline caching, network resiliency, and seamless background sync readiness.
 */

const CACHE_NAME = "smritisetu-v2";

// Note on i18n: Frontend/src/i18n/config.ts statically imports all translation resources,
// so all 11 Indic language catalogs are compiled directly into the application JS bundle.
// No service worker fetch interception or runtime precaching is required for i18n files.

// Precache critical app assets that exist on disk in Frontend/public/
const PRECACHE_ASSETS = [
  "/",
  "/favicon.ico",
  "/hero.png",
  "/assets/brain-logo.png",
  "/manifest.json",
  // Phase 5 Soundscapes: Valid silent placeholder MP3s are currently on disk
  // and precached to guarantee offline calmness availability. (Will be upgraded with studio audio).
  "/audio/soundscapes/brahmaputra_river.mp3",
  "/audio/soundscapes/bamboo_flute.mp3",
  "/audio/soundscapes/mountain_rain.mp3",
  "/audio/soundscapes/temple_bells.mp3",
];

// 1. Install event: precache vital assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("Precache partial warning:", err);
        });
      })
      .then(() => self.skipWaiting()),
  );
});

// 2. Activate event: clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. Fetch event: Network-first for dynamic & API calls, Cache-first for static media
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST /api/v1/sync is handled in user-space offline queue)
  if (request.method !== "GET") {
    return;
  }

  // Handle API GET requests: Network first, fall back gracefully
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            message: "Network offline. Using local cached state.",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 503,
          },
        );
      }),
    );
    return;
  }

  // Handle static assets (images, fonts, scripts, audio soundscapes)
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".ogg") ||
    url.pathname.endsWith(".m4a") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      }),
    );
    return;
  }

  // Handle HTML document navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const rootCached = await caches.match("/");
        if (rootCached) return rootCached;
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SmritiSetu Offline</title></head><body style="font-family:sans-serif;background:#121316;color:#FAF7EE;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>SmritiSetu is in Offline Mode</h2><p>Your local games and routine tasks remain fully accessible.</p></div></body></html>',
          { headers: { "Content-Type": "text/html" } },
        );
      }),
    );
    return;
  }

  // Default: Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
