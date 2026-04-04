"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  ChevronLeftIcon, ShieldCheckIcon, TruckIcon,
  CreditCardIcon, BanknotesIcon, MapPinIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem {
  productId: number;
  name: string;
  variationId: string | number;
  variationName: string;
  price: number;
  quantity: number;
  image: string;
  shippingCharge: number;
  stock: number;
}

const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-400">Initializing Secure Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    alt_phone_number: "",
    house_number: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  // Totals Calculation
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = totalPrice >= 500 ? 0 : cart.reduce((max, item) => Math.max(max, item.shippingCharge), 0);
  const grandTotal = totalPrice + shippingCost;

const fetchCartData = useCallback(async (uid: string | null) => {
    const buyNowVarId = searchParams.get("variationId");
    const buyNowQty = parseInt(searchParams.get("qty") || "1");

    if (buyNowVarId) {
      // 1. BUY NOW LOGIC
      const { data: item, error } = await supabase
        .from("product_variations")
        .select(`
          id, price, stock,
          color:color_id(name),
          size:size_id(name),
          products(id, name, shipping_charge, product_images(image_url))
        `)
        .eq("id", Number(buyNowVarId))
        .single();

      if (item && !error) {
        // Handle the case where color or size might be returned as an array
        const colorName = Array.isArray(item.color) ? item.color[0]?.name : (item.color as any)?.name;
        const sizeName = Array.isArray(item.size) ? item.size[0]?.name : (item.size as any)?.name;

        setCart([{
          productId: item.products.id,
          name: item.products.name,
          variationId: item.id,
          variationName: `${colorName || ''} ${sizeName || ''}`.trim() || "Standard",
          price: item.price,
          quantity: buyNowQty,
          stock: item.stock,
          image: item.products.product_images?.[0]?.image_url || "/placeholder.png",
          shippingCharge: item.products.shipping_charge || 0,
        }]);
      } else {
        toast.error("Could not retrieve product details.");
      }
    } else if (uid) {
      // 2. STANDARD CART LOGIC
      const { data, error } = await supabase
        .from("cart")
        .select(`
          quantity,
          product_variations(id, price, stock, color:color_id(name), size:size_id(name)),
          products(id, name, shipping_charge, product_images(image_url))
        `)
        .eq("user_id", uid);

      if (data && !error) {
        const formatted = data.map((item: any) => {
          const v = item.product_variations;
          // Safe extraction for joined table data
          const colorName = Array.isArray(v.color) ? v.color[0]?.name : v.color?.name;
          const sizeName = Array.isArray(v.size) ? v.size[0]?.name : v.size?.name;

          return {
            productId: item.products.id,
            name: item.products.name,
            variationId: v.id,
            variationName: `${colorName || ''} ${sizeName || ''}`.trim() || "Standard",
            price: v.price,
            quantity: item.quantity,
            stock: v.stock,
            image: item.products.product_images?.[0]?.image_url || "/placeholder.png",
            shippingCharge: item.products.shipping_charge || 0,
          };
        }).filter((i: any) => i.stock > 0);
        
        setCart(formatted);
      }
    }
    setLoading(false);
  }, [searchParams]);
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
      await fetchCartData(session?.user?.id || null);
    };
    getSession();
  }, [fetchCartData]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const finalizeOrder = async (orderId: string) => {
    // 1. Decrement Stock for each item
    for (const item of cart) {
      await supabase.rpc("decrement_stock", {
        variation_id: item.variationId,
        qty: item.quantity
      });
    }

    // 2. If it was a cart purchase (not buy now), clear the cart table
    if (!searchParams.get("variationId") && userId) {
      await supabase.from("cart").delete().eq("user_id", userId);
    }

    toast.success("Order confirmed!");
    router.push(`/userinterface/order/`);
  };

  const placeOrder = async () => {
    if (!form.full_name || !form.phone_number || !form.city || !form.pincode) {
      return toast.error("Please provide complete delivery details");
    }

    setSubmitting(true);

    try {
      // Insert into orders table
      const { data: order, error } = await supabase.from("orders").insert([{
        user_id: userId,
        ...form,
        payment_method: paymentMethod,
        total_price: totalPrice,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
        cart_items: cart, // Storing snapshot of items for history
        payment_status: paymentMethod === "cod" ? "pending" : "awaiting",
      }]).select().single();

      if (error) throw error;

      if (paymentMethod === "razorpay") {
        // Razorpay logic here (omitted for brevity, keep your existing loadRazorpay)
        // ... (Refer to your existing code for rzp.open())
      } else {
        await finalizeOrder(order.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ... (UI Rendering remains similar to your original code)
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Securing your session</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 md:px-10 antialiased">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <Link href="/userinterface/cart" className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-all mb-4 group">
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return to Bag</span>
          </Link>
          <div className="flex items-baseline gap-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Checkout</h1>
            <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* LEFT: Forms */}
          <div className="lg:col-span-7 space-y-10">
            <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter">Shipping Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                  <input name="full_name" value={form.full_name} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none" placeholder="Enter your full name" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number</label>
                  <input name="phone_number" value={form.phone_number} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none" placeholder="Primary phone" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Alternate Phone (Optional)</label>
                  <input name="alt_phone_number" value={form.alt_phone_number} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none" placeholder="Secondary phone" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Flat, House no., Building, Apartment</label>
                  <input name="house_number" value={form.house_number} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none" placeholder="e.g. 402, Sunset Towers" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Area, Street, Sector, Village</label>
                  <input name="street" value={form.street} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none" placeholder="e.g. MG Road, Sector 15" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">City</label>
                  <select name="city" value={form.city} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none appearance-none">
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleInput} className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-[2rem] px-8 py-5 transition-all font-bold outline-none" placeholder="6-digit code" />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <CreditCardIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter">Payment Strategy</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { id: 'razorpay', label: 'Online Payment', sub: 'Cards, UPI & Netbanking', icon: CreditCardIcon },
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay at your doorstep', icon: BanknotesIcon }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-6 p-6 rounded-[2.5rem] border-2 transition-all text-left ${paymentMethod === method.id ? 'border-orange-600 bg-orange-50/30' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'}`}
                  >
                    <div className={`p-4 rounded-2xl ${paymentMethod === method.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-300'}`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-xs uppercase tracking-widest">{method.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{method.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: Summary */}
          <aside className="lg:col-span-5 sticky top-32">
            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-[0_40px_100px_-20px_rgba(15,23,42,0.3)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />

              <h2 className="text-3xl font-black tracking-tighter mb-10">Order Summary</h2>

              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.variationId} className="flex gap-6 items-center group">
                    <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-white/10 flex-shrink-0 border border-white/5 transition-transform group-hover:scale-105">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black truncate uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                        {item.variationName} <span className="mx-2 text-white/20">|</span> Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-black text-lg tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-5 border-t border-white/10 pt-8 mb-10">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Subtotal</span>
                  <span className="font-black text-white">₹{totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Shipping</span>
                  <span className={`font-black ${shippingCost === 0 ? "text-green-400" : "text-white"}`}>
                    {shippingCost === 0 ? "COMPLIMENTARY" : `₹${shippingCost.toFixed(0)}`}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-6">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Total amount</span>
                    <p className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest italic">Incl. all taxes</p>
                  </div>
                  <span className="text-5xl font-black tracking-tighter">₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              <button
                disabled={submitting || cart.length === 0}
                onClick={placeOrder}
                className="w-full py-7 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-4 group"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheckIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                    Complete Order
                  </>
                )}
              </button>

              <div className="mt-8 flex items-center justify-center gap-3 opacity-40 text-[9px] font-black uppercase tracking-[0.3em]">
                <TruckIcon className="w-4 h-4" />
                Estimated Arrival: 3-5 Business Days
              </div>
            </div>

            <div className="mt-8 p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100 flex items-start gap-4">
              <ShieldCheckIcon className="w-6 h-6 text-orange-600 mt-1" />
              <p className="text-[11px] leading-relaxed font-semibold text-orange-900/70">
                Secure Checkout: Your data is encrypted and transactions are handled via PCI-DSS compliant gateways.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}