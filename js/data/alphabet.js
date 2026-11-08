/* =====================================================================
   alphabet.js — dữ liệu 33 chữ cái, bài học bảng chữ cái, quy tắc phát âm
   Dấu ' đặt sau nguyên âm = trọng âm (sẽ chuyển thành dấu ´).
   ===================================================================== */
(function (RU) {
  'use strict';
  const S = RU.U.stressify;

  // type: v = nguyên âm, c = phụ âm, s = dấu
  const LETTERS = [
    { u: 'А', name: 'а', type: 'v', snd: 'a', hint: 'Đọc như chữ «a» tiếng Việt.', ex: [["ма'ма", 'mẹ'], ["а'рбуз", 'dưa hấu']], syl: 'а, ма, па' },
    { u: 'Б', name: 'бэ', type: 'c', snd: 'b', hint: 'Đọc như «b» tiếng Việt (bờ).', note: 'Chữ thường «б» trông giống số 6.', ex: [['брат', 'anh / em trai'], ["бана'н", 'quả chuối']], syl: 'ба, бо, бу' },
    { u: 'В', name: 'вэ', type: 'c', snd: 'v', hint: 'Đọc như «v» tiếng Việt.', trap: 'Trông giống chữ B nhưng đọc là «v»!', trapOpt: 'b', ex: [["вода'", 'nước'], ["Вьетна'м", 'Việt Nam']], syl: 'ва, во, ву' },
    { u: 'Г', name: 'гэ', type: 'c', snd: 'g', hint: 'Đọc như «g» trong «ga» (gờ).', note: 'Trong đuôi -ого / -его, chữ г đọc thành «v»: «его́» → «yevó».', ex: [["го'род", 'thành phố'], ["газе'та", 'tờ báo']], syl: 'га, го, гу' },
    { u: 'Д', name: 'дэ', type: 'c', snd: 'd', hint: 'Gần giống «đ» tiếng Việt (đầu lưỡi chạm chân răng trên).', ex: [['дом', 'ngôi nhà'], ['да', 'vâng, có']], syl: 'да, до, ду' },
    { u: 'Е', name: 'е', type: 'v', snd: 'ye', hint: 'Đầu từ đọc «ye» (i‑ê lướt nhanh). Sau phụ âm: làm mềm phụ âm đó và đọc gần «ê».', trap: 'Trông giống E nhưng đọc là «ye».', trapOpt: 'e (như chữ E)', ex: [["не'бо", 'bầu trời'], ["ле'то", 'mùa hè']], syl: 'е, не, ме' },
    { u: 'Ё', name: 'ё', type: 'v', snd: 'yo', hint: 'Đọc «yo» (i‑ô lướt nhanh). Âm tiết có ё LUÔN mang trọng âm.', note: 'Sách báo thường viết ё thành е (bỏ hai chấm) — người Nga vẫn đọc là «yo».', ex: [['ёлка', 'cây thông'], ['ёж', 'con nhím']], syl: 'ё, мё, лё' },
    { u: 'Ж', name: 'жэ', type: 'c', snd: 'zh', hint: 'Như «r» uốn lưỡi của giọng miền Trung/Nam («rổ», «ruộng») — âm «zh».', ex: [["жена'", 'vợ'], ["журна'л", 'tạp chí']], syl: 'жа, жо, жу' },
    { u: 'З', name: 'зэ', type: 'c', snd: 'z', hint: 'Như «d / gi» giọng Bắc («da», «gió») — âm «z».', note: 'Đừng nhầm với số 3!', ex: [['зуб', 'cái răng'], ["звезда'", 'ngôi sao']], syl: 'за, зо, зу' },
    { u: 'И', name: 'и', type: 'v', snd: 'i', hint: 'Đọc như «i» tiếng Việt.', trap: 'Trông như chữ N lật ngược, nhưng đọc là «i».', trapOpt: 'n', ex: [["и'мя", 'tên'], ['мир', 'thế giới; hoà bình']], syl: 'и, ми, ти' },
    { u: 'Й', name: "и кра'ткое", type: 'c', snd: 'i ngắn (й)', hint: 'Âm «i» ngắn như trong «ai», «ôi», «môi». Ví dụ «мой» ≈ «moi».', note: 'Tên chữ là «и кра́ткое» = «i ngắn».', ex: [['мой', 'của tôi'], ['чай', 'trà']], syl: 'ай, ой, мой' },
    { u: 'К', name: 'ка', type: 'c', snd: 'k', hint: 'Đọc như «c / k» tiếng Việt.', ex: [['кот', 'con mèo'], ["кни'га", 'quyển sách']], syl: 'ка, ко, ку' },
    { u: 'Л', name: 'эль', type: 'c', snd: 'l', hint: 'Đọc như «l», lưỡi hơi lùi về sau nên nghe «dày» hơn tiếng Việt.', ex: [["ла'мпа", 'cái đèn'], ['лук', 'củ hành']], syl: 'ла, ло, лу' },
    { u: 'М', name: 'эм', type: 'c', snd: 'm', hint: 'Đọc như «m».', ex: [["мо'ре", 'biển'], ['мост', 'cây cầu']], syl: 'ма, мо, му' },
    { u: 'Н', name: 'эн', type: 'c', snd: 'n', hint: 'Đọc như «n».', trap: 'Trông giống chữ H nhưng đọc là «n»!', trapOpt: 'h', ex: [['нос', 'cái mũi'], ['нет', 'không']], syl: 'на, но, ну' },
    { u: 'О', name: 'о', type: 'v', snd: 'o', hint: 'Có trọng âm: đọc như «ô» (hơi tròn môi). Không có trọng âm: đọc gần như «a».', ex: [["окно'", 'cửa sổ (đọc «akno»)'], ["о'блако", 'đám mây']], syl: 'о, ко, мо' },
    { u: 'П', name: 'пэ', type: 'c', snd: 'p', hint: 'Đọc như «p» (pờ), không bật hơi.', ex: [["па'па", 'bố'], ['парк', 'công viên']], syl: 'па, по, пу' },
    { u: 'Р', name: 'эр', type: 'c', snd: 'r', hint: 'Âm «r» rung đầu lưỡi (như «r» tiếng Tây Ban Nha / Ý).', trap: 'Trông giống chữ P nhưng đọc là «r»!', trapOpt: 'p', ex: [["ры'ба", 'con cá'], ["рука'", 'bàn tay']], syl: 'ра, ро, ру' },
    { u: 'С', name: 'эс', type: 'c', snd: 's', hint: 'Đọc như «x» tiếng Việt («xa», «xinh») — âm «s».', trap: 'Trông giống chữ C nhưng đọc là «s»!', trapOpt: 'c (k)', ex: [['сок', 'nước ép'], ['сын', 'con trai']], syl: 'са, со, су' },
    { u: 'Т', name: 'тэ', type: 'c', snd: 't', hint: 'Đọc như «t» tiếng Việt (không bật hơi như «th»).', ex: [['торт', 'bánh kem'], ['там', 'ở đó']], syl: 'та, то, ту' },
    { u: 'У', name: 'у', type: 'v', snd: 'u', hint: 'Đọc như «u» tiếng Việt, tròn môi.', trap: 'Trông giống chữ y nhưng đọc là «u»!', trapOpt: 'y', ex: [["у'тро", 'buổi sáng'], ["у'хо", 'cái tai']], syl: 'у, му, ту' },
    { u: 'Ф', name: 'эф', type: 'c', snd: 'f', hint: 'Đọc như «ph» tiếng Việt.', ex: [["фо'то", 'bức ảnh'], ["футбо'л", 'bóng đá']], syl: 'фа, фо, фу' },
    { u: 'Х', name: 'ха', type: 'c', snd: 'kh', hint: 'Đọc như «kh» tiếng Việt («khá», «không»).', trap: 'Trông giống chữ X nhưng đọc là «kh»!', trapOpt: 'x', ex: [['хлеб', 'bánh mì'], ["хорошо'", 'tốt']], syl: 'ха, хо, ху' },
    { u: 'Ц', name: 'цэ', type: 'c', snd: 'ts', hint: 'Âm «ts» — «t» và «x» đọc dính liền nhau.', ex: [["цвето'к", 'bông hoa'], ["у'лица", 'đường phố']], syl: 'ца, цо, цу' },
    { u: 'Ч', name: 'че', type: 'c', snd: 'ch', hint: 'Gần giống «ch» tiếng Việt nhưng mềm hơn (như «ch» trong tiếng Anh «cheese»).', ex: [['чай', 'trà'], ['час', 'giờ, tiếng đồng hồ']], syl: 'ча, чо, чу' },
    { u: 'Ш', name: 'ша', type: 'c', snd: 'sh', hint: 'Như «s» uốn lưỡi (giọng miền Trung/Nam: «sông», «sao»).', ex: [["шко'ла", 'trường học'], ["ша'пка", 'mũ len']], syl: 'ша, шо, шу' },
    { u: 'Щ', name: 'ща', type: 'c', snd: 'shch', hint: 'Giống «ш» nhưng mềm và kéo dài hơn — như «x» kéo dài với mặt lưỡi nâng cao.', ex: [['борщ', 'súp borsch'], ["о'вощи", 'rau củ']], syl: 'ща, що, щу' },
    { u: 'Ъ', name: "твёрдый знак", type: 's', snd: 'dấu cứng', hint: 'Không có âm. Dùng để tách phụ âm với nguyên âm phía sau: «подъе́зд» đọc «pod‑yezd».', ex: [["подъе'зд", 'lối vào chung cư'], ["объявле'ние", 'thông báo']], syl: "подъе'зд" },
    { u: 'Ы', name: 'ы', type: 'v', snd: 'ư (y)', hint: 'Rất gần «ư» tiếng Việt! «мы» ≈ «mư», «ты» ≈ «tư».', note: 'Ы không bao giờ đứng đầu từ.', ex: [['мы', 'chúng tôi'], ["ры'ба", 'con cá']], syl: 'ы, мы, ты' },
    { u: 'Ь', name: "мя'гкий знак", type: 's', snd: 'dấu mềm', hint: 'Không có âm. Làm «mềm» phụ âm đứng trước — đọc phụ âm như sắp đọc «i»: «мать» ≈ «matʼ».', ex: [['мать', 'mẹ'], ['день', 'ngày']], syl: 'мать, день' },
    { u: 'Э', name: 'э', type: 'v', snd: 'e', hint: 'Đọc như «e» tiếng Việt (như trong «xe», mở miệng).', ex: [["э'то", 'đây là'], ["эта'ж", 'tầng lầu']], syl: 'э, мэр' },
    { u: 'Ю', name: 'ю', type: 'v', snd: 'yu', hint: 'Đọc «yu» (i‑u lướt nhanh).', ex: [['юг', 'phía nam'], ["ю'бка", 'chân váy']], syl: 'ю, лю, мю' },
    { u: 'Я', name: 'я', type: 'v', snd: 'ya', hint: 'Đọc «ya» (i‑a lướt nhanh, như «gia» giọng Nam). «Я» cũng là một từ: «tôi».', trap: 'Trông như chữ R quay ngược, nhưng đọc là «ya».', trapOpt: 'r', ex: [['я', 'tôi'], ["я'блоко", 'quả táo']], syl: 'я, мя, ля' },
  ];

  LETTERS.forEach((L, i) => {
    L.i = i;
    L.l = L.u.toLowerCase();
    L.name = S(L.name);
    L.ex = L.ex.map(([ru, vi]) => [S(ru), vi]);
    L.syl = S(L.syl);
    L.typeName = { v: 'Nguyên âm', c: 'Phụ âm', s: 'Dấu' }[L.type];
  });

  const LESSONS = [
    {
      id: 1, title: 'Những chữ quen thuộc', letters: 'АКМОТЕ',
      desc: 'Trông giống chữ Latinh và đọc gần giống. Khởi động thật nhẹ nhàng!',
      words: [["ма'ма", 'mẹ'], ['кот', 'con mèo'], ['там', 'ở đó'], ['так', 'như vậy'], ['кто', 'ai'], ['тот', 'cái kia'], ["а'том", 'nguyên tử'], ["те'ма", 'chủ đề']],
    },
    {
      id: 2, title: '«Bạn giả» — trông quen mà đọc khác', letters: 'ВНРСУХ',
      desc: 'Những chữ dễ đánh lừa nhất: В = v, Н = n, Р = r, С = s, У = u, Х = kh.',
      words: [['нос', 'cái mũi'], ['сок', 'nước ép'], ['рот', 'cái miệng'], ["у'хо", 'cái tai'], ['нет', 'không'], ['вот', 'đây này'], ['мост', 'cây cầu'], ["у'тро", 'buổi sáng'], ["весна'", 'mùa xuân'], ["сестра'", 'chị / em gái'], ["Москва'", 'Moskva'], ["рестора'н", 'nhà hàng'], ["метро'", 'tàu điện ngầm'], ["ко'смос", 'vũ trụ']],
    },
    {
      id: 3, title: 'Phụ âm mới', letters: 'БГДЗЛПФ',
      desc: 'Bảy phụ âm có hình dạng mới nhưng âm đọc rất dễ.',
      words: [['да', 'vâng, có'], ['дом', 'ngôi nhà'], ['брат', 'anh / em trai'], ["па'па", 'bố'], ["го'род", 'thành phố'], ["ла'мпа", 'cái đèn'], ['зуб', 'cái răng'], ['глаз', 'con mắt'], ['хлеб', 'bánh mì'], ['суп', 'món súp'], ['стол', 'cái bàn'], ["бана'н", 'quả chuối'], ["фо'то", 'bức ảnh'], ["футбо'л", 'bóng đá'], ["авто'бус", 'xe buýt'], ["газе'та", 'tờ báo']],
    },
    {
      id: 4, title: 'Nguyên âm đặc biệt', letters: 'ИЙЫЭЮЯЁ',
      desc: 'Các nguyên âm «i, ư, e» và nhóm «ya, yu, yo». Sau bài này bạn đọc được «Привет!»',
      words: [['я', 'tôi'], ['ты', 'bạn'], ['мы', 'chúng tôi'], ['сын', 'con trai'], ['сыр', 'pho mát'], ['мир', 'thế giới'], ['мой', 'của tôi'], ["э'то", 'đây là'], ["ры'ба", 'con cá'], ["я'блоко", 'quả táo'], ['ёлка', 'cây thông'], ['юг', 'phía nam'], ["Росси'я", 'nước Nga'], ["приве'т", 'xin chào'], ["спаси'бо", 'cảm ơn'], ["до свида'ния", 'tạm biệt']],
    },
    {
      id: 5, title: 'Âm xuýt và hai dấu', letters: 'ЖЦЧШЩЬЪ',
      desc: 'Các âm «zh, ts, ch, sh, shch» cùng dấu mềm Ь và dấu cứng Ъ. Hoàn thành bảng chữ cái!',
      words: [["жена'", 'vợ'], ['чай', 'trà'], ['что', 'cái gì (đọc «shto»)'], ["шко'ла", 'trường học'], ["у'лица", 'đường phố'], ['борщ', 'súp borsch'], ["о'вощи", 'rau củ'], ['день', 'ngày'], ['мать', 'mẹ'], ["хорошо'", 'tốt'], ["о'чень", 'rất'], ["Вьетна'м", 'Việt Nam'], ["журна'л", 'tạp chí'], ["подъе'зд", 'lối vào chung cư'], ["пожа'луйста", 'làm ơn'], ["здра'вствуйте", 'xin chào (lịch sự)']],
    },
  ];
  LESSONS.forEach((l) => {
    l.letterIdx = Array.from(l.letters).map((c) => LETTERS.findIndex((L) => L.u === c));
    l.words = l.words.map(([ru, vi]) => [S(ru), vi]);
  });

  const RULES = [
    { t: 'Trọng âm (ударе́ние)', d: "Mỗi từ có một âm tiết được nhấn mạnh — đọc **to hơn, dài hơn**. Trong app, trọng âm được đánh dấu ´, ví dụ {молоко'}. Sách báo bình thường không ghi dấu này, nên hãy luôn học từ kèm trọng âm." },
    { t: 'О không có trọng âm → «a»', d: "Chữ {о} khi không mang trọng âm đọc gần như «a»: {молоко'} → «ma‑la‑kó», {хорошо'} → «kha‑ra‑shó»." },
    { t: 'Е, Я không có trọng âm → «i»', d: "Khi không mang trọng âm, {е} và {я} đọc gần như «i»: {сестра'} → «sis‑trá», {язы'к} → «yi‑zứk»." },
    { t: 'Phụ âm cuối từ bị «điếc» đi', d: "Phụ âm hữu thanh ở cuối từ đọc thành vô thanh: б→p, в→f, г→k, д→t, ж→sh, з→s. {хлеб} → «khlep», {го'род} → «gó‑rat», {глаз} → «glas»." },
    { t: 'Phụ âm mềm', d: 'Đứng trước {е, ё, и, ю, я} hoặc {ь}, phụ âm được đọc **mềm** — mặt lưỡi nâng lên như khi chuẩn bị đọc «i»: {нет}, {день}, {мать}.' },
    { t: 'Có chữ viết mà không đọc', d: "{здра'вствуйте} (chữ в đầu tiên), {со'лнце} (chữ л), {се'рдце} (chữ д). Ngoài ra {что} đọc là «shto», {его'} đọc là «yevó»." },
  ].map((r) => ({ t: S(r.t), d: S(r.d) }));

  RU.ALPHA = { letters: LETTERS, lessons: LESSONS, rules: RULES, byUpper: Object.fromEntries(LETTERS.map((L) => [L.u, L])) };
})(window.RU = window.RU || {});
