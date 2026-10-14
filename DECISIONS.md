# Quyết định triển khai — Đấu trường tiền tệ

Tài liệu này ghi nhận các mặc định kỹ thuật và cách diễn giải những chỗ kịch bản còn để mở. Nội dung học thuật, câu “Kiến thức rút ra”, số liệu kịch bản và kết luận cuối được giữ theo `docs/KICH_BAN_12_NGAY.md`.

## Quyết định mặc định từ CODEX_PROMPT.md

- Phí mua/bán 1% từ ngày 2, làm tròn xuống nhưng tối thiểu 1 xu; ngày 1 miễn phí. Cấu hình qua `feeRate`.
- Giá mua/bán là một giá niêm yết; không bán khống. Không vay để mua ngoại trừ cơ chế mua chịu ngày 7.
- Bảng giá dùng đúng bảng trong prompt: ngày 2 gạo 200, dầu 500, vàng 1.000, chip 800; ngày 3 gạo 260; ngày 4 chip 1.120; ngày 5 vàng 1.300/chip 896; ngày 6–10 giữ; ngày 11–12 gạo 234/dầu 400/vàng 1.300/chip 672. Tỷ giá là 100 xu/USD ngày 8, 110 ngày 9–12.
- Ngày 1 nhận ba thẻ hàng ngẫu nhiên và một mục tiêu, trao đổi 1–1 trong 45 giây; xu chỉ được phát khi MC công bố. Thẻ bị hủy và không tính tài sản.
- Ngày 7 hạn mức tổng nợ 2.000 xu/người, khóa giá tại lệnh, không lãi, hạn ngày 10; bán tài sản theo thứ tự giá trị thị trường cao nhất để thu nợ.
- Ngày 8 nhập khẩu có giá USD tính theo `giá nội địa / 100 × 0,95`; trả USD. Ngày 10 khu quy đổi xu–vàng cố định tách biệt với khu dầu chỉ mua bằng USD.
- Ngày 12 tiêu dùng H–T–H không làm giảm tài sản ròng; sản xuất cho phép ứng tối đa 5.000 xu theo tỷ lệ, tách điểm kiến thức khỏi bảng xếp hạng tài sản.
- Tài sản ròng gồm tiền, hàng theo giá hiện tại, USD theo tỷ giá, tài sản sản xuất còn lại, trừ nợ. Hòa hạng nhất mới mở tie-break.
- Bảng giá/biến cố tương lai không được gửi cho người chơi hoặc màn MC; chỉ dữ liệu ngày hiện hành và quá khứ được phát.

## Diễn giải các điểm chưa rõ

1. **Giá ngày 1:** Kịch bản chưa niêm yết giá và ngày 1 chủ yếu là trao đổi hàng đổi hàng. Dùng cùng giá mở đầu ngày 2 khi xu được công bố để mở thị trường sau 45 giây; cấu hình lấy từ dữ liệu ngày 2, không tạo cú sốc giá ngày 1.
2. **Tổng thời lượng:** Các thời lượng 12 ngày cộng lại là 840 giây (14 phút), chưa tính giới thiệu và chuyển cảnh. Đây là con số xác định từ bảng kịch bản; phần “khoảng 20–25 phút” là tổng thời lượng tham khảo gồm các phần ngoài giao dịch.
3. **Phí đổi ngoại tệ/ngày 8:** Mặc định không thu phí theo prompt; tách cấu hình riêng để có thể đổi sau.
4. **Bán hàng trả nợ:** Khi tiền mặt thiếu, chọn hàng hóa có tổng giá trị thị trường cao nhất trước; bán số lượng nguyên tối thiểu đủ bù khoản thiếu, trừ phí giao dịch nếu cấu hình phí đang bật. USD và tài sản sản xuất không tự thanh lý vì prompt chỉ quy định tự bán hàng.
5. **Sản xuất theo tỷ lệ:** Phần ứng vốn nhỏ hơn 5.000 được tính theo tỷ lệ trên từng thành phần 3.000/1.000/1.000; làm tròn xuống theo xu nguyên, phần tổng chênh làm tròn được phân bổ vào thành phần nguyên liệu. Sản phẩm hoàn tất trả 1,2 lần số vốn ứng.
6. **Giá trị sản xuất còn lại:** Mô phỏng sản xuất hoàn tất ngay, 6.000 xu thu được thành tiền mặt; không tồn kho tư liệu sản xuất nào cần định giá cuối ngày.
7. **Tie-break:** Câu hỏi chọn ngẫu nhiên từ bộ câu hỏi đã cấu hình; chỉ người cùng điểm cao nhất trả lời. Đúng trước thắng; nếu tất cả sai hoặc thời gian bằng nhau thì giữ đồng hạng và báo MC.
8. **Điều khiển phase:** Tự đếm ngược theo thời lượng cấu hình, đồng thời cho MC quyền chuyển/khóa thủ công. Dừng timer khi tạm dừng.
9. **Số người và tên:** Cho phép 50 người/phòng theo mục tiêu lớp học; tên phân biệt sau trim và không phân biệt hoa thường.
10. **Ảnh hưởng client cũ:** Engine platformer được lưu trong `legacy/pixel-marx/` nguyên trạng và không được tải bởi ứng dụng mới. Giữ nguyên assets và attribution.
11. **Giá nhập số nguyên:** Giá nhập tính theo công thức kịch bản rồi làm tròn lên tới USD nguyên để phù hợp quy tắc mọi tiền là số nguyên. Dầu ngày 10 được tính theo giá niêm yết dầu chia tỷ giá, làm tròn lên tới USD nguyên; USD không quy đổi cố định thành dầu.
12. **Một lô sản xuất:** Mỗi người chơi chỉ hoàn tất một lô trong ngày 12; số vốn ứng có thể thấp hơn mức tối đa 5.000 xu và sản lượng tiền thu về tính theo tỷ lệ.

