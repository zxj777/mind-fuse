# Mind-Fuse 白板项目完整技术方案

## 项目定位

**Mind-Fuse** 是一个技术优先的开源白板项目，同时也是一个深度学习项目。核心目标：

1. **技术深度**：自研 CRDT 算法，深入理解分布式协作原理
2. **开源生态**：打造开发者友好的 SDK，类似 tldraw
3. **AI 原生**：从第一天就集成 AI 能力（智能布局、内容生成、手绘识别、语义理解）
4. **工程质量**：一步到位的架构设计，避免可预见的重构

---

## 核心技术策略

### 务实 + 学习并重的阶段性方案

```
Phase 1 (MVP, 2-3月)      Phase 2 (SDK化, 3-6月)     Phase 3 (自研, 6-12月)
─────────────────────────────────────────────────────────────────────
CRDT:  Yjs            →   Yjs + 自研并行测试    →   切换到自研 CRDT
后端:  Go (主服务)     →   Go + Rust (gRPC)    →   Go + Rust (优化)
前端:  PixiJS + Yjs   →   抽象层 + SDK 化      →   可选自研渲染引擎
AI:    OpenAI API     →   多模型 + 本地         →   完整 AI 能力
```

**关键设计原则**：
- ✅ 使用 Yjs 快速验证产品，但通过**抽象层**预留自研接口
- ✅ Go 做业务逻辑，Rust 做性能关键路径
- ✅ 每个阶段都有可交付的成果和学习输出

---

## 目录结构

