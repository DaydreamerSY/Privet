/* =====================================================================
   views/home.js — Trang chủ: mục tiêu ngày, bước tiếp theo, lộ trình
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const ui = RU.ui;

  const TIPS = [
    'Học 10–15 phút mỗi ngày hiệu quả hơn học dồn 2 tiếng một lần.',
    'Luôn đọc to theo giọng mẫu — miệng cũng cần luyện như mắt và tay.',
    'Học từ nào thì nhớ luôn trọng âm của từ đó: trọng âm sai khiến người nghe khó hiểu.',
    'Chữ «ы» rất gần chữ «ư» tiếng Việt — người Việt có lợi thế khi phát âm chữ này!',
    'Tiếng Nga không có mạo từ và bỏ động từ «là» ở thì hiện tại: «Я студе́нт» = Tôi là sinh viên.',
    'Người Nga thường viết tay bằng chữ viết thường nối, trông khác chữ in. Hãy nắm chắc chữ in trước.',
    'Trật tự từ tiếng Nga khá linh hoạt vì đuôi từ đã cho biết vai trò của từ trong câu.',
    'Ôn lại đúng lúc sắp quên (ôn tập ngắt quãng) giúp nhớ từ lâu gấp nhiều lần.',
    'Gặp danh từ mới, hãy để ý giống của nó: đuôi -а / -я thường là giống cái.',
    'Âm «р» rung lưỡi khó? Hãy luyện bằng cách đọc thật nhanh «тр‑тр‑тр», «др‑др‑др».',
    'Chữ «ё» luôn mang trọng âm, nhưng sách báo thường viết thành «е».',
    'Đừng ngại sai! Câu nào bạn làm sai sẽ được hỏi lại ở cuối bài để nhớ lâu hơn.',
    'Bật phụ đề tiếng Nga khi xem phim hoạt hình Nga — cách luyện nghe rất vui.',
    'Viết tay giúp nhớ mặt chữ nhanh hơn chỉ nhìn. Hãy dùng bảng viết thường xuyên.',
  ];

  function greeting() {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 11) return ['До́брое у́тро!', 'Chào buổi sáng!'];
    if (hr >= 11 && hr < 18) return ['До́брый день!', 'Chào buổi chiều!'];
    if (hr >= 18 && hr < 23) return ['До́брый ве́чер!', 'Chào buổi tối!'];
    return ['Приве́т!', 'Xin chào!'];
  }

  function ring(frac) {
    const r = 34; const c = 2 * Math.PI * r;
    const f = U.clamp(frac, 0, 1);
    return RU.s('svg', { viewBox: '0 0 80 80', class: 'ring', width: 92, height: 92 },
      RU.s('circle', { cx: 40, cy: 40, r, class: 'ring-bg' }),
      RU.s('circle', { cx: 40, cy: 40, r, class: 'ring-fg', 'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - f), transform: 'rotate(-90 40 40)' }));
  }

  /* ---------------- lộ trình ---------------- */
  function roadmap() {
    const A = RU.ALPHA;
    const vocab = (id) => {
      const t = RU.VOCAB.topic(id);
      const s = RU.SRS.stats(t.list);
      return { kind: 'vocab', icon: t.icon, label: 'Từ vựng: ' + t.title, href: '#/vocab/topic/' + t.id, done: s.learned / s.total >= 0.8, frac: s.learned / s.total };
    };
    const gram = (id) => {
      const L = RU.GRAMMAR.byId[id];
      const s = RU.state.grammar[id] || {};
      return { kind: 'grammar', icon: '🧱', label: 'Mẫu câu: ' + L.title, href: '#/grammar/lesson/' + id, done: !!s.done, frac: s.done ? 1 : (s.best || 0) / 100 };
    };
    return [
      { t: 'Bảng chữ cái', d: 'Đọc và viết được chữ Kirin', items: A.lessons.map((l) => ({ kind: 'alpha', icon: 'Аа', label: 'Chữ cái — Bài ' + l.id + ': ' + l.title, href: '#/alphabet/lesson/' + l.id, done: RU.alphaHelpers.lessonDone(l.id) })) },
      { t: 'Những câu đầu tiên', d: 'Chào hỏi, giới thiệu «đây là…», «tôi là…»', items: [vocab('greet'), gram('eto'), vocab('pron'), gram('ya')] },
      { t: 'Gia đình & miêu tả', d: 'Giống của danh từ, sở hữu, tính từ', items: [vocab('family'), gram('gender'), gram('moy'), vocab('colors'), vocab('adj'), gram('adj')] },
      { t: 'Hành động', d: 'Chia động từ, phủ định, đặt câu hỏi', items: [vocab('verbs'), gram('verb1'), gram('verb2'), gram('ne'), gram('q')] },
      { t: 'Cuộc sống hằng ngày', d: 'Số đếm, thời gian, «tôi có…», «ở đâu»', items: [vocab('numbers'), vocab('time'), gram('umenya'), vocab('home'), vocab('city'), gram('gde'), vocab('food'), gram('acc'), gram('want')] },
      { t: 'Kể chuyện & giao tiếp', d: 'Quá khứ, tương lai, tuổi tác, đi lại', items: [gram('past'), gram('future'), gram('age'), gram('kuda'), vocab('study'), gram('intro')] },
      { t: 'Mở rộng vốn từ', d: 'Cơ thể, động vật, thời tiết, mua sắm…', items: [vocab('body'), vocab('animals'), vocab('weather'), vocab('shopping'), vocab('words')] },
    ];
  }

  function nextStep(road) {
    const due = RU.SRS.due().length;
    const alphaDone = road[0].items.every((x) => x.done);
    if (alphaDone && due >= 5) return { icon: '🔁', title: 'Ôn tập ' + due + ' từ vựng', desc: 'Những từ này đang đến lúc cần ôn để không bị quên.', href: '#/vocab/review' };
    for (const st of road) {
      const it = st.items.find((x) => !x.done);
      if (it) return { icon: it.icon, title: it.label, desc: st.t + ' — ' + st.d, href: it.href };
    }
    if (due) return { icon: '🔁', title: 'Ôn tập ' + due + ' từ vựng', desc: 'Giữ vững những gì đã học.', href: '#/vocab/review' };
    return { icon: '🏆', title: 'Bạn đã đi hết lộ trình!', desc: 'Hãy ôn tập tổng hợp để nhớ thật lâu.', href: '#/grammar/review' };
  }

  RU.route('home', (ctx) => {
    const main = ctx.main;
    const [hiRu, hiVi] = greeting();
    const xp = RU.todayXp();
    const goal = RU.state.settings.goal || 50;
    const streak = RU.streak();
    const road = roadmap();
    const nx = nextStep(road);
    const alpha = RU.alphaProgress();
    const vs = RU.SRS.stats();
    const gp = RU.grammarProgress();
    const due = RU.SRS.due().length;

    main.append(h('section', { class: 'card hero' },
      h('div', { class: 'hero-text' },
        h('button', { type: 'button', class: 'hero-hi', lang: 'ru', title: 'Nhấn để nghe', onclick: () => RU.tts.speak(hiRu) }, RU.disp(hiRu), ' ', RU.icon('volume', 20)),
        h('h1', null, hiVi + ' Hôm nay mình học gì nhé?'),
        h('p', { class: 'muted' }, streak ? '🔥 Chuỗi ' + streak + ' ngày liên tiếp — giữ vững nhé!' : 'Học mỗi ngày một chút để tạo chuỗi ngày học 🔥')),
      h('div', { class: 'hero-goal' }, h('div', { class: 'ring-wrap' }, ring(xp / goal), h('div', { class: 'ring-txt' }, h('b', null, xp), h('small', null, '/' + goal + ' XP'))),
        h('small', { class: 'muted' }, xp >= goal ? 'Đạt mục tiêu hôm nay! 🎉' : 'Mục tiêu hôm nay'))));

    main.append(ui.voiceNotice(ctx));
    main.append(RU.Sync.notice(ctx));

    main.append(h('a', { class: 'card next-step', href: nx.href },
      h('span', { class: 'ns-ico', lang: 'ru' }, nx.icon),
      h('div', { class: 'ns-info' }, h('small', null, 'Bước tiếp theo'), h('b', null, nx.title), h('span', { class: 'muted' }, nx.desc)),
      h('span', { class: 'btn primary' }, 'Học ngay ', RU.icon('right', 18))));

    main.append(h('div', { class: 'grid sections3' },
      h('a', { class: 'card sec-card s-alpha', href: '#/alphabet' },
        h('div', { class: 'sec-ico', lang: 'ru' }, 'Аа'), h('b', null, 'Bảng chữ cái'),
        h('small', null, 'Mặt chữ, phát âm, luyện viết tay'), ui.progress(alpha.done / alpha.total),
        h('small', { class: 'muted' }, alpha.done + '/' + alpha.total + ' bài · ' + alpha.letters + '/33 chữ đã thuộc')),
      h('a', { class: 'card sec-card s-vocab', href: '#/vocab' },
        h('div', { class: 'sec-ico' }, '📚'), h('b', null, 'Từ vựng'),
        h('small', null, 'Thẻ ghi nhớ & ôn tập ngắt quãng'), ui.progress(vs.learned / vs.total),
        h('small', { class: 'muted' }, vs.learned + '/' + vs.total + ' từ' + (due ? ' · ' + due + ' từ cần ôn' : ''))),
      h('a', { class: 'card sec-card s-gram', href: '#/grammar' },
        h('div', { class: 'sec-ico' }, '🧱'), h('b', null, 'Cấu trúc câu'),
        h('small', null, 'Mẫu câu, xếp câu, điền từ'), ui.progress(gp.done / gp.total),
        h('small', { class: 'muted' }, gp.done + '/' + gp.total + ' bài')),
      h('a', { class: 'card sec-card s-speak', href: '#/speak' },
        h('div', { class: 'sec-ico' }, '🎤'), h('b', null, 'Luyện phát âm'),
        h('small', null, 'Đọc to — máy nghe và chấm điểm'), ui.progress(Object.keys(RU.state.speak || {}).length / 60),
        h('small', { class: 'muted' }, Object.keys(RU.state.speak || {}).length + ' từ / câu đã luyện'))));

    // Lộ trình
    const curIdx = road.findIndex((st) => st.items.some((x) => !x.done));
    const roadEl = h('div', { class: 'road' });
    road.forEach((st, i) => {
      const doneN = st.items.filter((x) => x.done).length;
      const all = doneN === st.items.length;
      roadEl.append(h('details', { class: 'card road-stage' + (all ? ' done' : '') + (i === curIdx ? ' current' : ''), open: i === curIdx },
        h('summary', null,
          h('span', { class: 'road-num' }, all ? '✓' : i + 1),
          h('div', { class: 'road-info' }, h('b', null, st.t), h('small', null, st.d)),
          h('span', { class: 'chip' }, doneN + '/' + st.items.length)),
        h('div', { class: 'road-items' }, st.items.map((it) => h('a', { class: 'road-item' + (it.done ? ' done' : ''), href: it.href },
          h('span', { class: 'ri-check' }, it.done ? '✓' : ''), h('span', { class: 'ri-ico', lang: 'ru' }, it.icon), h('span', null, it.label))))));
    });
    main.append(h('section', { class: 'section' }, h('h2', null, 'Lộ trình cho người mới bắt đầu'), roadEl));

    // Câu & mẹo của ngày
    const dayIdx = U.hash(U.dayKey());
    const phrases = RU.VOCAB.topic('greet').list;
    const ph = phrases[dayIdx % phrases.length];
    main.append(h('div', { class: 'grid two' },
      h('div', { class: 'card daily' }, h('small', { class: 'muted' }, 'Câu nói của ngày'),
        h('div', { class: 'daily-ru' }, ui.speak(ph.ru), ui.ru(ph.ru, { speak: true, cls: 'lg' })), ui.tr(ph.ru), h('div', null, ph.vi),
        ph.note ? h('small', { class: 'muted' }, ph.note) : null),
      h('div', { class: 'card daily' }, h('small', { class: 'muted' }, 'Mẹo học'), h('p', null, '💡 ', ui.rich(TIPS[dayIdx % TIPS.length])))));
  });
})(window.RU = window.RU || {});
