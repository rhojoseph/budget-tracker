const CACHE_NAME = 'budget-tracker-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Firestore 등 API 요청은 통과
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  // network-first: 항상 최신 파일을 먼저 시도하고, 오프라인일 때만 캐시 사용
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.url.startsWith('http')) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
