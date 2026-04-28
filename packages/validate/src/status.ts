import { z } from 'zod'

export const conclusionStatusSchema = z.enum(['hypothesis', 'verified', 'rejected', 'outdated'])

const allowedTransitions: Record<z.infer<typeof conclusionStatusSchema>, Array<z.infer<typeof conclusionStatusSchema>>> = {
  hypothesis: ['hypothesis', 'verified', 'rejected', 'outdated'],
  verified: ['verified', 'outdated'],
  rejected: ['rejected', 'outdated'],
  outdated: ['outdated'],
}

export function assertConclusionStatusTransition(
  from: z.infer<typeof conclusionStatusSchema>,
  to: z.infer<typeof conclusionStatusSchema>,
): void {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`Invalid conclusion status transition: ${from} -> ${to}`)
  }
}
