self.addEventListener('push', (event) => {
  const { title, ...options } = event.data.json()

  options.icon ??= '/icon-192.svg'
  options.badge ??= '/icon-192.svg'

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? '/'))
})
