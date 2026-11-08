/* =====================================================================
   keyboard.js — bàn phím Kirin ảo + gõ phiên âm Latinh → Kirin
   Gõ: a→а b→б v→в g→г d→д e→е z→з i→и j→й k→к l→л m→м n→н o→о p→п
       r→р s→с t→т u→у f→ф h/x→х c→ц y→ы w→щ ' →ь
       zh→ж ch→ч sh→ш shh→щ kh→х ya/ja→я yu/ju→ю yo/jo→ё e'→э ''→ъ
   ===================================================================== */
(function (RU) {
  'use strict';
  const h = RU.h;

  const SINGLE = {
    a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й', k: 'к', l: 'л', m: 'м',
    n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', x: 'х', c: 'ц', y: 'ы',
    w: 'щ', q: 'я', "'": 'ь', '#': 'ъ',
  };
  const COMBO = {
    'зh': 'ж', 'сh': 'ш', 'шh': 'щ', 'цh': 'ч', 'кh': 'х',
    'ыa': 'я', 'ыu': 'ю', 'ыo': 'ё', 'йa': 'я', 'йu': 'ю', 'йo': 'ё', 'йe': 'э',
    "ь'": 'ъ', "е'": 'э',
  };
  function convert(prev, key) {
    const k = key.toLowerCase();
    const up = key !== k;
    const pl = (prev || '').toLowerCase();
    const prevUp = !!prev && prev !== pl;
    const combo = COMBO[pl + k];
    if (combo) return { del: 1, ins: prevUp ? combo.toUpperCase() : combo };
    const single = SINGLE[k];
    if (single) return { del: 0, ins: up ? single.toUpperCase() : single };
    return null;
  }

  const ROWS = ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбюё'];
  const coarse = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function insert(input, text, del) {
    const st = input.selectionStart == null ? input.value.length : input.selectionStart;
    const en = input.selectionEnd == null ? st : input.selectionEnd;
    const from = Math.max(0, st - (del || 0));
    input.setRangeText(text, from, en, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Gắn bàn phím cho một ô nhập. Trả về phần tử bàn phím ảo.
   * opts: { onEnter() }
   */
  RU.Keyboard = {
    convert,
    attach(input, opts) {
      opts = opts || {};
      input.setAttribute('lang', 'ru');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
      let translit = true;
      let shift = false;
      if (coarse()) input.setAttribute('inputmode', 'none');

      input.addEventListener('beforeinput', (e) => {
        if (!translit || e.inputType !== 'insertText' || !e.data || e.data.length !== 1) return;
        const st = input.selectionStart; const en = input.selectionEnd;
        const prev = st === en && st > 0 ? input.value[st - 1] : '';
        const r = convert(prev, e.data);
        if (!r) return;
        e.preventDefault();
        insert(input, r.ins, r.del);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && opts.onEnter) { e.preventDefault(); opts.onEnter(); }
      });

      const keys = [];
      const kb = h('div', { class: 'vkb', 'aria-label': 'Bàn phím tiếng Nga' });
      const press = (fn) => (e) => { e.preventDefault(); fn(); RU.sfx.play('tap'); };
      ROWS.forEach((row) => {
        const r = h('div', { class: 'vkb-row' });
        Array.from(row).forEach((ch) => {
          const b = h('button', { type: 'button', class: 'vkb-key', tabindex: '-1' }, ch);
          b.addEventListener('pointerdown', press(() => {
            insert(input, shift ? ch.toUpperCase() : ch);
            if (shift) { shift = false; render(); }
          }));
          keys.push([b, ch]);
          r.appendChild(b);
        });
        kb.appendChild(r);
      });
      const shiftBtn = h('button', { type: 'button', class: 'vkb-key wide', tabindex: '-1', title: 'Chữ hoa' }, '⇧');
      shiftBtn.addEventListener('pointerdown', press(() => { shift = !shift; render(); }));
      const space = h('button', { type: 'button', class: 'vkb-key space', tabindex: '-1' }, 'dấu cách');
      space.addEventListener('pointerdown', press(() => insert(input, ' ')));
      const bksp = h('button', { type: 'button', class: 'vkb-key wide', tabindex: '-1', title: 'Xóa' }, '⌫');
      bksp.addEventListener('pointerdown', press(() => {
        const st = input.selectionStart; const en = input.selectionEnd;
        if (st !== en) input.setRangeText('', st, en, 'end');
        else if (st > 0) input.setRangeText('', st - 1, st, 'end');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }));
      const trBtn = h('button', { type: 'button', class: 'vkb-key wide tr-toggle on', tabindex: '-1', title: 'Gõ chữ Latinh sẽ tự đổi sang chữ Nga (zh → ж, sh → ш…)' }, 'Latinh→Кир');
      trBtn.addEventListener('pointerdown', press(() => { translit = !translit; trBtn.classList.toggle('on', translit); }));
      kb.appendChild(h('div', { class: 'vkb-row' }, shiftBtn, trBtn, space, bksp));

      const help = h('details', { class: 'vkb-help' },
        h('summary', null, 'Cách gõ bằng bàn phím máy tính'),
        h('p', null, 'Khi bật «Latinh→Кир», gõ chữ Latinh sẽ tự đổi sang chữ Nga:'),
        h('div', { class: 'vkb-map' }, [
          ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['yo', 'ё'], ['zh', 'ж'], ['z', 'з'], ['i', 'и'], ['j', 'й'],
          ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['f', 'ф'],
          ['h / kh', 'х'], ['c', 'ц'], ['ch', 'ч'], ['sh', 'ш'], ['shh / w', 'щ'], ["''", 'ъ'], ['y', 'ы'], ["'", 'ь'], ["e'", 'э'], ['yu', 'ю'], ['ya', 'я'],
        ].map(([a, b]) => h('span', null, h('kbd', null, a), ' ', b))));

      function render() {
        keys.forEach(([b, ch]) => { b.textContent = shift ? ch.toUpperCase() : ch; });
        shiftBtn.classList.toggle('on', shift);
      }
      return h('div', { class: 'vkb-wrap' }, kb, help);
    },
  };
})(window.RU = window.RU || {});
