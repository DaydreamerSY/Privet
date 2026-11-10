/* =====================================================================
   views/vocab.js — Từ vựng: chủ đề, học từ mới, ôn tập ngắt quãng (SRS),
   thẻ ghi nhớ, ghép cặp, tìm kiếm
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const ui = RU.ui;
  const V = RU.VOCAB;

  /* ======================= Ôn tập ngắt quãng (Leitner) ======================= */
  const DAY = 86400000;
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // số ngày chờ theo "hộp"
  const SRS = RU.SRS = {
    get: (id) => RU.state.words[id],
    level: (id) => (RU.state.words[id] ? RU.state.words[id].b || 0 : 0),
    learned: (id) => SRS.level(id) > 0,
    learn(id, shaky) {
      const now = Date.now();
      const w = RU.state.words[id] || (RU.state.words[id] = { b: 0, r: 0, w: 0 });
      if (!w.b) { w.b = 1; w.due = shaky ? now + 10 * 60 * 1000 : U.startOfDay(now + DAY); w.last = now; }
      RU.store.save();
    },
    grade(id, ok) {
      const now = Date.now();
      const w = RU.state.words[id] || (RU.state.words[id] = { b: 0, r: 0, w: 0, due: now });
      if (ok) {
        w.r++;
        if (!w.b) { w.b = 1; w.due = U.startOfDay(now + DAY); }
        else if ((w.due || 0) <= now) { w.b = Math.min(6, w.b + 1); w.due = U.startOfDay(now + INTERVALS[w.b] * DAY); }
      } else {
        w.w++;
        w.b = 1;
        w.due = now + 10 * 60 * 1000;
      }
      w.last = now;
      RU.store.save();
    },
    forget(id) { const w = RU.state.words[id] || (RU.state.words[id] = { b: 0, r: 0, w: 0 }); w.b = 1; w.due = Date.now(); w.last = Date.now(); RU.store.save(); },
    due() {
      const now = Date.now();
      return V.all.filter((w) => { const s = RU.state.words[w.id]; return s && s.b > 0 && (s.due || 0) <= now; });
    },
    stats(list) {
      list = list || V.all;
      let learned = 0; let mastered = 0;
      for (const w of list) { const b = SRS.level(w.id); if (b > 0) learned++; if (b >= 4) mastered++; }
      return { learned, mastered, total: list.length };
    },
  };

  /* ======================= Tạo câu hỏi ======================= */
  function distractors(word, n) {
    const topic = (V.topic(word.topic) || { list: [] }).list;
    const ok = (w) => w.id !== word.id && w.vi !== word.vi;
    let res = U.shuffle(topic.filter(ok)).slice(0, n);
    if (res.length < n) res = res.concat(U.shuffle(V.all.filter((w) => ok(w) && !res.includes(w))).slice(0, n - res.length));
    return res;
  }
  const ruLabel = (w) => h('span', { class: 'ru', lang: 'ru' }, RU.disp(w.ru));
  const explainWord = (w) => () => h('span', null, ui.ru(w.ru), ' ', ui.tr(w.ru), ' = ', h('b', null, w.vi), w.note ? h('div', { class: 'muted small' }, w.note) : null);

  const Q = {
    ruVi(w, onResult) {
      return {
        type: 'mc', label: 'Từ này nghĩa là gì?', big: true,
        prompt: h('div', { class: 'word-prompt' }, ui.ru(w.ru, { cls: 'xl' }), ui.tr(w.ru), ui.gender(w.g)),
        speak: w.ru, autoplay: !!RU.state.settings.autoplay,
        options: [{ label: w.vi, correct: true }].concat(distractors(w, 3).map((d) => ({ label: d.vi }))),
        answer: w.vi, onResult,
      };
    },
    viRu(w, onResult) {
      return {
        type: 'mc', label: 'Chọn từ tiếng Nga đúng', big: true, prompt: h('span', null, w.vi),
        options: [{ label: ruLabel(w), correct: true, ru: true }].concat(distractors(w, 3).map((d) => ({ label: ruLabel(d), ru: true }))),
        sayAfter: w.ru, explain: explainWord(w), onResult,
      };
    },
    listen(w, onResult) {
      return {
        type: 'mc', label: 'Nghe và chọn nghĩa đúng', speak: w.ru, audioOnly: true,
        options: [{ label: w.vi, correct: true }].concat(distractors(w, 3).map((d) => ({ label: d.vi }))),
        explain: explainWord(w), onResult,
      };
    },
    listenRu(w, onResult) {
      return {
        type: 'mc', label: 'Nghe và chọn từ bạn nghe được', speak: w.ru, audioOnly: true,
        options: [{ label: ruLabel(w), correct: true, ru: true }].concat(distractors(w, 3).map((d) => ({ label: ruLabel(d), ru: true }))),
        explain: explainWord(w), onResult,
      };
    },
    type(w, onResult) {
      const answers = V.all.filter((x) => x.vi === w.vi).map((x) => x.ru);
      return {
        type: 'type', label: 'Viết từ này bằng tiếng Nga', big: true, prompt: h('span', null, w.vi, w.g ? h('span', { class: 'muted small' }, '  (giống ' + ({ m: 'đực', f: 'cái', n: 'trung', pl: 'số nhiều' })[w.g] + ')') : null),
        answers, answer: () => h('span', null, ui.ru(w.ru), ' ', ui.tr(w.ru, true)), sayAfter: w.ru, onResult,
      };
    },
    match(words) {
      return { type: 'match', pairs: words.map((w) => ({ a: w.ru, b: w.vi, speak: w.ru })) };
    },
  };
  RU.vocabQ = Q;

  /* ======================= Thành phần ======================= */
  function levelDots(id) {
    const b = SRS.level(id);
    return h('span', { class: 'lvl', title: b ? 'Mức ' + b + '/6' : 'Chưa học' }, U.range(6).map((i) => h('i', { class: i < b ? 'on' : '' })));
  }
  function wordRow(w) {
    const note = w.note ? h('div', { class: 'w-note' }, '💡 ', w.note) : null;
    return h('div', { class: 'word-row' + (SRS.learned(w.id) ? ' learned' : '') },
      ui.speak(w.ru),
      h('div', { class: 'w-main' }, h('div', null, ui.ru(w.ru, { speak: true, cls: 'w-ru' }), ' ', ui.gender(w.g)), ui.tr(w.ru)),
      h('div', { class: 'w-vi' }, w.vi, note),
      levelDots(w.id));
  }
  function wordCard(w) {
    return h('div', { class: 'card word-card' },
      h('div', { class: 'wc-ru', title: 'Nhấn để nghe', onclick: () => RU.tts.speak(w.ru) }, ui.ruStress(w.ru)),
      ui.tr(w.ru),
      ui.phonetic(w.ru),
      h('div', { class: 'wc-audio' }, ui.speakPair(w.ru)),
      h('div', { class: 'wc-vi' }, w.vi),
      w.g ? h('div', null, ui.gender(w.g), ' ', h('span', { class: 'muted small' }, w.g === 'pl' ? 'danh từ chỉ có số nhiều' : 'danh từ giống ' + ({ m: 'đực', f: 'cái', n: 'trung' })[w.g])) : null,
      w.note ? h('div', { class: 'callout' }, '💡 ', w.note) : null);
  }

  /* ======================= Danh sách chủ đề ======================= */
  RU.route('vocab', (ctx) => {
    const main = ctx.main;
    const st = SRS.stats();
    const due = SRS.due().length;
    main.append(ui.header('Từ vựng', { icon: '📚', sub: V.all.length + ' từ thông dụng chia theo ' + V.topics.length + ' chủ đề. Học từ mới, rồi ôn lại đúng lúc sắp quên (ôn tập ngắt quãng).' }), ui.voiceNotice(ctx));

    main.append(h('div', { class: 'grid stats3' },
      h('div', { class: 'card stat' }, h('b', null, st.learned), h('span', null, 'từ đã học')),
      h('div', { class: 'card stat' }, h('b', null, st.mastered), h('span', null, 'từ đã thuộc')),
      h('a', { class: 'card stat link' + (due ? ' hot' : ''), href: '#/vocab/review' }, h('b', null, due), h('span', null, 'từ cần ôn hôm nay'))));

    if (due) {
      main.append(h('a', { class: 'card banner primary', href: '#/vocab/review' }, h('span', { class: 'banner-ico' }, '🔁'),
        h('div', null, h('b', null, 'Ôn tập ' + due + ' từ'), h('small', null, 'Ôn đúng lúc giúp nhớ lâu gấp nhiều lần')), RU.icon('right')));
    }

    const results = h('div', { class: 'search-results' });
    const input = h('input', { type: 'search', class: 'search', placeholder: 'Tìm từ (tiếng Việt hoặc tiếng Nga)…', 'aria-label': 'Tìm từ' });
    input.addEventListener('input', U.debounce(() => {
      const q = input.value.trim();
      results.innerHTML = '';
      if (!q) return;
      const qv = U.normVi(q); const qr = U.normRu(q);
      const found = V.all.filter((w) => U.normVi(w.vi).includes(qv) || U.normRu(w.ru).includes(qr) || U.normVi(RU.translit(w.ru, 'intl')).includes(qv)).slice(0, 30);
      if (!found.length) results.append(ui.empty('Không tìm thấy từ nào.'));
      found.forEach((w) => results.append(wordRow(w)));
    }, 150));
    main.append(h('div', { class: 'search-box' }, RU.icon('search'), input), results);

    const grid = h('div', { class: 'grid topics' });
    V.topics.forEach((t) => {
      const s = SRS.stats(t.list);
      grid.append(h('a', { class: 'card topic-card' + (s.learned === s.total ? ' done' : ''), href: '#/vocab/topic/' + t.id },
        h('span', { class: 'topic-ico' }, t.icon),
        h('div', { class: 'topic-info' }, h('b', null, t.title), h('small', null, t.desc),
          ui.progress(s.learned / s.total), h('small', { class: 'muted' }, s.learned + '/' + s.total + ' từ đã học'))));
    });
    main.append(h('section', { class: 'section' }, h('h2', null, 'Chủ đề'), grid));
  });

  /* ======================= Trang chủ đề ======================= */
  RU.route('vocab/topic/:id', (ctx) => {
    const t = V.topic(ctx.params.id);
    if (!t) return RU.go('vocab');
    const main = ctx.main;
    const s = SRS.stats(t.list);
    const fresh = t.list.filter((w) => !SRS.learned(w.id)).length;
    main.append(ui.header(t.title, { icon: t.icon, back: '#/vocab', backLabel: 'Từ vựng', sub: s.learned + '/' + s.total + ' từ đã học · ' + s.mastered + ' từ đã thuộc' }));
    main.append(h('div', { class: 'grid actions' },
      h('a', { class: 'card action primary', href: '#/vocab/learn/' + t.id }, h('span', { class: 'action-ico' }, '🌱'), h('b', null, fresh ? 'Học từ mới' : 'Học lại'), h('small', null, fresh ? fresh + ' từ chưa học' : 'Đã học hết — ôn lại một lượt')),
      h('a', { class: 'card action', href: '#/vocab/practice/' + t.id }, h('span', { class: 'action-ico' }, '🎯'), h('b', null, 'Luyện tập'), h('small', null, 'Trắc nghiệm, nghe, gõ chữ')),
      (() => {
        const tr = RU.Test.result('v:' + t.id);
        return h('a', { class: 'card action' + (tr && tr.pass ? ' done' : ''), href: '#/vocab/test/' + t.id }, h('span', { class: 'action-ico' }, '📝'), h('b', null, 'Kiểm tra'),
          h('small', null, tr && tr.n ? 'Tốt nhất ' + tr.best + '%' + (tr.pass ? ' ✓' : '') + ' · gồm cả từ đã học trước' : 'Chủ đề này + từ đã học trước, khó dần'));
      })(),
      h('a', { class: 'card action', href: '#/vocab/match/' + t.id }, h('span', { class: 'action-ico' }, '🧩'), h('b', null, 'Ghép cặp'), h('small', null, 'Trò chơi nối từ nhanh')),
      h('a', { class: 'card action', href: '#/vocab/cards/' + t.id }, h('span', { class: 'action-ico' }, '🃏'), h('b', null, 'Thẻ ghi nhớ'), h('small', null, 'Lật thẻ tự kiểm tra')),
      h('a', { class: 'card action', href: '#/speak/vocab/' + t.id + '?from=topic' }, h('span', { class: 'action-ico' }, '🎤'), h('b', null, 'Luyện phát âm'), h('small', null, 'Đọc to, máy nghe & chấm'))));
    const list = h('div', { class: 'word-list card' });
    t.list.forEach((w) => list.append(wordRow(w)));
    main.append(h('section', { class: 'section' }, h('h2', null, 'Danh sách từ'), list));
  });

  /* ======================= Học từ mới ======================= */
  RU.route('vocab/learn/:id', (ctx) => {
    const t = V.topic(ctx.params.id);
    if (!t) return RU.go('vocab');
    const n = RU.state.settings.perSession || 8;
    let words = t.list.filter((w) => !SRS.learned(w.id)).slice(0, n);
    const review = !words.length;
    if (review) words = U.sample(t.list, Math.min(n, t.list.length));
    const main = ctx.main;
    let pos = 0;
    const wrap = h('div', { class: 'flow' });
    main.append(ui.header((review ? 'Học lại · ' : 'Từ mới · ') + t.title, { icon: t.icon, back: '#/vocab/topic/' + t.id, backLabel: t.title }), wrap);

    const startQuiz = () => {
      main.innerHTML = '';
      const wrong = new Set();
      const mk = (fn, w) => fn(w, (ok) => { if (!ok) wrong.add(w.id); });
      const r1 = U.shuffle(words).map((w) => mk(Q.ruVi, w));
      const r2 = U.shuffle(words).map((w, i) => mk(i % 2 ? Q.viRu : Q.listen, w));
      const r3 = [Q.match(U.sample(words, Math.min(5, words.length)))].concat(U.sample(words, Math.min(2, words.length)).map((w) => mk(Q.type, w)));
      RU.mountQuiz(ctx, r1.concat(r2, r3), {
        title: 'Luyện tập từ mới', xp: 2,
        onExit: () => RU.go('vocab/topic/' + t.id), exitLabel: 'Về chủ đề',
        onFinish: () => {
          words.forEach((w) => SRS.learn(w.id, wrong.has(w.id)));
          RU.addXp(5);
          const more = t.list.filter((w) => !SRS.learned(w.id)).length;
          return h('div', null,
            h('p', null, review ? 'Đã ôn lại ' + words.length + ' từ.' : 'Đã thêm ' + words.length + ' từ vào lịch ôn tập. Ngày mai hãy quay lại ôn nhé!'),
            more ? h('a', { class: 'btn soft', href: '#/vocab/learn/' + t.id, onclick: (e) => { e.preventDefault(); RU.refresh(); } }, 'Học tiếp ' + Math.min(more, n) + ' từ mới')
              : h('a', { class: 'btn soft', href: '#/vocab/test/' + t.id }, '📝 Làm bài kiểm tra chủ đề'));
        },
      });
    };

    const render = () => {
      const w = words[pos];
      wrap.innerHTML = '';
      const last = pos === words.length - 1;
      wrap.append(
        h('div', { class: 'dots' }, words.map((_, i) => h('i', { class: i === pos ? 'on' : i < pos ? 'done' : '' }))),
        wordCard(w),
        h('div', { class: 'flow-nav' },
          h('button', { type: 'button', class: 'btn ghost', disabled: pos === 0, onclick: () => { pos--; render(); } }, RU.icon('left', 18), ' Trước'),
          h('button', { type: 'button', class: 'btn primary', onclick: () => { if (last) startQuiz(); else { pos++; render(); } } }, last ? 'Bắt đầu luyện tập' : 'Tiếp', ' ', RU.icon('right', 18))));
      if (RU.state.settings.autoplay) setTimeout(() => RU.tts.speak(w.ru), 250);
    };
    RU.onKey(ctx, (e) => {
      const btn = wrap.querySelector('.flow-nav .btn.primary');
      if (!btn) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); btn.click(); }
      if (e.key === 'ArrowLeft' && pos > 0) { pos--; render(); }
    });
    render();
  });

  /* ======================= Luyện tập chủ đề ======================= */
  function practiceSet(list, count) {
    const pool = U.shuffle(list).slice(0, count);
    const kinds = [Q.ruVi, Q.viRu, Q.listen, Q.listenRu, Q.type];
    return pool.map((w, i) => kinds[i % kinds.length](w, (ok) => SRS.grade(w.id, ok)));
  }
  RU.route('vocab/practice/:id', (ctx) => {
    const t = V.topic(ctx.params.id);
    if (!t) return RU.go('vocab');
    const learned = t.list.filter((w) => SRS.learned(w.id));
    const base = learned.length >= 4 ? learned : t.list;
    const gen = () => U.shuffle(practiceSet(base, 12));
    RU.mountQuiz(ctx, gen(), { title: 'Luyện tập · ' + t.title, regenerate: gen, onExit: () => RU.go('vocab/topic/' + t.id) });
  });

  /* ======================= Kiểm tra tổng hợp ======================= */
  /** Từ của chủ đề này (đã học) + từ đã học ở các chủ đề khác; mỗi từ có 4 mức khó */
  function vocabTestCands(t) {
    const learned = (w) => SRS.learned(w.id);
    const grade = (w) => (ok) => { if (SRS.learned(w.id)) SRS.grade(w.id, ok); }; // chỉ tính vào lịch ôn những từ đã học
    const fromTopic = (tp) => ({ label: tp.icon + ' ' + tp.title, href: '#/vocab/topic/' + tp.id });
    const cands = (w, from) => [
      { d: 1, key: w.id, from, make: () => Q.ruVi(w, grade(w)) },     // nhìn chữ Nga (có giọng đọc) → chọn nghĩa
      { d: 2, key: w.id, from, make: () => Q.viRu(w, grade(w)) },     // nghĩa → chọn từ tiếng Nga
      { d: 2, key: w.id, from, make: () => Q.listenRu(w, grade(w)) }, // nghe → chọn từ tiếng Nga
      { d: 3, key: w.id, from, make: () => Q.listen(w, grade(w)) },   // chỉ nghe → chọn nghĩa
      { d: 4, key: w.id, from, make: () => Q.type(w, grade(w)) },     // nghĩa → tự gõ từ tiếng Nga
    ];
    const known = t.list.filter(learned);
    const cur = [];
    (known.length >= 4 ? known : t.list).forEach((w) => cur.push(...cands(w, fromTopic(t))));
    const prev = [];
    V.topics.forEach((tp) => { if (tp.id !== t.id) tp.list.filter(learned).forEach((w) => prev.push(...cands(w, fromTopic(tp)))); });
    return { cur, prev };
  }
  RU.route('vocab/test/:id', (ctx) => {
    const t = V.topic(ctx.params.id);
    if (!t) return RU.go('vocab');
    const idx = V.topics.indexOf(t);
    const next = V.topics[idx + 1];
    RU.Test.run(ctx, {
      key: 'v:' + t.id,
      title: 'Kiểm tra · ' + t.title,
      count: 12,
      level: idx / Math.max(1, V.topics.length - 1),
      cands: () => vocabTestCands(t),
      back: { href: '#/vocab/topic/' + t.id, label: 'Về chủ đề' },
      next: next ? { href: '#/vocab/topic/' + next.id, label: 'Chủ đề tiếp: ' + next.title } : { href: '#/vocab', label: 'Về danh sách chủ đề' },
    });
  });

  /* ======================= Ôn tập đến hạn ======================= */
  RU.route('vocab/review', (ctx) => {
    const due = U.shuffle(SRS.due()).slice(0, 20);
    if (!due.length) {
      const main = ctx.main;
      main.append(ui.header('Ôn tập', { icon: '🔁', back: '#/vocab', backLabel: 'Từ vựng' }));
      const st = SRS.stats();
      main.append(h('div', { class: 'card center-card' },
        h('div', { class: 'big-emoji' }, st.learned ? '✅' : '🌱'),
        h('h2', null, st.learned ? 'Không có từ nào cần ôn lúc này!' : 'Bạn chưa học từ nào'),
        h('p', { class: 'muted' }, st.learned ? 'Bạn đã ôn hết. Hãy học thêm từ mới hoặc quay lại vào ngày mai.' : 'Hãy chọn một chủ đề và bắt đầu học từ mới nhé.'),
        h('a', { class: 'btn primary', href: '#/vocab' }, 'Chọn chủ đề')));
      return;
    }
    const qs = due.map((w) => {
      const b = SRS.level(w.id);
      const fn = b <= 1 ? Q.ruVi : b === 2 ? Q.listen : b === 3 ? Q.viRu : Q.type;
      return fn(w, (ok) => SRS.grade(w.id, ok));
    });
    RU.mountQuiz(ctx, qs, {
      title: 'Ôn tập từ vựng', xp: 3,
      onExit: () => RU.go('vocab'),
      regenerate: () => U.shuffle(SRS.due()).slice(0, 20).map((w) => Q.ruVi(w, (ok) => SRS.grade(w.id, ok))),
      onFinish: () => { const left = SRS.due().length; return h('p', null, left ? 'Còn ' + left + ' từ cần ôn (những từ vừa trả lời sai sẽ quay lại sau ít phút).' : 'Đã ôn xong hôm nay! 🎉'); },
    });
  });

  /* ======================= Ghép cặp ======================= */
  RU.route('vocab/match/:id', (ctx) => {
    const t = V.topic(ctx.params.id);
    if (!t) return RU.go('vocab');
    const learned = t.list.filter((w) => SRS.learned(w.id));
    const base = learned.length >= 6 ? learned : t.list;
    const gen = () => [Q.match(U.sample(base, Math.min(6, base.length))), Q.match(U.sample(base, Math.min(6, base.length)))];
    RU.mountQuiz(ctx, gen(), { title: 'Ghép cặp · ' + t.title, regenerate: gen, xp: 5, onExit: () => RU.go('vocab/topic/' + t.id) });
  });

  /* ======================= Thẻ ghi nhớ ======================= */
  RU.route('vocab/cards/:id', (ctx) => {
    const t = V.topic(ctx.params.id);
    if (!t) return RU.go('vocab');
    const main = ctx.main;
    let deck = U.shuffle(t.list);
    let pos = 0; let flipped = false; let dir = 'ru';
    main.append(ui.header('Thẻ ghi nhớ · ' + t.title, { icon: t.icon, back: '#/vocab/topic/' + t.id, backLabel: t.title }));
    const dirSeg = h('div', { class: 'seg' },
      h('button', { type: 'button', class: 'on', onclick: (e) => setDir('ru', e.target) }, 'Nga → Việt'),
      h('button', { type: 'button', onclick: (e) => setDir('vi', e.target) }, 'Việt → Nga'));
    const holder = h('div', { class: 'flash-holder' });
    const counter = h('div', { class: 'muted center' });
    const btns = h('div', { class: 'flow-nav' });
    main.append(h('div', { class: 'row center' }, dirSeg), holder, counter, btns,
      h('p', { class: 'muted small center' }, 'Nhấn vào thẻ (hoặc phím cách) để lật · ← → để chuyển thẻ'));

    function setDir(d, el) { dir = d; dirSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); flipped = false; render(); }
    function go(d) { pos = (pos + d + deck.length) % deck.length; flipped = false; render(); }
    function render() {
      const w = deck[pos];
      const front = dir === 'ru'
        ? h('div', { class: 'face front' }, ui.ru(w.ru, { cls: 'xl' }), ui.tr(w.ru), ui.gender(w.g))
        : h('div', { class: 'face front' }, h('div', { class: 'flash-vi' }, w.vi));
      const back = h('div', { class: 'face back' }, ui.ru(w.ru, { cls: 'xl' }), ui.tr(w.ru, true), h('div', { class: 'flash-vi' }, w.vi), w.note ? h('div', { class: 'muted small' }, w.note) : null);
      const card = h('button', { type: 'button', class: 'flash' + (flipped ? ' flipped' : ''), 'aria-label': 'Lật thẻ' }, h('div', { class: 'flash-inner' }, front, back));
      card.addEventListener('click', () => { flipped = !flipped; card.classList.toggle('flipped', flipped); if (flipped || dir === 'ru') RU.tts.speak(w.ru); });
      holder.innerHTML = '';
      holder.append(card);
      counter.textContent = (pos + 1) + ' / ' + deck.length + (SRS.learned(w.id) ? ' · mức ' + SRS.level(w.id) + '/6' : ' · chưa học');
      btns.innerHTML = '';
      btns.append(
        h('button', { type: 'button', class: 'btn ghost', onclick: () => go(-1) }, RU.icon('left', 18)),
        h('button', { type: 'button', class: 'btn bad-soft', onclick: () => { SRS.forget(w.id); RU.toast('Sẽ ôn lại từ này sớm', ''); go(1); } }, 'Chưa nhớ'),
        h('button', { type: 'button', class: 'btn ok-soft', onclick: () => { if (SRS.learned(w.id)) SRS.grade(w.id, true); else SRS.learn(w.id); RU.addXp(1); go(1); } }, 'Đã nhớ'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => go(1) }, RU.icon('right', 18)));
      if (dir === 'ru' && RU.state.settings.autoplay) setTimeout(() => RU.tts.speak(w.ru), 200);
    }
    RU.onKey(ctx, (e) => {
      if (e.key === ' ') { e.preventDefault(); holder.querySelector('.flash').click(); }
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });
    render();
  });
})(window.RU = window.RU || {});
