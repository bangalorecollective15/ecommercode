"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Eye, ShoppingBag, Heart, Tag, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  
  // Variation state
  const [selectedVar, setSelectedVar] = useState<any>(product.product_variations?.[0] || null);
  const isOutOfStock = !selectedVar || selectedVar.stock <= 0;

  // --- PERSISTENCE LOGIC ---
  // This function checks the DB to see if the item is already added
  const checkStatus = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return;

    // 1. Check Wishlist
    const { data: wish } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("product_id", product.id)
      .maybeSingle();
    setIsWishlisted(!!wish);

    // 2. Check Cart (specifically for this variation)
    const { data: cartItem } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("variation_id", selectedVar?.id)
      .maybeSingle();
    setIsInCart(!!cartItem);
  }, [product.id, selectedVar?.id]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        checkStatus(user.id);
      }
    };
    initAuth();
  }, [checkStatus]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login first");
      return router.push("/userinterface/login");
    }

    // STAY & NAVIGATE: If already in cart, go to cart page
    if (isInCart) {
      return router.push("/userinterface/cart");
    }

    if (isOutOfStock) return toast.error("Item is out of stock");

    const { error } = await supabase.from("cart").insert([{
      user_id: user.id,
      product_id: product.id,
      variation_id: selectedVar.id,
      quantity: 1,
    }]);

    if (!error) {
      setIsInCart(true); // Icon changes to Tick immediately
      toast.success("Added to collection");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error("Please login first");
      return router.push("/userinterface/login");
    }

    // STAY & NAVIGATE: If already wishlisted, go to wishlist page
    if (isWishlisted) {
      return router.push("/userinterface/wishlist");
    }

    const { error } = await supabase.from("wishlists").insert([{ 
      user_id: user.id, 
      product_id: product.id 
    }]);

    if (!error) {
      setIsWishlisted(true); // Heart stays filled
      toast.success("Added to wishlist");
    }
  };

  return (
    <div className="group bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-50">
      
      {/* Image Container */}
      <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 bg-slate-100">
        <Image
          src={product.image || "/placeholder.png"}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-700 ${isOutOfStock ? "grayscale opacity-60" : ""}`}
        />

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {/* Cart Button: Becomes a Green/Orange Tick if in cart */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-95 ${
              isInCart 
                ? "bg-green-500 text-white" 
                : "bg-white/90 text-slate-400 hover:text-orange-600"
            }`}
          >
            {isInCart ? <Check size={18} /> : <ShoppingBag size={18} />}
          </button>

          {/* Wishlist Button: Stays Red if wishlisted */}
          <button
            onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
            className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-95 ${
              isWishlisted 
                ? "bg-red-500 text-white" 
                : "bg-white/90 text-slate-400 hover:text-red-500"
            }`}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm backdrop-blur-md z-10 ${
            !isOutOfStock ? "bg-white/90 text-slate-900" : "bg-red-500 text-white"
        }`}>
          {!isOutOfStock ? `${selectedVar?.stock} In Stock` : "Sold Out"}
        </div>
      </div>

      {/* Variation Selectors: Ensure these stay clickable to change current view */}
      <div className="flex flex-wrap gap-2 mb-3 px-2">
        {product.product_variations?.map((v: any) => (
          <button
            key={v.id}
            onClick={() => setSelectedVar(v)}
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
              selectedVar?.id === v.id 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
            }`}
          >
            {v.unit_value} {v.unit_type}
          </button>
        ))}
      </div>

      <div className="px-2">
        <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-1  tracking-tight">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Price</span>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              ₹{selectedVar?.price}
            </span>
          </div>

          <button
            onClick={() => router.push(`/userinterface/product/${product.id}`)}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-orange-600 hover:text-white transition-all"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}