/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir 已经在 Next.js 14 中稳定，不再需要在 experimental 中配置
  },
  reactStrictMode: true,
  swcMinify: true,
  
  // 输出配置
  output: 'standalone',
  
  // 图片优化配置
  images: {
    domains: [],
    unoptimized: true
  },
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // 自定义webpack配置
    return config;
  },
  
  // 重写规则
  async rewrites() {
    return [
      // API代理示例
      // {
      //   source: '/api/:path*',
      //   destination: 'http://localhost:3001/api/:path*',
      // },
    ];
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // PWA支持
  typescript: {
    // 在生产构建期间忽略TypeScript错误
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // 在生产构建期间忽略ESLint错误
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig; 