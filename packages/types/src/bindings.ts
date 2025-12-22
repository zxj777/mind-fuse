import { BindingId, createBindingId, ShapeId } from "./ids";

export interface NormalizedPoint {
  x: number
  y: number
}

export interface BaseBinding<Type extends string> {
  id: BindingId
  type: Type
}

export interface ConnectorBinding extends BaseBinding<'connector'> {
  fromId?: ShapeId
  fromAnchor?: NormalizedPoint
  toId: ShapeId
  toAnchor: NormalizedPoint
}

export interface CommentBinding extends BaseBinding<'comment'> {
  fromId?: ShapeId
  toId: ShapeId
  toAnchor: NormalizedPoint
}

export function isConnectorBinding(binding: BaseBinding<string>): binding is ConnectorBinding {
  return binding.type === 'connector'
}

export function isCommentBinding(binding: BaseBinding<string>): binding is CommentBinding {
  return binding.type === 'comment'
}

export const connectorBinding = {
  create(fromId: ShapeId, fromAnchor: NormalizedPoint, toId: ShapeId, toAnchor: NormalizedPoint): ConnectorBinding {
    return {
      id: createBindingId(),
      type: 'connector',
      fromId,
      fromAnchor,
      toId,
      toAnchor,
    }
  }
}

export const commentBinding = {
  create(fromId: ShapeId, toId: ShapeId, toAnchor: NormalizedPoint): CommentBinding {
    return {
      id: createBindingId(),
      type: 'comment',
      fromId,
      toId,
      toAnchor,
    }
  }
}
