/* ZenHaven service worker: works offline and loads faster on repeat visits.
   - our own files: network first (so updates show up right away), cache as fallback
   - three.js from the CDN: cache first */
const CACHE = 'zen-v1';
const CORE = ['./', 'index.html', 'style.css', 'app.js', 'animals.js', 'audio-engine.js', 'couple.js', 'focus.js', 'love-config.js', 'love.js',
  'scene-aurora.js', 'scene-beach.js', 'scene-rain.js', 'scene-sakura.js', 'scenes.js', 'zen-tools.js', 'zen-utils.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];
const CDN = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const keep = (res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(keep).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
  } else if (CDN.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(keep)));
  }
});
