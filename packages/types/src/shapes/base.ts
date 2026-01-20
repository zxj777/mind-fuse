import { GroupId, ShapeId } from '../ids'

/**
 * BaseShape - Common properties for all shapes
 *
 * @remarks
 * All shapes inherit these properties, but some may have semantic restrictions:
 * - LineShape: rotation is always 0 (lines are defined by endpoints, not rotation)
 *
 * Coordinates (x, y, rotation) are always in world/absolute space, not relative
 * to any parent or group. The groupId field is for logical grouping only and
 * does not affect coordinate transformations.
 */
export interface BaseShape<Type extends string, Props extends object> {
  id: ShapeId
  type: Type
  /**
   * Optional group membership
   *
   * @remarks
   * - This is a logical grouping, not a spatial parent-child relationship
   * - Shapes in a group still store absolute world coordinates
   * - Moving a group updates all member shapes' coordinates
   * - Reserved for future: parentId for true parent-child relationships (Frame/Artboard)
   */
  groupId?: GroupId
  index: string
  x: number
  y: number
  rotation: number
  isLocked: boolean
  props: Props
}
