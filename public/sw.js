// public/sw.js

// 1. Listen for 'push' event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Push received:', data);

  const options = {
    body: data.body,
    icon: '/icon.png', // Optional: Your app icon
    badge: '/badge.png', // Optional: Small icon
    vibrate: [200, 100, 200], // Vibration pattern
    data: {
      url: data.url // URL to open when notification is clicked
    }
  };

  // 2. Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 3. Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});