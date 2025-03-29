#!/bin/bash
set -e

# 显示环境信息
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 安装依赖
echo "Installing dependencies..."
npm install --legacy-peer-deps

# 构建应用
echo "Building application..."
npm run build

echo "Build completed successfully!" 