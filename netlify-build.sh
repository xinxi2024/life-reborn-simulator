#!/bin/bash
set -e

# 显示环境信息
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 清除缓存和旧构建文件
echo "Cleaning previous builds and cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .netlify/functions

# 安装依赖
echo "Installing dependencies with clean install..."
# 使用完全匹配netlify.toml中的配置
npm ci --legacy-peer-deps --no-fund --no-audit || {
  echo "npm ci failed, falling back to npm install..."
  npm install --legacy-peer-deps --no-fund --no-audit
}

# 构建应用
echo "Building application..."
NEXT_TELEMETRY_DISABLED=1 npm run build

echo "Build completed successfully!" 