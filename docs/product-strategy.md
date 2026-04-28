# Mind-Fuse 产品策略

## 文档定位

这份文档是 Mind-Fuse 当前的**正式产品策略文档**，负责定义产品是什么、服务谁、为什么这样做，以及 MVP 应该验证什么。

与它配套的文档分工如下：

| 文档 | 角色 |
| --- | --- |
| `docs/product-strategy.md` | 产品定义与策略真相源 |
| `docs/REMEDIATION_PLAN.md` | 将仓库结构、文档叙事和实现入口对齐到本策略的修正方案 |
| `docs/AI_BOUNDARY.md` | AI 能力边界与 Suggestion 协议 |

旧的 Diagram / 通用白板 / AI 自动生成图路线不再作为当前产品主线。相关历史材料只能作为归档参考，不能继续指导 MVP 范围、代码结构和对外叙事。

## 一句话定位

> **Mind-Fuse 是面向高认知负荷开发者的 canvas-native technical investigation workspace。**

中文表达是：

> **一个让开发者在真实工程任务中，低打断地收集信息、围绕问题展开技术调查、在画布上形成证据链与判断，并能在未来恢复上下文的工作面。**

这里有三个不可弱化的关键词：

| 关键词 | 含义 |
| --- | --- |
| `technical investigation` | 用户不是来管理知识，而是在追一个具体技术问题、判断或解释 |
| `canvas-native` | Investigation 的核心对象必须在画布上有空间表达，而不是藏在列表或侧栏里 |
| `workspace` | 产品价值发生在专门的工作面，不是登录页、列表页或通用管理后台 |

## 核心产品判断

### 1. 产品不是 AI 协作白板

需要明确反对旧叙事：Mind-Fuse 不应该继续被描述成 Miro / FigJam 式白板，也不应该以“AI 自动生成 Diagram”为主卖点。

原因很直接：

- 通用白板市场已经拥挤，差异化会被拖入模板、多人协作、图形工具和企业管理能力竞争。
- AI 自动生成图看起来有演示效果，但很容易退化成一次性输出，无法承载长期技术判断。
- 开发者真正缺的不是更快画图，而是在复杂信息里追问题、验证假设、保存证据链和恢复上下文。

白板底座仍然重要，但它只是 substrate。产品身份必须落在 **Investigation**，不是图形编辑器本身。

### 2. 产品核心不是 `apps/web`

`apps/web` 只是周边管理面，负责登录、注册、Investigation 列表、账号、组织、订阅和设置。

真正的产品核心由两部分构成：

1. `packages/` 下的领域模型与引擎能力。
2. `apps/workspace` 中承载 canvas-native investigation 的工作面。

把管理面和画布工作面塞进同一个 surface 会让依赖、渲染策略和交互模式互相污染。入口必须分层，否则产品会再次滑回“网页里放一个白板组件”的旧路径。

### 3. Investigation 是产品本体

一个 Investigation 对应一张语义画布。用户围绕某个技术问题，在画布上沉淀来源、问题、证据、假设、结论和快照。

这不是“笔记空间”，也不是“项目文件夹”。它是一段技术调查过程的可视化工作面。

## 目标用户与核心场景

Mind-Fuse 服务的是高认知负荷开发者，尤其是需要在多来源信息中消除技术不确定性、形成可解释判断的人。

场景不能继续按表面任务、入口来源或输出形式来切分。那种分法混合了触发情境、认知任务和交付物，会把产品重新拉回“什么都能做一点”的通用白板或知识库。

正式的场景划分应按用户要完成的 **technical investigation intent** 来组织：

| 一线场景 | 用户核心问题 | 典型触发 | 最终产物 |
| --- | --- | --- | --- |
| **解释现象** | “为什么会这样？” | 故障、Bug、性能下降、数据异常、发布后行为变化 | Root-cause explanation：能解释这次现象为什么发生，并排除主要替代解释 |
| **理解机制** | “它到底怎么工作？” | 接手陌生系统、读代码链路、理解协议/框架/库、改动前调研 | Predictive mental model：能预测系统在关键条件下会如何表现 |
| **判断方案** | “该不该这样做？” | 技术选型、RFC、PR、架构评审、方案设计 | Defensible decision：有证据、风险和取舍依据的技术判断 |

其中，**解释现象**和**理解机制**是 MVP 的主轴。它们都围绕具体技术问题展开，但停止条件不同：

