const CACHE_NAME = "fintech-dashboard-v1";
const STATIC_ASSETS = [
  "/",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

// Install — кешируем статику
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting()),
  );
});

// Activate — очищаем старые кеши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }).then(() => self.clients.claim()),
  );
});

// Fetch — network-first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Только GET
  if (event.request.method !== "GET") return;

  // API-запросы не кешируем
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кешируем успешные ответы
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Офлайн — отдаём кеш
        return caches.match(event.request).then((cached) => {
          return cached ?? caches.match("/");
        });
      }),
  );
});
