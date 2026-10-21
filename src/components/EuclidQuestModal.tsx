import React, { useState } from 'react';
import {
  X,
  Trophy,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { GeoPoint, GeoLine, GeoCircle } from '../types/geometry';
import { dist, midpoint, triangleCircumcenter } from '../utils/geometryEngine';

export interface QuestLevel {
  id: string;
  title: string;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  targetRule: string;
  hint: string;
  initialPoints: GeoPoint[];
  initialLines?: GeoLine[];
  checkResult: (points: GeoPoint[], lines: GeoLine[], circles: GeoCircle[]) => {
    isSuccess: boolean;
    score: number;
    feedback: string;
  };
}

export const QUEST_LEVELS: QuestLevel[] = [
  {
    id: 'level_midpoint',
    title: 'Màn 1: Dựng Trung Điểm Đoạn Thẳng',
    grade: 'Toán 6',
    difficulty: 'easy',
    description: 'Cho trước đoạn thẳng AB. Em hãy tìm và dựng trung điểm M của đoạn thẳng AB.',
    targetRule: 'Dựng điểm M cách đều hai đầu mút A và B (MA = MB = AB/2).',
    hint: 'Em có thể dùng compa quay 2 cung tròn tâm A và B cùng bán kính, nối 2 giao điểm bằng thước để cắt AB tại M.',
    initialPoints: [
      { id: 'qA', name: 'A', x: 240, y: 320, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'qB', name: 'B', x: 480, y: 320, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
    ],
    initialLines: [
      { id: 'ql_AB', type: 'segment', p1Id: 'qA', p2Id: 'qB', color: '#1e293b', strokeWidth: 2.5, visible: true, showMeasure: true },
    ],
    checkResult: (points) => {
      const pA = points.find((p) => p.name === 'A' || p.id === 'qA');
      const pB = points.find((p) => p.name === 'B' || p.id === 'qB');
      if (!pA || !pB) return { isSuccess: false, score: 0, feedback: 'Không tìm thấy hai đầu mút A và B ban đầu.' };
      
      const exactMid = midpoint(pA, pB);
      // Tìm điểm thứ 3 gần exactMid nhất
      const candidate = points.find((p) => p.id !== pA.id && p.id !== pB.id && dist(p, exactMid) < 15);
      if (candidate) {
        return {
          isSuccess: true,
          score: 100,
          feedback: `Tuyệt vời! Em đã dựng chính xác trung điểm ${candidate.name} của đoạn thẳng AB!`,
        };
      }
      return {
        isSuccess: false,
        score: 40,
        feedback: 'Chưa tìm thấy trung điểm chính xác. Em hãy dựng 2 cung tròn cắt nhau để tìm giao điểm nhé!',
      };
    },
  },
  {
    id: 'level_equilateral',
    title: 'Màn 2: Dựng Tam Giác Đều Chuẩn Euclid',
    grade: 'Toán 6 - 7',
    difficulty: 'easy',
    description: 'Cho trước cạnh đáy AB dài 5cm. Em hãy dựng đỉnh C để tạo thành tam giác đều ABC.',
    targetRule: 'Điểm C phải cách A và B một khoảng đúng bằng độ dài đoạn AB.',
    hint: 'Quay đường tròn tâm A bán kính AB, và đường tròn tâm B bán kính BA. Giao điểm của chúng chính là đỉnh C!',
    initialPoints: [
      { id: 'qA', name: 'A', x: 260, y: 380, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'qB', name: 'B', x: 460, y: 380, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
    ],
    initialLines: [
      { id: 'ql_AB', type: 'segment', p1Id: 'qA', p2Id: 'qB', color: '#1e293b', strokeWidth: 2.5, visible: true, showMeasure: true },
    ],
    checkResult: (points) => {
      const pA = points.find((p) => p.name === 'A' || p.id === 'qA');
      const pB = points.find((p) => p.name === 'B' || p.id === 'qB');
      if (!pA || !pB) return { isSuccess: false, score: 0, feedback: 'Thiếu điểm A hoặc B.' };
      const targetDist = dist(pA, pB);
      
      const candidateC = points.find(
        (p) => p.id !== pA.id && p.id !== pB.id && Math.abs(dist(p, pA) - targetDist) < 15 && Math.abs(dist(p, pB) - targetDist) < 15
      );
      if (candidateC) {
        return {
          isSuccess: true,
          score: 100,
          feedback: `Chính xác 100%! Đỉnh ${candidateC.name} tạo với A và B thành tam giác đều hoàn hảo.`,
        };
      }
      return {
        isSuccess: false,
        score: 50,
        feedback: 'Điểm C chưa cách đều hai đầu mút A và B đúng bằng độ dài đoạn AB. Hãy thử lại bằng compa!',
      };
    },
  },
  {
    id: 'level_perpendicular',
    title: 'Màn 3: Dựng Đường Vuông Góc Từ Điểm Đến Đường',
    grade: 'Toán 7',
    difficulty: 'medium',
    description: 'Cho đường thẳng d (đi qua A, B) và điểm M nằm ngoài d. Hãy dựng đường vuông góc từ M xuống d.',
    targetRule: 'Dựng đường thẳng đi qua M và vuông góc 90° với đoạn thẳng AB.',
    hint: 'Quay đường tròn tâm M cắt AB tại 2 điểm P và Q. Sau đó dựng đường trung trực của đoạn PQ!',
    initialPoints: [
      { id: 'qA', name: 'A', x: 200, y: 360, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'qB', name: 'B', x: 520, y: 360, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'qM', name: 'M', x: 360, y: 200, parentType: 'free', color: '#dc2626', size: 7, visible: true, showLabel: true },
    ],
    initialLines: [
      { id: 'ql_AB', type: 'line', p1Id: 'qA', p2Id: 'qB', color: '#1e293b', strokeWidth: 2, visible: true, showMeasure: false },
    ],
    checkResult: (points, lines) => {
      const pM = points.find((p) => p.name === 'M' || p.id === 'qM');
      if (!pM) return { isSuccess: false, score: 0, feedback: 'Không tìm thấy điểm M.' };
      
      // Kiểm tra có đường thẳng nào đi qua M hoặc gần chân đường vuông góc (360, 360) không
      const foot = { x: 360, y: 360 };
      const hasFoot = points.some((p) => dist(p, foot) < 15);
      const hasPerpLine = lines.some((l) => l.type === 'perpendicular' || l.type === 'perpendicular_bisector');

      if (hasFoot || hasPerpLine) {
        return {
          isSuccess: true,
          score: 100,
          feedback: 'Xuất sắc! Em đã dựng thành công đường vuông góc hạ từ M xuống đường thẳng d.',
        };
      }
      return {
        isSuccess: false,
        score: 50,
        feedback: 'Chưa có đường vuông góc hoàn chỉnh hoặc chân đường vuông góc H(360, 360).',
      };
    },
  },
  {
    id: 'level_circumcenter',
    title: 'Màn 4: Dựng Tâm Đường Tròn Ngoại Tiếp Tam Giác',
    grade: 'Toán 7 - 9',
    difficulty: 'hard',
    description: 'Cho tam giác ABC. Em hãy dựng tâm O của đường tròn đi qua cả 3 đỉnh A, B, C.',
    targetRule: 'Tâm O là giao điểm của ít nhất 2 đường trung trực của tam giác ABC.',
    hint: 'Dựng đường trung trực của đoạn AB và đường trung trực của đoạn AC. Giao điểm của chúng là tâm O!',
    initialPoints: [
      { id: 'qA', name: 'A', x: 320, y: 180, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'qB', name: 'B', x: 200, y: 400, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'qC', name: 'C', x: 480, y: 400, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
    ],
    initialLines: [
      { id: 'ql_AB', type: 'segment', p1Id: 'qA', p2Id: 'qB', color: '#334155', strokeWidth: 2, visible: true, showMeasure: false },
      { id: 'ql_BC', type: 'segment', p1Id: 'qB', p2Id: 'qC', color: '#334155', strokeWidth: 2, visible: true, showMeasure: false },
      { id: 'ql_CA', type: 'segment', p1Id: 'qC', p2Id: 'qA', color: '#334155', strokeWidth: 2, visible: true, showMeasure: false },
    ],
    checkResult: (points, lines, circles) => {
      const pA = points.find((p) => p.name === 'A' || p.id === 'qA');
      const pB = points.find((p) => p.name === 'B' || p.id === 'qB');
      const pC = points.find((p) => p.name === 'C' || p.id === 'qC');
      if (!pA || !pB || !pC) return { isSuccess: false, score: 0, feedback: 'Thiếu đỉnh tam giác.' };
      
      const exact = triangleCircumcenter(pA, pB, pC);
      if (!exact) return { isSuccess: false, score: 0, feedback: 'Tam giác suy biến.' };

      const foundCenter = points.find((p) => dist(p, exact.center) < 18);
      const hasCircle = circles.some((c) => c.type === 'triangle_circumcircle' || (c.centerId && dist(points.find((p) => p.id === c.centerId) || { x: 0, y: 0 }, exact.center) < 18));

      if (foundCenter || hasCircle) {
        return {
          isSuccess: true,
          score: 100,
          feedback: 'Thật kỳ diệu! Em đã dựng chính xác tâm đường tròn ngoại tiếp O cách đều 3 đỉnh A, B, C.',
        };
      }
      return {
        isSuccess: false,
        score: 60,
        feedback: 'Chưa tìm thấy tâm O chính xác. Hãy dùng công cụ Đường Trung Trực để giao nhau tại tâm O!',
      };
    },
  },
];

interface EuclidQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  onStartQuest: (level: QuestLevel) => void;
}

export const EuclidQuestModal: React.FC<EuclidQuestModalProps> = ({
  isOpen,
  onClose,
  points,
  lines,
  circles,
  onStartQuest,
}) => {
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isSuccess: boolean;
    score: number;
    feedback: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentLevel = QUEST_LEVELS[activeLevelIndex];

  const handleStart = () => {
    setEvaluationResult(null);
    setShowHint(false);
    onStartQuest(currentLevel);
    onClose();
  };

  const handleCheckNow = () => {
    const result = currentLevel.checkResult(points, lines, circles);
    setEvaluationResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Đấu Trường Dựng Hình Euclid (Geometry Quest)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Gamification THCS
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vượt qua các thử thách dựng hình bằng Thước &amp; Compa, tích lũy điểm thưởng và cúp sao
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Selector Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto text-xs">
          {QUEST_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => {
                setActiveLevelIndex(idx);
                setEvaluationResult(null);
                setShowHint(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeLevelIndex === idx
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50'
              }`}
            >
              <span>Màn {idx + 1}</span>
              <span className="text-[10px] opacity-80">({lvl.grade})</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Level Info Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-slate-800/60 dark:to-slate-800/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{currentLevel.title}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold">
                  {currentLevel.grade}
                </span>
              </h3>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {currentLevel.description}
            </p>

            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Điều kiện hoàn thành:</strong> {currentLevel.targetRule}
              </div>
            </div>
          </div>

          {/* Hint Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showHint ? 'Ẩn gợi ý sư phạm của Thầy Minh' : 'Xem gợi ý sư phạm của Thầy Minh'}</span>
            </button>
            {showHint && (
              <div className="mt-2 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Thầy Minh gợi ý:</strong> {currentLevel.hint}
                </div>
              </div>
            )}
          </div>

          {/* Live Check Result Feedback */}
          {evaluationResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in ${
                evaluationResult.isSuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              {evaluationResult.isSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  <span>{evaluationResult.isSuccess ? 'Chúc mừng em! Đã Hoàn Thành Xuất Sắc!' : 'Cần cố gắng thêm một chút!'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 font-mono font-extrabold shadow-sm">
                    {evaluationResult.score} / 100 Điểm
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{evaluationResult.feedback}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCheckNow}
            className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Chấm Điểm &amp; Kiểm Tra Bài Dựng Hiện Tại</span>
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Bắt Đầu Thử Thách Màn Này</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
