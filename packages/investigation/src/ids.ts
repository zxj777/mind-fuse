import { generateId } from '@mind-fuse/types'

export type InvestigationId = string & { readonly __brand: 'InvestigationId' }
export type CaptureId = string & { readonly __brand: 'CaptureId' }
export type SourceId = string & { readonly __brand: 'SourceId' }
export type QuestionId = string & { readonly __brand: 'QuestionId' }
export type EvidenceId = string & { readonly __brand: 'EvidenceId' }
export type HypothesisId = string & { readonly __brand: 'HypothesisId' }
export type ConclusionId = string & { readonly __brand: 'ConclusionId' }
export type SnapshotId = string & { readonly __brand: 'SnapshotId' }

export type InvestigationEntityId
  = | CaptureId
    | SourceId
    | QuestionId
    | EvidenceId
    | HypothesisId
    | ConclusionId
    | SnapshotId

function createId<TId extends string>(prefix: string, id?: string): TId {
  return `${prefix}:${id ?? generateId()}` as TId
}

export function createInvestigationId(id?: string): InvestigationId {
  return createId<InvestigationId>('investigation', id)
}

export function createCaptureId(id?: string): CaptureId {
  return createId<CaptureId>('capture', id)
}

export function createSourceId(id?: string): SourceId {
  return createId<SourceId>('source', id)
}

export function createQuestionId(id?: string): QuestionId {
  return createId<QuestionId>('question', id)
}

export function createEvidenceId(id?: string): EvidenceId {
  return createId<EvidenceId>('evidence', id)
}

export function createHypothesisId(id?: string): HypothesisId {
  return createId<HypothesisId>('hypothesis', id)
}

export function createConclusionId(id?: string): ConclusionId {
  return createId<ConclusionId>('conclusion', id)
}

export function createSnapshotId(id?: string): SnapshotId {
  return createId<SnapshotId>('snapshot', id)
}

function hasPrefix(value: string, prefix: string): boolean {
  return value.startsWith(`${prefix}:`)
}

export function isInvestigationId(value: string): value is InvestigationId {
  return hasPrefix(value, 'investigation')
}

export function isInvestigationEntityId(value: string): value is InvestigationEntityId {
  return [
    'capture',
    'source',
    'question',
    'evidence',
    'hypothesis',
    'conclusion',
    'snapshot',
  ].some(prefix => hasPrefix(value, prefix))
}
