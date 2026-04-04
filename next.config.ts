import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // remotePatterns is the modern, secure way to handle external images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wneonnqavtbwziybbxaq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "znqknsqwgoqrzoefqrwe.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "mbmnsmzllagmbkvlnfwt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  // Optimized for production & Docker deployments
  output: "standalone",
  trailingSlash: true,
};

export default nextConfig;