# 测试策略与技术路线图

> **更新时间:** 2026-01-10
> **当前阶段:** Phase 1 (MVP), Week 1, Day 2-3
> **架构决策:** Senior Architect Review
> **状态:** 执行中 - P0 测试开发阶段

---

## 📊 当前状态总览

### 风险评估

| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| **测试覆盖率** | 33% | 80%+ | 🔴 **高风险** |
| **核心模块测试** | 1/3 | 3/3 | 🟡 进行中 |
| **集成测试** | 0 | 1+ | 🔴 待开始 |
| **阻塞问题** | 是 | 否 | 🔴 阻塞 Editor 开发 |

### 测试覆盖详情

#### ✅ 已完成
- **SpatialGrid.ts** (82行)
  - ✅ 7个测试场景通过
  - ✅ 涵盖插入、查询、更新、删除
  - ✅ 边界条件（负坐标、跨格子）
  - 📄 测试文件: `SpatialGrid.test.ts` (93行)

#### ❌ 待测试 (P0 - 阻塞级)
- **DocumentManager.ts** (156行) - 🔴 核心集成模块，未测试
  - Yjs + SpatialGrid 双向同步
  - Observer 模式事件处理
  - Z-order 排序逻辑
  - 类型转换 (ShapeId ↔ string)

- **shapes.ts 几何函数** - 🔴 数学计算，易错且难调试
  - `getShapeAABB()` - 旋转矩形 AABB 计算
  - `isPointInShape()` - 逆旋转精确点击检测
  - `getRotatedCorners()` - 旋转矩阵变换
  - `pointToLineSegmentDistance()` - 向量投影

#### ⏸️ 暂缓测试 (P2 - 功能开发时补充)
- binding-validator.ts - MVP 不使用
- groups.ts - MVP 不使用
- comment.ts - MVP 不使用
- geometry.ts 部分函数 - 不在热路径

---

## 🎯 立即行动计划 (今明两天)

### Day 2 下午 (今天, 2-3小时)

#### 任务 1: DocumentManager.test.ts
**优先级:** 🔴 P0 - 必须完成

**测试场景 (15个):**

**单元测试 - 基础CRUD:**
1. ✅ Constructor 初始化 (Yjs maps + SpatialGrid)
2. ✅ addShape 添加 shape
3. ✅ getShape 获取单个 shape
4. ✅ getShapes 获取所有 shapes
5. ✅ removeShape 删除 shape
6. ✅ updateShape 更新 shape
7. ✅ toYKey/fromYKey 类型转换

**集成测试 - Observer 同步:**
8. ✅ Observer setup 验证
9. ✅ addShape 触发 SpatialGrid.insert
10. ✅ updateShape 触发 SpatialGrid.update
11. ✅ removeShape 触发 SpatialGrid.remove

**查询测试 - 核心路径:**
12. ✅ findShapeAtPoint 单个 shape
13. ✅ findShapeAtPoint 重叠 shapes (Z-order)
14. ✅ findShapeAtPoint 旋转矩形

**边界条件:**
15. ✅ 空文档查询
16. ✅ 点在所有 shapes 外

**测试辅助函数:**
```typescript
const createTestRect = (id: string, x: number, y: number, index = 'a0'): RectShape => ({
  id: id as ShapeId,
  type: 'rect',
  x, y, rotation: 0,
  index,
  parentId: null,
  isLocked: false,
  props: {
    width: 50,
    height: 50,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2
  }
})
```

**关键断言模式:**
```typescript
// 1. Yjs 同步检查
expect(dm.getShape(shapeId)).toBeDefined()

// 2. SpatialGrid 同步检查 (通过查询验证)
const found = dm.findShapeAtPoint(Point.create(x, y))
expect(found?.id).toBe(shapeId)

// 3. Z-order 正确性
const topShape = dm.findShapeAtPoint(overlappingPoint)
expect(topShape?.index).toBe('b0') // 更高的 index
```

**参考测试风格:**
- 📄 参考: `SpatialGrid.test.ts`
- 使用 Vitest: `describe`, `it`, `expect`, `beforeEach`
- 每个测试独立创建 Y.Doc

---

### Day 3 上午 (明天, 1-2小时)

#### 任务 2: shapes.test.ts
**优先级:** 🔴 P0 - 必须完成

**测试场景 (12个):**

