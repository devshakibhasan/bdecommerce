// BD E-Commerce Self-Unregistering & Cache-Purging Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Purging cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[SW] Unregistering service worker...');
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept any request - let the browser and Next.js handle all requests directly
  return;
});
