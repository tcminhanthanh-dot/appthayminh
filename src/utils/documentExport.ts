import { GeoPoint, GeoLine, GeoCircle, GeoPolygon, GeoAngle, GeoText } from '../types/geometry';
import { dist, distToCm, angleBetween, calculatePolygonArea, PIXELS_PER_CM } from './geometryEngine';

export interface DocumentExportData {
  title?: string;
  grade?: string;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
  angles: GeoAngle[];
  texts?: GeoText[];
  svgContent?: string;
}

/**
 * Xuất Phiếu Bài Tập & Đề Thi Hình Học (.doc - tương thích hoàn toàn Microsoft Word)
 */
export function exportToWordDocument(data: DocumentExportData): void {
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const pointMap = new Map<string, GeoPoint>();
  data.points.forEach((p) => pointMap.set(p.id, p));

  // Thống kê số đo các đoạn thẳng
  const lineDetails = data.lines
    .filter((l) => l.type === 'segment' && l.p1Id && l.p2Id)
    .map((l) => {
      const p1 = pointMap.get(l.p1Id);
      const p2 = pointMap.get(l.p2Id!);
      if (!p1 || !p2) return null;
      const len = distToCm(dist(p1, p2)).toFixed(2);
      return `Đoạn thẳng ${p1.name}${p2.name} = ${len} cm`;
    })
    .filter(Boolean);

  // Thống kê góc
  const angleDetails = data.angles
    .map((ang) => {
      const p1 = pointMap.get(ang.p1Id);
      const vertex = pointMap.get(ang.vertexId);
      const p2 = pointMap.get(ang.p2Id);
      if (!p1 || !vertex || !p2) return null;
      const deg = angleBetween(p1, vertex, p2).toFixed(1);
      return `Góc ∠${p1.name}${vertex.name}${p2.name} = ${deg}°`;
    })
    .filter(Boolean);

  // Thống kê đa giác
  const polyDetails = data.polygons
    .map((poly) => {
      const pts = poly.pointIds.map((id) => pointMap.get(id)).filter((p): p is GeoPoint => Boolean(p));
      if (pts.length < 3) return null;
      const names = pts.map((p) => p.name).join('');
      const area = (calculatePolygonArea(pts) / (PIXELS_PER_CM * PIXELS_PER_CM)).toFixed(2);
      return `Đa giác ${names}: Diện tích S = ${area} cm²`;
    })
    .filter(Boolean);

  // Đóng gói nội dung chuẩn Word HTML với MSO styles
  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Phiếu Bài Tập Hình Học - Thầy Minh - vẽ hình</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #000000;
      margin: 2cm 2cm 2cm 2cm;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .header-table td {
      vertical-align: top;
      font-size: 11pt;
    }
    .title {
      text-align: center;
      font-weight: bold;
      font-size: 16pt;
      text-transform: uppercase;
      margin-top: 15px;
      margin-bottom: 5px;
      color: #1e3a8a;
    }
    .subtitle {
      text-align: center;
      font-style: italic;
      font-size: 12pt;
      margin-bottom: 20px;
    }
    .student-box {
      border: 1px solid #94a3b8;
      background-color: #f8fafc;
      padding: 10px;
      margin-bottom: 25px;
      font-size: 11pt;
    }
    .section-title {
      font-weight: bold;
      font-size: 13pt;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 3px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .question {
      margin-bottom: 15px;
      text-align: justify;
    }
    .sub-question {
      margin-left: 20px;
      margin-top: 5px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 15px;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      font-size: 11pt;
    }
    .data-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: left;
    }
    .svg-container {
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      border: 1px dashed #cbd5e1;
      background: #fafafa;
    }
    .footer {
      margin-top: 40px;
      text-align: right;
      font-style: italic;
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <!-- Bìa Tiêu Đề -->
  <table class="header-table">
    <tr>
      <td style="width: 50%; text-align: center;">
        <strong>SỞ GD&ĐT - TRƯỜNG THCS</strong><br>
        <strong>TỔ TOÁN - TIN HỌC</strong><br>
        -----------------
      </td>
      <td style="width: 50%; text-align: center;">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
        <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
        -----------------
      </td>
    </tr>
  </table>

  <div class="title">PHIẾU BÀI TẬP VÀ ĐỀ KIỂM TRA HÌNH HỌC</div>
  <div class="subtitle">Phần mềm hỗ trợ: Thầy Minh - vẽ hình (Mô phỏng hình học động THCS)</div>

  <!-- Khung học sinh -->
  <div class="student-box">
    <table style="width: 100%;">
      <tr>
        <td><strong>Họ và tên học sinh:</strong> ..............................................................</td>
        <td><strong>Lớp:</strong> .................</td>
      </tr>
      <tr>
        <td><strong>Ngày làm bài:</strong> ${dateStr}</td>
        <td><strong>Thời gian:</strong> 45 phút</td>
      </tr>
    </table>
  </div>

  <!-- I. Hình vẽ & Giả thiết -->
  <div class="section-title">I. HÌNH VẼ VÀ GIẢ THIẾT BÀI TOÁN</div>
  <p>Cho hình vẽ động được thiết kế bằng phần mềm <strong>Thầy Minh - vẽ hình</strong> như bên dưới:</p>

  <div class="svg-container">
    ${data.svgContent || '<div style="padding: 40px; color: #64748b;">[Bảng vẽ hình học Thầy Minh - xem tệp đính kèm]</div>'}
    <div style="font-size: 10pt; color: #64748b; margin-top: 5px;"><em>Hình 1: Mô hình tương tác hình học THCS</em></div>
  </div>

  <!-- Bảng số liệu đo lường -->
  <div class="section-title">II. BẢNG SỐ ĐO HÌNH HỌC THỜI GIAN THỰC</div>
  <table class="data-table">
    <tr>
      <th>Thành phần</th>
      <th>Thông số chi tiết</th>
    </tr>
    <tr>
      <td><strong>Điểm (${data.points.length})</strong></td>
      <td>${data.points.map((p) => p.name).join(', ') || 'Chưa có điểm'}</td>
    </tr>
    <tr>
      <td><strong>Đoạn thẳng (${lineDetails.length})</strong></td>
      <td>${lineDetails.join('; ') || 'Không có'}</td>
    </tr>
    <tr>
      <td><strong>Số đo góc (${angleDetails.length})</strong></td>
      <td>${angleDetails.join('; ') || 'Không có'}</td>
    </tr>
    <tr>
      <td><strong>Diện tích (${polyDetails.length})</strong></td>
      <td>${polyDetails.join('; ') || 'Không có'}</td>
    </tr>
  </table>

  <!-- III. Yêu cầu bài tập -->
  <div class="section-title">III. NỘI DUNG YÊU CẦU BÀI TOÁN</div>
  
  <div class="question">
    <strong>Câu 1 (Nhận biết - 3.0 điểm):</strong><br>
    Dựa vào hình vẽ và bảng thông số trên, em hãy:
    <div class="sub-question">a) Xác định các cặp đoạn thẳng bằng nhau hoặc các góc bằng nhau có trong hình.</div>
    <div class="sub-question">b) Nêu tên các đường đặc biệt (đường trung trực, phân giác, đường tròn nội/ngoại tiếp) đã được dựng.</div>
  </div>

  <div class="question">
    <strong>Câu 2 (Thông hiểu - 4.0 điểm):</strong><br>
    Vận dụng các định lý đã học trong chương trình Toán THCS:
    <div class="sub-question">a) Chứng minh tính chất hình học giữa các điểm và đường thẳng trong bài toán.</div>
    <div class="sub-question">b) Tính toán chính xác độ dài cạnh hoặc số đo góc còn lại và đối chiếu với số đo thời gian thực của phần mềm.</div>
  </div>

  <div class="question">
    <strong>Câu 3 (Vận dụng cao - 3.0 điểm):</strong><br>
    Khi di chuyển một điểm tự do trên màn hình (hình học động), đại lượng nào được bảo toàn không đổi? Em hãy chứng minh dự đoán đó.
  </div>

  <div class="footer">
    <em>Thầy Minh - vẽ hình chúc các em làm bài đạt kết quả tốt nhất!</em>
  </div>
