# Binding 验证指南

## 概述

虽然 TypeScript 提供了编译时类型安全，但某些约束只能在运行时验证：

- **ConnectorBinding.fromId** 必须是 `LineShape`
- **ConnectorBinding.toId** 不能是 `LineShape`（线不能绑到线）
- **CommentBinding.toId** 不能是 `GroupShape`（评论不能附着到组）

本指南展示如何使用 `binding-validator` 模块确保数据完整性。

---

## 基础用法

### 1. 创建 ConnectorBinding 时验证

```typescript
import {
  connectorBinding,
  validateConnectorBinding,
  isConnectorShape,
  isBindableTarget,
  type Shape,
  type ShapeId,
} from '@mind-fuse/types'

function createSafeConnectorBinding(
  fromId: ShapeId,
  terminal: 'start' | 'end',
  toId: ShapeId,
  shapes: Map<ShapeId, Shape>
) {
  // 创建 binding
  const binding = connectorBinding.create(fromId, terminal, toId)

  // 验证
  try {
    validateConnectorBinding(binding, shapes)
    return binding
  } catch (error) {
    if (error instanceof BindingValidationError) {
      console.error('Invalid binding:', error.message)
      throw error
    }
    throw error
  }
}
```

### 2. 使用类型守卫提前检查

```typescript
import { isConnectorShape, isBindableTarget } from '@mind-fuse/types'

function canCreateBinding(fromShape: Shape, toShape: Shape): { ok: boolean; reason?: string } {
  // 检查 from 是否是连接线
  if (!isConnectorShape(fromShape)) {
    return { ok: false, reason: `${fromShape.type} cannot be used as connector` }
  }

  // 检查 to 是否可以作为目标
  if (!isBindableTarget(toShape)) {
    return { ok: false, reason: 'Lines cannot be binding targets' }
  }

  return { ok: true }
}

// 使用
const fromShape = shapes.get(fromId)
const toShape = shapes.get(toId)

if (fromShape && toShape) {
  const result = canCreateBinding(fromShape, toShape)
  if (result.ok) {
    // 安全地创建 binding
    const binding = connectorBinding.create(fromShape.id, 'end', toShape.id)
  } else {
    console.error(result.reason)
  }
}
```

### 3. 删除 Shape 前检查影响

```typescript
import { getAffectedBindings } from '@mind-fuse/types'

function deleteShapeWithCleanup(shapeId: ShapeId, document: Document): { deletedBindings: number } {
  // 查找受影响的 bindings
  const affected = getAffectedBindings(shapeId, document.bindings)

  // 删除 shape
  document.shapes.delete(shapeId)

  // 清理 bindings
  for (const binding of affected) {
    document.bindings.delete(binding.id)
  }

  return { deletedBindings: affected.length }
}

// 或者，提前警告用户
function checkDeleteImpact(shapeId: ShapeId, document: Document) {
  const affected = getAffectedBindings(shapeId, document.bindings)

  if (affected.length > 0) {
    const connectorCount = affected.filter((b) => b.type === 'connector').length
    const commentCount = affected.filter((b) => b.type === 'comment').length

    return {
      canDelete: true,
      warning: `This will disconnect ${connectorCount} connectors and ${commentCount} comments`,
    }
  }

  return { canDelete: true }
}
```

---

## 错误处理

### 错误类型层级

```
BindingValidationError (base)
  ├── ShapeNotFoundError
  ├── InvalidConnectorShapeError
  └── InvalidBindingTargetError
```

### 捕获特定错误

```typescript
import {
  validateConnectorBinding,
  ShapeNotFoundError,
  InvalidConnectorShapeError,
  InvalidBindingTargetError,
} from '@mind-fuse/types'

try {
  validateConnectorBinding(binding, shapes)
} catch (error) {
  if (error instanceof ShapeNotFoundError) {
    // 处理 shape 不存在的情况
    console.error('Referenced shape was deleted')
  } else if (error instanceof InvalidConnectorShapeError) {
    // 处理 fromId 类型错误
    console.error('Only lines can be connectors')
  } else if (error instanceof InvalidBindingTargetError) {
    // 处理 toId 类型错误
    console.error('Invalid binding target')
  } else {
    throw error
  }
}
```

---

## 协同编辑场景

### 场景 1：收到远程操作

```typescript
function handleRemoteBindingCreate(binding: ConnectorBinding, document: Document) {
  try {
    // 验证 binding 在当前文档状态下是否有效
    validateConnectorBinding(binding, document.shapes)

    // 有效，应用到本地
    document.bindings.set(binding.id, binding)
  } catch (error) {
    if (error instanceof ShapeNotFoundError) {
      // Shape 在本地还不存在，可能网络延迟
      // 方案 1：暂存 binding，等 shape 到达
      pendingBindings.push(binding)

      // 方案 2：请求同步缺失的 shape
      requestShape(binding.toId)
    } else {
      // 其他错误，记录但不应用
      console.error('Invalid remote binding:', error)
    }
  }
}
```

### 场景 2：清理孤立的 Bindings

