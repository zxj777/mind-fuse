# Mind-Fuse 白板项目技术方案

## 项目定位

**Mind-Fuse** 是一个技术优先的开源协作白板项目。核心目标：

1. **技术深度**：自研 CRDT 算法，深入理解分布式协作原理
2. **工程质量**：现代化的多语言架构（Go + Rust + TypeScript）
3. **AI 增强**：智能布局和手绘识别等核心 AI 能力
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
AI:      智能布局           →   + 手绘识别
```

**关键设计原则**：
- ✅ Phase 1 使用成熟技术快速验证，通过**抽象层**预留自研接口
- ✅ Go 负责业务逻辑，Rust 负责性能关键路径（CRDT、算法）
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

### AI

| 能力 | Phase 1 | Phase 2 |
|------|---------|---------|
| **智能布局** | Rust WASM (力导向图) | 优化 + 层次布局 |
| **手绘识别** | - | OpenAI Vision API |
| **其他能力** | 架构预留 | 按需扩展 |

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
│   └── ai-sdk/                 # AI 功能接口
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

### 2. AI 布局算法 (Rust WASM) ⭐

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

### 3. Go-Rust 集成 (Phase 2) ⭐

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

### 4. AI 手绘识别 (Phase 2) ⭐

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

## AI 架构设计

### 整体架构

```
┌─────────────────────────────────────────────┐
│            AI 能力层（可扩展）                 │
├─────────────────────────────────────────────┤
│ 已实现：                                     │
│  • 智能布局 (Rust WASM)                      │
│  • 手绘识别 (OpenAI Vision)                  │
├─────────────────────────────────────────────┤
│ 架构预留（接口已设计，未实现）：               │
│  • 内容生成 (GPT-4)                          │
│  • 语义理解 (RAG + pgvector)                 │
│  • 会议助手 (实时总结)                        │
└─────────────────────────────────────────────┘
```

### AI SDK 接口设计

```typescript
// packages/ai-sdk/src/index.ts

export interface AIProvider {
  name: string;
  capabilities: AICapability[];
}

export type AICapability =
  | 'layout'          // 智能布局
  | 'recognition'     // 手绘识别
  | 'generation'      // 内容生成
  | 'summarization';  // 总结归纳

// 统一的 AI 客户端
export class AIClient {
  constructor(provider: AIProvider) {}

  // 智能布局
  async layoutNodes(nodes: Node[], edges: Edge[]): Promise<Node[]>;

  // 手绘识别
  async recognizeSketch(canvas: HTMLCanvasElement): Promise<Shape[]>;

  // 未来扩展
  async generateContent(prompt: string): Promise<Content>;
  async summarize(content: Content[]): Promise<Summary>;
}
```

**设计原则**：
- ✅ 接口优先，按需实现
- ✅ 支持多 Provider（OpenAI、Anthropic、本地模型）
- ✅ 展示架构设计能力，不需要全部实现

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

**Week 1-2: 项目初始化**
- [ ] 创建 monorepo 结构（pnpm workspace）
- [ ] 配置开发环境（Node.js、Go、Rust）
- [ ] 搭建 CI/CD（GitHub Actions）
- [ ] 配置 vanilla-extract + Vite

**Week 3-4: 渲染引擎**
- [ ] PixiJS v8 集成（启用 WebGPU）
- [ ] 无限画布（viewport、zoom、pan）
- [ ] 基础图形渲染（矩形、圆形、线条）
- [ ] E2E 测试（canvas 截图对比）

**Week 5-6: 编辑器核心**
- [ ] 选择系统（单选、框选）
- [ ] 拖拽变换（移动、缩放、旋转）
- [ ] 撤销/重做
- [ ] E2E 测试

**Week 7-8: 实时协作**
- [ ] Yjs 集成（通过 CRDT 抽象层）
- [ ] Go WebSocket 服务
- [ ] 多人光标/选择（Awareness）
- [ ] Dragonfly 缓存集成

**Week 9-10: AI 智能布局 ⭐**
- [ ] Rust 力导向图算法实现
- [ ] WASM 编译和优化
- [ ] 前端集成
- [ ] 性能基准测试（对比纯 JS）

**Week 11-12: 打磨和文档**
- [ ] UI 组件（Radix UI + shadcn/ui）
- [ ] 性能优化
- [ ] README + ARCHITECTURE.md
- [ ] Demo 视频

#### 交付物
- ✅ 可用的白板应用
- ✅ 实时协作功能
- ✅ AI 智能布局（Rust WASM）
- ✅ 核心技术文档

---

### Phase 2: 技术深度 + AI 增强 (3-6 个月)

**目标**：自研 CRDT + 第 2 个 AI 功能

#### 重点工作

**Month 4-5: 自研 CRDT**
- [ ] YATA 算法核心实现
- [ ] 完整测试套件（单元 + 属性测试）
- [ ] 性能基准（对比 Yjs）
- [ ] WASM 编译

**Month 6: Go-Rust 集成**
- [ ] Protocol Buffers 定义
- [ ] Rust gRPC 服务
- [ ] Go 客户端集成
- [ ] 集成测试

**Month 7: 并行运行**
- [ ] Yjs 和自研 CRDT 并存
- [ ] 环境变量切换
- [ ] A/B 测试
- [ ] 性能对比报告

**Month 8: AI 手绘识别 ⭐**
- [ ] OpenAI Vision API 集成
- [ ] Canvas 截图和预处理
- [ ] 形状识别和解析
- [ ] 生成精确图形

**Month 9: 文档和博客**
- [ ] CRDT.md 详细文档
- [ ] AI.md 架构说明
- [ ] 技术博客 2-3 篇

#### 交付物
- ✅ 自研 CRDT 达到生产可用
- ✅ AI 手绘识别功能
- ✅ 完整技术文档
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

4. **AI.md** - AI 架构设计
   - AI 能力规划
   - 已实现功能（智能布局、手绘识别）
   - 接口设计
   - 未来扩展方向

5. **PERFORMANCE.md** - 性能优化
   - 性能指标
   - 优化策略
   - 测试报告

### 技术博客主题

1. **《从零实现白板的实时协作：CRDT 算法实践》**
   - CRDT 原理
   - YATA 算法详解
   - Rust 实现
   - 性能对比

2. **《用 Rust WASM 加速前端布局算法》**
   - 力导向图算法
   - Rust 实现和优化
   - WASM 集成
   - 性能提升分析

3. **《Go 和 Rust 的混合架构实践》**
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

2. **务实路线**
   - Phase 1 用成熟技术快速验证
   - Phase 2 自研核心模块
   - 抽象层保证平滑迁移

3. **AI 增强**
   - 智能布局（Rust WASM 实现）
   - 手绘识别（OpenAI Vision）
   - 可扩展的 AI 架构

4. **工程质量**
   - 完整的测试（单元 + E2E）
   - 清晰的文档
   - 现代化的工具链

### 核心优势

- ✅ **技术栈现代且有深度**：不是简单的框架堆砌
- ✅ **架构设计清晰**：分层合理，职责明确
- ✅ **AI 集成有亮点**：不是简单调 API，有算法实现
- ✅ **文档完整**：代码 + 文档 = 完整的技术展示

### 下一步行动

1. **本周**：初始化项目结构
2. **Week 1-2**：搭建基础框架
3. **Week 3-4**：实现核心渲染
4. **持续**：编写技术文档和博客

---

**开始日期**：TBD
**Phase 1 目标**：3-4 个月完成核心 MVP
**Phase 2 目标**：6-9 个月完成技术深度优化

这是一个重技术、重质量的学习型项目，每个阶段都有明确的学习目标和可交付成果。
