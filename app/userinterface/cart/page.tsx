"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { TrashIcon, ShoppingBagIcon, ChevronLeftIcon, TruckIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem {
  id?: string;
  productId: number;
  name: string;
  variationId: number | null;
  variationName: string | null;
  price: number;
  quantity: number;
  image: string;
  shippingCharge: number;
  stock: number;
  user_id?: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Handle Auth
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2. Fetch Cart Data
  const fetchCart = useCallback(async () => {
    setLoading(true);
    if (!userId) {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(savedCart);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("cart")
      .select(`
        id, product_id, variation_id, quantity, user_id,
        products ( id, name, active, shipping_charge, product_images ( image_url ) ),
        product_variations ( id, price, unit_type, unit_value, stock )
      `)
      .eq("user_id", userId);

    if (!error && data) {
      const formattedCart = data
        .filter((item: any) => item.products?.active)
        .map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          variationId: item.variation_id,
          variationName: `${item.product_variations?.unit_value} ${item.product_variations?.unit_type}`,
          quantity: item.quantity,
          name: item.products?.name || "Unnamed Product",
          stock: item.product_variations?.stock ?? 0,
          price: item.product_variations?.price || 0,
          shippingCharge: item.products?.shipping_charge || 0,
          image: item.products?.product_images?.[0]?.image_url || "/placeholder.png",
          user_id: item.user_id,
        }));
      setCart(formattedCart);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCart();
    window.addEventListener("cartUpdated", fetchCart);
    return () => window.removeEventListener("cartUpdated", fetchCart);
  }, [fetchCart]);

  // 3. Actions
  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.stock) return toast.error("Maximum stock reached");

    if (!userId) {
      const updatedCart = cart.map((c) =>
        c.productId === item.productId && c.variationId === item.variationId ? { ...c, quantity: newQuantity } : c
      );
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
    } else {
      await supabase.from("cart").update({ quantity: newQuantity }).eq("id", item.id);
      fetchCart();
    }
  };

  const removeFromCart = async (item: CartItem) => {
    if (!userId) {
      const updatedCart = cart.filter((c) => !(c.productId === item.productId && c.variationId === item.variationId));
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } else {
      await supabase.from("cart").delete().eq("id", item.id);
      fetchCart();
    }
    toast.success("Item removed");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // 4. Calculations
  const availableItems = cart.filter(item => item.stock > 0);
  const totalPrice = availableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = availableItems.reduce((sum, item) => sum + (item.price * item.quantity >= 500 ? 0 : item.shippingCharge), 0);
  const grandTotal = totalPrice + shippingCost;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-orange-600 mb-4" size={48} />
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading your bag...</p>
    </div>
  );

  if (cart.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingBagIcon className="w-12 h-12 text-slate-300" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tighter  mb-2">Your bag is empty</h2>
      <p className="text-slate-500 mb-8 text-center max-w-xs">Looks like you haven't added anything to your collection yet.</p>
      <Link href="/userinterface/Gproducts" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-slate-200">
        Start Shopping
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <Link href="/userinterface/products" className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors mb-2 group">
              <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Continue Shopping</span>
            </Link>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter ">Bag<span className="text-orange-600">.</span></h1>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 bg-slate-50 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Items</p>
              <p className="text-lg font-black text-slate-900 leading-none">{availableItems.length}</p>
            </div>
            <button onClick={() => { if(confirm("Clear everything?")) { localStorage.removeItem("cart"); fetchCart(); }}} className="px-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
              Clear All
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Items */}
          <div className="lg:col-span-8 space-y-6">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.variationId}`} className={`relative group bg-white border rounded-[2.5rem] p-4 md:p-6 transition-all duration-500 ${item.stock === 0 ? 'opacity-60 grayscale' : 'hover:shadow-2xl hover:shadow-slate-200/50 border-slate-100'}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="relative w-full md:w-40 aspect-square rounded-[1.8rem] overflow-hidden bg-slate-100 shadow-inner">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                    {item.stock === 0 && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tighter  mb-1 leading-tight">{item.name}</h3>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.variationName}</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between mt-6 gap-4">
                      {/* Price Section */}
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter ">₹{item.price}</p>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button 
                          disabled={item.quantity <= 1 || item.stock === 0} 
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-500 disabled:opacity-30 transition-all"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                        <button 
                          disabled={item.stock === 0}
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-slate-900 hover:bg-orange-600 hover:text-white transition-all"
                        >
                          +
                        </button>
                      </div>

                      {/* Total for Item */}
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                        <p className="text-2xl font-black text-orange-600 tracking-tighter ">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-4 sticky top-28">
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
              {/* Decorative Circle */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600 rounded-full blur-[80px] opacity-20"></div>
              
              <h2 className="text-2xl font-black  tracking-tighter mb-8 border-b border-white/10 pb-4">Summary<span className="text-orange-500">.</span></h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Total</span>
                  <span className="text-lg font-black tracking-tighter ">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping</span>
                  <span className="text-lg font-black tracking-tighter  text-green-400">
                    {shippingCost === 0 ? "FREE" : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {totalPrice < 500 && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mt-6">
                    <p className="text-[9px] font-bold text-slate-300 leading-relaxed uppercase tracking-widest">
                      Add <span className="text-orange-500">₹{(500 - totalPrice).toFixed(2)}</span> more for free shipping
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Grand Total</span>
                  <span className="text-4xl font-black tracking-tighter  text-white">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/userinterface/checkout">
                  <button className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98]">
                    Secure Checkout
                  </button>
                </Link>
                
                <div className="flex items-center justify-center gap-4 mt-6 opacity-40">
                  <TruckIcon className="w-5 h-5" />
                  <ShieldCheckIcon className="w-5 h-5" />
                  <p className="text-[8px] font-black uppercase tracking-[0.2em]">Quality Assured</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}