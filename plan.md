# Mind-Fuse 实施计划

## 项目定位

AI 驱动的协作白板平台。Phase 1 聚焦技术图表生成（Flowchart / Architecture / Sequence / Class）。

**差异化**：Semantic-First 架构 — AI 操作语义模型，布局引擎派生几何，用户可手动调整。

---

## 核心架构决策

### 数据模型：Diagram 作为 Shape 的语义叠加层

```
Y.Doc (Yjs)
├── shapes: Y.Map<ShapeId, Shape>           // 几何 + 渲染（现有）
├── bindings: Y.Map<BindingId, Binding>     // 连接关系（现有）
├── groups: Y.Map<GroupId, Group>           // 分组（现有）
└── diagrams: Y.Map<DiagramId, Diagram>     // 语义叠加层（新增）
```

**设计原则**：

| 原则 | 说明 |
|------|------|
| **Diagram 引用 Shape，不包含 Shape** | DiagramNode 通过 shapeId 引用 Shape，语义和几何分离 |
| **布局结果写入 Shape** | 布局引擎计算位置后直接更新 Shape.x/y，通过 Yjs 同步 |
| **positionOverrides 防止布局覆盖** | 用户拖拽节点后记录 override，下次布局跳过该节点 |
| **Diagram 包含一个 Group** | 所有 diagram 的 shapes 共享 groupId，支持整体操作 |
| **AI 读 Diagram，不读 Shape** | AI 上下文只包含语义信息，不含几何细节 |
| **渲染层不知道 Diagram** | PixiJS 只渲染 Shape，完全领域无关 |

### 类型定义

```typescript
// packages/types/src/diagrams/base.ts

// ===== Branded IDs =====
type DiagramId = string & { readonly __brand: 'DiagramId' }
type DiagramNodeId = string & { readonly __brand: 'DiagramNodeId' }
type DiagramEdgeId = string & { readonly __brand: 'DiagramEdgeId' }

// ===== Diagram（语义叠加层）=====
interface Diagram {
  id: DiagramId
  type: DiagramType                    // 'flowchart' | 'architecture' | 'sequence' | 'class'
  groupId: GroupId                     // 对应的 Group（整体操作用）

  metadata: {
    title: string
    layoutAlgorithm: string            // 'dagre' | 'elk' | 'force' | 'timeline'
    createdAt: number
    updatedAt: number
  }

  nodes: Record<string, DiagramNode>   // DiagramNodeId → DiagramNode
  edges: Record<string, DiagramEdge>   // DiagramEdgeId → DiagramEdge

  positionOverrides: Record<string, { x: number; y: number }>  // DiagramNodeId → 手动位置

  conversation: ConversationTurn[]     // AI 多轮对话历史
}

// ===== DiagramNode（语义节点，引用 Shape）=====
interface DiagramNode {
  id: DiagramNodeId
  shapeId: ShapeId                     // → Shape in DocumentManager
  semanticType: string                 // 由具体图表类型定义
  label: string
  description?: string
}

// ===== DiagramEdge（语义边，引用 Binding）=====
interface DiagramEdge {
  id: DiagramEdgeId
  fromNodeId: DiagramNodeId
  toNodeId: DiagramNodeId
  bindingId: BindingId                 // → Binding in DocumentManager
  lineShapeId: ShapeId                 // → LineShape for rendering
  semanticType: string
  label?: string
}

// ===== Flowchart 特化 =====
interface FlowchartNode extends DiagramNode {
  semanticType: 'start' | 'end' | 'process' | 'decision' | 'data' | 'subprocess'
}

interface FlowchartEdge extends DiagramEdge {
  semanticType: 'flow' | 'branch_true' | 'branch_false' | 'exception'
}

// ===== 对话历史 =====
interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  changes?: DiagramChange[]            // 这一轮 AI 做了什么改动
}

interface DiagramChange {
  action: 'add_node' | 'remove_node' | 'add_edge' | 'remove_edge' | 'update_node' | 'update_edge'
  targetId: string
  details?: Record<string, unknown>
}
```

### 完整数据流

