# Miro AI 图表生成文案

> 用于在 Miro 中使用 AI 功能生成领域建模、数据流和状态机图表
>
> 基于 packages/types 的实际类型定义
>
> 最后更新：2025-12-24

## 使用说明

1. 打开 Miro 白板
2. 使用 Miro AI 功能（如 Miro Assist）
3. 复制下面对应的文案块，粘贴到 AI 提示框
4. 如果图表太大，可以分段请求（每个场景或实体单独请求）
5. 生成后手动调整颜色、添加中文翻译（如需要）

---

## 1. 领域建模图（Entity Relationship Diagram）

### 完整 ERD 文案

```
Create an Entity Relationship Diagram (ERD) for a collaborative whiteboard application with the following entities and relationships:

ENTITIES:

1. Document (root container)
   - id: DocumentId (unique identifier)
   - Contains: shapes, groups, bindings, comments

2. Shape (canvas element, union type)
   - id: ShapeId
   - type: "rect" | "line"
   - groupId?: GroupId (optional reference to Group)
   - index: string (z-order)
   - x: number (world coordinate)
   - y: number (world coordinate)
   - rotation: number (radians)
   - isLocked: boolean

   RectShape extends Shape:
   - props.width: number
   - props.height: number
   - props.fill: string
   - props.stroke: string
   - props.strokeWidth: number

   LineShape extends Shape:
   - props.endX: number (relative to x)
   - props.endY: number (relative to y)
   - props.stroke: string
   - props.strokeWidth: number
   - props.startArrow?: "none" | "arrow" | "filled-arrow" | "circle" | "diamond"
   - props.endArrow?: same as above
   - props.pathType?: "straight" | "curved" | "elbow"

3. Group (logical collection of shapes)
   - id: GroupId
   - memberIds: Set<ShapeId> (minimum 2 members required)
   - bounds: { x, y, width, height } (cached AABB)
   Note: Group is NOT a Shape, it's a separate entity

4. Binding (connections between entities)
   - id: BindingId
   - type: "connector" | "comment"

   ConnectorBinding:
   - fromId: ShapeId (must be LineShape)
   - terminal: "start" | "end"
   - toId: ShapeId (must be non-line shape)
   - toAnchor: { x: 0-1, y: 0-1 } (normalized position)

   CommentBinding:
   - fromId: CommentId
   - toId: ShapeId

5. Comment (user annotation)
   - id: CommentId
   - x: number (world coord or normalized if bound)
   - y: number (world coord or normalized if bound)
   - text: string
   - author: UserId
   - createdAt: timestamp
   - resolved: boolean
   - deleted?: boolean (soft delete)
   - replies: Reply[]

6. Reply (comment thread reply)
   - id: ReplyId
   - text: string
   - author: UserId
   - createdAt: timestamp

RELATIONSHIPS:

- A Document may have 0..N Shapes; each Shape belongs to exactly 1 Document
- A Document may have 0..N Groups; each Group belongs to exactly 1 Document
- A Document may have 0..N Bindings; each Binding belongs to exactly 1 Document
- A Document may have 0..N Comments; each Comment belongs to exactly 1 Document
- Shape N:1 Group (many shapes can belong to one group, optional)
- ConnectorBinding N:1 Shape (fromId, must be LineShape)
- ConnectorBinding N:1 Shape (toId, must NOT be LineShape)
- CommentBinding N:1 Comment (fromId)
- CommentBinding N:1 Shape (toId)
- Comment 1:N Reply (one comment has many replies)

CARDINALITY NOTES:
- Use solid lines for required references (must exist)
- Use dashed lines for optional references (can be null)
- Document can be empty: Shapes/Groups/Bindings/Comments are 0..N collections
- Child entities have required `documentId` references (each belongs to exactly 1 Document)
- Shape.groupId is optional (dashed line to Group)
- Group.memberIds must have at least 2 members
- ConnectorBinding constraints: fromId must be LineShape, toId cannot be LineShape

COLOR CODING:
- Blue: Core entities (Shape, Group)
- Green: Relationships (Binding)
- Yellow: Annotations (Comment, Reply)
- Gray: Base types (Point, Box)
```

