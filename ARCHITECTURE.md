# MAESTRO Threat Analyzer 架构文档

## 项目概述

MAESTRO Threat Analyzer 是一个基于 AI 的威胁建模工具，专门用于分析智能体（Agentic）AI 系统的安全威胁。该工具基于 MAESTRO 框架（Multi-Agent Environment, Security, Threat, Risk, and Outcome）对系统架构进行 7 层安全分析，生成威胁评估和缓解建议。

**核心功能：**
- 系统架构描述输入
- 基于 MAESTRO 框架的 7 层威胁分析
- AI 驱动的威胁识别和缓解建议
- 执行摘要生成
- 架构图生成（Mermaid）
- PDF 报告导出

---

## 技术栈

### 前端框架
- **Next.js 15** - React 框架，使用 App Router 和 Turbopack
- **React 18** - UI 组件库
- **TypeScript** - 类型安全开发

### AI 集成
- **Genkit AI Framework** - AI 流程编排框架
  - Google AI (默认)
  - OpenAI 兼容层
  - Ollama 本地模型支持

### UI 组件
- **shadcn/ui** - 基于 Radix UI 的组件库
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 功能库
- **Zod** - Schema 验证
- **jsPDF** - PDF 生成
- **Mermaid** - 架构图渲染
- **React Markdown** - Markdown 内容渲染
- **React Hook Form** - 表单管理

### 开发工具
- **Vitest** - 单元测试框架
- **ESLint** - 代码检查
- **TypeScript** - 类型检查

---

## 架构设计

### 双进程架构

MAESTRO 采用双进程架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                     用户浏览器                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├──────────────────┬──────────────────────┤
                      │                  │                      │
           ┌──────────▼──────────┐  ┌────▼──────────────────────┐
           │  Next.js 前端服务    │  │  Genkit AI 后端服务       │
           │  (端口 9002)        │  │  (独立进程)              │
           │  - UI 渲染           │  │  - AI 流程执行            │
           │  - Server Actions   │  │  - 模型调用              │
           │  - 客户端状态管理    │  │  - 多提供商支持          │
           └──────────┬──────────┘  └──────────────────────────┘
                      │
                      ▼
            ┌─────────────────────┐
            │  LLM 提供商 API     │
            │  (Google/OpenAI/    │
            │   Ollama)           │
            └─────────────────────┘
```

**架构优势：**
- 前后端关注点分离
- AI 流程可以独立开发和调试
- 支持多 LLM 提供商
- 更好的性能和可扩展性

---

## 目录结构

```
MAESTRO/
├── src/
│   ├── ai/                      # AI 配置和流程
│   │   ├── genkit.ts           # Genkit 初始化和提供商配置
│   │   ├── dev.ts              # 开发服务器入口
│   │   └── flows/              # AI 工作流定义
│   │       ├── suggest-threats-for-layer.ts      # 威胁分析
│   │       ├── recommend-mitigations.ts           # 缓解建议
│   │       ├── generate-executive-summary.ts     # 执行摘要
│   │       └── generate-architecture-diagram.ts  # 架构图生成
│   │
│   ├── app/                     # Next.js App Router
│   │   ├── actions.ts          # Server Actions (AI 调用层)
│   │   ├── layout.tsx          # 应用布局
│   │   └── page.tsx            # 主页面
│   │
│   ├── components/              # React 组件
│   │   ├── ui/                 # shadcn/ui 组件库
│   │   ├── layer-card.tsx      # 层分析卡片
│   │   ├── sidebar-input-form.tsx  # 侧边栏输入表单
│   │   ├── mermaid-diagram.tsx # Mermaid 图表组件
│   │   ├── error-boundary.tsx # 错误边界
│   │   └── icons.tsx           # 自定义图标
│   │
│   ├── data/                    # 数据层
│   │   ├── maestro.ts          # MAESTRO 层定义
│   │   └── use-cases.ts        # 用例预设
│   │
│   ├── lib/                     # 工具库
│   │   ├── errors.ts           # 错误处理系统
│   │   ├── ai-error-handler.ts # AI 错误处理器
│   │   ├── retry-utils.ts      # 重试工具
│   │   ├── types.ts            # TypeScript 类型定义
│   │   └── utils.ts            # 通用工具函数
│   │
│   ├── hooks/                   # React Hooks
│   │   ├── use-toast.ts        # Toast 通知
│   │   └── use-mobile.tsx      # 移动端检测
│   │
│   └── test/                    # 测试配置
│       └── setup.ts            # 测试环境设置
│
├── public/                      # 静态资源
├── package.json                 # 项目依赖
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.ts          # Tailwind 配置
├── next.config.ts              # Next.js 配置
└── vitest.config.ts            # Vitest 配置
```

---

## 数据流

### 1. 威胁分析流程

```
用户输入架构描述
    │
    ▼
