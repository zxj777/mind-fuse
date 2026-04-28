import { describe, expect, it } from 'vitest'
import { InvestigationDocumentManager } from '../src'

describe('investigationDocumentManager', () => {
  it('creates investigation entities with bound shapes', () => {
    const manager = new InvestigationDocumentManager()
    const investigation = manager.createInvestigation('CRDT sync edge cases')
    const capture = manager.createCaptureItem({
      investigationId: investigation.id,
      content: 'Yjs observer fires before spatial index is updated',
    })

    const binding = manager.getCanvasBindings().get(capture.id)
    const shape = manager.getShapeForEntity(capture.id)

    expect(binding).toBeDefined()
    expect(binding?.role).toBe('inbox-slot')
    expect(shape).toBeDefined()
  })

  it('promotes capture items into question and evidence cards', () => {
    const manager = new InvestigationDocumentManager()
    const investigation = manager.createInvestigation('WebGPU fallback investigation')
    const capture = manager.createCaptureItem({
      investigationId: investigation.id,
      content: 'PixiJS WebGPU fallback path',
    })

    const question = manager.promoteCaptureToQuestion(capture.id)
    const evidence = manager.promoteCaptureToEvidence(capture.id)

    expect(question?.text).toContain('PixiJS WebGPU fallback path')
    expect(evidence?.content).toBe('PixiJS WebGPU fallback path')
    expect(manager.getQuestions(investigation.id)).toHaveLength(1)
    expect(manager.getEvidences(investigation.id)).toHaveLength(1)
  })

  it('creates connector relations between evidence and hypotheses', () => {
    const manager = new InvestigationDocumentManager()
    const investigation = manager.createInvestigation('Evidence graph')
    const evidence = manager.createEvidence({
      investigationId: investigation.id,
      content: 'Profiler shows layout work dominates frame time',
    })
    const hypothesis = manager.createHypothesis({
      investigationId: investigation.id,
      statement: 'DOM-based geometry rendering causes layout thrashing',
    })

    const bindings = manager.createEvidenceRelation({
      evidenceId: evidence.id,
      hypothesisId: hypothesis.id,
      relation: 'supports',
    })

    expect(bindings).toHaveLength(2)
    expect(manager.getEvidences(investigation.id)[0]?.supports).toContain(hypothesis.id)
    expect(manager.getCanvasDocument().getShapes().size).toBeGreaterThanOrEqual(3)
  })

  it('creates and restores snapshots', () => {
    const manager = new InvestigationDocumentManager()
    const investigation = manager.createInvestigation('Snapshot flow')
    manager.createQuestion({
      investigationId: investigation.id,
      text: 'How should snapshots restore investigation context?',
    })
    manager.createConclusion({
      investigationId: investigation.id,
      statement: 'Snapshots should restore both semantic and visual state.',
      status: 'hypothesis',
    })

    const snapshot = manager.createSnapshot(investigation.id, 'Initial framing of the snapshot flow')
    const bounds = manager.restoreSnapshot(snapshot.id)

    expect(snapshot.capturedShapeIds.length).toBeGreaterThan(0)
    expect(bounds).toBeDefined()
    expect(manager.getInvestigation(investigation.id)?.rootSnapshotId).toBe(snapshot.id)
  })
})
