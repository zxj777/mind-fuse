# Mind-Fuse Claude Skills 配置指南

本文档记录 Mind-Fuse 项目推荐使用的 Claude Skills（MCP Servers），按照开发阶段和优先级组织。

---

## 配置原则

1. **渐进式配置**：按需配置，不要一次性全部启用
2. **阶段性使用**：根据当前开发阶段选择合适的 skills
3. **性能优先**：避免配置过多影响 Claude 响应速度

---

## Skills 优先级矩阵

| 优先级 | Skill | 使用场景 | 配置阶段 |
|--------|-------|---------|---------|
| 🔥🔥🔥 | **PostgreSQL MCP** | 数据库操作、sqlc 集成、pgvector | Week 1-2 |
| 🔥🔥 | **GitHub MCP** | PR/Issue 管理、CI/CD | Week 1-2 |
| 🔥🔥 | **Filesystem MCP** | Monorepo 导航、文件管理 | Week 1-2 |
| 🔥 | **Playwright MCP** | E2E 测试生成和调试 | Week 3-4 |
| ⚡ | **Docker MCP** | 容器管理、开发环境 | Week 7-8 |
| ⚡ | **Rust Analyzer** | CRDT/WASM 开发 | Week 9-10 |
| 💡 | **gRPC Reflection** | Go-Rust 通信调试 | Phase 2 |
| 💡 | **Qdrant MCP** | 向量数据库、RAG | Phase 3 |

---

## 详细说明

### 1. PostgreSQL MCP 🔥🔥🔥

**为什么最推荐**：
- Mind-Fuse 核心依赖 PostgreSQL（用户、工作空间、文档元信息）
- sqlc 生成的代码需要实时验证
- pgvector 向量搜索调试（AI 功能）

**主要功能**：
```typescript
// 可以做什么
- 执行 SQL 查询
- 验证 sqlc 生成的代码
- 测试数据库迁移
- 调试 pgvector 向量搜索
- 查看表结构和索引
```

**使用场景**：
- Week 1-2: 初始化数据库 schema
- Week 7-8: 实时协作数据持久化
- Phase 3: AI 向量搜索

**配置难度**：⭐ (简单)

---

### 2. GitHub MCP 🔥🔥

**为什么推荐**：
- 自动化 PR 创建和代码审查
- Issue 管理和里程碑跟踪
- GitHub Actions CI/CD 调试

**主要功能**：
```typescript
// 可以做什么
- 创建和管理 PR
- 搜索和关闭 Issue
- 查看 CI/CD 运行状态
- 代码审查建议
- 自动生成 Release Notes
```

**使用场景**：
- 所有阶段：代码提交、PR 管理
- CI/CD 集成和调试

**配置难度**：⭐⭐ (需要 GitHub Token)

---

### 3. Filesystem MCP (Enhanced) 🔥🔥

**为什么推荐**：
- Monorepo 结构复杂（apps/packages/crates）
- 跨目录快速导航
- 批量文件操作

**主要功能**：
```typescript
// 可以做什么
- 快速搜索文件
- 批量重命名
- 目录结构可视化
- 跨包依赖分析
```

**使用场景**：
- Week 1-2: 初始化项目结构
- 所有阶段: 文件管理和重构

**配置难度**：⭐ (简单)

---

### 4. Playwright MCP 🔥

**为什么推荐**：
- E2E 测试是 Mind-Fuse 的核心（复杂交互）
- Canvas 截图对比测试
- 多客户端协作测试

**主要功能**：
```typescript
// 可以做什么
- 自动生成测试代码
- 录制用户操作
- Canvas 截图对比
- 调试失败的测试
- 性能测试
```

**使用场景**：
- Week 3-4: 渲染引擎测试
- Week 5-6: 编辑器核心测试
- Week 7-8: 协作功能测试

**配置难度**：⭐⭐ (需要安装 Playwright)

---

### 5. Docker/Docker Compose MCP ⚡

**为什么推荐**：
- 开发环境依赖容器（PostgreSQL, Dragonfly）
- 一键启动完整开发栈
- 服务健康检查

**主要功能**：
```typescript
// 可以做什么
- 启动/停止容器
- 查看容器日志
- 健康检查
- 网络调试
- Volume 管理
```

**使用场景**：
- Week 1-2: 开发环境搭建
- Week 7-8: 缓存服务集成

**配置难度**：⭐ (简单)

---

### 6. Rust Analyzer MCP ⚡

**为什么推荐**：
- CRDT 核心用 Rust 实现
- WASM 编译和调试
- 性能基准测试

**主要功能**：
```typescript
// 可以做什么
- 代码补全
- 类型检查
- 编译错误诊断
- 性能 profiling
- WASM 优化建议
```

**使用场景**：
- Week 9-10: AI 布局算法
- Phase 2: CRDT 核心实现