```
场景：用户输入 "创建一个登录流程图"

1. 用户输入 → AI Agent
   ├── 读取 Diagram.conversation（如有，用于多轮上下文）
   ├── 构建 LLM context（纯语义，无坐标）
   └── 调用 LLM，获得结构化 JSON

2. AI 返回 JSON → DiagramDocumentManager
   ├── 创建 Diagram 对象（写入 diagrams Y.Map）
   ├── 为每个 node 创建 RectShape（写入 shapes Y.Map）
   ├── 为每个 edge 创建 LineShape + Binding（写入 shapes/bindings Y.Map）
   ├── 创建 Group，包含所有 shapes（写入 groups Y.Map）
   └── 在 DiagramNode/Edge 中记录 shapeId/bindingId 映射

3. 布局引擎
   ├── 读取 Diagram.nodes + edges（拓扑结构）
   ├── 读取 Diagram.positionOverrides（跳过已手动调整的节点）
   ├── 运行 Dagre 算法
   └── 将计算出的 x/y 写入对应的 Shape（通过 shapeId）

4. Yjs 同步
   ├── diagrams Y.Map 变更 → 同步到所有客户端
   ├── shapes Y.Map 变更 → 同步到所有客户端
   └── 其他客户端收到更新 → PixiJS 自动渲染

5. 用户 B 拖拽节点
   ├── 直接更新 Shape.x/y（通过 DocumentManager）
   ├── 检测 Shape 是否属于某个 Diagram（通过 groupId 或 shapeId 反查）
   ├── 如果属于 Diagram → 写入 positionOverrides
   └── positionOverrides 通过 Yjs 同步

6. 用户 A 继续对话 "添加忘记密码分支"
   ├── AI 读取 Diagram（包含当前所有 nodes/edges/overrides）
   ├── AI 返回增量更新（新增 nodes + edges）
   ├── DiagramDocumentManager 创建新 Shapes
   ├── 布局引擎重新计算（但跳过有 override 的节点）
   └── 新节点出现在合理位置，旧节点不动
```

### 布局更新策略

| 操作 | 布局行为 | 说明 |
|------|----------|------|
| AI 添加/删除节点 | 全量重新布局 | 拓扑变了，需要重新计算 |
| AI 修改节点内容 | 不重新布局 | 语义变了但拓扑没变 |
| 用户拖拽节点 | **不重新布局** | 记录 positionOverride |
| 用户切换布局算法 | 清除 overrides + 全量重新布局 | 用户主动触发 |

---

## 技术栈

### 前端

| 模块 | 技术 | 理由 |
|------|------|------|
| 框架 | Next.js 15 | SSR, Turbopack |
| 渲染 | PixiJS v8 (WebGL/WebGPU) | 高性能画布渲染 |
| 状态 | Zustand | 轻量，适合 CRDT 集成 |
| CRDT | Yjs (Phase 1) → 自研 Rust (Phase 2) | 先验证后深入 |
| 样式 | vanilla-extract | 类型安全，零运行时 |
| 组件 | Radix UI + shadcn/ui | 可定制，可访问 |
| 测试 | Vitest + Playwright | 单元 + E2E |

### 后端

| 模块 | 技术 | 理由 |
|------|------|------|
| Go 框架 | Huma v2 | OpenAPI 原生 |
| WebSocket | nhooyr.io/websocket | 现代化，兼容 y-websocket |
| 数据库 | PostgreSQL + pgvector | 关系 + 向量搜索 |
| 缓存 | Dragonfly | Redis 兼容，更高性能 |

### Rust (Phase 2)

| 模块 | 技术 | 理由 |
|------|------|------|
| CRDT | 自研 YATA | 学习 + 完全控制 |
| WASM | wasm-bindgen | 前端复用 |
| gRPC | tonic | Go-Rust 通信 |

---

## 目录结构

