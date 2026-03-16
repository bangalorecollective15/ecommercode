import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "znqknsqwgoqrzoefqrwe.supabase.co",
      "mbmnsmzllagmbkvlnfwt.supabase.co",
    ],

    remotePatterns: [
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

  output: "standalone",
  trailingSlash: true,
};

export default nextConfig;