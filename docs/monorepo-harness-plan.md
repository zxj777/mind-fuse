# Monorepo Harness 引入计划

## 问题与当前状态

用户的问题不是“怎么改当前仓库”，而是：**如果有一个前后端同仓的全栈 monorepo，如何把 `harness-best-practices.md` 里的 Harness 模型引入进去**。

基于当前仓库状态，可以确认两件事：

1. 当前代码库提供的是 **Harness 方法论本身**，不是一个现成的 monorepo 脚手架；
2. 因此这次计划的目标不是改代码，而是输出一个 **适用于 full-stack monorepo 的引入蓝图**。

结合主文档，当前可直接复用的核心原则有：

- **Spec-Then-Build with Gates**：先做结构化 Spec，再让 AI 在边界内自治；
- **三阶段**：Co-Design → Autonomous Build → Validation；
- **四类关键护栏**：risk tiering、permission scopes、continuous verification、trace；
- **渐进采纳**：不必一开始就做到 Level 3/4，但不能把半套护栏误判成完整自治。

## 适用于 monorepo 的总思路

引入 Harness 时，不要把 monorepo 视为“一个巨大项目”，而应拆成 **三层治理对象**：

1. **仓库级 Harness**
   - 约束全仓都必须遵守的东西：Feature ID、Spec 模板、风险分层、权限作用域、Trace 策略、Gate 规则。

2. **子系统级 Harness**
   - 分前端、后端、共享包三块：
   - 前端关注 UI 行为、组件复用、交互测试；
   - 后端关注 API 契约、schema 变更、集成测试、迁移策略；
   - 共享包关注 types / contract / domain model 的稳定性。

3. **跨栈 Feature Harness**
   - 真正执行时，不是“前端一套、后端一套各跑各的”，而是围绕 **一个 feature 的单一 Spec** 协调：
   - 同一份 Spec 下拆出 frontend / backend / contract / rollout 子任务；
   - 所有任务共享同一个 Feature ID、DoD、风险判断与验收标准。

换句话说：**monorepo 的关键不是多目录，而是多边界。Harness 的作用就是把这些边界显式化。**

## 建议的仓库落点

推荐在 monorepo 根目录建立统一的 Harness 资产区，而不是把规则散落在前后端各自目录里。一个典型形态可以是：

```text
/harness
  /specs
    /feature-123
      spec.md
      progress.json
      report.json
  /policies
    risk-tiering.yaml
    permission-scopes.yaml
    trace-policy.md
    gate-rules.md
  /templates
    spec-template.md
    report-template.json
  /contexts
    monorepo-context.md        # 仓库全局背景，供所有 agent 读入
    frontend-context.md        # 前端专属约束（UI 体系、路由、状态管理等）
    backend-context.md         # 后端专属约束（框架、权限、事务边界等）
    contracts-context.md       # contract 演进规则、兼容性策略

/apps
  /web
  /api

/packages
  /contracts
  /shared
  /domain

/infra
/migrations
```

核心原则：

- **仓库级规则放根目录**：风险分层、权限边界、Trace 治理不能只属于某个子项目；
- **子项目规则就近放置**：前端/后端各自的实现约束和局部 context 放在对应目录；
- **跨栈 feature 资产单独归档**：Spec、Report、验证产物索引按 Feature ID 存放，避免前后端各写一份“自己的需求理解”。

## monorepo 中的三阶段如何落地

### Phase 1 · Co-Design

在 monorepo 里，Phase 1 的重点不是“把需求写成一份 PRD”，而是把跨前后端的变化收敛为 **一份可执行的 feature spec**。这份 Spec 至少要同时覆盖：

- 业务意图与非目标
- 前端行为与关键交互
- 后端接口 / 事件 / 数据模型变更
- 共享契约（DTO、schema、types）
- 风险点（是否碰 DB、权限、付费、外部系统）
- DoD（前后端分别怎么判定完成）
- rollout 与监控要求

对于跨栈 feature，Gate 1 不应只由“一个人签字”。更合理的做法是：

- **产品/业务 owner** 确认意图与范围；
- **前端/后端 owner** 确认各自边界与依赖；
- 触及 DB / infra / 安全时，再追加对应 owner 的 sign-off。

### Phase 2 · Autonomous Build

monorepo 中最忌讳的是让 AI 拿着一个模糊目标在前后端乱穿。更好的执行方式是：

