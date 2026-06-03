// Heimreise PWA service worker — cache-first, offline-ready.
// Bump CACHE when assets change to force an update.
const CACHE = 'heimreise-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './maps/overview.jpg',
  './maps/tag1.jpg',
  './maps/tag2.jpg',
  './maps/route-overview.json',
  './maps/route-tag1.json',
  './maps/route-tag2.json',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigation requests: serve cached app shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Other GETs: cache-first, fall back to network and cache it.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached)
    )
  );
});
