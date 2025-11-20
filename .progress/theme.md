# 白板组件样式风格设计总结

## 核心架构决策

### 双系统渲染方案

项目采用两套独立的渲染系统：

1. **DOM 系统**：工具栏、面板、弹窗等 UI 组件
   - 技术栈：Radix + Vanilla Extract
   - 样式：CSS + CSS 变量

2. **Canvas/WebGL/WebGPU 系统**：画布及画布上的所有元素
   - 样式定义：纯 JS 对象
   - 渲染：Canvas 2D / WebGL / WebGPU

### 产品定位

**白板工具**（非设计工具）
- 元素具有预设风格
- 降低使用门槛
- 参考：Miro、FigJam

## Token 系统设计

### 设计原则

使用 **原始层 + 语义层** 双层结构：

```typescript
// tokens/colors.ts - 原始层
export const primitiveColors = {
  yellow: {
    50: { r: 254, g: 252, b: 232, a: 1 },
    100: { r: 254, g: 249, b: 195, a: 1 },
    200: { r: 254, g: 243, b: 199, a: 1 },
    // ...
  },
  blue: {
    // ...
  }
} as const

// tokens/semantic.ts - 语义层
export const semanticTokens = {
  light: {
    stickyNote: {
      bg: {
        default: primitiveColors.yellow[200],
        hover: primitiveColors.yellow[300],
        active: primitiveColors.yellow[400],
      },
      border: {
        default: primitiveColors.yellow[400],
        selected: primitiveColors.blue[500],
      }
    }
  },
  dark: {
    stickyNote: {
      bg: {
        default: primitiveColors.yellow[900],
        hover: primitiveColors.yellow[800],
        active: primitiveColors.yellow[700],
      },
      border: {
        default: primitiveColors.yellow[700],
        selected: primitiveColors.blue[400],
      }
    }
  }
} as const
```

### 颜色格式

**统一使用 RGBA 对象格式**：
```typescript
type RGBA = { r: number; g: number; b: number; a: number }
```

**原因**：
- Canvas 和 CSS 都需要不同格式
- 通过适配层转换，保持 token 定义的单一来源

### 适配层

```typescript
// tokens/utils.ts
export function rgbaToCss(color: RGBA): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

export function rgbaToHex(color: RGBA): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
}
```

### 运行时 Token 访问

```typescript
// tokens/index.ts
let currentTheme: 'light' | 'dark' = 'light'

export function getToken() {
  return semanticTokens[currentTheme]
}

export function setTheme(theme: 'light' | 'dark') {
  currentTheme = theme
  window.dispatchEvent(new CustomEvent('theme-change'))
}
```

## Vanilla Extract 集成

```typescript
// styles/sticky.css.ts
import { style } from '@vanilla-extract/css'
import { semanticTokens } from '../tokens/semantic'
import { rgbaToCss } from '../tokens/utils'

const lightTokens = semanticTokens.light

export const stickyButton = style({
  backgroundColor: rgbaToCss(lightTokens.stickyNote.bg.default),
  ':hover': {
    backgroundColor: rgbaToCss(lightTokens.stickyNote.bg.hover),
  },
  '@media': {
    '(prefers-color-scheme: dark)': {
      backgroundColor: rgbaToCss(semanticTokens.dark.stickyNote.bg.default),
    }
  }
})
```

## Canvas 元素数据结构

**关键原则**：元素不存储具体颜色值，只存储语义引用

```typescript
type CanvasElement = {
  id: string
  type: 'sticky' | 'rectangle' | 'text' | ...
  x: number
  y: number
  width: number
  height: number
  state: 'default' | 'hover' | 'active' | 'selected'
  // ❌ 错误：color: '#FEF3C7'
  // ✅ 正确：通过 type + state 在渲染时从 token 读取颜色
}
```

## Canvas 渲染实现

```typescript
function renderSticky(el: StickyElement) {
  const tokens = getToken() // 获取当前主题的 token
  const color = tokens.stickyNote.bg[el.state]

  ctx.fillStyle = rgbaToCss(color)
  ctx.fillRect(el.x, el.y, el.width, el.height)
}

// 主题切换 - 触发整个画布重绘
window.addEventListener('theme-change', () => {
  requestAnimationFrame(renderCanvas)
})
```

## 暗色模式处理

### DOM 部分
- Vanilla Extract 通过 `@media (prefers-color-scheme: dark)` 处理
- CSS 变量自动响应

### Canvas 部分
- 监听 `theme-change` 事件
- 触发全量重绘
- 元素在重绘时从 token 读取新颜色
- **不遍历元素去更新颜色**，避免性能问题

## 协作者颜色方案

基于 Figma/FigJam 的设计：

- 预定义 15-20 种协作者颜色
- 高饱和度、中等亮度
- 色相环均匀分布
- 用于：光标、选中框描边、头像背景

**选中状态显示**：
- 只显示一层选中框（当前操作者或最后选中者）
- 其他协作者用半透明填充 + 头像表示

**颜色系统约束**：
- 颜色需要在白/深背景上都清晰可见 → 限制亮度范围
- 需要互相区分 → 限制饱和度下限
- 需要和 UI 品牌色区分 → 协作者颜色更鲜艳

## 性能考虑

### 渲染策略

**推荐方案：全量重绘 + 优化**

1. **requestAnimationFrame 批量更新**
   - 多次 state 修改只触发一次渲染

2. **视口裁剪**
   - 只渲染可见区域内的元素

3. **分层 Canvas**（可选）
   - 静态层：不常变化的元素
   - 动态层：频繁变化的元素（光标、选中框）

### 性能基准

- 1000 个简单矩形：全量重绘 ~3-5ms ✅
- 5000 个简单矩形：全量重绘 ~15-25ms ✅
- 5000 个复杂元素（阴影+模糊）：~100-200ms ❌

**结论**：
- 元素简单 + 数量 < 5000：全量重绘足够
- 元素复杂或数量 > 5000：考虑 WebGL 或脏矩形算法

## 待决策项

1. **画布元素最大数量预期**
2. **元素复杂度**（阴影、模糊、渐变等）
3. **具体元素类型清单**（矩形、圆形、线条、文本、便签...）
4. **是否需要脏矩形优化**

## SDK 开发者 API 设计

允许开发者自定义样式（场景 B）：

```typescript
// 需要进一步设计的类型系统
sdk.createRectangle({
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  style: {
    fill: '#FF0000' // 自定义颜色 或 token 引用？
  }
})
```

**待解决**：
- `fill` 的类型应该是 `string | RGBA | keyof typeof tokens.color`？
- 如何平衡类型安全与灵活性？

## 参考资料

- Figma/FigJam：协作者颜色、选中状态设计
- tldraw：开源白板工具，Canvas 2D 实现
- Excalidraw：开源白板工具，手绘风格

---

**创建时间**：2025-11-20
**状态**：架构设计阶段
