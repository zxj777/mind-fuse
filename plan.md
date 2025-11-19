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
│   ├── collaboration/            # CRDT 客户端抽象层 ⭐ 关键模块
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
│   ├── primitives/             # 基础图形库（Phase 1）
│   │   ├── src/
│   │   │   ├── rectangle.ts
│   │   │   ├── circle.ts
│   │   │   ├── line.ts
│   │   │   └── text.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   │   # Phase 2+ 独立包（依赖 primitives）
│   │   # ├── flowchart/       # 流程图包
│   │   # └── mindmap/         # 思维导图包
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
| **框架** | Next.js 15 (App Router) | SSR、Turbopack、性能优化、生态成熟 |
| **UI 库** | React 18 | 生态最好、开发效率高 |
| **渲染引擎** | PixiJS v8 (WebGL + WebGPU) | 高性能、已支持 WebGPU、适合白板场景 |
| **渲染引擎（Phase 2+）** | wgpu (Rust) → WASM | 自研、完全控制 WebGPU、性能极致 |
| **状态管理** | Zustand / Valtio | 轻量、现代、适合 CRDT 集成 |
| **CRDT（Phase 1）** | Yjs | 成熟稳定、快速验证产品 |
| **CRDT（Phase 2+）** | 自研（Rust WASM） | 学习目标、完全控制、性能优化 |
| **样式** | vanilla-extract | 类型安全、零运行时、主题化 |
| **组件库（白板）** | Radix UI | 无样式、完全自定义、可访问性好 |
| **组件库（其他页面）** | shadcn/ui (基于 Radix) | 快速开发、可定制、有现成模板 |
| **类型安全** | TypeScript 5+ | 必选 |
| **构建工具** | pnpm + Vite | 简单够用、HMR 快、开发体验好 |
| **测试（单元）** | Vitest + Testing Library | 快速、现代 |
| **测试（E2E）** | Playwright | 跨浏览器、截图对比、录制操作 |

### 后端技术栈（Go）

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **框架** | Huma v2 | OpenAPI 原生、自动生成文档和 TS 类型、现代化 |
| **WebSocket** | nhooyr.io/websocket | 比 Gorilla 更现代、兼容 y-websocket |
| **数据库** | PostgreSQL + pgvector | 关系型、JSONB、向量搜索（AI） |
| **数据库客户端** | sqlc | 代码生成、类型安全、零运行时、无 ORM 魔法 |
| **缓存** | Dragonfly | Redis 兼容、性能 25x、Rust 实现 |
| **配置** | Viper | 灵活的配置管理 |
| **日志** | slog (标准库) | Go 1.21+ 原生、结构化日志 |
| **验证** | go-playground/validator | 强大的验证库 |
| **gRPC** | google.golang.org/grpc | 调用 Rust 服务 |
| **测试** | testify | 断言、Mock |

### 后端技术栈（Rust）

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| **框架** | Axum（或 Loco.rs） | Axum: 现代、类型安全；Loco: Rails 风格、开发效率高 |
| **数据库客户端** | SeaORM 或 sqlx | SeaORM: 异步 ORM；sqlx: 编译时 SQL 检查 |
| **gRPC** | tonic | 纯 Rust、异步友好 |
| **序列化** | serde | 标准、高效 |
| **WASM** | wasm-bindgen | 标准、生态好 |
| **WebGPU** | wgpu | 原生 WebGPU、可编译到 WASM |
| **测试** | proptest | 属性测试、模糊测试 |
| **性能** | criterion | 基准测试 |

### AI 技术栈

| 能力 | Phase 1 | Phase 2+ |
|------|---------|----------|
| **智能布局** | Rust WASM (D3.js 算法) | 自研算法 + LLM 优化 |
| **内容生成** | OpenAI API | 多模型（OpenAI/Claude/Ollama） |
| **手绘识别** | - | OpenAI Vision / 自训练模型 |
| **语义理解** | - | RAG (Qdrant + LLM) |
| **向量数据库** | - | Qdrant (Rust 实现、高性能) |

---

## 技术选型详解（激进方案）

### 为什么选择这些技术？

本项目作为**技术学习项目**，我们倾向于选择**激进但有品味**的技术，而不是最成熟稳定的方案。以下是核心选型理由：

#### 前端技术栈

**1. PixiJS v8 → wgpu (Phase 2)**
- **Phase 1**: PixiJS v8 已支持 WebGPU 作为可选后端，浏览器兼容性好
- **Phase 2**: 自研 wgpu (Rust) → WASM 渲染引擎
  - 学习 WebGPU 底层 API
  - Rust 代码可复用（服务端渲染、缩略图生成）
  - 完全控制渲染管线
  - 理由：tldraw 用 Canvas2D 都能做到 60fps，说明算法比 API 更重要，值得深入学习

**2. vanilla-extract**
- 类型安全的 CSS-in-JS
- 零运行时开销（编译时生成 CSS）
- 完美支持主题系统
- 比 Tailwind 更适合复杂组件样式
- 可选：Tailwind 用于快速原型和布局

**3. Radix UI + shadcn/ui**
- **白板部分**: Radix UI（无样式，完全自定义）
- **登录/后台**: shadcn/ui（基于 Radix，快速开发）
- 统一的无障碍支持
- 代码在你项目里，可随意修改

**4. pnpm + Vite（不用 Turbo）**
- Vite 的 HMR 速度无敌
- pnpm workspace 对中小型 monorepo 够用
- Next.js 自带 Turbopack，不需要额外构建工具
- Turbo 留到 Phase 2（包数量 >10 时再考虑）

**5. Playwright（E2E 测试）**
- 白板项目的协作、撤销/重做等复杂交互必须 E2E 测试
- 可以录制操作（`playwright codegen`）
- 截图对比（测试 canvas 渲染结果）
- 并行执行，性能好

#### Go 后端技术栈

**1. Huma v2（替代 Gin/Fiber）**
```go
// 自动生成 OpenAPI、TS 类型、验证
func AddShape(ctx context.Context, input *struct {
    Body struct {
        ShapeType string `json:"shapeType" enum:"rect,circle"`
        X         int    `json:"x" minimum:"0"`
        Y         int    `json:"y" minimum:"0"`
    }
}) (*struct{ Body Shape }, error) {
    // 自动验证、生成文档
}
```
- OpenAPI 原生支持
- 自动生成 TypeScript 类型定义
- 类型安全的 API
- 现代化设计（Go 1.21+ generics）

**2. sqlc（替代 GORM）**
```sql
-- queries.sql
-- name: GetUser :one
SELECT * FROM users WHERE id = $1;
```
自动生成：
```go
func (q *Queries) GetUser(ctx context.Context, id string) (User, error)
```
- 编译时类型检查
- 零运行时开销（无反射）
- 直接写 SQL，无 ORM 魔法
- 性能接近手写代码

**3. Dragonfly（替代 Redis）**
- Redis 协议兼容（无需改代码）
- 性能是 Redis 的 25 倍（Rust 实现）
- 内存使用更少
- 激进但社区活跃

**4. slog（替代 Zap）**
- Go 1.21+ 标准库
- 结构化日志
- 性能优秀
- 无第三方依赖

