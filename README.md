# Привет! — Học tiếng Nga từ con số 0

Ứng dụng học tiếng Nga cho người Việt mới bắt đầu. Chạy hoàn toàn trên máy, không cần cài đặt, không cần mạng (trừ giọng đọc trực tuyến của trình duyệt và đồng bộ Google Drive nếu bạn bật).

## Cách mở

**Cách 1 (khuyên dùng) — bản web: <https://daydreamersy.github.io/Privet/>**

- Máy tính: mở bằng **Microsoft Edge** (có sẵn giọng đọc tiếng Nga tự nhiên), hoặc nháy đúp file **`Mo-app-Edge.bat`** — file này mở đúng trang trên bằng Edge (không có Edge thì dùng Google Chrome).
- Điện thoại: mở bằng **Chrome** (Android) hoặc Safari (iPhone).
- Bản web **đồng bộ được tiến độ giữa các máy** qua Google Drive (xem mục [Đồng bộ nhiều thiết bị](#đồng-bộ-nhiều-thiết-bị-google-drive)).
- **Cài thành app** (biểu tượng ở desktop / màn hình chính, mở trong cửa sổ riêng, mở được cả khi mất mạng):
  - Chrome / Edge / Opera trên máy tính: bấm biểu tượng cài đặt ở cuối thanh địa chỉ, hoặc menu ⋮ → *Truyền, lưu và chia sẻ* → *Cài đặt trang dưới dạng ứng dụng* / *Tạo lối tắt…* (đánh dấu *Mở dưới dạng cửa sổ*). Trong app cũng có nút **Cài app** ở **Cài đặt → 📲 Cài app**.
  - Android: Chrome ⋮ → *Thêm vào màn hình chính* / *Cài đặt ứng dụng*. iPhone: Safari → Chia sẻ → *Thêm vào MH chính*.
  - Chuột phải biểu tượng app (Windows) có lối tắt nhanh: Ôn tập từ vựng, Luyện phát âm, Kiểm tra viết tay, Cấu trúc câu.
  - Khi mất mạng app vẫn mở được (bản lưu sẵn trong máy, tự cập nhật ở lần mở sau khi có bản mới). Giọng đọc trực tuyến, chấm phát âm và đồng bộ vẫn cần mạng.

**Cách 2 — không cần mạng:** nháy đúp `index.html` để mở bản trên máy. Bản này không đồng bộ được; nếu trình duyệt mặc định là Vivaldi, Opera, Brave, Cốc Cốc… thì có thể **không nghe được phát âm** (xem mục Giọng đọc bên dưới).

**Cách 3 (chạy qua máy chủ nhỏ, khi sửa code):** mở PowerShell trong thư mục này rồi chạy

```bash
python -m http.server 8765
```

sau đó vào http://localhost:8765 — ở localhost app không bật chế độ offline để luôn thấy code mới; thêm `?sw` vào địa chỉ nếu muốn thử offline.

> Tiến độ học được lưu trong trình duyệt bạn dùng, theo từng địa chỉ: bản web, bản trên máy (cách 2) và bản chạy qua máy chủ nhỏ (cách 3) có tiến độ riêng. Muốn chuyển tiến độ giữa chúng, vào **Cài đặt → Xuất file / Nhập file**. Giữa các máy dùng bản web thì bật **đồng bộ Google Drive**.

**Cập nhật bản web:** code nằm ở repo [DaydreamerSY/Privet](https://github.com/DaydreamerSY/Privet). Sửa xong thì `git push` lên nhánh `main`, GitHub Pages tự cập nhật sau khoảng một phút.

## Có gì trong app

### 1. Bảng chữ cái (33 chữ)
- 5 bài, đi từ dễ đến khó: chữ quen thuộc → «bạn giả» (В, Н, Р, С, У, Х) → phụ âm mới → nguyên âm đặc biệt → âm xuýt và hai dấu.
- Mỗi bài có 4 bước: **Làm quen** (âm đọc, mẹo phát âm kiểu Việt, ví dụ, hoạt ảnh thứ tự nét) → **Trắc nghiệm** → **Luyện viết** → **Tập đọc** (các từ chỉ dùng chữ đã học), rồi **Kiểm tra tổng hợp** (xem mục [Kiểm tra tổng hợp](#kiểm-tra-tổng-hợp-sau-mỗi-bài)).
- **Luyện viết trên bảng (canvas)** với dòng kẻ ô li:
  - *Tô theo mẫu*: chấm theo độ phủ nét và độ chính xác.
  - *Tự viết*: máy **nhận dạng chữ viết tay** và so với cả 33 chữ (hoa + thường), không bắt buộc đúng thứ tự hay chiều nét. Máy nhắc lỗi cụ thể, ví dụ: quên dấu ˘ của Й, quên hai chấm của Ё, quên đuôi của Щ / Ц, viết И thành Н, viết chữ hoa khi đề bài yêu cầu chữ thường…
  - Độ khó chấm chỉnh được trong Cài đặt (Dễ / Vừa / Khó).
  - **Trên điện thoại / máy tính bảng:** trong trang chỉ có ô xem trước (vuốt qua vẫn cuộn trang bình thường), chạm vào ô mới mở **bảng viết toàn màn hình** có nút Hoàn tác, Xóa, Kiểm tra. Trong chuỗi bài luyện viết, viết đúng thì bấm **Tiếp** ngay trong bảng để sang chữ sau. Nút Back của điện thoại đóng bảng viết chứ không rời trang.
- **Kiểm tra viết tay**: nghe âm → tự viết chữ từ trí nhớ.
- Bảng quy tắc phát âm quan trọng (trọng âm, о → a, phụ âm cuối bị «điếc»…).

### 2. Từ vựng (387 từ, 17 chủ đề)
- Mỗi từ có **dấu trọng âm**, phiên âm, giọng đọc, giống của danh từ, ghi chú phát âm đặc biệt (что → «shto», сего́дня → «sevódnya»…).
- Học từ mới → luyện ngay bằng trắc nghiệm, nghe, ghép cặp, gõ chữ.
- **Ôn tập ngắt quãng**: từ đã học sẽ quay lại đúng lúc bạn sắp quên (1 → 2 → 4 → 8 → 16 → 32 ngày).
- Thẻ ghi nhớ lật được, trò chơi ghép cặp, ô tìm kiếm (gõ tiếng Việt không dấu cũng được).

### 3. Cấu trúc câu (18 bài)
Э́то… · Tôi là… · Giống của danh từ · Sở hữu · Tính từ · Động từ nhóm I và II · Phủ định · Câu hỏi · «Tôi có…» (У меня́ есть) · Ở đâu (giới cách) · Tân ngữ (đối cách) · Muốn và thích · Quá khứ · Tương lai · Tuổi tác · Đi đâu · Hội thoại làm quen.
- Mỗi bài có công thức câu, giải thích bằng tiếng Việt, bảng chia từ, câu ví dụ có giọng đọc (nhấn vào chữ Nga để nghe).
- Bài tập: **xếp từ thành câu**, **điền từ vào chỗ trống**, dịch câu. Câu nào làm sai sẽ được hỏi lại ở cuối bài.

### 4. Luyện phát âm 🎤
- **Nghe mẫu → đọc to vào micro → máy nghe và chấm 0–3 sao**, cho biết máy nghe ra chữ gì và tô màu từng từ (xanh = rõ, cam = gần đúng, đỏ = máy không nghe ra).
- **Ghi âm giọng bạn** để nghe lại; nút «So sánh: mẫu → bạn» phát giọng mẫu rồi tới giọng bạn liền nhau.
- Mỗi từ / câu có dòng **«Đọc gần đúng»** — cách người Nga thực sự đọc (молоко́ → [малако́], хлеб → [хлеп], что → [што]…) và nguyên âm mang trọng âm được tô đỏ.
- **Cặp âm dễ nhầm** (ы/и, ж/ш, ш/щ, з/с, л/р, phụ âm mềm, hữu thanh/vô thanh): nói từng từ — nếu máy nghe thành từ kia, app chỉ ra âm cần sửa. Có thêm bài **luyện nghe phân biệt**.
- Luyện theo bài chữ cái, theo chủ đề từ vựng, theo câu mẫu ngữ pháp, hoặc trộn ngẫu nhiên.
- Máy chấm dùng dịch vụ nhận dạng giọng nói của trình duyệt: **chạy trên Edge và Chrome, cần mạng và micro**. Lần đầu trình duyệt sẽ hỏi quyền dùng micro — chọn «Cho phép».
- **Opera, Vivaldi, Brave, Cốc Cốc** có nút micro nhưng không có dịch vụ nhận dạng phía sau (micro ghi được tiếng, máy chấm luôn trả về rỗng) → app nhận ra các trình duyệt này, nói rõ ngay từ đầu và **chỉ ghi âm** để bạn nghe lại, so sánh với giọng mẫu. Firefox cũng chỉ ghi âm.
- Trình duyệt lạ: app đo độ to của micro. Micro thu được tiếng mà máy không nhận ra chữ nào 2 lần liền → coi như trình duyệt không chấm được và chuyển sang chỉ ghi âm. Micro gần như im lặng → nhắc kiểm tra micro, không báo nhầm là «máy không nghe thấy».
- Lưu ý: máy chấm cho biết máy *có nghe ra đúng từ* hay không, không chấm từng âm như giáo viên — hãy kết hợp nghe lại giọng mình.

### Kiểm tra tổng hợp sau mỗi bài
- Có ở mọi bài chữ cái (bước 5), mọi chủ đề từ vựng (thẻ **📝 Kiểm tra**) và mọi bài cấu trúc câu (khung **📝 Kiểm tra tổng hợp** dưới phần luyện tập).
- **Ôn cả bài cũ:** khoảng một nửa số câu của bài vừa học, nửa còn lại lấy ngẫu nhiên từ các bài trước (chữ cái: bài 1 → bài hiện tại; cấu trúc câu: bài 1 → bài hiện tại; từ vựng: từ đã học ở các chủ đề khác). Mỗi lần làm lại là một bộ câu mới.
- **Độ khó tăng dần:** mỗi câu có nhãn *Mức 1 → Mức 4* và xếp từ dễ đến khó, ví dụ:
  - Chữ cái: nhìn chữ chọn âm → nghe chọn chữ / chữ hoa – chữ thường → đọc từ → tự viết tay hoặc tự gõ từ.
  - Từ vựng: nhìn từ chọn nghĩa → nghĩa chọn từ / nghe chọn từ → chỉ nghe chọn nghĩa → tự gõ từ.
  - Cấu trúc câu: hiểu câu → chọn dạng đúng / chọn câu đúng nghĩa → xếp câu → tự gõ từ còn thiếu.
- Bài càng về sau càng nhiều câu và nhiều câu khó (chữ cái 10 → 14 câu, cấu trúc câu 12 → 16 câu).
- Là bài kiểm tra nên câu sai không hỏi lại. Đạt từ 70% (+15 XP lần đầu). Cuối bài cho biết đúng bao nhiêu ở từng mức và **bài nào nên ôn lại** (bấm vào để mở bài đó).
- Điểm cao nhất hiện ở trang bài học và được đồng bộ qua Google Drive.

### Khác
- Trang chủ có **lộ trình gợi ý** cho người mới, mục tiêu XP mỗi ngày và chuỗi ngày học 🔥.
- Gõ tiếng Nga không cần cài bàn phím: có **bàn phím Kirin ảo**, hoặc gõ Latinh để app tự đổi (`privet` → привет, `zh` → ж, `sh` → ш, `ch` → ч, `shh` → щ, `ya` → я, `'` → ь…).
- Giao diện tự chuyển sáng / tối theo máy, dùng tốt trên điện thoại.

## Giọng đọc tiếng Nga

Mỗi chữ cái, từ và câu đều có nút 🔊 (nghe) và 🐢 (nghe chậm); nhấn vào chữ Nga có gạch chấm bên dưới cũng sẽ nghe được. App dùng giọng đọc có sẵn của trình duyệt:
- **Edge**: có giọng tiếng Nga tự nhiên trực tuyến (Svetlana, Dmitry…) — tốt nhất, cần mạng.
- **Chrome**: có giọng «Google русский» (cần mạng).
- **Vivaldi, Opera, Brave, Cốc Cốc…**: chỉ dùng giọng có sẵn trong Windows. Windows mặc định thường chỉ có giọng tiếng Anh → không đọc được tiếng Nga. Hãy dùng `Mo-app-Edge.bat`.
- Có thể cài thêm giọng cho Windows: **Cài đặt → Thời gian và ngôn ngữ → Giọng nói → Thêm giọng nói → Русский**, rồi khởi động lại trình duyệt (một số trình duyệt vẫn không nhận giọng này).
- Khi trình duyệt không có giọng tiếng Nga, app sẽ hiện cảnh báo ở đầu trang. Chọn giọng và chỉnh tốc độ đọc trong **Cài đặt** của app.

## Đồng bộ nhiều thiết bị (Google Drive)

Học trên điện thoại lúc đi đường, về nhà học tiếp trên máy tính — tiến độ tự gộp qua **Google Drive của bạn**.

1. Mở bản web **<https://daydreamersy.github.io/Privet/>** (máy tính: Edge hoặc Chrome · điện thoại: Chrome).
2. **Cài đặt → ☁️ Đồng bộ nhiều thiết bị → Kết nối Google Drive**, đăng nhập Google và cho phép app lưu vào Drive. Làm như vậy trên mọi máy, **cùng một tài khoản Google**.
3. Mỗi lần mở app: bấm nút **☁️** trên thanh trên cùng (hoặc nút **Đồng bộ** ở trang chủ) để lấy tiến độ mới nhất từ máy khác — cửa sổ Google chớp lên rồi tự đóng. Sau đó app **tự đưa tiến độ mới lên Drive** (20 giây sau lần thay đổi cuối, và khi bạn chuyển tab / tắt màn hình).

Cách hoạt động ([js/lib/sync.js](js/lib/sync.js)):

- Dùng chung **Google Cloud project của Coin Manager** (cùng OAuth client ID), nên cửa sổ Google hiện tên **«Coin Manager»**. Quyền `drive.appdata`: chỉ thư mục ẩn riêng của app — không hiện trong Drive, không đụng tới file nào khác. App này chỉ đọc / ghi đúng file `privet-ru-sync.json`; file `coin-manager-sync.json` của Coin Manager nằm cùng thư mục ẩn nhưng không bị đụng tới.
- Không có máy chủ: quyền truy cập Google chỉ sống ~1 giờ và chỉ giữ trong bộ nhớ. Hết hạn thì nút ☁️ có chấm màu → bấm lại một lần.
- **App đã cài** (cửa sổ riêng / màn hình chính) — cùng cách làm với Coin Manager: cửa sổ bật lên của Google sẽ mở ra tab trình duyệt riêng và mất liên lạc với app, nên app mở trang đăng nhập Google trong trình duyệt và Google chuyển về trang [`oauth.html`](oauth.html); trang này đưa quyền truy cập về app (BroadcastChannel + localStorage, kiểm tra mã `state`, app đọc xong xoá ngay, hết hạn sau 5 phút). Đăng nhập xong quay lại app là đồng bộ tự chạy tiếp; nếu app bị tải lại trong lúc đó thì khi mở lại cũng tự làm tiếp. Cần khai báo `https://daydreamersy.github.io/Privet/oauth.html` trong *Authorized redirect URIs* của OAuth client (Google Cloud Console → project coin-manager → APIs & Services → Credentials). Mở trong tab trình duyệt thường thì vẫn dùng cửa sổ đăng nhập của Google như cũ.
- **Gộp tiến độ** (học xen kẽ nhiều máy không mất gì, đồng bộ lại bao nhiêu lần cũng được): điểm bài học / số sao cao nhất được giữ, từ vựng lấy theo lần ôn gần nhất, XP cộng theo từng máy, chuỗi ngày học tính lại từ XP. Cài đặt hiển thị và học tập theo lần đổi sau cùng; **giọng đọc và tốc độ đọc riêng từng máy**.
- **Xóa tiến độ** khi đang đồng bộ → các máy khác cũng xóa ở lần đồng bộ tới. Máy mới kết nối lần đầu thì luôn được gộp, không mất tiến độ đang có.
- Mở bằng file trên máy (`file://`, tức nháy đúp `index.html`) thì **không đồng bộ được**: Google chỉ cho đăng nhập từ địa chỉ web đã khai báo trong OAuth client (`https://daydreamersy.github.io`). Muốn mang tiến độ cũ sang bản web: **Xuất file** ở bản trên máy → **Nhập file** ở bản web.
- Chạy thử ở `http://localhost:8765` chỉ đăng nhập được nếu địa chỉ này có trong *Authorized JavaScript origins* của OAuth client (Google Cloud Console → project coin-manager → APIs & Services → Credentials).
- **Ngắt kết nối** chỉ áp dụng trên máy đó và không thu hồi quyền Google (quyền này dùng chung với Coin Manager). Muốn xóa hẳn bản trên Drive: Google Drive → Cài đặt → Quản lý ứng dụng → Coin Manager → Xóa dữ liệu ứng dụng ẩn — **thao tác này xóa cả bản đồng bộ của Coin Manager**.
- Bản web chạy chung origin `daydreamersy.github.io` với Coin Manager (như mọi trang GitHub Pages của cùng tài khoản). App này không đọc dữ liệu của Coin Manager, và dữ liệu của Coin Manager vốn đã được mã hoá.

## Cấu trúc thư mục

```
Mo-app-Edge.bat       mở bản web bằng Edge (có giọng đọc tiếng Nga, đồng bộ được)
index.html            trang chính
manifest.webmanifest  khai báo app để cài ra desktop / màn hình chính (tên, biểu tượng, lối tắt)
sw.js                 lưu sẵn app trong máy để mở được khi mất mạng (chỉ bật trên bản web)
oauth.html, js/oauth.js  trang Google chuyển về khi đăng nhập trong app đã cài
icons/                biểu tượng app (PNG thường, maskable cho Android, Apple)
css/style.css         giao diện
js/core.js            nền tảng: lưu tiến độ, giọng đọc, phiên âm, điều hướng
js/lib/path.js        đọc đường nét SVG
js/lib/recognizer.js  nhận dạng & chấm chữ viết tay
js/lib/writingpad.js  bảng viết canvas + hoạt ảnh nét chữ
js/lib/keyboard.js    bàn phím Kirin ảo, gõ phiên âm
js/lib/quiz.js        bộ máy bài tập
js/lib/test.js        bài kiểm tra tổng hợp (chọn câu bài này + bài trước, xếp từ dễ đến khó)
js/lib/speech.js      nhận dạng giọng nói, ghi âm, chấm phát âm
js/lib/sync.js        đồng bộ tiến độ qua Google Drive (dùng chung OAuth client với Coin Manager)
js/data/pronounce.js  cặp âm dễ nhầm
js/data/glyphs.js     nét mẫu của 33 chữ cái
js/data/alphabet.js   chữ cái, bài học, quy tắc phát âm
js/data/vocab.js      từ vựng
js/data/grammar.js    bài cấu trúc câu
js/views/*.js         các màn hình
```

**Thêm từ vựng:** mở `js/data/vocab.js`, thêm một dòng theo mẫu `tiếng Nga | nghĩa | giống (m/f/n/pl) | ghi chú`. Đặt dấu `'` ngay sau nguyên âm có trọng âm, ví dụ `молоко'`.

**Trang kiểm thử bộ nhận dạng** (dành cho người sửa code): `#/debug/glyphs` (xem toàn bộ nét mẫu) và `#/debug/recog?n=10` (chạy thử với chữ viết giả lập).
