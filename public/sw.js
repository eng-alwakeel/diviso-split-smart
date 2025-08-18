const CACHE_NAME = 'app-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/placeholder.svg'
];

const API_CACHE_PATTERNS = [
  /\/api\//,
  /supabase\.co/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with cache-first strategy for GET requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    if (request.method === 'GET') {
      event.respondWith(
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match(request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  // Return cached version and update in background
                  fetch(request)
                    .then((networkResponse) => {
                      if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone());
                      }
                    })
                    .catch(() => {}); // Ignore network errors in background
                  
                  return cachedResponse;
                }
                
                // No cached version, fetch from network
                return fetch(request)
                  .then((networkResponse) => {
                    if (networkResponse.ok) {
                      cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                  });
              });
          })
      );
    } else {
      // For non-GET requests, always use network
      event.respondWith(fetch(request));
    }
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses for static assets
            if (networkResponse.ok && request.destination !== '') {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          });
      })
      .catch(() => {
        // Return offline fallback for navigation requests
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync logic here
      console.log('Background sync triggered')
    );
  }
});