**5. nhooyr.io/websocket（替代 Gorilla）**
- 更现代的 API
- 更好的性能
- 仍然兼容 Yjs 的 y-websocket 协议

#### Rust 后端技术栈

**1. Axum（推荐）或 Loco.rs（激进）**
- **Axum**: 成熟稳定，Tokio 团队维护
- **Loco.rs**: 2024 新框架，Rails 风格，开发效率高
```rust
// Loco.rs 示例
#[async_trait]
impl Controller for ShapeController {
    async fn create(&self, req: Request) -> Result<Response> {
        // 类似 Rails 的开发体验
    }
}
```

**2. sqlx（推荐）或 SeaORM**
- **sqlx**: 编译时 SQL 检查，轻量
- **SeaORM**: 异步 ORM，功能丰富

**3. wgpu（渲染引擎）**
- 原生 WebGPU 实现
- 可编译到 WASM（前端复用）
- 可用于服务端渲染（生成缩略图）

#### AI 基础设施

**1. Qdrant（向量数据库）**
- Rust 实现，性能极致
- 支持过滤、混合搜索
- 完善的 SDK（Go、Rust、TS）
- 比 Pinecone/Weaviate 更适合自托管

**2. pgvector（PostgreSQL 扩展）**
- 简单场景直接用 pgvector
- 省一个服务
- 性能够用（<100 万向量）

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
// packages/collaboration/src/types.ts

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
// packages/collaboration/src/adapter/yjs.ts

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
// packages/collaboration/src/adapter/wasm.ts

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
// packages/collaboration/src/index.ts

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

import { createCRDTClient } from '@mind-fuse/collaboration';
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
- **前端**: Next.js 15 + Yjs + PixiJS v8 + vanilla-extract + Radix/shadcn
- **后端**: Go (Huma v2 + sqlc) + nhooyr.io/websocket
- **缓存**: Dragonfly
- **AI**: OpenAI API + Rust WASM 布局
- **测试**: Vitest + Playwright

#### 里程碑

**Week 1-2: 项目初始化**
- [ ] 创建 pnpm monorepo 结构
- [ ] 配置开发环境（Node.js、Go、Rust、Docker）
- [ ] 配置 vanilla-extract + Vite
- [ ] 搭建 CI/CD（GitHub Actions）
- [ ] 配置 Playwright E2E 测试

**Week 3-4: 渲染引擎**
- [ ] PixiJS v8 集成（启用 WebGPU）
- [ ] 无限画布（viewport、zoom、pan）
- [ ] 基础图形渲染（矩形、圆形、线条）
- [ ] 编写 E2E 测试（canvas 截图对比）

**Week 5-6: 编辑器核心**
- [ ] 选择系统（单选、框选）
- [ ] 拖拽变换（移动、缩放、旋转）
- [ ] 撤销/重做（基于 Yjs）
- [ ] E2E 测试（拖拽、选择）

**Week 7-8: 实时协作**
- [ ] Yjs 集成（通过 CRDT 抽象层）
- [ ] Go WebSocket 服务（nhooyr.io/websocket）
- [ ] 多人光标/选择（Awareness）
- [ ] Dragonfly 缓存集成
- [ ] E2E 测试（多客户端协作）

**Week 9-10: AI 功能**
- [ ] Rust WASM 布局算法（力导向图）
- [ ] OpenAI API 集成（内容生成）
- [ ] 智能对齐和分布
- [ ] 单元测试（Rust benchmarks）

**Week 11-12: UI 和上线**
- [ ] Radix UI 组件（白板工具栏）
- [ ] shadcn/ui（登录、设置页面）
- [ ] vanilla-extract 主题系统
- [ ] 性能优化
- [ ] 部署（Vercel + Fly.io）

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
- [ ] 新增领域包：flowchart、mindmap（依赖 primitives）
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

**Month 14-15: 性能优化 + WebGPU 渲染引擎**
- [ ] wgpu (Rust) → WASM 自研渲染引擎
- [ ] WebGPU 渲染管线优化
- [ ] 大规模性能测试（10k+ shapes）
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
- **Dragonfly**: 最新版（或 Redis v7+ 兼容）
- **Playwright**: 最新版（E2E 测试）

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

### package.json (根目录脚本)

```json
{
  "name": "mind-fuse",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "test:e2e": "playwright test",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check",
    "clean": "pnpm -r clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  }
}
```

### vite.config.ts (共享配置)

```typescript
// packages/vite-config/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
  ],
  optimizeDeps: {
    exclude: ['@mind-fuse/crdt-wasm', '@mind-fuse/ai-layout-wasm'],
  },
});
```

---

## 总结

### 技术栈对比（保守 vs 激进）

| 模块 | 保守方案 | 我们的选择（激进） | 理由 |
|------|---------|------------------|------|
| **Go 框架** | Gin/Fiber | Huma v2 | OpenAPI 原生、自动生成 TS 类型 |
| **Go ORM** | GORM | sqlc | 类型安全、零运行时、无魔法 |
| **缓存** | Redis | Dragonfly | 兼容 Redis、性能 25x |
| **日志** | Zap | slog (标准库) | 无依赖、性能好 |
| **WebSocket** | Gorilla | nhooyr.io/websocket | 更现代的 API |
| **样式** | Tailwind | vanilla-extract + Tailwind | 类型安全、零运行时 |
| **组件库** | Material-UI / Ant Design | Radix + shadcn/ui | 无样式、完全自定义 |
| **构建工具** | Turborepo | pnpm + Vite | 简单够用、HMR 快 |
| **E2E 测试** | 不做 | Playwright | 必须有（复杂交互） |
| **渲染引擎** | Canvas2D / PixiJS | PixiJS v8 → wgpu (WASM) | 学习 WebGPU |
| **向量数据库** | Pinecone | Qdrant | Rust 实现、自托管 |
| **Rust 框架** | - | Axum / Loco.rs | Loco 更激进但高效 |

### 核心优势

1. **技术深度 + 务实路线**
   - Phase 1 用成熟技术快速验证（Yjs、PixiJS）
   - Phase 2+ 自研核心模块深入学习（CRDT、渲染引擎）
   - 抽象层保证平滑迁移（零应用代码改动）

2. **激进但有品味**
   - 不盲目追求稳定，选择有良好社区的新技术
   - Huma v2、sqlc、Dragonfly 等都有活跃社区
   - 学习价值 > 生产稳定性（这是学习项目）

3. **多语言协同**
   - Go 做业务逻辑（快速迭代）
   - Rust 做性能关键路径（极致性能）
   - TypeScript 做前端（生态成熟）
   - 三者通过 gRPC、WASM 无缝协作

4. **开源 + 学习**
   - SDK 化设计（类似 tldraw）
   - 完整文档和博客
   - 代码即教程

5. **AI 原生**
   - 智能布局（Rust WASM）
   - 内容生成（LLM）
   - 手绘识别（Vision）
   - 语义理解（RAG + Qdrant）

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

---

## 快速技术参考

### 完整技术栈一览

