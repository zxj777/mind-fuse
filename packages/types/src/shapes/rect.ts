import { BaseShape } from './base'
import { ShapeId } from '../ids'
import { Box, Point } from '../geometry'
import type { Box as BoxType, Point as PointType } from '../geometry'

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

/**
 * Type guard to check if a shape is a RectShape
 */
export function isRectShape(shape: { type: string }): shape is RectShape {
  return shape.type === 'rect'
}

/**
 * Creates a RectShape with sensible defaults
 *
 * @param overrides - Properties to override (id is required)
 *
 * @example
 * ```typescript
 * const rect = createRectShape({
 *   id: createShapeId('test-1'),
 *   x: 100,
 *   y: 200,
 * })
 * ```
 */
export function createRectShape(overrides: Partial<RectShape> & { id: ShapeId }): RectShape {
  return {
    type: 'rect',
    x: 0,
    y: 0,
    rotation: 0,
    index: 'a0',
    isLocked: false,
    props: {
      width: 100,
      height: 100,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      ...overrides.props,
    },
    ...overrides,
  }
}

/**
 * Gets the axis-aligned bounding box (AABB) for a RectShape
 *
 * @remarks
 * - If rotated, computes AABB from rotated corners; otherwise returns original bounds
 * - The returned Box is always axis-aligned (no rotation)
 * - Used for fast collision detection, viewport culling, and selection
 *
 * @param shape - The RectShape to get AABB for
 * @returns The axis-aligned bounding box
 */
export function getRectAABB(shape: RectShape): BoxType {
  // If rotated, compute AABB from corners
  if (shape.rotation !== 0) {
    const corners = getRotatedRectCorners(shape)
    return Box.fromPoints(corners)
  }
  // No rotation: return original bounds
  return Box.create(shape.x, shape.y, shape.props.width, shape.props.height)
}

/**
 * Gets the center point of a RectShape
 *
 * @param shape - The RectShape to get center for
 * @returns The center point in world coordinates
 */
export function getRectCenter(shape: RectShape): PointType {
  return Point.create(shape.x + shape.props.width / 2, shape.y + shape.props.height / 2)
}

/**
 * Gets the four corners of a rotated rectangle's bounding box
 *
 * @param shape - The RectShape to get corners for
 * @returns Array of four corner points in world coordinates
 */
export function getRotatedRectCorners(shape: RectShape): Array<PointType> {
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

/**
 * Checks if a point is inside a RectShape (precise hit detection)
 *
 * @param point - The point to test
 * @param shape - The RectShape to test against
 * @returns true if the point is inside the shape
 *
 * @remarks
 * Uses inverse rotation to transform point to local space,
 * then does simple rectangle containment test. Handles rotation precisely.
 */
export function isPointInRect(point: PointType, shape: RectShape): boolean {
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
