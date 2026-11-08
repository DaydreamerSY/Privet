/* =====================================================================
   views/grammar.js — Cấu trúc câu: danh sách bài, nội dung bài, luyện tập
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const ui = RU.ui;
  const G = RU.GRAMMAR;

  const gs = (id) => RU.state.grammar[id] || (RU.state.grammar[id] = { seen: false, best: 0, done: false });
  RU.grammarProgress = () => ({ done: G.filter((l) => RU.state.grammar[l.id] && RU.state.grammar[l.id].done).length, total: G.length });

  const hasRu = (s) => /[а-яё]/i.test(s);

  /* ======================= Tạo bài tập ======================= */
  function gapPrompt(q, vi) {
    const parts = q.split('___');
    const line = h('div', { class: 'gap-line', lang: 'ru' });
    parts.forEach((p, i) => {
      if (i) line.append(h('span', { class: 'blank' }, '   '));
      if (p) line.append(RU.disp(p));
    });
    return h('div', { class: 'gap-sentence' }, line, h('div', { class: 'q-vi' }, vi));
  }

  function genderRule(w) {
    const last = U.stripStress(w.ru).toLowerCase().slice(-1);
    const guess = 'бвгджзйклмнпрстфхцчшщ'.includes(last) ? 'm' : 'ая'.includes(last) ? 'f' : 'оеё'.includes(last) ? 'n' : null;
    const gName = { m: 'giống đực', f: 'giống cái', n: 'giống trung' };
    if (last === 'ь') return 'Tận cùng bằng -ь → phải học thuộc: «' + U.stripStress(w.ru) + '» là ' + gName[w.g] + '.';
    if (guess === w.g) return 'Tận cùng bằng «' + last + '» → ' + gName[w.g] + '.';
    return 'Ngoại lệ! ' + (w.note || '«' + U.stripStress(w.ru) + '» là ' + gName[w.g] + '.');
  }

  function lessonQuestions(L) {
    const qs = [];
    L.drills.forEach((d) => {
      if (d.t === 'c') {
        const correct = d.o[0];
        const full = d.q.replace('___', correct);
        qs.push({
          type: 'mc', label: 'Chọn từ thích hợp điền vào chỗ trống',
          prompt: gapPrompt(d.q, d.vi),
          options: d.o.map((o, i) => ({ label: h('span', { lang: 'ru' }, RU.disp(o)), correct: i === 0, ru: true })),
          sayAfter: full,
          answer: () => ui.ru(correct),
          explain: () => h('div', null, h('div', null, ui.ru(full, { speak: true }), ' ', ui.tr(full)), d.why ? h('div', { class: 'muted' }, '💡 ' + d.why) : null),
        });
      } else if (d.t === 'o') {
        qs.push({
          type: 'order', vi: d.vi, tokens: RU.tokenize(d.ru),
          extra: (d.x || []).map((x) => RU.tokenize(x)[0]).filter(Boolean),
          sayAfter: d.ru, answer: () => ui.ru(d.ru),
          explain: () => h('div', null, ui.ru(d.ru, { speak: true }), ' ', ui.tr(d.ru)),
        });
      }
    });
    const ex = L.ex;
    if (ex.length >= 4) {
      U.sample(ex, 2).forEach((e) => {
        const others = U.shuffle(ex.filter((x) => x !== e)).slice(0, 3);
        qs.push({
          type: 'mc', label: 'Chọn câu tiếng Nga đúng nghĩa', prompt: h('span', null, e.vi),
          options: [{ label: h('span', { lang: 'ru' }, RU.disp(e.ru)), correct: true, ru: true }].concat(others.map((o) => ({ label: h('span', { lang: 'ru' }, RU.disp(o.ru)), ru: true }))),
          sayAfter: e.ru, answer: () => ui.ru(e.ru),
        });
      });
      U.sample(ex, 2).forEach((e) => {
        const others = U.shuffle(ex.filter((x) => x !== e)).slice(0, 3);
        qs.push({
          type: 'mc', label: 'Câu này nghĩa là gì?', prompt: h('div', null, ui.ru(e.ru, { cls: 'lg' }), ui.tr(e.ru)), speak: e.ru,
          options: [{ label: e.vi, correct: true }].concat(others.map((o) => ({ label: o.vi }))),
          answer: e.vi,
        });
      });
    }
    if (L.auto === 'gender') {
      const nouns = RU.VOCAB.all.filter((w) => ['m', 'f', 'n'].includes(w.g) && !/\s/.test(w.ru));
      U.sample(nouns, 4).forEach((w) => {
        qs.push({
          type: 'mc', label: 'Danh từ này thuộc giống nào?', keepOrder: true,
          prompt: h('div', { class: 'word-prompt' }, ui.ru(w.ru, { cls: 'xl' }), h('div', { class: 'muted' }, w.vi)), speak: w.ru, autoplay: false,
          options: [['m', 'Giống đực (он)'], ['f', 'Giống cái (она́)'], ['n', 'Giống trung (оно́)']].map(([g, label]) => ({ label, correct: g === w.g })),
          explain: genderRule(w),
        });
      });
    }
    return U.shuffle(qs);
  }

  /* ======================= Danh sách bài ======================= */
  RU.route('grammar', (ctx) => {
    const main = ctx.main;
    const p = RU.grammarProgress();
    main.append(ui.header('Cấu trúc câu', { icon: '🧱', sub: G.length + ' bài mẫu câu cơ bản, đi từ dễ đến khó. Mỗi bài có giải thích ngắn bằng tiếng Việt, câu ví dụ có giọng đọc và bài tập xếp câu, điền từ. Đã hoàn thành ' + p.done + '/' + p.total + ' bài.' }), ui.voiceNotice(ctx));
    if (p.done >= 2) main.append(h('a', { class: 'card banner primary', href: '#/grammar/review' }, h('span', { class: 'banner-ico' }, '🔁'), h('div', null, h('b', null, 'Ôn tập tổng hợp'), h('small', null, 'Bài tập trộn từ các bài đã học')), RU.icon('right')));
    const list = h('div', { class: 'grammar-list' });
    G.forEach((L) => {
      const s = RU.state.grammar[L.id] || {};
      list.append(h('a', { class: 'card g-card' + (s.done ? ' done' : s.seen ? ' seen' : ''), href: '#/grammar/lesson/' + L.id },
        h('div', { class: 'lesson-num' }, s.done ? '✓' : L.n),
        h('div', { class: 'g-info' }, h('b', null, L.title), h('small', null, L.goal), ui.pattern(L.patterns[0])),
        s.best ? h('span', { class: 'chip' }, s.best + '%') : null));
    });
    main.append(list);
  });

  /* ======================= Nội dung bài ======================= */
  function table(t) {
    return h('div', { class: 'table-wrap' },
      t.title ? h('div', { class: 'table-title' }, t.title) : null,
      h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, t.head.map((c) => h('th', null, c)))),
        h('tbody', null, t.rows.map((r) => h('tr', null, r.map((c) => h('td', null, hasRu(c) ? ui.ru(c, { speak: true }) : c)))))));
  }

  RU.route('grammar/lesson/:id', (ctx) => {
    const L = G.byId[ctx.params.id];
    if (!L) return RU.go('grammar');
    const s = gs(L.id);
    s.seen = true;
    RU.store.save();
    const main = ctx.main;
    const idx = G.indexOf(L);
    const prev = G[idx - 1]; const next = G[idx + 1];
    main.append(ui.header('Bài ' + L.n + '. ' + L.title, { back: '#/grammar', backLabel: 'Cấu trúc câu', sub: L.goal }));

    main.append(h('div', { class: 'card pattern-card' }, h('div', { class: 'pc-label' }, 'Mẫu câu'), L.patterns.map((p) => ui.pattern(p))));
    main.append(h('div', { class: 'card points' }, h('h3', null, 'Giải thích'), h('ul', null, L.points.map((p) => h('li', null, ui.rich(p))))));
    (L.tables || []).forEach((t) => main.append(h('div', { class: 'card' }, table(t))));
    (L.tips || []).forEach((t) => main.append(h('div', { class: 'callout' }, '💡 ', ui.rich(t))));

    const exList = h('div', { class: 'card examples' }, h('div', { class: 'section-head' }, h('h3', null, 'Câu ví dụ'),
      h('div', { class: 'row gap' },
        h('button', { type: 'button', class: 'btn ghost sm', onclick: () => playAll() }, RU.icon('play', 14), ' Nghe tất cả'),
        h('a', { class: 'btn soft sm', href: '#/speak/grammar/' + L.id + '?from=lesson' }, RU.icon('mic', 14), ' Luyện nói các câu này'))));
    L.ex.forEach((e) => exList.append(h('div', { class: 'ex-sent' }, ui.speak(e.ru),
      h('div', null, ui.ru(e.ru, { speak: true, cls: 'ex-ru' }), ui.tr(e.ru), h('div', { class: 'ex-vi' }, e.vi)))));
    main.append(exList);
    let playing = false;
    function playAll() {
      if (playing) { playing = false; RU.tts.stop(); return; }
      playing = true;
      let i = 0;
      const step = () => { if (!playing || i >= L.ex.length) { playing = false; return; } RU.tts.speak(L.ex[i++].ru, { onend: () => setTimeout(step, 450) }); };
      step();
    }
    ctx.onCleanup(() => { playing = false; });

    const n = L.drills.length + 4 + (L.auto ? 4 : 0);
    main.append(h('div', { class: 'card banner primary' },
      h('span', { class: 'banner-ico' }, '✏️'),
      h('div', null, h('b', null, 'Luyện tập bài ' + L.n), h('small', null, 'Khoảng ' + n + ' câu · cần đạt 70% để hoàn thành' + (s.best ? ' · tốt nhất: ' + s.best + '%' : ''))),
      h('a', { class: 'btn primary', href: '#/grammar/practice/' + L.id }, 'Bắt đầu')));
    main.append(h('div', { class: 'flow-nav' },
      prev ? h('a', { class: 'btn ghost', href: '#/grammar/lesson/' + prev.id }, RU.icon('left', 18), ' Bài ' + prev.n) : h('span'),
      next ? h('a', { class: 'btn ghost', href: '#/grammar/lesson/' + next.id }, 'Bài ' + next.n + ' ', RU.icon('right', 18)) : h('span')));
  });

  /* ======================= Luyện tập ======================= */
  RU.route('grammar/practice/:id', (ctx) => {
    const L = G.byId[ctx.params.id];
    if (!L) return RU.go('grammar');
    const gen = () => lessonQuestions(L);
    RU.mountQuiz(ctx, gen(), {
      title: 'Luyện tập · Bài ' + L.n, regenerate: gen, xp: 3,
      onExit: () => RU.go('grammar/lesson/' + L.id), exitLabel: 'Về bài học',
      onFinish: (r) => {
        const s = gs(L.id);
        s.best = Math.max(s.best || 0, r.pct);
        if (r.pct >= 70 && !s.done) { s.done = true; RU.addXp(20); }
        RU.store.save();
        const next = G[G.indexOf(L) + 1];
        if (r.pct >= 70 && next) return h('a', { class: 'btn soft', href: '#/grammar/lesson/' + next.id }, 'Bài tiếp theo: ' + next.title);
        if (r.pct < 70) return h('p', null, 'Cần đạt 70% để hoàn thành bài. Hãy đọc lại phần giải thích rồi thử lại nhé!');
        return null;
      },
    });
  });

  RU.route('grammar/review', (ctx) => {
    const done = G.filter((l) => RU.state.grammar[l.id] && RU.state.grammar[l.id].done);
    const base = done.length ? done : G.slice(0, 3);
    const gen = () => {
      let all = [];
      base.forEach((l) => { all = all.concat(lessonQuestions(l)); });
      return U.shuffle(all).slice(0, 14);
    };
    RU.mountQuiz(ctx, gen(), { title: 'Ôn tập cấu trúc câu', regenerate: gen, xp: 3, onExit: () => RU.go('grammar') });
  });
})(window.RU = window.RU || {});
