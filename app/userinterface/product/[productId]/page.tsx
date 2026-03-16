"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Truck, 
  Award, 
  ArrowLeft 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interfaces
interface ProductVariation {
  id: number;
  unit_type: string | null;
  unit_value: string | null;
  price: number;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  ingredients: string | null;
  pack_of: string | null;
  max_shelf_life: string | null;
  has_variation: boolean;
  brands: { name_en: string; image_url: string } | null;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "specifications">("description");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  const fixUrl = (url?: string) => url || "/default.png";

  useEffect(() => {
    if (!productId) return;

    async function fetchFullData() {
      setLoading(true);
      
      const { data: prodData } = await supabase
        .from("products")
        .select(`*, brands(name_en, image_url)`)
        .eq("id", productId)
        .single();

      if (!prodData) return setLoading(false);

      const [varRes, imgRes, revRes] = await Promise.all([
        supabase.from("product_variations").select("*").eq("product_id", productId),
        supabase.from("product_images").select("*").eq("product_id", productId),
        supabase.from("product_reviews").select("*").eq("product_id", productId)
      ]);

      setProduct(prodData);
      setVariations(varRes.data || []);
      setImages(imgRes.data || []);
      setReviews(revRes.data || []);
      setMainImage(fixUrl(imgRes.data?.[0]?.image_url));
      setSelectedVariation(varRes.data?.[0] || null);

      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        const { data: wish } = await supabase
          .from("wishlists")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", auth.user.id)
          .single();
        setIsWishlisted(!!wish);
      }
      setLoading(false);
    }
    fetchFullData();
  }, [productId]);

  async function toggleWishlist() {
    if (!user) return toast.error("Please login to wishlist items");

    if (isWishlisted) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (!error) {
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      }
    } else {
      const { error } = await supabase
        .from("wishlists")
        .insert([{ user_id: user.id, product_id: productId }]);
      if (!error) {
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    }
  }

  async function handleCart() {
    if (!user) return toast.error("Please login to continue");
    if (!selectedVariation) return toast.error("Please select a variation");

    const { error } = await supabase.from("cart").insert([{
      user_id: user.id,
      product_id: product?.id,
      variation_id: selectedVariation?.id,
      quantity
    }]);

    if (!error) {
      toast.success(`${product?.name} added to collection`);
    } else {
      toast.error("Failed to add to cart");
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest animate-pulse">Designing Experience...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product Not Found</div>;

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="bottom-center" />
      
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Images */}
        <div className="lg:w-1/2 lg:sticky lg:top-0 h-[60vh] lg:h-screen bg-slate-50 relative">
          <button onClick={() => window.history.back()} className="absolute top-8 left-8 z-20 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <Image src={mainImage} alt="Product" fill className="object-contain p-12" priority />
          </div>

          <div className="absolute bottom-8 left-8 right-8 flex gap-3 overflow-x-auto no-scrollbar">
            {images.map((img) => (
              <button 
                key={img.id}
                onClick={() => setMainImage(fixUrl(img.image_url))}
                className={`w-16 h-16 rounded-xl border-2 transition-all ${mainImage === fixUrl(img.image_url) ? "border-slate-900" : "border-transparent opacity-50"}`}
              >
                <Image src={fixUrl(img.image_url)} alt="thumb" width={64} height={64} className="w-full h-full object-cover rounded-lg" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center">
          <div className="max-w-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                {product.brands?.name_en || "Artisan Brand"}
              </span>
              <button onClick={toggleWishlist} className={`p-2 transition-transform active:scale-125 ${isWishlisted ? "text-red-500" : "text-slate-300 hover:text-slate-900"}`}>
                <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] ">
              {product.name}
            </h1>

            <div className="flex items-center gap-6 py-4 border-y border-slate-100">
              <div className="flex items-center gap-1 text-slate-900 font-black text-lg">
                <Star size={16} fill="currentColor" /> {reviews.length > 0 ? (reviews.reduce((a,b) => a+b.rating, 0)/reviews.length).toFixed(1) : "5.0"}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sku}</div>
            </div>

            <div className="space-y-8 pt-4">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-slate-900">₹{selectedVariation?.price}</span>
                <span className="text-slate-300 line-through text-lg">₹{Number(selectedVariation?.price || 0) + 120}</span>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Variation</p>
                <div className="flex flex-wrap gap-2">
                  {variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={`px-6 py-4 rounded-2xl border-2 transition-all ${selectedVariation?.id === v.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 hover:border-slate-200"}`}
                    >
                      <span className="block text-xs font-black">{v.unit_type}</span>
                      <span className="text-[10px] opacity-60">{v.unit_value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center bg-slate-50 rounded-2xl px-4 border border-slate-100">
                  <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="p-2 font-bold">−</button>
                  <span className="w-8 text-center font-black">{quantity}</span>
                  <button onClick={() => setQuantity(q => q+1)} className="p-2 font-bold">+</button>
                </div>
                
                <button onClick={handleCart} className="flex-1 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl active:scale-95">
                  <ShoppingBag size={18} /> Add to Collection
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="pt-12 space-y-8">
              <div className="flex gap-8 border-b border-slate-50">
                {["description", "specifications"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-300"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="text-slate-500 text-sm leading-relaxed">
                {activeTab === "description" ? product.description : (
                  <div className="grid grid-cols-2 gap-4">
                    <div><h4 className="text-[9px] font-black uppercase text-slate-300">Shelf Life</h4><p className="font-bold text-slate-900">{product.max_shelf_life}</p></div>
                    <div><h4 className="text-[9px] font-black uppercase text-slate-300">Pack Size</h4><p className="font-bold text-slate-900">{product.pack_of}</p></div>
                    <div className="col-span-2"><h4 className="text-[9px] font-black uppercase text-slate-300">Ingredients</h4><p className="font-bold text-slate-900">{product.ingredients}</p></div>
                  </div>
                )}
              </div>
            </div>

            {/* Perks */}
            <div className="pt-12 grid gap-4">
              <div className="flex items-center gap-4 bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                <Award size={20} className="text-orange-600" />
                <div><h4 className="text-xs font-black uppercase text-slate-900">Quality Guaranteed</h4><p className="text-[10px] text-slate-400">Directly from certified vendors.</p></div>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <Truck size={20} className="text-slate-900" />
                <div><h4 className="text-xs font-black uppercase text-slate-900">Express Delivery</h4><p className="text-[10px] text-slate-400">Dispatched within 24 hours.</p></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}