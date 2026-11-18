const CACHE_NAME = 'jtech-v6';
// 오프라인에서도 기본 뼈대가 즉시 뜨도록 핵심 파일들을 미리 캐시에 등록
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (!url.protocol.startsWith('http') || event.request.method !== 'GET') {
    return; 
  }

  // 캐시 우선 전략 (Cache-First): 오프라인이든 온라인이든 캐시에 있으면 즉시 불러와서 속도를 극대화하고, 없으면 네트워크에서 가져와 캐시에 저장
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 캐시에 있으면 즉시 반환 (로딩 속도 0초에 가까움!)
        // 백그라운드에서 최신 버전으로 조용히 업데이트
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // 캐시에 없으면 네트워크에서 가져오기
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // 오프라인이고 캐시도 없는 경우 빈 응답 처리
        return new Response('오프라인 상태이며 캐시된 데이터가 없습니다.', {
          status: 503,
          statusText: 'Offline'
        });
      });
    })
  );
});
