// Enhanced service worker for Glance Money PWA with offline capabilities
const CACHE_NAME = 'glance-money-v2';
const OFFLINE_CACHE = 'glance-money-offline-v1';
const API_CACHE = 'glance-money-api-v1';

// Resources to cache for offline use
const STATIC_RESOURCES = [
  '/',
  '/dashboard',
  '/transactions',
  '/goals',
  '/settings',
  '/manifest.json',
  '/offline.html' // We'll create this fallback page
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/transactions',
  '/api/categories',
  '/api/goals'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES.map(url => new Request(url, { cache: 'reload' })));
      }),
      // Initialize offline cache
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Service Worker: Initializing offline cache');
        return cache.put('/offline.html', new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Offline - Glance Money</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, sans-serif; 
                  text-align: center; 
                  padding: 2rem; 
                  background: #f9fafb;
                  color: #374151;
                }
                .offline-message { 
                  max-width: 400px; 
                  margin: 0 auto; 
                  background: white;
                  padding: 2rem;
                  border-radius: 0.5rem;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .icon { font-size: 4rem; margin-bottom: 1rem; }
                .button {
                  background: #10b981;
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 0.375rem;
                  cursor: pointer;
                  font-size: 1rem;
                  margin-top: 1rem;
                }
                .button:hover { background: #059669; }
              </style>
            </head>
            <body>
              <div class="offline-message">
                <div class="icon">📱</div>
                <h1>You're Offline</h1>
                <p>Glance Money is working offline. Your changes are being saved locally and will sync when you reconnect.</p>
                <button class="button" onclick="window.location.reload()">Try Again</button>
              </div>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } }));
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skipping waiting...');
    self.skipWaiting();
  }
});

// Fetch event - handle requests with offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static resources
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache');
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request is not available offline',
        offline: true
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests with cache-first for app shell
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first for app shell
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Navigation request failed, serving offline page');
    
    // Serve offline page
    const offlineCache = await caches.open(OFFLINE_CACHE);
    return offlineCache.match('/offline.html');
  }
}

// Handle static resources with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Static resource request failed:', request.url);
    
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Service Worker: Starting offline data sync');
    
    // This would typically communicate with the main app to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_DATA',
        timestamp: Date.now()
      });
    });
    
    console.log('Service Worker: Offline data sync completed');
  } catch (error) {
    console.error('Service Worker: Offline data sync failed:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'You have new financial updates',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'financial-update',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Glance Money', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Script loaded');