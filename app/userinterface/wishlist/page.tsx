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
  ArrowLeft,
  Heart,
  User
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
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '12px' }
      });
      fetchWishlist();
    }
  };

  const removeFromWishlist = async (id: number) => {
    const { error } = await supabase.from("wishlists").delete().eq("id", id);
    if (!error) {
      setWishlist(wishlist.filter(i => i.id !== id));
      toast.success("Removed from Archive");
    }
  };

  if (loading && userId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-slate-100 border-t-orange-600 rounded-full animate-spin" />
        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Archives</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-orange-100 relative overflow-hidden">
      <Toaster position="bottom-right" />

      {/* BACKGROUND ACCENTS: Essential for making Glassmorphism work */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-slate-200/40 rounded-full blur-[100px] pointer-events-none" />

   

      {/* MAIN CONTENT: Added pt-32 to clear the fixed header */}
      <div className="relative z-10 pt-32 px-6 lg:px-12 pb-24 max-w-[1600px] mx-auto">
        
        {/* BREADCRUMB */}
        <nav className="mb-12 flex items-center justify-between">
           <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
             Personal Vault / 0{wishlist.length}
           </span>
        </nav>

        {!userId ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <Ghost size={60} className="text-slate-200 mb-8" />
            <h2 className="text-3xl font-black tracking-tighter mb-4">RESTRICTED ACCESS.</h2>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-10 max-w-xs leading-loose">
              Please authenticate to view your curated archival selections.
            </p>
            <Link href="/userinterface/login" className="bg-slate-900 text-white px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-2xl">
              Identify Yourself
            </Link>
          </div>
        ) : (
          <main>
            {/* HERO HEADER */}
            <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
              <div className="max-w-xl">
                <h1 className="text-[clamp(3.5rem,14vw,10rem)] font-black leading-[0.75] tracking-tighter text-slate-900">
                  WIS<span className="text-orange-600">H</span>LIST
                </h1>
                <p className="mt-10 text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] leading-relaxed">
                  Your curated index of architectural pieces. <br />
                  Ready for permanent placement.
                </p>
              </div>
              
              <div className="hidden lg:block h-px flex-1 bg-slate-200 mx-16 mb-6 opacity-40" />
              
              <div className="flex items-center gap-6">
                 <div className="h-16 w-px bg-slate-200 hidden md:block" />
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">STATUS</span>
                   <span className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Live Collection</span>
                 </div>
              </div>
            </header>

            {wishlist.length === 0 ? (
              <div className="h-[40vh] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[3rem] bg-white/20 backdrop-blur-sm">
                <p className="text-slate-300 font-black text-2xl uppercase tracking-tighter">Archive is Empty</p>
                <Link href="/userinterface/Gproducts" className="mt-8 text-orange-600 font-black uppercase text-[10px] tracking-[0.4em] flex items-center gap-3 hover:gap-6 transition-all">
                  Browse New Arrivals <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              /* THE GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {wishlist.map((item) => (
                  <article 
                    key={item.id} 
                    className="group relative backdrop-blur-md bg-white/40 border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] rounded-[2.5rem] p-3.5 transition-all duration-500 hover:bg-white/80 hover:-translate-y-3"
                  >
                    {/* Image Stage */}
                    <Link href={`/userinterface/product/${item.product_id}`} className="block relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-50">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className={`object-cover transition-transform duration-1000 group-hover:scale-110 ${item.stock === 0 ? 'grayscale opacity-30' : ''}`}
                      />
                      
                      {/* Floating Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {item.stock === 0 && (
                          <span className="px-4 py-1.5 bg-black/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                            Sold Out
                          </span>
                        )}
                        {item.stock > 0 && item.stock <= 5 && (
                          <span className="px-4 py-1.5 bg-orange-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse shadow-lg">
                            Last {item.stock} Units
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Quick Remove Action */}
                    <button 
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-8 right-8 p-3 bg-white/90 backdrop-blur-xl text-slate-400 hover:text-red-500 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Product Metadata */}
                    <div className="mt-6 px-3 pb-3">
                      <div className="flex justify-between items-start mb-1">
                        <Link href={`/userinterface/product/${item.product_id}`}>
                          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                      </div>
                      <p className="text-[12px] font-bold text-slate-400 tracking-tight">
                        INR {item.price.toLocaleString()}
                      </p>
                      
                      {/* Movement Action */}
                      <button 
                        onClick={() => addToCart(item)}
                        disabled={item.stock === 0}
                        className={`mt-6 w-full flex items-center justify-center gap-3 py-4 rounded-[1.25rem] font-black text-[9px] uppercase tracking-[0.2em] transition-all 
                          ${item.stock > 0 
                            ? 'bg-slate-900 text-white hover:bg-orange-600 shadow-xl active:scale-95' 
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                      >
                        <ShoppingBag size={14} />
                        {item.stock > 0 ? "Commit to Cart" : "Out of Stock"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}