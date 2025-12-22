/**
 * Binding Validation - Runtime validation for binding constraints
 *
 * @remarks
 * While TypeScript provides compile-time type safety, some constraints
 * can only be enforced at runtime (e.g., "fromId must reference a LineShape").
 * This module provides validation functions for these constraints.
 *
 * @packageDocumentation
 */

import { Shape, isConnectorShape, isBindableTarget } from './shapes'
import { ConnectorBinding, CommentBinding } from './bindings'
import { ShapeId } from './ids'
import { Comment } from './comment'

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Base class for binding validation errors
 */
export class BindingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BindingValidationError'
  }
}

/**
 * Error thrown when a binding references a non-existent shape
 */
export class ShapeNotFoundError extends BindingValidationError {
  constructor(shapeId: ShapeId) {
    super(`Shape not found: ${shapeId}`)
    this.name = 'ShapeNotFoundError'
  }
}

/**
 * Error thrown when a binding's fromId is not a valid connector shape
 */
export class InvalidConnectorShapeError extends BindingValidationError {
  constructor(shapeId: ShapeId, actualType: string) {
    super(`ConnectorBinding.fromId must be a LineShape, got: ${actualType} (${shapeId})`)
    this.name = 'InvalidConnectorShapeError'
  }
}

/**
 * Error thrown when trying to bind to an invalid target
 */
export class InvalidBindingTargetError extends BindingValidationError {
  constructor(shapeId: ShapeId, reason: string) {
    super(`Invalid binding target ${shapeId}: ${reason}`)
    this.name = 'InvalidBindingTargetError'
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a ConnectorBinding against the current document state
 *
 * @param binding - The binding to validate
 * @param shapes - The document's shape map
 * @throws {ShapeNotFoundError} If fromId or toId doesn't exist
 * @throws {InvalidConnectorShapeError} If fromId is not a LineShape
 * @throws {InvalidBindingTargetError} If toId cannot be a binding target
 *
 * @example
 * ```typescript
 * try {
 *   validateConnectorBinding(binding, document.shapes)
 *   // Binding is valid
 * } catch (error) {
 *   if (error instanceof BindingValidationError) {
 *     console.error('Invalid binding:', error.message)
 *   }
 * }
 * ```
 */
export function validateConnectorBinding(
  binding: ConnectorBinding,
  shapes: Map<ShapeId, Shape>
): void {
  // Check fromId exists
  const fromShape = shapes.get(binding.fromId)
  if (!fromShape) {
    throw new ShapeNotFoundError(binding.fromId)
  }

  // Check fromId is a connector shape (LineShape)
  if (!isConnectorShape(fromShape)) {
    throw new InvalidConnectorShapeError(binding.fromId, fromShape.type)
  }

  // Check toId exists
  const toShape = shapes.get(binding.toId)
  if (!toShape) {
    throw new ShapeNotFoundError(binding.toId)
  }

  // Check toId can be a binding target (not a line)
  if (!isBindableTarget(toShape)) {
    throw new InvalidBindingTargetError(binding.toId, 'Lines cannot be binding targets')
  }
}

/**
 * Validates a CommentBinding against the current document state
 *
 * @param binding - The binding to validate
 * @param comments - The document's comment map
 * @param shapes - The document's shape map
 * @throws {Error} If fromId comment doesn't exist
 * @throws {ShapeNotFoundError} If toId shape doesn't exist
 * @throws {InvalidBindingTargetError} If toId cannot be a binding target
 */
export function validateCommentBinding(
  binding: CommentBinding,
  comments: Map<string, Comment>,
  shapes: Map<ShapeId, Shape>
): void {
  // Check fromId exists
  const comment = comments.get(binding.fromId)
  if (!comment) {
    throw new Error(`Comment not found: ${binding.fromId}`)
  }

  // Check toId exists
  const toShape = shapes.get(binding.toId)
  if (!toShape) {
    throw new ShapeNotFoundError(binding.toId)
  }

  // Check toId can be a binding target
  // Note: Based on user testing, comments cannot attach to groups
  if (toShape.type === 'group') {
    throw new InvalidBindingTargetError(binding.toId, 'Comments cannot attach to groups')
  }
}

/**
 * Checks if a shape can be safely deleted without breaking bindings
 *
 * @param shapeId - The shape to check
 * @param bindings - All bindings in the document
 * @returns Array of bindings that would be affected
 *
 * @remarks
 * Use this before deleting a shape to determine which bindings need to be
 * cleaned up or updated.
 *
 * @example
 * ```typescript
 * const affectedBindings = getAffectedBindings(shapeId, document.bindings)
 * if (affectedBindings.length > 0) {
 *   console.warn(`Deleting this shape will affect ${affectedBindings.length} bindings`)
 *   // Optionally delete or update these bindings
 * }
 * ```
 */
export function getAffectedBindings(
  shapeId: ShapeId,
  bindings: Map<string, ConnectorBinding | CommentBinding>
): Array<ConnectorBinding | CommentBinding> {
  const affected: Array<ConnectorBinding | CommentBinding> = []

  for (const binding of bindings.values()) {
    if ('fromId' in binding && binding.fromId === shapeId) {
      affected.push(binding)
    }
    if ('toId' in binding && binding.toId === shapeId) {
      affected.push(binding)
    }
  }

  return affected
}
