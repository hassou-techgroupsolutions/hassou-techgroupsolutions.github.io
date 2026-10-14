const CACHE_NAME = 'hassou-portfolio-v13-1-original-client-conversion';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './site.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './favicon-96x96.png',
  './apple-touch-icon.png',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
  './offline.html',
  './images/hassou-mark-clean.webp',
  './images/hassou-mark-clean.png',
  './images/hassou-avatar-circle-clean.webp',
  './images/hassou-lockup-clean.webp',
  './images/hassou-lockup-clean.png',
  './images/social-preview.jpg',
  './images/rhu-morong-showcase.webp',
  './images/cathyrine-menguito-team.jpg',
  './images/ariel-eubanas-team.jpg',
  './case-studies/morong-health-center.html',
  './case-studies/career-assessment.html',
  './case-studies/mbmis.html',
  './case-studies/rsst-shs-credentials.html',
  './case-studies/ritremis.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => (key.startsWith('hassou-portfolio-') || key.startsWith('tgs-portfolio-')) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('./index.html') || caches.match('./offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
