# React 项目开发最佳实践规范

> 适用于资深小团队的协作式复杂应用开发
>
> 目标：统一认知、减少争议、提升代码可维护性

---

## 目录

1. [项目结构与模块边界](#1-项目结构与模块边界)
2. [组件设计模式](#2-组件设计模式)
3. [状态管理策略](#3-状态管理策略)
4. [数据获取与服务端状态（SWR）](#4-数据获取与服务端状态swr)
5. [函数拆分与组织](#5-函数拆分与组织)
6. [Hooks 设计原则](#6-hooks-设计原则)
7. [类型系统规范](#7-类型系统规范)
8. [性能优化策略](#8-性能优化策略)
9. [测试策略](#9-测试策略)
10. [代码风格约定](#10-代码风格约定)
11. [协作白板专项规范](#11-协作白板专项规范)

---

## 1. 项目结构与模块边界

### 1.1 推荐目录结构

```
src/
├── app/                    # 路由/页面（Next.js App Router）
│   ├── (auth)/            # 路由组
│   ├── dashboard/
│   └── layout.tsx
│
├── components/            # UI 组件
│   ├── ui/               # 原子组件（Button, Input, Modal...）
│   ├── layout/           # 布局组件（Header, Sidebar, Container）
│   └── [domain]/         # 业务组件，按领域划分
│       ├── canvas/       # 画布相关
│       ├── toolbar/      # 工具栏相关
│       └── properties/   # 属性面板相关
│
├── features/             # 功能模块（包含状态+逻辑+组件的完整切片）
│   ├── shapes/
│   │   ├── components/   # 该功能的专属组件
│   │   ├── hooks/        # 该功能的专属 hooks
│   │   ├── store/        # 该功能的状态
│   │   ├── types/        # 该功能的类型
│   │   ├── utils/        # 该功能的工具函数
│   │   └── index.ts      # 公开 API
│   ├── groups/
│   └── bindings/
│
├── hooks/                # 全局通用 hooks
├── stores/               # 全局状态（如果使用 zustand/jotai）
├── services/             # API 层 / 数据服务
├── lib/                  # 第三方库封装、工具函数
├── types/                # 全局类型定义
└── constants/            # 常量
```

### 1.2 模块边界原则

| 原则                  | 说明                                               | 示例                                            |
| --------------------- | -------------------------------------------------- | ----------------------------------------------- |
| **特性内聚**          | 相关代码放在一起，而非按类型分散                   | `features/shapes/` 包含该功能所有代码           |
| **公开 API**          | 每个 feature 通过 `index.ts` 暴露接口              | `import { useShapes } from '@/features/shapes'` |
| **禁止交叉导入**      | features 之间不直接导入，通过全局 store 或事件通信 | ❌ `shapes/` 直接 import `groups/` 的内部实现   |
| **UI 组件无业务逻辑** | `components/ui/` 纯 UI，不依赖业务 store           | Button 不知道什么是 Shape                       |

---

## 2. 组件设计模式

### 2.1 组件分类

```
┌─────────────────────────────────────────────────────────────┐
│                        页面组件 (Pages)                      │
│  - 路由入口，组装 features                                    │
│  - 负责数据获取、权限检查                                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      容器组件 (Containers)                   │
│  - 连接 store，处理业务逻辑                                   │
│  - 可以有副作用（数据获取、订阅）                              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      展示组件 (Presentational)               │
│  - 纯 UI 渲染，props in, JSX out                            │
│  - 无副作用，易测试                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 组件拆分原则

**何时拆分组件？**

| 信号                                    | 行动                 |
| --------------------------------------- | -------------------- |
| 组件超过 **200 行**                     | 必须拆分             |
| 有独立的 **交互状态**（如 hover、展开） | 提取为独立组件       |
| 可以被 **复用**                         | 提取到 `components/` |
| 有独立的 **职责边界**                   | 提取为子组件         |
| 需要独立 **测试**                       | 提取出来             |

**拆分方法：**

```tsx
// ❌ 不好：一个巨大的组件
function ShapeEditor() {
  // 300 行的 state 管理...
  // 200 行的事件处理...
  // 500 行的渲染逻辑...
}

// ✅ 好：职责分离
function ShapeEditor() {
  return (
    <ShapeEditorProvider>
      <ShapeToolbar />
      <ShapeCanvas />
      <ShapePropertiesPanel />
    </ShapeEditorProvider>
  )
}

// 每个子组件：单一职责、可独立测试
function ShapeToolbar() {
  /* 工具栏逻辑 */
}
function ShapeCanvas() {
  /* 画布渲染 */
}
function ShapePropertiesPanel() {
  /* 属性编辑 */
}
```

### 2.3 Props 设计规范

```tsx
// ✅ 好的 Props 设计
interface ButtonProps {
  // 必需 props 在前
  children: React.ReactNode
  onClick: () => void

  // 可选 props 在后，带默认值说明
  variant?: 'primary' | 'secondary' | 'ghost' // 默认 'primary'
  size?: 'sm' | 'md' | 'lg' // 默认 'md'
  disabled?: boolean // 默认 false
  loading?: boolean // 默认 false

  // 扩展 props 用 Omit 继承
  className?: string
}

// ❌ 避免的模式
interface BadProps {
  data: any // 不明确的类型
  callback: Function // 应该用具体签名
  config: object // 太宽泛
  style: React.CSSProperties // 应该用 className + Tailwind
}
```

### 2.4 组合模式 vs 配置模式

```tsx
// ✅ 组合模式（推荐：灵活、可扩展）
<Dialog>
  <Dialog.Trigger>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>Title</Dialog.Header>
    <Dialog.Body>Content</Dialog.Body>
    <Dialog.Footer>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>

// ⚠️ 配置模式（简单场景可用，但不灵活）
<Dialog
  title="Title"
  content="Content"
  onCancel={onClose}
  onConfirm={onConfirm}
/>
```

---

## 3. 状态管理策略

### 3.1 状态分类决策树

```
这个状态被几个组件使用？
│
├─ 只有 1 个组件 → useState（组件内部状态）
│
├─ 父子组件共享 → props drilling 或 Context
│
├─ 兄弟/远亲组件共享 → 全局状态管理
│   │
│   └─ 是服务端数据吗？
│       ├─ 是 → React Query / SWR（服务端状态）
│       └─ 否 → Zustand / Jotai / Redux（客户端状态）
│
└─ URL 相关状态 → URL params / searchParams
```

### 3.2 服务端数据管理（你的痛点）

**核心原则：服务端数据不拆成多个 state，用 SWR 管理**

```tsx
// ❌ 错误：手动拆分接口数据
function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchUser(id)
      .then((data) => {
        setUser(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [id])

  // 痛点：
  // 1. loading/error 状态手动管理
  // 2. 缓存失效需要手动处理
  // 3. 竞态条件（快速切换 id 导致数据错乱）
  // 4. 重复请求（多个组件都需要这个数据）
  // 5. 后台刷新不存在
}

// ✅ 正确：使用 SWR
function UserProfile() {
  const { data: user, isLoading, error, mutate } = useSWR(`/api/users/${id}`, () => fetchUser(id))

  // 自动处理：loading、error、缓存、重试、竞态、后台刷新、请求去重...
}
```

**接口数据是否需要拆分？**

| 场景                 | 决策                     | 原因                         |
| -------------------- | ------------------------ | ---------------------------- |
| 详情接口返回完整对象 | **不拆分**，整体存储     | 保持数据一致性，避免部分更新 |
| 需要修改某个字段     | 用 `mutate` **乐观更新** | 不是手动 setState            |
| 列表 + 详情          | 分两个 SWR，key 设计好   | SWR 自动去重和缓存           |
| 需要派生数据         | 用 `useMemo`             | 不要另存一份 state           |

**SWR 详细使用模式：**

```tsx
// ============ 1. 基础数据获取 ============
// 详情接口 → 整体管理
const {
  data: document,
  error,
  isLoading,
} = useSWR(
  docId ? `/api/documents/${docId}` : null, // key 为 null 时不发请求
  () => getDocument(docId)
)

// ============ 2. 派生数据 ============
// 需要派生数据？用 useMemo，不要另存 state
const shapeCount = useMemo(() => document?.shapes.length ?? 0, [document])

// 需要过滤/排序？同样用 useMemo
const visibleShapes = useMemo(
  () => document?.shapes.filter((s) => s.visible).sort((a, b) => a.zIndex - b.zIndex),
  [document]
)

// ============ 3. 乐观更新（核心模式） ============
function useUpdateDocument() {
  const { mutate } = useSWRConfig()

  const updateDocument = async (docId: string, updates: Partial<Document>) => {
    const key = `/api/documents/${docId}`

    // 乐观更新：立即更新本地缓存
    await mutate(
      key,
      async (currentData: Document | undefined) => {
        // 1. 先乐观更新 UI
        const optimisticData = { ...currentData, ...updates }

        // 2. 发送请求到服务器
        try {
          const serverData = await api.updateDocument(docId, updates)
          return serverData // 用服务器返回的数据替换
        } catch (error) {
          // 3. 失败时自动回滚到 currentData（SWR 内置）
          throw error
        }
      },
      {
        optimisticData: (current) => ({ ...current, ...updates }), // 乐观值
        rollbackOnError: true, // 出错时回滚
        revalidate: false, // 成功后不重新请求（因为已经用服务器数据了）
      }
    )
  }

  return { updateDocument }
}

// 组件中使用
function ShapeEditor({ docId, shapeId }) {
  const { data: document } = useSWR(`/api/documents/${docId}`, fetcher)
  const { updateDocument } = useUpdateDocument()

  const handleColorChange = (color: string) => {
    // 立即更新 UI，后台发请求
    updateDocument(docId, {
      shapes: document.shapes.map((s) => (s.id === shapeId ? { ...s, fill: color } : s)),
    })
  }
}

// ============ 4. 条件请求 ============
// 依赖其他数据的请求
const { data: user } = useSWR('/api/me', fetcher)
const { data: documents } = useSWR(
  user ? `/api/users/${user.id}/documents` : null, // user 存在时才请求
  fetcher
)

// ============ 5. 轮询（保持数据新鲜） ============
const { data } = useSWR('/api/realtime-data', fetcher, {
  refreshInterval: 3000, // 每 3 秒刷新
  refreshWhenHidden: false, // 页面隐藏时不刷新
  refreshWhenOffline: false, // 离线时不刷新
})

// ============ 6. 预请求（Prefetch） ============
function DocumentList({ documents }) {
  const { mutate } = useSWRConfig()

  const handleMouseEnter = (docId: string) => {
    // hover 时预请求，数据会缓存起来
    mutate(`/api/documents/${docId}`, getDocument(docId), { revalidate: false })
  }

  return documents.map((doc) => (
    <Link key={doc.id} href={`/doc/${doc.id}`} onMouseEnter={() => handleMouseEnter(doc.id)}>
      {doc.title}
    </Link>
  ))
}

// ============ 7. 全局配置 ============
// app/providers.tsx
import { SWRConfig } from 'swr'

export function Providers({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => fetch(url).then((r) => r.json()),
        revalidateOnFocus: true, // 窗口聚焦时重新验证
        revalidateOnReconnect: true, // 网络恢复时重新验证
        dedupingInterval: 2000, // 2 秒内相同请求去重
        errorRetryCount: 3, // 错误重试 3 次
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

### 3.3 客户端状态管理

**推荐：Zustand（简单直接）**

```tsx
// stores/canvas-store.ts
interface CanvasState {
  // 状态
  selectedIds: Set<string>
  viewport: { x: number; y: number; zoom: number }
  tool: 'select' | 'draw' | 'pan'

  // 动作
  select: (ids: string[]) => void
  pan: (delta: { x: number; y: number }) => void
  zoom: (factor: number) => void
  setTool: (tool: CanvasState['tool']) => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  selectedIds: new Set(),
  viewport: { x: 0, y: 0, zoom: 1 },
  tool: 'select',

  select: (ids) => set({ selectedIds: new Set(ids) }),

  pan: (delta) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + delta.x,
        y: state.viewport.y + delta.y,
      },
    })),

  zoom: (factor) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(0.1, Math.min(10, state.viewport.zoom * factor)),
      },
    })),

  setTool: (tool) => set({ tool }),
}))
```

### 3.4 状态 vs 派生数据

```tsx
// ❌ 错误：存储可以计算出来的值
const [shapes, setShapes] = useState([])
const [selectedShapes, setSelectedShapes] = useState([]) // 冗余！
const [shapeCount, setShapeCount] = useState(0) // 冗余！

// ✅ 正确：只存储源数据，其他派生
const [shapes, setShapes] = useState([])
const [selectedIds, setSelectedIds] = useState(new Set())

// 派生数据
const selectedShapes = useMemo(
  () => shapes.filter((s) => selectedIds.has(s.id)),
  [shapes, selectedIds]
)
const shapeCount = shapes.length // 不需要 useMemo
```

---

## 4. 数据获取与服务端状态（SWR）

### 4.1 SWR Key 规范

```tsx
// services/swr/keys.ts

// Key 规范：使用字符串或数组，保持一致的命名模式
export const swrKeys = {
  // 文档相关
  documents: {
    all: '/api/documents',
    list: (filters?: Filters) => (filters ? ['/api/documents', filters] : '/api/documents'),
    detail: (id: string) => `/api/documents/${id}`,
    shapes: (docId: string) => `/api/documents/${docId}/shapes`,
  },

  // 用户相关
  users: {
    me: '/api/users/me',
    detail: (id: string) => `/api/users/${id}`,
  },
}

// 使用示例
const { data } = useSWR(swrKeys.documents.detail(docId), fetcher)
```

### 4.2 SWR Hook 封装规范

```tsx
// services/swr/use-document.ts
import useSWR from 'swr'
import { swrKeys } from './keys'
import { api } from '../api'

// ============ 封装查询 Hook ============
export function useDocument(id: string | null) {
  return useSWR(id ? swrKeys.documents.detail(id) : null, () => api.getDocument(id!), {
    // 配置选项
    revalidateOnFocus: false, // 画布场景不需要聚焦刷新
    dedupingInterval: 5000, // 5 秒内去重
  })
}

// 带错误处理的完整示例
export function useDocumentWithError(id: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? swrKeys.documents.detail(id) : null,
    () => api.getDocument(id!)
  )

  return {
    document: data,
    isLoading,
    isValidating, // 后台重新验证中
    error,
    // 暴露 mutate 用于手动更新
    refresh: () => mutate(),
    update: (updates: Partial<Document>) =>
      mutate((current) => (current ? { ...current, ...updates } : undefined), {
        revalidate: false,
      }),
  }
}

// ============ 封装 Mutation Hook ============
export function useUpdateDocument() {
  const { mutate: globalMutate } = useSWRConfig()

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>) => {
      const key = swrKeys.documents.detail(id)

      // 乐观更新
      return globalMutate(
        key,
        async (current: Document | undefined) => {
          if (!current) return current
          const result = await api.updateDocument(id, updates)
          return result
        },
        {
          optimisticData: (current) => (current ? { ...current, ...updates } : undefined),
          rollbackOnError: true,
          revalidate: false,
        }
      )
    },
    [globalMutate]
  )

  return { updateDocument }
}

// ============ 复杂场景：批量 invalidate ============
export function useCreateShape() {
  const { mutate: globalMutate } = useSWRConfig()

  return async (docId: string, shapeData: CreateShapeInput) => {
    const newShape = await api.createShape(docId, shapeData)

    // 更新文档缓存中的 shapes 列表
    globalMutate(
      swrKeys.documents.detail(docId),
      (current: Document | undefined) => {
        if (!current) return current
        return {
          ...current,
          shapes: [...current.shapes, newShape],
        }
      },
      { revalidate: false }
    )

    return newShape
  }
}
```

### 4.3 数据获取模式

| 模式         | 适用场景             | SWR 实现方式                                  |
| ------------ | -------------------- | --------------------------------------------- |
| **按需获取** | 用户触发（点击详情） | key 为 `null` 时不请求                        |
| **预获取**   | 可预测的导航         | `mutate(key, fetcher, { revalidate: false })` |
| **后台刷新** | 保持数据新鲜         | `refreshInterval` 配置                        |
| **实时同步** | 协作场景             | WebSocket + `mutate` 更新缓存                 |
| **乐观更新** | 提升感知速度         | `optimisticData` + `rollbackOnError`          |
| **依赖请求** | A 依赖 B 的结果      | B 的 key 用 A 的数据构造                      |

### 4.4 SWR + Zustand 协作模式

**原则：服务端状态用 SWR，客户端状态用 Zustand**

```tsx
// 场景：画布编辑器
// - 文档数据（shapes, groups）→ SWR（服务端真相）
// - 选中状态、视口、工具 → Zustand（纯客户端）

// stores/canvas.ts - 客户端状态
const useCanvasStore = create<CanvasState>((set) => ({
  selectedIds: new Set<string>(),
  viewport: { x: 0, y: 0, zoom: 1 },
  tool: 'select',
  // ... actions
}))

// hooks/use-canvas-data.ts - 组合使用
export function useCanvasData(docId: string) {
  // 服务端数据
  const { data: document, mutate } = useDocument(docId)

  // 客户端状态
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const viewport = useCanvasStore((s) => s.viewport)

  // 派生数据（结合两者）
  const selectedShapes = useMemo(() => {
    if (!document) return []
    return document.shapes.filter((s) => selectedIds.has(s.id))
  }, [document, selectedIds])

  // 视口内的形状
  const visibleShapes = useMemo(() => {
    if (!document) return []
    return document.shapes.filter((s) => isShapeInViewport(s, viewport))
  }, [document, viewport])

  return {
    document,
    selectedShapes,
    visibleShapes,
    updateDocument: mutate,
  }
}
```

---

## 5. 函数拆分与组织

### 5.1 函数长度原则

| 函数类型    | 建议行数 | 超过后的处理      |
| ----------- | -------- | ----------------- |
| 纯计算函数  | < 30 行  | 拆分为多个小函数  |
| React 组件  | < 150 行 | 拆分子组件        |
| 事件处理器  | < 30 行  | 提取到自定义 hook |
| 自定义 Hook | < 80 行  | 组合多个小 hook   |

### 5.2 函数拆分策略

**策略 1：按职责拆分**

```tsx
// ❌ 一个巨大的事件处理器
function handleDrop(e: DragEvent) {
  // 50 行：解析拖拽数据
  // 30 行：验证数据
  // 40 行：创建新形状
  // 20 行：更新状态
  // 30 行：发送到服务器
  // 20 行：更新 UI 反馈
}

// ✅ 拆分为职责明确的函数
function handleDrop(e: DragEvent) {
  const data = parseDragData(e) // 纯函数
  const validation = validateDropData(data) // 纯函数
  if (!validation.ok) return showError(validation.error)

  const shape = createShapeFromDrop(data) // 纯函数
  addShape(shape) // 状态更新
  syncToServer(shape) // 副作用
  showSuccessFeedback() // UI 反馈
}
```

**策略 2：提取自定义 Hook**

```tsx
// ❌ 组件中混合大量逻辑
function Canvas() {
  // 50 行：viewport 管理
  // 40 行：选择逻辑
  // 60 行：拖拽逻辑
  // 30 行：键盘快捷键
  // 100 行：渲染
}

// ✅ 提取为独立 hooks
function Canvas() {
  const viewport = useViewport()
  const selection = useSelection()
  const drag = useDrag()
  const shortcuts = useKeyboardShortcuts()

  // 组件只负责组合和渲染
  return (
    <CanvasContainer
      viewport={viewport}
      onMouseDown={selection.handleMouseDown}
      onDrag={drag.handleDrag}
    >
      {/* 渲染逻辑 */}
    </CanvasContainer>
  )
}
```

### 5.3 函数组织位置

```
我写的这个函数应该放在哪？
│
├─ 纯计算，无副作用，可复用
│   └─ lib/utils/ 或 feature/utils/
│
├─ 包含 hooks（useState, useEffect...）
│   └─ hooks/ 或 feature/hooks/
│
├─ 与组件紧密耦合，只用一次
│   └─ 放在组件文件内，组件定义之前
│
├─ API 调用相关
│   └─ services/api/
│
└─ 业务逻辑，需要访问 store
    └─ feature/store 或 feature/actions
```

---

## 6. Hooks 设计原则

### 6.1 Hook 命名规范

```tsx
// 获取数据的 hook
useDocument(id) // ✅ 名词：返回数据
useDocuments(filters) // ✅

// 执行动作的 hook
useCreateDocument() // ✅ 动词：返回函数/mutation
useDeleteShape() // ✅

// 管理状态的 hook
useSelection() // ✅ 返回 { selected, select, deselect }
useViewport() // ✅ 返回 { viewport, pan, zoom }

// 副作用 hook
useOnClickOutside(ref, handler) // ✅ 动作描述
useWindowSize() // ✅ 返回值描述
```

### 6.2 Hook 返回值设计

```tsx
// ✅ 好的返回值设计
function useToggle(initial = false) {
  const [value, setValue] = useState(initial)

  return {
    value, // 当前值
    toggle: () => setValue((v) => !v), // 切换
    setTrue: () => setValue(true), // 设为 true
    setFalse: () => setValue(false), // 设为 false
  }
}

// ✅ 与 SWR 保持一致的模式
function useDocument(id: string) {
  const { data, isLoading, error, mutate } = useSWR(id ? `/api/documents/${id}` : null, fetcher)

  return {
    document: data,
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
```

### 6.3 Hook 组合模式

```tsx
// 小而专注的 hooks
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return position
}

function useElementBounds(ref: RefObject<HTMLElement>) {
  const [bounds, setBounds] = useState<DOMRect | null>(null)
  useEffect(() => {
    if (ref.current) {
      setBounds(ref.current.getBoundingClientRect())
    }
  }, [ref])
  return bounds
}

// 组合成更高级的 hook
function useRelativeMousePosition(ref: RefObject<HTMLElement>) {
  const mouse = useMousePosition()
  const bounds = useElementBounds(ref)

  return useMemo(() => {
    if (!bounds) return null
    return {
      x: mouse.x - bounds.left,
      y: mouse.y - bounds.top,
    }
  }, [mouse, bounds])
}
```

---

## 7. 类型系统规范

### 7.1 类型定义位置

```
类型应该定义在哪里？
│
├─ 全局共享的基础类型（如 ID, Point, Box）
│   └─ types/primitives.ts
│
├─ API 响应/请求类型
│   └─ services/api/types.ts 或与 API 文件同位置
│
├─ Feature 内部类型
│   └─ features/xxx/types/
│
├─ 组件 Props 类型
│   └─ 与组件同文件，export 出去
│
└─ 工具类型（泛型、辅助类型）
    └─ types/utils.ts
```

### 7.2 类型设计原则

```tsx
// ✅ 使用区分联合类型（Discriminated Union）
type Shape =
  | { type: 'rectangle'; width: number; height: number }
  | { type: 'ellipse'; radiusX: number; radiusY: number }
  | { type: 'line'; points: Point[] }

// 类型收窄自动生效
function renderShape(shape: Shape) {
  switch (shape.type) {
    case 'rectangle':
      return <Rect width={shape.width} height={shape.height} />
    case 'ellipse':
      return <Ellipse rx={shape.radiusX} ry={shape.radiusY} />
    case 'line':
      return <Line points={shape.points} />
  }
}

// ✅ 使用 Branded Types 增强类型安全
type ShapeId = string & { __brand: 'ShapeId' }
type GroupId = string & { __brand: 'GroupId' }

// 防止混用
function getShape(id: ShapeId) { ... }
getShape('group:123' as GroupId)  // 类型错误！
```

### 7.3 避免的模式

```tsx
// ❌ 避免 any
const data: any = fetchData()

// ✅ 使用 unknown + 类型守卫
const data: unknown = fetchData()
if (isDocument(data)) {
  // data 是 Document 类型
}

// ❌ 避免过度断言
const element = document.getElementById('root') as HTMLDivElement

// ✅ 使用类型守卫或 null 检查
const element = document.getElementById('root')
if (element instanceof HTMLDivElement) {
  // 安全使用
}

// ❌ 避免 enum（运行时开销）
enum Status {
  Pending,
  Active,
  Done,
}

// ✅ 使用 const object + as const
const Status = {
  Pending: 'pending',
  Active: 'active',
  Done: 'done',
} as const
type Status = (typeof Status)[keyof typeof Status]
```

---

## 8. 性能优化策略

### 8.1 渲染优化

```tsx
// 1. 使用 React.memo 包装纯展示组件
const ShapeRenderer = React.memo(function ShapeRenderer({ shape }: Props) {
  return <div>{/* 渲染 */}</div>
})

// 2. 使用 useMemo 缓存计算结果
const sortedShapes = useMemo(
  () => shapes.sort((a, b) => a.zIndex - b.zIndex),
  [shapes]
)

// 3. 使用 useCallback 稳定回调引用
const handleClick = useCallback((id: string) => {
  selectShape(id)
}, [selectShape])

// 4. 避免在渲染中创建对象/数组
// ❌
<Component style={{ marginTop: 10 }} />
<Component items={[1, 2, 3]} />

// ✅
const style = useMemo(() => ({ marginTop: 10 }), [])
const items = useMemo(() => [1, 2, 3], [])
```

### 8.2 状态更新优化

```tsx
// 1. 状态下沉：把频繁变化的状态放到子组件
// ❌ 父组件持有 hover 状态
function Parent() {
  const [hoveredId, setHoveredId] = useState(null) // 触发整个列表重渲染
  return shapes.map((s) => (
    <Shape key={s.id} isHovered={hoveredId === s.id} onHover={setHoveredId} />
  ))
}

// ✅ 子组件管理自己的 hover
function Parent() {
  return shapes.map((s) => <Shape key={s.id} />)
}

function Shape() {
  const [isHovered, setIsHovered] = useState(false) // 只触发自己重渲染
  return <div onMouseEnter={() => setIsHovered(true)} />
}

// 2. 使用 selector 精确订阅 store
// ❌ 订阅整个 store
const store = useCanvasStore()

// ✅ 只订阅需要的部分
const zoom = useCanvasStore((s) => s.viewport.zoom)
const tool = useCanvasStore((s) => s.tool)
```

### 8.3 虚拟化（大列表）

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // 预估行高
  })

  return (
    <div ref={parentRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 9. 测试策略

### 9.1 测试金字塔

```
          ╱╲
         ╱  ╲         E2E (5%)
        ╱────╲        - 关键用户流程
       ╱      ╲       - Playwright
      ╱────────╲
     ╱          ╲     集成测试 (25%)
    ╱────────────╲    - 组件交互
   ╱              ╲   - Hook 测试
  ╱________________╲  - React Testing Library
 ╱                  ╲
╱____________________╲ 单元测试 (70%)
                       - 纯函数
                       - Vitest
```

### 9.2 测试示例

```tsx
// 1. 单元测试：纯函数
describe('computeAABB', () => {
  it('计算多个形状的边界框', () => {
    const shapes = [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 50, y: 50, width: 100, height: 50 },
    ]
    expect(computeAABB(shapes)).toEqual({
      x: 0,
      y: 0,
      width: 150,
      height: 100,
    })
  })
})

// 2. Hook 测试
describe('useSelection', () => {
  it('选择和取消选择', () => {
    const { result } = renderHook(() => useSelection())

    act(() => result.current.select(['shape:1', 'shape:2']))
    expect(result.current.selectedIds).toEqual(new Set(['shape:1', 'shape:2']))

    act(() => result.current.deselect('shape:1'))
    expect(result.current.selectedIds).toEqual(new Set(['shape:2']))
  })
})

// 3. 组件集成测试
describe('ShapeEditor', () => {
  it('点击形状后显示属性面板', async () => {
    render(<ShapeEditor shapes={mockShapes} />)

    await userEvent.click(screen.getByTestId('shape-rect-1'))

    expect(screen.getByRole('form', { name: '属性面板' })).toBeVisible()
    expect(screen.getByLabelText('宽度')).toHaveValue('100')
  })
})
```

---

## 10. 代码风格约定

### 10.1 ESLint + Prettier 配置

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    // 强制规则
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react-hooks/exhaustive-deps": "error",

    // 推荐规则
    "prefer-const": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 10.2 命名约定

| 类型 | 约定                | 示例                                   |
| ---- | ------------------- | -------------------------------------- |
| 组件 | PascalCase          | `ShapeEditor`, `ToolbarButton`         |
| Hook | camelCase, use 前缀 | `useSelection`, `useViewport`          |
| 函数 | camelCase, 动词开头 | `createShape`, `handleClick`           |
| 常量 | SCREAMING_SNAKE     | `MAX_ZOOM`, `DEFAULT_COLOR`            |
| 类型 | PascalCase          | `ShapeProps`, `CanvasState`            |
| 文件 | kebab-case          | `shape-editor.tsx`, `use-selection.ts` |

### 10.3 文件组织

```tsx
// 组件文件结构
// 1. 导入（按类型分组）
import { useState, useMemo } from 'react'           // React
import { useQuery } from '@tanstack/react-query'    // 第三方库
import { cn } from '@/lib/utils'                    // 内部工具
import { Button } from '@/components/ui/button'     // 内部组件
import { useCanvasStore } from '@/stores/canvas'    // 状态

// 2. 类型定义
interface ShapeEditorProps {
  shapeId: string
  onClose: () => void
}

// 3. 常量
const DEFAULT_ZOOM = 1

// 4. 辅助函数（如果只在此文件用）
function formatPosition(x: number, y: number) {
  return `(${x.toFixed(0)}, ${y.toFixed(0)})`
}

// 5. 组件定义
export function ShapeEditor({ shapeId, onClose }: ShapeEditorProps) {
  // hooks 在最前
  const [isEditing, setIsEditing] = useState(false)
  const zoom = useCanvasStore(s => s.viewport.zoom)

  // 派生数据
  const displayZoom = useMemo(() => `${(zoom * 100).toFixed(0)}%`, [zoom])

  // 事件处理器
  const handleSave = () => { ... }

  // 渲染
  return (...)
}
```

---

## 11. 协作白板专项规范

> 这一节专门针对协作白板/Canvas 应用的特殊 React 模式

### 11.1 Canvas 渲染架构

**核心原则：Canvas 渲染与 React 渲染分离**

```tsx
// ============ 架构分层 ============
//
// ┌─────────────────────────────────────────────────────────┐
// │                    React Layer                          │
// │  - UI 组件（工具栏、面板、菜单）                          │
// │  - 状态管理（Zustand/SWR）                               │
// │  - 事件绑定                                              │
// └─────────────────────────┬───────────────────────────────┘
//                           │ 单向数据流
//                           ↓
// ┌─────────────────────────────────────────────────────────┐
// │                   Canvas Layer                          │
// │  - 命令式渲染（Canvas 2D / WebGL / SVG）                 │
// │  - 自己的渲染循环（requestAnimationFrame）               │
// │  - 不走 React reconciliation                            │
// └─────────────────────────────────────────────────────────┘

// ============ 实现模式 ============

// 方式 1：Canvas 引用 + 命令式更新
function CanvasRenderer({ shapes, viewport }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderingEngine | null>(null)

  // 初始化渲染引擎
  useEffect(() => {
    if (!canvasRef.current) return

    rendererRef.current = new CanvasRenderingEngine(canvasRef.current)

    return () => {
      rendererRef.current?.dispose()
    }
  }, [])

  // 数据变化时，命令式更新渲染引擎
  useEffect(() => {
    rendererRef.current?.setShapes(shapes)
    rendererRef.current?.render()
  }, [shapes])

  useEffect(() => {
    rendererRef.current?.setViewport(viewport)
    rendererRef.current?.render()
  }, [viewport])

  return (
    <canvas ref={canvasRef} width={1920} height={1080} style={{ width: '100%', height: '100%' }} />
  )
}

// 方式 2：使用 useSyncExternalStore 桥接外部渲染状态
function useCanvasSelection(renderer: CanvasRenderingEngine) {
  return useSyncExternalStore(
    renderer.subscribeToSelection,
    renderer.getSelection,
    renderer.getSelection // SSR fallback
  )
}
```

### 11.2 高频更新优化

**场景：鼠标移动、拖拽、实时 cursor**

```tsx
// ============ 问题：React 状态更新太慢 ============
// ❌ 错误：每次鼠标移动都更新 React 状态
function Canvas() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY }) // 60fps → 60 次 React 更新
  }
  // 性能问题：每次更新触发 reconciliation
}

// ============ 解决方案 1：Ref + RAF ============
function Canvas() {
  const positionRef = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let frameId: number

    const render = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        // 直接从 ref 读取，不经过 React
        drawCursor(ctx, positionRef.current)
      }
      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // 更新 ref，不触发 React 重渲染
    positionRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  return <canvas ref={canvasRef} onMouseMove={handleMouseMove} />
}

// ============ 解决方案 2：Zustand + transient updates ============
// stores/pointer.ts
interface PointerState {
  position: { x: number; y: number }
  // transient: 不触发订阅者更新
  _transient: {
    position: { x: number; y: number }
  }
}

const usePointerStore = create<PointerState>((set, get) => ({
  position: { x: 0, y: 0 },
  _transient: { position: { x: 0, y: 0 } },
}))

// 高频更新：直接改 _transient，不触发 React
function updatePointerPosition(x: number, y: number) {
  usePointerStore.setState((state) => {
    state._transient.position = { x, y }
    return state // 返回相同引用，不触发更新
  }, true) // replace: true
}

// 需要 React 响应时才 commit
function commitPointerPosition() {
  const transient = usePointerStore.getState()._transient
  usePointerStore.setState({
    position: transient.position,
  })
}

// ============ 解决方案 3：事件节流/防抖 ============
function useThrottledCallback<T extends (...args: any[]) => void>(callback: T, fps: number = 60) {
  const lastCall = useRef(0)
  const frameId = useRef<number>()

  return useCallback(
    (...args: Parameters<T>) => {
      const now = performance.now()
      const interval = 1000 / fps

      if (now - lastCall.current >= interval) {
        lastCall.current = now
        callback(...args)
      } else {
        // 确保最后一次调用会执行
        cancelAnimationFrame(frameId.current!)
        frameId.current = requestAnimationFrame(() => {
          lastCall.current = performance.now()
          callback(...args)
        })
      }
    },
    [callback, fps]
  )
}

// 使用
const handleMouseMove = useThrottledCallback((e: MouseEvent) => {
  updatePosition({ x: e.clientX, y: e.clientY })
}, 60)
```

### 11.3 实时协作数据同步

**WebSocket + SWR + Zustand 集成模式**

```tsx
// ============ WebSocket 连接管理 ============
// services/realtime/connection.ts

class RealtimeConnection {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Set<(data: any) => void>>()

  connect(docId: string) {
    this.ws = new WebSocket(`wss://api.example.com/docs/${docId}`)

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.dispatch(message.type, message.payload)
    }
  }

  private dispatch(type: string, payload: any) {
    this.listeners.get(type)?.forEach((cb) => cb(payload))
  }

  subscribe(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)

    return () => {
      this.listeners.get(type)!.delete(callback)
    }
  }

  send(type: string, payload: any) {
    this.ws?.send(JSON.stringify({ type, payload }))
  }

  disconnect() {
    this.ws?.close()
  }
}

export const realtimeConnection = new RealtimeConnection()

// ============ React Hook 封装 ============
// hooks/use-realtime-sync.ts

export function useRealtimeSync(docId: string) {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    realtimeConnection.connect(docId)

    // 监听远端更新，更新 SWR 缓存
    const unsubShapeUpdate = realtimeConnection.subscribe(
      'shape:update',
      (payload: { shapeId: string; changes: Partial<Shape> }) => {
        mutate(
          swrKeys.documents.detail(docId),
          (current: Document | undefined) => {
            if (!current) return current
            return {
              ...current,
              shapes: current.shapes.map((s) =>
                s.id === payload.shapeId ? { ...s, ...payload.changes } : s
              ),
            }
          },
          { revalidate: false }
        )
      }
    )

    const unsubShapeCreate = realtimeConnection.subscribe(
      'shape:create',
      (payload: { shape: Shape }) => {
        mutate(
          swrKeys.documents.detail(docId),
          (current: Document | undefined) => {
            if (!current) return current
            return {
              ...current,
              shapes: [...current.shapes, payload.shape],
            }
          },
          { revalidate: false }
        )
      }
    )

    return () => {
      unsubShapeUpdate()
      unsubShapeCreate()
      realtimeConnection.disconnect()
    }
  }, [docId, mutate])
}

// ============ 发送本地更新 ============
export function useSendUpdate() {
  const sendShapeUpdate = useCallback((shapeId: string, changes: Partial<Shape>) => {
    realtimeConnection.send('shape:update', { shapeId, changes })
  }, [])

  return { sendShapeUpdate }
}

// ============ 在组件中使用 ============
function CanvasEditor({ docId }: { docId: string }) {
  // 1. 获取文档数据
  const { data: document } = useDocument(docId)

  // 2. 启动实时同步（WebSocket → SWR cache）
  useRealtimeSync(docId)

  // 3. 本地更新 hook
  const { updateDocument } = useUpdateDocument()
  const { sendShapeUpdate } = useSendUpdate()

  // 4. 更新处理：本地乐观更新 + 发送到服务器
  const handleShapeChange = useCallback(
    (shapeId: string, changes: Partial<Shape>) => {
      // 乐观更新本地状态
      updateDocument(docId, {
        shapes: document!.shapes.map((s) => (s.id === shapeId ? { ...s, ...changes } : s)),
      })

      // 发送到其他客户端
      sendShapeUpdate(shapeId, changes)
    },
    [docId, document, updateDocument, sendShapeUpdate]
  )

  return <Canvas shapes={document?.shapes ?? []} onShapeChange={handleShapeChange} />
}
```

### 11.4 Presence（光标、选择状态）

**实时显示其他用户的光标和选择状态**

```tsx
// ============ Presence Store ============
// stores/presence.ts

interface UserPresence {
  oderId: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
  selection: string[] // 选中的 shapeIds
}

interface PresenceState {
  others: Map<string, UserPresence>
  setOtherPresence: (userId: string, presence: Partial<UserPresence>) => void
  removeOther: (userId: string) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  others: new Map(),

  setOtherPresence: (userId, presence) =>
    set((state) => {
      const newOthers = new Map(state.others)
      const current = newOthers.get(userId) || {
        oderId: oderId,
        name: 'Unknown',
        color: '#888',
        cursor: null,
        selection: [],
      }
      newOthers.set(userId, { ...current, ...presence })
      return { others: newOthers }
    }),

  removeOther: (userId) =>
    set((state) => {
      const newOthers = new Map(state.others)
      newOthers.delete(userId)
      return { others: newOthers }
    }),
}))

// ============ Presence Sync Hook ============
export function usePresenceSync(docId: string, myUserId: string) {
  const setOtherPresence = usePresenceStore((s) => s.setOtherPresence)
  const removeOther = usePresenceStore((s) => s.removeOther)

  useEffect(() => {
    // 监听其他用户的 presence 更新
    const unsubCursor = realtimeConnection.subscribe(
      'presence:cursor',
      (payload: { userId: string; cursor: { x: number; y: number } | null }) => {
        if (payload.userId !== myUserId) {
          setOtherPresence(payload.userId, { cursor: payload.cursor })
        }
      }
    )

    const unsubSelection = realtimeConnection.subscribe(
      'presence:selection',
      (payload: { userId: string; selection: string[] }) => {
        if (payload.userId !== myUserId) {
          setOtherPresence(payload.userId, { selection: payload.selection })
        }
      }
    )

    const unsubLeave = realtimeConnection.subscribe(
      'presence:leave',
      (payload: { userId: string }) => {
        removeOther(payload.userId)
      }
    )

    return () => {
      unsubCursor()
      unsubSelection()
      unsubLeave()
    }
  }, [docId, myUserId, setOtherPresence, removeOther])
}

// ============ 广播自己的 Presence ============
export function useBroadcastPresence() {
  // 使用节流避免过于频繁的广播
  const broadcastCursor = useThrottledCallback((cursor: { x: number; y: number } | null) => {
    realtimeConnection.send('presence:cursor', { cursor })
  }, 30) // 30fps 足够流畅

  const broadcastSelection = useCallback((selection: string[]) => {
    realtimeConnection.send('presence:selection', { selection })
  }, [])

  return { broadcastCursor, broadcastSelection }
}

// ============ 渲染其他用户的光标 ============
function OtherCursors() {
  const others = usePresenceStore((s) => s.others)

  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from(others.values()).map(
        (user) =>
          user.cursor && (
            <div
              key={user.oderId}
              className="absolute transition-transform duration-75"
              style={{
                transform: `translate(${user.cursor.x}px, ${user.cursor.y}px)`,
              }}
            >
              <CursorIcon color={user.color} />
              <span
                className="ml-2 rounded px-1 text-xs text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
              </span>
            </div>
          )
      )}
    </div>
  )
}
```

### 11.5 离线支持与冲突处理

```tsx
// ============ 离线检测 ============
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// ============ 离线操作队列 ============
interface PendingOperation {
  id: string
  timestamp: number
  type: 'shape:update' | 'shape:create' | 'shape:delete'
  payload: any
}

const usePendingOpsStore = create<{
  operations: PendingOperation[]
  addOperation: (op: Omit<PendingOperation, 'id' | 'timestamp'>) => void
  clearOperations: () => void
}>((set) => ({
  operations: [],
  addOperation: (op) =>
    set((state) => ({
      operations: [...state.operations, { ...op, id: crypto.randomUUID(), timestamp: Date.now() }],
    })),
  clearOperations: () => set({ operations: [] }),
}))

// ============ 自动重试同步 ============
export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const operations = usePendingOpsStore((s) => s.operations)
  const clearOperations = usePendingOpsStore((s) => s.clearOperations)

  useEffect(() => {
    if (isOnline && operations.length > 0) {
      // 上线后，按时间顺序发送离线期间的操作
      const syncOperations = async () => {
        for (const op of operations) {
          try {
            await api.syncOperation(op)
          } catch (error) {
            console.error('Failed to sync operation:', op.id, error)
            // 可以实现更复杂的重试逻辑
          }
        }
        clearOperations()
      }

      syncOperations()
    }
  }, [isOnline, operations, clearOperations])
}

// ============ 乐观更新 with 离线支持 ============
export function useResilientUpdate() {
  const isOnline = useOnlineStatus()
  const { mutate } = useSWRConfig()
  const addOperation = usePendingOpsStore((s) => s.addOperation)

  const updateShape = useCallback(
    async (docId: string, shapeId: string, changes: Partial<Shape>) => {
      // 1. 立即更新本地状态（乐观更新）
      mutate(
        swrKeys.documents.detail(docId),
        (current: Document | undefined) => {
          if (!current) return current
          return {
            ...current,
            shapes: current.shapes.map((s) => (s.id === shapeId ? { ...s, ...changes } : s)),
          }
        },
        { revalidate: false }
      )

      // 2. 发送到服务器或加入队列
      if (isOnline) {
        try {
          await api.updateShape(docId, shapeId, changes)
          realtimeConnection.send('shape:update', { shapeId, changes })
        } catch (error) {
          // 网络请求失败，加入重试队列
          addOperation({
            type: 'shape:update',
            payload: { docId, shapeId, changes },
          })
        }
      } else {
        // 离线状态，直接加入队列
        addOperation({
          type: 'shape:update',
          payload: { docId, shapeId, changes },
        })
      }
    },
    [isOnline, mutate, addOperation]
  )

  return { updateShape }
}
```

### 11.6 Canvas 组件最佳实践总结

```tsx
// ============ 完整的 Canvas 编辑器结构 ============

function WhiteboardEditor({ docId }: { docId: string }) {
  return (
    <WhiteboardProvider docId={docId}>
      <div className="flex h-screen">
        {/* 左侧工具栏 - React 组件 */}
        <Toolbar />

        {/* 主画布区域 */}
        <main className="flex-1 relative">
          {/* Canvas 渲染层 - 命令式更新 */}
          <CanvasLayer />

          {/* 覆盖层 - React 组件 */}
          <SelectionOverlay />
          <OtherCursors />
        </main>

        {/* 右侧属性面板 - React 组件 */}
        <PropertiesPanel />
      </div>

      {/* 状态指示器 */}
      <ConnectionStatus />
    </WhiteboardProvider>
  )
}

// Provider 负责初始化所有 hooks
function WhiteboardProvider({ docId, children }: { docId: string; children: React.ReactNode }) {
  const userId = useUserId()

  // 数据获取
  const { data: document, isLoading } = useDocument(docId)

  // 实时同步
  useRealtimeSync(docId)
  usePresenceSync(docId, userId)
  useOfflineSync()

  if (isLoading) return <LoadingScreen />

  return (
    <WhiteboardContext.Provider value={{ docId, document }}>{children}</WhiteboardContext.Provider>
  )
}
```

### 11.7 性能检查清单

| 检查项                                 | 通过标准                            |
| -------------------------------------- | ----------------------------------- |
| Canvas 渲染不走 React                  | ✅ 使用 ref + 命令式更新            |
| 高频事件（mousemove）不触发 React 更新 | ✅ 使用 ref 或节流                  |
| Zustand selector 精确订阅              | ✅ `useStore(s => s.specificField)` |
| 大列表虚拟化                           | ✅ 使用 @tanstack/virtual           |
| Presence 更新节流                      | ✅ 30fps 足够                       |
| WebSocket 消息批处理                   | ✅ 累积后批量更新                   |
| 离线操作队列                           | ✅ 有队列 + 自动重试                |

---

## 附录：快速决策表

### 状态管理选型

| 你的需求                     | 推荐方案               |
| ---------------------------- | ---------------------- |
| 服务端数据（API 响应）       | SWR                    |
| 全局 UI 状态（主题、侧边栏） | Zustand                |
| 表单状态                     | React Hook Form        |
| URL 状态                     | nuqs 或 searchParams   |
| 复杂跨组件状态               | Zustand + immer        |
| 实时协作数据                 | WebSocket + SWR mutate |

### 组件库选型

| 需求         | 推荐                  |
| ------------ | --------------------- |
| 通用 UI 组件 | shadcn/ui             |
| 图标         | Lucide Icons          |
| 表单         | React Hook Form + Zod |
| 表格         | TanStack Table        |
| 拖拽         | dnd-kit               |
| 虚拟列表     | TanStack Virtual      |

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-24
