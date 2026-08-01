"use client";
import OptimizedImage from "../../components/OptimizedImage"; // adjust relative path to match your folder depth
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ShoppingBag, Heart, Truck, ArrowLeft, ShieldCheck,
  Tag, Minus, Plus, CreditCard, Sparkles, Star, Play, MessageSquare, Lock
} from "lucide-react";
import ProductCard from "../../components/ProductCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const cleanPrice = (price: any): number => {
  if (price === null || price === undefined) return 0;
  if (typeof price === "number") return price;
  const cleanedString = String(price).replace(/[^\d.]/g, "");
  return Number(cleanedString) || 0;
};

// ─── Per-section skeleton components ────────────────────────────────────────

function ImageViewerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="w-full aspect-square rounded-3xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse flex-shrink-0 transition-colors duration-300" />
        ))}
      </div>
    </div>
  );
}

function InfoPanelSkeleton() {
  return (
    <div className="space-y-5">
      {/* Brand + title */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="h-9 w-3/4 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="h-9 w-1/2 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="h-3 w-32 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      </div>
      {/* Price */}
      <div className="h-10 w-32 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      {/* Variations */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-20 h-12 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
          ))}
        </div>
      </div>
      {/* Quantity + Add to Bag */}
      <div className="flex gap-3">
        <div className="w-28 h-12 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      </div>
      {/* Checkout */}
      <div className="w-full h-14 rounded-xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      {/* Meta info */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-[#333] transition-colors duration-300">
        <div className="h-8 rounded-lg bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="h-8 rounded-lg bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      </div>
      {/* Description */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="h-3 w-5/6 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="h-3 w-4/6 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      </div>
    </div>
  );
}

function SimilarProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-44 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        ))}
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-6 w-40 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 rounded-2xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
        <div className="md:col-span-2 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Star rating display (read-only) ────────────────────────────────────────

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(value)
              ? "fill-brand-gold text-brand-gold"
              : "text-slate-200 dark:text-[#333] transition-colors duration-300"
          }
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnUrl = searchParams.get("returnUrl");
  const productId = params.productId;

  // Core product data
  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [selectedVar, setSelectedVar] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── Per-section loading flags ──────────────────────────────────────────────
  // Each paints the moment its own query resolves — nothing waits on anything else.
  const [imagesLoading, setImagesLoading] = useState(true);
  const [infoLoading, setInfoLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const rows = reviewRows || [];
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

    let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      profileMap = (profileRows || []).reduce((acc, p) => {
        acc[p.id] = { full_name: p.full_name, email: p.email };
        return acc;
      }, {} as Record<string, { full_name: string | null; email: string | null }>);
    }

    setReviews(
      rows.map((r) => ({
        ...r,
        reviewer_name:
          profileMap[r.user_id]?.full_name ||
          profileMap[r.user_id]?.email?.split("@")[0] ||
          null,
      }))
    );
  }, [productId]);

  const checkWishlistStatus = useCallback(async (uId: string) => {
    const { data } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", uId)
      .eq("product_id", productId)
      .single();
    if (data) { setIsWishlisted(true); setWishlistId(data.id); }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;

    // ── 1. Auth (cheap, non-blocking) ──────────────────────────────────────
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        checkWishlistStatus(user.id);
      }
      setAuthChecked(true);
    });

    // ── 2. Core product + variations + images (paints info + images panels) ─
    supabase
      .from("products")
      .select(`*, brands(name_en, image_url), categories(id, name), subcategories(id, name)`)
      .eq("id", productId)
      .single()
      .then(async ({ data: prod }) => {
        if (!prod) {
          setInfoLoading(false);
          setImagesLoading(false);
          return;
        }

        setProduct(prod);

        // Variations + images fire in parallel so neither blocks the other
        const [varRes, imgRes] = await Promise.all([
          supabase
            .from("product_variations")
            .select(`*, color:color_id(name), size:size_id(name)`)
            .eq("product_id", productId),
          supabase
            .from("product_images")
            .select("*")
            .eq("product_id", productId),
        ]);

        // ── Info panel ready ─────────────────────────────────────────────
        const vars = varRes.data || [];
        setVariations(vars);
        setSelectedVar(vars[0] || null);
        setInfoLoading(false);

        // ── Images panel ready ───────────────────────────────────────────
        const processedImages = imgRes.data?.flatMap((item) =>
          item.image_url.split(",").map((url: string, index: number) => ({
            id: `${item.id}-${index}`,
            image_url: url.trim().replace(/^http:/i, "https:"),
          }))
        ) || [];

        setImages(processedImages);
        setMainImage(processedImages[0]?.image_url || "/placeholder.png");
        setImagesLoading(false);

        // ── 3. Similar products fires after we know category_id ──────────
        supabase
          .from("products")
          .select(`
            *, brands(name_en),
            categories(name),
            product_images(image_url),
            product_variations(*, size:size_id(name))
          `)
          .eq("category_id", prod.category_id)
          .neq("id", prod.id)
          .limit(5)
          .then(({ data: similarRaw }) => {
            setSimilarProducts(
              similarRaw?.map((p: any) => {
                let fallbackImage = "/placeholder.png";
                if (p.product_images?.[0]?.image_url) {
                  fallbackImage = p.product_images[0].image_url
                    .split(",")[0]
                    .trim()
                    .replace(/^http:/i, "https:");
                }
                return {
                  ...p,
                  price: cleanPrice(p.product_variations?.[0]?.price),
                  image: fallbackImage,
                  brand: p.brands?.name_en || "Exclusive",
                };
              }) || []
            );
            setSimilarLoading(false);
          });

        // ── 4. Reviews fires independently too ───────────────────────────
        fetchReviews().finally(() => setReviewsLoading(false));
      });
  }, [productId, checkWishlistStatus, fetchReviews]);

  const handleVariationChange = (variation: any) => {
    setSelectedVar(variation);
    setQuantity(1);
  };

  const submitReview = async () => {
    if (!userId) { toast.error("Please login to write a review"); return; }
    if (!reviewText.trim()) return toast.error("Please write something");

    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert([{
      product_id: productId, user_id: userId, rating, review_text: reviewText,
    }]);
    setSubmittingReview(false);

    if (!error) {
      toast.success("Review added!");
      setReviewText("");
      setRating(5);
      await fetchReviews();
    } else {
      toast.error("Couldn't post your review. Please try again.");
    }
  };

  const toggleWishlist = async () => {
    if (!authChecked) return;
    if (!userId) { toast.error("Please login to save to wishlist"); return; }

    if (isWishlisted) {
      await supabase.from("wishlists").delete().eq("id", wishlistId);
      setIsWishlisted(false);
      toast.success("Removed");
    } else {
      const { data } = await supabase
        .from("wishlists")
        .insert([{ user_id: userId, product_id: productId }])
        .select()
        .single();
      setIsWishlisted(true);
      setWishlistId(data.id);
      toast.success("Saved to wishlist");
    }
  };

  const handleCart = async () => {
    if (!authChecked) return;
    if (!userId) { toast.error("Please login to add items to cart"); return; }
    if (!selectedVar) { toast.error("Please select a variation"); return; }
    if (selectedVar.stock <= 0) { toast.error("This option is currently out of stock"); return; }
    if (quantity > selectedVar.stock) {
      toast.error(`Only ${selectedVar.stock} pieces remaining in stock.`);
      return;
    }

    const { error } = await supabase.from("cart").insert([{
      user_id: userId,
      product_id: product?.id,
      variation_id: selectedVar?.id,
      quantity,
    }]);

    if (!error) {
      toast.success("Added to bag");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleCheckout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authChecked) return;
    if (!userId) { toast.error("Please login to proceed to checkout", { icon: "🔒" }); return; }
    if (!selectedVar) { toast.error("Please select a size/color first"); return; }
    if (selectedVar.stock <= 0) { toast.error("This item variation is out of stock"); return; }
    if (quantity > selectedVar.stock) {
      toast.error(`Cannot proceed. Only ${selectedVar.stock} units available.`);
      return;
    }

    const { data: existingCartItem } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", product.id)
      .eq("variation_id", selectedVar.id)
      .maybeSingle();

    if (existingCartItem) {
      toast("Item already in cart. Redirecting to cart...");
      router.push("/userinterface/cart");
      return;
    }

    await handleCart();
    router.push("/userinterface/cart");
  };

 const displayPrice = cleanPrice(selectedVar?.price);
