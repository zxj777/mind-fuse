# Document 类型设计进度

> 创建时间: 2025-12-24
> 状态: 初步设计完成，待深入讨论关键问题
> 下次开始位置: 从第 3 节"索引设计"开始讨论

---

## 📝 当前设计状态

### 已完成的基础定义

```typescript
// packages/types/src/document.ts (19 行)
export interface Document {
  id: DocumentId
  createdAt: Date
  updatedAt: Date
  shapes: Map<ShapeId, Shape>
  comments: Map<CommentId, Comment>
  bindings: Map<BindingId, Binding>
  groups: Map<GroupId, Group>
}
```

### 初步设计决策

你的初步答案：

1. ✅ **Map vs Array**: 选择 Map，查询删除都是 O(1)，用 `deleted` 标识过滤
2. ✅ **version 字段**: 确定用户的修改是基于哪个版本的（需要展开讨论）
3. ⏸️ **索引设计**: 没有概念，需要进一步讨论
4. ⏸️ **序列化**: 每个人的选择不需要传输给服务器，Map/Set 转换需要讨论
5. ✅ **约束**: Document 可以空，其他都不能为空。需要类型 + 运行时验证
6. ⏸️ **工具函数**: 需要进一步讨论

---

## 🔍 待深入讨论的 6 个关键问题

### 1. ✅ Map vs Array & 软删除策略

**你的初步答案**: 选择 Map，查询删除都是 O(1)，用 `deleted` 标识过滤

#### 为什么选择 Map？（待详细展开）

**性能对比**：

| 操作           | Map              | Array                     |
| -------------- | ---------------- | ------------------------- |
| 按 ID 查找     | O(1)             | O(n) 或 O(log n) 二分查找 |
| 插入           | O(1)             | O(1) push / O(n) splice   |
| 删除（软删除） | O(1) 设置标志    | O(1) 设置标志             |
| 删除（硬删除） | O(1) `delete()`  | O(n) splice               |
| 遍历所有元素   | O(n) forEach/for | O(n) forEach/for          |

**明天讨论点**：
- ✅ Map 的内存占用是否比 Array 高？
- ✅ Map 的序列化是否更麻烦？（JSON.stringify 不支持 Map）
- ✅ 为什么 tldraw、Figma 都用 Map？

#### 软删除 vs 硬删除（待详细展开）

**软删除**（你的选择）：

```typescript
interface Shape {
  deleted?: boolean
  deletedAt?: number
  deletedBy?: UserId
}

// 查询时过滤
const activeShapes = Array.from(document.shapes.values()).filter((s) => !s.deleted)
```

**硬删除**：

```typescript
// 直接从 Map 中移除
document.shapes.delete(shapeId)
```

**明天讨论点**：
- ✅ 软删除的优势：Undo/Redo、协同冲突解决、回收站功能
- ✅ 软删除的劣势：内存占用增加、查询时需要过滤
- ⚠️ **关键问题**：软删除的实体什么时候"真正"删除（垃圾回收策略）？
- ⚠️ **关键问题**：如果 Shape A 被软删除，但 Binding 还引用它，怎么办？

---

### 2. ⚠️ Version 字段的作用（需要展开讨论）

**你的初步答案**: 确定用户的修改是基于哪个版本的

#### 什么是 Version？

`version` 是一个**单调递增的整数**，每次 Document 修改后 +1。

```typescript
interface Document {
  version: number // 例如: 1, 2, 3, 4, ...
}
```

#### 为什么需要 Version？（乐观锁）

**场景：多人协同编辑**

1. **用户 A** 和 **用户 B** 同时打开 Document（version = 10）
2. **用户 A** 修改了一个矩形的颜色 → 提交给服务器：`{ version: 10, changes: [...] }`
3. **服务器**检查：当前 version 是 10 吗？✅ 是 → 接受修改，version 变为 11
4. **用户 B** 也修改了一个矩形的位置 → 提交给服务器：`{ version: 10, changes: [...] }`
5. **服务器**检查：当前 version 是 10 吗？❌ 否（现在是 11）→ **拒绝修改**，让用户 B 先同步最新状态

**明天讨论点**：

- ⚠️ **关键问题 1**: Version 是 Document 级别，还是 Shape 级别？
  - Document 级别：任何修改都让整个 Document version +1
  - Shape 级别：每个 Shape 有自己的 version（更细粒度的冲突检测）
- ⚠️ **关键问题 2**: 如果用户 B 的修改被拒绝，应该怎么办？
  - 方案 A：强制刷新（丢弃用户 B 的修改）❌ 用户体验差
  - 方案 B：自动合并（CRDT）✅ 但需要复杂的算法
  - 方案 C：提示用户冲突，让用户选择 ⚠️ 中断工作流
