import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, ArrowLeft, Play, Compass, Ruler, Sparkles } from 'lucide-react';
import { PresetDemo, PRESET_DEMOS } from '../utils/presets';

interface EuclidTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTutorialPreset: (preset: PresetDemo) => void;
}

interface TutorialLesson {
  id: string;
  title: string;
  grade: string;
  objective: string;
  toolSet: string;
  steps: {
    stepNumber: number;
    title: string;
    action: string;
    mathReasoning: string;
    toolIcon: 'compass' | 'ruler';
  }[];
  presetId?: string;
}

const LESSONS: TutorialLesson[] = [
  {
    id: 'perpendicular_bisector',
    title: 'Dựng Đường Trung Trực Bằng Thước & Compa',
    grade: 'Toán 6 - 7',
    objective: 'Dựng đường thẳng vuông góc với đoạn AB tại trung điểm M của nó chỉ bằng thước thẳng và compa.',
    toolSet: 'Thước thẳng (không cần vạch đo) + Compa kỹ thuật số',
    presetId: 'euclid_bisector',
    steps: [
      {
        stepNumber: 1,
        title: 'Xác định đoạn thẳng và tâm quay A',
        action: 'Đặt chân kim của Compa tại đầu mút A. Kéo giãn chân chì để bán kính R lớn hơn một nửa đoạn AB (R > AB/2).',
        mathReasoning: 'Bán kính phải lớn hơn AB/2 để hai cung tròn tâm A và tâm B chắc chắn cắt nhau tại hai điểm.',
        toolIcon: 'compass',
      },
      {
        stepNumber: 2,
        title: 'Quay cung tròn từ tâm A',
        action: 'Quay một cung tròn tâm A (hoặc đường tròn tâm A) bán kính R ở cả hai phía của đoạn thẳng AB.',
        mathReasoning: 'Mọi điểm trên cung tròn này đều cách A một khoảng bằng R.',
        toolIcon: 'compass',
      },
      {
        stepNumber: 3,
        title: 'Giữ nguyên bán kính, quay cung tròn từ tâm B',
        action: 'Di chuyển chân kim compa sang đầu mút B. Giữ nguyên bán kính R, quay cung tròn cắt cung tròn trước tại hai giao điểm P và Q.',
        mathReasoning: 'Vì PA = PB = R và QA = QB = R nên P và Q cùng cách đều hai đầu mút A và B.',
        toolIcon: 'compass',
      },
      {
        stepNumber: 4,
        title: 'Dùng thước kẻ nối hai giao điểm',
        action: 'Áp mép thước thẳng đi qua hai điểm P và Q, vẽ đường thẳng PQ. PQ chính là đường trung trực cần tìm!',
        mathReasoning: 'Theo định lý tính chất đường trung trực: Tập hợp các điểm cách đều hai đầu mút của một đoạn thẳng là đường trung trực của đoạn thẳng đó.',
        toolIcon: 'ruler',
      },
    ],
  },
  {
    id: 'angle_bisector',
    title: 'Dựng Tia Phân Giác Của Một Góc xOy',
    grade: 'Toán 7',
    objective: 'Chia góc xOy bất kỳ thành hai góc bằng nhau bằng thước và compa.',
    toolSet: 'Thước thẳng + Compa',
    steps: [
      {
        stepNumber: 1,
        title: 'Đặt compa tại đỉnh O',
        action: 'Đặt chân kim compa tại đỉnh O, mở một bán kính tùy ý r, vẽ cung tròn cắt tia Ox tại A và tia Oy tại B.',
        mathReasoning: 'Ta có OA = OB = r (hai điểm A và B cách đều đỉnh O).',
        toolIcon: 'compass',
      },
      {
        stepNumber: 2,
        title: 'Quay hai cung tròn từ A và B',
        action: 'Từ hai điểm A và B, vẽ hai cung tròn có cùng bán kính R (với R > AB/2) sao cho chúng cắt nhau tại điểm K bên trong góc.',
        mathReasoning: 'Ta có KA = KB = R.',
        toolIcon: 'compass',
      },
      {
        stepNumber: 3,
        title: 'Vẽ tia phân giác OK',
        action: 'Dùng thước thẳng vẽ tia OK từ gốc O đi qua điểm K. Tia OK chính là tia phân giác của góc xOy.',
        mathReasoning: 'Xét tam giác OAK và tam giác OBK có: OA = OB, AK = BK, OK chung => ΔOAK = ΔOBK (c.c.c) => ∠AOK = ∠BOK.',
        toolIcon: 'ruler',
      },
    ],
  },
  {
    id: 'equilateral_triangle',
    title: 'Dựng Tam Giác Đều Với Cạnh Bằng a',
    grade: 'Toán 6 - 8',
    objective: 'Dựng tam giác đều ABC khi biết trước độ dài cạnh AB.',
    toolSet: 'Thước thẳng + Compa',
    steps: [
      {
        stepNumber: 1,
        title: 'Đo độ dài cạnh bằng Compa',
        action: 'Đặt chân kim compa tại điểm A, chân chì tại điểm B (bán kính R = AB).',
        mathReasoning: 'Compa lưu trữ khoảng cách chính xác tuyệt đối mà không cần đọc số vạch.',
        toolIcon: 'compass',
      },
      {
        stepNumber: 2,
        title: 'Quay hai cung tròn tâm A và tâm B',
        action: 'Vẽ cung tròn tâm A bán kính AB, sau đó vẽ cung tròn tâm B bán kính AB. Hai cung này cắt nhau tại đỉnh C.',
        mathReasoning: 'Điểm C có AC = AB và BC = AB.',
        toolIcon: 'compass',
      },
      {
        stepNumber: 3,
        title: 'Nối các cạnh tam giác',
        action: 'Dùng thước kẻ nối đoạn AC và đoạn BC. Tam giác ABC có 3 cạnh bằng nhau AB = BC = CA.',
        mathReasoning: 'Tam giác có 3 cạnh bằng nhau là tam giác đều, mỗi góc bằng 60°.',
        toolIcon: 'ruler',
      },
    ],
  },
];

