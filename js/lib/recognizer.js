/* =====================================================================
   recognizer.js — nhận dạng & chấm điểm chữ viết tay
   - Chế độ "tự viết": so khớp đám mây điểm (thuật toán $P, Vatavu và cs.)
     với nét mẫu của cả 33 chữ (hoa + thường), không phụ thuộc thứ tự
     hay chiều nét. Có xử lý riêng dấu chấm (Ё) và chi tiết nhỏ (Й, Щ, Ъ…).
   - Chế độ "tô theo mẫu": đo độ phủ & độ chính xác so với nét mờ.
   ===================================================================== */
(function (RU) {
  'use strict';

  const N = 64;                                   // số điểm của mỗi đám mây
  const CASE_DISTINCT = new Set(['А', 'Б', 'Е', 'Ё']); // hoa/thường khác hẳn hình dạng
  const LAMBDA = 0.35;                            // trọng số của phép đo thiếu/thừa nét
  const TH = { easy: 0.17, normal: 0.14, hard: 0.115 };   // ngưỡng điểm tổng hợp (hiệu chỉnh bằng #/debug/recog)
  const H_MISS = { easy: 0.24, normal: 0.19, hard: 0.155 }; // ngưỡng thiếu / thừa nét (chung)

  /* ---------------- hình học cơ bản ---------------- */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function strokeLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += dist(p[i - 1], p[i]); return L; }
  function centroid(pts) { let x = 0; let y = 0; for (const p of pts) { x += p.x; y += p.y; } return { x: x / pts.length, y: y / pts.length }; }
  function bbox(strokes) {
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const s of strokes) for (const p of s) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }
  function pointAt(pts, target) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i - 1], pts[i]);
      if (d > 0 && acc + d >= target) {
        const t = (target - acc) / d;
        return { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y) };
      }
      acc += d;
    }
    const l = pts[pts.length - 1];
    return { x: l.x, y: l.y };
  }

  /** Lấy n điểm cách đều trên một nét (giữ nguyên điểm đầu & cuối) */
  function resampleStroke(pts, n) {
    const L = strokeLen(pts);
    if (n <= 1 || L === 0) {
      const c = L === 0 ? pts[0] : pointAt(pts, L / 2);
      return Array.from({ length: Math.max(1, n) }, () => ({ x: c.x, y: c.y }));
    }
    const I = L / (n - 1);
    const out = [{ x: pts[0].x, y: pts[0].y }];
    let D = 0; let px = pts[0].x; let py = pts[0].y;
    for (let i = 1; i < pts.length; i++) {
      const cx = pts[i].x; const cy = pts[i].y;
      let d = Math.hypot(cx - px, cy - py);
      while (d > 0 && D + d >= I && out.length < n - 1) {
        const t = (I - D) / d;
        px += t * (cx - px); py += t * (cy - py);
        out.push({ x: px, y: py });
        d = Math.hypot(cx - px, cy - py);
        D = 0;
      }
      D += d; px = cx; py = cy;
    }
    const last = pts[pts.length - 1];
    while (out.length < n) out.push({ x: last.x, y: last.y });
    return out;
  }

  /**
   * Chuẩn hoá nét viết thành đám mây N điểm:
   * - nét rất ngắn (chấm) → đoạn chuẩn nhỏ, để chữ Ё / dấu chấm được tính đến
   * - mỗi nét có tối thiểu vài điểm (chi tiết nhỏ như dấu ˘ không bị mất)
   * - co giãn đều về kích thước 1, dời trọng tâm về gốc
   */
  function normalize(strokes) {
    strokes = strokes.filter((s) => s && s.length);
    if (!strokes.length || strokes.length > 40) return null;
    const b = bbox(strokes);
    const size = Math.max(b.w, b.h);
    if (!(size > 1e-6)) return null;
    const dotLen = size * 0.05;
    const parts = strokes.map((s) => {
      const L = strokeLen(s);
      const e = bbox([s]);
      if (L < size * 0.08 && Math.max(e.w, e.h) < size * 0.08) {
        const c = centroid(s);
        return [{ x: c.x, y: c.y - dotLen / 2 }, { x: c.x, y: c.y + dotLen / 2 }];
      }
      return s;
    });
    const lens = parts.map((p) => Math.max(strokeLen(p), 1e-6));
    const total = lens.reduce((a, v) => a + v, 0);
    const k = parts.length;
    const minPts = Math.max(1, Math.min(4, Math.floor(N / k)));
    const alloc = lens.map((L) => Math.max(minPts, Math.round(N * L / total)));
    let sum = alloc.reduce((a, v) => a + v, 0);
    const order = lens.map((_, i) => i).sort((a, c) => lens[c] - lens[a]);
    let guard = 0;
    while (sum !== N && guard++ < 500) {
      let changed = false;
      for (const i of order) {
        if (sum === N) break;
        if (sum > N && alloc[i] > minPts) { alloc[i]--; sum--; changed = true; }
        else if (sum < N) { alloc[i]++; sum++; changed = true; }
      }
      if (!changed) break;
    }
    if (sum !== N) return null;
    let pts = [];
    const ids = [];
    parts.forEach((p, i) => { resampleStroke(p, alloc[i]).forEach((q) => { pts.push(q); ids.push(i); }); });
    const nb = bbox([pts]);
    const ns = Math.max(nb.w, nb.h) || 1;
    pts = pts.map((p) => ({ x: (p.x - nb.minX) / ns, y: (p.y - nb.minY) / ns }));
    const c = centroid(pts);
    const X = new Float64Array(N); const Y = new Float64Array(N); const S = new Int16Array(N);
    pts.forEach((p, i) => { X[i] = p.x - c.x; Y[i] = p.y - c.y; S[i] = ids[i]; });
    // Điểm lấy mẫu dày (~160 điểm) để so chi tiết nhỏ (đuôi, dấu, chấm)
    const spacing = total / 160;
    const dense = [];
    const dids = [];
    parts.forEach((p, k2) => { (p.length > 1 ? RU.Path.resampleSpacing(p, spacing) : p).forEach((q) => { dense.push(q); dids.push(k2); }); });
    const DX = new Float64Array(dense.length); const DY = new Float64Array(dense.length); const DS = new Int16Array(dense.length);
    dense.forEach((q, i) => { DX[i] = (q.x - nb.minX) / ns - c.x; DY[i] = (q.y - nb.minY) / ns - c.y; DS[i] = dids[i]; });
    return { X, Y, S, n: N, DX, DY, DS, dn: dense.length };
  }

  /* ---------------- phát hiện "thiếu nét / thừa nét" ----------------
     1) Căn khớp nét viết vào mẫu (ICP: co giãn + dịch chuyển, bỏ 20% cặp
        lệch nhất) để phần thân chữ trùng nhau.
     2) Với mỗi điểm dày của mẫu: khoảng cách tới NÉT của chữ viết, lấy giá
        trị lớn thứ 3 → lớn nghĩa là mẫu có chi tiết mà chữ viết thiếu
        (đuôi Щ, dấu ˘ của Й, hai chấm Ё…). Làm ngược lại để tìm nét thừa. */
  const NEAR = { x: 0, y: 0 };
  function nearest(px, py, BX, BY, BS, n, skip) {
    let best = Infinity; let bx = px; let by = py;
    for (let j = 0; j < n; j++) {
      if (skip && skip.includes(BS[j])) continue;
      const dx = px - BX[j]; const dy = py - BY[j];
      const d = dx * dx + dy * dy;
      if (d < best) { best = d; bx = BX[j]; by = BY[j]; }
      if (j + 1 < n && BS[j + 1] === BS[j]) {
        const ex = BX[j + 1] - BX[j]; const ey = BY[j + 1] - BY[j];
        const L2 = ex * ex + ey * ey;
        if (L2 > 0) {
          const t = ((px - BX[j]) * ex + (py - BY[j]) * ey) / L2;
          if (t > 0 && t < 1) {
            const qx = BX[j] + t * ex; const qy = BY[j] + t * ey;
            const e = (qx - px) * (qx - px) + (qy - py) * (qy - py);
            if (e < best) { best = e; bx = qx; by = qy; }
          }
        }
      }
    }
    NEAR.x = bx; NEAR.y = by;
    return Math.sqrt(best);
  }
  const clampS = (v) => Math.max(0.75, Math.min(1.33, v));
  /** Căn khớp affine (chịu được chữ nghiêng, xoay nhẹ, dẹt/cao) bằng ICP có cắt tỉa */
  function quant(arr, n, ps) {
    const s = Array.from(arr.subarray(0, n)).sort((p, q) => p - q);
    return ps.map((p) => s[Math.min(n - 1, Math.floor(p * (n - 1)))]);
  }
  function align(U, T, skip, init) {
    // skip = các nét chi tiết của mẫu bị bỏ qua khi căn khớp; init = phép biến đổi khởi đầu.
    let a; let b; let c; let d; let tx; let ty;
    if (init) ({ a, b, c, d, tx, ty } = init);
    else {
      // Khởi tạo bằng phân vị 10/50/90 của nét dày: chi tiết nhỏ gần như không ảnh hưởng.
      const ux = quant(U.DX, U.dn, [0.1, 0.5, 0.9]); const uy = quant(U.DY, U.dn, [0.1, 0.5, 0.9]);
      const vx = quant(T.DX, T.dn, [0.1, 0.5, 0.9]); const vy = quant(T.DY, T.dn, [0.1, 0.5, 0.9]);
      const rx = ux[2] - ux[0]; const ry = uy[2] - uy[0];
      a = rx > 0.05 ? Math.max(0.6, Math.min(1.6, (vx[2] - vx[0]) / rx)) : 1;
      d = ry > 0.05 ? Math.max(0.6, Math.min(1.6, (vy[2] - vy[0]) / ry)) : 1;
      if (rx <= 0.05) a = d; if (ry <= 0.05) d = a;
      b = 0; c = 0;
      tx = vx[1] - a * ux[1]; ty = vy[1] - d * uy[1];
    }
    const n = U.n;
    const qx = new Float64Array(n); const qy = new Float64Array(n); const dd = new Float64Array(n);
    for (let it = 0; it < 5; it++) {
      for (let i = 0; i < n; i++) {
        dd[i] = nearest(a * U.X[i] + b * U.Y[i] + tx, c * U.X[i] + d * U.Y[i] + ty, T.X, T.Y, T.S, T.n, skip);
        qx[i] = NEAR.x; qy[i] = NEAR.y;
      }
      const cut = Array.from(dd).sort((p, q) => p - q)[Math.floor(n * 0.75)];
      let m = 0; let mux = 0; let muy = 0; let mqx = 0; let mqy = 0;
      for (let i = 0; i < n; i++) if (dd[i] <= cut) { m++; mux += U.X[i]; muy += U.Y[i]; mqx += qx[i]; mqy += qy[i]; }
      if (m < 6) break;
      mux /= m; muy /= m; mqx /= m; mqy /= m;
      let sxx = 0; let sxy = 0; let syy = 0; let pxx = 0; let pxy = 0; let pyx = 0; let pyy = 0;
      for (let i = 0; i < n; i++) {
        if (dd[i] > cut) continue;
        const ux = U.X[i] - mux; const uy = U.Y[i] - muy; const vx = qx[i] - mqx; const vy = qy[i] - mqy;
        sxx += ux * ux; sxy += ux * uy; syy += uy * uy;
        pxx += vx * ux; pxy += vx * uy; pyx += vy * ux; pyy += vy * uy;
      }
      const det = sxx * syy - sxy * sxy;
      let ok = false;
      if (det > 1e-9) {
        const i00 = syy / det; const i01 = -sxy / det; const i11 = sxx / det;
        const na = pxx * i00 + pxy * i01; const nb = pxx * i01 + pxy * i11;
        const nc = pyx * i00 + pyy * i01; const nd = pyx * i01 + pyy * i11;
        const dA = na * nd - nb * nc;
        const F = na * na + nb * nb + nc * nc + nd * nd;
        const disc = Math.sqrt(Math.max(0, F * F - 4 * dA * dA));
        const smax = Math.sqrt((F + disc) / 2); const smin = Math.sqrt(Math.max(0, (F - disc) / 2));
        const rot = Math.atan2(nc - nb, na + nd);
        if (dA > 0 && smin >= 0.62 && smax <= 1.6 && Math.abs(rot) <= 0.35) { a = na; b = nb; c = nc; d = nd; ok = true; }
      }
      if (!ok) {
        a = sxx > 1e-6 ? clampS(pxx / sxx) : 1; d = syy > 1e-6 ? clampS(pyy / syy) : 1; b = 0; c = 0;
      }
      tx = mqx - (a * mux + b * muy); ty = mqy - (c * mux + d * muy);
    }
    return { a, b, c, d, tx, ty };
  }
  function top3(arr) {
    let m1 = 0; let m2 = 0; let m3 = 0;
    for (const v of arr) { if (v > m1) { m3 = m2; m2 = m1; m1 = v; } else if (v > m2) { m3 = m2; m2 = v; } else if (v > m3) m3 = v; }
    return m3;
  }
  function details(U, T, skip) {
    let t = align(U, T);
    if (skip && skip.length) t = align(U, T, skip, t);   // tinh chỉnh chỉ theo phần thân chữ
    const n = U.n;
    const AU = { X: new Float64Array(n), Y: new Float64Array(n), S: U.S, n };
    for (let i = 0; i < n; i++) { AU.X[i] = t.a * U.X[i] + t.b * U.Y[i] + t.tx; AU.Y[i] = t.c * U.X[i] + t.d * U.Y[i] + t.ty; }
    const miss = new Float64Array(T.dn);
    for (let i = 0; i < T.dn; i++) miss[i] = nearest(T.DX[i], T.DY[i], AU.X, AU.Y, AU.S, n);
    const extra = new Float64Array(U.dn);
    for (let i = 0; i < U.dn; i++) {
      extra[i] = nearest(t.a * U.DX[i] + t.b * U.DY[i] + t.tx, t.c * U.DX[i] + t.d * U.DY[i] + t.ty, T.X, T.Y, T.S, T.n);
    }
    return { hTU: top3(miss), hUT: top3(extra), aligned: AU };
  }

  /**
   * Khoảng cách trung bình từ các nét chi tiết bắt buộc của mẫu (đuôi Ц/Щ,
   * dấu ˘ của Й, chấm Ё) tới nét viết — sau khi căn khớp theo THÂN chữ.
   * Lớn ⇒ người viết đã bỏ quên chi tiết đó.
   */
  function detailMiss(cloud, tpl) {
    const det = RU.Glyphs.get(tpl.letter, tpl.cs).detail;
    if (!det.length || tpl.alt) return 0;
    const al = details(cloud, tpl.cloud, det).aligned;
    const T = tpl.cloud;
    let tot = 0; let sum = 0;
    for (let i = 0; i < T.dn; i++) {
      if (!det.includes(T.DS[i])) continue;
      tot++;
      sum += nearest(T.DX[i], T.DY[i], al.X, al.Y, al.S, al.n);
    }
    return tot ? sum / tot : 0;
  }
  const DETAIL_TH = { easy: 0.1, normal: 0.08, hard: 0.068 };
  const DETAIL_MSG = {
    'Ё': 'Đừng quên HAI DẤU CHẤM phía trên chữ Ё.',
    'Й': 'Bạn quên dấu «˘» (mũ ngắn) phía trên. Chữ Й = И + dấu ˘.',
    'Ц': 'Đừng quên cái «đuôi» nhỏ thò xuống ở góc dưới bên phải của Ц.',
    'Щ': 'Đừng quên cái «đuôi» nhỏ thò xuống ở góc dưới bên phải của Щ.',
  };

  /* ---------------- so khớp đám mây điểm ($P) ---------------- */
  function cloudDistance(A, B, start, matched, bound) {
    const n = A.n;
    matched.fill(0);
    let sum = 0; let i = start;
    do {
      let min = Infinity; let idx = -1;
      const ax = A.X[i]; const ay = A.Y[i];
      for (let j = 0; j < n; j++) {
        if (matched[j]) continue;
        const dx = ax - B.X[j]; const dy = ay - B.Y[j];
        const d = dx * dx + dy * dy;
        if (d < min) { min = d; idx = j; }
      }
      matched[idx] = 1;
      sum += (1 - ((i - start + n) % n) / n) * Math.sqrt(min);
      if (sum >= bound) return sum;
      i = (i + 1) % n;
    } while (i !== start);
    return sum;
  }
  function match(A, B) {
    const n = A.n;
    const step = Math.max(1, Math.floor(Math.sqrt(n)));
    const matched = new Uint8Array(n);
    let min = Infinity;
    for (let i = 0; i < n; i += step) {
      min = Math.min(min, cloudDistance(A, B, i, matched, min));
      min = Math.min(min, cloudDistance(B, A, i, matched, min));
    }
    return min / (n * 0.5); // ≈ khoảng cách trung bình giữa các điểm (đơn vị: kích thước chữ)
  }

  /* ---------------- mẫu ---------------- */
  let templates = null;
  function buildTemplates() {
    templates = [];
    for (const L of RU.Glyphs.letters) {
      for (const cs of ['u', 'l']) {
        const g = RU.Glyphs.get(L, cs);
        [g.polys].concat(g.altPolys).forEach((polys, alt) => {
          const cloud = normalize(polys);
          if (cloud) templates.push({ letter: L, cs, alt, cloud });
        });
      }
    }
    return templates;
  }

  /** Xếp hạng tất cả chữ theo độ giống (khoảng cách nhỏ = giống) */
  function rank(strokes) {
    if (!templates) buildTemplates();
    const cloud = normalize(strokes);
    if (!cloud) return null;
    const best = {};
    for (const t of templates) {
      const det = details(cloud, t.cloud);
      const dP = Math.min(match(cloud, t.cloud), match(det.aligned, t.cloud));
      const hTU = det.hTU;   // mẫu có mà nét viết không có → thiếu nét
      const hUT = det.hUT;   // nét viết có mà mẫu không có → thừa nét
      const d = dP + LAMBDA * Math.max(hTU, hUT);
      const k = t.letter + ':' + t.cs;
      if (!best[k] || d < best[k].d) best[k] = { letter: t.letter, cs: t.cs, d, dP, hTU, hUT };
    }
    return Object.values(best).sort((a, b) => a.d - b.d);
  }

  /* ---------------- lời nhắc cho các cặp dễ nhầm ---------------- */
  const CONFUSE = {
    'Й': { 'И': 'Bạn quên dấu «˘» (mũ ngắn) phía trên. Chữ Й = И + dấu ˘.' },
    'И': { 'Й': 'Chữ И không có dấu «˘» ở trên (có dấu là Й).', 'Н': 'Nét giữa của И là đường CHÉO từ dưới‑trái lên trên‑phải, không nằm ngang như Н.' },
    'Н': { 'И': 'Nét giữa của Н NẰM NGANG, không chéo như И.', 'П': 'Nét ngang của Н nằm ở GIỮA, không ở trên cùng như П.' },
    'П': { 'Н': 'Nét ngang của П nằm TRÊN CÙNG, không ở giữa như Н.', 'Л': 'Nét trái của П thẳng đứng (Л mới có chân cong).' },
    'Л': { 'П': 'Nét trái của Л cong / xiên ra ngoài như một cái chân.', 'Д': 'Л không có đế và chân như Д.' },
    'Д': { 'Л': 'Д có thêm đế ngang và hai chân nhỏ thò xuống dưới dòng kẻ.' },
    'Ё': { 'Е': 'Đừng quên HAI DẤU CHẤM phía trên chữ Ё.' },
    'Е': { 'Ё': 'Chữ Е không có hai dấu chấm (có chấm là Ё).' },
    'Щ': { 'Ш': 'Chữ Щ có thêm một cái «đuôi» nhỏ ở góc dưới bên phải.', 'Ц': 'Chữ Щ có BA nét đứng (Ц chỉ có hai).' },
    'Ш': { 'Щ': 'Chữ Ш không có đuôi ở dưới (có đuôi là Щ).', 'Ц': 'Chữ Ш có BA nét đứng.' },
    'Ц': { 'Щ': 'Chữ Ц chỉ có HAI nét đứng.', 'Ш': 'Chữ Ц chỉ có hai nét đứng và một đuôi nhỏ.', 'П': 'Ц có nét ngang ở DƯỚI kèm một đuôi nhỏ, không phải nét ngang ở trên như П.' },
    'Ъ': { 'Ь': 'Dấu cứng Ъ có thêm một nét ngang nhỏ ở trên cùng bên trái.', 'Б': 'Nét ngang nhỏ của Ъ nằm bên TRÁI nét đứng.' },
    'Ь': { 'Ъ': 'Dấu mềm Ь không có nét ngang ở trên (có là Ъ).', 'Ы': 'Ь không có nét đứng thứ hai (có là Ы).', 'Б': 'Ь không có nét ngang trên đầu (có là Б).', 'Р': 'Vòng của Ь nằm ở DƯỚI, không ở trên như Р.' },
    'Ы': { 'Ь': 'Chữ Ы = Ь + một nét đứng nữa ở bên phải.' },
    'Б': { 'В': 'Б có nét ngang trên đầu và chỉ có MỘT vòng ở dưới.', 'Ь': 'Đừng quên nét ngang trên đầu của Б.', 'Ъ': 'Nét ngang của Б chìa sang PHẢI.' },
    'В': { 'Б': 'В có HAI vòng: một ở trên, một ở dưới.', 'Р': 'В có thêm vòng thứ hai ở dưới.' },
    'Р': { 'Ь': 'Vòng của Р nằm ở TRÊN.', 'В': 'Р chỉ có một vòng ở trên.' },
    'Г': { 'Т': 'Nét dọc của Г nằm bên TRÁI, nét ngang chìa sang phải.', 'П': 'Г chỉ có một nét dọc.' },
    'Т': { 'Г': 'Nét dọc của Т nằm CHÍNH GIỮA.' },
    'З': { 'Э': 'З giống số 3, gồm hai đường cong mở về bên trái.' },
    'Э': { 'З': 'Э giống chữ C quay ngược, có một vạch ngang ở giữa.', 'С': 'Э mở về bên TRÁI (ngược với С) và có vạch ngang ở giữa.' },
    'С': { 'Э': 'С mở về bên phải và không có vạch ngang.', 'О': 'С không khép kín.' },
    'О': { 'С': 'Chữ О phải khép kín thành vòng tròn.' },
    'Ю': { 'О': 'Ю gồm một nét đứng, một gạch nối và chữ О.' },
    'Ф': { 'О': 'Ф có một nét dọc xuyên qua vòng tròn.' },
    'Ч': { 'У': 'Nét phải của Ч thẳng đứng; nét trái chỉ đi xuống nửa chừng rồi cong sang phải.' },
    'У': { 'Ч': 'У gồm hai nét chéo như chữ y.' },
    'Ж': { 'К': 'Ж có hai nửa đối xứng hai bên nét giữa.', 'Х': 'Ж có thêm nét dọc ở giữa.' },
    'К': { 'Ж': 'К chỉ có nửa bên phải.' },
    'Х': { 'Ж': 'Х chỉ gồm hai nét chéo.' },
    'А': { 'Л': 'А có thêm nét ngang ở giữa.' },
  };

  const lc = (L) => L.toLowerCase();
  const name = (letter, cs) => (cs === 'u' ? 'chữ HOA «' + letter + '»' : 'chữ thường «' + lc(letter) + '»');

  function lowerAdvice(letter) {
    const b = RU.Glyphs.get(letter, 'l').bounds;
    if (b.maxY > 108 && b.minY < 20) return 'có nét kéo lên trên và kéo xuống dưới dòng kẻ đậm.';
    if (b.maxY > 108) return 'thân chữ nằm giữa đường nét đứt và dòng kẻ đậm, nét đuôi kéo xuống dưới.';
    if (b.minY < 20) return 'có một nét cao vượt lên trên đường nét đứt.';
    return 'chỉ cao từ đường nét đứt (giữa) xuống dòng kẻ đậm.';
  }

  /**
   * Kiểm tra chữ viết tự do.
   * @returns {ok, stars, pct, msg, hint, best, ranks}
   */
  function verify(strokes, letter, cs, opts) {
    opts = opts || {};
    const strict = opts.strict || (RU.state && RU.state.settings.strict) || 'normal';
    const th = TH[strict] || TH.normal;
    strokes = (strokes || []).filter((s) => s.length);
    if (!strokes.length) return { ok: false, stars: 0, pct: 0, empty: true, msg: 'Bạn chưa viết gì cả.' };
    const ranks = opts.ranks || rank(strokes);
    if (!ranks) return { ok: false, stars: 0, pct: 0, msg: 'Nét viết quá nhỏ hoặc quá nhiều nét. Hãy viết lại to và rõ hơn.' };

    const flexible = !CASE_DISTINCT.has(letter);
    const isTarget = (r) => r.letter === letter && (r.cs === cs || flexible);
    const best = ranks[0];
    const t = ranks.find(isTarget);
    const dT = t.d;
    const conf = CONFUSE[letter] || {};
    const res = { ranks: ranks.slice(0, 5), best, dTarget: dT, th, ok: false, stars: 0, msg: '', hint: '' };

    const hm = H_MISS[strict] || H_MISS.normal;
    const nearTie = !isTarget(best) && best.letter !== letter && !conf[best.letter] && dT <= best.d * 1.06;
    if (isTarget(best) || nearTie) {
      const tpl = (templates || buildTemplates()).find((x) => x.letter === t.letter && x.cs === t.cs && x.alt === 0);
      const dm = tpl ? detailMiss(normalize(strokes), tpl) : 0;
      res.detail = dm;
      if (dm > (DETAIL_TH[strict] || DETAIL_TH.normal)) res.msg = DETAIL_MSG[letter] || 'Hình như còn thiếu một chi tiết nhỏ của ' + name(letter, cs) + '.';
      else if (t.hTU > hm) res.msg = 'Hình như còn thiếu một nét hoặc một chi tiết của ' + name(letter, cs) + '. Hãy xem lại mẫu nhé.';
      else if (t.hUT > hm * 1.15) res.msg = 'Có nét thừa so với ' + name(letter, cs) + '. Hãy xóa và viết lại nhé.';
      else if (dT <= th) res.ok = true;
      else res.msg = 'Chữ viết chưa rõ lắm. Hãy xem lại mẫu và viết cẩn thận hơn nhé.';
    } else if (best.d <= th * 1.15) {
      if (best.letter === letter) {
        res.msg = 'Đây là ' + name(best.letter, best.cs) + '. Đề bài yêu cầu ' + name(letter, cs) + '.';
      } else if (conf[best.letter]) {
        res.msg = conf[best.letter];
      } else {
        res.msg = 'Hình như bạn viết ' + name(best.letter, best.cs) + ', chưa phải ' + name(letter, cs) + '.';
      }
    } else {
      res.msg = 'Máy chưa nhận ra chữ này. Hãy xem lại mẫu và viết lại nhé.';
    }

    // Vị trí trên dòng kẻ (phân biệt chữ hoa / thường cùng hình dạng)
    if (res.ok && opts.placement !== false) {
      const ub = bbox(strokes);
      const tb = RU.Glyphs.get(letter, cs).bounds;
      const ob = RU.Glyphs.get(letter, cs === 'u' ? 'l' : 'u').bounds;
      const err = (g) => Math.max(Math.abs(ub.minY - g.minY), Math.abs(ub.maxY - g.maxY));
      const eT = err(tb); const eO = err(ob);
      if (flexible && eT > 28 && eO + 10 < eT && strict !== 'easy') {
        res.ok = false;
        res.caseIssue = true;
        res.msg = cs === 'l'
          ? 'Hình dạng đúng rồi, nhưng bạn viết to như chữ HOA. Chữ thường «' + lc(letter) + '» ' + lowerAdvice(letter)
          : 'Hình dạng đúng rồi, nhưng bạn viết nhỏ như chữ thường. Chữ HOA «' + letter + '» cao từ dòng kẻ trên cùng xuống dòng kẻ đậm.';
      } else if (eT > 22) {
        res.hint = ub.maxY < tb.maxY - 22 || ub.maxY > tb.maxY + 22
          ? 'Mẹo: đặt chân chữ đúng trên dòng kẻ đậm.'
          : (cs === 'l' ? 'Mẹo: chữ thường «' + lc(letter) + '» ' + lowerAdvice(letter) : 'Mẹo: chữ hoa cao từ dòng kẻ trên cùng xuống dòng kẻ đậm.');
      }
    }

    res.pct = Math.round(RU.U.clamp(100 - 40 * (dT / th), 0, 100));
    if (res.ok) {
      res.stars = dT <= th * 0.55 ? 3 : dT <= th * 0.8 ? 2 : 1;
      if (res.hint) res.stars = Math.min(res.stars, 2);
      res.msg = res.stars === 3 ? 'Tuyệt vời! Chữ viết rất đẹp.' : res.stars === 2 ? 'Tốt lắm! Viết đúng rồi.' : 'Đúng rồi! Cố gắng viết giống mẫu hơn nữa nhé.';
    }
    return res;
  }

  /** Chấm chế độ tô theo nét mờ (toạ độ chung với chữ mẫu) */
  function trace(strokes, glyph, opts) {
    opts = opts || {};
    const strict = opts.strict || (RU.state && RU.state.settings.strict) || 'normal';
    strokes = (strokes || []).filter((s) => s.length);
    const tol = 10;
    const tpl = [];
    glyph.polys.forEach((p) => RU.Path.resampleSpacing(p, 2).forEach((q) => tpl.push(q)));
    const usr = [];
    strokes.forEach((p) => (p.length > 1 ? RU.Path.resampleSpacing(p, 2) : p).forEach((q) => usr.push(q)));
    if (usr.length < 3) return { ok: false, stars: 0, pct: 0, empty: !usr.length, msg: 'Hãy tô theo nét mờ của chữ mẫu.' };
    const near = (p, arr, r2) => { for (const q of arr) { const dx = q.x - p.x; const dy = q.y - p.y; if (dx * dx + dy * dy <= r2) return true; } return false; };
    const cov = tpl.filter((p) => near(p, usr, tol * tol)).length / tpl.length;
    const prec = usr.filter((p) => near(p, tpl, (tol * 1.4) ** 2)).length / usr.length;
    const need = { easy: [0.75, 0.75], normal: [0.86, 0.84], hard: [0.93, 0.9] }[strict] || [0.86, 0.84];
    const ok = cov >= need[0] && prec >= need[1];
    const q = Math.min(cov, prec);
    const stars = ok ? (q >= 0.96 ? 3 : q >= 0.91 ? 2 : 1) : 0;
    let msg;
    if (ok) msg = stars === 3 ? 'Tuyệt vời! Tô rất chính xác.' : stars === 2 ? 'Tốt lắm!' : 'Đạt rồi! Lần sau tô sát nét hơn nhé.';
    else if (cov < need[0] && prec >= need[1]) msg = 'Bạn chưa tô hết các nét (đã tô ' + Math.round(cov * 100) + '%). Hãy tô đủ tất cả các nét.';
    else if (prec < need[1] && cov >= need[0]) msg = 'Có nét bị lệch ra ngoài. Hãy tô sát theo nét mờ hơn.';
    else msg = 'Chưa đúng lắm. Xem lại cách viết rồi tô theo nét mờ nhé.';
    return { ok, stars, cov, prec, pct: Math.round(q * 100), msg };
  }

  RU.Recog = { N, TH, H_MISS, LAMBDA, normalize, match, details, rank, verify, trace, bbox, templates: () => templates || buildTemplates(), CONFUSE };
})(window.RU = window.RU || {});