- ⚠️ **关键问题 3**: Version 是否需要序列化？还是只在内存中？
- ⚠️ **关键问题 4**: CRDT（Yjs）是否还需要 version？
  - CRDT 自带冲突解决，可能不需要手动 version 管理

#### 示例代码（明天讨论）

```typescript
// 服务器端伪代码
function applyChanges(documentId: string, clientVersion: number, changes: Change[]) {
  const doc = loadDocument(documentId)

  // 乐观锁检查
  if (doc.version !== clientVersion) {
    throw new ConflictError('Document has been modified by another user')
  }

  // 应用修改
  applyChangesToDocument(doc, changes)

  // Version +1
  doc.version += 1
  doc.updatedAt = new Date()

  saveDocument(doc)
  return doc
}
```

---

### 3. ⚠️ 索引设计（你表示没有概念，需要详细讨论）

#### 什么是索引？

索引是**预先计算的查找表**，加速特定查询。

**类比**：
- **核心数据**是一本字典（按字母顺序排列）
- **索引**是字典的"按主题分类目录"（快速找到某个主题的所有词）

#### 为什么需要索引？

**场景 1：视口渲染**（只渲染屏幕内的 shape）

**没有索引**：

```typescript
// 遍历所有 shape，检查是否在视口内 - O(n)
function getVisibleShapes(document: Document, viewport: Box): Shape[] {
  const visibleShapes: Shape[] = []
  for (const shape of document.shapes.values()) {
    if (intersects(shape, viewport)) {
      visibleShapes.push(shape)
    }
  }
  return visibleShapes
}
```

- 问题：如果 Document 有 10,000 个 shape，每次渲染都要遍历 10,000 次 ❌
- 结果：性能差，帧率低

**有索引**（空间索引 - R-Tree）：

```typescript
// 使用 R-Tree 查询 - O(log n + k)，k 是结果数量
function getVisibleShapes(document: Document, viewport: Box): Shape[] {
  return document.spatialIndex.search(viewport)
}
```

- 优势：只查询可能相交的 shape，跳过大部分 shape ✅
- 结果：性能好，帧率高

**场景 2：查找 Group 的所有成员**

**没有索引**：

```typescript
// 遍历所有 shape，检查 groupId - O(n)
function getGroupMembers(document: Document, groupId: GroupId): Shape[] {
  const members: Shape[] = []
  for (const shape of document.shapes.values()) {
    if (shape.groupId === groupId) {
      members.push(shape)
    }
  }
  return members
}
```

**有索引**（groupMembersIndex）：

```typescript
interface Document {
  groupMembersIndex: Map<GroupId, Set<ShapeId>>
}

// O(1) 查找 + O(k) 构建结果
function getGroupMembers(document: Document, groupId: GroupId): Shape[] {
  const memberIds = document.groupMembersIndex.get(groupId) ?? new Set()
  return Array.from(memberIds).map((id) => document.shapes.get(id)!)
}
```

#### 明天讨论点：哪些索引是必需的？

| 索引名称             | 用途                         | 核心数据还是派生数据？ | 何时重建？           |
| -------------------- | ---------------------------- | ---------------------- | -------------------- |
| `spatialIndex`       | 视口查询、碰撞检测           | 派生数据               | 每次 shape 移动/缩放 |
| `groupMembersIndex`  | 查找 Group 的所有成员        | 派生数据               | 每次 groupId 修改    |
| `shapeBindingsIndex` | 查找 Shape 的所有 Binding    | 派生数据               | 每次 Binding 修改    |
| `typeIndex`          | 查找特定类型的所有 Shape     | 派生数据（可选）       | 每次 Shape 创建/删除 |
| `commentIndex`       | 查找 Shape 的所有 Comment    | 派生数据（可选）       | 每次 Comment 修改    |
| `deletedShapesIndex` | 快速过滤已删除的 Shape       | 派生数据（可选）       | 每次软删除           |
| `zOrderIndex`        | Z-order 排序（渲染顺序）     | 派生数据（可选）       | 每次 index 修改      |
| `parentChildIndex`   | 查找父子关系（如果使用 Frame | 派生数据（可选）       | 每次 parentId 修改   |

**关键问题**：
- ⚠️ 索引是"急切更新"（每次修改立即更新）还是"懒加载"（查询时才更新）？
- ⚠️ 如果索引失效（dirty），如何标记和重建？
- ⚠️ 索引是否需要在 Document 类型中声明？还是只在运行时（内存）中存在？

