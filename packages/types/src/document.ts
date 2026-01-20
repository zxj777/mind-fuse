import { BindingId, CommentId, DocumentId, GroupId, ShapeId } from './ids'
import { Shape } from './shapes'
import { Comment } from './comment'
import { Binding } from './bindings'
import { Group } from './groups'

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
