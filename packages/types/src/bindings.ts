import { BindingId, CommentId, createBindingId, ShapeId } from './ids'

/**
 * Normalized coordinates (0-1 range) for positioning relative to a shape's bounds
 *
 * @remarks
 * Used for anchor points on shapes:
 * - (0, 0) = top-left corner
 * - (1, 1) = bottom-right corner
 * - (0.5, 0.5) = center
 * - (1, 0.5) = right edge center
 *
 * Normalized coordinates scale with the shape, maintaining relative position
 * when the shape is resized or rotated.
 */
export interface NormalizedPoint {
  x: number
  y: number
}

export interface BaseBinding<Type extends string> {
  id: BindingId
  type: Type
}

/**
 * ConnectorBinding - Binds a line/connector's endpoint to a shape
 *
 * @remarks
 * A line has two endpoints (start and end), each can have its own binding.
 * When a shape moves/scales, the connector's endpoint follows via the anchor point.
 */
export interface ConnectorBinding extends BaseBinding<'connector'> {
  /** The line/connector shape ID */
  fromId: ShapeId

  /** Which endpoint of the line: 'start' or 'end' */
  terminal: 'start' | 'end'

  /** The shape this endpoint is bound to */
  toId: ShapeId

  /** Normalized anchor point on the target shape (defaults to {x: 0.5, y: 0.5} if not provided) */
  toAnchor: NormalizedPoint
}

/**
 * CommentBinding - Binds a comment to a shape
 *
 * @remarks
 * When bound, the comment's (x, y) coordinates are interpreted as normalized
 * coordinates relative to the shape's bounds. The comment will scale and move
 * with the shape.
 *
 * When unbound, the comment floats independently on the canvas.
 */
export interface CommentBinding extends BaseBinding<'comment'> {
  /** The comment ID (not a ShapeId, comments are separate entities) */
  fromId: CommentId

  /** The shape this comment is attached to */
  toId: ShapeId
}

export function isConnectorBinding(binding: BaseBinding<string>): binding is ConnectorBinding {
  return binding.type === 'connector'
}

export function isCommentBinding(binding: BaseBinding<string>): binding is CommentBinding {
  return binding.type === 'comment'
}

/**
 * ConnectorBinding factory namespace
 */
export const connectorBinding = {
  /**
   * Creates a connector binding
   *
   * @param fromId - The line/connector shape ID
   * @param terminal - Which endpoint: 'start' or 'end'
   * @param toId - The target shape ID
   * @param toAnchor - Optional anchor point (defaults to center: {x: 0.5, y: 0.5})
   * @returns A new ConnectorBinding
   *
   * @example
   * ```typescript
   * // Bind line's end to the right edge of a rectangle
   * const binding = connectorBinding.create(
   *   lineId,
   *   'end',
   *   rectId,
   *   { x: 1, y: 0.5 } // right edge center
   * )
   * ```
   */
  create(
    fromId: ShapeId,
    terminal: 'start' | 'end',
    toId: ShapeId,
    toAnchor?: NormalizedPoint
  ): ConnectorBinding {
    return {
      id: createBindingId(),
      type: 'connector',
      fromId,
      terminal,
      toId,
      toAnchor: toAnchor ?? { x: 0.5, y: 0.5 },
    }
  },
}

/**
 * CommentBinding factory namespace
 */
export const commentBinding = {
  /**
   * Creates a comment binding
   *
   * @param fromId - The comment ID
   * @param toId - The shape ID to attach to
   * @returns A new CommentBinding
   *
   * @remarks
   * When this binding is created, ensure the comment's (x, y) coordinates
   * are converted to normalized coordinates relative to the shape's bounds.
   *
   * @example
   * ```typescript
   * // Attach a comment to a shape
   * const binding = commentBinding.create(commentId, shapeId)
   * ```
   */
  create(fromId: CommentId, toId: ShapeId): CommentBinding {
    return {
      id: createBindingId(),
      type: 'comment',
      fromId,
      toId,
    }
  },
}

export type Binding = ConnectorBinding | CommentBinding
