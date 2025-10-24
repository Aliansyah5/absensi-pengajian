const CACHE_NAME = "absensi-pengajian-v3"; // Updated version
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
  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - Network-first for dynamic content
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first strategy for API calls, Supabase, and JavaScript files
  if (
    url.href.includes("supabase.co") ||
    url.pathname.includes("/api/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    event.request.method !== "GET"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for static assets only (images, fonts, etc)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate event - clean old caches and take control immediately
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new service worker...");

  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );

  console.log("[SW] Service worker activated and ready!");
});

// Listen for skip waiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Received SKIP_WAITING message");
    self.skipWaiting();
  }
});