┌─────────────────────────────┐
│  SidebarInputForm            │
│  (组件)                      │
└──────────┬──────────────────┘
           │ handleAnalyze()
           ▼
┌─────────────────────────────┐
│  page.tsx (主页面)           │
│  - 创建分析循环              │
│  - 管理层状态                │
│  - 处理取消操作              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Server Actions             │
│  (actions.ts)               │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  AI Flows (Genkit)          │
│  - suggestThreatsForLayer   │
│  - recommendMitigations     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  LLM Provider API           │
│  (Google/OpenAI/Ollama)     │
└─────────────────────────────┘
```

### 2. 状态管理流程

```typescript
// 初始状态
layers: LayerData[] = [
  {
    id: 'foundation-models',
    name: 'Foundation Models',
    description: '...',
    threat: null,
    mitigation: null,
    status: 'pending'
  },
  // ... 其他 6 个层
]

// 分析过程中的状态变化
status: 'pending' → 'analyzing' → 'complete' | 'error'
```

### 3. 错误处理流程

```
AI Flow 执行失败
    │
    ▼
┌─────────────────────────────┐
│  AIErrorHandler             │
│  (ai-error-handler.ts)      │
│  - 分类错误类型             │
│  - 生成 MaestroError        │
│  - 决定是否重试            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  RetryUtils                 │
│  (retry-utils.ts)           │
│  - 指数退避重试            │
│  - 最大重试次数限制        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  MaestroError               │
│  (errors.ts)                │
│  - 结构化错误信息           │
│  - 恢复建议                │
│  - 严重程度分级            │
└─────────────────────────────┘
```

---

## 核心组件详解

### 1. AI 配置层 (`src/ai/genkit.ts`)

**功能：**
- 配置 Genkit 框架
- 支持多 LLM 提供商（Google AI、OpenAI、Ollama）
- 环境变量驱动的提供商切换

**关键配置：**
```typescript
// 环境变量
LLM_PROVIDER = 'google' | 'openai' | 'ollama'
GEMINI_API_KEY | OPENAI_API_KEY | OLLAMA_SERVER_ADDRESS
LLM_MODEL // 可选，覆盖默认模型
```

### 2. Server Actions (`src/app/actions.ts`)

**功能：**
- 连接前端和 Genkit 流程
- 错误处理和重试逻辑
- 类型安全的数据传输

**主要函数：**
```typescript
suggestThreat()           // 生成威胁分析
recommendMitigation()     // 生成缓解建议
getExecutiveSummary()     // 生成执行摘要
getArchitectureDiagram()  // 生成架构图
```

### 3. AI Flows (`src/ai/flows/`)

每个 Flow 包含：
- **Schema 定义** - 输入输出类型验证（Zod）
- **Prompt 模板** - AI 指令
- **Flow 定义** - 执行逻辑

**威胁分析 Flow 示例：**
```typescript
// 输入
{
  architectureDescription: string
  layerName: string
  layerDescription: string
}

