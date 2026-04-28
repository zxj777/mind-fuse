'use client'

import type { CaptureItem, Conclusion, ConclusionStatus, Evidence, Hypothesis, InvestigationCanvasEntity, Snapshot } from '@mind-fuse/investigation'
import type { WorkspaceStore } from '@mind-fuse/store'
import type { LineShape, Shape } from '@mind-fuse/types'
import { createQuestionSuggestions, updateSuggestionStatus } from '@mind-fuse/ai-sdk'
import {

  createInvestigationId,

  InvestigationDocumentManager,

} from '@mind-fuse/investigation'
import { createWorkspaceStore } from '@mind-fuse/store'
import { getLineEndpoints, getShapeAABB } from '@mind-fuse/types'
import { Application, Container, Graphics, Text } from 'pixi.js'
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

const PANEL_STYLES = {
  panel: {
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 16,
    padding: 16,
    color: '#e2e8f0',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.28)',
  },
  button: {
    background: '#2563eb',
    color: '#eff6ff',
    border: 'none',
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  secondaryButton: {
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
}

function entityLabel(entity: InvestigationCanvasEntity): string {
  if ('text' in entity)
    return `Question\n${entity.text}`
  if ('content' in entity && 'supports' in entity)
    return `Evidence\n${entity.content}`
  if ('statement' in entity && 'hypothesisIds' in entity)
    return `Conclusion (${entity.status})\n${entity.statement}`
  if ('statement' in entity)
    return `Hypothesis (${entity.status})\n${entity.statement}`
  if ('uri' in entity)
    return `Source\n${entity.title}`
  if ('summary' in entity)
    return `Snapshot\n${entity.summary}`
  return `Capture\n${entity.content}`
}

function textColor(entity: InvestigationCanvasEntity): string {
  if ('status' in entity && entity.status === 'outdated')
    return '#fbbf24'
  if ('status' in entity && entity.status === 'verified')
    return '#86efac'
  if ('status' in entity && entity.status === 'rejected')
    return '#fca5a5'
  return '#e2e8f0'
}

function useWorkspaceState(store: WorkspaceStore) {
  return useSyncExternalStore(store.subscribe.bind(store), store.getState.bind(store))
}

function toHex(cssColor: string): number {
  return Number.parseInt(cssColor.replace('#', ''), 16)
}

function isLineShape(shape: Shape): shape is LineShape {
  return shape.type === 'line'
}

export interface InvestigationWorkspaceProps {
  investigationId?: string
  title: string
}

export function InvestigationWorkspace({ investigationId: providedInvestigationId, title }: InvestigationWorkspaceProps) {
  const managerRef = useRef<InvestigationDocumentManager>(new InvestigationDocumentManager())
  const storeRef = useRef<WorkspaceStore>(createWorkspaceStore())
  const manager = managerRef.current
  const store = storeRef.current
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const viewportRef = useRef(store.getState().viewport)
  const [revision, setRevision] = useState(0)
  const [hypothesisTargetId, setHypothesisTargetId] = useState<string>()
  const investigationId = useMemo(
    () => (providedInvestigationId ? (providedInvestigationId as ReturnType<typeof createInvestigationId>) : createInvestigationId('demo')),
    [providedInvestigationId],
  )
  const workspaceState = useWorkspaceState(store)

  useEffect(() => {
    if (manager.getInvestigation(investigationId)) {
      return
    }

    manager.createInvestigation(title, investigationId)
    const seedQuestion = manager.createQuestion({
      investigationId,
      text: 'How should the workspace preserve investigation context across sessions?',
    })
    const seedHypothesis = manager.createHypothesis({
      investigationId,
      statement: 'Canvas-native structure improves recall when users revisit technical investigations.',
    })
    const seedConclusion = manager.createConclusion({
      investigationId,
      statement: 'Conclusion state must remain user-controlled to preserve trust.',
      hypothesisIds: [seedHypothesis.id],
      status: 'hypothesis',
    })
    manager.createSource({
      investigationId,
      uri: 'docs/REMEDIATION_PLAN.md',
      title: 'Remediation plan',
    })
    store.setSelectedEntityId(seedQuestion.id)
    store.setSuggestions(createQuestionSuggestions(investigationId, manager.getCaptureItems(investigationId)))
    setHypothesisTargetId(seedHypothesis.id)
    setRevision(value => value + 1)
    if (!seedConclusion.status) {
      setRevision(value => value + 1)
    }
  }, [investigationId, manager, store, title])

  useEffect(() => {
    viewportRef.current = workspaceState.viewport
  }, [workspaceState.viewport])

  useEffect(() => {
    let disposed = false

    async function boot() {
      if (!containerRef.current || appRef.current) {
        return
      }

      const app = new Application()
      await app.init({
        antialias: true,
        background: '#020617',
        preference: 'webgpu',
        resizeTo: containerRef.current,
      })

      if (disposed || !containerRef.current) {
        app.destroy(true)
        return
      }

      containerRef.current.appendChild(app.canvas)
      appRef.current = app
      app.canvas.style.width = '100%'
      app.canvas.style.height = '100%'
      app.canvas.style.display = 'block'

      const onWheel = (event: WheelEvent) => {
        event.preventDefault()
        const nextZoom = Math.min(1.8, Math.max(0.55, viewportRef.current.zoom + (event.deltaY > 0 ? -0.08 : 0.08)))
        store.setViewport({ zoom: Number(nextZoom.toFixed(2)) })
      }

      app.canvas.addEventListener('wheel', onWheel, { passive: false })
    }

    void boot()

    return () => {
      disposed = true
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [store])

  const investigation = manager.getInvestigation(investigationId)
  const captures = manager.getCaptureItems(investigationId)
  const questions = manager.getQuestions(investigationId)
  const evidences = manager.getEvidences(investigationId)
  const hypotheses = manager.getHypotheses(investigationId)
  const conclusions = manager.getConclusions(investigationId)
  const snapshots = manager.getSnapshots(investigationId)
  const selectedEntity = workspaceState.selectedEntityId
    ? [
        ...captures,
        ...questions,
        ...evidences,
        ...hypotheses,
        ...conclusions,
        ...manager.getSources(investigationId),
        ...snapshots,
      ].find(entity => entity.id === workspaceState.selectedEntityId)
    : undefined

  useEffect(() => {
    const app = appRef.current
    if (!app || !investigation) {
      return
    }

    const shapes = [...manager.getCanvasDocument().getShapes().values()]
    const bindings = [...manager.getCanvasBindings().values()]
    const shapeEntityMap = new Map(bindings.map(binding => [binding.shapeId, binding.entityId]))
    const world = new Container()
    world.position.set(workspaceState.viewport.x, workspaceState.viewport.y)
    world.scale.set(workspaceState.viewport.zoom)

    const lane = new Graphics()
    lane.roundRect(24, 24, 240, Math.max(640, 120 + captures.length * 124), 18)
    lane.fill({ color: 0x0F172A, alpha: 0.9 })
    lane.stroke({ color: 0x38BDF8, width: 2 })
    world.addChild(lane)

    const laneLabel = new Text({
      text: 'Inbox lane\nPaste text or links here',
      style: {
        fill: '#7dd3fc',
        fontSize: 15,
        fontWeight: '600',
      },
    })
    laneLabel.x = 44
    laneLabel.y = 36
    world.addChild(laneLabel)

    for (const shape of shapes.filter(isLineShape)) {
      const graphic = new Graphics()
      const [start, end] = getLineEndpoints(shape)
      graphic.moveTo(start.x, start.y)
      graphic.lineTo(end.x, end.y)
      graphic.stroke({
        color: toHex(shape.props.stroke),
        width: shape.props.strokeWidth,
      })
      world.addChild(graphic)
    }

    for (const shape of shapes.filter(shape => !isLineShape(shape))) {
      const entityId = shapeEntityMap.get(shape.id)
      if (!entityId) {
        continue
      }
      const entity = [
        ...captures,
        ...questions,
        ...evidences,
        ...hypotheses,
        ...conclusions,
        ...manager.getSources(investigationId),
        ...snapshots,
      ].find(item => item.id === entityId)
      if (!entity) {
        continue
      }

      const bounds = getShapeAABB(shape)
      const graphic = new Graphics()
      graphic.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 16)
      graphic.fill({ color: toHex(shape.props.fill), alpha: 1 })
      graphic.stroke({
        color: entity.id === workspaceState.selectedEntityId ? 0xF8FAFC : toHex(shape.props.stroke),
        width: entity.id === workspaceState.selectedEntityId ? 3 : shape.props.strokeWidth,
      })
      graphic.eventMode = 'static'
      graphic.cursor = 'pointer'
      graphic.on('pointertap', () => {
        store.setSelectedEntityId(entity.id)
      })
      world.addChild(graphic)

      const label = new Text({
        text: entityLabel(entity),
        style: {
          fill: textColor(entity),
          fontSize: 13,
          fontFamily: 'Inter, Arial, sans-serif',
          wordWrap: true,
          wordWrapWidth: bounds.width - 24,
        },
      })
      label.x = bounds.x + 12
      label.y = bounds.y + 12
      world.addChild(label)
    }

    app.stage.removeChildren()
    app.stage.addChild(world)
  }, [
    captures,
    conclusions,
    evidences,
    hypotheses,
    investigation,
    investigationId,
    manager,
    revision,
    snapshots,
    store,
    workspaceState.selectedEntityId,
    workspaceState.viewport,
    questions,
  ])

  const refreshWorkspace = () => {
    store.setSuggestions(createQuestionSuggestions(investigationId, manager.getCaptureItems(investigationId)))
    setRevision(value => value + 1)
  }

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (event) => {
    const text = event.clipboardData.getData('text/plain').trim()
    if (!text) {
      return
    }
    event.preventDefault()
    const capture = manager.createCaptureItem({
      investigationId,
      content: text,
      kind: text.startsWith('http') ? 'link' : 'text',
    })
    store.setSelectedEntityId(capture.id)
    refreshWorkspace()
  }

  const createHypothesisFromSelection = () => {
    if (!selectedEntity) {
      return
    }
    const statement = 'statement' in selectedEntity
      ? selectedEntity.statement
      : 'text' in selectedEntity
        ? `Hypothesis: ${selectedEntity.text}`
        : 'content' in selectedEntity
          ? `Hypothesis: ${selectedEntity.content}`
          : 'Generated hypothesis from selected investigation context'
    const hypothesis = manager.createHypothesis({
      investigationId,
      statement,
    })
    setHypothesisTargetId(hypothesis.id)
    store.setSelectedEntityId(hypothesis.id)
    refreshWorkspace()
  }

  const createConclusionFromSelection = () => {
    const hypothesis = selectedEntity && 'statement' in selectedEntity && !('hypothesisIds' in selectedEntity)
      ? (selectedEntity as Hypothesis)
      : undefined

    const conclusion = manager.createConclusion({
      investigationId,
      statement: hypothesis
        ? `Conclusion draft: ${hypothesis.statement}`
        : 'Conclusion draft: gather more evidence before verification.',
      hypothesisIds: hypothesis ? [hypothesis.id] : [],
      status: 'hypothesis',
    })
    store.setSelectedEntityId(conclusion.id)
    refreshWorkspace()
  }

  const updateSelectedConclusionStatus = (status: ConclusionStatus) => {
    if (!selectedEntity || !('hypothesisIds' in selectedEntity)) {
      return
    }
    manager.updateConclusionStatus(selectedEntity.id as Conclusion['id'], status)
    refreshWorkspace()
  }

  const createSnapshot = () => {
    const snapshot = manager.createSnapshot(investigationId, 'Snapshot of the current investigation board state')
    store.setActiveSnapshotId(snapshot.id)
    refreshWorkspace()
  }

  const openSnapshot = (snapshotId: string) => {
    const bounds = manager.restoreSnapshot(snapshotId as Snapshot['id'])
    if (!bounds) {
      return
    }

    store.setActiveSnapshotId(snapshotId)
    store.setViewport({
      x: Math.max(24, 220 - bounds.x * 0.55),
      y: Math.max(24, 120 - bounds.y * 0.55),
      zoom: 0.85,
    })
    refreshWorkspace()
  }

  const connectSelectedEvidence = (relation: 'supports' | 'contradicts') => {
    if (!selectedEntity || !('supports' in selectedEntity) || !hypothesisTargetId) {
      return
    }
    manager.createEvidenceRelation({
      evidenceId: selectedEntity.id as Evidence['id'],
      hypothesisId: hypothesisTargetId as Hypothesis['id'],
      relation,
    })
    refreshWorkspace()
  }

  const acceptSuggestion = (suggestionId: string) => {
    const suggestion = workspaceState.suggestions.find(item => item.id === suggestionId)
    if (!suggestion || suggestion.kind !== 'candidate-question') {
      return
    }
    manager.createQuestion({
      investigationId,
      text: suggestion.payload.text,
    })
    store.setSuggestions(
      workspaceState.suggestions.map(item => item.id === suggestionId ? updateSuggestionStatus(item, 'accepted') : item),
    )
    refreshWorkspace()
  }

  const shiftViewport = (x: number, y: number) => {
    store.setViewport({
      x: workspaceState.viewport.x + x,
      y: workspaceState.viewport.y + y,
    })
  }

  return (
    <div
      onPaste={handlePaste}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: 24,
      }}
      tabIndex={0}
    >
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '380px 1fr' }}>
        <aside style={{ display: 'grid', gap: 16 }}>
          <section style={PANEL_STYLES.panel}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#93c5fd', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Workspace surface
              </span>
              <h1 style={{ fontSize: 28, lineHeight: 1.15 }}>{investigation?.title ?? title}</h1>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>
                Paste directly into the board to create capture cards. Promote captures into questions or evidence, link evidence to hypotheses, and mark conclusions when the investigation changes.
              </p>
            </div>
          </section>

          <section style={PANEL_STYLES.panel}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button onClick={() => shiftViewport(80, 0)} style={PANEL_STYLES.secondaryButton}>Pan right</button>
              <button onClick={() => shiftViewport(-80, 0)} style={PANEL_STYLES.secondaryButton}>Pan left</button>
              <button onClick={() => shiftViewport(0, 80)} style={PANEL_STYLES.secondaryButton}>Pan down</button>
              <button onClick={() => shiftViewport(0, -80)} style={PANEL_STYLES.secondaryButton}>Pan up</button>
              <button onClick={() => store.setViewport({ zoom: workspaceState.viewport.zoom + 0.1 })} style={PANEL_STYLES.secondaryButton}>Zoom in</button>
              <button onClick={() => store.setViewport({ zoom: Math.max(0.5, workspaceState.viewport.zoom - 0.1) })} style={PANEL_STYLES.secondaryButton}>Zoom out</button>
            </div>
          </section>

          <section style={PANEL_STYLES.panel}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Selected item</h2>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>
              {selectedEntity ? entityLabel(selectedEntity) : 'Select a card on the canvas to inspect or transform it.'}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {selectedEntity && 'content' in selectedEntity && !('supports' in selectedEntity)
                ? (
                    <>
                      <button
                        onClick={() => {
                          manager.promoteCaptureToQuestion((selectedEntity as CaptureItem).id)
                          refreshWorkspace()
                        }}
                        style={PANEL_STYLES.button}
                      >
                        Promote to question
                      </button>
                      <button
                        onClick={() => {
                          manager.promoteCaptureToEvidence((selectedEntity as CaptureItem).id)
                          refreshWorkspace()
                        }}
                        style={PANEL_STYLES.button}
                      >
                        Promote to evidence
                      </button>
                    </>
                  )
                : null}
              <button onClick={createHypothesisFromSelection} style={PANEL_STYLES.secondaryButton}>
                Create hypothesis
              </button>
              <button onClick={createConclusionFromSelection} style={PANEL_STYLES.secondaryButton}>
                Create conclusion
              </button>
              {selectedEntity && 'hypothesisIds' in selectedEntity
                ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {(['hypothesis', 'verified', 'rejected', 'outdated'] as ConclusionStatus[]).map(status => (
                        <button key={status} onClick={() => updateSelectedConclusionStatus(status)} style={PANEL_STYLES.secondaryButton}>
                          Mark
                          {' '}
                          {status}
                        </button>
                      ))}
                    </div>
                  )
                : null}
              {selectedEntity && 'supports' in selectedEntity
                ? (
                    <>
                      <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                        Hypothesis target
                        <select
                          value={hypothesisTargetId}
                          onChange={event => setHypothesisTargetId(event.target.value)}
                          style={{ borderRadius: 12, padding: '10px 12px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }}
                        >
                          {hypotheses.map(hypothesis => (
                            <option key={hypothesis.id} value={hypothesis.id}>
                              {hypothesis.statement}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => connectSelectedEvidence('supports')} style={PANEL_STYLES.button}>
                          Link support
                        </button>
                        <button onClick={() => connectSelectedEvidence('contradicts')} style={PANEL_STYLES.secondaryButton}>
                          Link contradiction
                        </button>
                      </div>
                    </>
                  )
                : null}
            </div>
          </section>

          <section style={PANEL_STYLES.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18 }}>Snapshots</h2>
              <button onClick={createSnapshot} style={PANEL_STYLES.button}>Create snapshot</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshots.length === 0 ? <span style={{ color: '#94a3b8', fontSize: 14 }}>No snapshots yet.</span> : null}
              {snapshots.map(snapshot => (
                <button
                  key={snapshot.id}
                  onClick={() => openSnapshot(snapshot.id)}
                  style={{
                    ...PANEL_STYLES.secondaryButton,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                  }}
                >
                  {snapshot.summary}
                </button>
              ))}
            </div>
          </section>

          <section style={PANEL_STYLES.panel}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>AI suggestions</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {workspaceState.suggestions.length === 0 ? <span style={{ color: '#94a3b8', fontSize: 14 }}>Paste a capture to generate candidate questions.</span> : null}
              {workspaceState.suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  style={{
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    borderRadius: 14,
                    padding: 12,
                    background: '#111827',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <strong>{suggestion.title}</strong>
                  <span style={{ color: '#cbd5e1', fontSize: 13 }}>
                    {suggestion.kind === 'candidate-question' ? suggestion.payload.text : suggestion.summary}
                  </span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    Confidence
                    {' '}
                    {(suggestion.confidence * 100).toFixed(0)}
                    %
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => acceptSuggestion(suggestion.id)}
                      style={PANEL_STYLES.button}
                      disabled={suggestion.status !== 'pending'}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => store.updateSuggestionStatus(suggestion.id, 'dismissed')}
                      style={PANEL_STYLES.secondaryButton}
                      disabled={suggestion.status !== 'pending'}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section style={{ ...PANEL_STYLES.panel, minHeight: 'calc(100vh - 48px)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(15, 23, 42, 0.88)' }}>
            <strong>Canvas-native investigation view</strong>
            <span style={{ marginLeft: 12, color: '#94a3b8', fontSize: 13 }}>
              Paste on this page to create capture cards. The canvas is rendered by PixiJS v8 inside `@mind-fuse/editor`.
            </span>
          </div>
          <div ref={containerRef} style={{ height: 'calc(100vh - 120px)', width: '100%' }} />
        </section>
      </div>
    </div>
  )
}
