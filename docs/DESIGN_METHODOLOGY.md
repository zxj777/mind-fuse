# 前端类型系统设计方法论

> 适用于复杂的协作白板应用类型系统设计
>
> 最后更新：2025-12-23

## 目录

- [设计流程全景](#设计流程全景)
- [六大设计阶段](#六大设计阶段)
- [可视化工具矩阵](#可视化工具矩阵)
- [实战流程指南](#实战流程指南)
- [核心原则](#核心原则)

---

## 设计流程全景

在设计复杂的前端类型系统（如 Document、Entity 等核心类型）时，遵循以下六个阶段的系统化流程：

```
阶段 1: 领域建模      → 搞清楚"有什么"和"关系是什么"
阶段 2: 数据流设计    → 搞清楚"数据怎么流动"
阶段 2.5: 冲突解决模型 → 搞清楚"协作时如何合并冲突"
阶段 3: 状态机设计    → 搞清楚"状态如何变化"
阶段 4: 类型架构      → 搞清楚"代码如何组织"
阶段 5: 序列化设计    → 搞清楚"如何存储/传输"
阶段 6: 性能与索引    → 搞清楚"如何高效查询"
```

**关键原则**：先图后码，越早期越简单，图是为了思考而非美观。

---

## 六大设计阶段

### 阶段 1：领域建模（Domain Modeling）

**目标**：理清实体（Entity）及其关系

**使用图表**：实体关系图（ERD）或类图（Class Diagram）

**画图内容**：

```
Document
  │
  ├──> Shape (1:N)
  │      ├── id: ShapeId
  │      ├── type: 'rectangle' | 'ellipse' | ...
  │      ├── groupId?: GroupId (可选引用)
  │      └── parentId?: ShapeId (可选引用)
  │
  ├──> Group (1:N)
  │      ├── id: GroupId
  │      ├── memberIds: Set<ShapeId> (必须引用存在的 Shape)
  │      └── parentId?: GroupId (可选引用)
  │
  ├──> Binding (1:N)
  │      ├── id: BindingId
  │      ├── fromShapeId: ShapeId (必须引用存在的 Shape)
  │      └── toShapeId: ShapeId (必须引用存在的 Shape)
  │
  ├──> Comment (1:N)
  │      ├── id: CommentId
  │      └── attachedToId?: ShapeId | GroupId (可选引用)
  │
  └──> Asset (1:N)
         ├── id: AssetId
         ├── type: 'image' | 'video' | ...
         └── url: string
```

**必须标注的关键信息**：

1. **基数关系**：
   - `1:1`（一对一）
   - `1:N`（一对多）
   - `N:M`（多对多）

2. **引用完整性**：
   - 实线 = 必须存在（如 Binding.fromShapeId 必须指向存在的 Shape）
   - 虚线 = 可选（如 Shape.groupId 可以为空）

3. **级联删除规则**：
   - 删除 Shape 时，关联的 Binding 怎么办？
   - 删除 Group 时，成员 Shape 怎么办？

**输出物**：

- 一张清晰的实体关系图
- 每个实体的关键字段列表
- 引用约束说明

**推荐工具**：

- 快速草图：Excalidraw, tldraw, 纸笔
- 协作白板：Miro, FigJam
- 代码化：PlantUML, Mermaid

---

### 阶段 2：数据流设计（Data Flow）

**目标**：理清关键操作的数据流动路径

**使用图表**：数据流图（DFD）或序列图（Sequence Diagram）

**示例场景**：用户拖动一个在 Group 中的 Shape

```
1. UI Event (mouseMove)
   ↓ 触发
2. 事件处理器 - 计算鼠标位置
   ↓ 计算新位置 (x, y)
3. 查询 Document.shapes.get(shapeId)
   ↓ O(1) - Map lookup
4. 检查 shape.groupId 是否存在
   ↓ 存在
5. 查询 Document.groups.get(groupId)
   ↓ O(1) - Map lookup
6. 读取 Group.transform（变换矩阵）
   ↓ 矩阵运算
7. 转换全局坐标 → 局部坐标
   ↓ 更新数据
8. 更新 shape.x, shape.y
   ↓ 触发响应式系统
9. 重新渲染受影响的区域
   ↓ 网络通信
10. 广播协作事件（WebSocket）
    ↓
11. 其他客户端接收并应用更新
```

**必须标注的信息**：

1. **性能成本**：
   - 步骤 3: `O(1)` - Map lookup
   - 步骤 5: `O(1)` - Map lookup
   - 步骤 6: 矩阵运算成本（4x4 矩阵乘法）
   - 步骤 10: 网络延迟（50-200ms）

2. **失败点**：
   - 步骤 3: Shape 不存在怎么办？
   - 步骤 5: Group 不存在怎么办？（数据不一致）
   - 步骤 10: 网络断开怎么办？

3. **优化机会**：
   - 步骤 6: Group.transform 可以缓存吗？
   - 步骤 9: 可以批量渲染多个 Shape 吗？
   - 步骤 10: 可以节流/防抖吗？

**关键问题清单**：

- [ ] 每个箭头的时间成本是多少？
- [ ] 哪些步骤可以缓存？
- [ ] 哪些步骤可能失败？失败了如何恢复？
- [ ] 哪些步骤可以异步？哪些必须同步？
- [ ] 10,000 个 Shape 时，这个流程还能在 16ms 内完成吗？

**输出物**：

- 5-10 个核心场景的数据流图
- 每个流程的性能分析
- 失败点和恢复策略

**推荐工具**：

- 快速草图：纸笔、Excalidraw
- 协作：FigJam, Miro
- 代码化：PlantUML (Sequence Diagram), Mermaid

---

### 阶段 2.5：冲突解决模型（Conflict Resolution Model）

**目标**：明确多用户同时编辑时的合并策略

**使用图表**：决策矩阵表 + 冲突场景图

**为什么需要这个阶段**：

协作白板最核心的挑战不是"如何同步数据"，而是"当两个用户同时修改同一个对象时，最终状态是什么"。如果这个问题没有在设计初期明确，会导致：

- 用户数据丢失（Last-Write-Wins 简单但危险）
- 无法预测的行为（"有时候我的修改消失了"）
- 返工成本巨大（CRDT 需要重新设计整个数据结构）

**核心冲突场景**：

```
场景 A：并发移动同一个 Shape
用户 A: Shape 从 (100, 100) → (200, 100)  [向右移动]
用户 B: Shape 从 (100, 100) → (100, 200)  [同时向下移动]
最终位置：(200, 100)? (100, 200)? (200, 200)? 报错？

场景 B：并发修改不同属性
用户 A: shape.fill = 'red'
用户 B: shape.x = 200  [同时]
最终结果：两者都保留？谁的时间戳晚谁胜？

场景 C：并发加入不同 Group
用户 A: 将 Shape 加入 Group X
用户 B: 将同一 Shape 加入 Group Y  [同时]
最终状态：在 X？在 Y？都不在？报冲突？

场景 D：一个删除，一个修改
用户 A: 删除 Shape
用户 B: 修改 Shape.fill = 'blue'  [同时]
最终状态：被删除（A 胜）？保留并修改（B 胜）？恢复并修改？

场景 E：Set 类型的并发操作
用户 A: Group.memberIds.add('shape:1')
用户 B: Group.memberIds.add('shape:2')  [同时]
最终状态：只有一个？两个都有？

场景 F：富文本协作编辑
用户 A: 在位置 5 插入 "Hello"
用户 B: 在位置 3 删除 2 个字符  [同时]
最终文本：？
```

**冲突解决策略矩阵**：

| 数据类型 / 操作类型 | 推荐策略 | 理由 | 需要的基础设施 |
|-------------------|---------|------|--------------|
| **单值属性（x, y, width, fill）** | LWW + Lamport Timestamp | 位置/颜色变化通常互斥，保留最后操作即可 | 逻辑时钟（Lamport/HLC） |
| **Set 操作（add/remove）** | CRDT OR-Set | 支持并发 add/remove，数学保证收敛 | OR-Set 实现或 Yjs |
| **引用字段（groupId）** | LWW + 冲突通知 | 显式告知用户"另一个用户也在操作" | Toast 通知 + 操作日志 |
| **富文本（Comment.text）** | OT 或 CRDT (Yjs/Automerge) | 复杂协作编辑，必须保留意图 | Yjs/Automerge 库 |
| **删除操作** | Tombstone + 版本向量 | 保留删除记录，避免"僵尸对象" | 软删除标记 + GC 策略 |
| **结构性操作（Group/Ungroup）** | Command 序列化 + 冲突检测 | 高级操作，需要明确顺序 | 操作队列 + 冲突解析器 |

**决策流程图**：

```
收到远端更新
  │
  ├─→ 是否影响同一对象？
  │    ├─ 否 → 直接应用（无冲突）
  │    └─ 是 ↓
  │
  ├─→ 是否修改同一属性？
  │    ├─ 否 → 合并两者（属性独立）
  │    └─ 是 ↓
  │
  ├─→ 属性类型是？
  │    ├─ 单值（x, y, fill）→ 比较时间戳 → LWW
  │    ├─ Set（memberIds）→ CRDT OR-Set 合并
  │    ├─ 富文本 → OT/CRDT 算法
  │    └─ 删除标记 → 检查 tombstone
  │
  └─→ 应用结果 + 记录冲突日志
```

**时间戳策略**：

为了正确实现 LWW，必须选择一种时间戳方案：

| 方案 | 优点 | 缺点 | 何时使用 |
|-----|------|------|---------|
| **系统时钟（wall-clock time）** | 简单，人类可读 | 时钟漂移会导致错误 | 仅用于展示，不用于排序 |
| **Lamport 时间戳** | 保证因果顺序 | 无法知道真实时间 | 基础分布式系统 |
| **Hybrid Logical Clock（HLC）** | 结合物理时间和逻辑顺序 | 实现复杂 | 推荐用于协作白板 |
| **版本向量（Vector Clock）** | 检测并发/因果关系 | 空间开销大 | 需要精确因果追踪时 |

**推荐方案**：HLC（Hybrid Logical Clock）

```typescript
interface HLCTimestamp {
  wallTime: number    // 物理时间（ms）
  logical: number     // 逻辑计数器
  clientId: string    // 客户端 ID（用于打破平局）
}

function compareHLC(a: HLCTimestamp, b: HLCTimestamp): number {
  if (a.wallTime !== b.wallTime) return a.wallTime - b.wallTime
  if (a.logical !== b.logical) return a.logical - b.logical
  return a.clientId.localeCompare(b.clientId)
}
```

**关键问题清单**：

- [ ] 你的系统需要 Strong Eventual Consistency（最终强一致）吗？
- [ ] 用户能接受看到"中间状态"（暂时不一致）吗？多久？
- [ ] 冲突合并失败时，如何通知用户？Toast? 红色边框? 撤销操作？
- [ ] 你需要"撤销其他人的操作"功能吗？（权限系统）
- [ ] 离线编辑后重新上线，如何合并几百个操作？
- [ ] 删除对象后，其他客户端的悬空引用如何处理？

**必须实现的测试场景**：

```typescript
describe('冲突解决测试', () => {
  test('场景A: 并发移动 - LWW 胜出', () => {
    // 初始状态: shape at (100, 100)
    // 客户端A: move to (200, 100) at HLC(t=1000, l=0, client=A)
    // 客户端B: move to (100, 200) at HLC(t=1001, l=0, client=B)
    // 预期: shape at (100, 200) - B 的时间戳更晚
  })

  test('场景E: 并发 Set.add - OR-Set 保留两者', () => {
    // 初始: memberIds = {}
    // 客户端A: add('shape:1')
    // 客户端B: add('shape:2')
    // 预期: memberIds = {'shape:1', 'shape:2'}
  })

  test('场景D: 删除 vs 修改 - 删除胜出', () => {
    // 客户端A: delete shape (标记 tombstone)
    // 客户端B: set shape.fill = 'red'
    // 预期: shape 被删除，修改被丢弃
  })
})
```

**常见陷阱**：

❌ **陷阱 1：用客户端本地时间做 LWW**
```typescript
// ❌ 错误示例
shape.updatedAt = Date.now()  // 客户端时钟不可信
```

为什么错：客户端时钟可能回拨（时区、NTP、用户修改），导致"未来"的操作被"过去"的操作覆盖。

✅ **正确做法**：
```typescript
// 使用逻辑时钟或服务端时间
shape.hlc = client.incrementHLC()
```

❌ **陷阱 2：忽略 Set 的并发语义**
```typescript
// ❌ 错误示例
group.memberIds = new Set(remoteUpdate.memberIds)  // 直接覆盖
```

为什么错：无法区分"并发添加"和"先删后加"。

✅ **正确做法**：
```typescript
// 使用 CRDT OR-Set 或记录操作历史
group.memberIds = mergeORSet(local, remote)
```

**输出物**：

- 每种数据类型的冲突解决策略文档
- 时间戳/逻辑时钟的技术选型
- 冲突场景的单元测试套件
- 用户可见的冲突提示 UI 设计

**推荐工具**：

- 决策矩阵：Markdown Table, Notion
- 冲突场景图：Excalidraw, FigJam
- 实现库：Yjs, Automerge (如果用 CRDT)
- 测试：Vitest + 模拟多客户端

**进一步阅读**：

- [Conflict-free Replicated Data Types (CRDTs)](https://crdt.tech/)
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)
- [Hybrid Logical Clocks](https://jaredforsyth.com/posts/hybrid-logical-clocks/)
- [Figma's Multiplayer Technology](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)

---

### 阶段 3：状态机设计（State Machine）

**目标**：理清实体的状态转换规则

**使用图表**：状态图（State Diagram）

**示例：Group 的状态机**

```
                    ┌─────────────┐
        创建时 ────>│ Empty Group │
                    └──────┬──────┘
                           │ add first shape
                           ↓
                    ┌─────────────┐
                    │Active Group │<──┐
                    └──────┬──────┘   │
                           │          │
          ┌────────────────┼──────────┤
          │                │          │
    add shape       remove shape   unlock
          │                │          │
          └────────────────┤          │
                           ↓          │
                    ┌─────────────┐  │
    remove last ──> │ Empty Group │  │
    shape           └─────────────┘  │
                                      │
                    ┌─────────────┐  │
          lock ───> │Locked Group │──┘
                    └─────────────┘
                           │
                           │ delete
                           ↓
                    ┌─────────────┐
                    │  Deleted    │
                    └─────────────┘
```

**每个状态必须定义**：

1. **允许的操作**：
   - `Empty Group`: 可以 add shape，可以 delete，不能 lock
   - `Active Group`: 可以 add/remove shape，可以 lock/delete
   - `Locked Group`: 不能 add/remove，可以 unlock/delete

2. **不变量（Invariants）**：
   - `Empty Group`: `memberIds.size === 0`
   - `Active Group`: `memberIds.size > 0`
   - `Locked Group`: `locked === true`

3. **转换条件**：
   - `Active → Empty`: 当 `memberIds.size` 变为 0
   - `Active → Locked`: 显式调用 `lock()`
   - `Locked → Active`: 显式调用 `unlock()`

**关键问题清单**：

- [ ] 什么操作会改变状态？
- [ ] 每个状态下，哪些字段是只读的？
- [ ] 非法状态转换如何处理？（如对 Locked Group add shape）
- [ ] 状态是显式存储还是从其他字段推导？

**输出物**：

- 核心实体的状态转换图
- 每个状态的不变量定义
- 状态转换的触发条件

**推荐工具**：

- 快速草图：纸笔、Excalidraw
- 可交互：XState Visualizer
- 文档化：draw.io, Lucidchart

---

### 阶段 4：类型系统架构（Type Architecture）

**目标**：设计类型的依赖层级和模块边界

**使用图表**：UML 类图 + 依赖图

**推荐分层架构**：

```
┌─────────────────────────────────────────┐
│ Layer 4: 操作与验证                     │
│ - DocumentOperations                    │
│ - Validators                            │
│ - Commands (Create, Delete, Update)    │
└────────────┬────────────────────────────┘
             │ 依赖
             ↓
┌─────────────────────────────────────────┐
│ Layer 3: 文档容器                       │
│ - Document                              │
│ - DocumentState                         │
└────────────┬────────────────────────────┘
             │ 依赖
             ↓
┌─────────────────────────────────────────┐
│ Layer 2: 核心实体                       │
│ - Shape                                 │
│ - Group                                 │
│ - Binding                               │
│ - Comment                               │
└────────────┬────────────────────────────┘
             │ 依赖
             ↓
┌─────────────────────────────────────────┐
│ Layer 1: 基础类型                       │
│ - IDs (ShapeId, GroupId, ...)          │
│ - Primitives (Point, Box, Color)       │
│ - Enums (ShapeType, BindingType)       │
└─────────────────────────────────────────┘
```

**依赖规则**：

1. **单向依赖**：上层可以依赖下层，下层不能依赖上层
2. **同层隔离**：同层之间避免循环依赖
3. **接口解耦**：必要时用接口打破循环依赖

**模块组织示例**：

```
packages/types/src/
├── primitives/          # Layer 1
│   ├── point.ts
│   ├── box.ts
│   └── color.ts
├── ids/                 # Layer 1
│   ├── shape-id.ts
│   └── group-id.ts
├── entities/            # Layer 2
│   ├── shape.ts
│   ├── group.ts
│   └── binding.ts
├── document/            # Layer 3
│   ├── document.ts
│   └── serialization.ts
└── operations/          # Layer 4
    ├── validators.ts
    └── commands.ts
```

**关键决策**：

| 决策点                  | 选项 A                       | 选项 B                   | 推荐                |
| ----------------------- | ---------------------------- | ------------------------ | ------------------- |
| Document 是接口还是类？ | `interface Document { ... }` | `class Document { ... }` | 接口 + 命名空间函数 |
| 验证逻辑放哪？          | 在实体内部                   | 独立的 Validator         | 独立 Validator      |
| 操作函数放哪？          | Document 类方法              | 命名空间函数             | 命名空间函数        |
| 如何处理循环依赖？      | 合并文件                     | 用接口解耦               | 用接口解耦          |

---

#### 错误分类与处理策略

在类型架构设计中，错误处理是经常被忽视但极其重要的一环。统一的错误模型能确保：

- 开发者知道何时用 throw，何时用 Result<T, E>
- 用户能看到清晰的错误提示，而非"出错了"
- 系统能优雅降级，而非整体崩溃

**错误四分类**：

将所有错误分为四类，每类有明确的处理规则：

##### 1. 不变量违反（Invariant Violation）

**定义**：数据结构违反了设计约束，这是 **bug**，不应该发生。

**示例**：
- `Group.memberIds.size < 2`（Group 必须至少 2 个成员）
- `Binding.fromId` 指向不存在的 Shape
- Shape 的 `x` 或 `y` 是 `NaN`

**处理策略**：
```typescript
// 立即 throw Error，终止操作
if (group.memberIds.size < 2) {
  throw new InvariantViolationError(
    'Group must have at least 2 members',
    { groupId: group.id, memberCount: group.memberIds.size }
  )
}
```

**后续行动**：
- ❌ **不显示给用户**（这是开发者的责任）
- ✅ 记录完整日志（Sentry/LogRocket）
- ✅ 触发数据修复流程（自动或手动）
- ✅ 在开发环境抛出醒目的错误

##### 2. 用户输入错误（User Input Error）

**定义**：用户操作违反了业务规则，这是 **正常情况**。

**示例**：
- 尝试删除已锁定的 Shape
- 尝试将 Shape 加入已满的 Group（如果有人数限制）
- 尝试创建名称为空的 Document

**处理策略**：
```typescript
// 使用 Result 类型（不要 throw）
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

function deleteShape(shapeId: ShapeId): Result<void, UserError> {
  const shape = document.shapes.get(shapeId)
  if (!shape) {
    return {
      ok: false,
      error: new ShapeNotFoundError(shapeId)
    }
  }

  if (shape.isLocked) {
    return {
      ok: false,
      error: new ShapeLockedError(shapeId, '该对象已锁定，无法删除')
    }
  }

  // 执行删除...
  return { ok: true, value: undefined }
}

// UI 层处理
const result = deleteShape(selectedId)
if (!result.ok) {
  toast.error(result.error.userMessage)  // 显示友好提示
  return
}
```

**后续行动**：
- ✅ **显示给用户**（Toast、弹窗、内联提示）
- ✅ 提供清晰的错误信息："该对象已锁定"，而非 "操作失败"
- ✅ 提供修复建议："请先解锁该对象"
- ❌ 不记录到错误监控（这不是 bug）

##### 3. 网络/IO 错误（Network/IO Error）

**定义**：外部依赖不可用，这是 **暂时性问题**。

**示例**：
- WebSocket 断开连接
- 图片加载失败（404）
- API 请求超时

**处理策略**：
```typescript
async function loadImage(assetId: AssetId): Promise<HTMLImageElement> {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      return await fetchImage(assetId)
    } catch (error) {
      attempt++
      if (attempt >= maxRetries) {
        // 降级：显示占位符
        return getPlaceholderImage()
      }
      // 指数退避
      await sleep(Math.pow(2, attempt) * 1000)
    }
  }
}
```

**后续行动**：
- ✅ 自动重试（指数退避）
- ✅ 降级展示（占位符、缓存数据）
- ✅ 部分可见给用户（"重试中..."、网络图标）
- ✅ 超过重试次数后，转为用户输入错误提示

##### 4. 未知错误（Unknown Error）

**定义**：意料之外的异常，这是 **未处理的边缘情况**。

**示例**：
- 第三方库抛出异常
- 内存不足
- 浏览器 bug

**处理策略**：
```typescript
// 全局错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录完整堆栈
    logErrorToSentry(error, {
      componentStack: errorInfo.componentStack,
      documentId: currentDocument.id,
      userAgent: navigator.userAgent,
    })

    // 显示通用错误页
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackUI onReset={this.reset} />
    }
    return this.props.children
  }
}
```

**后续行动**：
- ✅ 捕获并记录完整堆栈
- ✅ 显示通用错误页："出现意外错误，已记录日志"
- ✅ 提供"重新加载"或"报告问题"按钮
- ✅ 优先级：尽快修复

**错误类型层次结构**：

```typescript
// 基类
export abstract class AppError extends Error {
  abstract readonly category: 'invariant' | 'user' | 'network' | 'unknown'
  abstract readonly userMessage: string
  readonly context?: Record<string, any>

  constructor(message: string, context?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    this.context = context
  }
}

// 1. 不变量错误
export class InvariantViolationError extends AppError {
  readonly category = 'invariant' as const
  readonly userMessage = 'Internal error occurred'  // 用户不应看到
}

// 2. 用户错误
export class UserError extends AppError {
  readonly category = 'user' as const
  constructor(
    message: string,
    public readonly userMessage: string,
    context?: Record<string, any>
  ) {
    super(message, context)
  }
}

export class ShapeLockedError extends UserError {
  constructor(shapeId: ShapeId, userMessage: string) {
    super(
      `Shape ${shapeId} is locked`,
      userMessage,
      { shapeId }
    )
  }
}

// 3. 网络错误
export class NetworkError extends AppError {
  readonly category = 'network' as const
  readonly userMessage = 'Network error, retrying...'
  constructor(
    message: string,
    public readonly retryable: boolean,
    context?: Record<string, any>
  ) {
    super(message, context)
  }
}

// 4. 未知错误
export class UnknownError extends AppError {
  readonly category = 'unknown' as const
  readonly userMessage = 'An unexpected error occurred'
}
```

**错误边界分层**：

在 React 应用中，建议使用三层错误边界：

```tsx
// 第一层：整个应用
<AppErrorBoundary>
  {/* 捕获致命错误，显示"整个应用崩溃"页面 */}

  // 第二层：主要功能区
  <CanvasErrorBoundary>
    {/* 画布崩溃，但侧边栏仍可用 */}
    <Canvas />
  </CanvasErrorBoundary>

  <SidebarErrorBoundary>
    {/* 侧边栏崩溃，但画布仍可用 */}
    <Sidebar />
  </SidebarErrorBoundary>

  // 第三层：独立组件
  <PropertiesPanelErrorBoundary>
    {/* 属性面板崩溃，其他都可用 */}
    <PropertiesPanel />
  </PropertiesPanelErrorBoundary>
</AppErrorBoundary>
```

**关键决策清单**：

- [ ] 每个函数的错误处理策略是否明确？（throw vs Result）
- [ ] 用户可见的错误信息是否友好？（"该对象已锁定" vs "Error: locked"）
- [ ] 网络错误是否有自动重试？重试策略是什么？
- [ ] 错误边界是否覆盖所有关键区域？
- [ ] 未处理的错误是否都被记录？（Sentry/LogRocket）
- [ ] 开发环境是否能快速定位错误源头？

**常见陷阱**：

❌ **陷阱：所有错误都 throw**
```typescript
// ❌ 错误示例
function deleteShape(id: ShapeId) {
  if (shape.isLocked) {
    throw new Error('Shape is locked')  // 用户操作不应 throw
  }
}
```

为什么错：用户的正常操作（删除锁定对象）不应该被当作异常，会导致 UI 崩溃。

✅ **正确做法**：
```typescript
function deleteShape(id: ShapeId): Result<void, UserError> {
  if (shape.isLocked) {
    return { ok: false, error: new ShapeLockedError(id, '该对象已锁定') }
  }
  return { ok: true, value: undefined }
}
```

---

**输出物**：

- 清晰的分层架构图
- 每个模块的职责说明
- 依赖关系图
- 循环依赖的解决方案

**推荐工具**：

- 快速草图：FigJam
- 代码化：TypeDoc, Dependency Cruiser
- 架构文档：C4 Model

---

### 阶段 5：序列化设计（Serialization Strategy）

**目标**：设计内存结构与持久化结构之间的转换

**使用图表**：对比表格 + 数据转换流程图

**核心挑战**：TypeScript 的某些类型无法直接序列化为 JSON

| 内存中类型            | JSON 序列化后             | 转换逻辑                  | 注意事项                             |
| --------------------- | ------------------------- | ------------------------- | ------------------------------------ |
| `Map<ShapeId, Shape>` | `{ [id: string]: Shape }` | `Object.fromEntries(map)` | 需要手动转换                         |
| `Set<ShapeId>`        | `string[]`                | `Array.from(set)`         | 恢复时需要 `new Set(arr)`            |
| `Date`                | `string` (ISO 8601)       | `date.toISOString()`      | 恢复时需要 `new Date(str)`           |
| `Function`            | ❌ 不可序列化             | -                         | 必须从设计中移除                     |
| `Symbol`              | ❌ 不可序列化             | -                         | 用 string 替代                       |
| `BigInt`              | ❌ 不可序列化             | 转为 `string`             | JSON.stringify 会报错                |
| `undefined`           | ❌ 会被忽略               | 用 `null` 替代            | JSON.stringify 会删除 undefined 字段 |

**序列化流程设计**：

```
┌──────────────────────┐
│ Document (运行时)     │
│ - shapes: Map<...>   │
│ - groups: Map<...>   │
│ - memberIds: Set<...>│
└──────────┬───────────┘
           │ toJSON()
           ↓
┌──────────────────────┐
│ SerializedDocument   │
│ - shapes: {...}      │
│ - groups: {...}      │
│ - memberIds: [...]   │
└──────────┬───────────┘
           │ JSON.stringify()
           ↓
┌──────────────────────┐
│ JSON String          │
│ 网络传输 / 存储       │
└──────────┬───────────┘
           │ JSON.parse()
           ↓
┌──────────────────────┐
│ SerializedDocument   │
│ (纯对象)             │
└──────────┬───────────┘
           │ fromJSON()
           ↓
┌──────────────────────┐
│ Document (运行时)     │
│ - 重建 Map           │
│ - 重建 Set           │
│ - 重建索引           │
└──────────────────────┘
```

**代码示例**：

```typescript
// 定义运行时类型
interface Document {
  id: DocumentId
  shapes: Map<ShapeId, Shape>
  groups: Map<GroupId, Group>
  createdAt: Date
}

// 定义序列化类型
interface SerializedDocument {
  id: string
  shapes: Record<string, Shape>
  groups: Record<string, SerializedGroup>
  createdAt: string // ISO 8601
}

interface SerializedGroup {
  id: string
  memberIds: string[] // Set → Array
  parentId: string | null // undefined → null
}

// 序列化函数
function toJSON(doc: Document): SerializedDocument {
  return {
    id: doc.id,
    shapes: Object.fromEntries(doc.shapes),
    groups: Object.fromEntries(
      Array.from(doc.groups.entries()).map(([id, group]) => [
        id,
        {
          ...group,
          memberIds: Array.from(group.memberIds),
          parentId: group.parentId ?? null,
        },
      ])
    ),
    createdAt: doc.createdAt.toISOString(),
  }
}

// 反序列化函数
function fromJSON(data: SerializedDocument): Document {
  return {
    id: data.id as DocumentId,
    shapes: new Map(Object.entries(data.shapes)),
    groups: new Map(
      Object.entries(data.groups).map(([id, group]) => [
        id,
        {
          ...group,
          memberIds: new Set(group.memberIds),
          parentId: group.parentId ?? undefined,
        },
      ])
    ),
    createdAt: new Date(data.createdAt),
  }
}
```

**关键问题清单**：

- [ ] 哪些字段需要序列化？哪些可以在恢复时重建？（如索引）
- [ ] 序列化后的 JSON 大小是否可接受？（10,000 shapes 时多大？）
- [ ] 反序列化是否会重建所有索引？性能如何？
- [ ] 版本兼容性：老版本的 JSON 能被新版本读取吗？

**输出物**：

- 内存类型 vs 序列化类型对比表
- `toJSON()` 和 `fromJSON()` 函数设计
- 性能基准测试（序列化 10,000 shapes 需要多久）

**推荐工具**：

- 表格：Markdown Table, Notion
- 代码化：TypeScript 类型定义 + 单元测试

---

### 阶段 6：性能与索引设计（Performance & Indexing）

**目标**：为高频查询设计高效的数据结构和索引

**使用图表**：复杂度分析表 + 热点路径图

**常见查询及其复杂度**：

| 查询场景                   | 数据结构              | 无索引复杂度 | 有索引复杂度 | 索引结构                       |
| -------------------------- | --------------------- | ------------ | ------------ | ------------------------------ |
| 通过 ID 查找 Shape         | `Map<ShapeId, Shape>` | O(1)         | O(1)         | Map 本身就是索引               |
| 查找 Group 中的所有 Shapes | 遍历所有 shapes       | O(n)         | O(k)         | `Map<GroupId, Set<ShapeId>>`   |
| 查找边界框内的所有 Shapes  | 遍历并检查边界        | O(n)         | O(log n + k) | R-tree / Quadtree              |
| 查找所有选中的 Shapes      | 遍历所有 shapes       | O(n)         | O(k)         | `Set<ShapeId>`                 |
| 查找 Shape 的所有 Bindings | 遍历所有 bindings     | O(m)         | O(k)         | `Map<ShapeId, Set<BindingId>>` |
| 查找某类型的所有 Shapes    | 遍历并过滤            | O(n)         | O(k)         | `Map<ShapeType, Set<ShapeId>>` |
| Z-order 排序的 Shapes      | 排序                  | O(n log n)   | O(n)         | 维护有序数组                   |

- `n` = 总 Shapes 数量
- `m` = 总 Bindings 数量
- `k` = 结果数量（通常 k << n）

**索引设计示例**：

```typescript
interface Document {
  // === 核心数据（必须序列化） ===
  shapes: Map<ShapeId, Shape>
  groups: Map<GroupId, Group>
  bindings: Map<BindingId, Binding>

  // === 索引（可从核心数据重建） ===
  // 空间索引：用于视口查询
  spatialIndex: RTree<ShapeId>

  // 分组索引：Group → Shapes
  groupMembersIndex: Map<GroupId, Set<ShapeId>>

  // 反向索引：Shape → Bindings
  shapeBindingsIndex: Map<ShapeId, Set<BindingId>>

  // 类型索引：ShapeType → Shapes
  typeIndex: Map<ShapeType, Set<ShapeId>>

  // 选中状态（会频繁变化）
  selectedShapeIds: Set<ShapeId>
}
```

**索引维护策略**：

| 索引类型             | 更新时机                 | 更新成本             | 使用频率     | 决策     |
| -------------------- | ------------------------ | -------------------- | ------------ | -------- |
| `spatialIndex`       | Shape 移动/调整大小时    | 中（R-tree 更新）    | 极高（每帧） | **必须** |
| `groupMembersIndex`  | Shape 加入/离开 Group 时 | 低（Set add/delete） | 高           | **必须** |
| `shapeBindingsIndex` | Binding 创建/删除时      | 低（Set add/delete） | 中           | **推荐** |
| `typeIndex`          | Shape 类型改变时         | 低（Set 操作）       | 低           | 可选     |
| `selectedShapeIds`   | 选中状态改变时           | 低（Set 操作）       | 高           | **必须** |

**性能基准**：

假设画布有 **10,000 个 Shapes**：

```
查询                    | 无索引耗时  | 有索引耗时  | 收益
------------------------|------------|------------|--------
findShapeById(id)       | <1ms       | <1ms       | -
findShapesInViewport()  | ~50ms      | ~2ms       | 25x
findShapesInGroup(id)   | ~20ms      | <1ms       | 20x
findBindingsForShape()  | ~30ms      | <1ms       | 30x
```

**60 FPS 要求**：每帧 16.67ms 预算

- 视口查询（每帧）：必须 < 2ms
- 选中状态更新：必须 < 1ms
- 拖动操作：包括碰撞检测，必须 < 5ms

**关键问题清单**：

- [ ] 哪些查询在热路径上？（每帧执行）
- [ ] 哪些索引可以懒加载？
- [ ] 索引的总内存开销是多少？
- [ ] 索引失效时如何重建？
- [ ] 10,000 → 100,000 shapes 时，哪些会崩溃？

**输出物**：

- 查询复杂度分析表
- 索引结构设计
- 性能基准测试结果
- 热路径优化方案

**推荐工具**：

- 表格：Markdown, Notion
- 性能测试：Vitest Benchmark, benchmark.js
- 可视化：Chrome DevTools Performance

---

## 可视化工具矩阵

| 设计阶段       | 快速草图                 | 协作白板             | 代码化                                   | 正式文档                |
| -------------- | ------------------------ | -------------------- | ---------------------------------------- | ----------------------- |
| **领域建模**   | ✅ 纸笔<br>✅ Excalidraw | ✅ FigJam<br>✅ Miro | Mermaid ERD<br>PlantUML Class            | Lucidchart<br>draw.io   |
| **数据流设计** | ✅ 纸笔<br>✅ Excalidraw | ✅ FigJam<br>✅ Miro | ✅ PlantUML Sequence<br>Mermaid Sequence | Miro<br>draw.io         |
| **状态机设计** | ✅ 纸笔<br>Excalidraw    | FigJam<br>Miro       | ✅ XState Visualizer<br>Mermaid State    | draw.io<br>Lucidchart   |
| **类型架构**   | 草图                     | FigJam               | ✅ TypeDoc<br>✅ Dependency Cruiser      | C4 Model<br>Structurizr |
| **序列化设计** | 表格                     | Notion               | ✅ 代码注释<br>✅ 单元测试               | Markdown<br>Notion      |
| **性能分析**   | 表格                     | ✅ 表格工具          | ✅ Benchmark 代码<br>✅ Profiling        | 性能报告<br>Markdown    |

**工具选择原则**：

1. **早期探索**：纸笔 > Excalidraw > 其他（越快越好）
2. **团队协作**：FigJam, Miro（实时协作）
3. **长期维护**：代码化（Mermaid, PlantUML）> 图片（容易过期）
4. **正式交付**：Lucidchart, draw.io（精致但费时）

---

## 实战流程指南

当你需要设计一个核心类型（如 `Document`）时，按以下步骤执行：

### Step 1: 画领域模型（15 分钟）

**工具**：纸笔或 Excalidraw

**任务**：

1. 列出 Document 需要包含的所有实体类型
2. 画出实体之间的引用关系
3. 标注哪些引用是必须的（实线），哪些是可选的（虚线）
4. 标注基数关系（1:1, 1:N, N:M）

**输出检查清单**：

- [ ] 是否有悬空引用？（引用了不存在的实体）
- [ ] 是否有循环引用？（A → B → C → A）
- [ ] 删除一个实体时，哪些其他实体会受影响？

---

### Step 2: 列出核心场景（30 分钟）

**工具**：文本编辑器或纸笔

**任务**：写出 5-10 个核心操作场景的步骤，例如：

```
场景 1: 创建一个新 Shape
1. 生成新的 ShapeId
2. 创建 Shape 对象
3. 插入到 document.shapes
4. 如果有 groupId，更新 group.memberIds
5. 触发重新渲染

场景 2: 删除一个有 Binding 的 Shape
1. 查找所有关联的 Bindings
2. 删除这些 Bindings
3. 如果在 Group 中，从 group.memberIds 移除
4. 从 document.shapes 删除
5. 更新所有索引
6. 触发重新渲染

场景 3: 将 Shape 添加到 Group
1. 验证 Shape 和 Group 都存在
2. 如果 Shape 已在另一个 Group，先移除
3. 设置 shape.groupId = group.id
4. 添加到 group.memberIds
5. 更新 groupMembersIndex
6. 触发重新渲染

... 等等
```

**输出检查清单**：

- [ ] 每个场景的步骤是否完整？
- [ ] 是否考虑了失败情况？
- [ ] 是否有数据不一致的可能？

---

### Step 3: 设计数据流（30 分钟）

**工具**：Excalidraw 或 PlantUML

**任务**：选择 2-3 个最复杂的场景，画出详细的数据流图

**必须标注**：

- 每个步骤的时间复杂度
- 可能的失败点
- 性能瓶颈

---

### Step 4: 定义 TypeScript 类型（1 小时）

**工具**：代码编辑器

**任务**：基于前面的分析，写出完整的类型定义

```typescript
/**
 * Document 是白板应用的根容器
 *
 * 设计决策：
 * - 使用 Map 而非 Array，因为需要 O(1) 的 ID 查找
 * - 索引字段（如 spatialIndex）不序列化，在加载时重建
 * - 所有引用必须是 ID，而非对象引用（避免循环引用）
 */
interface Document {
  // === 身份与元数据 ===
  readonly id: DocumentId
  readonly version: number // 用于乐观锁
  readonly createdAt: Date
  updatedAt: Date

  // === 核心集合 ===
  shapes: Map<ShapeId, Shape>
  groups: Map<GroupId, Group>
  bindings: Map<BindingId, Binding>
  comments: Map<CommentId, Comment>
  assets: Map<AssetId, Asset>

  // === 索引（可重建） ===
  spatialIndex: RTree<ShapeId>
  groupMembersIndex: Map<GroupId, Set<ShapeId>>

  // === 用户状态（不序列化） ===
  selectedShapeIds: Set<ShapeId>
}
```

**输出检查清单**：

- [ ] 是否为每个字段写了注释？
- [ ] 是否说明了关键设计决策？
- [ ] 是否考虑了序列化需求？

---

### Step 5: 设计序列化（30 分钟）

**工具**：代码编辑器

**任务**：

1. 定义 `SerializedDocument` 类型
2. 实现 `toJSON()` 和 `fromJSON()` 函数
3. 写单元测试验证往返转换

---

### Step 6: 性能分析（30 分钟）

**工具**：表格 + Benchmark 代码

**任务**：

1. 列出所有需要索引的查询
2. 估算每个查询在 10,000 shapes 时的耗时
3. 决定哪些索引必须实现
4. 写性能测试验证假设

---

### Step 7: 评审与迭代

**任务**：

1. 用你的类型定义，重新"执行"Step 2 的所有场景
2. 检查是否有遗漏或不一致
3. 请他人评审（或发给我评审）

---

### Step 8: 测试策略（60-90 分钟）

**目标**：为你的类型系统设计三层测试金字塔

测试不是"写完代码后的工作"，而是设计阶段就要考虑的架构问题。良好的测试策略能确保：

- 重构时不破坏现有功能
- 新功能不引入回归
- 协作场景的正确性
- 性能不随时间劣化

**测试金字塔**：

```
           ╱╲
          ╱  ╲          E2E 测试（5%）
         ╱────╲         - 真实用户场景
        ╱      ╲        - 多客户端协作
       ╱────────╲       - 性能回归
      ╱          ╲
     ╱────────────╲     集成测试（25%）
    ╱              ╲    - 多模块协作
   ╱────────────────╲   - 生命周期场景
  ╱__________________╲
 ╱                    ╲ 单元测试（70%）
╱______________________╲ - 单函数正确性
```

#### 第一层：单元测试（占 70%）

**定义**：测试单个函数的正确性，不依赖外部状态

**必测场景**：

```typescript
describe('group.create()', () => {
  test('创建有效 Group - 2 个成员', () => {
    const shapes = new Map([
      ['shape:1', rectShape({ id: 'shape:1' })],
      ['shape:2', rectShape({ id: 'shape:2' })],
    ])

    const group = group.create(['shape:1', 'shape:2'], shapes)

    expect(group.memberIds.size).toBe(2)
    expect(group.bounds).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
    })
  })

  test('抛出错误 - 少于 2 个成员', () => {
    const shapes = new Map([['shape:1', rectShape()]])

    expect(() =>
      group.create(['shape:1'], shapes)
    ).toThrow(GroupValidationError)
  })

  test('抛出错误 - Shape 不存在', () => {
    const shapes = new Map()

    expect(() =>
      group.create(['shape:nonexistent'], shapes)
    ).toThrow(GroupValidationError)
  })

  test('抛出错误 - Shape 已在另一个 Group', () => {
    const shape = rectShape({ groupId: 'group:other' })
    const shapes = new Map([
      ['shape:1', shape],
      ['shape:2', rectShape()],
    ])

    expect(() =>
      group.create(['shape:1', 'shape:2'], shapes)
    ).toThrow(/already in a group/)
  })
})

describe('computeAABB()', () => {
  test('单个矩形 - 无旋转', () => {
    const shapes = [rectShape({ x: 100, y: 100, width: 50, height: 30 })]
    const bounds = computeAABB(shapes)

    expect(bounds).toEqual({
      x: 100,
      y: 100,
      width: 50,
      height: 30,
      rotation: 0,
    })
  })

  test('旋转的矩形 - 计算 AABB', () => {
    const shapes = [
      rectShape({
        x: 100,
        y: 100,
        width: 50,
        height: 30,
        rotation: Math.PI / 4,  // 45度
      }),
    ]
    const bounds = computeAABB(shapes)

    // AABB 应该大于原始 width/height
    expect(bounds.width).toBeGreaterThan(50)
    expect(bounds.height).toBeGreaterThan(30)
    expect(bounds.rotation).toBe(0)  // AABB 总是 axis-aligned
  })

  test('空数组 - 返回零边界', () => {
    const bounds = computeAABB([])
    expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0, rotation: 0 })
  })
})

describe('序列化往返测试', () => {
  test('Document toJSON → fromJSON - 保持一致', () => {
    const original = createDocument({
      shapes: [rectShape(), lineShape()],
      groups: [createGroup(['shape:1', 'shape:2'])],
    })

    const serialized = toJSON(original)
    const restored = fromJSON(serialized)

    expect(restored.shapes.size).toBe(original.shapes.size)
    expect(restored.groups.size).toBe(original.groups.size)

    // Set 应该正确恢复
    const restoredGroup = restored.groups.get('group:1')
    expect(restoredGroup?.memberIds).toBeInstanceOf(Set)
    expect(restoredGroup?.memberIds.size).toBe(2)
  })
})
```

**覆盖率目标**：
- 核心类型（Shape, Group, Binding）：**100%**
- 工具函数（computeAABB, serialize）：**100%**
- 边缘情况（空输入, 极端值）：**80%**

**推荐工具**：Vitest, Jest

---

#### 第二层：集成测试（占 25%）

**定义**：测试多个模块协作的场景

**必测场景**：

```typescript
describe('完整生命周期：创建 Shape → 加入 Group → 移动 → 删除', () => {
  let document: Document

  beforeEach(() => {
    document = createEmptyDocument()
  })

  test('正常流程', () => {
    // 1. 创建两个 Shape
    const shape1 = createShape('rect', { x: 100, y: 100 })
    const shape2 = createShape('rect', { x: 200, y: 100 })
    document.shapes.set(shape1.id, shape1)
    document.shapes.set(shape2.id, shape2)

    // 2. 创建 Group
    const group = group.create([shape1.id, shape2.id], document.shapes)
    document.groups.set(group.id, group)

    // 3. 更新 Shape 的 groupId
    shape1.groupId = group.id
    shape2.groupId = group.id

    // 4. 移动 Group（更新所有成员）
    const deltaX = 50
    for (const memberId of group.memberIds) {
      const shape = document.shapes.get(memberId)!
      shape.x += deltaX
    }
    group.updateBounds(group, document.shapes)

    // 5. 验证边界已更新
    expect(group.bounds.x).toBe(150)

    // 6. 删除一个 Shape
    document.shapes.delete(shape1.id)
    const updatedGroup = group.removeMember(group, shape1.id, document.shapes)

    // 7. Group 应该被解散（少于 2 个成员）
    expect(updatedGroup).toBeNull()
  })
})

describe('级联删除：删除 Shape → 清理 Bindings 和 Group', () => {
  test('删除带 Binding 的 Shape', () => {
    const doc = createDocument({
      shapes: [
        lineShape({ id: 'line:1' }),
        rectShape({ id: 'rect:1' }),
      ],
      bindings: [
        createBinding({
          from: 'line:1',
          fromSide: 'end',
          to: 'rect:1',
        }),
      ],
    })

    // 删除 rect:1
    const shapeId = 'rect:1' as ShapeId
    const affectedBindings = getAffectedBindings(shapeId, doc.bindings)

    // 应该找到 1 个受影响的 Binding
    expect(affectedBindings.length).toBe(1)

    // 清理 Bindings
    for (const binding of affectedBindings) {
      doc.bindings.delete(binding.id)
    }

    // 删除 Shape
    doc.shapes.delete(shapeId)

    // 验证数据一致性
    expect(doc.shapes.has(shapeId)).toBe(false)
    expect(doc.bindings.size).toBe(0)
  })
})
```

**推荐工具**：Vitest + in-memory mock

---

#### 第三层：端到端测试（占 5%）

**定义**：测试真实用户场景，包括 UI、网络、协作

**必测场景**：

```typescript
describe('E2E: 多客户端协作', () => {
  test('两个客户端同时移动 Shape', async () => {
    const clientA = await launchClient('A')
    const clientB = await launchClient('B')

    // 等待两个客户端都连接
    await Promise.all([
      clientA.waitForReady(),
      clientB.waitForReady(),
    ])

    // 客户端 A 创建一个 Shape
    await clientA.createShape('rect', { x: 100, y: 100 })
    await clientB.waitForSync()  // 等待 B 同步

    // 两个客户端同时移动
    await Promise.all([
      clientA.moveShape('shape:1', { x: 200, y: 100 }),
      clientB.moveShape('shape:1', { x: 100, y: 200 }),
    ])

    // 等待冲突解决
    await sleep(1000)

    // 两个客户端应该收敛到同一状态（LWW）
    const shapeA = clientA.getShape('shape:1')
    const shapeB = clientB.getShape('shape:1')

    expect(shapeA.x).toBe(shapeB.x)
    expect(shapeA.y).toBe(shapeB.y)
  })

  test('离线编辑 → 重新上线 → 同步', async () => {
    const client = await launchClient()

    await client.createShape('rect', { x: 100, y: 100 })

    // 断开网络
    await client.goOffline()

    // 离线编辑
    await client.moveShape('shape:1', { x: 200, y: 200 })
    await client.createShape('rect', { x: 300, y: 300 })

    // 重新上线
    await client.goOnline()
    await client.waitForSync()

    // 验证所有离线操作都已同步
    expect(client.getShapes()).toHaveLength(2)
    expect(client.getShape('shape:1').x).toBe(200)
  })
})

describe('E2E: 性能回归', () => {
  test('加载 10,000 shapes < 2s', async () => {
    const start = performance.now()

    await loadDocument({ shapeCount: 10000 })

    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(2000)
  })

  test('视口查询 10,000 shapes < 16ms', async () => {
    await loadDocument({ shapeCount: 10000 })

    const start = performance.now()

    const shapesInViewport = document.spatialIndex.query({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    })

    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(16)  // 60 FPS
  })
})
```

**推荐工具**：Playwright, Cypress

---

#### 专项：性能基准测试

单独维护一个性能测试套件，用于检测回归：

```typescript
import { bench, describe } from 'vitest'

describe('性能基准', () => {
  bench('computeAABB - 10,000 shapes', () => {
    const shapes = generateShapes(10000)
    computeAABB(shapes)
  }, {
    iterations: 100,
    time: 5000,  // 5s
  })

  bench('spatialIndex.query - 10,000 shapes', () => {
    const index = buildSpatialIndex(10000)
    index.query({ x: 0, y: 0, width: 800, height: 600 })
  }, {
    iterations: 1000,
  })

  bench('序列化 Document - 10,000 shapes', () => {
    const doc = generateDocument(10000)
    toJSON(doc)
  })

  bench('反序列化 Document - 10,000 shapes', () => {
    const serialized = generateSerializedDocument(10000)
    fromJSON(serialized)
  })
})
```

**性能目标**：

| 操作 | 规模 | 目标耗时 |
|------|------|---------|
| computeAABB | 10,000 shapes | < 50ms |
| spatialIndex.query | 10,000 shapes | < 2ms |
| 序列化 | 10,000 shapes | < 100ms |
| 反序列化 | 10,000 shapes | < 200ms |
| 完整加载 | 10,000 shapes | < 2s |

**CI 集成**：

- 每次 PR 必须跑单元测试和集成测试
- 每天自动跑性能基准测试，检测回归
- E2E 测试在合并到 main 前运行

---

**测试覆盖率工具**：

- 代码覆盖率：`vitest --coverage`
- 类型覆盖率：`typescript-coverage-report`
- 性能监控：Vitest Benchmark + 自定义仪表盘

**关键决策清单**：

- [ ] 单元测试覆盖率是否 > 80%？
- [ ] 所有边缘情况是否有测试？（空输入、极端值、并发）
- [ ] 有冲突场景的测试吗？（协作白板核心）
- [ ] 有性能回归测试吗？（防止变慢）
- [ ] CI 是否自动运行测试？
- [ ] 测试失败时，是否阻止合并？

**常见陷阱**：

❌ **陷阱：只测试"正常路径"**
```typescript
// ❌ 不够
test('创建 Group', () => {
  const group = group.create(['shape:1', 'shape:2'], shapes)
  expect(group).toBeDefined()
})

// ✅ 完整
test('创建 Group - 各种情况', () => {
  // 正常
  expect(group.create(['shape:1', 'shape:2'], shapes)).toBeDefined()

  // 边缘情况
  expect(() => group.create(['shape:1'], shapes)).toThrow()  // 少于2个
  expect(() => group.create(['nonexistent'], shapes)).toThrow()  // 不存在
  expect(() => group.create(['shape:1', 'shape:1'], shapes)).toThrow()  // 重复
})
```

❌ **陷阱：性能测试只跑一次**
```typescript
// ❌ 不可靠（受系统波动影响）
const start = Date.now()
computeAABB(shapes)
const elapsed = Date.now() - start
expect(elapsed).toBeLessThan(50)

// ✅ 统计学显著
bench('computeAABB', () => computeAABB(shapes), {
  iterations: 100,  // 跑100次取平均
  warmup: 10,       // 预热10次
})
```

---

## 核心原则

### 1. 先图后码

**原则**：在写任何代码之前，先花 10-15 分钟画图

**理由**：

- 图能让你看到全局
- 图能快速试错（修改图比修改代码快 10 倍）
- 图能避免 2 小时的重构

**实践**：

- ❌ 直接打开编辑器写 `interface Document {`
- ✅ 先在纸上画出 Document 包含什么，它们之间如何关联

---

### 2. 越早期越简单

**原则**：早期用最简单的工具（纸笔），后期才用复杂工具（PlantUML）

**工具演进路径**：

```
纸笔（最快）
  → Excalidraw（可分享）
    → FigJam（可协作）
      → Mermaid（可维护）
        → Lucidchart（可交付）
```

**实践**：

- ❌ 一开始就用 PlantUML 画精致的类图
- ✅ 先在纸上快速画 5 个版本，找到最好的，再用工具画

---

### 3. 图是为了思考，不是为了美观

**原则**：丑但清晰 > 漂亮但含糊

**实践**：

- ❌ 花 30 分钟调整箭头和对齐
- ✅ 花 30 分钟思考"这个引用是必须的还是可选的"

---

### 4. 场景驱动设计

**原则**：每设计一个字段，都要回答"在什么场景下用到它？"

**实践**：

- ❌ 因为"可能以后会用"而添加字段
- ✅ 因为"场景 X 需要查询 Y"而添加索引

---

### 5. 显式标注成本

**原则**：每个操作都要标注时间复杂度、空间复杂度、失败概率

**实践**：

```typescript
// ❌ 没有性能说明
function findShapesInGroup(groupId: GroupId): Shape[] {
  // ...
}

// ✅ 清晰的性能承诺
/**
 * 查找 Group 中的所有 Shapes
 *
 * @complexity O(k)，其中 k 是 group.memberIds.size
 * @requires groupMembersIndex 必须已初始化
 * @throws 如果 Group 不存在
 */
function findShapesInGroup(groupId: GroupId): Shape[] {
  // ...
}
```

---

### 6. 为失败设计

**原则**：假设每个步骤都会失败，预先设计恢复策略

**实践**：

- 数据库查询失败怎么办？
- 网络断开怎么办？
- Shape 引用的 Group 不存在怎么办？
- 两个用户同时修改同一个 Shape 怎么办？

---

### 7. 考虑规模转换点

**原则**：明确在什么规模下，设计会发生质变

**实践**：

| 规模           | 特点         | 设计策略             |
| -------------- | ------------ | -------------------- |
| 10 shapes      | 任何设计都快 | 用最简单的实现       |
| 100 shapes     | 开始有感知   | O(n²) 开始变慢       |
| 1,000 shapes   | 明显卡顿     | 必须有空间索引       |
| 10,000 shapes  | 需要优化     | 虚拟化渲染、延迟加载 |
| 100,000 shapes | 架构挑战     | 分块加载、服务端渲染 |

---

## 协作与一致性补充（强烈建议纳入标准）

这部分专门覆盖“协作白板类型系统”里最常被低估、但一旦出问题会导致大规模返工的设计点。建议在设计 `Document`、同步协议与序列化格式之前，把这里当作硬性检查清单。

### 1) 状态分层：持久态 / 临时态 / 派生态

在类型层面明确三类状态，避免把“临时 UI 状态”塞进 `Document` 持久化结构里：

- **持久态（Persistent State）**：必须保存/同步的内容状态（例如 `shapes`、`groups`、`bindings`、`comments`、`assets`）。
- **临时态（Ephemeral State）**：只对会话有效、不进入持久化/快照的状态（例如 `presence`、`cursor`、`selection`、`viewport`、`dragging`、`tool state`）。
- **派生态（Derived State）**：可从持久态重建的索引/缓存（例如 `spatialIndex`、`groupMembersIndex`、`shapeBindingsIndex`）。

**标准要求**：

- `Document` 的序列化产物只能包含持久态（以及必要的版本字段），不得包含临时态与派生态。
- 任何派生态都必须有明确的 `rebuild*()` 入口与成本说明（时间/内存）。

### 2) 写入模型：Command / Patch / Event 的边界

协作系统里，“写入”通常不是直接改对象字段，而是走一个可重放的写入模型。你需要在团队标准里固定一种主导模型，并在每个模块里坚持一致性：

- **Command（意图）**：例如 `MoveShape`, `DeleteShape`, `AddToGroup`，适合 UI 发起与权限校验。
- **Patch（最小变更）**：例如 `set shape.x`, `remove binding`，适合网络同步与冲突合并。
- **Event（事实记录）**：例如 `ShapeMoved`, `ShapeDeleted`，适合审计与回放，但会带来存储与压缩成本。

**决策点（每次设计评审必须回答）**：

- 协作同步传播的是 Command、Patch 还是 Event？为什么？
- Undo/Redo 基于 Command 反操作、Patch 反操作，还是基于快照差分？
- 权限校验是在 Command 层、Patch 层还是两层都做？失败时客户端如何回滚？

### 3) 引用完整性：一致性级别与修复策略

阶段 1 里你已经标注引用关系，但还需要一个“系统级一致性约定”。建议把一致性分为三档，并明确你选哪一档：

- **强一致（Strict）**：任何引用必须始终有效（例如 `Shape.groupId` 必须指向存在的 `Group`）。发现不一致视为数据损坏。
- **弱一致（Lenient）**：允许短暂不一致（例如协作消息乱序），系统会在合并/加载时自动修复。
- **容错一致（Tolerant）**：允许引用长期无效（例如外部资源丢失），UI 以降级方式展示并持续尝试修复。

**必须写清楚**：

- 删除 `Shape` 时：`Binding`、`Group.memberIds`、`Comment.attachedToId` 怎么处理？（级联删除 vs 孤儿清理 vs 软删除）
- 合并远端更新时：若引用目标缺失，是“延迟应用”、还是“丢弃变更”、还是“创建占位符/tombstone”？

### 4) 确定性序列化（Deterministic Serialization）

协作与调试会非常依赖“同一状态 → 同一 JSON”。建议把确定性序列化作为标准：

- **Map / Set 的顺序**：序列化时必须固定排序（例如按 ID 字典序），避免不同运行时迭代顺序导致快照 diff 噪声。
- **数值稳定性**：禁止写入 `NaN`/`Infinity`；坐标、矩阵、旋转要规定精度（例如保留 3 位小数）。
- **时间字段策略**：明确 `createdAt/updatedAt` 是否参与协作同步；如果参与，同步源是谁（客户端/服务端）。

**建议序列化必带字段**：

- `schemaVersion: number`
- `documentVersion: number`（用于乐观并发/变更计数；是否参与合并取决于同步模型）

### 5) Schema 演进与迁移（Migration Standard）

任何持久化格式都要支持演进。建议在方法论里固定迁移标准。

**加载流程标准**：

```
raw JSON
  → parse
    → validate (schemaVersion & required fields)
      → migrate (vN → vLatest)
        → normalize (canonical ordering, null/undefined, defaults)
          → fromJSON (rebuild runtime structures + indexes)
```

**迁移规则**：

- 迁移函数必须是纯函数：输入旧 schema JSON，输出新 schema JSON。
- 迁移必须可组合：`migrate(v1→v2)`, `migrate(v2→v3)`… 串起来能到最新。
- 每次变更必须写“向后兼容策略”：新客户端读旧数据、旧客户端读新数据怎么办？

### 6) Undo/Redo：别等到最后才设计

Undo/Redo 会反过来约束你的写入模型与数据结构。建议把它列为“核心场景”，并固定团队标准答案：

- Undo/Redo 的基本单位是什么？（Command / Patch / Event / Snapshot）
- 如何处理跨实体的复合操作？（例如 DeleteShape 需要级联删除 bindings）
- 协作情况下 Undo 的语义是什么？只撤销本人的操作，还是撤销“最后一次操作”？（两者完全不同）

**最低标准**：至少能正确回滚这三类操作：

- 单实体属性更新（Move/Resize）
- 多实体级联（DeleteShape with bindings + group membership）
- 结构性操作（Group/Ungroup）

### 7) 可观测性与调试：让系统可解释

协作系统最难的是“线上复现”。建议在标准中要求：

- 每个变更都有可追踪的 `opId` / `actorId` / `timestamp`（timestamp 策略在上面定义）
- 能导出：`document snapshot + recent ops`，用于复现（最小可复现场景）
- 校验器输出必须结构化：明确哪条不变量失败、涉及哪些 IDs、建议的修复策略

## 附录：模板

### 领域模型模板

```
实体名称: ___________

核心字段:
- id: ___________ (类型: ___, 约束: ___)
- ...

引用关系:
- _____ → _____ (基数: ___, 必须/可选: ___, 级联删除: ___)

不变量:
- ___________

状态转换:
- ___ → ___ (条件: ___)
```

### 数据流场景模板

```
场景: ___________

触发条件: ___________

步骤:
1. ___________ (成本: ___, 可能失败: ___)
2. ___________
...

成功结果: ___________
失败处理: ___________
性能要求: < ___ ms
```

### 性能分析模板

```
查询: ___________

频率: 每秒 ___ 次 / 每帧 / 偶尔

输入规模: n = ___

无索引:
- 复杂度: O(___)
- 实测耗时: ___ ms

有索引:
- 复杂度: O(___)
- 实测耗时: ___ ms
- 索引结构: ___________
- 索引维护成本: ___________

决策: [ ] 实现索引 [ ] 不实现（理由: ___)
```

---

## 参考资源

- **领域建模**: Domain-Driven Design (Eric Evans)
- **数据流设计**: Designing Data-Intensive Applications (Martin Kleppmann)
- **状态机**: XState 文档, Statecharts (David Harel)
- **类型系统**: TypeScript Deep Dive
- **性能优化**: R-tree, Quadtree, Spatial Indexing

---

**最后更新**: 2025-12-23
**维护者**: @mind-fuse/core-team
**版本**: 1.0.0
