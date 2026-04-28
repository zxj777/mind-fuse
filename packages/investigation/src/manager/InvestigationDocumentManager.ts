import type { Binding, Shape, ShapeId } from '@mind-fuse/types'
import type { CanvasBinding, CanvasBindingRole } from '../canvas-binding'
import type {
  CaptureItem,
  CaptureKind,
  Conclusion,
  ConclusionStatus,
  Evidence,
  EvidenceRelation,
  Hypothesis,
  HypothesisStatus,
  Investigation,
  InvestigationCanvasEntity,
  Question,
  QuestionStatus,
  Snapshot,
  Source,
  SourceKind,
} from '../entities'
import type { CaptureId, ConclusionId, EvidenceId, HypothesisId, InvestigationEntityId, InvestigationId, QuestionId, SnapshotId, SourceId } from '../ids'
import { DocumentManager } from '@mind-fuse/collaboration-core'
import {

  Box,
  connectorBinding,
  createLineShape,
  createRectShape,
  createShapeId,
  getShapeAABB,
  Point,

} from '@mind-fuse/types'
import { assertCanvasBinding } from '@mind-fuse/validate'
import * as Y from 'yjs'
import {

  createCaptureId,
  createConclusionId,
  createEvidenceId,
  createHypothesisId,
  createInvestigationId,
  createQuestionId,
  createSnapshotId,
  createSourceId,

} from '../ids'

interface Positioned {
  x: number
  y: number
}

interface CreateCaptureItemInput {
  investigationId: InvestigationId
  content: string
  kind?: CaptureKind
  sourceId?: SourceId
  position?: Positioned
}

interface CreateSourceInput {
  investigationId: InvestigationId
  uri: string
  title: string
  kind?: SourceKind
  position?: Positioned
}

interface CreateQuestionInput {
  investigationId: InvestigationId
  text: string
  status?: QuestionStatus
  parentQuestionId?: QuestionId
  relatedSourceIds?: SourceId[]
  relatedEvidenceIds?: EvidenceId[]
  position?: Positioned
}

interface CreateEvidenceInput {
  investigationId: InvestigationId
  content: string
  sourceId?: SourceId
  position?: Positioned
}

interface CreateHypothesisInput {
  investigationId: InvestigationId
  statement: string
  status?: HypothesisStatus
  evidenceIds?: EvidenceId[]
  position?: Positioned
}

interface CreateConclusionInput {
  investigationId: InvestigationId
  statement: string
  status?: ConclusionStatus
  hypothesisIds?: HypothesisId[]
  position?: Positioned
}

interface CreateRelationInput {
  evidenceId: EvidenceId
  hypothesisId: HypothesisId
  relation: EvidenceRelation
}

const CARD_WIDTH = 220
const CARD_HEIGHT = 108
const LANE_WIDTH = 240
const START_X = 48
const START_Y = 48
const COLUMN_GAP = 280
const ROW_GAP = 144

interface EntityMaps {
  captures: Y.Map<CaptureItem>
  sources: Y.Map<Source>
  questions: Y.Map<Question>
  evidences: Y.Map<Evidence>
  hypotheses: Y.Map<Hypothesis>
  conclusions: Y.Map<Conclusion>
  snapshots: Y.Map<Snapshot>
}

export class InvestigationDocumentManager {
  private readonly yDoc: Y.Doc
  private readonly documentManager: DocumentManager
  private readonly investigationsMap: Y.Map<Investigation>
  private readonly canvasBindingsMap: Y.Map<CanvasBinding>
  private readonly entityMaps: EntityMaps

  public constructor(yDoc?: Y.Doc) {
    this.yDoc = yDoc ?? new Y.Doc()
    this.documentManager = new DocumentManager(this.yDoc)
    this.investigationsMap = this.yDoc.getMap<Investigation>('investigations')
    this.canvasBindingsMap = this.yDoc.getMap<CanvasBinding>('canvasBindings')
    this.entityMaps = {
      captures: this.yDoc.getMap<CaptureItem>('captures'),
      sources: this.yDoc.getMap<Source>('sources'),
      questions: this.yDoc.getMap<Question>('questions'),
      evidences: this.yDoc.getMap<Evidence>('evidences'),
      hypotheses: this.yDoc.getMap<Hypothesis>('hypotheses'),
      conclusions: this.yDoc.getMap<Conclusion>('conclusions'),
      snapshots: this.yDoc.getMap<Snapshot>('snapshots'),
    }
  }

