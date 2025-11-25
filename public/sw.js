const CACHE_NAME = 'chronos-v1'
const STATIC_CACHE = 'chronos-static-v1'
const DYNAMIC_CACHE = 'chronos-dynamic-v1'
const IMAGE_CACHE = 'chronos-images-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.ico',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE &&
                   name !== IMAGE_CACHE
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle images separately
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE))
    return
  }

  // Handle API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle Firebase/Firestore calls
  if (url.hostname.includes('firebase') || url.hostname.includes('firestore')) {
    event.respondWith(networkOnlyStrategy(request))
    return
  }

  // Handle static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
    return
  }

  // Default: network first, fall back to cache
  event.respondWith(networkFirstStrategy(request))
})

// Network first strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', error)
    
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    })
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to fetch:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network only strategy
async function networkOnlyStrategy(request) {
  return fetch(request)
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  console.log('[SW] Syncing data...')
  // Implement data sync logic here
  return Promise.resolve()
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  }
  
  event.waitUntil(
    self.registration.showNotification('CHRONOS System', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handler
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls } = event.data
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(urls)
      })
    )
  }
})

console.log('[SW] Service Worker loaded')
