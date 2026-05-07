# 化妆品专利成分提取器

> 一个智能化妆品专利分析平台，通过 AI 大模型自动提取专利文档中的成分信息、用量、实施例等数据，生成结构化的 Excel 分析报表。

![Powered by Next.js](https://img.shields.io/badge/Powered%20by-Next.js-black)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 功能特性

- 📄 **PDF 专利智能分析** - 上传 PDF 文件，系统自动分析和提取内容
- 🤖 **AI 驱动的数据提取** - 基于大模型的精准成分识别
- 📊 **自动生成 Excel 报表** - 结构化输出，包含以下内容：
  - 大类组成（活性成分、乳化剂、助乳化剂等）及比例
  - 具体小类和物质成分列表
  - 所有实施例/对比例及各组份用量
  - 测试项目及完整的测试结果矩阵
- 💾 **一键下载** - 分析完成后直接下载 Excel 文件
- 🔄 **自动重试机制** - 分析失败自动重试，最多 3 次
- 📝 **完整日志追踪** - 记录每个请求的分析过程和 token 使用情况
- 🐳 **开箱即用的 Docker 部署** - 包含多阶段构建优化

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0
- npm 或 yarn
- OpenAI API 密钥（或兼容的 AI 接口）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd richard-cosmetic-analyzer-extractor
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000

4. **构建生产版本**
   ```bash
   npm run build
   npm start
   ```

## ⚙️ 环境配置

在 `.env.local` 中配置以下变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `OPENAI_API_KEY` | **必需** - OpenAI API 密钥 | `sk-xxx...` |
| `OPENAI_BASE_URL` | OpenAI 基础 URL（可选，用于国内镜像或自建接口） | `https://api.openai.com/v1` 或其他兼容地址 |

**注意**：如果不设置 `OPENAI_BASE_URL`，将使用默认的 OpenAI 官方 API。

## 📁 项目结构

```
.
├── app/
│   ├── api/
│   │   └── files/
│   │       ├── route.ts              # 上传和分析 API 端点
│   │       └── generate-excel.ts     # Excel 生成逻辑
│   ├── components/
│   │   └── submit-modal/             # 提交弹窗组件
│   ├── lib/
│   │   ├── api.ts                    # API 处理工具
│   │   ├── compose.ts                # 函数组合工具
│   │   ├── logger.ts                 # 日志配置
│   │   ├── middleware.ts             # 请求中间件
│   │   ├── types.ts                  # 类型定义
│   │   ├── utils.ts                  # 工具函数
│   │   ├── withErrorHandler.ts       # 错误处理中间件
│   │   ├── withLogger.ts             # 日志中间件
│   │   └── withRequestId.ts          # 请求 ID 中间件
│   ├── globals.css                   # 全局样式
│   ├── layout.tsx                    # 页面布局
│   └── page.tsx                      # 主页面
├── public/
│   └── prompt.md                     # AI 提取提示词
├── nginx/                            # Nginx 配置（可选）
├── logs/                             # 应用日志输出目录
├── dockerfile                        # Docker 镜像构建文件
├── compose.yml                       # Docker Compose 配置
├── next.config.ts                    # Next.js 配置
└── tsconfig.json                     # TypeScript 配置
```

## 🔗 API 文档

### 上传并分析 PDF

**请求**

```bash
curl -X POST http://localhost:3000/api/files \
  -F "file=@example.pdf"
```

**成功响应** (200)
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 返回生成的 Excel 文件

**错误响应** (500)
```json
{
  "message": "分析失败，原因: <错误信息>",
  "code": 500
}
```

**支持的文件**
- 格式：PDF
- 推荐大小：< 50MB（过大的文件处理时间较长）

**处理时间**
- 根据 PDF 大小和复杂度，通常需要 **3-10 分钟**

## 🔄 工作流程

```
用户上传 PDF
    ↓
文件类型验证
    ↓
上传至 OpenAI Files API
    ↓
调用大模型分析（使用 prompt.md 中的提示词）
    ↓
解析模型返回的 JSON 数据
    ↓
使用 ExcelJS 生成 Excel 报表
    ↓
返回 Excel 文件供下载
```

## 📊 提取数据示例

AI 会根据 `public/prompt.md` 中定义的规则，从 PDF 中提取：

### 大类组成
```
活性成分: 5-15%
  ├── 抗衰老成分
  │   ├── 视黄醇: 0.3%
  │   └── 神经酰胺: 2%
  └── 保湿成分
      └── 透明质酸钠: 3%
```

### 实施例数据
```
实施例 1:
  活性成分: 10%
  乳化剂: 5%
  ...

实施例 2:
  活性成分: 12%
  ...
```

### 测试结果
```
实施例1: 粒径✓ PDI✓ 稳定性✗
实施例2: 粒径✓ PDI✗ ...
```

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 构建镜像
docker compose build

# 启动容器
docker compose up -d

# 查看日志
docker compose logs -f

# 停止容器
docker compose down
```

### 使用 Dockerfile 直接构建

```bash
# 构建镜像
docker build -t cosmetic-analyzer .

# 运行容器
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx... \
  -e OPENAI_BASE_URL=https://api.openai.com/v1 \
  cosmetic-analyzer
```

**注意**：容器启动后需要等待一段时间进行初始化。

## 📝 日志管理

应用使用 Pino 日志库，日志输出到 `logs/` 目录：

- **日志级别**：info, error, warn, debug
- **日志内容**：请求 ID、处理时间、token 使用、模型完成状态等
- **查看日志**：
  ```bash
  tail -f logs/*.log
  ```

## ❓ 常见问题

### Q: 分析失败了怎么办？
A: 
1. 检查 PDF 是否有效和可读
2. 确认 `OPENAI_API_KEY` 是否正确配置
3. 检查网络连接和 API 是否可访问
4. 查看 `logs/` 目录中的错误日志
5. 点击"重试"按钮（最多允许 3 次）

### Q: 分析需要多长时间？
A: 通常 3-10 分钟，取决于 PDF 文件大小和复杂度。建议在提交后耐心等候。

### Q: 支持批量上传多个 PDF 吗？
A: 目前不支持，每次需要单独上传一个 PDF。可在后续版本中考虑添加此功能。

### Q: 可以使用其他 AI 模型而不是 OpenAI 吗？
A: 可以，通过设置 `OPENAI_BASE_URL` 指向兼容的 OpenAI API 的其他服务（如 Azure OpenAI、国内镜像等）。

### Q: 生成的 Excel 格式是什么？
A: 使用标准的 `.xlsx` 格式，兼容 Excel、Google Sheets、WPS 等常见表格软件。

### Q: 数据安全性如何？
A: 
- PDF 上传至 OpenAI Files API 后会在分析完成后自动删除
- 不会持久化存储用户上传的文件
- 建议使用非公开的 AI 服务部署以确保数据隐私

## 🛠️ 技术栈详情

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.4 |
| React | React + React DOM | 19.2.4 |
| 样式 | Tailwind CSS | 4.x |
| UI 组件库 | HeroUI | 3.0.3 |
| 图标库 | Gravity UI Icons | 2.18.0 |
| 后端语言 | TypeScript | 5.x |
| Excel 生成 | ExcelJS | 4.4.0 |
| AI 集成 | OpenAI SDK | 6.34.0 |
| 日志 | Pino | 10.3.1 |
| ID 生成 | UUID | 14.0.0 |

## 📈 性能优化

- ✅ **多阶段 Docker 构建** - 减小镜像大小
- ✅ **流式 PDF 处理** - 支持大文件上传
- ✅ **结构化日志** - 便于监控和调试
- ✅ **中间件模式** - 灵活的请求处理管道
- ✅ **错误恢复** - 自动重试机制

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License