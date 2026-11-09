/* =====================================================================
   sw.js — cho app mở được khi không có mạng (app cài ra desktop / màn hình chính)
   Trả ngay bản đã lưu, đồng thời tải bản mới ở nền để lần mở sau dùng:
   cập nhật code trên GitHub Pages sẽ tự tới máy.

   Mọi trang *.github.io của cùng một tài khoản dùng chung kho cache (Coin Manager cũng ở đây)
   → chỉ đụng tới cache có tiền tố của app này, và chỉ xử lý yêu cầu trong thư mục của app.
   ===================================================================== */
const PREFIX = 'privet-ru-';
const CACHE = PREFIX + 'v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/core.js', './js/lib/path.js',
  './js/data/glyphs.js', './js/data/alphabet.js', './js/data/vocab.js', './js/data/grammar.js', './js/data/pronounce.js',
  './js/lib/recognizer.js', './js/lib/writingpad.js', './js/lib/keyboard.js', './js/lib/quiz.js', './js/lib/speech.js', './js/lib/sync.js',
  './js/views/home.js', './js/views/alphabet.js', './js/views/vocab.js', './js/views/grammar.js', './js/views/speak.js',
  './js/views/settings.js', './js/views/debug.js', './js/app.js',
  './oauth.html', './js/oauth.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' — lấy thẳng từ server, không dùng bản cũ trong HTTP cache của trình duyệt
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const scope = new URL(self.registration.scope);
  // chỉ file của app này; Google (đăng nhập, Drive) và mọi trang khác đi thẳng ra mạng
  if (e.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    // no-cache: luôn hỏi lại server (ETag → 304 nếu chưa đổi)
    const network = fetch(e.request.url, { cache: 'no-cache' })
      .then((res) => { if (res.ok && res.type === 'basic') cache.put(e.request, res.clone()); return res; })
      .catch(() => cached || Response.error());
    if (cached) {
      e.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  }));
});
