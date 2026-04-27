# Mind-Fuse 项目修正方案

> 本文件是当前项目的**正式修正方案**，承接 [`docs/product-strategy.md`](./product-strategy.md) 的产品定义。
>
> 它要把仓库结构、领域模型、文档叙事和入口分层都对齐到 **canvas-native technical investigation workspace** 这一方向。

---

## 0. 修正方案的目标

把当前项目从“AI 协作白板 / Diagram 生成器”这一旧叙事，对齐到：

> 面向高认知负荷开发者的 canvas-native technical investigation workspace。

### 0.1 产品的真正核心是什么

产品的核心**不是 `apps/web`**。产品的核心是 `packages/` 中的领域 + 引擎能力，以及承载 canvas-native investigation 体验的 **workspace 入口**。

`apps/web` 在新方向下的真实角色是：登录注册、Investigation 列表、组织/账户/订阅设置等**周边管理面**。它的依赖、渲染策略、交互模式与画布工作面完全不同，把两者塞进同一个 surface 只会叠加复杂度。

因此入口分层修正为：

- **管理面**：`apps/web`（账号、列表、设置等周边页面）
- **工作面**：`apps/workspace`（**新增**，canvas-native investigation 体验本身，是产品价值所在）
- **未来 capture 入口**：浏览器扩展 / IDE 插件 / 剪贴板 / 分享菜单 / CLI / 邮件 inbound 等，都通过 `packages/` 把 capture 投递到 workspace 中的画布

### 0.2 具体要求

1. 旧 Diagram / 通用白板叙事必须**降级或归档**，不再在代码、文档、README 中作为主线。
2. 画布底座（`@mind-fuse/types` + `@mind-fuse/collaboration-core`）保留，但**不能作为产品定义**。
3. 必须新增 **Investigation 领域模型**，作为产品的真正核心。
4. 所有 Investigation 核心对象必须有 **canvas representation**（不允许只存在于列表/inbox）。
5. 入口必须分层：`apps/web` = 管理面、`apps/workspace` = 工作面。
6. `packages/` 下与新方向不再相符的占位目录必须**真正删除**，不为了避免冲突而全部保留。
7. **画布渲染从一开始就用 PixiJS v8（WebGL/WebGPU）**，不走 SVG/DOM 过渡，对齐原 `plan.md` 的渲染主张（这是少数被保留下来的旧路线决定）。

---

## 1. 当前项目状态盘点

### 1.1 仍然有效（保留）

| 路径 | 说明 |
|------|------|
| `docs/product-strategy.md` | 当前正式产品定义，**唯一真相源** |
| `docs/DESIGN_METHODOLOGY.md` | 类型系统设计方法论，方法论本身有效 |
| `packages/types/src/{ids,geometry,shapes,bindings,groups,comment,binding-validator}.ts` | 画布底座类型，作为 substrate 保留 |
| `packages/collaboration-core/src/{DocumentManager,SpatialGrid}.ts` | Yjs 文档 + 空间索引，作为 substrate 保留 |

### 1.2 与新方向冲突（必须处理）

| 路径 | 问题 | 处理方式 |
|------|------|----------|
| `plan.md` | 旧 Diagram/语义图表/布局引擎路线 | `git mv` 到 `docs/archive/plan-v1-diagram.md`，顶部加归档说明（PixiJS 渲染主张除外，已被本方案吸收） |
| `new-plan.md` | 知识白板早期探索稿 | `git mv` 到 `docs/archive/plan-v2-exploration.md`，加同样归档说明 |
| `packages/types/src/diagrams/base.ts` | 空文件，旧 Diagram 路线残留 | 删除整个 `diagrams/` 目录 |
| `package.json` 顶层 description | "AI-native collaborative whiteboard with self-implemented CRDT" | 改为 canvas-native technical investigation workspace |
| `CLAUDE.md` Project Overview / Current Development Phase / Architecture Notes | 仍写 Miro/FigJam 类协作白板 | 重写：删除 Miro/FigJam 类比；说明 `apps/web` = 管理面 / `apps/workspace` = 工作面；引用 `docs/product-strategy.md` 与本文件 |
| `apps/web/src/app/page.tsx` | Next.js 模板页 | 改为管理面骨架（登录入口 + Investigation 列表占位） |
| `docs/MIRO_DIAGRAMS.md` | 旧白板路线参考资料 | 顶部加“仅作参考、非产品方向”说明 |

