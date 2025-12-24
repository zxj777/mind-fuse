# Z-Order & Concurrent Ordering (Next Discussion)

## Context
This note captures current ERD/modeling decisions for grouping/deletion, and documents the next focus topic: shape z-order (`Shape.index`) and concurrent reordering semantics.

## Confirmed Decisions

### Group Membership Source of Truth
- `Shape.groupId` is the single source of truth.
- `Group.memberIds` is **read-only derived cache** (never written directly, never used for conflict resolution).

### Group Deletion Behavior
- Deleting a `Group` **ungroups** members.
- Shapes are **not deleted** when a group is deleted.

### Deletion Strategy for Related Records
- For dependent entities (e.g., bindings referencing a deleted shape/comment), we will use **soft delete**.
- Precise cascade rules per relationship are still to be enumerated explicitly (see Follow-ups).

## Deferred / Not Decided Yet

### Comment Coordinates (Bound vs Unbound)
- Deferred for now.

## Next Focus: Z-Order (`Shape.index`) and Concurrency

### Why this matters
`Shape.index` is not just a field; it implies a deterministic ordering protocol under concurrent edits. Without explicit rules, different clients may render different stacking orders or experience order jitter.

### Questions we must answer

#### 1) Uniqueness scope
- Is `Shape.index` required to be unique within a **Document**, within a **Page/Layer**, or not unique at all?

#### 2) Deterministic tie-break
If two shapes end up with the same `index` (or indexes that compare equal), what is the stable tie-break?
- Candidate tie-break keys (example): `(index, createdAt, id)`

#### 3) Concurrent reordering semantics
When two users reorder shapes concurrently:
- Who "wins"? Or do we define a deterministic merge rule (e.g., actorId, timestamp, lamport, operation id)?
- How do we avoid reordering oscillation/jitter during reconciliation?

#### 4) Indexing algorithm choice
What is the intended `index` format?
- Fractional indexing / LexoRank-style strings?
- Dense integers (requires shifting many records on insert)?

#### 5) Rebalance / compaction
If fractional indexes grow over time:
- When do we rebalance?
- Who triggers it (client/server)?
- How do we limit the blast radius (many shapes updated at once) in a real-time collaborative session?

#### 6) API surface & operations
What is the minimal operation set we need?
- `bringToFront`, `sendToBack`, `bringForward`, `sendBackward`, `moveToIndex(afterId/beforeId)`
- Is reordering local to a selection set, or global within the document?

## Follow-ups (to document later)
- Enumerate soft-delete cascade rules per relationship:
  - Deleting `Shape` -> what happens to `ConnectorBinding` / `CommentBinding`?
  - Deleting `Comment` -> what happens to `Reply`?
  - Deleting `Document` -> cascading strategy (hard vs soft vs archive).
