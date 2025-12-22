# @mind-fuse/types 使用示例

## 完整的工作流示例

### 场景：创建一个矩形和一条连接线

```typescript
import {
  createShapeId,
  createBindingId,
  type RectShape,
  type LineShape,
  type ConnectorBinding,
  connectorBinding,
  validateConnectorBinding,
  isConnectorShape,
  isBindableTarget,
} from '@mind-fuse/types'

// 1. 创建一个矩形
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

// 2. 创建一条线（带箭头装饰）
const line: LineShape = {
  id: createShapeId(),
  type: 'line',
  x: 50,
  y: 150, // 起点
  rotation: 0, // 对于 line 始终为 0
  parentId: null,
  index: 'a1',
  isLocked: false,
  props: {
    endX: 120,
    endY: 0, // 终点相对于起点
    stroke: '#000000',
    strokeWidth: 2,
    startArrow: 'none',
    endArrow: 'arrow', // 终点有箭头
    pathType: 'straight',
  },
}

// 3. 创建绑定（将线的终点绑定到矩形）
const shapes = new Map([
  [rect.id, rect],
  [line.id, line],
])

// 方式 A：直接创建 + 验证
const binding = connectorBinding.create(
  line.id,
  'end', // 绑定终点
  rect.id,
  { x: 0, y: 0.5 } // 矩形左边缘中点
)

try {
  validateConnectorBinding(binding, shapes)
  console.log('Binding 有效！')
} catch (error) {
  console.error('Binding 无效:', error)
}

// 方式 B：使用类型守卫提前检查
const fromShape = shapes.get(line.id)
const toShape = shapes.get(rect.id)

if (fromShape && toShape) {
  if (!isConnectorShape(fromShape)) {
    console.error('起点必须是线条')
  } else if (!isBindableTarget(toShape)) {
    console.error('终点不能是线条')
  } else {
    // TypeScript 已经知道 fromShape 是 LineShape
    const safeBinding = connectorBinding.create(fromShape.id, 'end', toShape.id)
    console.log('安全创建:', safeBinding)
  }
}
```

---

### 场景：添加评论

```typescript
import {
  comment,
  commentBinding,
  validateCommentBinding,
  type Comment,
  type CommentBinding,
} from '@mind-fuse/types'

// 1. 在画布上创建独立评论
const floatingComment = comment.create(
  300, // 世界坐标 x
  200, // 世界坐标 y
  'This needs to be larger',
  userId
)

// 2. 创建附着到 shape 的评论
const attachedComment = comment.create(
  0.5, // 归一化坐标（将被绑定到 shape）
  0.8, // 归一化坐标
  'Fix the color',
  userId
)

// 3. 创建 CommentBinding
const commentBindingInstance = commentBinding.create(attachedComment.id, rect.id)

// 4. 验证
const comments = new Map([[attachedComment.id, attachedComment]])

try {
  validateCommentBinding(commentBindingInstance, comments, shapes)
  console.log('Comment binding 有效！')
} catch (error) {
  console.error('Comment binding 无效:', error)
}

// 5. 添加回复
comment.addReply(attachedComment, 'I agree!', anotherUserId)
comment.addReply(attachedComment, 'Done', userId)

// 6. 标记为已解决
comment.resolve(attachedComment)

console.log(`评论有 ${attachedComment.replies.length} 条回复`)
```

---

### 场景：LineShape 的不同样式