### 1.3 空壳包（按是否仍与新方向相符做真正取舍）

| 包 | 与新方向是否相符 | 处理 |
|----|------------------|------|
| `editor` | **强相符**：基于 PixiJS v8 的画布交互引擎是 canvas-native 的核心 | **保留并明确职责**（§2.1） |
| `ai-sdk` | **强相符**：AI Suggestion 协议必须有专属包承载 | **保留并明确职责**（§2.1） |
| `store` | **相符**：Selection / Viewport / Suggestion 队列等应用状态需要独立层 | **保留并明确职责**（§2.1） |
| `schema` | **相符**：Investigation 跨入口序列化（导入导出、版本演进）需要 | **保留并明确职责**（§2.1） |
| `validate` | **强相符**：entity↔Shape 强约束、AI 输出校验需要 Zod 层 | **保留并明确职责**（§2.1） |
| `utils` | **相符**：通用工具 | 保留 |
| `collaboration` | **不相符（短期）**：MVP 是 single-player，`collaboration-core` 已包含 Yjs；多协作 Provider 抽象暂不需要单独包 | **删除**，待真正需要多 Provider 时按新方向重建 |
| `mind-fuse` | **不相符**：包名与 monorepo 名重复，无明确职责，是旧占位 | **删除** |
| `assets` | **不相符（短期）**：MVP 不引入图片/媒体资产管线 | **删除**，待 capture 接入截图/图片再重建 |

> 取舍原则：**只保留与 canvas-native investigation workspace 强相关、且短期内会真实填充的包**；其余删除，避免架构图被空壳目录污染。

---

## 2. 修正后的目录结构

```
apps/
├── web/                      # 周边管理面：登录 / 注册 / Investigation 列表 / 组织 / 设置 / 订阅
└── workspace/                # 【新增】产品工作面：canvas-native investigation 体验（PixiJS v8）

packages/
├── 【Substrate 层 — 画布与协作底座】
│   ├── types/                # 画布原语：ids / geometry / shapes / bindings / groups / comment
│   └── collaboration-core/   # Yjs DocumentManager + SpatialGrid
│
├── 【Domain 层 — 产品本体，新增】
│   └── investigation/        # 【新增】Investigation 领域模型（§3）
│
├── 【Engine 层 — 围绕 Domain 的能力实现】
│   ├── editor/               # PixiJS v8 渲染 + 交互引擎：scene graph / 选择 / 拖拽 / 平移缩放 / 卡片 / inbox lane
│   ├── store/                # 应用状态层：Investigation 切换 / Selection / Viewport / Suggestion 队列
│   ├── ai-sdk/               # AI 边界实现：AISuggestion 协议 / LLM 调用封装 / candidate 提取
│   ├── schema/               # 跨入口序列化：Investigation 导入导出、版本演进
│   └── validate/             # Zod / 运行时校验：entity 强约束、AI 输出校验
│
└── utils/                    # 通用工具
```

> 删除的目录：`packages/{mind-fuse, assets, collaboration}`、`packages/types/src/diagrams/`。

### 2.1 各包定位（明确职责，避免再次空壳化）

