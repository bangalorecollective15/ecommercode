import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
      // FIXED: Added Bangalore Collective domain to prevent the Runtime Error
      {
        protocol: "https",
        hostname: "bangalorecollective.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  output: "standalone",
  trailingSlash: true,
};

export default nextConfig;