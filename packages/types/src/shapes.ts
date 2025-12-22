import { ShapeId } from './ids'

// ============================================================================
// Base Shape
// ============================================================================

/**
 * BaseShape - Common properties for all shapes
 *
 * @remarks
 * All shapes inherit these properties, but some may have semantic restrictions:
 * - LineShape: rotation is always 0 (lines are defined by endpoints, not rotation)
 * - GroupShape: has no visual properties of its own
 */
export interface BaseShape<Type extends string, Props extends object> {
  id: ShapeId
  type: Type
  parentId: ShapeId | null
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
// Group Shape
// ============================================================================

/**
 * GroupShape - A container for organizing multiple shapes
 *
 * @remarks
 * Groups have no visual representation of their own.
 * Children shapes reference the group via their parentId.
 */
export interface GroupShape extends BaseShape<'group', Record<string, never>> {}

// ============================================================================
// Shape Union
// ============================================================================

/**
 * Shape - Union of all shape types
 */
export type Shape = RectShape | LineShape | GroupShape

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
 * Type guard to check if a shape is a GroupShape
 */
export function isGroupShape(shape: Shape): shape is GroupShape {
  return shape.type === 'group'
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
 * This prevents invalid binding configurations.
 */
export function isBindableTarget(shape: Shape): boolean {
  return !isLineShape(shape)
}
