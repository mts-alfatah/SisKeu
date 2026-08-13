const CACHE_NAME = 'siskeu-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './dashboard.html',
  './style.css',
  './script.js',
  './manifest.json'
  './mts.ico'
];

// Menginstal cache saat pertama kali dibuka
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Menggunakan cache agar lebih cepat dimuat (opsional untuk offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});