1. 先生成 **跨栈执行计划**，并遵循以下判定规则，避免 AI 随机选顺序：
   - **Contract-first（默认）**：任何引入新 API / 新事件 / 新字段 / 改变既有契约的 feature，必须先在 `packages/contracts` 定稿、冻结 contract version 并落盘。前后端实现只能基于这份已冻结的 contract 推进，不允许“先按草稿写、回头再对齐”。
   - **Contract-first 不等于先独立 merge 到主干**：如果你的 monorepo 要求 trunk 始终可发布，那么 contract 可以先在 feature branch / draft PR 中定稿并作为下游输入，等前后端实现与验证齐备后再一起合入；关键是先锁定契约，不是先制造半成品主干。
   - **Backend-first**：contract 稳定、但后端要先完成数据/权限/业务规则校验时，frontend 允许使用 mock adapter 并行，但合并顺序仍是 backend 先、frontend 后。
   - **Frontend-first**：仅当 feature 完全不触及后端契约（纯 UI / 纯展示层调整）时才允许。
   - **并行边界**：contract 已冻结后，frontend / backend 的实现任务可并行；integration 和 rollout 永远串行在两者之后。

2. 按 feature 拆成子任务
   - `contracts`
   - `backend`
   - `frontend`
   - `integration`
   - `rollout`

3. 每个子任务在自己的权限作用域内运行
   - 前端 agent 默认不能改 `migrations/`
   - 后端 agent 默认不能直接碰 `infra/prod`
   - 共享 contract 变更视为跨模块风险，至少按 T2 处理
   - **禁止单边改 contract 规避编译错误**：前端 agent 不得为了让自己编译通过而修改 `packages/contracts`；反之亦然。contract 变更必须走独立子任务，并强制触发前后端双边验证。

4. 所有子任务共享同一 Feature ID
   - commit、PR、测试报告、部署记录、监控标签都回挂到同一个 feature

5. **Multi-agent 协调**
   - 所有 agent（frontend / backend / test / rollout）共享同一份 Spec、同一个 Feature ID、同一个可读的 progress 状态（例如 `/harness/specs/feature-123/progress.json`）。
   - 所有子任务必须绑定**同一个 Spec 版本 / hash**。`progress.json` 至少记录：Spec version、每个子任务当前阶段（planned / in-progress / done / blocked）、它在等谁、最近一次产出的 Report 路径。
   - 如果 Gate 1 之后 Spec 被修改，当前 run 应视为输入失效：相关子任务必须重排或重跑，不能让 frontend 按 v2、backend 还按 v1 继续推进。
   - 没有 progress 状态的多 agent 自治，等于“几个 agent 各自把仓库拖向不同方向”，应视为反模式。

6. **Feature-level 自愈预算**
   - 除了每个子任务自己的 self-healing budget，还要定义 **feature 总预算**，避免 frontend / backend / test agent 各自重试 10 次，合起来把整条流水线拖进“无限重试黑洞”。
   - 最小建议：同时设 **单子任务预算**（例如同一失败点最多 3 次）+ **feature 总预算**（例如整个 feature 的自愈总次数不超过 10 次）。预算耗尽后，不再继续重试，而是触发 Gate 2 升级。

### Phase 3 · Validation

Gate 3 在 monorepo 里不能只验“代码过没过 CI”，而要验跨栈事实是否闭环：

- 前端行为是否符合 Spec
- 后端契约是否稳定
- 前后端联调是否通过
- rollout / health check / business metrics 是否满足阈值
- 监控窗口是否定义清楚

最终人看的不是两边各自“都改完了”，而是 **这个跨栈 feature 是否作为一个整体完成了**。

#### Gate 3 的执行者与产物

Gate 3 最容易塌方的点是：前端 PR 绿、后端 PR 绿，但没人验“合在一起是否符合 Spec”。必须显式指派：

