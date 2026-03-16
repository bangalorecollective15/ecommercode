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

  // Check wishlist + cart status
  const checkStatus = useCallback(async () => {
    if (!userId) return;

    const { data: wish } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", product.id)
      .maybeSingle();

    setIsWishlisted(!!wish);

    const { data: cartItem } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", userId)
      .eq("variation_id", selectedVar?.id)
      .maybeSingle();

    setIsInCart(!!cartItem);

  }, [userId, product.id, selectedVar?.id]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Add to Cart
  const handleAddToCart = async () => {

    if (!userId) {
      toast.error("Please login first");
      router.push("/userinterface/login");
      return;
    }

    if (isInCart) {
      router.push("/userinterface/cart");
      return;
    }

    if (isOutOfStock) {
      toast.error("Item is out of stock");
      return;
    }

    const { error } = await supabase
      .from("cart")
      .insert([
        {
          user_id: userId,
          product_id: product.id,
          variation_id: selectedVar.id,
          quantity: 1,
        },
      ]);

    if (!error) {
      setIsInCart(true);
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  // Wishlist
  const handleWishlist = async () => {

    if (!userId) {
      toast.error("Please login first");
      router.push("/userinterface/login");
      return;
    }

    if (isWishlisted) {
      router.push("/userinterface/wishlist");
      return;
    }

    const { error } = await supabase
      .from("wishlists")
      .insert([
        {
          user_id: userId,
          product_id: product.id,
        },
      ]);

    if (!error) {
      setIsWishlisted(true);
      toast.success("Added to wishlist");
    }
  };

  return (
    <div className="group bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-50">

      {/* Product Image */}
      <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 bg-slate-100">

        <Image
          src={product.image || "/placeholder.png"}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-700 ${
            isOutOfStock ? "grayscale opacity-60" : ""
          }`}
        />

        {/* Cart + Wishlist */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-95 ${
              isInCart
                ? "bg-green-500 text-white"
                : "bg-white/90 text-slate-400 hover:text-orange-600"
            }`}
          >
            {isInCart ? <Check size={18} /> : <ShoppingBag size={18} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWishlist();
            }}
            className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-95 ${
              isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white/90 text-slate-400 hover:text-red-500"
            }`}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

        </div>

        {/* Stock Badge */}
        <div
          className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm backdrop-blur-md z-10 ${
            !isOutOfStock
              ? "bg-white/90 text-slate-900"
              : "bg-red-500 text-white"
          }`}
        >
          {!isOutOfStock
            ? `${selectedVar?.stock} In Stock`
            : "Sold Out"}
        </div>

      </div>

      {/* Variations */}
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

      {/* Product Info */}
      <div className="px-2">

        <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-1 tracking-tight">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-2">

          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
              Price
            </span>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              ₹{selectedVar?.price}
            </span>
          </div>

          <button
            onClick={() =>
              router.push(`/userinterface/product/${product.id}`)
            }
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-orange-600 hover:text-white transition-all"
          >
            <Eye size={18} />
          </button>

        </div>

      </div>

    </div>
  );
}