**getShapeAABB() - 6 scenarios:**
1. ✅ 无旋转矩形 - 返回原始边界框
2. ✅ 45° 旋转矩形 - AABB 包含旋转后的角
3. ✅ 90° 旋转矩形 - 宽高互换
4. ✅ 负角度旋转 - 处理负值
5. ✅ Line shape - 起点到终点 AABB
6. ✅ 负斜率 Line - endX/endY 为负

**isPointInShape() - 6 scenarios:**
7. ✅ 点在无旋转矩形内
8. ✅ 点在无旋转矩形外
9. ✅ 点在旋转矩形中心 - 逆旋转正确
10. ✅ 点在旋转矩形外
11. ✅ 点在线上 (阈值内)
12. ✅ 点远离线

**测试示例:**
```typescript
describe('getShapeAABB', () => {
  it('should return original bounds for non-rotated rect', () => {
    const rect: RectShape = createTestRect(0, 0, 0)
    const aabb = getShapeAABB(rect)
    expect(aabb).toEqual({ x: 0, y: 0, width: 50, height: 50 })
  })

  it('should compute AABB for 45° rotated rect', () => {
    const rect: RectShape = createTestRect(100, 100, Math.PI / 4)
    const aabb = getShapeAABB(rect)

    // AABB 应该包含所有旋转后的角
    const corners = getRotatedCorners(rect)
    for (const corner of corners) {
      expect(Box.contains(aabb, corner)).toBe(true)
    }
  })
})

describe('isPointInShape', () => {
  it('should detect point inside rotated rect', () => {
    const rect: RectShape = {
      x: 100, y: 100, rotation: Math.PI / 4,
      props: { width: 50, height: 30 }
    }
    const center = Point.create(125, 115) // 矩形中心
    expect(isPointInShape(center, rect)).toBe(true)
  })
})
```

---

#### 任务 3: 集成验证 (30分钟)
**优先级:** 🟡 P1 - 测试通过后立即执行

**目标:** 验证 Yjs → DocumentManager → SpatialGrid → Query 完整流程

**验证脚本:** `packages/collaboration-core/src/__integration__/smoke.test.ts` (可选)

**或者直接在 DocumentManager.test.ts 中添加端到端场景:**

```typescript
describe('End-to-end integration', () => {
  it('should handle complete lifecycle: add → query → update → query → remove', () => {
    const ydoc = new Y.Doc()
    const dm = new DocumentManager(ydoc)

    // 1. 添加
    const rect = createTestRect('shape:1', 100, 100)
    dm.addShape(rect)

    // 2. 查询 - 应该找到
    expect(dm.findShapeAtPoint(Point.create(125, 125))).toBeDefined()

    // 3. 更新位置
    dm.updateShape({ ...rect, x: 500, y: 500 })

    // 4. 旧位置找不到
    expect(dm.findShapeAtPoint(Point.create(125, 125))).toBeUndefined()

    // 5. 新位置能找到
    expect(dm.findShapeAtPoint(Point.create(525, 525))).toBeDefined()

    // 6. 删除
    dm.removeShape(rect.id)

    // 7. 删除后找不到
    expect(dm.findShapeAtPoint(Point.create(525, 525))).toBeUndefined()
  })
})
```

**成功标准:**
- ✅ 所有断言通过
- ✅ 无 Yjs 警告
- ✅ 无 TypeScript 错误
- ✅ SpatialGrid 与 Yjs 保持同步

---

### Day 3 下午 (明天, 3-4小时)

#### 任务 4: 开始 Editor 包开发
**前置条件:** ✅ 所有 P0 测试通过

**按照原 NEXT_STEPS.md 执行:**
1. 初始化 Editor 包 (package.json, tsconfig.json)
2. Canvas.ts - PixiJS Application 封装
3. Viewport.ts - 无限画布 (pan, zoom)
4. ShapeRenderer.ts - 渲染基类
5. RectRenderer.ts - 矩形渲染器

---

## 🗓️ 完整时间规划

### Week 1 - Day 2-3 (今明两天)

| 时间 | 任务 | 预计时长 | 状态 |
|------|------|----------|------|
| **Day 2 下午** | DocumentManager.test.ts | 2-3h | ⏳ 待开始 |
| **Day 3 上午** | shapes.test.ts | 1-2h | 📝 待办 |
| | 集成验证 | 30min | 📝 待办 |
| | **测试里程碑** | - | 🎯 检查点 |
| **Day 3 下午** | Editor 包初始化 | 30min | 📝 待办 |
| | Canvas + Viewport | 2-3h | 📝 待办 |
| **Day 4** | Renderers 实现 | 3-4h | 📝 待办 |
| **Day 5** | Web 集成 + 验收 | 2-3h | 📝 待办 |