- **承担者**：一个 **cross-stack reviewer 角色**（人）+ 一个 **feature-level CI job**。CI job 负责聚合证据，但**不能替代 HITL 验收**；最终仍由人对照 AutoPilot Report 做结构化确认，而不是“两边各自 reviewer 各自批”。
- **输入**：Spec、frontend Report、backend Report、contract 校验结果、联调报告。
- **输出**：一份 **feature-level AutoPilot Report**（见主文档 §4.12 AutoPilot Report），聚合两边产物并针对 Spec 每一条给出通过 / 未通过 / 未覆盖。未通过或未覆盖即 Gate 3 失败，不允许“两份子报告都绿就放行”。
- **Report 的 monorepo 特有字段**（在主文档 §4.12 基础上补）：
  - 锁定的 contract version / hash + 对既有 consumer 的兼容性判断
  - 前后端联调 trace link（而不是两边各自的 CI link）
  - 两边 Gate 2 升级事件合并列表（谁在什么时候因什么升级）
  - **回滚 plan**：包含回滚顺序（见下文）与每个子任务的回滚命令 / 脚本入口
  - **跨栈未覆盖项**：哪些 Spec 条款 frontend 与 backend 都没 cover（两边都绿但合起来有盲区）
- **监控窗口（最低要求）**：上线后至少观察一个完整业务周期（例如 24h 或一个高峰时段），看关键业务指标 + 错误率 + 关键链路探针；窗口内谁持有回滚决策权必须在 Spec 里写明，不能临时找人。

#### CI / CD 集成的最低要求

Harness 不挂到 CI 上就只是文档。monorepo 下至少做到：

- **CI 强制的是验证证据，不是替代 Gate 2**：Gate 2 仍然是 Phase 2 内部由 AI 因低信心、高风险、Spec drift、权限越界或自愈预算耗尽而主动升级；CI 负责检查相关验证是否齐全、Gate 2 事件是否被正确记录。
- **feature-level job 服务于 Gate 3，而不是替代 Gate 3**：该 job 消费 Spec + 各子任务 Report，产出 feature-level AutoPilot Report；它可以失败挡发布，但最终验收动作仍是人对这份 Report 做结构化确认。
- **Trace 自动收集**：commit / PR / CI run / deploy / monitor event 均带 Feature ID label，事后能以 feature 为中心回放。
- **AutoPilot Report 作为合并/发布门禁的唯一事实来源**，而不是让 reviewer 手工去翻两边 CI。

## monorepo 里最关键的护栏

### 1. Permission Scopes 按路径与资源双重隔离

建议一开始就把这些路径视为高风险边界：

- `infra/`
- `migrations/`
- 生产环境配置
- 外部付费 API / 消息发送 / 权限配置

典型规则（T0~T4 风险层级的完整定义见 `harness-best-practices.md §4.6`；下面只给 monorepo 目录到层级的映射）：

- `apps/web/**`：默认 T1/T2
- `apps/api/**`：默认 T1/T2，触及认证/权限逻辑上升
- `packages/contracts/**`：至少 T2
- `migrations/**`：至少 T3，常常直接 T4
- `infra/**` / 生产发布：T4

**关于 `infra/`、`migrations/` 的说明**：以上路径是常见示例。如果你的 monorepo 没有这两个目录，请把对应的“高风险资源”映射到你自己的等价路径（例如 `deploy/`、`db/schema/`、`terraform/`、`.github/workflows/` 等），规则不变。

### 2. 验证层级前后端分开设计，联调单独算一层

monorepo 最容易漏掉的是“前端过了、后端过了，但合起来没过”。因此验证不应只有 FE 和 BE 两套，还应单列 **cross-stack integration**：

- 前端：lint / type / unit / e2e
- 后端：lint / type / unit / contract / integration
- 跨栈：真实或近真实环境联调、契约校验、关键链路探针

### 3. Feature Spec 要覆盖 shared contracts

如果前后端各自维护一份接口理解，Harness 基本等于失效。最稳妥的做法是：

- 共享 DTO / OpenAPI / schema / types 放进 `packages/contracts`
- Spec 明确引用这份 contract
- 任何 contract 变更都自动触发前后端双边验证

### 4. 回滚顺序必须默认按依赖图逆序展开

monorepo 里最常见的回滚事故，是“后端已回退、前端还在调新契约”的半死状态。默认回滚顺序应按依赖图**逆序**展开，而不是各子系统各回各的：

- 常见默认顺序：**rollout 先停 → frontend 先退 → backend 后退 → contracts 最后处理**
- 如果某个 feature 的真实依赖图不同，Spec 必须在 rollout 小节里**显式声明该 feature 的回滚顺序**，并在 Gate 3 前验证这一路径可行；不能临场拍脑袋决定。

关于 contracts 的回滚，有两种可接受做法，选哪种要写进 Spec 的 rollout 小节：

