import { GroupId, ShapeId } from './ids'
import { Box, Point } from './geometry'
import type { Box as BoxType, Point as PointType } from './geometry'

// ============================================================================
// Base Shape
// ============================================================================

/**
 * BaseShape - Common properties for all shapes
 *
 * @remarks
 * All shapes inherit these properties, but some may have semantic restrictions:
 * - LineShape: rotation is always 0 (lines are defined by endpoints, not rotation)
 *
 * Coordinates (x, y, rotation) are always in world/absolute space, not relative
 * to any parent or group. The groupId field is for logical grouping only and
 * does not affect coordinate transformations.
 */
export interface BaseShape<Type extends string, Props extends object> {
  id: ShapeId
  type: Type
  /**
   * Optional group membership
   *
   * @remarks
   * - This is a logical grouping, not a spatial parent-child relationship
   * - Shapes in a group still store absolute world coordinates
   * - Moving a group updates all member shapes' coordinates
   * - Reserved for future: parentId for true parent-child relationships (Frame/Artboard)
   */
  groupId?: GroupId
  index: string
  x: number
  y: number
  rotation: number
  isLocked: boolean
  props: Props
}

// ============================================================================
// Line Shape
// ============================================================================

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

// ============================================================================
// Rect Shape
// ============================================================================

/**
 * RectShape - A rectangle with fill and stroke
 */
export interface RectShape
  extends BaseShape<
    'rect',
    {
      /** Rectangle width */
      width: number
      /** Rectangle height */
      height: number
      /** Fill color */
      fill: string
      /** Stroke color */
      stroke: string
      /** Stroke width in pixels */
      strokeWidth: number
    }
  > {}

// ============================================================================
// Shape Union
// ============================================================================

/**
 * Shape - Union of all shape types
 *
 * @remarks
 * Note: Groups are NOT shapes. They are separate entities defined in groups.ts
 */
export type Shape = RectShape | LineShape

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a shape is a RectShape
 */
export function isRectShape(shape: Shape): shape is RectShape {
  return shape.type === 'rect'
}

/**
 * Type guard to check if a shape is a LineShape
 */
export function isLineShape(shape: Shape): shape is LineShape {
  return shape.type === 'line'
}

/**
 * Type guard to check if a shape can be used as a connector (has endpoints)
 *
 * @remarks
 * Currently only LineShape can be used in ConnectorBindings.
 * This function enables compile-time type narrowing when creating bindings.
 */
export function isConnectorShape(shape: Shape): shape is LineShape {
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
export function isBindableTarget(shape: Shape): boolean {
  return !isLineShape(shape)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets the axis-aligned bounding box (AABB) for a shape
 *
 * @remarks
 * - For RectShape: if rotated, computes AABB from rotated corners; otherwise returns original bounds
 * - For LineShape: computes AABB from start and end points
 * - The returned Box is always axis-aligned (no rotation)
 * - Used for fast collision detection, viewport culling, and selection
 *
 * @param shape - The shape to get AABB for
 * @returns The axis-aligned bounding box
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, rotation: 0, props: { width: 50, height: 30 } }
 * const aabb = getShapeAABB(rect)
 * // { x: 100, y: 100, width: 50, height: 30 }
 *
 * const rotatedRect: RectShape = { x: 100, y: 100, rotation: Math.PI/4, props: { width: 50, height: 30 } }
 * const rotatedAABB = getShapeAABB(rotatedRect)
 * // AABB will be larger to contain the rotated shape
 * ```
 */
export function getShapeAABB(shape: Shape): BoxType {
  switch (shape.type) {
    case 'rect': {
      // If rotated, compute AABB from corners
      if (shape.rotation !== 0) {
        const corners = getRotatedCorners(shape)
        return Box.fromPoints(corners)
      }
      // No rotation: return original bounds
      return Box.create(shape.x, shape.y, shape.props.width, shape.props.height)
    }
    case 'line': {
      // Line AABB: from (x, y) to (x + endX, y + endY)
      const x1 = shape.x
      const y1 = shape.y
      const x2 = shape.x + shape.props.endX
      const y2 = shape.y + shape.props.endY
      return Box.create(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
    }
    default: {
      // Exhaustiveness check: if we get here, a new shape type was added
      // but this function wasn't updated. TypeScript will error if all
      // cases aren't handled.
      const _exhaustive: never = shape
      void _exhaustive // Suppress unused variable warning
      return Box.create(0, 0, 0, 0)
    }
  }
}

/**
 * Gets the center point of a shape
 *
 * @param shape - The shape to get center for
 * @returns The center point in world coordinates
 *
 * @remarks
 * For RectShape, returns the center of the original (non-rotated) bounds.
 * This is the rotation pivot point for rotated shapes.
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, props: { width: 50, height: 30 } }
 * const center = getShapeCenter(rect)
 * // { x: 125, y: 115 }
 * ```
 */
export function getShapeCenter(shape: Shape): PointType {
  switch (shape.type) {
    case 'rect':
      return Point.create(shape.x + shape.props.width / 2, shape.y + shape.props.height / 2)
    case 'line':
      return Point.create(shape.x + shape.props.endX / 2, shape.y + shape.props.endY / 2)
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      return Point.create(0, 0)
    }
  }
}

