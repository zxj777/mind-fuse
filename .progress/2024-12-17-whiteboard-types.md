# 白板类型系统设计 - 进度记录

> 创建时间: 2024-12-17
> 状态: 进行中 - 类型系统设计阶段
> 下次开始位置: 从 Shape 定义开始，自然推导出完整类型系统

---

## 今日讨论总结

### 核心架构决策（已确认）

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **数据结构风格** | tldraw 风格 (parentId + index + props) | 成熟方案，支持分组和层级 |
| **连接线绑定** | Bindings 独立管理 | 更灵活，支持多种绑定类型，CRDT 友好 |
| **子元素坐标** | 相对于父元素 | 移动父元素时子元素自动跟随 |
| **排序索引** | Fractional indexing (字符串) | 支持协同编辑，无冲突插入 |
| **变换交互** | 场景 A - 手柄跟随旋转 (Figma/Miro 模式) | 用户期望，需要逆旋转变换计算 |
| **ID 类型方案** | Branded Type (方案 B+，参考 tldraw) | 类型安全 + 插件扩展性 |

### 实现路线确认

**选择了垂直切片 + 预设计混合方案**：
- 核心数据模型（Shape, Binding, Document）预先设计，避免大规模重构
- 实现细节（具体 API、组件结构）边做边优化
- 每个决策点都通过"为什么需要它"的问题驱动，而不是直接给答案

---

## 关键技术点学习

### 1. Fractional Indexing

**问题**：协同编辑时，两个用户同时在 A 和 B 之间插入元素，如何避免冲突？

**解决方案**：
```typescript
// 数字索引 - 会冲突
A.index = 1, B.index = 2
用户 X 插入 C: C.index = 1.5
用户 Y 插入 D: D.index = 1.5  // 💥 冲突

// 字符串索引 - 无冲突
A.index = 'a0', B.index = 'a1'
用户 X 插入 C: C.index = 'a0V'
用户 Y 插入 D: D.index = 'a0G'
// 字典序自动排序：a0 < a0G < a0V < a1
```

### 2. Bindings 独立管理

**为什么不把 boundTo 直接存在 Connector 里？**

```typescript
// 方案 1：直接引用（简单但不灵活）
interface Connector {
  start: { boundTo: 'shape:rect-a' }
  end: { boundTo: 'shape:rect-b' }
}

// 方案 2：独立 Bindings 表（复杂但灵活）
interface Connector {
  start: { x: 300, y: 150 }
  end: { x: 500, y: 150 }
}
interface Binding {
  fromId: 'connector:1',
  toId: 'shape:rect-a',
  anchor: 'right'
}
```

**方案 2 的优势**：
1. 一个端点可以有多个绑定（如同时绑定到 shape 和网格）
2. 支持多种绑定类型（连接线、标签、尺寸标注等）
3. CRDT 协同时更容易处理删除冲突

### 3. ID 类型安全（Branded Type）

**tldraw 的方案**：
```typescript
// @tldraw/store
export type RecordId<R extends UnknownRecord> = string & { __type__: R }

// @tldraw/tlschema
export type TLShapeId = RecordId<TLUnknownShape>

export function createShapeId(id?: string): TLShapeId {
  return `shape:${id ?? uniqueId()}` as TLShapeId
}
```

**为什么这个方案最好**：
- ✅ 类型安全：不能把 `UserId` 传给需要 `ShapeId` 的函数
- ✅ 运行时灵活：任何 `shape:xxx` 格式都是合法 ID
- ✅ 插件友好：第三方可以自由生成自定义 shape ID
- ✅ 零运行时成本：`string & { __type__: R }` 只是类型标记

### 4. Shape 类型扩展性

**tldraw 的方案**：
```typescript
// 内置 shapes（强类型）
export type TLDefaultShape = TLArrowShape | TLRectShape | ...

// 自定义 shapes（宽松类型）
export type TLUnknownShape = TLBaseShape<string, object>

// 合并
export type TLShape = TLDefaultShape | TLUnknownShape
```

**优势**：
- 内置 shapes 有完整类型提示和自动补全
- 插件可以注册自定义 type，系统能处理
- TypeScript 会根据 `shape.type` 自动收窄类型

---

## 当前停止位置

### 准备工作（已完成）
- ✅ 理解 Miro 工具栏交互模式（两种：点击即用、拖拽绘制）
- ✅ 确认数据结构方案（tldraw 风格）
- ✅ 确认 ID 类型方案（Branded Type）
- ✅ 理解为什么需要 Fractional indexing
- ✅ 理解为什么 Bindings 要独立管理

### 下一步行动

**从 Shape 定义开始，自然推导类型系统**：

1. **起点**：定义一个矩形的数据结构
   ```typescript
   const rect = {
     id: ???,
     type: 'rect',
     x: 100,
     y: 100,
     // 还需要什么字段？
   }
   ```

