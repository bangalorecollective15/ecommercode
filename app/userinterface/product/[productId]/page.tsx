"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { 
  ShoppingBag, Heart, Truck, 
  ArrowLeft, ShieldCheck, Tag, ChevronRight, Minus, Plus, CreditCard
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


  const checkWishlistStatus = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (data) {
      setIsWishlisted(true);
      setWishlistId(data.id);
    }
  }, [productId]);

useEffect(() => {
  if (!productId) return;

  const fetchFullData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // ✅ PRODUCT
    const { data: prod } = await supabase
      .from("products")
      .select(`*, brands(name_en, image_url), categories(id, name), subcategories(id, name)`)
      .eq("id", productId)
      .single();

    if (!prod) {
      setLoading(false);
      return;
    }

    // ✅ VARIATIONS + IMAGES
    const [varRes, imgRes, reviewRes] = await Promise.all([
      supabase.from("product_variations")
        .select(`*, color:color_id(name), size:size_id(name)`)
        .eq("product_id", productId),

      supabase.from("product_images")
        .select("*")
        .eq("product_id", productId),

      // ✅ REVIEWS
      supabase.from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
    ]);

    // ✅ SIMILAR PRODUCTS (needs prod)
// ✅ Find this section in your useEffect
const { data: similarRaw } = await supabase
  .from("products")
  .select(`
    *,
    brands (name_en),
    categories (name),
    product_images (image_url),
    product_variations (
      *, 
      size:size_id(name) 
    )
  `) // Added size:size_id(name) here
  .eq("category_id", prod.category_id)
  .eq("subcategory_id", prod.subcategory_id)
  .neq("id", prod.id)
  .limit(8);

    // ✅ SET STATE
    setProduct(prod);
    setVariations(varRes.data || []);
    setImages(imgRes.data || []);
    setReviews(reviewRes.data || []);
const formattedSimilar = similarRaw?.map((p: any) => {
  // Extract unique size names
  const availableSizes = p.product_variations
    ? [...new Set(p.product_variations.map((v: any) => v.size?.name).filter(Boolean))]
    : [];

  return {
    ...p,
    price: p.product_variations?.[0]?.price || 0,
    image: p.product_images?.[0]?.image_url || "/placeholder.png",
    sizes: availableSizes, 
    brand: p.brands?.name_en || "Exclusive"
  };
}) || [];

setSimilarProducts(formattedSimilar);
    setMainImage(imgRes.data?.[0]?.image_url || "/placeholder.png");
    setSelectedVar(varRes.data?.[0] || null);

    if (user) await checkWishlistStatus(user.id);

    setLoading(false);
  };

  fetchFullData();
}, [productId, checkWishlistStatus]);

  const submitReview = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return toast.error("Login required");

  const { error } = await supabase.from("reviews").insert([{
    product_id: productId,
    user_id: user.id,
    rating,
    review_text: reviewText
  }]);

  if (!error) {
    toast.success("Review added!");
    setReviewText("");
  }
};




  const toggleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please login to use Wishlist");

    if (isWishlisted && wishlistId) {
      const { error } = await supabase.from("wishlists").delete().eq("id", wishlistId);
      if (!error) {
        setIsWishlisted(false);
        setWishlistId(null);
        toast.success("Removed from Wishlist");
      }
    } else {
      const { data, error } = await supabase.from("wishlists").insert([{ user_id: user.id, product_id: productId }]).select().single();
      if (!error) {
        setIsWishlisted(true);
        setWishlistId(data.id);
        toast.success("Added to Wishlist");
      }
    }
  };

  const handleCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please login to add to bag");
    
    const { error } = await supabase.from("cart").insert([{
      user_id: user.id, product_id: product?.id, variation_id: selectedVar?.id, quantity
    }]);

    if (!error) {
      toast.success(`${product.name} added to bag!`);
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  /**
   * BUY NOW HANDLER
   * Redirects directly to checkout with query params
   */
 const handleBuyNow = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return toast.error("Please login to purchase");
  if (!selectedVar) return toast.error("Please select a variation");

  // selectedVar.id is the unique ID for the specific size/color/price
  const checkoutUrl = `/userinterface/checkout?productId=${product.id}&variationId=${selectedVar.id}&qty=${quantity}`;
  router.push(checkoutUrl);
};
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] bg-[radial-gradient(at_top_right,_#e2e8f0,_#f1f5f9,_#ffffff)] pb-20 antialiased text-slate-900">
      <Toaster position="bottom-center" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-40">
        {/* Main Glass Container */}
        <div className="bg-white/30 backdrop-blur-3xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.06)] rounded-[56px] p-4 lg:p-10">
          
          <button 
            onClick={() => router.back()} 
            className="mb-8 flex items-center gap-2 px-5 py-2.5 bg-white/40 backdrop-blur-md hover:bg-white/60 rounded-full text-[10px] font-black uppercase tracking-[0.1em] text-slate-800 transition-all border border-white/50 shadow-sm"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
            
            {/* LEFT: Image Gallery */}
            <div className="space-y-6 lg:sticky lg:top-10">
              <div className="aspect-[4/5] relative bg-gradient-to-tr from-white/80 to-white/20 backdrop-blur-xl rounded-[40px] overflow-hidden border border-white shadow-xl group">
                <Image 
                  src={mainImage} 
                  alt={product.name} 
                  fill 
                  className="object-contain p-10 transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
                
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button 
                    onClick={toggleWishlist} 
                    className="p-3.5 bg-white/60 backdrop-blur-2xl rounded-full border border-white/80 shadow-lg transition-all hover:scale-110 active:scale-95"
                  >
                    <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : "text-slate-700"} />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto py-2 no-scrollbar justify-center">
                {images.map((img) => (
                  <button 
                    key={img.id}
                    onClick={() => setMainImage(img.image_url)}
                    className={`min-w-[80px] h-20 relative rounded-2xl overflow-hidden border-2 transition-all ${mainImage === img.image_url ? "border-slate-900 scale-105 bg-white" : "border-transparent opacity-40 hover:opacity-100"}`}
                  >
                    <Image src={img.image_url} alt="thumb" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Product Details */}
            <div className="flex flex-col py-4">
              <div className="space-y-8">
                <div className="space-y-4">
                  <nav className="inline-flex items-center gap-2 px-3 py-1 bg-black backdrop-blur-lg rounded-full border border-blue-200/50 text-[10px] font-black uppercase tracking-widest text-white">
                    {product.categories?.name} <ChevronRight size={10} /> {product.subcategories?.name}
                  </nav>

                  <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <span className="text-slate-900 underline underline-offset-4 decoration-blue-500">{product.brands?.name_en}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-300" />
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Tag size={14} /> {product.sku || "NOIR-SS24"}
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 border-y border-slate-200/40 py-8">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">₹{selectedVar?.price}</span>
                  <span className="text-2xl text-slate-300 line-through font-bold">₹{Number(selectedVar?.price) + 499}</span>
                </div>

                {/* Variation Selection */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personalize Your Selection</p>
                  <div className="grid grid-cols-2 gap-3">
                    {variations.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVar(v)}
                        className={`p-5 rounded-[28px] border-2 transition-all text-left relative overflow-hidden group ${
                          selectedVar?.id === v.id 
                          ? "bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]" 
                          : "bg-white/40 backdrop-blur-md border-white/60 text-slate-700 hover:bg-white/80"
                        }`}
                      >
                        <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${selectedVar?.id === v.id ? "text-blue-400" : "text-slate-400"}`}>
                          {v.color?.name || 'Exclusive'}
                        </span>
                        <span className="text-sm font-black">Size {v.size?.name || 'OS'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Controls */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-white/50 backdrop-blur-xl border border-white/80 rounded-[32px] px-6 py-4 shadow-sm">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-blue-600 transition-colors"><Minus size={18} /></button>
                      <span className="w-12 text-center text-xl font-black">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-blue-600 transition-colors"><Plus size={18} /></button>
                    </div>
                    
                    {/* Add to Bag Button */}
                    <button 
                      onClick={handleCart}
                      disabled={!selectedVar || selectedVar.stock <= 0}
                      className="flex-1 bg-white border-2 border-slate-900 text-slate-900 rounded-[32px] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-50 transition-all active:scale-95 disabled:border-slate-200 disabled:text-slate-300"
                    >
                      <ShoppingBag size={18} /> Add to Bag
                    </button>
                  </div>

                  {/* Buy Now Button */}
                  <button 
                    onClick={handleBuyNow}
                    disabled={!selectedVar || selectedVar.stock <= 0}
                    className="w-full bg-slate-900 text-white rounded-[32px] py-6 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:shadow-slate-400 transition-all active:scale-[0.98] disabled:bg-slate-200"
                  >
                    <CreditCard size={20} /> Buy Now
                  </button>
                </div>

                {/* Luxury Badges */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-5 rounded-[32px] bg-white/20 backdrop-blur-lg border border-white/40 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm"><Truck size={18} /></div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">Express<br/><span className="text-slate-900">Delivery</span></p>
                  </div>
                  <div className="p-5 rounded-[32px] bg-white/20 backdrop-blur-lg border border-white/40 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm"><ShieldCheck size={18} /></div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">Verified<br/><span className="text-slate-900">Original</span></p>
                  </div>
                </div>

                {/* Description Pane */}
                <div className="bg-slate-900/5 backdrop-blur-md p-8 rounded-[40px] border border-white/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><ShoppingBag size={80} /></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Designer Notes</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {product.description || "Synthesizing architectural lines with radical comfort. This piece features a refined texture and engineered fit, serving as a cornerstone for the contemporary wardrobe."}
                  </p>
                </div>
    <div className="mt-2 space-y-12 border-t border-slate-200/60 pt-6">
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
        Community <span className="text-slate-900">Reviews</span>
      </h3>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
        {reviews.length} Verified Opinions
      </p>
    </div>
  </div>

  {/* Add Review Section */}
  <div className="bg-white/60 backdrop-blur-2xl border border-white p-8 rounded-[40px] shadow-sm space-y-6">
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share Your Experience</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Heart 
              size={24} 
              className={`${rating >= star ? "fill-yellow-500 text-yellow-500" : "text-slate-300"} transition-colors`} 
            />
          </button>
        ))}
      </div>
    </div>

    <textarea
      value={reviewText}
      onChange={(e) => setReviewText(e.target.value)}
      placeholder="How does it feel? Describe the fit, material, and style..."
      className="w-full bg-white/50 border border-slate-200 rounded-[24px] p-5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[120px] placeholder:text-slate-300"
    />

    <button 
      onClick={submitReview} 
      className="bg-slate-900 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
    >
      Publish Review
    </button>
  </div>

  {/* Review List */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {reviews.length > 0 ? (
      reviews.map((r) => (
        <div 
          key={r.id} 
          className="group p-8 rounded-[32px] bg-white/30 border border-white/60 hover:bg-white/50 transition-all duration-500 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart 
                  key={i} 
                  size={12} 
                  className={i < r.rating ? "fill-slate-900 text-slate-900" : "text-slate-200"} 
                />
              ))}
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4 italic">
            "{r.review_text}"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
              U
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Verified Buyer
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
        <p className="text-slate-300 text-xs font-black uppercase tracking-widest">No reviews yet. Be the first to trend.</p>
      </div>
    )}
  </div>
</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
  <h2 className="text-3xl font-bold mb-6">You may also like</h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  {similarProducts.map((p) => (
  <ProductCard key={p.id} product={p} />
))}
  </div>
</div>
      </div>
    </div>
  );
}