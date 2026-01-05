# DocumentManager 空间索引重构计划

> 创建时间: 2025-01-05
> 状态: 待实现
> 目标: 将 rbush (R-tree) 替换为 Grid (网格) 空间索引

---

## 一、为什么要换？

### R-tree vs Grid 关键对比

| 操作 | R-tree | Grid | 白板场景 |
|-----|--------|------|---------|
| 移动 shape | O(2 log n) 每帧都要 delete + insert | O(1) 格子不变则跳过 | **拖动是核心交互** |
| 点查询 | O(log n + k) | O(m) m=格子内数量 | 差不多 |
| 视口查询 | O(log n + k) | O(g × m) | R-tree 略优 |

**结论**: 拖动场景是白板的核心交互，网格在这个场景下性能更优。

### 具体数据

60fps 拖动 1 秒，每帧移动 2 像素：
- R-tree: 120 次树操作
- Grid: 约 1-2 次 Set 操作（只在跨越格子边界时）

---

## 二、当前实现分析

### 需要修改的代码（和 rbush 耦合）

```typescript
// 1. 类型定义
type SpatialItem = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  shapeId: ShapeId
}

// 2. 私有字段
private readonly spatialIndex: RBush<SpatialItem>
private readonly spatialItemsByShapeId: Map<ShapeId, SpatialItem>

// 3. 构造函数初始化
this.spatialIndex = new RBush<SpatialItem>()
this.spatialItemsByShapeId = new Map<ShapeId, SpatialItem>()

// 4. 索引操作方法
private rebuildSpatialIndex(): void
private upsertInSpatialIndex(shape: Shape): void
private removeFromSpatialIndex(shapeId: ShapeId): void

// 5. 查询方法内部实现
public findShapeAtPoint(point: Point): Shape | undefined
```

### 不需要修改的代码

- Yjs 相关: `yDoc`, `shapesMap`, `commentsMap`, etc.
- 公共接口签名: `getShape()`, `addShape()`, `removeShape()`, `updateShape()`
- Observer 逻辑框架: `setupObservers()`, `handleShapesEvent()`
- 工具方法: `toYKey()`, `fromYKey()`, `compareShapeZ()`

---

## 三、重构前需要决定的问题

### 问题 1: 格子大小

| 选项 | 优点 | 缺点 |
|-----|------|------|
| 100px | 格子多，每格 shape 少，查询快 | 大 shape 跨很多格子 |
| 200px | 平衡 | - |
| 500px | 大 shape 跨格子少 | 每格 shape 多，查询慢 |

**建议**: 先用 200px，后续根据实际数据调优。

### 问题 2: 大 shape / 长连接线处理

```typescript
// 方案 A: 存入所有覆盖的格子
// 问题: 一条对角线可能跨 100+ 个格子

// 方案 B: 大 shape 单独存储
if (width > GRID_SIZE * 2 || height > GRID_SIZE * 2) {
  this.largeShapes.add(shapeId)  // 查询时单独检查
}
```

**建议**: MVP 先用方案 A，如果连接线性能有问题再优化。

### 问题 3: 数据结构

```typescript
// 方案 A: Map<string, Set<ShapeId>>
// key = "row_col"
private cells: Map<string, Set<ShapeId>>

// 方案 B: 二维数组
// 需要预先知道画布大小
private cells: Set<ShapeId>[][]
```

**建议**: 用 Map，因为画布可以无限延伸，坐标可以为负。

### 问题 4: 负坐标支持

画布支持负坐标，格子 key 的计算：

```typescript
// 错误: floor(-50 / 100) = -1, floor(-150 / 100) = -2
// 需要确保 key 格式正确处理负数
function getCellKey(x: number, y: number): string {
  const row = Math.floor(y / GRID_SIZE)
  const col = Math.floor(x / GRID_SIZE)
  return `${row}_${col}`  // "-1_-2" 是合法的 key
}
```

---

## 四、重构步骤

### Step 1: 创建 SpatialGrid 类

```typescript
// src/SpatialGrid.ts

const GRID_SIZE = 200

interface GridItem {
  shapeId: ShapeId
  bounds: Box  // { x, y, width, height }
}

export class SpatialGrid {
  private cells: Map<string, Set<ShapeId>> = new Map()
  private shapeToCell: Map<ShapeId, Set<string>> = new Map()

  insert(shapeId: ShapeId, bounds: Box): void
  remove(shapeId: ShapeId): void
  update(shapeId: ShapeId, newBounds: Box): void
  query(range: Box): ShapeId[]
  queryPoint(point: Point): ShapeId[]
  clear(): void
}
```

### Step 2: 实现 SpatialGrid 核心方法

