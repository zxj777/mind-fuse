/**
 * ID Types - Branded types for type safety
 *
 * Uses TypeScript branded types to prevent accidentally mixing different ID types.
 * All IDs follow the format: `prefix:uuid`
 *
 * @packageDocumentation
 */

// ============================================================================
// Branded ID Types
// ============================================================================

/**
 * Shape ID - Uniquely identifies a shape on the canvas
 */
export type ShapeId = string & { readonly __brand: 'ShapeId' }

/**
 * Binding ID - Uniquely identifies a binding (connection) between shapes
 */
export type BindingId = string & { readonly __brand: 'BindingId' }

/**
 * Comment ID - Uniquely identifies a comment
 */
export type CommentId = string & { readonly __brand: 'CommentId' }

/**
 * Reply ID - Uniquely identifies a reply to a comment
 */
export type ReplyId = string & { readonly __brand: 'ReplyId' }

/**
 * Asset ID - Uniquely identifies an asset (image, video, etc.)
 */
export type AssetId = string & { readonly __brand: 'AssetId' }

/**
 * Document ID - Uniquely identifies a document/board
 */
export type DocumentId = string & { readonly __brand: 'DocumentId' }

/**
 * User ID - Uniquely identifies a user/client
 */
export type UserId = string & { readonly __brand: 'UserId' }

/**
 * Group ID - Uniquely identifies a group of shapes
 */
export type GroupId = string & { readonly __brand: 'GroupId' }

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generates a unique ID using crypto.randomUUID()
 *
 * @returns A UUID v4 string
 * @remarks Requires Node.js 15.6+ or modern browsers
 * @internal
 */
export function generateId(): string {
  return crypto.randomUUID()
}

// ============================================================================
// ID Creators
// ============================================================================

/**
 * Creates a new ShapeId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A ShapeId with format `shape:uuid`
 *
 * @example
 * ```typescript
 * const id1 = createShapeId()
 * // => "shape:550e8400-e29b-41d4-a716-446655440000"
 *
 * const id2 = createShapeId("custom-123")
 * // => "shape:custom-123"
 * ```
 */
export function createShapeId(id?: string): ShapeId {
  return `shape:${id ?? generateId()}` as ShapeId
}

/**
 * Creates a new BindingId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A BindingId with format `binding:uuid`
 */
export function createBindingId(id?: string): BindingId {
  return `binding:${id ?? generateId()}` as BindingId
}

/**
 * Creates a new CommentId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A CommentId with format `comment:uuid`
 */
export function createCommentId(id?: string): CommentId {
  return `comment:${id ?? generateId()}` as CommentId
}

/**
 * Creates a new ReplyId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A ReplyId with format `reply:uuid`
 */
export function createReplyId(id?: string): ReplyId {
  return `reply:${id ?? generateId()}` as ReplyId
}

/**
 * Creates a new AssetId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns An AssetId with format `asset:uuid`
 */
export function createAssetId(id?: string): AssetId {
  return `asset:${id ?? generateId()}` as AssetId
}

/**
 * Creates a new DocumentId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A DocumentId with format `document:uuid`
 */
export function createDocumentId(id?: string): DocumentId {
  return `document:${id ?? generateId()}` as DocumentId
}

/**
 * Creates a new UserId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A UserId with format `user:uuid`
 */
export function createUserId(id?: string): UserId {
  return `user:${id ?? generateId()}` as UserId
}

/**
 * Creates a new GroupId
 *
 * @param id - Optional custom ID. If not provided, generates a new UUID
 * @returns A GroupId with format `group:uuid`
 */
export function createGroupId(id?: string): GroupId {
  return `group:${id ?? generateId()}` as GroupId
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a string is a valid DocumentId format
 *
 * @param id - String to check
 * @returns True if the string starts with "document:"
 */
export function isDocumentId(id: string): id is DocumentId {
  return id.startsWith('document:')
}

/**
 * Checks if a string is a valid ShapeId format
 *
 * @param id - String to check
 * @returns True if the string starts with "shape:"
 */
export function isShapeId(id: string): id is ShapeId {
  return id.startsWith('shape:')
}

/**
 * Checks if a string is a valid BindingId format
 *
 * @param id - String to check
 * @returns True if the string starts with "binding:"
 */
export function isBindingId(id: string): id is BindingId {
  return id.startsWith('binding:')
}

/**
 * Checks if a string is a valid CommentId format
 *
 * @param id - String to check
 * @returns True if the string starts with "comment:"
 */
export function isCommentId(id: string): id is CommentId {
  return id.startsWith('comment:')
}

/**
 * Checks if a string is a valid ReplyId format
 *
 * @param id - String to check
 * @returns True if the string starts with "reply:"
 */
export function isReplyId(id: string): id is ReplyId {
  return id.startsWith('reply:')
}

/**
 * Checks if a string is a valid AssetId format
 *
 * @param id - String to check
 * @returns True if the string starts with "asset:"
 */
export function isAssetId(id: string): id is AssetId {
  return id.startsWith('asset:')
}

/**
 * Checks if a string is a valid UserId format
 *
 * @param id - String to check
 * @returns True if the string starts with "user:"
 */
export function isUserId(id: string): id is UserId {
  return id.startsWith('user:')
}

/**
 * Checks if a string is a valid GroupId format
 *
 * @param id - String to check
 * @returns True if the string starts with "group:"
 */
export function isGroupId(id: string): id is GroupId {
  return id.startsWith('group:')
}