export const EuclidTutorModal: React.FC<EuclidTutorModalProps> = ({
  isOpen,
  onClose,
  onLoadTutorialPreset,
}) => {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentLesson = LESSONS[selectedLessonIndex];
  const currentStep = currentLesson.steps[currentStepIndex];

  const handleApplyToCanvas = () => {
    if (currentLesson.presetId) {
      const preset = PRESET_DEMOS.find((p) => p.id === currentLesson.presetId);
      if (preset) onLoadTutorialPreset(preset);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-blue-600/10 to-indigo-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Thầy Minh - Thực Hành Dựng Hình Thước & Compa (Euclid)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                  {currentLesson.grade}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phương pháp dựng hình cổ điển trong chương trình Toán THCS (Lớp 6 - 9)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson selector tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 overflow-x-auto bg-slate-50 dark:bg-slate-950/40">
          {LESSONS.map((lesson, idx) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => {
                setSelectedLessonIndex(idx);
                setCurrentStepIndex(0);
              }}
              className={`pb-3 px-3 text-xs font-semibold whitespace-nowrap transition border-b-2 cursor-pointer ${
                selectedLessonIndex === idx
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {lesson.title}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Objective Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Mục tiêu bài học: {currentLesson.objective}
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Công cụ yêu cầu: {currentLesson.toolSet}
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between px-2">
            {currentLesson.steps.map((st, i) => (
              <React.Fragment key={st.stepNumber}>
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                    i === currentStepIndex
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                      : i < currentStepIndex
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {i < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : st.stepNumber}
                </button>
                {i < currentLesson.steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      i < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Detail Card */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900/60 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                {currentStep.toolIcon === 'compass' ? (
                  <Compass className="w-4 h-4" />
                ) : (
                  <Ruler className="w-4 h-4" />
                )}
                Bước {currentStep.stepNumber}: {currentStep.title}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {currentStepIndex + 1} / {currentLesson.steps.length}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-xs text-slate-500 block mb-1">
                  Thao tác thực hành:
                </span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                  {currentStep.action}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60">
                <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 block mb-1">
                  Cơ sở toán học (Chứng minh):
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentStep.mathReasoning}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Bước Trước
          </button>

          <div className="flex items-center gap-2">
            {currentLesson.presetId && (
              <button
                type="button"
                onClick={handleApplyToCanvas}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-4 h-4" /> Mở Mô Phỏng Trên Bảng Vẽ
              </button>
            )}

            {currentStepIndex < currentLesson.steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                Bước Tiếp Theo <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
              >
                Hoàn Thành Bài Học
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