</body>
</html>
`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = `Phieu_Bai_Tap_Thay_Minh_${Date.now()}.doc`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Xuất Bài Giảng Trình Chiếu PowerPoint (.html deck / presentation)
 */
export function exportToPresentation(data: DocumentExportData): void {
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const pointNames = data.points.map((p) => p.name).join(', ');

  const htmlSlides = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Slide Bài Giảng Hình Học - Thầy Minh - vẽ hình</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px;
    }
    .slide {
      width: 960px;
      height: 540px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      margin-bottom: 40px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
      padding-bottom: 15px;
    }
    .slide-badge {
      background: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .slide-title {
      font-size: 24px;
      font-weight: 800;
      color: #f1f5f9;
    }
    .slide-body {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 30px;
      margin: 20px 0;
    }
    .slide-content {
      flex: 1;
      font-size: 15px;
      line-height: 1.7;
      color: #cbd5e1;
    }
    .slide-content li {
      margin-bottom: 10px;
    }
    .slide-image {
      flex: 1;
      height: 100%;
      background: #ffffff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
    .slide-image svg {
      width: 100%;
      height: 100%;
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #334155;
      padding-top: 12px;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    @media print {
      body { background: white; padding: 0; }
      .print-btn { display: none; }
      .slide { page-break-after: always; margin: 0; box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">In Hoặc Lưu PDF Slide</button>

  <!-- Slide 1: Bìa -->
  <div class="slide" style="justify-content: center; text-align: center; background: radial-gradient(circle at center, #1e3a8a 0%, #0f172a 100%);">
    <div style="font-size: 14px; font-weight: bold; color: #60a5fa; text-transform: uppercase; margin-bottom: 10px;">BÀI GIẢNG HÌNH HỌC ĐỘNG THCS</div>
    <h1 style="font-size: 38px; font-weight: 900; color: #ffffff; margin-bottom: 15px;">MÔ PHỎNG VÀ KHÁM PHÁ ĐỊNH LÝ HÌNH HỌC</h1>
    <p style="font-size: 18px; color: #cbd5e1; max-width: 600px; margin: 0 auto 30px;">Học và thực hành dựng hình tương tác bằng Thước kẻ và Compa kỹ thuật số</p>
    <div style="font-size: 14px; color: #94a3b8;">Giáo viên hướng dẫn: <strong>Thầy Minh</strong> | Ngày giảng dạy: ${dateStr}</div>
  </div>

  <!-- Slide 2: Khảo sát hình vẽ -->
  <div class="slide">
    <div class="slide-header">
      <span class="slide-title">1. Khảo Sát Mô Hình Hình Học Động</span>
      <span class="slide-badge">Quan sát trực quan</span>
    </div>
    <div class="slide-body">
      <div class="slide-content">
        <ul>
          <li><strong>Các điểm trên bảng vẽ:</strong> ${pointNames || 'A, B, C...'}</li>
          <li><strong>Quan hệ động (Parent-Child):</strong> Khi di chuyển các đỉnh tự do, các điểm phụ thuộc (trung điểm, trực tâm, trọng tâm) tự động dịch chuyển theo.</li>
          <li><strong>Độ chính xác vector:</strong> Mọi yếu tố được quản lý bằng giải thuật vector chính xác, bảo toàn tuyệt đối tính chất hình học.</li>
        </ul>
      </div>
      <div class="slide-image">
        ${data.svgContent || '<div style="color: #64748b;">[Hình vẽ Thầy Minh]</div>'}
      </div>
    </div>
    <div class="slide-footer">
      <span>Thầy Minh - vẽ hình</span>
      <span>Trang 2 / 4</span>
    </div>
  </div>

  <!-- Slide 3: Quy trình dựng hình Euclid -->
  <div class="slide">
    <div class="slide-header">
      <span class="slide-title">2. Quy Trình Dựng Hình Bằng Thước &amp; Compa</span>
      <span class="slide-badge">Phương pháp Euclid</span>
    </div>
    <div class="slide-body">
      <div class="slide-content">
        <ul>
          <li><strong>Bước 1:</strong> Xác định các điểm cơ sở và bán kính quay của compa.</li>
          <li><strong>Bước 2:</strong> Giữ nguyên khẩu độ compa để tạo các cung tròn cách đều hai đầu mút.</li>
          <li><strong>Bước 3:</strong> Dùng thước thẳng nối các giao điểm để xác định đường trung trực / đường phân giác.</li>
          <li><strong>Ý nghĩa sư phạm:</strong> Giúp học sinh nắm vững bản chất hình học thay vì chỉ ghi nhớ công thức máy móc.</li>
        </ul>
      </div>
      <div class="slide-image">
        ${data.svgContent || '<div style="color: #64748b;">[Hình vẽ Thầy Minh]</div>'}
      </div>
    </div>
    <div class="slide-footer">
      <span>Thầy Minh - vẽ hình</span>
      <span>Trang 3 / 4</span>
    </div>
  </div>

  <!-- Slide 4: Tổng kết & Vận dụng -->
  <div class="slide">
    <div class="slide-header">
      <span class="slide-title">3. Tổng Kết Định Lý &amp; Câu Hỏi Vận Dụng</span>
      <span class="slide-badge">Ghi nhớ &amp; Luyện tập</span>
    </div>
    <div class="slide-body">
      <div class="slide-content">
        <ul>
          <li><strong>Định lý cốt lõi:</strong> Tính chất bảo toàn khoảng cách và tính thẳng hàng của các điểm đặc biệt.</li>
          <li><strong>Câu hỏi thảo luận:</strong> Khi tam giác biến đổi từ nhọn sang tù, trực tâm $H$ và tâm ngoại tiếp $O$ di chuyển ra vị trí nào?</li>
          <li><strong>Bài tập về nhà:</strong> Sử dụng phần mềm Thầy Minh để dựng lại mô hình và xuất phiếu bài tập.</li>
        </ul>
      </div>
      <div class="slide-image">
        ${data.svgContent || '<div style="color: #64748b;">[Hình vẽ Thầy Minh]</div>'}
      </div>
    </div>
    <div class="slide-footer">
      <span>Thầy Minh - vẽ hình</span>
      <span>Trang 4 / 4</span>
    </div>
  </div>
</body>
</html>
`;

  const blob = new Blob([htmlSlides], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = `Bai_Giang_Slide_Thay_Minh_${Date.now()}.html`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}