---

## 2. 数据流设计图（Data Flow Diagrams）

### 场景 1: 创建矩形 Shape

```
Create a Data Flow Diagram titled "Create Rectangle Shape"

Flow:
1. [User Action] Click on canvas with Rectangle tool
   ↓
2. [Generate ID] createShapeId() → ShapeId
   Cost: O(1), ~0.1ms
   ↓
3. [Create Object] new RectShape { id, x, y, type:"rect", props }
   Cost: O(1), ~0.1ms
   ↓
4. [Add to Document] document.shapes.set(shapeId, shape)
   Cost: O(1), ~0.1ms
   ↓
5. [Update Spatial Index] spatialIndex.insert(shapeId, bounds)
   Cost: O(log n), ~1ms for 10k shapes
   Failure Point: Index out of sync
   ↓
6. [Trigger Render] requestAnimationFrame()
   Cost: ~16ms frame budget
   ↓
7. [Broadcast to Peers] WebSocket.send(CreateShapeOp)
   Cost: Network latency 50-200ms
   Failure Point: Network disconnect

Total: ~18ms local + network latency

LEGEND:
- Green boxes: Success steps
- Red boxes: Failure points
- Blue numbers: Performance cost
- Yellow highlight: Critical path (must be < 16ms for 60fps)
```

### 场景 2: 移动 Group 中的 Shape

```
Create a Data Flow Diagram titled "Move Grouped Shape"

Flow:
1. [User Action] Mouse drag on shape
   ↓
2. [Lookup Shape] document.shapes.get(shapeId)
   Cost: O(1), <0.1ms
   Failure Point: Shape not found
   ↓
3. [Check Group] if (shape.groupId) → lookup Group
   document.groups.get(shape.groupId)
   Cost: O(1), <0.1ms
   Failure Point: Group not found (data inconsistency)
   ↓
4. [Calculate Delta] newPos - oldPos = deltaX, deltaY
   Cost: O(1), <0.1ms
   ↓
5. [Move All Members] for each memberId in group.memberIds:
   - shapes.get(memberId).x += deltaX
   - shapes.get(memberId).y += deltaY
   Cost: O(k) where k = member count
   ↓
6. [Update Group Bounds] computeAABB(memberShapes)
   Cost: O(k), ~0.5ms for 10 members
   ↓
7. [Update Spatial Index] for each member: spatialIndex.update()
   Cost: O(k * log n), ~2ms
   ↓
8. [Trigger Render]
   ↓
9. [Broadcast MoveGroupOp]

Total: ~20ms for group of 10 shapes
```

### 场景 3: 删除带 Binding 的 Shape

```
Create a Data Flow Diagram titled "Delete Shape (Cascade)"

Flow:
1. [User Action] Press Delete key on selected shape
   ↓
2. [Lookup Shape] document.shapes.get(shapeId)
   Cost: O(1)
   ↓
3. [Check Locked] if (shape.isLocked) → abort with error
   Failure Point: Shape is locked
   ↓
4. [Find Affected Bindings] getAffectedBindings(shapeId, bindings)
   - Scan all bindings where fromId or toId = shapeId
   Cost: O(m) where m = binding count, or O(1) with index
   ↓
5. [Delete Bindings] for each affected binding:
   document.bindings.delete(binding.id)
   Cost: O(k) where k = affected bindings
   ↓
6. [Check Group Membership] if (shape.groupId):
   - group.memberIds.delete(shapeId)
   - if (group.memberIds.size < 2) → dissolve group
   Cost: O(1)
   Failure Point: Group should auto-dissolve
   ↓
7. [Delete from Document] document.shapes.delete(shapeId)
   Cost: O(1)
   ↓
8. [Update Indexes] spatialIndex.remove(shapeId)
   Cost: O(log n)
   ↓
9. [Trigger Render + Broadcast]

Total: ~5ms + cascade operations
```

