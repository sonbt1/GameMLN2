# Đấu trường tiền tệ

> Game lớp học nhiều người chơi realtime mô phỏng 12 ngày giao dịch để minh họa tiền tệ, các chức năng của tiền và sự khác nhau giữa tiền tệ với tư bản. Nội dung học thuật và luật ngày lấy từ [`docs/KICH_BAN_12_NGAY.md`](docs/KICH_BAN_12_NGAY.md). Mọi giá và tỷ giá trong game là số liệu giả lập.

## Chạy local

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm start
```

Mở [http://localhost:3000](http://localhost:3000). Trang MC nằm ở `/admin.html`; sinh viên vào `/` hoặc `/player.html`. Trạng thái giữ trong bộ nhớ. Server ghi snapshot JSON ở `server/snapshots/` sau mỗi ngày để khôi phục khi khởi động lại.

## Chạy qua mạng lớp học

1. Kết nối máy chạy server và điện thoại vào cùng Wi-Fi.
2. Tìm địa chỉ IPv4 LAN của máy chủ (Windows: `ipconfig`; macOS/Linux: `ip addr`). Cho phép kết nối vào cổng TCP 3000 trong firewall nếu hệ điều hành hỏi.
3. Chạy `npm start`, rồi mở `http://<IP-LAN>:3000/admin.html` trên máy chiếu. MC tạo phòng; sinh viên quét QR hoặc mở liên kết trên điện thoại và nhập tên.
4. Nếu Wi-Fi trường cô lập thiết bị, dùng tunnel HTTPS như cloudflared hoặc ngrok để cấp URL công khai tạm thời trỏ tới cổng 3000. Chỉ chia sẻ URL đó với lớp trong buổi học.

Không cần cài ứng dụng trên điện thoại. `playerToken` lưu trong localStorage để vào lại phòng và giữ nguyên tài sản sau khi mất kết nối.

## MC điều khiển

- **Tạo phòng mới** để sinh mã phòng và QR. Có thể mở lại phòng bằng mã khi server còn giữ trạng thái.
- **Bắt đầu · giới thiệu luật**, sau đó **Bắt đầu ngày / ngày tiếp theo**.
- Ngày 1: mở phần đổi hàng trong 45 giây, bấm **Công bố tiền xu ngày 1** để thu thẻ và phát đều 10.000 xu; ngày này không mở chợ.
- Trong mỗi ngày, MC có thể đặt thời lượng, tạm dừng, khóa giao dịch, công bố kết quả và chuyển ngày. Sau công bố, trang chiếu hiện bối cảnh, giá ngày hiện tại, câu chốt và top 5.
- Ngày 9 hệ thống tự xử lý nợ đến hạn sau khi MC công bố kết quả. Ngày 10 mở cửa sổ đổi vàng hai chiều ở mức 1 vàng = 1.500 xu; ngày 11 mở hợp đồng dầu thanh toán USD. Ngày 12 kết thúc bằng tổng kết và có câu hỏi phụ nếu hòa hạng nhất.

## Cấu hình

- `server/data/days.json`: chủ đề, thời lượng, lịch chợ, bản tin, sự kiện, tỷ giá và kiến thức theo từng ngày. `server/data/goods.json`: khoảng giá, biên độ và giá khởi điểm của 8 hàng hóa.
- `server/data/config.json`: phí giao dịch, hạn mức nợ, ngày đến hạn, giới hạn tín dụng và tỷ lệ sản xuất.
- `server/data/tiebreak-questions.json`: câu hỏi kiến thức khi hòa hạng nhất.
- `server/engine/room.js`: vòng đời phòng và phase; `orders.js`: kiểm tra lệnh; `portfolio.js`: số dư, tài sản ròng và thanh toán nợ.

## Kiểm tra

```bash
npm test
node tests/simulate.js
```

Test dùng runner tích hợp `node:test`; mô phỏng chạy 40 bot hết 12 ngày và đo p95 xử lý lệnh.

## Cấu trúc

- `client/`: HTML/CSS/JS thuần; không có bước build.
- `server/`: Express, Socket.IO, engine và snapshot.
- `tests/`: test luật engine và mô phỏng lớp học.
- `legacy/pixel-marx/`: bản engine Canvas cũ, lưu để tham khảo và không được import vào game mới.
- `assets/ATTRIBUTION.md`: nguồn và giấy phép asset Kenney CC0 đã có trong repo. Giao diện mới dùng emoji/CSS nên không thêm asset ngoài.