const displaySalePrice = cleanPrice(selectedVar?.sale_price);
const isOutOfStock = !selectedVar || selectedVar.stock <= 0;
  const dynamicDescriptionFallback = `Explore this premium selection from ${product?.brands?.name_en || "our exclusive collections"}. Part of our handpicked ${product?.categories?.name || "designer"} catalog, crafted for discerning tastes.`;

  // ── Reviews derived data ───────────────────────────────────────────────
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
    : 0;
  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-black text-slate-900 dark:text-white selection:bg-brand-gold/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">

        {/* BREADCRUMB & BACK */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => {
              if (returnUrl) router.push(decodeURIComponent(returnUrl));
              else router.back();
            }}
            className="p-2 hover:bg-white dark:hover:bg-[#222] rounded-full border border-transparent hover:border-slate-100 dark:hover:border-[#444] transition-all duration-300"
          >
            <ArrowLeft size={18} />
          </button>

          {infoLoading ? (
            <div className="flex gap-2 items-center">
              <div className="h-3 w-10 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
              <span className="text-slate-200 dark:text-gray-600 transition-colors duration-300">/</span>
              <div className="h-3 w-20 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
              <span className="text-slate-200 dark:text-gray-600 transition-colors duration-300">/</span>
              <div className="h-3 w-32 rounded-full bg-slate-100 dark:bg-[#222] animate-pulse transition-colors duration-300" />
            </div>
          ) : (
            <nav className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 flex gap-2 transition-colors duration-300">
              <span>Shop</span> / <span>{product?.categories?.name}</span> /{" "}
              <span className="text-brand-blue dark:text-white transition-colors duration-300">{product?.name}</span>
            </nav>
          )}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">

          {/* LEFT: IMAGE VIEWER — paints when imagesLoading → false */}
          <div className="lg:col-span-6 space-y-4">
            {imagesLoading ? (
              <ImageViewerSkeleton />
            ) : (
              <>
                {/* MAIN IMAGE / VIDEO */}
                <div
                  className="relative w-full overflow-hidden rounded-3xl border border-slate-100 dark:border-[#333] shadow-sm group bg-slate-50 dark:bg-[#111]/50 transition-colors duration-300"
                  style={{ aspectRatio: "1/1", maxWidth: "1600px", maxHeight: "1600px" }}
                >
                  {mainImage && mainImage.toLowerCase().match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={mainImage}
                      className="w-full h-full object-contain object-center"
                      autoPlay muted loop playsInline
                    />
                  ) : (
                    <OptimizedImage
                      src={mainImage || "/placeholder.png"}
                      alt="Product"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-contain object-center transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  <button
                    onClick={toggleWishlist}
                    className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur shadow-sm rounded-full hover:scale-110 transition-transform duration-300 z-10"
                  >
                    <Heart
                      size={18}
                      className={isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400 dark:text-gray-500"}
                    />
                  </button>
                </div>

                {/* THUMBNAILS */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar min-h-[64px]">
                  {images.length > 0 ? images.map((img) => {
                    const isThumbVideo = img.image_url.toLowerCase().match(/\.(mp4|webm|mov)$/);
                    return (
                      <button
                        key={img.id}
                        onClick={() => setMainImage(img.image_url)}
                        className={`relative w-16 h-16 flex-shrink-0 rounded-xl border-2 transition-all duration-300 overflow-hidden bg-slate-50 dark:bg-[#111]/50 ${mainImage === img.image_url
                            ? "border-brand-blue dark:border-white"
                            : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                      >
                        {isThumbVideo ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <video
                              src={`${img.image_url}#t=0.001`}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted playsInline preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-1 rounded-full text-brand-blue dark:text-white transition-colors duration-300">
                                <Play size={12} className="fill-current translate-x-[0.5px]" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <OptimizedImage
                            src={img.image_url}
                            alt="Product thumbnail"
                            fill
                            sizes="64px"
                            className="object-cover object-center"
                          />
                        )}
                      </button>
                    );
                  }) : (
                    <div className="text-xs text-slate-400 dark:text-gray-500 italic transition-colors duration-300">No images available</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT: INFO PANEL — paints when infoLoading → false */}
          <div className="lg:col-span-4 space-y-5">
            {infoLoading ? (
              <InfoPanelSkeleton />
            ) : (
              <>
                {/* Brand + title */}
                <div className="space-y-2">
                  <p className="text-brand-gold font-black text-[10px] uppercase tracking-[0.2em]">
                    {product?.brands?.name_en}
                  </p>
                  <h1 className="text-4xl font-bold tracking-tight text-brand-blue dark:text-white leading-tight transition-colors duration-300">
                    {product?.name}
                  </h1>
                  <div className="flex items-center gap-3 text-slate-400 dark:text-gray-500 text-xs italic transition-colors duration-300">
                    <Tag size={12} /> SKU: {product?.sku || "N/A"}
                  </div>
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <StarRow value={averageRating} />
                      <span className="text-xs font-bold text-slate-500 dark:text-gray-400 transition-colors duration-300">
                        {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black">
                    ₹{displaySalePrice > 0 ? displaySalePrice : displayPrice}
                  </span>
                  {displaySalePrice > 0 && displaySalePrice < displayPrice && (
                    <span className="text-lg text-slate-300 dark:text-gray-600 line-through transition-colors duration-300">₹{displayPrice}</span>
                  )}
                </div>

                {/* Variation selector */}
               {/* Variation selector */}
<div className="space-y-3">
  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 transition-colors duration-300">
    Select Variation
  </h4>
  <div className="flex flex-wrap gap-2">
    {variations.length > 0 ? (
      variations.map((v) => {
        const label =
          v.color?.name && v.color.name.toLowerCase() !== "default"
            ? `${v.color.name} / ${v.size?.name || ""}`
            : v.size?.name || "Standard Edition";

        const isSelected = selectedVar?.id === v.id;
        const variantOutOfStock = v.stock <= 0;

        return (
          <button
            key={v.id}
            onClick={() => handleVariationChange(v)}
            className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex flex-col items-start ${
              isSelected
                ? variantOutOfStock
                  ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500 line-through"
                  : "border-brand-blue dark:border-white bg-brand-blue dark:bg-white text-white dark:text-slate-900 shadow-md"
                : variantOutOfStock
                  ? "bg-red-50 dark:bg-red-900/10 text-red-400 border-red-200 dark:border-red-900/50 line-through"
                  : "border-slate-100 dark:border-[#333] hover:border-brand-gold/30 dark:hover:border-brand-gold/50"
            }`}
          >
            <span>{label}</span>
          </button>
        );
      })
    ) : (
      <span className="px-4 py-3 rounded-xl border border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#111]/50 text-xs font-bold text-slate-400 dark:text-gray-500 transition-colors duration-300">
        Standard Edition
      </span>
    )}
  </div>
</div>

                {/* Quantity + Add to Bag */}
                <div className="flex gap-3">
                  <div className="flex items-center bg-slate-50 dark:bg-[#111] rounded-xl px-4 py-2 border border-slate-100 dark:border-[#333] transition-colors duration-300">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={!selectedVar || selectedVar.stock <= 0}
                      className="disabled:opacity-30 hover:text-brand-gold dark:hover:bg-[#333] transition-colors duration-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">
                      {selectedVar?.stock > 0 ? quantity : 0}
                    </span>
                    <button
                      onClick={() => {
                        if (selectedVar && quantity < selectedVar.stock) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.error(`Maximum available stock reached (${selectedVar?.stock} units)`);
                        }
                      }}
                      disabled={!selectedVar || quantity >= (selectedVar?.stock || 0)}
                      className="disabled:opacity-30 hover:text-brand-gold dark:hover:bg-[#333] transition-colors duration-300"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={handleCart}
                    disabled={!selectedVar || selectedVar.stock <= 0}
                    className="flex-1 bg-white dark:bg-black border-2 border-brand-blue dark:border-white text-brand-blue dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-blue dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-black disabled:hover:text-brand-blue dark:disabled:hover:text-white disabled:cursor-not-allowed"
                  >
                    {selectedVar?.stock <= 0 ? "Out of Stock" : "Add to Bag"}
                  </button>
                </div>

                {/* Checkout */}
                <button
                  onClick={handleCheckout}
                  disabled={!selectedVar || selectedVar.stock <= 0}
                  className="w-full bg-brand-blue dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 dark:shadow-none hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard size={16} />
                  {selectedVar?.stock <= 0 ? "Unavailable" : "Checkout Now"}
                </button>

                {/* Shipping + certified */}
                <div className="pt-6 border-t border-slate-100 dark:border-[#333] grid grid-cols-2 gap-4 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-[#222]/50 rounded-lg text-brand-gold transition-colors duration-300">
                      <Truck size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400 transition-colors duration-300">Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-[#222]/50 rounded-lg text-brand-gold transition-colors duration-300">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400 transition-colors duration-300">Certified</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed bg-slate-50 dark:bg-[#111]/50 p-4 rounded-xl transition-colors duration-300">
                  {product?.description || dynamicDescriptionFallback}
                </p>
              </>
            )}
          </div>
        </div>

        {/* SIMILAR PRODUCTS — paints when similarLoading → false */}
        <div className="mt-16">
          {similarLoading ? (
            <SimilarProductsSkeleton />
          ) : similarProducts.length > 0 ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight transition-colors duration-300">
                  Related Pieces
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {similarProducts.slice(0, 5).map((p) => (
                  <ProductCard key={p.id} product={p} userId={userId} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* CUSTOMER REVIEWS — paints when reviewsLoading → false */}
        <div className="mt-16 pt-12 border-t border-slate-100 dark:border-[#222] transition-colors duration-300">
          {reviewsLoading ? (
            <ReviewsSkeleton />
          ) : (
            <section className="space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight transition-colors duration-300">
                Customer Reviews
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                {/* SUMMARY + WRITE-REVIEW COLUMN */}
                <div className="space-y-6">
                  {/* Rating summary */}
                  <div className="rounded-2xl border border-slate-100 dark:border-[#333] bg-slate-50 dark:bg-[#111]/50 p-6 space-y-4 transition-colors duration-300">
                    {reviewCount > 0 ? (
                      <>
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-black text-brand-blue dark:text-white transition-colors duration-300">
                            {averageRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-slate-400 dark:text-gray-500 pb-1 transition-colors duration-300">/ 5</span>
                        </div>
                        <StarRow value={averageRating} size={16} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 transition-colors duration-300">
                          Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                        </p>

                        {/* Rating breakdown bars */}
                        <div className="space-y-1.5 pt-2">
                          {ratingBuckets.map(({ star, count }) => {
                            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-gray-500 transition-colors duration-300">
                                <span className="w-3">{star}</span>
                                <Star size={10} className="fill-brand-gold text-brand-gold flex-shrink-0" />
                                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-[#333] overflow-hidden transition-colors duration-300">
                                  <div
                                    className="h-full bg-brand-gold rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-4 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center gap-2 py-4">
                        <div className="p-3 bg-white dark:bg-black rounded-full border border-slate-100 dark:border-[#333] transition-colors duration-300">
                          <MessageSquare size={18} className="text-brand-gold" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-gray-400 transition-colors duration-300">
                          No reviews yet
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 transition-colors duration-300">
                          Be the first to share your thoughts.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Write a review */}
                  <div className="rounded-2xl border border-slate-100 dark:border-[#333] bg-white dark:bg-[#0a0a0a] p-6 space-y-4 transition-colors duration-300">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 transition-colors duration-300">
                      Write a Review
                    </h4>

                    {authChecked && !userId ? (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-[#111] rounded-xl p-4 border border-slate-100 dark:border-[#333] transition-colors duration-300">
                        <Lock size={16} className="text-slate-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                            Please log in to leave a review for this product.
                          </p>
                          <button
                            onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
                            className="text-[10px] font-bold uppercase tracking-widest text-brand-blue dark:text-white underline underline-offset-4"
                          >
                            Log in to continue
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 transition-colors duration-300">
                            Your Rating
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const starValue = i + 1;
                              const active = starValue <= (hoverRating || rating);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onMouseEnter={() => setHoverRating(starValue)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setRating(starValue)}
                                  className="p-0.5 hover:scale-110 transition-transform duration-200"
                                  aria-label={`Rate ${starValue} out of 5`}
                                >
                                  <Star
                                    size={22}
                                    className={active ? "fill-brand-gold text-brand-gold" : "text-slate-200 dark:text-[#333] transition-colors duration-300"}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          disabled={!userId}
                          placeholder="Share details about the fit, quality, or your experience..."
                          rows={4}
                          className="w-full resize-none rounded-xl border border-slate-100 dark:border-[#333] bg-slate-50 dark:bg-[#111] px-4 py-3 text-xs text-slate-700 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-colors duration-300"
                        />

                        <button
                          onClick={submitReview}
                          disabled={!userId || submittingReview || !reviewText.trim()}
                          className="w-full bg-brand-blue dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {submittingReview ? "Posting..." : "Post Review"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* REVIEW LIST COLUMN */}
                <div className="md:col-span-2 space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((r) => {
                      const displayName = r.reviewer_name
                        ? r.reviewer_name.charAt(0).toUpperCase() + r.reviewer_name.slice(1)
                        : "Verified Buyer";
                      const initial = displayName.charAt(0).toUpperCase();
                      const dateStr = r.created_at
                        ? new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                        : "";
                      return (
                        <div
                          key={r.id}
                          className="rounded-2xl border border-slate-100 dark:border-[#333] bg-white dark:bg-[#0a0a0a] p-5 space-y-3 transition-colors duration-300"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-blue/10 dark:bg-white/10 text-brand-blue dark:text-white flex items-center justify-center text-xs font-black transition-colors duration-300">
                                {initial}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-gray-200 transition-colors duration-300">
                                  {displayName}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-gray-500 transition-colors duration-300">
                                  {dateStr}
                                </p>
                              </div>
                            </div>
                            <StarRow value={r.rating || 0} size={13} />
                          </div>
                          {r.review_text && (
                            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                              {r.review_text}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full min-h-[160px] flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-[#333] text-xs text-slate-400 dark:text-gray-500 transition-colors duration-300">
                      Reviews from customers will appear here.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

      </div>
    </div>
  );
}