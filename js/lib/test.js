/* =====================================================================
   test.js — bài kiểm tra tổng hợp sau mỗi bài học
   - Câu hỏi lấy từ bài vừa học (khoảng một nửa) và các bài trước (phần còn lại), chọn ngẫu nhiên.
   - Mỗi câu có độ khó 1–4. Bài kiểm tra xếp từ dễ đến khó; bài càng về sau càng nhiều câu khó.
   - Là bài kiểm tra nên câu sai không được hỏi lại; cuối bài cho biết sai ở bài nào để ôn.

   Ứng viên câu hỏi: { d: 1..4, key: mục được hỏi (chữ / từ / câu), from: { label, href }, make: () => câu hỏi }
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;
  const U = RU.U;
  const PASS = 70;

  /** Tỉ lệ câu theo độ khó 1→4: bài đầu (lv = 0) nhiều câu dễ, bài cuối (lv = 1) nhiều câu khó */
  const mix = (lv) => [0.34 - 0.16 * lv, 0.30 - 0.06 * lv, 0.22 + 0.08 * lv, 0.14 + 0.14 * lv];
  function quotas(n, lv) {
    const w = mix(U.clamp(lv || 0, 0, 1));
    const q = w.map((x) => Math.floor(x * n));
    const order = w.map((x, i) => [x * n - Math.floor(x * n), i]).sort((a, b) => b[0] - a[0]);
    for (let left = n - q.reduce((a, b) => a + b, 0), k = 0; left > 0; left--, k = (k + 1) % 4) q[order[k][1]]++;
    return q;
  }

  /** Chọn n câu theo hạn mức từng độ khó; mỗi mục chỉ hỏi một lần nếu còn mục khác */
  function choose(cands, n, lv, used) {
    if (n <= 0 || !cands.length) return [];
    const q = quotas(n, lv);
    const byD = [1, 2, 3, 4].map((d) => U.shuffle(cands.filter((c) => c.d === d)));
    const out = [];
    const take = (d, repeat) => {
      const list = byD[d - 1];
      const i = list.findIndex((c) => repeat || !used.has(c.key));
      if (i < 0) return false;
      const c = list.splice(i, 1)[0];
      used.add(c.key);
      out.push(c);
      return true;
    };
    const got = [0, 0, 0, 0]; // số câu đã có cho hạn mức từng mức (kể cả câu bù từ mức khác)
    for (let d = 1; d <= 4; d++) for (let k = 0; k < q[d - 1]; k++) if (take(d, false)) got[d - 1]++;
    // mức nào thiếu câu thì bù từ mức gần nó nhất; hết mục mới thì mới hỏi lại một mục bằng dạng câu khác
    const near = [[2, 3, 4], [1, 3, 4], [4, 2, 1], [3, 2, 1]];
    for (const repeat of [false, true]) {
      for (let d = 1; d <= 4; d++) {
        while (got[d - 1] < q[d - 1] && out.length < n) {
          if ([d].concat(near[d - 1]).some((dd) => take(dd, repeat))) got[d - 1]++;
          else break;
        }
      }
    }
    return out;
  }

  /** Dựng bài kiểm tra: { cur, prev, count, level, curShare } → danh sách ứng viên đã xếp từ dễ đến khó */
  function build(o) {
    const used = new Set();
    const nPrev = o.prev.length ? Math.round(o.count * (1 - (o.curShare == null ? 0.5 : o.curShare))) : 0;
    let picked = choose(o.cur, o.count - nPrev, o.level, used).concat(choose(o.prev, nPrev, o.level, used));
    if (picked.length < o.count) { // bài ít mục: lấy thêm từ phần còn lại của cả hai nhóm
      const rest = o.cur.concat(o.prev).filter((c) => !picked.includes(c));
      picked = picked.concat(choose(rest, o.count - picked.length, o.level, used));
    }
    return U.shuffle(picked).sort((a, b) => a.d - b.d); // sort ổn định → cùng độ khó vẫn ngẫu nhiên
  }

  const state = () => RU.state.tests || (RU.state.tests = {});
  const result = (key) => state()[key] || null;

  /** Chip điểm cao nhất (nếu đã làm) */
  function badge(key) {
    const s = result(key);
    return s && s.n ? h('span', { class: 'chip test-chip' + (s.pass ? ' ok' : '') }, (s.pass ? '✓ ' : '') + s.best + '%') : null;
  }

  /**
   * Chạy bài kiểm tra.
   * o: { key, title, count, level, curShare, cands: () => ({ cur, prev }), back: { href, label }, next: { href, label } }
   */
  const DEFAULT_LABEL = { mc: 'Chọn đáp án đúng', type: 'Viết bằng tiếng Nga', order: 'Sắp xếp các từ thành câu đúng', write: 'Viết chữ cái lên bảng' };

  function run(ctx, o) {
    let tally = [];
    const gen = () => {
      tally = [];
      const c = o.cands();
      return build({ cur: c.cur, prev: c.prev, count: o.count, level: o.level, curShare: o.curShare }).map((cand) => {
        const q = cand.make();
        const own = q.onResult;
        q.onResult = (ok) => { if (own) own(ok); tally.push({ ok, d: cand.d, from: cand.from }); };
        q.noRequeue = true;
        q.level = cand.d;
        q.from = cand.from;
        q.label = [h('span', { class: 'lvl-badge l' + cand.d, title: 'Độ khó ' + cand.d + '/4' }, 'Mức ' + cand.d), ' ', q.label || DEFAULT_LABEL[q.type] || ''];
        return q;
      });
    };
    const first = gen();
    if (!first.length) {
      ctx.main.append(RU.ui.header(o.title, { back: o.back.href, backLabel: o.back.label }), RU.ui.empty('Chưa có câu hỏi nào cho bài kiểm tra này.'));
      return;
    }
    RU.mountQuiz(ctx, first, {
      title: o.title + ' · từ dễ đến khó',
      regenerate: gen, requeue: false, xp: 3,
      onExit: () => RU.go(o.back.href), exitLabel: o.back.label,
      doneTitle: 'Xong bài kiểm tra!',
      onFinish: (r) => {
        const s = state()[o.key] || (state()[o.key] = { best: 0, n: 0, pass: false });
        s.n = (s.n || 0) + 1;
        s.best = Math.max(s.best || 0, r.pct);
        const pass = r.pct >= PASS;
        const firstPass = pass && !s.pass;
        if (pass) s.pass = true;
        if (firstPass) RU.addXp(15);
        RU.store.save();
        // thống kê theo bài: câu sai nằm ở bài nào
        const groups = new Map();
        tally.forEach((t) => {
          const k = t.from.label;
          const g = groups.get(k) || { from: t.from, ok: 0, all: 0 };
          g.all++; if (t.ok) g.ok++;
          groups.set(k, g);
        });
        const weak = Array.from(groups.values()).filter((g) => g.ok < g.all);
        const byD = [1, 2, 3, 4].map((d) => tally.filter((t) => t.d === d)).filter((l) => l.length);
        return h('div', { class: 'test-result' },
          h('div', { class: 'callout ' + (pass ? 'ok' : 'warn') },
            h('b', null, pass ? (firstPass ? '✓ Đạt bài kiểm tra! +15 XP' : '✓ Đạt bài kiểm tra') : 'Chưa đạt — cần đúng từ ' + PASS + '% câu.'),
            h('div', { class: 'small' }, 'Độ khó tăng dần: ', byD.map((l, i) => h('span', { class: 'test-lv' }, 'mức ' + l[0].d + ' ' + l.filter((t) => t.ok).length + '/' + l.length + (i < byD.length - 1 ? ' · ' : ''))))),
          weak.length
            ? h('div', { class: 'test-weak' }, h('b', null, 'Nên ôn lại:'), h('div', { class: 'row gap' },
              weak.map((g) => h('a', { class: 'chip-link', href: g.from.href }, g.from.label + ' · sai ' + (g.all - g.ok) + '/' + g.all))))
            : h('p', { class: 'muted' }, 'Không sai câu nào — nắm chắc cả bài cũ lẫn bài mới! 🎯'),
          pass && o.next ? h('a', { class: 'btn soft', href: o.next.href }, o.next.label, ' ', RU.icon('right', 16)) : null);
      },
    });
  }

  RU.Test = { PASS, build, run, badge, result, quotas };
})(window.RU = window.RU || {});
