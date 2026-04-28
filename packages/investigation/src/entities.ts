import type { ShapeId } from '@mind-fuse/types'
import type {
  CaptureId,
  ConclusionId,
  EvidenceId,
  HypothesisId,
  InvestigationId,
  QuestionId,
  SnapshotId,
  SourceId,
} from './ids'

export type CaptureKind = 'text' | 'link' | 'snippet' | 'ai-answer'
export type SourceKind = 'url' | 'file' | 'rfc' | 'pr' | 'chat' | 'doc'
export type QuestionStatus = 'open' | 'active' | 'parked' | 'closed'
export type HypothesisStatus = 'proposed' | 'supported' | 'refuted' | 'inconclusive'
export type ConclusionStatus = 'hypothesis' | 'verified' | 'rejected' | 'outdated'
export type EvidenceRelation = 'supports' | 'contradicts'

export interface Investigation {
  id: InvestigationId
  title: string
  createdAt: string
  updatedAt: string
  rootSnapshotId?: SnapshotId
}

interface BaseEntity<TId extends string> {
  id: TId
  investigationId: InvestigationId
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface CaptureItem extends BaseEntity<CaptureId> {
  kind: CaptureKind
  content: string
  sourceId?: SourceId
  promotedTo?: QuestionId | EvidenceId
}

export interface Source extends BaseEntity<SourceId> {
  kind: SourceKind
  uri: string
  title: string
  fetchedAt: string
}

export interface Question extends BaseEntity<QuestionId> {
  text: string
  status: QuestionStatus
  parentQuestionId?: QuestionId
  relatedSourceIds: SourceId[]
  relatedEvidenceIds: EvidenceId[]
}

export interface Evidence extends BaseEntity<EvidenceId> {
  content: string
  sourceId?: SourceId
  supports: HypothesisId[]
  contradicts: HypothesisId[]
}

export interface Hypothesis extends BaseEntity<HypothesisId> {
  statement: string
  status: HypothesisStatus
  evidenceIds: EvidenceId[]
}

export interface Conclusion extends BaseEntity<ConclusionId> {
  statement: string
  status: ConclusionStatus
  hypothesisIds: HypothesisId[]
  supersededBy?: ConclusionId
}

export interface Snapshot extends BaseEntity<SnapshotId> {
  summary: string
  capturedShapeIds: ShapeId[]
  capturedQuestionIds: QuestionId[]
  capturedConclusionIds: ConclusionId[]
}

export type InvestigationCanvasEntity = CaptureItem | Source | Question | Evidence | Hypothesis | Conclusion | Snapshot
