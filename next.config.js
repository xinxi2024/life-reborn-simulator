/** @type {import('next').NextConfig} */
const nextConfig = {
  // 为在Netlify上部署优化配置
  images: {
    unoptimized: true,
  },
  swcMinify: true,
  // 禁用ESLint以避免构建过程的问题
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 禁用类型检查以避免构建问题
  typescript: {
    ignoreBuildErrors: true,
  },
  // 确保正确处理Netlify重定向
  trailingSlash: false,
};

module.exports = nextConfig; 