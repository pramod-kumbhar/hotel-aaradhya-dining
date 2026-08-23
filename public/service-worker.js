// Hotel Aaradhya Dining - Kitchen Soundbox Service Worker
const CACHE_NAME = 'aaradhya-kitchen-soundbox-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Background Push Notifications (When Screen is Locked / App in Background)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'नवीन ऑर्डर!', body: event.data ? event.data.text() : 'नवीन ऑर्डर आली आहे!' };
  }

  const title = data.title || '🔔 नवीन ऑर्डर आली आहे!';
  const options = {
    body: data.body || 'नवीन ऑर्डर किचनमध्ये तयार करण्यासाठी आली आहे.',
    icon: '/hotel_emblem.png',
    badge: '/hotel_emblem.png',
    vibrate: [300, 100, 300, 100, 500],
    tag: `kitchen-order-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click -> Open or Focus Kitchen Soundbox Tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
