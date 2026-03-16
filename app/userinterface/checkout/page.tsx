"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { ChevronLeftIcon, ShieldCheckIcon, TruckIcon, CreditCardIcon, BanknotesIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem {
  productId: number;
  name: string;
  variationId: string | null;
  variationName: string | null;
  price: number;
  quantity: number;
  image: string;
  shippingCharge: number;
  stock: number;
}

const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];
const states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal", "Telangana"];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    altPhoneNumber: "",
    houseNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  // 1. Fetch User & Cart
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      setUserId(uid);

      if (uid) {
        const { data } = await supabase
          .from("cart")
          .select(`
            quantity,
            product_variations(id, price, unit_type, unit_value, stock),
            products(id, name, shipping_charge, product_images(image_url))
          `)
          .eq("user_id", uid);

        if (data) {
          const formatted = data.map((item: any) => ({
            productId: item.products.id,
            name: item.products.name,
            variationId: item.product_variations.id,
            variationName: `${item.product_variations.unit_value} ${item.product_variations.unit_type}`,
            price: item.product_variations.price,
            quantity: item.quantity,
            stock: item.product_variations.stock,
            image: item.products.product_images?.[0]?.image_url || "/placeholder.png",
            shippingCharge: item.products.shipping_charge || 0,
          })).filter(i => i.stock > 0);
          setCart(formatted);
        }
      } else {
        const local = JSON.parse(localStorage.getItem("cart") || "[]");
        setCart(local.filter((i: any) => i.stock > 0));
      }
      setLoading(false);
    };
    init();
  }, []);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = cart.reduce((sum, item) => sum + (item.price * item.quantity >= 500 ? 0 : item.shippingCharge), 0);
  const grandTotal = totalPrice + shippingCost;

  const handleInput = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const loadRazorpay = () => {
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => res(true);
      s.onerror = () => res(false);
      document.body.appendChild(s);
    });
  };

  const placeOrder = async () => {
    if (!form.fullName || !form.phoneNumber || !form.city) return toast.error("Please fill all required fields");
    setSubmitting(true);

    try {
  const orderPayload = {
  user_id: userId,
  full_name: form.fullName,           // Map camelCase to snake_case
  phone_number: form.phoneNumber,
  alt_phone_number: form.altPhoneNumber, // Ensure this matches SQL
  house_number: form.houseNumber,
  street: form.street,
  city: form.city,
  state: form.state,
  pincode: form.pincode,
  payment_method: paymentMethod,
  total_price: totalPrice,
  shipping_cost: shippingCost,
  grand_total: grandTotal,
  cart_items: cart,
  payment_status: paymentMethod === "cod" ? "pending" : "awaiting",
};

      const { data: order, error } = await supabase.from("orders").insert([orderPayload]).select().single();
      if (error) throw error;

      if (paymentMethod === "razorpay") {
        const loaded = await loadRazorpay();
        if (!loaded) throw new Error("Razorpay SDK failed");

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount: grandTotal * 100,
          currency: "INR",
          name: "Swaadha.",
          handler: async (response: any) => {
            await supabase.from("orders").update({ 
                payment_id: response.razorpay_payment_id, 
                payment_status: "paid" 
            }).eq("id", order.id);
            
            // Clean up
            for (const item of cart) {
                await supabase.rpc("decrement_stock", { variation_id: item.variationId, qty: item.quantity });
            }
            if (!userId) localStorage.removeItem("cart");
            else await supabase.from("cart").delete().eq("user_id", userId);

            toast.success("Order Placed!");
            router.push("/userinterface/order");
          },
          theme: { color: "#ea580c" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // COD logic
        for (const item of cart) {
            await supabase.rpc("decrement_stock", { variation_id: item.variationId, qty: item.quantity });
        }
        if (!userId) localStorage.removeItem("cart");
        else await supabase.from("cart").delete().eq("user_id", userId);
        toast.success("Order Placed Successfully!");
        router.push("/userinterface/order");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-400">Processing...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-4 md:px-10">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10">
          <Link href="/userinterface/cart" className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors mb-2 group">
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Bag</span>
          </Link>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter ">Checkout<span className="text-orange-600">.</span></h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Shipping Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <MapPinIcon className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-black  tracking-tighter">Shipping Address</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                  <input name="fullName" onChange={handleInput} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500 transition-all font-semibold" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone</label>
                  <input name="phoneNumber" onChange={handleInput} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500 transition-all font-semibold" placeholder="9876543210" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">House/Flat No.</label>
                  <input name="houseNumber" onChange={handleInput} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500 transition-all font-semibold" placeholder="A-102, Skyline Apartments" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Street/Locality</label>
                  <input name="street" onChange={handleInput} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500 transition-all font-semibold" placeholder="Main Road, Near Landmark" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">City</label>
                  <select name="city" onChange={handleInput} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500 transition-all font-semibold">
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Pincode</label>
                  <input name="pincode" onChange={handleInput} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500 transition-all font-semibold" placeholder="400001" />
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <CreditCardIcon className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-black  tracking-tighter">Payment Method</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${paymentMethod === 'razorpay' ? 'border-orange-600 bg-orange-50/50' : 'border-slate-50 bg-white'}`}
                >
                  <div className={`p-3 rounded-xl ${paymentMethod === 'razorpay' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <CreditCardIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xs uppercase tracking-widest">Razorpay</p>
                    <p className="text-[10px] text-slate-400">Cards, UPI, Netbanking</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${paymentMethod === 'cod' ? 'border-orange-600 bg-orange-50/50' : 'border-slate-50 bg-white'}`}
                >
                  <div className={`p-3 rounded-xl ${paymentMethod === 'cod' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <BanknotesIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xs uppercase tracking-widest">Cash on Delivery</p>
                    <p className="text-[10px] text-slate-400">Pay when you receive</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Side */}
          <aside className="lg:col-span-5 sticky top-28">
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <h2 className="text-2xl font-black  tracking-tighter mb-8 border-b border-white/10 pb-4">Order Items</h2>
              
              <div className="max-h-60 overflow-y-auto space-y-4 mb-8 pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.variationId} className="flex gap-4 items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate uppercase tracking-tighter">{item.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">{item.variationName} × {item.quantity}</p>
                    </div>
                    <p className="font-black  text-sm">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/10 pt-6 mb-8">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                  <span className="font-black ">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Shipping</span>
                  <span className="font-black  text-green-400">{shippingCost === 0 ? "FREE" : `₹${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Total</span>
                  <span className="text-4xl font-black tracking-tighter ">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                disabled={submitting}
                onClick={placeOrder}
                className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? "Placing Order..." : (
                  <>
                    <ShieldCheckIcon className="w-5 h-5" />
                    Place Order Now
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-4 opacity-30 text-[8px] font-black uppercase tracking-[0.2em]">
                <TruckIcon className="w-4 h-4" /> Fast Shipping Available
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}