```typescript
function cleanupOrphanedBindings(document: Document): number {
  let cleanedCount = 0

  for (const [id, binding] of document.bindings.entries()) {
    try {
      if (binding.type === 'connector') {
        validateConnectorBinding(binding, document.shapes)
      } else if (binding.type === 'comment') {
        validateCommentBinding(binding, document.comments, document.shapes)
      }
    } catch (error) {
      if (error instanceof BindingValidationError) {
        // Binding 引用了不存在的实体，删除
        document.bindings.delete(id)
        cleanedCount++
      }
    }
  }

  return cleanedCount
}

// 定期执行清理
setInterval(() => {
  const cleaned = cleanupOrphanedBindings(document)
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} orphaned bindings`)
  }
}, 60000) // 每分钟
```

---

## 最佳实践

### 1. 在 Store 层集成验证

```typescript
class DocumentStore {
  addBinding(binding: ConnectorBinding | CommentBinding) {
    // 创建前验证
    if (binding.type === 'connector') {
      validateConnectorBinding(binding, this.shapes)
    } else {
      validateCommentBinding(binding, this.comments, this.shapes)
    }

    // 验证通过，添加
    this.bindings.set(binding.id, binding)
    this.notifySubscribers('binding-added', binding)
  }

  deleteShape(shapeId: ShapeId) {
    // 级联删除相关 bindings
    const affected = getAffectedBindings(shapeId, this.bindings)

    this.shapes.delete(shapeId)

    for (const binding of affected) {
      this.bindings.delete(binding.id)
    }

    this.notifySubscribers('shape-deleted', { shapeId, affectedBindings: affected })
  }
}
```

### 2. UI 层的主动验证

```typescript
// 在 UI 中，用户拖拽连接线到目标时
function onConnectorDragOver(targetShapeId: ShapeId) {
  const targetShape = shapes.get(targetShapeId)

  if (!targetShape || !isBindableTarget(targetShape)) {
    // 显示"禁止"光标
    cursor.style = 'not-allowed'
    showTooltip('Lines cannot connect to other lines')
    return
  }

  // 显示可绑定状态
  highlightShape(targetShapeId)
  cursor.style = 'crosshair'
}
```

### 3. 单元测试

```typescript
import { describe, it, expect } from 'vitest'
import {
  validateConnectorBinding,
  InvalidConnectorShapeError,
  InvalidBindingTargetError,
} from '@mind-fuse/types'

describe('ConnectorBinding validation', () => {
  it('should reject binding from non-line shape', () => {
    const rectShape: RectShape = { type: 'rect', ... }
    const targetShape: RectShape = { type: 'rect', ... }

    const shapes = new Map([
      [rectShape.id, rectShape],
      [targetShape.id, targetShape],
    ])

    const binding = connectorBinding.create(rectShape.id, 'end', targetShape.id)

    expect(() => {
      validateConnectorBinding(binding, shapes)
    }).toThrow(InvalidConnectorShapeError)
  })

  it('should reject binding to line shape', () => {
    const lineShape: LineShape = { type: 'line', ... }
    const targetLine: LineShape = { type: 'line', ... }

    const shapes = new Map([
      [lineShape.id, lineShape],
      [targetLine.id, targetLine],
    ])

    const binding = connectorBinding.create(lineShape.id, 'end', targetLine.id)

    expect(() => {
      validateConnectorBinding(binding, shapes)
    }).toThrow(InvalidBindingTargetError)
  })

  it('should accept valid binding', () => {
    const lineShape: LineShape = { type: 'line', ... }
    const rectShape: RectShape = { type: 'rect', ... }

    const shapes = new Map([
      [lineShape.id, lineShape],
      [rectShape.id, rectShape],
    ])

    const binding = connectorBinding.create(lineShape.id, 'end', rectShape.id)

    expect(() => {
      validateConnectorBinding(binding, shapes)
    }).not.toThrow()
  })
})
```

---

## 性能考虑

### 验证成本

- `validateConnectorBinding`: O(1) - 两次 Map 查找
- `validateCommentBinding`: O(1) - 两次 Map 查找
- `getAffectedBindings`: O(n) - 遍历所有 bindings

### 优化建议

```typescript
// 1. 批量操作时，缓存 shapes Map
function createMultipleBindings(
  bindingSpecs: Array<{ fromId: ShapeId; toId: ShapeId }>,
  shapes: Map<ShapeId, Shape>
) {
  const bindings: ConnectorBinding[] = []

  for (const spec of bindingSpecs) {
    const binding = connectorBinding.create(spec.fromId, 'end', spec.toId)

    try {
      validateConnectorBinding(binding, shapes) // 复用同一个 shapes Map
      bindings.push(binding)
    } catch (error) {
      console.error(`Skipping invalid binding:`, error)
    }
  }

  return bindings
}

// 2. 建立反向索引加速查询（Store 层实现）
class BindingIndex {
  private byFromId = new Map<ShapeId, Set<BindingId>>()
  private byToId = new Map<ShapeId, Set<BindingId>>()

  getAffectedBindings(shapeId: ShapeId): BindingId[] {
    const from = this.byFromId.get(shapeId) || new Set()
    const to = this.byToId.get(shapeId) || new Set()
    return [...from, ...to]
  }
}
```

---

## 总结

- ✅ **使用类型守卫**（`isConnectorShape`, `isBindableTarget`）在创建前检查
- ✅ **使用验证函数**（`validateConnectorBinding`）在关键路径验证
- ✅ **处理验证错误**，提供清晰的用户反馈
- ✅ **删除 Shape 前清理** Bindings，避免孤立引用
- ✅ **在 Store 层集成**，而不是散落在各处

这样可以确保数据完整性，同时保持类型系统的简洁性。
