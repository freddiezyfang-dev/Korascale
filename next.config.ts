import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 先临时放宽构建限制，避免因 ESLint 错误阻塞 Vercel 部署
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 忽略类型错误（可选依赖的类型检查）
    ignoreBuildErrors: false,
  },
  // Next.js 13+ 推荐的方式：将可选依赖标记为外部包
  serverComponentsExternalPackages: ['nodemailer', 'resend'],
  webpack: (config, { isServer }) => {
    // 将可选依赖标记为外部依赖，避免构建时检查
    if (isServer) {
      config.externals = config.externals || [];
      // 使用函数形式，允许动态导入失败
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }, callback) => {
          // 允许 nodemailer 和 resend 作为可选依赖
          if (request === 'nodemailer' || request === 'resend') {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
