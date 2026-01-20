# Mind-Fuse 白板项目技术方案

## 项目定位

**Mind-Fuse** 是一个技术优先的开源协作白板项目。核心目标：

1. **AI 原生**：Semantic-First 架构，支持 AI 生成流程图、架构图、时序图、类图
2. **技术深度**：自研 CRDT 算法，深入理解分布式协作原理
3. **工程质量**：现代化的多语言架构（Go + Rust + TypeScript）
4. **开发者友好**：清晰的架构设计，完整的技术文档

---

## 核心技术策略

### 务实的阶段性方案

```
Phase 1 (MVP, 3-4月)           Phase 2 (深度优化, 3-6月)
─────────────────────────────────────────────────────
CRDT:    Yjs (快速验证)    →   自研 CRDT (Rust)
后端:    Go                →   Go + Rust (gRPC)
前端:    PixiJS             →   PixiJS (优化)
Agent:   内容生成           →   + 智能整理 + 手绘识别
```

**关键设计原则**：
- ✅ Phase 1 使用成熟技术快速验证，通过**抽象层**预留自研接口
- ✅ Go 负责业务逻辑，Rust 负责性能关键路径（CRDT、算法）
- ✅ **Agent 前置**：渲染引擎完成后立即开发 Agent，让 Agent 成为画布的第一个"用户"
- ✅ 每个阶段都有明确的技术学习目标和可演示成果

---

## 技术栈

### 前端

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **框架** | Next.js 15 | SSR、Turbopack、性能优化 |
| **渲染引擎** | PixiJS v8 (WebGL + WebGPU) | 高性能、支持 WebGPU、适合白板场景 |
| **状态管理** | Zustand | 轻量、现代、适合 CRDT 集成 |
| **CRDT (Phase 1)** | Yjs | 成熟稳定、快速验证 |
| **CRDT (Phase 2)** | 自研 (Rust WASM) | 完全控制、性能优化 |
| **样式** | vanilla-extract | 类型安全、零运行时 |
| **组件库** | Radix UI + shadcn/ui | 无样式、可定制、可访问性好 |
| **测试** | Vitest + Playwright | 单元测试 + E2E 测试 |

### 后端

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **Go 框架** | Huma v2 | OpenAPI 原生、自动生成文档和 TS 类型 |
| **WebSocket** | nhooyr.io/websocket | 现代化、兼容 y-websocket |
| **数据库** | PostgreSQL + pgvector | 关系型 + 向量搜索 |
| **数据库客户端** | sqlc | 代码生成、类型安全 |
| **缓存** | Dragonfly | Redis 兼容、高性能 |
| **日志** | slog (标准库) | Go 1.21+ 原生 |

### Rust

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **CRDT 实现** | 自研 (YATA 算法) | 学习目标、性能优化 |
| **WASM** | wasm-bindgen | 标准、生态好 |
| **gRPC** | tonic | 纯 Rust、异步友好 |
| **测试** | proptest + criterion | 属性测试 + 性能基准 |

### AI / Agent

| 能力 | Phase 1 | Phase 2 |
|------|---------|---------|
| **内容生成 Agent** | LLM (Claude/GPT-4) 文本→图表 | 多轮对话、流式生成 |
| **智能整理 Agent** | - | 自动分组、布局优化 |
| **智能布局** | Rust WASM (力导向图) | 优化 + 层次布局 |
| **手绘识别** | - | OpenAI Vision API |

---

## 目录结构