```
mind-fuse/
├── apps/
│   ├── web/                         # Next.js 前端
│   │   └── src/
│   │       ├── app/                 # App Router
│   │       ├── components/
│   │       │   ├── canvas/          # PixiJS 画布组件
│   │       │   ├── chat/            # AI 聊天面板
│   │       │   └── toolbar/         # 工具栏
│   │       ├── stores/              # Zustand stores
│   │       └── hooks/               # React hooks
│   └── api-go/                      # Go 后端
│       ├── cmd/server/
│       └── internal/
│           ├── auth/
│           ├── workspace/
│           ├── realtime/            # WebSocket (Yjs sync)
│           └── ai/                  # AI proxy
│
├── packages/
│   ├── types/                       # 核心类型定义
│   │   └── src/
│   │       ├── ids.ts               # Branded IDs
│   │       ├── shapes.ts            # Shape 类型
│   │       ├── bindings.ts          # Binding 类型
│   │       ├── groups.ts            # Group 类型
│   │       └── diagrams/            # Diagram 语义类型（新增）
│   │           ├── base.ts          # Diagram, DiagramNode, DiagramEdge
│   │           ├── flowchart.ts     # FlowchartNode, FlowchartEdge
│   │           ├── architecture.ts  # ArchitectureNode, ArchitectureEdge
│   │           ├── sequence.ts      # SequenceNode, SequenceEdge
│   │           └── class-diagram.ts # ClassNode, ClassEdge
│   │
│   ├── collaboration-core/          # 文档管理 + 空间索引
│   │   └── src/
│   │       ├── DocumentManager.ts         # 现有：Shape/Binding/Group 管理
│   │       ├── DiagramDocumentManager.ts  # 新增：Diagram 语义管理
│   │       └── SpatialGrid.ts             # 现有：空间索引
│   │
│   ├── layout-engine/               # 布局引擎（新建）
│   │   └── src/
│   │       ├── types.ts             # LayoutEngine 接口
│   │       ├── dagre.ts             # Dagre 布局（流程图）
│   │       ├── force.ts             # Force-directed（架构图）
│   │       ├── timeline.ts          # Timeline（时序图）
│   │       └── elk.ts               # ELK（类图）
│   │
│   ├── agent-sdk/                   # AI Agent 框架（新建）
│   │   └── src/
│   │       ├── core/
│   │       │   ├── agent.ts         # BaseAgent
│   │       │   └── executor.ts      # Agent 执行器
│   │       ├── agents/
│   │       │   └── diagram-generator.ts  # 图表生成 Agent
│   │       ├── llm/
│   │       │   ├── provider.ts      # LLM 抽象接口
│   │       │   ├── claude.ts        # Claude 实现
│   │       │   └── openai.ts        # OpenAI 实现
│   │       └── context/
│   │           └── serializer.ts    # Diagram → LLM context
│   │
│   ├── canvas-operations/           # 画布操作 API
│   │   └── src/
│   │       ├── operations.ts        # 统一操作接口
│   │       └── element.ts           # 语义化元素
│   │
│   ├── editor/                      # 编辑器核心
│   │   └── src/
│   │       ├── Editor.ts
│   │       ├── tools/               # 选择、拖拽、连线等工具
│   │       └── renderer/            # PixiJS 渲染模块
│   │
│   ├── collaboration/               # CRDT 抽象层
│   │   └── src/
│   │       ├── adapter/
│   │       │   ├── yjs.ts           # Yjs 适配器
│   │       │   └── wasm.ts          # 自研适配器（Phase 2）
│   │       └── types.ts             # CRDTAdapter 接口
│   │
│   ├── store/                       # 状态管理
│   └── utils/                       # 工具函数
│
├── crates/                          # Rust（Phase 2）
│   ├── crdt-core/                   # YATA 算法
│   ├── crdt-wasm/                   # WASM 绑定
│   ├── ai-layout/                   # Rust 布局算法
│   └── geometry/                    # 几何计算
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DIAGRAMS.md                  # Semantic-First 架构文档
    ├── CRDT.md
    └── AGENT.md
```

---

## 实施路线图

### Phase 1: MVP (12 周)

---

#### Week 1-2: 通用白板基础 + 类型系统

**目标**：PixiJS 渲染 + Yjs 同步 + Diagram 类型定义

##### 类型系统扩展
- [ ] `packages/types/src/ids.ts` — 添加 DiagramId, DiagramNodeId, DiagramEdgeId
- [ ] `packages/types/src/diagrams/base.ts` — Diagram, DiagramNode, DiagramEdge 接口
- [ ] `packages/types/src/diagrams/flowchart.ts` — FlowchartNode, FlowchartEdge
- [ ] 类型测试：确保 branded IDs 类型安全

