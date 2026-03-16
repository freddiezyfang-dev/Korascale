/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/inspirations/immersive-encounters/:slug*',
        destination: '/inspirations/ancient-chinese-culture/:slug*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

