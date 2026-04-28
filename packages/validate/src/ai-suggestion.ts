import { z } from 'zod'
import { conclusionStatusSchema } from './status'

const aiSuggestionBaseSchema = z.object({
  id: z.string().min(1),
  investigationId: z.string().regex(/^investigation:/),
  title: z.string().min(1),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  status: z.enum(['pending', 'accepted', 'dismissed']),
  createdAt: z.string().min(1),
})

export const aiSuggestionSchema = z.discriminatedUnion('kind', [
  aiSuggestionBaseSchema.extend({
    kind: z.literal('candidate-question'),
    payload: z.object({
      captureId: z.string().regex(/^capture:/),
      text: z.string().min(1),
    }),
  }),
  aiSuggestionBaseSchema.extend({
    kind: z.literal('candidate-hypothesis'),
    payload: z.object({
      statement: z.string().min(1),
    }),
  }),
  aiSuggestionBaseSchema.extend({
    kind: z.literal('candidate-conclusion'),
    payload: z.object({
      statement: z.string().min(1),
      status: conclusionStatusSchema,
    }),
  }),
  aiSuggestionBaseSchema.extend({
    kind: z.literal('relationship'),
    payload: z.object({
      evidenceId: z.string().regex(/^evidence:/),
      hypothesisId: z.string().regex(/^hypothesis:/),
      relation: z.enum(['supports', 'contradicts']),
    }),
  }),
  aiSuggestionBaseSchema.extend({
    kind: z.literal('layout'),
    payload: z.object({
      entityIds: z.array(z.string().min(1)).min(1),
      rationale: z.string().min(1),
    }),
  }),
  aiSuggestionBaseSchema.extend({
    kind: z.literal('snapshot-summary'),
    payload: z.object({
      snapshotId: z.string().regex(/^snapshot:/).optional(),
      summary: z.string().min(1),
    }),
  }),
])

export function assertAISuggestion(input: unknown) {
  return aiSuggestionSchema.parse(input)
}
