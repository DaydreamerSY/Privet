/* =====================================================================
   oauth.js — trang Google chuyển về sau khi đăng nhập (chỉ dùng khi app chạy dạng đã cài:
   cửa sổ riêng trên desktop hoặc app trên màn hình chính). Khi đó Google mở trong tab trình duyệt
   riêng, không liên lạc trực tiếp được với cửa sổ app, nên trang này chuyển quyền truy cập về app
   qua BroadcastChannel + localStorage (app kiểm tra mã state, đọc xong xoá ngay, tự hết hạn sau 5 phút).
   Cùng cách làm với Coin Manager.
   ===================================================================== */
(function () {
  'use strict';
  var HANDOFF_KEY = 'privet-ru-oauth'; // trùng với js/lib/sync.js

  var p = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', location.pathname); // xoá quyền truy cập khỏi thanh địa chỉ / lịch sử ngay

  var msg = {
    state: p.get('state'), access_token: p.get('access_token'), expires_in: p.get('expires_in'),
    scope: p.get('scope'), error: p.get('error'), at: Date.now(),
  };
  var title = document.getElementById('title');
  var text = document.getElementById('msg');
  var standalone = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
    .some(function (m) { return window.matchMedia && window.matchMedia('(display-mode: ' + m + ')').matches; }) || navigator.standalone === true;

  if (!msg.state) {
    title.textContent = 'Không có thông tin đăng nhập';
    text.textContent = 'Hãy quay lại app Привет! và bấm đồng bộ.';
    return;
  }
  try { localStorage.setItem(HANDOFF_KEY, JSON.stringify(msg)); } catch (e) { /* chế độ ẩn danh */ }
  try { new BroadcastChannel(HANDOFF_KEY).postMessage(msg); } catch (e) { /* trình duyệt cũ */ }

  if (standalone) {
    // Trang này đang mở ngay trong cửa sổ app → quay về app, app tự đồng bộ tiếp
    location.replace('./#/settings');
  } else {
    title.textContent = msg.error ? 'Đăng nhập không thành công' : '✓ Đã đăng nhập Google';
    text.textContent = msg.error
      ? 'Quay lại app Привет! và thử lại.'
      : 'Quay lại app Привет! — việc đồng bộ sẽ tự chạy tiếp. Có thể đóng tab này.';
    setTimeout(function () { window.close(); }, 800);
  }
})();
