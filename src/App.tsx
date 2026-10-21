import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoPolygon,
  GeoAngle,
  GeoConstructionArc,
  ToolMode,
  Vector2D,
  ViewportTransform,
  RulerInstrument,
  CompassInstrument,
  ProtractorInstrument,
  SetSquareInstrument,
  CanvasTheme,
  GeoText,
} from './types/geometry';
import { DgsCanvas } from './components/DgsCanvas';
import { Toolbar } from './components/Toolbar';
import { InstrumentsOverlay } from './components/InstrumentsOverlay';
import { InspectorPanel } from './components/InspectorPanel';
import { EuclidTutorModal } from './components/EuclidTutorModal';
import { AiDgsModal } from './components/AiDgsModal';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';
import { EuclidQuestModal, QuestLevel } from './components/EuclidQuestModal';
import { exportToWordDocument, exportToPresentation } from './utils/documentExport';
import { recomputeDependentPoints, PIXELS_PER_CM } from './utils/geometryEngine';
import { PRESET_DEMOS, PresetDemo } from './utils/presets';
import { GeometryCommandShape, getStoredApiKey } from './utils/aiService';

interface HistoryState {
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
  angles: GeoAngle[];
}

// Initial Starter State: Triangle ABC with circumcircle and midpoint
const INITIAL_DEMO = PRESET_DEMOS[1]; // Euler Line & 4 special points

