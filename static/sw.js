const CACHE_NAME = "absensi-pengajian-v9"; // Updated version - increment for every deploy
const urlsToCache = [
  "/",
  "/login",
  "/dashboard",
  "/master/jamaah",
  "/absensi-new",
  "/master",
  "/laporan",
  "/laporan-jamaah",
  "/laporan-ketertiban",
  "/profile",
  "/manifest.json",
];

// Install event - force immediate activation
self.addEventListener("install", (event) => {
  console.log("[SW] Installing new service worker...");
  // Skip waiting to activate immediately without waiting for clients to unload
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - Network-first for everything to ensure fresh updates
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Network-first for HTML pages (always try network first)
  if (
    url.pathname === "/" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html") ||
    url.href.includes("supabase.co") ||
    url.pathname.includes("/api/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(event.request).catch(() => {
            // If no cache either, return offline page or error
            return new Response("Offline - no cache available", {
              status: 503,
            });
          });
        })
    );
    return;
  }

  // Cache-first for static assets only (images, fonts, etc)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Activate event - clean old caches and take control immediately
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new service worker v4...");

  event.waitUntil(
    Promise.all([
      // Delete old caches aggressively
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim().then(() => {
        console.log("[SW] Claimed all clients");
      }),
    ])
  );

  console.log("[SW] Service worker activated and ready!");
});

// Listen for skip waiting message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Received SKIP_WAITING message from client");
    self.skipWaiting();
  }

  // Handle cache clearing message
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("[SW] Clearing cache on client request");
    caches.delete(CACHE_NAME);
  }
});

// Notify all clients when update is ready
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SW_UPDATED",
          version: CACHE_NAME,
        });
      });
    })
  );
});
