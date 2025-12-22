# 🎯 下一步行动指南

> 更新时间: 2025-12-22
> 当前阶段: Phase 1, Week 1, Day 2 完成 → 准备进入 Day 3-4

---

## ✅ 当前状态

### 已完成（Week 1, Day 1-2）

- ✅ **Types 包完整实现**（超额完成）
  - ids.ts, geometry.ts, shapes.ts, bindings.ts, comment.ts
  - binding-validator.ts（运行时验证）
  - 完整文档（BINDING_VALIDATION.md, EXAMPLES.md）

**进度**：Day 1-2 任务 100% 完成，还提前完成了部分 Week 4 内容（Bindings）

---

## 🚀 立即行动（今天完成）

### 1. 测试 Miro 的 Group 行为（30 分钟）⚠️ 高优先级

在 Miro 中测试以下 5 个场景，记录结果：

**场景 1：Group 的边界框**

```
1. 创建 2 个 Rect
2. 选中它们，创建 Group
3. 移动其中一个 Rect
4. 观察：Group 的边界框会自动调整吗？
```

→ 记录：Group 的 x, y 是固定的还是动态的？

**场景 2：Line 能绑定到 Group 吗？**

```
1. 创建一个 Group（包含 2 个 Rect）
2. 创建一条 Line
3. 拖动 Line 的终点到 Group 上
4. 观察：能绑定吗？如果能，吸附到哪里？
```

→ 记录：影响 `isBindableTarget(group)` 的实现

**场景 3：Group 的旋转行为**

```
1. 创建 Group（包含 2 个 Rect）
2. 旋转 Group 45 度
3. 观察：Rect 的 rotation 值变了吗？
```

→ 记录：决定渲染逻辑（累加旋转 vs 重新计算坐标）

**场景 4：Group 的视觉样式**

```
1. 选中 Group
2. 观察：有边框吗？能设置背景色吗？有标题显示吗？
```

→ 记录：决定 GroupProps 需要哪些字段

**场景 5：嵌套 Group**

```
1. 创建 Group A（包含 2 个 Rect）
2. 创建 Group B（包含 1 个 Circle）
3. 把 Group B 放到 Group A 里
4. 观察：支持嵌套吗？移动 Group A 时 Group B 跟随吗？
```

→ 记录：决定 parentId 的验证逻辑

---

### 2. 完成 Document 类型（1 小时）

根据测试结果，完成以下任务：

**步骤 1：更新 GroupProps（如果需要）**

```typescript
// packages/types/src/shapes.ts

// 根据测试结果选择：
// 选项 A：空对象（最简单）
interface GroupProps {}

// 选项 B：带缓存（性能优化）
interface GroupProps {
  cachedBounds?: Box
}

// 选项 C：带视觉样式（完整实现）
interface GroupProps {
  showBorder?: boolean
  borderColor?: string
  collapsed?: boolean
}
```

**步骤 2：创建 document.ts**

```typescript
// packages/types/src/document.ts

export interface Document {
  id: DocumentId
  shapes: Map<ShapeId, Shape>
  bindings: Map<BindingId, Binding>
  comments: Map<CommentId, Comment>
  // assets: Map<AssetId, Asset>  // 未来扩展
}

// 工厂函数
export const document = {
  create(id?: DocumentId): Document { ... }
}

// 查询工具
export function findChildren(parentId: ShapeId, shapes: Map<ShapeId, Shape>): Shape[] { ... }
export function getGlobalPosition(shape: Shape, shapes: Map<ShapeId, Shape>): Point { ... }
export function getGlobalRotation(shape: Shape, shapes: Map<ShapeId, Shape>): number { ... }
```

**步骤 3：更新 index.ts**

```typescript
export * from './document'
```

**步骤 4：更新 isBindableTarget（如果需要）**

```typescript
// 如果测试结果显示 Group 不能作为绑定目标
export function isBindableTarget(shape: Shape): boolean {
  return !isLineShape(shape) && !isGroupShape(shape)
}
```

---

## 📅 明天开始（Week 1, Day 3-4）

### 3. 初始化 Editor 包（30 分钟）

```bash
cd packages
mkdir -p editor/src
cd editor
```

**创建 package.json**：

```json
{
  "name": "@mind-fuse/editor",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "dependencies": {
    "@mind-fuse/types": "workspace:*",
    "pixi.js": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**创建 tsconfig.json**：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../types" }]
}
```

---

### 4. PixiJS 画布实现（2-3 小时）

按顺序实现以下文件：

#### 4.1 Canvas.ts - PixiJS Application 封装

```typescript
// packages/editor/src/canvas/Canvas.ts

import { Application } from 'pixi.js'

export class Canvas {
  private app: Application

  constructor(container: HTMLElement) {
    this.app = new Application()
    // 初始化配置
  }

  async init() {
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xffffff,
      antialias: true,
    })
    // 挂载到 DOM
  }

  destroy() {
    this.app.destroy()
  }
}
```

