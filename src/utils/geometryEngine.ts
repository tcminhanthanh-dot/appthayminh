import { GeoPoint, GeoLine, GeoCircle, GeoPolygon, Vector2D } from '../types/geometry';

export const PIXELS_PER_CM = 40; // 40px = 1cm (1px = 0.25mm)
export const EPSILON = 1e-7;

export function dist(p1: Vector2D, p2: Vector2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function distToCm(px: number): number {
  return px / PIXELS_PER_CM;
}

export function cmToDist(cm: number): number {
  return cm * PIXELS_PER_CM;
}

export function midpoint(p1: Vector2D, p2: Vector2D): Vector2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function angleBetween(p1: Vector2D, vertex: Vector2D, p2: Vector2D): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 < EPSILON || mag2 < EPSILON) return 0;
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

export function signedAngle(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

/** Line represented as Ax + By + C = 0 */
export interface GeneralLine {
  a: number;
  b: number;
  c: number;
}

export function twoPointsToLine(p1: Vector2D, p2: Vector2D): GeneralLine | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.hypot(dx, dy) < EPSILON) return null;
  // Normal vector: (-dy, dx)
  const a = -dy;
  const b = dx;
  const c = -(a * p1.x + b * p1.y);
  return { a, b, c };
}

export function lineLineIntersection(l1: GeneralLine, l2: GeneralLine): Vector2D | null {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < EPSILON) return null; // Parallel or coincident
  const x = (l1.b * l2.c - l2.b * l1.c) / det;
  const y = (l2.a * l1.c - l1.a * l2.c) / det;
  return { x, y };
}

export function lineCircleIntersection(
  line: GeneralLine,
  center: Vector2D,
  radius: number
): Vector2D[] {
  const { a, b, c } = line;
  const norm = Math.hypot(a, b);
  if (norm < EPSILON) return [];
  // Distance from center to line
  const distToLine = Math.abs(a * center.x + b * center.y + c) / norm;
  if (distToLine > radius + EPSILON) return [];

  // Foot of perpendicular from center to line
  const x0 = center.x - (a * (a * center.x + b * center.y + c)) / (norm * norm);
  const y0 = center.y - (b * (a * center.x + b * center.y + c)) / (norm * norm);

  if (Math.abs(distToLine - radius) < 1e-4) {
    return [{ x: x0, y: y0 }];
  }

  const d = Math.sqrt(Math.max(0, radius * radius - distToLine * distToLine));
  const mult = d / norm;

  // Tangent vector: (-b, a)
  return [
    { x: x0 + -b * mult, y: y0 + a * mult },
    { x: x0 - -b * mult, y: y0 - a * mult },
  ];
}

export function circleCircleIntersection(
  c1: Vector2D,
  r1: number,
  c2: Vector2D,
  r2: number
): Vector2D[] {
  const d = dist(c1, c2);
  if (d < EPSILON) return []; // Concentric
  if (d > r1 + r2 || d < Math.abs(r1 - r2)) return []; // No intersection

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const x2 = c1.x + (a * (c2.x - c1.x)) / d;
  const y2 = c1.y + (a * (c2.y - c1.y)) / d;

  if (Math.abs(h) < EPSILON) {
    return [{ x: x2, y: y2 }];
  }

  const rx = -(c2.y - c1.y) * (h / d);
  const ry = (c2.x - c1.x) * (h / d);

  return [
    { x: x2 + rx, y: y2 + ry },
    { x: x2 - rx, y: y2 - ry },
  ];
}

/** Circumcenter of 3 points (Tâm đường tròn ngoại tiếp) */
export function triangleCircumcenter(A: Vector2D, B: Vector2D, C: Vector2D): { center: Vector2D; radius: number } | null {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (Math.abs(d) < EPSILON) return null; // Collinear

  const aSq = A.x * A.x + A.y * A.y;
  const bSq = B.x * B.x + B.y * B.y;
  const cSq = C.x * C.x + C.y * C.y;

  const ux = (aSq * (B.y - C.y) + bSq * (C.y - A.y) + cSq * (A.y - B.y)) / d;
  const uy = (aSq * (C.x - B.x) + bSq * (A.x - C.x) + cSq * (B.x - A.x)) / d;

  const center = { x: ux, y: uy };
  return { center, radius: dist(center, A) };
}

