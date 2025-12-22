# Types 包完成记录

> 创建时间: 2024-12-22
> 状态: Phase 1 Week 1 Day 1-2 完成，准备进入 Day 3-4
> 下次开始位置: 完成 Document 类型定义，开始 PixiJS 画布实现

---

## 📦 已完成的工作

### 核心类型定义（100% 完成）

#### 1. **ids.ts** ✅

- ShapeId, BindingId, CommentId, ReplyId, AssetId, DocumentId, UserId
- 创建函数：`createXxxId()`
- 类型守卫：`isXxxId()`
- Branded Type 实现，运行时零开销

#### 2. **geometry.ts** ✅

- Point（位置）+ 工具函数（distance, midpoint, translate, subtract）
- Vec2（向量）+ 工具函数（add, sub, length）
- Box（边界框，包含 rotation）+ 工具函数（contains, intersects）
- NormalizedPoint 用于 Binding 的归一化坐标

#### 3. **shapes.ts** ✅

完整的 Shape 类型系统：

- **BaseShape<Type, Props>** - 泛型基类
- **LineShape** - 连接线（支持箭头装饰、路径类型）
  - props: endX, endY, stroke, strokeWidth, startArrow, endArrow, pathType
  - 特殊行为：rotation 始终为 0，不能作为 Binding 目标
- **RectShape** - 矩形
  - props: width, height, fill, stroke, strokeWidth
- **GroupShape** - 分组容器
  - props: 空对象（待确认是否需要扩展）
  - 特殊行为：不直接渲染，子元素通过 parentId 引用

类型守卫：

- `isLineShape()`, `isRectShape()`, `isGroupShape()`
- `isConnectorShape()` - 检查是否可作为连接线（当前只有 LineShape）
- `isBindableTarget()` - 检查是否可作为 Binding 目标（排除 LineShape）

#### 4. **bindings.ts** ✅

- **NormalizedPoint** - 归一化坐标（0-1 范围）
- **BaseBinding<Type>** - 泛型基类
- **ConnectorBinding** - 连接线绑定
  - fromId: ShapeId（LineShape）
  - terminal: 'start' | 'end'
  - toId: ShapeId
  - toAnchor: NormalizedPoint
- **CommentBinding** - 评论绑定
  - fromId: CommentId
  - toId: ShapeId（不能是 GroupShape）
- 工厂函数：`connectorBinding.create()`, `commentBinding.create()`

#### 5. **comment.ts** ✅

- **Comment** - 评论实体（独立于 Shape）
  - 坐标双重语义：有 Binding 时归一化，无 Binding 时世界坐标
  - 软删除支持：deleted, deletedAt, deletedBy
  - 回复支持：replies: Reply[]
- **Reply** - 评论回复
- 工厂命名空间：create, addReply, resolve, unresolve, delete, restore

#### 6. **binding-validator.ts** ✅

运行时验证逻辑：

- `validateConnectorBinding()` - 验证连接线绑定
- `validateCommentBinding()` - 验证评论绑定
- `getAffectedBindings()` - 查找受影响的绑定
- 自定义错误类型：
  - `BindingValidationError`（基类）
  - `ShapeNotFoundError`
  - `InvalidConnectorShapeError`
  - `InvalidBindingTargetError`

#### 7. **index.ts** ✅

导出所有类型和工具函数

#### 8. **文档** ✅

- `BINDING_VALIDATION.md` - 验证指南（中文，404 行）
- `EXAMPLES.md` - 完整使用示例（454 行）

---

## 🎯 核心架构决策

### 决策 1：LineShape 的设计

**问题**：Line 和 其他 Shape 有本质区别

- ❌ Line 不能旋转（rotation 始终为 0）
- ❌ Line 不能作为 Binding 目标
- ✅ Line 可以作为 Connector（通过 ConnectorBinding）

**解决方案**：

- Line 仍继承 BaseShape（保持类型系统一致）
- 通过类型守卫 + 运行时验证处理特殊约束
- 装饰性箭头（startArrow/endArrow）是 LineShape 的样式属性

**数据结构**：

```typescript
interface LineShape extends BaseShape<'line', LineProps> {
  rotation: 0 // 继承但无效
  props: {
    endX: number // 终点相对于起点
    endY: number
    stroke: string
    strokeWidth: number
    startArrow?: ArrowStyle // 'none' | 'arrow' | 'filled-arrow' | ...
    endArrow?: ArrowStyle
    pathType?: PathType // 'straight' | 'curved' | 'elbow'
  }
}
```

**未来扩展**：

- Week 2: 实现 pathType 的 curved 和 elbow
- Phase 2: 添加独立的 ArrowShape（大箭头，可旋转的实体）

---

### 决策 2：Comment 独立于 Shape

**问题**：Comment 的交互模式和 Shape 完全不同

- ❌ 不能被选中（点击 = 打开详情，不是选中）
- ❌ 不能多选
- ❌ 不能旋转
- ❌ 不能锁定
- ✅ 有独立位置，可以移动

**解决方案**：

