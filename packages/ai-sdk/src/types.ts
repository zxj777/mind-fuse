import type {
  CaptureId,
  ConclusionStatus,
  EvidenceId,
  HypothesisId,
  InvestigationId,
} from '@mind-fuse/investigation'

export type AISuggestionStatus = 'pending' | 'accepted' | 'dismissed'

interface AISuggestionBase<TKind extends string, TPayload> {
  id: string
  investigationId: InvestigationId
  kind: TKind
  title: string
  summary: string
  confidence: number
  payload: TPayload
  status: AISuggestionStatus
  createdAt: string
}

export type CandidateQuestionSuggestion = AISuggestionBase<
  'candidate-question',
  {
    captureId: CaptureId
    text: string
  }
>

export type CandidateHypothesisSuggestion = AISuggestionBase<
  'candidate-hypothesis',
  {
    statement: string
  }
>

export type CandidateConclusionSuggestion = AISuggestionBase<
  'candidate-conclusion',
  {
    statement: string
    status: ConclusionStatus
  }
>

export type RelationshipSuggestion = AISuggestionBase<
  'relationship',
  {
    evidenceId: EvidenceId
    hypothesisId: HypothesisId
    relation: 'supports' | 'contradicts'
  }
>

export type LayoutSuggestion = AISuggestionBase<
  'layout',
  {
    entityIds: string[]
    rationale: string
  }
>

export type SnapshotSummarySuggestion = AISuggestionBase<
  'snapshot-summary',
  {
    snapshotId?: string
    summary: string
  }
>

export type AISuggestion
  = | CandidateQuestionSuggestion
    | CandidateHypothesisSuggestion
    | CandidateConclusionSuggestion
    | RelationshipSuggestion
    | LayoutSuggestion
    | SnapshotSummarySuggestion