### 与原计划对比

**原 NEXT_STEPS.md:**
```
Day 2: 完成测试 + Document 类型 (1.5h)
Day 3: Editor 包 + PixiJS 实现 (3-4h)
Day 4: Web 集成 (1h)
```

**调整后 (当前计划):**
```
Day 2: 测试策略 + DocumentManager 测试 (3-4h)
Day 3 上午: shapes 测试 + 验证 (2-3h)
Day 3 下午: 开始 Editor 包 (3-4h)
Day 4: 继续 Editor 包
Day 5: Web 集成 + 验收
```

**调整原因:**
- ⚠️ 原计划低估了测试工作量 (DocumentManager 156行 + shapes.ts 复杂几何)
- ✅ 增加集成验证环节
- ✅ 推迟 1 天 Editor 开发，质量优先

**风险对比:**
- 📉 推迟风险: MVP 延迟 1 天 → **可接受** (3-4月项目，1天影响<1%)
- 📈 不测试风险: Editor 开发时发现底层 bug → **高成本** (需同时调试两层)
- ✅ 决策: **质量优先，推迟 1 天是值得的投资**

---

## 📋 关键决策记录

### 决策 #1: 必须测试 DocumentManager
- **决策:** P0 优先级，阻塞 Editor 开发
- **理由:**
  - 单点故障 (唯一的 Yjs ↔ SpatialGrid 桥梁)
  - Observer 模式易错
  - Z-order 逻辑微妙
  - 类型转换隐患
- **替代方案 (已拒绝):** 跳过测试 → 风险太高
- **影响:** 推迟 Editor 开发 1 天

### 决策 #2: 必须测试 shapes.ts 几何函数
- **决策:** P0 优先级，必须在 Editor 前完成
- **理由:**
  - 数学计算易错 (旋转矩阵、AABB)
  - 被 DocumentManager 核心路径依赖
  - 几何 bug 难以从视觉调试
- **测试重点:** getShapeAABB, isPointInShape
- **影响:** 需要 1-2 小时

### 决策 #3: 暂缓其他模块测试
- **决策:** binding-validator, groups.ts, comment.ts → P2
- **理由:** MVP 不使用这些功能，避免过度工程
- **风险:** 后期补充成本略高 → **可接受**
- **触发时机:** 实现对应功能时同步补测试

### 决策 #4: 暂缓 Document 深入设计
- **决策:** 推迟到 Week 2 或功能开发时
- **理由:**
  - 当前 Document 接口够用
  - SpatialGrid 已提供空间索引
  - Yjs 处理序列化
  - 避免过度设计
- **删除文件:** `2025-12-24-document-design.md`
- **风险:** 可能需要重构 → 当前抽象层良好，成本可控

### 决策 #5: 删除过时进度文件
- **删除:**
  - `NEXT_STEPS.md` - 被本文档取代
  - `2025-12-24-document-design.md` - 决定暂缓设计
- **保留:**
  - `2025-12-17-whiteboard-types.md` - types 设计历史
  - `2025-12-22-types-package-completion.md` - 完成记录
  - `init.md`, `theme.md` - 项目文档
- **理由:** 保持进度文档清晰，避免过时信息干扰

---

## ✅ 验收标准

### Milestone 1: P0 测试完成 (Day 3 上午)
- [ ] DocumentManager.test.ts 通过 (15+ 场景)
- [ ] shapes.test.ts 通过 (12+ 场景)
- [ ] 集成验证通过
- [ ] 测试覆盖率 ≥ 80% (collaboration-core + types 核心函数)
- [ ] 无 TypeScript 错误
- [ ] 无 Yjs 运行时警告
- [ ] **通过标准:** 所有测试 `pnpm test` 全绿

### Milestone 2: Editor 包启动 (Day 3 下午)
- [ ] P0 测试全部通过
- [ ] Code review 完成
- [ ] Git commit: `feat: add comprehensive tests for DocumentManager and shapes`
- [ ] Editor 包初始化完成
- [ ] Canvas.ts 初步实现

