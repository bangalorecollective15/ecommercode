"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          product_variations (id, price, sale_price, stock), 
          product_images (image_url)
        )
      `)
      .eq("user_id", userId);

    if (data) {
      const formatted = data.filter((w: any) => w.products).map((w: any) => {
        const variant = w.products.product_variations?.[0];
        return {
          id: w.id,
          product_id: w.product_id,
          variation_id: variant?.id, // Needed for Add to Cart
          name: w.products.name,
          price: variant?.sale_price || variant?.price,
          originalPrice: variant?.price,
          stock: variant?.stock || 0,
          image: w.products.product_images?.[0]?.image_url || "/placeholder.png",
        };
      });
      setWishlist(formatted);
    }
    setLoading(false);
  };

  useEffect(() => { if (userId) fetchWishlist(); }, [userId]);

  const removeFromWishlist = async (id: number) => {
    const { error } = await supabase.from("wishlists").delete().eq("id", id);
    if (!error) {
      setWishlist(wishlist.filter(i => i.id !== id));
      toast.success("Removed from wishlist", {
        style: { fontSize: '12px', fontWeight: 'bold', borderRadius: '10px' }
      });
    }
  };

  if (loading && userId) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-brand-gold/20 overflow-x-hidden">
      <Toaster position="bottom-right" />
      
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-24 pb-20">
        
        {/* BREADCRUMB */}
        <div className="flex mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-md border border-white/80 rounded-full shadow-sm">
            <Sparkles size={10} className="text-brand-gold" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Personal Archive / {wishlist.length}
            </span>
          </div>
        </div>

        {!userId ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <ShieldCheck size={32} className="text-slate-200 mb-4" />
            <h2 className="text-xl font-bold tracking-tight mb-6">Please Sign In</h2>
            <Link href="/login" className="bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold transition-all">
                Identify
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-12">
              <h1 className="text-3xl font-black tracking-tight mb-1">
                WISHLIST<span className="text-brand-gold">.</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">Selected Items</p>
            </header>

            {wishlist.length === 0 ? (
                <EmptyState />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {wishlist.map((item) => (
                  <WishlistCard 
                    key={item.id} 
                    item={item} 
                    userId={userId}
                    onRemove={removeFromWishlist} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WishlistCard({ item, onRemove, userId }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const hasSale = item.price < item.originalPrice;

  const isVideo = item.image && (
    item.image.toLowerCase().endsWith('.mp4') || 
    item.image.toLowerCase().endsWith('.webm') || 
    item.image.toLowerCase().endsWith('.mov')
  );

  const handleAddToCart = async () => {
    if (!userId) return toast.error("Please login first");
    if (!item.variation_id) return toast.error("Product details missing");

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("cart")
        .insert([
          { 
            user_id: userId, 
            product_id: item.product_id, 
            variation_id: item.variation_id, 
            quantity: 1 
          }
        ]);

      if (error) throw error;

      toast.success("Added to Bag", {
      
        style: { fontSize: '12px', fontWeight: 'bold', borderRadius: '10px' }
      });
      
      // Trigger update for Navbar cart icon
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err: any) {
      toast.error("Failed to add to bag");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative">
      <div className="relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1">
        
        {/* Media */}
        <div className="relative aspect-square overflow-hidden m-2 rounded-xl bg-slate-50">
          {isVideo ? (
            <video 
              src={item.image} 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <Image 
              src={item.image} 
              alt={item.name} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
              unoptimized={true}
            />
          )}
          
          <div className="absolute top-2 right-2 z-20">
            <button 
              onClick={() => onRemove(item.id)}
              className="p-2 bg-white/90 backdrop-blur-md text-slate-400 hover:text-red-500 rounded-lg border border-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {hasSale && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-gold text-white text-[8px] font-bold uppercase tracking-tighter rounded-md z-10">
              Sale
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-3 pb-3 pt-1">
          <div className="mb-3">
            <h3 className="text-[11px] font-bold truncate text-slate-800 mb-0.5">{item.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black text-slate-900">₹{item.price.toLocaleString()}</span>
              {hasSale && <span className="text-[10px] font-medium text-slate-300 line-through">₹{item.originalPrice.toLocaleString()}</span>}
            </div>
          </div>

          <div className="flex gap-1.5">
            <button 
              onClick={handleAddToCart}
              disabled={item.stock === 0 || isAdding}
              className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2
                ${item.stock > 0 
                  ? 'bg-slate-900 text-white hover:bg-brand-gold' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              {isAdding ? (
                 <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag size={12} />
                  {item.stock > 0 ? "Add" : "OOS"}
                </>
              )}
            </button>
            <Link href={`/product/${item.product_id}`} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 border border-slate-100 transition-colors">
                <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="w-8 h-8 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-white/60 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-6 border border-white">
        <Zap size={20} className="text-slate-200" />
      </div>
      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.2em] mb-6">Empty Collection</p>
      <Link href="/Gproducts" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-900">
        Browse <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}