import React, { useState } from 'react';
import {
  ToolMode,
  RulerInstrument,
  CompassInstrument,
  ProtractorInstrument,
  SetSquareInstrument,
  CanvasTheme,
} from '../types/geometry';
import {
  MousePointer,
  Hand,
  Trash2,
  Dot,
  Minus,
  Spline,
  Circle,
  Triangle,
  RotateCcw,
  RotateCw,
  Grid,
  Magnet,
  Maximize2,
  Sparkles,
  GraduationCap,
  Layers,
  BookOpen,
  ChevronDown,
  Compass as CompassIcon,
  Ruler as RulerIcon,
  KeyRound,
  Square,
  Crosshair,
  Type,
  Palette,
  Trophy,
  Eye,
  EyeOff,
  ChevronUp,
} from 'lucide-react';
import { PRESET_DEMOS, PresetDemo } from '../utils/presets';

interface ToolbarProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  theme: CanvasTheme;
  setTheme: React.Dispatch<React.SetStateAction<CanvasTheme>>;
  showGrid: boolean;
  setShowGrid: (v: boolean | ((prev: boolean) => boolean)) => void;
  snapToGrid: boolean;
  setSnapToGrid: (v: boolean | ((prev: boolean) => boolean)) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onResetView: () => void;
  ruler: RulerInstrument;
  setRuler: React.Dispatch<React.SetStateAction<RulerInstrument>>;
  compass: CompassInstrument;
  setCompass: React.Dispatch<React.SetStateAction<CompassInstrument>>;
  protractor: ProtractorInstrument;
  setProtractor: React.Dispatch<React.SetStateAction<ProtractorInstrument>>;
  setSquare: SetSquareInstrument;
  setSetSquare: React.Dispatch<React.SetStateAction<SetSquareInstrument>>;
  onLoadPreset: (preset: PresetDemo) => void;
  onOpenEuclidTutor: () => void;
  onOpenAiDgsModal: () => void;
  onOpenQuestModal: () => void;
  onOpenApiKeySettings: () => void;
  onQuickPolygonPreset?: (type: 'equilateral_triangle' | 'right_triangle' | 'rectangle' | 'square') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  isToolbarVisible: boolean;
  setIsToolbarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  setToolMode,
  theme,
  setTheme,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onResetView,
  ruler,
  setRuler,
  compass,
  setCompass,
  protractor,
  setProtractor,
  setSquare,
  setSetSquare,
  onLoadPreset,
  onOpenEuclidTutor,
  onOpenAiDgsModal,
  onOpenQuestModal,
  onOpenApiKeySettings,
  onQuickPolygonPreset,
  isSidebarOpen,
  setIsSidebarOpen,
  isToolbarVisible,
  setIsToolbarVisible,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  if (!isToolbarVisible) {
    return (
      <div className="absolute top-3 left-3 z-30 pointer-events-auto flex items-center gap-2 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => setIsToolbarVisible(true)}
          className="px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-blue-500/40 text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 transition flex items-center gap-2 cursor-pointer group"
          title="Hiện lại thanh công cụ vẽ (Phím tắt: Ctrl + H)"
        >
          <Eye className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>Hiện Thanh Công Cụ</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono">
            Ctrl+H
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsSidebarOpen((v) => !v)}
          className={`px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            isSidebarOpen ? 'text-blue-600 border-blue-500/50' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
          title={isSidebarOpen ? 'Ẩn bảng thuộc tính bên phải' : 'Hiện bảng thuộc tính bên phải'}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">{isSidebarOpen ? 'Ẩn Bảng Phải' : 'Hiện Bảng Phải'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* Pod 1: App Brand Logo & Name + Quick Collapse */}
      <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 gap-2 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              Thầy Minh - vẽ hình
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              THCS
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap hidden sm:inline">
            Hình Học Động &amp; Thước Compa
          </span>
        </div>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Nút Ẩn Thanh Công Cụ ngay ở Brand Pod */}
        <button
          type="button"
          onClick={() => setIsToolbarVisible(false)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer flex items-center gap-1"
          title="Ẩn thanh công cụ (Phím tắt: Ctrl + H)"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-[11px] font-semibold hidden md:inline">Ẩn</span>
        </button>
      </div>

      {/* Pod 2: Geometric Drawing Tools */}
      <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-1.5 gap-1">
        {/* Pointer / Move */}
        <button
          type="button"
          onClick={() => {
            setToolMode('select');
            setOpenDropdown(null);
          }}
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
            toolMode === 'select'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Chọn và Di chuyển điểm (Select / Drag)"
        >
          <MousePointer className="w-4 h-4" />
          <span className="hidden sm:inline">Chọn</span>
        </button>

        {/* Pan Canvas */}
        <button
          type="button"
          onClick={() => {
            setToolMode('pan');
            setOpenDropdown(null);
          }}
          className={`p-1.5 rounded-xl flex items-center text-xs font-semibold transition cursor-pointer ${
            toolMode === 'pan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Kéo di chuyển bảng vẽ (Pan)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Points Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('points')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
              ['point', 'midpoint', 'intersection'].includes(toolMode)
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Dot className="w-5 h-5 -mx-1 text-blue-600" />
            <span>Điểm</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'points' && (
            <div className="absolute top-full mt-1.5 left-0 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setToolMode('point');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Điểm tự do
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('midpoint');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Trung điểm 2 điểm
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('intersection');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 text-purple-600" />
                Giao điểm 2 đối tượng
              </button>
            </div>
          )}
        </div>

        {/* Lines & Bisectors Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('lines')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
              ['segment', 'line', 'ray', 'perpendicular_bisector', 'angle_bisector', 'perpendicular', 'parallel'].includes(toolMode)
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Minus className="w-4 h-4 text-indigo-600" />
            <span>Đường</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'lines' && (
            <div className="absolute top-full mt-1.5 left-0 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setToolMode('segment');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <Minus className="w-4 h-4 text-blue-600" />
                Đoạn thẳng (Segment)
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('line');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <Minus className="w-4 h-4 text-slate-500" />
                Đường thẳng kéo dài
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('ray');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <Minus className="w-4 h-4 text-amber-500" />
                Tia (Ray)
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setToolMode('perpendicular_bisector');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <div className="w-2 h-2 border-l border-b border-red-500" />
                Đường Trung Trực (Động)
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('angle_bisector');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Spline className="w-4 h-4 text-purple-600" />
                Đường Phân Giác (3 điểm)
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('perpendicular');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <div className="w-3.5 h-3.5 border-l-2 border-b-2 border-indigo-600" />
                Đường Vuông Góc (Điểm &amp; Phương)
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('parallel');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-3.5 h-0.5 bg-emerald-600" />
                  <div className="w-3.5 h-0.5 bg-emerald-600" />
                </div>
                Đường Song Song (Điểm &amp; Phương)
              </button>
            </div>
          )}
        </div>

        {/* Circles Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('circles')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
              ['circle_center_point', 'triangle_circumcircle', 'triangle_incircle'].includes(toolMode)
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Circle className="w-4 h-4 text-cyan-600" />
            <span>Đường Tròn</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'circles' && (
            <div className="absolute top-full mt-1.5 left-0 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setToolMode('circle_center_point');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <Circle className="w-4 h-4 text-cyan-600" />
                Đường tròn (Tâm &amp; Điểm)
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('triangle_circumcircle');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Circle className="w-4 h-4 text-emerald-600 stroke-dashed" />
                Đường tròn ngoại tiếp tam giác
              </button>
              <button
                type="button"
                onClick={() => {
                  setToolMode('triangle_incircle');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Circle className="w-4 h-4 text-purple-600" />
                Đường tròn nội tiếp tam giác
              </button>
            </div>
          )}
        </div>

        {/* Polygons Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('polygons')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
              toolMode === 'polygon'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Triangle className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Đa Giác</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'polygons' && (
            <div className="absolute top-full mt-1.5 left-0 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setToolMode('polygon');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Triangle className="w-4 h-4 text-emerald-600" />
                Vẽ Đa Giác Tự Do (Nối điểm)
              </button>

              {onQuickPolygonPreset && (
                <>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Dựng nhanh hình học:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickPolygonPreset('equilateral_triangle');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span>🔺 Tam giác đều</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickPolygonPreset('right_triangle');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span>📐 Tam giác vuông</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickPolygonPreset('rectangle');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hình chữ nhật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickPolygonPreset('square');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hình vuông</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Angle Measurement */}
        <button
          type="button"
          onClick={() => {
            setToolMode('measure_angle');
            setOpenDropdown(null);
          }}
          className={`px-2 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
            toolMode === 'measure_angle'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Đo số đo góc giữa 3 điểm"
        >
          <span className="font-serif italic font-bold">∠</span>
          <span className="hidden md:inline">Đo Góc</span>
        </button>

        {/* Text Annotation Tool */}
        <button
          type="button"
          onClick={() => {
            setToolMode('text');
            setOpenDropdown(null);
          }}
          className={`px-2 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
            toolMode === 'text'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Thêm Chữ / Chú Thích Hình Học"
        >
          <Type className="w-4 h-4 text-blue-600" />
          <span className="hidden md:inline">Chữ</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Digital Instruments (Thước, Compa, Đo độ, Ê-ke) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('instruments')}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/50 hover:bg-amber-100"
            title="Bộ dụng cụ vẽ kỹ thuật số thực tế"
          >
            <CompassIcon className="w-4 h-4 text-amber-600" />
            <span>Dụng Cụ</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'instruments' && (
            <div className="absolute top-full mt-1.5 left-0 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRuler((r) => ({ ...r, active: !r.active }));
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  ruler.active
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RulerIcon className="w-4 h-4 text-amber-600" />
                  <span>Thước kẻ Milimet</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {ruler.active ? 'Đang bật' : 'Bật'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompass((c) => ({ ...c, active: !c.active }));
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  compass.active
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CompassIcon className="w-4 h-4 text-cyan-600" />
                  <span>Compa kỹ thuật số</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {compass.active ? 'Đang bật' : 'Bật'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProtractor((p) => ({ ...p, active: !p.active }));
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  protractor.active
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600 font-bold">180°</span>
                  <span>Thước đo độ 180°</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {protractor.active ? 'Đang bật' : 'Bật'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSetSquare((s) => ({ ...s, active: !s.active }));
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  setSquare.active
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-l-2 border-b-2 border-emerald-600" />
                  <span>Ê-ke vuông 90°</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {setSquare.active ? 'Đang bật' : 'Bật'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Delete Mode */}
        <button
          type="button"
          onClick={() => {
            setToolMode('delete');
            setOpenDropdown(null);
          }}
          className={`p-1.5 rounded-xl flex items-center text-xs font-semibold transition cursor-pointer ${
            toolMode === 'delete'
              ? 'bg-red-600 text-white shadow-sm'
              : 'hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600'
          }`}
          title="Xóa đối tượng (Click vào đối tượng để xóa)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Pod 3: Gamification, Themes, API Settings, AI, Presets */}
      <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-1.5 gap-1.5">
        {/* Nút Đấu Trường Dựng Hình Euclid (Gamification Quest) */}
        <button
          type="button"
          onClick={onOpenQuestModal}
          className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-300 dark:border-amber-800 hover:border-amber-500 text-amber-800 dark:text-amber-200 text-xs font-bold transition cursor-pointer shadow-sm"
          title="Đấu Trường Dựng Hình Euclid (Học mà chơi - Có chấm điểm)"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="hidden sm:inline">Thử Thách Euclid</span>
        </button>

        {/* Theme Selector (Bảng đen phấn trắng / Blueprint / Sáng) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('themes')}
            className="p-1.5 rounded-xl transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            title="Chế độ giao diện (Bảng đen phấn trắng / Bản vẽ kỹ thuật)"
          >
            <Palette className="w-4 h-4 text-emerald-600" />
          </button>

          {openDropdown === 'themes' && (
            <div className="absolute top-full mt-1.5 right-0 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  theme === 'light' ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-slate-50'
                }`}
              >
                <span>☀️ Sáng tiêu chuẩn</span>
                {theme === 'light' && <span className="w-2 h-2 rounded-full bg-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('chalkboard');
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  theme === 'chalkboard' ? 'bg-emerald-50 font-bold text-emerald-800' : 'hover:bg-slate-50'
                }`}
              >
                <span>📗 Bảng đen phấn trắng</span>
                {theme === 'chalkboard' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('blueprint');
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                  theme === 'blueprint' ? 'bg-sky-50 font-bold text-sky-800' : 'hover:bg-slate-50'
                }`}
              >
                <span>📐 Bản vẽ kỹ thuật</span>
                {theme === 'blueprint' && <span className="w-2 h-2 rounded-full bg-sky-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Nút Settings (API Key) kèm dòng chữ đỏ "Lấy API key để sử dụng app" theo AI_INSTRUCTIONS */}
        <button
          type="button"
          onClick={onOpenApiKeySettings}
          className="px-2.5 py-1.5 rounded-xl flex items-center gap-2 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 dark:from-red-950/40 dark:via-amber-950/40 dark:to-orange-950/40 border border-red-300 dark:border-red-800 hover:border-red-500 transition cursor-pointer shadow-sm group"
          title="Thiết lập API Key Gemini và Chọn Mô Hình AI"
        >
          <div className="p-1 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 group-hover:rotate-12 transition-transform">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-none">
              Settings (API Key)
            </span>
            <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 animate-pulse leading-tight mt-0.5">
              Lấy API key để sử dụng app
            </span>
          </div>
        </button>

        {/* Presets Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('presets')}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Các bài toán & định lý mẫu THCS Lớp 6 - 9"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="hidden lg:inline">Bài Học Mẫu</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'presets' && (
            <div className="absolute top-full mt-1.5 right-0 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Mô Phỏng Định Lý (THCS Lớp 6-9)
              </div>
              {PRESET_DEMOS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => {
                    onLoadPreset(demo);
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {demo.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 font-medium">
                      {demo.grade}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {demo.subtitle}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Euclid Construction Tutor */}
        <button
          type="button"
          onClick={onOpenEuclidTutor}
          className="px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer border border-emerald-300/40"
          title="Quy trình dựng hình Thước & Compa chuẩn Euclid"
        >
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span className="hidden xl:inline">Dựng Hình Euclid</span>
        </button>

        {/* AI Thầy Minh Consultation */}
        <button
          type="button"
          onClick={onOpenAiDgsModal}
          className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md transition cursor-pointer"
          title="Trợ lý AI Thầy Minh - Dựng hình thông minh"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Thầy Minh AI</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Grid & Snapping Toggles */}
        <button
          type="button"
          onClick={() => setShowGrid((g) => !g)}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            showGrid ? 'bg-slate-200 dark:bg-slate-800 text-blue-600' : 'text-slate-400 hover:bg-slate-100'
          }`}
          title="Bật/Tắt Lưới tọa độ"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setSnapToGrid((s) => !s)}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            snapToGrid ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'text-slate-400 hover:bg-slate-100'
          }`}
          title="Bắt điểm vào Lưới (Grid Snapping)"
        >
          <Magnet className="w-4 h-4" />
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          title="Hoàn tác (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          title="Làm lại (Ctrl+Y)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Reset View */}
        <button
          type="button"
          onClick={onResetView}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Đặt lại góc nhìn (Reset View 100%)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Toggle Inspector Sidebar */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen((v) => !v)}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            isSidebarOpen ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Ẩn/Hiện Bảng Thuộc Tính Bên Phải"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Nút Ẩn Thanh Công Cụ (Hide Toolbar) */}
        <button
          type="button"
          onClick={() => setIsToolbarVisible(false)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          title="Ẩn toàn bộ thanh công cụ trên (Ctrl+H)"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