```
mind-fuse/
├── apps/
│   ├── web/                    # Next.js 前端主应用
│   │   ├── src/
│   │   │   ├── app/            # Next.js 14+ App Router
│   │   │   ├── components/     # React 组件
│   │   │   ├── canvas/         # 画布渲染模块
│   │   │   ├── editor/         # 编辑器逻辑
│   │   │   ├── stores/         # 状态管理 (Zustand/Valtio)
│   │   │   └── lib/            # 工具函数
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── api-go/                 # Go 后端服务（业务逻辑）
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go     # 服务入口
│   │   ├── internal/           # 私有包（业务逻辑）
│   │   │   ├── auth/           # 认证/授权
│   │   │   ├── workspace/      # 工作空间管理
│   │   │   ├── user/           # 用户管理
│   │   │   ├── document/       # 文档元信息
│   │   │   ├── realtime/       # WebSocket 服务 (y-websocket)
│   │   │   ├── storage/        # 数据库/缓存操作
│   │   │   ├── ai/             # AI 服务调用
│   │   │   └── crdt/           # CRDT 客户端（调用 Rust 服务）
│   │   ├── pkg/                # 公共库（可被其他服务使用）
│   │   │   ├── config/         # 配置管理
│   │   │   ├── logger/         # 日志
│   │   │   ├── middleware/     # HTTP 中间件
│   │   │   └── errors/         # 错误处理
│   │   ├── api/                # API 定义
│   │   │   ├── rest/           # REST API handlers
│   │   │   ├── graphql/        # GraphQL (可选)
│   │   │   └── websocket/      # WebSocket handlers
│   │   ├── migrations/         # 数据库迁移
│   │   ├── scripts/            # 脚本
│   │   ├── Dockerfile
│   │   └── go.mod
│   │
│   ├── crdt-server/            # Rust CRDT 服务（Phase 2+）
│   │   ├── src/
│   │   │   ├── main.rs         # 服务入口
│   │   │   ├── grpc/           # gRPC 服务实现
│   │   │   │   ├── mod.rs
│   │   │   │   └── service.rs
│   │   │   ├── crdt/           # CRDT 业务逻辑
│   │   │   │   ├── mod.rs
│   │   │   │   ├── document.rs # 文档管理
│   │   │   │   └── store.rs    # 存储
│   │   │   ├── config.rs       # 配置
│   │   │   └── error.rs        # 错误处理
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   ├── docs/                   # 文档站（Nextra/Docusaurus）
│   │   ├── docs/
│   │   │   ├── getting-started/
│   │   │   ├── architecture/   # 架构文档
│   │   │   ├── crdt/           # CRDT 原理和实现
│   │   │   ├── api/            # API 文档
│   │   │   ├── sdk/            # SDK 使用指南
│   │   │   └── guides/         # 使用教程
│   │   ├── blog/               # 技术博客
│   │   │   ├── 2024-01-implementing-crdt.md
│   │   │   ├── 2024-02-rust-wasm-performance.md
│   │   │   └── 2024-03-ai-layout-algorithms.md
│   │   ├── package.json
│   │   └── docusaurus.config.js
│   │
│   └── examples/               # SDK 示例
│       ├── basic-whiteboard/   # 最简单的白板
│       ├── collaborative/      # 实时协作示例
│       ├── ai-layout/          # AI 布局示例
│       └── custom-shapes/      # 自定义图形
│
├── packages/                   # TypeScript 包（前端 SDK）
│   ├── canvas-engine/          # 渲染引擎
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── renderer/       # PixiJS 封装
│   │   │   │   ├── pixi-renderer.ts
│   │   │   │   └── viewport.ts # 无限画布
│   │   │   ├── layers/         # 分层渲染
│   │   │   ├── camera/         # 相机控制
│   │   │   ├── performance/    # 性能优化
│   │   │   │   ├── culling.ts  # 视锥剔除
│   │   │   │   └── virtual.ts  # 虚拟化
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── editor-core/            # 编辑器核心逻辑
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── selection/      # 选择系统
│   │   │   │   ├── select-tool.ts
│   │   │   │   └── multi-select.ts
│   │   │   ├── transform/      # 变换（拖拽、缩放、旋转）
│   │   │   │   ├── drag.ts
│   │   │   │   ├── resize.ts
│   │   │   │   └── rotate.ts
│   │   │   ├── gestures/       # 手势识别
│   │   │   ├── tools/          # 工具集
│   │   │   │   ├── pen.ts
│   │   │   │   ├── shape.ts
│   │   │   │   └── text.ts
│   │   │   ├── history/        # 撤销/重做
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── state-manager/          # 状态管理
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── store.ts        # Zustand/Valtio 封装
│   │   │   ├── slices/         # 状态切片
│   │   │   │   ├── canvas.ts
│   │   │   │   ├── shapes.ts
│   │   │   │   └── user.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── crdt-client/            # CRDT 客户端抽象层 ⭐ 关键模块
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts        # 统一接口定义
│   │   │   ├── adapter/        # 适配器模式
│   │   │   │   ├── base.ts     # 抽象基类
│   │   │   │   ├── yjs.ts      # Yjs 实现（Phase 1）
│   │   │   │   └── wasm.ts     # 自研 WASM 实现（Phase 2+）
│   │   │   ├── sync/           # 同步管理
│   │   │   │   ├── websocket.ts
│   │   │   │   └── awareness.ts # 多人状态（光标、选择）
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── README.md           # 详细说明如何切换实现
│   │
│   ├── shapes/                 # 图形库
│   │   ├── basic/              # 基础图形
│   │   │   ├── src/
│   │   │   │   ├── rectangle.ts
│   │   │   │   ├── circle.ts
│   │   │   │   ├── line.ts
│   │   │   │   └── text.ts
│   │   │   └── package.json
│   │   ├── flowchart/          # 流程图专用图形
│   │   │   ├── src/
│   │   │   │   ├── process.ts
│   │   │   │   ├── decision.ts
│   │   │   │   └── connector.ts
│   │   │   └── package.json
│   │   └── mindmap/            # 思维导图
│   │       └── src/
│   │           ├── node.ts
│   │           └── branch.ts
│   │
│   ├── ui-kit/                 # UI 组件库
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── toolbar/
│   │   │   │   ├── panel/
│   │   │   │   ├── inspector/  # 属性面板
│   │   │   │   └── modal/
│   │   │   └── styles/         # 样式系统
│   │   └── package.json
│   │
│   ├── ai-sdk/                 # AI SDK
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts       # 统一客户端
│   │   │   ├── providers/      # 多模型支持
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   └── ollama.ts   # 本地模型
│   │   │   ├── layout/         # 布局相关
│   │   │   │   ├── auto-align.ts
│   │   │   │   └── wasm-bridge.ts # 调用 Rust WASM
│   │   │   ├── generation/     # 内容生成
│   │   │   │   ├── diagram.ts
│   │   │   │   └── flowchart.ts
│   │   │   ├── recognition/    # 识别
│   │   │   │   └── sketch.ts
│   │   │   └── semantic/       # 语义理解
│   │   │       └── rag.ts
│   │   └── package.json
│   │
│   ├── shared-types/           # 共享类型定义
│   │   ├── src/
│   │   │   ├── shape.ts
│   │   │   ├── document.ts
│   │   │   ├── user.ts
│   │   │   └── api.ts
│   │   └── package.json
│   │
│   └── shared-utils/           # 共享工具函数
│       ├── src/
│       │   ├── geometry/       # 几何计算
│       │   ├── color/          # 颜色处理
│       │   └── validation/     # 验证
│       └── package.json
│
├── crates/                     # Rust 工作空间
│   ├── crdt-core/              # CRDT 核心实现（Phase 2+）⭐
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── yata/           # YATA 算法实现
│   │   │   │   ├── mod.rs
│   │   │   │   ├── item.rs     # Item 结构
│   │   │   │   ├── insert.rs   # 插入操作
│   │   │   │   ├── delete.rs   # 删除操作
│   │   │   │   └── integrate.rs # 集成算法
│   │   │   ├── document.rs     # 文档结构
│   │   │   ├── sync/           # 同步协议
│   │   │   │   ├── mod.rs
│   │   │   │   ├── state_vector.rs
│   │   │   │   └── diff.rs
│   │   │   ├── storage/        # 持久化
│   │   │   │   ├── mod.rs
│   │   │   │   └── encoding.rs # 二进制编码
│   │   │   └── types.rs
│   │   ├── tests/              # 大量测试
│   │   │   ├── basic.rs
│   │   │   ├── concurrent.rs   # 并发测试
│   │   │   └── fuzzing.rs      # 模糊测试
│   │   ├── benches/            # 性能基准
│   │   │   └── operations.rs
│   │   ├── Cargo.toml
│   │   └── README.md           # CRDT 实现文档
│   │
│   ├── crdt-wasm/              # WASM 绑定（Phase 2+）⭐
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── document.rs     # wasm-bindgen 封装
│   │   │   └── utils.rs
│   │   ├── Cargo.toml
│   │   └── README.md
│   │
│   ├── ai-layout/              # AI 布局算法（Phase 1 开始）⭐
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── force_directed/ # 力导向图
│   │   │   │   ├── mod.rs
│   │   │   │   ├── simulation.rs
│   │   │   │   └── forces.rs
│   │   │   ├── hierarchical/   # 层次布局
│   │   │   │   ├── mod.rs
│   │   │   │   └── sugiyama.rs
│   │   │   ├── auto_align/     # 自动对齐
│   │   │   │   ├── mod.rs
│   │   │   │   ├── grid.rs
│   │   │   │   └── distribute.rs
│   │   │   └── wasm.rs         # WASM 导出
│   │   ├── benches/
│   │   ├── Cargo.toml
│   │   └── README.md
│   │
│   ├── geometry/               # 几何计算库
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── shapes/         # 形状定义
│   │   │   │   ├── rect.rs
│   │   │   │   ├── circle.rs
│   │   │   │   └── polygon.rs
│   │   │   ├── collision/      # 碰撞检测
│   │   │   │   ├── mod.rs
│   │   │   │   └── sat.rs      # SAT 算法
│   │   │   ├── transform/      # 变换
│   │   │   │   ├── matrix.rs
│   │   │   │   └── affine.rs
│   │   │   └── intersection/   # 相交计算
│   │   └── Cargo.toml
│   │
│   ├── protocol/               # Go-Rust 通信协议（Phase 2+）⭐
│   │   ├── build.rs            # protobuf 构建脚本
│   │   ├── proto/
│   │   │   ├── crdt.proto      # CRDT 服务定义
│   │   │   └── layout.proto    # 布局服务定义
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   └── generated/      # 生成的代码
│   │   └── Cargo.toml
│   │
│   └── Cargo.toml              # 工作空间配置
│
├── templates/                  # 模板（纯数据）
│   ├── brainstorm/
│   │   ├── template.json       # 画布数据
│   │   ├── preview.png         # 缩略图
│   │   ├── metadata.json       # 元信息
│   │   └── CONTEXT.md          # 说明
│   ├── flowchart/
│   │   └── ...
│   └── mindmap/
│       └── ...
│
├── docs/                       # 项目文档（非文档站）
│   ├── ARCHITECTURE.md         # 整体架构
│   ├── CRDT.md                 # CRDT 设计文档
│   ├── CRDT_MIGRATION.md       # Yjs → 自研迁移指南 ⭐
│   ├── RENDERING.md            # 渲染引擎设计
│   ├── AI.md                   # AI 集成方案
│   ├── GO_RUST_INTEGRATION.md  # Go-Rust 集成方案 ⭐
│   ├── ROADMAP.md              # 开发路线图
│   └── CONTRIBUTING.md         # 贡献指南
│
├── scripts/                    # 工具脚本
│   ├── dev.sh                  # 启动所有开发服务
│   ├── build-wasm.sh           # 构建 WASM 模块
│   ├── protoc-gen.sh           # 生成 gRPC 代码
│   ├── test-all.sh             # 运行所有测试
│   ├── benchmark.sh            # 性能测试
│   └── setup-dev.sh            # 初始化开发环境
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI/CD
│   │   ├── benchmark.yml       # 性能回归测试
│   │   ├── docs.yml            # 文档部署
│   │   └── release.yml         # 发布流程
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .prettierrc
├── eslint.config.mjs           # ESLint 配置
├── tsconfig.json               # 根 TypeScript 配置
├── vitest.config.ts            # Vitest 配置
├── turbo.json                  # Turborepo 配置
├── pnpm-workspace.yaml         # pnpm 工作空间
├── go.work                     # Go 工作空间
├── Cargo.toml                  # Rust 工作空间
├── Dockerfile                  # 多阶段构建
├── docker-compose.yml          # 本地开发环境
├── README.md                   # 项目主文档
└── LICENSE                     # 开源协议
```

