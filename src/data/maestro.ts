export const MAESTRO_LAYERS = [
  {
    id: 'foundation-models',
    name: '基础模型',
    description: '核心 AI 模型（例如，大语言模型、定制训练的 AI）。',
  },
  {
    id: 'data-operations',
    name: '数据操作',
    description: '为智能体处理数据，包括存储、处理和向量嵌入。',
  },
  {
    id: 'agent-frameworks',
    name: '智能体框架',
    description: '用于创建、编排和管理智能体的软件框架和 API。',
  },
  {
    id: 'deployment-infrastructure',
    name: '部署与基础设施',
    description: '托管智能体和 API 的服务器、网络、容器和底层资源。',
  },
  {
    id: 'evaluation-observability',
    name: '评估与可观测性',
    description: '用于监控、评估和调试智能体行为的系统。',
  },
  {
    id: 'security-compliance',
    name: '安全与合规',
    description: '整个智能体系统的安全控制和合规措施。',
  },
  {
    id: 'agent-ecosystem',
    name: '智能体生态系统',
    description: '多个智能体交互、协作，可能竞争的更广泛环境。',
  },
] as const;