##### PixiJS 画布
- [ ] 集成 PixiJS v8 到 `apps/web`（Client Component）
- [ ] 实现 Canvas 组件（React 挂载 PixiJS Application）
- [ ] 无限画布：viewport pan (拖拽平移) + zoom (滚轮缩放)
- [ ] 基础渲染：RectShape → PixiJS Graphics
- [ ] 基础渲染：TextShape → PixiJS Text
- [ ] 基础渲染：LineShape → PixiJS Graphics (贝塞尔曲线)

##### Yjs 基础
- [ ] DocumentManager 已有 Yjs 集成（shapes/bindings/groups）
- [ ] 添加 `diagrams: Y.Map` 到 Y.Doc
- [ ] PixiJS 订阅 DocumentManager 变更事件 → 自动重新渲染

**验收**：在浏览器中看到 PixiJS 画布，可以平移缩放，手动创建 Shape 能渲染

---

#### Week 3-4: DiagramDocumentManager + 布局引擎 + AI 基础

**目标**：AI 生成流程图并显示

##### DiagramDocumentManager
- [ ] `packages/collaboration-core/src/DiagramDocumentManager.ts`
- [ ] `createDiagram(type, metadata)` — 创建 Diagram + Group
- [ ] `addNode(diagramId, nodeData)` — 创建 DiagramNode + Shape，记录映射
- [ ] `addEdge(diagramId, edgeData)` — 创建 DiagramEdge + Binding + LineShape
- [ ] `removeNode / removeEdge` — 级联删除
- [ ] `updateNodeLabel(diagramId, nodeId, label)` — 更新语义 + Shape 文本
- [ ] `setPositionOverride(diagramId, nodeId, x, y)` — 记录手动位置
- [ ] `deleteDiagram(diagramId)` — 删除 Diagram + 所有关联 Shapes/Bindings/Group
- [ ] `getDiagramByShapeId(shapeId)` — 反查：Shape 属于哪个 Diagram
- [ ] `buildSemanticContext(diagramId)` — 生成 AI 可读的文本描述
- [ ] 完整的单元测试

##### 布局引擎
- [ ] `packages/layout-engine/` — 新建 package
- [ ] `LayoutEngine` 接口：`compute(nodes, edges, overrides) → Map<nodeId, {x, y}>`
- [ ] `DagreLayout` 实现：集成 dagre.js
- [ ] 布局结果通过 DiagramDocumentManager 写入 Shape.x/y
- [ ] 单元测试

##### AI Agent 基础
- [ ] `packages/agent-sdk/` — 新建 package
- [ ] `BaseAgent` 抽象类
- [ ] `LLMProvider` 接口 + `ClaudeProvider` 实现
- [ ] `DiagramGeneratorAgent` — 流程图生成
  - [ ] System Prompt 设计（输出 JSON Schema）
  - [ ] 解析 LLM 返回的 JSON
  - [ ] 调用 DiagramDocumentManager 创建 Diagram
  - [ ] 调用布局引擎计算位置
- [ ] 单元测试（mock LLM 响应）

**验收**：调用 DiagramGeneratorAgent("创建一个登录流程图") → 画布上显示流程图

---

#### Week 5-6: 编辑交互 + 多轮对话

**目标**：可手动编辑 + AI 对话式调整

##### 画布编辑
- [ ] 选择工具：点击选中 Shape，显示选中框
- [ ] 框选工具：拖拽区域多选
- [ ] 拖拽移动：选中后拖拽
- [ ] **关键**：拖拽时检测是否属于 Diagram → 写入 positionOverride
- [ ] 双击编辑：双击 Shape 进入文本编辑 → 更新 DiagramNode.label + Shape 文本
- [ ] 删除：选中后 Delete 键
- [ ] 撤销/重做：Yjs UndoManager 集成

##### 多轮对话
- [ ] `DiagramDocumentManager.addConversationTurn()` — 记录对话历史
- [ ] `DiagramGeneratorAgent` 支持多轮对话
  - [ ] 将 conversation history 加入 LLM context
  - [ ] 将当前 Diagram 状态加入 LLM context（通过 buildSemanticContext）
  - [ ] 支持增量操作：add/remove/update nodes/edges
- [ ] AI 修改时尊重 positionOverrides（不移动用户拖拽过的节点）