---

## 技术栈详解

### 前端技术栈

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **框架** | Next.js 14+ (App Router) | SSR、性能优化、生态成熟 |
| **UI 库** | React 18 | 生态最好、开发效率高 |
| **渲染引擎** | PixiJS (WebGL) | 高性能、功能丰富、适合白板场景 |
| **状态管理** | Zustand / Valtio | 轻量、现代、适合 CRDT 集成 |
| **CRDT（Phase 1）** | Yjs | 成熟稳定、快速验证产品 |
| **CRDT（Phase 2+）** | 自研（Rust WASM） | 学习目标、完全控制、性能优化 |
| **样式** | Tailwind CSS | 开发效率、主题化、响应式 |
| **组件库** | shadcn/ui | 可定制、无锁定、质量高 |
| **类型安全** | TypeScript 5+ | 必选 |
| **构建工具** | Turbo / Nx | Monorepo 管理 |
| **测试** | Vitest + Testing Library | 快速、现代 |

### 后端技术栈（Go）

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **框架** | Gin / Fiber | 高性能、简单易用 |
| **WebSocket** | gorilla/websocket | 稳定、兼容 y-websocket |
| **数据库** | PostgreSQL | 关系型、JSONB 支持 |
| **缓存** | Redis | 性能、持久化 |
| **ORM** | GORM / sqlc | GORM 开发快，sqlc 类型安全 |
| **配置** | Viper | 灵活的配置管理 |
| **日志** | Zap | 高性能结构化日志 |
| **gRPC** | google.golang.org/grpc | 调用 Rust 服务 |
| **测试** | testify | 断言、Mock |

### 后端技术栈（Rust）

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **框架** | Axum | 现代、类型安全、性能好 |
| **gRPC** | tonic | 纯 Rust、异步友好 |
| **序列化** | serde | 标准、高效 |
| **WASM** | wasm-bindgen | 标准、生态好 |
| **测试** | proptest | 属性测试、模糊测试 |
| **性能** | criterion | 基准测试 |

### AI 技术栈

| 能力 | Phase 1 | Phase 2+ |
|------|---------|----------|
| **智能布局** | Rust WASM (D3.js 算法) | 自研算法 + LLM 优化 |
| **内容生成** | OpenAI API | 多模型（OpenAI/Claude/Ollama） |
| **手绘识别** | - | OpenAI Vision / 自训练模型 |
| **语义理解** | - | RAG (Pinecone/Weaviate + LLM) |

---

## Go 和 Rust 的分工

### Go 负责：业务逻辑层

```
apps/api-go/
├── 用户认证/授权          ✅ Go 优势：快速开发、生态成熟
├── 工作空间管理           ✅ Go 优势：数据库操作方便
├── 文档元信息             ✅ Go 优势：CRUD 场景
├── REST API              ✅ Go 优势：HTTP 框架成熟
├── WebSocket (y-websocket) ✅ Go 优势：兼容 Yjs 生态
├── AI API 调用            ✅ Go 优势：HTTP 客户端简单
└── 权限控制               ✅ Go 优势：业务逻辑清晰
```

**Go 的核心价值**：
- 开发效率高（适合频繁变化的业务逻辑）
- 生态丰富（数据库、云服务 SDK）
- 部署简单（单二进制）

### Rust 负责：性能关键路径

```
crates/
├── crdt-core/           ✅ Rust 优势：类型安全、零成本抽象
├── ai-layout/           ✅ Rust 优势：计算密集、可编译为 WASM
├── geometry/            ✅ Rust 优势：数值计算、SIMD 优化
└── crdt-server/         ✅ Rust 优势：低延迟、高并发

apps/crdt-server/        ✅ Rust 优势：内存安全、性能极致
└── gRPC 服务（被 Go 调用）
```