/** Incenter of triangle (Tâm đường tròn nội tiếp) */
export function triangleIncenter(A: Vector2D, B: Vector2D, C: Vector2D): { center: Vector2D; radius: number } | null {
  const a = dist(B, C);
  const b = dist(A, C);
  const c = dist(A, B);
  const p = a + b + c;
  if (p < EPSILON) return null;

  const incenter = {
    x: (a * A.x + b * B.x + c * C.x) / p,
    y: (a * A.y + b * B.y + c * C.y) / p,
  };

  // Semi-perimeter
  const s = p / 2;
  const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
  const radius = area / s;

  return { center: incenter, radius };
}

/** Centroid of triangle (Trọng tâm G) */
export function triangleCentroid(A: Vector2D, B: Vector2D, C: Vector2D): Vector2D {
  return {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3,
  };
}

/** Orthocenter of triangle (Trực tâm H) */
export function triangleOrthocenter(A: Vector2D, B: Vector2D, C: Vector2D): Vector2D | null {
  // G = (2/3)O + (1/3)H in Euler line, or intersection of altitudes
  const circum = triangleCircumcenter(A, B, C);
  if (!circum) return null;
  const O = circum.center;
  // H = 3G - 2O = (A + B + C) - 2O
  return {
    x: A.x + B.x + C.x - 2 * O.x,
    y: A.y + B.y + C.y - 2 * O.y,
  };
}

/** Perpendicular bisector endpoints for rendering */
export function getPerpendicularBisectorCoords(
  p1: Vector2D,
  p2: Vector2D,
  extend = 2000
): { start: Vector2D; end: Vector2D; mid: Vector2D } {
  const mid = midpoint(p1, p2);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < EPSILON) {
    return { start: mid, end: mid, mid };
  }
  // Normal vector: (-dy/len, dx/len)
  const nx = -dy / len;
  const ny = dx / len;
  return {
    mid,
    start: { x: mid.x - nx * extend, y: mid.y - ny * extend },
    end: { x: mid.x + nx * extend, y: mid.y + ny * extend },
  };
}

/** Angle bisector ray direction from vertex */
export function getAngleBisectorCoords(
  p1: Vector2D,
  vertex: Vector2D,
  p2: Vector2D,
  extend = 2000
): { start: Vector2D; end: Vector2D } {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  const len1 = Math.hypot(v1.x, v1.y);
  const len2 = Math.hypot(v2.x, v2.y);
  if (len1 < EPSILON || len2 < EPSILON) {
    return { start: vertex, end: vertex };
  }
  const u1 = { x: v1.x / len1, y: v1.y / len1 };
  const u2 = { x: v2.x / len2, y: v2.y / len2 };
  const bisectorDir = { x: u1.x + u2.x, y: u1.y + u2.y };
  const bLen = Math.hypot(bisectorDir.x, bisectorDir.y);
  if (bLen < EPSILON) {
    // Vectors are opposite, perpendicular bisector is one of them rotated 90
    return {
      start: vertex,
      end: { x: vertex.x - u1.y * extend, y: vertex.y + u1.x * extend },
    };
  }
  const bx = bisectorDir.x / bLen;
  const by = bisectorDir.y / bLen;
  return {
    start: vertex,
    end: { x: vertex.x + bx * extend, y: vertex.y + by * extend },
  };
}

