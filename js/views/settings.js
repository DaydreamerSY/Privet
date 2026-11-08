/* =====================================================================
   views/settings.js — Cài đặt: giọng đọc, hiển thị, độ khó, dữ liệu
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const ui = RU.ui;

  function row(label, desc, control) {
    return h('div', { class: 'set-row' }, h('div', { class: 'set-text' }, h('b', null, label), desc ? h('small', null, desc) : null), control);
  }
  function toggle(key) {
    const st = RU.state.settings;
    const el = h('button', { type: 'button', class: 'switch' + (st[key] ? ' on' : ''), role: 'switch', 'aria-checked': String(!!st[key]) }, h('i'));
    el.addEventListener('click', () => {
      RU.store.set(key, !st[key]);
      el.classList.toggle('on', st[key]);
      el.setAttribute('aria-checked', String(st[key]));
    });
    return el;
  }
  function seg(key, options) {
    const st = RU.state.settings;
    const el = h('div', { class: 'seg' });
    options.forEach(([v, label]) => {
      const b = h('button', { type: 'button', class: st[key] === v ? 'on' : '' }, label);
      b.addEventListener('click', () => {
        RU.store.set(key, v);
        el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      });
      el.append(b);
    });
    return el;
  }

  /* ---- Đồng bộ nhiều thiết bị qua Google Drive */
  function syncCard(ctx) {
    const S = RU.Sync;
    const card = h('section', { class: 'card settings sync-card', id: 'sync' });
    const webLink = () => h('a', { href: S.ONLINE_URL, target: '_blank', rel: 'noopener' }, S.ONLINE_URL);
    const render = () => {
      card.innerHTML = '';
      card.append(h('h3', null, '☁️ Đồng bộ nhiều thiết bị'));
      if (!S.available) {
        card.append(
          h('p', { class: 'muted small' }, 'Lưu tiến độ lên Google Drive của bạn để học tiếp trên điện thoại hay máy tính khác.'),
          h('div', { class: 'callout warn' },
            h('b', null, 'Bạn đang mở app từ file trên máy — Google không cho đăng nhập ở chế độ này.'),
            h('div', null, 'Để đồng bộ, hãy mở bản trên web: ', webLink(), '. ',
              'Muốn mang tiến độ hiện có sang: bấm «Xuất file» ở mục Dữ liệu bên dưới, rồi «Nhập file» trên bản web.')));
        return;
      }
      if (!S.connected) {
        RU.append(card, [
          h('p', null, 'Đăng nhập Google để lưu tiến độ vào ', h('b', null, 'Google Drive của bạn'),
            ' — học ở máy nào cũng tiếp tục được ở máy khác (điện thoại, máy tính ở nhà, ở cơ quan…).'),
          h('ul', { class: 'small muted sync-facts' },
            h('li', null, 'App chỉ dùng thư mục ẩn riêng của app trên Drive: không hiện trong Drive, không đụng tới file nào khác của bạn.'),
            h('li', null, 'Cửa sổ Google sẽ ghi tên ', h('b', null, 'Coin Manager'), ' vì app dùng chung project Google với Coin Manager.'),
            h('li', null, 'Trên mỗi máy: mở app bằng cùng địa chỉ web, vào đây bấm kết nối với cùng một tài khoản Google.')),
          S.onWebOrigin ? null : h('div', { class: 'callout warn small' },
            'Địa chỉ đang mở (', location.origin, ') có thể chưa được khai báo trong project Google. Nếu cửa sổ Google báo lỗi «origin_mismatch», hãy dùng bản web: ', webLink(), '.'),
          h('div', { class: 'row gap' },
            h('button', { type: 'button', class: 'btn primary', disabled: S.status === 'busy', onclick: () => S.syncNow({ interactive: true }) },
              RU.icon('cloud', 18), S.status === 'busy' ? ' Đang kết nối…' : ' Kết nối Google Drive')),
          S.status === 'error' ? h('div', { class: 'callout warn' }, S.message) : null]);
        return;
      }
      const auto = h('button', { type: 'button', class: 'switch' + (S.auto ? ' on' : ''), role: 'switch', 'aria-checked': String(S.auto) }, h('i'));
      auto.addEventListener('click', () => {
        S.auto = !S.auto;
        auto.classList.toggle('on', S.auto);
        auto.setAttribute('aria-checked', String(S.auto));
      });
      const syncBtn = h('button', { type: 'button', class: 'btn primary', disabled: S.status === 'busy', onclick: () => S.syncNow({ interactive: true }) },
        RU.icon('cloud', 18), S.status === 'busy' ? ' Đang đồng bộ…' : ' Đồng bộ ngay');
      const offBtn = h('button', { type: 'button', class: 'btn ghost', onclick: () => {
        if (window.confirm('Ngắt kết nối Google Drive trên máy này?\n\nTiến độ trên máy này và trên Drive vẫn giữ nguyên; kết nối lại lúc nào cũng được.')) {
          S.disconnect();
          RU.toast('Đã ngắt kết nối Google Drive trên máy này.', '');
        }
      } }, 'Ngắt kết nối');
      RU.append(card, [
        row('Tài khoản', S.email, h('span', { class: 'sync-state ' + S.status }, S.describe())),
        S.status === 'error' ? h('div', { class: 'callout warn' }, S.message) : null,
        row('Tự đồng bộ', 'Đã bấm đồng bộ trong lần mở app này thì tiến độ mới sẽ tự được đưa lên Drive. Quyền Google hết hạn sau khoảng 1 giờ — khi đó bấm nút ☁️ trên thanh trên cùng.', auto),
        row('Đồng bộ', 'Mở app ở máy khác → bấm ☁️ (hoặc nút ở trang chủ) để lấy tiến độ mới nhất.', h('div', { class: 'row gap' }, syncBtn, offBtn)),
        h('p', { class: 'muted small' }, 'Muốn xóa hẳn bản trên Drive: Google Drive → Cài đặt → Quản lý ứng dụng → Coin Manager → Xóa dữ liệu ứng dụng ẩn. ',
          h('b', null, 'Lưu ý:'), ' thao tác đó xóa cả bản đồng bộ của Coin Manager (vì dùng chung project).')]);
    };
    render();
    ctx.onCleanup(RU.on('sync', render));
    return card;
  }

  RU.route('settings', (ctx) => {
    const main = ctx.main;
    const st = RU.state.settings;
    main.append(ui.header('Cài đặt', { icon: '⚙️' }));
    main.append(syncCard(ctx));

    // ---- Giọng đọc
    const voiceBox = h('div');
    const renderVoices = () => {
      voiceBox.innerHTML = '';
      if (!RU.tts.supported) {
        voiceBox.append(h('div', { class: 'callout warn' }, 'Trình duyệt này không hỗ trợ đọc văn bản. Hãy dùng Microsoft Edge hoặc Google Chrome.'));
        return;
      }
      if (!RU.tts.voices.length) {
        voiceBox.append(h('div', { class: 'callout warn' },
          h('b', null, 'Chưa tìm thấy giọng đọc tiếng Nga trên máy.'),
          h('ul', null,
            h('li', null, 'Cách dễ nhất: mở app bằng ', h('b', null, 'Microsoft Edge'),
              location.protocol === 'file:' ? [' — nháy đúp file ', h('b', null, 'Mo-app-Edge.bat'), ' trong thư mục app'] : null,
              '. Edge có sẵn giọng tiếng Nga tự nhiên (Svetlana, Dmitry…), cần có mạng.'),
            h('li', null, h('b', null, 'Google Chrome'), ' cũng có giọng «Google русский» (cần mạng).'),
            h('li', null, 'Điện thoại: dùng Chrome (Android) hoặc Safari (iPhone). Nếu vẫn không có giọng, hãy cài thêm giọng tiếng Nga trong mục «Chuyển văn bản thành giọng nói» của điện thoại.'),
            h('li', null, 'Vivaldi, Opera, Brave, Cốc Cốc… thường chỉ dùng giọng có sẵn trong Windows. Có thể thử cài thêm: ', h('b', null, 'Cài đặt Windows → Thời gian và ngôn ngữ → Giọng nói → Thêm giọng nói → Русский'), ', rồi khởi động lại trình duyệt (một số trình duyệt vẫn không nhận giọng này).'))));
        return;
      }
      const cur = RU.tts.voice();
      const sel = h('select', { class: 'select', 'aria-label': 'Chọn giọng đọc' },
        RU.tts.voices.map((v) => h('option', { value: v.voiceURI, selected: cur && v.voiceURI === cur.voiceURI }, v.name + (v.localService ? '' : ' (trực tuyến)'))));
      sel.addEventListener('change', () => { RU.store.set('voice', sel.value); RU.tts.speak('Приве́т! Как дела́?'); });
      voiceBox.append(row('Giọng đọc', RU.tts.voices.length + ' giọng tiếng Nga trên máy này', sel));
    };
    renderVoices();
    const offVoices = RU.on('voices', renderVoices);
    ctx.onCleanup(offVoices);

    const rate = h('input', { type: 'range', min: '0.5', max: '1.3', step: '0.05', value: String(st.rate), class: 'range', 'aria-label': 'Tốc độ đọc' });
    const rateLbl = h('span', { class: 'chip' }, '×' + Number(st.rate).toFixed(2));
    rate.addEventListener('input', () => { rateLbl.textContent = '×' + Number(rate.value).toFixed(2); });
    rate.addEventListener('change', () => { RU.store.set('rate', Number(rate.value)); RU.tts.speak('Я изуча́ю ру́сский язы́к.'); });

    main.append(h('section', { class: 'card settings' }, h('h3', null, '🔊 Giọng đọc'),
      voiceBox,
      row('Tốc độ đọc', 'Chậm hơn giúp dễ nghe khi mới học', h('div', { class: 'row gap' }, rate, rateLbl)),
      row('Nghe thử', null, h('button', { type: 'button', class: 'btn soft', onclick: () => RU.tts.speak('Здра́вствуйте! Меня́ зову́т А́нна. О́чень прия́тно!') }, RU.icon('volume', 18), ' Nghe thử')),
      row('Tự động đọc', 'Tự phát âm khi hiện chữ / từ mới', toggle('autoplay'))));

    main.append(h('section', { class: 'card settings' }, h('h3', null, '👀 Hiển thị'),
      row('Hiện phiên âm Latinh', 'Ví dụ: привет → privet. Tắt đi khi bạn đã đọc thạo chữ Kirin.', toggle('translit')),
      row('Kiểu phiên âm', '«Kiểu Việt» viết ы thành ư, й thành i — dễ đọc cho người Việt.', seg('scheme', [['vi', 'Kiểu Việt'], ['intl', 'Quốc tế']])),
      row('Hiện dấu trọng âm', 'Dấu ´ cho biết âm tiết cần nhấn mạnh: молоко́', toggle('stress'))));

    main.append(h('section', { class: 'card settings' }, h('h3', null, '🎯 Học tập'),
      row('Mục tiêu mỗi ngày', 'Điểm kinh nghiệm (XP) cần đạt mỗi ngày', seg('goal', [[30, '30'], [50, '50'], [100, '100'], [200, '200']])),
      row('Số từ mới mỗi lần học', null, seg('perSession', [[5, '5'], [8, '8'], [10, '10'], [15, '15']])),
      row('Độ khó chấm chữ viết tay', '«Dễ» không bắt lỗi kích thước chữ hoa / thường', seg('strict', [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']])),
      row('Âm thanh hiệu ứng', 'Tiếng «ting» khi đúng / sai', toggle('sfx'))));

    // ---- Dữ liệu
    const file = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    file.addEventListener('change', () => {
      const f = file.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try { RU.store.importJSON(String(rd.result)); RU.toast('Đã nhập tiến độ thành công!', 'ok'); RU.refresh(); } catch (e) { RU.toast('Không nhập được: ' + e.message, 'bad', 4000); }
      };
      rd.readAsText(f);
    });
    const exportBtn = h('button', { type: 'button', class: 'btn soft', onclick: () => {
      const blob = new Blob([RU.store.exportJSON()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: 'tien-do-hoc-tieng-nga-' + RU.U.dayKey() + '.json' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } }, 'Xuất file');
    const importBtn = h('button', { type: 'button', class: 'btn soft', onclick: () => file.click() }, 'Nhập file');
    const resetBtn = h('button', { type: 'button', class: 'btn bad-soft', onclick: () => {
      const synced = RU.Sync.connected;
      if (window.confirm('Xóa toàn bộ tiến độ học (chữ cái, từ vựng, bài học, XP)? Không thể hoàn tác.'
        + (synced ? '\n\nĐang bật đồng bộ: tiến độ trên Google Drive và trên các máy khác cũng sẽ bị xóa ở lần đồng bộ tới.' : ''))) {
        RU.store.reset();
        RU.toast('Đã xóa tiến độ.', '');
        if (synced) RU.Sync.syncNow({ quiet: true });
        RU.go('home');
      }
    } }, 'Xóa tiến độ');
    main.append(h('section', { class: 'card settings' }, h('h3', null, '💾 Dữ liệu'),
      h('p', { class: 'muted small' }, 'Tiến độ được lưu tự động trong trình duyệt này. Xuất ra file để sao lưu, hoặc chuyển sang máy khác nếu không dùng đồng bộ.'),
      row('Sao lưu tiến độ', null, h('div', { class: 'row gap' }, exportBtn, importBtn, file)),
      row('Bắt đầu lại từ đầu', null, resetBtn)));

    main.append(h('p', { class: 'muted small center' }, 'Tổng XP: ' + (RU.state.total || 0) + ' · '
      + (RU.Sync.connected ? 'Tiến độ lưu trong trình duyệt này và trong Google Drive của bạn.' : 'Tiến độ chỉ lưu trong trình duyệt này, không gửi đi đâu.')));
  });
})(window.RU = window.RU || {});
