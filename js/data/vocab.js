/* =====================================================================
   vocab.js — từ vựng theo chủ đề
   Mỗi dòng:  tiếng Nga | nghĩa tiếng Việt | giống (m/f/n/pl) | ghi chú
   Dấu ' sau nguyên âm = trọng âm.
   ===================================================================== */
(function (RU) {
  'use strict';

  const TOPICS = [
    {
      id: 'greet', icon: '👋', title: 'Chào hỏi & giao tiếp', desc: 'Những câu đầu tiên ai cũng cần', words: `
приве'т | xin chào (thân mật)
здра'вствуйте | xin chào (lịch sự) | | Chữ «в» đầu tiên không đọc: «zdrástvuite».
до'брое у'тро | chào buổi sáng
до'брый день | xin chào (ban ngày)
до'брый ве'чер | chào buổi tối
споко'йной но'чи | chúc ngủ ngon
до свида'ния | tạm biệt
пока' | tạm biệt (thân mật)
спаси'бо | cảm ơn
пожа'луйста | làm ơn; không có gì | | Thường đọc nhanh thành «pazhálsta».
извини'те | xin lỗi (lịch sự)
извини' | xin lỗi (thân mật)
да | vâng, có, đúng
нет | không
как дела'? | bạn khỏe không?
норма'льно | bình thường, ổn
отли'чно | tuyệt vời
всё хорошо' | mọi thứ đều ổn
меня' зову'т… | tôi tên là… | | Ví dụ: Меня́ зову́т Лан.
о'чень прия'тно | rất vui được gặp bạn
я не понима'ю | tôi không hiểu
повтори'те, пожа'луйста | xin hãy nhắc lại
коне'чно | tất nhiên | | Đọc là «kanéshna».
мо'жно | có thể, được phép
ла'дно | được rồi, OK
добро' пожа'ловать | chào mừng
` },
    {
      id: 'pron', icon: '🙋', title: 'Đại từ & từ để hỏi', desc: 'Tôi, bạn, anh ấy… Ai? Cái gì? Ở đâu?', words: `
я | tôi
ты | bạn (thân mật)
он | anh ấy; nó (giống đực)
она' | cô ấy; nó (giống cái)
оно' | nó (giống trung)
мы | chúng tôi, chúng ta
вы | các bạn; ngài (lịch sự)
они' | họ, chúng nó
кто | ai
что | cái gì | | Đọc là «shto».
где | ở đâu
куда' | đi đâu (hướng tới)
отку'да | từ đâu
когда' | khi nào
как | như thế nào
почему' | tại sao
ско'лько | bao nhiêu
како'й | (cái) nào, như thế nào
чей | của ai
э'то | đây là, đó là; cái này
здесь | ở đây
там | ở đó
вот | đây này (chỉ cho xem)
тут | ở đây (khẩu ngữ)
` },
    {
      id: 'family', icon: '👨‍👩‍👧', title: 'Gia đình & con người', desc: 'Bố mẹ, anh chị em, bạn bè', words: `
семья' | gia đình | f
ма'ма | mẹ | f
па'па | bố | m | Giống đực dù tận cùng bằng -а (vì chỉ nam giới).
мать | mẹ (trang trọng) | f
оте'ц | cha | m
брат | anh trai, em trai | m
сестра' | chị gái, em gái | f
сын | con trai | m
дочь | con gái | f
ба'бушка | bà | f
де'душка | ông | m | Giống đực dù tận cùng bằng -а.
муж | chồng | m
жена' | vợ | f
ребёнок | đứa trẻ, em bé | m
де'ти | trẻ em; con cái | pl
челове'к | người | m
лю'ди | người (số nhiều), mọi người | pl
мужчи'на | đàn ông | m | Giống đực dù tận cùng bằng -а.
же'нщина | phụ nữ | f
ма'льчик | cậu bé | m
де'вочка | cô bé | f
де'вушка | cô gái | f
друг | bạn (nam) | m
подру'га | bạn (nữ) | f
роди'тели | bố mẹ | pl
сосе'д | hàng xóm | m
` },
    {
      id: 'numbers', icon: '🔢', title: 'Số đếm', desc: 'Từ 0 đến 1000', words: `
ноль | số 0 | m
оди'н | 1 (một) | | Giống cái: одна́, giống trung: одно́.
два | 2 (hai) | | Với danh từ giống cái: две.
три | 3 (ba)
четы'ре | 4 (bốn)
пять | 5 (năm)
шесть | 6 (sáu)
семь | 7 (bảy)
во'семь | 8 (tám)
де'вять | 9 (chín)
де'сять | 10 (mười)
оди'ннадцать | 11 (mười một)
двена'дцать | 12 (mười hai)
трина'дцать | 13 (mười ba)
пятна'дцать | 15 (mười lăm)
два'дцать | 20 (hai mươi)
три'дцать | 30 (ba mươi)
со'рок | 40 (bốn mươi)
пятьдеся'т | 50 (năm mươi)
сто | 100 (một trăm)
ты'сяча | 1000 (một nghìn) | f
пе'рвый | thứ nhất
второ'й | thứ hai
тре'тий | thứ ba
` },
    {
      id: 'time', icon: '⏰', title: 'Thời gian', desc: 'Hôm nay, ngày mai, thứ trong tuần, mùa', words: `
день | ngày; ban ngày | m
ночь | đêm | f
у'тро | buổi sáng | n
ве'чер | buổi tối | m
сего'дня | hôm nay | | Đọc là «sevódnya» (г đọc thành v).
за'втра | ngày mai
вчера' | hôm qua
сейча'с | bây giờ
пото'м | sau đó
всегда' | luôn luôn
иногда' | thỉnh thoảng
никогда' | không bao giờ
ча'сто | thường xuyên
час | giờ, tiếng đồng hồ | m
мину'та | phút | f
неде'ля | tuần | f
ме'сяц | tháng | m
год | năm | m
вре'мя | thời gian | n | Giống trung dù tận cùng bằng -я (ngoại lệ).
понеде'льник | thứ Hai | m
вто'рник | thứ Ba | m
среда' | thứ Tư | f
четве'рг | thứ Năm | m
пя'тница | thứ Sáu | f
суббо'та | thứ Bảy | f
воскресе'нье | Chủ nhật | n
зима' | mùa đông | f
весна' | mùa xuân | f
ле'то | mùa hè | n
о'сень | mùa thu | f
` },
    {
      id: 'colors', icon: '🎨', title: 'Màu sắc', desc: 'Đỏ, xanh, vàng…', words: `
цвет | màu sắc | m
кра'сный | đỏ
си'ний | xanh dương (đậm)
голубо'й | xanh da trời (nhạt)
зелёный | xanh lá cây
жёлтый | vàng
бе'лый | trắng
чёрный | đen
се'рый | xám
кори'чневый | nâu
ора'нжевый | cam
ро'зовый | hồng
фиоле'товый | tím
` },
    {
      id: 'adj', icon: '✨', title: 'Tính từ thông dụng', desc: 'To, nhỏ, mới, cũ, đẹp, ngon…', words: `
большо'й | to, lớn
ма'ленький | nhỏ, bé
хоро'ший | tốt, hay
плохо'й | xấu, tồi, tệ
но'вый | mới
ста'рый | cũ; già
молодо'й | trẻ
краси'вый | đẹp
интере'сный | thú vị, hay
лёгкий | dễ; nhẹ | | Đọc là «lyókhkii».
тру'дный | khó
горя'чий | nóng (đồ vật, đồ ăn)
холо'дный | lạnh
дорого'й | đắt; thân yêu
дешёвый | rẻ
бы'стрый | nhanh
вку'сный | ngon
дли'нный | dài
коро'ткий | ngắn
весёлый | vui vẻ
гру'стный | buồn | | Chữ «т» không đọc: «grúsnưi».
у'мный | thông minh
ру'сский | (thuộc về) Nga
вьетна'мский | (thuộc về) Việt Nam
` },
    {
      id: 'food', icon: '🍲', title: 'Đồ ăn & thức uống', desc: 'Nước, trà, bánh mì, trái cây…', words: `
еда' | đồ ăn, thức ăn | f
вода' | nước | f
чай | trà | m
ко'фе | cà phê | m | Giống đực dù tận cùng bằng -е, không đổi đuôi.
молоко' | sữa | n
сок | nước ép | m
хлеб | bánh mì | m
рис | gạo, cơm | m
мя'со | thịt | n
ры'ба | cá | f
ку'рица | thịt gà; gà mái | f
яйцо' | quả trứng | n
сыр | pho mát | m
суп | súp, canh | m
сала'т | xa lát | m
о'вощи | rau củ | pl
фру'кты | trái cây | pl
я'блоко | quả táo | n
бана'н | quả chuối | m
апельси'н | quả cam | m
карто'шка | khoai tây | f
помидо'р | cà chua | m
са'хар | đường | m
соль | muối | f
пи'во | bia | n
вино' | rượu vang | n
торт | bánh kem | m
за'втрак | bữa sáng | m
обе'д | bữa trưa | m
у'жин | bữa tối | m
` },
    {
      id: 'home', icon: '🏠', title: 'Nhà cửa & đồ vật', desc: 'Phòng, bàn ghế, điện thoại…', words: `
дом | ngôi nhà | m
кварти'ра | căn hộ | f
ко'мната | căn phòng | f
ку'хня | nhà bếp | f
туале'т | nhà vệ sinh | m
дверь | cửa ra vào | f
окно' | cửa sổ | n
стол | cái bàn | m
стул | cái ghế | m
крова'ть | cái giường | f
ла'мпа | cái đèn | f
телеви'зор | ti vi | m
телефо'н | điện thoại | m
компью'тер | máy tính | m
кни'га | quyển sách | f
ру'чка | cái bút | f
каранда'ш | bút chì | m
су'мка | túi xách | f
ключ | chìa khóa | m
часы' | đồng hồ | pl
де'ньги | tiền | pl
фо'то | bức ảnh | n | Không đổi đuôi.
письмо' | lá thư | n
сло'во | từ | n
слова'рь | từ điển | m
` },
    {
      id: 'city', icon: '🏙️', title: 'Thành phố & đi lại', desc: 'Đường phố, cửa hàng, xe buýt…', words: `
го'род | thành phố | m
у'лица | đường phố | f
шко'ла | trường học | f
университе'т | trường đại học | m
рабо'та | công việc; nơi làm việc | f
магази'н | cửa hàng | m
ры'нок | chợ | m
рестора'н | nhà hàng | m
кафе' | quán cà phê | n | Không đổi đuôi.
больни'ца | bệnh viện | f
апте'ка | hiệu thuốc | f
банк | ngân hàng | m
по'чта | bưu điện | f
парк | công viên | m
гости'ница | khách sạn | f
вокза'л | nhà ga | m
аэропо'рт | sân bay | m
метро' | tàu điện ngầm | n | Không đổi đuôi.
авто'бус | xe buýt | m
маши'на | xe hơi | f
такси' | taxi | n | Không đổi đuôi.
по'езд | tàu hỏa | m
самолёт | máy bay | m
биле'т | vé | m
страна' | đất nước | f
Росси'я | nước Nga | f
Вьетна'м | Việt Nam | m
Москва' | Mát-xcơ-va (Moskva) | f
` },
    {
      id: 'verbs', icon: '🏃', title: 'Động từ thông dụng', desc: 'Ăn, uống, nói, đọc, đi…', words: `
быть | thì, là, ở | | Hiện tại thường lược bỏ. Quá khứ: был, была́, бы́ло, бы́ли.
есть | ăn | | я ем, ты ешь, он ест, мы еди́м, вы еди́те, они́ едя́т
пить | uống | | я пью, ты пьёшь, они́ пьют
говори'ть | nói | | я говорю́, ты говори́шь, они́ говоря́т
знать | biết | | я зна́ю, ты зна́ешь, они́ зна́ют
понима'ть | hiểu | | я понима́ю, ты понима́ешь
ду'мать | nghĩ | | я ду́маю, ты ду́маешь
хоте'ть | muốn | | я хочу́, ты хо́чешь, он хо́чет, мы хоти́м, вы хоти́те, они́ хотя́т
люби'ть | yêu, thích | | я люблю́, ты лю́бишь, они́ лю́бят
жить | sống | | я живу́, ты живёшь, они́ живу́т
рабо'тать | làm việc | | я рабо́таю, ты рабо́таешь
учи'ться | học (ở trường) | | я учу́сь, ты у́чишься, они́ у́чатся
изуча'ть | học, nghiên cứu (một môn) | | я изуча́ю ру́сский язы́к
чита'ть | đọc | | я чита́ю, ты чита́ешь
писа'ть | viết | | я пишу́, ты пи́шешь, они́ пи́шут
слу'шать | nghe | | я слу́шаю, ты слу́шаешь
смотре'ть | xem, nhìn | | я смотрю́, ты смо́тришь, они́ смо́трят
ви'деть | nhìn thấy | | я ви́жу, ты ви́дишь
идти' | đi (bộ) | | я иду́, ты идёшь, они́ иду́т
е'хать | đi (bằng xe) | | я е́ду, ты е́дешь, они́ е́дут
де'лать | làm | | я де́лаю, ты де́лаешь
спать | ngủ | | я сплю, ты спишь, они́ спят
покупа'ть | mua | | я покупа́ю, ты покупа́ешь
игра'ть | chơi | | я игра́ю, ты игра́ешь
помога'ть | giúp đỡ | | я помога́ю, ты помога́ешь
звони'ть | gọi điện | | я звоню́, ты звони́шь
ждать | chờ, đợi | | я жду, ты ждёшь, они́ ждут
мочь | có thể | | я могу́, ты мо́жешь, он мо́жет, они́ мо́гут
отдыха'ть | nghỉ ngơi | | я отдыха́ю, ты отдыха́ешь
гото'вить | nấu ăn; chuẩn bị | | я гото́влю, ты гото́вишь
спра'шивать | hỏi | | я спра́шиваю, ты спра́шиваешь
отвеча'ть | trả lời | | я отвеча́ю, ты отвеча́ешь
открыва'ть | mở | | я открыва́ю, ты открыва́ешь
закрыва'ть | đóng | | я закрыва́ю, ты закрыва́ешь
` },
    {
      id: 'body', icon: '🧍', title: 'Cơ thể', desc: 'Đầu, mắt, tay, chân…', words: `
голова' | cái đầu | f
лицо' | khuôn mặt | n
глаз | con mắt | m
нос | cái mũi | m
рот | cái miệng | m
у'хо | cái tai | n
зуб | cái răng | m
во'лосы | tóc | pl
рука' | bàn tay, cánh tay | f
нога' | bàn chân, cái chân | f
па'лец | ngón tay | m
живо'т | cái bụng | m
спина' | cái lưng | f
се'рдце | trái tim | n | Chữ «д» không đọc: «sértse».
плечо' | vai | n
` },
    {
      id: 'animals', icon: '🐾', title: 'Động vật', desc: 'Chó, mèo, gấu, voi…', words: `
соба'ка | con chó | f
ко'шка | con mèo (cái) | f
кот | con mèo (đực) | m
пти'ца | con chim | f
ло'шадь | con ngựa | f
коро'ва | con bò | f
свинья' | con lợn | f
медве'дь | con gấu | m
волк | chó sói | m
лиса' | con cáo | f
мышь | con chuột | f
за'яц | con thỏ rừng | m
тигр | con hổ | m
слон | con voi | m
обезья'на | con khỉ | f
` },
    {
      id: 'weather', icon: '☀️', title: 'Thời tiết & thiên nhiên', desc: 'Mưa, nắng, biển, núi…', words: `
пого'да | thời tiết | f
со'лнце | mặt trời | n | Chữ «л» không đọc: «sóntse».
дождь | mưa | m | Đọc là «dosht'».
снег | tuyết | m
ве'тер | gió | m
не'бо | bầu trời | n
мо'ре | biển | n
река' | dòng sông | f
гора' | ngọn núi | f
лес | khu rừng | m
де'рево | cái cây | n
цвето'к | bông hoa | m | Số nhiều: цветы́.
тепло' | ấm áp (trời)
жа'рко | nóng (trời)
хо'лодно | lạnh (trời)
идёт дождь | trời đang mưa
` },
    {
      id: 'study', icon: '🎓', title: 'Học tập & nghề nghiệp', desc: 'Sinh viên, giáo viên, bác sĩ…', words: `
студе'нт | sinh viên (nam) | m
студе'нтка | sinh viên (nữ) | f
учи'тель | giáo viên | m
врач | bác sĩ | m
инжене'р | kỹ sư | m
води'тель | tài xế | m
по'вар | đầu bếp | m
продаве'ц | người bán hàng | m
журнали'ст | nhà báo | m
программи'ст | lập trình viên | m
уро'к | bài học | m
язы'к | ngôn ngữ; cái lưỡi | m
вопро'с | câu hỏi | m
отве'т | câu trả lời | m
зада'ние | bài tập, nhiệm vụ | n
экза'мен | kỳ thi | m
по-ру'сски | (bằng) tiếng Nga | | Я говорю́ по-ру́сски — Tôi nói tiếng Nga.
по-вьетна'мски | (bằng) tiếng Việt
по-англи'йски | (bằng) tiếng Anh
` },
    {
      id: 'shopping', icon: '🛍️', title: 'Quần áo & mua sắm', desc: 'Áo, quần, giá cả…', words: `
оде'жда | quần áo | f
руба'шка | áo sơ mi | f
футбо'лка | áo phông | f
пла'тье | váy liền | n
ю'бка | chân váy | f
брю'ки | quần dài | pl
джи'нсы | quần bò | pl
ку'ртка | áo khoác | f
ша'пка | mũ len | f
о'бувь | giày dép | f
цена' | giá cả | f
ско'лько сто'ит? | giá bao nhiêu?
до'рого | đắt
дёшево | rẻ
ка'сса | quầy thu ngân | f
рубль | đồng rúp | m
ски'дка | giảm giá | f
` },
    {
      id: 'words', icon: '🔗', title: 'Từ nối & trạng từ', desc: 'Và, nhưng, rất, cũng, đã…', words: `
и | và
а | còn, mà (đối lập nhẹ)
но | nhưng
и'ли | hoặc
потому' что | bởi vì | | Đọc là «patamú shta».
поэ'тому | vì vậy
то'же | cũng
ещё | còn, nữa, thêm
уже' | đã, rồi
о'чень | rất
мно'го | nhiều
ма'ло | ít
немно'го | một chút
пло'хо | tệ, kém
бы'стро | nhanh
ме'дленно | chậm
вме'сте | cùng nhau
то'лько | chỉ
наприме'р | ví dụ
пра'вда | sự thật; thật à? | f
не | không (phủ định động từ / từ)
` },
  ];

  const S = RU.U.stressify;
  const all = [];
  const byId = {};
  TOPICS.forEach((t) => {
    t.list = [];
    t.words.split('\n').map((s) => s.trim()).filter(Boolean).forEach((line) => {
      const [ru, vi, g, note] = line.split('|').map((x) => (x || '').trim());
      const w = { ru: S(ru), vi, g: g || '', note: S(note || ''), topic: t.id };
      w.id = RU.U.normRu(w.ru);
      if (byId[w.id]) { console.warn('Trùng từ:', w.id); return; }
      byId[w.id] = w;
      t.list.push(w);
      all.push(w);
    });
    delete t.words;
  });

  RU.VOCAB = { topics: TOPICS, all, byId, topic: (id) => TOPICS.find((t) => t.id === id) };
})(window.RU = window.RU || {});
