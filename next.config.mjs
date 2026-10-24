/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Fix: disable build trace collection to avoid Windows OneDrive path issues (Next.js 14 bug)
  outputFileTracing: false,
};

export default nextConfig;