#### 前端
```yaml
框架: Next.js 15 (App Router + Turbopack)
UI库: React 18
渲染:
  - Phase 1: PixiJS v8 (WebGL + WebGPU)
  - Phase 2: wgpu (Rust) → WASM
状态: Zustand / Valtio
样式: vanilla-extract + Tailwind (可选)
组件:
  - 白板: Radix UI
  - 其他: shadcn/ui
CRDT:
  - Phase 1: Yjs
  - Phase 2: 自研 (Rust WASM)
构建: pnpm + Vite
测试:
  - 单元: Vitest + Testing Library
  - E2E: Playwright
```

#### 后端 (Go)
```yaml
框架: Huma v2
数据库: PostgreSQL + pgvector
客户端: sqlc
缓存: Dragonfly
WebSocket: nhooyr.io/websocket
日志: slog (标准库)
验证: go-playground/validator
gRPC: google.golang.org/grpc
测试: testify
```

#### 后端 (Rust)
```yaml
框架: Axum (或 Loco.rs)
数据库: sqlx / SeaORM
gRPC: tonic
WASM: wasm-bindgen
WebGPU: wgpu
序列化: serde
测试: proptest
性能: criterion
```

#### AI & 数据
```yaml
向量数据库: Qdrant (Rust)
向量扩展: pgvector (PostgreSQL)
LLM: OpenAI API → 多模型
布局算法: Rust WASM (力导向图)
```

#### 开发工具
```yaml
包管理: pnpm
版本控制: Git + Conventional Commits
CI/CD: GitHub Actions
部署: Vercel (前端) + Fly.io (后端)
监控: (待定)
```

### 关键命令

```bash
# 初始化开发环境
./scripts/setup-dev.sh

# 启动所有服务
pnpm dev

# 运行测试
pnpm test          # 单元测试
pnpm test:e2e      # E2E 测试

# 构建
pnpm build         # 构建所有包

# 构建 WASM
./scripts/build-wasm.sh

# 生成 gRPC 代码
./scripts/protoc-gen.sh

# 运行 Benchmark
./scripts/benchmark.sh
```

---

## 代码规范和开源最佳实践

### 概述

作为一个**技术优先的开源学习项目**，代码质量和项目规范至关重要。本节定义了 Mind-Fuse 项目的完整规范体系，确保：

1. ✅ **代码质量**：可维护、可读、可测试
2. ✅ **协作效率**：统一风格、清晰流程
3. ✅ **开源友好**：文档完善、贡献门槛低
4. ✅ **学习价值**：规范本身就是最佳实践的示范

---

## 一、代码风格规范

### 1.1 TypeScript / JavaScript 规范

#### 核心原则
- **类型优先**：充分利用 TypeScript 类型系统
- **函数式风格**：优先使用纯函数和不可变数据
- **明确优于隐式**：避免 `any`，显式声明类型
- **简洁清晰**：代码即文档

#### ESLint 配置

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // React 规则
      'react/react-in-jsx-scope': 'off', // Next.js 14+ 不需要
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  prettier,
];
```

#### Prettier 配置

```json
// .prettierrc
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### 命名规范

```typescript
// ✅ 好的命名
// 文件名：kebab-case
// force-directed-layout.ts
// user-profile.tsx

// 类型/接口：PascalCase
interface UserProfile {
  id: string;
  name: string;
}

type ShapeType = 'rectangle' | 'circle' | 'line';

// 函数/变量：camelCase
function calculateBounds(shape: Shape): Bounds {
  const boundingBox = getBoundingBox(shape);
  return boundingBox;
}

// 常量：UPPER_SNAKE_CASE
const MAX_ZOOM_LEVEL = 10;
const DEFAULT_CANVAS_SIZE = 5000;

// 组件：PascalCase
export function WhiteboardCanvas({ width, height }: Props) {
  // ...
}

// 私有成员：前缀 _
class DocumentStore {
  private _cache: Map<string, Document>;

  private _invalidateCache(): void {
    // ...
  }
}

// ❌ 避免
// 单字母变量（除了常见循环变量 i, j, k）
const x = getUser(); // ❌
const user = getUser(); // ✅

// 匈牙利命名法
const strName = 'John'; // ❌
const name = 'John'; // ✅

// 过于简写
function calcBnds() {} // ❌
function calculateBounds() {} // ✅
```

#### 函数规范

```typescript
// ✅ 好的函数设计

/**
 * 计算图形的边界框
 *
 * @param shape - 要计算的图形
 * @returns 边界框坐标
 *
 * @example
 * ```ts
 * const bounds = calculateBounds(myShape);
 * console.log(bounds.x, bounds.y, bounds.width, bounds.height);
 * ```
 */
export function calculateBounds(shape: Shape): Bounds {
  // 1. 函数短小（< 30 行）
  // 2. 单一职责
  // 3. 有完整的 JSDoc
  // 4. 有明确的返回类型
  // 5. 纯函数（无副作用）

  const { x, y, width, height } = shape;
  return { x, y, width, height };
}

// ✅ 优先使用函数式风格
const activeShapes = shapes.filter((s) => s.active);
const positions = shapes.map((s) => ({ x: s.x, y: s.y }));

// ❌ 避免大函数
function doEverything() {
  // 100+ 行代码
  // 做了太多事情
}

// ✅ 拆分为小函数
function processShapes(shapes: Shape[]) {
  const validated = validateShapes(shapes);
  const transformed = transformShapes(validated);
  const optimized = optimizeLayout(transformed);
  return optimized;
}
```

#### 类型定义规范

```typescript
// ✅ 优先使用 interface（可扩展）
export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ✅ 使用 type 定义联合类型、交叉类型
export type ShapeType = 'rectangle' | 'circle' | 'line' | 'text';
export type ReadonlyShape = Readonly<Shape>;
export type PartialShape = Partial<Shape>;

// ✅ 使用泛型增强复用性
export interface Repository<T> {
  find(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

export class ShapeRepository implements Repository<Shape> {
  // ...
}

// ✅ 避免 any，使用 unknown
function processData(data: unknown): Result {
  if (typeof data === 'object' && data !== null) {
    // 类型收窄
  }
}

// ❌ 避免滥用类型断言
const shape = data as Shape; // ❌ 危险

// ✅ 使用类型守卫
function isShape(data: unknown): data is Shape {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data
  );
}

if (isShape(data)) {
  console.log(data.id); // ✅ 类型安全
}
```

#### React 组件规范

```typescript
// ✅ 好的组件设计

import type { FC, ReactNode } from 'react';

interface ToolbarProps {
  /** 工具栏位置 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 子元素 */
  children: ReactNode;
  /** 点击处理 */
  onAction?: (action: string) => void;
}

/**
 * 白板工具栏组件
 *
 * @example
 * ```tsx
 * <Toolbar position="top" onAction={handleAction}>
 *   <Button>矩形</Button>
 *   <Button>圆形</Button>
 * </Toolbar>
 * ```
 */
export const Toolbar: FC<ToolbarProps> = ({
  position = 'top',
  children,
  onAction,
}) => {
  // 1. Props 有完整类型
  // 2. 使用解构赋值
  // 3. 有默认值
  // 4. 有 JSDoc 文档

  return (
    <div className={`toolbar toolbar-${position}`}>
      {children}
    </div>
  );
};

// ✅ 使用 hooks
export function useWhiteboard() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 自定义 hook 逻辑

  return { shapes, selectedId, setShapes, setSelectedId };
}

// ❌ 避免
// 1. 组件过大（> 300 行）
// 2. 过多的 props（> 10 个，应该拆分或使用对象）
// 3. 逻辑混乱（UI 和业务逻辑耦合）
```

