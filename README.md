# Đạt dành tặng bé Hạnh 💗

Một góc bình yên nhỏ bằng 3D: 4 cảnh (mưa bên lò sưởi, cực quang, biển hoàng hôn, rừng đào), mỗi cảnh có một cặp đôi
ngồi cạnh nhau, nhạc nền thư giãn, chế độ tập trung (Pomodoro), thư tình mỗi ngày và pháo hoa vào ngày kỷ niệm.

Trang web tĩnh, không cần cài đặt hay build. Mở `index.html` hoặc đưa lên GitHub Pages là chạy.

## Cá nhân hóa (chỉ cần sửa 2 chỗ)

### 1) Tên và ngày
Tên đã cố định là **Đạt** và **bé Hạnh** (trong `app.js`, mục `ZEN_CONFIG`). Ngày bắt đầu yêu nhau điền vào `since` trong `love-config.js`,
hoặc thêm vào link `?since=2024-02-14`, hoặc bấm **🧰 Công cụ → ✏️ Cài đặt**. Sinh nhật dạng `?bday=08-21` (hoặc điền `birthday` trong `love-config.js`).

### 2) File `love-config.js`: lời nhắn, ngày đặc biệt, ảnh
- **since**: ngày bắt đầu yêu nhau.
- **letters**: các lời nhắn trong lá thư 💌 (mỗi ngày một câu).
- **birthday / specialDates / milestoneDays / messages**: ngày đặc biệt, pháo hoa và câu chúc.
- **photos**: ảnh kỷ niệm. Bỏ ảnh vào thư mục `photos/` rồi khai báo, ví dụ
  `{ src: 'photos/1.jpg', caption: 'Lần đầu mình đi chơi' }`. Ảnh hiện thành polaroid trong từng cảnh, chạm vào để xem lớn.
  Nên dùng ảnh nhẹ (dưới 400KB, cạnh dài ~1200px).

### Xem thử pháo hoa mà không cần chờ đến ngày
Thêm vào link: `&celebrate=anniversary` (hoặc `milestone`, `birthday`, `month`, `special`).

## Điều khiển
- **Rê chuột** để xoay cảnh, **kéo** để nhìn quanh, **lăn chuột / chụm hai ngón** để zoom. Điện thoại: **nghiêng máy** để nhìn quanh.
- Cặp đôi **tự đứng dậy, nắm tay đi dạo** quanh cảnh rồi quay lại ngồi (không cần điều khiển). Khi bật chế độ tập trung họ ngồi yên.
- **Chạm** vào cảnh để thả tim; chạm vào mèo, cặp đôi, hồ cá koi hoặc ảnh polaroid để thấy phản ứng.
- Phím: **H** ẩn/hiện công cụ, **F** chế độ tập trung, **← →** đổi cảnh.
- `?q=high|low|minimal` ép chất lượng đồ họa (mặc định tự chọn theo máy). `?scene=rain|aurora|beach|sakura` mở thẳng một cảnh.

## Đưa lên mạng
Trang đang chạy bằng GitHub Pages. Sau khi sửa file, chạy:
```
git add -A
git commit -m "Cập nhật"
git push
```
Khoảng 30 giây sau link sẽ cập nhật.

## Lưu ý
- Repo là **công khai**: ảnh bạn đưa lên đây ai có link repo cũng xem được.
- Trang dùng Three.js tải từ CDN, lần đầu cần có mạng. Sau đó trang có thể chạy offline và "Thêm vào màn hình chính" như một ứng dụng.