```typescript
// 基础直线
const straightLine: LineShape = {
  id: createShapeId(),
  type: 'line',
  x: 100,
  y: 100,
  rotation: 0,
  parentId: null,
  index: 'a0',
  isLocked: false,
  props: {
    endX: 200,
    endY: 50,
    stroke: '#000',
    strokeWidth: 2,
    // 不设置箭头和路径类型，使用默认值
  },
}

// 双向箭头
const doubleArrowLine: LineShape = {
  ...straightLine,
  id: createShapeId(),
  props: {
    ...straightLine.props,
    startArrow: 'arrow',
    endArrow: 'arrow',
  },
}

// 肘形连接线（未来实现）
const elbowLine: LineShape = {
  ...straightLine,
  id: createShapeId(),
  props: {
    ...straightLine.props,
    pathType: 'elbow',
    endArrow: 'filled-arrow',
  },
}

// 曲线（未来实现）
const curvedLine: LineShape = {
  ...straightLine,
  id: createShapeId(),
  props: {
    ...straightLine.props,
    pathType: 'curved',
    startArrow: 'circle',
    endArrow: 'diamond',
  },
}
```

---

### 场景：处理 Shape 删除

```typescript
import { getAffectedBindings } from '@mind-fuse/types'

function deleteShapeWithWarning(
  shapeId: ShapeId,
  document: {
    shapes: Map<ShapeId, Shape>
    bindings: Map<string, ConnectorBinding | CommentBinding>
    comments: Map<string, Comment>
  }
) {
  // 1. 检查影响
  const affectedBindings = getAffectedBindings(shapeId, document.bindings)

  if (affectedBindings.length > 0) {
    const connectors = affectedBindings.filter((b) => b.type === 'connector')
    const comments = affectedBindings.filter((b) => b.type === 'comment')

    console.warn(`删除此 Shape 将影响 ${connectors.length} 条连接线和 ${comments.length} 条评论`)

    // 可以在这里显示确认对话框
    // const confirmed = await showDeleteConfirmation(...)
    // if (!confirmed) return
  }

  // 2. 删除 shape
  document.shapes.delete(shapeId)

  // 3. 清理 bindings
  for (const binding of affectedBindings) {
    document.bindings.delete(binding.id)

    // 如果是 CommentBinding，可以选择保留评论但转为独立状态
    if (binding.type === 'comment') {
      const commentInstance = document.comments.get(binding.fromId)
      if (commentInstance) {
        // 评论的坐标可能需要从归一化转为世界坐标
        console.log(`Comment ${commentInstance.id} is now floating`)
      }
    }
  }

  console.log(`已删除 ${shapeId} 和 ${affectedBindings.length} 个相关 binding`)
}
```

---

### 场景：批量创建和验证

```typescript
function createConnectedShapes() {
  const shapes = new Map<ShapeId, Shape>()
  const bindings = new Map<string, ConnectorBinding>()

  // 创建 3 个矩形
  const rect1 = createRect(100, 100, 'Rect 1')
  const rect2 = createRect(400, 100, 'Rect 2')
  const rect3 = createRect(250, 300, 'Rect 3')

  shapes.set(rect1.id, rect1)
  shapes.set(rect2.id, rect2)
  shapes.set(rect3.id, rect3)

  // 创建连接线
  const connections = [
    { from: rect1, to: rect2, fromAnchor: { x: 1, y: 0.5 }, toAnchor: { x: 0, y: 0.5 } },
    { from: rect1, to: rect3, fromAnchor: { x: 0.5, y: 1 }, toAnchor: { x: 0.5, y: 0 } },
    { from: rect2, to: rect3, fromAnchor: { x: 0.5, y: 1 }, toAnchor: { x: 0.5, y: 0 } },
  ]

  for (const conn of connections) {
    // 创建线条
    const line = createLineBetween(conn.from, conn.to)
    shapes.set(line.id, line)

    // 创建两个 binding（起点和终点）
    const startBinding = connectorBinding.create(line.id, 'start', conn.from.id, conn.fromAnchor)
    const endBinding = connectorBinding.create(line.id, 'end', conn.to.id, conn.toAnchor)

    // 验证
    try {
      validateConnectorBinding(startBinding, shapes)
      validateConnectorBinding(endBinding, shapes)

      bindings.set(startBinding.id, startBinding)
      bindings.set(endBinding.id, endBinding)
    } catch (error) {
      console.error('跳过无效的连接:', error)
    }
  }

  return { shapes, bindings }
}

// 辅助函数
function createRect(x: number, y: number, label: string): RectShape {
  return {
    id: createShapeId(),
    type: 'rect',
    x,
    y,
    rotation: 0,
    parentId: null,
    index: `a${Math.random().toString(36).substr(2, 9)}`,
    isLocked: false,
    props: {
      width: 120,
      height: 80,
      fill: '#f5f5f5',
      stroke: '#333',
      strokeWidth: 2,
    },
  }
}

function createLineBetween(from: RectShape, to: RectShape): LineShape {
  return {
    id: createShapeId(),
    type: 'line',
    x: from.x + from.props.width / 2,
    y: from.y + from.props.height / 2,
    rotation: 0,
    parentId: null,
    index: `a${Math.random().toString(36).substr(2, 9)}`,
    isLocked: false,
    props: {
      endX: to.x - from.x,
      endY: to.y - from.y,
      stroke: '#666',
      strokeWidth: 2,
      endArrow: 'arrow',
    },
  }
}
```

