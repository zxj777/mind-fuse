# Geometry Calculation Verification

## 验证日期
2025-12-25

## 核心几何函数逻辑验证

### 1. getShapeAABB (shapes.ts:190)

**RectShape with rotation:**
```typescript
if (shape.rotation !== 0) {
  const corners = getRotatedCorners(shape)
  return Box.fromPoints(corners)
}
```

**逻辑验证:**
- ✅ 正确: 通过计算旋转后的四个角点，然后求最小包围盒
- ✅ 这是计算旋转矩形 AABB 的标准方法

**RectShape without rotation:**
```typescript
return Box.create(shape.x, shape.y, shape.props.width, shape.props.height)
```

**逻辑验证:**
- ✅ 正确: 无旋转时，直接返回原始边界

**LineShape:**
```typescript
const x1 = shape.x
const y1 = shape.y
const x2 = shape.x + shape.props.endX
const y2 = shape.y + shape.props.endY
return Box.create(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
```

**逻辑验证:**
- ✅ 正确: 计算两个端点的最小包围盒

---

### 2. getRotatedCorners (shapes.ts:259)

**关键代码:**
```typescript
const cos = Math.cos(rotation)
const sin = Math.sin(rotation)
const cx = x + width / 2
const cy = y + height / 2

const relativeCorners = [
  { x: -width / 2, y: -height / 2 },
  { x: width / 2, y: -height / 2 },
  { x: width / 2, y: height / 2 },
  { x: -width / 2, y: height / 2 },
]

return relativeCorners.map((corner) =>
  Point.create(cx + corner.x * cos - corner.y * sin, cy + corner.x * sin + corner.y * cos)
)
```

**数学验证:**

2D 旋转矩阵:
```
[x']   [cos(θ)  -sin(θ)] [x]
[y'] = [sin(θ)   cos(θ)] [y]
```

代码实现:
```
x' = cx + (corner.x * cos - corner.y * sin)
y' = cy + (corner.x * sin + corner.y * cos)
```

- ✅ 旋转矩阵正确
- ✅ 中心点计算正确: `cx = x + width/2, cy = y + height/2`
- ✅ 相对坐标正确: 以中心为原点的四个角

**示例验证 (100×50 矩形, 位置 100,100, 旋转 45°):**
- 中心: (150, 125)
- 相对角点: (-50, -25), (50, -25), (50, 25), (-50, 25)
- 旋转 45° 后:
  - cos(45°) ≈ 0.707, sin(45°) ≈ 0.707
  - 左上角: (-50*0.707 - (-25)*0.707, -50*0.707 + (-25)*0.707) ≈ (-17.68, -53.03)
  - 世界坐标: (150 - 17.68, 125 - 53.03) ≈ (132.32, 71.97)

---

### 3. isPointInShape (shapes.ts:344)

**RectShape with rotation:**
```typescript
const cx = x + width / 2
const cy = y + height / 2

// Inverse rotation
const cos = Math.cos(-rotation)
const sin = Math.sin(-rotation)
const dx = point.x - cx
const dy = point.y - cy
const localX = dx * cos - dy * sin
const localY = dx * sin + dy * cos

// Check in local space
return localX >= -width / 2 && localX <= width / 2 && localY >= -height / 2 && localY <= height / 2
```

**逻辑验证:**
- ✅ 使用**逆变换**将点从世界坐标转换到形状的局部坐标系
- ✅ 逆旋转使用 `-rotation`，数学上正确
- ✅ 在局部坐标系中，检查点是否在 `[-width/2, width/2] × [-height/2, height/2]` 内
- ✅ 这是精确的点-旋转矩形碰撞检测算法

**数学原理:**
- 旋转矩阵的逆 = 转置 (对于正交矩阵)
- R(-θ) = R(θ)^T
- 通过反向旋转，将问题简化为点-轴对齐矩形检测

---

### 4. Box.fromPoints (geometry.ts:84)

```typescript
fromPoints(points: Point[]): Box {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
```

**逻辑验证:**
- ✅ 找到所有点的 x 和 y 的最小/最大值
- ✅ 构造 AABB: `[minX, maxX] × [minY, maxY]`
- ✅ 空数组处理正确

---

### 5. pointToLineSegmentDistance (shapes.ts:388)

