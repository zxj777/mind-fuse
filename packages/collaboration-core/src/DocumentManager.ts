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
import SpatialGrid from './SpatialGrid'

/**
 * DocumentManager - In-memory view over a Yjs-backed document with a spatial index.
 *
 * @remarks
 * - Shapes/comments/bindings/groups are stored in Yjs maps (keys are strings).
 * - A Grid spatial index is maintained for fast hit-testing.
 */
export class DocumentManager {
  private readonly yDoc: Y.Doc
  private readonly shapesMap: Y.Map<Shape>
  private readonly commentsMap: Y.Map<Comment>
  private readonly bindingsMap: Y.Map<Binding>
  private readonly groupsMap: Y.Map<Group>
  private readonly spatialGrid: SpatialGrid

  public constructor(yDoc: Y.Doc) {
    this.yDoc = yDoc
    this.shapesMap = this.yDoc.getMap<Shape>('shapes')
    this.commentsMap = this.yDoc.getMap<Comment>('comments')
    this.bindingsMap = this.yDoc.getMap<Binding>('bindings')
    this.groupsMap = this.yDoc.getMap<Group>('groups')
    this.spatialGrid = new SpatialGrid()
    this.setupObservers()
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
    const candidates: ShapeId[] = this.spatialGrid.queryPoint(point)
    let result: Shape | undefined
    for (const shapeId of candidates) {
      const shape: Shape | undefined = this.getShape(shapeId)
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
        this.spatialGrid.remove(shapeId)
        continue
      }
      if (change.action === 'update') {
        const shape: Shape | undefined = this.shapesMap.get(key)
        if (!shape) {
          continue
        }
        this.spatialGrid.update(shape.id, getShapeAABB(shape))
      }
      if (change.action === 'add') {
        const shape: Shape | undefined = this.shapesMap.get(key)
        if (!shape) {
          continue
        }
        this.spatialGrid.insert(shape.id, getShapeAABB(shape))
      }
    }
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
