# ZenHaven - Dành tặng em 💗

Một góc bình yên nhỏ bằng 3D: 4 cảnh (mưa bên lò sưởi, cực quang, biển hoàng hôn, rừng đào), mỗi cảnh có một cặp đôi
ngồi cạnh nhau, nhạc nền thư giãn, chế độ tập trung (Pomodoro), thư tình mỗi ngày và pháo hoa vào ngày kỷ niệm.

Trang web tĩnh, không cần cài đặt hay build. Mở `index.html` hoặc đưa lên GitHub Pages là chạy.

## Cá nhân hóa (chỉ cần sửa 2 chỗ)

### 1) Đường link: tên và ngày yêu nhau
```
https://doandatt.github.io/chill-zen-space/?for=Linh&from=Đạt&since=2024-02-14
```
| Tham số | Ý nghĩa |
|---|---|
| `for`   | tên người nhận ("Dành tặng Linh") |
| `from`  | tên của bạn (ký tên trong thư, trên bảng gỗ) |
| `since` | ngày bắt đầu yêu nhau, dạng `YYYY-MM-DD` (hiện bộ đếm ngày, kỷ niệm, cột mốc) |
| `bday`  | sinh nhật của em, dạng `MM-DD` (tùy chọn) |

Có thể bấm **🧰 Công cụ → ✏️ Cài đặt** để nhập, trang sẽ tạo sẵn link để gửi.

### 2) File `love-config.js`: lời nhắn, ngày đặc biệt, ảnh
- **letters**: các lời nhắn trong lá thư 💌 (mỗi ngày một câu).
- **birthday / specialDates / milestoneDays / messages**: ngày đặc biệt, pháo hoa và câu chúc.
- **photos**: ảnh kỷ niệm. Bỏ ảnh vào thư mục `photos/` rồi khai báo, ví dụ
  `{ src: 'photos/1.jpg', caption: 'Lần đầu mình đi chơi' }`. Ảnh hiện thành polaroid trong từng cảnh, chạm vào để xem lớn.
  Nên dùng ảnh nhẹ (dưới 400KB, cạnh dài ~1200px).

### Xem thử pháo hoa mà không cần chờ đến ngày
Thêm vào link: `&celebrate=anniversary` (hoặc `milestone`, `birthday`, `month`, `special`).

## Điều khiển
- **Rê chuột** để xoay cảnh, **kéo** để nhìn quanh, **lăn chuột / chụm hai ngón** để zoom. Điện thoại: **nghiêng máy** để nhìn quanh.
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
