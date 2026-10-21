import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  Vector2D,
  SnapTarget,
} from '../types/geometry';
import {
  dist,
  twoPointsToLine,
  lineLineIntersection,
  lineCircleIntersection,
  circleCircleIntersection,
  projectPointOnSegment,
  projectPointOnCircle,
  getPerpendicularBisectorCoords,
  getAngleBisectorCoords,
} from './geometryEngine';

const SNAP_DIST_POINT = 14;
const SNAP_DIST_INTERSECTION = 14;
const SNAP_DIST_OBJECT = 10;
const GRID_STEP = 20; // 0.5 cm in pixels

export function findSnapTarget(
  cursor: Vector2D,
  points: GeoPoint[],
  lines: GeoLine[],
  circles: GeoCircle[],
  options: {
    snapToGrid?: boolean;
    ignorePointId?: string;
  } = {}
): SnapTarget | null {
  const pointMap = new Map<string, GeoPoint>();
  points.forEach((p) => pointMap.set(p.id, p));

  // 1. Prioritize Existing Points (Đỉnh, Điểm đã có)
  let bestPoint: GeoPoint | null = null;
  let minPointDist = SNAP_DIST_POINT;
  for (const p of points) {
    if (options.ignorePointId && p.id === options.ignorePointId) continue;
    const d = dist(cursor, p);
    if (d < minPointDist) {
      minPointDist = d;
      bestPoint = p;
    }
  }

  if (bestPoint) {
    return {
      point: { x: bestPoint.x, y: bestPoint.y },
      type: 'point',
      label: `Điểm ${bestPoint.name}`,
      targetId: bestPoint.id,
    };
  }

  // 2. High Priority: Intersections (Giao điểm giữa các đường và đường tròn)
  const candidateIntersections: { pt: Vector2D; desc: string }[] = [];

  // Line-to-line intersections
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const l1 = getLineGeneralForm(lines[i], pointMap);
      const l2 = getLineGeneralForm(lines[j], pointMap);
      if (l1 && l2) {
        const inter = lineLineIntersection(l1, l2);
        if (inter) {
          candidateIntersections.push({
            pt: inter,
            desc: 'Giao điểm 2 đường thẳng',
          });
        }
      }
    }
  }

  // Line-to-circle intersections
  for (const line of lines) {
    const lForm = getLineGeneralForm(line, pointMap);
    if (!lForm) continue;

    for (const circle of circles) {
      const center = pointMap.get(circle.centerId);
      if (!center) continue;
      const radius = getCircleRadius(circle, pointMap);
      if (radius <= 0) continue;

      const inters = lineCircleIntersection(lForm, center, radius);
      inters.forEach((pt) => {
        candidateIntersections.push({
          pt,
          desc: 'Giao điểm đường & đường tròn',
        });
      });
    }
  }

  // Circle-to-circle intersections
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const c1 = pointMap.get(circles[i].centerId);
      const c2 = pointMap.get(circles[j].centerId);
      if (!c1 || !c2) continue;
      const r1 = getCircleRadius(circles[i], pointMap);
      const r2 = getCircleRadius(circles[j], pointMap);
      if (r1 <= 0 || r2 <= 0) continue;

      const inters = circleCircleIntersection(c1, r1, c2, r2);
      inters.forEach((pt) => {
        candidateIntersections.push({
          pt,
          desc: 'Giao điểm 2 đường tròn',
        });
      });
    }
  }

  let bestInter: Vector2D | null = null;
  let minInterDist = SNAP_DIST_INTERSECTION;
  let interLabel = 'Giao điểm';

  for (const cand of candidateIntersections) {
    const d = dist(cursor, cand.pt);
    if (d < minInterDist) {
      minInterDist = d;
      bestInter = cand.pt;
      interLabel = cand.desc;
    }
  }

  if (bestInter) {
    return {
      point: bestInter,
      type: 'intersection',
      label: interLabel,
    };
  }

  // 3. Point on Object (Điểm thuộc đối tượng - Đoạn thẳng, đường tròn)
  let bestObjPoint: Vector2D | null = null;
  let minObjDist = SNAP_DIST_OBJECT;
  let objLabel = '';
  let objId = '';

  for (const line of lines) {
    const p1 = pointMap.get(line.p1Id);
    if (!p1) continue;

    if (line.type === 'segment') {
      const p2 = line.p2Id ? pointMap.get(line.p2Id) : null;
      if (p2) {
        const { proj, dist: d } = projectPointOnSegment(cursor, p1, p2);
        if (d < minObjDist) {
          minObjDist = d;
          bestObjPoint = proj;
          objLabel = `Thuộc đoạn [${p1.name}${p2.name}]`;
          objId = line.id;
        }
      }
    } else if (line.type === 'perpendicular_bisector') {
      const p2 = line.p2Id ? pointMap.get(line.p2Id) : null;
      if (p2) {
        const coords = getPerpendicularBisectorCoords(p1, p2);
        const { proj, dist: d } = projectPointOnSegment(cursor, coords.start, coords.end);
        if (d < minObjDist) {
          minObjDist = d;
          bestObjPoint = proj;
          objLabel = `Thuộc trung trực [${p1.name}${p2.name}]`;
          objId = line.id;
        }
      }
    }
  }

  for (const circle of circles) {
    const center = pointMap.get(circle.centerId);
    if (!center) continue;
    const radius = getCircleRadius(circle, pointMap);
    if (radius <= 0) continue;

    const { proj, dist: d } = projectPointOnCircle(cursor, center, radius);
    if (d < minObjDist) {
      minObjDist = d;
      bestObjPoint = proj;
      objLabel = `Thuộc đường tròn (${center.name})`;
      objId = circle.id;
    }
  }

  if (bestObjPoint) {
    return {
      point: bestObjPoint,
      type: 'object',
      label: objLabel,
      targetId: objId,
    };
  }

  // 4. Grid Snapping (Lưới tọa độ)
  if (options.snapToGrid) {
    const gridX = Math.round(cursor.x / GRID_STEP) * GRID_STEP;
    const gridY = Math.round(cursor.y / GRID_STEP) * GRID_STEP;
    if (dist(cursor, { x: gridX, y: gridY }) < GRID_STEP * 0.4) {
      return {
        point: { x: gridX, y: gridY },
        type: 'grid',
        label: `Lưới (${(gridX / 40).toFixed(1)}, ${(-gridY / 40).toFixed(1)}) cm`,
      };
    }
  }

  return null;
}

