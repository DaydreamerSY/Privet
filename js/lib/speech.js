/* =====================================================================
   speech.js — luyện phát âm
   - Nhận dạng giọng nói tiếng Nga (Web Speech API: Chrome / Edge, cần mạng)
   - Ghi âm giọng người học (MediaRecorder) để nghe lại, so sánh với mẫu
   - Chấm điểm: so khớp từng từ giữa câu mẫu và câu máy nghe được
   ===================================================================== */
(function (RU) {
  'use strict';
  const U = RU.U;
  const getSR = () => window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ---------------- số → chữ (máy hay trả về chữ số) ---------------- */
  const UNITS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const HUND = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  function numWords(n) {
    if (!isFinite(n) || n < 0 || n > 999999) return String(n);
    if (n === 0) return UNITS[0];
    const out = [];
    if (n >= 1000) {
      const th = Math.floor(n / 1000);
      if (th === 1) out.push('тысяча');
      else {
        out.push(numWords(th).replace(/один$/, 'одна').replace(/два$/, 'две'));
        const l1 = th % 10; const l2 = th % 100;
        out.push(l2 >= 11 && l2 <= 14 ? 'тысяч' : l1 === 1 ? 'тысяча' : l1 >= 2 && l1 <= 4 ? 'тысячи' : 'тысяч');
      }
      n %= 1000;
    }
    if (n >= 100) { out.push(HUND[Math.floor(n / 100)]); n %= 100; }
    if (n >= 20) { out.push(TENS[Math.floor(n / 10)]); n %= 10; if (n) out.push(UNITS[n]); }
    else if (n >= 10) out.push(TEENS[n - 10]);
    else if (n > 0) out.push(UNITS[n]);
    return out.join(' ');
  }

  const norm = (s) => U.normRu(String(s).replace(/\d+/g, (m) => ' ' + numWords(parseInt(m, 10)) + ' '));
  const words = (s) => norm(s).split(' ').filter(Boolean);
  function sim(a, b) {
    if (a === b) return 1;
    const L = Math.max(a.length, b.length);
    return L ? 1 - U.lev(a, b) / L : 1;
  }

  /**
   * So câu mẫu với các phương án máy nghe được.
   * @returns { score 0..1, heard, per: [độ giống của từng từ mẫu] }
   */
  function score(target, alts) {
    const tw = words(target);
    let best = null;
    (alts || []).forEach((alt) => {
      const aw = words(alt);
      const m = tw.length; const n = aw.length;
      const dp = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
      const S = Array.from({ length: m }, (_, i) => aw.map((w) => sim(tw[i], w)));
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const s = S[i - 1][j - 1];
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], s >= 0.5 ? dp[i - 1][j - 1] + s : 0);
        }
      }
      const per = new Array(m).fill(0);
      let i = m; let j = n;
      while (i > 0 && j > 0) {
        const s = S[i - 1][j - 1];
        if (s >= 0.5 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + s)) < 1e-9) { per[i - 1] = s; i--; j--; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
        else j--;
      }
      let sc = per.reduce((a, v) => a + v, 0) / Math.max(1, m);
      sc = Math.max(0, sc - 0.08 * Math.max(0, n - m)); // nói thừa từ
      if (!best || sc > best.score) best = { score: sc, heard: alt, per };
    });
    return best || { score: 0, heard: '', per: tw.map(() => 0) };
  }
  const starsOf = (sc) => (sc >= 0.92 ? 3 : sc >= 0.75 ? 2 : sc >= 0.5 ? 1 : 0);

  /* ---------------- nghe + ghi âm ---------------- */
  const Speech = {
    get srSupported() { return !!getSR(); },
    get recSupported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); },
    noConcurrent: false, // trình duyệt không cho vừa nhận dạng vừa ghi âm
    numWords, norm, words, score, starsOf,

    /**
     * Bắt đầu nghe. opts: { recognize, maxSec, onInterim(text), onFinal(alts), onError(code), onEnd({audioUrl}) }
     * Trả về bộ điều khiển { stop() }.
     */
    async listen(opts) {
      const SR = getSR();
      const useSR = !!SR && opts.recognize !== false;
      const ctl = { stop() {} };
      let stream = null; let recorder = null; const chunks = [];
      let ended = false;

      const finish = () => {
        if (ended) return;
        ended = true;
        clearTimeout(ctl.timer);
        const done = () => {
          if (stream) stream.getTracks().forEach((t) => t.stop());
          const audioUrl = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: (recorder && recorder.mimeType) || 'audio/webm' })) : null;
          if (opts.onEnd) opts.onEnd({ audioUrl });
        };
        if (recorder && recorder.state !== 'inactive') { recorder.onstop = done; try { recorder.stop(); } catch (e) { done(); } }
        else done();
      };

      if (Speech.recSupported && !(useSR && Speech.noConcurrent)) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          recorder.start();
        } catch (e) {
          stream = null; recorder = null;
          if (!useSR) {
            if (opts.onError) opts.onError(e && e.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture');
            finish();
            return ctl;
          }
        }
      }

      if (useSR) {
        const r = new SR();
        r.lang = 'ru-RU';
        r.interimResults = true;
        r.maxAlternatives = 5;
        r.continuous = false;
        let finalAlts = null;
        r.onresult = (ev) => {
          let interim = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            if (res.isFinal) finalAlts = Array.from(res).map((a) => a.transcript);
            else interim += res[0].transcript;
          }
          if (interim && opts.onInterim) opts.onInterim(interim);
        };
        r.onerror = (ev) => {
          if (ev.error === 'audio-capture' && recorder) Speech.noConcurrent = true;
          if (opts.onError) opts.onError(ev.error);
        };
        r.onend = () => { if (finalAlts && opts.onFinal) opts.onFinal(finalAlts); finish(); };
        try { r.start(); } catch (e) { if (opts.onError) opts.onError('start-failed'); finish(); return ctl; }
        ctl.stop = () => { try { r.stop(); } catch (e) { finish(); } };
        ctl.timer = setTimeout(() => ctl.stop(), (opts.maxSec || 12) * 1000);
      } else {
        ctl.stop = finish;
        ctl.timer = setTimeout(finish, (opts.maxSec || 6) * 1000);
      }
      return ctl;
    },
  };

  /** Lời giải thích cho mã lỗi nhận dạng giọng nói */
  Speech.errorText = function (code) {
    return ({
      'not-allowed': 'Bạn chưa cho phép dùng micro. Hãy bấm biểu tượng ổ khóa / micro trên thanh địa chỉ và chọn «Cho phép».',
      'service-not-allowed': 'Trình duyệt này không cho dùng dịch vụ nhận dạng giọng nói. Hãy dùng Microsoft Edge hoặc Google Chrome.',
      'audio-capture': 'Không tìm thấy micro. Hãy kiểm tra micro / tai nghe rồi thử lại.',
      'no-speech': 'Không nghe thấy gì. Hãy nói to và gần micro hơn nhé.',
      'network': 'Không kết nối được dịch vụ nhận dạng giọng nói (cần mạng, và trình duyệt phải là Edge hoặc Chrome).',
      'language-not-supported': 'Trình duyệt này chưa hỗ trợ nhận dạng tiếng Nga.',
      'aborted': 'Đã dừng nghe.',
      'start-failed': 'Không bật được micro. Hãy thử lại.',
    })[code] || 'Có lỗi khi nghe (' + code + '). Hãy thử lại.';
  };
  /** Lỗi khiến không thể dùng nhận dạng trong trình duyệt này → chuyển sang chỉ ghi âm */
  Speech.fatal = (code) => ['service-not-allowed', 'network', 'language-not-supported'].includes(code);

  RU.Speech = Speech;
})(window.RU = window.RU || {});