#### 4.2 Viewport.ts - 无限画布（pan, zoom）

```typescript
// packages/editor/src/canvas/Viewport.ts

import { Container } from 'pixi.js'

export class Viewport extends Container {
  private isDragging = false
  private dragStart = { x: 0, y: 0 }

  constructor() {
    super()
    this.setupInteractions()
  }

  private setupInteractions() {
    // 实现 pan（拖拽移动）
    // 实现 zoom（滚轮缩放）
  }

  pan(dx: number, dy: number) { ... }
  zoom(factor: number, center: Point) { ... }
}
```

#### 4.3 ShapeRenderer.ts - 渲染基类

```typescript
// packages/editor/src/renderer/ShapeRenderer.ts

import { Graphics } from 'pixi.js'
import type { Shape } from '@mind-fuse/types'

export abstract class ShapeRenderer<T extends Shape> {
  protected graphics: Graphics

  constructor() {
    this.graphics = new Graphics()
  }

  abstract render(shape: T): void

  destroy() {
    this.graphics.destroy()
  }
}
```

#### 4.4 RectRenderer.ts - 矩形渲染器

```typescript
// packages/editor/src/renderer/RectRenderer.ts

import { isRectShape, type RectShape } from '@mind-fuse/types'
import { ShapeRenderer } from './ShapeRenderer'

export class RectRenderer extends ShapeRenderer<RectShape> {
  render(shape: RectShape): void {
    const { x, y, rotation, props } = shape
    const { width, height, fill, stroke, strokeWidth } = props

    this.graphics.clear()

    // 设置填充和边框
    this.graphics.rect(-width / 2, -height / 2, width, height)
    this.graphics.fill(fill)
    this.graphics.stroke({ width: strokeWidth, color: stroke })

    // 应用变换
    this.graphics.position.set(x, y)
    this.graphics.rotation = rotation
  }
}
```

---

### 5. Web 集成（Day 5）

#### 5.1 创建白板组件

```tsx
// apps/web/src/components/Whiteboard.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Canvas } from '@mind-fuse/editor'

export function Whiteboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<Canvas>()

  useEffect(() => {
    if (!containerRef.current) return

    const canvas = new Canvas(containerRef.current)
    canvas.init()
    canvasRef.current = canvas

    return () => canvas.destroy()
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
```

#### 5.2 创建白板页面

```tsx
// apps/web/src/app/board/page.tsx

import { Whiteboard } from '@/components/Whiteboard'

export default function BoardPage() {
  return (
    <div className="h-screen">
      <Whiteboard />
    </div>
  )
}
```

**验收标准**：浏览器打开 `/board`，能看到一个白色画布和一个蓝色矩形。

---

## 📊 时间估算

| 任务                 | 预计时间     | 优先级 |
| -------------------- | ------------ | ------ |
| 测试 Miro Group 行为 | 30 分钟      | ⚠️ 高  |
| 完成 Document 类型   | 1 小时       | ⚠️ 高  |
| 初始化 Editor 包     | 30 分钟      | 中     |
| PixiJS 画布实现      | 2-3 小时     | 中     |
| Web 集成             | 1 小时       | 中     |
| **总计**             | **5-6 小时** | -      |

**建议安排**：

- 今天：完成测试 + Document 类型（1.5 小时）
- 明天：完成 Editor 包 + PixiJS 实现（3-4 小时）
- 后天：Web 集成 + 验收（1 小时）

---

## 🎯 验收标准

### Week 1 结束时（Day 5）

**必须达到**：

- ✅ 浏览器能打开 `/board` 页面
- ✅ 页面上显示一个蓝色矩形
- ✅ 矩形位置正确（根据 x, y 坐标）
- ✅ 画布可以拖拽（pan）
- ✅ 画布可以缩放（zoom）

**加分项**：

- ✨ 矩形有边框和填充
- ✨ 可以看到画布坐标系（网格线）
- ✨ 控制台没有错误

---

## 🔗 相关文档

- 进度记录：`.progress/2024-12-22-types-package-completion.md`
- 实现计划：`.claude/plans/synchronous-inventing-oasis.md`
- 验证指南：`packages/types/BINDING_VALIDATION.md`
- 使用示例：`packages/types/EXAMPLES.md`

---

## 💡 提示

- 测试 Miro 时，多截几张图，方便后续参考
- 如果发现类型定义有问题，现在修改还来得及
- PixiJS 的文档：https://pixijs.com/8.x/guides
- 遇到问题优先查阅我们的 EXAMPLES.md

**加油！离看到第一个可交互的画布只差 6 小时了！** 🚀