---

### 场景：协同编辑 - 处理冲突

```typescript
interface RemoteOperation {
  type: 'create-binding' | 'delete-shape'
  payload: any
  timestamp: number
  userId: string
}

function handleRemoteOperation(
  op: RemoteOperation,
  document: {
    shapes: Map<ShapeId, Shape>
    bindings: Map<string, ConnectorBinding>
  }
) {
  switch (op.type) {
    case 'create-binding': {
      const binding = op.payload as ConnectorBinding

      try {
        // 验证在当前文档状态下是否有效
        validateConnectorBinding(binding, document.shapes)

        // 有效，应用
        document.bindings.set(binding.id, binding)
        console.log(`应用远程 binding: ${binding.id}`)
      } catch (error) {
        if (error instanceof ShapeNotFoundError) {
          // Shape 可能还在传输中，暂存
          console.warn(`延迟应用 binding ${binding.id}，等待 shape`)
          // pendingOperations.push(op)
        } else {
          // 其他错误，忽略
          console.error(`拒绝无效的远程 binding:`, error)
        }
      }
      break
    }

    case 'delete-shape': {
      const shapeId = op.payload as ShapeId

      // 级联删除 bindings
      const affected = getAffectedBindings(shapeId, document.bindings)
      document.shapes.delete(shapeId)

      for (const binding of affected) {
        document.bindings.delete(binding.id)
      }

      console.log(`远程删除 shape ${shapeId}，清理了 ${affected.length} 个 binding`)
      break
    }
  }
}
```

---

## 类型守卫的实用技巧

```typescript
import { isLineShape, isRectShape, isGroupShape, type Shape } from '@mind-fuse/types'

function renderShape(shape: Shape, ctx: CanvasRenderingContext2D) {
  // TypeScript 的类型收窄
  if (isRectShape(shape)) {
    // shape 的类型被收窄为 RectShape
    ctx.fillRect(shape.x, shape.y, shape.props.width, shape.props.height)
  } else if (isLineShape(shape)) {
    // shape 的类型被收窄为 LineShape
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + shape.props.endX, shape.y + shape.props.endY)
    ctx.stroke()

    // 渲染箭头装饰
    if (shape.props.endArrow && shape.props.endArrow !== 'none') {
      renderArrow(ctx, shape.props.endArrow, ...)
    }
  } else if (isGroupShape(shape)) {
    // 组本身不渲染，渲染其子元素
    const children = findChildShapes(shape.id, allShapes)
    children.forEach((child) => renderShape(child, ctx))
  }
}
```

---

## 总结

这些示例展示了：

1. ✅ **创建和验证** shapes 和 bindings
2. ✅ **使用类型守卫** 进行类型安全的操作
3. ✅ **处理删除** 和级联清理
4. ✅ **批量操作** 和错误处理
5. ✅ **协同编辑** 场景下的冲突处理

完整的类型定义确保了编译时和运行时的双重安全！
