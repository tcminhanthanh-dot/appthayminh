export type ToolMode =
  | 'select'
  | 'pan'
  | 'delete'
  | 'point'
  | 'midpoint'
  | 'intersection'
  | 'segment'
  | 'line'
  | 'ray'
  | 'perpendicular'
  | 'parallel'
  | 'perpendicular_bisector'
  | 'angle_bisector'
  | 'circle_center_point'
  | 'circle_center_radius'
  | 'circle_three_points'
  | 'triangle_circumcircle'
  | 'triangle_incircle'
  | 'polygon'
  | 'measure_distance'
  | 'measure_angle'
  | 'measure_area'
  | 'text'
  | 'instrument_ruler'
  | 'instrument_compass'
  | 'instrument_protractor'
  | 'instrument_setsquare';

export type CanvasTheme = 'light' | 'chalkboard' | 'blueprint';

export interface GeoText {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
  showBox?: boolean;
  selected?: boolean;
}

export interface EuclidQuestLevel {
  id: string;
  title: string;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  hint: string;
  initialPoints: GeoPoint[];
  initialLines?: GeoLine[];
  initialCircles?: GeoCircle[];
  targetDescription: string;
  checkCompletion: (points: GeoPoint[], lines: GeoLine[], circles: GeoCircle[]) => { completed: boolean; score: number; message: string };
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface GeoPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  isFixed?: boolean;
  parentType: 'free' | 'midpoint' | 'intersection' | 'point_on_object' | 'triangle_circumcenter' | 'triangle_incenter' | 'triangle_centroid' | 'triangle_orthocenter';
  parentIds?: string[];
  color: string;
  size: number;
  visible: boolean;
  showLabel: boolean;
  selected?: boolean;
}

export type LineType =
  | 'segment'
  | 'line'
  | 'ray'
  | 'perpendicular'
  | 'parallel'
  | 'perpendicular_bisector'
  | 'angle_bisector';

export interface GeoLine {
  id: string;
  type: LineType;
  p1Id: string;
  p2Id?: string; // For segment/ray/line
  throughPointId?: string; // For perpendicular/parallel
  refLineId?: string; // For perpendicular/parallel
  vertexId?: string; // For angle bisector (angle between p1 - vertex - p2)
  color: string;
  strokeWidth: number;
  lineDash?: string;
  visible: boolean;
  showMeasure: boolean;
  ticks?: number; // 0: none, 1: |, 2: ||, 3: |||
  selected?: boolean;
}

export type CircleType =
  | 'center_point'
  | 'center_radius'
  | 'three_points'
  | 'triangle_circumcircle'
  | 'triangle_incircle';

export interface GeoCircle {
  id: string;
  type: CircleType;
  centerId: string;
  pointOnCircleId?: string;
  radiusValue?: number; // In px (40px = 1cm)
  trianglePointIds?: [string, string, string]; // A, B, C for circumcircle/incircle
  color: string;
  strokeWidth: number;
  lineDash?: string;
  fillColor?: string;
  fillOpacity?: number;
  visible: boolean;
  showMeasure: boolean;
  ticks?: number; // 0: none, 1: |, 2: ||, 3: |||
  selected?: boolean;
}

export interface GeoPolygon {
  id: string;
  pointIds: string[];
  color: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
  visible: boolean;
  showArea: boolean;
  selected?: boolean;
}

export interface GeoAngle {
  id: string;
  p1Id: string;
  vertexId: string;
  p2Id: string;
  color: string;
  size: number; // arc radius in px
  showDegrees: boolean;
  arcType?: 'single' | 'double' | 'right_angle';
  selected?: boolean;
}

export interface GeoConstructionArc {
  id: string;
  center: Vector2D;
  radius: number;
  startAngle: number; // radians
  endAngle: number; // radians
  color: string;
  strokeWidth: number;
  dashed?: boolean;
}

export interface SnapTarget {
  point: Vector2D;
  type: 'point' | 'intersection' | 'object' | 'grid';
  label: string;
  targetId?: string;
}

export interface RulerInstrument {
  active: boolean;
  x: number;
  y: number;
  angle: number; // in degrees
  lengthPx: number; // default 400px = 10cm
}

export interface CompassInstrument {
  active: boolean;
  needlePos: Vector2D;
  pencilAngle: number; // angle relative to horizontal in radians
  radius: number; // in pixels
  isDrawing: boolean;
}

export interface ProtractorInstrument {
  active: boolean;
  x: number;
  y: number;
  angle: number; // in degrees
  radius: number; // in pixels, e.g. 150px
}

export interface SetSquareInstrument {
  active: boolean;
  x: number;
  y: number;
  angle: number; // in degrees
  type: '45-45' | '30-60';
  scale: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}
