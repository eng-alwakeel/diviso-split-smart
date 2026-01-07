// Static cache version - update this with each deployment
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;

// Critical assets to precache for fast first load
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json'
];

const STATIC_ASSETS = [
  '/src/main.tsx',
  '/src/index.css',
  '/placeholder.svg'
];

const API_CACHE_PATTERNS = [
  /\/api\//
  // REMOVED: supabase.co - Never cache Supabase data to ensure fresh data always
];

// Patterns that should NEVER be cached (always network-only)
const NO_CACHE_PATTERNS = [
  /supabase\.co/,
  /iwthriddasxzbjddpzzf\.supabase\.co/
];

// Install event - cache static assets and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll([...PRECACHE_ASSETS, ...STATIC_ASSETS]))
      .then(() => {
        console.log('[SW] Static assets cached, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW] Cleaning old caches:', cacheNames);
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming all clients');
        return self.clients.claim();
      })
  );
});

// Listen for skip waiting message from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating new version');
    self.skipWaiting();
  }
});

// Fetch event - NETWORK-FIRST strategy for fresh content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CRITICAL: Never cache Supabase requests - always fetch fresh data
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle other API requests with network-first strategy for GET requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    if (request.method === 'GET') {
      event.respondWith(
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Try network first
            return fetch(request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  cache.put(request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(() => {
                // Fallback to cache only if network fails
                return cache.match(request);
              });
          })
      );
    } else {
      // For non-GET requests, always use network
      event.respondWith(fetch(request));
    }
    return;
  }

  // Handle static assets with NETWORK-FIRST strategy
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful responses for static assets
        if (networkResponse.ok && request.destination !== '') {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME)
            .then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache only if network fails
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline fallback for navigation requests
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
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