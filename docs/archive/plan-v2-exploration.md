技术理解白板产品探索计划
产品定位
先将产品定义为：面向 AI 时代开发者的技术理解白板，用来组织源码、文档、AI 解释、问题、证据和结论。

它不是通用白板，也不是单纯源码讲解工具。核心价值是帮助开发者把 AI 时代过剩的信息和解释，转化为可追溯、可验证、可复用的个人技术理解资产。

核心假设
AI 会降低“获取解释”的成本，但不会自动形成用户自己的理解结构。
高自驱的中高级开发者仍然需要长期研究复杂系统、验证技术结论、恢复学习上下文。
白板的价值不在于画图，而在于把技术学习对象、概念、问题、证据、结论连接成结构化知识地图。
早期最合适的切口是复杂技术学习，尤其是源码、框架、系统设计和技术文档学习。
底层模型必须保持通用，源码学习只是第一个场景模板，避免产品被早期验证场景锁死。
目标用户
优先服务高自驱的中高级开发者：

经常阅读源码、框架文档、RFC、系统设计资料。
希望沉淀长期技术理解，而不是只解决眼前问题。
有写文章、做分享、带团队、做技术决策的需求。
愿意用图谱、卡片、白板等方式组织复杂知识。
不优先服务只想快速完成功能、主要依赖 AI 直接给答案的轻度用户。

第一验证场景
以学习一个 React 模块为起点，例如 ReactFiberRootScheduler.js。

用户在 IDE 或 GitHub 中阅读源码，在白板中使用通用节点模型沉淀：

Topic：学习主题，例如 React Fiber Root Scheduling。
Source：信息来源，例如源码文件、官方文档、RFC、文章、AI 回答。
Entity：被研究对象，例如函数、模块、系统组件、协议角色、算法步骤。
Concept：关键概念，例如 Lane、FiberRoot、Microtask。
Question：未理解的问题。
Evidence：源码、文档、注释、AI 解释。
Conclusion：用户确认过的阶段性结论。
源码学习中的 File、Function、Code Snippet 不作为底层一等模型，而作为 Source 或 Entity 的场景子类型。这样第一版可以服务源码学习，但长期仍能扩展到技术文档、RFC、系统设计和论文学习。

设计原则
采用“底层通用，首个场景具体”的设计原则：

数据模型保持通用，不把产品锁死为源码学习工具。
第一版模板聚焦源码学习，让验证足够具体。
节点支持场景子类型，例如 Entity:function、Entity:module、Source:code-file、Source:rfc。
关系分为通用关系和场景关系，避免所有关系都变成源码调用关系。
MVP 范围
第一版不做完整 IDE，不做通用知识库，不做完整协作。

只验证一个闭环：

flowchart LR
sourceInput[Source Input] --> conceptCards[Concept And Code Cards]
conceptCards --> semanticLinks[Semantic Links]
semanticLinks --> questions[Questions]
questions --> conclusions[Verified Conclusions]
conclusions --> reviewMap[Reviewable Knowledge Map]
MVP 建议包含：

创建学习主题。
手动或半自动创建 Source、Entity、Concept、Question、Evidence、Conclusion 节点。
支持通用语义关系，例如 contains、relates to、depends on、explains、evidence for、contradicts、causes。
在源码学习模板中提供场景关系，例如 calls、reads、writes、schedules、delegates to，但不把这些关系写死为唯一模型。
支持将 AI 答案保存为待验证结论，而不是直接当作知识。
支持结论状态：Hypothesis、Verified、Rejected、Outdated。
支持从一个主题恢复上下文：当前主流程、未解决问题、已确认结论、下一步。
与现有工具的差异
相比 Heptabase：更聚焦复杂技术学习和源码/文档/AI 证据链。
相比 Obsidian Canvas：更强调节点类型、语义关系、问题追踪和结论可信度。
相比 Miro/FigJam/Excalidraw：不是一次性画图，而是长期沉淀理解结构。
相比 Cursor/AI Chat：不只是解释代码，而是把解释变成用户验证过的个人理解资产。
关键风险
录入成本过高，导致用户不愿意持续使用。
做成“漂亮但没用”的白板，缺少回访价值。
做成 AI 源码讲解工具，被 IDE 或 AI 产品吞掉。
底层模型过度源码化，导致未来难以扩展到文档、RFC、系统设计和论文学习。
底层模型过度抽象，导致第一版缺乏具体场景和清晰价值。
用户群体偏小，商业化未必足够快。
产品边界容易膨胀成笔记、白板、任务、知识库、IDE 的混合体。
验证方法
先不急于实现完整产品，先用现有工具模拟 3 次真实学习流程：

用当前 React 源码学习作为第一个样本。
记录通用节点、场景子类型和语义关系中哪些最自然。
观察哪些信息几天后回看仍然有价值。
验证“AI 解释 -> 证据 -> 用户结论”的流程是否真的提升理解。
用一个非源码样本补充验证，例如技术 RFC、系统设计文章或框架官方文档，检查模型是否被源码场景锁死。
找 2 到 3 个类似开发者试用这个流程，观察是否愿意重复使用。
成功信号
用户几天后能通过知识地图快速恢复学习上下文。
用户愿意把 AI 答案转化为带证据的结论。
用户能从白板中看出一个复杂主题的主流程、核心概念、证据链和未解问题。
用户认为它比“问 AI + 写笔记 + 画草图”的组合更顺手。
同一套核心模型可以同时表达源码学习和非源码技术学习，不需要推翻底层设计。
暂定产品方向
短期：面向开发者复杂技术学习的结构化知识白板。

中期：支持源码、文档、AI 解释、问题、证据、结论之间的知识图谱。

长期：成为 AI 时代开发者的技术理解与判断工作台。
> ARCHIVED: 旧知识白板探索稿，不再代表当前产品方向。当前正式方向以 `docs/product-strategy.md` 与 `docs/REMEDIATION_PLAN.md` 为准。