| 包 | 层 | 修正后职责 | 何时填充 |
|----|----|------------|----------|
| `types` | Substrate | 画布原语，不引入 Investigation 类型 | 已就绪 |
| `collaboration-core` | Substrate | Y.Doc + SpatialGrid + DocumentManager | 已就绪 |
| `investigation` | **Domain** | 产品本体（§3、§4） | **第一优先** |
| `validate` | Engine | Zod 校验：entity↔Shape 强约束、ConclusionStatus 状态机、AISuggestion 输入输出 | 与 `investigation` 同期 |
| `editor` | Engine | **PixiJS v8** 渲染 + 交互引擎：scene graph、卡片 Container、平移缩放、hit-test、inbox lane；消费 `types` + `investigation` + `store` | Investigation 模型稳定后 |
| `store` | Engine | 应用状态：Selection / Viewport / Suggestion 队列；与具体入口无关 | 与 `editor` 同期 |
| `ai-sdk` | Engine | `AISuggestion` 协议落地、LLM 调用封装；遵循 §5 | Investigation 模型稳定后，先 mock 后接 LLM |
| `schema` | Engine | Investigation 序列化、跨入口导入导出 | 工作面原型可运行后 |
| `utils` | Shared | 通用工具 | 按需 |

---

## 3. 领域模型修正

### 3.1 新增 ID

在 `packages/investigation/src/ids.ts`（不污染 `@mind-fuse/types`）：

```ts
type InvestigationId = string & { readonly __brand: 'InvestigationId' }
type CaptureId       = string & { readonly __brand: 'CaptureId' }
type SourceId        = string & { readonly __brand: 'SourceId' }
type QuestionId      = string & { readonly __brand: 'QuestionId' }
type EvidenceId      = string & { readonly __brand: 'EvidenceId' }
type HypothesisId    = string & { readonly __brand: 'HypothesisId' }
type ConclusionId    = string & { readonly __brand: 'ConclusionId' }
type SnapshotId      = string & { readonly __brand: 'SnapshotId' }
```

ID 前缀：`investigation:`、`capture:`、`source:`、`question:`、`evidence:`、`hypothesis:`、`conclusion:`、`snapshot:`。

### 3.2 核心实体

| 实体 | 主要字段 | 画布表达 |
|------|----------|----------|
| `Investigation` | id, title, createdAt, updatedAt, rootSnapshotId? | 一个 Investigation = 一张画布 |
| `CaptureItem` | id, kind: 'text'\|'link'\|'snippet'\|'ai-answer', content, sourceId?, createdAt, promotedTo?: QuestionId\|EvidenceId | 进入画布的 inbox lane（画布上一个固定区域，不是侧栏） |
| `Source` | id, kind: 'url'\|'file'\|'rfc'\|'pr'\|'chat'\|'doc', uri, title, fetchedAt | 画布上的 Source 卡片 |
| `Question` | id, text, status: QuestionStatus, parentQuestionId?, relatedSourceIds, relatedEvidenceIds | 画布上的 Question 卡片 |
| `Evidence` | id, content, sourceId, supports: HypothesisId[], contradicts: HypothesisId[] | 画布上的 Evidence 卡片，连线表达 supports/contradicts |
| `Hypothesis` | id, statement, status: HypothesisStatus, evidenceIds | 画布上的 Hypothesis 卡片 |
| `Conclusion` | id, statement, status: ConclusionStatus, hypothesisIds, supersededBy?: ConclusionId | 画布上的 Conclusion 卡片 |
| `Snapshot` | id, investigationId, createdAt, summary, capturedShapeIds, capturedQuestionIds, capturedConclusionIds | 一个 Snapshot = 当前画布的语义切片 + 缩略图 |

### 3.3 状态枚举

```ts
type QuestionStatus   = 'open' | 'active' | 'parked' | 'closed'
type HypothesisStatus = 'proposed' | 'supported' | 'refuted' | 'inconclusive'
type ConclusionStatus = 'hypothesis' | 'verified' | 'rejected' | 'outdated'
```

> `ConclusionStatus` 直接回归 `new-plan.md` 早期的可信度模型。正式策略不应弱化这一层。

