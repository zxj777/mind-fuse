/**
 * Group Types and Utilities
 *
 * Groups are logical collections of shapes that can be manipulated together.
 * Unlike traditional parent-child relationships, group members store absolute
 * world coordinates. Moving/rotating a group updates all member coordinates.
 *
 * @packageDocumentation
 */

import { createGroupId, GroupId, ShapeId } from './ids'
import { getRotatedCorners, getShapeBounds, type Shape } from './shapes'
import type { Box } from './geometry'

// ============================================================================
// Group Interface
// ============================================================================

/**
 * Group - A collection of shapes that can be manipulated together
 *
 * @remarks
 * Key characteristics:
 * - Groups are NOT shapes (they don't inherit from BaseShape)
 * - Members store absolute world coordinates, not relative to the group
 * - Groups must have at least 2 members (enforced by validation)
 * - Groups cannot be nested (members cannot be groups)
 * - Moving/rotating a group updates all member shapes' coordinates
 * - Bounds are cached AABB (Axis-Aligned Bounding Box) for performance
 *
 * @example
 * ```typescript
 * const group: Group = {
 *   id: createGroupId(),
 *   memberIds: new Set(['shape:1', 'shape:2', 'shape:3']),
 *   bounds: {
 *     x: 100,
 *     y: 100,
 *     width: 200,
 *     height: 150,
 *   }
 * }
 * ```
 */
export interface Group {
  /** Unique identifier for this group */
  id: GroupId

  /**
   * Set of shape IDs that belong to this group
   *
   * @remarks
   * - Must contain at least 2 members
   * - Members must exist in the document
   * - Members cannot themselves be groups
   */
  memberIds: Set<ShapeId>

