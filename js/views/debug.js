/* =====================================================================
   views/debug.js — trang kiểm thử nội bộ (không có trên menu)
   #/debug/glyphs : xem toàn bộ nét mẫu
   #/debug/recog  : chạy thử bộ nhận dạng với chữ viết giả lập
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const s = RU.s;

  RU.route('debug/glyphs', (ctx) => {
    const main = ctx.main;
    main.append(RU.ui.header('Nét mẫu (kiểm thử)', { back: '#/settings' }));
    const grid = h('div', { class: 'dbg-grid' });
    RU.Glyphs.letters.forEach((L) => ['u', 'l'].forEach((cs) => {
      const g = RU.Glyphs.get(L, cs);
      [g.strokes].concat(g.alts).forEach((strokes, ai) => {
        const gg = ai === 0 ? g : Object.assign({}, g, { strokes, polys: strokes.map((d) => RU.Path.polyline(d, 1)) });
        const svg = s('svg', { viewBox: '-20 -30 140 170', class: 'dbg-svg' });
        [[0, '#c7d2f3'], [40, '#c7d2f3'], [100, '#6f8be0'], [130, '#c7d2f3']].forEach(([y, c]) => svg.appendChild(s('line', { x1: -20, x2: 120, y1: y, y2: y, stroke: c, 'stroke-width': 1 })));
        const off = 50 - (g.bounds.minX + g.bounds.maxX) / 2;
        const grp = s('g', { transform: 'translate(' + off + ' 0)' });
        gg.strokes.forEach((d, i) => {
          grp.appendChild(s('path', { d, fill: 'none', stroke: ['#2f5bea', '#e5484d', '#1f9d63', '#e8a317', '#8a5cf6'][i % 5], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
          const p = gg.polys[i][0];
          grp.appendChild(s('circle', { cx: p.x, cy: p.y, r: 5, fill: '#111' }));
          grp.appendChild(s('text', { x: p.x, y: p.y + 3, 'font-size': 8, fill: '#fff', 'text-anchor': 'middle' }, String(i + 1)));
        });
        svg.appendChild(grp);
        grid.append(h('figure', { class: 'card' }, svg, h('figcaption', null, g.char + (ai ? ' (kiểu ' + (ai + 1) + ')' : ''))));
      });
    }));
    main.append(grid);
  });

  /* ---------------- giả lập chữ viết tay ---------------- */
  function rng(seed) { let x = seed >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }
  function distort(polys, R, level) {
    const b = RU.Path.bounds(polys);
    const cx = (b.minX + b.maxX) / 2; const cy = (b.minY + b.maxY) / 2;
    const rot = (R() - 0.5) * 2 * 8 * level * Math.PI / 180;
    const sx = 1 + (R() - 0.5) * 0.3 * level; const sy = 1 + (R() - 0.5) * 0.24 * level;
    const sh = (R() - 0.5) * 0.3 * level;
    const out = polys.map((p) => {
      const ox = (R() - 0.5) * 6 * level; const oy = (R() - 0.5) * 6 * level;
      const ph = R() * 6.28; const ph2 = R() * 6.28; const amp = (0.8 + R() * 2.2) * level; const fq = 0.1 + R() * 0.2;
      let pts = RU.Path.resampleSpacing(p, 2).map((q, i) => {
        let x = q.x - cx; const y = q.y - cy;
        x += sh * y;
        const xr = x * Math.cos(rot) - y * Math.sin(rot); const yr = x * Math.sin(rot) + y * Math.cos(rot);
        return { x: xr * sx + cx + ox + Math.sin(i * fq + ph) * amp, y: yr * sy + cy + oy + Math.cos(i * fq + ph2) * amp };
      });
      if (R() < 0.5) pts = pts.reverse();
      return pts;
    });
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }
  RU.debugDistort = distort;

  const pctl = (arr, p) => { if (!arr.length) return NaN; const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };

  RU.route('debug/recog', (ctx) => {
    const main = ctx.main;
    const n = parseInt(ctx.query.n || '10', 10);
    const level = parseFloat(ctx.query.level || '1');
    const strict = ctx.query.strict || 'normal';
    main.append(RU.ui.header('Kiểm thử nhận dạng', { back: '#/settings', sub: 'n=' + n + ' mẫu/chữ · mức nhiễu ' + level + ' · độ khó ' + strict }));
    const out = h('pre', { class: 'card dbg-out' }, 'Đang chạy…');
    main.append(out);
    const jobs = [];
    RU.Glyphs.letters.forEach((L) => ['u', 'l'].forEach((cs) => jobs.push([L, cs])));
    const R = rng(12345);
    const res = { genuine: {}, dGen: [], d2: [], fa: 0, faList: {}, caseTotal: 0, caseCaught: 0 };
    let ji = 0;
    let cancelled = false;
    ctx.onCleanup(() => { cancelled = true; });
    const step = () => {
      if (cancelled) return;
      const t0 = performance.now();
      while (ji < jobs.length && performance.now() - t0 < 40) {
        const [L, cs] = jobs[ji++];
        const g = RU.Glyphs.get(L, cs);
        const rec = res.genuine[L + ':' + cs] = { ok: 0, n: 0, conf: {} };
        for (let k = 0; k < n; k++) {
          const st = distort(g.polys, R, level);
          const ranks = RU.Recog.rank(st);
          const v = RU.Recog.verify(st, L, cs, { ranks, strict });
          rec.n++;
          if (v.ok) rec.ok++; else { const key = (v.best.cs === 'u' ? v.best.letter : v.best.letter.toLowerCase()); rec.conf[key] = (rec.conf[key] || 0) + 1; }
          res.dGen.push(v.dTarget);
          if (v.detail) (res.det = res.det || []).push(v.detail);
          const te = ranks.find((r) => r.letter === L && r.cs === cs);
          (res.dP = res.dP || []).push(te.dP);
          (res.hTU = res.hTU || []).push(te.hTU);
          (res.hUT = res.hUT || []).push(te.hUT);
          const other = ranks.find((r) => r.letter !== L);
          res.d2.push(other.d - v.dTarget);
          // chấp nhận nhầm khi đề bài là chữ khác
          RU.Glyphs.letters.forEach((Y) => {
            if (Y === L) return;
            const w = RU.Recog.verify(st, Y, cs, { ranks, strict });
            if (w.ok) { res.fa++; const key = g.char + '→' + (cs === 'u' ? Y : Y.toLowerCase()); res.faList[key] = (res.faList[key] || 0) + 1; }
          });
          // viết nhầm cỡ chữ (hoa ↔ thường) với chữ cùng hình dạng
          if (!['А', 'Б', 'Е', 'Ё'].includes(L)) {
            res.caseTotal++;
            const w = RU.Recog.verify(st, L, cs === 'u' ? 'l' : 'u', { ranks, strict });
            if (!w.ok) res.caseCaught++;
          }
        }
      }
      if (ji < jobs.length) { out.textContent = 'Đang chạy… ' + ji + '/' + jobs.length; setTimeout(step, 0); return; }
      // kiểm tra thiếu chi tiết
      const missing = [
        ['Щ', 'u', ['M 0 0 L 0 100', 'M 40 0 L 40 100', 'M 80 0 L 80 100', 'M 0 100 L 80 100']],
        ['Ъ', 'u', ['M 18 0 L 18 100', 'M 18 46 L 44 46 A 27 27 0 0 1 44 100 L 18 100']],
        ['Ы', 'u', ['M 0 0 L 0 100', 'M 0 46 L 26 46 A 27 27 0 0 1 26 100 L 0 100']],
        ['Ц', 'u', ['M 0 0 L 0 100', 'M 56 0 L 56 100', 'M 0 100 L 56 100']],
      ];
      ['Й', 'Ё', 'Ц', 'Щ'].forEach((L) => ['u', 'l'].forEach((cs) => {
        const g = RU.Glyphs.get(L, cs);
        missing.push([L, cs, g.strokes.filter((_, i) => !g.detail.includes(i)), cs]);
      }));
      const missLines = missing.map(([L, cs, strokes]) => {
        let caught = 0; let msg = ''; const hs = [];
        for (let k = 0; k < n; k++) {
          const st = distort(strokes.map((d) => RU.Path.polyline(d, 1)), R, level);
          const ranks = RU.Recog.rank(st);
          const v = RU.Recog.verify(st, L, cs, { strict, ranks });
          hs.push(ranks.find((r) => r.letter === L && r.cs === cs).hTU);
          if (!v.ok) caught++;
          msg = v.msg;
        }
        return '  ' + (cs === 'u' ? L : L.toLowerCase()) + ' thiếu chi tiết: bắt lỗi ' + caught + '/' + n + ' (hTU p10=' + pctl(hs, 0.1).toFixed(3) + ' p50=' + pctl(hs, 0.5).toFixed(3) + ') — «' + msg + '»';
      });
      let total = 0; let ok = 0; const weak = [];
      Object.entries(res.genuine).forEach(([k, r]) => {
        total += r.n; ok += r.ok;
        if (r.ok / r.n < 0.9) weak.push('  ' + k + ': ' + r.ok + '/' + r.n + ' nhầm thành ' + JSON.stringify(r.conf));
      });
      const fa = Object.entries(res.faList).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + '×' + v).join(', ');
      out.textContent = [
        'NGƯỠNG: ' + JSON.stringify(RU.Recog.TH),
        'Chữ đúng được chấp nhận: ' + ok + '/' + total + ' (' + (100 * ok / total).toFixed(1) + '%)',
        'Khoảng cách tới mẫu đúng: p50=' + pctl(res.dGen, 0.5).toFixed(4) + ' p90=' + pctl(res.dGen, 0.9).toFixed(4) + ' p97=' + pctl(res.dGen, 0.97).toFixed(4) + ' max=' + Math.max(...res.dGen).toFixed(4),
        'Biên so với chữ gần nhất khác: p05=' + pctl(res.d2, 0.05).toFixed(4) + ' p50=' + pctl(res.d2, 0.5).toFixed(4),
        'dP: p50=' + pctl(res.dP, 0.5).toFixed(4) + ' p90=' + pctl(res.dP, 0.9).toFixed(4) + ' p97=' + pctl(res.dP, 0.97).toFixed(4),
        'hTU (thiếu): p50=' + pctl(res.hTU, 0.5).toFixed(4) + ' p90=' + pctl(res.hTU, 0.9).toFixed(4) + ' p97=' + pctl(res.hTU, 0.97).toFixed(4) + ' max=' + Math.max(...res.hTU).toFixed(4),
        'hUT (thừa): p50=' + pctl(res.hUT, 0.5).toFixed(4) + ' p90=' + pctl(res.hUT, 0.9).toFixed(4) + ' p97=' + pctl(res.hUT, 0.97).toFixed(4) + ' max=' + Math.max(...res.hUT).toFixed(4),
        'Chi tiết (chữ đúng có chi tiết): p50=' + pctl(res.det || [], 0.5).toFixed(4) + ' p90=' + pctl(res.det || [], 0.9).toFixed(4) + ' max=' + Math.max(0, ...(res.det || [])).toFixed(4),
        'Chấp nhận nhầm (đề bài là chữ khác): ' + res.fa + ' lần' + (fa ? ' — ' + fa : ''),
        'Phát hiện viết sai cỡ hoa/thường: ' + res.caseCaught + '/' + res.caseTotal,
        'Chữ yếu (< 90%):', weak.length ? weak.join('\n') : '  (không có)',
        'Thiếu chi tiết:', missLines.join('\n'),
      ].join('\n');
      window.__recogReport = out.textContent;
    };
    setTimeout(step, 50);
  });
})(window.RU = window.RU || {});
