"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ShoppingBag, Heart, Truck, ArrowLeft, ShieldCheck,
  Tag, Minus, Plus, CreditCard, Sparkles, Star
} from "lucide-react";
import ProductCard from "../../components/ProductCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId;

  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [selectedVar, setSelectedVar] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const checkWishlistStatus = useCallback(async (uId: string) => {
    const { data } = await supabase.from("wishlists").select("id").eq("user_id", uId).eq("product_id", productId).single();
    if (data) { setIsWishlisted(true); setWishlistId(data.id); }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    const fetchFullData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); await checkWishlistStatus(user.id); }

      const { data: prod } = await supabase
        .from("products")
        .select(`*, brands(name_en, image_url), categories(id, name), subcategories(id, name)`)
        .eq("id", productId).single();

      if (!prod) { setLoading(false); return; }

      const [varRes, imgRes, reviewRes, similarRaw] = await Promise.all([
        supabase.from("product_variations").select(`*, color:color_id(name), size:size_id(name)`).eq("product_id", productId),
        supabase.from("product_images").select("*").eq("product_id", productId),
        supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }),
        supabase.from("products").select(`*, brands (name_en), categories (name), product_images (image_url), product_variations (*, size:size_id(name))`)
          .eq("category_id", prod.category_id).neq("id", prod.id).limit(4)
      ]);

      setProduct(prod);
      setVariations(varRes.data || []);
      setImages(imgRes.data || []);
      setReviews(reviewRes.data || []);
      setSimilarProducts(similarRaw.data?.map((p: any) => ({
        ...p,
        price: p.product_variations?.[0]?.price || 0,
        image: p.product_images?.[0]?.image_url || "/placeholder.png",
        brand: p.brands?.name_en || "Exclusive"
      })) || []);
      setMainImage(imgRes.data?.[0]?.image_url || "/placeholder.png");
      setSelectedVar(varRes.data?.[0] || null);
      setLoading(false);
    };
    fetchFullData();
  }, [productId, checkWishlistStatus]);

  const submitReview = async () => {
    if (!userId) return toast.error("Login required");
    if (!reviewText.trim()) return toast.error("Please write something");

    const { error } = await supabase.from("reviews").insert([{
      product_id: productId, user_id: userId, rating, review_text: reviewText
    }]);

    if (!error) {
      toast.success("Review added!");
      setReviewText("");
      // Refresh local reviews
      const { data } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
      setReviews(data || []);
    }
  };

  const toggleWishlist = async () => {
    if (!userId) return toast.error("Please login");
    if (isWishlisted) {
      await supabase.from("wishlists").delete().eq("id", wishlistId);
      setIsWishlisted(false);
      toast.success("Removed");
    } else {
      const { data } = await supabase.from("wishlists").insert([{ user_id: userId, product_id: productId }]).select().single();
      setIsWishlisted(true); setWishlistId(data.id);
      toast.success("Saved to wishlist");
    }
  };

  const handleCart = async () => {
    if (!userId) return toast.error("Login required");
    const { error } = await supabase.from("cart").insert([{ user_id: userId, product_id: product?.id, variation_id: selectedVar?.id, quantity }]);
    if (!error) { toast.success("Added to bag"); window.dispatchEvent(new Event("cartUpdated")); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 selection:bg-brand-gold/20">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* BREADCRUMB & BACK */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-100 transition-all">
            <ArrowLeft size={18} />
          </button>
          <nav className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex gap-2">
            <span>Shop</span> / <span>{product.categories?.name}</span> / <span className="text-brand-blue">{product.name}</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          {/* LEFT: VISUALS (Reduced Height) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Changed from aspect-[4/5] to aspect-square or aspect-video for less height */}
            <div className="relative aspect-square md:aspect-[4/3] w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm group">

              {mainImage && (mainImage.toLowerCase().endsWith('.mp4') ||
                mainImage.toLowerCase().endsWith('.webm') ||
                mainImage.toLowerCase().endsWith('.mov')) ? (
                <video
                  src={mainImage}
                  className="w-full h-full object-contain p-4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={mainImage || "/placeholder.png"}
                  alt="Product"
                  fill
                  className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                  priority
                  unoptimized={true}
                />
              )}

              <button onClick={toggleWishlist} className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur shadow-sm rounded-full hover:scale-110 transition-transform z-10">
                <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400"} />
              </button>
            </div>

            {/* THUMBNAILS (Smaller thumbnails) */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img) => {
                const isThumbVideo = img.image_url.toLowerCase().endsWith('.mp4') ||
                  img.image_url.toLowerCase().endsWith('.webm') ||
                  img.image_url.toLowerCase().endsWith('.mov');

                return (
                  <button
                    key={img.id}
                    onClick={() => setMainImage(img.image_url)}
                    /* Reduced width/height from w-20 h-24 to w-16 h-16 */
                    className={`relative w-16 h-16 flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden ${mainImage === img.image_url ? "border-brand-blue" : "border-transparent opacity-60"
                      }`}
                  >
                    {isThumbVideo ? (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <video src={img.image_url} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <Sparkles size={10} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <Image src={img.image_url} alt="thumb" fill className="object-cover" unoptimized={true} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: INFO (Compact spacing) */}
          <div className="lg:col-span-4 space-y-5">

            <div className="space-y-2">

              <p className="text-brand-gold font-black text-[10px] uppercase tracking-[0.2em]">{product.brands?.name_en}</p>

              <h1 className="text-4xl font-bold tracking-tight text-brand-blue leading-tight">{product.name}</h1>

              <div className="flex items-center gap-3 text-slate-400 text-xs italic">

                <Tag size={12} /> SKU: {product.sku || "N/A"}

              </div>

            </div>



            <div className="flex items-baseline gap-3">

              <span className="text-4xl font-black">₹{selectedVar?.sale_price || selectedVar?.price}</span>

              {selectedVar?.sale_price < selectedVar?.price && (

                <span className="text-lg text-slate-300 line-through">₹{selectedVar.price}</span>

              )}

            </div>



            <div className="space-y-3">

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Variation</h4>

              <div className="flex flex-wrap gap-2">

                {variations.map((v) => (

                  <button key={v.id} onClick={() => setSelectedVar(v)} className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${selectedVar?.id === v.id ? "border-brand-blue bg-brand-blue text-white shadow-md" : "border-slate-100 hover:border-brand-gold/30"}`}>

                    {v.color?.name} / {v.size?.name}

                  </button>

                ))}

              </div>

            </div>



            <div className="flex gap-3">

              <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">

                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></button>

                <span className="w-8 text-center font-bold text-sm">{quantity}</span>

                <button onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></button>

              </div>

              <button onClick={handleCart} className="flex-1 bg-white border-2 border-brand-blue text-brand-blue rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all">

                Add to Bag

              </button>

            </div>



            <button onClick={() => router.push(`/checkout?productId=${product.id}`)} className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 hover:opacity-90 transition-all flex items-center justify-center gap-2">

              <CreditCard size={16} /> Checkout Now

            </button>



            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">

              <div className="flex items-center gap-3">

                <div className="p-2 bg-slate-50 rounded-lg text-brand-gold"><Truck size={16} /></div>

                <span className="text-[10px] font-bold uppercase text-slate-500">Free Shipping</span>

              </div>

              <div className="flex items-center gap-3">

                <div className="p-2 bg-slate-50 rounded-lg text-brand-gold"><ShieldCheck size={16} /></div>

                <span className="text-[10px] font-bold uppercase text-slate-500">Certified</span>

              </div>

            </div>



            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">

              {product.description || "Premium quality craftsmanship ensuring longevity and timeless style."}

            </p>

          </div>
        </div>

        {/* BOTTOM SECTION: REVIEWS & SIMILAR */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* REVIEWS COLUMN */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Reviews <span className="text-slate-300 text-sm font-normal">({reviews.length})</span>
            </h3>

            {/* COMPACT REVIEW FORM */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Share your thoughts</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}>
                      <Star size={14} className={rating >= star ? "fill-brand-gold text-brand-gold" : "text-slate-300"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Review content..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-brand-blue/20 min-h-[60px] resize-none"
                />
                <button
                  onClick={submitReview}
                  className="bg-brand-blue text-white px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-blue/90 transition-all"
                >
                  Post
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-slate-200"} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">"{r.review_text}"</p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center py-4">No reviews yet.</p>
              )}
            </div>
          </section>

          {/* SIMILAR PRODUCTS COLUMN */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold">Related Pieces</h3>
            <div className="grid grid-cols-2 gap-4">
              {similarProducts.slice(0, 2).map((p) => (
                <ProductCard key={p.id} product={p} userId={userId} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}