"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Eye, ShoppingBag, Heart, Check, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProductCardProps {
  product: any;
  userId: string | null;
}

export default function ProductCard({ product, userId }: ProductCardProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const [selectedVar, setSelectedVar] = useState<any>(
    product.product_variations?.[0] || null
  );

  // 1. Calculate discount for the badge
  const discountPercent = useMemo(() => {
    if (!selectedVar?.sale_price || selectedVar.sale_price >= selectedVar.price) return null;
    return Math.round(((selectedVar.price - selectedVar.sale_price) / selectedVar.price) * 100);
  }, [selectedVar]);

  const isOutOfStock = !selectedVar || selectedVar.stock <= 0;

  const goToProduct = () => {
    router.push(`/userinterface/product/${product.id}`);
  };

  // Check initial status for Heart and Cart
  const checkStatus = useCallback(async () => {
    if (!userId) return;
    
    // Check Wishlist
    const { data: wish } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", product.id)
      .maybeSingle();
    setIsWishlisted(!!wish);

    // Check Cart
    if (selectedVar) {
      const { data: cartItem } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", userId)
        .eq("variation_id", selectedVar?.id)
        .maybeSingle();
      setIsInCart(!!cartItem);
    }
  }, [userId, product.id, selectedVar?.id]);

  useEffect(() => { 
    checkStatus(); 
  }, [checkStatus]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) { 
      toast.error("Login required"); 
      router.push("/userinterface/login"); 
      return; 
    }
    if (isInCart) { 
      router.push("/userinterface/cart"); 
      return; 
    }
    if (isOutOfStock) return;

    const { error } = await supabase.from("cart").insert([{
      user_id: userId, 
      product_id: product.id, 
      variation_id: selectedVar.id, 
      quantity: 1,
    }]);

    if (!error) {
      setIsInCart(true);
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) { 
      toast.error("Please login to wishlist items"); 
      return; 
    }
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        // DELETE from wishlist
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", product.id);

        if (error) throw error;
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        // INSERT into wishlist
        const { error } = await supabase
          .from("wishlists")
          .insert([{ user_id: userId, product_id: product.id }]);

        if (error) throw error;
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div 
      onClick={goToProduct}
      className="group relative bg-white rounded-[1.5rem] p-2 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 w-full max-w-[400px] h-[140px] flex gap-4 overflow-hidden items-center cursor-pointer"
    >
      
      {/* 1. SQUARE IMAGE (LEFT SIDE) */}
      <div className="relative h-[120px] w-[120px] rounded-[1.2rem] overflow-hidden bg-slate-50 flex-shrink-0">
        <Image
          src={product.image || "/placeholder.png"}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? "grayscale opacity-40" : ""}`}
        />

        {/* DISCOUNT BADGE */}
        {discountPercent && !isOutOfStock && (
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 flex items-center gap-1">
            <Tag size={8} /> {discountPercent}% OFF
          </div>
        )}
        
        {/* ACTION OVERLAY */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
           <button 
             onClick={handleWishlist} 
             disabled={wishlistLoading}
             className="p-1.5 bg-white rounded-full shadow-lg scale-90 hover:scale-100 transition-transform disabled:opacity-50"
           >
              <Heart 
                size={14} 
                className={isWishlisted ? "text-red-500 fill-red-500" : "text-slate-900"} 
              />
           </button>
           <button onClick={handleAddToCart} className="p-1.5 bg-black rounded-full text-white shadow-lg scale-90 hover:scale-100 transition-transform">
              {isInCart ? <Check size={14} /> : <ShoppingBag size={14} />}
           </button>
        </div>
      </div>

      {/* 2. CONTENT (RIGHT SIDE) */}
      <div className="flex flex-col justify-between h-full py-1 pr-2 flex-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[13px] font-bold text-slate-900 line-clamp-1 tracking-tight">
              {product.name}
            </h3>

            <div className="flex flex-col items-end">
              {selectedVar?.sale_price && selectedVar.sale_price < selectedVar.price ? (
                <>
                  <span className="text-[13px] font-black text-orange-600 whitespace-nowrap">
                    ₹{selectedVar.sale_price}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 line-through -mt-1">
                    ₹{selectedVar.price}
                  </span>
                </>
              ) : (
                <span className="text-[13px] font-black text-slate-900 whitespace-nowrap">
                  ₹{selectedVar?.price}
                </span>
              )}
            </div>
          </div>

          <p className="text-[10px] leading-tight text-slate-400 line-clamp-2 mt-1 h-[28px]">
            {product.description || "Premium quality curated for your unique style."}
          </p>
        </div>
        
        {/* SIZE SELECTOR */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
          {product.product_variations?.map((v: any) => (
            <button
              key={v.id}
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedVar(v); 
              }}
              className={`text-[8px] font-black min-w-[28px] h-[22px] px-1 rounded-md border transition-all ${
                selectedVar?.id === v.id
                  ? "bg-black border-black text-white shadow-sm"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
              }`}
            >
              {v.attributes?.name || v.size?.name || v.unit_value || "S"}
            </button>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-black flex items-center gap-1.5 transition-colors">
              <Eye size={12} /> View Details
            </div>
            
            {isOutOfStock && (
              <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Out of Stock</span>
            )}
        </div>
      </div>
    </div>
  );
}