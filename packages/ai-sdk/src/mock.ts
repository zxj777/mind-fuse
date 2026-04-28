import type { CaptureItem, InvestigationId } from '@mind-fuse/investigation'
import type { AISuggestion, AISuggestionStatus } from './types'
import { assertAISuggestion } from '@mind-fuse/validate'

function createSuggestionId(kind: string, index: number): string {
  return `suggestion:${kind}:${index}`
}

function normalizeQuestion(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  if (!trimmed) {
    return 'What should we investigate next?'
  }
  if (trimmed.endsWith('?')) {
    return trimmed
  }
  return `What does "${trimmed.slice(0, 64)}" imply?`
}

export function createQuestionSuggestions(
  investigationId: InvestigationId,
  captures: CaptureItem[],
): AISuggestion[] {
  return captures.slice(-3).map((capture, index) => {
    const suggestion: AISuggestion = {
      id: createSuggestionId('question', index),
      investigationId,
      kind: 'candidate-question',
      title: 'Candidate question',
      summary: 'A low-risk question extracted from recent captured material.',
      confidence: 0.62 + index * 0.08,
      payload: {
        captureId: capture.id,
        text: normalizeQuestion(capture.content),
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    assertAISuggestion(suggestion)
    return suggestion
  })
}

export function updateSuggestionStatus(suggestion: AISuggestion, status: AISuggestionStatus): AISuggestion {
  const next: AISuggestion = {
    ...suggestion,
    status,
  }
  assertAISuggestion(next)
  return next
}
