const CACHE_NAME = 'jtech-v4'; // 버전 번호 변경 (기존 캐시 무효화)
const urlsToCache = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // 새 서비스 워커 즉시 활성화
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 이전 버전(v1, v2) 캐시 자동 삭제
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

// 네트워크 우선 확인 후 오프라인 시 캐시 반환 (업데이트 미반영 문제 방지)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
