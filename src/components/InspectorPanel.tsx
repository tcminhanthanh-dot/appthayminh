import React, { useState } from 'react';
import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoPolygon,
  GeoAngle,
  GeoText,
} from '../types/geometry';
import { dist, distToCm, PIXELS_PER_CM, calculatePolygonArea, angleBetween } from '../utils/geometryEngine';
import {
  Eye,
  EyeOff,
  Trash2,
  Sliders,
  Download,
  Upload,
  Info,
  Layers,
  ChevronRight,
  FileText,
  Presentation,
  Type,
  Bold,
  Italic,
} from 'lucide-react';

interface InspectorPanelProps {
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
  angles: GeoAngle[];
  texts?: GeoText[];
  selectedType: string | null;
  selectedId: string | null;
  onUpdatePointProps: (id: string, updates: Partial<GeoPoint>) => void;
  onUpdateLineProps: (id: string, updates: Partial<GeoLine>) => void;
  onUpdateCircleProps: (id: string, updates: Partial<GeoCircle>) => void;
  onUpdateAngleProps?: (id: string, updates: Partial<GeoAngle>) => void;
  onUpdateTextProps?: (id: string, updates: Partial<GeoText>) => void;
  onDeleteElement: (type: string, id: string) => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onExportWordDoc?: () => void;
  onExportSlideDeck?: () => void;
  onImportJSON: (file: File) => void;
  isToolbarVisible?: boolean;
  onClose?: () => void;
}

