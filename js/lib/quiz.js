/* =====================================================================
   quiz.js — bộ máy bài tập dùng chung
   Các dạng câu hỏi: mc (trắc nghiệm), type (gõ chữ), order (xếp câu),
                     match (ghép cặp), write (viết tay trên canvas)
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const ui = RU.ui;
  const PRAISE = ['Chính xác!', 'Tuyệt vời!', 'Giỏi lắm!', 'Đúng rồi!', 'Xuất sắc!', 'Отлично! 👏', 'Молоде́ц! 🎉'];

  function lev(a, b) {
    const m = a.length; const n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }

  /** Tách câu thành các thẻ từ để xếp */
  RU.tokenize = function (ru) {
    const PROPER = /^(москв|росси|вьетнам|антон|анн|лан$|иван|маш|хано)/;
    return ru.replace(/\s[—–]\s/g, ' ').split(/\s+/).map((w) => w.replace(/^[«"(]+|[.,!?;:…»")]+$/g, '')).filter(Boolean)
      .map((w, i) => {
        const n = U.normRu(w);
        const isProper = /^[А-ЯЁ]/.test(w) && (i > 0 || PROPER.test(n));
        return { label: isProper ? w : w.toLowerCase(), norm: n };
      });
  };

  const R = {};

  /* ---------------- Trắc nghiệm ---------------- */
  R.mc = function (q, api) {
    const wrap = h('div', { class: 'q q-mc' });
    wrap.append(h('div', { class: 'q-label' }, q.label || 'Chọn đáp án đúng'));
    if (q.prompt != null) wrap.append(h('div', { class: 'q-prompt' + (q.big ? ' big' : '') + (q.huge ? ' huge' : '') }, q.prompt));
    if (q.sub) wrap.append(h('div', { class: 'q-sub' }, q.sub));
    if (q.speak) {
      wrap.append(h('div', { class: 'q-audio' + (q.audioOnly ? ' only' : '') }, ui.speak(q.speak, { cls: 'lg' }), ui.speak(q.speak, { slow: true })));
      if (q.autoplay !== false) setTimeout(() => RU.tts.speak(q.speak), 350);
    }
    const options = q.keepOrder ? q.options : U.shuffle(q.options);
    const list = h('div', { class: 'opts' + (q.cols ? ' cols-' + q.cols : '') });
    let locked = false;
    const buttons = options.map((o, i) => {
      const b = h('button', { type: 'button', class: 'opt' + (o.ru ? ' ru' : '') + (o.big ? ' big' : '') },
        h('span', { class: 'opt-key' }, String(i + 1)), h('span', { class: 'opt-label' }, o.label));
      b.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        list.classList.add('locked');
        b.classList.add(o.correct ? 'right' : 'wrong');
        if (!o.correct) buttons.forEach((x, j) => { if (options[j].correct) x.classList.add('right'); });
        api.done(!!o.correct);
      });
      list.appendChild(b);
      return b;
    });
    wrap.append(list);
    api.body.append(wrap);
    api.keys((e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= buttons.length) buttons[n - 1].click(); });
  };

  /* ---------------- Gõ chữ ---------------- */
  R.type = function (q, api) {
    const wrap = h('div', { class: 'q q-type' });
    wrap.append(h('div', { class: 'q-label' }, q.label || 'Viết bằng tiếng Nga'));
    if (q.prompt != null) wrap.append(h('div', { class: 'q-prompt' + (q.big ? ' big' : '') }, q.prompt));
    if (q.speak) {
      wrap.append(h('div', { class: 'q-audio' }, ui.speak(q.speak), ui.speak(q.speak, { slow: true })));
      if (q.autoplay !== false) setTimeout(() => RU.tts.speak(q.speak), 350);
    }
    const input = h('input', { type: 'text', class: 'answer-input', placeholder: q.placeholder || 'Gõ câu trả lời…' });
    let checkBtn = null;
    const doCheck = () => {
      const v = input.value;
      if (!v.trim() || input.disabled) return;
      const nv = U.normRu(v);
      const answers = q.answers.map((a) => U.normRu(a));
      const ok = answers.includes(nv);
      input.disabled = true;
      if (checkBtn) checkBtn.disabled = true;
      input.classList.add(ok ? 'right' : 'wrong');
      let node = null;
      if (!ok) {
        const d = Math.min(...answers.map((a) => lev(a, nv)));
        if (d === 1) node = h('div', { class: 'muted' }, 'Gần đúng rồi — chỉ sai 1 chữ cái!');
      }
      api.done(ok, node ? { node } : null);
    };
    const kb = RU.Keyboard.attach(input, { onEnter: doCheck });
    api.skip('Không biết', () => { input.disabled = true; api.done(false); });
    checkBtn = api.check('Kiểm tra', doCheck);
    input.addEventListener('input', () => { checkBtn.disabled = !input.value.trim(); });
    wrap.append(input, kb);
    api.body.append(wrap);
    if (!window.matchMedia('(pointer: coarse)').matches) setTimeout(() => input.focus(), 60);
  };

  /* ---------------- Xếp câu ---------------- */
  R.order = function (q, api) {
    const wrap = h('div', { class: 'q q-order' });
    wrap.append(h('div', { class: 'q-label' }, q.label || 'Sắp xếp các từ thành câu đúng'));
    wrap.append(h('div', { class: 'q-prompt vi' }, q.vi));
    if (q.speak) wrap.append(h('div', { class: 'q-audio sm' }, ui.speak(q.speak), ui.speak(q.speak, { slow: true })));
    const answer = h('div', { class: 'tiles answer', 'aria-label': 'Câu trả lời' });
    const bank = h('div', { class: 'tiles bank' });
    const all = q.tokens.concat(q.extra || []);
    let locked = false;
    let checkBtn = null;
    U.shuffle(all).forEach((t) => {
      const tile = h('button', { type: 'button', class: 'tile', lang: 'ru' }, RU.disp(t.label));
      const slot = h('span', { class: 'slot' }, tile);
      tile.addEventListener('click', () => {
        if (locked) return;
        if (tile.parentNode === slot) {
          slot.style.width = tile.offsetWidth + 'px';
          slot.classList.add('empty');
          answer.appendChild(tile);
          RU.tts.speak(t.label);
        } else {
          slot.appendChild(tile);
          slot.classList.remove('empty');
          slot.style.width = '';
        }
        if (checkBtn) checkBtn.disabled = !answer.children.length;
      });
      tile._tok = t;
      bank.appendChild(slot);
    });
    wrap.append(answer, bank);
    api.body.append(wrap);
    api.skip('Không biết', () => { locked = true; api.done(false); });
    checkBtn = api.check('Kiểm tra', () => {
      if (locked) return;
      locked = true;
      const got = Array.from(answer.children).map((b) => b._tok.norm).join(' ');
      const want = [q.tokens.map((t) => t.norm).join(' ')].concat((q.alts || []).map((a) => RU.tokenize(a).map((t) => t.norm).join(' ')));
      const ok = want.includes(got);
      answer.classList.add(ok ? 'right' : 'wrong');
      api.done(ok);
    });
  };

  /* ---------------- Ghép cặp ---------------- */
  R.match = function (q, api) {
    const wrap = h('div', { class: 'q q-match' });
    wrap.append(h('div', { class: 'q-label' }, q.label || 'Ghép từ tiếng Nga với nghĩa tiếng Việt'));
    const left = h('div', { class: 'match-col' });
    const right = h('div', { class: 'match-col' });
    let selL = null; let selR = null; let mistakes = 0; let matched = 0;
    const n = q.pairs.length;
    const tryPair = () => {
      if (!selL || !selR) return;
      const a = selL; const b = selR;
      selL = selR = null;
      if (a.i === b.i) {
        a.el.classList.remove('sel'); b.el.classList.remove('sel');
        a.el.classList.add('done'); b.el.classList.add('done');
        matched++;
        if (matched === n) {
          api.done(mistakes <= Math.max(1, Math.floor(n / 3)), {
            title: mistakes ? 'Hoàn thành! (sai ' + mistakes + ' lần)' : 'Hoàn hảo — không sai lần nào! 🎯',
          });
        } else RU.sfx.play('ok');
      } else {
        mistakes++;
        a.el.classList.add('err'); b.el.classList.add('err');
        RU.sfx.play('bad');
        setTimeout(() => { a.el.classList.remove('err', 'sel'); b.el.classList.remove('err', 'sel'); }, 480);
      }
    };
    const mk = (item, side) => {
      const el = h('button', { type: 'button', class: 'match-card' + (side === 'L' ? ' ru' : '') }, side === 'L' ? RU.disp(item.label) : item.label);
      const obj = { i: item.i, el };
      el.addEventListener('click', () => {
        if (el.classList.contains('done')) return;
        if (side === 'L') {
          if (selL) selL.el.classList.remove('sel');
          selL = obj;
          if (item.speak) RU.tts.speak(item.speak);
        } else {
          if (selR) selR.el.classList.remove('sel');
          selR = obj;
        }
        el.classList.add('sel');
        tryPair();
      });
      return el;
    };
    U.shuffle(q.pairs.map((p, i) => ({ i, label: p.a, speak: p.speak || p.a }))).forEach((it) => left.appendChild(mk(it, 'L')));
    U.shuffle(q.pairs.map((p, i) => ({ i, label: p.b }))).forEach((it) => right.appendChild(mk(it, 'R')));
    wrap.append(h('div', { class: 'match-grid' }, left, right));
    api.body.append(wrap);
  };

  /* ---------------- Viết tay ---------------- */
  R.write = function (q, api) {
    const L = RU.ALPHA.letters[q.i];
    const cs = q.cs;
    const glyph = RU.Glyphs.get(L.u, cs);
    const wrap = h('div', { class: 'q q-write' });
    wrap.append(h('div', { class: 'q-label' }, q.label || 'Viết chữ cái lên bảng'));
    if (q.prompt) wrap.append(h('div', { class: 'q-prompt' }, q.prompt));
    if (q.speak) {
      wrap.append(h('div', { class: 'q-audio sm' }, ui.speak(q.speak)));
      if (q.autoplay !== false) setTimeout(() => RU.tts.speak(q.speak), 350);
    }
    let checkBtn = null;
    // Điện thoại / màn hình cảm ứng: trong trang chỉ có ô xem trước, chạm vào mới mở bảng viết toàn màn hình
    const WS = RU.WriteSheet;
    const useSheet = WS.wanted();
    let preview = null;
    let sheetCfg = null;
    const pad = RU.WritingPad({ glyph, mode: 'free', onChange: () => { if (checkBtn) checkBtn.disabled = pad.isEmpty(); if (preview) preview.update(); } });
    /** Đã trả lời xong: đóng cửa sổ viết, ô xem trước chỉ còn để xem (không mở lại để viết) */
    const finishWriting = () => {
      if (sheetCfg && WS.isOpen && WS.cfg === sheetCfg) WS.close();
      if (preview) { preview.el.disabled = true; preview.update(); }
    };
    const doCheck = () => {
      const r = RU.Recog.verify(pad.strokes(), L.u, cs);
      if (r.empty) { RU.toast(r.msg); return; }
      pad.setInk(r.ok ? 'ok' : 'bad');
      finishWriting(); // kết quả hiện ở thanh dưới của bài tập
      if (q.onWrite) q.onWrite(r);
      const node = r.ok
        ? h('div', { class: 'write-fb' }, ui.stars(r.stars), r.hint ? h('p', { class: 'muted' }, r.hint) : null)
        : h('div', { class: 'write-fb' }, h('p', null, r.msg), h('div', { class: 'write-fb-model' }, h('span', null, 'Mẫu đúng:'), RU.StrokeAnim(glyph, { size: 'sm' }).el));
      api.done(r.ok, { title: r.ok ? r.msg : 'Chưa đúng', node });
    };
    if (useSheet) {
      sheetCfg = {
        pad,
        primary: { label: 'Kiểm tra', icon: 'check', onClick: doCheck },
        head: () => h('div', { class: 'ws-task' },
          h('div', { class: 'ws-title' }, q.label || 'Viết chữ cái lên bảng'),
          q.prompt ? h('div', { class: 'ws-prompt' }, typeof q.prompt === 'string' ? q.prompt : q.prompt.cloneNode(true)) : null,
          q.speak ? h('div', { class: 'ws-model' }, ui.speak(q.speak)) : null),
        onClose: () => preview && preview.update(),
      };
      preview = WS.preview(pad, () => WS.open(sheetCfg));
      wrap.append(h('div', { class: 'pad-box' }, preview.el));
    } else {
      const tools = h('div', { class: 'pad-tools' },
        h('button', { type: 'button', class: 'btn ghost sm', onclick: () => pad.undo() }, RU.icon('undo', 16), ' Hoàn tác'),
        h('button', { type: 'button', class: 'btn ghost sm', onclick: () => pad.clear() }, RU.icon('trash', 16), ' Xóa'));
      wrap.append(h('div', { class: 'pad-box' }, pad.el, tools));
    }
    api.body.append(wrap);
    api.onDestroy(() => { pad.destroy(); if (sheetCfg) WS.release(sheetCfg); });
    api.skip('Không nhớ', () => {
      finishWriting();
      api.done(false, { node: h('div', { class: 'write-fb-model' }, h('span', null, 'Chữ cần viết:'), RU.StrokeAnim(glyph, { size: 'sm' }).el) });
    });
    checkBtn = api.check('Kiểm tra', doCheck);
  };

  /* ============================ Bộ máy ============================ */
  /**
   * opts: { title, xp, requeue, onFinish(res) → Node?, onExit(), exitLabel, regenerate() → questions }
   */
  RU.Quiz = function (questions, opts) {
    opts = opts || {};
    let list = questions;
    let total = 0; let answered = 0; let correct = 0;
    let queue = []; let current = null; let phase = 'answer';
    let keyHandler = null; let destroyFns = []; let feedbackAt = 0;

    const bar = h('div', { class: 'bar' });
    const count = h('span', { class: 'quiz-count' });
    const exit = () => { if (opts.onExit) opts.onExit(); else history.back(); };
    const top = h('div', { class: 'quiz-top' },
      h('button', { type: 'button', class: 'icon-btn', title: 'Thoát', 'aria-label': 'Thoát', onclick: exit }, RU.icon('x')),
      h('div', { class: 'progress' }, bar), count);
    const titleEl = opts.title ? h('div', { class: 'quiz-title' }, opts.title) : null;
    const body = h('div', { class: 'quiz-body' });
    const foot = h('div', { class: 'quiz-foot' });
    const root = h('div', { class: 'quiz' }, top, titleEl, body, foot);

    function updateTop() {
      bar.style.width = (total ? Math.round(answered / total * 100) : 0) + '%';
      count.textContent = Math.min(answered + (phase === 'answer' ? 1 : 0), total) + '/' + total;
    }
    function runDestroy() { destroyFns.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); destroyFns = []; }

    function start(qs) {
      list = qs;
      total = qs.length; answered = 0; correct = 0;
      queue = qs.map((q) => Object.assign({}, q, { _seen: false }));
      next();
    }

    function next() {
      runDestroy();
      keyHandler = null;
      if (!queue.length) { finish(); return; }
      current = queue.shift();
      phase = 'answer';
      body.innerHTML = '';
      foot.innerHTML = '';
      foot.className = 'quiz-foot';
      const left = h('div', { class: 'foot-left' });
      const right = h('div', { class: 'foot-right' });
      foot.append(left, right);
      const api = {
        body,
        done: (ok, extra) => onAnswer(current, ok, extra),
        keys: (fn) => { keyHandler = fn; },
        onDestroy: (fn) => destroyFns.push(fn),
        check: (label, fn) => {
          const b = h('button', { type: 'button', class: 'btn primary', disabled: true }, label || 'Kiểm tra');
          b.addEventListener('click', fn);
          right.appendChild(b);
          keyHandler = keyHandler || ((e) => { if (e.key === 'Enter' && !b.disabled) { e.preventDefault(); fn(); } });
          return b;
        },
        skip: (label, fn) => {
          left.appendChild(h('button', { type: 'button', class: 'btn ghost', onclick: fn }, label || 'Bỏ qua'));
        },
      };
      try { R[current.type](current, api); } catch (e) { console.error(e); body.append(h('div', { class: 'card error' }, 'Lỗi câu hỏi: ' + e.message)); }
      body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
      updateTop();
    }

    function onAnswer(q, ok, extra) {
      if (phase !== 'answer') return;
      phase = 'feedback';
      feedbackAt = Date.now();
      const first = !q._seen;
      q._seen = true;
      if (first) { answered++; if (ok) correct++; if (q.onResult) { try { q.onResult(ok); } catch (e) { console.error(e); } } }
      if (!ok && first && opts.requeue !== false && !q.noRequeue && q.type !== 'match' && q.type !== 'write') queue.push(q);
      RU.sfx.play(ok ? 'ok' : 'bad');
      if (ok) RU.addXp(first ? (opts.xp || 2) : 1);
      if (q.sayAfter) setTimeout(() => RU.tts.speak(q.sayAfter), 250);
      foot.innerHTML = '';
      foot.className = 'quiz-foot ' + (ok ? 'ok' : 'bad');
      const info = h('div', { class: 'fb' },
        h('div', { class: 'fb-title' }, (extra && extra.title) || (ok ? U.pick(PRAISE) : 'Chưa đúng')),
        !ok && q.answer ? h('div', { class: 'fb-ans' }, h('span', null, 'Đáp án: '), typeof q.answer === 'function' ? q.answer() : q.answer) : null,
        q.explain ? h('div', { class: 'fb-exp' }, typeof q.explain === 'function' ? q.explain() : q.explain) : null,
        extra && extra.node ? extra.node : null);
      const btn = h('button', { type: 'button', class: 'btn ' + (ok ? 'ok' : 'bad') }, 'Tiếp tục');
      btn.addEventListener('click', next);
      foot.append(info, btn);
      keyHandler = (e) => { if ((e.key === 'Enter' || e.key === ' ') && Date.now() - feedbackAt > 300) { e.preventDefault(); next(); } };
      updateTop();
    }

    function finish() {
      phase = 'done';
      runDestroy();
      const pct = total ? Math.round(correct / total * 100) : 100;
      const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
      RU.sfx.play('done');
      body.innerHTML = '';
      foot.innerHTML = '';
      foot.className = 'quiz-foot';
      bar.style.width = '100%';
      count.textContent = total + '/' + total;
      const res = { total, correct, pct, stars };
      let extraNode = null;
      if (opts.onFinish) { try { extraNode = opts.onFinish(res); } catch (e) { console.error(e); } }
      const msg = pct >= 90 ? 'Xuất sắc! Bạn nắm bài rất chắc.' : pct >= 70 ? 'Làm tốt lắm! Ôn thêm một chút là hoàn hảo.' : pct >= 40 ? 'Khá rồi! Hãy làm lại để nhớ lâu hơn.' : 'Đừng nản — luyện thêm lần nữa nhé!';
      body.append(h('div', { class: 'quiz-done' },
        h('div', { class: 'big-emoji' }, stars >= 3 ? '🏆' : stars === 2 ? '🎉' : stars === 1 ? '👍' : '💪'),
        h('h2', null, opts.doneTitle || 'Hoàn thành!'),
        ui.stars(stars),
        h('div', { class: 'score' }, correct + ' / ' + total + ' câu đúng ngay lần đầu · ' + pct + '%'),
        h('p', { class: 'muted' }, msg),
        extraNode));
      const again = h('button', { type: 'button', class: 'btn ghost' }, RU.icon('refresh', 18), ' Làm lại');
      again.addEventListener('click', () => start(opts.regenerate ? opts.regenerate() : U.shuffle(list)));
      const done = h('button', { type: 'button', class: 'btn primary' }, opts.exitLabel || 'Xong');
      done.addEventListener('click', exit);
      foot.append(h('div', { class: 'foot-left' }, again), h('div', { class: 'foot-right' }, done));
      keyHandler = (e) => { if (e.key === 'Enter') { e.preventDefault(); exit(); } };
    }

    const onKey = (e) => {
      if (!keyHandler) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' && e.key !== 'Enter') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      keyHandler(e);
    };
    document.addEventListener('keydown', onKey);

    if (!questions.length) {
      body.append(ui.empty('Chưa có câu hỏi nào.'));
    } else start(questions);

    return {
      el: root,
      destroy() { document.removeEventListener('keydown', onKey); runDestroy(); },
    };
  };

  /** Gắn quiz vào trang và tự dọn khi rời trang */
  RU.mountQuiz = function (ctx, questions, opts) {
    const q = RU.Quiz(questions, opts);
    ctx.main.classList.add('main-quiz');
    ctx.main.appendChild(q.el);
    ctx.onCleanup(() => q.destroy());
    return q;
  };
})(window.RU = window.RU || {});
