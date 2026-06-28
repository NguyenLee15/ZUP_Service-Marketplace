/* Legacy PWA cleanup worker.
 * The app no longer uses Workbox/PWA caching. Keeping this file lets browsers
 * that already registered /sw.js receive an update and unregister cleanly.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration) {
        await self.registration.unregister();
      }

      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });

      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

self.addEventListener("fetch", () => {
  // Intentionally no-op. The network should handle every request.
});