### 场景 4: 创建 Group

```
Create a Data Flow Diagram titled "Group Shapes"

Flow:
1. [User Action] Select 3 shapes, press Cmd+G
   ↓
2. [Validate Selection]
   - Must have >= 2 shapes
   - None can already be in a group
   - None can be lines (optional constraint)
   Cost: O(k)
   Failure Point: Validation failed
   ↓
3. [Create Group] group.create(selectedIds, document.shapes)
   - Generate GroupId
   - Compute AABB from all shapes
   Cost: O(k)
   ↓
4. [Update Shape References] for each shape:
   shape.groupId = group.id
   Cost: O(k)
   ↓
5. [Add to Document] document.groups.set(group.id, group)
   Cost: O(1)
   ↓
6. [Update Indexes] groupMembersIndex.set(groupId, memberIds)
   Cost: O(1)
   ↓
7. [Trigger Render + Broadcast]

Total: ~3ms for 3 shapes
```

### 场景 5: 创建 Connector Binding

```
Create a Data Flow Diagram titled "Bind Line Endpoint to Shape"

Flow:
1. [User Action] Drag line endpoint onto a rectangle
   ↓
2. [Hit Test] spatialIndex.query(mousePoint)
   - Find shapes under mouse
   Cost: O(log n + k)
   ↓
3. [Filter Targets] Exclude lines (cannot bind to lines)
   - Use isBindableTarget(shape)
   Cost: O(k)
   ↓
4. [Calculate Anchor]
   - Convert mouse point to normalized coords (0-1)
   - Relative to target shape bounds
   Cost: O(1)
   ↓
5. [Create Binding] connectorBinding.create(lineId, 'end', targetId, anchor)
   Cost: O(1)
   ↓
6. [Validate Binding] validateConnectorBinding(binding, shapes)
   - Check fromId is LineShape
   - Check toId exists and is not LineShape
   Cost: O(1)
   Failure Point: Invalid binding configuration
   ↓
7. [Update Line Endpoint]
   - line.props.endX = targetShape.x + anchor.x * width - line.x
   - line.props.endY = targetShape.y + anchor.y * height - line.y
   Cost: O(1)
   ↓
8. [Add to Document] document.bindings.set(binding.id, binding)
   Cost: O(1)
   ↓
9. [Update Index] shapeBindingsIndex.get(targetId).add(binding.id)
   Cost: O(1)
   ↓
10. [Trigger Render + Broadcast]

Total: ~5ms
```

---

## 3. 状态机设计图（State Machine Diagrams）

### 状态机 1: Group 生命周期

```
Create a State Machine Diagram titled "Group State Machine"

STATES:

1. [Empty] - Initial pseudo-state (Group never actually exists in this state)
   Invariant: Cannot exist - Group must be created with >= 2 members

2. [Active] - Normal operating state
   Invariant: memberIds.size >= 2
   Allowed operations:
   - add shape
   - remove shape (if result >= 2)
   - lock
   - delete

3. [Locked] - Modification prevented
   Invariant: locked === true, memberIds.size >= 2
   Allowed operations:
   - unlock
   - delete
   Blocked operations:
   - add shape (error: "Group is locked")
   - remove shape (error: "Group is locked")

4. [Dissolved] - Final state (Group deleted)
   Invariant: Group removed from document

TRANSITIONS:

[Creation] → [Active]
  Trigger: group.create(shapeIds) with shapeIds.length >= 2
  Action: Generate GroupId, compute bounds, set all shapes' groupId

[Active] → [Active] (self-loop)
  Trigger: addMember(shapeId) or removeMember(shapeId)
  Condition: Result memberIds.size >= 2
  Action: Update bounds, update index

[Active] → [Dissolved]
  Trigger: removeMember(shapeId)
  Condition: Result memberIds.size < 2
  Action: Clear all shapes' groupId, delete group from document

[Active] → [Locked]
  Trigger: lock()
  Action: Set locked = true

[Locked] → [Active]
  Trigger: unlock()
  Action: Set locked = false

[Locked] → [Dissolved]
  Trigger: delete()
  Action: Same as Active → Dissolved

[Active] → [Dissolved]
  Trigger: delete() (explicit user action)
  Action: Clear all shapes' groupId, delete group from document

VISUAL STYLE:
- Green: Normal flow states (Active)
- Red: Terminal states (Dissolved)
- Yellow: Restricted states (Locked)
```