### 3.4 Canvas Binding（关键，禁止跳过）

`canvas-binding.ts` 定义每个 Investigation 实体在画布上的对应 Shape：

```ts
interface CanvasBinding {
  entityId: CaptureId | SourceId | QuestionId | EvidenceId | HypothesisId | ConclusionId
  shapeId: ShapeId        // 必须存在
  role: 'card' | 'inbox-slot' | 'snapshot-frame'
}
```

**强约束**：

- 任何核心实体被创建时，**必须**同时创建对应 Shape，否则不允许写入 Yjs。
- 删除 Shape 时，关联实体进入 `archived` 状态而不是物理删除（保留 investigation 历史）。
- AI 不得直接修改 Shape 几何位置；只能产生 **suggestion**（见 §5）。

---

## 4. 协作层修正

新增 `packages/investigation/src/manager/InvestigationDocumentManager.ts`：

- 复用 `@mind-fuse/collaboration-core` 的 `DocumentManager`，但在同一个 `Y.Doc` 上额外管理：
  - `Y.Map<InvestigationId, Investigation>`
  - `Y.Map<CaptureId, CaptureItem>`
  - `Y.Map<SourceId, Source>`
  - `Y.Map<QuestionId, Question>`
  - `Y.Map<EvidenceId, Evidence>`
  - `Y.Map<HypothesisId, Hypothesis>`
  - `Y.Map<ConclusionId, Conclusion>`
  - `Y.Map<SnapshotId, Snapshot>`
  - `Y.Map<string, CanvasBinding>`（key = entityId）
- API 必须强制 entity ↔ shape 的事务性创建（见 §3.4 强约束），由 `@mind-fuse/validate` 校验。

> 协作能力作为 substrate 留着，但 MVP 明确是 single-player：先不上 WebSocket / 多人光标。`packages/collaboration` 占位包已在 §1.3 删除，待真正需要多 Provider 抽象时再按新方向重建。

---

## 5. AI 边界

新增 `docs/AI_BOUNDARY.md`，并由 `@mind-fuse/ai-sdk` 实现：

- **AI 允许的输出形式**：
  - 候选 Question（从 CaptureItem 中提取）
  - 候选 Hypothesis / Conclusion 草稿
  - Evidence 与 Hypothesis 的 supports/contradicts 关系建议
  - 画布布局建议（仅作为 ghost layer，不直接修改 Shape）
  - Snapshot 摘要草稿
- **AI 禁止的行为**：
  - 直接修改 Shape 的 x/y/几何属性
  - 直接将 ConclusionStatus 从 `hypothesis` 提升到 `verified`
  - 主动 push 通知 / 弹窗
  - 跨 Investigation 自动归并

实现层面：AI 输出统一通过一个 `AISuggestion` 类型，需要用户在画布上**显式接受**才落到 `Y.Doc`。`@mind-fuse/validate` 必须为 `AISuggestion` 提供 Zod schema。

---

## 6. 入口层

### 6.1 `apps/web` — 周边管理面

职责（明确不包含画布工作面）：

- 登录 / 注册 / OAuth
- Investigation 列表 / 创建 / 删除 / 重命名
- 组织 / 成员 / 权限管理
- 账户、订阅、计费、设置
- 通知中心、活动记录（被动回访的 web 表面，可选）

实现取向：常规 Next.js SSR/RSC 应用，依赖 `@mind-fuse/investigation`（只读元数据）+ `@mind-fuse/schema`（导入导出），**不依赖** `@mind-fuse/editor`，**不引入 PixiJS**。

### 6.2 `apps/workspace` — canvas-native 工作面（新增）

职责：

- 承载真正的 canvas-native investigation 体验
- 通过 URL 打开某个 Investigation（如 `/w/:investigationId`），渲染整张画布
- Capture 落入画布 inbox lane、卡片提升、连线、Snapshot 创建/恢复
- 对接 `@mind-fuse/editor` + `@mind-fuse/store` + `@mind-fuse/ai-sdk`

