"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import OptimizedImage from "./OptimizedImage";
import { Eye, ShoppingBag, Heart, Check, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductCard({
  product,
  userId,
  priority = false,
}: {
  product: any;
  userId: string | null;
  priority?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVar, setSelectedVar] = useState<any>(product.product_variations?.[0] || null);

  const cleanProductImage = useMemo(() => {
    let rawImageString = product?.image || product?.product_images?.[0]?.image_url;

    if (!rawImageString) return "/placeholder.png";

    try {
      if (typeof rawImageString === "string" && (rawImageString.startsWith("[") || rawImageString.startsWith("{"))) {
        const parsed = JSON.parse(rawImageString);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawImageString = parsed[0];
        } else if (typeof parsed === "string") {
          rawImageString = parsed;
        }
      }
    } catch (e) { }

    let cleanStr = String(rawImageString);
    let firstUrl = cleanStr.split(",")[0].trim();
    firstUrl = firstUrl.replace(/[\[\]"'\\]/g, "").trim();

    if (firstUrl.startsWith("http:")) {
      firstUrl = firstUrl.replace(/^http:/i, "https:");
    }

    if (!firstUrl || firstUrl === "undefined" || firstUrl === "null") {
      return "/placeholder.png";
    }

    return firstUrl;
  }, [product?.image, product?.product_images]);

  const isVideo = useMemo(() => {
    return cleanProductImage?.match(/\.(mp4|webm|ogg|mov)$/i);
  }, [cleanProductImage]);

  const isCurrentVarOutOfStock = !selectedVar || selectedVar.stock <= 0;

  const variationsWithLabels = useMemo(() => {
    if (!product.product_variations || product.product_variations.length === 0) return [];

    return product.product_variations
      .map((v: any) => {
        const sizeLabel = v.attributes?.name || v.size?.name || "";
        const colorLabel = v.colors?.name || "";
        const displayLabel = [sizeLabel, colorLabel].filter(Boolean).join(" - ").trim();
        return { ...v, displayLabel };
      })
      .filter((v: any) => v.displayLabel.length > 0);
  }, [product.product_variations]);

  const checkStatus = useCallback(async () => {
    if (!userId || !product.id) return;

    try {
      const [wishRes, cartRes] = await Promise.all([
        supabase.from("wishlists").select("id").eq("user_id", userId).eq("product_id", product.id).maybeSingle(),
        selectedVar
          ? supabase.from("cart").select("id").eq("user_id", userId).eq("variation_id", selectedVar.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setIsWishlisted(!!wishRes.data);
      setIsInCart(!!cartRes.data);
    } catch (err) {
      console.error("Status check failed", err);
    }
  }, [userId, product.id, selectedVar?.id]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isOverflowing = container.scrollWidth > container.clientWidth;
      if (isOverflowing) {
        e.stopPropagation();
        container.scrollLeft += e.deltaY;
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (isInCart) return router.push("/userinterface/cart");
    if (isCurrentVarOutOfStock) return toast.error("This variant is out of stock");

    setLoading(true);
    const { error } = await supabase.from("cart").insert([{
      user_id: userId,
      product_id: product.id,
      variation_id: selectedVar.id,
      quantity: 1,
    }]);

    setLoading(false);
    if (error) {
      console.error(error);
      toast.error("Could not add to cart");
    } else {
      setIsInCart(true);
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      toast.error("Please login to save to wishlist");
      return;
    }

    setLoading(true);
    try {
      if (isWishlisted) {
        await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", product.id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await supabase.from("wishlists").insert([{ user_id: userId, product_id: product.id }]);
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error("Wishlist update failed");
    } finally {
      setLoading(false);
    }
  };

  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  return (
    <div
      onClick={() =>
        router.push(
          `/userinterface/product/${product.id}?returnUrl=${encodeURIComponent(currentUrl)}`
        )
      }
      className="group relative bg-white dark:bg-[#111] rounded-[1.5rem] p-3 border border-slate-100 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-white/5 transition-all duration-500 cursor-pointer flex flex-col"
    >
      <style jsx>{`
        .custom-mini-scroll::-webkit-scrollbar {
          height: 3px;
        }
        .custom-mini-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .custom-mini-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-mini-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Media Window Container */}
      <div
        className="relative w-full rounded-[1.1rem] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#1c1c1c] dark:to-[#111] transition-colors duration-300"
        style={{ aspectRatio: "1/1" }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={cleanProductImage}
            className="w-full h-full object-contain"
            muted
            playsInline
            loop
            onMouseEnter={() => videoRef.current?.play()}
            onMouseLeave={() => {
              videoRef.current?.pause();
              videoRef.current!.currentTime = 0;
            }}
          />
        ) : (
          <OptimizedImage
            src={cleanProductImage}
            alt={product?.name || "Product Image"}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-contain transition-transform group-hover:scale-105"
          />
        )}

        {/* ✅ OUT OF STOCK BADGE — top-right corner of image */}
        {isCurrentVarOutOfStock && (
          <div className="absolute top-3 right-3 z-10 bg-gray-100/90 dark:bg-[#222]/90 backdrop-blur-sm text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase px-3 py-1 rounded-sm border border-gray-200 dark:border-[#444] transition-colors duration-300">
            Out of Stock
          </div>
        )}
      </div>

      {/* Meta Text details panel layout */}
      <div className="pt-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-black text-brand-blue dark:text-white uppercase truncate max-w-[70%] transition-colors duration-300">
            {product.name}
          </h3>

          {/* ✅ PRICE — strikethrough + red when out of stock */}
          <span
            className={`text-sm font-black ${isCurrentVarOutOfStock
                ? "text-red-400 line-through decoration-red-500"
                : "text-brand-blue dark:text-white transition-colors duration-300"
              }`}
          >
            ₹{selectedVar?.sale_price || selectedVar?.price || "N/A"}
          </span>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-gray-400 line-clamp-2 mb-3 transition-colors duration-300">{product.description}</p>

        {/* VARIATIONS UI */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onClick={(e) => e.stopPropagation()}
          className="flex gap-1 overflow-x-auto custom-mini-scroll mb-3 pb-1.5 min-h-[32px] items-center"
        >
          {variationsWithLabels.length > 0 ? (
            variationsWithLabels.map((v: any) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVar(v);
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all relative whitespace-nowrap duration-300 ${selectedVar?.id === v.id
                    ? v.stock <= 0
                      ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500 line-through"
                      : "bg-brand-blue dark:bg-white text-white dark:text-black border-brand-blue dark:border-white"
                    : v.stock <= 0
                      ? "bg-red-50 dark:bg-red-900/10 text-red-400 border-red-200 dark:border-red-900/50 line-through"
                      : "bg-white dark:bg-[#1a1a1a] text-slate-400 dark:text-gray-400 border-slate-200 dark:border-[#333] hover:border-slate-300 dark:hover:border-[#555]"
                  }`}
              >
                {v.displayLabel}
              </button>
            ))
          ) : (
            <span className="text-[9px] font-medium px-2 py-1 rounded-md bg-slate-50 dark:bg-[#111] text-slate-400 dark:text-gray-500 border border-slate-100 dark:border-[#222] cursor-not-allowed select-none transition-colors duration-300">
              Standard Edition
            </span>
          )}
        </div>

        {/* FOOTER: Details + Action Buttons */}
        <div className="mt-auto border-t dark:border-[#222] pt-3 flex justify-between items-center transition-colors duration-300">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 flex items-center gap-1 transition-colors duration-300">
            <Eye size={12} /> Details
          </span>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button onClick={handleWishlist} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#222] transition-colors duration-300">
              <Heart size={16} className={isWishlisted ? "text-red-500 fill-red-500" : "text-slate-400 dark:text-gray-500"} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={isCurrentVarOutOfStock}
              className={`p-1.5 rounded-full transition-colors duration-300 ${isInCart ? "bg-brand-gold text-white" : "hover:bg-slate-100 dark:hover:bg-[#222] text-brand-blue dark:text-white"
                }`}
            >
              <ShoppingBag size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}