```
mind-fuse/
├── apps/
│   ├── web/                    # Next.js 前端应用
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   ├── components/     # React 组件
│   │   │   ├── canvas/         # 画布渲染
│   │   │   ├── editor/         # 编辑器逻辑
│   │   │   └── stores/         # 状态管理
│   │   └── package.json
│   │
│   ├── api-go/                 # Go 后端服务
│   │   ├── cmd/server/         # 服务入口
│   │   ├── internal/           # 业务逻辑
│   │   │   ├── auth/           # 认证授权
│   │   │   ├── workspace/      # 工作空间
│   │   │   ├── realtime/       # WebSocket
│   │   │   └── ai/             # AI 服务
│   │   └── go.mod
│   │
│   ├── crdt-server/            # Rust CRDT 服务 (Phase 2)
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── grpc/           # gRPC 服务
│   │   │   └── crdt/           # CRDT 实现
│   │   └── Cargo.toml
│   │
│   └── docs/                   # 文档站
│       ├── docs/
│       │   ├── architecture/   # 架构文档
│       │   ├── crdt/           # CRDT 原理
│       │   └── ai/             # AI 设计
│       └── blog/               # 技术博客
│
├── packages/                   # TypeScript 包
│   ├── types/                  # 共享类型定义
│   ├── utils/                  # 工具函数
│   ├── store/                  # 状态管理核心
│   ├── canvas-operations/      # 画布操作 API ⭐ (Agent 和用户共用)
│   │   ├── src/
│   │   │   ├── operations.ts   # createElement, connect, layout...
│   │   │   ├── element.ts      # 语义化元素定义
│   │   │   └── index.ts
│   │   └── package.json
│   ├── agent-sdk/              # Agent 开发框架 ⭐
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── agent.ts          # Agent 基类
│   │   │   │   ├── intent.ts         # 意图解析
│   │   │   │   └── executor.ts       # 执行器
│   │   │   ├── agents/
│   │   │   │   ├── content-generator.ts   # 内容生成 Agent
│   │   │   │   └── auto-organizer.ts      # 智能整理 Agent
│   │   │   ├── llm/
│   │   │   │   ├── provider.ts       # LLM 抽象
│   │   │   │   ├── claude.ts
│   │   │   │   └── openai.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── collaboration/          # 协同抽象层
│   │   ├── src/
│   │   │   ├── adapter/
│   │   │   │   ├── yjs.ts      # Yjs 适配器
│   │   │   │   └── wasm.ts     # 自研适配器
│   │   │   └── types.ts        # 统一接口
│   │   └── package.json
│   ├── editor/                 # 编辑器核心
│   │   ├── src/
│   │   │   ├── Editor.ts
│   │   │   ├── tools/          # 工具系统
│   │   │   └── renderer/       # 渲染模块
│   │   └── package.json
│   └── ai-algorithms/          # AI 算法接口 (布局等)
│       ├── src/
│       │   ├── layout/         # 布局算法
│       │   └── recognition/    # 识别功能
│       └── package.json
│
├── crates/                     # Rust 工作空间
│   ├── crdt-core/              # CRDT 核心实现 ⭐
│   │   ├── src/
│   │   │   ├── yata/           # YATA 算法
│   │   │   ├── document.rs
│   │   │   └── sync/
│   │   ├── tests/
│   │   └── benches/
│   │
│   ├── crdt-wasm/              # WASM 绑定 ⭐
│   │   ├── src/lib.rs
│   │   └── Cargo.toml
│   │
│   ├── ai-layout/              # AI 布局算法 ⭐
│   │   ├── src/
│   │   │   ├── force_directed/ # 力导向图
│   │   │   ├── hierarchical/   # 层次布局
│   │   │   └── wasm.rs         # WASM 导出
│   │   └── Cargo.toml
│   │
│   └── geometry/               # 几何计算库
│       ├── src/
│       │   ├── shapes/
│       │   └── collision/
│       └── Cargo.toml
│
├── docs/                       # 项目文档
│   ├── ARCHITECTURE.md         # 整体架构 ⭐
│   ├── CRDT.md                 # CRDT 设计 ⭐
│   ├── AI.md                   # AI 架构 ⭐
│   └── PERFORMANCE.md          # 性能优化
│
├── scripts/                    # 工具脚本
│   ├── dev.sh                  # 启动开发环境
│   ├── build-wasm.sh           # 构建 WASM
│   └── test-all.sh             # 运行所有测试
│
├── pnpm-workspace.yaml
├── go.work
├── Cargo.toml
├── docker-compose.yml
└── README.md
```

---

## 核心模块设计

### 1. CRDT 抽象层 ⭐

**目标**：Phase 1 使用 Yjs，Phase 2 无缝切换到自研 CRDT，应用层代码零改动。

#### 统一接口

```typescript
// packages/collaboration/src/types.ts

export interface CRDTAdapter {
  // 文档操作
  insert(position: number, content: any): Update;
  delete(range: { start: number; end: number }): Update;
  updateAttributes(id: string, attrs: any): Update;

  // 同步
  onUpdate(callback: (update: Uint8Array) => void): Unsubscribe;
  applyUpdate(update: Uint8Array): void;
  getStateVector(): Uint8Array;
  getSnapshot(): any;

  // 连接
  connect(url: string): Promise<void>;
  disconnect(): void;
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting';

  // Awareness（多人状态）
  setLocalState(state: UserState): void;
  getStates(): Map<number, UserState>;
  onStatesChange(callback: (states: Map<number, UserState>) => void): Unsubscribe;
}
```

#### 工厂函数

```typescript
// packages/collaboration/src/index.ts

export function createCRDTClient(config: {
  type: 'yjs' | 'wasm';
  clientId?: number;
}): CRDTAdapter {
  switch (config.type) {
    case 'yjs':
      return new YjsAdapter(config.clientId);
    case 'wasm':
      return new WasmAdapter(config.clientId!);
  }
}
```

#### 切换方式

```bash
# .env.local

# Phase 1: 使用 Yjs
NEXT_PUBLIC_CRDT_TYPE=yjs

# Phase 2: 切换到自研
NEXT_PUBLIC_CRDT_TYPE=wasm
```

