/* =====================================================================
   pronounce.js — cặp từ chỉ khác nhau một âm (cặp tối thiểu)
   Dùng để luyện nói và luyện nghe phân biệt những âm người Việt dễ nhầm.
   Mỗi cặp: [từ 1, nghĩa 1, từ 2, nghĩa 2]   (dấu ' sau nguyên âm = trọng âm)
   ===================================================================== */
(function (RU) {
  'use strict';
  const S = RU.U.stressify;

  const GROUPS = [
    {
      id: 'y-i', title: 'Ы và И', icon: 'ы',
      tip: 'Ы gần như «ư» tiếng Việt (lưỡi lùi về sau, môi không tròn); И là «i» (lưỡi đưa ra trước). Đừng đọc Ы thành «ui».',
      pairs: [['был', 'đã là, đã ở (anh ấy)', 'бил', 'đã đánh'], ['мыл', 'đã rửa', 'мил', 'dễ thương'], ['быть', 'là, thì, ở', 'бить', 'đánh']],
    },
    {
      id: 'soft', title: 'Phụ âm cứng – mềm (Ь)', icon: 'ь',
      tip: 'Ь ở cuối từ làm mềm phụ âm: kết thúc từ với mặt lưỡi nâng lên như sắp đọc «i». Không có Ь thì đọc gọn, cứng.',
      pairs: [['брат', 'anh / em trai', 'брать', 'lấy, cầm'], ['мат', 'tấm thảm; chiếu bí', 'мать', 'mẹ'], ["у'гол", 'góc', "у'голь", 'than đá'], ['ел', 'đã ăn', 'ель', 'cây vân sam']],
    },
    {
      id: 'zh-sh', title: 'Ж và Ш', icon: 'ж',
      tip: 'Cả hai đều uốn lưỡi. Ж có rung cổ họng (như «r» giọng miền Nam), Ш không rung (như «s» giọng miền Nam).',
      pairs: [['жар', 'hơi nóng', 'шар', 'quả bóng'], ['жить', 'sống', 'шить', 'may vá']],
    },
    {
      id: 'sh-shch', title: 'Ш và Щ', icon: 'щ',
      tip: 'Щ mềm và kéo dài hơn Ш: mặt lưỡi nâng cao, môi hơi bè ra.',
      pairs: [['шит', 'được may', 'щит', 'cái khiên']],
    },
    {
      id: 'z-s', title: 'З và С', icon: 'з',
      tip: 'З có rung cổ họng (như «d» giọng Bắc), С không rung (như «x»). Ở cuối từ cả hai đều đọc «s».',
      pairs: [['зад', 'phía sau', 'сад', 'khu vườn'], ['зуб', 'cái răng', 'суп', 'món súp']],
    },
    {
      id: 'l-r', title: 'Л và Р', icon: 'р',
      tip: 'Р phải rung đầu lưỡi (trrr). Л thì đầu lưỡi chạm chân răng trên và không rung.',
      pairs: [['лак', 'sơn bóng', 'рак', 'con tôm hùm đất'], ['лук', 'củ hành', 'рук', '(của) những bàn tay']],
    },
    {
      id: 'voice', title: 'Hữu thanh – vô thanh', icon: 'б',
      tip: 'Đặt tay lên cổ: Б, В, Д, Г làm cổ rung; П, Ф, Т, К thì không rung.',
      pairs: [['бар', 'quán bar', 'пар', 'hơi nước'], ['вон', 'kia kìa', 'фон', 'phông nền'], ['дом', 'ngôi nhà', 'том', 'tập (sách)'], ['гол', 'bàn thắng', 'кол', 'cái cọc']],
    },
  ];

  GROUPS.forEach((g) => {
    g.pairs = g.pairs.map(([a, av, b, bv]) => ({ a: S(a), av, b: S(b), bv }));
  });

  RU.PRONOUNCE = { groups: GROUPS, byId: Object.fromEntries(GROUPS.map((g) => [g.id, g])) };
})(window.RU = window.RU || {});