**Rust 的核心价值**：
- 性能极致（CRDT 算法、布局计算）
- 内存安全（避免崩溃）
- 可编译为 WASM（前端复用）

---

## 关键模块设计

### 1. CRDT 抽象层设计（支持平滑迁移）⭐

#### 目标
- Phase 1 使用 Yjs
- Phase 2+ 无缝切换到自研 CRDT
- **应用层代码零改动**

#### 接口定义

```typescript
// packages/crdt-client/src/types.ts

/**
 * CRDT 适配器统一接口
 * 支持 Yjs 和自研 CRDT 的无缝切换
 */
export interface CRDTAdapter {
  // === 文档操作 ===

  /**
   * 插入元素到文档
   * @param position 插入位置
   * @param content 内容（Shape、Text 等）
   * @returns 本地操作产生的 Update
   */
  insert(position: Position, content: Content): Update;

  /**
   * 删除指定范围的元素
   * @param range 删除范围
   * @returns 本地操作产生的 Update
   */
  delete(range: Range): Update;

  /**
   * 更新元素属性
   * @param id 元素 ID
   * @param attrs 新属性
   */
  updateAttributes(id: string, attrs: Partial<ShapeAttributes>): Update;

  // === 同步 ===

  /**
   * 监听远程更新
   * @param callback 收到更新时的回调
   */
  onUpdate(callback: (update: Uint8Array) => void): Unsubscribe;

  /**
   * 应用远程更新
   * @param update 远程更新数据
   */
  applyUpdate(update: Uint8Array): void;

  /**
   * 获取当前状态向量（用于增量同步）
   */
  getStateVector(): Uint8Array;

  /**
   * 获取文档快照（用于持久化）
   */
  getSnapshot(): any;

  // === 连接管理 ===

  /**
   * 连接到同步服务器
   * @param url WebSocket URL
   */
  connect(url: string): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(): void;

  /**
   * 连接状态
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting';

  // === Awareness（多人状态）===

  /**
   * 设置本地状态（光标、选择等）
   */
  setLocalState(state: UserState): void;

  /**
   * 获取所有用户状态
   */
  getStates(): Map<number, UserState>;

  /**
   * 监听状态变化
   */
  onStatesChange(callback: (states: Map<number, UserState>) => void): Unsubscribe;
}

export type Position = number;
export type Range = { start: number; end: number };
export type Content = Shape | Text | any;
export type Update = Uint8Array;
export type Unsubscribe = () => void;

export interface UserState {
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor?: { x: number; y: number };
  selection?: string[];
}
```

#### Yjs 适配器实现（Phase 1）

```typescript
// packages/crdt-client/src/adapter/yjs.ts

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CRDTAdapter, Position, Range, Content, Update, UserState } from '../types';

export class YjsAdapter implements CRDTAdapter {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private shapes: Y.Array<any>;
  private awareness: any;

  constructor(clientId?: number) {
    this.doc = new Y.Doc();
    if (clientId !== undefined) {
      this.doc.clientID = clientId;
    }
    this.shapes = this.doc.getArray('shapes');
  }

  insert(position: Position, content: Content): Update {
    this.shapes.insert(position, [content]);
    // Yjs 自动生成 update，这里返回编码后的状态
    return Y.encodeStateAsUpdate(this.doc);
  }

  delete(range: Range): Update {
    this.shapes.delete(range.start, range.end - range.start);
    return Y.encodeStateAsUpdate(this.doc);
  }

  updateAttributes(id: string, attrs: any): Update {
    // 找到对应元素并更新
    const index = this.shapes.toArray().findIndex(s => s.id === id);
    if (index !== -1) {
      const shape = this.shapes.get(index);
      const updated = { ...shape, ...attrs };
      this.shapes.delete(index, 1);
      this.shapes.insert(index, [updated]);
    }
    return Y.encodeStateAsUpdate(this.doc);
  }

  onUpdate(callback: (update: Uint8Array) => void) {
    const handler = (update: Uint8Array, origin: any) => {
      if (origin !== this) {
        callback(update);
      }
    };
    this.doc.on('update', handler);
    return () => this.doc.off('update', handler);
  }

  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update, this);
  }

  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.doc);
  }

  getSnapshot(): any {
    return this.shapes.toArray();
  }

  async connect(url: string): Promise<void> {
    this.provider = new WebsocketProvider(url, 'room-name', this.doc);
    this.awareness = this.provider.awareness;

    return new Promise((resolve) => {
      this.provider!.on('sync', (isSynced: boolean) => {
        if (isSynced) resolve();
      });
    });
  }

  disconnect(): void {
    this.provider?.destroy();
    this.provider = null;
  }

  getConnectionStatus() {
    if (!this.provider) return 'disconnected';
    return this.provider.wsconnected ? 'connected' : 'connecting';
  }

  setLocalState(state: UserState): void {
    this.awareness?.setLocalState(state);
  }

  getStates(): Map<number, UserState> {
    return this.awareness?.getStates() || new Map();
  }

  onStatesChange(callback: (states: Map<number, UserState>) => void) {
    const handler = () => callback(this.getStates());
    this.awareness?.on('change', handler);
    return () => this.awareness?.off('change', handler);
  }
}
```

#### 自研 WASM 适配器（Phase 2+）