实现取向：

- Next.js 仅作壳，画布部分 client-only，禁止 SSR 渲染 PixiJS 树。
- **从一开始就使用 PixiJS v8（WebGL/WebGPU）作为唯一渲染管线**，不走 SVG/DOM 过渡。卡片文本、富文本编辑可以使用 DOM overlay，但所有几何/连线/选择框/marquee/viewport 全部在 PixiJS 场景中渲染。
- 平移、缩放（含 60fps 缩放）、hit-test、批量更新都依赖 PixiJS 的 scene graph + spatial culling，由 `@mind-fuse/editor` 内部实现。

### 6.3 工作面最小可运行能力

`apps/workspace` 第一个版本必须并且只需要证明：

1. 能创建一个 Investigation（= 一张画布）。
2. 能通过最低打断方式向画布的 inbox lane 投递 CaptureItem（粘贴文本/链接即生效）。
3. 能把 CaptureItem 提升为 Question / Evidence 卡片。
4. 能在画布上连线表达 supports / contradicts。
5. 能给 Conclusion 标注 ConclusionStatus 并且看见 `outdated` 标记。
6. 能创建并打开 Snapshot，恢复一段 investigation 的视觉与语义状态。

以上交互必须在 PixiJS 渲染面中完成，不允许临时退化为 HTML 列表。

### 6.4 入口与产品核心的边界

- 任何入口（`apps/web`、`apps/workspace`、未来的扩展/插件）**不直接持有领域逻辑**：所有 Investigation 状态变更走 `@mind-fuse/store` + `@mind-fuse/investigation`。
- 任何入口**不直接调 LLM**：走 `@mind-fuse/ai-sdk` 暴露的 Suggestion API。
- 任何入口**不直接实现画布交互**：调用 `@mind-fuse/editor` 暴露的组件/hooks。
- 任何入口**不直接 import `pixi.js`**：PixiJS 仅由 `@mind-fuse/editor` 持有，对外只暴露 React 组件 / hooks / 命令式 API。

---

## 7. 文档与叙事修正

| 文件 | 操作 |
|------|------|
| `plan.md` | `git mv plan.md docs/archive/plan-v1-diagram.md`，并在文件顶部加 `> ARCHIVED: 旧 Diagram 路线，不再有效。其中 PixiJS v8 渲染主张被本方案吸收。` |
| `new-plan.md` | `git mv new-plan.md docs/archive/plan-v2-exploration.md`，加归档说明 |
| `package.json` 顶层 `description` | 改为 `Canvas-native technical investigation workspace for high-cognitive-load developers` |
| `CLAUDE.md` | 重写：删除 Miro/FigJam 类比；说明 `apps/web` = 管理面 / `apps/workspace` = 工作面；指出画布渲染统一走 PixiJS v8；引用 `docs/product-strategy.md` 与本文件 |
| `README.md`（如有） | 同步对齐 |
| `docs/MIRO_DIAGRAMS.md` | 顶部加“仅作参考、非产品方向”说明 |

---

## 8. 执行顺序（不含时间预估）