### Milestone 3: Week 1 完成 (Day 5)
- [ ] 浏览器打开 `/board` 页面
- [ ] 显示蓝色矩形
- [ ] 画布可拖拽 (pan)
- [ ] 画布可缩放 (zoom)
- [ ] 控制台无错误
- [ ] **演示标准:** 能向技术团队展示可交互画布

---

## 🔧 开发工具与命令

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test packages/collaboration-core/src/DocumentManager.test.ts

# Watch 模式 (开发时推荐)
pnpm test packages/collaboration-core/src/DocumentManager.test.ts --watch

# 覆盖率报告
pnpm test --coverage
```

### 测试调试
```typescript
// 使用 it.only 聚焦单个测试
it.only('should pass this specific test', () => {
  // ...
})

// 跳过测试
it.skip('should skip this test', () => {
  // ...
})

// 查看 Yjs 状态
console.log('Yjs shapes:', dm.getShapes())
console.log('SpatialGrid query:', spatialGrid.queryPoint(point))
```

### Git Commit 规范
```bash
# 测试完成后
git add packages/collaboration-core/src/DocumentManager.test.ts
git add packages/types/src/shapes.test.ts
git commit -m "feat: add comprehensive tests for DocumentManager and shapes

- Add 15 test scenarios for DocumentManager (CRUD + Observer + Query)
- Add 12 test scenarios for shapes.ts geometry functions
- Add integration test for Yjs ↔ SpatialGrid synchronization
- Achieve 80%+ test coverage for core modules

Refs: #testing-strategy"
```

---

## 📚 相关文档

### 项目文档
- 📄 项目规划: `/plan.md`
- 📄 测试计划: `/.claude/plans/woolly-swinging-eagle.md`

### 历史进度 (保留的)
- 📄 Types 设计: `.progress/2025-12-17-whiteboard-types.md`
- 📄 Types 完成: `.progress/2025-12-22-types-package-completion.md`
- 📄 项目初始化: `.progress/init.md`
- 📄 主题设计: `.progress/theme.md`

### 代码参考
- 📄 测试风格: `packages/collaboration-core/src/SpatialGrid.test.ts`
- 📄 DocumentManager: `packages/collaboration-core/src/DocumentManager.ts`
- 📄 shapes.ts: `packages/types/src/shapes.ts`
- 📄 geometry.ts: `packages/types/src/geometry.ts`

### 外部资源
- [Vitest 文档](https://vitest.dev/)
- [Yjs 文档](https://docs.yjs.dev/)
- [PixiJS 文档](https://pixijs.com/8.x/guides) (下一步)

---

## 🚀 下一步行动 (立即执行)

**现在 (立即):**
1. ✅ 阅读本文档，理解测试策略
2. ⏳ 开始编写 `DocumentManager.test.ts`
3. 📝 参考 `SpatialGrid.test.ts` 的测试风格

**代码起手式:**
```typescript
// packages/collaboration-core/src/DocumentManager.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import * as Y from 'yjs'
import { DocumentManager } from './DocumentManager'
import { Point, type ShapeId, type RectShape } from '@mind-fuse/types'

// 测试辅助函数
const createTestRect = (id: string, x: number, y: number, index = 'a0'): RectShape => ({
  id: id as ShapeId,
  type: 'rect',
  x, y, rotation: 0,
  index,
  parentId: null,
  isLocked: false,
  props: {
    width: 50,
    height: 50,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2
  }
})

describe('DocumentManager', () => {
  let ydoc: Y.Doc
  let dm: DocumentManager

  beforeEach(() => {
    ydoc = new Y.Doc()
    dm = new DocumentManager(ydoc)
  })

  describe('Constructor', () => {
    it('should initialize with empty maps', () => {
      expect(dm.getShapes().size).toBe(0)
      // TODO: 继续添加测试...
    })
  })

  // TODO: 添加更多测试组...
})
```

**运行测试:**
```bash
pnpm test packages/collaboration-core/src/DocumentManager.test.ts --watch
```

**预期输出:**
```
✓ packages/collaboration-core/src/DocumentManager.test.ts (15)
  ✓ DocumentManager (15)
    ✓ Constructor (1)
    ✓ CRUD operations (6)
    ✓ Observer synchronization (4)
    ✓ Query operations (3)
    ✓ Edge cases (1)

Test Files  1 passed (1)
Tests  15 passed (15)
Duration  123ms
```

---

**准备好了吗？开始写第一个测试！** 🚀