---

### 1.2 Go 规范

#### 核心原则
- **简洁清晰**：Go 的哲学
- **错误处理**：显式检查每个错误
- **接口小而精**：单一职责
- **并发安全**：正确使用 goroutine 和 channel

#### golangci-lint 配置

```yaml
# .golangci.yml
run:
  timeout: 5m
  tests: true

linters:
  enable:
    - gofmt
    - goimports
    - golint
    - govet
    - errcheck
    - staticcheck
    - unused
    - gosimple
    - structcheck
    - varcheck
    - ineffassign
    - deadcode
    - typecheck
    - gosec
    - gocritic

linters-settings:
  goimports:
    local-prefixes: mind-fuse
  golint:
    min-confidence: 0.8
  govet:
    check-shadowing: true
  errcheck:
    check-type-assertions: true
    check-blank: true

issues:
  exclude-use-default: false
  max-issues-per-linter: 0
  max-same-issues: 0
```

#### 命名规范

```go
// ✅ 好的命名

// 包名：小写，单词，简短
package workspace

// 导出的类型/函数：PascalCase
type UserService struct {
    repo UserRepository
}

func CreateUser(name string) (*User, error) {
    // ...
}

// 私有的类型/函数：camelCase
type userCache struct {
    data map[string]*User
}

func validateEmail(email string) error {
    // ...
}

// 常量：PascalCase 或 camelCase（Go 习惯）
const MaxRetries = 3
const defaultTimeout = 30 * time.Second

// 接口：单方法接口用 -er 后缀
type Reader interface {
    Read(p []byte) (n int, err error)
}

type UserRepository interface {
    Find(id string) (*User, error)
    Save(user *User) error
}

// ❌ 避免
// 1. 下划线（除了测试文件 _test.go）
func get_user() {} // ❌
func getUser() {}  // ✅

// 2. 过长的名字
func GetUserByEmailAddressAndPassword() {} // ❌
func Authenticate() {} // ✅

// 3. 匈牙利命名
strName := "John" // ❌
name := "John"    // ✅
```

#### 代码风格

```go
// ✅ 好的代码风格

package workspace

import (
    "context"
    "fmt"
    "time"

    // 标准库

    // 第三方库
    "github.com/gin-gonic/gin"

    // 本项目
    "mind-fuse/pkg/logger"
)

// Service 工作空间服务
type Service struct {
    repo   Repository
    cache  Cache
    logger logger.Logger
}

// Create 创建新工作空间
//
// 参数：
//   - ctx: 上下文
//   - name: 工作空间名称
//   - ownerID: 所有者 ID
//
// 返回：
//   - *Workspace: 创建的工作空间
//   - error: 错误信息
func (s *Service) Create(ctx context.Context, name, ownerID string) (*Workspace, error) {
    // 1. 参数验证
    if name == "" {
        return nil, fmt.Errorf("name is required")
    }
    if ownerID == "" {
        return nil, fmt.Errorf("ownerID is required")
    }

    // 2. 业务逻辑
    ws := &Workspace{
        ID:        generateID(),
        Name:      name,
        OwnerID:   ownerID,
        CreatedAt: time.Now(),
    }

    // 3. 错误处理：每个错误都要检查
    if err := s.repo.Save(ctx, ws); err != nil {
        s.logger.Error("failed to save workspace", "error", err)
        return nil, fmt.Errorf("save workspace: %w", err)
    }

    // 4. 返回
    return ws, nil
}

// ✅ 并发安全
type Cache struct {
    mu   sync.RWMutex
    data map[string]*Workspace
}

func (c *Cache) Get(id string) (*Workspace, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    ws, ok := c.data[id]
    return ws, ok
}

func (c *Cache) Set(id string, ws *Workspace) {
    c.mu.Lock()
    defer c.mu.Unlock()

    c.data[id] = ws
}

// ✅ 使用 context 传递请求范围的值
func (s *Service) ProcessRequest(ctx context.Context, req *Request) error {
    // 设置超时
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // 传递给下游
    return s.downstream.Process(ctx, req)
}

// ❌ 避免
// 1. 忽略错误
result, _ := doSomething() // ❌

// 2. panic（除非真的无法恢复）
if err != nil {
    panic(err) // ❌
}
if err != nil {
    return fmt.Errorf("failed: %w", err) // ✅
}

// 3. 全局变量（除了常量）
var globalCache = make(map[string]string) // ❌

// 4. 使用 init() 函数（难以测试）
func init() {
    // ❌ 除非必要
}
```

#### 测试规范

```go
// workspace_test.go

package workspace_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "mind-fuse/internal/workspace"
)

// ✅ 好的测试

func TestService_Create(t *testing.T) {
    // 使用表驱动测试
    tests := []struct {
        name      string
        inputName string
        ownerID   string
        wantErr   bool
    }{
        {
            name:      "成功创建",
            inputName: "My Workspace",
            ownerID:   "user123",
            wantErr:   false,
        },
        {
            name:      "名称为空",
            inputName: "",
            ownerID:   "user123",
            wantErr:   true,
        },
        {
            name:      "所有者ID为空",
            inputName: "My Workspace",
            ownerID:   "",
            wantErr:   true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange
            repo := &mockRepository{}
            svc := workspace.NewService(repo)
            ctx := context.Background()

            // Act
            ws, err := svc.Create(ctx, tt.inputName, tt.ownerID)

            // Assert
            if tt.wantErr {
                assert.Error(t, err)
                assert.Nil(t, ws)
            } else {
                require.NoError(t, err)
                assert.NotNil(t, ws)
                assert.Equal(t, tt.inputName, ws.Name)
                assert.Equal(t, tt.ownerID, ws.OwnerID)
            }
        })
    }
}

// Mock
type mockRepository struct {
    workspace.Repository
    saveCalled bool
}

func (m *mockRepository) Save(ctx context.Context, ws *workspace.Workspace) error {
    m.saveCalled = true
    return nil
}
```

---

### 1.3 Rust 规范

#### 核心原则
- **所有权优先**：理解并善用 Rust 所有权系统
- **类型安全**：利用类型系统避免运行时错误
- **零成本抽象**：抽象不应带来性能损失
- **错误处理**：使用 `Result` 和 `Option`

#### Clippy 配置

```toml
# Cargo.toml
[workspace.lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"

[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
cargo = "warn"

# 允许的规则
too_many_arguments = "allow"
module_name_repetitions = "allow"
```

#### Rustfmt 配置

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_small_heuristics = "Default"
reorder_imports = true
reorder_modules = true
remove_nested_parens = true
use_field_init_shorthand = true
use_try_shorthand = true
```

#### 命名规范

```rust
// ✅ 好的命名

// 模块名：snake_case
mod force_directed;
mod auto_align;

// 类型/结构体：PascalCase
pub struct Document {
    id: DocumentId,
    items: Vec<Item>,
}

pub enum ShapeType {
    Rectangle,
    Circle,
    Line,
}

// 函数/方法/变量：snake_case
pub fn calculate_bounds(shape: &Shape) -> Bounds {
    let bounding_box = get_bounding_box(shape);
    bounding_box
}

