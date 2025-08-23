
// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  let title = 'Notification';
  let options = {
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    data: {},
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ],
    requireInteraction: true,
  };

  // Handle case where push has data payload
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options = {
        ...options,
        body: data.body || options.body,
        icon: data.icon || options.icon,
        badge: data.badge || options.badge,
        tag: data.tag || options.tag,
        data: data.data || options.data,
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
      // Use default values if parsing fails
    }
  } else {
    // Handle empty push (some services send empty pings to test connectivity)
    title = 'Test Notification';
    options.body = 'Push notification channel is working!';
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);

  event.notification.close();

  if (event.action === 'view' && event.notification.data?.orderId) {
    // Open the dashboard with the specific order
    event.waitUntil(
      self.clients.openWindow(`/dashboard/orders?highlight=${event.notification.data.orderId}`)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open dashboard
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event);
});
