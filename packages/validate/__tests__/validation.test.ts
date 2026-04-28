import { describe, expect, it } from 'vitest'
import { assertAISuggestion, assertCanvasBinding, assertConclusionStatusTransition } from '../src'

describe('@mind-fuse/validate', () => {
  it('accepts valid canvas bindings', () => {
    const binding = assertCanvasBinding({
      entityId: 'question:test',
      shapeId: 'shape:test',
      role: 'card',
    })

    expect(binding.role).toBe('card')
  })

  it('rejects invalid canvas bindings', () => {
    expect(() =>
      assertCanvasBinding({
        entityId: 'question:test',
        shapeId: 'not-a-shape',
        role: 'card',
      }),
    ).toThrow()
  })

  it('enforces valid conclusion transitions', () => {
    expect(() => assertConclusionStatusTransition('hypothesis', 'verified')).not.toThrow()
    expect(() => assertConclusionStatusTransition('verified', 'hypothesis')).toThrow()
  })

  it('validates AI suggestion payloads', () => {
    const suggestion = assertAISuggestion({
      id: 'suggestion:1',
      investigationId: 'investigation:test',
      kind: 'candidate-question',
      title: 'Candidate question',
      summary: 'Question extracted from capture.',
      confidence: 0.74,
      status: 'pending',
      createdAt: new Date().toISOString(),
      payload: {
        captureId: 'capture:test',
        text: 'How does this flow work?',
      },
    })

    expect(suggestion.kind).toBe('candidate-question')
  })
})