// 输出
{
  threatAnalysis: string  // Markdown 格式的威胁分析
}
```

### 4. 错误处理系统

#### MaestroError (`src/lib/errors.ts`)
```typescript
class MaestroError {
  code: ErrorCode              // 错误代码
  severity: ErrorSeverity      // 严重程度
  message: string             // 技术消息
  userMessage: string         // 用户消息
  technicalDetails?: string   // 技术详情
  context?: Record<string, unknown>  // 上下文
  recoveryActions?: ErrorRecoveryAction[]  // 恢复操作
}
```

**错误代码分类：**
- AI Service Errors (AI 服务错误)
- Analysis Errors (分析错误)
- PDF Generation Errors (PDF 生成错误)
- Network Errors (网络错误)
- Validation Errors (验证错误)

#### AIErrorHandler (`src/lib/ai-error-handler.ts`)
- 专门处理 AI Flow 错误
- 错误分类和转换
- 重试决策逻辑

#### RetryUtils (`src/lib/retry-utils.ts`)
- 指数退避重试
- 最大重试次数限制
- 可配置的重试条件

### 5. 主页面组件 (`src/app/page.tsx`)

**状态管理：**
```typescript
const [layers, setLayers] = useState<LayerData[]>(INITIAL_LAYERS)
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [currentArchitecture, setCurrentArchitecture] = useState("")
const [executiveSummary, setExecutiveSummary] = useState<string | null>(null)
const [mermaidCode, setMermaidCode] = useState<string>("")
const [logs, setLogs] = useState<string[]>([])
```

**核心功能：**
- `handleAnalyze()` - 主分析循环
- `handleStop()` - 取消分析
- `handleGenerateDiagram()` - 生成架构图
- `handleDownloadPdf()` - 导出 PDF 报告

**分析流程：**
```
对于每个 MAESTRO 层：
  1. 更新状态为 'analyzing'
  2. 调用 suggestThreat() 生成威胁
  3. 更新层状态，存储威胁结果
  4. 调用 recommendMitigation() 生成缓解建议
  5. 更新层状态为 'complete'
  6. 添加日志记录

完成所有层后：
  1. 调用 getExecutiveSummary() 生成摘要
  2. 更新完成状态
```

### 6. 层卡片组件 (`src/components/layer-card.tsx`)

**功能：**
- 显示单个 MAESTRO 层的分析结果
- 响应式状态展示
- 折叠式内容展示

**状态展示：**
- `pending` - 等待分析
- `analyzing` - 正在分析（带加载动画）
- `complete` - 分析完成（显示威胁和缓解建议）
- `error` - 分析失败

### 7. Mermaid 图表组件 (`src/components/mermaid-diagram.tsx`)

**功能：**
- 渲染 Mermaid 图表
- 自动调整大小
- 错误处理

---

## MAESTRO 框架层

系统基于 MAESTRO 框架的 7 层安全分析：

| 层 ID | 层名称 | 描述 |
|-------|--------|------|
| `foundation-models` | Foundation Models | 核心 AI 模型（大语言模型、自定义训练 AI） |
| `data-operations` | Data Operations | 智能体数据处理，包括存储、处理和向量嵌入 |
| `agent-frameworks` | Agent Frameworks | 用于创建、编排和管理智能体的软件框架和 API |
| `deployment-infrastructure` | Deployment & Infrastructure | 托管智能体和 API 的服务器、网络、容器和底层资源 |
| `evaluation-observability` | Evaluation & Observability | 监控、评估和调试智能体行为的系统 |
| `security-compliance` | Security & Compliance | 整个智能体系统的安全控制和合规措施 |
| `agent-ecosystem` | Agent Ecosystem | 多个智能体交互、协作和潜在竞争的更广泛环境 |

**智能体因素分析：**
- 非确定性 (Non-Determinism)
- 自主性 (Autonomy)
- 无信任边界 (No Trust Boundary)
- 动态身份和访问控制
- 智能体间交互、委托和通信复杂性

---

## 类型定义

### 核心类型 (`src/lib/types.ts`)

```typescript
// 缓解建议
export type Mitigation = {
  recommendation: string;  // 建议措施
  reasoning: string;       // 推理说明
  caveats: string;         // 注意事项
};

// 层状态
export type LayerStatus = "pending" | "analyzing" | "complete" | "error";

// 层数据
export type LayerData = {
  id: string;
  name: string;
  description: string;
  threat: string | null;
  mitigation: Mitigation | null;
  status: LayerStatus;
};

// 用例
export type UseCase = {
  value: string;
  label: string;
  description: string;
};
```

---

## 环境变量配置

### 必需的环境变量

```bash
# LLM 提供商选择（三选一）
LLM_PROVIDER=google  # 或 openai, ollama