- 解释现象是从一个已发生结果倒推原因，产物是 root-cause explanation。
- 理解机制是从多来源材料拼出运行模型，产物是 predictive mental model。

**判断方案**是同一模型的自然延展，但不应主导第一版产品形态。它长期可能需要 `Option`、`Criterion`、`Risk`、`Tradeoff` 等更决策化对象，但 MVP 先用 `Question`、`Evidence`、`Hypothesis` 和 `Conclusion` 承载，避免过早把领域模型做散。

**回访 / 复用 / 修正旧判断不是第四个并列场景**，而是所有 Investigation 的生命周期能力。任何解释、理解或决策都应该能通过 `Snapshot`、`ConclusionStatus`、证据链和新旧结论关系在未来被恢复、质疑和修正。

产品入口、capture、画布组织、snapshot 和 AI suggestion 都必须围绕这三类 investigation intent 组织，而不是围绕抽象的“知识管理”或“通用协作白板”组织。

## 产品原则

### 1. 当前任务优先，沉淀是副产物

用户不是为了“建立个人知识库”而来。用户首先是在完成手上的技术任务。

Mind-Fuse 的价值是让用户在完成任务时，**顺便**留下未来可复用的技术判断上下文。如果产品要求用户为了沉淀而额外维护结构，它会迅速退化成沉重的笔记工具。

### 2. Question 优先于 Conclusion

产品的组织中心应该优先是 **Question**，而不是 **Conclusion**。

原因是：

- 问题通常是真实存在的。
- 结论往往在调查过程中才浮现。
- 过早要求用户给出结论，会制造假的结构化沉淀。

AI 可以帮助从碎片中提取候选问题，但不能强迫用户先写结论。

### 3. 所有核心对象必须有 canvas representation

Investigation 的核心对象不能只存在于列表、inbox、侧栏或数据库里。

`CaptureItem`、`Source`、`Question`、`Evidence`、`Hypothesis`、`Conclusion` 和 `Snapshot` 都必须能在画布上被看见、选择、关联和回访。

这是产品和传统笔记工具的边界：Mind-Fuse 不只是保存信息，而是让调查过程在空间中形成结构。

### 4. Capture 必须低打断

低打断 capture 是核心能力，不是附属入口。

理想状态下，用户在 IDE、浏览器、文档、AI 对话或聊天中看到值得保留的信息时：

- 投递动作不超过 1 步。
- 不需要离开当前上下文。
- 不被强制命名、分类、关联。
- 信息进入当前 Investigation 的画布 inbox lane，而不是消失在后台列表。

如果 capture 不够轻，产品会失去“真实工作流中顺便沉淀”的基础。

### 5. AI 只能建议，不能替用户行动

Mind-Fuse 的 AI 必须遵守一个硬边界：**AI 生成 suggestion，用户显式接受后才写入 Investigation。**

这不是保守设计，而是 creative / investigation 工具的信任底线。主动改画布、主动验证结论、主动弹窗提醒都会破坏用户对空间结构和判断过程的控制感。

## 核心领域模型

MVP 必须新增 `@mind-fuse/investigation` 领域层，作为产品本体。

| 实体 | 产品含义 | 画布表达 |
| --- | --- | --- |
| `Investigation` | 一段技术调查过程 | 一张画布 |
| `CaptureItem` | 低打断投递进来的原始碎片 | 画布上的 inbox lane 项 |
| `Source` | 信息来源，如 URL、文件、RFC、PR、聊天、文档 | Source 卡片 |
| `Question` | 当前正在追的问题 | Question 卡片 |
| `Evidence` | 可引用的证据片段 | Evidence 卡片 |
| `Hypothesis` | 待验证的解释或判断 | Hypothesis 卡片 |
| `Conclusion` | 已形成但可过期的判断 | Conclusion 卡片 |
| `Snapshot` | 某一时刻的语义切片与视觉状态 | Snapshot frame / 缩略图 |

### 关键状态

```ts
type QuestionStatus = 'open' | 'active' | 'parked' | 'closed'
type HypothesisStatus = 'proposed' | 'supported' | 'refuted' | 'inconclusive'
type ConclusionStatus = 'hypothesis' | 'verified' | 'rejected' | 'outdated'
```