**优势**：
- ✅ 应用代码完全不需要改动
- ✅ 环境变量一键切换
- ✅ 可以 A/B 测试性能对比

---

### 2. Canvas Operations API ⭐

**目标**：统一的画布操作接口，Agent 和用户都通过这个 API 操作画布。

#### 语义化元素模型

```typescript
// packages/canvas-operations/src/element.ts

export interface Element {
  id: string;
  type: ElementType;

  // 几何信息（渲染用）
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };

  // 样式信息
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    // ...
  };

  // 语义信息（Agent 需要）⭐
  semantic: {
    label?: string;              // "用户注册步骤"
    category?: string;           // "process-step" | "decision" | "start" | "end"
    description?: string;
    relations?: Array<{
      targetId: string;
      type: 'next' | 'branch' | 'reference';
    }>;
    metadata?: Record<string, any>;
  };

  // 来源追踪
  source: {
    type: 'user' | 'agent';
    agentId?: string;
    generatedFrom?: string;      // 如果是 Agent 生成的，原始 prompt
    timestamp: number;
  };
}
```

#### 操作接口

```typescript
// packages/canvas-operations/src/operations.ts

export interface CanvasOperations {
  // 基础 CRUD
  createElement(type: ElementType, props: Partial<Element>): Element;
  updateElement(id: string, updates: Partial<Element>): void;
  deleteElement(id: string): void;
  getElement(id: string): Element | null;
  getAllElements(): Element[];

  // 批量操作（Agent 常用）
  batchCreate(elements: Array<Partial<Element>>): Element[];
  batchUpdate(updates: Array<{ id: string; updates: Partial<Element> }>): void;
  batchDelete(ids: string[]): void;

  // 语义操作
  connect(fromId: string, toId: string, type?: ConnectionType): Connection;
  group(elementIds: string[], label?: string): Group;
  ungroup(groupId: string): Element[];

  // 布局操作
  autoLayout(elementIds: string[], algorithm: LayoutAlgorithm): void;
  align(elementIds: string[], alignment: Alignment): void;
  distribute(elementIds: string[], direction: 'horizontal' | 'vertical'): void;

  // 查询
  findByLabel(label: string): Element[];
  findByCategory(category: string): Element[];
  findConnected(elementId: string): Element[];
}
```

**设计原则**：
- ✅ Agent 和用户使用相同的 API，保证一致性
- ✅ 元素包含语义信息，Agent 可以"理解"画布内容
- ✅ 批量操作优化，适合 Agent 一次性生成多个元素

---

### 3. Agent SDK ⭐

**目标**：提供 Agent 开发框架，支持快速开发新的 Agent。

#### Agent 基类

```typescript
// packages/agent-sdk/src/core/agent.ts

export abstract class BaseAgent {
  protected canvas: CanvasOperations;
  protected llm: LLMProvider;

  constructor(canvas: CanvasOperations, llm: LLMProvider) {
    this.canvas = canvas;
    this.llm = llm;
  }

  // 子类实现
  abstract get name(): string;
  abstract get description(): string;
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  // 可选：流式执行
  async *executeStream(input: AgentInput): AsyncIterable<AgentEvent> {
    const result = await this.execute(input);
    yield { type: 'complete', result };
  }
}
```

#### 内容生成 Agent

```typescript
// packages/agent-sdk/src/agents/content-generator.ts

export class ContentGeneratorAgent extends BaseAgent {
  name = 'content-generator';
  description = '根据文本描述生成图表';

  async execute(input: { prompt: string }): Promise<AgentOutput> {
    // 1. 调用 LLM 解析用户意图
    const structure = await this.llm.chat({
      messages: [
        { role: 'system', content: CONTENT_GENERATOR_SYSTEM_PROMPT },
        { role: 'user', content: input.prompt }
      ],
      responseFormat: { type: 'json_object' }
    });

    // 2. 解析 LLM 返回的结构
    const { nodes, connections } = JSON.parse(structure);

    // 3. 批量创建元素
    const elements = this.canvas.batchCreate(
      nodes.map(node => ({
        type: node.type,
        geometry: node.position,
        semantic: {
          label: node.label,
          category: node.category
        },
        source: {
          type: 'agent',
          agentId: this.name,
          generatedFrom: input.prompt
        }
      }))
    );

    // 4. 创建连接
    connections.forEach(conn => {
      this.canvas.connect(
        elements[conn.fromIndex].id,
        elements[conn.toIndex].id,
        conn.type
      );
    });

    // 5. 自动布局
    this.canvas.autoLayout(elements.map(e => e.id), 'force-directed');

    return { elements, connections };
  }
}
```

#### LLM Provider 抽象

