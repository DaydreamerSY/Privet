/* =====================================================================
   writingpad.js — bảng viết (canvas) có dòng kẻ ô li và hoạt ảnh nét viết
   Toạ độ "thế giới" trùng với toạ độ của chữ mẫu (glyphs.js).
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const s = RU.s;
  const VIEW = { y0: -32, w: 174, h: 174 };
  const LINES = { cap: 0, mid: 40, base: 100, desc: 130 };

  const css = (name, fb) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  };

  /** Vị trí số thứ tự nét: đầu nét, dời dọc theo nét nếu trùng với số trước đó */
  function markerPositions(polys) {
    const pos = [];
    polys.forEach((p) => {
      let q = p[0];
      for (let k = 0; k < p.length && pos.some((o) => Math.hypot(o.x - q.x, o.y - q.y) < 13); k += 2) q = p[k];
      pos.push({ x: q.x, y: q.y });
    });
    return pos;
  }

  /**
   * opts: { glyph, mode: 'trace' | 'free', onChange(), numbers: true }
   */
  RU.WritingPad = function (opts) {
    opts = opts || {};
    let glyph = opts.glyph || null;
    let mode = opts.mode || 'free';
    const strokes = [];
    let cur = null;
    let pointerId = null;
    let ink = 'normal';
    let lastW = 0; let dpr = 1; let scale = 1; let x0 = -VIEW.w / 2;

    const canvas = h('canvas', { class: 'pad-canvas', 'aria-label': 'Bảng viết chữ' });
    const wrap = h('div', { class: 'pad' }, canvas);
    let ctx = canvas.getContext('2d');

    function centerX() {
      const b = glyph ? glyph.bounds : { minX: 0, maxX: 60 };
      return (b.minX + b.maxX) / 2;
    }

    function layout(force) {
      const w = Math.round(wrap.clientWidth);
      if (!w || (w === lastW && !force)) return;
      lastW = w;
      dpr = window.devicePixelRatio || 1;
      canvas.style.width = w + 'px';
      canvas.style.height = w + 'px';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      scale = w / VIEW.w;
      x0 = centerX() - VIEW.w / 2;
      redraw();
    }

    function line(y, color, width, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + VIEW.w, y); ctx.stroke();
      ctx.restore();
    }

    function drawGuide() {
      ctx.save();
      ctx.strokeStyle = css('--pad-guide', '#dfe3ee');
      ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      glyph.strokes.forEach((d) => ctx.stroke(new Path2D(d)));
      if (opts.numbers !== false) {
        const marks = markerPositions(glyph.polys);
        glyph.polys.forEach((p, i) => {
          const a = marks[i];
          const k0 = p.findIndex((q) => q.x === a.x && q.y === a.y);
          const b = p[Math.min(p.length - 1, Math.max(0, k0) + 6)];
          // mũi tên nhỏ chỉ hướng
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          ctx.fillStyle = css('--pad-num', '#9aa6c7');
          ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.save(); ctx.translate(a.x + Math.cos(ang) * 11, a.y + Math.sin(ang) * 11); ctx.rotate(ang);
          ctx.beginPath(); ctx.moveTo(3.5, 0); ctx.lineTo(-2.5, -3); ctx.lineTo(-2.5, 3); ctx.closePath(); ctx.fill();
          ctx.restore();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 7.5px "Segoe UI", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), a.x, a.y + 0.4);
        });
      }
      ctx.restore();
    }

    function drawStroke(p) {
      if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0].x, p[0].y, 3.4, 0, Math.PI * 2); ctx.fill(); return; }
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i].x + p[i + 1].x) / 2; const my = (p[i].y + p[i + 1].y) / 2;
        ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my);
      }
      const l = p[p.length - 1];
      ctx.lineTo(l.x, l.y);
      ctx.stroke();
    }

    function redraw() {
      if (!lastW) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const k = scale * dpr;
      ctx.setTransform(k, 0, 0, k, -x0 * k, -VIEW.y0 * k);
      ctx.fillStyle = css('--pad-band', 'rgba(47,91,234,.045)');
      ctx.fillRect(x0, LINES.mid, VIEW.w, LINES.base - LINES.mid);
      const lc = css('--pad-line', '#c7d2f3');
      line(LINES.cap, lc, 0.9);
      line(LINES.mid, lc, 0.9, [4, 4]);
      line(LINES.base, css('--pad-base', '#6f8be0'), 1.5);
      line(LINES.desc, lc, 0.9, [1.5, 3.5]);
      if (mode === 'trace' && glyph) drawGuide();
      const col = ink === 'ok' ? css('--ink-ok', '#1f9d63') : ink === 'bad' ? css('--ink-bad', '#e5484d') : css('--ink', '#1d3a9e');
      ctx.strokeStyle = col; ctx.fillStyle = col;
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.forEach(drawStroke);
    }

    function toWorld(e) {
      const r = canvas.getBoundingClientRect();
      return { x: x0 + (e.clientX - r.left) / r.width * VIEW.w, y: VIEW.y0 + (e.clientY - r.top) / r.height * VIEW.h };
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (pointerId !== null) return;
      e.preventDefault();
      pointerId = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
      if (ink !== 'normal') ink = 'normal';
      cur = [toWorld(e)];
      strokes.push(cur);
      redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId || !cur) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const p = toWorld(ev);
        const last = cur[cur.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) > 0.7) cur.push(p);
      }
      redraw();
    });
    const end = (e) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      cur = null;
      redraw();
      if (opts.onChange) opts.onChange();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(() => layout()); ro.observe(wrap); }
    else window.addEventListener('resize', () => layout());
    requestAnimationFrame(() => layout(true));
    setTimeout(() => layout(), 80);   // dự phòng khi trang đang ẩn (rAF bị tạm dừng)

    /** Vẽ y hệt bảng (dòng kẻ, nét mờ, nét đã viết) lên một canvas khác — dùng cho ô xem trước */
    function paintTo(target, size) {
      const d = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.round(size * d);
      if (target.width !== px || target.height !== px) { target.width = px; target.height = px; }
      const saved = [ctx, lastW, dpr, scale, x0];
      ctx = target.getContext('2d'); lastW = size; dpr = d; scale = size / VIEW.w; x0 = centerX() - VIEW.w / 2;
      try { redraw(); } finally { [ctx, lastW, dpr, scale, x0] = saved; }
    }

    return {
      el: wrap,
      paintTo,
      strokes: () => strokes.map((st) => st.slice()),
      isEmpty: () => strokes.length === 0,
      clear() { strokes.length = 0; ink = 'normal'; redraw(); if (opts.onChange) opts.onChange(); },
      undo() { strokes.pop(); ink = 'normal'; redraw(); if (opts.onChange) opts.onChange(); },
      setInk(state) { ink = state || 'normal'; redraw(); },
      setMode(m) { mode = m; redraw(); },
      getMode: () => mode,
      setGlyph(g) { glyph = g; strokes.length = 0; ink = 'normal'; layout(true); },
      redraw,
      layout,
      destroy() { if (ro) ro.disconnect(); },
    };
  };

  /**
   * Hoạt ảnh thứ tự nét viết (SVG). opts: { size: 'sm'|'md'|'lg', loop }
   */
  RU.StrokeAnim = function (glyph, opts) {
    opts = opts || {};
    const b = glyph.bounds;
    const cx = (b.minX + b.maxX) / 2;
    const w = Math.max(b.w + 34, 104);
    const vx = cx - w / 2; const vy = -34; const vh = 174;
    const svg = s('svg', { viewBox: vx + ' ' + vy + ' ' + w + ' ' + vh, class: 'anim ' + (opts.size || 'md'), role: 'img', 'aria-label': 'Cách viết chữ ' + glyph.char });
    [[LINES.cap, 'gl'], [LINES.mid, 'gl dash'], [LINES.base, 'gl base'], [LINES.desc, 'gl dot']]
      .forEach(([y, cl]) => svg.appendChild(s('line', { x1: vx, x2: vx + w, y1: y, y2: y, class: cl })));
    svg.appendChild(s('rect', { x: vx, y: LINES.mid, width: w, height: LINES.base - LINES.mid, class: 'band' }));
    const ghost = s('g', { class: 'ghost' });
    const live = s('g', { class: 'live' });
    const marks = s('g', { class: 'marks' });
    glyph.strokes.forEach((d) => ghost.appendChild(s('path', { d })));
    const paths = glyph.strokes.map((d) => { const p = s('path', { d }); live.appendChild(p); return p; });
    const mpos = markerPositions(glyph.polys);
    const markEls = glyph.polys.map((p, i) => {
      const m = mpos[i];
      const g = s('g', { class: 'mark' }, s('circle', { cx: m.x, cy: m.y, r: 6.8 }), s('text', { x: m.x, y: m.y + 0.6 }, String(i + 1)));
      marks.appendChild(g);
      return g;
    });
    svg.append(ghost, live, marks);

    let anims = [];
    let timer = null;
    function stop() { anims.forEach((a) => { try { a.cancel(); } catch (e) { /* bỏ qua */ } }); anims = []; clearTimeout(timer); }
    function play() {
      stop();
      let t = 250;
      paths.forEach((p, i) => {
        const L = glyph.lengths[i] * 1.02 + 2;
        p.style.strokeDasharray = L + ' ' + L;
        const dur = Math.max(380, L * 8.5);
        if (p.animate) {
          anims.push(p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: dur, delay: t, fill: 'both', easing: 'ease-in-out' }));
          anims.push(markEls[i].animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 180, delay: t, fill: 'both' }));
        } else {
          p.style.strokeDashoffset = 0;
        }
        t += dur + 260;
      });
      if (opts.loop) timer = setTimeout(play, t + 1400);
    }
    if (opts.autoplay !== false) requestAnimationFrame(play);
    return { el: svg, play, stop };
  };

  /* =====================================================================
     Bảng viết dạng cửa sổ nổi (điện thoại, màn hình cảm ứng)
     Bảng viết phải chặn cử chỉ vuốt để vẽ, nên nếu nằm giữa trang thì đặt ngón tay lên là
     không cuộn được trang. Vì vậy trên điện thoại: trong trang chỉ có ô xem trước (cuộn thoải
     mái), chạm vào mới mở bảng viết toàn màn hình. Dùng chung một cửa sổ cho mọi bài viết.
     ===================================================================== */
  const mq = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  const WS = RU.WriteSheet = {
    /** Dùng cửa sổ nổi khi màn hình cảm ứng hoặc màn hình hẹp */
    wanted: () => mq('(pointer: coarse)') || mq('(max-width: 760px)'),
    isOpen: false,
    cfg: null,
  };
  let wsEl = null; let wsHead = null; let wsSlot = null; let wsFb = null; let wsPrimary = null;
  let pushed = false; let backPending = false; let releaseTimer = null;

  function fit() {
    if (!WS.isOpen || !WS.cfg) return;
    const w = wsSlot.clientWidth; const hh = wsSlot.clientHeight;
    if (!w || !hh) return;
    WS.cfg.pad.el.style.width = Math.max(150, Math.floor(Math.min(w, hh))) + 'px';
    WS.cfg.pad.layout();
  }
  function onPop() {
    if (backPending) { // trả lại mục lịch sử của lần đóng trước
      backPending = false;
      if (WS.isOpen && !pushed) { try { history.pushState({ ws: true }, ''); pushed = true; } catch (e) { /* bỏ qua */ } }
      return;
    }
    if (WS.isOpen) { pushed = false; WS.close(); } // nút Back của điện thoại → đóng bảng viết, không rời trang
  }
  function onKey(e) {
    if (!WS.isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); WS.close(); } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); e.stopImmediatePropagation();
      const p = WS.cfg && WS.cfg.current;
      if (p && p.onClick) p.onClick();
    }
  }
  function build() {
    wsHead = h('div', { class: 'ws-head-main' });
    wsSlot = h('div', { class: 'ws-pad' });
    wsFb = h('div', { class: 'ws-fb', 'aria-live': 'polite' });
    wsPrimary = h('button', { type: 'button', class: 'btn primary' });
    wsPrimary.addEventListener('click', () => { const p = WS.cfg && WS.cfg.current; if (p && p.onClick) p.onClick(); });
    const box = h('div', { class: 'ws', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Bảng viết' },
      h('div', { class: 'ws-head' }, wsHead,
        h('button', { type: 'button', class: 'icon-btn ws-close', title: 'Đóng bảng viết', 'aria-label': 'Đóng bảng viết', onclick: () => WS.close() }, RU.icon('x'))),
      wsSlot, wsFb,
      h('div', { class: 'ws-tools' },
        h('button', { type: 'button', class: 'btn ghost', onclick: () => WS.cfg && WS.cfg.pad.undo() }, RU.icon('undo', 18), ' Hoàn tác'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => WS.cfg && WS.cfg.pad.clear() }, RU.icon('trash', 18), ' Xóa'),
        wsPrimary));
    wsEl = h('div', { class: 'ws-overlay', hidden: true }, box);
    wsEl.addEventListener('click', (e) => { if (e.target === wsEl) WS.close(); });
    document.body.appendChild(wsEl);
    window.addEventListener('resize', fit);
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey, true);
  }

  /**
   * Mở (hoặc chuyển sang) bảng viết. cfg: { pad, head: () => Node, primary: { label, icon, kind, onClick }, onClose() }
   */
  WS.open = function (cfg) {
    clearTimeout(releaseTimer);
    if (!wsEl) build();
    const prev = WS.cfg;
    WS.cfg = cfg;
    wsHead.innerHTML = '';
    RU.append(wsHead, [typeof cfg.head === 'function' ? cfg.head() : cfg.head]);
    wsSlot.innerHTML = '';
    wsSlot.appendChild(cfg.pad.el);
    WS.feedback(cfg.fb ? cfg.fb.node : null, cfg.fb ? cfg.fb.kind : '');
    WS.setPrimary(cfg.current || cfg.primary);
    if (!WS.isOpen) {
      WS.isOpen = true;
      wsEl.hidden = false;
      document.documentElement.classList.add('ws-lock');
      if (!pushed && !backPending) { try { history.pushState({ ws: true }, ''); pushed = true; } catch (e) { pushed = false; } }
    }
    if (prev && prev !== cfg && prev.onClose) prev.onClose();
    fit();
    setTimeout(fit, 40);
  };

  WS.close = function () {
    if (!WS.isOpen) return;
    WS.isOpen = false;
    wsEl.hidden = true;
    document.documentElement.classList.remove('ws-lock');
    if (pushed) {
      pushed = false;
      // chỉ lùi lịch sử khi vẫn đang ở mục do bảng viết thêm vào (không lỡ quay về trang trước)
      if (history.state && history.state.ws) { backPending = true; history.back(); }
    }
    if (WS.cfg && WS.cfg.onClose) WS.cfg.onClose();
  };

  /** Bài viết bị huỷ (sang bài khác, rời trang): đóng cửa sổ nếu đang hiện bài đó — trừ khi ngay sau đó mở bài mới */
  WS.release = function (cfg) {
    if (!cfg || WS.cfg !== cfg) return;
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => { if (WS.cfg === cfg) { WS.close(); WS.cfg = null; } }, 0);
  };

  /** Lời nhận xét hiện dưới bảng viết (kind: 'ok' | 'bad'); nhớ lại để lần mở sau vẫn thấy */
  WS.feedback = function (node, kind) {
    if (WS.cfg) WS.cfg.fb = node ? { node, kind } : null;
    if (!wsFb) return;
    wsFb.innerHTML = '';
    wsFb.className = 'ws-fb' + (kind ? ' ' + kind : '');
    if (node) RU.append(wsFb, [node]);
  };

  /** Nút chính ở góc dưới (Kiểm tra → Tiếp / Xong) */
  WS.setPrimary = function (p) {
    if (!p) return;
    if (WS.cfg) WS.cfg.current = p;
    if (!wsPrimary) return;
    wsPrimary.innerHTML = '';
    wsPrimary.className = 'btn ' + (p.kind || 'primary');
    RU.append(wsPrimary, [p.icon ? RU.icon(p.icon, 18) : null, (p.icon ? ' ' : '') + p.label]);
  };

  /** Ô xem trước đặt trong trang: chạm để mở bảng viết; không chặn vuốt nên trang cuộn bình thường */
  WS.preview = function (pad, onOpen) {
    const cv = h('canvas', { class: 'pp-canvas', 'aria-hidden': 'true' });
    const label = h('span', { class: 'pp-label' });
    const el = h('button', { type: 'button', class: 'pad-preview', 'aria-label': 'Mở bảng viết' }, cv, label);
    el.addEventListener('click', onOpen);
    const update = () => {
      pad.paintTo(cv, Math.round(el.clientWidth) || 240);
      label.textContent = pad.isEmpty() ? '✍️ Chạm để viết' : '✍️ Chạm để viết tiếp';
    };
    update();
    setTimeout(update, 60); // vẽ lại đúng kích thước khi ô đã nằm trong trang
    return { el, update };
  };

  RU.PAD_LINES = LINES;
})(window.RU = window.RU || {});
