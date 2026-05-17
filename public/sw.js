const CACHE_NAME = 'budget-tracker-v1';
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
  // Firestore 등 API 요청은 네트워크를 우선시하거나 통과시킵니다.
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 캐시에 있으면 반환, 없으면 네트워크 요청
      return cachedResponse || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // http 요청만 캐싱
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(() => {
      // 오프라인이면서 캐시에도 없는 경우 처리 (예: fallback 페이지)
    })
  );
});