1. **保留新版本作兼容层**：新 contract 向后兼容旧消费者时，contracts 本身不回退，只回退实现；
2. **显式回退 contract version**：新 contract 与旧消费者不兼容时，必须在前后端实现都回退之后，再回退 contract，避免 consumer 被不存在的契约冲击。

单方面回滚（例如“只回前端”或“只回后端”）默认视为反模式，除非 Spec 明确声明这一路径可行且已验证。

### 5. Trace 要以 feature 为中心，不是以 agent 为中心

monorepo 往往会有多个 agent：前端 agent、后端 agent、测试 agent。Trace 不能只记“哪个 agent 做了什么”，还必须能回到：

- 这是哪个 Feature ID
- 它对应 Spec 的哪一条
- 它影响前端/后端/共享包中的哪一部分
- 它经历了哪些验证、升级、回滚

## 建议的引入顺序

不要一上来就在整个 monorepo 全面铺开。更稳妥的顺序是：

### 第一步：先做仓库级最小闭环

先只补这些最关键资产：

- 一份跨栈 Spec 模板
- 一份风险分层表
- 一份 permission scopes 规则
- 一套 Feature ID 规范
- 一个最小 Trace 模板

这一步的目标不是“自治”，而是让前后端开始用 **同一种契约语言**。

### 第二步：挑一个低风险跨栈功能试点

试点任务应该满足：

- 前后端都有改动，但不碰不可逆迁移
- 有现成验证手段
- 回滚可行
- 业务影响可控

试点的目标不是“最容易做的跨栈 feature”，而是“最能练到跨栈协调”的 feature。更好的例子是：

- 新增一个业务状态字段（例如订单 / 工单 / 审核对象的新状态），需要前后端共同实现，并带明确的状态流转校验规则。
- 这类 feature 会强制 contract 先行、强制前后端对齐枚举与校验、强制有一条联调验证路径，正好踩到 Harness 想解决的几个关键点。

反例：只在列表接口多加一个只读展示字段、前端几乎独立就能扛掉的改动——这种 feature 跑完你仍然没练到跨栈协调。

### 第三步：把试点固化成模板

试点跑通后，再把成功经验沉淀为：

- feature spec 样板
- frontend / backend 子任务模板
- Gate 1 / Gate 3 checklist
- 风险升级规则
- CI / 报告 / trace 规范

### 第四步：再逐步扩大自治范围

扩展顺序建议是（注意：基础 trace + 手动回滚从第一步就必须具备，这里的“更强”是指精细化与自动化程度的提升，不是从 0 到 1）：

1. 先 low-risk 跨栈功能
2. 再 contract 变更但不碰数据迁移
3. 再引入**精细化** trace、监控与**自动**回滚（把第一步的手动回滚升级为灰度 + 自动阈值回滚）
4. 最后才考虑 schema / infra / 生产变更的更高阶自动化

## 这套计划默认的几个假设

为了给你一个“大体可用”的回答，我默认你的 monorepo 大致类似：

- `apps/web` + `apps/api` + `packages/contracts`（与前文“建议的仓库落点”保持一致）
- 有 CI，能跑前后端测试
- 前后端可以按 feature 协同发版
- 你现在的目标是“先引入 Harness 的骨架”，不是直接做完全无人值守

如果你的项目是另一种结构（比如 BFF、多前端应用、多后端服务、强 infra 驱动），
整体思路仍然一样，但 Gate、权限和验证层级要按服务边界重画。

## 待办事项

1. **定义仓库级 Harness 资产**
   - 明确 Spec、风险分层、权限作用域、Trace、Feature ID 放在哪里。

2. **定义前后端与共享契约的边界**
   - 把 web、api、contracts、shared、infra 的责任和风险层级画清楚。

3. **设计跨栈 feature 流程**
   - 明确一份 Spec 如何驱动 frontend/backend/contracts/integration 四类子任务。

4. **先跑一个低风险跨栈试点**
   - 用试点验证 Gate、验证层级、Trace、回滚路径是不是可用。

5. **再把试点沉淀成模板**
   - 将成功路径固化为 repo 级 Harness 资产，逐步扩展到更多 feature。

## 注意事项

- monorepo 下最常见的失败，不是“没有 AI”，而是**前后端各自自治，最后没人对整体 feature 负责**。
- Harness 的最小单位不应该是“前端任务”或“后端任务”，而应该是 **跨栈 feature**。
- 不要一开始就把 DB migration、权限、生产 infra 自动化纳入无人值守范围；这些通常是最后才放开的能力。
