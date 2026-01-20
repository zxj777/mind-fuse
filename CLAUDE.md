# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mind-Fuse is an AI-native collaborative whiteboard application (similar to Miro/FigJam) with self-implemented CRDT for real-time collaboration. The project emphasizes technical depth and modern engineering practices.

**Core Technologies:**
- Frontend: Next.js 15, PixiJS v8 (WebGL/WebGPU), TypeScript
- Backend: Go (Huma v2, nhooyr.io/websocket) + Rust (CRDT, AI algorithms)
- Collaboration: Yjs (Phase 1) → Self-implemented CRDT in Rust (Phase 2)
- Testing: Vitest (unit/integration), Playwright (E2E)

## Repository Structure

This is a monorepo managed with pnpm workspaces:

- `apps/web/` - Next.js frontend application
- `apps/api-go/` - Go backend service (planned)
- `apps/crdt-server/` - Rust CRDT service (Phase 2, planned)
- `packages/` - Shared TypeScript packages
  - `types/` - Core type definitions (shapes, bindings, groups, comments)
  - `collaboration-core/` - DocumentManager and spatial indexing
  - `utils/`, `store/`, `editor/`, etc. - Other shared packages
- `crates/` - Rust workspace (CRDT core, WASM bindings, AI layout algorithms)
- `docs/` - Architecture documentation and design methodology

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Run all workspaces in parallel
pnpm dev

# Run specific workspace (e.g., web app)
pnpm --filter web dev

# Run from a specific package directory
cd packages/types && pnpm dev
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @mind-fuse/types build

# Clean all build artifacts
pnpm clean
```

### Testing

```bash
# Run all tests (uses Vitest)
pnpm test

# Run tests in watch mode
pnpm test

# Run specific test file
pnpm test packages/collaboration-core/__tests__/DocumentManager.test.ts

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (Playwright)
pnpm test:e2e
```

### Linting and Type Checking

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check
```

## Architecture Notes

### Type System Architecture

The `@mind-fuse/types` package is the foundation. Key design principles:

1. **Branded Types for IDs**: All IDs use TypeScript branded types to prevent mixing different ID types
   - `ShapeId`, `BindingId`, `GroupId`, `CommentId`, etc.
   - Factory functions: `createShapeId()`, `createBindingId()`, etc.

2. **Layered Type Definitions**: Types are organized in dependency layers
   - Layer 1: Primitives (`Point`, `Box`, `Color`) and IDs
   - Layer 2: Entities (`Shape`, `Binding`, `Group`, `Comment`)
   - Layer 3: Document and aggregates
   - Layer 4: Operations and validators

3. **Shape Types**: Union discriminated by `type` field
   - `RectShape`, `EllipseShape`, `LineShape`, `TextShape`
   - Common fields: `id`, `x`, `y`, `rotation`, `index`, `isLocked`, `parentId`
   - Shape-specific `props` field

4. **File Paths Always Use Relative Paths**: When working with files in this repository, always use relative paths (e.g., `packages/types/src/shapes.ts`) rather than absolute paths.

### DocumentManager and Spatial Indexing

The `DocumentManager` class (`packages/collaboration-core/src/DocumentManager.ts`) is the core abstraction:

- **Purpose**: In-memory view over a Yjs-backed document with spatial indexing
- **Data Storage**: Uses Yjs Maps for shapes/comments/bindings/groups
- **Spatial Index**: Maintains a `SpatialGrid` for fast hit-testing and viewport queries
- **Observer Pattern**: Automatically updates spatial index when Yjs data changes
- **Key Methods**:
  - `addShape()`, `removeShape()`, `updateShape()` - CRUD operations
  - `findShapeAtPoint()` - Hit testing with z-index ordering
  - `getShapes()`, `getBindings()`, etc. - Read-only access to collections

The `SpatialGrid` class provides O(1) spatial queries:
- Grid-based spatial partitioning (200px cells)
- Handles shapes spanning multiple cells
- Supports negative coordinates
- Methods: `insert()`, `remove()`, `update()`, `query()`, `queryPoint()`

### CRDT Strategy

**Phase 1 (Current)**: Using Yjs for rapid prototyping
- Yjs provides mature CRDT implementation
- WebSocket synchronization via `nhooyr.io/websocket`
- Abstraction layer in `packages/collaboration/` for future migration

**Phase 2 (Planned)**: Self-implemented CRDT in Rust
- YATA algorithm implementation in `crates/crdt-core/`
- WASM bindings for frontend (`crates/crdt-wasm/`)
- gRPC service in Rust (`apps/crdt-server/`)

### Testing Strategy

Tests follow a pyramid structure (70% unit, 25% integration, 5% E2E):