1. **文档与叙事降级**：归档旧 plan，更新 `package.json` description 与 `CLAUDE.md`。
2. **删除与新方向不再相符的目录**：`packages/{mind-fuse, assets, collaboration}` 与 `packages/types/src/diagrams/`。
3. **保留包补 charter**：为 `editor` / `ai-sdk` / `store` / `schema` / `validate` / `utils` 各补一份 `README.md` + 完整 `package.json`，按 §2.1 写清职责（`editor` 明确 PixiJS v8 渲染管线）。
4. **新增 `@mind-fuse/investigation` 包（Domain 层第一）**：按 §3 实现 IDs / entities / status / canvas-binding。
5. **填充 `@mind-fuse/validate`**：用 Zod 把 §3.4 强约束、ConclusionStatus 状态机、AISuggestion schema 变成运行时校验。
6. **实现 `InvestigationDocumentManager`**：按 §4 在同一 `Y.Doc` 上扩展 Maps，事务性创建 entity 与对应 Shape。
7. **写 `docs/AI_BOUNDARY.md` 与 `@mind-fuse/ai-sdk` 骨架**：明确 §5 的 `AISuggestion` 协议（先放类型 + mock，不接 LLM）。
8. **填充 `@mind-fuse/editor`（PixiJS v8）+ `@mind-fuse/store` 骨架**：建立 PixiJS Application 启动、scene graph、卡片 Container、平移缩放、hit-test 与 store 的桥接，把交互从入口层抽出。
9. **新增 `apps/workspace`**：实现 §6.3 的 6 个最小能力，画布完全在 PixiJS 上，全部通过 packages 调用，不在 app 中写领域逻辑。
10. **改造 `apps/web`**：替换 Next.js 模板为管理面骨架（登录入口 + Investigation 列表占位），依赖 `@mind-fuse/investigation` 元数据 + `@mind-fuse/schema`，不引入 PixiJS。
11. **补测试**：`investigation` + `validate` 关键契约必须有 Vitest 单测，目标覆盖率 ≥80%；`editor` 渲染层补关键 hit-test / viewport 单测。

---

## 9. 验收标准

- [ ] 仓库内不再出现旧 Diagram 路线作为主线叙事。
- [ ] `docs/product-strategy.md` + `docs/REMEDIATION_PLAN.md` + `docs/AI_BOUNDARY.md` 构成一致的产品定义。
- [ ] `packages/{mind-fuse, assets, collaboration}` 与 `packages/types/src/diagrams/` 已删除。
- [ ] 保留的 `packages/*` 都有 README + 明确职责，且都在执行顺序中真实填充，不留空壳。
- [ ] `@mind-fuse/investigation` 提供完整的 Investigation 领域类型与 manager。
- [ ] 任何 Investigation 实体都不能脱离 Shape 单独存在（强约束有测试覆盖）。
- [ ] `apps/web` 是管理面，不直接持有画布或领域逻辑，且不依赖 `pixi.js`。
- [ ] `apps/workspace` 跑起来后能完成 §6.3 描述的 6 个用户动作，且画布渲染完全由 PixiJS v8 承担。
- [ ] 任何入口都不直接调 LLM、不直接实现画布交互、不直接写领域逻辑、不直接 import `pixi.js`。
- [ ] `pnpm test`、`pnpm type-check`、`pnpm lint` 全绿。

---

## 10. 已知保留风险

- **PixiJS v8 上手成本**：从一开始就用 PixiJS（含 WebGPU 渲染器尝试）会让 `editor` 包的初期投入更重。换来的是不必再做 SVG/DOM → WebGL 的二次迁移，并且性能上限直接拉满，与产品对“高认知负荷开发者长期画布”的定位一致。
- **WebGPU 兼容性**：PixiJS v8 默认在不支持 WebGPU 的环境会回落到 WebGL，需要在 `editor` 启动逻辑中显式声明回落策略，并写入 `editor/README.md`。
- **AI 集成时机**：AI 边界已在文档与 `ai-sdk` 协议中定义，但实际 LLM 调用留到 workspace 原型可运行后再做。
- **协作能力**：MVP single-player，但 `Y.Doc` 模型已经为后续协作留好接口。需要多 Provider 抽象时再重新创建 `@mind-fuse/collaboration`，按新方向定义，不复用旧占位。
- **跨入口 capture**：浏览器扩展 / IDE 插件 / 剪贴板等额外入口暂不在本次修正范围，但 `@mind-fuse/investigation` + `@mind-fuse/schema` 已经为之后接入留好契约。