```typescript
// packages/crdt-client/src/adapter/wasm.ts

import { WasmDocument } from '@mind-fuse/crdt-wasm';
import { CRDTAdapter, Position, Range, Content, Update, UserState } from '../types';

export class WasmAdapter implements CRDTAdapter {
  private doc: WasmDocument;
  private ws: WebSocket | null = null;
  private updateCallbacks: Set<(update: Uint8Array) => void> = new Set();
  private stateCallbacks: Set<(states: Map<number, UserState>) => void> = new Set();
  private localState: UserState | null = null;
  private remoteStates: Map<number, UserState> = new Map();

  constructor(clientId: number) {
    this.doc = new WasmDocument(clientId);
  }

  insert(position: Position, content: Content): Update {
    const update = this.doc.insert(position, JSON.stringify(content));
    this.broadcastUpdate(update);
    return update;
  }

  delete(range: Range): Update {
    const update = this.doc.delete(range.start, range.end);
    this.broadcastUpdate(update);
    return update;
  }

  updateAttributes(id: string, attrs: any): Update {
    const update = this.doc.update_attributes(id, JSON.stringify(attrs));
    this.broadcastUpdate(update);
    return update;
  }

  onUpdate(callback: (update: Uint8Array) => void) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  applyUpdate(update: Uint8Array): void {
    this.doc.apply_update(update);
    // 触发本地回调
    this.updateCallbacks.forEach(cb => cb(update));
  }

  getStateVector(): Uint8Array {
    return this.doc.encode_state_vector();
  }

  getSnapshot(): any {
    const json = this.doc.to_json();
    return JSON.parse(json);
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // 发送初始状态向量
        const stateVector = this.getStateVector();
        this.ws!.send(stateVector);
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = new Uint8Array(event.data);
        this.applyUpdate(data);
      };

      this.ws.onerror = (error) => reject(error);
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    return this.ws.readyState === WebSocket.OPEN ? 'connected' : 'connecting';
  }

  setLocalState(state: UserState): void {
    this.localState = state;
    // 通过 WebSocket 广播状态
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'awareness', state }));
    }
  }

  getStates(): Map<number, UserState> {
    return this.remoteStates;
  }

  onStatesChange(callback: (states: Map<number, UserState>) => void) {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }

  private broadcastUpdate(update: Uint8Array) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(update);
    }
  }
}
```

#### 工厂函数（统一入口）

```typescript
// packages/crdt-client/src/index.ts

import { YjsAdapter } from './adapter/yjs';
import { WasmAdapter } from './adapter/wasm';
import { CRDTAdapter } from './types';

export type CRDTType = 'yjs' | 'wasm';

export interface CRDTConfig {
  type: CRDTType;
  clientId?: number;
}

/**
 * 创建 CRDT 客户端
 *
 * @example
 * // Phase 1: 使用 Yjs
 * const crdt = createCRDTClient({ type: 'yjs' });
 *
 * // Phase 2+: 切换到自研
 * const crdt = createCRDTClient({ type: 'wasm', clientId: 123 });
 */
export function createCRDTClient(config: CRDTConfig): CRDTAdapter {
  const { type, clientId } = config;

  switch (type) {
    case 'yjs':
      return new YjsAdapter(clientId);
    case 'wasm':
      if (clientId === undefined) {
        throw new Error('clientId is required for WASM adapter');
      }
      return new WasmAdapter(clientId);
    default:
      throw new Error(`Unknown CRDT type: ${type}`);
  }
}

export * from './types';
```

#### 应用层使用（零改动切换）

```typescript
// apps/web/src/stores/whiteboard.ts

import { createCRDTClient } from '@mind-fuse/crdt-client';
import { create } from 'zustand';

interface WhiteboardStore {
  crdt: CRDTAdapter;
  shapes: Shape[];

  addShape: (shape: Shape) => void;
  deleteShape: (id: string) => void;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
}

export const useWhiteboard = create<WhiteboardStore>((set, get) => {
  // 🔥 唯一需要改的地方：配置中的 type
  const crdt = createCRDTClient({
    type: process.env.NEXT_PUBLIC_CRDT_TYPE as CRDTType || 'yjs',
    clientId: Date.now(), // 实际应该从服务器获取
  });

  // 监听远程更新
  crdt.onUpdate((update) => {
    // 更新本地状态
    const snapshot = crdt.getSnapshot();
    set({ shapes: snapshot });
  });

  return {
    crdt,
    shapes: [],

    addShape: (shape) => {
      const { shapes } = get();
      crdt.insert(shapes.length, shape);
      set({ shapes: [...shapes, shape] });
    },

    deleteShape: (id) => {
      const { shapes } = get();
      const index = shapes.findIndex(s => s.id === id);
      if (index !== -1) {
        crdt.delete({ start: index, end: index + 1 });
        set({ shapes: shapes.filter(s => s.id !== id) });
      }
    },

    updateShape: (id, attrs) => {
      crdt.updateAttributes(id, attrs);
      const { shapes } = get();
      set({
        shapes: shapes.map(s => s.id === id ? { ...s, ...attrs } : s)
      });
    },
  };
});
```

#### 配置切换（环境变量）

```bash
# .env.local

# Phase 1: 使用 Yjs
NEXT_PUBLIC_CRDT_TYPE=yjs

# Phase 2+: 切换到自研
NEXT_PUBLIC_CRDT_TYPE=wasm
```

**优势**：
- ✅ 应用层代码完全不需要改动
- ✅ 通过环境变量一键切换
- ✅ 可以 A/B 测试不同实现的性能
- ✅ 降低迁移风险

---

### 2. Go-Rust 集成方案（gRPC）⭐

#### Protocol Buffers 定义

```protobuf
// crates/protocol/proto/crdt.proto

syntax = "proto3";

package crdt;

// CRDT 服务定义
service CRDTService {
  // 应用更新
  rpc ApplyUpdate(ApplyUpdateRequest) returns (ApplyUpdateResponse);

  // 获取文档快照
  rpc GetSnapshot(GetSnapshotRequest) returns (GetSnapshotResponse);

  // 获取增量更新（基于状态向量）
  rpc GetDiff(GetDiffRequest) returns (GetDiffResponse);

  // 订阅文档更新（流式）
  rpc Subscribe(SubscribeRequest) returns (stream UpdateEvent);
}

message ApplyUpdateRequest {
  bytes document_id = 1;
  bytes update = 2;
  string client_id = 3;
}

message ApplyUpdateResponse {
  bool success = 1;
  string error = 2;
}

message GetSnapshotRequest {
  bytes document_id = 1;
}

message GetSnapshotResponse {
  bytes snapshot = 1;
}

message GetDiffRequest {
  bytes document_id = 1;
  bytes state_vector = 2;
}

message GetDiffResponse {
  bytes diff = 1;
}

message SubscribeRequest {
  bytes document_id = 1;
}

message UpdateEvent {
  bytes update = 1;
  string client_id = 2;
  int64 timestamp = 3;
}
```

