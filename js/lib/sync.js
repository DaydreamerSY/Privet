/* =====================================================================
   sync.js — đồng bộ tiến độ giữa nhiều thiết bị qua Google Drive
   - Đăng nhập bằng OAuth client của Google Cloud project «coin-manager»
     (dùng chung với app Coin Manager), quyền drive.appdata: app chỉ dùng
     thư mục ẩn riêng trên Drive — không thấy, không đụng tới file nào khác của bạn.
   - App này chỉ đọc / ghi đúng một file: privet-ru-sync.json
     (file coin-manager-sync.json của Coin Manager nằm chung thư mục ẩn, app này không đụng tới).
   - Không có máy chủ: quyền truy cập Google (~1 giờ) chỉ giữ trong bộ nhớ.
     Hết hạn thì cần một lần bấm để xin lại (cửa sổ Google chớp lên rồi tự đóng).
   - Google chỉ cho đăng nhập từ địa chỉ web đã khai báo (https://daydreamersy.github.io),
     mở bằng file trên máy (file://) thì không đồng bộ được.
   - Gộp: mỗi mục lấy giá trị «tiến bộ hơn» (điểm cao nhất, lần ôn mới nhất…), XP cộng
     theo từng máy → học xen kẽ nhiều máy không mất gì, đồng bộ lại bao nhiêu lần cũng vậy.
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;

  const CLIENT_ID = '427368913266-13117203mqq82vf7ov99vlasn4jejgnf.apps.googleusercontent.com';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const FILE_NAME = 'privet-ru-sync.json';
  const API = 'https://www.googleapis.com';
  const META_KEY = 'privet-ru-sync';
  const WEB_ORIGIN = 'https://daydreamersy.github.io'; // origin đã khai báo trong OAuth client của coin-manager
  const ONLINE_URL = WEB_ORIGIN + '/Privet/';
  const AUTO_DELAY = 20000; // tự đồng bộ 20 giây sau thay đổi cuối cùng
  const LOCAL_ONLY = ['voice', 'rate']; // cài đặt riêng từng máy (mỗi máy có giọng đọc khác nhau)

  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : v === true ? 1 : 0);
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const bad = (k) => k === '__proto__' || k === 'constructor' || k === 'prototype';
  const keys = (o) => (isObj(o) ? Object.keys(o).filter((k) => !bad(k)) : []);

  /* ============================ Gộp tiến độ ============================ */
  /** Bản ghi { trường: số | true/false } (chữ cái, bài học): số lớn hơn thắng, true thắng false */
  function mergeMax(L, R) {
    let n = 0;
    keys(R).forEach((k) => {
      const r = R[k];
      if (!isObj(r)) return;
      const l = L[k];
      if (!isObj(l)) { L[k] = Object.assign({}, r); n++; return; }
      let ch = false;
      keys(r).forEach((f) => {
        const a = l[f]; const b = r[f];
        if (b === true) { if (a !== true) { l[f] = true; ch = true; } } else if (typeof b === 'number' && isFinite(b) && !(typeof a === 'number' && a >= b)) { l[f] = b; ch = true; }
      });
      if (ch) n++;
    });
    return n;
  }

  /** Từ vựng (ôn tập ngắt quãng): lấy trạng thái của lần ôn gần nhất, số lần đúng / sai lấy lớn hơn */
  function mergeWords(L, R) {
    let n = 0;
    keys(R).forEach((id) => {
      const r = R[id];
      if (!isObj(r)) return;
      const l = L[id];
      if (!isObj(l)) { L[id] = Object.assign({}, r); n++; return; }
      const before = JSON.stringify(l);
      const lt = num(l.last); const rt = num(r.last);
      if (rt > lt || (rt === lt && num(r.b) > num(l.b))) keys(r).forEach((f) => { if (f !== 'r' && f !== 'w') l[f] = r[f]; });
      l.r = Math.max(num(l.r), num(r.r));
      l.w = Math.max(num(l.w), num(r.w));
      if (JSON.stringify(l) !== before) n++;
    });
    return n;
  }

  /** Luyện phát âm: số sao cao nhất */
  function mergeSpeak(L, R) {
    let n = 0;
    keys(R).forEach((k) => {
      const b = num(R[k]);
      if (!has(L, k) || b > num(L[k])) { L[k] = b; n++; }
    });
    return n;
  }

  /** Chuỗi ngày học = số ngày liên tiếp có XP, tính tới ngày học gần nhất */
  function streakFrom(xp, prev) {
    const days = keys(xp).filter((d) => num(xp[d]) > 0 && /^\d{4}-\d\d-\d\d$/.test(d)).sort();
    if (!days.length) return prev;
    const last = days[days.length - 1];
    const p = last.split('-').map(Number);
    const dt = new Date(p[0], p[1] - 1, p[2]);
    let count = 1;
    for (let i = 0; i < 4000; i++) {
      dt.setDate(dt.getDate() - 1);
      if (num(xp[RU.U.dayKey(dt)]) > 0) count++; else break;
    }
    return { last, count };
  }

  /** XP: mỗi máy có bộ đếm riêng theo ngày (chỉ tăng) → lấy số lớn hơn từng ô, XP của ngày = tổng các máy */
  function mergeXp(L, R) {
    let n = 0;
    const RB = isObj(R.xpBy) ? R.xpBy : {};
    keys(RB).forEach((dev) => {
      const rd = RB[dev];
      if (!isObj(rd)) return;
      const ld = isObj(L.xpBy[dev]) ? L.xpBy[dev] : (L.xpBy[dev] = {});
      keys(rd).forEach((day) => {
        const b = num(rd[day]);
        if (b > num(ld[day])) { ld[day] = b; n++; }
      });
    });
    const xp = {}; let total = 0;
    keys(L.xpBy).forEach((dev) => keys(L.xpBy[dev]).forEach((day) => {
      const v = num(L.xpBy[dev][day]);
      xp[day] = (xp[day] || 0) + v;
      total += v;
    }));
    keys(xp).forEach((d) => { if (xp[d] > num(L.xp[d])) L.xp[d] = xp[d]; });
    L.total = Math.max(num(L.total), total);
    L.streak = streakFrom(L.xp, L.streak);
    return n;
  }

  /** Cài đặt chung (trừ giọng đọc, tốc độ đọc): lần đổi sau cùng thắng */
  function mergeSettings(L, R) {
    const changed = [];
    const rs = isObj(R.settings) ? R.settings : {};
    const ra = isObj(R.setAt) ? R.setAt : {};
    const D = RU.store.DEFAULTS;
    keys(ra).forEach((k) => {
      if (LOCAL_ONLY.includes(k) || !has(D, k) || !has(rs, k) || typeof rs[k] !== typeof D[k]) return;
      if (num(ra[k]) > num(L.setAt[k])) {
        if (L.settings[k] !== rs[k]) changed.push(k);
        L.settings[k] = rs[k];
        L.setAt[k] = ra[k];
      }
    });
    return changed;
  }

  /** Gộp bản R (trên Drive) vào L (trên máy này, sửa tại chỗ) */
  function mergeState(L, R) {
    let n = 0;
    n += mergeMax(L.letters, R.letters);
    n += mergeMax(L.alpha, R.alpha);
    n += mergeMax(L.grammar, R.grammar);
    n += mergeWords(L.words, R.words);
    n += mergeSpeak(L.speak, R.speak);
    n += mergeXp(L, R);
    const settings = mergeSettings(L, R);
    n += settings.length;
    if (num(R.created) > 0 && num(R.created) < num(L.created)) L.created = R.created;
    L.epoch = Math.max(num(L.epoch), num(R.epoch));
    return { n, settings };
  }

  /** Chuỗi JSON không phụ thuộc thứ tự khoá — để biết Drive đã có đúng dữ liệu này chưa */
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (isObj(v)) return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  function sharedView(S) {
    const o = JSON.parse(JSON.stringify(S));
    LOCAL_ONLY.forEach((k) => { if (isObj(o.settings)) delete o.settings[k]; if (isObj(o.setAt)) delete o.setAt[k]; });
    return stable(o);
  }

  /* ============================ Trạng thái kết nối (riêng máy này) ============================ */
  let meta = {};
  try { meta = JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch (e) { meta = {}; }
  if (!isObj(meta)) meta = {};
  const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* bỏ qua */ } };

  let token = null; // { value, exp } — chỉ trong bộ nhớ
  const hasToken = () => !!token && token.exp - Date.now() > 60000;

  let status = 'off'; // off | idle | pending | busy | ok | error
  let statusMsg = '';
  let dirty = false; // có thay đổi trên máy chưa đưa lên Drive
  let applying = false; // đang ghi bản đã gộp xuống máy (không tính là thay đổi mới)
  let syncedThisSession = false;
  let busy = null;
  let again = false;
  let autoTimer = null;

  const available = () => /^https?:$/.test(location.protocol);
  const idleStatus = () => (!meta.email ? 'off' : dirty ? 'pending' : syncedThisSession ? 'ok' : 'idle');
  function setStatus(s, msg) {
    status = s;
    statusMsg = msg || '';
    RU.emit('sync', { status, msg: statusMsg });
  }

  /* ============================ Đăng nhập Google ============================ */
  let gisPromise = null;
  const gis = () => (window.google && window.google.accounts && window.google.accounts.oauth2) || null;
  function loadGis() {
    if (gis()) return Promise.resolve(gis());
    if (!gisPromise) {
      gisPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => (gis() ? resolve(gis()) : reject(new Error('Thư viện đăng nhập Google bị lỗi.')));
        s.onerror = () => { gisPromise = null; s.remove(); reject(new Error('Không tải được thư viện đăng nhập Google (cần có mạng).')); };
        document.head.appendChild(s);
      });
    }
    return gisPromise;
  }
  /** Tải sẵn thư viện để khi bấm thì cửa sổ Google mở ngay (không bị trình duyệt chặn) */
  const preload = () => { if (available() && !RU.isStandalone()) loadGis().catch(() => {}); };

  /* ---- App đã cài (cửa sổ riêng / màn hình chính) — cùng cách làm với Coin Manager ----
     Cửa sổ bật lên của Google mở ra tab trình duyệt riêng và mất liên lạc với app (đăng nhập xong
     chỉ thấy màn hình trắng). Khi đó dùng trang chuyển tiếp oauth.html: Google chuyển về đó, trang này
     đưa quyền truy cập về app qua BroadcastChannel + localStorage (đúng mã state mới nhận, app đọc xong
     xoá ngay, tự hết hạn sau 5 phút). Địa chỉ oauth.html phải có trong «Authorized redirect URIs»
     của OAuth client (Google Cloud → project coin-manager). */
  const HANDOFF_KEY = 'privet-ru-oauth';        // trùng với js/oauth.js
  const PENDING_KEY = 'privet-ru-oauth-pending';
  const HANDOFF_TTL = 5 * 60000;
  const redirectUri = () => new URL('oauth.html', location.href).href;
  const readJson = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const drop = (k) => { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } };
  {
    const stale = readJson(HANDOFF_KEY); // quyền truy cập còn sót (app chưa kịp đọc) — không để nằm lâu trong trình duyệt
    if (stale && !(Date.now() - stale.at < HANDOFF_TTL)) drop(HANDOFF_KEY);
  }
  const newState = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));

  function acceptGrant(msg) {
    if (msg.error) throw new Error(msg.error === 'access_denied' ? 'Bạn đã không cho phép app lưu vào Google Drive.' : 'Lỗi đăng nhập Google: ' + msg.error);
    if (!String(msg.scope || '').split(' ').includes(SCOPE)) throw new Error('Bạn chưa đánh dấu ô cho phép app lưu vào Google Drive.');
    token = { value: msg.access_token, exp: Date.now() + Number(msg.expires_in || 3600) * 1000 };
    return token.value;
  }
  function takeHandoff(state) {
    const msg = readJson(HANDOFF_KEY);
    if (!msg || msg.state !== state || !(Date.now() - msg.at < HANDOFF_TTL)) return null;
    drop(HANDOFF_KEY);
    return msg;
  }
  /** App đã cài: mở trang đăng nhập Google trong trình duyệt, chờ oauth.html gửi quyền truy cập về */
  function tokenViaRedirect() {
    const state = newState();
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ state, action: 'sync', at: Date.now() })); } catch (e) { /* bỏ qua */ }
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const q = { client_id: CLIENT_ID, redirect_uri: redirectUri(), response_type: 'token', scope: SCOPE, state, include_granted_scopes: 'true' };
    if (meta.email && meta.email.includes('@')) q.login_hint = meta.email;
    url.search = new URLSearchParams(q).toString();
    window.open(url.href, '_blank');
    RU.toast('Đăng nhập Google trong cửa sổ vừa mở, xong thì quay lại app — đồng bộ sẽ tự chạy tiếp.', '', 6000);
    return new Promise((resolve, reject) => {
      let settled = false;
      let ch = null;
      try { ch = new BroadcastChannel(HANDOFF_KEY); } catch (e) { ch = null; }
      const check = () => take(takeHandoff(state));
      const finish = (err, value) => {
        if (settled) return;
        settled = true;
        if (ch) ch.close();
        clearInterval(poll);
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', check);
        window.removeEventListener('focus', check);
        drop(PENDING_KEY);
        if (err) reject(err); else resolve(value);
      };
      function take(msg) {
        if (!msg || msg.state !== state) return;
        drop(HANDOFF_KEY);
        try { finish(null, acceptGrant(msg)); } catch (e) { finish(e); }
      }
      if (ch) ch.onmessage = (e) => take(e.data);
      document.addEventListener('visibilitychange', check);
      window.addEventListener('focus', check);
      const poll = setInterval(check, 1500);
      const timer = setTimeout(() => finish(new Error('Hết thời gian chờ đăng nhập Google. Bấm đồng bộ lại.')), HANDOFF_TTL);
    });
  }
  /** oauth.html mở ngay trong cửa sổ app rồi quay về (app tải lại, mất trạng thái): lấy quyền truy cập đang chờ */
  function resumeAfterRedirect() {
    const pending = readJson(PENDING_KEY);
    if (!pending) return null;
    if (!(Date.now() - pending.at < 2 * HANDOFF_TTL)) { drop(PENDING_KEY); return null; }
    const msg = takeHandoff(pending.state);
    if (!msg) return null;
    drop(PENDING_KEY);
    try { acceptGrant(msg); return { action: pending.action }; } catch (e) { return { action: pending.action, error: e.message }; }
  }

  const POPUP_ERRORS = {
    popup_failed_to_open: 'Trình duyệt đã chặn cửa sổ đăng nhập Google. Hãy bấm lại một lần nữa (hoặc cho phép cửa sổ bật lên).',
    popup_closed: 'Cửa sổ Google đã đóng trước khi đăng nhập xong.',
  };
  /** Phải gọi ngay khi người dùng vừa bấm: Google cần thao tác của người dùng để mở cửa sổ đăng nhập */
  async function getToken() {
    if (hasToken()) return token.value;
    if (RU.isStandalone()) return tokenViaRedirect();
    const oauth2 = await loadGis();
    return new Promise((resolve, reject) => {
      const client = oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        prompt: '',
        login_hint: meta.email || undefined,
        callback: (resp) => {
          if (resp.error) {
            return reject(new Error(resp.error === 'access_denied' ? 'Bạn đã không cho phép app lưu vào Google Drive.' : 'Lỗi đăng nhập Google: ' + (resp.error_description || resp.error)));
          }
          if (!oauth2.hasGrantedAllScopes(resp, SCOPE)) return reject(new Error('Bạn chưa đánh dấu ô cho phép app lưu vào Google Drive.'));
          token = { value: resp.access_token, exp: Date.now() + Number(resp.expires_in || 3600) * 1000 };
          resolve(token.value);
        },
        error_callback: (err) => reject(new Error(POPUP_ERRORS[err && err.type] || 'Lỗi đăng nhập Google: ' + ((err && (err.message || err.type)) || 'không rõ'))),
      });
      client.requestAccessToken();
    });
  }

  /* ============================ Google Drive (thư mục ẩn của app) ============================ */
  async function api(path, opts) {
    opts = opts || {};
    let res;
    try {
      res = await fetch(API + path, {
        method: opts.method || 'GET',
        headers: Object.assign({ Authorization: 'Bearer ' + (token ? token.value : '') }, opts.headers || {}),
        body: opts.body,
      });
    } catch (e) {
      throw new Error('Không kết nối được Google Drive — hãy kiểm tra mạng rồi thử lại.');
    }
    if (res.status === 401) { token = null; throw new Error('Phiên đăng nhập Google đã hết hạn — bấm đồng bộ lại.'); }
    if (res.status === 403) throw new Error('Google Drive từ chối truy cập (lỗi 403).');
    if (!res.ok) throw new Error('Google Drive báo lỗi ' + res.status + '.');
    return res;
  }
  async function whoAmI() {
    const res = await api('/drive/v3/about?fields=user(emailAddress)');
    return ((await res.json()).user || {}).emailAddress || null;
  }
  /** File đồng bộ của app này, hoặc null. Chỉ tìm đúng tên file của app. */
  async function findFile() {
    const q = encodeURIComponent("name='" + FILE_NAME + "'");
    const res = await api('/drive/v3/files?spaces=appDataFolder&q=' + q + '&orderBy=modifiedTime%20desc&fields=files(id,modifiedTime)');
    return ((await res.json()).files || [])[0] || null;
  }
  /** Nội dung file đồng bộ, hoặc null nếu file hỏng / không phải của app (khi đó ghi đè bằng bản trên máy) */
  async function download(id) {
    const text = await (await api('/drive/v3/files/' + encodeURIComponent(id) + '?alt=media')).text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { data = null; }
    return isObj(data) && data.app === 'privet-ru' && isObj(data.state) ? data : null;
  }
  async function upload(data, id) {
    const body = JSON.stringify(data);
    if (id) {
      return (await api('/upload/drive/v3/files/' + encodeURIComponent(id) + '?uploadType=media&fields=id,modifiedTime', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body,
      })).json();
    }
    const boundary = 'privet-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    const metaPart = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' });
    const multipart = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + metaPart + '\r\n'
      + '--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + boundary + '--';
    return (await api('/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime', {
      method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: multipart,
    })).json();
  }
  const payload = () => ({ app: 'privet-ru', format: 1, savedAt: new Date().toISOString(), device: RU.deviceId(), state: RU.state });

  /** Gộp bản trên Drive vào máy này */
  function applyRemote(data) {
    if (!isObj(data) || data.app !== 'privet-ru' || !isObj(data.state)) throw new Error('File đồng bộ trên Google Drive không đúng định dạng của app.');
    const R = data.state;
    const L = RU.state;
    const first = !meta.lastSync; // lần đầu nối máy này: luôn gộp, không bỏ dữ liệu bên nào
    const re = num(R.epoch); const le = num(L.epoch);
    if (!first && le > re) return { n: 0, settings: [], ignoreRemote: true }; // máy này vừa «Xóa tiến độ» → thay bản cũ trên Drive
    if (!first && re > le) { // máy khác đã «Xóa tiến độ» → máy này cũng bắt đầu lại theo bản trên Drive
      const keep = {};
      LOCAL_ONLY.forEach((k) => { keep[k] = L.settings[k]; });
      RU.store.load(JSON.parse(JSON.stringify(R)));
      Object.assign(RU.state.settings, keep);
      return { n: 1, settings: [], replaced: true };
    }
    return mergeState(L, R);
  }

  /* ============================ Đồng bộ ============================ */
  async function run(opts) {
    setStatus('busy', !hasToken() && RU.isStandalone() ? 'Đang chờ đăng nhập Google… đăng nhập xong hãy quay lại app.' : 'Đang đồng bộ…');
    try {
      await getToken();
      if (statusMsg !== 'Đang đồng bộ…') setStatus('busy', 'Đang đồng bộ…');
      if (!meta.email) { meta.email = (await whoAmI()) || 'Google'; saveMeta(); }
      dirty = false; // thay đổi xảy ra trong lúc đồng bộ sẽ bật lại cờ này
      const total = { n: 0, settings: [], replaced: false };
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await findFile();
        const remote = file ? await download(file.id) : null;
        const res = remote ? applyRemote(remote) : { n: 0, settings: [] };
        total.n += res.n;
        total.settings = total.settings.concat(res.settings || []);
        total.replaced = total.replaced || !!res.replaced;
        applying = true;
        try { RU.store.saveNow(); } finally { applying = false; }
        if (remote && !res.ignoreRemote && sharedView(RU.state) === sharedView(remote.state)) break; // Drive đã có đúng bản này
        if (file && attempt === 0) {
          const latest = await findFile(); // máy khác vừa ghi trong lúc gộp → gộp lại lần nữa
          if (latest && latest.modifiedTime !== file.modifiedTime) continue;
        }
        await upload(payload(), file && file.id);
        break;
      }
      meta.lastSync = Date.now();
      saveMeta();
      syncedThisSession = true;
      setStatus(idleStatus());
      if (total.n || total.replaced) {
        total.settings.forEach((k) => RU.emit('settings', k));
        RU.emit('xp');
        RU.emit('synced', total);
      }
      if (total.replaced) RU.toast('☁️ Tiến độ đã được xóa ở máy khác — máy này cũng bắt đầu lại.', 'warn', 5000);
      else if (total.n) RU.toast('☁️ Đã lấy về ' + total.n + ' thay đổi từ máy khác', 'ok', 3500);
      else if (!opts.quiet) RU.toast('☁️ Đã đồng bộ với Google Drive', 'ok');
      return true;
    } catch (e) {
      dirty = true;
      setStatus('error', (e && e.message) || String(e));
      if (!opts.quiet) RU.toast(statusMsg, 'bad', 5000);
      return false;
    }
  }

  /** opts.interactive: do người dùng bấm (được mở cửa sổ Google). Tự đồng bộ thì chỉ chạy khi còn quyền truy cập. */
  function syncNow(opts) {
    opts = opts || {};
    if (busy) { again = true; return busy; }
    if (!available()) {
      if (opts.interactive) RU.toast('Đồng bộ chỉ chạy khi mở app bằng địa chỉ web (xem Cài đặt).', 'warn', 4000);
      return Promise.resolve(false);
    }
    if (!opts.interactive && !hasToken()) { setStatus(idleStatus()); return Promise.resolve(false); }
    clearTimeout(autoTimer);
    busy = run(opts).finally(() => {
      busy = null;
      if (again) { again = false; if (dirty) scheduleAuto(1500); }
    });
    return busy;
  }

  function scheduleAuto(ms) {
    clearTimeout(autoTimer);
    if (!meta.email || meta.auto === false || !hasToken()) return;
    autoTimer = setTimeout(() => { if (dirty) syncNow({ quiet: true }); }, ms == null ? AUTO_DELAY : ms);
  }

  RU.on('saved', () => {
    if (applying || !meta.email) return;
    dirty = true;
    if (status !== 'busy') setStatus(idleStatus());
    scheduleAuto();
  });
  // Rời app (chuyển tab, tắt màn hình điện thoại) → đưa thay đổi lên luôn nếu còn quyền
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dirty && meta.email && meta.auto !== false && hasToken()) syncNow({ quiet: true });
  });

  function disconnect() {
    // Không thu hồi quyền ở Google: quyền này dùng chung với Coin Manager
    token = null;
    meta = {};
    saveMeta();
    dirty = false;
    syncedThisSession = false;
    clearTimeout(autoTimer);
    setStatus('off');
  }

  /* ============================ Hiển thị ============================ */
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (!(m >= 1)) return 'vừa xong';
    if (m < 60) return m + ' phút trước';
    if (m < 48 * 60) return Math.round(m / 60) + ' giờ trước';
    return Math.round(m / 1440) + ' ngày trước';
  }
  function describe() {
    switch (status) {
      case 'busy': return statusMsg || 'Đang đồng bộ…';
      case 'error': return statusMsg || 'Đồng bộ chưa xong.';
      case 'pending': return 'Có tiến độ mới chưa đưa lên Google Drive.';
      case 'ok': return 'Đã đồng bộ ' + ago(meta.lastSync) + '.';
      case 'idle': return meta.lastSync ? 'Đồng bộ lần cuối: ' + ago(meta.lastSync) + '.' : 'Chưa đồng bộ lần nào.';
      default: return 'Chưa kết nối.';
    }
  }

  /** Nút ☁️ trên thanh trên cùng (chỉ hiện khi đã kết nối) */
  function pill() {
    const el = h('button', { type: 'button', class: 'ts cloud', 'aria-label': 'Đồng bộ Google Drive' }, RU.icon('cloud', 18), h('i', { class: 'cloud-dot' }));
    el.addEventListener('click', () => syncNow({ interactive: true }));
    const render = () => {
      el.hidden = !(meta.email && available());
      el.className = 'ts cloud ' + status;
      el.title = status === 'idle' ? 'Bấm để đồng bộ tiến độ với Google Drive'
        : status === 'pending' ? 'Có tiến độ mới chưa đồng bộ — bấm để đồng bộ'
          : status === 'error' ? statusMsg + (/bấm/i.test(statusMsg) ? '' : ' Bấm để thử lại.') : describe();
    };
    render();
    RU.on('sync', render);
    setInterval(render, 60000); // cập nhật «x phút trước»
    return el;
  }

  /** Lời nhắc ở trang chủ: mở app → bấm một lần để lấy tiến độ mới nhất từ máy khác */
  let dismissed = false;
  function notice(ctx) {
    const box = h('div', { class: 'sync-notice' });
    const render = () => {
      box.innerHTML = '';
      if (!meta.email || !available() || syncedThisSession || dismissed) return;
      const isBusy = status === 'busy';
      box.append(h('div', { class: 'callout sync-callout' + (status === 'error' ? ' warn' : '') },
        h('span', { class: 'sync-callout-text' }, '☁️ ', isBusy ? 'Đang đồng bộ tiến độ…' : status === 'error' ? statusMsg : 'Đồng bộ để lấy tiến độ mới nhất từ các máy khác.'),
        isBusy ? null : h('span', { class: 'row gap' },
          h('button', { type: 'button', class: 'btn primary sm', onclick: () => syncNow({ interactive: true }) }, 'Đồng bộ'),
          h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { dismissed = true; render(); } }, 'Để sau'))));
    };
    render();
    const off = RU.on('sync', render);
    if (ctx) ctx.onCleanup(off);
    return box;
  }

  function init() {
    setStatus(idleStatus());
    if (meta.email) preload();
    // App đã cài: đăng nhập xong ở oauth.html rồi quay về (app tải lại) → làm tiếp việc đồng bộ dở
    const resumed = available() ? resumeAfterRedirect() : null;
    if (resumed) {
      if (resumed.error) { setStatus('error', resumed.error); RU.toast(resumed.error, 'bad', 5000); }
      else setTimeout(() => syncNow({}), 0);
    }
  }

  RU.Sync = {
    get available() { return available(); },
    get connected() { return !!meta.email; },
    get email() { return meta.email || ''; },
    get lastSync() { return meta.lastSync || 0; },
    get status() { return status; },
    get message() { return statusMsg; },
    get auto() { return meta.auto !== false; },
    set auto(v) { meta.auto = !!v; saveMeta(); if (v && dirty) scheduleAuto(1500); },
    get onWebOrigin() { return location.origin === WEB_ORIGIN; },
    ONLINE_URL,
    init, preload, syncNow, disconnect, describe, ago, pill, notice,
    HANDOFF_KEY,
    _test: { mergeState, applyRemote, stable, sharedView, streakFrom, redirectUri },
  };
})(window.RU = window.RU || {});