```typescript
// 计算 shape 覆盖的所有格子
private getCoveredCells(bounds: Box): string[] {
  const startRow = Math.floor(bounds.y / GRID_SIZE)
  const endRow = Math.floor((bounds.y + bounds.height) / GRID_SIZE)
  const startCol = Math.floor(bounds.x / GRID_SIZE)
  const endCol = Math.floor((bounds.x + bounds.width) / GRID_SIZE)

  const cells: string[] = []
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      cells.push(`${row}_${col}`)
    }
  }
  return cells
}

// 插入
insert(shapeId: ShapeId, bounds: Box): void {
  const cellKeys = this.getCoveredCells(bounds)
  this.shapeToCell.set(shapeId, new Set(cellKeys))

  for (const key of cellKeys) {
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set())
    }
    this.cells.get(key)!.add(shapeId)
  }
}

// 更新（移动优化的关键）
update(shapeId: ShapeId, newBounds: Box): void {
  const oldCells = this.shapeToCell.get(shapeId)
  const newCellKeys = this.getCoveredCells(newBounds)
  const newCells = new Set(newCellKeys)

  // 找出需要删除和添加的格子
  const toRemove = oldCells ? [...oldCells].filter(k => !newCells.has(k)) : []
  const toAdd = [...newCells].filter(k => !oldCells?.has(k))

  // 如果格子没变，直接返回
  if (toRemove.length === 0 && toAdd.length === 0) {
    return  // O(1) 快速路径！
  }

  // 更新格子
  for (const key of toRemove) {
    this.cells.get(key)?.delete(shapeId)
  }
  for (const key of toAdd) {
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set())
    }
    this.cells.get(key)!.add(shapeId)
  }
  this.shapeToCell.set(shapeId, newCells)
}
```

### Step 3: 修改 DocumentManager

```typescript
// 替换字段
- private readonly spatialIndex: RBush<SpatialItem>
- private readonly spatialItemsByShapeId: Map<ShapeId, SpatialItem>
+ private readonly spatialIndex: SpatialGrid

// 替换初始化
- this.spatialIndex = new RBush<SpatialItem>()
- this.spatialItemsByShapeId = new Map<ShapeId, SpatialItem>()
+ this.spatialIndex = new SpatialGrid()

// 简化索引操作
- private upsertInSpatialIndex(shape: Shape): void {
-   this.removeFromSpatialIndex(shape.id)
-   const aabb = getShapeAABB(shape)
-   const item: SpatialItem = { ... }
-   this.spatialItemsByShapeId.set(shape.id, item)
-   this.spatialIndex.insert(item)
- }
+ private upsertInSpatialIndex(shape: Shape): void {
+   const bounds = getShapeAABB(shape)
+   this.spatialIndex.update(shape.id, bounds)  // update 内部处理 insert/update
+ }

- private removeFromSpatialIndex(shapeId: ShapeId): void {
-   const existing = this.spatialItemsByShapeId.get(shapeId)
-   if (!existing) return
-   this.spatialIndex.remove(existing)
-   this.spatialItemsByShapeId.delete(shapeId)
- }
+ private removeFromSpatialIndex(shapeId: ShapeId): void {
+   this.spatialIndex.remove(shapeId)
+ }
```

### Step 4: 修改查询方法

```typescript
public findShapeAtPoint(point: Point): Shape | undefined {
  // 获取候选（只返回 shapeId）
  const candidateIds = this.spatialIndex.queryPoint(point)

  let result: Shape | undefined
  for (const shapeId of candidateIds) {
    const shape = this.getShape(shapeId)
    if (!shape) continue
    if (!isPointInShape(point, shape)) continue
    if (!result || DocumentManager.compareShapeZ(shape, result) > 0) {
      result = shape
    }
  }
  return result
}

// 新增: 视口查询
public getShapesInViewport(viewport: Box): Shape[] {
  const candidateIds = this.spatialIndex.query(viewport)
  return candidateIds
    .map(id => this.getShape(id))
    .filter((s): s is Shape => s !== undefined)
}
```

### Step 5: 移除 rbush 依赖

```bash
cd packages/collaboration-core
pnpm remove rbush @types/rbush
```

---

## 五、测试计划

### 单元测试

```typescript
describe('SpatialGrid', () => {
  it('should insert and query point')
  it('should update without changing cells (fast path)')
  it('should update across cell boundaries')
  it('should handle negative coordinates')
  it('should handle large shapes spanning multiple cells')
  it('should remove shape from all cells')
})
```

### 性能测试

```typescript
it('should handle rapid updates (simulating drag)', () => {
  const grid = new SpatialGrid()
  const shape = { id: 'test', x: 0, y: 0, width: 50, height: 50 }

  const start = performance.now()
  for (let i = 0; i < 1000; i++) {
    grid.update(shape.id, { ...shape, x: i })
  }
  const elapsed = performance.now() - start

  expect(elapsed).toBeLessThan(50)  // 1000 次更新 < 50ms
})
```

---

## 六、文件变更清单

| 文件 | 操作 |
|-----|------|
| `src/SpatialGrid.ts` | 新建 |
| `src/DocumentManager.ts` | 修改 |
| `src/index.ts` | 可能需要导出 SpatialGrid |
| `package.json` | 移除 rbush 依赖 |

---

## 七、明天的行动计划

1. [ ] 确认设计决策（格子大小、大 shape 处理）
2. [ ] 创建 `SpatialGrid.ts`，实现核心方法
3. [ ] 写单元测试验证 SpatialGrid
4. [ ] 修改 `DocumentManager.ts`，替换 rbush
5. [ ] 运行测试，确保功能正常
6. [ ] 移除 rbush 依赖

---

## 八、参考资料

- [Figma 的空间索引讨论](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [rbush 源码](https://github.com/mourner/rbush) - 可以参考它的 API 设计