/** Polygon Area (Shoelace Formula) */
export function calculatePolygonArea(pts: Vector2D[]): number {
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

/** Polygon Perimeter */
export function calculatePolygonPerimeter(pts: Vector2D[]): number {
  if (pts.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    perimeter += dist(pts[i], pts[j]);
  }
  return perimeter;
}

/** Point projection on segment */
export function projectPointOnSegment(p: Vector2D, a: Vector2D, b: Vector2D): { proj: Vector2D; dist: number; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < EPSILON) {
    return { proj: a, dist: dist(p, a), t: 0 };
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return { proj, dist: dist(p, proj), t };
}

/** Point projection on circle perimeter */
export function projectPointOnCircle(p: Vector2D, center: Vector2D, radius: number): { proj: Vector2D; dist: number } {
  const d = dist(p, center);
  if (d < EPSILON) {
    return { proj: { x: center.x + radius, y: center.y }, dist: radius };
  }
  const ratio = radius / d;
  const proj = {
    x: center.x + (p.x - center.x) * ratio,
    y: center.y + (p.y - center.y) * ratio,
  };
  return { proj, dist: Math.abs(d - radius) };
}

/** Recompute all dependent points dynamically when parents move */
export function recomputeDependentPoints(
  points: GeoPoint[],
  lines: GeoLine[],
  circles: GeoCircle[]
): GeoPoint[] {
  const pointMap = new Map<string, GeoPoint>();
  points.forEach((p) => pointMap.set(p.id, { ...p }));

  // Multiple passes to resolve cascade dependencies
  for (let pass = 0; pass < 3; pass++) {
    points.forEach((p) => {
      const current = pointMap.get(p.id)!;
      if (current.parentType === 'midpoint' && current.parentIds?.length === 2) {
        const p1 = pointMap.get(current.parentIds[0]);
        const p2 = pointMap.get(current.parentIds[1]);
        if (p1 && p2) {
          const mid = midpoint(p1, p2);
          current.x = mid.x;
          current.y = mid.y;
        }
      } else if (current.parentType === 'triangle_circumcenter' && current.parentIds?.length === 3) {
        const A = pointMap.get(current.parentIds[0]);
        const B = pointMap.get(current.parentIds[1]);
        const C = pointMap.get(current.parentIds[2]);
        if (A && B && C) {
          const res = triangleCircumcenter(A, B, C);
          if (res) {
            current.x = res.center.x;
            current.y = res.center.y;
          }
        }
      } else if (current.parentType === 'triangle_incenter' && current.parentIds?.length === 3) {
        const A = pointMap.get(current.parentIds[0]);
        const B = pointMap.get(current.parentIds[1]);
        const C = pointMap.get(current.parentIds[2]);
        if (A && B && C) {
          const res = triangleIncenter(A, B, C);
          if (res) {
            current.x = res.center.x;
            current.y = res.center.y;
          }
        }
      } else if (current.parentType === 'triangle_centroid' && current.parentIds?.length === 3) {
        const A = pointMap.get(current.parentIds[0]);
        const B = pointMap.get(current.parentIds[1]);
        const C = pointMap.get(current.parentIds[2]);
        if (A && B && C) {
          const res = triangleCentroid(A, B, C);
          current.x = res.x;
          current.y = res.y;
        }
      } else if (current.parentType === 'triangle_orthocenter' && current.parentIds?.length === 3) {
        const A = pointMap.get(current.parentIds[0]);
        const B = pointMap.get(current.parentIds[1]);
        const C = pointMap.get(current.parentIds[2]);
        if (A && B && C) {
          const res = triangleOrthocenter(A, B, C);
          if (res) {
            current.x = res.x;
            current.y = res.y;
          }
        }
      }
    });
  }

  return Array.from(pointMap.values());
}

/** Perpendicular line through point P to a line segment */
export function getPerpendicularLineThroughPoint(
  P: Vector2D,
  lineP1: Vector2D,
  lineP2: Vector2D,
  extend = 3000
): { start: Vector2D; end: Vector2D; foot: Vector2D } {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const len = Math.hypot(dx, dy);
  if (len < EPSILON) return { start: P, end: P, foot: P };
  const nx = -dy / len;
  const ny = dx / len;
  const { proj: foot } = projectPointOnSegment(P, lineP1, lineP2);
  return {
    start: { x: P.x - nx * extend, y: P.y - ny * extend },
    end: { x: P.x + nx * extend, y: P.y + ny * extend },
    foot,
  };
}

/** Parallel line through point P to a line segment */
export function getParallelLineThroughPoint(
  P: Vector2D,
  lineP1: Vector2D,
  lineP2: Vector2D,
  extend = 3000
): { start: Vector2D; end: Vector2D } {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const len = Math.hypot(dx, dy);
  if (len < EPSILON) return { start: P, end: P };
  const ux = dx / len;
  const uy = dy / len;
  return {
    start: { x: P.x - ux * extend, y: P.y - uy * extend },
    end: { x: P.x + ux * extend, y: P.y + uy * extend },
  };
}

