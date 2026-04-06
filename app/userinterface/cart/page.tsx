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
  Tag
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import supabase from "@/lib/supabase";

interface CartItem {
  id: string;
  productId: number;
  name: string;
  variationId: number | null;
  variationName: string;
  price: number;        // Holds sale_price if active, otherwise base price
  originalPrice: number; // Always holds the base price for UI comparison
  quantity: number;
  image: string;
  stock: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH SESSION
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchUser();
  }, []);

  // 🛒 FETCH CART DATA
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
      console.error("Supabase Error:", error);
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
        .select(`
          price, 
          sale_price, 
          stock, 
          color:attributes!product_variations_color_id_fkey(name), 
          size:attributes!product_variations_size_id_fkey(name)
        `)
        .eq("id", item.variation_id || 0)
        .single();

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

  // 🔄 UPDATE QUANTITY
  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.stock) return toast.error("Out of stock");
    setCart(prev => prev.map(c => c.id === item.id ? { ...c, quantity: newQuantity } : c));
    await supabase.from("cart").update({ quantity: newQuantity }).eq("id", item.id);
  };

  // ❌ REMOVE ITEM
  const removeFromCart = async (item: CartItem) => {
    await supabase.from("cart").delete().eq("id", item.id);
    setCart(prev => prev.filter(c => c.id !== item.id));
    toast.success("Removed from bag");
  };

  // 💰 CALCULATIONS
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gstAmount = subtotal * 0.18; // 18% GST logic
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 150;
  const total = subtotal + gstAmount + shipping;

  // 🚀 NAVIGATION TO CHECKOUT
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    
    const checkoutData = {
      items: cart,
      subtotal,
      gst: gstAmount,
      shipping,
      total
    };
    localStorage.setItem("active_checkout", JSON.stringify(checkoutData));
    router.push("/userinterface/checkout");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa]">
      <Loader2 className="animate-spin text-orange-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6">
      <Toaster position="bottom-right" />
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-[2px] w-8 bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
               Your Selection / {cart.length < 10 ? `0${cart.length}` : cart.length}
             </span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-slate-900 leading-[0.8] uppercase">
            My Ca<span className="text-orange-600">r</span>t
          </h1>
        </header>

        {cart.length === 0 ? (
          <div className="h-[50vh] bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag size={32} className="text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">The bag is empty</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Curate your lifestyle today</p>
            <Link href="/userinterface/Gproducts" className="bg-slate-950 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all">
                Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT: CART ITEMS */}
            <div className="lg:col-span-8 space-y-3">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative flex items-center gap-6 p-4 bg-white border border-slate-100 rounded-[2.2rem] hover:border-orange-200 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50"
                >
                  <div className="relative w-28 h-28 overflow-hidden rounded-[1.6rem] bg-slate-50 flex-shrink-0 border border-slate-50">
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between h-28 py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-base uppercase text-slate-900 tracking-tighter leading-none mb-1.5">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {item.variationName}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item)} 
                        className="p-2.5 bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-0.5">
                        <button 
                          onClick={() => updateQuantity(item, item.quantity - 1)} 
                          className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-black text-xs text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item, item.quantity + 1)} 
                          className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">
                          {item.originalPrice > item.price ? "Sale Price" : "Price / Unit"}
                        </p>
                        <div className="flex flex-col items-end">
                          {item.originalPrice > item.price && (
                            <span className="text-[10px] font-bold text-slate-300 line-through decoration-orange-500/50 mb-0.5">
                              ₹{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                          <p className="font-black text-xl text-slate-900 leading-none">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT: SUMMARY CARD */}
            <div className="lg:col-span-4 sticky top-32">
              <div className="p-10 bg-slate-950 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-orange-600/10 rounded-full blur-3xl" />
                
                <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Summary</h2>
                
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <span>Subtotal</span>
                    <span className="text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {/* GST SECTION */}
                  <div className="flex justify-between items-center text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <span>GST (18%)</span>
                    <span className="text-white">₹{gstAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <span>Shipping</span>
                    <span className="text-orange-500">{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                  </div>
                  
                  <div className="h-[1px] bg-white/10 w-full my-6" />
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-orange-500 font-black text-[9px] uppercase tracking-[0.3em] mb-1">Payable</span>
                      <span className="text-4xl font-black tracking-tighter leading-none">₹{total.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-full border border-white/5">
                       <span className="text-[8px] font-black uppercase tracking-widest">INR</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleProceedToCheckout}
                  className="group w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  Proceed to Checkout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-8 flex items-center gap-3 justify-center text-white/20">
                  <ShieldCheck size={14} />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Secure Gateway</span>
                </div>
              </div>

              {/* SAVINGS BADGE */}
              {cart.some(i => i.originalPrice > i.price) && (
                <div className="mt-4 p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-center gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Tag size={16} className="text-orange-600" />
                   </div>
                   <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-orange-900 leading-none mb-1">Limited Offer</p>
                     <p className="text-[8px] font-bold text-orange-700/60 uppercase tracking-wider">Sale prices applied to items in bag</p>
                   </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}