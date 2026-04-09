"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Trash2, 
  ShoppingBag, 
  ShieldCheck,
  Plus, 
  Minus, 
  ArrowRight, 
  Loader2,
  Sparkles
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import supabase from "@/lib/supabase";

interface CartItem {
  id: string;
  productId: number;
  name: string;
  variationId: number | null;
  variationName: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  stock: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchUser();
  }, []);

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("cart")
      .select(`
        id, product_id, variation_id, quantity,
        products ( id, name, product_images ( image_url ) )
      `)
      .eq("user_id", userId);

    if (error) {
      toast.error("Error loading cart");
      setLoading(false);
      return;
    }

    const formattedCart = await Promise.all((data || []).map(async (item: any) => {
      let activePrice = 0;
      let basePrice = 0;
      let stock = 0;
      let varName = "Standard Edition";

      const { data: varData } = await supabase
        .from("product_variations")
        .select(`price, sale_price, stock, color:attributes!product_variations_color_id_fkey(name), size:attributes!product_variations_size_id_fkey(name)`)
        .eq("id", item.variation_id || 0)
        .maybeSingle(); // Used maybeSingle to prevent errors if variation is missing

      if (varData) {
        activePrice = varData.sale_price ? Number(varData.sale_price) : Number(varData.price);
        basePrice = Number(varData.price);
        stock = varData.stock;
        const getName = (val: any) => val ? (Array.isArray(val) ? val[0]?.name : val.name) : "";
        varName = `${getName(varData.color)} ${getName(varData.size)}`.trim();
      }

      return {
        id: item.id,
        productId: item.product_id,
        variationId: item.variation_id,
        variationName: varName || "Standard",
        quantity: item.quantity,
        name: item.products?.name || "Unknown Product",
        price: activePrice, 
        originalPrice: basePrice,
        stock: stock,
        image: item.products?.product_images?.[0]?.image_url || "/placeholder.png",
      };
    }));

    setCart(formattedCart);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.stock) return toast.error("Stock limit reached");
    setCart(prev => prev.map(c => c.id === item.id ? { ...c, quantity: newQuantity } : c));
    await supabase.from("cart").update({ quantity: newQuantity }).eq("id", item.id);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeFromCart = async (item: CartItem) => {
    await supabase.from("cart").delete().eq("id", item.id);
    setCart(prev => prev.filter(c => c.id !== item.id));
    toast.success("Removed from bag");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gstAmount = subtotal * 0.18;
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 150;
  const total = subtotal + gstAmount + shipping;

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    localStorage.setItem("active_checkout", JSON.stringify({ items: cart, subtotal, gst: gstAmount, shipping, total }));
    router.push("/userinterface/checkout");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-brand-gold" size={24} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-24 px-6 text-slate-900 selection:bg-brand-gold/20">
      <Toaster position="bottom-right" />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-md border border-white/80 rounded-full shadow-sm mb-4">
            <Sparkles size={10} className="text-brand-gold" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Shopping Bag / {cart.length} Units
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 uppercase">
            Checkou<span className="text-brand-gold">t</span>
          </h1>
        </header>

        {cart.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-7 space-y-4">
              {cart.map((item) => (
                <CartItemRow 
                  key={item.id} 
                  item={item} 
                  updateQuantity={updateQuantity} 
                  removeFromCart={removeFromCart} 
                />
              ))}
            </div>

            <div className="lg:col-span-5 sticky top-24">
              <div className="p-8 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white border-t-white shadow-2xl shadow-slate-200/50">
                <h2 className="text-lg font-black mb-6 uppercase tracking-tight text-slate-900">Order Summary</h2>
                
                <div className="space-y-3 mb-8">
                  <SummaryRow label="Subtotal" value={subtotal} />
                  <SummaryRow label="GST (18%)" value={gstAmount} />
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Shipping</span>
                    <span className={shipping === 0 ? "text-brand-gold" : "text-slate-900"}>{shipping === 0 ? "Complimentary" : `₹${shipping}`}</span>
                  </div>
                  
                  <div className="h-[1px] bg-slate-100 w-full my-4" />
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.2em] mb-1">Total Payable</span>
                      <span className="text-3xl font-black tracking-tighter text-slate-950">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleProceedToCheckout}
                  className="group w-full bg-slate-950 hover:bg-brand-gold py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-white flex items-center justify-center gap-3 transition-all"
                >
                  Proceed to Payment <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-6 flex items-center gap-2 justify-center text-slate-300">
                  <ShieldCheck size={12} />
                  <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Encrypted Checkout</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for individual rows to handle Video logic cleanly
function CartItemRow({ item, updateQuantity, removeFromCart }: any) {
  const isVideo = item.image && (
    item.image.toLowerCase().endsWith('.mp4') || 
    item.image.toLowerCase().endsWith('.webm') || 
    item.image.toLowerCase().endsWith('.mov')
  );

  return (
    <div className="group relative flex items-center gap-4 p-3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/40">
      <div className="relative w-24 h-24 overflow-hidden rounded-2xl bg-slate-50 flex-shrink-0">
        {isVideo ? (
          <video 
            src={item.image} 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <Image 
            src={item.image} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-700" 
            unoptimized={true}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-[13px] text-slate-900 truncate uppercase tracking-tight">{item.name}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.variationName}</p>
          </div>
          <button onClick={() => removeFromCart(item)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center bg-white/60 border border-white rounded-lg p-0.5">
            <button onClick={() => updateQuantity(item, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-all">
              <Minus size={10} />
            </button>
            <span className="w-8 text-center text-[11px] font-black">{item.quantity}</span>
            <button onClick={() => updateQuantity(item, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-all">
              <Plus size={10} />
            </button>
          </div>
          
          <div className="text-right">
            {item.originalPrice > item.price && (
              <span className="block text-[9px] font-bold text-slate-300 line-through">₹{item.originalPrice.toLocaleString()}</span>
            )}
            <p className="font-black text-sm text-slate-950">₹{(item.price * item.quantity).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900">₹{value.toLocaleString()}</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="py-20 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-white/60 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 border border-white shadow-sm">
        <ShoppingBag size={24} className="text-slate-200" />
      </div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Your bag is currently empty</p>
      <Link href="/userinterface/Gproducts" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-950 hover:text-brand-gold transition-colors">
        Start Shopping <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}