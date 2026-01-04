import RBush from 'rbush'
import * as Y from 'yjs'
import {
  Binding,
  BindingId,
  Comment,
  CommentId,
  getShapeAABB,
  Group,
  GroupId,
  isPointInShape,
  Point,
  Shape,
  ShapeId,
} from '@mind-fuse/types'

type SpatialItem = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  shapeId: ShapeId
}

/**
 * DocumentManager - In-memory view over a Yjs-backed document with a spatial index.
 *
 * @remarks
 * - Shapes/comments/bindings/groups are stored in Yjs maps (keys are strings).
 * - A RBush spatial index is maintained incrementally for fast hit-testing.
 */
export class DocumentManager {
  private readonly yDoc: Y.Doc
  private readonly shapesMap: Y.Map<Shape>
  private readonly commentsMap: Y.Map<Comment>
  private readonly bindingsMap: Y.Map<Binding>
  private readonly groupsMap: Y.Map<Group>
  private readonly spatialIndex: RBush<SpatialItem>
  private readonly spatialItemsByShapeId: Map<ShapeId, SpatialItem>

  public constructor(yDoc: Y.Doc) {
    this.yDoc = yDoc
    this.shapesMap = this.yDoc.getMap<Shape>('shapes')
    this.commentsMap = this.yDoc.getMap<Comment>('comments')
    this.bindingsMap = this.yDoc.getMap<Binding>('bindings')
    this.groupsMap = this.yDoc.getMap<Group>('groups')
    this.spatialIndex = new RBush<SpatialItem>()
    this.spatialItemsByShapeId = new Map<ShapeId, SpatialItem>()
    this.setupObservers()
    this.rebuildSpatialIndex()
  }

  public getShape(shapeId: ShapeId): Shape | undefined {
    return this.shapesMap.get(DocumentManager.toYKey(shapeId))
  }

  public getShapes(): ReadonlyMap<ShapeId, Shape> {
    const result: Map<ShapeId, Shape> = new Map<ShapeId, Shape>()
    for (const [key, shape] of this.shapesMap.entries()) {
      result.set(DocumentManager.fromYKey(key), shape)
    }
    return result
  }

  public getComments(): ReadonlyMap<CommentId, Comment> {
    const result: Map<CommentId, Comment> = new Map<CommentId, Comment>()
    for (const [key, comment] of this.commentsMap.entries()) {
      result.set(DocumentManager.fromYKey(key) as unknown as CommentId, comment)
    }
    return result
  }

  public getBindings(): ReadonlyMap<BindingId, Binding> {
    const result: Map<BindingId, Binding> = new Map<BindingId, Binding>()
    for (const [key, binding] of this.bindingsMap.entries()) {
      result.set(DocumentManager.fromYKey(key) as unknown as BindingId, binding)
    }
    return result
  }

  public getGroups(): ReadonlyMap<GroupId, Group> {
    const result: Map<GroupId, Group> = new Map<GroupId, Group>()
    for (const [key, group] of this.groupsMap.entries()) {
      result.set(DocumentManager.fromYKey(key) as unknown as GroupId, group)
    }
    return result
  }

  public findShapeAtPoint(point: Point): Shape | undefined {
    const candidates: SpatialItem[] = this.spatialIndex.search({
      minX: point.x,
      minY: point.y,
      maxX: point.x,
      maxY: point.y,
    })
    let result: Shape | undefined
    for (const item of candidates) {
      const shape: Shape | undefined = this.getShape(item.shapeId)
      if (!shape) {
        continue
      }
      if (!isPointInShape(point, shape)) {
        continue
      }
      if (!result || DocumentManager.compareShapeZ(shape, result) > 0) {
        result = shape
      }
    }
    return result
  }

  public addShape(shape: Shape): void {
    this.shapesMap.set(DocumentManager.toYKey(shape.id), shape)
  }

  public removeShape(shapeId: ShapeId): void {
    this.shapesMap.delete(DocumentManager.toYKey(shapeId))
  }

  public updateShape(shape: Shape): void {
    this.shapesMap.set(DocumentManager.toYKey(shape.id), shape)
  }

  private setupObservers(): void {
    this.shapesMap.observe((event: Y.YMapEvent<Shape>): void => {
      this.handleShapesEvent(event)
    })
  }

  private handleShapesEvent(event: Y.YMapEvent<Shape>): void {
    for (const [key, change] of event.changes.keys) {
      const shapeId: ShapeId = DocumentManager.fromYKey(key)
      if (change.action === 'delete') {
        this.removeFromSpatialIndex(shapeId)
        continue
      }
      const shape: Shape | undefined = this.shapesMap.get(key)
      if (!shape) {
        continue
      }
      this.upsertInSpatialIndex(shape)
    }
  }

  private rebuildSpatialIndex(): void {
    this.spatialIndex.clear()
    this.spatialItemsByShapeId.clear()
    for (const [, shape] of this.shapesMap.entries()) {
      this.upsertInSpatialIndex(shape)
    }
  }

  private upsertInSpatialIndex(shape: Shape): void {
    this.removeFromSpatialIndex(shape.id)
    const aabb = getShapeAABB(shape)
    const item: SpatialItem = {
      minX: aabb.x,
      minY: aabb.y,
      maxX: aabb.x + aabb.width,
      maxY: aabb.y + aabb.height,
      shapeId: shape.id,
    }
    this.spatialItemsByShapeId.set(shape.id, item)
    this.spatialIndex.insert(item)
  }

  private removeFromSpatialIndex(shapeId: ShapeId): void {
    const existing: SpatialItem | undefined = this.spatialItemsByShapeId.get(shapeId)
    if (!existing) {
      return
    }
    this.spatialIndex.remove(existing)
    this.spatialItemsByShapeId.delete(shapeId)
  }

  private static compareShapeZ(a: Shape, b: Shape): number {
    if (a.index === b.index) {
      const aId: string = DocumentManager.toYKey(a.id)
      const bId: string = DocumentManager.toYKey(b.id)
      return aId === bId ? 0 : aId > bId ? 1 : -1
    }
    return a.index > b.index ? 1 : -1
  }

  private static toYKey(id: ShapeId): string {
    return id as unknown as string
  }

  private static fromYKey(key: string): ShapeId {
    return key as unknown as ShapeId
  }
}