/**
 * Gets the four corners of a rotated shape's bounding box
 *
 * @param shape - The shape to get corners for
 * @returns Array of four corner points in world coordinates
 *
 * @remarks
 * This computes the actual positions of the four corners after rotation.
 * Useful for collision detection, selection rendering, etc.
 * For LineShape, returns the two endpoints (start and end).
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, rotation: Math.PI / 4, props: { width: 50, height: 30 } }
 * const corners = getRotatedCorners(rect)
 * // [{ x: ..., y: ... }, ...]
 * ```
 */
export function getRotatedCorners(shape: Shape): Array<PointType> {
  switch (shape.type) {
    case 'rect': {
      const { x, y, rotation, props } = shape
      const { width, height } = props

      // No rotation, return corners directly
      if (rotation === 0) {
        return [
          Point.create(x, y), // Top-left
          Point.create(x + width, y), // Top-right
          Point.create(x + width, y + height), // Bottom-right
          Point.create(x, y + height), // Bottom-left
        ]
      }

      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)

      // Center point
      const cx = x + width / 2
      const cy = y + height / 2

      // Four corners relative to center
      const relativeCorners = [
        { x: -width / 2, y: -height / 2 }, // Top-left
        { x: width / 2, y: -height / 2 }, // Top-right
        { x: width / 2, y: height / 2 }, // Bottom-right
        { x: -width / 2, y: height / 2 }, // Bottom-left
      ]

      // Rotate each corner around center
      return relativeCorners.map((corner) =>
        Point.create(cx + corner.x * cos - corner.y * sin, cy + corner.x * sin + corner.y * cos)
      )
    }
    case 'line': {
      // For lines, return the two endpoints
      const x1 = shape.x
      const y1 = shape.y
      const x2 = shape.x + shape.props.endX
      const y2 = shape.y + shape.props.endY
      return [Point.create(x1, y1), Point.create(x2, y2)]
    }
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      return []
    }
  }
}

/**
 * Checks if a point is inside a shape (precise hit detection)
 *
 * @param point - The point to test
 * @param shape - The shape to test against
 * @returns true if the point is inside the shape
 *
 * @remarks
 * - For RectShape: Uses inverse rotation to transform point to local space,
 *   then does simple rectangle containment test. Handles rotation precisely.
 * - For LineShape: Checks if point is within a threshold distance from the line segment.
 *   The threshold is based on strokeWidth with a minimum of 4px for easier clicking.
 *
 * Use this for click detection where precision matters.
 * For fast bulk operations (e.g., viewport culling), use getShapeAABB + Box.intersects instead.
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, rotation: Math.PI/4, props: { width: 50, height: 30 } }
 * const clicked = isPointInShape(Point.create(125, 115), rect) // true (center)
 * const missed = isPointInShape(Point.create(200, 200), rect)  // false
 * ```
 */
export function isPointInShape(point: PointType, shape: Shape): boolean {
  switch (shape.type) {
    case 'rect': {
      const { x, y, rotation, props } = shape
      const { width, height } = props

      // Calculate center point
      const cx = x + width / 2
      const cy = y + height / 2

      // Transform point to shape's local coordinate system (inverse rotation)
      const cos = Math.cos(-rotation)
      const sin = Math.sin(-rotation)
      const dx = point.x - cx
      const dy = point.y - cy
      const localX = dx * cos - dy * sin
      const localY = dx * sin + dy * cos

      // Check if point is inside the rectangle in local space
      return localX >= -width / 2 && localX <= width / 2 && localY >= -height / 2 && localY <= height / 2
    }
    case 'line': {
      // Line hit detection: check if point is within threshold distance from line segment
      const threshold = Math.max(shape.props.strokeWidth / 2, 4) // Minimum 4px for easier clicking
      const distance = pointToLineSegmentDistance(point, shape)
      return distance <= threshold
    }
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      return false
    }
  }
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
