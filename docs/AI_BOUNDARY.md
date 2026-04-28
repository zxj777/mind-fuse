# Mind-Fuse AI Boundary

## 文档定位

这份文档定义 Mind-Fuse 中 AI 能做什么、不能做什么，以及 AI 输出如何进入产品。

它与 `docs/product-strategy.md` 和 `docs/REMEDIATION_PLAN.md` 一起构成当前正式产品定义。

## 基本原则

Mind-Fuse 的 AI 是 **investigation assistant**，不是自动驾驶系统。

AI 的职责是帮助用户更快形成问题、证据链和判断；AI 的职责不是直接替用户改画布、验证结论或打断工作流。

因此 Mind-Fuse 采用一个硬边界：

> **AI 只能产生 suggestion，只有用户显式接受后，suggestion 才能写入 Investigation 的 `Y.Doc`。**

## 允许的 AI 输出

AI 允许输出以下五类 suggestion：

1. **候选 Question**
   - 从 `CaptureItem` 中提取可追的问题
2. **候选 Hypothesis / Conclusion 草稿**
   - 对现有材料做保守的解释草稿
3. **Evidence ↔ Hypothesis 关系建议**
   - 建议 `supports` / `contradicts`
4. **布局建议**
   - 只作为 ghost layer 或候选布局，不直接改动 shape
5. **Snapshot 摘要草稿**
   - 为某次 snapshot 生成简短摘要

## 禁止的 AI 行为

AI 严禁做以下事情：

- 直接修改 Shape 的 `x`、`y` 或其他几何属性
- 不经用户接受就创建、删除或重排核心 Investigation 实体
- 直接把 `ConclusionStatus` 从 `hypothesis` 升级到 `verified`
- 主动 push 通知、弹窗或插话式打断用户
- 跨 Investigation 自动归并材料、问题或结论

## Suggestion 协议

所有 AI 输出都必须归一到 `AISuggestion` 协议，再由用户在工作面中明确接受或忽略。

建议协议至少包含：

- `id`
- `investigationId`
- `kind`
- `title`
- `summary`
- `confidence`
- `payload`
- `status`
- `createdAt`

其中：

- `kind` 用来区分 candidate question / relation / layout / snapshot summary 等类型
- `payload` 保存 suggestion 的结构化内容
- `status` 只允许在 `pending` / `accepted` / `dismissed` 中变化

## 交互原则

1. **默认安静**
   - AI 可以持续分析上下文，但默认不主动打断
2. **可忽略**
   - suggestion 必须是低打断的，用户可以无成本忽略
3. **可撤销**
   - 接受后的结果必须保留清晰的撤销路径
4. **不破坏空间记忆**
   - AI 不能偷偷重排画布

## 工程约束

- `apps/*` 入口层不直接调 LLM
- AI 接口统一通过 `@mind-fuse/ai-sdk`
- Suggestion 校验统一通过 `@mind-fuse/validate`
- Suggestion 被接受后，最终状态落到 `@mind-fuse/investigation`

## MVP 策略

MVP 阶段先使用 mock suggestion：

- 从 Capture 文本生成候选 Question
- 生成保守的 Hypothesis / Conclusion 草稿
- 提供关系建议和 snapshot 摘要

真实 LLM 集成在 workspace 原型跑通后再接入。
