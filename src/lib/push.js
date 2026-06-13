// Converts a base64url VAPID key into the Uint8Array pushManager.subscribe expects.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function subscribeToPush() {
  console.log('Push supported:', 'PushManager' in window)
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  // iOS Safari only supports push for PWAs added to the home screen.
  if (/iPhone|iPad/.test(navigator.userAgent) && window.navigator.standalone === false) {
    console.log('iOS: must be installed as PWA for push notifications')
    return null
  }

  console.log('Permission status:', Notification.permission)
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  console.log('VAPID key:', import.meta.env.VITE_VAPID_PUBLIC_KEY)

  const registration = await navigator.serviceWorker.ready
  console.log('SW ready:', registration)

  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    console.log('Subscription result:', existing)
    return existing
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  console.log('Subscription result:', subscription)
  return subscription
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) await subscription.unsubscribe()
}
