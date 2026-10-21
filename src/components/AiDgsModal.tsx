import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  AlertTriangle,
  Loader2,
  KeyRound,
  Wand2,
  CheckCircle2,
  Cpu,
  RefreshCw,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { GeoPoint, GeoLine, GeoCircle } from '../types/geometry';
import {
  callGeminiWithFallback,
  getStoredApiKey,
  getStoredModel,
  GeometryCommandShape,
  extractGeometryCommand,
  THAY_MINH_SYSTEM_PROMPT,
} from '../utils/aiService';

interface AiDgsModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  onOpenSettings?: () => void;
  onApplyShape?: (shape: GeometryCommandShape) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system_alert';
  content: string;
  usedModel?: string;
  isError?: boolean;
  geometryCommand?: GeometryCommandShape | null;
}

export type AgentRole = 'builder' | 'tutor' | 'exam';

const AGENT_ROLES: { id: AgentRole; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'builder',
    label: 'Kiến Trúc Sư DGS',
    icon: <Wand2 className="w-3.5 h-3.5" />,
    desc: 'Phân tích Euclid & Tự động dựng hình lên canvas',
  },
  {
    id: 'tutor',
    label: 'Gia Sư Socratic',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    desc: 'Gợi mở tư duy, không giải hộ, hướng dẫn từng bước',
  },
  {
    id: 'exam',
    label: 'Soạn Đề & Bài Tập',
    icon: <FileText className="w-3.5 h-3.5" />,
    desc: 'Tạo đề kiểm tra 15p/1 tiết, ma trận câu hỏi và thang điểm',
  },
];

const SAMPLE_QUESTIONS_BY_ROLE: Record<AgentRole, string[]> = {
  builder: [
    'Vẽ tam giác vuông ABC vuông tại A có AB = 4cm, AC = 3cm',
    'Vẽ tam giác đều ABC và dựng đường tròn ngoại tiếp của nó',
    'Giải thuật và các bước dựng đường trung trực bằng thước và compa?',
    'Dựng tia phân giác của góc xOy bằng thước thẳng và compa',
    'Vẽ hình chữ nhật ABCD và hai đường chéo AC, BD cắt nhau tại O',
  ],
  tutor: [
    'Thầy ơi, làm sao để chứng minh tứ giác ABCD là tứ giác nội tiếp?',
    'Em chưa hiểu tại sao đường kính vuông góc với dây cung thì đi qua trung điểm?',
    'Cách nhận biết hai tam giác đồng dạng trường hợp cạnh-góc-cạnh?',
    'Làm thế nào để xác định tâm đường tròn ngoại tiếp tam giác tù?',
  ],
  exam: [
    'Soạn đề kiểm tra 15 phút về Định lý Pythagore cho học sinh Lớp 7',
    'Tạo phiếu bài tập 3 bài về Góc nội tiếp và Tiếp tuyến Lớp 9',
    'Soạn bài toán hình học thực tế (tính chiều cao cột cờ bằng bóng nắng)',
    'Thiết kế đề kiểm tra 45 phút chương Tứ giác có thang điểm 10 chi tiết',
  ],
};

function getRoleSystemInstruction(role: AgentRole): string {
  if (role === 'tutor') {
    return `${THAY_MINH_SYSTEM_PROMPT}

[CHẾ ĐỘ ĐẶC BIỆT: GIA SƯ SOCRATIC KHƠI GỢI TƯ DUY]
- Bạn là Gia Sư Socratic theo triết lý giáo dục hiện đại.
- KHÔNG BAO GIỜ giải bài trực tiếp hay đưa ngay đáp án cuối cùng cho học sinh!
- KHÔNG tạo khối \`\`\`geometry-command để vẽ hộ, trừ khi học sinh yêu cầu cụ thể.
- Thay vào đó, hãy đặt 1-2 câu hỏi gợi mở sâu sắc, hướng học sinh nhớ lại các định lý, định nghĩa hoặc tính chất hình học liên quan.
- Khích lệ học sinh tự suy nghĩ và tự đặt compa/thước để khám phá.`;
  }
  if (role === 'exam') {
    return `${THAY_MINH_SYSTEM_PROMPT}

[CHẾ ĐỘ ĐẶC BIỆT: CHUYÊN GIA KHẢO THÍ & BIÊN SOẠN ĐỀ THI HÌNH HỌC]
- Bạn là Chuyên gia Khảo thí môn Toán THCS.
- Hãy biên soạn đề kiểm tra / phiếu bài tập hình học theo ma trận chuẩn của Bộ GD&ĐT:
  + Mức 1: Nhận biết (Vẽ hình, gọi tên yếu tố).
  + Mức 2: Thông hiểu (Chứng minh tính chất cơ bản).
  + Mức 3: Vận dụng (Tính số đo, chứng minh vuông góc, đồng quy).
  + Mức 4: Vận dụng cao (Cực trị hình học, điểm cố định).
- Kèm biểu điểm chi tiết (Thang 10) và khối \`\`\`geometry-command mô phỏng hình vẽ của đề thi để dựng lên bảng.`;
  }
  return THAY_MINH_SYSTEM_PROMPT;
}

