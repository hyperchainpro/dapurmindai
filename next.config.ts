import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'standalone' for Cloudflare Pages
  // output: "standalone",
  
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'https://silent-ocelot-29.convex.cloud',
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL || 'https://silent-ocelot-29.convex.site',
  },
  
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
