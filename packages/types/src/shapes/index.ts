// ============================================================================
// Base Shape
// ============================================================================

export type { BaseShape } from './base'

// ============================================================================
// Rect Shape
// ============================================================================

export type { RectShape } from './rect'
export {
  isRectShape,
  createRectShape,
  getRectAABB,
  getRectCenter,
  getRotatedRectCorners,
  isPointInRect,
} from './rect'

// ============================================================================
// Line Shape
// ============================================================================

export type { LineShape, ArrowStyle, PathType } from './line'
export {
  isLineShape,
  isConnectorShape,
  isBindableTarget,
  createLineShape,
  getLineAABB,
  getLineCenter,
  getLineEndpoints,
  isPointOnLine,
} from './line'

// ============================================================================
// Shape Union
// ============================================================================

import type { RectShape } from './rect'
import type { LineShape } from './line'

/**
 * Shape - Union of all shape types
 *
 * @remarks
 * Note: Groups are NOT shapes. They are separate entities defined in groups.ts
 */
export type Shape = RectShape | LineShape

// ============================================================================
// Polymorphic Utility Functions
// ============================================================================

import type { Point as PointType, Box as BoxType } from '../geometry'
import { getRectAABB, getRectCenter, getRotatedRectCorners, isPointInRect } from './rect'
import { getLineAABB, getLineCenter, getLineEndpoints, isPointOnLine } from './line'

/**
 * Gets the axis-aligned bounding box (AABB) for any shape
 *
 * @param shape - The shape to get AABB for
 * @returns The axis-aligned bounding box
 */
export function getShapeAABB(shape: Shape): BoxType {
  switch (shape.type) {
    case 'rect':
      return getRectAABB(shape)
    case 'line':
      return getLineAABB(shape)
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      throw new Error(`Unknown shape type`)
    }
  }
}

/**
 * Gets the center point of any shape
 *
 * @param shape - The shape to get center for
 * @returns The center point in world coordinates
 */
export function getShapeCenter(shape: Shape): PointType {
  switch (shape.type) {
    case 'rect':
      return getRectCenter(shape)
    case 'line':
      return getLineCenter(shape)
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      throw new Error(`Unknown shape type`)
    }
  }
}

/**
 * Gets the corners/endpoints of any shape
 *
 * @param shape - The shape to get corners for
 * @returns Array of corner/endpoint points in world coordinates
 *
 * @remarks
 * - For RectShape: returns 4 corner points
 * - For LineShape: returns 2 endpoint points
 */
export function getRotatedCorners(shape: Shape): Array<PointType> {
  switch (shape.type) {
    case 'rect':
      return getRotatedRectCorners(shape)
    case 'line':
      return getLineEndpoints(shape)
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      return []
    }
  }
}

/**
 * Checks if a point is inside/on any shape (precise hit detection)
 *
 * @param point - The point to test
 * @param shape - The shape to test against
 * @returns true if the point is inside/on the shape
 */
export function isPointInShape(point: PointType, shape: Shape): boolean {
  switch (shape.type) {
    case 'rect':
      return isPointInRect(point, shape)
    case 'line':
      return isPointOnLine(point, shape)
    default: {
      const _exhaustive: never = shape
      void _exhaustive
      return false
    }
  }
}
