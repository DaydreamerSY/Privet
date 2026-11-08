/* =====================================================================
   path.js — phân tích, biến đổi và lấy mẫu điểm từ đường SVG
   (mỗi nét chữ mẫu được mô tả bằng một chuỗi path SVG)
   ===================================================================== */
(function (RU) {
  'use strict';

  function tokenize(d) {
    const re = /([MLHVCQAZmlhvcqaz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g;
    const out = [];
    let m;
    while ((m = re.exec(d))) out.push(m[1] !== undefined ? m[1] : parseFloat(m[2]));
    return out;
  }

  /** Chuyển chuỗi path thành danh sách đoạn với toạ độ tuyệt đối */
  function parse(d) {
    const t = tokenize(d);
    const segs = [];
    let i = 0; let cmd = 'M';
    let x = 0; let y = 0; let sx = 0; let sy = 0;
    const n = () => t[i++];
    while (i < t.length) {
      if (typeof t[i] === 'string') cmd = t[i++];
      const rel = cmd !== cmd.toUpperCase();
      const C = cmd.toUpperCase();
      const ox = rel ? x : 0; const oy = rel ? y : 0;
      if (C === 'M') {
        x = sx = n() + ox; y = sy = n() + oy;
        segs.push({ c: 'M', x, y });
        cmd = rel ? 'l' : 'L';
      } else if (C === 'L') {
        const nx = n() + ox; const ny = n() + oy;
        segs.push({ c: 'L', x0: x, y0: y, x: nx, y: ny }); x = nx; y = ny;
      } else if (C === 'H') {
        const nx = n() + ox;
        segs.push({ c: 'L', x0: x, y0: y, x: nx, y }); x = nx;
      } else if (C === 'V') {
        const ny = n() + oy;
        segs.push({ c: 'L', x0: x, y0: y, x, y: ny }); y = ny;
      } else if (C === 'C') {
        const x1 = n() + ox; const y1 = n() + oy; const x2 = n() + ox; const y2 = n() + oy; const nx = n() + ox; const ny = n() + oy;
        segs.push({ c: 'C', x0: x, y0: y, x1, y1, x2, y2, x: nx, y: ny }); x = nx; y = ny;
      } else if (C === 'Q') {
        const x1 = n() + ox; const y1 = n() + oy; const nx = n() + ox; const ny = n() + oy;
        segs.push({ c: 'Q', x0: x, y0: y, x1, y1, x: nx, y: ny }); x = nx; y = ny;
      } else if (C === 'A') {
        const rx = n(); const ry = n(); const rot = n(); const la = n(); const sw = n(); const nx = n() + ox; const ny = n() + oy;
        segs.push({ c: 'A', x0: x, y0: y, rx, ry, rot, la: la ? 1 : 0, sw: sw ? 1 : 0, x: nx, y: ny }); x = nx; y = ny;
      } else if (C === 'Z') {
        segs.push({ c: 'L', x0: x, y0: y, x: sx, y: sy }); x = sx; y = sy;
      } else {
        i++;
      }
    }
    return segs;
  }

  /** Biến đổi path: x' = x*sx + tx, y' = y*sy + ty */
  function transform(d, sx, sy, tx, ty) {
    const f = (v) => +v.toFixed(2);
    const X = (v) => f(v * sx + tx);
    const Y = (v) => f(v * sy + ty);
    return parse(d).map((g) => {
      switch (g.c) {
        case 'M': return 'M ' + X(g.x) + ' ' + Y(g.y);
        case 'L': return 'L ' + X(g.x) + ' ' + Y(g.y);
        case 'C': return 'C ' + X(g.x1) + ' ' + Y(g.y1) + ' ' + X(g.x2) + ' ' + Y(g.y2) + ' ' + X(g.x) + ' ' + Y(g.y);
        case 'Q': return 'Q ' + X(g.x1) + ' ' + Y(g.y1) + ' ' + X(g.x) + ' ' + Y(g.y);
        case 'A': {
          const sw = sx * sy < 0 ? 1 - g.sw : g.sw;
          return 'A ' + f(g.rx * Math.abs(sx)) + ' ' + f(g.ry * Math.abs(sy)) + ' ' + g.rot + ' ' + g.la + ' ' + sw + ' ' + X(g.x) + ' ' + Y(g.y);
        }
        default: return '';
      }
    }).join(' ');
  }

  /** Tham số tâm của cung elip (theo đặc tả SVG F.6.5) */
  function arcParams(g) {
    const x1 = g.x0; const y1 = g.y0; const x2 = g.x; const y2 = g.y;
    let rx = Math.abs(g.rx); let ry = Math.abs(g.ry);
    if (!rx || !ry || (x1 === x2 && y1 === y2)) return null;
    const phi = (g.rot || 0) * Math.PI / 180; const cp = Math.cos(phi); const sp = Math.sin(phi);
    const dx = (x1 - x2) / 2; const dy = (y1 - y2) / 2;
    const x1p = cp * dx + sp * dy; const y1p = -sp * dx + cp * dy;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { const k = Math.sqrt(lam); rx *= k; ry *= k; }
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let coef = den ? Math.sqrt(Math.max(0, num / den)) : 0;
    if (g.la === g.sw) coef = -coef;
    const cxp = coef * rx * y1p / ry; const cyp = -coef * ry * x1p / rx;
    const cx = cp * cxp - sp * cyp + (x1 + x2) / 2;
    const cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const ux = (x1p - cxp) / rx; const uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx; const vy = (-y1p - cyp) / ry;
    const t1 = ang(1, 0, ux, uy);
    let dt = ang(ux, uy, vx, vy);
    if (!g.sw && dt > 0) dt -= 2 * Math.PI;
    else if (g.sw && dt < 0) dt += 2 * Math.PI;
    return { cx, cy, rx, ry, cp, sp, t1, dt };
  }

  function segPoint(g, t, ap) {
    switch (g.c) {
      case 'L': return { x: g.x0 + (g.x - g.x0) * t, y: g.y0 + (g.y - g.y0) * t };
      case 'Q': {
        const u = 1 - t;
        return { x: u * u * g.x0 + 2 * u * t * g.x1 + t * t * g.x, y: u * u * g.y0 + 2 * u * t * g.y1 + t * t * g.y };
      }
      case 'C': {
        const u = 1 - t;
        return {
          x: u * u * u * g.x0 + 3 * u * u * t * g.x1 + 3 * u * t * t * g.x2 + t * t * t * g.x,
          y: u * u * u * g.y0 + 3 * u * u * t * g.y1 + 3 * u * t * t * g.y2 + t * t * t * g.y,
        };
      }
      case 'A': {
        if (!ap) return { x: g.x0 + (g.x - g.x0) * t, y: g.y0 + (g.y - g.y0) * t };
        const th = ap.t1 + ap.dt * t; const c = Math.cos(th); const s = Math.sin(th);
        return { x: ap.cx + ap.rx * ap.cp * c - ap.ry * ap.sp * s, y: ap.cy + ap.rx * ap.sp * c + ap.ry * ap.cp * s };
      }
      default: return { x: g.x, y: g.y };
    }
  }

  function approxLen(g, ap) {
    const d = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
    if (g.c === 'L') return d(g.x0, g.y0, g.x, g.y);
    if (g.c === 'Q') return d(g.x0, g.y0, g.x1, g.y1) + d(g.x1, g.y1, g.x, g.y);
    if (g.c === 'C') return d(g.x0, g.y0, g.x1, g.y1) + d(g.x1, g.y1, g.x2, g.y2) + d(g.x2, g.y2, g.x, g.y);
    if (g.c === 'A') return ap ? Math.abs(ap.dt) * Math.max(ap.rx, ap.ry) : d(g.x0, g.y0, g.x, g.y);
    return 0;
  }

  /** Đường gấp khúc dày đặc (bước ~step đơn vị) cho một nét */
  function polyline(d, step) {
    step = step || 1;
    const pts = [];
    for (const g of parse(d)) {
      if (g.c === 'M') { if (!pts.length) pts.push({ x: g.x, y: g.y }); continue; }
      const ap = g.c === 'A' ? arcParams(g) : null;
      const n = Math.max(2, Math.ceil(approxLen(g, ap) / step));
      if (!pts.length) pts.push({ x: g.x0, y: g.y0 });
      for (let k = 1; k <= n; k++) pts.push(segPoint(g, k / n, ap));
    }
    return pts;
  }

  function length(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return L;
  }

  /** Lấy mẫu lại theo khoảng cách đều */
  function resampleSpacing(pts, spacing) {
    if (pts.length < 2) return pts.slice();
    const out = [{ x: pts[0].x, y: pts[0].y }];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      let ax = pts[i - 1].x; let ay = pts[i - 1].y;
      const bx = pts[i].x; const by = pts[i].y;
      let d = Math.hypot(bx - ax, by - ay);
      while (acc + d >= spacing && d > 0) {
        const t = (spacing - acc) / d;
        ax += (bx - ax) * t; ay += (by - ay) * t;
        out.push({ x: ax, y: ay });
        d = Math.hypot(bx - ax, by - ay);
        acc = 0;
      }
      acc += d;
    }
    const last = pts[pts.length - 1];
    out.push({ x: last.x, y: last.y });
    return out;
  }

  function bounds(polys) {
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const p of polys) for (const q of p) {
      if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }

  RU.Path = { parse, transform, polyline, length, resampleSpacing, bounds };
})(window.RU = window.RU || {});