// 常量：UPPER_SNAKE_CASE
const MAX_ITEMS: usize = 10000;
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

// Trait：形容词或名词
pub trait Renderable {
    fn render(&self, ctx: &RenderContext);
}

pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

// 生命周期参数：短小，有意义
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// 泛型参数：单字母或 PascalCase
fn process<T>(item: T) -> Result<T, Error> {
    // ...
}

struct Repository<TEntity, TId> {
    // ...
}

// ❌ 避免
// 1. camelCase（Rust 用 snake_case）
fn calculateBounds() {} // ❌
fn calculate_bounds() {} // ✅

// 2. 匈牙利命名
let str_name = "John"; // ❌
let name = "John"; // ✅
```

#### 代码风格

```rust
// ✅ 好的代码风格

use std::sync::Arc;
use serde::{Deserialize, Serialize};

/// CRDT 文档
///
/// 使用 YATA 算法实现的 CRDT 文档结构
///
/// # Examples
///
/// ```
/// use crdt_core::Document;
///
/// let mut doc = Document::new(1);
/// doc.insert(0, "Hello".into());
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    client_id: u64,
    items: Vec<Item>,
    state: StateVector,
}

impl Document {
    /// 创建新文档
    ///
    /// # Arguments
    ///
    /// * `client_id` - 客户端 ID
    ///
    /// # Returns
    ///
    /// 新的文档实例
    pub fn new(client_id: u64) -> Self {
        Self {
            client_id,
            items: Vec::new(),
            state: StateVector::new(),
        }
    }

    /// 插入内容
    ///
    /// # Arguments
    ///
    /// * `position` - 插入位置
    /// * `content` - 内容
    ///
    /// # Returns
    ///
    /// 操作产生的更新
    ///
    /// # Errors
    ///
    /// 如果位置无效，返回错误
    pub fn insert(&mut self, position: usize, content: Content) -> Result<Update, Error> {
        // 1. 参数验证
        if position > self.items.len() {
            return Err(Error::InvalidPosition(position));
        }

        // 2. 创建 Item
        let item = Item::new(
            self.client_id,
            self.state.get_clock(self.client_id),
            content,
        );

        // 3. 插入
        self.items.insert(position, item.clone());
        self.state.increment(self.client_id);

        // 4. 返回
        Ok(Update::Insert { item })
    }
}

// ✅ 错误处理
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Invalid position: {0}")]
    InvalidPosition(usize),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
}

// ✅ 使用 Result 和 Option
pub fn find_item(&self, id: &ItemId) -> Option<&Item> {
    self.items.iter().find(|item| &item.id == id)
}

pub fn load_document(path: &Path) -> Result<Document, Error> {
    let content = std::fs::read_to_string(path)?;
    let doc = serde_json::from_str(&content)?;
    Ok(doc)
}

// ✅ 善用迭代器
let sum: usize = self.items
    .iter()
    .filter(|item| !item.deleted)
    .map(|item| item.content.len())
    .sum();

// ✅ 所有权和借用
// 不可变借用
fn print_items(items: &[Item]) {
    for item in items {
        println!("{:?}", item);
    }
}

// 可变借用
fn add_item(items: &mut Vec<Item>, item: Item) {
    items.push(item);
}

// 转移所有权
fn take_ownership(items: Vec<Item>) -> Vec<Item> {
    items
}

// ❌ 避免
// 1. 不必要的 clone
let items = self.items.clone(); // ❌ 如果只需要读
let items = &self.items; // ✅

// 2. unwrap（除非确定不会 panic）
let value = option.unwrap(); // ❌
let value = option.expect("should have value"); // ⚠️ 只在确定的情况
let value = option.ok_or(Error::Missing)?; // ✅

// 3. 忽略 Result
function_that_returns_result(); // ❌ 编译器警告
let _ = function_that_returns_result(); // ⚠️ 明确忽略
function_that_returns_result()?; // ✅ 传播错误

// 4. unsafe（除非必要，且有充分注释）
unsafe {
    // ❌ 尽量避免
}
```

#### 测试规范

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    // ✅ 单元测试
    #[test]
    fn test_insert_item() {
        let mut doc = Document::new(1);
        let content = Content::Text("Hello".into());

        let result = doc.insert(0, content.clone());

        assert!(result.is_ok());
        assert_eq!(doc.items.len(), 1);
        assert_eq!(doc.items[0].content, content);
    }

    #[test]
    fn test_insert_invalid_position() {
        let mut doc = Document::new(1);

        let result = doc.insert(10, Content::Text("Hello".into()));

        assert!(result.is_err());
        assert!(matches!(result, Err(Error::InvalidPosition(10))));
    }

    // ✅ 属性测试（Property Testing）
    proptest! {
        #[test]
        fn test_insert_always_increases_length(
            content in any::<String>(),
            position in 0usize..100
        ) {
            let mut doc = Document::new(1);
            let initial_len = doc.items.len();

            if position <= initial_len {
                let _ = doc.insert(position, Content::Text(content));
                assert_eq!(doc.items.len(), initial_len + 1);
            }
        }
    }

    // ✅ 基准测试
    #[bench]
    fn bench_insert_1000_items(b: &mut Bencher) {
        b.iter(|| {
            let mut doc = Document::new(1);
            for i in 0..1000 {
                doc.insert(i, Content::Text(format!("Item {}", i))).unwrap();
            }
        });
    }
}
```

---

### 1.4 通用规范

#### 注释规范

```typescript
// ✅ 好的注释

/**
 * 计算两个矩形的交集
 *
 * 使用 Sutherland-Hodgman 算法计算两个轴对齐矩形的交集区域。
 * 如果矩形不相交，返回 null。
 *
 * @param rect1 - 第一个矩形
 * @param rect2 - 第二个矩形
 * @returns 交集矩形，如果不相交则返回 null
 *
 * @example
 * ```ts
 * const rect1 = { x: 0, y: 0, width: 100, height: 100 };
 * const rect2 = { x: 50, y: 50, width: 100, height: 100 };
 * const intersection = calculateIntersection(rect1, rect2);
 * // { x: 50, y: 50, width: 50, height: 50 }
 * ```
 *
 * @see https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm
 */
export function calculateIntersection(rect1: Rect, rect2: Rect): Rect | null {
    // 实现...
}

// ✅ 代码解释性注释（when WHY is not obvious）
// 使用二分查找优化性能，因为数组已排序
const index = binarySearch(sortedArray, target);

// 必须在渲染前清空画布，否则会出现重影
ctx.clearRect(0, 0, canvas.width, canvas.height);

// ❌ 避免无用注释
// 创建一个变量
const user = getUser(); // ❌ 代码已经很清楚了

// 循环遍历数组
for (const item of items) {} // ❌

// ❌ 注释掉的代码（应该删除，用 git 管理历史）
// const oldFunction = () => {
//   // ...
// }

// ✅ TODO 注释（应该有 issue 号）
// TODO(#123): 优化大数据量下的渲染性能
// FIXME(#456): 修复并发编辑时的冲突
// HACK: 临时方案，等待上游库修复 bug
```

---

## 二、Git 提交规范

