# Ghi chú bảo trì — Đấu trường tiền tệ

## Chạy và kiểm tra

- Yêu cầu Node.js 20+. Cài dependency bằng `npm install`, khởi động bằng `npm start`.
- `npm test` chạy `node:test`; `node tests/simulate.js` mô phỏng 40 người chơi qua đủ 12 ngày.
- Mở `/admin.html` để tạo phòng và `/` trên điện thoại để tham gia. Không có build step.

## Kiến trúc

- `server/index.js`: Express static hosting, Socket.IO events, hàng đợi lệnh từng phòng, snapshot JSON.
- `server/engine/room.js`: phase và vòng đời phòng, timer, thẻ đổi hàng, thông tin công khai.
- `server/engine/orders.js`: kiểm tra mọi lệnh và cập nhật portfolio phía server.
- `server/engine/portfolio.js`: tiền, hàng, USD, nợ, phí, thanh lý và tài sản ròng.
- `server/engine/market.js`: giá theo ngày và giá nhập khẩu.
- `server/engine/day-config.js`: nạp cấu hình JSON.
- `server/engine/leaderboard.js`, `tiebreak.js`: xếp hạng và câu hỏi phụ.
- `client/`: màn MC và người chơi HTML/CSS/JS thuần; `legacy/pixel-marx/` là engine cũ, không import.

## Luật cứng cần giữ

1. Máy chủ quyết định số dư, giá và kết quả lệnh. Không nhận số liệu tài chính do client tự gửi.
2. Không đưa dữ liệu ngày chưa đến vào state/payload. Khi thêm nội dung cho admin, chỉ dùng ngày hiện tại hoặc lịch sử.
3. Mọi giao dịch đi qua queue theo phòng. Tiền và số lượng là số nguyên.
4. Luật và nội dung ngày lấy từ `server/data/days.json`, `config.json` và kịch bản `docs/KICH_BAN_12_NGAY.md`.
5. Ngày 10 phải giữ riêng cửa sổ đổi vàng với thị trường dầu thanh toán bằng USD. Không diễn giải USD đổi cố định thành dầu.
6. Ngày 12 H–T–H không trừ tài sản; kiến thức c/v/m không cộng vào bảng tài sản ròng.

## Dữ liệu và snapshot

- Giá/tin/thời lượng/kiến thức ở `server/data/days.json`; mặc định kỹ thuật ở `server/data/config.json`.
- Snapshot phòng ghi ở `server/snapshots/<MÃ>.json` khi MC công bố kết quả ngày. Dữ liệu này chỉ là JSON cục bộ; sao lưu thư mục nếu muốn giữ sau khi dọn máy.
- Không thêm database, đăng nhập tài khoản hoặc dịch vụ bên ngoài nếu chưa có quyết định phạm vi mới.

## Asset và nội dung

- Bản mới dùng emoji, không tải asset ngoài. Kenney CC0 cũ được giữ nguyên trong `assets/` và mô tả tại `assets/ATTRIBUTION.md`.
- Khi sửa kiến thức, đối chiếu nguyên văn kịch bản, đồng bộ `contents.md`, và giữ dòng nguồn: Giáo trình KTCT Mác – Lênin (Bộ GD&ĐT, 2021), Chương 2 tr. 39–44; Chương 3 tr. 75–79.
- Nội dung kết luận phải giữ rõ: lợi nhuận từ mua rẻ bán đắt không tự động là giá trị thặng dư; nguồn gốc m gắn với lao động trong sản xuất.