### 状态机 2: Comment 生命周期

```
Create a State Machine Diagram titled "Comment State Machine"

STATES:

1. [Draft] - Being composed (client-side only, not in document)
   Invariant: Not yet persisted

2. [Active] - Normal visible state
   Invariant: deleted !== true, exists in document
   Allowed operations:
   - edit text
   - add reply
   - resolve
   - delete (soft)
   - attach to shape
   - detach from shape

3. [Resolved] - Marked as resolved
   Invariant: resolved === true, deleted !== true
   Allowed operations:
   - unresolve
   - delete (soft)
   - add reply (continues discussion)

4. [Deleted] - Soft deleted (still in document for undo)
   Invariant: deleted === true
   Allowed operations:
   - restore

5. [Purged] - Permanently removed (garbage collected)
   Invariant: Removed from document

TRANSITIONS:

[Draft] → [Active]
  Trigger: User submits comment
  Action: Create Comment object, add to document

[Active] → [Active] (self-loop)
  Trigger: editText(newText) or addReply(reply)
  Action: Update text/replies array

[Active] → [Resolved]
  Trigger: resolve()
  Action: Set resolved = true

[Resolved] → [Active]
  Trigger: unresolve()
  Action: Set resolved = false

[Active] → [Deleted]
  Trigger: delete(userId)
  Action: Set deleted = true, deletedAt = now, deletedBy = userId

[Resolved] → [Deleted]
  Trigger: delete(userId)
  Action: Same as above

[Deleted] → [Active]
  Trigger: restore()
  Action: Set deleted = false, clear deletedAt/deletedBy

[Deleted] → [Purged]
  Trigger: Garbage collection (after N days or explicit purge)
  Action: Remove from document completely

VISUAL STYLE:
- Blue: User action required (Draft)
- Green: Normal flow (Active)
- Yellow: Special states (Resolved)
- Orange: Soft deleted (Deleted)
- Red: Terminal (Purged)
```

### 状态机 3: Shape 交互状态

