# =====================================
# MAESTRO Docker 多架构构建 Makefile
# =====================================
# 支持 amd64 和 arm64 架构，并自动推送到 Docker Hub

# =====================================
# 配置变量
# =====================================

# Docker 镜像名称和标签
IMAGE_NAME ?= y4ney/maestro
VERSION ?= latest
FULL_IMAGE_NAME = $(IMAGE_NAME):$(VERSION)

# 多架构支持
PLATFORMS = linux/amd64,linux/arm64

# 构建器名称
BUILDER = maestro-multiarch-builder

# 运行模式：dev（开发）或 prod（生产）
# 默认值：prod
MODE ?= prod

# 颜色输出
COLOR_RESET = \033[0m
COLOR_BOLD = \033[1m
COLOR_GREEN = \033[32m
COLOR_YELLOW = \033[33m
COLOR_RED = \033[31m
COLOR_BLUE = \033[34m

# =====================================
# 默认目标：显示帮助
# =====================================
.PHONY: help
help:
	@echo "$(COLOR_BOLD)MAESTRO Docker 构建工具$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_GREEN)可用命令:$(COLOR_RESET)"
	@echo "  make build          - 构建当前架构的镜像"
	@echo "  make build-multi     - 构建多架构镜像（amd64 + arm64）"
	@echo "  make push           - 推送当前架构镜像到 Docker Hub"
	@echo "  make push-multi      - 推送多架构镜像到 Docker Hub"
	@echo "  make build-push      - 构建并推送当前架构镜像"
	@echo "  make build-push-multi - 构建并推送多架构镜像（一键完成）"
	@echo "  make clean           - 清理构建器和未使用的镜像"
	@echo "  make login           - 登录 Docker Hub"
	@echo ""
	@echo "$(COLOR_YELLOW)配置变量:$(COLOR_RESET)"
	@echo "  IMAGE_NAME=$(COLOR_BLUE)$(IMAGE_NAME)$(COLOR_RESET) (默认: y4ney/maestro)"
	@echo "  VERSION=$(COLOR_BLUE)$(VERSION)$(COLOR_RESET) (默认: latest)"
	@echo "  MODE=$(COLOR_BLUE)$(MODE)$(COLOR_RESET) (默认: prod, 可选: dev/prod)"
	@echo ""
	@echo "$(COLOR_YELLOW)运行模式说明:$(COLOR_RESET)"
	@echo "  dev  - 开发模式（运行 Genkit Dev Server + Next.js Dev Server）"
	@echo "  prod - 生产模式（仅运行 Next.js Production Server）"
	@echo ""
	@echo "$(COLOR_YELLOW)端口说明:$(COLOR_RESET)"
	@echo "  3000 - Next.js 前端（始终暴露）"
	@echo "  4000 - Genkit UI（仅在 dev 模式下可访问）"
	@echo ""
	@echo "$(COLOR_YELLOW)示例:$(COLOR_RESET)"
	@echo "  make IMAGE_NAME=myrepo/maestro VERSION=v1.0.0 build-push-multi"
	@echo "  make MODE=dev build-push-multi  # 构建开发版本"

# =====================================
# 帮助目标
# =====================================
.PHONY: all
all: help

# =====================================
# 登录 Docker Hub
# =====================================
.PHONY: login
login:
	@echo "$(COLOR_BLUE)→ 登录 Docker Hub...$(COLOR_RESET)"
	docker login

# =====================================
# 创建多架构构建器
# =====================================
.PHONY: builder
builder:
	@echo "$(COLOR_BLUE)→ 创建多架构构建器...$(COLOR_RESET)"
	@if docker buildx inspect $(BUILDER) > /dev/null 2>&1; then \
		echo "$(COLOR_GREEN)✓ 构建器已存在$(COLOR_RESET)"; \
	else \
		docker buildx create --name $(BUILDER) --driver docker-container --use; \
		echo "$(COLOR_GREEN)✓ 构建器创建成功$(COLOR_RESET)"; \
	fi

# =====================================
# 构建当前架构镜像
# =====================================
.PHONY: build
build:
	@echo "$(COLOR_BLUE)→ 构建镜像: $(FULL_IMAGE_NAME)$(COLOR_RESET)"
	docker build \
		-t $(FULL_IMAGE_NAME) \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--progress=plain \
		.
	@echo "$(COLOR_GREEN)✓ 镜像构建完成: $(FULL_IMAGE_NAME)$(COLOR_RESET)"

# =====================================
# 构建多架构镜像
# =====================================
.PHONY: build-multi
build-multi: builder
	@echo "$(COLOR_BLUE)→ 构建多架构镜像: $(FULL_IMAGE_NAME)$(COLOR_RESET)"
	@echo "  支持架构: $(COLOR_YELLOW)$(PLATFORMS)$(COLOR_RESET)"
	docker buildx build \
		--builder $(BUILDER) \
		--platform $(PLATFORMS) \
		-t $(FULL_IMAGE_NAME) \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--progress=plain \
		--push=false \
		.
	@echo "$(COLOR_GREEN)✓ 多架构镜像构建完成: $(FULL_IMAGE_NAME)$(COLOR_RESET)"

# =====================================
# 推送当前架构镜像
# =====================================
.PHONY: push
push:
	@echo "$(COLOR_BLUE)→ 推送镜像到 Docker Hub...$(COLOR_RESET)"
	docker push $(FULL_IMAGE_NAME)
	@echo "$(COLOR_GREEN)✓ 镜像推送完成: $(FULL_IMAGE_NAME)$(COLOR_RESET)"

# =====================================
# 推送多架构镜像
# =====================================
.PHONY: push-multi
push-multi:
	@echo "$(COLOR_BLUE)→ 推送多架构镜像到 Docker Hub...$(COLOR_RESET)"
	docker buildx build \
		--builder $(BUILDER) \
		--platform $(PLATFORMS) \
		-t $(FULL_IMAGE_NAME) \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--progress=plain \
		--push=true \
		.
	@echo "$(COLOR_GREEN)✓ 多架构镜像推送完成: $(FULL_IMAGE_NAME)$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)支持的架构:$(COLOR_RESET)"
	@echo "  - linux/amd64"
	@echo "  - linux/arm64"

# =====================================
# 一键构建并推送（当前架构）
# =====================================
.PHONY: build-push
build-push: build
	@echo "$(COLOR_BLUE)→ 推送镜像到 Docker Hub...$(COLOR_RESET)"
	docker push $(FULL_IMAGE_NAME)
	@echo "$(COLOR_GREEN)✓ 构建和推送完成: $(FULL_IMAGE_NAME)$(COLOR_RESET)"

# =====================================
# 一键构建并推送（多架构）- 推荐使用
# =====================================
.PHONY: build-push-multi
build-push-multi: builder
	@echo "$(COLOR_BOLD)====================================$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)  MAESTRO 多架构构建和推送$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)====================================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)目标镜像: $(COLOR_BLUE)$(FULL_IMAGE_NAME)$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)支持架构: $(COLOR_BLUE)$(PLATFORMS)$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BLUE)→ 开始构建和推送...$(COLOR_RESET)"
	docker buildx build \
		--builder $(BUILDER) \
		--platform $(PLATFORMS) \
		-t $(FULL_IMAGE_NAME) \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--progress=plain \
		--push=true \
		.
	@echo ""
	@echo "$(COLOR_GREEN)====================================$(COLOR_RESET)"
	@echo "$(COLOR_GREEN)✓ 多架构镜像构建和推送完成！$(COLOR_RESET)"
	@echo "$(COLOR_GREEN)====================================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)现在可以使用以下命令拉取镜像:$(COLOR_RESET)"
	@echo "  docker pull $(FULL_IMAGE_NAME)"
	@echo ""
	@echo "$(COLOR_YELLOW)运行示例:$(COLOR_RESET)"
	@echo "  docker run -p 3000:3000 -p 4000:4000 --env-file .env $(FULL_IMAGE_NAME)"

# =====================================
# 清理构建器和未使用的镜像
# =====================================
.PHONY: clean
clean:
	@echo "$(COLOR_BLUE)→ 清理构建器...$(COLOR_RESET)"
	@if docker buildx inspect $(BUILDER) > /dev/null 2>&1; then \
		docker buildx rm $(BUILDER); \
		echo "$(COLOR_GREEN)✓ 构建器已删除$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)构建器不存在$(COLOR_RESET)"; \
	fi
	@echo "$(COLOR_BLUE)→ 清理未使用的 Docker 镜像...$(COLOR_RESET)"
	docker image prune -f
	@echo "$(COLOR_GREEN)✓ 清理完成$(COLOR_RESET)"

# =====================================
# 查看镜像信息
# =====================================
.PHONY: inspect
inspect:
	@echo "$(COLOR_BLUE)→ 查看镜像信息: $(FULL_IMAGE_NAME)$(COLOR_RESET)"
	docker buildx imagetools inspect $(FULL_IMAGE_NAME)

# =====================================
# 导出镜像（离线使用）
# =====================================
.PHONY: export
export:
	@echo "$(COLOR_BLUE)→ 导出多架构镜像到 tar 文件...$(COLOR_RESET)"
	docker buildx build \
		--builder $(BUILDER) \
		--platform $(PLATFORMS) \
		-t $(FULL_IMAGE_NAME) \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--progress=plain \
		-o type=tar,dest=./maestro-$(VERSION).tar \
		.
	@echo "$(COLOR_GREEN)✓ 镜像已导出到: maestro-$(VERSION).tar$(COLOR_RESET)"

# =====================================
# 从 tar 加载镜像
# =====================================
.PHONY: load
load:
	@if [ -f maestro-$(VERSION).tar ]; then \
		echo "$(COLOR_BLUE)→ 从 tar 加载镜像...$(COLOR_RESET)"; \
		docker load < maestro-$(VERSION).tar; \
		echo "$(COLOR_GREEN)✓ 镜像加载完成$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_RED)✗ 错误: 找不到 maestro-$(VERSION).tar$(COLOR_RESET)"; \
		exit 1; \
	fi
