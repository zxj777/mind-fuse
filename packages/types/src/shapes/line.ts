import { BaseShape } from './base'
import { ShapeId } from '../ids'
import { Box, Point } from '../geometry'
import type { Box as BoxType, Point as PointType } from '../geometry'

/**
 * Arrow decoration styles for line endpoints
 */
export type ArrowStyle = 'none' | 'arrow' | 'filled-arrow' | 'circle' | 'diamond'

/**
 * Path types for lines
 */
export type PathType = 'straight' | 'curved' | 'elbow'

/**
 * LineShape - A line/connector with optional arrow decorations
 *
 * @remarks
 * Special behaviors:
 * - rotation is always 0 (lines are defined by start and end points)
 * - Can bind to other shapes via ConnectorBinding
 * - Cannot be used as a binding target (lines cannot connect to lines)
 * - Decorative arrows (startArrow/endArrow) are part of the line style
 */
export interface LineShape
  extends BaseShape<
    'line',
    {
      /** End X coordinate (relative to shape's x) */
      endX: number
      /** End Y coordinate (relative to shape's y) */
      endY: number
      /** Stroke color */
      stroke: string
      /** Stroke width in pixels */
      strokeWidth: number
      /** Start point arrow decoration (optional, defaults to 'none') */
      startArrow?: ArrowStyle
      /** End point arrow decoration (optional, defaults to 'none') */
      endArrow?: ArrowStyle
      /** Path rendering style (optional, defaults to 'straight') */
      pathType?: PathType
    }
  > {}

/**
 * Type guard to check if a shape is a LineShape
 */
export function isLineShape(shape: { type: string }): shape is LineShape {
  return shape.type === 'line'
}

/**
 * Type guard to check if a shape can be used as a connector (has endpoints)
 *
 * @remarks
 * Currently only LineShape can be used in ConnectorBindings.
 * This function enables compile-time type narrowing when creating bindings.
 */
export function isConnectorShape(shape: { type: string }): shape is LineShape {
  return isLineShape(shape)
}

/**
 * Type guard to check if a shape can be a binding target
 *
 * @remarks
 * Lines cannot be binding targets (you can't bind a line to another line).
 * Groups are also not valid binding targets (bindings must target actual shapes).
 * This prevents invalid binding configurations.
 */
export function isBindableTarget(shape: { type: string }): boolean {
  return !isLineShape(shape)
}

/**
 * Creates a LineShape with sensible defaults
 *
 * @param overrides - Properties to override (id is required)
 *
 * @example
 * ```typescript
 * const line = createLineShape({
 *   id: createShapeId('test-1'),
 *   x: 0,
 *   y: 0,
 *   props: { endX: 100, endY: 50 }
 * })
 * ```
 */
export function createLineShape(overrides: Partial<LineShape> & { id: ShapeId }): LineShape {
  return {
    type: 'line',
    x: 0,
    y: 0,
    rotation: 0,
    index: 'a0',
    isLocked: false,
    props: {
      endX: 100,
      endY: 0,
      stroke: '#000000',
      strokeWidth: 2,
      ...overrides.props,
    },
    ...overrides,
  }
}

/**
 * Gets the axis-aligned bounding box (AABB) for a LineShape
 *
 * @param shape - The LineShape to get AABB for
 * @returns The axis-aligned bounding box
 */
export function getLineAABB(shape: LineShape): BoxType {
  // Line AABB: from (x, y) to (x + endX, y + endY)
  const x1 = shape.x
  const y1 = shape.y
  const x2 = shape.x + shape.props.endX
  const y2 = shape.y + shape.props.endY
  return Box.create(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
}

/**
 * Gets the center point of a LineShape
 *
 * @param shape - The LineShape to get center for
 * @returns The center point in world coordinates
 */
export function getLineCenter(shape: LineShape): PointType {
  return Point.create(shape.x + shape.props.endX / 2, shape.y + shape.props.endY / 2)
}

/**
 * Gets the two endpoints of a LineShape
 *
 * @param shape - The LineShape to get endpoints for
 * @returns Array of two points [start, end]
 */
export function getLineEndpoints(shape: LineShape): [PointType, PointType] {
  const x1 = shape.x
  const y1 = shape.y
  const x2 = shape.x + shape.props.endX
  const y2 = shape.y + shape.props.endY
  return [Point.create(x1, y1), Point.create(x2, y2)]
}

/**
 * Checks if a point is on/near a LineShape (hit detection)
 *
 * @param point - The point to test
 * @param shape - The LineShape to test against
 * @returns true if the point is within threshold distance from the line
 *
 * @remarks
 * The threshold is based on strokeWidth with a minimum of 4px for easier clicking.
 */
export function isPointOnLine(point: PointType, shape: LineShape): boolean {
  // Line hit detection: check if point is within threshold distance from line segment
  const threshold = Math.max(shape.props.strokeWidth / 2, 4) // Minimum 4px for easier clicking
  const distance = pointToLineSegmentDistance(point, shape)
  return distance <= threshold
}

/**
 * Calculates the minimum distance from a point to a line segment
 *
 * @param point - The point
 * @param line - The line shape
 * @returns The minimum distance in pixels
 *
 * @internal
 */
function pointToLineSegmentDistance(point: PointType, line: LineShape): number {
  const x1 = line.x
  const y1 = line.y
  const x2 = line.x + line.props.endX
  const y2 = line.y + line.props.endY

  // Vector from line start to point
  const A = point.x - x1
  const B = point.y - y1

  // Vector of the line segment
  const C = x2 - x1
  const D = y2 - y1

  // Project point onto line (normalized parameter t)
  const dot = A * C + B * D
  const lenSq = C * C + D * D

  // Handle degenerate case (zero-length line)
  if (lenSq === 0) {
    return Math.hypot(A, B)
  }

  // Clamp t to [0, 1] to stay within the segment
  const t = Math.max(0, Math.min(1, dot / lenSq))

  // Find nearest point on segment
  const nearestX = x1 + t * C
  const nearestY = y1 + t * D

  // Return distance to nearest point
  return Math.hypot(point.x - nearestX, point.y - nearestY)
}