const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#16a34a', // Green
  '#dc2626', // Red
  '#f59e0b', // Amber
  '#9333ea', // Purple
  '#06b6d4', // Cyan
  '#475569', // Slate
  '#ec4899', // Pink
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  points,
  lines,
  circles,
  polygons,
  angles,
  texts = [],
  selectedType,
  selectedId,
  onUpdatePointProps,
  onUpdateLineProps,
  onUpdateCircleProps,
  onUpdateAngleProps,
  onUpdateTextProps,
  onDeleteElement,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onExportWordDoc,
  onExportSlideDeck,
  onImportJSON,
  isToolbarVisible = true,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'selected' | 'list' | 'export'>('selected');

  const pointMap = new Map<string, GeoPoint>();
  points.forEach((p) => pointMap.set(p.id, p));

  // Find currently selected entity
  const selectedPoint = selectedType === 'point' ? points.find((p) => p.id === selectedId) : null;
  const selectedLine = selectedType === 'line' ? lines.find((l) => l.id === selectedId) : null;
  const selectedCircle = selectedType === 'circle' ? circles.find((c) => c.id === selectedId) : null;
  const selectedPoly = selectedType === 'polygon' ? polygons.find((p) => p.id === selectedId) : null;
  const selectedAngle = selectedType === 'angle' ? angles.find((a) => a.id === selectedId) : null;
  const selectedText = selectedType === 'text' ? texts.find((t) => t.id === selectedId) : null;

  return (
    <div
      className={`absolute ${
        isToolbarVisible ? 'top-24 lg:top-16' : 'top-3'
      } right-3 bottom-3 w-84 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col z-20 overflow-hidden text-xs transition-all duration-200`}
    >
      {/* Header Tabs & Close button */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('selected')}
          className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'selected'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Thuộc Tính</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'list'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Danh Sách ({points.length + lines.length + circles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'export'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Bản</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
            title="Đóng bảng thuộc tính"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab 1: Selected Object Inspector */}
      {activeTab === 'selected' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {!selectedPoint && !selectedLine && !selectedCircle && !selectedPoly && !selectedAngle && !selectedText && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
              <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="font-medium text-slate-600 dark:text-slate-300">
                Chưa chọn đối tượng nào
              </p>
              <p className="text-[11px] mt-1">
                Nhấp vào một điểm, đoạn thẳng, góc hoặc chú thích trên hình để tinh chỉnh.
              </p>
            </div>
          )}

          {/* Point Inspector */}
          {selectedPoint && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: selectedPoint.color }}
                  />
                  Điểm {selectedPoint.name}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteElement('point', selectedPoint.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                  title="Xóa điểm này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Coordinates */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-1 font-mono text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Tọa độ X:</span>
                  <span className="font-bold">{(selectedPoint.x / PIXELS_PER_CM).toFixed(2)} cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Tọa độ Y:</span>
                  <span className="font-bold">{(-selectedPoint.y / PIXELS_PER_CM).toFixed(2)} cm</span>
                </div>
              </div>

              {/* Label Name input */}
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Tên nhãn điểm:</label>
                <input
                  type="text"
                  value={selectedPoint.name}
                  onChange={(e) => onUpdatePointProps(selectedPoint.id, { name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold font-serif text-sm bg-white dark:bg-slate-800"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-slate-500 block mb-1.5 font-semibold">Màu sắc:</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdatePointProps(selectedPoint.id, { color: c })}
                      className={`w-6 h-6 rounded-full cursor-pointer transition ${
                        selectedPoint.color === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Line Inspector */}
          {selectedLine && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {selectedLine.type === 'segment'
                    ? 'Đoạn thẳng'
                    : selectedLine.type === 'perpendicular_bisector'
                    ? 'Đường trung trực'
                    : selectedLine.type === 'perpendicular'
                    ? 'Đường vuông góc'
                    : selectedLine.type === 'parallel'
                    ? 'Đường song song'
                    : selectedLine.type === 'angle_bisector'
                    ? 'Đường phân giác'
                    : 'Đường thẳng'}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteElement('line', selectedLine.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                  title="Xóa đường này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time measurement */}
              {selectedLine.type === 'segment' && selectedLine.p2Id && (
                <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl space-y-1 font-mono text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Độ dài:</span>
                    <span className="font-bold text-sm">
                      {distToCm(
                        dist(
                          pointMap.get(selectedLine.p1Id)!,
                          pointMap.get(selectedLine.p2Id)!
                        )
                      ).toFixed(2)}{' '}
                      cm
                    </span>
                  </div>
                </div>
              )}

              {/* Equal segment ticks */}
              {selectedLine.type === 'segment' && (
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">
                    Ký hiệu đoạn bằng nhau:
                  </label>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onUpdateLineProps(selectedLine.id, { ticks: t })}
                        className={`flex-1 py-1 rounded-lg border font-mono font-bold transition cursor-pointer text-center ${
                          (selectedLine.ticks ?? 0) === t
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t === 0 ? 'Không' : t === 1 ? '|' : t === 2 ? '||' : '|||'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color picker */}
              <div>
                <label className="text-slate-500 block mb-1.5 font-semibold">Màu đường nét:</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdateLineProps(selectedLine.id, { color: c })}
                      className={`w-6 h-6 rounded-full cursor-pointer transition ${
                        selectedLine.color === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Angle Inspector */}
          {selectedAngle && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Góc ∠{pointMap.get(selectedAngle.p1Id)?.name}{pointMap.get(selectedAngle.vertexId)?.name}{pointMap.get(selectedAngle.p2Id)?.name}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteElement('angle', selectedAngle.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Degrees */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl text-amber-900 dark:text-amber-200 font-mono flex justify-between">
                <span>Số đo góc:</span>
                <span className="font-bold text-sm">
                  {angleBetween(
                    pointMap.get(selectedAngle.p1Id)!,
                    pointMap.get(selectedAngle.vertexId)!,
                    pointMap.get(selectedAngle.p2Id)!
                  ).toFixed(1)}°
                </span>
              </div>

              {/* Angle arc type */}
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Ký hiệu góc:</label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'single', label: 'Cung đơn' },
                    { id: 'double', label: 'Cung đôi' },
                    { id: 'right_angle', label: 'Góc vuông 90°' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onUpdateAngleProps && onUpdateAngleProps(selectedAngle.id, { arcType: a.id as any })}
                      className={`flex-1 py-1 rounded-lg border font-semibold text-[10px] transition cursor-pointer text-center ${
                        (selectedAngle.arcType ?? 'single') === a.id
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Text Annotation Inspector */}
          {selectedText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-blue-600" />
                  Chú Thích Chữ
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteElement('text', selectedText.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Nội dung văn bản:</label>
                <input
                  type="text"
                  value={selectedText.text}
                  onChange={(e) => onUpdateTextProps && onUpdateTextProps(selectedText.id, { text: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-serif text-sm bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateTextProps && onUpdateTextProps(selectedText.id, { isBold: !selectedText.isBold })}
                  className={`flex-1 py-1 px-2 rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
                    selectedText.isBold ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                  <span>Đậm</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateTextProps && onUpdateTextProps(selectedText.id, { isItalic: !selectedText.isItalic })}
                  className={`flex-1 py-1 px-2 rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
                    selectedText.isItalic ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                  <span>Nghiêng</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Objects List */}
      {activeTab === 'list' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Points list */}
          <div>
            <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-1.5">
              Các Điểm ({points.length})
            </div>
            <div className="space-y-1">
              {points.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-bold font-serif">{p.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({(p.x / PIXELS_PER_CM).toFixed(1)}, {(-p.y / PIXELS_PER_CM).toFixed(1)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteElement('point', p.id)}
                    className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Export & Import */}
      {activeTab === 'export' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          <div className="space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-200 block">
              Tài Liệu Giáo Dục Chuẩn THCS (Word &amp; PPT)
            </span>

            {/* Word Export */}
            <button
              type="button"
              onClick={onExportWordDoc}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold flex items-center justify-center gap-2 shadow cursor-pointer transition"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>Xuất Đề Thi / Phiếu Bài Tập Word (.doc)</span>
            </button>

            {/* Slide Export */}
            <button
              type="button"
              onClick={onExportSlideDeck}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold flex items-center justify-center gap-2 shadow cursor-pointer transition"
            >
              <Presentation className="w-4 h-4 text-amber-200" />
              <span>Xuất Bài Giảng Slide Trình Chiếu</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-200 block">
              Xuất Đồ Họa &amp; Dự Án
            </span>
            <button
              type="button"
              onClick={onExportPNG}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Ảnh PNG (Nét cao)</span>
            </button>
            <button
              type="button"
              onClick={onExportSVG}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Vector SVG (In ấn)</span>
            </button>
            <button
              type="button"
              onClick={onExportJSON}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>Lưu Tệp Dự Án (.json)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-200 block">
              Mở Tệp Dự Án Đã Lưu
            </span>
            <label className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 font-semibold flex items-center justify-center gap-2 cursor-pointer transition text-slate-600 dark:text-slate-300">
              <Upload className="w-4 h-4" />
              <span>Chọn tệp JSON...</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportJSON(file);
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