  public getYDoc(): Y.Doc {
    return this.yDoc
  }

  public getCanvasDocument(): DocumentManager {
    return this.documentManager
  }

  public createInvestigation(title: string, id: InvestigationId = createInvestigationId()): Investigation {
    const timestamp = new Date().toISOString()
    const investigation: Investigation = {
      id,
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.investigationsMap.set(this.toKey(id), investigation)
    return investigation
  }

  public getInvestigation(investigationId: InvestigationId): Investigation | undefined {
    return this.investigationsMap.get(this.toKey(investigationId))
  }

  public getInvestigations(): ReadonlyMap<InvestigationId, Investigation> {
    return this.toReadonlyMap(this.investigationsMap)
  }

  public getCaptureItems(investigationId?: InvestigationId): CaptureItem[] {
    return this.listEntities(this.entityMaps.captures, investigationId)
  }

  public getSources(investigationId?: InvestigationId): Source[] {
    return this.listEntities(this.entityMaps.sources, investigationId)
  }

  public getQuestions(investigationId?: InvestigationId): Question[] {
    return this.listEntities(this.entityMaps.questions, investigationId)
  }

  public getEvidences(investigationId?: InvestigationId): Evidence[] {
    return this.listEntities(this.entityMaps.evidences, investigationId)
  }

  public getHypotheses(investigationId?: InvestigationId): Hypothesis[] {
    return this.listEntities(this.entityMaps.hypotheses, investigationId)
  }

  public getConclusions(investigationId?: InvestigationId): Conclusion[] {
    return this.listEntities(this.entityMaps.conclusions, investigationId)
  }

  public getSnapshots(investigationId?: InvestigationId): Snapshot[] {
    return this.listEntities(this.entityMaps.snapshots, investigationId)
  }

  public getCanvasBindings(): ReadonlyMap<string, CanvasBinding> {
    const bindings = new Map<string, CanvasBinding>()
    for (const [key, value] of this.canvasBindingsMap.entries()) {
      bindings.set(key, value)
    }
    return bindings
  }

  public getShapeForEntity(entityId: InvestigationEntityId): Shape | undefined {
    const binding = this.canvasBindingsMap.get(this.toKey(entityId))
    return binding ? this.documentManager.getShape(binding.shapeId) : undefined
  }

  public createCaptureItem(input: CreateCaptureItemInput): CaptureItem {
    const timestamp = new Date().toISOString()
    const capture: CaptureItem = {
      id: createCaptureId(),
      investigationId: input.investigationId,
      kind: input.kind ?? 'text',
      content: input.content,
      sourceId: input.sourceId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(capture, this.entityMaps.captures, 'inbox-slot', input.position)
    return capture
  }

  public createSource(input: CreateSourceInput): Source {
    const timestamp = new Date().toISOString()
    const source: Source = {
      id: createSourceId(),
      investigationId: input.investigationId,
      kind: input.kind ?? 'url',
      uri: input.uri,
      title: input.title,
      fetchedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(source, this.entityMaps.sources, 'card', input.position)
    return source
  }

  public createQuestion(input: CreateQuestionInput): Question {
    const timestamp = new Date().toISOString()
    const question: Question = {
      id: createQuestionId(),
      investigationId: input.investigationId,
      text: input.text,
      status: input.status ?? 'open',
      parentQuestionId: input.parentQuestionId,
      relatedSourceIds: input.relatedSourceIds ?? [],
      relatedEvidenceIds: input.relatedEvidenceIds ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(question, this.entityMaps.questions, 'card', input.position)
    return question
  }

  public createEvidence(input: CreateEvidenceInput): Evidence {
    const timestamp = new Date().toISOString()
    const evidence: Evidence = {
      id: createEvidenceId(),
      investigationId: input.investigationId,
      content: input.content,
      sourceId: input.sourceId,
      supports: [],
      contradicts: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(evidence, this.entityMaps.evidences, 'card', input.position)
    return evidence
  }

  public createHypothesis(input: CreateHypothesisInput): Hypothesis {
    const timestamp = new Date().toISOString()
    const hypothesis: Hypothesis = {
      id: createHypothesisId(),
      investigationId: input.investigationId,
      statement: input.statement,
      status: input.status ?? 'proposed',
      evidenceIds: input.evidenceIds ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(hypothesis, this.entityMaps.hypotheses, 'card', input.position)
    return hypothesis
  }

  public createConclusion(input: CreateConclusionInput): Conclusion {
    const timestamp = new Date().toISOString()
    const conclusion: Conclusion = {
      id: createConclusionId(),
      investigationId: input.investigationId,
      statement: input.statement,
      status: input.status ?? 'hypothesis',
      hypothesisIds: input.hypothesisIds ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(conclusion, this.entityMaps.conclusions, 'card', input.position)
    return conclusion
  }

  public updateConclusionStatus(conclusionId: ConclusionId, status: ConclusionStatus): Conclusion | undefined {
    const conclusion = this.entityMaps.conclusions.get(this.toKey(conclusionId))
    if (!conclusion) {
      return undefined
    }

    const updated: Conclusion = {
      ...conclusion,
      status,
      updatedAt: new Date().toISOString(),
    }
    this.entityMaps.conclusions.set(this.toKey(conclusionId), updated)
    return updated
  }

  public promoteCaptureToQuestion(captureId: CaptureId): Question | undefined {
    const capture = this.entityMaps.captures.get(this.toKey(captureId))
    if (!capture) {
      return undefined
    }

    const captureShape = this.getShapeForEntity(capture.id)
    const position = captureShape ? { x: captureShape.x + COLUMN_GAP, y: captureShape.y } : undefined
    const question = this.createQuestion({
      investigationId: capture.investigationId,
      text: capture.content.endsWith('?') ? capture.content : `${capture.content}?`,
      position,
    })

    this.entityMaps.captures.set(this.toKey(capture.id), {
      ...capture,
      promotedTo: question.id,
      updatedAt: new Date().toISOString(),
    })

    return question
  }

  public promoteCaptureToEvidence(captureId: CaptureId): Evidence | undefined {
    const capture = this.entityMaps.captures.get(this.toKey(captureId))
    if (!capture) {
      return undefined
    }

    const captureShape = this.getShapeForEntity(capture.id)
    const position = captureShape ? { x: captureShape.x + COLUMN_GAP, y: captureShape.y + ROW_GAP } : undefined
    const evidence = this.createEvidence({
      investigationId: capture.investigationId,
      content: capture.content,
      sourceId: capture.sourceId,
      position,
    })

    this.entityMaps.captures.set(this.toKey(capture.id), {
      ...capture,
      promotedTo: evidence.id,
      updatedAt: new Date().toISOString(),
    })

    return evidence
  }

  public createEvidenceRelation(input: CreateRelationInput): Binding[] {
    const evidence = this.entityMaps.evidences.get(this.toKey(input.evidenceId))
    const hypothesis = this.entityMaps.hypotheses.get(this.toKey(input.hypothesisId))
    if (!evidence || !hypothesis) {
      return []
    }

    const evidenceShape = this.getShapeForEntity(evidence.id)
    const hypothesisShape = this.getShapeForEntity(hypothesis.id)
    if (!evidenceShape || !hypothesisShape) {
      return []
    }

    const evidenceCenter = this.getShapeCenter(evidenceShape)
    const hypothesisCenter = this.getShapeCenter(hypothesisShape)
    const connector = createLineShape({
      id: createShapeId(),
      x: evidenceCenter.x,
      y: evidenceCenter.y,
      index: 'z0',
      props: {
        endX: hypothesisCenter.x - evidenceCenter.x,
        endY: hypothesisCenter.y - evidenceCenter.y,
        stroke: input.relation === 'supports' ? '#3fb950' : '#f85149',
        strokeWidth: 3,
        endArrow: 'arrow',
      },
    })

    const startBinding = connectorBinding.create(connector.id, 'start', evidenceShape.id)
    const endBinding = connectorBinding.create(connector.id, 'end', hypothesisShape.id)

    this.yDoc.transact(() => {
      this.documentManager.addShape(connector)
      const bindingsMap = this.yDoc.getMap<Binding>('bindings')
      bindingsMap.set(this.toKey(startBinding.id), startBinding)
      bindingsMap.set(this.toKey(endBinding.id), endBinding)
      this.entityMaps.evidences.set(this.toKey(evidence.id), {
        ...evidence,
        supports: input.relation === 'supports' ? [...evidence.supports, hypothesis.id] : evidence.supports,
        contradicts: input.relation === 'contradicts' ? [...evidence.contradicts, hypothesis.id] : evidence.contradicts,
        updatedAt: new Date().toISOString(),
      })
      this.entityMaps.hypotheses.set(this.toKey(hypothesis.id), {
        ...hypothesis,
        evidenceIds: hypothesis.evidenceIds.includes(evidence.id) ? hypothesis.evidenceIds : [...hypothesis.evidenceIds, evidence.id],
        status: input.relation === 'supports' ? 'supported' : hypothesis.status,
        updatedAt: new Date().toISOString(),
      })
    })

    return [startBinding, endBinding]
  }

  public createSnapshot(investigationId: InvestigationId, summary: string): Snapshot {
    const timestamp = new Date().toISOString()
    const snapshot: Snapshot = {
      id: createSnapshotId(),
      investigationId,
      summary,
      capturedShapeIds: this.listShapesForInvestigation(investigationId),
      capturedQuestionIds: this.getQuestions(investigationId).map(question => question.id),
      capturedConclusionIds: this.getConclusions(investigationId).map(conclusion => conclusion.id),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.createEntityWithCard(snapshot, this.entityMaps.snapshots, 'snapshot-frame', this.nextPositionFor(investigationId, 'snapshot'))
    this.setRootSnapshot(investigationId, snapshot.id)
    return snapshot
  }

  public restoreSnapshot(snapshotId: SnapshotId): Box | undefined {
    const snapshot = this.entityMaps.snapshots.get(this.toKey(snapshotId))
    if (!snapshot) {
      return undefined
    }

    this.setRootSnapshot(snapshot.investigationId, snapshot.id)
    return this.getBoundsForShapeIds(snapshot.capturedShapeIds)
  }

  private setRootSnapshot(investigationId: InvestigationId, snapshotId: SnapshotId): void {
    const investigation = this.investigationsMap.get(this.toKey(investigationId))
    if (!investigation) {
      return
    }

    this.investigationsMap.set(this.toKey(investigationId), {
      ...investigation,
      rootSnapshotId: snapshotId,
      updatedAt: new Date().toISOString(),
    })
  }

  private createEntityWithCard<TEntity extends InvestigationCanvasEntity>(
    entity: TEntity,
    map: Y.Map<TEntity>,
    role: CanvasBindingRole,
    position?: Positioned,
  ): void {
    const resolvedPosition = position ?? this.nextPositionFor(entity.investigationId, role)
    const shape = createRectShape({
      id: createShapeId(),
      x: resolvedPosition.x,
      y: resolvedPosition.y,
      index: role === 'inbox-slot' ? 'b0' : role === 'snapshot-frame' ? 'd0' : 'c0',
      props: {
        width: role === 'snapshot-frame' ? CARD_WIDTH + 40 : role === 'inbox-slot' ? LANE_WIDTH - 32 : CARD_WIDTH,
        height: role === 'snapshot-frame' ? CARD_HEIGHT + 48 : CARD_HEIGHT,
        fill: this.getFillColor(entity, role),
        stroke: this.getStrokeColor(entity, role),
        strokeWidth: 2,
      },
    })
    const binding: CanvasBinding = {
      entityId: entity.id,
      shapeId: shape.id,
      role,
    }

    assertCanvasBinding(binding)

    this.yDoc.transact(() => {
      map.set(this.toKey(entity.id), entity)
      this.documentManager.addShape(shape)
      this.canvasBindingsMap.set(this.toKey(entity.id), binding)
    })
  }

  private nextPositionFor(investigationId: InvestigationId, role: CanvasBindingRole | 'snapshot'): Positioned {
    if (role === 'inbox-slot') {
      const index = this.getCaptureItems(investigationId).length
      return { x: START_X, y: START_Y + index * (CARD_HEIGHT + 16) }
    }

    if (role === 'snapshot' || role === 'snapshot-frame') {
      const index = this.getSnapshots(investigationId).length
      return { x: START_X + COLUMN_GAP * 4, y: START_Y + index * ROW_GAP }
    }

    const xByColumn = [
      START_X + COLUMN_GAP,
      START_X + COLUMN_GAP * 2,
      START_X + COLUMN_GAP * 3,
    ]
    const cardsCount
      = this.getQuestions(investigationId).length
        + this.getEvidences(investigationId).length
        + this.getHypotheses(investigationId).length
        + this.getConclusions(investigationId).length
        + this.getSources(investigationId).length
    const column = cardsCount % xByColumn.length
    const row = Math.floor(cardsCount / xByColumn.length)
    return {
      x: xByColumn[column] ?? START_X + COLUMN_GAP,
      y: START_Y + row * ROW_GAP,
    }
  }

  private getFillColor(entity: InvestigationCanvasEntity, role: CanvasBindingRole): string {
    if (role === 'inbox-slot')
      return '#0f172a'
    if (role === 'snapshot-frame')
      return '#111827'
    if ('text' in entity)
      return '#102a43'
    if ('content' in entity && 'supports' in entity)
      return '#1f2937'
    if ('statement' in entity && 'hypothesisIds' in entity)
      return '#2b1f52'
    if ('statement' in entity)
      return '#0f3d3e'
    if ('uri' in entity)
      return '#1d3557'
    return '#172554'
  }

  private getStrokeColor(entity: InvestigationCanvasEntity, role: CanvasBindingRole): string {
    if (role === 'inbox-slot')
      return '#38bdf8'
    if (role === 'snapshot-frame')
      return '#f59e0b'
    if ('status' in entity && entity.status === 'outdated')
      return '#f59e0b'
    if ('status' in entity && entity.status === 'verified')
      return '#22c55e'
    if ('status' in entity && entity.status === 'rejected')
      return '#ef4444'
    return '#94a3b8'
  }

  private getShapeCenter(shape: Shape): Point {
    const bounds = getShapeAABB(shape)
    return Point.create(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  }

  private getBoundsForShapeIds(shapeIds: ShapeId[]): Box | undefined {
    const shapes = shapeIds
      .map(shapeId => this.documentManager.getShape(shapeId))
      .filter((shape): shape is Shape => Boolean(shape))
    if (shapes.length === 0) {
      return undefined
    }

    const boxes = shapes.map(shape => getShapeAABB(shape))
    const minX = Math.min(...boxes.map(box => box.x))
    const minY = Math.min(...boxes.map(box => box.y))
    const maxX = Math.max(...boxes.map(box => box.x + box.width))
    const maxY = Math.max(...boxes.map(box => box.y + box.height))
    return Box.create(minX, minY, maxX - minX, maxY - minY)
  }

  private listShapesForInvestigation(investigationId: InvestigationId): ShapeId[] {
    return [...this.getCanvasBindings().values()]
      .filter((binding) => {
        const entity = this.getEntity(binding.entityId)
        return entity?.investigationId === investigationId
      })
      .map(binding => binding.shapeId)
  }

  private getEntity(entityId: InvestigationEntityId): InvestigationCanvasEntity | undefined {
    return this.entityMaps.captures.get(this.toKey(entityId as CaptureId))
      ?? this.entityMaps.sources.get(this.toKey(entityId as SourceId))
      ?? this.entityMaps.questions.get(this.toKey(entityId as QuestionId))
      ?? this.entityMaps.evidences.get(this.toKey(entityId as EvidenceId))
      ?? this.entityMaps.hypotheses.get(this.toKey(entityId as HypothesisId))
      ?? this.entityMaps.conclusions.get(this.toKey(entityId as ConclusionId))
      ?? this.entityMaps.snapshots.get(this.toKey(entityId as SnapshotId))
  }

  private listEntities<TEntity extends InvestigationCanvasEntity>(map: Y.Map<TEntity>, investigationId?: InvestigationId): TEntity[] {
    return [...map.values()]
      .filter(entity => (investigationId ? entity.investigationId === investigationId : true))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  private toReadonlyMap<TValue, TKey extends string>(map: Y.Map<TValue>): ReadonlyMap<TKey, TValue> {
    const next = new Map<TKey, TValue>()
    for (const [key, value] of map.entries()) {
      next.set(key as TKey, value)
    }
    return next
  }

  private toKey(id: string): string {
    return id
  }
}
