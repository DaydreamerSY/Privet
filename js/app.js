/* =====================================================================
   app.js — khởi động ứng dụng
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;

  RU.store.load();
  RU.tts.init();
  RU.Sync.init();

  /* ---------- Cài app ra desktop / màn hình chính (PWA) ----------
     Bộ đệm offline chỉ bật trên bản web (https). Ở localhost không bật để luôn thấy code mới
     (thêm ?sw vào địa chỉ nếu muốn thử chế độ offline). */
  const localDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if ('serviceWorker' in navigator) {
    if (location.protocol === 'https:' || (localDev && /[?&]sw\b/.test(location.search))) {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Không bật được chế độ offline', e));
    } else if (localDev) {
      const mine = new URL('./', location.href).href;
      navigator.serviceWorker.getRegistrations().then((rs) => rs.filter((r) => r.scope === mine).forEach((r) => r.unregister())).catch(() => {});
    }
  }
  RU.install = { prompt: null };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); RU.install.prompt = e; RU.emit('installable'); });
  window.addEventListener('appinstalled', () => { RU.install.prompt = null; RU.emit('installable'); RU.toast('Đã cài app Привет! ✓', 'ok'); });

  const NAV = [
    ['home', 'Trang chủ', () => RU.icon('home', 22)],
    ['alphabet', 'Chữ cái', () => h('span', { class: 'nav-abc', lang: 'ru' }, 'Аа')],
    ['vocab', 'Từ vựng', () => RU.icon('book', 22)],
    ['grammar', 'Cấu trúc câu', () => RU.icon('chat', 22)],
    ['speak', 'Phát âm', () => RU.icon('mic', 22)],
    ['settings', 'Cài đặt', () => RU.icon('sliders', 22)],
  ];
  const nav = document.getElementById('nav');
  NAV.forEach(([id, label, ico]) => nav.append(h('a', { href: '#/' + id, title: label, dataset: { nav: id } }, ico(), h('span', { class: 'nav-label' }, label))));

  const stats = document.getElementById('topStats');
  const statsBox = h('span', { class: 'top-stats-xp' });
  stats.append(statsBox, RU.Sync.pill());
  function renderStats() {
    const xp = RU.todayXp();
    const goal = RU.state.settings.goal || 50;
    statsBox.innerHTML = '';
    statsBox.append(
      h('span', { class: 'ts streak' + (RU.streak() ? ' on' : ''), title: 'Chuỗi ngày học liên tiếp' }, RU.icon('flame', 18), RU.streak()),
      h('span', { class: 'ts xp' + (xp >= goal ? ' on' : ''), title: 'XP hôm nay / mục tiêu' }, RU.icon('star', 18), xp + '/' + goal));
  }
  RU.on('xp', renderStats);
  RU.on('settings', (k) => { if (k === 'goal') renderStats(); });
  renderStats();

  // Đồng bộ lấy về tiến độ từ máy khác → vẽ lại trang đang xem (trừ khi đang làm bài dở)
  RU.on('synced', (res) => {
    if (res.replaced) { RU.go('home'); return; }
    const path = location.hash.replace(/^#\/?/, '').split('?')[0] || 'home';
    if (/^(home|alphabet|vocab|grammar|speak|settings)$/.test(path)) {
      const y = window.scrollY;
      RU.refresh();
      window.scrollTo(0, y);
    }
  });

  RU.router.start();
})(window.RU = window.RU || {});
