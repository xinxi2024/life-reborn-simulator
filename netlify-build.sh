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
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# 构建应用
echo "Building application..."
NEXT_TELEMETRY_DISABLED=1 npm run build

echo "Build completed successfully!" 