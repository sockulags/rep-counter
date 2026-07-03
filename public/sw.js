const CACHE_NAME = 'rep-counter-v2'
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './app-icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  )
  self.clients.claim()
})

function cachePut(request, response) {
  const copy = response.clone()
  return caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(request, copy))
    .catch(() => {})
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) event.waitUntil(cachePut(request, response))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match('./index.html')),
        ),
    )
    return
  }

  if (new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (response.ok) event.waitUntil(cachePut(request, response))
        return response
      })
    }),
  )
})
