import type { Binding } from './bindings'
import type { Comment } from './comment'
import type { Group } from './groups'
import type { BindingId, CommentId, DocumentId, GroupId, ShapeId } from './ids'
import type { Shape } from './shapes'

/**
 * Document - The root container for all shapes, comments, and bindings
 */
export interface Document {
  id: DocumentId
  createdAt: Date
  updatedAt: Date
  shapes: Map<ShapeId, Shape>
  comments: Map<CommentId, Comment>
  bindings: Map<BindingId, Binding>
  groups: Map<GroupId, Group>
}
