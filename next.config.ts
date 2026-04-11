import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  /* config options here */
  async redirects() {
    return [
      {
        source: '/inspirations/immersive-encounters/:slug*',
        destination: '/inspirations/ancient-chinese-culture/:slug*',
        permanent: true,
      },
    ];
  },
  // 明确指定项目根目录，避免 Turbopack 误用上级 lockfile 导致 404
  turbopack: {
    root: path.join(__dirname),
  },
  eslint: {
    // 先临时放宽构建限制，避免因 ESLint 错误阻塞 Vercel 部署
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 忽略类型错误（可选依赖的类型检查）
    ignoreBuildErrors: false,
  },
  // dev 时用轮询替代大量文件 watch，避免 EMFILE 导致 /api/journeys 等路由未注册而 404
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
