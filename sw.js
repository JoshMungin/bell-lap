// Bell Lap service worker: lets Chrome install the app and keeps a copy of it
// so it still opens without signal. Always tries the network first, so a new
// deploy shows up the next time the app is opened online. Videos come from
// YouTube and are not cached.
const CACHE = 'bell-lap-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    // no-cache: always ask GitHub whether the file changed, instead of reusing the
    // browser's copy for up to 10 minutes, which kept new versions from showing.
    // Fetched by URL because Chrome won't copy a page-navigation request with options.
    fetch(request.url, { cache: 'no-cache' })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached ?? Response.error())),
  )
})