# 对应提供商的 API 密钥
# Google AI (默认)
GEMINI_API_KEY=your_gemini_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Ollama (本地)
OLLAMA_SERVER_ADDRESS=http://localhost:11434
```

### 可选的环境变量

```bash
# 覆盖默认模型
LLM_MODEL=gemini-2.5-flash  # 或 gpt-4o-mini, qwen3:8b
```

---

## 开发和部署

### 开发环境启动

```bash
# 终端 1：启动 Next.js 前端
npm run dev              # 运行在 http://localhost:9002

# 终端 2：启动 Genkit 后端
npm run genkit:dev       # 运行 Genkit 开发服务器

# 或者使用自动重载模式
npm run genkit:watch
```

### 生产构建

```bash
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
```

### 测试

```bash
npm run test             # 运行测试（watch 模式）
npm run test:run         # 运行测试一次
npm run test:coverage    # 生成覆盖率报告
```

### 代码质量

```bash
npm run lint             # ESLint 检查
npm run typecheck        # TypeScript 类型检查
```

---

## 安全考虑

### 1. AI 错误处理
- 详细的错误分类和恢复建议
- 用户友好的错误消息
- 自动重试机制（带指数退避）

### 2. 输入验证
- Zod schema 验证所有 AI Flow 输入
- 客户端和服务端双重验证

### 3. 用户数据隐私
- 架构描述仅在内存中处理
- 不持久化用户输入
- PDF 生成在客户端完成

### 4. API 密钥管理
- 环境变量存储敏感信息
- 不在代码中硬编码密钥
- 支持本地模型（Ollama）避免外部 API 调用

---

## 性能优化

### 1. 流程优化
- 并行处理独立的 MAESTRO 层
- 流式 AI 响应（通过 Genkit）
- 客户端缓存架构图

### 2. 前端优化
- Next.js Turbopack 加速开发构建
- React 状态更新优化
- 懒加载组件

### 3. 网络优化
- 指数退避重试减少 API 压力
- 错误缓存避免重复失败请求

---

## 扩展性设计

### 1. 多 LLM 提供商
- 统一的 Genkit 接口
- 易于添加新的提供商
- 运行时提供商切换

### 2. 可扩展的 MAESTRO 层
- 配置化的层定义
- 易于添加新的分析维度
- 独立的层处理逻辑

### 3. 插件式架构
- AI Flow 可独立开发和测试
- UI 组件可复用
- 错误处理可扩展

---

## 监控和日志

### 客户端日志
- 实时分析进度显示
- 错误和警告日志
- 用户操作记录

### 服务器端日志
- AI Flow 执行日志
- 错误堆栈跟踪
- 性能指标

---

## 测试策略

### 单元测试
- 错误处理逻辑测试
- 工具函数测试
- 类型验证测试

### 集成测试
- Server Actions 测试
- AI Flow 测试
- 组件交互测试

### 测试覆盖率目标
- 核心工具库：> 80%
- 错误处理系统：> 90%
- AI 集成层：> 70%

---

## 故障排除

### 常见问题

**1. AI 服务不可用**
- 检查 API 密钥配置
- 验证网络连接
- 尝试切换到 Ollama 本地模型

**2. PDF 生成失败**
- 检查浏览器兼容性
- 尝试简化架构图
- 查看控制台错误日志

**3. Genkit 连接问题**
- 确认两个进程都在运行
- 检查端口占用情况
- 重启 Genkit 服务

---

## 贡献指南

### 代码规范
- 遵循 ESLint 规则
- 使用 TypeScript 严格模式
- 编写单元测试

### 提交规范
- 清晰的提交消息
- 包含相关测试
- 更新文档

---

## 参考资料

- [MAESTRO 框架](https://cloudsecurityalliance.org/blog/2025/02/06/agentic-ai-threat-modeling-framework-maestro)
- [Next.js 文档](https://nextjs.org/docs)
- [Genkit 文档](https://firebase.google.com/docs/genkit)
- [shadcn/ui 组件库](https://ui.shadcn.com/)

---

**文档版本：** 1.0.0
**最后更新：** 2025-03-24
**维护者：** MAESTRO 团队