**配置难度**：⭐⭐ (需要 rust-analyzer)

---

### 7. Go LSP MCP ⚡

**为什么推荐**：
- Go 后端开发
- Huma v2 API 代码生成
- sqlc 集成

**主要功能**：
```typescript
// 可以做什么
- 代码补全
- 错误诊断
- 重构建议
- 测试生成
```

**使用场景**：
- Week 7-8: WebSocket 服务
- 所有阶段: Go 后端开发

**配置难度**：⭐⭐ (需要 gopls)

---

### 8. gRPC Reflection MCP 💡

**为什么推荐**：
- Go-Rust gRPC 通信调试
- Protocol Buffers 验证

**主要功能**：
```typescript
// 可以做什么
- 查看服务定义
- 测试 gRPC 调用
- 调试 protobuf 序列化
```

**使用场景**：
- Phase 2: Go-Rust 集成

**配置难度**：⭐⭐⭐ (需要配置 gRPC reflection)

---

### 9. OpenAPI/Swagger MCP 💡

**为什么推荐**：
- Huma v2 自动生成 OpenAPI
- API 文档验证
- 自动生成 TypeScript 类型

**主要功能**：
```typescript
// 可以做什么
- 验证 OpenAPI spec
- 生成 API 客户端
- 测试 API endpoints
```

**使用场景**：
- Week 7-8: REST API 开发
- 所有阶段: API 文档维护

**配置难度**：⭐⭐

---

### 10. Qdrant MCP 💡

**为什么推荐**：
- AI 语义搜索
- RAG 系统

**主要功能**：
```typescript
// 可以做什么
- 向量插入和查询
- 相似度搜索
- 过滤和聚合
```

**使用场景**：
- Phase 3: AI 语义理解

**配置难度**：⭐⭐

---

## 推荐配置顺序

### 第一步：基础环境（Week 1-2）
```bash
1. PostgreSQL MCP    # 数据库核心
2. GitHub MCP        # 代码管理
3. Filesystem MCP    # 文件操作
```

### 第二步：开发工具（Week 3-6）
```bash
4. Playwright MCP    # E2E 测试
5. Docker MCP        # 容器管理
```

### 第三步：高级功能（Week 7+）
```bash
6. Rust Analyzer     # Rust 开发
7. Go LSP            # Go 开发
```

### 第四步：专项需求（Phase 2+）
```bash
8. gRPC Reflection   # Go-Rust 通信
9. OpenAPI MCP       # API 文档
10. Qdrant MCP       # 向量搜索
```

---

## 自定义 Skills 建议

### Mind-Fuse Dev MCP (自建)

可以创建一个专门的 MCP Server 整合常用命令：

```typescript
{
  "name": "mind-fuse-dev",
  "tools": {
    "buildWasm": "构建所有 Rust WASM 模块",
    "generateTypes": "Huma v2 → TypeScript 类型",
    "runE2E": "运行 Playwright 测试",
    "benchmarkCRDT": "CRDT 性能测试",
    "startStack": "一键启动开发栈",
    "checkDeps": "依赖健康检查"
  }
}
```

**实现指南**：详见 [MCP 开发文档](https://modelcontextprotocol.io/)

---

## 配置文件位置

```bash
# macOS
~/.claude/claude_desktop_config.json

# Windows
%APPDATA%/Claude/claude_desktop_config.json

# Linux
~/.config/claude/claude_desktop_config.json
```

---

## 性能建议

1. **不要一次性启用所有 skills**
   - 每个 skill 都会增加 Claude 的上下文切换开销
   - 建议同时启用不超过 5 个

2. **按需启用**
   - 开发前端时启用 Playwright、Filesystem
   - 开发后端时启用 PostgreSQL、Go LSP
   - 开发 Rust 时启用 Rust Analyzer

3. **定期清理**
   - 不再使用的 skills 可以临时禁用
   - 保持配置文件简洁

---

## 故障排查

### Skill 无法启动

```bash
# 1. 检查 skill 是否正确安装
npx -y @modelcontextprotocol/server-postgres --version

# 2. 检查环境变量
echo $POSTGRES_URL

# 3. 查看 Claude 日志
# macOS: ~/Library/Logs/Claude/
# Windows: %APPDATA%/Claude/logs/
```

### 性能问题

```bash
# 减少同时启用的 skills 数量
# 禁用暂时不用的 skills

# 示例：注释掉配置
{
  "mcpServers": {
    "postgres": { /* ... */ },
    // "github": { /* ... */ },  // 暂时禁用
    "filesystem": { /* ... */ }
  }
}
```

---

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Claude Desktop 配置](https://docs.anthropic.com/claude/docs/claude-desktop)
- [已有 MCP Servers 列表](https://github.com/modelcontextprotocol/servers)

---

**更新日期**: 2025-01-19
**维护者**: Mind-Fuse Team