#### Rust 服务端实现

```rust
// apps/crdt-server/src/grpc/service.rs

use tonic::{Request, Response, Status};
use protocol::crdt_service_server::CrdtService;
use protocol::*;
use crdt_core::DocumentStore;

pub struct MyCRDTService {
    store: Arc<DocumentStore>,
}

#[tonic::async_trait]
impl CrdtService for MyCRDTService {
    async fn apply_update(
        &self,
        request: Request<ApplyUpdateRequest>,
    ) -> Result<Response<ApplyUpdateResponse>, Status> {
        let req = request.into_inner();

        match self.store.apply_update(&req.document_id, &req.update).await {
            Ok(_) => Ok(Response::new(ApplyUpdateResponse {
                success: true,
                error: String::new(),
            })),
            Err(e) => Ok(Response::new(ApplyUpdateResponse {
                success: false,
                error: e.to_string(),
            })),
        }
    }

    async fn get_snapshot(
        &self,
        request: Request<GetSnapshotRequest>,
    ) -> Result<Response<GetSnapshotResponse>, Status> {
        let req = request.into_inner();

        match self.store.get_snapshot(&req.document_id).await {
            Ok(snapshot) => Ok(Response::new(GetSnapshotResponse {
                snapshot,
            })),
            Err(e) => Err(Status::internal(e.to_string())),
        }
    }

    // ... 其他方法
}
```

#### Go 客户端调用

```go
// apps/api-go/internal/crdt/client.go

package crdt

import (
    "context"
    pb "mind-fuse/protocol/crdt"
    "google.golang.org/grpc"
)

type Client struct {
    conn   *grpc.ClientConn
    client pb.CRDTServiceClient
}

func NewClient(addr string) (*Client, error) {
    conn, err := grpc.Dial(addr, grpc.WithInsecure())
    if err != nil {
        return nil, err
    }

    return &Client{
        conn:   conn,
        client: pb.NewCRDTServiceClient(conn),
    }, nil
}

func (c *Client) ApplyUpdate(ctx context.Context, docID, update []byte, clientID string) error {
    resp, err := c.client.ApplyUpdate(ctx, &pb.ApplyUpdateRequest{
        DocumentId: docID,
        Update:     update,
        ClientId:   clientID,
    })

    if err != nil {
        return err
    }

    if !resp.Success {
        return fmt.Errorf("failed to apply update: %s", resp.Error)
    }

    return nil
}

func (c *Client) GetSnapshot(ctx context.Context, docID []byte) ([]byte, error) {
    resp, err := c.client.GetSnapshot(ctx, &pb.GetSnapshotRequest{
        DocumentId: docID,
    })

    if err != nil {
        return nil, err
    }

    return resp.Snapshot, nil
}

func (c *Client) Close() error {
    return c.conn.Close()
}
```

#### Go WebSocket 处理器（集成 CRDT 服务）

```go
// apps/api-go/internal/realtime/handler.go

package realtime

import (
    "context"
    "github.com/gorilla/websocket"
    "mind-fuse/internal/crdt"
)

type Handler struct {
    crdtClient *crdt.Client
    upgrader   websocket.Upgrader
}

func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := h.upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("upgrade error: %v", err)
        return
    }
    defer conn.Close()

    docID := []byte(r.URL.Query().Get("doc"))
    clientID := r.URL.Query().Get("client")

    // 发送初始快照
    snapshot, err := h.crdtClient.GetSnapshot(context.Background(), docID)
    if err == nil {
        conn.WriteMessage(websocket.BinaryMessage, snapshot)
    }

    // 接收客户端更新
    for {
        _, update, err := conn.ReadMessage()
        if err != nil {
            break
        }

        // 应用到 CRDT 服务
        err = h.crdtClient.ApplyUpdate(context.Background(), docID, update, clientID)
        if err != nil {
            log.Printf("apply update error: %v", err)
            continue
        }

        // 广播给房间内其他客户端
        // （这里简化了，实际需要 pub/sub 机制）
    }
}
```

---

### 3. AI 布局算法（Rust WASM）⭐

#### Rust 实现（力导向图）

