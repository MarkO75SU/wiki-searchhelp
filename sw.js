/**
 * WikiGUI Service Worker
 * Enterprise Caching Strategy: Stale-While-Revalidate
 */

const CACHE_NAME = 'wikigui-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/src/css/style.css',
    '/src/js/main.js',
    '/assets/favicon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Fetch fresh version in background
                fetch(event.request).then(response => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
                });
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