#### 空间索引（R-Tree）深入讨论

**R-Tree** 是一种空间索引数据结构，类似 B-Tree 但用于多维空间。

**示例库**：
- [`rbush`](https://github.com/mourner/rbush)（JavaScript，高性能）
- [`flatbush`](https://github.com/mourner/flatbush)（静态数据优化）

**使用示例**（明天讨论）：

```typescript
import RBush from 'rbush'

// 插入 shape 到空间索引
const spatialIndex = new RBush<ShapeId>()
for (const shape of document.shapes.values()) {
  const bounds = getShapeBounds(shape)
  spatialIndex.insert({
    minX: bounds.x,
    minY: bounds.y,
    maxX: bounds.x + bounds.width,
    maxY: bounds.y + bounds.height,
    shapeId: shape.id,
  })
}

// 查询视口内的 shape
const viewport = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
const visibleShapeIds = spatialIndex.search(viewport)
```

**关键问题**（明天讨论）：
- ⚠️ R-Tree 的插入/删除是否昂贵？
- ⚠️ Shape 移动时，是否需要"删除旧位置 + 插入新位置"？
- ⚠️ 旋转后的 shape 如何插入 R-Tree？（AABB vs OBB）

---

### 4. ⚠️ 序列化策略（需要讨论 Map/Set 转换）

**你的初步答案**: 每个人的选择不需要传输给服务器

#### 核心数据 vs 运行时状态

**核心数据**（必须序列化，保存到服务器/本地存储）：

```typescript
interface Document {
  id: DocumentId
  version: number
  createdAt: Date
  updatedAt: Date
  shapes: Map<ShapeId, Shape> // ✅ 必须序列化
  comments: Map<CommentId, Comment> // ✅ 必须序列化
  bindings: Map<BindingId, Binding> // ✅ 必须序列化
  groups: Map<GroupId, Group> // ✅ 必须序列化
}
```

**运行时状态**（不序列化，只在客户端内存中）：

```typescript
interface Document {
  // 索引（可以从核心数据重建）
  spatialIndex: RBush<ShapeId> // ❌ 不序列化，加载时重建
  groupMembersIndex: Map<GroupId, Set<ShapeId>> // ❌ 不序列化

  // UI 状态（每个用户独立）
  selectedShapeIds: Set<ShapeId> // ❌ 不序列化
  hoveredShapeId: ShapeId | null // ❌ 不序列化
  viewport: { x: number; y: number; zoom: number } // ❌ 不序列化
}
```

#### 为什么 `selectedShapeIds` 不序列化？

**原因**：
- **每个用户的选择是独立的**，不应该共享
- 用户 A 选择了矩形，用户 B 不应该看到这个选择
- 多人协同时，每个人可以选择不同的 shape

**例外**：
- 有些协同工具会显示"其他用户的光标和选择"（如 Google Docs、Figma）
- 这种情况下，选择是通过**实时消息**（WebSocket）传输，而不是序列化到 Document

#### Map/Set 序列化问题

**问题**：`JSON.stringify` 不支持 Map 和 Set

```typescript
const doc: Document = {
  shapes: new Map([['shape:1', rect]]),
  selectedShapeIds: new Set(['shape:1']),
}

JSON.stringify(doc)
// 结果: { "shapes": {}, "selectedShapeIds": {} } ❌ 空对象！
```

**解决方案**（明天讨论）：

**方案 A：手动转换**

```typescript
function serializeDocument(doc: Document): string {
  return JSON.stringify({
    id: doc.id,
    version: doc.version,
    shapes: Array.from(doc.shapes.entries()), // Map → [key, value][]
    groups: Array.from(doc.groups.entries()),
    // ...
  })
}

function deserializeDocument(json: string): Document {
  const data = JSON.parse(json)
  return {
    id: data.id,
    version: data.version,
    shapes: new Map(data.shapes), // [key, value][] → Map
    groups: new Map(data.groups),
    // ...
  }
}
```

**方案 B：自定义 toJSON**

```typescript
interface SerializableDocument {
  toJSON(): object
}

class Document implements SerializableDocument {
  shapes: Map<ShapeId, Shape>

  toJSON() {
    return {
      shapes: Array.from(this.shapes.entries()),
    }
  }
}
```

**方案 C：使用库（如 `superjson`）**

```typescript
import superjson from 'superjson'

const json = superjson.stringify(doc) // 自动处理 Map/Set/Date
const doc = superjson.parse<Document>(json)
```

**明天讨论点**：
- ⚠️ 哪种方案最适合协同编辑场景？
- ⚠️ 是否需要区分"完整序列化"（保存到服务器）和"增量序列化"（CRDT patch）？
- ⚠️ Date 类型是否需要转换为 timestamp（number）？

---

### 5. ✅ 约束与验证

**你的初步答案**: Document 可以空，其他都不能为空。需要类型 + 运行时验证

#### 约束分类

| 实体     | 是否允许空（零个）？ | 是否允许孤立引用？ | 验证时机         |
| -------- | -------------------- | ------------------ | ---------------- |
| Document | ✅ 允许（空白画布）  | N/A                | 创建时（类型）   |
| Shape    | ✅ 允许（空文档）    | N/A                | 创建时（类型）   |
| Group    | ❌ 不允许            | ❌ 不允许          | 创建时（运行时） |
| Binding  | ✅ 允许              | ❌ 不允许          | 创建时（运行时） |
| Comment  | ✅ 允许              | ✅ 允许            | 创建时（类型）   |

**详细说明**：

**Group 不允许空**：

```typescript
interface Group {
  memberIds: Set<ShapeId>
}

// 验证
if (group.memberIds.size < 2) {
  throw new GroupValidationError('Group must have at least 2 members')
}
```

**Binding 不允许孤立引用**：

```typescript
interface ConnectorBinding {
  fromId: ShapeId // 必须存在于 document.shapes
  toId: ShapeId // 必须存在于 document.shapes
}

// 验证
const fromShape = document.shapes.get(binding.fromId)
if (!fromShape) {
  throw new BindingValidationError('fromId does not exist')
}
```

**Comment 允许孤立**：

- 没有 CommentBinding 的 Comment 可以独立存在（浮动评论）
- 有 CommentBinding 但 toId 不存在时，视为"孤立评论"（需要特殊处理）

#### 类型约束 vs 运行时验证

**类型约束**（编译时）：

```typescript
interface Document {
  shapes: Map<ShapeId, Shape> // 类型保证 key 是 ShapeId，value 是 Shape
}

// 编译错误 ❌
const doc: Document = {
  shapes: new Map([['invalid', rect]]), // 'invalid' 不是 ShapeId
}
```

**运行时验证**（函数调用时）：

```typescript
function addShapeToDocument(doc: Document, shape: Shape): void {
  // 运行时检查
  if (doc.shapes.has(shape.id)) {
    throw new Error('Shape ID already exists')
  }
  doc.shapes.set(shape.id, shape)
}
```

**明天讨论点**：
- ⚠️ 何时运行验证？每次操作后？还是显式调用 `validateDocument()`？
- ⚠️ 验证失败应该抛出异常，还是返回错误对象？
- ⚠️ 如果 Binding 的 toId 指向被软删除的 Shape，是否算孤立？

---

### 6. ⚠️ 工具函数设计（需要进一步讨论）

#### 必需的工具函数（明天讨论）

**分类 1：工厂函数**（创建新实体）

```typescript
function createDocument(): Document

function createDocument(props: Partial<Document>): Document
```

**分类 2：查询函数**（只读）

```typescript
// 查找 Group 的所有成员
function getGroupMembers(doc: Document, groupId: GroupId): Shape[]

// 查找 Shape 的所有 Binding
function getShapeBindings(doc: Document, shapeId: ShapeId): Binding[]

// 查找 Shape 的所有 Comment
function getShapeComments(doc: Document, shapeId: ShapeId): Comment[]

// 视口查询
function getVisibleShapes(doc: Document, viewport: Box): Shape[]

// 查找子元素（如果使用 parentId）
function getChildren(doc: Document, parentId: ShapeId): Shape[]

// 获取全局变换矩阵
function getGlobalTransform(doc: Document, shapeId: ShapeId): Matrix
```

**分类 3：修改函数**（mutation）

```typescript
// 添加 Shape
function addShape(doc: Document, shape: Shape): void

// 删除 Shape（软删除）
function deleteShape(doc: Document, shapeId: ShapeId, userId: UserId): void

// 创建 Group
function createGroup(doc: Document, memberIds: ShapeId[]): Group

// 解散 Group
function ungroupShapes(doc: Document, groupId: GroupId): void
```

**分类 4：验证函数**

```typescript
// 验证整个 Document
function validateDocument(doc: Document): ValidationResult

// 验证特定约束
function hasOrphanedBindings(doc: Document): boolean
function hasOrphanedGroups(doc: Document): boolean
```

#### Mutation vs Immutable（明天讨论）

**Mutation 风格**（修改原对象）：

```typescript
function addShape(doc: Document, shape: Shape): void {
  doc.shapes.set(shape.id, shape)
  doc.version += 1
  doc.updatedAt = new Date()
}

// 使用
addShape(document, rect)
```

**Immutable 风格**（返回新对象）：

```typescript
function addShape(doc: Document, shape: Shape): Document {
  return {
    ...doc,
    shapes: new Map(doc.shapes).set(shape.id, shape),
    version: doc.version + 1,
    updatedAt: new Date(),
  }
}

// 使用
const newDocument = addShape(document, rect)
```

**明天讨论点**：
- ⚠️ CRDT 集成时，哪种风格更友好？
- ⚠️ Immutable 风格对性能的影响？（大量 shape 时，浅拷贝是否昂贵？）
- ⚠️ 是否需要 Proxy/Immer 来简化 immutable 更新？
- ⚠️ 如何处理索引更新？（mutation 风格下，索引可能失效）

---

## 📋 明天的讨论清单

### 高优先级（影响架构）

1. **Version 字段的作用** （第 2 节）
   - [ ] Document 级别 vs Shape 级别的 version
   - [ ] 乐观锁的冲突解决策略
   - [ ] CRDT 是否还需要 version

2. **索引设计** （第 3 节）
   - [ ] 哪些索引是必需的？
   - [ ] 索引是"急切更新"还是"懒加载"？
   - [ ] R-Tree 的使用方式和性能权衡

3. **Mutation vs Immutable** （第 6 节）
   - [ ] 协同编辑场景下的最佳实践
   - [ ] 性能影响和优化策略
   - [ ] 是否使用 Immer

### 中优先级（影响实现）

4. **序列化策略** （第 4 节）
   - [ ] Map/Set 的序列化方案选择
   - [ ] 完整序列化 vs 增量序列化
   - [ ] Date vs timestamp

5. **软删除的垃圾回收** （第 1 节）
   - [ ] 何时真正删除软删除的实体？
   - [ ] 如何处理对已删除实体的引用？

6. **工具函数的完整清单** （第 6 节）
   - [ ] 列出所有必需的查询/修改函数
   - [ ] 函数命名规范
   - [ ] 是否使用命名空间（如 `document.create()`）

### 低优先级（可延后）

7. **可选索引的取舍** （第 3 节）
   - [ ] typeIndex, commentIndex, zOrderIndex 是否需要？
   - [ ] 内存 vs 性能的权衡

8. **验证策略** （第 5 节）
   - [ ] 验证时机（每次操作 vs 显式调用）
   - [ ] 错误处理方式（抛出异常 vs 返回错误对象）

---

## 📚 参考资料（明天讨论时查阅）

### 空间索引

- [rbush - JavaScript R-Tree implementation](https://github.com/mourner/rbush)
- [R-Tree Wikipedia](https://en.wikipedia.org/wiki/R-tree)

### 协同编辑

- [Yjs - CRDT framework](https://github.com/yjs/yjs)
- [Automerge - CRDT library](https://github.com/automerge/automerge)
- [Figma's multiplayer technology](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)

### Immutable 数据结构

- [Immer - Immutable updates with mutable syntax](https://immerjs.github.io/immer/)
- [Immutable.js](https://immutable-js.com/)

### 序列化

- [superjson - Serialize JavaScript types](https://github.com/blitz-js/superjson)
- [devalue - Serialize anything](https://github.com/Rich-Harris/devalue)

---

## 🎯 明天的行动计划

### 第一步：深入讨论 Version 字段（30 分钟）

- 理解乐观锁的工作原理
- 决定是 Document 级别还是 Shape 级别
- 确定与 CRDT 的关系

### 第二步：理解索引的概念（45 分钟）

- 通过示例代码理解 R-Tree
- 确定必需的索引清单
- 决定索引的更新策略（急切 vs 懒加载）

### 第三步：设计工具函数（30 分钟）

- 列出所有必需的函数
- 决定 mutation vs immutable 风格
- 确定函数命名规范

### 第四步：完善 Document 类型（30 分钟）

- 根据讨论结果更新 `document.ts`
- 添加索引字段（如果需要）
- 添加 version 字段

### 第五步：实现核心工具函数（1-2 小时）

- `createDocument()`
- `getGroupMembers()`
- `getShapeBindings()`
- `validateDocument()`

---

## 💡 睡前思考题（可选）

1. **如果你是 Figma 的工程师，你会如何设计 Document 类型？**
2. **10,000 个 shape 的 Document，序列化成 JSON 有多大？（粗略估算）**
3. **为什么 tldraw 使用 immutable 风格，而 Figma 使用 mutation 风格？**

---

晚安！明天我们从 Version 字段开始深入讨论 🌙