```rust
// crates/ai-layout/src/force_directed/mod.rs

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub mass: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    pub source: String,
    pub target: String,
    pub weight: f64,
}

#[derive(Debug, Clone)]
pub struct ForceDirectedLayout {
    nodes: Vec<Node>,
    edges: Vec<Edge>,
    config: LayoutConfig,
}

#[derive(Debug, Clone)]
pub struct LayoutConfig {
    pub iterations: usize,
    pub repulsion_strength: f64,
    pub attraction_strength: f64,
    pub damping: f64,
}

impl Default for LayoutConfig {
    fn default() -> Self {
        Self {
            iterations: 100,
            repulsion_strength: 1000.0,
            attraction_strength: 0.1,
            damping: 0.9,
        }
    }
}

impl ForceDirectedLayout {
    pub fn new(nodes: Vec<Node>, edges: Vec<Edge>, config: LayoutConfig) -> Self {
        Self { nodes, edges, config }
    }

    pub fn compute(&mut self) -> Vec<Node> {
        for _ in 0..self.config.iterations {
            self.apply_forces();
            self.update_positions();
        }
        self.nodes.clone()
    }

    fn apply_forces(&mut self) {
        // 清空力
        for node in &mut self.nodes {
            node.vx = 0.0;
            node.vy = 0.0;
        }

        // 斥力（所有节点之间）
        for i in 0..self.nodes.len() {
            for j in i+1..self.nodes.len() {
                let dx = self.nodes[j].x - self.nodes[i].x;
                let dy = self.nodes[j].y - self.nodes[i].y;
                let distance = (dx * dx + dy * dy).sqrt().max(1.0);

                let force = self.config.repulsion_strength / (distance * distance);
                let fx = (dx / distance) * force;
                let fy = (dy / distance) * force;

                self.nodes[i].vx -= fx;
                self.nodes[i].vy -= fy;
                self.nodes[j].vx += fx;
                self.nodes[j].vy += fy;
            }
        }

        // 引力（边连接的节点）
        for edge in &self.edges {
            let source_idx = self.nodes.iter().position(|n| n.id == edge.source).unwrap();
            let target_idx = self.nodes.iter().position(|n| n.id == edge.target).unwrap();

            let dx = self.nodes[target_idx].x - self.nodes[source_idx].x;
            let dy = self.nodes[target_idx].y - self.nodes[source_idx].y;
            let distance = (dx * dx + dy * dy).sqrt();

            let force = distance * self.config.attraction_strength * edge.weight;
            let fx = (dx / distance) * force;
            let fy = (dy / distance) * force;

            self.nodes[source_idx].vx += fx;
            self.nodes[source_idx].vy += fy;
            self.nodes[target_idx].vx -= fx;
            self.nodes[target_idx].vy -= fy;
        }
    }

    fn update_positions(&mut self) {
        for node in &mut self.nodes {
            node.x += node.vx;
            node.y += node.vy;

            // 阻尼
            node.vx *= self.config.damping;
            node.vy *= self.config.damping;
        }
    }
}

// WASM 导出
#[wasm_bindgen]
pub fn layout_force_directed(
    nodes_json: &str,
    edges_json: &str,
    config_json: &str,
) -> String {
    let nodes: Vec<Node> = serde_json::from_str(nodes_json).unwrap();
    let edges: Vec<Edge> = serde_json::from_str(edges_json).unwrap();
    let config: LayoutConfig = serde_json::from_str(config_json).unwrap();

    let mut layout = ForceDirectedLayout::new(nodes, edges, config);
    let result = layout.compute();

    serde_json::to_string(&result).unwrap()
}
```

#### TypeScript 调用

```typescript
// packages/ai-sdk/src/layout/wasm-bridge.ts

import init, { layout_force_directed } from '@mind-fuse/ai-layout-wasm';

let wasmInitialized = false;

async function ensureInit() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export interface Node {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  mass?: number;
}

export interface Edge {
  source: string;
  target: string;
  weight?: number;
}

export interface LayoutConfig {
  iterations?: number;
  repulsionStrength?: number;
  attractionStrength?: number;
  damping?: number;
}

/**
 * 力导向图布局（Rust WASM 加速）
 * 性能：比纯 JS 实现快 5-10 倍
 */
export async function forceDirectedLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = {}
): Promise<Node[]> {
  await ensureInit();

  const defaultConfig = {
    iterations: 100,
    repulsionStrength: 1000,
    attractionStrength: 0.1,
    damping: 0.9,
    ...config,
  };

  const result = layout_force_directed(
    JSON.stringify(nodes),
    JSON.stringify(edges),
    JSON.stringify(defaultConfig)
  );

  return JSON.parse(result);
}
```

#### 应用层使用

```typescript
// apps/web/src/features/ai/auto-layout.ts

import { forceDirectedLayout } from '@mind-fuse/ai-sdk';

export async function autoArrangeShapes(shapes: Shape[]) {
  // 转换为节点和边
  const nodes = shapes.map(shape => ({
    id: shape.id,
    x: shape.x,
    y: shape.y,
    mass: 1,
  }));

  const edges = shapes
    .flatMap(shape =>
      (shape.connections || []).map(targetId => ({
        source: shape.id,
        target: targetId,
        weight: 1,
      }))
    );

  // 调用 Rust WASM 布局算法
  const layouted = await forceDirectedLayout(nodes, edges, {
    iterations: 200,
    repulsionStrength: 2000,
  });

  // 应用新位置
  return shapes.map(shape => {
    const node = layouted.find(n => n.id === shape.id);
    return node ? { ...shape, x: node.x, y: node.y } : shape;
  });
}
```

---

## 分阶段开发路线图

### Phase 1: MVP（2-3 个月）

#### 目标
快速验证产品，建立技术基础

#### 技术栈
- 前端：Next.js + Yjs + PixiJS
- 后端：Go (REST + y-websocket)
- AI：OpenAI API + Rust WASM 布局

#### 里程碑

**Week 1-2: 项目初始化**
- [ ] 创建 monorepo 结构
- [ ] 配置开发环境
- [ ] 搭建 CI/CD

**Week 3-4: 渲染引擎**
- [ ] PixiJS 集成
- [ ] 无限画布
- [ ] 基础图形渲染

**Week 5-6: 编辑器核心**
- [ ] 选择系统
- [ ] 拖拽变换
- [ ] 撤销/重做

**Week 7-8: 实时协作**
- [ ] Yjs 集成
- [ ] WebSocket 服务（Go）
- [ ] 多人光标/选择

**Week 9-10: AI 功能**
- [ ] Rust WASM 布局算法
- [ ] OpenAI 内容生成
- [ ] 智能对齐

**Week 11-12: Polish 和上线**
- [ ] UI 美化
- [ ] 性能优化
- [ ] 部署

#### 交付物
- ✅ 可用的白板产品
- ✅ 基础协作功能
- ✅ AI 布局演示
- ✅ 技术博客 1-2 篇

---

### Phase 2: SDK 化 + 自研准备（3-6 个月）

#### 目标
- 重构为 SDK
- 实现自研 CRDT
- 建立开发者生态

#### 技术栈
- 新增：Rust CRDT + gRPC
- 其他：保持不变

#### 里程碑

**Month 4: 重构为 SDK**
- [ ] packages/ 结构重组
- [ ] API 文档生成
- [ ] 示例项目

**Month 5-6: CRDT 实现**
- [ ] YATA 算法核心
- [ ] 完整测试套件
- [ ] WASM 编译

**Month 6-7: Go-Rust 集成**
- [ ] gRPC 服务
- [ ] Protocol Buffers
- [ ] 集成测试

