"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Eye, ShoppingBag, Heart, Check, Tag, Play, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductCard({ product, userId }: { product: any, userId: string | null }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVar, setSelectedVar] = useState<any>(product.product_variations?.[0] || null);

  const isVideo = useMemo(() => {
    return product.image?.match(/\.(mp4|webm|ogg|mov)$/i);
  }, [product.image]);

  const isOutOfStock = !selectedVar || selectedVar.stock <= 0;

  // Check if item is already in cart/wishlist on mount
  const checkStatus = useCallback(async () => {
    if (!userId || !product.id) return;

    try {
      const [wishRes, cartRes] = await Promise.all([
        supabase.from("wishlists").select("id").eq("user_id", userId).eq("product_id", product.id).maybeSingle(),
        selectedVar ? supabase.from("cart").select("id").eq("user_id", userId).eq("variation_id", selectedVar.id).maybeSingle() : Promise.resolve({ data: null })
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return toast.error("Please login first");
    if (isInCart) return router.push("/userinterface/cart");
    if (isOutOfStock) return toast.error("Out of stock");

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
      window.dispatchEvent(new Event("cartUpdated")); // Refresh navbar count
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return toast.error("Please login first");

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

  return (
    <div 
      onClick={() => router.push(`/userinterface/product/${product.id}`)}
      className="group relative bg-white rounded-[1.5rem] p-3 border border-slate-100 hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
    >
      <div className="relative aspect-square w-full rounded-[1.1rem] overflow-hidden bg-slate-50">
        {isVideo ? (
          <video
            ref={videoRef}
            src={product.image}
            className={`w-full h-full object-cover ${isOutOfStock ? "grayscale opacity-40" : ""}`}
            muted playsInline loop
            onMouseEnter={() => videoRef.current?.play()}
            onMouseLeave={() => { videoRef.current?.pause(); videoRef.current!.currentTime = 0; }}
          />
        ) : (
          <Image
            src={product.image || "/placeholder.png"}
            alt={product.name}
            fill
            className={`object-cover transition-transform group-hover:scale-110 ${isOutOfStock ? "grayscale opacity-40" : ""}`}
            unoptimized
          />
        )}

        {/* Buttons Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button 
            onClick={handleWishlist}
            className="p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Heart size={18} className={isWishlisted ? "text-red-500 fill-red-500" : "text-brand-blue"} />}
          </button>
          <button 
            onClick={handleAddToCart}
            className={`p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform ${isInCart ? "bg-brand-gold" : "bg-brand-blue"}`}
          >
            {isInCart ? <Check size={18} /> : <ShoppingBag size={18} />}
          </button>
        </div>
      </div>

      <div className="pt-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-black text-brand-blue uppercase truncate">{product.name}</h3>
          <span className="text-sm font-black text-brand-blue">₹{selectedVar?.sale_price || selectedVar?.price}</span>
        </div>
        
        <p className="text-[10px] text-slate-400 line-clamp-2 mb-4">{product.description}</p>

        {product.product_variations?.length > 1 && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4">
            {product.product_variations.map((v: any) => (
              <button
                key={v.id}
                onClick={(e) => { e.stopPropagation(); setSelectedVar(v); }}
                className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all ${selectedVar?.id === v.id ? "bg-brand-blue text-white" : "bg-white text-slate-400"}`}
              >
                {v.attributes?.name || v.size?.name || "VAR"}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto border-t pt-3 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-brand-gold flex items-center gap-1">
            <Eye size={12} /> Details
          </span>
          {isOutOfStock && <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-full">SOLD OUT</span>}
        </div>
      </div>
    </div>
  );
}