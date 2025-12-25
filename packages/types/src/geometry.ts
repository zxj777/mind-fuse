export interface Point {
  x: number
  y: number
  readonly __brand: 'Point'
}

export interface Vec2 {
  x: number
  y: number
  readonly __brand: 'Vec2'
}

/**
 * Box - Axis-Aligned Bounding Box (AABB)
 *
 * @remarks
 * Box always represents an axis-aligned rectangle (no rotation).
 * Used for fast collision detection, viewport culling, and selection.
 */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface BoxBounds {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

const getBoxBounds = (box: Box): BoxBounds => {
  const x2: number = box.x + box.width
  const y2: number = box.y + box.height
  return { minX: Math.min(box.x, x2), minY: Math.min(box.y, y2), maxX: Math.max(box.x, x2), maxY: Math.max(box.y, y2) }
}

export const Point = {
  create(x: number, y: number): Point {
    return { x, y } as Point
  },
  distance(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y)
  },
  midpoint(a: Point, b: Point): Point {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } as Point
  },
  translate(point: Point, vec: Vec2): Point {
    return { x: point.x + vec.x, y: point.y + vec.y } as Point
  },
  // Point - Point = Vec2
  subtract(a: Point, b: Point): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y } as Vec2
  },
}

export const Vec2 = {
  create(x: number, y: number): Vec2 {
    return { x, y } as Vec2
  },
  add(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y } as Vec2
  },
  sub(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y } as Vec2
  },
  length(a: Vec2): number {
    return Math.hypot(a.x, a.y)
  },
}

export const Box = {
  create(x: number, y: number, width: number, height: number): Box {
    return { x, y, width, height } as Box
  },
  /**
   * Creates a Box from an array of points by computing the AABB
   *
   * @param points - Array of points to compute bounding box for
   * @returns The smallest axis-aligned box containing all points
   */
  fromPoints(points: Point[]): Box {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  },
  contains(box: Box, point: Point): boolean {
    const bounds: BoxBounds = getBoxBounds(box)
    return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY
  },
  intersects(a: Box, b: Box): boolean {
    const ab: BoxBounds = getBoxBounds(a)
    const bb: BoxBounds = getBoxBounds(b)
    return ab.minX < bb.maxX && ab.maxX > bb.minX && ab.minY < bb.maxY && ab.maxY > bb.minY
  },
}
