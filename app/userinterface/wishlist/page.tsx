"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Ghost,
  Plus,
  ArrowLeft
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    checkUser();
  }, []);

  const fetchWishlist = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("wishlists")
      .select(`
        id,
        product_id,
        products (
          id,
          name,
          product_variations (price, stock),
          product_images (image_url)
        )
      `)
      .eq("user_id", userId);

    if (data) {
      const formatted = data
        .filter((w: any) => w.products)
        .map((w: any) => ({
          id: w.id,
          product_id: w.product_id,
          name: w.products.name,
          price: w.products.product_variations?.[0]?.price || 0,
          stock: w.products.product_variations?.[0]?.stock || 0,
          image: w.products.product_images?.[0]?.image_url || "/placeholder.png",
        }));
      setWishlist(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchWishlist();
  }, [userId]);

  const addToCart = async (item: WishlistItem) => {
    if (item.stock === 0) return toast.error("Item out of stock");

    const { error } = await supabase.from("cart").insert({
      user_id: userId,
      product_id: item.product_id,
      variation_id: null,
      quantity: 1,
    });

    if (!error) {
      await supabase.from("wishlists").delete().eq("id", item.id);
      toast.success("Moved to cart", {
        style: { borderRadius: '0px', background: '#1e293b', color: '#fff', fontSize: '12px' }
      });
      fetchWishlist();
    }
  };

  const removeFromWishlist = async (id: number) => {
    const { error } = await supabase.from("wishlists").delete().eq("id", id);
    if (!error) {
      setWishlist(wishlist.filter(i => i.id !== id));
      toast.success("Removed from list");
    }
  };

  if (loading && userId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Collection</p>
      </div>
    );
  }

  if (!userId) return (
    <div className="h-screen flex flex-col items-center justify-center px-6 text-center">
      <Ghost size={60} className="text-slate-100 mb-6" />
      <h2 className="text-2xl font-black tracking-tighter mb-2">Private Collection.</h2>
      <p className="text-slate-400 text-sm max-w-[250px] mb-8 font-medium">Please sign in to view your curated wishlist items.</p>
      <Link href="/userinterface/login" className="bg-slate-900 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">
        Identify Yourself
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-orange-100">
      <Toaster position="bottom-right" />
      
      {/* Top Nav Breadcrumb */}
      <nav className="px-6 lg:px-12 py-8 flex justify-between items-center">
        <Link href="/userinterface/shop" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-colors">
          <ArrowLeft size={14} /> Back to Shop
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Vault / {wishlist.length}</span>
      </nav>

      <main className="px-6 lg:px-12 pb-24">
        {/* Header Section */}
        <header className="mb-20">
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.85] tracking-tighter ">
            Wish<span className="text-orange-600">list</span>
          </h1>
          <div className="h-1 w-20 bg-orange-600 mt-6 mb-4" />
          <p className="max-w-md text-slate-500 text-sm font-medium leading-relaxed">
            A curated selection of your most desired pieces. <br />
            Ready for their permanent home.
          </p>
        </header>

        {wishlist.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center border-t border-slate-200">
            <p className="text-slate-300 font-black  text-3xl">The vault is empty.</p>
            <Link href="/userinterface/shop" className="mt-6 text-orange-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
              Discover something new <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
        // Replace your mapping section with this refined version
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
  {wishlist.map((item) => (
    <article key={item.id} className="group relative bg-white border border-slate-100 p-2">
      
      {/* 1. Wrap Image in Link for Navigation */}
      <Link href={`/userinterface/product/${item.product_id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${item.stock === 0 ? 'grayscale opacity-50' : ''}`}
          />
          
          {/* Out of Stock Overlay */}
          {item.stock === 0 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white/90 py-1 text-center border-y border-slate-100 z-10">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sold Out</span>
            </div>
          )}
        </div>
      </Link>

      {/* Quick Remove (Z-index high to stay clickable over the Link) */}
      <button 
        onClick={() => removeFromWishlist(item.id)}
        className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-md text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <Trash2 size={12} />
      </button>

      {/* Floating Add Button */}
      {item.stock > 0 && (
        <button 
          onClick={() => addToCart(item)}
          className="absolute bottom-[4.5rem] right-3 p-2 bg-slate-900 text-white rounded-full shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20"
        >
          <ShoppingBag size={12} />
        </button>
      )}

      {/* Product Details - Compact */}
      <div className="mt-3 px-1">
        <Link href={`/userinterface/product/${item.product_id}`}>
          <h3 className="text-[11px] font-bold text-slate-800 truncate uppercase tracking-tight hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] font-black text-slate-500">₹{item.price}</p>
          {item.stock <= 5 && item.stock > 0 && (
            <span className="text-[8px] font-bold text-orange-600 uppercase tracking-tighter">
              Low Stock
            </span>
          )}
        </div>
      </div>
    </article>
  ))}
</div>
        )}
      </main>
    </div>
  );
}