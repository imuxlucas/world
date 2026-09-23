type Point = { x: number; y: number };

function rectangle(width: number, height: number, radius: number, angle: number): Point[] {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({
    x: (radius + x * width / 2) * cos - y * height / 2 * sin,
    y: (radius + x * width / 2) * sin + y * height / 2 * cos,
  }));
}

function pointToEdge(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}

// True edge-to-edge distance, including cards with different aspect ratios.
export function orbitCardDistance(width: number, heightA: number, heightB: number, radius: number, angle: number) {
  const a = rectangle(width, heightA, radius, 0), b = rectangle(width, heightB, radius, angle);
  let separated = false;
  for (const polygon of [a, b]) for (let i = 0; i < 2; i++) {
    const normal = { x: polygon[i].y - polygon[i + 1].y, y: polygon[i + 1].x - polygon[i].x };
    const pa = a.map(p => p.x * normal.x + p.y * normal.y);
    const pb = b.map(p => p.x * normal.x + p.y * normal.y);
    if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) separated = true;
  }
  if (!separated) return 0;
  let distance = Infinity;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    distance = Math.min(distance, pointToEdge(a[i], b[j], b[(j + 1) % 4]), pointToEdge(b[i], a[j], a[(j + 1) % 4]));
  }
  return distance;
}

export const ORBIT_CARD_GAP = 8;

export function layoutOrbit(width: number, heights: number[], gap = ORBIT_CARD_GAP) {
  const stepsAt = (radius: number) => {
    const cache = new Map<string, number>();
    return heights.map((height, index) => {
      const next = heights[(index + 1) % heights.length];
      const key = `${Math.min(height, next)}:${Math.max(height, next)}`;
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
      // Equal-height neighbors have a closed-form solution; most cards share one ratio.
      if (height === next) {
        const span = 2 * radius - width;
        const angle = 2 * (Math.atan2(height, span) + Math.asin(Math.min(1, gap / Math.hypot(span, height))));
        cache.set(key, angle);
        return angle;
      }
      let low = 0, high = Math.PI;
      for (let iteration = 0; iteration < 26; iteration++) {
        const angle = (low + high) / 2;
        if (orbitCardDistance(width, height, next, radius, angle) < gap) low = angle;
        else high = angle;
      }
      const angle = (low + high) / 2;
      cache.set(key, angle);
      return angle;
    });
  };
  let low = width / 2 + .01, high = (width + Math.max(...heights) + gap) * heights.length;
  for (let iteration = 0; iteration < 28; iteration++) {
    const radius = (low + high) / 2;
    if (stepsAt(radius).reduce((sum, angle) => sum + angle, 0) > Math.PI * 2) low = radius;
    else high = radius;
  }
  const radius = (low + high) / 2;
  let angle = 0;
  const angles = stepsAt(radius).map(step => { const current = angle; angle += step * 180 / Math.PI; return current; });
  return { radius, angles };
}
