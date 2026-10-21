// Dịch vụ AI Thầy Minh - Tích hợp Gemini API với cơ chế Fallback và Retry tự động

export interface AiModelCard {
  id: string;
  name: string;
  description: string;
  tag: string;
  isDefault?: boolean;
  speed: string;
  intelligence: string;
}

export const AI_MODELS: AiModelCard[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    description: 'Mô hình thế hệ mới với tốc độ siêu nhanh và phản hồi tức thì, tối ưu cho hỏi đáp & vẽ hình THCS.',
    tag: 'Mặc định (Default)',
    isDefault: true,
    speed: 'Siêu Nhanh',
    intelligence: 'Rất Cao',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    description: 'Mô hình tư duy chuyên sâu, phân tích giải thuật hình học cao cấp và định lý Euclid phức tạp.',
    tag: 'Tư Duy Sâu',
    isDefault: false,
    speed: 'Tiêu Chuẩn',
    intelligence: 'Tối Đa',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Mô hình dự phòng ổn định cao, đảm bảo không gián đoạn khi các model preview bị giới hạn quota.',
    tag: 'Dự Phòng Ổn Định',
    isDefault: false,
    speed: 'Rất Nhanh',
    intelligence: 'Tốt',
  },
];

export const FALLBACK_CHAIN = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

const STORAGE_API_KEY = 'thay_minh_gemini_api_key';
const STORAGE_SELECTED_MODEL = 'thay_minh_selected_model';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_API_KEY, key.trim());
  } catch (e) {
    console.error('Không thể lưu API Key vào localStorage:', e);
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_SELECTED_MODEL) || 'gemini-3-flash-preview';
  } catch {
    return 'gemini-3-flash-preview';
  }
}

export function saveStoredModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_SELECTED_MODEL, modelId);
  } catch (e) {
    console.error('Không thể lưu Model vào localStorage:', e);
  }
}

export const THAY_MINH_SYSTEM_PROMPT = `Bạn là Thầy Minh - Chuyên gia Sư phạm Hình học & Dựng hình Hình học Động (DGS Architect). 
Bạn luôn hướng dẫn học sinh và giáo viên THCS (Lớp 6, 7, 8, 9) với phong cách sư phạm ân cần, chuẩn mực, tư duy toán học logic và độ chính xác hình học vector cao nhất.

Khi trả lời về bài toán dựng hình hoặc hình học, bạn PHẢI tuân thủ các bước:
1. **Phân tích yêu cầu toán học:** Tóm tắt giả thiết, kết luận và mối quan hệ vector/hình học.
2. **Quy trình dựng hình Thước & Compa chuẩn Euclid:** Từng bước đặt thước, quay cung compa, xác định giao điểm.
3. **Giải thuật Vector & Tọa độ:** Trình bày ngắn gọn công thức vector (tọa độ điểm, trung điểm, phân giác, tâm đường tròn, trực tâm, trọng tâm).
4. **Lưu ý thực hành & Sai số:** Trường hợp suy biến, cách kiểm tra hình học.
5. **Lệnh Dựng Hình Tự Động (Nếu vẽ được hình):**
Nếu câu hỏi yêu cầu vẽ một hình cụ thể (tam giác, tứ giác, hình thang, đường tròn nội/ngoại tiếp, đường cao...), bạn HÃY cung cấp một khối JSON đặc tả hình vẽ chuẩn xác nằm trong thẻ \`\`\`geometry-command để người dùng có thể bấm nút TỰ ĐỘNG DỰNG HÌNH LÊN BẢNG VẼ:

\`\`\`geometry-command
{
  "title": "Mô tả ngắn hình vẽ",
  "points": [
    { "name": "A", "x": 260, "y": 200 },
    { "name": "B", "x": 160, "y": 420 },
    { "name": "C", "x": 460, "y": 420 }
  ],
  "lines": [
    { "type": "segment", "p1": "A", "p2": "B" },
    { "type": "segment", "p1": "B", "p2": "C" },
    { "type": "segment", "p1": "C", "p2": "A" }
  ],
  "polygons": [
    { "points": ["A", "B", "C"] }
  ]
}
\`\`\``;