  /**
   * Cached Axis-Aligned Bounding Box (AABB)
   *
   * @remarks
   * This is computed from all member shapes' bounds and should be
   * recalculated whenever:
   * - Members are added/removed
   * - Any member is moved/resized/rotated
   * - The group itself is transformed
   *
   * The bounds represent the smallest axis-aligned rectangle that
   * contains all member shapes in their current rotated state.
   */
  bounds: {
    /** Left edge x coordinate (world space) */
    x: number
    /** Top edge y coordinate (world space) */
    y: number
    /** Width of the bounding box */
    width: number
    /** Height of the bounding box */
    height: number
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Computes the Axis-Aligned Bounding Box (AABB) for a set of shapes
 *
 * @param shapes - Array of shapes to compute bounds for
 * @returns The bounding box containing all shapes
 *
 * @remarks
 * For rotated shapes, this computes the AABB of the rotated geometry,
 * which may be larger than the shape's width/height.
 *
 * @example
 * ```typescript
 * const shapes = [
 *   { x: 100, y: 100, rotation: 0, props: { width: 50, height: 50 } },
 *   { x: 200, y: 150, rotation: 0, props: { width: 80, height: 60 } },
 * ]
 * const bounds = computeAABB(shapes)
 * // { x: 100, y: 100, width: 180, height: 110 }
 * ```
 */
export function computeAABB(shapes: Shape[]): Box {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, rotation: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    // Get shape bounds based on type
    const bounds = getShapeBounds(shape)

    // For rotated shapes, compute the AABB of the rotated rectangle
    if (shape.rotation !== 0) {
      const corners = getRotatedCorners(shape)
      for (const corner of corners) {
        minX = Math.min(minX, corner.x)
        minY = Math.min(minY, corner.y)
        maxX = Math.max(maxX, corner.x)
        maxY = Math.max(maxY, corner.y)
      }
    } else {
      // No rotation, use bounds directly
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0, // AABB is always axis-aligned
  }
}

// ============================================================================
// Group Factory Namespace
// ============================================================================

/**
 * Group factory and utility functions
 */
export const group = {
  /**
   * Creates a new group from a set of shapes
   *
   * @param memberIds - Array of shape IDs to include in the group
   * @param shapes - Map of all shapes in the document
   * @returns A new Group with computed bounds
   * @throws {GroupValidationError} If validation fails
   *
   * @example
   * ```typescript
   * const shapes = new Map([
   *   ['shape:1', rect1],
   *   ['shape:2', rect2],
   * ])
   * const newGroup = group.create(['shape:1', 'shape:2'], shapes)
   * ```
   */
  create(memberIds: ShapeId[], shapes: Map<ShapeId, Shape>): Group {
    // Validation
    if (memberIds.length < 2) {
      throw new GroupValidationError('Group must have at least 2 members')
    }

    const memberShapes: Shape[] = []
    for (const id of memberIds) {
      const shape = shapes.get(id)
      if (!shape) {
        throw new GroupValidationError(`Shape ${id} not found`)
      }
      if (shape.groupId) {
        throw new GroupValidationError(`Shape ${id} is already in a group`)
      }
      memberShapes.push(shape)
    }

    // Compute bounds
    const bounds = computeAABB(memberShapes)

    return {
      id: createGroupId(),
      memberIds: new Set(memberIds),
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
    }
  },

  /**
   * Updates a group's bounds from its member shapes
   *
   * @param group - The group to update
   * @param shapes - Map of all shapes in the document
   * @returns The updated group
   *
   * @remarks
   * Call this after any member shape is moved, resized, or rotated
   *
   * @example
   * ```typescript
   * // After moving a shape in the group
   * shapes.get('shape:1').x += 10
   * group.updateBounds(myGroup, shapes)
   * ```
   */
  updateBounds(group: Group, shapes: Map<ShapeId, Shape>): Group {
    const memberShapes = Array.from(group.memberIds)
      .map((id) => shapes.get(id))
      .filter((s): s is Shape => s !== undefined)

    const bounds = computeAABB(memberShapes)

    group.bounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    }

    return group
  },

  /**
   * Adds a shape to a group
   *
   * @param group - The group to add to
   * @param shapeId - The shape ID to add
   * @param shapes - Map of all shapes in the document
   * @returns The updated group
   * @throws {GroupValidationError} If validation fails
   *
   * @example
   * ```typescript
   * group.addMember(myGroup, 'shape:3', shapes)
   * ```
   */
  addMember(group: Group, shapeId: ShapeId, shapes: Map<ShapeId, Shape>): Group {
    const shape = shapes.get(shapeId)
    if (!shape) {
      throw new GroupValidationError(`Shape ${shapeId} not found`)
    }
    if (shape.groupId) {
      throw new GroupValidationError(`Shape ${shapeId} is already in a group`)
    }

    group.memberIds.add(shapeId)
    return this.updateBounds(group, shapes)
  },

  /**
   * Removes a shape from a group
   *
   * @param group - The group to remove from
   * @param shapeId - The shape ID to remove
   * @param shapes - Map of all shapes in the document
   * @returns The updated group, or null if group should be dissolved
   *
   * @remarks
   * If removing this member would leave the group with less than 2 members,
   * returns null to indicate the group should be deleted
   *
   * @example
   * ```typescript
   * const result = group.removeMember(myGroup, 'shape:1', shapes)
   * if (!result) {
   *   // Group should be dissolved
   *   document.groups.delete(myGroup.id)
   * }
   * ```
   */
  removeMember(group: Group, shapeId: ShapeId, shapes: Map<ShapeId, Shape>): Group | null {
    group.memberIds.delete(shapeId)

    // Dissolve group if less than 2 members
    if (group.memberIds.size < 2) {
      return null
    }

    return this.updateBounds(group, shapes)
  },

  /**
   * Validates a group
   *
   * @param group - The group to validate
   * @param shapes - Map of all shapes in the document
   * @throws {GroupValidationError} If validation fails
   *
   * @remarks
   * Checks:
   * - Group has at least 2 members
   * - All members exist in the shapes map
   * - No members are already in another group
   */
  validate(group: Group, shapes: Map<ShapeId, Shape>): void {
    if (group.memberIds.size < 2) {
      throw new GroupValidationError(`Group ${group.id} has less than 2 members`)
    }

    for (const id of group.memberIds) {
      const shape = shapes.get(id)
      if (!shape) {
        throw new GroupValidationError(`Member shape ${id} not found`)
      }
      if (shape.groupId && shape.groupId !== group.id) {
        throw new GroupValidationError(`Member shape ${id} belongs to another group`)
      }
    }
  },
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Error thrown when group validation fails
 */
export class GroupValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroupValidationError'
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a shape belongs to a group
 */
export function isInGroup(shape: Shape): boolean {
  return shape.groupId !== undefined
}

/**
 * Gets all shapes that belong to a specific group
 *
 * @param groupId - The group ID to search for
 * @param shapes - Map of all shapes
 * @returns Array of shapes in the group
 */
export function getGroupMembers(groupId: GroupId, shapes: Map<ShapeId, Shape>): Shape[] {
  return Array.from(shapes.values()).filter((s) => s.groupId === groupId)
}
