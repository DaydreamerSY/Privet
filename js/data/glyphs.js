/* =====================================================================
   glyphs.js — nét chữ mẫu (chữ in) của 33 chữ cái tiếng Nga
   Hệ toạ độ: dòng trên cùng y=0, dòng giữa (chiều cao chữ thường) y=40,
   dòng kẻ chính (chân chữ) y=100, dòng dưới (nét kéo xuống) y=130.
   Mỗi phần tử là một NÉT (theo đúng thứ tự viết), mô tả bằng path SVG.
   u  = chữ hoa, l = chữ thường (nếu không có → thu nhỏ từ chữ hoa)
   ua / la = các kiểu viết thay thế (chỉ dùng cho nhận dạng)
   ===================================================================== */
(function (RU) {
  'use strict';

  const E_U = ['M 0 0 L 0 100', 'M 0 0 L 50 0', 'M 0 50 L 42 50', 'M 0 100 L 50 100'];
  const E_L = ['M 4 70 L 48 70 C 48 52 38 40 26 40 C 12 40 2 54 2 70 C 2 88 12 100 27 100 C 37 100 44 95 48 88'];
  const I_U = ['M 0 0 L 0 100 L 60 0 L 60 100'];
  const SOFT_BOWL = 'M 0 46 L 26 46 A 27 27 0 0 1 26 100 L 0 100';

  const DEF = {
    'А': {
      u: ['M 30 0 L 0 100', 'M 30 0 L 60 100', 'M 11 62 L 49 62'],
      l: ['M 45 55 A 24 30 0 1 0 45 85', 'M 48 40 L 48 100'],
      la: [['M 8 50 C 14 40 42 38 44 56 L 44 100', 'M 44 68 C 14 64 2 76 4 88 C 6 102 34 104 44 90']],
    },
    'Б': {
      u: ['M 0 0 L 0 100', 'M 0 0 L 54 0', 'M 0 45 L 31 45 A 27.5 27.5 0 0 1 31 100 L 0 100'],
      l: ['M 48 0 C 28 2 6 14 3 58 C 1 84 10 100 26 100 C 42 100 50 88 50 72 C 50 56 40 44 26 44 C 14 44 6 52 3 62'],
    },
    'В': { u: ['M 0 0 L 0 100', 'M 0 0 L 27 0 A 23 23 0 0 1 27 46 L 0 46', 'M 0 46 L 31 46 A 27 27 0 0 1 31 100 L 0 100'] },
    'Г': { u: ['M 0 0 L 0 100', 'M 0 0 L 50 0'] },
    'Д': {
      u: ['M 22 0 C 22 52 16 82 6 100', 'M 22 0 L 58 0 L 58 100', 'M 0 118 L 0 100 L 66 100 L 66 118'],
      ua: [['M 30 0 L 4 100', 'M 30 0 L 56 100', 'M 0 118 L 0 100 L 60 100 L 60 118']],
    },
    'Е': { u: E_U, l: E_L },
    'Ё': {
      u: E_U.concat(['M 14 -18 L 14 -13', 'M 36 -18 L 36 -13']), det: [4, 5],
      l: E_L.concat(['M 15 24 L 15 29', 'M 35 24 L 35 29']), ldet: [1, 2],
    },
    'Ж': { u: ['M 4 0 L 40 50 L 0 100', 'M 40 0 L 40 100', 'M 76 0 L 40 50 L 80 100'] },
    'З': { u: ['M 4 14 C 12 -2 50 -6 50 23 C 50 40 36 48 22 48 C 38 48 56 56 56 75 C 56 104 12 106 0 86'] },
    'И': { u: I_U },
    'Й': { u: I_U.concat(['M 16 -20 Q 30 -4 44 -20']), det: [1] },
    'К': { u: ['M 0 0 L 0 100', 'M 52 0 L 3 52 L 54 100'] },
    'Л': { u: ['M 0 100 C 10 84 14 56 14 0 L 54 0 L 54 100'] },
    'М': { u: ['M 0 100 L 0 0 L 37 72 L 74 0 L 74 100'] },
    'Н': { u: ['M 0 0 L 0 100', 'M 56 0 L 56 100', 'M 0 50 L 56 50'] },
    'О': { u: ['M 32 0 A 32 50 0 1 0 32 100 A 32 50 0 1 0 32 0'] },
    'П': { u: ['M 0 0 L 0 100', 'M 0 0 L 56 0 L 56 100'] },
    'Р': {
      u: ['M 0 0 L 0 100', 'M 0 0 L 27 0 A 25 25 0 0 1 27 50 L 0 50'],
      l: ['M 0 40 L 0 130', 'M 0 52 C 8 42 18 40 26 40 C 42 40 50 54 50 70 C 50 88 40 100 26 100 C 16 100 6 96 0 88'],
    },
    'С': { u: ['M 53 18 A 30 50 0 1 0 53 82'] },
    'Т': { u: ['M 0 0 L 60 0', 'M 30 0 L 30 100'] },
    'У': {
      u: ['M 0 0 L 36 62', 'M 60 0 L 24 92 Q 20 100 10 100'],
      l: ['M 0 40 L 29 98', 'M 52 40 L 22 118 Q 18 128 6 128'],
    },
    'Ф': {
      u: ['M 40 12 A 38 30 0 1 0 40 72 A 38 30 0 1 0 40 12', 'M 40 0 L 40 100'],
      l: ['M 40 40 A 36 30 0 1 0 40 100 A 36 30 0 1 0 40 40', 'M 40 0 L 40 130'],
    },
    'Х': { u: ['M 0 0 L 58 100', 'M 58 0 L 0 100'] },
    'Ц': { u: ['M 0 0 L 0 100', 'M 56 0 L 56 100', 'M 0 100 L 66 100', 'M 66 100 L 66 121'], det: [3] },
    'Ч': {
      u: ['M 0 0 L 0 30 C 0 50 14 56 30 56 C 40 56 48 54 54 50', 'M 54 0 L 54 100'],
      ua: [['M 0 0 L 0 52 L 54 52', 'M 54 0 L 54 100']],
    },
    'Ш': { u: ['M 0 0 L 0 100', 'M 40 0 L 40 100', 'M 80 0 L 80 100', 'M 0 100 L 80 100'] },
    'Щ': { u: ['M 0 0 L 0 100', 'M 40 0 L 40 100', 'M 80 0 L 80 100', 'M 0 100 L 90 100', 'M 90 100 L 90 121'], det: [4] },
    'Ъ': { u: ['M 0 0 L 18 0 L 18 100', 'M 18 46 L 44 46 A 27 27 0 0 1 44 100 L 18 100'] },
    'Ы': { u: ['M 0 0 L 0 100', SOFT_BOWL, 'M 72 0 L 72 100'] },
    'Ь': { u: ['M 0 0 L 0 100', SOFT_BOWL] },
    'Э': { u: ['M 7 18 A 30 50 0 1 1 7 82', 'M 22 50 L 60 50'] },
    'Ю': { u: ['M 0 0 L 0 100', 'M 0 50 L 24 50', 'M 52 0 A 28 50 0 1 0 52 100 A 28 50 0 1 0 52 0'] },
    'Я': { u: ['M 54 0 L 26 0 A 25 25 0 0 0 26 50 L 54 50', 'M 54 0 L 54 100', 'M 30 50 L 2 100'] },
  };

  const LINES = { cap: 0, mid: 40, base: 100, desc: 130 };
  const LOWER_SX = 0.68;
  const LOWER_SY = 0.6;
  const derive = (strokes) => strokes.map((d) => RU.Path.transform(d, LOWER_SX, LOWER_SY, 0, LINES.mid));

  const cache = {};
  function get(letter, cs) {
    const key = letter + ':' + cs;
    if (cache[key]) return cache[key];
    const def = DEF[letter];
    if (!def) throw new Error('Không có nét mẫu cho chữ ' + letter);
    let strokes; let alts;
    if (cs === 'u') { strokes = def.u; alts = def.ua || []; }
    else if (def.l) { strokes = def.l; alts = def.la || []; }
    else { strokes = derive(def.u); alts = (def.ua || []).map(derive); }
    const polys = strokes.map((d) => RU.Path.polyline(d, 1));
    const g = {
      letter, cs, key,
      char: cs === 'u' ? letter : letter.toLowerCase(),
      strokes, alts, polys,
      altPolys: alts.map((a) => a.map((d) => RU.Path.polyline(d, 1))),
      bounds: RU.Path.bounds(polys),
      derived: cs === 'l' && !def.l,
      detail: (cs === 'l' && def.l ? def.ldet : def.det) || [],  // nét chi tiết bắt buộc (đuôi, dấu, chấm)
      lengths: polys.map((p) => RU.Path.length(p)),
    };
    cache[key] = g;
    return g;
  }

  RU.Glyphs = { DEF, LINES, letters: Object.keys(DEF), get };
})(window.RU = window.RU || {});