- Comment 不继承 BaseShape，是独立实体
- Document 中单独存储：`comments: Map<CommentId, Comment>`
- 通过 CommentBinding 关联到 Shape

**坐标语义**：

```typescript
interface Comment {
  x: number // 双重语义！
  y: number
  // - 有 CommentBinding: 归一化坐标（0-1）相对于 shape
  // - 无 CommentBinding: 世界坐标（像素）
}
```

**权衡**：

- ✅ 简化了选择系统（不需要特殊处理 Comment）
- ✅ 简化了变换系统
- ⚠️ 坐标语义不稳定（需要查询 Binding 才能解释）
- ⚠️ attach/detach 时需要坐标系转换

---

### 决策 3：运行时验证 vs 类型约束

**问题**：如何确保 `ConnectorBinding.fromId` 一定是 LineShape？

**备选方案**：

- 方案 A：运行时验证（实用主义）✅ 采用
- 方案 B：细粒度 ID 类型（类型纯粹主义）❌ 拒绝
- 方案 C：传入 Shape 对象（激进方案）❌ 拒绝

**采用方案 A 的理由**：

- TypeScript 的 branded type 在 Map 查找时类型会丢失
- 运行时验证足够，且更灵活
- 参考成熟项目（tldraw, Figma）都用此方案

**实现**：

```typescript
// 编译时：类型守卫
if (isConnectorShape(shape)) {
  // TypeScript 自动收窄类型为 LineShape
  const binding = connectorBinding.create(shape.id, ...)
}

// 运行时：验证函数
try {
  validateConnectorBinding(binding, shapes)
} catch (error) {
  if (error instanceof InvalidConnectorShapeError) {
    // 处理错误
  }
}
```

---

### 决策 4：软删除 vs 硬删除

**选择**：软删除（标记 `deleted: true`）

**理由**：

1. 协同编辑中，Undo/Redo 更容易实现
2. 其他用户可能引用被删除的实体
3. 可以实现"回收站"功能
4. 可以定期清理（如 30 天后永久删除）

**实现**：

```typescript
interface Comment {
  deleted?: boolean
  deletedAt?: number
  deletedBy?: UserId
}

// 查询时过滤
const activeComments = Array.from(comments.values()).filter((c) => !c.deleted)
```

---

## ⚠️ 待确认的问题

### GroupShape 的行为（需要 Miro 测试）

**问题 1：Group 的边界框**

- [ ] 测试：创建 Group，移动子元素
- [ ] 观察：Group 的选择框会自动调整吗？
- [ ] 影响：决定 `x, y` 是动态计算还是存储值

**问题 2：Line 能绑定到 Group 吗？**

- [ ] 测试：拖动 Line 的终点到 Group 上
- [ ] 观察：能绑定吗？吸附到哪里？
- [ ] 影响：决定 `isBindableTarget(group)` 的返回值

**问题 3：Group 的旋转行为**

- [ ] 测试：旋转包含 Rect 的 Group
- [ ] 观察：Rect 的 `rotation` 值变了吗？
- [ ] 影响：决定渲染逻辑（累加旋转 vs 重新计算坐标）

**问题 4：Group 的视觉样式**

- [ ] 测试：Group 有边框吗？能设置背景色吗？
- [ ] 观察：有标题或名称显示吗？
- [ ] 影响：决定 `GroupProps` 需要哪些字段

**问题 5：嵌套 Group**

- [ ] 测试：把 Group B 放到 Group A 里
- [ ] 观察：支持嵌套吗？
- [ ] 影响：决定 parentId 的验证逻辑

---

### 可能的 GroupProps 设计

**选项 A：纯逻辑容器（最简单）**

```typescript
interface GroupProps {
  // 空对象，Group 只是逻辑容器
}
```

**选项 B：带缓存的容器（性能优化）**

```typescript
interface GroupProps {
  // 缓存边界框，避免频繁计算
  cachedBounds?: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
}
```

**选项 C：带视觉样式的容器（完整实现）**

```typescript
interface GroupProps {
  // 视觉属性
  showBorder?: boolean
  borderColor?: string
  borderStyle?: 'solid' | 'dashed'

  // 边界框缓存
  cachedBounds?: Box

  // 折叠状态
  collapsed?: boolean
}
```

**建议**：先用选项 A，根据测试结果和需求逐步扩展。

---

## 📋 待完成任务

### 1. 确认 Group 行为（高优先级）

- [ ] 在 Miro 中测试上述 5 个场景
- [ ] 记录测试结果
- [ ] 根据结果更新 `GroupProps` 定义
- [ ] 更新 `isBindableTarget` 逻辑（如果需要）

### 2. 完成 Document 类型

- [ ] 创建 `packages/types/src/document.ts`
- [ ] 定义 Document 接口
- [ ] 添加工厂函数（createDocument）
- [ ] 添加查询工具函数（findChildren, getGlobalTransform 等）

### 3. 开始 PixiJS 画布（Week 1 Day 3-4）

根据计划，下一步是：