export interface GeometryCommandShape {
  title?: string;
  points?: Array<{ name: string; x: number; y: number; color?: string }>;
  lines?: Array<{ type: 'segment' | 'line' | 'ray' | 'perpendicular_bisector'; p1: string; p2: string; color?: string }>;
  circles?: Array<{ type: 'center_point' | 'triangle_circumcircle' | 'triangle_incircle'; center?: string; radiusPoint?: string; triangle?: [string, string, string] }>;
  polygons?: Array<{ points: string[]; color?: string }>;
}

export function extractGeometryCommand(text: string): GeometryCommandShape | null {
  const match = text.match(/```geometry-command\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    console.warn('Lỗi phân tích cú pháp geometry-command JSON:', err);
    return null;
  }
}

export interface CallAiOptions {
  prompt: string;
  systemInstruction?: string;
  canvasSummary?: string;
  apiKey?: string;
  preferredModel?: string;
  onModelAttempt?: (modelId: string, attemptIndex: number) => void;
  onModelFallback?: (fromModel: string, toModel: string, errorMsg: string) => void;
}

export interface CallAiResult {
  text: string;
  usedModel: string;
  geometryCommand: GeometryCommandShape | null;
}

/**
 * Gọi Gemini API với cơ chế tự động Fallback tuần tự theo danh sách quy định:
 * gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash
 */
export async function callGeminiWithFallback(options: CallAiOptions): Promise<CallAiResult> {
  const apiKey = (options.apiKey || getStoredApiKey()).trim();
  if (!apiKey) {
    throw new Error('CHƯA_CÓ_API_KEY: Vui lòng nhập API key Gemini tại nút Thiết lập trên thanh điều hướng.');
  }

  const preferredModel = options.preferredModel || getStoredModel() || 'gemini-3-flash-preview';

  // Xây dựng danh sách model thử nghiệm bắt đầu từ model ưu tiên, sau đó tới các model dự phòng còn lại
  const modelsToTry: string[] = [preferredModel];
  for (const m of FALLBACK_CHAIN) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  let lastError: any = null;
  const sysPrompt = options.systemInstruction || THAY_MINH_SYSTEM_PROMPT;
  const fullPrompt = options.canvasSummary
    ? `[Bối cảnh bảng vẽ hiện tại]: ${options.canvasSummary}\n\n[Câu hỏi của học sinh/người dùng]: ${options.prompt}`
    : options.prompt;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    if (options.onModelAttempt) {
      options.onModelAttempt(currentModel, i + 1);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: sysPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: fullPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage =
          errorData?.error?.message ||
          `Mã lỗi HTTP ${response.status} (${response.statusText || 'Lỗi kết nối'})`;
        throw new Error(rawMessage);
      }

      const data = await response.json();
      const replyText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Thầy Minh đã tiếp nhận nhưng không nhận được nội dung phản hồi từ AI.';

      return {
        text: replyText,
        usedModel: currentModel,
        geometryCommand: extractGeometryCommand(replyText),
      };
    } catch (err: any) {
      lastError = err;
      const errorMsg = err?.message || String(err);
      console.warn(`Model ${currentModel} gặp lỗi: ${errorMsg}`);

      // Nếu còn model tiếp theo trong danh sách fallback
      if (i < modelsToTry.length - 1) {
        const nextModel = modelsToTry[i + 1];
        if (options.onModelFallback) {
          options.onModelFallback(currentModel, nextModel, errorMsg);
        }
      }
    }
  }

  // Nếu tất cả các model đều thất bại -> throw nguyên văn thông báo lỗi từ API
  throw new Error(
    lastError?.message ||
      '429 RESOURCE_EXHAUSTED: Tất cả các mô hình AI dự phòng đều gặp lỗi hoặc vượt quá giới hạn quota.'
  );
}