export default function App() {
  const [points, setPoints] = useState<GeoPoint[]>(INITIAL_DEMO.points);
  const [lines, setLines] = useState<GeoLine[]>(INITIAL_DEMO.lines);
  const [circles, setCircles] = useState<GeoCircle[]>(INITIAL_DEMO.circles);
  const [polygons, setPolygons] = useState<GeoPolygon[]>(INITIAL_DEMO.polygons);
  const [angles, setAngles] = useState<GeoAngle[]>(INITIAL_DEMO.angles);
  const [texts, setTexts] = useState<GeoText[]>([]);
  const [arcs, setArcs] = useState<GeoConstructionArc[]>([]);

  // Interaction & Viewport
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [theme, setTheme] = useState<CanvasTheme>('light');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [transform, setTransform] = useState<ViewportTransform>({ x: 0, y: 0, zoom: 1 });

  // Selection
  const [selectedType, setSelectedType] = useState<string | null>('point');
  const [selectedId, setSelectedId] = useState<string | null>('pA');

  // UI Modals & Sidebars
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isEuclidTutorOpen, setIsEuclidTutorOpen] = useState(false);
  const [isAiDgsModalOpen, setIsAiDgsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);

  // Keyboard shortcut Ctrl+H to toggle top toolbar visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsToolbarVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Digital Instruments
  const [ruler, setRuler] = useState<RulerInstrument>({
    active: false,
    x: 180,
    y: 200,
    angle: 0,
    lengthPx: 400,
  });
  const [compass, setCompass] = useState<CompassInstrument>({
    active: false,
    needlePos: { x: 300, y: 300 },
    pencilAngle: 0,
    radius: 120,
    isDrawing: false,
  });
  const [protractor, setProtractor] = useState<ProtractorInstrument>({
    active: false,
    x: 350,
    y: 350,
    angle: 0,
    radius: 140,
  });
  const [setSquare, setSetSquare] = useState<SetSquareInstrument>({
    active: false,
    x: 200,
    y: 250,
    angle: 0,
    type: '45-45',
    scale: 1,
  });

  // Initial check: if no API key is stored, open modal as per AI_INSTRUCTIONS
  useEffect(() => {
    const key = getStoredApiKey();
    if (!key) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  // Undo / Redo History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback(
    (pts = points, lns = lines, crcs = circles, polys = polygons, angs = angles) => {
      const newState: HistoryState = {
        points: JSON.parse(JSON.stringify(pts)),
        lines: JSON.parse(JSON.stringify(lns)),
        circles: JSON.parse(JSON.stringify(crcs)),
        polygons: JSON.parse(JSON.stringify(polys)),
        angles: JSON.parse(JSON.stringify(angs)),
      };
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
      setHistoryIndex((prev) => prev + 1);
    },
    [points, lines, circles, polygons, angles, historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setPoints(prev.points);
      setLines(prev.lines);
      setCircles(prev.circles);
      setPolygons(prev.polygons);
      setAngles(prev.angles);
      setHistoryIndex((idx) => idx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setPoints(next.points);
      setLines(next.lines);
      setCircles(next.circles);
      setPolygons(next.polygons);
      setAngles(next.angles);
      setHistoryIndex((idx) => idx + 1);
    }
  };

  // Auto-generate next alphabet label (A, B, C... Z, A₁, B₁...)
  const getNextPointLabel = useCallback(() => {
    const existingNames = new Set(points.map((p) => p.name));
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      if (!existingNames.has(letters[i])) return letters[i];
    }
    for (let sub = 1; sub <= 9; sub++) {
      for (let i = 0; i < letters.length; i++) {
        const candidate = `${letters[i]}${sub}`;
        if (!existingNames.has(candidate)) return candidate;
      }
    }
    return `P${points.length + 1}`;
  }, [points]);

  // Create point
  const handleCreatePoint = (pos: Vector2D, name?: string): string => {
    const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const pointName = name || getNextPointLabel();
    const newPoint: GeoPoint = {
      id,
      name: pointName,
      x: pos.x,
      y: pos.y,
      parentType: 'free',
      color: '#3b82f6',
      size: 6,
      visible: true,
      showLabel: true,
    };
    const nextPoints = [...points, newPoint];
    setPoints(nextPoints);
    pushHistory(nextPoints);
    setSelectedType('point');
    setSelectedId(id);
    return id;
  };

  // Update existing point position and recompute dependents
  const handleUpdatePoint = (pointId: string, newPos: Vector2D) => {
    const nextPoints = points.map((p) => {
      if (p.id === pointId) {
        return { ...p, x: newPos.x, y: newPos.y };
      }
      return p;
    });

    // Recompute all dependent children
    const resolvedPoints = recomputeDependentPoints(nextPoints, lines, circles);
    setPoints(resolvedPoints);
  };

  // Create Line / Segment / Bisector
  const handleCreateLine = (
    type: GeoLine['type'],
    p1Id: string,
    p2Id?: string,
    vertexId?: string
  ) => {
    const id = `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLine: GeoLine = {
      id,
      type,
      p1Id,
      p2Id,
      vertexId,
      color:
        type === 'perpendicular_bisector'
          ? '#ef4444'
          : type === 'perpendicular'
          ? '#6366f1'
          : type === 'parallel'
          ? '#10b981'
          : '#2563eb',
      strokeWidth: type === 'segment' ? 2.5 : 2,
      lineDash:
        type === 'perpendicular_bisector'
          ? '6,4'
          : type === 'angle_bisector'
          ? '4,4'
          : type === 'perpendicular'
          ? '6,3'
          : type === 'parallel'
          ? '5,3'
          : undefined,
      visible: true,
      showMeasure: type === 'segment',
    };
    const nextLines = [...lines, newLine];
    setLines(nextLines);
    pushHistory(points, nextLines);
    setSelectedType('line');
    setSelectedId(id);
  };

  // Create Circle
  const handleCreateCircle = (
    type: GeoCircle['type'],
    centerId: string,
    pointOnCircleId?: string,
    radiusValue?: number,
    trianglePointIds?: [string, string, string]
  ) => {
    const id = `circ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCircle: GeoCircle = {
      id,
      type,
      centerId,
      pointOnCircleId,
      radiusValue,
      trianglePointIds,
      color: type === 'triangle_circumcircle' ? '#06b6d4' : '#3b82f6',
      strokeWidth: 2,
      lineDash: type.includes('triangle') ? '4,4' : undefined,
      fillColor: type === 'triangle_circumcircle' ? '#06b6d4' : undefined,
      fillOpacity: 0.05,
      visible: true,
      showMeasure: true,
    };
    const nextCircles = [...circles, newCircle];
    setCircles(nextCircles);
    pushHistory(points, lines, nextCircles);
    setSelectedType('circle');
    setSelectedId(id);
  };

  // Create Polygon
  const handleCreatePolygon = (pointIds: string[]) => {
    const id = `poly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPolygon: GeoPolygon = {
      id,
      pointIds,
      color: '#3b82f6',
      strokeWidth: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      visible: true,
      showArea: true,
    };
    const nextPolys = [...polygons, newPolygon];
    setPolygons(nextPolys);
    pushHistory(points, lines, circles, nextPolys);
    setSelectedType('polygon');
    setSelectedId(id);
  };

  // Create Angle
  const handleCreateAngle = (p1Id: string, vertexId: string, p2Id: string) => {
    const id = `ang_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAngle: GeoAngle = {
      id,
      p1Id,
      vertexId,
      p2Id,
      color: '#f59e0b',
      size: 26,
      showDegrees: true,
    };
    const nextAngles = [...angles, newAngle];
    setAngles(nextAngles);
    pushHistory(points, lines, circles, polygons, nextAngles);
    setSelectedType('angle');
    setSelectedId(id);
  };

  // Delete Element
  const handleDeleteElement = (type: string, id: string) => {
    if (type === 'point') {
      const nextPoints = points.filter((p) => p.id !== id);
      const nextLines = lines.filter((l) => l.p1Id !== id && l.p2Id !== id && l.vertexId !== id);
      const nextCircles = circles.filter(
        (c) =>
          c.centerId !== id &&
          c.pointOnCircleId !== id &&
          !c.trianglePointIds?.includes(id)
      );
      const nextPolys = polygons.filter((p) => !p.pointIds.includes(id));
      const nextAngles = angles.filter(
        (a) => a.p1Id !== id && a.vertexId !== id && a.p2Id !== id
      );
      setPoints(nextPoints);
      setLines(nextLines);
      setCircles(nextCircles);
      setPolygons(nextPolys);
      setAngles(nextAngles);
      pushHistory(nextPoints, nextLines, nextCircles, nextPolys, nextAngles);
    } else if (type === 'line' || type === 'object') {
      const nextLines = lines.filter((l) => l.id !== id);
      const nextCircles = circles.filter((c) => c.id !== id);
      setLines(nextLines);
      setCircles(nextCircles);
      pushHistory(points, nextLines, nextCircles);
    } else if (type === 'circle') {
      const nextCircles = circles.filter((c) => c.id !== id);
      setCircles(nextCircles);
      pushHistory(points, lines, nextCircles);
    } else if (type === 'polygon') {
      const nextPolys = polygons.filter((p) => p.id !== id);
      setPolygons(nextPolys);
      pushHistory(points, lines, circles, nextPolys);
    } else if (type === 'text') {
      setTexts((prev) => prev.filter((t) => t.id !== id));
    }
    setSelectedType(null);
    setSelectedId(null);
  };

  // Update properties from Inspector
  const handleUpdatePointProps = (id: string, updates: Partial<GeoPoint>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };
  const handleUpdateLineProps = (id: string, updates: Partial<GeoLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };
  const handleUpdateCircleProps = (id: string, updates: Partial<GeoCircle>) => {
    setCircles((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };
  const handleUpdateAngleProps = (id: string, updates: Partial<GeoAngle>) => {
    setAngles((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };
  const handleUpdateTextProps = (id: string, updates: Partial<GeoText>) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Create text annotation
  const handleCreateText = (pos: Vector2D, content = 'Ghi chú đề bài') => {
    const id = `txt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newText: GeoText = {
      id,
      x: pos.x,
      y: pos.y,
      text: content,
      fontSize: 14,
      color: theme === 'chalkboard' ? '#fef08a' : '#1e293b',
      isBold: true,
      showBox: true,
    };
    setTexts((prev) => [...prev, newText]);
    setSelectedType('text');
    setSelectedId(id);
  };

  // Drawing along ruler edge
  const handleDrawRulerLine = (start: Vector2D, end: Vector2D) => {
    const p1Id = handleCreatePoint(start);
    const p2Id = handleCreatePoint(end);
    handleCreateLine('segment', p1Id, p2Id);
  };

  // Drawing circle using compass
  const handleDrawCompassCircle = (center: Vector2D, radius: number) => {
    const centerId = handleCreatePoint(center);
    handleCreateCircle('center_radius', centerId, undefined, radius);
  };

  // Load Preset
  const handleLoadPreset = (preset: PresetDemo) => {
    setPoints(preset.points);
    setLines(preset.lines);
    setCircles(preset.circles);
    setPolygons(preset.polygons);
    setAngles(preset.angles);
    setArcs(preset.arcs || []);
    if (preset.rulerState) {
      setRuler((r) => ({ ...r, ...preset.rulerState }));
    }
    if (preset.compassState) {
      setCompass((c) => ({ ...c, ...preset.compassState }));
    }
    pushHistory(preset.points, preset.lines, preset.circles, preset.polygons, preset.angles);
  };

  // Quick Polygon Presets (Tam giác đều, Tam giác vuông, Hình chữ nhật, Hình vuông)
  const handleQuickPolygonPreset = (type: 'equilateral_triangle' | 'right_triangle' | 'rectangle' | 'square') => {
    const cx = 350;
    const cy = 300;
    if (type === 'equilateral_triangle') {
      const side = 160;
      const h = (side * Math.sqrt(3)) / 2;
      const pAId = handleCreatePoint({ x: cx, y: cy - (2 * h) / 3 }, 'A');
      const pBId = handleCreatePoint({ x: cx - side / 2, y: cy + h / 3 }, 'B');
      const pCId = handleCreatePoint({ x: cx + side / 2, y: cy + h / 3 }, 'C');
      handleCreateLine('segment', pAId, pBId);
      handleCreateLine('segment', pBId, pCId);
      handleCreateLine('segment', pCId, pAId);
      handleCreatePolygon([pAId, pBId, pCId]);
    } else if (type === 'right_triangle') {
      const pAId = handleCreatePoint({ x: cx - 100, y: cy + 80 }, 'A');
      const pBId = handleCreatePoint({ x: cx + 100, y: cy + 80 }, 'B');
      const pCId = handleCreatePoint({ x: cx - 100, y: cy - 70 }, 'C');
      handleCreateLine('segment', pAId, pBId);
      handleCreateLine('segment', pBId, pCId);
      handleCreateLine('segment', pCId, pAId);
      handleCreateAngle(pBId, pAId, pCId);
      handleCreatePolygon([pAId, pBId, pCId]);
    } else if (type === 'rectangle') {
      const w = 200;
      const h = 120;
      const pAId = handleCreatePoint({ x: cx - w / 2, y: cy - h / 2 }, 'A');
      const pBId = handleCreatePoint({ x: cx + w / 2, y: cy - h / 2 }, 'B');
      const pCId = handleCreatePoint({ x: cx + w / 2, y: cy + h / 2 }, 'C');
      const pDId = handleCreatePoint({ x: cx - w / 2, y: cy + h / 2 }, 'D');
      handleCreateLine('segment', pAId, pBId);
      handleCreateLine('segment', pBId, pCId);
      handleCreateLine('segment', pCId, pDId);
      handleCreateLine('segment', pDId, pAId);
      handleCreatePolygon([pAId, pBId, pCId, pDId]);
    } else if (type === 'square') {
      const s = 150;
      const pAId = handleCreatePoint({ x: cx - s / 2, y: cy - s / 2 }, 'A');
      const pBId = handleCreatePoint({ x: cx + s / 2, y: cy - s / 2 }, 'B');
      const pCId = handleCreatePoint({ x: cx + s / 2, y: cy + s / 2 }, 'C');
      const pDId = handleCreatePoint({ x: cx - s / 2, y: cy + s / 2 }, 'D');
      handleCreateLine('segment', pAId, pBId);
      handleCreateLine('segment', pBId, pCId);
      handleCreateLine('segment', pCId, pDId);
      handleCreateLine('segment', pDId, pAId);
      handleCreatePolygon([pAId, pBId, pCId, pDId]);
    }
  };

  // AI Auto-construction Injector
  const handleApplyAiShape = (shape: GeometryCommandShape) => {
    const nameToIdMap = new Map<string, string>();
    const newPoints: GeoPoint[] = [...points];

    if (shape.points) {
      shape.points.forEach((pt) => {
        const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        nameToIdMap.set(pt.name, id);
        newPoints.push({
          id,
          name: pt.name,
          x: pt.x,
          y: pt.y,
          parentType: 'free',
          color: pt.color || '#3b82f6',
          size: 6,
          visible: true,
          showLabel: true,
        });
      });
    }

    const newLines: GeoLine[] = [...lines];
    if (shape.lines) {
      shape.lines.forEach((ln) => {
        const id1 = nameToIdMap.get(ln.p1);
        const id2 = nameToIdMap.get(ln.p2);
        if (id1 && id2) {
          newLines.push({
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: ln.type || 'segment',
            p1Id: id1,
            p2Id: id2,
            color: ln.color || '#2563eb',
            strokeWidth: 2.5,
            visible: true,
            showMeasure: ln.type === 'segment',
          });
        }
      });
    }

    const newPolys: GeoPolygon[] = [...polygons];
    if (shape.polygons) {
      shape.polygons.forEach((poly) => {
        const polyIds = poly.points.map((p) => nameToIdMap.get(p)).filter((id): id is string => Boolean(id));
        if (polyIds.length >= 3) {
          newPolys.push({
            id: `poly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            pointIds: polyIds,
            color: poly.color || '#3b82f6',
            strokeWidth: 2,
            fillColor: poly.color || '#3b82f6',
            fillOpacity: 0.15,
            visible: true,
            showArea: true,
          });
        }
      });
    }

    setPoints(newPoints);
    setLines(newLines);
    setPolygons(newPolys);
    pushHistory(newPoints, newLines, circles, newPolys, angles);
  };

  // Clear canvas
  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng vẽ hiện tại?')) {
      setPoints([]);
      setLines([]);
      setCircles([]);
      setPolygons([]);
      setAngles([]);
      setArcs([]);
      pushHistory([], [], [], [], []);
    }
  };

  // Reset View
  const handleResetView = () => {
    setTransform({ x: 0, y: 0, zoom: 1 });
  };

  // Export handlers
  const handleExportPNG = () => {
    const svgEl = document.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = svgEl.clientWidth * 2;
    canvas.height = svgEl.clientHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `Thay_Minh_Ve_Hinh_${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
  };

  const handleExportSVG = () => {
    const svgEl = document.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `Thay_Minh_Ve_Hinh_${Date.now()}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      points,
      lines,
      circles,
      polygons,
      angles,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `Thay_Minh_Ve_Hinh_Du_An_${Date.now()}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.points) setPoints(json.points);
        if (json.lines) setLines(json.lines);
        if (json.circles) setCircles(json.circles);
        if (json.polygons) setPolygons(json.polygons);
        if (json.angles) setAngles(json.angles);
        pushHistory(
          json.points || [],
          json.lines || [],
          json.circles || [],
          json.polygons || [],
          json.angles || []
        );
      } catch (err) {
        alert('Tệp JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportWordDoc = () => {
    const svgEl = document.querySelector('svg');
    const svgContent = svgEl ? new XMLSerializer().serializeToString(svgEl) : undefined;
    exportToWordDocument({
      points,
      lines,
      circles,
      polygons,
      angles,
      texts,
      svgContent,
    });
  };

  const handleExportSlideDeck = () => {
    const svgEl = document.querySelector('svg');
    const svgContent = svgEl ? new XMLSerializer().serializeToString(svgEl) : undefined;
    exportToPresentation({
      points,
      lines,
      circles,
      polygons,
      angles,
      texts,
      svgContent,
    });
  };

  const handleStartQuest = (level: QuestLevel) => {
    setPoints(level.initialPoints);
    setLines(level.initialLines || []);
    setCircles([]);
    setPolygons([]);
    setAngles([]);
    setTexts([]);
    pushHistory(level.initialPoints, level.initialLines || [], [], [], []);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* 1. Main Interactive Toolbar */}
      <Toolbar
        toolMode={toolMode}
        setToolMode={setToolMode}
        theme={theme}
        setTheme={setTheme}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onResetView={handleResetView}
        ruler={ruler}
        setRuler={setRuler}
        compass={compass}
        setCompass={setCompass}
        protractor={protractor}
        setProtractor={setProtractor}
        setSquare={setSquare}
        setSetSquare={setSetSquare}
        onLoadPreset={handleLoadPreset}
        onOpenEuclidTutor={() => setIsEuclidTutorOpen(true)}
        onOpenAiDgsModal={() => {
          const key = getStoredApiKey();
          if (!key) {
            setIsApiKeyModalOpen(true);
          } else {
            setIsAiDgsModalOpen(true);
          }
        }}
        onOpenQuestModal={() => setIsQuestModalOpen(true)}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
        onQuickPolygonPreset={handleQuickPolygonPreset}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isToolbarVisible={isToolbarVisible}
        setIsToolbarVisible={setIsToolbarVisible}
      />

      {/* 2. DGS Vector Geometry Canvas */}
      <DgsCanvas
        points={points}
        lines={lines}
        circles={circles}
        polygons={polygons}
        angles={angles}
        texts={texts}
        arcs={arcs}
        toolMode={toolMode}
        theme={theme}
        showGrid={showGrid}
        showAxes={showAxes}
        snapToGrid={snapToGrid}
        transform={transform}
        setTransform={setTransform}
        onUpdatePoint={handleUpdatePoint}
        onSelectElement={(type, id) => {
          setSelectedType(type);
          setSelectedId(id);
        }}
        onCreatePoint={handleCreatePoint}
        onCreateLine={handleCreateLine}
        onCreateCircle={handleCreateCircle}
        onCreatePolygon={handleCreatePolygon}
        onCreateAngle={handleCreateAngle}
        onCreateText={handleCreateText}
        onDeleteElement={handleDeleteElement}
      />

      {/* 3. Realistic Interactive Instruments Overlay (Thước kẻ, Compa, Đo độ, Ê-ke) */}
      <InstrumentsOverlay
        ruler={ruler}
        setRuler={setRuler}
        compass={compass}
        setCompass={setCompass}
        protractor={protractor}
        setProtractor={setProtractor}
        setSquare={setSquare}
        setSetSquare={setSetSquare}
        points={points}
        onDrawRulerLine={handleDrawRulerLine}
        onDrawCompassCircle={handleDrawCompassCircle}
      />

      {/* 4. Right Inspector & Measurements Panel */}
      {isSidebarOpen && (
        <InspectorPanel
          points={points}
          lines={lines}
          circles={circles}
          polygons={polygons}
          angles={angles}
          texts={texts}
          selectedType={selectedType}
          selectedId={selectedId}
          onUpdatePointProps={handleUpdatePointProps}
          onUpdateLineProps={handleUpdateLineProps}
          onUpdateCircleProps={handleUpdateCircleProps}
          onUpdateAngleProps={handleUpdateAngleProps}
          onUpdateTextProps={handleUpdateTextProps}
          onDeleteElement={handleDeleteElement}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportJSON={handleExportJSON}
          onExportWordDoc={handleExportWordDoc}
          onExportSlideDeck={handleExportSlideDeck}
          onImportJSON={handleImportJSON}
          isToolbarVisible={isToolbarVisible}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 5. Euclid Construction Tutor Modal */}
      <EuclidTutorModal
        isOpen={isEuclidTutorOpen}
        onClose={() => setIsEuclidTutorOpen(false)}
        onLoadTutorialPreset={handleLoadPreset}
      />

      {/* 6. AI Thầy Minh Consultation Modal */}
      <AiDgsModal
        isOpen={isAiDgsModalOpen}
        onClose={() => setIsAiDgsModalOpen(false)}
        points={points}
        lines={lines}
        circles={circles}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onApplyShape={handleApplyAiShape}
      />

      {/* 7. Gemini Model & API Key Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        isMandatory={!getStoredApiKey()}
      />

      {/* 8. Euclid Quest Gamification Modal */}
      <EuclidQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        points={points}
        lines={lines}
        circles={circles}
        onStartQuest={handleStartQuest}
      />

      {/* Bottom Status & Coordinate Bar */}
      <div className="absolute bottom-3 left-3 z-30 pointer-events-none flex items-center gap-2">
        <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Thầy Minh - vẽ hình v1.0
          </span>
          <span className="text-slate-400">|</span>
          <span className="capitalize">Chế độ: {theme === 'chalkboard' ? 'Bảng Đen Phấn Trắng' : theme === 'blueprint' ? 'Bản Vẽ Kỹ Thuật' : 'Sáng Tiêu Chuẩn'}</span>
          <span className="text-slate-400">|</span>
          <span>Tỉ lệ: 1 cm = {PIXELS_PER_CM}px</span>
          <span className="text-slate-400">|</span>
          <span>Thu phóng: {Math.round(transform.zoom * 100)}%</span>
          <span className="text-slate-400">|</span>
          <button
            type="button"
            onClick={() => setIsToolbarVisible((v) => !v)}
            className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            title="Ẩn hoặc Hiện thanh công cụ (Phím tắt: Ctrl + H)"
          >
            {isToolbarVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isToolbarVisible ? 'Ẩn thanh công cụ' : 'Hiện thanh công cụ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
