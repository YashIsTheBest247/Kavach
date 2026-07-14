/* Kavach AI — minimal service worker (enables install as a mobile app).
   Network-first for navigations with a cached shell fallback when offline. */
const CACHE = 'kavach-v1'
const SHELL = ['/', '/index.html', '/shield.svg', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  // never cache API calls — always hit the network
  if (request.method !== 'GET' || new URL(request.url).pathname.startsWith('/api')) return
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/index.html')))
    return
  }
  e.respondWith(caches.match(request).then((hit) => hit || fetch(request)))
})