```typescript
// packages/agent-sdk/src/llm/provider.ts

export interface LLMProvider {
  chat(request: ChatRequest): Promise<string>;
  chatStream(request: ChatRequest): AsyncIterable<string>;
}

// packages/agent-sdk/src/llm/claude.ts
export class ClaudeProvider implements LLMProvider {
  constructor(private apiKey: string) {}

  async chat(request: ChatRequest): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: request.messages
      })
    });
    // ...
  }
}
```

---

### 4. AI 布局算法 (Rust WASM) ⭐

#### 力导向图实现

```rust
// crates/ai-layout/src/force_directed/mod.rs

pub struct Node {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
}

pub struct ForceDirectedLayout {
    nodes: Vec<Node>,
    edges: Vec<Edge>,
    config: LayoutConfig,
}

impl ForceDirectedLayout {
    pub fn compute(&mut self) -> Vec<Node> {
        for _ in 0..self.config.iterations {
            self.apply_forces();
            self.update_positions();
        }
        self.nodes.clone()
    }

    fn apply_forces(&mut self) {
        // 斥力（所有节点之间）
        // 引力（边连接的节点）
    }
}

// WASM 导出
#[wasm_bindgen]
pub fn layout_force_directed(
    nodes_json: &str,
    edges_json: &str,
    config_json: &str,
) -> String {
    // ...
}
```

#### TypeScript 调用

```typescript
// packages/ai-sdk/src/layout/force-directed.ts

import init, { layout_force_directed } from '@mind-fuse/ai-layout-wasm';

export async function forceDirectedLayout(
  nodes: Node[],
  edges: Edge[],
  config?: LayoutConfig
): Promise<Node[]> {
  await init();

  const result = layout_force_directed(
    JSON.stringify(nodes),
    JSON.stringify(edges),
    JSON.stringify(config)
  );

  return JSON.parse(result);
}
```

**性能目标**：比纯 JS 实现快 5-10 倍

---

### 5. Go-Rust 集成 (Phase 2) ⭐

#### Protocol Buffers 定义

```protobuf
// crates/protocol/proto/crdt.proto

service CRDTService {
  rpc ApplyUpdate(ApplyUpdateRequest) returns (ApplyUpdateResponse);
  rpc GetSnapshot(GetSnapshotRequest) returns (GetSnapshotResponse);
  rpc Subscribe(SubscribeRequest) returns (stream UpdateEvent);
}
```

#### Rust 服务端

```rust
// apps/crdt-server/src/grpc/service.rs

use tonic::{Request, Response, Status};

pub struct MyCRDTService {
    store: Arc<DocumentStore>,
}

#[tonic::async_trait]
impl CrdtService for MyCRDTService {
    async fn apply_update(&self, req: Request<ApplyUpdateRequest>)
        -> Result<Response<ApplyUpdateResponse>, Status> {
        // 应用 CRDT 更新
    }
}
```

#### Go 客户端

```go
// apps/api-go/internal/crdt/client.go

type Client struct {
    conn   *grpc.ClientConn
    client pb.CRDTServiceClient
}

func (c *Client) ApplyUpdate(ctx context.Context, docID, update []byte) error {
    resp, err := c.client.ApplyUpdate(ctx, &pb.ApplyUpdateRequest{
        DocumentId: docID,
        Update:     update,
    })
    return err
}
```

---

### 6. AI 手绘识别 (Phase 2) ⭐

```typescript
// packages/ai-sdk/src/recognition/sketch.ts

export async function recognizeSketch(
  canvas: HTMLCanvasElement
): Promise<RecognizedShape[]> {
  // 1. Canvas 转 Base64
  const imageData = canvas.toDataURL('image/png');

  // 2. 调用 OpenAI Vision API
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "识别这张手绘图中的形状（矩形、圆形、箭头等）" },
        { type: "image_url", image_url: { url: imageData } }
      ]
    }]
  });

  // 3. 解析返回的形状描述
  const shapes = parseShapeDescription(response.choices[0].message.content);

  return shapes;
}
```

**应用场景**：
- 用户手绘草图 → 一键转换为精确图形
- 保留原始笔迹作为"草稿层"（可选）

---