export const AiDgsModal: React.FC<AiDgsModalProps> = ({
  isOpen,
  onClose,
  points,
  lines,
  circles,
  onOpenSettings,
  onApplyShape,
}) => {
  const [agentRole, setAgentRole] = useState<AgentRole>('builder');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Chào em và quý thầy cô! Tôi là **Thầy Minh - Trợ lý Hình học AI & Dựng hình Thông minh**.

Thầy sẵn sàng đồng hành cùng bạn theo 3 chế độ chuyên biệt:
1. 🏛️ **Kiến Trúc Sư DGS:** Phân tích giải thuật Euclid, công thức tọa độ và xuất lệnh **Tự Động Vẽ Hình** lên canvas.
2. 🎓 **Gia Sư Socratic:** Khơi gợi tư duy từng bước, đặt câu hỏi gợi mở, giúp học sinh tự tìm ra cách dựng hình.
3. 📝 **Soạn Đề & Bài Tập:** Biên soạn đề kiểm tra 15p/45p chuẩn ma trận Bộ GD&ĐT kèm biểu điểm chi tiết.

Bạn có thể chuyển đổi chế độ ở thanh trên và đặt câu hỏi!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusNote, setStatusNote] = useState<string>('');
  const [appliedCommandIndex, setAppliedCommandIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isLoading) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      if (onOpenSettings) {
        onOpenSettings();
      }
      return;
    }

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStatusNote('Đang kết nối mô hình AI...');

    // Canvas elements summary
    const summary = `Hiện tại bảng vẽ có ${points.length} điểm (${points
      .map((p) => p.name)
      .join(', ') || 'trống'}), ${lines.length} đường/đoạn, ${circles.length} đường tròn.`;

    try {
      const result = await callGeminiWithFallback({
        prompt: textToSend,
        canvasSummary: summary,
        systemInstruction: getRoleSystemInstruction(agentRole),
        preferredModel: getStoredModel(),
        onModelAttempt: (modelId, attempt) => {
          setStatusNote(`Đang xử lý với model ${modelId} (Lần thử ${attempt})...`);
        },
        onModelFallback: (fromModel, toModel, errorMsg) => {
          setStatusNote(`⚠️ Model ${fromModel} gặp sự cố. Đang tự động chuyển sang model dự phòng ${toModel}...`);
          setMessages((prev) => [
            ...prev,
            {
              role: 'system_alert',
              content: `⚠️ Chuyển đổi mô hình dự phòng: Model "${fromModel}" gặp sự cố (${errorMsg}). Hệ thống tự động chuyển sang model dự phòng "${toModel}" để tiếp tục.`,
            },
          ]);
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.text,
          usedModel: result.usedModel,
          geometryCommand: result.geometryCommand,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      const verbatimError = err?.message || '429 RESOURCE_EXHAUSTED: Lỗi kết nối API Gemini';
      
      // Strict rule: Trạng thái chuyển thành "Đã dừng do lỗi", thông báo màu đỏ hiển thị nguyên văn lỗi API
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isError: true,
          content: `❌ **ĐÃ DỪNG DO LỖI API**:\n\n\`${verbatimError}\`\n\n*Gợi ý: Nếu lỗi 429 Quota Exceeded, bạn hãy bấm nút **Thiết Lập API Key** trên Header để đổi sang key Gemini khác hoặc chọn model dự phòng.*`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setStatusNote('');
    }
  };

  const handleApplyToCanvas = (cmd: GeometryCommandShape, index: number) => {
    if (onApplyShape) {
      onApplyShape(cmd);
      setAppliedCommandIndex(index);
    }
  };

  const currentPlaceholder =
    agentRole === 'builder'
      ? "Hỏi về giải thuật Euclid hoặc gõ 'Vẽ tam giác vuông ABC...' để tự động vẽ..."
      : agentRole === 'tutor'
      ? 'Hỏi Thầy Minh về phương pháp chứng minh hoặc cách bắt đầu bài toán...'
      : "Yêu cầu Thầy Minh soạn đề thi, ví dụ: 'Soạn đề 15 phút về Định lý Pythagore Lớp 7'...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Thầy Minh - Trợ Lý Hình Học AI &amp; Dựng Hình Thông Minh
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold">
                  THCS Lớp 6 - 9
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đồng hành giải toán hình, quy trình thước &amp; compa, khơi gợi tư duy Socratic và soạn đề
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-white/80 dark:bg-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1.5 transition cursor-pointer"
                title="Thay đổi Model AI hoặc API Key"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thiết lập Model / Key</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Agent Role Selector Bar */}
        <div className="px-6 py-2 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Chế độ AI:</span>
            {AGENT_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setAgentRole(role.id)}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  agentRole === role.id
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                title={role.desc}
              >
                {role.icon}
                <span>{role.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline italic truncate max-w-sm">
            {AGENT_ROLES.find((r) => r.id === agentRole)?.desc}
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
          {messages.map((msg, index) => {
            if (msg.role === 'system_alert') {
              return (
                <div
                  key={index}
                  className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2 font-mono"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{msg.content}</span>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : msg.isError
                      ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500/80 text-red-900 dark:text-red-200 rounded-tl-none shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Model badge */}
                  {msg.usedModel && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold mb-1">
                      <Cpu className="w-3 h-3" />
                      <span>Được phản hồi bởi: {msg.usedModel}</span>
                    </div>
                  )}

                  {/* Message body */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Interactive Button to auto-draw if AI returned geometry-command */}
                  {msg.geometryCommand && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleApplyToCanvas(msg.geometryCommand!, index)}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                          appliedCommandIndex === index
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                        }`}
                      >
                        {appliedCommandIndex === index ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đã Dựng Hình Lên Bảng Vẽ Thành Công!</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 animate-bounce" />
                            <span>✨ Dựng Hình Này Lên Bảng Vẽ (Thầy Minh Vẽ Hộ)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{statusNote || 'Thầy Minh đang phân tích giải thuật và cấu trúc hình vẽ...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px]">
          <span className="font-bold text-slate-400 shrink-0 py-1">Gợi ý ({AGENT_ROLES.find(r => r.id === agentRole)?.label}):</span>
          {(SAMPLE_QUESTIONS_BY_ROLE[agentRole] || []).map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={currentPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          />
          <button
            type="button"
            disabled={!input.trim() || isLoading}
            onClick={() => handleSend()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Gửi</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
