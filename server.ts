import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DGS_ARCHITECT_SYSTEM_INSTRUCTION = `Bạn là Thầy Minh - Chuyên gia Sư phạm Hình học & Thiết kế Phần mềm Hình học Động (DGS Architect). Bạn chuyên giảng dạy Toán THCS (lớp 6-9), giải thuật đồ họa máy tính và trực quan hóa dựng hình Thước & Compa. Nhiệm vụ của bạn là giải đáp, hướng dẫn chi tiết phương pháp dựng hình, chứng minh định lý và xuất lệnh dựng hình trực quan cho học sinh và giáo viên.

Nhiệm vụ & Nguyên tắc:
1. Độ chính xác là ưu tiên số 1: Mọi thực thể hình học (điểm, đường, góc, đường tròn) phải được quản lý bằng tọa độ vector và các ràng buộc toán học (constraints).
2. Hệ thống công cụ cốt lõi: Thước kẻ, compa kỹ thuật số, ê-ke, thước đo độ.
3. Logic Dựng hình (Construction Logic): Ràng buộc động (khi di chuyển đỉnh, trung điểm/trung trực/phân giác/đường tròn ngoại tiếp tự cập nhật).
4. Snapping: Giao điểm (Intersection) > Điểm trên đường/đường tròn (Point on object) > Lưới tọa độ (Grid).
5. Quản lý đối tượng: Nhãn tự động (A, B, C...), thuộc tính màu/nét, số đo thời gian thực.
6. Hỗ trợ sư phạm: Phù hợp chương trình Toán THCS (Lớp 6, 7, 8, 9).

Khi trả lời người dùng, bạn PHẢI tuân thủ cấu trúc sau:
1. **Phân tích yêu cầu (Requirement Analysis):** Tóm tắt ngắn gọn logic toán học của bài toán.
2. **Quy trình Dựng hình Thước & Compa (Step-by-step Construction):** Các bước cụ thể đặt thước, quay compa.
3. **Giải thuật Vector & Tọa độ (Logic & Algorithms):** Trình bày công thức vector hoặc tọa độ tương ứng.
4. **Lưu ý sư phạm & Kỹ thuật:** Các cảnh báo về trường hợp suy biến, sai số số học.
5. Nếu người dùng yêu cầu vẽ hình cụ thể (như vẽ tam giác vuông, hình vuông, đường tròn ngoại tiếp...), hãy cung cấp kèm khối JSON đặc tả hình vẽ trong thẻ:
\`\`\`geometry-command
{
  "title": "Tên hình vẽ",
  "points": [{ "name": "A", "x": 250, "y": 350 }, { "name": "B", "x": 450, "y": 350 }, { "name": "C", "x": 250, "y": 200 }],
  "lines": [{ "type": "segment", "p1": "A", "p2": "B" }, { "type": "segment", "p1": "A", "p2": "C" }, { "type": "segment", "p1": "B", "p2": "C" }],
  "polygons": [{ "points": ["A", "B", "C"] }]
}
\`\`\``;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API endpoint for DGS Architect consultation
  app.post('/api/ai-dgs/consult', async (req, res) => {
    try {
      const { prompt, history, currentElementsSummary } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Nội dung câu hỏi không được để trống.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback intelligent response when API key is not yet configured
        return res.json({
          reply: `### 1. Phân tích yêu cầu (Requirement Analysis)
Yêu cầu: "${prompt}".
Trong hệ thống hình học động THCS, vấn đề này đòi hỏi tính nhất quán của tọa độ vector hai chiều và duy trì quan hệ phụ thuộc (parent-child dependency graph).

### 2. Giải thuật & Logic (Logic & Algorithms)
- **Biểu diễn vector:** Mỗi điểm $P = (x, y)$. Đoạn thẳng nối $A(x_A, y_A)$ và $B(x_B, y_B)$ có độ dài $d = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}$.
- **Ràng buộc động:** Điểm phụ thuộc (như trung điểm $M = \\frac{A + B}{2}$) phải được đăng ký lắng nghe sự kiện thay đổi của các điểm cha. Khi $A$ hoặc $B$ di chuyển, hàm \`recompute()\` sẽ tự động kích hoạt.
- **Dựng hình Thước & Compa:** Để dựng đường trung trực bằng thước và compa: Lấy $A$ và $B$ làm tâm, quay 2 cung tròn bán kính $R > \\frac{AB}{2}$. Giao điểm của 2 đường tròn tạo thành 2 điểm xác định đường trung trực.

### 3. Thiết kế giao diện & Tương tác (UI/UX Design)
- **Thao tác:** Người dùng chọn công cụ, di chuột qua điểm nguồn $A$ (hệ thống hiển thị vòng tròn bắt điểm tím neon), click chọn $A$, sau đó click điểm đích $B$.
- **Phản hồi xúc giác/trực quan:** Hiển thị vạch vuông góc $90^\\circ$ và 2 ký hiệu đoạn bằng nhau (tick marks) tại trung điểm $M$.

### 4. Lưu ý kỹ thuật (Technical Notes)
- **Sai số số học (Epsilon tolerance):** Khi kiểm tra $A \\equiv B$, sử dụng $|x_A - x_B| < \\varepsilon$ và $|y_A - y_B| < \\varepsilon$ với $\\varepsilon = 10^{-6}$.
- **Trường hợp suy biến (Degenerate case):** Nếu khoảng cách $AB = 0$, không cho phép dựng đường phân giác hoặc đường trung trực.

### 5. Mẫu đặc tả (Draft Spec)
\`\`\`typescript
interface DGSConstructionStep {
  type: 'perpendicular_bisector' | 'angle_bisector' | 'circle_two_points';
  parentIds: string[]; // ['pt_A', 'pt_B']
  outputId: string;
  constraints: {
    isDynamic: true;
    style: { stroke: '#3b82f6'; strokeDasharray: '4,4' };
  };
}
\`\`\``
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let contextMessage = prompt;
      if (currentElementsSummary) {
        contextMessage = `[Trạng thái bảng vẽ hiện tại]: ${currentElementsSummary}\n\n[Câu hỏi của người dùng]: ${prompt}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextMessage,
        config: {
          systemInstruction: DGS_ARCHITECT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const replyText = response.text || 'Không nhận được phản hồi từ hệ thống.';
      return res.json({ reply: replyText });
    } catch (error: any) {
      console.error('Error in /api/ai-dgs/consult:', error);
      return res.status(500).json({
        error: error.message || 'Lỗi xử lý yêu cầu từ AI DGS Architect.',
      });
    }
  });

  // Setup Vite in development or static serve in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Thầy Minh - vẽ hình server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