##### Chat UI
- [ ] `apps/web/src/components/chat/ChatPanel.tsx` — 聊天面板
- [ ] 消息列表 + 输入框
- [ ] 流式响应显示
- [ ] 加载状态

**验收**：
1. AI 生成图 → 用户拖拽节点 → 位置保持
2. 用户继续对话 "添加密码重置分支" → 图更新，之前拖拽的节点不动
3. 撤销/重做正常工作

---

#### Week 7-8: 实时协作 + 连线工具

**目标**：两个浏览器窗口实时同步

##### 协作
- [ ] WebSocket 服务（Go 或 y-websocket-server）
- [ ] Yjs WebSocket Provider 集成
- [ ] 多人光标：Awareness protocol
- [ ] 协同编辑测试：两个窗口同时操作

##### 画布功能完善
- [ ] 连线工具：手动创建两个节点之间的连接
- [ ] 样式面板：颜色、边框、字体
- [ ] 对齐/分布工具
- [ ] 导出：PNG / SVG

**验收**：两个浏览器窗口实时同步所有操作（AI 生成、拖拽、编辑）

---

#### Week 9-10: 扩展图表类型

**目标**：支持 4 种图表

##### 架构图 (Architecture Diagram)
- [ ] `packages/types/src/diagrams/architecture.ts` — ArchitectureNode, ArchitectureEdge
  - semanticType: 'service' | 'database' | 'queue' | 'gateway' | 'client'
- [ ] Force-directed 布局（d3-force）
- [ ] Agent 支持架构图生成
- [ ] 嵌套容器支持（微服务分组）

##### 时序图 (Sequence Diagram)
- [ ] `packages/types/src/diagrams/sequence.ts` — SequenceNode (Actor), SequenceEdge (Message)
  - semanticType: 'actor' | 'system'
  - edgeType: 'sync' | 'async' | 'return'
- [ ] Timeline 布局算法（自定义）
- [ ] 特殊渲染：生命线（竖线）、消息箭头
- [ ] Agent 支持时序图生成

---

#### Week 11-12: 类图 + 打磨

##### 类图 (Class Diagram)
- [ ] `packages/types/src/diagrams/class-diagram.ts` — ClassNode, ClassEdge
  - semanticType: 'class' | 'interface' | 'enum'
  - edgeType: 'extends' | 'implements' | 'has' | 'uses'
- [ ] ELK 布局集成
- [ ] UML 符号渲染（方法列表、属性列表）
- [ ] Agent 支持类图生成

##### 打磨
- [ ] UI 完善：Radix UI 组件
- [ ] 性能优化：viewport culling（只渲染可见区域）
- [ ] E2E 测试：核心用户流程
- [ ] 文档：ARCHITECTURE.md, DIAGRAMS.md

---

### Phase 1 验收标准

| # | 验收项 | 标准 |
|---|--------|------|
| 1 | AI 生成 | 输入 "创建登录流程图" → 显示完整流程图 |
| 2 | 多轮对话 | 继续输入 "添加密码重置" → 图正确更新 |
| 3 | 手动编辑 | 拖拽节点后位置保持，AI 再次更新不覆盖 |
| 4 | 4 种图表 | Flowchart / Architecture / Sequence / Class 均可生成 |
| 5 | 实时协作 | 两个浏览器窗口实时同步所有操作 |
| 6 | 撤销重做 | Ctrl+Z / Ctrl+Shift+Z 正常工作 |

---

### Phase 2: 扩展 + 深度 (3-6 月)

- [ ] 自研 CRDT (Rust YATA → WASM)
- [ ] 扩展领域：Wireframe, Mind Map
- [ ] 智能整理 Agent（自动分组、布局优化）
- [ ] 手绘识别 (Vision API)
- [ ] 性能优化：虚拟化渲染、Web Worker 布局
- [ ] Go-Rust gRPC 集成
- [ ] GitHub 双向同步
- [ ] 完整技术文档 + 博客

---

## LLM 交互设计

### AI Context 格式

```typescript
function buildSemanticContext(diagram: Diagram): string {
  const nodes = Object.values(diagram.nodes)
  const edges = Object.values(diagram.edges)

  return `
