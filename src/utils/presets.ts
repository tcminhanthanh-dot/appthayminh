import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoPolygon,
  GeoAngle,
  GeoConstructionArc,
} from '../types/geometry';

export interface PresetDemo {
  id: string;
  title: string;
  subtitle: string;
  grade: string;
  description: string;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
  angles: GeoAngle[];
  arcs?: GeoConstructionArc[];
  rulerState?: { active: boolean; x: number; y: number; angle: number };
  compassState?: { active: boolean; needlePos: { x: number; y: number }; radius: number };
}

export const PRESET_DEMOS: PresetDemo[] = [
  {
    id: 'pythagoras',
    title: 'Định Lý Pythagore (a² + b² = c²)',
    subtitle: 'Mô phỏng hình học bằng diện tích hình vuông dựng trên 3 cạnh',
    grade: 'Toán Lớp 7 - 8',
    description:
      'Trong một tam giác vuông, bình phương độ dài cạnh huyền bằng tổng bình phương độ dài hai cạnh góc vuông. Kéo rê các đỉnh để quan sát diện tích các hình vuông biến đổi đồng thời thỏa mãn a² + b² = c²!',
    points: [
      { id: 'pA', name: 'A', x: 250, y: 350, parentType: 'free', color: '#ef4444', size: 6, visible: true, showLabel: true },
      { id: 'pB', name: 'B', x: 410, y: 350, parentType: 'free', color: '#3b82f6', size: 6, visible: true, showLabel: true },
      { id: 'pC', name: 'C', x: 250, y: 230, parentType: 'free', color: '#10b981', size: 6, visible: true, showLabel: true },
      // Square on AC (leg 1)
      { id: 'sqAC1', name: 'C₁', x: 130, y: 230, parentType: 'free', color: '#64748b', size: 4, visible: false, showLabel: false },
      { id: 'sqAC2', name: 'A₁', x: 130, y: 350, parentType: 'free', color: '#64748b', size: 4, visible: false, showLabel: false },
      // Square on AB (leg 2)
      { id: 'sqAB1', name: 'A₂', x: 250, y: 510, parentType: 'free', color: '#64748b', size: 4, visible: false, showLabel: false },
      { id: 'sqAB2', name: 'B₁', x: 410, y: 510, parentType: 'free', color: '#64748b', size: 4, visible: false, showLabel: false },
      // Square on BC (hypotenuse)
      { id: 'sqBC1', name: 'C₂', x: 370, y: 70, parentType: 'free', color: '#64748b', size: 4, visible: false, showLabel: false },
      { id: 'sqBC2', name: 'B₂', x: 530, y: 190, parentType: 'free', color: '#64748b', size: 4, visible: false, showLabel: false },
    ],
    lines: [
      { id: 'l_AB', type: 'segment', p1Id: 'pA', p2Id: 'pB', color: '#2563eb', strokeWidth: 3, visible: true, showMeasure: true },
      { id: 'l_AC', type: 'segment', p1Id: 'pA', p2Id: 'pC', color: '#16a34a', strokeWidth: 3, visible: true, showMeasure: true },
      { id: 'l_BC', type: 'segment', p1Id: 'pB', p2Id: 'pC', color: '#dc2626', strokeWidth: 3.5, visible: true, showMeasure: true },
      // Squares edges
      { id: 'l_sq1', type: 'segment', p1Id: 'pC', p2Id: 'sqAC1', color: '#16a34a', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq2', type: 'segment', p1Id: 'sqAC1', p2Id: 'sqAC2', color: '#16a34a', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq3', type: 'segment', p1Id: 'sqAC2', p2Id: 'pA', color: '#16a34a', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq4', type: 'segment', p1Id: 'pA', p2Id: 'sqAB1', color: '#2563eb', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq5', type: 'segment', p1Id: 'sqAB1', p2Id: 'sqAB2', color: '#2563eb', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq6', type: 'segment', p1Id: 'sqAB2', p2Id: 'pB', color: '#2563eb', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq7', type: 'segment', p1Id: 'pC', p2Id: 'sqBC1', color: '#dc2626', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq8', type: 'segment', p1Id: 'sqBC1', p2Id: 'sqBC2', color: '#dc2626', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_sq9', type: 'segment', p1Id: 'sqBC2', p2Id: 'pB', color: '#dc2626', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
    ],
    circles: [],
    polygons: [
      { id: 'poly_main', pointIds: ['pA', 'pB', 'pC'], color: '#4f46e5', strokeWidth: 2, fillColor: '#6366f1', fillOpacity: 0.15, visible: true, showArea: true },
      { id: 'poly_sqAC', pointIds: ['pA', 'pC', 'sqAC1', 'sqAC2'], color: '#16a34a', strokeWidth: 1.5, fillColor: '#22c55e', fillOpacity: 0.25, visible: true, showArea: true },
      { id: 'poly_sqAB', pointIds: ['pA', 'pB', 'sqAB2', 'sqAB1'], color: '#2563eb', strokeWidth: 1.5, fillColor: '#3b82f6', fillOpacity: 0.25, visible: true, showArea: true },
      { id: 'poly_sqBC', pointIds: ['pB', 'pC', 'sqBC1', 'sqBC2'], color: '#dc2626', strokeWidth: 1.5, fillColor: '#ef4444', fillOpacity: 0.25, visible: true, showArea: true },
    ],
    angles: [
      { id: 'ang_A', p1Id: 'pB', vertexId: 'pA', p2Id: 'pC', color: '#f59e0b', size: 24, showDegrees: true },
    ],
  },
  {
    id: 'euler_line',
    title: 'Đường Thẳng Euler & 4 Điểm Kỳ Diệu Của Tam Giác',
    subtitle: 'Trực tâm H, Trọng tâm G, Tâm ngoại tiếp O luôn thẳng hàng!',
    grade: 'Toán Lớp 7 - 8 Nâng Cao',
    description:
      'Trong tam giác ABC bất kỳ, Trực tâm H (giao 3 đường cao), Trọng tâm G (giao 3 trung tuyến) và Tâm đường tròn ngoại tiếp O (giao 3 đường trung trực) luôn nằm trên một đường thẳng gọi là Đường thẳng Euler, với HG = 2 GO.',
    points: [
      { id: 'pA', name: 'A', x: 260, y: 160, parentType: 'free', color: '#3b82f6', size: 6, visible: true, showLabel: true },
      { id: 'pB', name: 'B', x: 140, y: 420, parentType: 'free', color: '#3b82f6', size: 6, visible: true, showLabel: true },
      { id: 'pC', name: 'C', x: 500, y: 420, parentType: 'free', color: '#3b82f6', size: 6, visible: true, showLabel: true },
      { id: 'ptO', name: 'O (Ngoại tiếp)', x: 320, y: 330, parentType: 'triangle_circumcenter', parentIds: ['pA', 'pB', 'pC'], color: '#06b6d4', size: 6, visible: true, showLabel: true },
      { id: 'ptG', name: 'G (Trọng tâm)', x: 300, y: 333, parentType: 'triangle_centroid', parentIds: ['pA', 'pB', 'pC'], color: '#10b981', size: 6, visible: true, showLabel: true },
      { id: 'ptH', name: 'H (Trực tâm)', x: 260, y: 340, parentType: 'triangle_orthocenter', parentIds: ['pA', 'pB', 'pC'], color: '#ef4444', size: 6, visible: true, showLabel: true },
      { id: 'ptI', name: 'I (Nội tiếp)', x: 290, y: 340, parentType: 'triangle_incenter', parentIds: ['pA', 'pB', 'pC'], color: '#8b5cf6', size: 5, visible: true, showLabel: true },
    ],
    lines: [
      { id: 'l_AB', type: 'segment', p1Id: 'pA', p2Id: 'pB', color: '#1e293b', strokeWidth: 2.5, visible: true, showMeasure: true },
      { id: 'l_BC', type: 'segment', p1Id: 'pB', p2Id: 'pC', color: '#1e293b', strokeWidth: 2.5, visible: true, showMeasure: true },
      { id: 'l_CA', type: 'segment', p1Id: 'pC', p2Id: 'pA', color: '#1e293b', strokeWidth: 2.5, visible: true, showMeasure: true },
      // Euler Line
      { id: 'l_euler', type: 'line', p1Id: 'ptH', p2Id: 'ptO', color: '#e11d48', strokeWidth: 3, lineDash: '6,4', visible: true, showMeasure: false },
    ],
    circles: [
      { id: 'circ_out', type: 'triangle_circumcircle', centerId: 'ptO', trianglePointIds: ['pA', 'pB', 'pC'], color: '#06b6d4', strokeWidth: 2, lineDash: '4,4', fillColor: '#06b6d4', fillOpacity: 0.05, visible: true, showMeasure: true },
      { id: 'circ_in', type: 'triangle_incircle', centerId: 'ptI', trianglePointIds: ['pA', 'pB', 'pC'], color: '#8b5cf6', strokeWidth: 1.5, lineDash: '3,3', fillColor: '#8b5cf6', fillOpacity: 0.05, visible: true, showMeasure: true },
    ],
    polygons: [
      { id: 'poly_triangle', pointIds: ['pA', 'pB', 'pC'], color: '#3b82f6', strokeWidth: 2, fillColor: '#3b82f6', fillOpacity: 0.08, visible: true, showArea: true },
    ],
    angles: [],
  },
  {
    id: 'inscribed_angle',
    title: 'Góc Nội Tiếp & Góc Ở Tâm (Hình Học Lớp 9)',
    subtitle: 'Góc nội tiếp cùng chắn một cung bằng nửa số đo góc ở tâm',
    grade: 'Toán Lớp 9',
    description:
      'Góc ở tâm ∠BOC = 2 ∠BAC khi cả hai cùng chắn cung nhỏ BC. Bạn hãy thử kéo điểm A chạy vòng quanh đường tròn: số đo góc ∠BAC luôn được giữ nguyên tuyệt đối!',
    points: [
      { id: 'ptO', name: 'O', x: 350, y: 300, parentType: 'free', color: '#6366f1', size: 6, visible: true, showLabel: true },
      { id: 'ptB', name: 'B', x: 230, y: 390, parentType: 'free', color: '#3b82f6', size: 6, visible: true, showLabel: true },
      { id: 'ptC', name: 'C', x: 470, y: 390, parentType: 'free', color: '#3b82f6', size: 6, visible: true, showLabel: true },
      { id: 'ptA', name: 'A', x: 350, y: 150, parentType: 'free', color: '#ef4444', size: 7, visible: true, showLabel: true },
    ],
    lines: [
      { id: 'l_AB', type: 'segment', p1Id: 'ptA', p2Id: 'ptB', color: '#ef4444', strokeWidth: 2.5, visible: true, showMeasure: false },
      { id: 'l_AC', type: 'segment', p1Id: 'ptA', p2Id: 'ptC', color: '#ef4444', strokeWidth: 2.5, visible: true, showMeasure: false },
      { id: 'l_OB', type: 'segment', p1Id: 'ptO', p2Id: 'ptB', color: '#8b5cf6', strokeWidth: 2, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_OC', type: 'segment', p1Id: 'ptO', p2Id: 'ptC', color: '#8b5cf6', strokeWidth: 2, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'l_BC', type: 'segment', p1Id: 'ptB', p2Id: 'ptC', color: '#10b981', strokeWidth: 2, visible: true, showMeasure: true },
    ],
    circles: [
      { id: 'circ_main', type: 'center_radius', centerId: 'ptO', radiusValue: 150, color: '#3b82f6', strokeWidth: 2, visible: true, showMeasure: true },
    ],
    polygons: [],
    angles: [
      { id: 'ang_inscribed', p1Id: 'ptB', vertexId: 'ptA', p2Id: 'ptC', color: '#ef4444', size: 30, showDegrees: true },
      { id: 'ang_central', p1Id: 'ptB', vertexId: 'ptO', p2Id: 'ptC', color: '#8b5cf6', size: 40, showDegrees: true },
    ],
  },
  {
    id: 'euclid_bisector',
    title: 'Dựng Đường Trung Trực Bằng Thước & Compa (Thuật Toán Euclid)',
    subtitle: 'Bài học kinh điển dựng hình cổ điển trong Toán 6 - 7',
    grade: 'Toán Lớp 6 - 7',
    description:
      'Quy trình dựng hình chuẩn xác: (1) Đặt compa tại A quay cung tròn bán kính R > AB/2; (2) Đặt compa tại B quay cung tròn cùng bán kính R; (3) Nối hai giao điểm P và Q ta được đường trung trực của đoạn AB.',
    points: [
      { id: 'pA', name: 'A', x: 220, y: 320, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'pB', name: 'B', x: 460, y: 320, parentType: 'free', color: '#2563eb', size: 6, visible: true, showLabel: true },
      { id: 'pM', name: 'M (Trung điểm)', x: 340, y: 320, parentType: 'midpoint', parentIds: ['pA', 'pB'], color: '#10b981', size: 5, visible: true, showLabel: true },
      { id: 'pP', name: 'P', x: 340, y: 200, parentType: 'free', color: '#8b5cf6', size: 5, visible: true, showLabel: true },
      { id: 'pQ', name: 'Q', x: 340, y: 440, parentType: 'free', color: '#8b5cf6', size: 5, visible: true, showLabel: true },
    ],
    lines: [
      { id: 'l_AB', type: 'segment', p1Id: 'pA', p2Id: 'pB', color: '#1e293b', strokeWidth: 3, visible: true, showMeasure: true },
      { id: 'l_bisector', type: 'line', p1Id: 'pP', p2Id: 'pQ', color: '#ef4444', strokeWidth: 2.5, lineDash: '6,4', visible: true, showMeasure: false },
    ],
    circles: [
      { id: 'circ_A', type: 'center_radius', centerId: 'pA', radiusValue: 160, color: '#93c5fd', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
      { id: 'circ_B', type: 'center_radius', centerId: 'pB', radiusValue: 160, color: '#93c5fd', strokeWidth: 1.5, lineDash: '4,4', visible: true, showMeasure: false },
    ],
    polygons: [],
    angles: [
      { id: 'ang_right', p1Id: 'pB', vertexId: 'pM', p2Id: 'pP', color: '#ef4444', size: 20, showDegrees: true },
    ],
    rulerState: { active: true, x: 260, y: 320, angle: 90 },
    compassState: { active: true, needlePos: { x: 220, y: 320 }, radius: 160 },
  },
];
