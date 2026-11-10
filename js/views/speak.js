/* =====================================================================
   views/speak.js — Luyện phát âm
   Nghe mẫu → đọc to vào micro → máy nghe & chấm; ghi âm để tự so sánh.
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const ui = RU.ui;
  const SP = RU.Speech;

  const MSG = [
    'Máy chưa nghe ra. Hãy nghe mẫu rồi đọc lại thật rõ nhé.',
    'Gần đúng rồi — nghe mẫu và thử lại nhé.',
    'Khá tốt! Gần chuẩn rồi.',
    'Tuyệt vời! Máy nghe rất rõ. 🎉',
  ];
  let srBroken = false; // dịch vụ nhận dạng không chạy trong trình duyệt này → chỉ ghi âm
  let silentFails = 0;  // số lần liên tiếp micro thu được tiếng nói mà máy không nhận ra chữ nào
  /** Vì sao không có máy chấm (để giải thích cho người dùng) */
  const noScoreReason = () => (SP.blockedBrowser
    ? SP.blockedBrowser + ' chưa hỗ trợ máy chấm phát âm (nhận dạng giọng nói). Muốn được chấm điểm, hãy mở app bằng Chrome hoặc Edge.'
    : !SP.srSupported ? 'Trình duyệt này không hỗ trợ máy chấm phát âm. Muốn được chấm điểm, hãy mở app bằng Chrome hoặc Edge.'
      : 'Máy chấm không chạy được trong trình duyệt này. Muốn được chấm điểm, hãy mở app bằng Chrome hoặc Edge.');

  function saveStars(ru, stars) {
    const st = RU.state.speak || (RU.state.speak = {});
    const k = U.normRu(ru);
    if (!(k in st) || stars > st[k]) st[k] = stars;
    RU.store.save();
  }
  const wordItem = (w) => ({ ru: w.ru, vi: w.vi, note: w.note });
  /** Tách câu hội thoại «A — B» thành hai câu để luyện riêng */
  function sentenceItems(exs) {
    const out = [];
    exs.forEach((e) => {
      const r = e.ru.split(/\s+[—–]\s+/); const v = e.vi.split(/\s+[—–]\s+/);
      if (r.length > 1 && r.length === v.length) r.forEach((x, i) => out.push({ ru: x, vi: v[i] }));
      else out.push({ ru: e.ru, vi: e.vi });
    });
    return out;
  }
  function dedupe(items) {
    const seen = new Set();
    return items.filter((it) => { const k = U.normRu(it.ru); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  /** Tô màu từng từ của câu mẫu theo mức máy nghe được */
  function markWords(text, per) {
    const out = h('span', { class: 'ru marked', lang: 'ru' });
    let k = 0;
    String(text).split(/(\s+|-)/).forEach((tok) => {
      if (!tok) return;
      if (/^(\s+|-)$/.test(tok) || !U.normRu(tok)) { out.append(RU.disp(tok)); return; }
      const s = per[k++] || 0;
      out.append(h('span', { class: 'w ' + (s >= 0.8 ? 'w-ok' : s >= 0.5 ? 'w-near' : 'w-miss') }, RU.disp(tok)));
    });
    return out;
  }

  /* ======================= Phiên luyện nói ======================= */
  function session(ctx, startItems, opts) {
    const main = ctx.main;
    main.classList.add('main-quiz');
    let items = startItems;
    let best = items.map(() => null);
    let pos = 0; let ctl = null; let listening = false; let audio = null;
    let reasonShown = false; // đã giải thích vì sao trình duyệt này không chấm được chưa
    const urls = [];
    let micBtn = null; let nextBtn = null;

    const bar = h('div', { class: 'bar' });
    const count = h('span', { class: 'quiz-count' });
    const exit = () => RU.go(opts.back || 'speak');
    const body = h('div', { class: 'quiz-body' });
    const foot = h('div', { class: 'quiz-foot' });
    main.append(h('div', { class: 'quiz speak' },
      h('div', { class: 'quiz-top' },
        h('button', { type: 'button', class: 'icon-btn', title: 'Thoát', 'aria-label': 'Thoát', onclick: exit }, RU.icon('x')),
        h('div', { class: 'progress' }, bar), count),
      h('div', { class: 'quiz-title' }, opts.title), body, foot));

    const stopAudio = () => { if (audio) { audio.pause(); audio = null; } };
    const playUrl = (url) => { stopAudio(); RU.tts.stop(); audio = new Audio(url); audio.play().catch(() => {}); };
    ctx.onCleanup(() => { if (ctl) ctl.stop(); stopAudio(); urls.forEach((u) => URL.revokeObjectURL(u)); });

    function compare(it, url) {
      stopAudio();
      let played = false;
      const go = () => { if (!played) { played = true; setTimeout(() => playUrl(url), 250); } };
      if (RU.tts.voices.length) {
        RU.tts.speak(it.ru, { onend: go });
        setTimeout(go, 900 + U.normRu(it.ru).length * 110);
      } else go();
    }

    function showResult(it, alts, err, audioUrl, status, result, info) {
      info = info || {};
      result.innerHTML = '';
      const btns = h('div', { class: 'speak-actions' });
      if (audioUrl) {
        btns.append(
          h('button', { type: 'button', class: 'btn soft', onclick: () => playUrl(audioUrl) }, RU.icon('play', 16), ' Giọng của bạn'),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => compare(it, audioUrl) }, RU.icon('refresh', 16), ' So sánh: mẫu → bạn'));
      }
      if (alts && alts.length) {
        silentFails = 0;
        const r = SP.score(it.ru, alts);
        let stars = SP.starsOf(r.score);
        let msg = MSG[stars];
        let pairTip = null;
        // Cặp tối thiểu: máy nghe ra đúng TỪ KIA → sai âm cần luyện
        if (it.pair && stars < 3 && SP.words(r.heard).includes(SP.norm(it.pair.other))) {
          stars = 0;
          msg = 'Máy nghe thành một từ khác!';
          pairTip = h('div', { class: 'callout warn' }, 'Máy nghe thành ', h('b', { lang: 'ru' }, RU.disp(it.pair.other)), ' (', it.pair.otherVi, '). ', it.pair.tip);
        }
        const first = best[pos] == null;
        best[pos] = Math.max(best[pos] || 0, stars);
        saveStars(it.ru, stars);
        RU.sfx.play(stars >= 2 ? 'ok' : 'bad');
        if (stars >= 2) RU.addXp(first ? 3 : 1);
        status.textContent = 'Nhấn micro để đọc lại';
        RU.append(result, [
          h('div', { class: 'speak-score s' + stars }, ui.stars(stars), h('b', null, msg)),
          h('div', { class: 'heard' }, h('span', { class: 'muted' }, 'Máy nghe được: '), h('b', { lang: 'ru' }, '«' + r.heard.trim() + '»')),
          SP.words(it.ru).length > 1 ? h('div', { class: 'heard' }, h('span', { class: 'muted' }, 'Từng từ: '), markWords(it.ru, r.per)) : null,
          pairTip, btns]);
      } else if (err) {
        if (SP.fatal(err)) srBroken = true;
        status.textContent = srBroken ? 'Nhấn micro để ghi âm giọng bạn' : 'Nhấn micro để thử lại';
        RU.append(result, [h('div', { class: 'callout warn' }, SP.errorText(err), srBroken && SP.fatal(err) ? ' Từ giờ app sẽ chỉ ghi âm để bạn tự nghe lại và so sánh với giọng mẫu.' : ''), btns]);
      } else if (info.recognized && !srBroken) {
        // Không có kết quả nhận dạng: phân biệt «không nói gì» với «nói rồi mà máy không nhận ra»
        const measured = typeof info.peak === 'number';
        const spoke = measured && info.peak >= SP.SPOKE;
        let msg;
        if (spoke && !info.heardAny) {
          silentFails++;
          if (silentFails >= 2) {
            srBroken = true;
            msg = 'Micro thu được giọng bạn, nhưng trình duyệt này không trả về kết quả nhận dạng nào — có lẽ không hỗ trợ máy chấm phát âm. '
              + 'Từ giờ app chỉ ghi âm để bạn nghe lại và so sánh với giọng mẫu. Muốn được chấm điểm, hãy mở app bằng Chrome hoặc Edge.';
          } else {
            msg = 'Micro đã thu được giọng bạn, nhưng máy chưa nhận ra từ nào. Hãy đọc lại rõ hơn; nếu vẫn vậy, có thể trình duyệt này không hỗ trợ máy chấm (Chrome và Edge chạy tốt).';
          }
        } else if (measured && info.peak < SP.QUIET) {
          msg = 'Micro gần như không thu được âm thanh — hãy kiểm tra micro đã bật và đúng thiết bị chưa, rồi nói to, gần micro hơn.';
        } else {
          msg = 'Máy không nghe thấy gì — hãy nói to và gần micro hơn nhé.';
        }
        status.textContent = srBroken ? 'Nhấn micro để ghi âm giọng bạn' : 'Nhấn micro để nói lại';
        RU.append(result, [h('div', { class: 'callout' + (srBroken ? ' warn' : '') }, msg), btns]);
      } else {
        // Chỉ ghi âm (trình duyệt không chấm được): nhắc lý do một lần mỗi phiên
        status.textContent = 'Nhấn micro để ghi âm lại';
        RU.append(result, [h('div', { class: 'callout' }, 'Đã ghi âm! Nghe lại giọng bạn và so sánh với giọng mẫu xem đã giống chưa.',
          !reasonShown ? h('div', { class: 'small muted' }, noScoreReason()) : null), btns]);
        reasonShown = true;
      }
    }

    async function toggle(it, status, result) {
      if (listening) { if (ctl) ctl.stop(); return; }
      RU.tts.stop();
      stopAudio();
      listening = true;
      micBtn.classList.add('on');
      const myPos = pos;
      status.textContent = SP.srSupported && !srBroken ? '🎙️ Đang nghe… hãy đọc to' : '🎙️ Đang ghi âm… nhấn lần nữa để dừng';
      result.innerHTML = '';
      let alts = null; let err = null;
      ctl = await SP.listen({
        recognize: !srBroken,
        maxSec: Math.min(12, 4 + U.normRu(it.ru).length * 0.12),
        onInterim: (t) => { if (pos === myPos) status.textContent = '… ' + t; },
        onFinal: (a) => { alts = a; },
        onError: (code) => { if (code !== 'aborted') err = code; },
        onEnd: ({ audioUrl, peak, heardAny, recognized }) => {
          if (audioUrl) urls.push(audioUrl);
          if (pos !== myPos) return;
          listening = false;
          micBtn.classList.remove('on');
          showResult(it, alts, err, audioUrl, status, result, { peak, heardAny, recognized });
        },
      });
    }

    function render() {
      if (ctl) { ctl.stop(); ctl = null; }
      listening = false;
      stopAudio();
      const it = items[pos];
      bar.style.width = Math.round(pos / items.length * 100) + '%';
      count.textContent = (pos + 1) + '/' + items.length;
      body.innerHTML = '';
      foot.innerHTML = '';
      foot.className = 'quiz-foot';
      const status = h('div', { class: 'mic-status', 'aria-live': 'polite' },
        SP.srSupported && !srBroken ? 'Nhấn micro rồi đọc to (hoặc phím cách)' : 'Nhấn micro để ghi âm giọng bạn, rồi nghe lại và so sánh');
      const result = h('div', { class: 'speak-result' });
      // Trình duyệt không chấm được (Opera, Vivaldi…): nói rõ ngay từ đầu, chỉ ghi âm để so sánh
      const note = !(SP.srSupported && !srBroken) ? h('div', { class: 'small muted mic-note' }, noScoreReason()) : null;
      if (note) reasonShown = true;
      micBtn = h('button', { type: 'button', class: 'mic-btn', 'aria-label': 'Nói', title: 'Nói (phím cách)' }, RU.icon('mic', 40));
      micBtn.addEventListener('click', () => toggle(it, status, result));
      const isSentence = SP.words(it.ru).length > 1;
      body.append(h('div', { class: 'card speak-card' },
        h('div', { class: 'q-label' }, isSentence ? 'Đọc to câu này' : 'Đọc to từ này'),
        h('div', { class: 'speak-target' + (isSentence ? ' sentence' : '') }, ui.ruStress(it.ru)),
        ui.tr(it.ru),
        ui.phonetic(it.ru),
        h('div', { class: 'speak-vi' }, it.vi),
        it.note ? h('div', { class: 'muted small' }, '💡 ', it.note) : null,
        h('div', { class: 'speak-listen' },
          h('button', { type: 'button', class: 'btn soft', onclick: () => { stopAudio(); RU.tts.speak(it.ru); } }, RU.icon('volume', 18), ' Nghe mẫu'),
          h('button', { type: 'button', class: 'btn soft', onclick: () => { stopAudio(); RU.tts.speak(it.ru, { rate: 0.55 }); } }, '🐢 Nghe chậm')),
        h('div', { class: 'mic-wrap' }, micBtn), status, note, result));
      body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
      nextBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => { pos++; if (pos >= items.length) finish(); else render(); } },
        pos === items.length - 1 ? 'Xem kết quả' : 'Tiếp', ' ', RU.icon('right', 18));
      RU.append(foot, [
        h('div', { class: 'foot-left' }, pos > 0 ? h('button', { type: 'button', class: 'btn ghost', onclick: () => { pos--; render(); } }, RU.icon('left', 18), ' Trước') : null),
        h('div', { class: 'foot-right' }, nextBtn)]);
      if (RU.state.settings.autoplay) setTimeout(() => { if (items[pos] === it && !listening) RU.tts.speak(it.ru); }, 400);
    }

    function restart(list) { items = list; best = items.map(() => null); pos = 0; render(); }

    function finish() {
      if (ctl) { ctl.stop(); ctl = null; }
      micBtn = null; nextBtn = null;
      bar.style.width = '100%';
      count.textContent = items.length + '/' + items.length;
      body.innerHTML = '';
      foot.innerHTML = '';
      foot.className = 'quiz-foot';
      RU.sfx.play('done');
      const scored = best.filter((b) => b != null);
      const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
      const weak = items.filter((_, i) => (best[i] || 0) < 2);
      RU.append(body, [h('div', { class: 'quiz-done' },
        h('div', { class: 'big-emoji' }, !scored.length ? '🎙️' : avg >= 2.5 ? '🏆' : avg >= 1.5 ? '🎉' : '💪'),
        h('h2', null, 'Hoàn thành luyện phát âm!'),
        scored.length
          ? h('div', { class: 'score' }, 'Trung bình ' + avg.toFixed(1) + ' / 3 sao · máy chấm ' + scored.length + ' / ' + items.length + ' mục')
          : h('p', { class: 'muted' }, 'Bạn đã luyện ' + items.length + ' mục.'),
        h('div', { class: 'speak-summary' }, items.map((it, i) => h('div', { class: 'ss-row' },
          h('span', { class: 'ss-stars' }, best[i] == null ? '—' : '★'.repeat(best[i]) + '☆'.repeat(3 - best[i])),
          ui.ru(it.ru, { speak: true }), h('span', { class: 'muted' }, it.vi)))))]);
      RU.append(foot, [
        h('div', { class: 'foot-left' }, weak.length && weak.length < items.length
          ? h('button', { type: 'button', class: 'btn ghost', onclick: () => restart(weak) }, RU.icon('refresh', 18), ' Luyện lại ' + weak.length + ' mục chưa tốt')
          : h('button', { type: 'button', class: 'btn ghost', onclick: () => restart(U.shuffle(items)) }, RU.icon('refresh', 18), ' Làm lại')),
        h('div', { class: 'foot-right' }, h('button', { type: 'button', class: 'btn primary', onclick: exit }, 'Xong'))]);
    }

    RU.onKey(ctx, (e) => {
      if (e.key === ' ' && micBtn) { e.preventDefault(); micBtn.click(); }
      else if (e.key === 'Enter' && nextBtn) { e.preventDefault(); nextBtn.click(); }
      else if ((e.key === 'l' || e.key === 'L') && items[pos]) RU.tts.speak(items[pos].ru);
    });
    if (!items.length) { body.append(ui.empty('Chưa có nội dung để luyện.')); return; }
    render();
  }

  /* ======================= Trang chính ======================= */
  RU.route('speak', (ctx) => {
    const main = ctx.main;
    main.append(ui.header('Luyện phát âm', {
      icon: '🎤',
      sub: 'Nghe giọng mẫu → đọc to vào micro → máy nghe và chấm điểm. App còn ghi âm giọng bạn để bạn tự nghe lại và so sánh với giọng mẫu.',
    }), ui.voiceNotice(ctx));

    const yes = (b) => h('span', { class: 'sup ' + (b ? 'on' : 'off') }, b ? '✓' : '✗');
    const srOk = SP.srSupported && !srBroken;
    main.append(h('div', { class: 'card support' },
      h('div', null, yes(srOk), ' Máy chấm phát âm (nhận dạng giọng nói) ',
        h('small', { class: 'muted' }, SP.blockedBrowser ? '— ' + SP.blockedBrowser + ' chưa hỗ trợ; hãy dùng Chrome hoặc Edge để được chấm điểm'
          : SP.srSupported ? (srBroken ? '— không chạy được trong trình duyệt này; hãy dùng Chrome hoặc Edge' : '— cần mạng; chạy tốt trên Chrome và Edge')
            : '— trình duyệt này không hỗ trợ, hãy dùng Chrome hoặc Edge')),
      h('div', null, yes(SP.recSupported), ' Ghi âm giọng bạn để nghe lại'),
      h('div', null, yes(RU.tts.voices.length > 0), ' Giọng đọc mẫu tiếng Nga'),
      h('p', { class: 'muted small' }, 'Lần đầu bấm 🎤, trình duyệt sẽ hỏi quyền dùng micro — hãy chọn «Cho phép». Máy chấm cho biết máy có nghe ra đúng từ hay không; để sửa từng âm, hãy nghe lại giọng mình và so sánh với giọng mẫu.')));

    main.append(h('div', { class: 'grid two' },
      h('div', { class: 'card' }, h('h3', null, 'Cách luyện hiệu quả'), h('ol', { class: 'howto' },
        h('li', null, 'Nghe mẫu 2–3 lần, dùng 🐢 để nghe chậm.'),
        h('li', null, 'Nhìn dòng «Đọc gần đúng» và nguyên âm tô đỏ — đó là âm tiết phải nhấn mạnh.'),
        h('li', null, 'Bấm 🎤 (hoặc phím cách) rồi đọc to, rõ ràng.'),
        h('li', null, 'Bấm «So sánh: mẫu → bạn» để nghe hai giọng liền nhau và tự sửa.'))),
      h('div', { class: 'card' }, h('h3', null, 'Nhớ 3 quy tắc vàng'), h('ul', { class: 'howto' },
        h('li', null, ui.rich(U.stressify("**О** không trọng âm đọc gần **«a»**: {молоко'} → [малако́]"))),
        h('li', null, ui.rich(U.stressify("**Е, Я** không trọng âm đọc gần **«i»**: {сестра'} → [систра́]"))),
        h('li', null, ui.rich('Phụ âm cuối bị **«điếc»**: {хлеб} → [хлеп], {глаз} → [глас]')),
        h('li', null, h('a', { href: '#/alphabet' }, 'Xem đủ quy tắc phát âm →'))))));

    const pairs = h('div', { class: 'grid pairs' });
    RU.PRONOUNCE.groups.forEach((g) => pairs.append(h('a', { class: 'card pair-card', href: '#/speak/pairs/' + g.id },
      h('span', { class: 'pair-ico', lang: 'ru' }, g.icon),
      h('div', null, h('b', null, g.title), h('small', { lang: 'ru' }, g.pairs.map((p) => U.stripStress(p.a) + ' – ' + U.stripStress(p.b)).join(' · '))))));
    main.append(h('section', { class: 'section' },
      h('div', { class: 'section-head' }, h('h2', null, 'Cặp âm dễ nhầm'),
        h('div', { class: 'row gap' },
          h('a', { class: 'btn soft', href: '#/speak/listen' }, '🎧 Luyện nghe phân biệt'),
          h('a', { class: 'btn soft', href: '#/speak/pairs/all' }, '🎤 Nói tất cả'))),
      h('p', { class: 'muted' }, 'Những từ chỉ khác nhau đúng một âm. Nếu máy nghe nhầm sang từ kia, bạn sẽ biết mình cần sửa âm nào.'),
      pairs));

    const chips = (list) => h('div', { class: 'chips-wrap' }, list.map(([href, label]) => h('a', { class: 'chip-link', href }, label)));
    main.append(h('section', { class: 'section' }, h('h2', null, 'Đọc từ trong bài chữ cái'),
      chips(RU.ALPHA.lessons.map((l) => ['#/speak/alpha/' + l.id, 'Bài ' + l.id + ': ' + l.title]))));
    main.append(h('section', { class: 'section' }, h('h2', null, 'Từ vựng theo chủ đề'),
      chips(RU.VOCAB.topics.map((t) => ['#/speak/vocab/' + t.id, t.icon + ' ' + t.title]))));
    main.append(h('section', { class: 'section' }, h('h2', null, 'Câu mẫu theo bài'),
      chips(RU.GRAMMAR.map((L) => ['#/speak/grammar/' + L.id, L.n + '. ' + L.title]))));
    main.append(h('a', { class: 'card banner primary', href: '#/speak/mix' }, h('span', { class: 'banner-ico' }, '🎲'),
      h('div', null, h('b', null, 'Trộn ngẫu nhiên'), h('small', null, 'Câu chào hỏi, từ bạn đã học và câu mẫu của các bài đã xem')), RU.icon('right')));
  });

  /* ======================= Các phiên luyện ======================= */
  RU.route('speak/vocab/:id', (ctx) => {
    const t = RU.VOCAB.topic(ctx.params.id);
    if (!t) return RU.go('speak');
    const learned = t.list.filter((w) => RU.SRS && RU.SRS.learned(w.id));
    const rest = t.list.filter((w) => !learned.includes(w));
    const items = U.shuffle(learned).concat(U.shuffle(rest)).slice(0, 10).map(wordItem);
    session(ctx, items, { title: 'Phát âm · ' + t.title, back: ctx.query.from === 'topic' ? 'vocab/topic/' + t.id : 'speak' });
  });
  RU.route('speak/grammar/:id', (ctx) => {
    const L = RU.GRAMMAR.byId[ctx.params.id];
    if (!L) return RU.go('speak');
    session(ctx, dedupe(sentenceItems(L.ex)), { title: 'Luyện nói · Bài ' + L.n + ': ' + L.title, back: ctx.query.from === 'lesson' ? 'grammar/lesson/' + L.id : 'speak' });
  });
  RU.route('speak/alpha/:n', (ctx) => {
    const l = RU.ALPHA.lessons.find((x) => String(x.id) === ctx.params.n);
    if (!l) return RU.go('speak');
    const items = U.shuffle(l.words.map(([ru, vi]) => ({ ru, vi }))).slice(0, 10);
    session(ctx, items, { title: 'Phát âm · Bài chữ cái ' + l.id, back: ctx.query.from === 'lesson' ? 'alphabet/lesson/' + l.id : 'speak' });
  });
  RU.route('speak/pairs/:id', (ctx) => {
    const groups = ctx.params.id === 'all' ? RU.PRONOUNCE.groups : [RU.PRONOUNCE.byId[ctx.params.id]].filter(Boolean);
    if (!groups.length) return RU.go('speak');
    const items = [];
    groups.forEach((g) => g.pairs.forEach((p) => {
      items.push({ ru: p.a, vi: p.av, note: g.tip, pair: { other: p.b, otherVi: p.bv, tip: g.tip } });
      items.push({ ru: p.b, vi: p.bv, note: g.tip, pair: { other: p.a, otherVi: p.av, tip: g.tip } });
    }));
    const title = groups.length === 1 ? 'Cặp âm: ' + groups[0].title : 'Cặp âm dễ nhầm';
    session(ctx, ctx.params.id === 'all' ? U.shuffle(items).slice(0, 14) : items, { title, back: 'speak' });
  });
  RU.route('speak/mix', (ctx) => {
    let pool = RU.VOCAB.topic('greet').list.map(wordItem);
    pool = pool.concat(RU.VOCAB.all.filter((w) => RU.SRS && RU.SRS.learned(w.id)).map(wordItem));
    RU.GRAMMAR.filter((L) => RU.state.grammar[L.id] && RU.state.grammar[L.id].seen).forEach((L) => { pool = pool.concat(sentenceItems(L.ex)); });
    session(ctx, U.shuffle(dedupe(pool)).slice(0, 10), { title: 'Luyện phát âm · Trộn ngẫu nhiên', back: 'speak' });
  });

  /* ======================= Luyện nghe phân biệt ======================= */
  RU.route('speak/listen', (ctx) => {
    const gen = () => {
      const all = [];
      RU.PRONOUNCE.groups.forEach((g) => g.pairs.forEach((p) => all.push({ g, p })));
      return U.shuffle(all).slice(0, 12).map(({ g, p }) => {
        const sayA = Math.random() < 0.5;
        const word = sayA ? p.a : p.b;
        const opt = (w, vi, correct) => ({ label: h('span', null, h('b', { lang: 'ru' }, RU.disp(w)), ' — ', vi), correct, ru: true });
        return {
          type: 'mc', label: 'Nghe và chọn từ bạn nghe được', speak: word, audioOnly: true, keepOrder: true,
          options: [opt(p.a, p.av, sayA), opt(p.b, p.bv, !sayA)],
          answer: RU.disp(word), explain: h('span', null, h('b', null, g.title + ': '), g.tip),
        };
      });
    };
    RU.mountQuiz(ctx, gen(), { title: 'Luyện nghe phân biệt âm', regenerate: gen, onExit: () => RU.go('speak') });
  });
})(window.RU = window.RU || {});
