/** @type {import('next').NextConfig} */
const nextConfig = {
  // 为在Netlify上部署优化配置
  images: {
    unoptimized: true,
  },
  swcMinify: true,
};

module.exports = nextConfig; 