## AI / Agent 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面                              │
│   ┌─────────────────┐       ┌─────────────────────────┐     │
│   │   手动编辑操作    │       │   Agent 命令面板 (/)    │     │
│   └────────┬────────┘       └───────────┬─────────────┘     │
│            │                            │                    │
│            ▼                            ▼                    │
│   ┌─────────────────────────────────────────────────────┐   │
│   │            Canvas Operations API                     │   │
│   │   createElement / connect / autoLayout / ...         │   │
│   └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│            ┌───────────────┼───────────────┐                │
│            ▼               ▼               ▼                │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   渲染层     │  │   CRDT 层   │  │  Agent SDK  │        │
│   │  (PixiJS)   │  │   (Yjs)     │  │             │        │
│   └─────────────┘  └─────────────┘  └──────┬──────┘        │
│                                            │                 │
│                          ┌─────────────────┼─────────────┐  │
│                          ▼                 ▼             ▼  │
│                    ┌──────────┐    ┌──────────┐   ┌───────┐│
│                    │ 内容生成  │    │ 智能整理  │   │ ...  ││
│                    │  Agent   │    │  Agent   │   │      ││
│                    └────┬─────┘    └────┬─────┘   └───────┘│
│                         │               │                   │
│                         ▼               ▼                   │
│                    ┌─────────────────────────┐              │
│                    │      LLM Provider       │              │
│                    │  (Claude / OpenAI)      │              │
│                    └─────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Agent 类型规划

| Agent | Phase | 核心能力 | 技术实现 |
|-------|-------|---------|---------|
| **内容生成** | Phase 1 | 文本 → 结构化图表 | LLM + 结构化输出 |
| **智能整理** | Phase 2 | 分析 → 分组 → 布局 | LLM + 聚类算法 |
| **手绘识别** | Phase 2 | 草图 → 精确图形 | Vision API |
| **会议助手** | 未来 | 实时总结、Action Items | LLM + 流式处理 |

### Agent SDK 设计原则

```typescript
// 1. 所有 Agent 通过统一的 Canvas Operations API 操作画布
// 2. LLM Provider 可替换（Claude、OpenAI、本地模型）
// 3. 支持流式执行，边生成边渲染
// 4. Agent 操作与用户操作一样，会同步给其他协作者
```

**核心优势**：
- ✅ Agent 是一等公民，不是后加的功能
- ✅ 统一的操作接口，保证一致性
- ✅ 可扩展的 Agent SDK，方便开发新 Agent
- ✅ 支持多 LLM Provider，不绑定特定服务商

---

## AI 图表生成架构设计 ⭐⭐⭐

### 核心架构：Semantic-First, Geometry-Derived

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户界面                                     │
│   ┌──────────────┐              ┌─────────────────────────────────┐ │
│   │  AI 聊天面板  │              │      Canvas (PixiJS)            │ │
│   │  自然语言输入 │              │      拖拽编辑 / 渲染            │ │
│   └──────┬───────┘              └────────────────▲────────────────┘ │
│          │                                       │                   │
│          │ (1) 用户请求                          │ (6) 渲染          │
│          ▼                                       │                   │
│   ┌──────────────┐                               │                   │
│   │   AI Agent   │                               │                   │
│   │ (Claude/GPT) │                               │                   │
│   └──────┬───────┘                               │                   │
│          │                                       │                   │
│          │ (2) 结构化 JSON                       │                   │
│          ▼                                       │                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │            SEMANTIC LAYER (Source of Truth)                 │   │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │  DiagramDocument                                      │  │   │
│   │  │  - nodes: Map<NodeId, SemanticNode>                  │  │   │
│   │  │  - edges: Map<EdgeId, SemanticEdge>                  │  │   │
│   │  │  - positionOverrides: Map<NodeId, ManualPosition>    │  │   │
│   │  │  - conversation: ConversationTurn[]                  │  │   │
│   │  └───────────────────────────────────────────────────────┘  │   │
│   │                           │                                  │   │
│   │                           │ (3) Yjs CRDT 同步                │   │
│   └───────────────────────────┼──────────────────────────────────┘   │
│                               │                                      │
│                               │ (4) 布局计算                         │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    LAYOUT ENGINE                             │   │
│   │  Flowchart: Dagre | Architecture: Force | Sequence: Timeline │   │
│   └───────────────────────────┬──────────────────────────────────┘   │
│                               │                                      │
│                               │ (5) 生成位置                         │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              GEOMETRY CACHE (Derived - 不同步)               │   │
│   │  - nodeGeometry: Map<NodeId, {x, y, width, height}>         │   │
│   │  - edgePaths: Map<EdgeId, PathData>                         │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 数据模型分层

| 层级 | 数据 | 同步方式 | 用途 |
|------|------|----------|------|
| **Semantic Layer** | DiagramDocument (节点、边、语义信息) | Yjs CRDT | AI 理解、多人协作 |
| **Position Overrides** | 用户手动拖拽的位置 | Yjs CRDT (在 Semantic 中) | 保留用户调整 |
| **Geometry Cache** | 计算后的坐标、路径 | 本地派生 (不同步) | 渲染用 |

### 手动拖拽处理

```typescript
// 用户拖拽节点时
if (shape 是 diagram 的一部分) {
  // 更新 semantic model 中的 positionOverrides
  diagram.positionOverrides.set(nodeId, { x, y, lockedAt: now })
  // positionOverrides 会通过 CRDT 同步
} else {
  // 普通 shape，直接更新坐标
}
```

