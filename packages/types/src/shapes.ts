import { GroupId, ShapeId } from './ids'
import type { Box, Point } from './geometry'

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
 * Gets the bounding box for a shape
 *
 * @remarks
 * - For RectShape: returns the bounding box with x, y as top-left corner
 * - For LineShape: computes AABB from start and end points
 * - Rotation is preserved in the returned Box
 *
 * @param shape - The shape to get bounds for
 * @returns The bounding box
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, props: { width: 50, height: 30 } }
 * const bounds = getShapeBounds(rect)
 * // { x: 100, y: 100, width: 50, height: 30, rotation: 0 }
 * ```
 */
export function getShapeBounds(shape: Shape): Box {
  switch (shape.type) {
    case 'rect':
      return {
        x: shape.x,
        y: shape.y,
        width: shape.props.width,
        height: shape.props.height,
        rotation: shape.rotation,
      }
    case 'line': {
      // Line bounds: from (x, y) to (x + endX, y + endY)
      const x1 = shape.x
      const y1 = shape.y
      const x2 = shape.x + shape.props.endX
      const y2 = shape.y + shape.props.endY
      return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        rotation: 0, // Lines don't rotate
      }
    }
    default: {
      // Exhaustiveness check: if we get here, a new shape type was added
      // but this function wasn't updated. TypeScript will error if all
      // cases aren't handled.
      const _exhaustive: never = shape
      void _exhaustive // Suppress unused variable warning
      return { x: 0, y: 0, width: 0, height: 0, rotation: 0 }
    }
  }
}

/**
 * Gets the center point of a shape
 *
 * @param shape - The shape to get center for
 * @returns The center point in world coordinates
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, props: { width: 50, height: 30 } }
 * const center = getShapeCenter(rect)
 * // { x: 125, y: 115 }
 * ```
 */
export function getShapeCenter(shape: Shape): Point {
  const bounds = getShapeBounds(shape)
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  } as Point
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
 *
 * @example
 * ```typescript
 * const rect: RectShape = { x: 100, y: 100, rotation: Math.PI / 4, props: { width: 50, height: 30 } }
 * const corners = getRotatedCorners(rect)
 * // [{ x: ..., y: ... }, ...]
 * ```
 */
export function getRotatedCorners(shape: Shape): Array<Point> {
  const bounds = getShapeBounds(shape)
  const { x, y, width, height, rotation } = bounds

  // No rotation, return corners directly
  if (rotation === 0) {
    return [
      { x, y } as Point, // Top-left
      { x: x + width, y } as Point, // Top-right
      { x: x + width, y: y + height } as Point, // Bottom-right
      { x, y: y + height } as Point, // Bottom-left
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
  return relativeCorners.map(
    (corner) =>
      ({
        x: cx + corner.x * cos - corner.y * sin,
        y: cy + corner.x * sin + corner.y * cos,
      }) as Point
  )
}
