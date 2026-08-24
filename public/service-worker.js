// Hotel Aaradhya Dining - Kitchen Soundbox Service Worker
const CACHE_NAME = 'aaradhya-kitchen-soundbox-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Foreground & Background Messages from App (Dispatches Lock-Screen Notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_ORDER_NOTIFICATION') {
    const { title, body, tag, data } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || '🔔 नवीन ऑर्डर प्राप्त झाली!', {
        body: body || 'किचनमध्ये नवीन ऑर्डर आली आहे!',
        icon: '/hotel_emblem.png',
        badge: '/hotel_emblem.png',
        vibrate: [600, 200, 600, 200, 800, 200, 1200],
        tag: tag || `kitchen-order-${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: data || {},
        actions: [
          { action: 'open', title: '👀 ऑर्डर पहा (View Order)' },
          { action: 'ready', title: '✓ तयार झाली (Mark Ready)' }
        ]
      })
    );
  }
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
    vibrate: [600, 200, 600, 200, 800, 200, 1200],
    tag: `kitchen-order-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: data,
    actions: [
      { action: 'open', title: '👀 ऑर्डर पहा (View Order)' }
    ]
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
