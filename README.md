# Thầy Minh - vẽ hình

**Phần mềm mô phỏng hình học động & thước compa tương tác chuyên nghiệp cho giáo dục THCS (Lớp 6 - 9)**

Tích hợp công cụ thước kẻ, compa, thước đo độ, ê-ke kỹ thuật số và **Trợ lý AI Thầy Minh** hỗ trợ phân tích định lý và tự động dựng hình lên bảng vẽ.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. Hệ Thống Hình Học Động (Dynamic Geometry System - DGS)
- **Điểm:** Điểm tự do, Trung điểm 2 điểm, Giao điểm tự động bắt dính giữa các đường và đường tròn.
- **Đường:** Đoạn thẳng, Đường thẳng kéo dài, Tia, Đường trung trực động, Đường phân giác (3 điểm), Đường vuông góc qua 1 điểm, Đường song song qua 1 điểm.
- **Đa giác & Dựng nhanh:** Vẽ đa giác tự do, dựng nhanh tam giác đều, tam giác vuông, hình chữ nhật, hình vuông.
- **Đường tròn:** Đường tròn tâm & điểm, Đường tròn ngoại tiếp tam giác 3 điểm, Đường tròn nội tiếp tam giác.
- **Đo lường thời gian thực:** Độ dài đoạn thẳng (cm), Bán kính đường tròn ($R$), Diện tích đa giác ($S$), Số đo góc ($\angle^\circ$).
- **Cơ chế Snapping thông minh:** Tự động bắt dính giao điểm (tím neon), điểm trên đối tượng (xanh ngọc) và lưới tọa độ.

### 2. Bộ Dụng Cụ Kỹ Thuật Số Thực Tế
- **Thước kẻ milimet:** Hiển thị vạch cm/mm, xoay góc tự do, vẽ thẳng theo mép thước, tự động áp sát vào 2 điểm.
- **Compa kỹ thuật số:** Chân kim (needle) & chân chì (pencil), tùy chỉnh bán kính động, quay cung tròn và đường tròn trực quan.
- **Thước đo độ 180°:** Bắt tâm góc, đọc góc thời gian thực từ $0^\circ$ đến $180^\circ$.
- **Ê-ke vuông 90°:** Hỗ trợ loại $45^\circ - 45^\circ$ và $30^\circ - 60^\circ$, kiểm tra và vẽ góc vuông chuẩn xác.

### 3. Trợ Lý AI Thầy Minh & Dựng Hình Thông Minh
- **Tư vấn sư phạm:** Giải thích phương pháp dựng hình Thước & Compa chuẩn Euclid, phân tích giả thiết - kết luận.
- **Tự động dựng hình (Auto-Draw):** Người dùng chỉ cần gõ yêu cầu (VD: *"Vẽ tam giác vuông ABC..."*), AI sẽ giải thích và tạo nút **"✨ Dựng Hình Này Lên Bảng Vẽ"** để vẽ ngay lên canvas!
- **Hệ thống Fallback tự động 3 tầng (theo AI Instructions):**
  1. `gemini-3-flash-preview` (Mặc định - Phản hồi siêu nhanh)
  2. `gemini-3-pro-preview` (Tư duy sâu)
  3. `gemini-2.5-flash` (Dự phòng ổn định)
  *Nếu một model gặp sự cố hoặc quá tải quota (429), hệ thống tự động retry với model tiếp theo ngay lập tức.*

---

## 🔑 Hướng Dẫn Lấy & Nhập Gemini API Key

1. Bấm vào nút **Settings (API Key)** kèm dòng chữ đỏ **"Lấy API key để sử dụng app"** ở góc trên bên phải màn hình.
2. Truy cập [Google AI Studio API Keys](https://aistudio.google.com/api-keys) để tạo API Key hoàn toàn miễn phí.
3. Dán mã API Key vào ô nhập và bấm **Lưu Cấu Hình & Bắt Đầu**.
4. API Key được lưu trực tiếp trong `localStorage` trên trình duyệt của bạn, đảm bảo an toàn và bảo mật.

---

## 🚀 Triển Khai Lên Vercel (Deployment)

Dự án đã được cấu hình sẵn sàng triển khai dạng SPA trên Vercel:
- **`vercel.json`** đã có cấu hình rewrite cho SPA routing:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- **Build command:** `vite build`
- **Output directory:** `dist`

---

## 💻 Chạy Trực Tiếp Tại Local (Run Locally)

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
2. Chạy ứng dụng ở chế độ phát triển:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt tại địa chỉ `http://localhost:3000`.
