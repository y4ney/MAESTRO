<div align="center">

# 🛡️ MAESTRO 威胁分析器

[![Version](https://img.shields.io/badge/version-latest-green?style=for-the-badge)](https://github.com/y4ney/MAESTRO)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/y4ney/maestro)
[![Multi-arch](https://img.shields.io/badge/platforms-amd64%20%7C%20arm64-blue?style=for-the-badge)](https://hub.docker.com/r/y4ney/maestro/tags)

</div>

---

> **基于 AI 的智能体安全威胁分析工具**
>
> 采用 MAESTRO 框架，对智能体系统进行全面的安全评估

---

## 📖 目录

- [0x00 核心特性](#0x00-核心特性)
- [0x01 MAESTRO 七层框架](#0x01-maestro-七层框架)
- [0x02 快速开始](#0x02-快速开始)
- [0x03 API 配置](#0x03-api-配置)
- [0x04 使用场景](#0x04-使用场景)
- [0x05 Docker 部署](#0x05-docker-部署)
- [0x06 开发命令](#0x06-开发命令)
- [0x07 技术栈](#0x07-技术栈)

---

## 0x00 核心特性

- 🧠 **AI 驱动分析**：利用大语言模型进行深度威胁挖掘
- 🎯 **MAESTRO 七层框架**：全面覆盖智能体系统的各个层面
- 🛡️ **智能缓解建议**：针对每个威胁提供专业的安全对策
- 📊 **可视化架构图**：自动生成 Mermaid 架构图表
- 📝 **执行摘要**：快速生成高管级别的安全报告
- 🔧 **自定义 API 支持**：支持任意 OpenAI 兼容的 API 接口
- 🐳 **多架构 Docker**：一键构建和部署
- 🌐 **中文界面**：完全汉化的用户界面

---

## 0x01 MAESTRO 七层框架

| 层级 | 说明 |
|:----:|:------|
| 🧠 **基础模型** | 核心 AI 模型（例如，大语言模型、定制训练的 AI） |
| 💾 **数据操作** | 为智能体处理数据，包括存储、处理和向量嵌入 |
| 🤖 **智能体框架** | 用于创建、编排和管理智能体的软件框架和 API |
| 🖥️ **部署与基础设施** | 托管智能体和 API 的服务器、网络、容器和底层资源 |
| 📈 **评估与可观测性** | 用于监控、评估和调试智能体行为的系统 |
| 🔒 **安全与合规** | 整个智能体系统的安全控制和合规措施 |
| 🌐 **智能体生态系统** | 多个智能体交互、协作，可能竞争的更广泛环境 |

---

## 0x02 快速开始

### 1.1 Docker 部署（推荐）

```bash
# 1. 拉取镜像
docker pull y4ney/maestro:latest

# 2. 运行容器（生产模式）
docker run -d \
  --name maestro \
  -p 3000:3000 \
  -e LLM_PROVIDER=google \
  -e GEMINI_API_KEY=your_api_key_here \
  y4ney/maestro:latest

# 3. 访问应用
open http://localhost:3000
```

### 1.2 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/y4ney/MAESTRO.git
cd MAESTRO

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API 密钥

# 4. 启动服务（需要两个终端）
# 终端 1: 启动 Next.js 前端
npm run dev

# 终端 2: 启动 Genkit 后端
npm run genkit:dev

# 5. 访问应用
open http://localhost:3000
```

---

## 0x03 API 配置

MAESTRO 支持多种 AI 提供商，可配置为任意 OpenAI 兼容的 API 接口。

### 2.1 支持的提供商

| 提供商 | 环境变量 | 获取 API Key |
|:--------|:------------|:-------------|
| 🟣 **Google AI** | `GEMINI_API_KEY` | [获取](https://aistudio.google.com/app/apikey) |
| 🟢 **OpenAI** | `OPENAI_API_KEY` | [获取](https://platform.openai.com/api-keys) |
| 🟠 **Ollama** | `OLLAMA_SERVER_ADDRESS` | 本地 LLM |
| 🔵 **智谱 AI** | - | 通过自定义 API 配置 |
| 🟣 **OpenRouter** | - | 通过自定义 API 配置 |

### 2.2 自定义 API 接口

如果使用自定义 API（如智谱、OpenRouter、本地 LLM 服务器），请在应用的 **Settings** 面板中配置。

**配置步骤：**

1. 打开应用，点击侧边栏 **"Settings"** 标签

2. 填写以下信息：

   | 配置项 | 说明 | 示例 |
   |:--------|:------|:------|
   | **Base URL** | API 基础地址 | `https://api.openai.com/v1` |
   | | 智谱 | `https://open.bigmodel.cn/api/paas/v4/` |
   | | OpenRouter | `https://openrouter.ai/api/v1` |
   | **API Key** | 你的 API 密钥 | `sk-...` |
   | **Model** | 模型标识符 | `gpt-4o-mini`, `glm-4.7` |

3. 点击 **"测试连接"** 验证配置是否正确

4. 点击 **"保存配置"** 保存到浏览器本地存储

---

## 0x04 使用场景

MAESTRO 提供了丰富的使用案例预设，帮助快速开始分析：

| 预设 | 描述 |
|:------|:------|
| 🛒 **电商推荐机器人** | 多智能体个性化推荐系统，包含观察者、档案、推荐者智能体 |
| ✈️ **自动旅行规划器** | 航班、酒店、活动智能体协同规划旅行行程 |
| 🏠 **智能家居自动化** | 灯光、温控、安全智能体控制家居设备 |
| 🏥 **医疗诊断助手** | 医疗 AI 助手，辅助医生进行初步诊断 |
| 🚚 **供应链物流** | 库存、车队、物流智能体优化供应链 |
| 📈 **自动金融交易** | 高频交易系统，市场数据、分析、交易智能体 |
| 📅 **Google A2A 日历** | 智能体间通信示例，智能体卡和能力发现 |
| 💻 **代码解释器与 MCP** | 沙箱代码执行，MCP 服务器集成 |
| 📝 **协作文档编写** | 多智能体协作编写文档，起草、研究、编辑智能体 |
| 🎧 **多级客户支持** | 分层客服系统，智能体间升级流程 |

---

## 0x05 Docker 部署

### 3.1 构建多架构镜像

使用 Makefile 一键构建和推送多架构镜像（amd64 + arm64）：

```bash
# 一键构建并推送（推荐）
make build-push-multi

# 自定义镜像名称和版本
make IMAGE_NAME=myrepo/maestro VERSION=v1.0.0 build-push-multi

# 构建开发版本
make MODE=dev build-push-multi
```

### 3.2 可用命令

| 命令 | 说明 |
|:--------|:------|
| `make help` | 显示帮助信息 |
| `make build` | 构建当前架构镜像 |
| `make build-multi` | 构建多架构镜像（amd64 + arm64） |
| `make push` | 推送当前架构镜像 |
| `make push-multi` | 推送多架构镜像 |
| `make build-push-multi` | **一键构建并推送多架构镜像** |
| `make clean` | 清理构建器和未使用的镜像 |

### 3.3 运行模式

| 模式 | 4000 端口 | 说明 |
|:------|:-----------|:------|
| **生产模式 (prod)** | 不暴露 | 性能更高，更安全，推荐生产使用 |
| **开发模式 (dev)** | 暴露 | 支持热重载，可访问 Genkit UI |

```bash
# 生产模式
docker run -p 3000:3000 -e MODE=prod ...

# 开发模式
docker run -p 3000:3000 -p 4000:4000 -e MODE=dev ...
```

---

## 0x06 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（两个终端）
npm run dev              # Next.js 前端 (http://localhost:3000)
npm run genkit:dev       # Genkit AI 后端

# 使用 Genkit Watch（自动重载）
npm run genkit:watch

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 运行测试
npm run test              # 测试监视模式
npm run test:run          # 运行一次测试
npm run test:coverage     # 运行测试并生成覆盖率报告

# 构建生产版本
npm run build

# 运行生产服务器
npm run start
```

---

## 0x07 技术栈

| 类别 | 技术 |
|:------|:-----|
| 前端框架 | [Next.js 15](https://nextjs.org/) + React 18 |
| AI 框架 | [Google Genkit](https://firebase.google.com/docs/genkit) |
| UI 组件库 | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS |
| 类型安全 | TypeScript (strict mode) |
| 表单验证 | [Zod](https://zod.dev/) |
| 测试框架 | Vitest |
| 容器运行 | Docker + Alpine Linux |

---

## 📁 项目结构

```
MAESTRO/
├── src/
│   ├── ai/                    # AI 后端和流程定义
│   │   ├── genkit.ts          # Genkit 配置和工厂函数
│   │   └── flows/             # AI 流程
│   ├── app/                    # Next.js 应用
│   │   ├── actions.ts         # Server Actions
│   │   ├── page.tsx           # 主页面
│   │   └── api-config.ts      # API 配置类型
│   ├── components/              # React 组件
│   │   ├── ui/                # shadcn/ui 组件库
│   │   ├── api-settings-panel.tsx  # API 设置面板
│   │   └── ...
│   ├── data/                   # 数据和配置
│   │   ├── maestro.ts          # MAESTRO 层级定义
│   │   └── use-cases.ts        # 使用案例预设
│   └── lib/                    # 工具库
│       ├── types.ts            # 类型定义
│       ├── errors.ts           # 错误处理
│       └── ai-error-handler.ts # AI 错误分类器
├── Dockerfile               # Docker 构建文件
├── Makefile                # 多架构构建工具
├── .env.example             # 环境变量模板
└── README.md               # 项目文档
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 贡献

欢迎贡献！请随时提交 Issue 和 Pull Request。

---

## 📮 免责声明

本工具**仅用于教育和演示目的**。威胁分析和缓解策略由 AI 模型根据 MAESTRO 方法论生成。

**AI 可能会犯错。** 此工具提供的信息不应被视为完整或权威的安全审计。在实施任何推荐的缓解措施之前，请始终进行全面的手动审查并与安全专业人员咨询。

---

## 👥 关于

MAESTRO Threat Analyzer - 基于 MAESTRO 框架的智能体安全分析工具

<div align="center">

**如果觉得有用，请给个 ⭐ Star！**

</div>