### 2.1 Conventional Commits

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，这有助于：
- 自动生成 CHANGELOG
- 自动确定语义化版本号
- 更好的提交历史

#### 提交消息格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(canvas): add infinite canvas support` |
| `fix` | Bug 修复 | `fix(crdt): resolve conflict in concurrent edits` |
| `docs` | 文档变更 | `docs(readme): update installation instructions` |
| `style` | 代码格式（不影响功能） | `style: format code with prettier` |
| `refactor` | 重构（不是新功能也不是bug修复） | `refactor(editor): extract selection logic` |
| `perf` | 性能优化 | `perf(render): optimize large canvas rendering` |
| `test` | 添加或修改测试 | `test(crdt): add concurrent editing tests` |
| `build` | 构建系统或依赖变更 | `build: upgrade to Next.js 14` |
| `ci` | CI 配置变更 | `ci: add benchmark workflow` |
| `chore` | 其他不修改src或test的变更 | `chore: update dependencies` |
| `revert` | 回滚之前的提交 | `revert: feat(canvas): add infinite canvas` |

#### Scope 范围

常用的 scope：

- `canvas` - 画布相关
- `editor` - 编辑器相关
- `crdt` - CRDT 相关
- `api` - 后端 API
- `ui` - UI 组件
- `docs` - 文档
- `deps` - 依赖
- `config` - 配置

#### 示例

```bash
# ✅ 好的提交消息

feat(canvas): add infinite canvas with zoom and pan
# 新功能，指定了 scope

fix(crdt): resolve race condition in concurrent updates

Properly handle concurrent updates from multiple clients by
implementing vector clock comparison in the YATA algorithm.

Fixes #123
# 有详细的 body 说明，关联了 issue

docs(api): add API documentation for workspace endpoints

- Document all REST endpoints
- Add request/response examples
- Include error codes

# 有结构化的 body

perf(render): optimize shape rendering for large canvases

Implement virtual rendering to only draw shapes in viewport.
This improves performance from 15fps to 60fps with 10k shapes.

Benchmark results:
- Before: 15fps (10k shapes)
- After: 60fps (10k shapes)
# 有性能数据

BREAKING CHANGE: Shape interface now requires 'bounds' property
# 破坏性变更，会触发 major 版本号增加

# ❌ 不好的提交消息

fix bug
# 太简单，没有说明修复了什么

update code
# 太模糊

feat: add stuff
# 不清楚添加了什么

WIP
# 不应该提交 WIP（work in progress）
```

#### 提交消息模板

```bash
# .gitmessage

# <type>[optional scope]: <description>
# |<----  最多 50 字符  ---->|

# [optional body]
# |<----  每行最多 72 字符  ---->|

# [optional footer(s)]

# Type 可以是:
#   feat     新功能
#   fix      Bug 修复
#   docs     文档
#   style    格式
#   refactor 重构
#   perf     性能优化
#   test     测试
#   build    构建
#   ci       CI
#   chore    其他
#   revert   回滚
#
# Scope 可以是: canvas, editor, crdt, api, ui, docs, deps, config
#
# Breaking changes: 添加 'BREAKING CHANGE:' 在 footer
# Issue 关联: 添加 'Fixes #123' 或 'Closes #123'
```

配置模板：
```bash
git config --local commit.template .gitmessage
```

---

### 2.2 分支策略

我们使用 **GitHub Flow** 的简化版本：

#### 分支命名

```
<type>/<issue-number>-<short-description>

示例：
feat/123-infinite-canvas
fix/456-crdt-conflict
docs/789-api-documentation
refactor/101-editor-selection
```

#### 主要分支

- `main` - 主分支，始终保持可发布状态
  - 受保护，不能直接推送
  - 只能通过 PR 合并
  - 所有 CI 检查必须通过

- `develop` - 开发分支（可选，如果需要更稳定的 main）
  - 日常开发的集成分支
  - 定期合并到 main

#### 工作流程

```bash
# 1. 从 main 创建新分支
git checkout main
git pull origin main
git checkout -b feat/123-infinite-canvas

# 2. 开发和提交
git add .
git commit -m "feat(canvas): implement zoom functionality"

# 3. 推送到远程
git push origin feat/123-infinite-canvas

# 4. 创建 Pull Request

# 5. 代码审查后合并

# 6. 删除分支
git branch -d feat/123-infinite-canvas
git push origin --delete feat/123-infinite-canvas
```

---

### 2.3 Pull Request 规范

#### PR 标题

遵循 Conventional Commits 格式：

```
feat(canvas): add infinite canvas support
fix(crdt): resolve concurrent editing conflict
docs: update contributing guidelines
```

#### PR 描述模板

``````markdown
## 描述

简要描述这个 PR 做了什么，为什么要做。

## 变更类型

- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试 (test)
- [ ] 构建/CI (build/ci)
- [ ] 其他 (chore)

## 相关 Issue

Fixes #123
Closes #456

## 变更内容

- 实现了无限画布的缩放功能
- 添加了平移手势支持
- 优化了大画布的渲染性能

## 测试

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过
- [ ] 性能测试通过（如适用）

### 测试步骤

1. 打开白板
2. 使用鼠标滚轮缩放
3. 拖拽画布平移
4. 验证大量图形时的性能

## 截图/演示

（如果有 UI 变更，请添加截图或 GIF）

## Checklist

- [ ] 代码遵循项目风格指南
- [ ] 已添加/更新相关文档
- [ ] 已添加/更新测试
- [ ] 所有 CI 检查通过
- [ ] 已进行自我审查
- [ ] 已更新 CHANGELOG（如需要）

## 破坏性变更

（如果有破坏性变更，请详细说明）

## 其他说明

（其他需要审查者注意的事项）
``````

---

## 三、开源项目必备文档

### 3.1 README.md

```markdown
# Mind-Fuse

> 技术优先的开源白板项目 | 自研 CRDT + AI 原生

[![CI](https://github.com/user/mind-fuse/workflows/CI/badge.svg)](https://github.com/user/mind-fuse/actions)
[![codecov](https://codecov.io/gh/user/mind-fuse/branch/main/graph/badge.svg)](https://codecov.io/gh/user/mind-fuse)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/xxx)](https://discord.gg/xxx)

## ✨ 特性

- 🎨 **无限画布** - 流畅的缩放和平移体验
- 🤝 **实时协作** - 基于 CRDT 的无冲突协作
- 🤖 **AI 增强** - 智能布局、内容生成、手绘识别
- 🎯 **高性能** - Rust + WASM 驱动的核心算法
- 🧩 **可扩展** - 插件系统和丰富的 SDK

## 🚀 快速开始

### 在线试用

访问 [https://mind-fuse.com](https://mind-fuse.com) 直接使用

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

详细安装指南请参考 [Getting Started](https://docs.mind-fuse.com/getting-started)

## 📚 文档

- [官方文档](https://docs.mind-fuse.com)
- [API 文档](https://docs.mind-fuse.com/api)
- [架构设计](./docs/ARCHITECTURE.md)
- [贡献指南](./CONTRIBUTING.md)

## 🏗️ 技术栈

- **前端**: Next.js 14, React 18, PixiJS, Yjs
- **后端**: Go (Gin), Rust (Axum)
- **CRDT**: Yjs → 自研 (YATA算法)
- **AI**: OpenAI, Anthropic, 本地模型
- **数据库**: PostgreSQL, Redis

## 🤝 参与贡献

我们欢迎所有形式的贡献！

- 提交 Bug 报告或功能请求
- 改进文档
- 提交 Pull Request

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

[MIT License](LICENSE) © 2024 Mind-Fuse

## 🙏 致谢

- [tldraw](https://github.com/tldraw/tldraw) - 白板设计灵感
- [Yjs](https://github.com/yjs/yjs) - CRDT 实现参考
- [Excalidraw](https://github.com/excalidraw/excalidraw) - UI 设计参考

## 📞 联系我们

- Discord: [加入社区](https://discord.gg/xxx)
- Twitter: [@mind_fuse](https://twitter.com/mind_fuse)
- Email: hello@mind-fuse.com

---

**Star ⭐ 这个项目，关注最新进展！**
```

