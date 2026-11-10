/* =====================================================================
   core.js — nền tảng của ứng dụng
   DOM helper, tiện ích, phiên âm, lưu tiến độ, giọng đọc, âm thanh, router
   ===================================================================== */
(function (RU) {
  'use strict';

  /* ============================ DOM ============================ */
  const SVGNS = 'http://www.w3.org/2000/svg';

  function append(el, kids) {
    for (const c of kids) {
      if (c == null || c === false || c === true) continue;
      if (Array.isArray(c)) append(el, c);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
    return el;
  }
  const isAttrs = (a) => a != null && typeof a === 'object' && !Array.isArray(a) && !(a instanceof Node);

  function setAttrs(el, attrs, svg) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style') {
        if (typeof v === 'string') el.style.cssText = v; else Object.assign(el.style, v);
      } else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (!svg && (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected')) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }

  RU.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (isAttrs(attrs)) setAttrs(el, attrs, false); else kids.unshift(attrs);
    return append(el, kids);
  };
  RU.s = function s(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    if (isAttrs(attrs)) setAttrs(el, attrs, true); else kids.unshift(attrs);
    return append(el, kids);
  };
  RU.append = append;
  const h = RU.h;

  /* ============================ Sự kiện ============================ */
  const listeners = {};
  RU.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); return () => RU.off(ev, fn); };
  RU.off = (ev, fn) => { const a = listeners[ev]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  RU.emit = (ev, data) => { (listeners[ev] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ============================ Tiện ích ============================ */
  const U = RU.U = {
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    sample(arr, n) { return U.shuffle(arr).slice(0, n); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(x, a, b) { return Math.max(a, Math.min(b, x)); },
    range(n) { return Array.from({ length: n }, (_, i) => i); },
    /** "молоко'" → "молоко́" (dấu ' sau nguyên âm = trọng âm) */
    stressify(str) { return str == null ? str : String(str).replace(/([аеиоуыэюяАЕИОУЫЭЮЯ])'/g, '$1́'); },
    stripStress(str) { return String(str).replace(/́/g, ''); },
    /** Chuẩn hoá để so sánh câu trả lời tiếng Nga */
    normRu(str) {
      return U.stripStress(str).toLowerCase().replace(/ё/g, 'е')
        .replace(/[.,!?;:«»"“”„…()[\]\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
    },
    /** Bỏ dấu tiếng Việt để tìm kiếm */
    normVi(str) {
      return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
    },
    dayKey(d) {
      d = d || new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); },
    debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; },
    hash(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; },
    cap(str) { return str ? str[0].toUpperCase() + str.slice(1) : str; },
    plural(n, word) { return n + ' ' + word; },
    /** Khoảng cách Levenshtein */
    lev(a, b) {
      const m = a.length; const n = b.length;
      if (!m) return n; if (!n) return m;
      let prev = Array.from({ length: n + 1 }, (_, j) => j);
      for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = cur;
      }
      return prev[n];
    },
  };

  /* ============================ Đọc gần đúng ============================
     Mô phỏng cách người Nga thực sự đọc (để người học biết):
     - О không trọng âm → а; Е, Я không trọng âm sau phụ âm → и (Я cuối từ giữ nguyên)
     - phụ âm hữu thanh cuối từ bị «điếc»: б→п, в→ф, г→к, д→т, ж→ш, з→с
     - -ться / -тся → ца;  một số từ đặc biệt (что → што…)               */
  const PH_EXC = {
    'что': 'што', 'чтобы': 'што́бы', 'сегодня': 'сиво́дня', 'его': 'йиво́', 'конечно': 'кане́шна',
    'здравствуйте': 'здра́ствуйти', 'пожалуйста': 'пажа́лста', 'солнце': 'со́нце', 'сердце': 'се́рце',
    'лёгкий': 'лёхкий', 'грустный': 'гру́сный', 'дождь': 'дошть',
  };
  const PH_VOW = 'аеёиоуыэюя';
  const PH_DEVOICE = { б: 'п', в: 'ф', г: 'к', д: 'т', ж: 'ш', з: 'с' };
  function phWord(w) {
    const lower = w.toLowerCase();
    const plain = U.stripStress(lower);
    let out;
    if (PH_EXC[plain]) out = PH_EXC[plain];
    else {
      let s = lower.replace(/ть?ся$/, 'ца');
      const ch = Array.from(s);
      let si = ch.indexOf('́') - 1;
      if (si < 0) si = ch.indexOf('ё');
      const letters = ch.filter((c) => c !== '́');
      const lastLetter = ch.reduce((k, c, i) => (/[а-яё]/.test(c) ? i : k), -1);
      if (si >= 0 && letters.filter((c) => PH_VOW.includes(c)).length > 1) {
        for (let i = 0; i < ch.length; i++) {
          if (i === si) continue;
          const c = ch[i];
          const prev = i > 0 ? ch[i - 1] : '';
          const afterCons = /[бвгджзйклмнпрстфхцчшщ]/.test(prev);
          if (c === 'о') ch[i] = 'а';
          else if (c === 'е' && afterCons) ch[i] = 'и';
          else if (c === 'я' && afterCons && i !== lastLetter) ch[i] = 'и';
        }
      }
      // phụ âm hữu thanh cuối từ → vô thanh (cả cụm: зд → ст, жд → шт)
      let k = lastLetter;
      if (k >= 0 && ch[k] === 'ь') k--;
      while (k >= 0 && PH_DEVOICE[ch[k]]) { ch[k] = PH_DEVOICE[ch[k]]; k--; }
      out = ch.join('');
    }
    return w[0] !== lower[0] ? out[0].toUpperCase() + out.slice(1) : out;
  }
  /** Cách đọc gần đúng của một từ / câu (chữ Kirin, có dấu trọng âm) */
  RU.phonetic = function (text) {
    return String(text).split(/([\s,.!?…«»"—–()]+)/).map((p, i) => (i % 2 || !/[а-яё]/i.test(p) ? p : phWord(p))).join('');
  };

  /* ============================ Phiên âm ============================ */
  const TR_INTL = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
    м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
    ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: 'ʼ', э: 'e', ю: 'yu', я: 'ya',
  };
  // Kiểu "thân thiện với người Việt": ы ≈ ư, й ≈ i
  const TR_VI = Object.assign({}, TR_INTL, { й: 'i', ы: 'ư' });
  const RU_VOWELS = 'аеёиоуыэюя';
  const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý', 'ư': 'ứ', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', Y: 'Ý', 'Ư': 'Ứ' };

  function addAcute(out) {
    for (let i = out.length - 1; i >= 0; i--) {
      const c = out[i];
      if (ACUTE[c]) return out.slice(0, i) + ACUTE[c] + out.slice(i + 1);
      if (c === ' ') break;
    }
    return out;
  }

  RU.translit = function (text, scheme) {
    scheme = scheme || (RU.state && RU.state.settings.scheme) || 'vi';
    const map = scheme === 'intl' ? TR_INTL : TR_VI;
    const chars = Array.from(String(text));
    let out = '';
    let prev = '';
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === '́') { out = addAcute(out); continue; }
      const lo = ch.toLowerCase();
      if (!(lo in map)) { out += ch; prev = ch; continue; }
      const pl = prev.toLowerCase();
      const prevLetter = pl in map;
      let r = map[lo];
      if (lo === 'е' && (!prevLetter || RU_VOWELS.includes(pl) || pl === 'ъ' || pl === 'ь')) r = 'ye';
      if (lo === 'ё') r = prevLetter && 'жчшщ'.includes(pl) ? 'ó' : 'yó';
      if (ch !== lo && r) r = r[0].toUpperCase() + r.slice(1);
      out += r;
      prev = ch;
    }
    return out;
  };

  /* ============================ Lưu tiến độ ============================ */
  const KEY = 'privet-ru-v1';
  const DEFAULTS = {
    translit: true,     // hiện phiên âm
    scheme: 'vi',       // 'vi' | 'intl'
    stress: true,       // hiện dấu trọng âm
    rate: 0.9,          // tốc độ đọc
    voice: '',          // voiceURI
    sfx: true,          // âm thanh hiệu ứng
    goal: 50,           // XP mỗi ngày
    perSession: 8,      // số từ mới mỗi lần học
    strict: 'normal',   // độ khó chấm chữ viết: easy | normal | hard
    autoplay: true,     // tự đọc khi hiện từ
  };
  let state = null;
  let lastSaved = '';
  const fresh = () => ({
    v: 1, settings: Object.assign({}, DEFAULTS),
    letters: {}, alpha: {}, words: {}, grammar: {}, xp: {}, speak: {},
    tests: {}, // bài kiểm tra tổng hợp: { 'a:1' | 'v:greet' | 'g:eto': { best, n, pass } }
    streak: { last: '', count: 0 }, total: 0, created: Date.now(),
    xpBy: {},  // XP theo từng máy { mãMáy: { ngày: XP } } — để gộp đúng khi đồng bộ nhiều máy
    setAt: {}, // thời điểm đổi từng cài đặt — khi đồng bộ, lần đổi sau cùng thắng
    epoch: 0,  // thời điểm «Xóa tiến độ» gần nhất (0 = chưa xoá lần nào)
  });

  /* Mã riêng của máy này: không nằm trong tiến độ, không xuất ra file, không đồng bộ */
  const DEV_KEY = 'privet-ru-device';
  let deviceId = null;
  RU.deviceId = function () {
    if (deviceId) return deviceId;
    try { deviceId = localStorage.getItem(DEV_KEY); } catch (e) { deviceId = null; }
    if (!deviceId) {
      deviceId = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem(DEV_KEY, deviceId); } catch (e) { /* bỏ qua */ }
    }
    return deviceId;
  };

  /** Đang chạy dạng app đã cài (cửa sổ riêng / màn hình chính), không phải tab trình duyệt */
  RU.isStandalone = () => ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
    .some((m) => !!(window.matchMedia && window.matchMedia('(display-mode: ' + m + ')').matches)) || navigator.standalone === true;

  const store = RU.store = {
    DEFAULTS,
    /** Đọc tiến độ từ trình duyệt (hoặc từ obj nếu có, ví dụ bản trên Google Drive) */
    load(obj) {
      let raw = obj || null;
      if (!raw) { try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; } }
      state = Object.assign(fresh(), raw || {});
      state.settings = Object.assign({}, DEFAULTS, (raw && raw.settings) || {});
      ['letters', 'alpha', 'words', 'grammar', 'xp', 'speak', 'tests', 'xpBy', 'setAt'].forEach((k) => { if (!state[k] || typeof state[k] !== 'object') state[k] = {}; });
      if (!state.streak || typeof state.streak !== 'object') state.streak = { last: '', count: 0 };
      if (typeof state.epoch !== 'number') state.epoch = 0;
      // XP có từ trước khi có đồng bộ (chưa ghi theo máy) → tính là của máy này
      const me = RU.deviceId();
      Object.keys(state.xp).forEach((day) => {
        let sum = 0;
        Object.keys(state.xpBy).forEach((d) => { sum += (state.xpBy[d] && state.xpBy[d][day]) || 0; });
        const diff = (state.xp[day] || 0) - sum;
        if (diff > 0) { const m = state.xpBy[me] || (state.xpBy[me] = {}); m[day] = (m[day] || 0) + diff; }
      });
      RU.state = state;
      lastSaved = obj ? '' : JSON.stringify(state);
      return state;
    },
    saveNow() {
      try {
        const s = JSON.stringify(state);
        if (s === lastSaved) return;
        localStorage.setItem(KEY, s);
        lastSaved = s;
      } catch (e) { console.warn('Không lưu được tiến độ', e); return; }
      RU.emit('saved');
    },
    save: null,
    settings() { return state.settings; },
    set(k, v) { state.settings[k] = v; state.setAt[k] = Date.now(); store.save(); RU.emit('settings', k); },
    reset() { state = fresh(); state.epoch = Date.now(); RU.state = state; store.saveNow(); RU.emit('xp'); },
    exportJSON() { return JSON.stringify(state, null, 1); },
    importJSON(text) {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' || !obj.settings) throw new Error('File không đúng định dạng tiến độ.');
      // nhập file sao lưu cũ không được coi là «xoá tiến độ» khi đồng bộ
      obj.epoch = Math.max(Number(obj.epoch) || 0, (state && state.epoch) || 0);
      store.load(obj);
      store.saveNow();
      RU.emit('xp');
    },
  };
  store.save = U.debounce(store.saveNow, 250);
  window.addEventListener('pagehide', () => store.saveNow());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.saveNow(); });

  /* ---------- XP & chuỗi ngày ---------- */
  RU.addXp = function (n) {
    if (!n) return;
    const day = U.dayKey();
    state.xp[day] = (state.xp[day] || 0) + n;
    state.total = (state.total || 0) + n;
    const mine = state.xpBy[RU.deviceId()] || (state.xpBy[RU.deviceId()] = {});
    mine[day] = (mine[day] || 0) + n;
    if (state.streak.last !== day) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      state.streak.count = state.streak.last === U.dayKey(y) ? state.streak.count + 1 : 1;
      state.streak.last = day;
    }
    store.save();
    RU.emit('xp');
  };
  RU.todayXp = () => (state.xp[U.dayKey()] || 0);
  RU.streak = () => {
    const s = state.streak;
    if (!s.last) return 0;
    const y = new Date(); y.setDate(y.getDate() - 1);
    return (s.last === U.dayKey() || s.last === U.dayKey(y)) ? s.count : 0;
  };

  /* ============================ Giọng đọc (TTS) ============================ */
  const tts = RU.tts = {
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    voices: [],
    loaded: false,
    init() {
      if (!tts.supported) return;
      const load = () => {
        const all = speechSynthesis.getVoices();
        if (all.length) tts.loaded = true;
        tts.voices = all.filter((v) => /^ru([-_]|$)/i.test(v.lang));
        RU.emit('voices');
      };
      load();
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', load);
      else speechSynthesis.onvoiceschanged = load;
      setTimeout(load, 1200);
      // Sau 2 giây vẫn chưa có giọng nào → coi như trình duyệt không có giọng đọc
      setTimeout(() => { if (!tts.loaded) { tts.loaded = true; load(); } }, 2000);
    },
    voice() {
      const want = state.settings.voice;
      return tts.voices.find((v) => v.voiceURI === want)
        || tts.voices.find((v) => /natural|online/i.test(v.name))
        || tts.voices.find((v) => /google/i.test(v.name))
        || tts.voices[0] || null;
    },
    clean(text) {
      return U.stripStress(text).replace(/[«»"“”]/g, '').replace(/\s*[—–]\s*/g, ', ')
        .replace(/…/g, '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    speak(text, opts) {
      opts = opts || {};
      if (!tts.supported || !text) return;
      const synth = window.speechSynthesis;
      const u = new SpeechSynthesisUtterance(tts.clean(text));
      u.lang = 'ru-RU';
      const v = tts.voice();
      if (v) u.voice = v;
      u.rate = opts.rate || state.settings.rate || 0.9;
      if (opts.onend) u.onend = opts.onend;
      if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(() => synth.speak(u), 70); }
      else synth.speak(u);
      if (tts.loaded && !tts.voices.length && !tts._warned) {
        tts._warned = true;
        RU.toast(location.protocol === 'file:'
          ? 'Trình duyệt này chưa có giọng đọc tiếng Nga — hãy mở app bằng Edge (file Mo-app-Edge.bat).'
          : 'Trình duyệt này chưa có giọng đọc tiếng Nga — hãy mở trang này bằng Edge hoặc Chrome.', 'warn', 6000);
      }
    },
    stop() { if (tts.supported) { try { speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ } } },
  };

  /* ============================ Âm thanh hiệu ứng ============================ */
  RU.sfx = {
    ctx: null,
    play(kind) {
      if (!state || !state.settings.sfx) return;
      try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime + 0.01;
      const seq = {
        ok: [[660, 0, 0.09], [990, 0.08, 0.16]],
        bad: [[200, 0, 0.16], [150, 0.1, 0.22]],
        done: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.3]],
        tap: [[880, 0, 0.05]],
      }[kind] || [[600, 0, 0.08]];
      seq.forEach(([f, dt, dur]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = kind === 'bad' ? 'triangle' : 'sine';
        o.frequency.value = f;
        const peak = kind === 'bad' ? 0.12 : 0.14;
        g.gain.setValueAtTime(0.0001, t0 + dt);
        g.gain.exponentialRampToValueAtTime(peak, t0 + dt + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t0 + dt);
        o.stop(t0 + dt + dur + 0.03);
      });
    },
  };

  /* ============================ Thông báo nhỏ ============================ */
  RU.toast = function (msg, kind, ms) {
    let box = document.getElementById('toasts');
    if (!box) { box = h('div', { id: 'toasts', class: 'toasts' }); document.body.appendChild(box); }
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, ms || 2600);
  };

  /* ============================ Biểu tượng ============================ */
  const ICONS = {
    volume: ['M11 5 6 9H2v6h4l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13'],
    home: ['M3 10.5 12 3l9 7.5', 'M5.5 9v11.5h13V9'],
    book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
    chat: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 'M8 9h8', 'M8 13h5'],
    sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
    pen: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'],
    check: ['M20 6 9 17l-5-5'],
    x: ['M18 6 6 18', 'M6 6l12 12'],
    undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-15-6.7L3 13'],
    trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
    play: ['M7 4.5v15l12-7.5z'],
    left: ['M19 12H5', 'M12 19l-7-7 7-7'],
    right: ['M5 12h14', 'M12 5l7 7-7 7'],
    eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
    refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.5 9a9 9 0 0 1 14.85-3.36L23 10', 'M1 14l4.64 4.36A9 9 0 0 0 20.5 15'],
    search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M21 21l-4.35-4.35'],
    cards: ['M3 8h13v13H3z', 'M8 3h13v13'],
    link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
    flame: ['M12 2c.5 3.5-2.5 5.5-2.5 9a2.5 2.5 0 0 0 5 0c0-1.2-.4-2-.9-2.9C15.8 9.3 18 12 18 15a6 6 0 0 1-12 0c0-5.5 5-7.5 6-13z'],
    star: ['M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z'],
    keyboard: ['M2 6h20v12H2z', 'M6 10h.01', 'M10 10h.01', 'M14 10h.01', 'M18 10h.01', 'M7 14h10'],
    bulb: ['M9 18h6', 'M10 22h4', 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z'],
    shuffle: ['M16 3h5v5', 'M4 20 21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
    headphones: ['M3 18v-6a9 9 0 0 1 18 0v6', 'M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z', 'M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z'],
    trophy: ['M8 21h8', 'M12 17v4', 'M7 4h10v5a5 5 0 0 1-10 0z', 'M17 5h3v2a3 3 0 0 1-3 3', 'M7 5H4v2a3 3 0 0 0 3 3'],
    target: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
    list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
    mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3', 'M8 22h8'],
    cloud: ['M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'],
  };
  RU.icon = function (name, size) {
    const filled = name === 'play' || name === 'star';
    const svg = RU.s('svg', {
      viewBox: '0 0 24 24', width: size || 20, height: size || 20, class: 'ico', 'aria-hidden': 'true',
      fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
    (ICONS[name] || []).forEach((d) => svg.appendChild(RU.s('path', { d })));
    return svg;
  };

  /* ============================ Thành phần giao diện ============================ */
  RU.disp = (t) => (state && state.settings.stress === false ? U.stripStress(t) : t);

  const ui = RU.ui = {
    /** Chữ tiếng Nga (tôn trọng cài đặt dấu trọng âm). opts.speak = nhấn để nghe */
    ru(text, opts) {
      opts = opts || {};
      const el = h('span', { class: 'ru' + (opts.cls ? ' ' + opts.cls : ''), lang: 'ru' }, RU.disp(text));
      if (opts.speak) {
        el.classList.add('speakable');
        el.title = 'Nhấn để nghe';
        el.addEventListener('click', (e) => { e.stopPropagation(); tts.speak(text); });
      }
      return el;
    },
    /** Chữ tiếng Nga với nguyên âm mang trọng âm được tô màu */
    ruStress(text, cls) {
      const el = h('span', { class: 'ru' + (cls ? ' ' + cls : ''), lang: 'ru' });
      const t = String(text);
      const re = /([аеиоуыэюяАЕИОУЫЭЮЯ])́|[ёЁ]/g;
      let last = 0; let m;
      while ((m = re.exec(t))) {
        if (m.index > last) el.append(t.slice(last, m.index));
        el.append(h('span', { class: 'sv' }, RU.disp(m[0])));
        last = re.lastIndex;
      }
      if (last < t.length) el.append(t.slice(last));
      return el;
    },
    /** Dòng «đọc gần đúng» (chỉ hiện khi khác cách viết) */
    phonetic(text) {
      const p = RU.phonetic(text);
      if (U.normRu(p) === U.normRu(text)) return null;
      return h('div', { class: 'phon', title: 'Cách người Nga thực sự đọc: o không trọng âm → a, e → i, phụ âm cuối bị «điếc»…' },
        h('span', { class: 'phon-label' }, 'Đọc gần đúng:'), ' [', ui.ruStress(p), '] ', ui.tr(p));
    },
    /** Phiên âm Latinh (ẩn nếu tắt trong cài đặt, trừ khi force) */
    tr(text, force) {
      if (!force && !state.settings.translit) return null;
      return h('span', { class: 'tr' }, RU.translit(text));
    },
    speak(text, opts) {
      opts = opts || {};
      const label = opts.slow ? 'Nghe chậm' : 'Nghe';
      return h('button', {
        type: 'button', class: 'icon-btn speak' + (opts.slow ? ' slow' : '') + (opts.cls ? ' ' + opts.cls : ''),
        title: label, 'aria-label': label,
        onclick: (e) => { e.stopPropagation(); tts.speak(text, { rate: opts.slow ? 0.55 : undefined }); },
      }, opts.slow ? h('span', { class: 'slow-ico', 'aria-hidden': 'true' }, '🐢') : RU.icon('volume'));
    },
    speakPair(text) { return h('span', { class: 'speak-pair' }, ui.speak(text), ui.speak(text, { slow: true })); },
    header(title, opts) {
      opts = opts || {};
      return h('div', { class: 'page-head' },
        opts.back ? h('a', { class: 'back', href: opts.back }, RU.icon('left', 18), h('span', null, opts.backLabel || 'Quay lại')) : null,
        h('div', { class: 'page-title' },
          opts.icon ? h('span', { class: 'page-icon' }, opts.icon) : null,
          h('div', null, h('h1', null, title), opts.sub ? h('p', { class: 'sub' }, opts.sub) : null)),
        opts.right || null);
    },
    progress(frac, cls) {
      return h('div', { class: 'progress' + (cls ? ' ' + cls : '') },
        h('div', { class: 'bar', style: { width: Math.round(U.clamp(frac || 0, 0, 1) * 100) + '%' } }));
    },
    stars(n, max) {
      max = max || 3;
      return h('span', { class: 'stars', 'aria-label': n + '/' + max + ' sao' },
        U.range(max).map((i) => h('span', { class: 'star' + (i < n ? ' on' : '') }, '★')));
    },
    /** Văn bản có đánh dấu: **đậm**, {tiếng Nga — nhấn để nghe} */
    rich(str) {
      const out = [];
      const re = /\*\*(.+?)\*\*|\{(.+?)\}/g;
      let last = 0; let m;
      str = String(str);
      while ((m = re.exec(str))) {
        if (m.index > last) out.push(str.slice(last, m.index));
        if (m[1] != null) out.push(h('b', null, ui.rich(m[1])));
        else out.push(ui.ru(m[2], { speak: true, cls: 'inline' }));
        last = re.lastIndex;
      }
      if (last < str.length) out.push(str.slice(last));
      return out;
    },
    /** Công thức câu: "Э'то + [danh từ]" */
    pattern(str) {
      const row = h('div', { class: 'pattern' });
      String(str).split(/\s\+\s/).forEach((p, i) => {
        if (i) row.appendChild(h('span', { class: 'pt-plus' }, '+'));
        const re = /\[([^\]]+)\]|([^[\]]+)/g;
        let m;
        while ((m = re.exec(p))) {
          const txt = (m[1] || m[2]).trim();
          if (!txt) continue;
          const cyr = /[а-яё]/i.test(txt);
          if (cyr) row.appendChild(h('span', { class: 'pt-word', lang: 'ru' }, RU.disp(txt)));
          else if (m[1]) row.appendChild(h('span', { class: 'pt-slot' }, txt));
          else row.appendChild(h('span', { class: 'pt-note' }, txt));
        }
      });
      return row;
    },
    gender(g) {
      const M = { m: ['đực', 'g-m'], f: ['cái', 'g-f'], n: ['trung', 'g-n'], pl: ['số nhiều', 'g-pl'] };
      const x = M[g];
      return x ? h('span', { class: 'badge ' + x[1], title: g === 'pl' ? 'Danh từ chỉ có số nhiều' : 'Giống ' + x[0] }, x[0]) : null;
    },
    empty(msg) { return h('div', { class: 'empty' }, msg); },
    /** Cảnh báo khi trình duyệt không có giọng đọc tiếng Nga (tự cập nhật khi danh sách giọng thay đổi) */
    voiceNotice(ctx) {
      const box = h('div', { class: 'voice-notice' });
      const render = () => {
        box.innerHTML = '';
        if (tts.supported && !(tts.loaded && !tts.voices.length)) return;
        box.append(h('div', { class: 'callout warn' },
          h('b', null, '🔇 Trình duyệt này chưa có giọng đọc tiếng Nga, nên bạn sẽ không nghe được phát âm.'),
          h('div', null, 'Cách sửa nhanh nhất: mở app bằng ', h('b', null, 'Microsoft Edge'),
            location.protocol === 'file:'
              ? [' — nháy đúp file ', h('b', null, 'Mo-app-Edge.bat'), ' trong thư mục app (hoặc dùng Google Chrome). ']
              : [' hoặc ', h('b', null, 'Google Chrome'), ' (trên điện thoại: Chrome). '],
            'Các trình duyệt như Vivaldi, Opera, Brave, Cốc Cốc thường chỉ có giọng đọc của Windows. ',
            h('a', { href: '#/settings' }, 'Xem thêm trong Cài đặt'), '.')));
      };
      render();
      const off = RU.on('voices', render);
      if (ctx) ctx.onCleanup(off);
      return box;
    },
  };

  /* ============================ Router ============================ */
  const routes = [];
  let cleanups = [];
  RU.route = function (pattern, handler) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ re, keys, handler });
  };
  RU.go = function (path) {
    const target = '#/' + String(path).replace(/^#?\/?/, '');
    if (location.hash === target) render(); else location.hash = target;
  };
  RU.refresh = () => render();
  RU.onKey = function (ctx, fn) {
    const handler = (e) => {
      const tag = e.target && e.target.tagName;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag || '') && e.key !== 'Enter') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      fn(e);
    };
    document.addEventListener('keydown', handler);
    ctx.onCleanup(() => document.removeEventListener('keydown', handler));
  };

  function updateNav(path) {
    const sec = (path || 'home').split('/')[0];
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === sec));
  }

  function render() {
    cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    cleanups = [];
    tts.stop();
    const raw = location.hash.replace(/^#\/?/, '');
    const qi = raw.indexOf('?');
    const path = (qi >= 0 ? raw.slice(0, qi) : raw) || 'home';
    const query = {};
    new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : '').forEach((v, k) => { query[k] = v; });
    const main = document.getElementById('main');
    for (const r of routes) {
      const m = r.re.exec(path);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      main.innerHTML = '';
      main.className = 'main';
      const ctx = { params, query, main, path, onCleanup: (fn) => cleanups.push(fn) };
      try { r.handler(ctx); } catch (e) {
        console.error(e);
        main.appendChild(h('div', { class: 'card error' }, h('h2', null, 'Có lỗi xảy ra'), h('pre', null, String((e && e.stack) || e))));
      }
      updateNav(path);
      window.scrollTo(0, 0);
      return;
    }
    RU.go('home');
  }
  RU.router = { start() { window.addEventListener('hashchange', render); render(); } };
})(window.RU = window.RU || {});
