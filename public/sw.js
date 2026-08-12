// Dumbo Offline Service Worker
const CACHE_NAME = "dumbo-app-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/chat",
  "/canvas",
  "/music",
  "/focus",
  "/hydration",
  "/manifest.json",
  "/favicon.ico",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Failed to pre-cache some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for web pages and static assets
  if (event.request.method !== "GET") return;

  // Ignore API or Supabase/Clerk requests for service worker caching
  const url = new URL(event.request.url);
  if (
    url.origin.includes("supabase.co") ||
    url.origin.includes("clerk") ||
    url.pathname.startsWith("/api")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return root page as offline fallback for page navigation
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