---

### 3.2 CONTRIBUTING.md

```markdown
# 贡献指南

感谢你对 Mind-Fuse 的兴趣！本指南将帮助你了解如何参与项目贡献。

## 行为准则

参与本项目，请遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。

## 如何贡献

### 报告 Bug

提交 Bug 前，请：

1. 搜索 [已有 Issues](https://github.com/user/mind-fuse/issues) 确保不重复
2. 使用最新版本重现问题
3. 准备好重现步骤

提交 Bug 时，请包含：

- 详细的问题描述
- 重现步骤
- 期望行为和实际行为
- 环境信息（浏览器、操作系统等）
- 截图或视频（如适用）

### 提出功能建议

我们欢迎新功能建议！请：

1. 搜索是否已有类似建议
2. 清晰描述功能的用例和价值
3. 提供示例或设计图（如适用）

### 提交代码

#### 开发环境设置

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/mind-fuse.git
cd mind-fuse

# 2. 安装依赖
pnpm install

# 3. 配置开发环境
./scripts/setup-dev.sh

# 4. 启动开发服务器
pnpm dev
```

#### 开发流程

1. **创建分支**
   ```bash
   git checkout -b feat/123-your-feature
   ```

2. **编写代码**
   - 遵循 [代码规范](#代码规范)
   - 编写测试
   - 更新文档

3. **提交变更**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```
   - 遵循 [Commit 规范](./plan.md#git-提交规范)

4. **推送并创建 PR**
   ```bash
   git push origin feat/123-your-feature
   ```
   - 在 GitHub 上创建 Pull Request
   - 填写 PR 模板

5. **代码审查**
   - 响应审查意见
   - 修改后推送更新

6. **合并后**
   - 删除分支
   - 更新本地 main 分支

#### 代码规范

- **TypeScript**: 遵循 ESLint 配置
- **Go**: 遵循 golangci-lint 配置
- **Rust**: 遵循 Clippy 配置
- **测试**: 覆盖率 > 80%
- **文档**: 所有公共 API 必须有文档注释

详见 [plan.md](./plan.md)

#### 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test packages/canvas-engine

# 运行 Go 测试
cd apps/api-go && go test ./...

# 运行 Rust 测试
cargo test --workspace
```

#### 性能测试

```bash
# 前端性能
pnpm test:perf

# Rust 基准测试
cargo bench
```

## 项目结构

```
mind-fuse/
├── apps/          # 应用
│   ├── web/       # Next.js 前端
│   ├── api-go/    # Go 后端
│   └── docs/      # 文档站
├── packages/      # TypeScript 包
├── crates/        # Rust 包
├── docs/          # 项目文档
└── scripts/       # 工具脚本
```

详见 [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 发布流程

（维护者专用）

1. 更新版本号
2. 更新 CHANGELOG
3. 创建 Git tag
4. 推送 tag 触发 CI 发布

## 获取帮助

- [Discord 社区](https://discord.gg/xxx)
- [GitHub Discussions](https://github.com/user/mind-fuse/discussions)
- Email: dev@mind-fuse.com

## 致谢

所有贡献者都会在 [CONTRIBUTORS.md](./CONTRIBUTORS.md) 中列出。

感谢你的贡献！🎉
```

---

### 3.3 CODE_OF_CONDUCT.md

```markdown
# 贡献者行为准则

## 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺：无论年龄、体型、残疾、种族、性别认同和表达、经验水平、教育程度、社会经济地位、国籍、个人外貌、种族、宗教或性取向如何，参与我们项目和社区的每个人都将获得无骚扰的体验。

## 我们的标准

有助于创造积极环境的行为包括：

- 使用友好和包容的语言
- 尊重不同的观点和经历
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

不可接受的行为包括：

- 使用性化的语言或图像，以及不受欢迎的性关注或挑逗
- 挑衅、侮辱/贬损性评论，以及人身或政治攻击
- 公开或私下骚扰
- 未经明确许可，发布他人的私人信息（如物理地址或电子邮件地址）
- 在专业环境中可能被合理认为不适当的其他行为

## 我们的责任

项目维护者有责任澄清可接受行为的标准，并对任何不可接受的行为采取适当和公平的纠正措施。

项目维护者有权利和责任删除、编辑或拒绝与本行为准则不符的评论、提交、代码、wiki 编辑、问题和其他贡献，或暂时或永久禁止任何他们认为有不适当、威胁、冒犯或有害行为的贡献者。

## 范围

本行为准则适用于项目空间和公共空间，当个人代表项目或其社区时。代表项目或社区的示例包括使用官方项目电子邮件地址、通过官方社交媒体账户发布信息，或在在线或离线活动中担任指定代表。

## 执行

可以通过 conduct@mind-fuse.com 联系项目团队来报告滥用、骚扰或其他不可接受的行为。所有投诉都将被审查和调查，并将做出被认为必要和适当的回应。项目团队有义务对事件报告者保密。

不遵守或不执行本行为准则的项目维护者可能会面临项目领导层决定的临时或永久后果。

## 归属

本行为准则改编自 [Contributor Covenant](https://www.contributor-covenant.org) 版本 2.1，
可在 https://www.contributor-covenant.org/version/2/1/code_of_conduct.html 查看。
```

---

### 3.4 SECURITY.md

```markdown
# 安全政策

## 报告安全漏洞

Mind-Fuse 团队认真对待所有安全漏洞。感谢你帮助我们改进项目的安全性。

### 如何报告

**请不要**通过公开 GitHub issues 报告安全漏洞。

请发送电子邮件至 security@mind-fuse.com，包含：

- 漏洞描述
- 重现步骤
- 潜在影响
- 建议的修复方案（如有）

我们将在 48 小时内确认收到你的报告，并在 7 天内提供详细响应。

### 披露政策

- 我们会调查和验证报告
- 修复漏洞并发布补丁
- 在修复发布后，公开披露漏洞详情
- 感谢报告者（如同意）

### 支持的版本

| 版本 | 支持状态 |
| ---- | -------- |
| 1.x  | ✅ 支持  |
| < 1.0 | ❌ 不支持 |

### 安全更新

安全更新将通过以下渠道发布：

- GitHub Security Advisories
- 项目 Changelog
- Discord 社区公告
- 邮件列表（订阅：security-announce@mind-fuse.com）

## 安全最佳实践

### 对于用户

- 始终使用最新版本
- 定期更新依赖
- 使用强密码和 2FA
- 不要在公共场所分享敏感数据

### 对于开发者

- 遵循安全编码规范
- 定期运行安全扫描
- 及时更新依赖
- 代码审查时关注安全问题

## 依赖安全

我们使用以下工具监控依赖安全：

- Dependabot (GitHub)
- npm audit / pnpm audit
- cargo audit

## 致谢

我们感谢以下安全研究人员的贡献：

（名单将在此处更新）
```

---

### 3.5 CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

### Changed
- TBD

### Deprecated
- TBD

### Removed
- TBD

### Fixed
- TBD

### Security
- TBD

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Infinite canvas with zoom and pan
- Real-time collaboration using Yjs
- AI-powered layout algorithms
- Basic shape tools (rectangle, circle, line, text)
- User authentication and workspaces

### Changed
- N/A

### Security
- N/A

## [0.1.0] - 2024-10-15

### Added
- Project initialization
- Basic canvas rendering
- Simple shape drawing

---

[Unreleased]: https://github.com/user/mind-fuse/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/mind-fuse/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/user/mind-fuse/releases/tag/v0.1.0
```

---

### 3.6 LICENSE

```
MIT License

Copyright (c) 2024 Mind-Fuse Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 四、CI/CD 最佳实践

### 4.1 GitHub Actions 配置

#### CI 工作流

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint TypeScript
        run: pnpm lint

      - name: Lint Go
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
          working-directory: apps/api-go

      - name: Lint Rust
        run: |
          cargo clippy --workspace --all-targets --all-features -- -D warnings
          cargo fmt --all -- --check

  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  test-go:
    name: Test Go
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
          cache: true
          cache-dependency-path: apps/api-go/go.sum

      - name: Run tests
        working-directory: apps/api-go
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/api-go/coverage.out

  test-rust:
    name: Test Rust
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      - name: Run tests
        run: cargo test --workspace --all-features

      - name: Run doc tests
        run: cargo test --doc --workspace

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test-frontend, test-go, test-rust]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build WASM
        run: |
          cd crates/ai-layout
          wasm-pack build --target web

      - name: Build frontend
        run: pnpm build

      - name: Build Go
        working-directory: apps/api-go
        run: go build -o bin/server cmd/server/main.go

      - name: Build Rust
        run: cargo build --release --workspace
```

#### Benchmark 工作流

```yaml
# .github/workflows/benchmark.yml

name: Benchmark

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    name: Run Benchmarks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Run benchmarks
        run: cargo bench --workspace

      - name: Store benchmark result
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'cargo'
          output-file-path: target/criterion/*/new/estimates.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true
          alert-threshold: '150%'
          comment-on-alert: true
          fail-on-alert: true
```

#### Release 工作流

```yaml
# .github/workflows/release.yml

name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Changelog
        run: |
          # 使用 conventional-changelog 生成
          npx conventional-changelog-cli -p angular -i CHANGELOG.md -s

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: ./CHANGELOG.md
          draft: false
          prerelease: false

  publish-npm:
    name: Publish to npm
    runs-on: ubuntu-latest
    needs: release
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Publish packages
        run: pnpm publish -r
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-crates:
    name: Publish to crates.io
    runs-on: ubuntu-latest
    needs: release
    steps:
      - uses: actions/checkout@v4

      - name: Publish crates
        run: cargo publish --all
        env:
          CARGO_REGISTRY_TOKEN: ${{ secrets.CRATES_IO_TOKEN }}
```

---

### 4.2 代码审查规范

#### 审查清单

**功能性**
- [ ] 代码是否实现了预期功能？
- [ ] 是否有边界情况处理？
- [ ] 错误处理是否完善？

**代码质量**
- [ ] 代码是否遵循项目风格指南？
- [ ] 命名是否清晰明确？
- [ ] 是否有重复代码？
- [ ] 复杂度是否过高？（函数是否过长？）

**测试**
- [ ] 是否有充足的测试？
- [ ] 测试是否覆盖了边界情况？
- [ ] 是否有集成测试？

**性能**
- [ ] 是否有性能问题？
- [ ] 是否有不必要的计算或内存分配？
- [ ] 对于关键路径，是否有性能测试？

**安全**
- [ ] 是否有安全漏洞？
- [ ] 输入是否经过验证？
- [ ] 是否正确处理了敏感数据？

**文档**
- [ ] 是否有足够的代码注释？
- [ ] API 是否有文档？
- [ ] README 是否需要更新？

**向后兼容**
- [ ] 是否有破坏性变更？
- [ ] 是否需要迁移指南？

#### 审查技巧

**作为审查者**
1. **理解上下文** - 先阅读 PR 描述和相关 issue
2. **整体浏览** - 先整体理解变更，再深入细节
3. **建设性反馈** - 提出具体建议，而不仅仅指出问题
4. **区分优先级** - 明确哪些是必须修改，哪些是建议
5. **及时审查** - 不要让 PR 等待太久

**作为提交者**
1. **小而精的 PR** - 避免过大的 PR（< 500 行变更）
2. **清晰的描述** - 说明"为什么"而不仅仅是"做了什么"
3. **自我审查** - 提交前先自己审查一遍
4. **响应及时** - 及时响应审查意见
5. **保持讨论友好** - 尊重不同意见

#### 审查评论示例

```markdown
# ✅ 好的评论

## 明确且建设性
建议使用 `Array.find()` 代替循环，这样更简洁：
\`\`\`typescript
const user = users.find(u => u.id === id);
\`\`\`

## 解释原因
这里应该添加错误处理，因为网络请求可能失败：
\`\`\`typescript
try {
  const data = await fetchData();
} catch (error) {
  logger.error('Failed to fetch data', error);
  // 回退逻辑
}
\`\`\`

## 提供上下文
根据我们的性能测试，这里使用 `Map` 会比 `Object` 快 2 倍。
参考：docs/performance.md#map-vs-object

# ❌ 不好的评论

## 过于简短
"这样不行"

## 没有解释
"改成用 Map"

## 过于主观
"我不喜欢这种写法"

## 命令式语气
"必须改成这样"
```

---

## 五、总结

### 规范的价值

1. **提升代码质量**
   - 可读性更好
   - bug 更少
   - 维护成本更低

2. **提高协作效率**
   - 减少沟通成本
   - 降低代码审查时间
   - 新人上手更快

3. **增强项目可持续性**
   - 完善的文档
   - 清晰的历史
   - 活跃的社区

4. **学习和成长**
   - 最佳实践的示范
   - 持续改进的基础
   - 职业发展的资产

### 核心原则

- ✅ **一致性优于个人偏好**
- ✅ **清晰优于简洁**
- ✅ **显式优于隐式**
- ✅ **可读性优于性能**（在不必要优化的情况下）
- ✅ **文档和测试是代码的一部分**

### 持续改进

规范不是一成不变的，我们会：

- 定期审查和更新规范
- 采纳社区的反馈
- 跟进最新的最佳实践
- 在实践中不断优化

---

**记住**：规范是为了帮助我们写出更好的代码，而不是束缚。当规范与实际需求冲突时，优先解决问题，然后讨论是否需要调整规范。