### 布局更新策略

| 操作 | 布局行为 |
|------|----------|
| AI 添加/删除节点 | 全量重新布局 |
| AI 修改节点内容 | 部分重新布局 |
| 用户拖拽节点 | **不重新布局**，记录 override |
| 用户切换布局算法 | 清除 overrides，全量重新布局 |

### Semantic 数据模型 (Flowchart 示例)

```typescript
// packages/types/src/diagrams/flowchart.ts

interface FlowchartDocument {
  id: DiagramId
  type: 'flowchart'
  metadata: {
    title: string
    layoutAlgorithm: 'dagre' | 'elk'
  }
  // 语义结构 (AI 可理解)
  nodes: Map<DiagramNodeId, FlowchartNode>
  edges: Map<DiagramEdgeId, FlowchartEdge>
  // 用户手动调整的位置
  positionOverrides: Map<DiagramNodeId, ManualPosition>
  // 多轮对话历史
  conversation: ConversationTurn[]
}

interface FlowchartNode {
  id: DiagramNodeId
  semanticType: 'start' | 'end' | 'process' | 'decision' | 'data' | 'subprocess'
  label: string
  description?: string
}
```

### LLM 交互设计

**LLM 输出格式**（结构化 JSON）：

```json
{
  "action": "create | update | delete",
  "nodes": [
    { "id": null, "semanticType": "process", "label": "验证用户" }
  ],
  "edges": [
    { "fromNodeId": "node1", "toNodeId": "node2", "semanticType": "flow" }
  ],
  "reasoning": "添加了验证步骤"
}
```

### 支持的图表类型

| 图表类型 | 语义模型 | 布局算法 | Phase |
|----------|----------|----------|-------|
| **流程图 (Flowchart)** | nodes + edges + decision | Dagre | Phase 1 |
| **架构图 (Architecture)** | systems + services + deps | Force-directed | Phase 2 |
| **时序图 (Sequence)** | actors + messages | Timeline | Phase 2 |
| **类图 (Class)** | classes + relations | ELK | Phase 2 |

---

## 开发路线图

### Phase 1: 核心白板 MVP (3-4 个月)

**目标**：可演示的协作白板 + 1 个 AI 亮点

#### 技术栈
- 前端: Next.js + Yjs + PixiJS + vanilla-extract + Radix UI
- 后端: Go (Huma v2 + sqlc) + nhooyr.io/websocket
- AI: Rust WASM 智能布局
- 测试: Vitest + Playwright

#### 里程碑

**Week 1-2: 项目初始化 + 类型系统**
- [ ] 创建 monorepo 结构（pnpm workspace）
- [ ] 配置开发环境（Node.js、Go、Rust）
- [ ] 搭建 CI/CD（GitHub Actions）
- [ ] 配置 vanilla-extract + Vite
- [ ] **扩展类型系统**：添加 DiagramId, DiagramNodeId, DiagramEdgeId
- [ ] **定义语义模型**：FlowchartDocument, DiagramGeometryCache

**Week 3-4: 渲染引擎 + DiagramManager**
- [ ] PixiJS v8 集成（启用 WebGPU）
- [ ] 无限画布（viewport、zoom、pan）
- [ ] 基础图形渲染（矩形、圆形、线条、连接线）
- [ ] **DiagramDocumentManager**：集成 Yjs 同步语义模型
- [ ] **布局引擎**：集成 Dagre.js 用于流程图
- [ ] E2E 测试（canvas 截图对比）

**Week 5-6: AI 图表生成 Agent ⭐⭐⭐**
- [ ] Agent SDK 骨架（BaseAgent、LLMProvider）
- [ ] Claude/OpenAI API 集成
- [ ] **DiagramGeneratorAgent 实现**（支持 4 种图表类型）
- [ ] **LLM Context 序列化**（buildDiagramContext）
- [ ] Prompt 工程和结构化输出（JSON Schema）
- [ ] **多轮对话支持**（conversation history）
- [ ] Chat UI 面板（类似 Notion 的 /）
- [ ] 流式生成体验

**Week 7-8: 画布交互 + 双向绑定**
- [ ] 选择系统（单选、框选）
- [ ] **Shape 拖拽 → Semantic positionOverride**（双向绑定核心）
- [ ] **Semantic 变化 → Shape 更新**（自动重新布局）
- [ ] 节点编辑（双击修改 label）
- [ ] 连线工具
- [ ] 撤销/重做（基于 Yjs UndoManager）
- [ ] E2E 测试

**Week 9-10: 实时协作**
- [ ] Yjs 集成（通过 CRDT 抽象层）
- [ ] Go WebSocket 服务
- [ ] 多人光标/选择（Awareness）
- [ ] Agent 操作也同步给其他用户
- [ ] Dragonfly 缓存集成

