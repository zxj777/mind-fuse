# CLAUDE.md

This file provides repository-specific guidance for coding agents working on Mind-Fuse.

## Project Overview

Mind-Fuse is a **canvas-native technical investigation workspace** for high-cognitive-load developers.

The product is not a generic AI whiteboard, and it is not a diagram generator. The product core is the Investigation domain plus the workspace surface that lets users capture material, turn it into questions/evidence/hypotheses/conclusions, and revisit that reasoning later.

Authoritative strategy docs:

- `docs/product-strategy.md`
- `docs/REMEDIATION_PLAN.md`
- `docs/AI_BOUNDARY.md`

## Product Structure

Mind-Fuse now has two clearly separated entry surfaces:

- `apps/web` — management surface for login, investigation list, account, billing, and settings
- `apps/workspace` — canvas-native work surface for the investigation experience itself

Do not collapse these back into one app surface. The rendering model, dependencies, and UX responsibilities are intentionally different.

## Repository Structure

This is a pnpm workspace monorepo:

- `apps/web/` — management surface, regular Next.js app, no PixiJS imports
- `apps/workspace/` — investigation work surface shell, renders the canvas via package abstractions
- `packages/types/` — canvas substrate types (`ids`, `geometry`, `shapes`, `bindings`, `groups`, `comment`)
- `packages/collaboration-core/` — Yjs-backed `DocumentManager` and `SpatialGrid`
- `packages/investigation/` — Investigation domain model and `InvestigationDocumentManager`
- `packages/editor/` — PixiJS v8 rendering and interaction engine
- `packages/store/` — application state for selection, viewport, suggestion queue, and workspace UI state
- `packages/ai-sdk/` — AI suggestion protocol and mock suggestion generation
- `packages/schema/` — Investigation import/export and versioned serialization
- `packages/validate/` — Zod runtime validation for entity/shape invariants and AI suggestions
- `packages/utils/` — shared utilities

Archived material lives under `docs/archive/` and should not drive new implementation decisions.

## Core Product Constraints

1. **Investigation is the product core.** The canvas substrate supports the product, but it is not the product definition.
2. **Every Investigation entity needs canvas representation.** Core objects cannot exist only in a sidebar or list.
3. **`apps/web` is not the canvas.** Keep management concerns separate from work-surface concerns.
4. **PixiJS v8 is the only canvas rendering pipeline.** Do not add SVG/DOM transitional rendering for geometry, connectors, selection, or viewport logic.
5. **AI can suggest, not act.** AI output must stay in suggestion form until the user explicitly accepts it.

## Common Commands

### Development

```bash
pnpm install
pnpm dev
pnpm --filter web dev
pnpm --filter workspace dev
```

### Build

```bash
pnpm build
pnpm --filter @mind-fuse/investigation build
pnpm --filter @mind-fuse/editor build
```

### Validation

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:coverage
```

## Architecture Notes

### Substrate vs Domain

`@mind-fuse/types` and `@mind-fuse/collaboration-core` are substrate packages. They provide reusable canvas and Yjs primitives.

`@mind-fuse/investigation` is the domain package. It owns the entities that define the product:

- `Investigation`
- `CaptureItem`
- `Source`
- `Question`
- `Evidence`
- `Hypothesis`
- `Conclusion`
- `Snapshot`
- `CanvasBinding`

### Investigation state model

The product organizes work around questions, evidence, hypotheses, and conclusions:

```ts
type QuestionStatus = 'open' | 'active' | 'parked' | 'closed'
type HypothesisStatus = 'proposed' | 'supported' | 'refuted' | 'inconclusive'
type ConclusionStatus = 'hypothesis' | 'verified' | 'rejected' | 'outdated'
```

Do not weaken `ConclusionStatus` into decorative labels; it is part of the product trust model.

### Canvas binding invariant

Every core Investigation entity that appears on the canvas must have a corresponding `ShapeId` binding.

- Entity creation must create the shape and binding transactionally.
- Shape deletion should archive the linked entity rather than erase investigation history.
- AI must not directly edit shape geometry.

### AI boundary

Allowed AI outputs:

- candidate questions from captured material
- candidate hypotheses and conclusion drafts
- evidence ↔ hypothesis relation suggestions
- layout suggestions as ghost layers
- snapshot summary drafts

Disallowed AI behavior:

- directly editing `x/y` or other shape geometry
- upgrading a conclusion to `verified` without explicit user action
- proactive push notifications or modal interruptions
- cross-investigation auto-merging

## Implementation Guidance

### Type system

- Keep branded IDs for every persistent entity type.
- Prefer immutable updates and pure helper functions.
- Reuse canvas substrate helpers from `@mind-fuse/types` instead of duplicating shape math.

### Rendering and interaction

- `pixi.js` should only be imported inside `@mind-fuse/editor`.
- `apps/web` and `apps/workspace` should consume package-level abstractions, not raw PixiJS APIs.
- DOM overlays are acceptable for text editing and lightweight controls, but the actual canvas scene, selection, connectors, and viewport should stay in PixiJS.

### Testing

- Use Vitest for package tests.
- Domain and validation logic need direct unit tests.
- Editor tests should focus on logic that can be validated without browser-heavy E2E setup, such as viewport math or render-data derivation.

## Current Priority

The current repository priority is executing `docs/REMEDIATION_PLAN.md`:

1. Align docs and narrative to the investigation workspace direction.
2. Remove obsolete placeholder packages and old diagram remnants.
3. Establish the Investigation domain package and runtime validation.
4. Build the workspace surface through package abstractions.
5. Keep the old whiteboard/diagram narrative archived, not active.