**Month 7-8: 并行运行**
- [ ] Yjs 和自研并存
- [ ] A/B 测试
- [ ] 性能对比

**Month 8-9: 文档和示例**
- [ ] 完整文档站
- [ ] 示例库
- [ ] 技术博客

#### 交付物
- ✅ 开源 SDK
- ✅ 自研 CRDT 达到可用状态
- ✅ 完整文档
- ✅ 技术博客 3-5 篇

---

### Phase 3: 迁移和优化（6-12 个月）

#### 目标
- 切换到自研 CRDT
- 完整 AI 能力
- 生态建设

#### 里程碑

**Month 10-11: 逐步迁移**
- [ ] 新用户使用自研 CRDT
- [ ] 数据迁移工具
- [ ] 兼容性保证

**Month 12-13: AI 增强**
- [ ] 手绘识别
- [ ] 语义理解（RAG）
- [ ] 多模型支持

**Month 14-15: 性能优化**
- [ ] 自研渲染引擎（可选）
- [ ] 大规模性能测试
- [ ] 优化关键路径

**Month 16+: 生态建设**
- [ ] 插件系统
- [ ] 模板市场
- [ ] 社区运营

#### 交付物
- ✅ 完全自研技术栈
- ✅ 完整 AI 能力
- ✅ 开发者生态
- ✅ 技术博客 10+ 篇

---

## 学习输出和文档计划

### 技术博客主题（apps/docs/blog）

1. **《从零实现 CRDT：YATA 算法详解》**
   - CRDT 基础理论
   - YATA 算法原理
   - Rust 实现细节
   - 性能优化

2. **《Rust + WASM 在前端的实践》**
   - wasm-bindgen 使用
   - JS-Rust 互操作
   - 性能对比

3. **《白板应用的渲染引擎设计》**
   - Canvas vs WebGL
   - PixiJS 架构
   - 虚拟化渲染
   - 性能优化

4. **《Go 和 Rust 的混合架构》**
   - gRPC 集成
   - 各语言优势
   - 实战经验

5. **《AI 驱动的自动布局算法》**
   - 力导向图
   - 层次布局
   - LLM 优化

### 架构文档（docs/）

- **ARCHITECTURE.md**：整体架构设计
- **CRDT.md**：CRDT 实现原理
- **CRDT_MIGRATION.md**：Yjs → 自研迁移指南
- **RENDERING.md**：渲染引擎设计
- **AI.md**：AI 集成方案
- **GO_RUST_INTEGRATION.md**：Go-Rust 集成
- **PERFORMANCE.md**：性能优化指南

---

## 开发环境配置

### 必需工具

- **Node.js**: v20+
- **pnpm**: v8+
- **Go**: v1.21+
- **Rust**: 1.75+
- **wasm-pack**: 最新版
- **Docker**: 用于本地开发环境
- **PostgreSQL**: v15+
- **Redis**: v7+

### 初始化脚本

```bash
# scripts/setup-dev.sh

#!/bin/bash

echo "🚀 Setting up Mind-Fuse development environment..."

# 检查工具
check_tool() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ $1 not found. Please install it first."
    exit 1
  fi
  echo "✅ $1 found"
}

check_tool node
check_tool pnpm
check_tool go
check_tool cargo
check_tool docker

# 安装依赖
echo "📦 Installing dependencies..."
pnpm install

# 构建 Rust WASM
echo "🦀 Building Rust WASM..."
cd crates/ai-layout
wasm-pack build --target web
cd ../..

# 启动 Docker 服务
echo "🐳 Starting Docker services..."
docker-compose up -d

# 运行迁移
echo "🗄️  Running database migrations..."
cd apps/api-go
go run cmd/migrate/main.go
cd ../..

echo "✅ Setup complete!"
echo "Run 'pnpm dev' to start all services"
```

### 一键启动脚本

```bash
# scripts/dev.sh

#!/bin/bash

# 并行启动所有服务
trap 'kill 0' EXIT

echo "🚀 Starting all services..."

# 前端
cd apps/web && pnpm dev &

# Go 后端
cd apps/api-go && go run cmd/server/main.go &

# Rust CRDT 服务（Phase 2+）
# cd apps/crdt-server && cargo run &

# 文档站
# cd apps/docs && pnpm dev &

wait
```

---

## 项目配置文件

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### go.work

```go
go 1.21

use (
    ./apps/api-go
)
```

### Cargo.toml（工作空间）

```toml
[workspace]
members = [
    "crates/crdt-core",
    "crates/crdt-wasm",
    "crates/ai-layout",
    "crates/geometry",
    "crates/protocol",
    "apps/crdt-server",
]
resolver = "2"

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
tonic = "0.10"
wasm-bindgen = "0.2"
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "target/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {}
  }
}
```

---

## 总结

### 核心优势

1. **技术深度 + 务实路线**
   - Phase 1 用 Yjs 快速验证
   - Phase 2+ 自研 CRDT 深入学习
   - 抽象层保证平滑迁移

2. **多语言协同**
   - Go 做业务逻辑（快速迭代）
   - Rust 做性能关键路径（极致性能）
   - TypeScript 做前端（生态成熟）

3. **开源 + 学习**
   - SDK 化设计
   - 完整文档
   - 技术博客输出

4. **AI 原生**
   - 智能布局（Rust WASM）
   - 内容生成（LLM）
   - 手绘识别（Vision）
   - 语义理解（RAG）

### 关键文档
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - 整体架构
- [CRDT_MIGRATION.md](./docs/CRDT_MIGRATION.md) - 迁移指南
- [GO_RUST_INTEGRATION.md](./docs/GO_RUST_INTEGRATION.md) - 集成方案

### 下一步行动

1. **本周**：初始化项目结构
2. **Week 1-2**：搭建基础框架
3. **Week 3-4**：实现核心渲染
4. **持续**：文档和博客

---

**项目开始日期**：TBD
**预计 MVP 完成**：+3 个月
**预计完整版完成**：+12 个月

**记住**：这是一个学习项目，重点是**技术深度**和**知识积累**，而不仅仅是快速交付产品。
