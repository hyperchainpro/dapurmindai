import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'standalone' for Cloudflare Pages
  // output: "standalone",
  
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Optimize for Cloudflare Pages
  images: {
    unoptimized: true, // Cloudflare Pages doesn't support Next.js Image Optimization
  },
};

export default nextConfig;