1. **Unit Tests**: Single function correctness (Vitest)
   - Located in `__tests__/` directories or `.test.ts` files
   - Use `describe()`, `it()`, `expect()` from Vitest
   - Global test utilities available (configured in `vitest.config.ts`)

2. **Integration Tests**: Multi-module collaboration
   - Test DocumentManager + SpatialGrid integration
   - Test Yjs synchronization scenarios

3. **E2E Tests**: Real user scenarios (Playwright)
   - Canvas rendering, multi-user collaboration
   - Located in `apps/web/e2e/` (when implemented)

**Coverage Requirements**:
- Target: ≥80% for core packages (`types`, `collaboration-core`)
- Run `pnpm test:coverage` to generate reports

### Code Quality Tools

- **ESLint**: Uses `@antfu/eslint-config` (flat config)
  - Auto-detects TypeScript and React
  - Config: `eslint.config.js`
  - Test files have relaxed rules

- **TypeScript**: Strict mode enabled
  - Base config: `tsconfig.base.json`
  - Per-package configs extend base
  - Key flags: `noUncheckedIndexedAccess`, `noUnusedLocals`, `strict: true`

- **Prettier**: Code formatting
  - Integrated with lint-staged for pre-commit hooks

- **Husky + lint-staged**: Pre-commit hooks
  - Auto-lint and format on commit

### Package Management

- **Package Manager**: pnpm (version ≥8.0.0)
- **Catalog Feature**: Shared dependency versions in `pnpm-workspace.yaml`
  - Use `"catalog:"` in package.json for shared deps
  - Example: `"typescript": "catalog:"` → resolves to `^5.3.0`

- **Workspace Protocol**: Internal packages use `workspace:*`
  - Example: `"@mind-fuse/types": "workspace:*"`

### Build Configuration

- **TypeScript Packages**: Use `tsup` for building
  - Outputs both ESM (`dist/index.mjs`) and CJS (`dist/index.js`)
  - DTS generation enabled
  - Build script: `tsup src/index.ts --format cjs,esm --dts`

- **Development Mode**: Packages expose source files directly
  - `exports["."].development` points to `./src/index.ts`
  - Enables faster iteration without rebuilding

## Important Design Patterns

### Immutability and Pure Functions

- Prefer pure functions that return new objects
- Avoid mutating shapes/documents directly
- Use spread operators for updates: `{ ...shape, x: newX }`

### ID-Based References

- Always reference entities by ID, never by object reference
- Prevents circular dependencies and simplifies serialization
- Example: `Group.memberIds: ShapeId[]` not `members: Shape[]`

### Validation and Type Guards

- Use type guard functions: `isRectShape()`, `isConnectorBinding()`
- Runtime validation with Zod (in `@mind-fuse/validate` package)
- Binding validators ensure structural integrity

### Z-Index Ordering

- Shapes use `index` field (fractional indexing string, e.g., "a0", "a1")
- Comparison: lexicographic string ordering
- Tiebreaker: ShapeId (ensures deterministic ordering)

## Key Documentation

Refer to these files for deeper understanding:

- `plan.md` - Overall technical roadmap and architecture decisions
- `docs/DESIGN_METHODOLOGY.md` - Design principles and methodology
- `docs/ARCHITECTURE.md` - System architecture (when created)
- `docs/CRDT.md` - CRDT design (when created)
- `packages/types/EXAMPLES.md` - Type usage examples
- `.progress/` - Development progress and milestones

## Development Workflow

1. **Before Making Changes**: Read relevant types in `packages/types/src/`
2. **Writing Tests**: Write tests first (TDD recommended)
3. **Type Safety**: Let TypeScript guide you - no `any` types
4. **Commit Messages**: Follow conventional commits format
5. **PR Process**: All tests must pass before merging

## Current Development Phase

**Status**: Phase 1 - MVP Development (Week 1-4)

**Recently Completed**:
- ✅ Monorepo setup with pnpm workspaces
- ✅ Core type definitions (`@mind-fuse/types`)
- ✅ DocumentManager with SpatialGrid
- ✅ Comprehensive test suite for DocumentManager and SpatialGrid
- ✅ Vitest integration for unit testing

**Next Steps**:
- Implement editor package with PixiJS rendering
- Build infinite canvas (viewport, zoom, pan)
- Create basic shape rendering (rect, ellipse, line)
- Develop Canvas Operations API for Agent integration

## Notes for Claude Code

- This project values **technical depth** over rapid feature shipping
- **Documentation is critical** - update docs when making architectural changes
- **Test coverage matters** - aim for ≥80% on core packages
- The codebase follows a **mentor-driven learning approach** (see `.cursor/rules/rule.mdc`)
- When uncertain about architecture decisions, refer to design docs or ask clarifying questions