```typescript
function pointToLineSegmentDistance(point: PointType, line: LineShape): number {
  const x1 = line.x
  const y1 = line.y
  const x2 = line.x + line.props.endX
  const y2 = line.y + line.props.endY

  const A = point.x - x1
  const B = point.y - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D

  if (lenSq === 0) {
    return Math.hypot(A, B)
  }

  const t = Math.max(0, Math.min(1, dot / lenSq))

  const nearestX = x1 + t * C
  const nearestY = y1 + t * D

  return Math.hypot(point.x - nearestX, point.y - nearestY)
}
```

**逻辑验证:**

**数学原理:**
- 线段参数方程: `P(t) = P1 + t * (P2 - P1)`, t ∈ [0, 1]
- 点到线段最近点: 投影点在线段上 (t 被 clamp 到 [0, 1])
- 投影参数: `t = dot(P - P1, P2 - P1) / ||P2 - P1||²`

**代码验证:**
- ✅ `C, D` = 线段方向向量 (P2 - P1)
- ✅ `A, B` = 点到起点的向量 (P - P1)
- ✅ `dot` = (P - P1) · (P2 - P1)
- ✅ `lenSq` = ||P2 - P1||²
- ✅ `t = clamp(dot / lenSq, 0, 1)` 确保投影点在线段内
- ✅ 处理退化情况 (零长度线段): `lenSq === 0`

---

### 6. computeAABB (groups.ts:109)

```typescript
export function computeAABB(shapes: Shape[]): BoxType {
  if (shapes.length === 0) {
    return Box.create(0, 0, 0, 0)
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    const aabb = getShapeAABB(shape)
    minX = Math.min(minX, aabb.x)
    minY = Math.min(minY, aabb.y)
    maxX = Math.max(maxX, aabb.x + aabb.width)
    maxY = Math.max(maxY, aabb.y + aabb.height)
  }

  return Box.create(minX, minY, maxX - minX, maxY - minY)
}
```

**逻辑验证:**
- ✅ 对每个形状获取 AABB (已经处理了旋转)
- ✅ 计算所有 AABB 的并集
- ✅ 空数组处理正确

---

## 关键设计决策验证

### ✅ Box 类型现在是纯 AABB
- **删除了 `rotation` 字段**
- 语义清晰: Box = 轴对齐边界框
- 与 `Box.intersects` 的实现一致

### ✅ 分离了两种检测策略
| 场景 | 使用的函数 | 类型 | 性能 |
|------|-----------|------|------|
| 单击检测 | `isPointInShape` | 精确 OBB | 低频，高精度 |
| 框选检测 | `getShapeAABB + Box.intersects` | AABB | 高频，快速 |
| 视口剔除 | `getShapeAABB + Box.intersects` | AABB | 高频，快速 |
| 渲染选择框 | `getRotatedCorners` | 精确 OBB | 低频，视觉准确 |

### ✅ Miro 策略对齐
- 单击: 精确检测 ✓
- 框选: AABB 检测 ✓
- 视口剔除: AABB 检测 ✓

---

## 潜在问题检查

### ⚠️ 浮点精度
- 旋转计算使用 `Math.cos/sin`，有浮点误差
- **影响**: 极小角度旋转可能导致微小偏差
- **解决**: 对于 0° 旋转有优化路径 (`rotation === 0`)

### ⚠️ 性能考虑
- `getShapeAABB` 对旋转矩形需要计算 4 个角点
- **影响**: 大量图形时可能成为瓶颈
- **解决**: 可以在 Shape 上缓存 AABB

### ✅ 边界情况处理
- 零长度线段: ✓ 处理了
- 空形状数组: ✓ 返回零大小 Box
- 空点数组: ✓ 返回零大小 Box

---

## 结论

✅ **所有几何计算逻辑均已验证正确**

核心函数实现符合：
- 标准 2D 几何算法
- 正确的数学公式
- 适当的边界情况处理
- 与产品策略一致 (Miro 的 AABB 框选 + 精确单击)

**推荐后续优化:**
1. 为频繁访问的 AABB 添加缓存
2. 考虑使用空间索引 (R-tree) 加速大规模场景
3. 添加单元测试覆盖所有几何函数