`ConclusionStatus` 是产品可信度模型的一部分，不能弱化为普通标签。用户需要知道一个判断只是 hypothesis、已经 verified、被 rejected，还是因为新材料而 outdated。

### Canvas Binding 强约束

任何核心实体被创建时，都必须同时创建对应 Shape。反过来，删除 Shape 时不能直接抹掉调查历史，而应让关联实体进入归档或过期状态。

AI 也不得直接修改 Shape 几何位置。布局、归类和连线只能以 suggestion 或 ghost layer 的形式出现。

## 画布工作流

MVP 的核心闭环是：

1. 用户创建或打开一个 Investigation。
2. 用户通过粘贴、快捷入口或未来插件把信息投递到画布 inbox lane。
3. 用户把 CaptureItem 提升为 Question / Evidence / Source。
4. 用户在画布上建立 Evidence 与 Hypothesis 的 supports / contradicts 关系。
5. 用户把 Hypothesis 推进为 Conclusion，并标注 `hypothesis` / `verified` / `rejected` / `outdated`。
6. 用户创建 Snapshot，未来能恢复当时的视觉与语义上下文。

这个闭环必须发生在 canvas-native 工作面中，不能临时退化成 HTML 列表或传统表单流程。

## 入口分层

### `apps/web`：管理面

`apps/web` 负责产品周边页面：

- 登录 / 注册 / OAuth。
- Investigation 列表、创建、删除、重命名。
- 组织、成员、权限。
- 账户、订阅、计费、设置。
- 可选的通知中心和活动记录。

它不承载画布工作面，不依赖 `@mind-fuse/editor`，不直接引入 `pixi.js`，也不直接持有 Investigation 领域逻辑。

### `apps/workspace`：工作面

`apps/workspace` 是产品价值发生的地方，负责打开某个 Investigation 并渲染整张 canvas-native investigation 画布。

它通过 `@mind-fuse/editor`、`@mind-fuse/store`、`@mind-fuse/investigation` 和 `@mind-fuse/ai-sdk` 工作，不在 app 层实现领域逻辑、画布交互或 LLM 调用。

### 未来 capture 入口

未来的浏览器扩展、IDE 插件、剪贴板、分享菜单、CLI、邮件 inbound 等入口都只是 capture surface。它们通过稳定的 package API 把材料投递到 Investigation，不拥有产品核心逻辑。

## 渲染策略

画布渲染从一开始就使用 **PixiJS v8（WebGL/WebGPU）**，不走 SVG / DOM 过渡。

原因：

- 长期 Investigation 画布会包含大量卡片、连线、选择框、ghost layer 和 viewport 操作。
- SVG / DOM 原型虽然启动快，但会制造后续迁移成本。
- 产品定位要求 60fps 平移缩放、空间索引、批量更新和复杂 hit-test，必须尽早建立正确的渲染架构。

允许卡片正文和富文本编辑使用 DOM overlay，但几何、连线、选择框、marquee、viewport 和 ghost suggestion 必须由 PixiJS 场景承载。

## AI 产品策略

### 需要克制“主动 AI”的冲动

这里必须明确一个产品风险：主动 AI 很容易变成 Clippy。

Mind-Fuse 确实需要 AI 参与调查，但“参与”不等于弹窗、不等于自动改画布、不等于替用户做判断。对于高认知负荷开发者来说，画布空间是思考现场，错误的主动提示会破坏 flow state 和空间记忆。

正确方向是：

- AI 常驻理解上下文，但默认保持安静。
- AI 输出以 ghost layer、候选卡片、候选连线、候选摘要形式出现。
- 用户显式接受后，suggestion 才进入 Y.Doc。
- MVP 从低打断、低风险 suggestion 开始，不做高频主动 push。

### AI 允许做什么

- 从 CaptureItem 中提取候选 Question。
- 生成候选 Hypothesis / Conclusion 草稿。
- 建议 Evidence 与 Hypothesis 的 supports / contradicts 关系。
- 提供画布布局建议，但只能作为 ghost layer。
- 生成 Snapshot 摘要草稿。

### AI 禁止做什么

- 直接修改 Shape 的 x / y / 几何属性。
- 直接把 `ConclusionStatus` 从 `hypothesis` 提升到 `verified`。
- 主动 push 通知或弹窗打断用户。
- 跨 Investigation 自动归并。
- 在入口层绕过 `@mind-fuse/ai-sdk` 直接调用 LLM。

