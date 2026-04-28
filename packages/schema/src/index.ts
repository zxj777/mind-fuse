import type {
  CanvasBinding,
  CaptureItem,
  Conclusion,
  Evidence,
  Hypothesis,
  Investigation,
  InvestigationDocumentManager,
  Question,
  Snapshot,
  Source,
} from '@mind-fuse/investigation'
import type { Binding, Shape } from '@mind-fuse/types'

export const CURRENT_INVESTIGATION_SCHEMA_VERSION = 1

export interface InvestigationExportBundle {
  version: typeof CURRENT_INVESTIGATION_SCHEMA_VERSION
  investigations: Investigation[]
  captures: CaptureItem[]
  sources: Source[]
  questions: Question[]
  evidences: Evidence[]
  hypotheses: Hypothesis[]
  conclusions: Conclusion[]
  snapshots: Snapshot[]
  canvasBindings: CanvasBinding[]
  shapes: Shape[]
  bindings: Binding[]
}

export function serializeInvestigations(manager: InvestigationDocumentManager): InvestigationExportBundle {
  const canvasDocument = manager.getCanvasDocument()
  return {
    version: CURRENT_INVESTIGATION_SCHEMA_VERSION,
    investigations: [...manager.getInvestigations().values()],
    captures: manager.getCaptureItems(),
    sources: manager.getSources(),
    questions: manager.getQuestions(),
    evidences: manager.getEvidences(),
    hypotheses: manager.getHypotheses(),
    conclusions: manager.getConclusions(),
    snapshots: manager.getSnapshots(),
    canvasBindings: [...manager.getCanvasBindings().values()],
    shapes: [...canvasDocument.getShapes().values()],
    bindings: [...canvasDocument.getBindings().values()],
  }
}

export function listInvestigationMetadata(bundle: InvestigationExportBundle): Array<Pick<Investigation, 'id' | 'title' | 'updatedAt'>> {
  return bundle.investigations.map(investigation => ({
    id: investigation.id,
    title: investigation.title,
    updatedAt: investigation.updatedAt,
  }))
}