function getCircleRadius(circle: GeoCircle, pointMap: Map<string, GeoPoint>): number {
  if (circle.radiusValue) return circle.radiusValue;
  if (circle.pointOnCircleId) {
    const c = pointMap.get(circle.centerId);
    const p = pointMap.get(circle.pointOnCircleId);
    if (c && p) return dist(c, p);
  }
  return 0;
}

function getLineGeneralForm(
  line: GeoLine,
  pointMap: Map<string, GeoPoint>
) {
  const p1 = pointMap.get(line.p1Id);
  if (!p1) return null;

  if (line.p2Id) {
    const p2 = pointMap.get(line.p2Id);
    if (!p2) return null;
    if (line.type === 'perpendicular_bisector') {
      const coords = getPerpendicularBisectorCoords(p1, p2);
      return twoPointsToLine(coords.start, coords.end);
    }
    return twoPointsToLine(p1, p2);
  }

  if (line.type === 'angle_bisector' && line.vertexId && line.p2Id) {
    const vertex = pointMap.get(line.vertexId);
    const p2 = pointMap.get(line.p2Id);
    if (vertex && p2) {
      const coords = getAngleBisectorCoords(p1, vertex, p2);
      return twoPointsToLine(coords.start, coords.end);
    }
  }

  return null;
}