**Week 11-12: 智能布局 + 打磨**
- [ ] Rust 力导向图算法实现
- [ ] WASM 编译和集成
- [ ] UI 组件完善（Radix UI + shadcn/ui）
- [ ] 性能优化
- [ ] README + ARCHITECTURE.md
- [ ] Demo 视频

#### 交付物
- ✅ 可用的白板应用
- ✅ 实时协作功能
- ✅ **AI 图表生成 Agent**（支持 4 种图表：流程图、架构图、时序图、类图）
- ✅ **多轮对话式调整**（conversational refinement）
- ✅ **Semantic-First 架构**（语义模型 + 自动布局）
- ✅ AI 智能布局（Rust WASM）
- ✅ 核心技术文档

---

### Phase 2: 技术深度 + AI 增强 (3-6 个月)

**目标**：自研 CRDT + 扩展 Agent 能力

#### 重点工作

**Month 4: 扩展图表类型 ⭐**
- [ ] **Architecture Diagram 语义模型**（systems, services, dependencies）
- [ ] **Force-directed 布局**（d3-force 或 Rust WASM）
- [ ] **Sequence Diagram 语义模型**（actors, messages, lifelines）
- [ ] **Timeline 布局算法**
- [ ] **Class Diagram 语义模型**（classes, attributes, methods）
- [ ] **ELK 布局集成**
- [ ] AI Agent 支持 4 种图表类型生成

**Month 5: 智能整理 Agent + 性能优化**
- [ ] 画布内容分析（聚类、关系识别）
- [ ] 自动分组和标签
- [ ] 布局优化建议
- [ ] **大图虚拟化渲染**（viewport culling）
- [ ] **布局计算 Web Worker**
- [ ] **增量布局**（避免全量重算）

**Month 6-7: 自研 CRDT**
- [ ] YATA 算法核心实现
- [ ] 完整测试套件（单元 + 属性测试）
- [ ] 性能基准（对比 Yjs）
- [ ] WASM 编译

**Month 6-7: 自研 CRDT**
- [ ] YATA 算法核心实现
- [ ] 完整测试套件（单元 + 属性测试）
- [ ] 性能基准（对比 Yjs）
- [ ] WASM 编译

**Month 8: Go-Rust 集成**
- [ ] Protocol Buffers 定义
- [ ] Rust gRPC 服务
- [ ] Go 客户端集成
- [ ] 集成测试

**Month 9: 并行运行 + 手绘识别**
- [ ] Yjs 和自研 CRDT 并存
- [ ] 环境变量切换
- [ ] OpenAI Vision API 集成
- [ ] 手绘 → 精确图形

**Month 10: 文档和博客**
- [ ] CRDT.md 详细文档
- [ ] DIAGRAMS.md AI 图表架构文档 ⭐
- [ ] AGENT.md Agent 架构说明
- [ ] 技术博客 3-4 篇

#### 交付物
- ✅ 自研 CRDT 达到生产可用
- ✅ **4 种图表类型完整支持**
- ✅ **智能整理 Agent**
- ✅ AI 手绘识别功能
- ✅ 完整技术文档（包括 DIAGRAMS.md）
- ✅ 性能对比报告

---

## 关键文档

### 必须有的技术文档

1. **README.md** - 项目概览
   - 项目介绍（What）
   - 技术栈（How）
   - 核心特性（3-5 个，带演示 GIF）
   - 快速开始

2. **ARCHITECTURE.md** - 整体架构
   - 系统架构图
   - 技术选型理由
   - 模块设计
   - 数据流

3. **CRDT.md** - CRDT 实现
   - CRDT 基础理论
   - YATA 算法原理
   - 实现细节
   - 性能测试结果

4. **DIAGRAMS.md** - AI 图表生成架构 ⭐
   - Semantic-First 架构设计
   - 数据模型分层（Semantic / Geometry）
   - 布局引擎策略
   - LLM 交互设计
   - 4 种图表类型详解

5. **AGENT.md** - Agent 架构设计
   - Agent SDK 设计
   - 已实现 Agent（图表生成、智能整理）
   - LLM Provider 抽象
   - 扩展指南

6. **AI.md** - AI 算法设计
   - 智能布局算法
   - 手绘识别
   - 未来扩展方向

7. **PERFORMANCE.md** - 性能优化
   - 性能指标
   - 优化策略
   - 测试报告

### 技术博客主题

1. **《AI 原生的图表生成：Semantic-First 架构实践》** ⭐
   - 为什么语义优先？
   - 双模型架构（Semantic + Geometry）
   - 手动编辑 vs AI 生成的平衡
   - 布局引擎选择与集成

