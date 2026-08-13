// Naikkan versi cache agar browser mendeteksi perubahan file
const CACHE_NAME = 'siskeu-cache-v3';

// Daftar semua file asset yang akan disimpan di cache PWA
const urlsToCache = [
  './',
  './index.html',
  './dashboard.html',
  './style.css',
  './script.js',
  './manifest.json',
  './mts.ico',
  './logo-192.png', // Logo 192px sudah ditambahkan
  './logo-512.png'  // Logo 512px sudah ditambahkan
];

// Menginstal Service Worker & Menyimpan File ke Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('Gagal caching:', url)))
      );
    })
  );
});

// Mengambil Asset dari Cache / Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Membersihkan Cache Lama (Versi v1/v2) Otomatis
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
