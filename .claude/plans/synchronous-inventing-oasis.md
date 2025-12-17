# Mind-Fuse 白板页面实现计划

## 目标

从白板页面开始，采用**垂直切片 + 迭代**的方式实现一个生产级的协作白板。长期目标是完全复刻 Miro。

---

## 核心架构决策（已确认）

| 决策点 | 选择 |
|--------|------|
| 数据结构风格 | tldraw 风格（parentId + index + props） |
| 连接线绑定 | Bindings 独立管理（方案 2） |
| 子元素坐标 | 相对于父元素（移动父元素时子元素自动跟随） |
| 排序索引 | Fractional indexing（字符串，支持协同编辑） |
| 交互模式 | 点击即用 + 拖拽绘制（两种都支持） |
| 实现路线 | 垂直切片 + 迭代（2 周可见画布） |

---

## 核心数据模型

```typescript
// packages/types/src/document.ts
interface Document {
  shapes: Map<ShapeId, Shape>
  bindings: Map<BindingId, Binding>
  assets: Map<AssetId, Asset>
}

// packages/types/src/shape.ts
interface BaseShape<T extends string, P> {
  id: ShapeId
  type: T
  parentId: ShapeId | null
  index: string                  // fractional index
  x: number                      // 相对于父元素
  y: number
  rotation: number
  isLocked: boolean
  props: P
  meta: Record<string, unknown>
}

// packages/types/src/binding.ts
interface Binding {
  id: BindingId
  type: string
  fromId: ShapeId
  fromHandle: string
  toId: ShapeId
  toAnchor: AnchorPoint
  meta: Record<string, unknown>
}
```

---

## 实现阶段

### Phase 1: 最小垂直切片（Week 1-2）

**目标**：2 周后能看到可交互的画布

#### Week 1: 基础渲染

**Day 1-2: 类型定义**
- [ ] `packages/types/src/index.ts` - 导出入口
- [ ] `packages/types/src/shape.ts` - BaseShape + RectShape 定义
- [ ] `packages/types/src/document.ts` - Document 类型
- [ ] `packages/types/src/geometry.ts` - Point, Box, Transform 等基础几何类型

**Day 3-4: PixiJS 画布**
- [ ] `packages/editor/src/canvas/Canvas.ts` - PixiJS Application 封装
- [ ] `packages/editor/src/canvas/Viewport.ts` - 无限画布（pan, zoom）
- [ ] `packages/editor/src/renderer/ShapeRenderer.ts` - Shape 渲染基类
- [ ] `packages/editor/src/renderer/RectRenderer.ts` - 矩形渲染

**Day 5: Web 集成**
- [ ] `apps/web/src/components/Whiteboard.tsx` - 白板组件
- [ ] `apps/web/src/app/board/page.tsx` - 白板页面路由
- [ ] 验收：页面上能看到一个矩形

#### Week 2: 基础交互

**Day 1-2: 选择系统**
- [ ] `packages/editor/src/selection/SelectionManager.ts` - 选择状态管理
- [ ] `packages/editor/src/selection/SelectionBox.ts` - 选择框渲染
- [ ] `packages/editor/src/interaction/HitTest.ts` - 点击检测

**Day 3-4: 变换系统**
- [ ] `packages/editor/src/transform/TransformManager.ts` - 变换控制
- [ ] `packages/editor/src/transform/DragHandler.ts` - 拖拽移动
- [ ] `packages/editor/src/transform/ResizeHandles.ts` - 缩放手柄

**Day 5: 工具栏雏形**
- [ ] `apps/web/src/components/Toolbar.tsx` - 工具栏 UI
- [ ] `packages/editor/src/tools/Tool.ts` - 工具基类
- [ ] `packages/editor/src/tools/SelectTool.ts` - 选择工具
- [ ] `packages/editor/src/tools/RectTool.ts` - 矩形工具
- [ ] 验收：能选中矩形、拖拽移动、用工具画新矩形

---

### Phase 2: 扩展 Shape 类型（Week 3-4）

**目标**：支持 Miro 核心图形

#### Week 3: 更多图形
- [ ] `EllipseShape` - 椭圆/圆形
- [ ] `StickyShape` - 便签（带文本）
- [ ] `TextShape` - 纯文本
- [ ] `LineShape` - 直线
- [ ] 对应的 Renderer 和 Tool

#### Week 4: 连接线 + Bindings
- [ ] `ConnectorShape` - 连接线
- [ ] `packages/types/src/binding.ts` - Binding 类型完善
- [ ] `packages/editor/src/bindings/BindingManager.ts` - 绑定管理
- [ ] 连接线端点吸附到 Shape 边缘

---

### Phase 3: 补全基础设施（Week 5-6）

**目标**：架构规范化

#### Week 5: 独立 utils + validate
- [ ] `packages/utils/src/geometry/` - 几何计算函数
- [ ] `packages/utils/src/fractional-index/` - fractional indexing 算法
- [ ] `packages/validate/src/shape.ts` - Zod schema 验证
- [ ] 从 editor 中抽取公共代码到 utils

#### Week 6: Store + Undo/Redo
- [ ] `packages/store/src/DocumentStore.ts` - 文档状态管理
- [ ] `packages/store/src/HistoryManager.ts` - 操作历史
- [ ] `packages/store/src/commands/` - Command 模式
- [ ] Undo/Redo 功能

---

## 关键文件路径

```
packages/
├── types/
│   └── src/
│       ├── index.ts
│       ├── shape.ts          # Shape 类型定义
│       ├── binding.ts        # Binding 类型定义
│       ├── document.ts       # Document 类型
│       └── geometry.ts       # 几何类型
├── editor/
│   └── src/
│       ├── canvas/
│       │   ├── Canvas.ts     # PixiJS 封装
│       │   └── Viewport.ts   # 无限画布
│       ├── renderer/
│       │   ├── ShapeRenderer.ts
│       │   └── RectRenderer.ts
│       ├── selection/
│       │   └── SelectionManager.ts
│       ├── transform/
│       │   └── TransformManager.ts
│       ├── tools/
│       │   ├── Tool.ts
│       │   ├── SelectTool.ts
│       │   └── RectTool.ts
│       └── index.ts
apps/
└── web/
    └── src/
        ├── app/board/page.tsx
        └── components/
            ├── Whiteboard.tsx
            └── Toolbar.tsx
```

---

## 技术栈确认

| 层 | 技术 |
|----|------|
| 渲染 | PixiJS v8 (WebGL/WebGPU) |
| 状态管理 | Zustand (Phase 3 引入) |
| 样式 | vanilla-extract |
| UI 组件 | Radix UI + shadcn/ui |
| 类型验证 | Zod |

## 技术决策

### PixiJS 集成方式
- 整个白板页面使用 `'use client'` 标记为 client component
- 原因：白板是纯客户端交互，不需要 SSR，这种方式比 dynamic import 更简单

### Week 1 数据来源
- 硬编码测试数据，专注渲染验证
- Store 抽象留到 Phase 3

---

## 下一步

执行 Week 1 Day 1-2：types 包的核心类型定义