## Diagram: ${diagram.metadata.title}
Type: ${diagram.type}

### Nodes:
${nodes.map(n => `- [${n.id}] ${n.semanticType}: "${n.label}"${n.description ? ` (${n.description})` : ''}`).join('\n')}

### Connections:
${edges.map(e => {
  const from = diagram.nodes[e.fromNodeId]
  const to = diagram.nodes[e.toNodeId]
  return `- "${from.label}" --${e.label || e.semanticType}--> "${to.label}"`
}).join('\n')}

### User Adjustments:
${Object.keys(diagram.positionOverrides).length} nodes have been manually repositioned.
`
}
```

### LLM 输出 JSON Schema

```json
{
  "action": "create | modify",
  "reasoning": "string - 解释做了什么改动",
  "nodes": {
    "add": [{ "tempId": "new1", "semanticType": "process", "label": "验证密码" }],
    "remove": ["existingNodeId"],
    "update": [{ "id": "existingNodeId", "label": "新标签" }]
  },
  "edges": {
    "add": [{ "fromNodeId": "node1|new1", "toNodeId": "node2|new2", "semanticType": "flow", "label": "yes" }],
    "remove": ["existingEdgeId"]
  }
}
```

**关键设计**：
- `tempId` 用于新节点，edges 可以引用 tempId 和现有 nodeId
- `modify` action 支持增量更新，不需要重新生成整个图
- `reasoning` 字段用于 chat 显示

---

## 关键设计模式

### 1. DiagramDocumentManager 与 DocumentManager 的关系

```typescript
class DiagramDocumentManager {
  constructor(
    private documentManager: DocumentManager,  // 管理 Shapes/Bindings/Groups
    private diagramsMap: Y.Map<string>         // diagrams Y.Map
  ) {}

  // 创建节点时：同时创建 DiagramNode（语义）和 Shape（几何）
  addNode(diagramId: DiagramId, data: { semanticType, label }): DiagramNodeId {
    // 1. 创建 Shape（几何渲染）
    const shape = this.documentManager.addShape({
      type: 'rect',
      x: 0, y: 0,     // 布局引擎稍后填入
      width: 160, height: 60,
      props: { text: data.label }
    })

    // 2. 创建 DiagramNode（语义引用）
    const node: DiagramNode = {
      id: createDiagramNodeId(),
      shapeId: shape.id,
      semanticType: data.semanticType,
      label: data.label
    }

    // 3. 写入 Diagram
    const diagram = this.getDiagram(diagramId)
    diagram.nodes[node.id] = node
    this.updateDiagram(diagram)

    return node.id
  }
}
```

### 2. Shape 反查 Diagram

```typescript
// 用户拖拽 Shape 时，需要知道它是否属于某个 Diagram
getDiagramByShapeId(shapeId: ShapeId): { diagram: Diagram, node: DiagramNode } | null {
  for (const diagram of this.getAllDiagrams()) {
    for (const node of Object.values(diagram.nodes)) {
      if (node.shapeId === shapeId) {
        return { diagram, node }
      }
    }
  }
  return null
}
```

> 优化：如果性能不够，维护一个本地 `Map<ShapeId, DiagramId>` 索引。

### 3. 布局引擎接口

```typescript
interface LayoutEngine {
  compute(input: LayoutInput): LayoutOutput
}

interface LayoutInput {
  nodes: Array<{ id: string; width: number; height: number }>
  edges: Array<{ from: string; to: string }>
  overrides: Map<string, { x: number; y: number }>  // 跳过这些节点
}

interface LayoutOutput {
  positions: Map<string, { x: number; y: number }>   // 只包含需要更新位置的节点
}
```

---

## 关键风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| LLM 输出格式不稳定 | 解析失败 | JSON Schema 约束 + 重试 + fallback |
| 布局引擎性能（大图） | 卡顿 | Web Worker + 增量布局 + 节点上限警告 |
| Yjs 内存占用（对话历史） | OOM | conversation 定期压缩，只保留最近 N 轮 |
| PixiJS + React 集成复杂 | 状态不同步 | PixiJS 自己管理渲染循环，React 只负责 UI 外壳 |
| Shape 反查 Diagram 性能 | 拖拽卡顿 | 维护本地索引 Map |
