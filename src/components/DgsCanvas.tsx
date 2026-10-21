import React, { useRef, useState, useMemo } from 'react';
import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoPolygon,
  GeoAngle,
  GeoConstructionArc,
  ToolMode,
  Vector2D,
  SnapTarget,
  ViewportTransform,
  CanvasTheme,
  GeoText,
} from '../types/geometry';
import {
  dist,
  distToCm,
  midpoint,
  angleBetween,
  getPerpendicularBisectorCoords,
  getAngleBisectorCoords,
  triangleCircumcenter,
  triangleIncenter,
  calculatePolygonArea,
  PIXELS_PER_CM,
  getPerpendicularLineThroughPoint,
  getParallelLineThroughPoint,
} from '../utils/geometryEngine';
import { findSnapTarget } from '../utils/snappingEngine';

interface DgsCanvasProps {
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
  angles: GeoAngle[];
  texts?: GeoText[];
  arcs: GeoConstructionArc[];
  toolMode: ToolMode;
  theme?: CanvasTheme;
  showGrid: boolean;
  showAxes: boolean;
  snapToGrid: boolean;
  transform: ViewportTransform;
  setTransform: React.Dispatch<React.SetStateAction<ViewportTransform>>;
  onUpdatePoint: (pointId: string, newPos: Vector2D) => void;
  onSelectElement: (type: 'point' | 'line' | 'circle' | 'polygon' | 'angle' | 'text', id: string) => void;
  onCreatePoint: (pos: Vector2D, name?: string) => string;
  onCreateLine: (type: GeoLine['type'], p1Id: string, p2Id?: string, vertexId?: string) => void;
  onCreateCircle: (type: GeoCircle['type'], centerId: string, pointOnCircleId?: string, radiusValue?: number, triangleIds?: [string, string, string]) => void;
  onCreatePolygon: (pointIds: string[]) => void;
  onCreateAngle: (p1Id: string, vertexId: string, p2Id: string) => void;
  onCreateText?: (pos: Vector2D, text?: string) => void;
  onDeleteElement: (type: string, id: string) => void;
}