## 差异化

Mind-Fuse 的差异化不是“白板 + AI”，而是**把技术调查的语义对象和空间结构绑定在一起**。

| 对比对象 | 它们通常解决什么 | Mind-Fuse 的差异 |
| --- | --- | --- |
| 通用白板 | 自由绘制、协作讨论、视觉表达 | Investigation 对象有语义状态和证据关系 |
| 笔记工具 | 保存信息、组织页面、全文检索 | 每个核心对象都在画布上形成空间上下文 |
| AI Chat | 快速回答和生成文本 | 回答必须进入证据链、假设和结论状态机 |
| Diagram 工具 | 更快画出结构图 | 图形不是目的，调查过程和判断可回访才是目的 |

## MVP 范围

第一版只验证一个窄闭环：**围绕解释现象，并自然覆盖一部分理解机制，把分散材料推进成一条可回看的 reasoning chain。**

1. 能创建一个 Investigation，也就是一张围绕具体技术问题的画布。
2. 能通过低打断方式向画布 inbox lane 投递 CaptureItem。
3. 能把 CaptureItem 提升为 Question / Evidence 卡片。
4. 能提出多个 Hypothesis，并在画布上用 Evidence 表达 supports / contradicts。
5. 能把最可信 Hypothesis 推进为 Conclusion，并标注 `hypothesis` / `verified` / `rejected` / `outdated`。
6. 能创建并打开 Snapshot，恢复一段 investigation 的视觉与语义状态。

明确不优先：

- 完整多人协作。
- 完整 IDE 能力。
- 通用知识库。
- 高自动化 AI 生成图。
- 高频主动通知系统。
- 复杂模板市场或通用白板组件库。
- 决策专用对象和表格化决策框架，如 `Option` / `Criterion` / `Risk` / `Tradeoff`。
- 把 Investigation 自动导出为完整文档、分享稿或复盘稿。

## 当前最关键的风险

### 1. Capture 太重，用户不会用

如果用户每次投递都要命名、分类、选择关系，产品会变成负担。MVP 必须把 capture 做到接近“顺手扔进当前 Investigation”。

### 2. Question 中心可能需要 AI 辅助

用户自然记录的往往是片段、观察和引用，不一定主动写成问题。因此需要从 CaptureItem 到 Question 的候选提取，但必须保持用户确认。

### 3. AI suggestion 可能破坏信任

错误建议如果以弹窗或自动修改形式出现，用户会快速关闭 AI。MVP 必须把 AI 控制在可忽略、可撤销、显式接受的范围内。

### 4. Canvas-native 成本更高

从一开始使用 PixiJS v8 会增加 editor 初期复杂度，但这是符合产品定位的必要成本。否则后续会被 SVG / DOM 迁移拖住。

### 5. 判断方案过早主导产品形态

如果过早把技术选型、RFC 评审、PR 评审做成第一版主叙事，产品会滑向决策表格、文档协作或评论工具。MVP 必须先证明解释现象 / 理解机制中的 reasoning chain 成立，再扩展到判断方案。

### 6. 回访触发器可能变成打扰

回访 / 复用 / 修正旧判断是生命周期能力，不是独立一线场景。“让旧判断在合适时机出现”是长期价值，但 MVP 必须从最弱、最不打扰的触发方式开始，例如打开相关 Investigation 时提示未闭合问题，而不是主动 push。

## 当前阶段工作原则

1. 先定义 Investigation 领域模型，再扩展画布能力。
2. 先证明 canvas-native investigation 闭环，再做多人协作。
3. 先做低打断 capture 和显式接受的 AI suggestion，再做主动智能。
4. `apps/web` 只做管理面，`apps/workspace` 承载工作面。
5. 入口不持有领域逻辑，不直接调 LLM，不直接实现画布交互，不直接 import `pixi.js`。
6. 旧 Diagram / 通用白板叙事必须降级或归档，不能继续作为主线。

## 当前结论

Mind-Fuse 不再应该被定义为“AI 驱动的技术图表白板”，也不应该被实现成普通管理页面里嵌入一个白板。

它当前最准确的定义是：

> **面向高认知负荷开发者的 canvas-native technical investigation workspace：让开发者在真实任务中低打断收集材料、围绕问题形成证据链和判断，并在未来恢复技术调查上下文。**