2. **推导过程**（明天继续）：
   - 定义 Shape 时发现需要 `id` 字段 → 引出 ID 类型定义
   - 多种 shape 需要共享字段 → 引出 BaseShape 泛型
   - 需要表示位置和尺寸 → 引出 geometry 类型 (Point, Box, Vec2)
   - 需要父子关系 → 引出 parentId 和 index
   - 连接线需要绑定 → 引出 Binding 类型
   - 管理所有数据 → 引出 Document 类型

3. **实现顺序**（自然推导，而不是预设）：
   ```
   shape.ts (起点)
     ↓ 发现需要 id
   ids.ts
     ↓ 发现需要几何类型
   geometry.ts
     ↓ 发现需要 Binding
   binding.ts
     ↓ 发现需要 Document
   document.ts
     ↓ 汇总导出
   index.ts
   ```

---

## 待解决的问题

### 1. geometry 类型的粒度

**问题**：Week 1 实现到什么程度？

**选项 A - 最小化**：
- Point: `{ x: number, y: number }`
- Box: `{ x, y, width, height }`

**选项 B - 完整**：
- Point
- Box
- Vec2 (带向量运算: add, sub, length, normalize)
- Matrix (支持 translate/rotate/scale)

**考虑因素**：
- Week 2 实现 ResizeHandles 时，需要逆旋转变换
- 如果 Week 1 不实现 Matrix，Week 2 要补，但返工成本不高
- 建议：Week 1 只做 Point/Box，Week 2 按需添加 Vec2/Matrix

### 2. 具体的 Shape props 设计

**问题**：RectShape 的 props 应该包含什么？

```typescript
interface RectShape extends BaseShape<'rect', RectProps> {}

interface RectProps {
  width: number
  height: number
  fill: string  // 颜色如何表示？
  stroke: string
  strokeWidth: number
  // 还需要什么？
  // - 圆角半径？
  // - 阴影？
  // - 透明度在 BaseShape 还是 props 里？
}
```

**决策**：
- 参考 Miro 的矩形属性面板
- 参考 tldraw 的 TLGeoShape props
- 先实现最小集合，按需扩展

---

## Architect Mentor 行为准则更新

**新增规则**：

> **实现阶段准则**：
> 1. **不可逆决策**（数据模型、ID 设计）→ 提前深入讨论，通过问题引导
> 2. **可重构细节**（API、组件结构）→ 鼓励最简实现，遇到问题再优化
> 3. **引导方式**：从用户的起点（如 Shape 定义）出发，自然推导出依赖项（如 ID），而不是直接说"先定义 ID"
> 4. **透明成本**：明确告知"预设计成本"和"返工成本"，让用户自主选择

**反思**：
- ❌ 今天的错误：直接说"从 ID 开始"，用户感觉像"已经知道所有内容"
- ✅ 正确做法：从 Shape 开始，发现需要 ID 时，再讨论 ID 的设计

---

## 参考资料

### tldraw 源码位置
- ID 类型定义: `/Users/zhuxiaojiang/great-voyage/guide/tldraw/packages/store/src/lib/BaseRecord.ts`
- Shape 定义: `/Users/zhuxiaojiang/great-voyage/guide/tldraw/packages/tlschema/src/records/TLShape.ts`
- ID 验证器: `/Users/zhuxiaojiang/great-voyage/guide/tldraw/packages/tlschema/src/misc/id-validator.ts`

### 核心代码片段
```typescript
// tldraw 的 RecordId
export type RecordId<R extends UnknownRecord> = string & { __type__: R }

// tldraw 的 TLShapeId
export type TLShapeId = RecordId<TLUnknownShape>

// 创建函数
export function createShapeId(id?: string): TLShapeId {
  return `shape:${id ?? uniqueId()}` as TLShapeId
}

// 类型守卫
export function isShapeId(id?: string): id is TLShapeId {
  return !!id && id.startsWith('shape:')
}
```

---

## Todo 列表状态

```
✅ 1. Create packages/types package.json and tsconfig.json
⏸️ 2. Define geometry types (Point, Box, Transform) - 暂停，等明天从 Shape 自然推导
⏸️ 3. Define Shape types (BaseShape, RectShape) - 明天的起点
⏸️ 4. Define Binding types
⏸️ 5. Define Document type
⏸️ 6. Create types package index.ts exports
```

---

## 明天开始时的问题

**第一个问题**：一个矩形的数据结构应该是什么样的？

```typescript
const rect = {
  // 你会给它什么字段？列出你的直觉
}
```

从这个起点，我们会自然推导出：
1. 为什么需要 id？什么类型的 id？
2. 为什么需要 geometry 类型？
3. 为什么需要 BaseShape 泛型？
4. 完整的类型系统架构

**记住**：从具体到抽象，从问题到方案，从需求到设计。