export const DgsCanvas: React.FC<DgsCanvasProps> = ({
  points,
  lines,
  circles,
  polygons,
  angles,
  texts = [],
  arcs,
  toolMode,
  theme = 'light',
  showGrid,
  showAxes,
  snapToGrid,
  transform,
  setTransform,
  onUpdatePoint,
  onSelectElement,
  onCreatePoint,
  onCreateLine,
  onCreateCircle,
  onCreatePolygon,
  onCreateAngle,
  onCreateText,
  onDeleteElement,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Interaction State
  const [activeSnap, setActiveSnap] = useState<SnapTarget | null>(null);
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Vector2D>({ x: 0, y: 0 });

  // Creation sequence state (e.g. clicking point 1, then point 2 for a line)
  const [pendingPointIds, setPendingPointIds] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState<Vector2D>({ x: 0, y: 0 });

  // Fast point lookup map
  const pointMap = useMemo(() => {
    const map = new Map<string, GeoPoint>();
    points.forEach((p) => map.set(p.id, p));
    return map;
  }, [points]);

  // Screen to World coordinate conversion
  const screenToWorld = (screenX: number, screenY: number): Vector2D => {
    if (!svgRef.current) return { x: screenX, y: screenY };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - transform.x) / transform.zoom,
      y: (screenY - rect.top - transform.y) / transform.zoom,
    };
  };

  // Mouse wheel: smooth zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(5, transform.zoom * zoomFactor));

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((prev) => ({
      zoom: newZoom,
      x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom),
    }));
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setCursorPos(worldPos);

    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: prev.x + (e.clientX - panStart.x),
        y: prev.y + (e.clientY - panStart.y),
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggedPointId) {
      // Snapping while dragging a point
      const snap = findSnapTarget(worldPos, points, lines, circles, {
        snapToGrid,
        ignorePointId: draggedPointId,
      });
      const targetPos = snap ? snap.point : worldPos;
      onUpdatePoint(draggedPointId, targetPos);
      setActiveSnap(snap);
      return;
    }

    // Hover snapping
    const snap = findSnapTarget(worldPos, points, lines, circles, { snapToGrid });
    setActiveSnap(snap);
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || toolMode === 'pan' || (e.button === 0 && e.altKey)) {
      // Middle click or Pan mode
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return; // Only primary click

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const snap = findSnapTarget(worldPos, points, lines, circles, { snapToGrid });
    const effectivePoint = snap ? snap.point : worldPos;

    // Handle tool modes
    if (toolMode === 'select') {
      if (snap?.type === 'point' && snap.targetId) {
        const pt = pointMap.get(snap.targetId);
        if (pt && pt.parentType === 'free') {
          setDraggedPointId(snap.targetId);
        }
        onSelectElement('point', snap.targetId);
      }
      return;
    }

    if (toolMode === 'delete') {
      if (snap?.type === 'point' && snap.targetId) {
        onDeleteElement('point', snap.targetId);
      } else if (snap?.type === 'object' && snap.targetId) {
        onDeleteElement('object', snap.targetId);
      }
      return;
    }

    if (toolMode === 'text') {
      if (onCreateText) {
        onCreateText(effectivePoint);
      }
      return;
    }

    if (toolMode === 'point' || toolMode === 'intersection') {
      onCreatePoint(effectivePoint);
      return;
    }

    // Tools requiring point selection:
    let clickedPointId: string;
    if (snap?.type === 'point' && snap.targetId) {
      clickedPointId = snap.targetId;
    } else {
      // Auto create point at location
      clickedPointId = onCreatePoint(effectivePoint);
    }

    const nextPoints = [...pendingPointIds, clickedPointId];

    // Segment / Line / Ray
    if (toolMode === 'segment' || toolMode === 'line' || toolMode === 'ray') {
      if (nextPoints.length === 2) {
        onCreateLine(toolMode, nextPoints[0], nextPoints[1]);
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Midpoint
    if (toolMode === 'midpoint') {
      if (nextPoints.length === 2) {
        const p1 = pointMap.get(nextPoints[0]);
        const p2 = pointMap.get(nextPoints[1]);
        if (p1 && p2) {
          const mid = midpoint(p1, p2);
          onCreatePoint(mid, `M_{${p1.name}${p2.name}}`);
        }
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Perpendicular Bisector (Đường trung trực)
    if (toolMode === 'perpendicular_bisector') {
      if (nextPoints.length === 2) {
        onCreateLine('perpendicular_bisector', nextPoints[0], nextPoints[1]);
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Angle Bisector (Đường phân giác)
    if (toolMode === 'angle_bisector') {
      // Requires 3 points: A, Vertex B, C
      if (nextPoints.length === 3) {
        onCreateLine('angle_bisector', nextPoints[0], nextPoints[2], nextPoints[1]);
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Perpendicular & Parallel (Qua 1 điểm và phương của 2 điểm khác)
    if (toolMode === 'perpendicular' || toolMode === 'parallel') {
      if (nextPoints.length === 3) {
        onCreateLine(toolMode, nextPoints[0], nextPoints[1], nextPoints[2]);
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Circle (Center + Point)
    if (toolMode === 'circle_center_point') {
      if (nextPoints.length === 2) {
        onCreateCircle('center_point', nextPoints[0], nextPoints[1]);
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Circumcircle / Incircle of Triangle (Ngoại tiếp / Nội tiếp 3 điểm)
    if (toolMode === 'triangle_circumcircle' || toolMode === 'triangle_incircle') {
      if (nextPoints.length === 3) {
        onCreateCircle(
          toolMode,
          '',
          undefined,
          undefined,
          [nextPoints[0], nextPoints[1], nextPoints[2]]
        );
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Measure Angle (3 points: A, Vertex, B)
    if (toolMode === 'measure_angle') {
      if (nextPoints.length === 3) {
        onCreateAngle(nextPoints[0], nextPoints[1], nextPoints[2]);
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }

    // Polygon
    if (toolMode === 'polygon') {
      // If clicking the first point again and has at least 3 points, close polygon
      if (nextPoints.length > 3 && clickedPointId === nextPoints[0]) {
        onCreatePolygon(nextPoints.slice(0, -1));
        setPendingPointIds([]);
      } else {
        setPendingPointIds(nextPoints);
      }
      return;
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggedPointId(null);
  };

  // Keyboard escape to clear pending creations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPendingPointIds([]);
    }
  };

  const getThemeBg = () => {
    if (theme === 'chalkboard') return 'bg-[#152e20]';
    if (theme === 'blueprint') return 'bg-[#032b43]';
    return 'bg-slate-50 dark:bg-slate-950';
  };

  const getGridStroke = () => {
    if (theme === 'chalkboard') return 'rgba(110, 231, 183, 0.22)';
    if (theme === 'blueprint') return 'rgba(56, 189, 248, 0.25)';
    return 'rgba(148, 163, 184, 0.25)';
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none transition-colors duration-300 ${getThemeBg()}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <svg
        ref={svgRef}
        className={`w-full h-full ${
          toolMode === 'pan' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : toolMode === 'select'
            ? 'cursor-default'
            : 'cursor-crosshair'
        }`}
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <defs>
          {/* Grid pattern */}
          <pattern
            id="dgsGrid"
            width={PIXELS_PER_CM * transform.zoom}
            height={PIXELS_PER_CM * transform.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${transform.x}, ${transform.y})`}
          >
            {/* 10mm (1cm) minor and major grid lines */}
            <path
              d={`M ${PIXELS_PER_CM * transform.zoom} 0 L 0 0 0 ${
                PIXELS_PER_CM * transform.zoom
              }`}
              fill="none"
              stroke={getGridStroke()}
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* 1. Grid Background */}
        {showGrid && (
          <rect width="100%" height="100%" fill="url(#dgsGrid)" className="pointer-events-none" />
        )}

        {/* Main Content Viewport with Zoom & Pan */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.zoom})`}>
          {/* Coordinate Axes */}
          {showAxes && (
            <g className="pointer-events-none opacity-40">
              <line x1="-10000" y1="0" x2="10000" y2="0" stroke="#64748b" strokeWidth="1.5" />
              <line x1="0" y1="-10000" x2="0" y2="10000" stroke="#64748b" strokeWidth="1.5" />
              {/* Origin indicator */}
              <text x="6" y="-6" fontSize="12" fill="#64748b" className="font-mono">
                O (0,0)
              </text>
            </g>
          )}

          {/* 2. Construction Arcs */}
          {arcs.map((arc) => (
            <path
              key={arc.id}
              d={`M ${arc.center.x + arc.radius * Math.cos(arc.startAngle)} ${
                arc.center.y + arc.radius * Math.sin(arc.startAngle)
              } A ${arc.radius} ${arc.radius} 0 0 1 ${
                arc.center.x + arc.radius * Math.cos(arc.endAngle)
              } ${arc.center.y + arc.radius * Math.sin(arc.endAngle)}`}
              fill="none"
              stroke={arc.color}
              strokeWidth={arc.strokeWidth}
              strokeDasharray={arc.dashed ? '4,4' : undefined}
            />
          ))}

          {/* 3. Polygons */}
          {polygons.map((poly) => {
            const polyPoints = poly.pointIds
              .map((id) => pointMap.get(id))
              .filter((p): p is GeoPoint => p !== undefined);
            if (polyPoints.length < 3) return null;

            const pointsStr = polyPoints.map((p) => `${p.x},${p.y}`).join(' ');
            const center = polyPoints.reduce(
              (acc, p) => ({ x: acc.x + p.x / polyPoints.length, y: acc.y + p.y / polyPoints.length }),
              { x: 0, y: 0 }
            );
            const areaCm = calculatePolygonArea(polyPoints) / (PIXELS_PER_CM * PIXELS_PER_CM);

            return (
              <g key={poly.id} onClick={() => onSelectElement('polygon', poly.id)}>
                <polygon
                  points={pointsStr}
                  fill={poly.fillColor}
                  fillOpacity={poly.fillOpacity}
                  stroke={poly.color}
                  strokeWidth={poly.strokeWidth}
                  className="cursor-pointer hover:opacity-90 transition"
                />
                {poly.showArea && (
                  <text
                    x={center.x}
                    y={center.y}
                    fontSize="11"
                    fontWeight="bold"
                    fill={poly.color}
                    textAnchor="middle"
                    className="font-mono drop-shadow pointer-events-none select-none"
                  >
                    S = {areaCm.toFixed(1)} cm²
                  </text>
                )}
              </g>
            );
          })}

          {/* 4. Circles */}
          {circles.map((circle) => {
            let cx = 0;
            let cy = 0;
            let r = 0;

            if (circle.type === 'triangle_circumcircle' && circle.trianglePointIds) {
              const [idA, idB, idC] = circle.trianglePointIds;
              const A = pointMap.get(idA);
              const B = pointMap.get(idB);
              const C = pointMap.get(idC);
              if (A && B && C) {
                const res = triangleCircumcenter(A, B, C);
                if (res) {
                  cx = res.center.x;
                  cy = res.center.y;
                  r = res.radius;
                }
              }
            } else if (circle.type === 'triangle_incircle' && circle.trianglePointIds) {
              const [idA, idB, idC] = circle.trianglePointIds;
              const A = pointMap.get(idA);
              const B = pointMap.get(idB);
              const C = pointMap.get(idC);
              if (A && B && C) {
                const res = triangleIncenter(A, B, C);
                if (res) {
                  cx = res.center.x;
                  cy = res.center.y;
                  r = res.radius;
                }
              }
            } else {
              const center = pointMap.get(circle.centerId);
              if (!center) return null;
              cx = center.x;
              cy = center.y;
              if (circle.pointOnCircleId) {
                const pt = pointMap.get(circle.pointOnCircleId);
                if (pt) r = dist(center, pt);
              } else if (circle.radiusValue) {
                r = circle.radiusValue;
              }
            }

            if (r <= 0) return null;

            return (
              <g key={circle.id} onClick={() => onSelectElement('circle', circle.id)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={circle.fillColor || 'none'}
                  fillOpacity={circle.fillOpacity || 0}
                  stroke={circle.color}
                  strokeWidth={circle.strokeWidth}
                  strokeDasharray={circle.lineDash}
                  className="cursor-pointer hover:stroke-blue-500 transition"
                />
                {circle.showMeasure && (
                  <text
                    x={cx + r * 0.7}
                    y={cy - r * 0.7}
                    fontSize="10"
                    fill={circle.color}
                    fontWeight="bold"
                    className="font-mono pointer-events-none select-none drop-shadow"
                  >
                    R = {(r / PIXELS_PER_CM).toFixed(1)} cm
                  </text>
                )}
              </g>
            );
          })}

          {/* 5. Lines, Segments, Bisectors */}
          {lines.map((line) => {
            const p1 = pointMap.get(line.p1Id);
            if (!p1) return null;

            if (line.type === 'segment') {
              const p2 = line.p2Id ? pointMap.get(line.p2Id) : null;
              if (!p2) return null;
              const mid = midpoint(p1, p2);
              const lenCm = distToCm(dist(p1, p2));

              return (
                <g key={line.id} onClick={() => onSelectElement('line', line.id)}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    strokeDasharray={line.lineDash}
                    className="cursor-pointer hover:stroke-blue-500 transition"
                  />
                  {/* Equal segment tick marks: |, ||, ||| */}
                  {line.ticks && line.ticks > 0 && (
                    <g stroke={line.color} strokeWidth="2">
                      {(() => {
                        const dx = p2.x - p1.x;
                        const dy = p2.y - p1.y;
                        const length = Math.hypot(dx, dy) || 1;
                        const ux = dx / length;
                        const uy = dy / length;
                        const nx = -dy / length;
                        const ny = dx / length;
                        return Array.from({ length: line.ticks }).map((_, i) => {
                          const offset = (i - (line.ticks! - 1) / 2) * 5;
                          const tx = mid.x + ux * offset;
                          const ty = mid.y + uy * offset;
                          return (
                            <line
                              key={i}
                              x1={tx - nx * 6}
                              y1={ty - ny * 6}
                              x2={tx + nx * 6}
                              y2={ty + ny * 6}
                            />
                          );
                        });
                      })()}
                    </g>
                  )}
                  {line.showMeasure && (
                    <text
                      x={mid.x}
                      y={mid.y - 8}
                      fontSize="10"
                      fontWeight="bold"
                      fill={line.color}
                      textAnchor="middle"
                      className="font-mono bg-white/80 px-1 rounded pointer-events-none select-none drop-shadow-sm"
                    >
                      {lenCm.toFixed(1)} cm
                    </text>
                  )}
                </g>
              );
            }

            if (line.type === 'line' || line.type === 'ray') {
              const p2 = line.p2Id ? pointMap.get(line.p2Id) : null;
              if (!p2) return null;
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const length = Math.hypot(dx, dy) || 1;
              const extend = 3000;
              const ux = dx / length;
              const uy = dy / length;

              const x1 = line.type === 'line' ? p1.x - ux * extend : p1.x;
              const y1 = line.type === 'line' ? p1.y - uy * extend : p1.y;
              const x2 = p2.x + ux * extend;
              const y2 = p2.y + uy * extend;

              return (
                <g key={line.id} onClick={() => onSelectElement('line', line.id)}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    strokeDasharray={line.lineDash}
                    className="cursor-pointer hover:stroke-blue-500"
                  />
                </g>
              );
            }

            if (line.type === 'perpendicular_bisector') {
              const p2 = line.p2Id ? pointMap.get(line.p2Id) : null;
              if (!p2) return null;
              const { start, end, mid } = getPerpendicularBisectorCoords(p1, p2);

              return (
                <g key={line.id} onClick={() => onSelectElement('line', line.id)}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    strokeDasharray={line.lineDash || '6,4'}
                  />
                  {/* Right-angle square indicator at midpoint */}
                  <rect
                    x={mid.x - 6}
                    y={mid.y - 6}
                    width="12"
                    height="12"
                    fill="none"
                    stroke={line.color}
                    strokeWidth="1.2"
                  />
                </g>
              );
            }

            if (line.type === 'angle_bisector' && line.vertexId && line.p2Id) {
              const vertex = pointMap.get(line.vertexId);
              const p2 = pointMap.get(line.p2Id);
              if (!vertex || !p2) return null;
              const { start, end } = getAngleBisectorCoords(p1, vertex, p2);

              return (
                <g key={line.id} onClick={() => onSelectElement('line', line.id)}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    strokeDasharray={line.lineDash || '4,4'}
                  />
                </g>
              );
            }

            if (line.type === 'perpendicular' && line.p2Id && line.vertexId) {
              const lineP1 = pointMap.get(line.p2Id);
              const lineP2 = pointMap.get(line.vertexId);
              if (!lineP1 || !lineP2) return null;
              const { start, end, foot } = getPerpendicularLineThroughPoint(p1, lineP1, lineP2);

              return (
                <g key={line.id} onClick={() => onSelectElement('line', line.id)}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    strokeDasharray={line.lineDash || '6,3'}
                  />
                  {/* Square symbol at foot of perpendicular */}
                  <rect
                    x={foot.x - 5}
                    y={foot.y - 5}
                    width="10"
                    height="10"
                    fill="none"
                    stroke={line.color}
                    strokeWidth="1.2"
                  />
                </g>
              );
            }

            if (line.type === 'parallel' && line.p2Id && line.vertexId) {
              const lineP1 = pointMap.get(line.p2Id);
              const lineP2 = pointMap.get(line.vertexId);
              if (!lineP1 || !lineP2) return null;
              const { start, end } = getParallelLineThroughPoint(p1, lineP1, lineP2);

              return (
                <g key={line.id} onClick={() => onSelectElement('line', line.id)}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    strokeDasharray={line.lineDash || '5,3'}
                  />
                </g>
              );
            }

            return null;
          })}

          {/* 6. Angles */}
          {angles.map((ang) => {
            const p1 = pointMap.get(ang.p1Id);
            const vertex = pointMap.get(ang.vertexId);
            const p2 = pointMap.get(ang.p2Id);
            if (!p1 || !vertex || !p2) return null;

            const deg = angleBetween(p1, vertex, p2);
            const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
            const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);

            return (
              <g key={ang.id} onClick={() => onSelectElement('angle', ang.id)}>
                {ang.arcType === 'right_angle' ? (
                  <path
                    d={`M ${vertex.x + 14 * Math.cos(a1)} ${vertex.y + 14 * Math.sin(a1)} L ${
                      vertex.x + 14 * Math.cos(a1) + 14 * Math.cos(a2)
                    } ${vertex.y + 14 * Math.sin(a1) + 14 * Math.sin(a2)} L ${
                      vertex.x + 14 * Math.cos(a2)
                    } ${vertex.y + 14 * Math.sin(a2)}`}
                    fill="none"
                    stroke={ang.color}
                    strokeWidth="1.8"
                  />
                ) : (
                  <>
                    <path
                      d={`M ${vertex.x + ang.size * Math.cos(a1)} ${
                        vertex.y + ang.size * Math.sin(a1)
                      } A ${ang.size} ${ang.size} 0 0 1 ${vertex.x + ang.size * Math.cos(a2)} ${
                        vertex.y + ang.size * Math.sin(a2)
                      }`}
                      fill="none"
                      stroke={ang.color}
                      strokeWidth="2"
                    />
                    {ang.arcType === 'double' && (
                      <path
                        d={`M ${vertex.x + (ang.size + 5) * Math.cos(a1)} ${
                          vertex.y + (ang.size + 5) * Math.sin(a1)
                        } A ${ang.size + 5} ${ang.size + 5} 0 0 1 ${
                          vertex.x + (ang.size + 5) * Math.cos(a2)
                        } ${vertex.y + (ang.size + 5) * Math.sin(a2)}`}
                        fill="none"
                        stroke={ang.color}
                        strokeWidth="1.8"
                      />
                    )}
                  </>
                )}
                  stroke={ang.color}
                  strokeWidth="2"
                />
                {ang.showDegrees && (
                  <text
                    x={vertex.x + (ang.size + 14) * Math.cos((a1 + a2) / 2)}
                    y={vertex.y + (ang.size + 14) * Math.sin((a1 + a2) / 2)}
                    fontSize="11"
                    fontWeight="bold"
                    fill={ang.color}
                    textAnchor="middle"
                    className="font-mono drop-shadow pointer-events-none select-none"
                  >
                    {deg.toFixed(1)}°
                  </text>
                )}
              </g>
            );
          })}

          {/* 7. Ghost Preview when building */}
          {pendingPointIds.length > 0 && (
            <g className="pointer-events-none opacity-60">
              {pendingPointIds.map((id) => {
                const pt = pointMap.get(id);
                if (!pt) return null;
                return (
                  <line
                    key={id}
                    x1={pt.x}
                    y1={pt.y}
                    x2={activeSnap ? activeSnap.point.x : cursorPos.x}
                    y2={activeSnap ? activeSnap.point.y : cursorPos.y}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                );
              })}
            </g>
          )}

          {/* 8. Points (A, B, C...) */}
          {points.map((pt) => {
            if (!pt.visible) return null;
            const isPending = pendingPointIds.includes(pt.id);

            return (
              <g
                key={pt.id}
                className="cursor-pointer"
                onClick={() => onSelectElement('point', pt.id)}
              >
                {/* Glow ring when selected or pending */}
                {(pt.selected || isPending) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.size + 5}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Point core */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.size}
                  fill={pt.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow-md hover:scale-125 transition-transform"
                />

                {/* Point Label */}
                {pt.showLabel && (
                  <text
                    x={pt.x + 8}
                    y={pt.y - 8}
                    fontSize="13"
                    fontWeight="bold"
                    fill="#0f172a"
                    className="dark:fill-slate-100 font-serif drop-shadow-sm pointer-events-none select-none italic"
                  >
                    {pt.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* 9. Text Annotations */}
          {texts.map((txt) => (
            <g
              key={txt.id}
              className="cursor-pointer"
              onClick={() => onSelectElement('text', txt.id)}
            >
              {txt.showBox && (
                <rect
                  x={txt.x - 6}
                  y={txt.y - txt.fontSize}
                  width={txt.text.length * (txt.fontSize * 0.6) + 12}
                  height={txt.fontSize + 8}
                  fill={theme === 'chalkboard' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.85)'}
                  stroke={txt.selected ? '#3b82f6' : 'rgba(148, 163, 184, 0.4)'}
                  strokeWidth="1.2"
                  rx="4"
                />
              )}
              <text
                x={txt.x}
                y={txt.y}
                fontSize={txt.fontSize}
                fontWeight={txt.isBold ? 'bold' : 'normal'}
                fontStyle={txt.isItalic ? 'italic' : 'normal'}
                fill={theme === 'chalkboard' ? '#fef08a' : txt.color}
                className="font-serif select-none pointer-events-none drop-shadow-sm"
              >
                {txt.text}
              </text>
            </g>
          ))}

          {/* 10. Active Snapping Target Indicator */}
          {activeSnap && (
            <g className="pointer-events-none">
              <circle
                cx={activeSnap.point.x}
                cy={activeSnap.point.y}
                r="7"
                fill="none"
                stroke={activeSnap.type === 'intersection' ? '#a855f7' : '#3b82f6'}
                strokeWidth="2.5"
                className="animate-pulse"
              />
              <circle
                cx={activeSnap.point.x}
                cy={activeSnap.point.y}
                r="2.5"
                fill={activeSnap.type === 'intersection' ? '#a855f7' : '#3b82f6'}
              />
            </g>
          )}
        </g>
      </svg>

      {/* Floating Snapping Tooltip in Screen Coordinates */}
      {activeSnap && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-8 z-30 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all"
          style={{
            left: activeSnap.point.x * transform.zoom + transform.x,
            top: activeSnap.point.y * transform.zoom + transform.y,
            backgroundColor:
              activeSnap.type === 'intersection'
                ? 'rgba(147, 51, 234, 0.9)'
                : activeSnap.type === 'object'
                ? 'rgba(16, 185, 129, 0.9)'
                : 'rgba(30, 41, 59, 0.9)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {activeSnap.label}
        </div>
      )}

      {/* Mode Instruction Toast */}
      {pendingPointIds.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 pointer-events-none animate-bounce">
          <span>
            {toolMode === 'segment' || toolMode === 'line' || toolMode === 'ray'
              ? 'Chọn điểm thứ 2 để hoàn thành đường'
              : toolMode === 'perpendicular' || toolMode === 'parallel'
              ? pendingPointIds.length === 1
                ? 'Chọn điểm thứ nhất của đường tham chiếu'
                : 'Chọn điểm thứ hai của đường tham chiếu'
              : toolMode === 'angle_bisector' || toolMode === 'measure_angle'
              ? `Chọn điểm thứ ${pendingPointIds.length + 1} (A, Đỉnh B, C)`
              : toolMode === 'triangle_circumcircle' || toolMode === 'triangle_incircle'
              ? `Chọn đỉnh thứ ${pendingPointIds.length + 1} của tam giác`
              : toolMode === 'polygon'
              ? `Chọn thêm đỉnh hoặc click lại điểm đầu (${pointMap.get(pendingPointIds[0])?.name}) để khép kín`
              : 'Chọn điểm tiếp theo...'}
          </span>
          <span className="text-[10px] bg-blue-800 px-1.5 py-0.5 rounded">Esc để hủy</span>
        </div>
      )}
    </div>
  );
};
