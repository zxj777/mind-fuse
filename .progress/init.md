# Mind-Fuse 项目初始化进度

> 更新时间: 2025-11-19
> 阶段: Phase 1 - Week 1-2 项目初始化

---

## 已完成

### 1. 项目目录结构

- [x] 创建基本目录结构
  ```bash
  apps/ packages/ crates/ templates/ docs/ scripts/ .github/workflows/
  ```

### 2. Monorepo 配置

- [x] `pnpm-workspace.yaml` - pnpm 工作空间
- [x] `package.json` - 根项目配置
- [x] `go.work` - Go 工作空间
- [x] `Cargo.toml` - Rust 工作空间
- [x] 完成根项目 `pnpm install`

### 3. 代码规范配置

- [x] `.editorconfig` - 编辑器统一配置
- [x] `.prettierrc` - 代码格式化
- [x] `.gitignore` - Git 忽略规则
- [x] `.gitattributes` - Git 属性配置
- [x] `tsconfig.json` - 根 TypeScript 配置

### 4. 前端应用初始化

- [x] `apps/web` - Next.js 15 应用
  - TypeScript 支持
  - ESLint 配置
  - Tailwind CSS 基础样式
  - src/ 目录结构
  - App Router 模式
  - Turbopack 支持

### 5. SDK 包目录结构（已创建目录）

- [x] `packages/utils` - 工具函数（几何、颜色、数学）
- [x] `packages/types` - TypeScript 类型定义
- [x] `packages/schema` - 数据 Schema（图形定义、迁移）
- [x] `packages/assets` - 静态资源（图标、字体、i18n）
- [x] `packages/validate` - 运行时验证（基于 zod）
- [x] `packages/store` - 状态管理
- [x] `packages/collaboration` - 协同客户端（React Hooks）
- [x] `packages/collaboration-core` - 协同核心逻辑
- [x] `packages/ai-sdk` - AI 功能接口
- [x] `packages/editor` - 编辑器核心（含渲染）
- [x] `packages/mind-fuse` - 完整应用

---

## 下一步任务

### 包的实现（按依赖顺序）

**第一批（并行，无依赖）：**
- [ ] `utils` - 实现工具函数
  - 创建 package.json, tsconfig.json
  - 实现 geometry/、color/、math/ 模块
- [ ] `types` - 实现类型定义
  - 创建 package.json, tsconfig.json
  - 定义 shape、editor、event、collaboration 类型

**第二批（并行）：**
- [ ] `validate` - 基于 zod 的验证
- [ ] `assets` - 静态资源管理

**第三批：**
- [ ] `schema` - 数据 Schema 定义

**第四批（并行）：**
- [ ] `store` - 状态管理
- [ ] `ai-sdk` - AI 功能接口

**第五批：**
- [ ] `collaboration-core` - 协同核心（Yjs 集成）
- [ ] `collaboration` - React Hooks

**第六批：**
- [ ] `editor` - 编辑器核心 + 渲染

**第七批：**
- [ ] `mind-fuse` - 完整应用集成

### 其他配置任务

- [ ] 配置 vanilla-extract + Vite
- [ ] 搭建 CI/CD（GitHub Actions）
- [ ] 配置 Playwright E2E 测试

---

## 架构变更记录

### 2025-11-19：基于 tldraw 的架构重设计

参考 tldraw 的架构，做了以下调整：

1. **新增包：**
   - `assets` - 静态资源管理（图标、字体、i18n）
   - `validate` - 运行时验证（基于 zod）
   - `collaboration-core` - 框架无关的协同核心
   - `ai-sdk` - AI 功能接口

2. **包重命名：**
   - `sync` → `collaboration`（更符合语义）
   - `shared-types` → `types`
   - `shared-utils` → `utils`

3. **架构决策：**
   - Renderer 在 editor 内部（避免耦合问题）
   - 协同功能分为 collaboration（React）+ collaboration-core（核心）
   - Phase 1 使用 zod 做验证，不自研 validate
   - Phase 1 不自研 signals，使用 Zustand/Valtio

4. **包依赖关系：**
   ```
   mind-fuse → editor → store → schema → validate → types
                     ↘         ↗              ↗
                      utils ────────────────
           ↘
            collaboration → collaboration-core → store
           ↘
            ai-sdk → types
   ```

---

## 参考资料

- **技术方案**: `plan.md`
- **tldraw 参考**: `/Users/zhuxiaojiang/great-voyage/guide/tldraw`
- **Phase 1 目标**: Phase 1 - Week 1-2 项目初始化

---

## 设计原则

1. **自顶向下设计，自底向上实现** - 先确定架构，再逐层实现
2. **SDK 化设计** - 核心功能在 packages/，应用在 apps/web
3. **渐进式复杂度** - 最简单用 editor，协同用 collaboration，完整用 mind-fuse
4. **类型安全** - 所有包使用 TypeScript strict 模式
5. **文档同步** - 架构变更同步更新 plan.md
