"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Eye, ShoppingBag, Heart, Check } from "lucide-react";
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
  
  const [selectedVar, setSelectedVar] = useState<any>(
    product.product_variations?.[0] || null
  );

  const isOutOfStock = !selectedVar || selectedVar.stock <= 0;

  // Navigation Helper
  const goToProduct = () => {
    router.push(`/userinterface/product/${product.id}`);
  };

  const checkStatus = useCallback(async () => {
    if (!userId || !selectedVar) return;
    const { data: wish } = await supabase.from("wishlists").select("id").eq("user_id", userId).eq("product_id", product.id).maybeSingle();
    setIsWishlisted(!!wish);
    const { data: cartItem } = await supabase.from("cart").select("id").eq("user_id", userId).eq("variation_id", selectedVar?.id).maybeSingle();
    setIsInCart(!!cartItem);
  }, [userId, product.id, selectedVar?.id]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents navigating to product page
    if (!userId) { toast.error("Login required"); router.push("/userinterface/login"); return; }
    if (isInCart) { router.push("/userinterface/cart"); return; }
    if (isOutOfStock) return;

    const { error } = await supabase.from("cart").insert([{
      user_id: userId, product_id: product.id, variation_id: selectedVar.id, quantity: 1,
    }]);

    if (!error) {
      setIsInCart(true);
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents navigating to product page
    if (!userId) { toast.error("Login required"); return; }
    // Add your wishlist logic here
    setIsWishlisted(!isWishlisted);
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
        
        {/* ACTION OVERLAY ON IMAGE */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
           <button 
             onClick={handleWishlist} 
             className="p-1.5 bg-white rounded-full text-slate-900 shadow-lg scale-90 hover:scale-100 transition-transform"
           >
              <Heart size={14} fill={isWishlisted ? "black" : "none"} />
           </button>
           <button 
             onClick={handleAddToCart} 
             className="p-1.5 bg-black rounded-full text-white shadow-lg scale-90 hover:scale-100 transition-transform"
           >
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
            <span className="text-[13px] font-black text-slate-900 whitespace-nowrap">₹{selectedVar?.price}</span>
          </div>

          <p className="text-[10px] leading-tight text-slate-400 line-clamp-2 mt-1 h-[28px]">
            {product.description || "Premium quality curated for your unique style."}
          </p>
        </div>
        
        {/* MINIMAL SIZE SELECTOR */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
          {product.product_variations?.map((v: any) => (
            <button
              key={v.id}
              onClick={(e) => { 
                e.stopPropagation(); // Prevents navigating to product page
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

        {/* FOOTER ACTIONS */}
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