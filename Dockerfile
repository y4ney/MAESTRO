# MAESTRO 威胁分析器 Dockerfile
# =====================================
# 多阶段构建，支持开发和生产两种模式
#
# 运行模式：
#   开发模式: docker run --env MODE=dev ...
#   生产模式: docker run --env MODE=prod ...
# =====================================

# =====================================
# 第一阶段：依赖安装和构建
# =====================================
FROM node:lts-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json ./

# 安装所有依赖（包括开发依赖，用于 genkit dev）
RUN npm ci && \
    npm cache clean --force

# 复制源代码
COPY . .

# =====================================
# 第二阶段：运行镜像
# =====================================
FROM node:lts-alpine

# 环境变量配置
# MODE: 运行模式，可选值：dev（开发）, prod（生产）
# 默认值：prod
ENV MODE=prod

# LLM_PROVIDER: AI 提供商，可选值：google, openai, ollama
# 默认值：google（需要 GEMINI_API_KEY 或 GOOGLE_API_KEY）
# openai: 需要 OPENAI_API_KEY
# ollama: 需要 OLLAMA_SERVER_ADDRESS
ENV LLM_PROVIDER=google

# LLM_MODEL: 可选，指定使用的模型
# 默认值取决于提供商：
# - google: gemini-2.5-flash
# - openai: gpt-4o-mini
# - ollama: qwen3:8b
ENV LLM_MODEL=

# 暴露端口
# 3000: Next.js 前端（必须暴露）
# 4000: Genkit 开发者 UI（仅在开发模式下暴露）
EXPOSE 3000 4000

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# 创建非 root 用户运行应用（安全最佳实践）
RUN addgroup -g appuser && \
    adduser -D -G appuser && \
    chown -R appuser:appuser /app

USER appuser

# 健康检查（仅检查 Next.js）
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# =====================================
# 启动命令：根据 MODE 选择运行模式
# =====================================

# 开发模式：运行 Genkit Dev Server + Next.js Dev Server
# 优点：支持热重载、Genkit UI 可访问
# 缺点：性能较低、暴露 4000 端口
ENTRYPOINT ["sh", "-lc", "if [ \"$MODE\" = \"dev\" ]; then \
    echo '🚀 开发模式: Genkit Dev Server (4000) + Next.js Dev Server (3000)'; \
    npm run genkit:dev & \
    npm run dev; \
else \
    echo '🚀 生产模式: Next.js Production Server (3000)'; \
    npm run start; \
fi"]