2. **《为白板工具构建 AI Agent：从 Prompt 到图表》**
   - Agent 架构设计
   - LLM 结构化输出
   - 流式生成体验
   - Prompt 工程实践

3. **《从零实现白板的实时协作：CRDT 算法实践》**
   - CRDT 原理
   - YATA 算法详解
   - Rust 实现
   - 性能对比

4. **《用 Rust WASM 加速前端布局算法》**
   - 力导向图算法
   - Rust 实现和优化
   - WASM 集成
   - 性能提升分析

5. **《Go 和 Rust 的混合架构实践》**
   - 为什么需要多语言
   - gRPC 集成方案
   - 实战经验

---

## 开发环境

### 必需工具

- Node.js v20+
- pnpm v8+
- Go v1.21+
- Rust 1.75+
- wasm-pack
- Docker
- PostgreSQL v15+
- Dragonfly

### 快速启动

```bash
# 1. 安装依赖
pnpm install

# 2. 构建 Rust WASM
./scripts/build-wasm.sh

# 3. 启动 Docker 服务
docker-compose up -d

# 4. 启动所有服务
./scripts/dev.sh
```

---

## 技术选型理由

### 为什么选择这些技术？

#### 前端

**PixiJS v8**
- 已支持 WebGPU，性能优秀
- 生态成熟，文档完善
- 适合白板场景（大量图形渲染）

**vanilla-extract**
- 类型安全的 CSS-in-JS
- 零运行时开销
- 完美支持主题系统

**Radix UI**
- 无样式，完全可定制
- 优秀的可访问性
- 适合白板工具栏等 UI

#### 后端

**Huma v2**
- OpenAPI 原生支持
- 自动生成 TypeScript 类型
- 现代化的 Go 框架

**sqlc**
- 编译时类型检查
- 零运行时开销（无反射）
- 直接写 SQL，无 ORM 魔法

**Dragonfly**
- Redis 协议兼容
- 性能更好（Rust 实现）
- 内存使用更少

#### Rust

**自研 CRDT**
- 学习分布式系统核心原理
- 完全控制性能优化
- 可编译为 WASM（前端复用）

**WASM 布局算法**
- 计算密集型任务
- 比 JS 快 5-10 倍
- 展示 Rust-WASM 能力

---

## 总结

### 项目特点

1. **技术深度**
   - 自研 CRDT（不只是用 Yjs）
   - 多语言协同架构（Go + Rust + TS）
   - 性能优化（Rust WASM）

2. **AI 原生**
   - **Semantic-First 架构**：语义模型作为唯一真相源
   - **AI 图表生成**：支持流程图、架构图、时序图、类图
   - **多轮对话调整**：conversational refinement
   - **AI + 手动编辑**：双向绑定，无缝协作
   - 可扩展的 Agent SDK

3. **务实路线**
   - Phase 1 用成熟技术快速验证
   - Phase 2 自研核心模块
   - 抽象层保证平滑迁移

4. **工程质量**
   - 完整的测试（单元 + E2E）
   - 清晰的文档
   - 现代化的工具链

### 核心优势

- ✅ **AI 图表生成能力强大**：4 种图表类型，对话式调整，自动布局
- ✅ **Semantic-First 架构清晰**：语义模型 + 几何缓存，AI 和人类都能理解
- ✅ **技术栈现代且有深度**：不是简单的框架堆砌
- ✅ **架构设计合理**：分层清晰，职责明确
- ✅ **文档完整**：代码 + 文档 = 完整的技术展示

### 关键里程碑

| 时间点 | 里程碑 | 核心交付 |
|--------|--------|----------|
| Week 4 | 渲染引擎 + DiagramManager 完成 | 可渲染元素的画布 + 语义模型同步 |
| Week 6 | **AI 图表生成可用** ⭐⭐⭐ | 文本 → 4 种图表的完整链路 |
| Week 8 | 双向绑定完成 | AI 生成 + 手动编辑无缝协作 |
| Week 10 | 实时协作完成 | 多人同时编辑图表 |
| Month 4 | 4 种图表类型全部支持 | Flowchart + Architecture + Sequence + Class |
| Month 6 | 自研 CRDT | 核心技术深度 |

### 下一步行动

1. **本周**：初始化项目结构 + 扩展类型系统
2. **Week 1-2**：搭建基础框架 + 语义模型定义
3. **Week 3-4**：实现渲染引擎 + DiagramDocumentManager + 布局引擎
4. **Week 5-6**：实现 AI 图表生成 Agent ⭐⭐⭐
5. **持续**：编写技术文档和博客

---

**开始日期**：TBD
**Phase 1 目标**：3-4 个月完成核心 MVP
**Phase 2 目标**：6-9 个月完成技术深度优化

这是一个重技术、重质量的学习型项目，每个阶段都有明确的学习目标和可交付成果。
