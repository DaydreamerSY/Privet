/* =====================================================================
   views/alphabet.js — Bảng chữ cái: bài học, chi tiết chữ, luyện viết
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const ui = RU.ui;
  const A = RU.ALPHA;
  const LET = A.letters;

  /* ---------------- tiến độ ---------------- */
  function stat(u) {
    const st = RU.state.letters;
    if (!st[u]) st[u] = { seen: 0, qr: 0, qw: 0, wu: 0, wl: 0 };
    return st[u];
  }
  function mastery(u) {
    const s = RU.state.letters[u];
    if (!s) return 0;
    let m = 0;
    if (s.seen) m++;
    if (s.qr >= 2 && s.qr >= s.qw) m++;
    if (s.wu + s.wl >= 2) m++;
    return m;
  }
  function lessonState(id) {
    const st = RU.state.alpha;
    if (!st[id]) st[id] = { intro: false, quiz: 0, write: false, read: 0 };
    return st[id];
  }
  function lessonDone(id) {
    const s = RU.state.alpha[id];
    return !!(s && s.intro && s.quiz >= 70 && s.write && s.read >= 50);
  }
  function learnedLetters() {
    // các chữ thuộc bài đã mở đầu (đã làm quen) — dùng cho bài tập tổng hợp
    const idx = [];
    A.lessons.forEach((l) => { if (RU.state.alpha[l.id] && RU.state.alpha[l.id].intro) idx.push(...l.letterIdx); });
    return idx.length >= 4 ? idx : LET.map((L) => L.i);
  }
  RU.alphaProgress = () => ({
    done: A.lessons.filter((l) => lessonDone(l.id)).length,
    total: A.lessons.length,
    letters: LET.filter((L) => mastery(L.u) >= 2).length,
    lessonDone,
  });

  /* ---------------- thành phần ---------------- */
  function bigLetter(L, cls) {
    return h('div', { class: 'big-letter ' + (cls || '') + ' t-' + L.type, lang: 'ru' }, h('span', null, L.u), h('span', null, L.l));
  }
  function tile(L, opts) {
    opts = opts || {};
    const m = mastery(L.u);
    return h('a', { class: 'ltile t-' + L.type, href: opts.href || '#/alphabet/letter/' + L.i, title: L.typeName + ' · ' + L.snd },
      h('span', { class: 'ltile-ch', lang: 'ru' }, L.u, h('small', null, L.l)),
      h('span', { class: 'ltile-snd' }, L.snd),
      h('span', { class: 'ltile-dots' }, U.range(3).map((i) => h('i', { class: i < m ? 'on' : '' }))));
  }
  function exampleRow(ru, vi) {
    return h('div', { class: 'ex-row' }, ui.speak(ru), h('div', null, ui.ru(ru, { speak: true, cls: 'ex-ru' }), ui.tr(ru), ui.phonetic(ru), h('div', { class: 'ex-vi' }, vi)));
  }

  /* ======================= Tổng quan ======================= */
  RU.route('alphabet', (ctx) => {
    const main = ctx.main;
    const prog = RU.alphaProgress();
    main.append(ui.header('Bảng chữ cái Kirin', {
      icon: 'Аа',
      sub: 'Tiếng Nga có 33 chữ cái: 10 nguyên âm, 21 phụ âm và 2 dấu. Học theo 5 bài dưới đây — mỗi bài gồm làm quen, trắc nghiệm, luyện viết và tập đọc.',
    }), ui.voiceNotice(ctx));

    const lessons = h('div', { class: 'grid lessons' });
    A.lessons.forEach((l) => {
      const s = RU.state.alpha[l.id] || {};
      const done = lessonDone(l.id);
      const steps = [s.intro, s.quiz >= 70, s.write, s.read >= 50].filter(Boolean).length;
      lessons.append(h('a', { class: 'card lesson-card' + (done ? ' done' : ''), href: '#/alphabet/lesson/' + l.id },
        h('div', { class: 'lesson-num' }, done ? '✓' : l.id),
        h('div', { class: 'lesson-info' },
          h('h3', null, 'Bài ' + l.id + ': ' + l.title),
          h('div', { class: 'lesson-letters', lang: 'ru' }, Array.from(l.letters).map((c) => h('span', null, c + c.toLowerCase()))),
          ui.progress(steps / 4))));
    });
    main.append(h('section', { class: 'section' }, h('h2', null, 'Bài học'), lessons));

    main.append(h('section', { class: 'section' }, h('h2', null, 'Luyện tập'),
      h('div', { class: 'grid actions' },
        h('a', { class: 'card action', href: '#/alphabet/quiz' }, h('span', { class: 'action-ico' }, '🎯'), h('b', null, 'Trắc nghiệm chữ cái'), h('small', null, 'Nhận mặt chữ & âm đọc')),
        h('a', { class: 'card action', href: '#/alphabet/writequiz' }, h('span', { class: 'action-ico' }, '✍️'), h('b', null, 'Kiểm tra viết tay'), h('small', null, 'Nghe âm → tự viết chữ')),
        h('a', { class: 'card action', href: '#/alphabet/write/0' }, h('span', { class: 'action-ico' }, '🖊️'), h('b', null, 'Luyện viết tự do'), h('small', null, 'Tô & viết từng chữ')),
        h('a', { class: 'card action', href: '#/alphabet/readall' }, h('span', { class: 'action-ico' }, '📖'), h('b', null, 'Tập đọc từ'), h('small', null, 'Đọc từ bằng chữ Kirin')))));

    const grid = h('div', { class: 'alpha-grid' });
    LET.forEach((L) => grid.append(tile(L)));
    main.append(h('section', { class: 'section' },
      h('div', { class: 'section-head' }, h('h2', null, 'Toàn bộ 33 chữ cái'),
        h('div', { class: 'legend' }, h('span', { class: 'lg t-v' }, 'Nguyên âm'), h('span', { class: 'lg t-c' }, 'Phụ âm'), h('span', { class: 'lg t-s' }, 'Dấu'))),
      h('p', { class: 'muted' }, 'Nhấn vào một chữ để nghe, xem cách viết và ví dụ. Ba chấm nhỏ = mức thuộc chữ (đã xem · nhận diện đúng · viết đúng). Đã thuộc ' + prog.letters + '/33.'),
      grid));

    const rules = h('div', { class: 'rules' });
    A.rules.forEach((r, i) => rules.append(h('details', { class: 'card rule', open: i === 0 }, h('summary', null, r.t), h('p', null, ui.rich(r.d)))));
    main.append(h('section', { class: 'section' }, h('h2', null, 'Quy tắc phát âm quan trọng'), rules));
  });

  /* ======================= Trang bài học ======================= */
  RU.route('alphabet/lesson/:n', (ctx) => {
    const l = A.lessons.find((x) => String(x.id) === ctx.params.n);
    if (!l) return RU.go('alphabet');
    const s = lessonState(l.id);
    const main = ctx.main;
    main.append(ui.header('Bài ' + l.id + ': ' + l.title, { back: '#/alphabet', backLabel: 'Bảng chữ cái', sub: l.desc }));
    const letters = h('div', { class: 'alpha-grid small' });
    l.letterIdx.forEach((i) => letters.append(tile(LET[i])));
    main.append(letters);

    const step = (num, title, desc, href, done, score) => h('a', { class: 'card step' + (done ? ' done' : ''), href },
      h('div', { class: 'step-num' }, done ? '✓' : num),
      h('div', { class: 'step-info' }, h('b', null, title), h('small', null, desc)),
      score != null ? h('span', { class: 'chip' }, score) : null,
      h('span', { class: 'step-go' }, RU.icon('right', 18)));
    main.append(h('div', { class: 'steps' },
      step(1, 'Làm quen', 'Xem từng chữ: âm đọc, ví dụ, cách viết', '#/alphabet/lesson/' + l.id + '/intro', s.intro),
      step(2, 'Trắc nghiệm', 'Nhận mặt chữ, nghe và chọn (cần ≥ 70%)', '#/alphabet/lesson/' + l.id + '/quiz', s.quiz >= 70, s.quiz ? s.quiz + '%' : null),
      step(3, 'Luyện viết', 'Tô theo mẫu và tự viết trên bảng', '#/alphabet/lesson/' + l.id + '/write', s.write),
      step(4, 'Tập đọc', 'Đọc các từ chỉ dùng chữ đã học', '#/alphabet/lesson/' + l.id + '/read', s.read >= 50, s.read ? s.read + '%' : null),
      step('🎤', 'Luyện phát âm (thêm)', 'Đọc to các từ của bài, máy nghe và chấm', '#/speak/alpha/' + l.id + '?from=lesson', false)));

    const nextL = A.lessons.find((x) => x.id === l.id + 1);
    if (lessonDone(l.id)) {
      main.append(h('div', { class: 'card banner ok' }, h('b', null, '🎉 Bạn đã hoàn thành bài này!'),
        nextL ? h('a', { class: 'btn primary', href: '#/alphabet/lesson/' + nextL.id }, 'Sang bài ' + nextL.id) : h('a', { class: 'btn primary', href: '#/vocab' }, 'Học từ vựng')));
    }
  });

  /* ======================= Làm quen ======================= */
  function letterCard(L, opts) {
    opts = opts || {};
    const animU = RU.StrokeAnim(RU.Glyphs.get(L.u, 'u'), { size: 'md' });
    const animL = RU.StrokeAnim(RU.Glyphs.get(L.u, 'l'), { size: 'md' });
    const replay = h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { animU.play(); setTimeout(() => animL.play(), 200); } }, RU.icon('play', 14), ' Xem lại cách viết');
    return h('div', { class: 'card letter-card' },
      h('div', { class: 'letter-top' },
        bigLetter(L),
        h('div', { class: 'letter-meta' },
          h('div', { class: 'chips' }, h('span', { class: 'chip t-' + L.type }, L.typeName), h('span', { class: 'chip' }, 'Tên chữ: ', ui.ru(L.name))),
          h('div', { class: 'letter-sound' }, h('span', { class: 'muted' }, 'Âm đọc'), h('b', null, L.snd)),
          h('div', { class: 'letter-audio' },
            h('button', { type: 'button', class: 'btn soft', onclick: () => RU.tts.speak(L.name) }, RU.icon('volume', 18), ' Tên chữ'),
            h('button', { type: 'button', class: 'btn soft', onclick: () => RU.tts.speak(L.syl, { rate: 0.75 }) }, RU.icon('volume', 18), ' ', ui.ru(L.syl))))),
      h('p', { class: 'letter-hint' }, L.hint),
      L.trap ? h('div', { class: 'callout warn' }, '⚠️ ', L.trap) : null,
      L.note ? h('div', { class: 'callout' }, '💡 ', L.note) : null,
      h('div', { class: 'letter-ex' }, h('h4', null, 'Ví dụ'), L.ex.map(([ru, vi]) => exampleRow(ru, vi))),
      h('div', { class: 'letter-write' },
        h('h4', null, 'Cách viết (số = thứ tự nét)'),
        h('div', { class: 'anims' }, h('figure', null, animU.el, h('figcaption', null, 'Chữ hoa')), h('figure', null, animL.el, h('figcaption', null, 'Chữ thường'))),
        h('div', { class: 'row gap' }, replay, opts.practice !== false ? h('a', { class: 'btn ghost sm', href: '#/alphabet/write/' + L.i }, RU.icon('pen', 14), ' Luyện viết chữ này') : null)));
  }

  RU.route('alphabet/lesson/:n/intro', (ctx) => {
    const l = A.lessons.find((x) => String(x.id) === ctx.params.n);
    if (!l) return RU.go('alphabet');
    const main = ctx.main;
    let pos = 0;
    const wrap = h('div', { class: 'flow' });
    main.append(ui.header('Làm quen · Bài ' + l.id, { back: '#/alphabet/lesson/' + l.id, backLabel: 'Bài ' + l.id }), wrap);
    const render = () => {
      const L = LET[l.letterIdx[pos]];
      stat(L.u).seen = 1;
      RU.store.save();
      wrap.innerHTML = '';
      const dots = h('div', { class: 'dots' }, l.letterIdx.map((_, i) => h('i', { class: i === pos ? 'on' : i < pos ? 'done' : '' })));
      const prev = h('button', { type: 'button', class: 'btn ghost', disabled: pos === 0, onclick: () => { pos--; render(); } }, RU.icon('left', 18), ' Trước');
      const last = pos === l.letterIdx.length - 1;
      const next = h('button', { type: 'button', class: 'btn primary', onclick: () => {
        if (!last) { pos++; render(); return; }
        const s = lessonState(l.id);
        if (!s.intro) RU.addXp(10);
        s.intro = true;
        RU.store.save();
        RU.toast('Đã làm quen ' + l.letterIdx.length + ' chữ mới! 🎉', 'ok');
        RU.go('alphabet/lesson/' + l.id + '/quiz');
      } }, last ? 'Làm trắc nghiệm' : 'Tiếp', ' ', RU.icon('right', 18));
      wrap.append(dots, letterCard(L), h('div', { class: 'flow-nav' }, prev, next));
      if (RU.state.settings.autoplay) setTimeout(() => RU.tts.speak(L.name), 300);
    };
    RU.onKey(ctx, (e) => {
      if (e.key === 'ArrowRight') wrap.querySelector('.flow-nav .btn.primary').click();
      if (e.key === 'ArrowLeft' && pos > 0) { pos--; render(); }
    });
    render();
  });

  /* ======================= Trắc nghiệm ======================= */
  function sndOptions(L, pool) {
    const others = U.shuffle(pool.filter((x) => x.u !== L.u && x.snd !== L.snd)).slice(0, 3).map((x) => x.snd);
    if (L.trapOpt && !others.includes(L.trapOpt)) others[0] = L.trapOpt;
    return [{ label: L.snd, correct: true }].concat(others.map((s) => ({ label: s })));
  }
  function letterQuestions(idxs, poolIdx, opts) {
    opts = opts || {};
    const pool = poolIdx.map((i) => LET[i]);
    const qs = [];
    idxs.forEach((i) => {
      const L = LET[i];
      const onResult = (ok) => { const s = stat(L.u); if (ok) s.qr++; else s.qw++; RU.store.save(); };
      const isUpper = Math.random() < 0.5;
      qs.push({
        type: 'mc', label: 'Chữ này đọc là gì?', prompt: h('span', { class: 'ru', lang: 'ru' }, isUpper ? L.u : L.l), huge: true,
        options: sndOptions(L, pool), sayAfter: L.name, onResult,
        explain: h('span', null, h('b', { lang: 'ru' }, L.u + ' ' + L.l), ' — ', L.hint),
      });
      const others = U.shuffle(pool.filter((x) => x.u !== L.u)).slice(0, 3);
      qs.push({
        type: 'mc', label: 'Nghe và chọn chữ cái đúng', speak: L.name, audioOnly: true, cols: 4,
        options: [L].concat(others).map((x) => ({ label: h('span', { lang: 'ru' }, x.u + x.l), correct: x === L, big: true })),
        answer: L.u + ' ' + L.l, onResult,
      });
      // chữ thường trông khác hẳn chữ hoa → hỏi thêm
      if (opts.cases !== false && ['А', 'Б', 'Д', 'Е', 'Ё', 'Р', 'У', 'Ф'].includes(L.u)) {
        const wrong = U.shuffle(pool.filter((x) => x.u !== L.u)).slice(0, 3);
        qs.push({
          type: 'mc', label: 'Chữ thường của chữ hoa này là?', prompt: h('span', { class: 'ru', lang: 'ru' }, L.u), huge: true, cols: 4,
          options: [L].concat(wrong).map((x) => ({ label: h('span', { lang: 'ru' }, x.l), correct: x === L, big: true })),
          answer: L.l, onResult,
        });
      }
    });
    return qs;
  }
  function writeQuestion(L, cs, onResult) {
    const caseTxt = cs === 'u' ? 'chữ HOA' : 'chữ thường';
    return {
      type: 'write', i: L.i, cs, speak: L.name,
      prompt: h('span', null, 'Viết ', h('b', null, caseTxt), L.type === 's' ? ' của ' : ' có âm đọc ', h('b', { class: 'snd' }, '«' + L.snd + '»'),
        L.type !== 's' ? [' (tên chữ: ', ui.ru(L.name), ')'] : null),
      onWrite: (r) => { if (r.ok) { const s = stat(L.u); if (cs === 'u') s.wu++; else s.wl++; RU.store.save(); } },
      onResult,
    };
  }

  RU.route('alphabet/lesson/:n/quiz', (ctx) => {
    const l = A.lessons.find((x) => String(x.id) === ctx.params.n);
    if (!l) return RU.go('alphabet');
    const pool = [];
    A.lessons.forEach((x) => { if (x.id <= l.id) pool.push(...x.letterIdx); });
    const gen = () => U.shuffle(letterQuestions(l.letterIdx, pool.length >= 6 ? pool : LET.map((L) => L.i)));
    RU.mountQuiz(ctx, gen(), {
      title: 'Trắc nghiệm · Bài ' + l.id,
      regenerate: gen,
      onExit: () => RU.go('alphabet/lesson/' + l.id),
      exitLabel: 'Về bài học',
      onFinish: (r) => {
        const s = lessonState(l.id);
        s.quiz = Math.max(s.quiz || 0, r.pct);
        RU.store.save();
        return r.pct >= 70 ? h('p', null, 'Bước tiếp theo: ', h('a', { href: '#/alphabet/lesson/' + l.id + '/write' }, 'Luyện viết ✍️')) : h('p', null, 'Cần đạt từ 70% để hoàn thành bước này.');
      },
    });
  });

  RU.route('alphabet/quiz', (ctx) => {
    const idx = learnedLetters();
    const gen = () => U.shuffle(letterQuestions(U.sample(idx, Math.min(8, idx.length)), LET.map((L) => L.i))).slice(0, 15);
    RU.mountQuiz(ctx, gen(), { title: 'Trắc nghiệm chữ cái', regenerate: gen, onExit: () => RU.go('alphabet') });
  });

  RU.route('alphabet/writequiz', (ctx) => {
    const idx = learnedLetters();
    const gen = () => U.sample(idx, Math.min(8, idx.length)).map((i) => writeQuestion(LET[i], Math.random() < 0.5 ? 'u' : 'l'));
    RU.mountQuiz(ctx, gen(), { title: 'Kiểm tra viết tay', regenerate: gen, onExit: () => RU.go('alphabet'), xp: 4 });
  });

  /* ======================= Luyện viết ======================= */
  /**
   * Bảng viết một chữ: chế độ tô (trace) hoặc tự viết (free).
   * opts: { i, cs, mode, onSuccess(res), compact, switchable }
   */
  function writeTask(opts) {
    const L = LET[opts.i];
    let cs = opts.cs || 'u';
    let mode = opts.mode || 'trace';
    let glyph = RU.Glyphs.get(L.u, cs);
    let checked = false;
    const fb = h('div', { class: 'write-feedback', 'aria-live': 'polite' });
    const pad = RU.WritingPad({ glyph, mode, onChange: () => { if (checked) { checked = false; fb.innerHTML = ''; fb.className = 'write-feedback'; } } });
    const animBox = h('div', { class: 'model-anim', title: 'Nhấn để xem lại thứ tự nét', onclick: () => anim && anim.play() });
    let anim = null;
    const modelChar = h('div', { class: 'model-char', lang: 'ru' });
    const caption = h('div', { class: 'model-caption' });
    const modeBtns = h('div', { class: 'seg' });
    const caseBtns = h('div', { class: 'seg' });
    const tip = h('p', { class: 'muted small' });

    function setupModel() {
      tip.textContent = (mode === 'trace' ? 'Tô lên nét mờ theo đúng thứ tự số. ' : 'Nhìn mẫu bên cạnh rồi tự viết lên bảng. ')
        + 'Đường nét đứt là chiều cao của chữ thường, dòng kẻ đậm là chân chữ.';
      if (anim) anim.stop();
      anim = RU.StrokeAnim(glyph, { size: 'md' });
      animBox.innerHTML = '';
      animBox.append(anim.el);
      modelChar.textContent = glyph.char;
      caption.textContent = (cs === 'u' ? 'Chữ hoa' : 'Chữ thường') + ' · ' + glyph.strokes.length + ' nét · âm «' + L.snd + '»';
      modeBtns.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      caseBtns.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === cs));
    }
    [['trace', 'Tô theo mẫu'], ['free', 'Tự viết']].forEach(([v, label]) => modeBtns.append(h('button', { type: 'button', dataset: { v }, onclick: () => { mode = v; pad.setMode(mode); pad.clear(); setupModel(); } }, label)));
    [['u', 'Chữ hoa ' + L.u], ['l', 'Chữ thường ' + L.l]].forEach(([v, label]) => caseBtns.append(h('button', { type: 'button', dataset: { v }, onclick: () => { cs = v; glyph = RU.Glyphs.get(L.u, cs); pad.setGlyph(glyph); setupModel(); fb.innerHTML = ''; } }, label)));

    const check = () => {
      const r = mode === 'trace' ? RU.Recog.trace(pad.strokes(), glyph) : RU.Recog.verify(pad.strokes(), L.u, cs);
      if (r.empty) { RU.toast(r.msg); return; }
      checked = true;
      pad.setInk(r.ok ? 'ok' : 'bad');
      fb.className = 'write-feedback ' + (r.ok ? 'ok' : 'bad');
      fb.innerHTML = '';
      RU.append(fb, [h('div', { class: 'wf-head' }, r.ok ? ui.stars(r.stars) : h('span', { class: 'wf-x' }, '✗'), h('b', null, r.msg)),
        r.hint ? h('div', { class: 'muted' }, r.hint) : null,
        mode === 'free' && r.best ? h('div', { class: 'muted small' }, 'Máy đọc được: ', h('b', { lang: 'ru' }, r.best.cs === 'u' ? r.best.letter : r.best.letter.toLowerCase()), ' · độ giống ' + r.pct + '%') : null,
        mode === 'trace' ? h('div', { class: 'muted small' }, 'Độ phủ nét ' + Math.round(r.cov * 100) + '% · độ chính xác ' + Math.round(r.prec * 100) + '%') : null]);
      RU.sfx.play(r.ok ? 'ok' : 'bad');
      if (r.ok) {
        const s = stat(L.u);
        if (cs === 'u') s.wu++; else s.wl++;
        RU.store.save();
        RU.addXp(mode === 'free' ? 3 : 2);
        if (opts.onSuccess) opts.onSuccess(r, { cs, mode });
      } else if (opts.onFail) opts.onFail(r);
    };

    const tools = h('div', { class: 'pad-tools' },
      h('button', { type: 'button', class: 'btn ghost sm', onclick: () => pad.undo() }, RU.icon('undo', 16), ' Hoàn tác'),
      h('button', { type: 'button', class: 'btn ghost sm', onclick: () => pad.clear() }, RU.icon('trash', 16), ' Xóa'),
      h('button', { type: 'button', class: 'btn primary', onclick: check }, RU.icon('check', 18), ' Kiểm tra'));

    const el = h('div', { class: 'write-task' },
      h('div', { class: 'write-main' }, h('div', { class: 'pad-box' }, pad.el, tools), fb),
      h('div', { class: 'write-side card' },
        opts.switchable !== false ? h('div', { class: 'write-switch' }, caseBtns, modeBtns) : null,
        h('div', { class: 'model-row' }, modelChar, h('div', { class: 'model-meta' }, caption, h('button', { type: 'button', class: 'btn soft sm', onclick: () => RU.tts.speak(L.name) }, RU.icon('volume', 16), ' ', ui.ru(L.name)))),
        animBox,
        h('button', { type: 'button', class: 'btn ghost sm', onclick: () => anim && anim.play() }, RU.icon('play', 14), ' Xem lại thứ tự nét'),
        tip));
    setupModel();
    return { el, destroy() { pad.destroy(); if (anim) anim.stop(); }, check, pad };
  }

  RU.route('alphabet/write/:i', (ctx) => {
    let i = U.clamp(parseInt(ctx.params.i, 10) || 0, 0, LET.length - 1);
    const L = LET[i];
    const main = ctx.main;
    const nav = h('div', { class: 'letter-nav' },
      h('a', { class: 'btn ghost sm', href: '#/alphabet/write/' + ((i + LET.length - 1) % LET.length) }, RU.icon('left', 16), ' ' + LET[(i + LET.length - 1) % LET.length].u),
      h('select', { class: 'select', 'aria-label': 'Chọn chữ', onchange: (e) => RU.go('alphabet/write/' + e.target.value) },
        LET.map((x) => h('option', { value: x.i, selected: x.i === i }, x.u + ' ' + x.l + ' — ' + x.snd))),
      h('a', { class: 'btn ghost sm', href: '#/alphabet/write/' + ((i + 1) % LET.length) }, LET[(i + 1) % LET.length].u + ' ', RU.icon('right', 16)));
    main.append(ui.header('Luyện viết: ' + L.u + ' ' + L.l, { back: '#/alphabet', backLabel: 'Bảng chữ cái', right: nav }));
    const task = writeTask({ i, cs: ctx.query.case === 'l' ? 'l' : 'u', mode: ctx.query.mode === 'free' ? 'free' : 'trace' });
    ctx.onCleanup(() => task.destroy());
    main.append(task.el);
    RU.onKey(ctx, (e) => { if (e.key === 'Enter') { e.preventDefault(); task.check(); } });
  });

  RU.route('alphabet/lesson/:n/write', (ctx) => {
    const l = A.lessons.find((x) => String(x.id) === ctx.params.n);
    if (!l) return RU.go('alphabet');
    const tasks = [];
    l.letterIdx.forEach((i) => { tasks.push({ i, cs: 'u', mode: 'trace' }); tasks.push({ i, cs: 'l', mode: 'free' }); });
    let pos = 0; let passed = 0; let current = null; let okThis = false;
    const main = ctx.main;
    main.append(ui.header('Luyện viết · Bài ' + l.id, { back: '#/alphabet/lesson/' + l.id, backLabel: 'Bài ' + l.id }));
    const top = h('div', { class: 'flow-top' });
    const holder = h('div');
    const nav = h('div', { class: 'flow-nav' });
    main.append(top, holder, nav);
    ctx.onCleanup(() => current && current.destroy());

    const finish = () => {
      const s = lessonState(l.id);
      const ok = passed >= Math.ceil(tasks.length * 0.6);
      if (ok) { if (!s.write) RU.addXp(15); s.write = true; }
      RU.store.save();
      if (current) current.destroy();
      current = null;
      top.innerHTML = '';
      nav.innerHTML = '';
      holder.innerHTML = '';
      RU.sfx.play('done');
      holder.append(h('div', { class: 'card quiz-done' },
        h('div', { class: 'big-emoji' }, ok ? '✍️' : '💪'),
        h('h2', null, ok ? 'Hoàn thành luyện viết!' : 'Cố thêm chút nữa!'),
        h('p', null, 'Bạn viết đạt ' + passed + '/' + tasks.length + ' lượt.'),
        h('div', { class: 'row gap center' },
          h('a', { class: 'btn ghost', href: '#/alphabet/lesson/' + l.id + '/write', onclick: (e) => { e.preventDefault(); RU.refresh(); } }, 'Làm lại'),
          h('a', { class: 'btn primary', href: ok ? '#/alphabet/lesson/' + l.id + '/read' : '#/alphabet/lesson/' + l.id }, ok ? 'Sang tập đọc 📖' : 'Về bài học'))));
    };

    const render = () => {
      if (current) current.destroy();
      okThis = false;
      const t = tasks[pos];
      const L = LET[t.i];
      top.innerHTML = '';
      top.append(ui.progress(pos / tasks.length), h('div', { class: 'flow-label' },
        h('b', null, (pos + 1) + '/' + tasks.length), ' · ', t.mode === 'trace' ? 'Tô theo mẫu ' : 'Tự viết ', h('b', { lang: 'ru' }, t.cs === 'u' ? L.u : L.l),
        ' (', t.cs === 'u' ? 'chữ hoa' : 'chữ thường', ')'));
      const nextBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onclick: () => { if (okThis) passed++; pos++; if (pos >= tasks.length) finish(); else render(); } }, pos === tasks.length - 1 ? 'Hoàn thành' : 'Tiếp', ' ', RU.icon('right', 18));
      current = writeTask({ i: t.i, cs: t.cs, mode: t.mode, switchable: false, onSuccess: () => { okThis = true; nextBtn.disabled = false; } });
      holder.innerHTML = '';
      holder.append(current.el);
      nav.innerHTML = '';
      nav.append(h('button', { type: 'button', class: 'btn ghost', onclick: () => { pos++; if (pos >= tasks.length) finish(); else render(); } }, 'Bỏ qua'), nextBtn);
      if (pos === 0 || tasks[pos - 1].i !== t.i) setTimeout(() => RU.tts.speak(L.name), 300);
    };
    RU.onKey(ctx, (e) => {
      if (e.key !== 'Enter' || !current) return;
      e.preventDefault();
      const nb = nav.querySelector('.btn.primary');
      if (okThis && nb && !nb.disabled) nb.click(); else current.check();
    });
    render();
  });

  /* ======================= Tập đọc ======================= */
  function readQuestions(words) {
    return words.map(([ru, vi]) => {
      const others = U.shuffle(words.filter((w) => w[0] !== ru)).slice(0, 3).map((w) => RU.translit(w[0], 'vi'));
      const right = RU.translit(ru, 'vi');
      return {
        type: 'mc', label: 'Từ này đọc là gì?', prompt: h('span', { class: 'ru', lang: 'ru' }, RU.disp(ru)), big: true,
        options: [{ label: right, correct: true }].concat(others.filter((o) => o !== right).map((o) => ({ label: o }))),
        sayAfter: ru,
        explain: h('span', null, ui.ru(ru), ' = ', h('b', null, vi)),
      };
    });
  }
  RU.route('alphabet/lesson/:n/read', (ctx) => {
    const l = A.lessons.find((x) => String(x.id) === ctx.params.n);
    if (!l) return RU.go('alphabet');
    const gen = () => U.shuffle(readQuestions(l.words)).slice(0, 8);
    RU.mountQuiz(ctx, gen(), {
      title: 'Tập đọc · Bài ' + l.id, regenerate: gen, requeue: false,
      onExit: () => RU.go('alphabet/lesson/' + l.id), exitLabel: 'Về bài học',
      onFinish: (r) => {
        const s = lessonState(l.id);
        s.read = Math.max(s.read || 0, r.pct);
        RU.store.save();
        if (lessonDone(l.id)) return h('div', { class: 'callout ok' }, '🎉 Hoàn thành Bài ' + l.id + '!');
        return null;
      },
    });
  });
  RU.route('alphabet/readall', (ctx) => {
    const words = [];
    A.lessons.forEach((l) => words.push(...l.words));
    const gen = () => U.shuffle(readQuestions(words)).slice(0, 10);
    RU.mountQuiz(ctx, gen(), { title: 'Tập đọc từ', regenerate: gen, requeue: false, onExit: () => RU.go('alphabet') });
  });

  /* ======================= Chi tiết chữ ======================= */
  RU.route('alphabet/letter/:i', (ctx) => {
    const i = U.clamp(parseInt(ctx.params.i, 10) || 0, 0, LET.length - 1);
    const L = LET[i];
    stat(L.u).seen = 1;
    RU.store.save();
    const main = ctx.main;
    const prev = LET[(i + LET.length - 1) % LET.length];
    const next = LET[(i + 1) % LET.length];
    main.append(ui.header('Chữ ' + L.u + ' ' + L.l, {
      back: '#/alphabet', backLabel: 'Bảng chữ cái',
      right: h('div', { class: 'letter-nav' },
        h('a', { class: 'btn ghost sm', href: '#/alphabet/letter/' + prev.i }, RU.icon('left', 16), ' ' + prev.u),
        h('a', { class: 'btn ghost sm', href: '#/alphabet/letter/' + next.i }, next.u + ' ', RU.icon('right', 16))),
    }));
    main.append(letterCard(L));
    RU.onKey(ctx, (e) => {
      if (e.key === 'ArrowRight') RU.go('alphabet/letter/' + next.i);
      if (e.key === 'ArrowLeft') RU.go('alphabet/letter/' + prev.i);
    });
    if (RU.state.settings.autoplay) setTimeout(() => RU.tts.speak(L.name), 300);
  });

  RU.alphaHelpers = { mastery, lessonDone, letterQuestions };
})(window.RU = window.RU || {});
