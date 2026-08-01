import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    // Bypass Next's built-in /_next/image optimizer entirely. Instead, route every
    // <Image> through lib/image-loader.ts, which asks Supabase Storage's own
    // transformation API to resize/compress. This removes the Next server from the
    // critical path, which is what was causing the "500 in 7.1s" cold-start timeouts.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",

    remotePatterns: [
      {
        protocol: "https",
        hostname: "wneonnqavtbwziybbxaq.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "znqknsqwgoqrzoefqrwe.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "mbmnsmzllagmbkvlnfwt.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bangalorecollective.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.bangalorecollective.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 5184000,
    deviceSizes: [640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
  },
  output: "standalone",
  trailingSlash: true,
};

export default nextConfig;