import type { ShapeId } from '@mind-fuse/types'
import type { InvestigationEntityId, SnapshotId } from './ids'

export type CanvasBindingRole = 'card' | 'inbox-slot' | 'snapshot-frame'

export interface CanvasBinding {
  entityId: InvestigationEntityId | SnapshotId
  shapeId: ShapeId
  role: CanvasBindingRole
}
