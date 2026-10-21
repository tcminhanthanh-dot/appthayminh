import React, { useRef, useState } from 'react';
import {
  RulerInstrument,
  CompassInstrument,
  ProtractorInstrument,
  SetSquareInstrument,
  Vector2D,
  GeoPoint,
} from '../types/geometry';
import { PIXELS_PER_CM } from '../utils/geometryEngine';
import { RotateCw, Magnet, Pencil, X, Check, Compass as CompassIcon } from 'lucide-react';

interface InstrumentsOverlayProps {
  ruler: RulerInstrument;
  setRuler: React.Dispatch<React.SetStateAction<RulerInstrument>>;
  compass: CompassInstrument;
  setCompass: React.Dispatch<React.SetStateAction<CompassInstrument>>;
  protractor: ProtractorInstrument;
  setProtractor: React.Dispatch<React.SetStateAction<ProtractorInstrument>>;
  setSquare: SetSquareInstrument;
  setSetSquare: React.Dispatch<React.SetStateAction<SetSquareInstrument>>;
  points: GeoPoint[];
  onDrawRulerLine: (start: Vector2D, end: Vector2D) => void;
  onDrawCompassCircle: (center: Vector2D, radius: number) => void;
}

export const InstrumentsOverlay: React.FC<InstrumentsOverlayProps> = ({
  ruler,
  setRuler,
  compass,
  setCompass,
  protractor,
  setProtractor,
  setSquare,
  setSetSquare,
  points,
  onDrawRulerLine,
  onDrawCompassCircle,
}) => {
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initX: number; initY: number; initAngle: number }>({
    x: 0,
    y: 0,
    initX: 0,
    initY: 0,
    initAngle: 0,
  });

  // Handle pointer dragging for instruments
  const handlePointerDown = (
    e: React.PointerEvent,
    instrument: 'ruler' | 'ruler_rot' | 'compass_needle' | 'compass_pencil' | 'compass_top' | 'protractor' | 'protractor_rot' | 'setsquare' | 'setsquare_rot'
  ) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDrag(instrument);

    let initX = 0;
    let initY = 0;
    let initAngle = 0;

    if (instrument.startsWith('ruler')) {
      initX = ruler.x;
      initY = ruler.y;
      initAngle = ruler.angle;
    } else if (instrument === 'compass_needle') {
      initX = compass.needlePos.x;
      initY = compass.needlePos.y;
    } else if (instrument === 'compass_pencil') {
      initX = compass.needlePos.x + Math.cos(compass.pencilAngle) * compass.radius;
      initY = compass.needlePos.y + Math.sin(compass.pencilAngle) * compass.radius;
    } else if (instrument === 'compass_top') {
      initAngle = compass.pencilAngle;
    } else if (instrument.startsWith('protractor')) {
      initX = protractor.x;
      initY = protractor.y;
      initAngle = protractor.angle;
    } else if (instrument.startsWith('setsquare')) {
      initX = setSquare.x;
      initY = setSquare.y;
      initAngle = setSquare.angle;
    }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initX,
      initY,
      initAngle,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (activeDrag === 'ruler') {
      setRuler((prev) => ({
        ...prev,
        x: dragStartRef.current.initX + dx,
        y: dragStartRef.current.initY + dy,
      }));
    } else if (activeDrag === 'ruler_rot') {
      // Rotate ruler based on angle from ruler center
      const currentAngle =
        (Math.atan2(e.clientY - ruler.y, e.clientX - ruler.x) * 180) / Math.PI;
      setRuler((prev) => ({ ...prev, angle: Math.round(currentAngle) }));
    } else if (activeDrag === 'compass_needle') {
      setCompass((prev) => ({
        ...prev,
        needlePos: {
          x: dragStartRef.current.initX + dx,
          y: dragStartRef.current.initY + dy,
        },
      }));
    } else if (activeDrag === 'compass_pencil') {
      // Adjust radius & pencil angle from needle
      const curX = dragStartRef.current.initX + dx;
      const curY = dragStartRef.current.initY + dy;
      const newRadius = Math.max(
        20,
        Math.hypot(curX - compass.needlePos.x, curY - compass.needlePos.y)
      );
      const newAngle = Math.atan2(curY - compass.needlePos.y, curX - compass.needlePos.x);
      setCompass((prev) => ({
        ...prev,
        radius: Math.round(newRadius),
        pencilAngle: newAngle,
      }));
    } else if (activeDrag === 'compass_top') {
      // Rotate entire compass around needle
      const angle = Math.atan2(e.clientY - compass.needlePos.y, e.clientX - compass.needlePos.x);
      setCompass((prev) => ({ ...prev, pencilAngle: angle }));
    } else if (activeDrag === 'protractor') {
      setProtractor((prev) => ({
        ...prev,
        x: dragStartRef.current.initX + dx,
        y: dragStartRef.current.initY + dy,
      }));
    } else if (activeDrag === 'protractor_rot') {
      const angle =
        (Math.atan2(e.clientY - protractor.y, e.clientX - protractor.x) * 180) / Math.PI;
      setProtractor((prev) => ({ ...prev, angle: Math.round(angle) }));
    } else if (activeDrag === 'setsquare') {
      setSetSquare((prev) => ({
        ...prev,
        x: dragStartRef.current.initX + dx,
        y: dragStartRef.current.initY + dy,
      }));
    } else if (activeDrag === 'setsquare_rot') {
      const angle =
        (Math.atan2(e.clientY - setSquare.y, e.clientX - setSquare.x) * 180) / Math.PI;
      setSetSquare((prev) => ({ ...prev, angle: Math.round(angle) }));
    }
  };

  const handlePointerUp = () => {
    setActiveDrag(null);
  };

  // Ruler: Snap to nearest 2 points
  const handleRulerSnapToPoints = () => {
    if (points.length < 2) return;
    // Find closest 2 points
    let p1 = points[0];
    let p2 = points[1];
    let minDist = Infinity;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y);
        const centerMid = { x: (points[i].x + points[j].x) / 2, y: (points[i].y + points[j].y) / 2 };
        const dRuler = Math.hypot(centerMid.x - ruler.x, centerMid.y - ruler.y);
        if (dRuler < minDist) {
          minDist = dRuler;
          p1 = points[i];
          p2 = points[j];
        }
      }
    }

    const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    setRuler((prev) => ({
      ...prev,
      x: p1.x,
      y: p1.y,
      angle: Math.round(angle),
    }));
  };

  // Draw line along ruler
  const handleDrawAlongRuler = () => {
    const rad = (ruler.angle * Math.PI) / 180;
    const start = { x: ruler.x, y: ruler.y };
    const end = {
      x: ruler.x + Math.cos(rad) * ruler.lengthPx,
      y: ruler.y + Math.sin(rad) * ruler.lengthPx,
    };
    onDrawRulerLine(start, end);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 1. DIGITAL RULER (THƯỚC KẺ MILIMET) */}
      {ruler.active && (
        <div
          className="absolute pointer-events-auto cursor-move drop-shadow-xl"
          style={{
            transform: `translate(${ruler.x}px, ${ruler.y}px) rotate(${ruler.angle}deg)`,
            transformOrigin: '0px 0px',
            width: `${ruler.lengthPx}px`,
            height: '64px',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'ruler')}
        >
          {/* Ruler Body (Realistic Frosted Acrylic Yellow-amber) */}
          <div className="w-full h-full rounded-md border-2 border-amber-500/70 bg-gradient-to-b from-amber-100/90 via-amber-50/90 to-amber-200/90 backdrop-blur-md shadow-2xl relative flex flex-col justify-between overflow-hidden">
            {/* Top Millimeter Scale */}
            <div className="w-full h-7 border-b border-amber-300/60 relative">
              {Array.from({ length: Math.floor(ruler.lengthPx / 4) + 1 }).map((_, i) => {
                const isCm = i % 10 === 0;
                const isHalfCm = i % 5 === 0 && !isCm;
                const height = isCm ? '22px' : isHalfCm ? '14px' : '8px';
                return (
                  <div
                    key={i}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${i * 4}px` }}
                  >
                    <div
                      className={`w-[1px] ${
                        isCm
                          ? 'bg-amber-950 font-bold'
                          : isHalfCm
                          ? 'bg-amber-900'
                          : 'bg-amber-800/60'
                      }`}
                      style={{ height }}
                    />
                    {isCm && (
                      <span className="text-[10px] font-bold text-amber-950 -mt-0.5 select-none font-mono">
                        {i / 10}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ruler Center Branding & Info */}
            <div className="px-3 flex items-center justify-between text-amber-900/80 text-xs font-semibold">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                📐 Thước Kẻ Thầy Minh (1cm = {PIXELS_PER_CM}px)
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[11px] font-mono text-amber-950 border border-amber-400/50">
                  {ruler.angle}°
                </span>
                <button
                  type="button"
                  title="Áp sát vào 2 điểm gần nhất"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRulerSnapToPoints();
                  }}
                  className="p-1 rounded bg-amber-300/80 hover:bg-amber-400 text-amber-950 transition cursor-pointer"
                >
                  <Magnet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vẽ đoạn thẳng theo mép thước"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrawAlongRuler();
                  }}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow"
                >
                  <Pencil className="w-3 h-3" /> Vẽ
                </button>
                <button
                  type="button"
                  title="Đóng thước kẻ"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRuler((r) => ({ ...r, active: false }));
                  }}
                  className="p-1 rounded hover:bg-red-200 text-red-700 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom millimeter guide */}
            <div className="h-1 bg-amber-400/40 w-full" />
          </div>

          {/* Rotation Handle on the right */}
          <div
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center cursor-ew-resize border-2 border-white pointer-events-auto"
            title="Kéo để xoay thước kẻ"
            onPointerDown={(e) => handlePointerDown(e, 'ruler_rot')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. DIGITAL COMPASS (COMPA KỸ THUẬT SỐ) */}
      {compass.active && (
        <div className="absolute pointer-events-auto">
          {/* Compass SVG Visualization */}
          <svg
            className="overflow-visible pointer-events-none"
            style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1 }}
          >
            {/* Compass Pencil Circle preview */}
            <circle
              cx={compass.needlePos.x}
              cy={compass.needlePos.y}
              r={compass.radius}
              fill="rgba(59, 130, 246, 0.05)"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />

            {/* Leg from hinge to needle */}
            <line
              x1={compass.needlePos.x}
              y1={compass.needlePos.y - 70}
              x2={compass.needlePos.x}
              y2={compass.needlePos.y}
              stroke="#475569"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Leg from hinge to pencil */}
            <line
              x1={compass.needlePos.x}
              y1={compass.needlePos.y - 70}
              x2={compass.needlePos.x + Math.cos(compass.pencilAngle) * compass.radius}
              y2={compass.needlePos.y + Math.sin(compass.pencilAngle) * compass.radius}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* Needle Pin Handle (Center) */}
          <div
            className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center cursor-move pointer-events-auto group z-20"
            style={{ left: compass.needlePos.x, top: compass.needlePos.y }}
            onPointerDown={(e) => handlePointerDown(e, 'compass_needle')}
            title="Chân kim Compa (Tâm đường tròn) - Kéo để di chuyển"
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="absolute top-8 bg-slate-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
              Tâm ({Math.round(compass.needlePos.x)}, {Math.round(compass.needlePos.y)})
            </div>
          </div>

          {/* Pencil Pin Handle (Radius adjuster & rotator) */}
          <div
            className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center cursor-crosshair pointer-events-auto z-20 group"
            style={{
              left: compass.needlePos.x + Math.cos(compass.pencilAngle) * compass.radius,
              top: compass.needlePos.y + Math.sin(compass.pencilAngle) * compass.radius,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'compass_pencil')}
            title="Đầu chì Compa - Kéo để thay đổi bán kính hoặc xoay"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
            <div className="absolute top-8 bg-blue-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
              R = {(compass.radius / PIXELS_PER_CM).toFixed(1)} cm ({compass.radius}px)
            </div>
          </div>

          {/* Compass Top Hinge & Control Panel */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
            style={{ left: compass.needlePos.x, top: compass.needlePos.y - 70 }}
          >
            <div
              className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-300 shadow-xl flex items-center justify-center cursor-grab"
              onPointerDown={(e) => handlePointerDown(e, 'compass_top')}
              title="Núm xoay Compa"
            >
              <CompassIcon className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Quick Action Floating Bar */}
            <div className="mt-2 -translate-x-1/2 left-1/2 relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                R: {(compass.radius / PIXELS_PER_CM).toFixed(1)} cm
              </span>
              <button
                type="button"
                onClick={() => onDrawCompassCircle(compass.needlePos, compass.radius)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Vẽ Đường Tròn
              </button>
              <button
                type="button"
                onClick={() => setCompass((c) => ({ ...c, active: false }))}
                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 transition cursor-pointer"
                title="Đóng compa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DIGITAL PROTRACTOR (THƯỚC ĐO ĐỘ 180°) */}
      {protractor.active && (
        <div
          className="absolute pointer-events-auto cursor-move drop-shadow-2xl"
          style={{
            transform: `translate(${protractor.x}px, ${protractor.y}px) rotate(${protractor.angle}deg)`,
            transformOrigin: '0px 0px',
            width: `${protractor.radius * 2}px`,
            height: `${protractor.radius + 15}px`,
            left: `-${protractor.radius}px`,
            top: `-${protractor.radius}px`,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'protractor')}
        >
          {/* Semicircle Protractor Graphic */}
          <svg
            viewBox={`0 0 ${protractor.radius * 2} ${protractor.radius + 20}`}
            className="w-full h-full select-none"
          >
            <defs>
              <linearGradient id="protractorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(240, 249, 255, 0.85)" />
                <stop offset="100%" stopColor="rgba(219, 234, 254, 0.9)" />
              </linearGradient>
            </defs>

            {/* Main Semicircle */}
            <path
              d={`M 10 ${protractor.radius + 10} A ${protractor.radius - 10} ${
                protractor.radius - 10
              } 0 0 1 ${protractor.radius * 2 - 10} ${protractor.radius + 10} Z`}
              fill="url(#protractorGrad)"
              stroke="#2563eb"
              strokeWidth="2"
              className="drop-shadow-md"
            />

            {/* Inner cutout */}
            <path
              d={`M ${protractor.radius * 0.4} ${protractor.radius + 10} A ${
                protractor.radius * 0.6
              } ${protractor.radius * 0.6} 0 0 1 ${protractor.radius * 1.6} ${
                protractor.radius + 10
              } Z`}
              fill="rgba(255, 255, 255, 0.7)"
              stroke="#93c5fd"
              strokeWidth="1"
            />

            {/* Degree ticks (0° to 180°) */}
            {Array.from({ length: 181 }).map((_, deg) => {
              if (deg % 5 !== 0 && deg % 1 !== 0) return null;
              const isTen = deg % 10 === 0;
              const isFive = deg % 5 === 0 && !isTen;
              const tickLen = isTen ? 14 : isFive ? 8 : 4;
              const rad = ((180 - deg) * Math.PI) / 180;
              const rOuter = protractor.radius - 10;
              const rInner = rOuter - tickLen;

              const x1 = protractor.radius + Math.cos(rad) * rOuter;
              const y1 = protractor.radius + 10 - Math.sin(rad) * rOuter;
              const x2 = protractor.radius + Math.cos(rad) * rInner;
              const y2 = protractor.radius + 10 - Math.sin(rad) * rInner;

              return (
                <g key={deg}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isTen ? '#1e3a8a' : isFive ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isTen ? 1.5 : 1}
                  />
                  {isTen && (
                    <text
                      x={protractor.radius + Math.cos(rad) * (rInner - 8)}
                      y={protractor.radius + 10 - Math.sin(rad) * (rInner - 8)}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#1e293b"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="monospace"
                    >
                      {deg}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center Origin Crosshair */}
            <circle
              cx={protractor.radius}
              cy={protractor.radius + 10}
              r="4"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <line
              x1={protractor.radius - 12}
              y1={protractor.radius + 10}
              x2={protractor.radius + 12}
              y2={protractor.radius + 10}
              stroke="#ef4444"
              strokeWidth="1"
            />
            <line
              x1={protractor.radius}
              y1={protractor.radius - 2}
              x2={protractor.radius}
              y2={protractor.radius + 22}
              stroke="#ef4444"
              strokeWidth="1"
            />
          </svg>

          {/* Protractor Rotate Handle */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center cursor-pointer pointer-events-auto border-2 border-white"
            title="Xoay thước đo độ"
            onPointerDown={(e) => handlePointerDown(e, 'protractor_rot')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProtractor((p) => ({ ...p, active: false }));
            }}
            className="absolute top-4 right-8 p-1 rounded-full bg-white/90 hover:bg-red-100 text-red-600 shadow border border-slate-200 pointer-events-auto cursor-pointer"
            title="Đóng thước đo độ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. DIGITAL SET SQUARE (Ê-KE VUÔNG GÓC 90°) */}
      {setSquare.active && (
        <div
          className="absolute pointer-events-auto cursor-move drop-shadow-2xl"
          style={{
            transform: `translate(${setSquare.x}px, ${setSquare.y}px) rotate(${setSquare.angle}deg)`,
            transformOrigin: '0px 0px',
            width: '280px',
            height: '280px',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'setsquare')}
        >
          <svg viewBox="0 0 280 280" className="w-full h-full select-none">
            {/* Triangular Acrylic Body with 90 deg corner at (10, 270) */}
            <polygon
              points="10,270 270,270 10,10"
              fill="rgba(236, 253, 245, 0.85)"
              stroke="#059669"
              strokeWidth="2"
            />

            {/* Inner triangular hole */}
            <polygon
              points="45,240 210,240 45,75"
              fill="rgba(255, 255, 255, 0.75)"
              stroke="#10b981"
              strokeWidth="1.5"
            />

            {/* 90-degree square symbol */}
            <rect
              x="10"
              y="245"
              width="25"
              height="25"
              fill="rgba(5, 150, 105, 0.2)"
              stroke="#059669"
              strokeWidth="1.5"
            />
            <circle cx="22.5" cy="257.5" r="2.5" fill="#059669" />

            {/* Bottom millimeter ticks along leg 1 */}
            {Array.from({ length: 26 }).map((_, cm) => (
              <g key={cm} transform={`translate(${10 + cm * 10}, 270)`}>
                <line x1="0" y1="0" x2="0" y2="-12" stroke="#065f46" strokeWidth="1.2" />
                {cm % 2 === 0 && (
                  <text
                    x="0"
                    y="-16"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#065f46"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {cm}
                  </text>
                )}
              </g>
            ))}

            {/* Left millimeter ticks along leg 2 */}
            {Array.from({ length: 26 }).map((_, cm) => (
              <g key={cm} transform={`translate(10, ${270 - cm * 10})`}>
                <line x1="0" y1="0" x2="12" y2="0" stroke="#065f46" strokeWidth="1.2" />
                {cm % 2 === 0 && (
                  <text
                    x="18"
                    y="3"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#065f46"
                    dominantBaseline="central"
                    fontFamily="monospace"
                  >
                    {cm}
                  </text>
                )}
              </g>
            ))}

            <text
              x="90"
              y="200"
              fontSize="12"
              fontWeight="bold"
              fill="#047857"
              fontFamily="sans-serif"
            >
              Ê-ke 45° - 90° - 45°
            </text>
          </svg>

          {/* Rotate handle */}
          <div
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center cursor-pointer pointer-events-auto border-2 border-white"
            title="Xoay Ê-ke"
            onPointerDown={(e) => handlePointerDown(e, 'setsquare_rot')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSetSquare((s) => ({ ...s, active: false }));
            }}
            className="absolute bottom-4 right-4 p-1 rounded-full bg-white/90 hover:bg-red-100 text-red-600 shadow border border-slate-200 pointer-events-auto cursor-pointer"
            title="Đóng Ê-ke"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
