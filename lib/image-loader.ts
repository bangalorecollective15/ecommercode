// lib/image-loader.ts
//
// Custom Next.js image loader. Called automatically for every <Image>/<OptimizedImage>
// in the app instead of Next's built-in /_next/image optimizer.
//
// - Supabase Storage URLs: rewritten to Supabase's own image transformation
//   endpoint (/render/image/public/... instead of /object/public/...), which
//   resizes + compresses at Supabase's edge. This is what removes the slow,
//   timeout-prone Next optimizer hop entirely.
// - Everything else (Unsplash, your own domain, Google avatars, etc.): returned
//   as-is, since those hosts either already serve optimized assets or have their
//   own CDN-level resizing.

type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

const SUPABASE_STORAGE_HOSTS = [
  "wneonnqavtbwziybbxaq.supabase.co",
  "znqknsqwgoqrzoefqrwe.supabase.co",
  "mbmnsmzllagmbkvlnfwt.supabase.co",
];

export default function imageLoader({ src, width, quality }: LoaderParams): string {
  if (!src) return src;

  try {
    const url = new URL(src);
    const isSupabase = SUPABASE_STORAGE_HOSTS.includes(url.hostname);

    if (isSupabase && url.pathname.includes("/storage/v1/object/public/")) {
      // Rewrite the "object" (raw file) path to the "render/image" (transform) path.
      // e.g. /storage/v1/object/public/product-images/products/foo.jpg
      //  ->  /storage/v1/render/image/public/product-images/products/foo.jpg
      const renderPath = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );

      const params = new URLSearchParams({
        width: String(width),
        quality: String(quality || 75),
        resize: "contain",
      });

      return `https://${url.hostname}${renderPath}?${params.toString()}`;
    }

    // Non-Supabase hosts: pass through untouched.
    return src;
  } catch {
    // Relative paths (e.g. "/placeholder.png") or malformed URLs — just return as-is.
    return src;
  }
}