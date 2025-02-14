export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function get_closest_rect(rects: Rect[], point: Point) {
  let closest_rect: Rect = rects[0]; // 假设数组不为空
  let min_distance_sq = Infinity;

  let rect_index = 0;
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    // 计算矩形的边界，处理宽高为负的情况
    const x1 = Math.min(rect.x, rect.x + rect.width);
    const x2 = Math.max(rect.x, rect.x + rect.width);
    const y1 = Math.min(rect.y, rect.y + rect.height);
    const y2 = Math.max(rect.y, rect.y + rect.height);

    // 计算点到矩形的最近点坐标
    const clampedX = Math.max(x1, Math.min(point.x, x2));
    const clampedY = Math.max(y1, Math.min(point.y, y2));

    // 计算距离平方
    const dx = point.x - clampedX;
    const dy = point.y - clampedY;
    const distance_sq = dx * dx + dy * dy;

    // 如果点在矩形内，直接返回当前矩形
    if (distance_sq === 0) {
      rect_index = i;
      break;
    }

    // 更新最小距离和最近矩形
    if (distance_sq < min_distance_sq) {
      min_distance_sq = distance_sq;
      closest_rect = rect;
      rect_index = i;
    }
  }

  return { rect_index, min_distance_sq };
}
