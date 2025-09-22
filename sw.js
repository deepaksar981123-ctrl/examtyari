// Service Worker for English Vocabulary App
const CACHE_NAME = 'vocabulary-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/global.css',
  '/css/home.css',
  '/css/vocab-add.css',
  '/css/vocab-list.css',
  '/css/vocab-popup.css',
  '/css/exam-list.css',
  '/css/exam-modal.css',
  '/css/quiz.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/quiz.js',
  '/js/exam-list.js',
  '/js/exam-modal.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline word additions
self.addEventListener('sync', (event) => {
  if (event.tag === 'word-sync') {
    event.waitUntil(syncWords());
  }
});

async function syncWords() {
  try {
    // This would sync pending words when back online
    console.log('Syncing words in background...');
    // Implementation would depend on your specific sync logic
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Push notification support (for future features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New vocabulary available!',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Start Quiz',
        icon: 'icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('English Vocabulary', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app and navigate to quiz
    event.waitUntil(
      clients.openWindow('/?view=quiz')
    );
  } else {
    // Just open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});