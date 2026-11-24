/**
 * ✏️  FILE NÀY LÀ NƠI BẠN VIẾT NỘI DUNG RIÊNG CHO NGƯỜI ẤY.
 * Chỉ cần sửa các dòng bên dưới rồi lưu lại (xong đẩy lên web là được). Không cần biết lập trình.
 *
 * Tên đã được cố định là "Đạt" và "bé Hạnh". Ngày bắt đầu yêu nhau điền ở dòng `since` bên dưới
 * (hoặc bấm 🧰 Công cụ → ✏️ Cài đặt, hoặc thêm vào link ?since=2024-02-14).
 */
window.LOVE = {

    // 💞 Ngày bắt đầu yêu nhau, dạng 'năm-tháng-ngày' (ví dụ '2024-02-14'). Để trống '' thì không hiện bộ đếm ngày.
    since: '',

    // 💌 Những lời nhắn trong lá thư. Mỗi ngày thư hiện một câu (xoay vòng), bấm "Lời nhắn khác" để đọc thêm.
    //    Hãy thay bằng lời của riêng bạn: kỷ niệm, biệt danh, những điều chỉ hai người hiểu...
    //    Để trống [] thì dùng bộ lời nhắn có sẵn.
    letters: [
        'Hôm nay dù có mệt đến đâu, em cũng đã làm rất tốt rồi. Anh tự hào về em.',
        'Có em, những ngày mưa cũng trở nên ấm áp.',
        'Cảm ơn em vì đã xuất hiện trong cuộc đời anh.',
        'Nếu hôm nay có điều gì khiến em buồn, hãy nhớ rằng anh luôn ở đây để lắng nghe em.',
        'Nụ cười của em là điều đẹp nhất anh từng được nhìn thấy.',
        'Anh không hứa sẽ hoàn hảo, nhưng anh hứa sẽ luôn ở bên em.',
        'Em cứ nghỉ ngơi đi, mọi chuyện còn lại để anh cùng em lo.',
        'Mỗi ngày trôi qua, anh lại thương em nhiều hơn một chút.',
        'Dù thế giới có ồn ào đến đâu, bên em vẫn là nơi bình yên nhất.',
        'Nhớ uống đủ nước, ăn đủ bữa và ngủ thật ngon nhé, người thương của anh.',
        'Anh muốn cùng em ngắm thật nhiều hoàng hôn như thế này.',
        'Em là điều dịu dàng nhất mà cuộc sống đã dành cho anh.'
    ],

    // 🎂 Sinh nhật của em, định dạng 'tháng-ngày' (ví dụ '08-21'). Có thể để trống ''.
    //    (Hoặc đặt trên link: ?bday=08-21)
    birthday: '',

    // 🎉 Ngày đặc biệt khác. Đúng ngày đó (hằng năm) trang sẽ bắn pháo hoa và hiện lời chúc của bạn.
    //    date: 'tháng-ngày'.  Ví dụ:
    //      { date: '02-14', title: 'Valentine của mình', message: 'Hôm nay anh chỉ muốn ở cạnh em thôi.' },
    specialDates: [
    ],

    // 🏆 Những cột mốc "số ngày bên nhau" sẽ có pháo hoa (cần có ngày bắt đầu yêu nhau ở trên link).
    milestoneDays: [100, 200, 300, 365, 500, 520, 1000, 1314, 2000, 3000],

    // 🎈 Câu chúc hiện khi gặp ngày kỷ niệm / cột mốc / sinh nhật. Có thể dùng:
    //    {name} = tên em,  {from} = tên anh,  {n} = số năm hoặc số ngày
    messages: {
        anniversary: { title: 'Kỷ niệm {n} năm bên nhau', text: 'Cảm ơn em đã ở bên anh suốt {n} năm qua. Anh yêu em nhiều lắm, {name} ạ.' },
        milestone:   { title: 'Ngày thứ {n} của chúng mình', text: '{n} ngày rồi, và anh vẫn muốn được yêu em thêm thật nhiều ngày nữa.' },
        birthday:    { title: 'Chúc mừng sinh nhật {name}!', text: 'Chúc em một tuổi mới thật nhiều niềm vui, sức khỏe và luôn rạng rỡ như hôm nay. Anh yêu em.' },
        month:       { title: 'Hôm nay tròn {n} tháng mình bên nhau 💞', text: '' }
    },

    // 📷 Ảnh kỷ niệm của hai người. Bỏ ảnh vào thư mục "photos" rồi khai báo ở đây.
    //    Ảnh sẽ xuất hiện như tấm polaroid trong từng cảnh, chạm vào để xem lớn.
    //    Nên dùng ảnh nhẹ (dưới 400KB, cạnh dài khoảng 1200px) để trang tải nhanh trên điện thoại.
    //    Ví dụ:
    //      { src: 'photos/1.jpg', caption: 'Lần đầu mình đi chơi' },
    photos: [
    ]
};
