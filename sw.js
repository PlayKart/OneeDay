const CACHE_NAME = 'oneday-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  const isHtml = event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url === self.location.origin + '/';
  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request).then(res => res || caches.match('/index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