```
Create a State Machine Diagram titled "Shape Interaction State Machine"

STATES:

1. [Idle] - Shape exists but not interacted with
   Invariant: Not selected, not being edited
   Visual: Normal appearance

2. [Hovered] - Mouse over shape
   Invariant: Cursor is over shape bounds
   Visual: Highlight border

3. [Selected] - Shape is in selection set
   Invariant: shapeId in selectedShapeIds
   Visual: Selection handles visible
   Allowed operations:
   - move
   - resize
   - rotate
   - delete
   - group
   - copy

4. [Dragging] - Being moved
   Invariant: Mouse button down, position changing
   Visual: Semi-transparent, snap guides visible

5. [Resizing] - Being resized via handle
   Invariant: Mouse on resize handle, dimensions changing
   Visual: Resize cursor, dimension tooltip

6. [Rotating] - Being rotated via handle
   Invariant: Mouse on rotation handle, angle changing
   Visual: Rotation cursor, angle indicator

7. [Locked] - Cannot be modified
   Invariant: shape.isLocked === true
   Visual: Lock icon overlay
   Blocked operations: move, resize, rotate, delete

TRANSITIONS:

[Idle] → [Hovered]
  Trigger: mouseEnter
  Condition: Not locked or locked shapes can be hovered

[Hovered] → [Idle]
  Trigger: mouseLeave

[Hovered] → [Selected]
  Trigger: click
  Action: Add to selectedShapeIds

[Selected] → [Idle]
  Trigger: click elsewhere or Escape
  Action: Remove from selectedShapeIds

[Selected] → [Dragging]
  Trigger: mouseDown + mouseDrag
  Condition: Not locked

[Dragging] → [Selected]
  Trigger: mouseUp
  Action: Commit position change

[Selected] → [Resizing]
  Trigger: mouseDown on resize handle
  Condition: Not locked

[Resizing] → [Selected]
  Trigger: mouseUp
  Action: Commit size change

[Selected] → [Rotating]
  Trigger: mouseDown on rotation handle
  Condition: Not locked

[Rotating] → [Selected]
  Trigger: mouseUp
  Action: Commit rotation change

[Any State] → [Locked]
  Trigger: lock()
  Action: Set isLocked = true

[Locked] → [Idle]
  Trigger: unlock()
  Action: Set isLocked = false

VISUAL STYLE:
- Green: Normal flow (Idle, Hovered, Selected)
- Yellow: Transitional (Dragging, Resizing, Rotating)
- Red: Blocked (Locked)
- Dashed red arrows: Blocked transitions from Locked state
```

---

## 4. 补充图表（可选）

### 类型层次结构图

```
Create a Type Hierarchy Diagram showing the inheritance and composition relationships:

BASE TYPES (Layer 1):
- Point { x, y }
- Vec2 { x, y }
- Box { x, y, width, height, rotation }

ID TYPES (Layer 1):
- ShapeId (branded string)
- GroupId (branded string)
- BindingId (branded string)
- CommentId (branded string)
- ReplyId (branded string)
- UserId (branded string)

SHAPE HIERARCHY (Layer 2):
BaseShape<Type, Props>
  ├─ RectShape (type: "rect")
  └─ LineShape (type: "line")

BINDING HIERARCHY (Layer 2):
BaseBinding<Type>
  ├─ ConnectorBinding (type: "connector")
  └─ CommentBinding (type: "comment")

CONTAINER TYPES (Layer 3):
- Group { id, memberIds, bounds }
- Comment { id, x, y, text, author, replies... }
- Reply { id, text, author, createdAt }

DOCUMENT (Layer 4):
- Document { shapes, groups, bindings, comments }

Show arrows indicating:
- Inheritance (solid line with triangle)
- Composition (solid line with diamond)
- Reference (dashed line with arrow)
```

---

## 附录：颜色方案建议

如果 Miro AI 生成的图表颜色不理想，可以手动调整为以下方案：

### 领域建模图

- **蓝色** (#2563EB): 核心实体 (Shape, Group, Document)
- **绿色** (#10B981): 关系实体 (Binding)
- **黄色** (#F59E0B): 注释实体 (Comment, Reply)
- **灰色** (#6B7280): 基础类型 (Point, Box, Vec2)
- **实线**: 必需引用
- **虚线**: 可选引用

### 数据流图

- **绿色框**: 成功步骤
- **红色框**: 失败点
- **蓝色文字**: 性能成本
- **黄色高亮**: 关键路径 (< 16ms)
- **橙色框**: 网络操作

### 状态机图

- **绿色**: 正常流状态
- **黄色**: 过渡/特殊状态
- **橙色**: 软删除/受限状态
- **红色**: 终止/阻塞状态
- **蓝色**: 需要用户操作
- **实线箭头**: 主要转换
- **虚线箭头**: 条件转换
- **红色叉号**: 被阻止的转换

---

**最后更新**: 2025-12-24
**维护者**: @mind-fuse/core-team
**反馈**: 如果生成的图表有问题，请更新此文档或提交 Issue
