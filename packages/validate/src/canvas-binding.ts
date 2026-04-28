import { z } from 'zod'

export const canvasBindingSchema = z.object({
  entityId: z.string().regex(/^(capture|source|question|evidence|hypothesis|conclusion|snapshot):/),
  shapeId: z.string().regex(/^shape:/),
  role: z.enum(['card', 'inbox-slot', 'snapshot-frame']),
})

export function assertCanvasBinding(input: unknown) {
  return canvasBindingSchema.parse(input)
}
