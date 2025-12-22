/**
 * Comment Types - Comments can be attached to shapes or float independently on the canvas
 *
 * @remarks
 * Comment coordinates have dual semantics:
 * - **With Binding**: (x, y) are normalized coordinates (0-1 range) relative to the attached shape
 * - **Without Binding**: (x, y) are world coordinates (pixels) on the canvas
 *
 * This design ensures comments scale and move with their attached shapes.
 *
 * @packageDocumentation
 */

import { CommentId, ReplyId, UserId, createCommentId, createReplyId } from './ids'

// ============================================================================
// Comment Interface
// ============================================================================

/**
 * Comment - A user comment that can be attached to a shape or float independently
 *
 * @remarks
 * Coordinate semantics:
 * - If attached to a shape (has CommentBinding): x, y are normalized (0-1)
 * - If independent: x, y are world coordinates (pixels)
 *
 * Soft delete support:
 * - Deleted comments remain in the document with `deleted: true`
 * - This enables undo/redo and collaborative recovery
 */
export interface Comment {
  /** Unique identifier */
  id: CommentId

  /**
   * X coordinate
   * - With binding: normalized (0-1) relative to shape bounds
   * - Without binding: world coordinate (pixels)
   */
  x: number

  /**
   * Y coordinate
   * - With binding: normalized (0-1) relative to shape bounds
   * - Without binding: world coordinate (pixels)
   */
  y: number

  /** Main comment text */
  text: string

  /** Comment author */
  author: UserId

  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number

  /** Whether the comment is marked as resolved */
  resolved: boolean

  /** Soft delete flag */
  deleted?: boolean

  /** Deletion timestamp (milliseconds since epoch) */
  deletedAt?: number

  /** User who deleted this comment */
  deletedBy?: UserId

  /** Thread replies */
  replies: Reply[]
}

// ============================================================================
// Reply Interface
// ============================================================================

/**
 * Reply - A reply to a comment in a thread
 */
export interface Reply {
  /** Unique identifier */
  id: ReplyId

  /** Reply text */
  text: string

  /** Reply author */
  author: UserId

  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Comment factory namespace
 */
export const comment = {
  /**
   * Creates a new Comment
   *
   * @param x - X coordinate (world or normalized, depending on whether it will be attached)
   * @param y - Y coordinate (world or normalized, depending on whether it will be attached)
   * @param text - Comment text
   * @param author - Author user ID
   * @returns A new Comment object
   *
   * @example
   * ```typescript
   * // Independent comment on canvas
   * const floatingComment = comment.create(100, 200, "Great idea!", userId)
   *
   * // Comment to be attached (coordinates will be converted to normalized)
   * const attachedComment = comment.create(0.5, 0.8, "Fix this", userId)
   * ```
   */
  create(x: number, y: number, text: string, author: UserId): Comment {
    return {
      id: createCommentId(),
      x,
      y,
      text,
      author,
      createdAt: Date.now(),
      resolved: false,
      replies: [],
    }
  },

  /**
   * Adds a reply to a comment
   *
   * @param comment - The comment to add a reply to
   * @param text - Reply text
   * @param author - Reply author user ID
   * @returns The updated comment (mutated)
   */
  addReply(comment: Comment, text: string, author: UserId): Comment {
    const reply: Reply = {
      id: createReplyId(),
      text,
      author,
      createdAt: Date.now(),
    }
    comment.replies.push(reply)
    return comment
  },

  /**
   * Marks a comment as resolved
   *
   * @param comment - The comment to resolve
   * @returns The updated comment (mutated)
   */
  resolve(comment: Comment): Comment {
    comment.resolved = true
    return comment
  },

  /**
   * Marks a comment as unresolved
   *
   * @param comment - The comment to unresolve
   * @returns The updated comment (mutated)
   */
  unresolve(comment: Comment): Comment {
    comment.resolved = false
    return comment
  },

  /**
   * Soft deletes a comment
   *
   * @param comment - The comment to delete
   * @param deletedBy - User who deleted the comment
   * @returns The updated comment (mutated)
   */
  delete(comment: Comment, deletedBy: UserId): Comment {
    comment.deleted = true
    comment.deletedAt = Date.now()
    comment.deletedBy = deletedBy
    return comment
  },

  /**
   * Restores a soft-deleted comment
   *
   * @param comment - The comment to restore
   * @returns The updated comment (mutated)
   */
  restore(comment: Comment): Comment {
    comment.deleted = false
    comment.deletedAt = undefined
    comment.deletedBy = undefined
    return comment
  },
}