- [ ] `packages/editor/src/canvas/Canvas.ts` - PixiJS Application 封装
- [ ] `packages/editor/src/canvas/Viewport.ts` - 无限画布（pan, zoom）
- [ ] `packages/editor/src/renderer/ShapeRenderer.ts` - Shape 渲染基类
- [ ] `packages/editor/src/renderer/RectRenderer.ts` - 矩形渲染

---

## 📊 进度对照（Week 1 Day 1-2）

| 任务                                      | 计划   | 实际         | 状态            |
| ----------------------------------------- | ------ | ------------ | --------------- |
| `packages/types/src/index.ts`             | ✅     | ✅           | 完成            |
| `packages/types/src/shape.ts`             | ✅     | ✅ shapes.ts | 完成（扩展）    |
| `packages/types/src/document.ts`          | ✅     | ⏸️           | 等待 Group 确认 |
| `packages/types/src/geometry.ts`          | ✅     | ✅           | 完成            |
| **额外完成**                              | -      | ✅           | -               |
| `packages/types/src/ids.ts`               | -      | ✅           | 超出计划        |
| `packages/types/src/bindings.ts`          | Week 4 | ✅           | 提前完成        |
| `packages/types/src/comment.ts`           | -      | ✅           | 超出计划        |
| `packages/types/src/binding-validator.ts` | -      | ✅           | 超出计划        |
| 完整文档（2 篇）                          | -      | ✅           | 超出计划        |

**总结**：Day 1-2 的任务已超额完成，还提前完成了部分 Week 4 的内容（Bindings）。

---

## 🔑 关键代码片段

### 创建 Shape 和 Binding

```typescript
import {
  createShapeId,
  type RectShape,
  type LineShape,
  connectorBinding,
  validateConnectorBinding,
} from '@mind-fuse/types'

// 创建矩形
const rect: RectShape = {
  id: createShapeId(),
  type: 'rect',
  x: 200,
  y: 100,
  rotation: 0,
  parentId: null,
  index: 'a0',
  isLocked: false,
  props: {
    width: 150,
    height: 100,
    fill: '#e3f2fd',
    stroke: '#2196f3',
    strokeWidth: 2,
  },
}

// 创建连接线
const line: LineShape = {
  id: createShapeId(),
  type: 'line',
  x: 50,
  y: 150,
  rotation: 0, // 始终为 0
  parentId: null,
  index: 'a1',
  isLocked: false,
  props: {
    endX: 120,
    endY: 0,
    stroke: '#000000',
    strokeWidth: 2,
    endArrow: 'arrow',
  },
}

// 创建绑定
const binding = connectorBinding.create(
  line.id,
  'end',
  rect.id,
  { x: 0, y: 0.5 } // 矩形左边缘中点
)

// 验证
const shapes = new Map([
  [rect.id, rect],
  [line.id, line],
])
validateConnectorBinding(binding, shapes) // 通过
```

### 使用类型守卫

```typescript
import { isLineShape, isBindableTarget } from '@mind-fuse/types'

function canCreateBinding(fromShape: Shape, toShape: Shape): boolean {
  // TypeScript 会自动收窄类型
  if (!isLineShape(fromShape)) {
    return false // 只有线可以作为连接器
  }

  if (!isBindableTarget(toShape)) {
    return false // 线不能绑到线
  }

  return true
}
```

---

## 🎯 下一步行动

### 立即行动（今天）

1. **测试 Miro 的 Group 行为**（30 分钟）
   - 完成上述 5 个测试场景
   - 截图记录关键行为
   - 记录测试结果

2. **完成 Document 类型**（1 小时）
   - 根据测试结果调整 GroupProps
   - 创建 document.ts
   - 添加工具函数

### 明天开始（Day 3-4）

3. **PixiJS 画布实现**
   - 初始化 `packages/editor` 包
   - 封装 PixiJS Application
   - 实现无限画布（pan, zoom）
   - 实现矩形渲染器

---

## 💡 经验总结

### 做得好的地方

1. **类型系统设计完整**：提前考虑了扩展性（箭头样式、路径类型）
2. **文档详细**：验证指南和示例帮助理解复杂概念
3. **运行时验证**：补充了 TypeScript 类型系统的不足
4. **架构决策明确**：每个设计选择都有清晰的理由

### 需要改进的地方

1. **Group 行为未确认**：应该在设计初期就测试
2. **Comment 的坐标语义**：双重语义可能带来维护问题（需要在实现中验证）
3. **文档过于详细**：可能过早优化，应该在实际使用中迭代

### 下一阶段注意事项

1. **渲染层实现时**：严格遵循类型定义，不要绕过验证
2. **测试驱动**：为每个类型守卫和验证函数编写单元测试
3. **迭代优化**：如果发现设计问题，及时调整（现在还来得及）

---

## 📚 参考资料

- 完整文档：`packages/types/BINDING_VALIDATION.md`
- 使用示例：`packages/types/EXAMPLES.md`
- 实现计划：`.claude/plans/synchronous-inventing-oasis.md`
- 历史进度：`.progress/2025-12-17-whiteboard-types.md`
