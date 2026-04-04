"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import Image from "next/image";
import Link from "next/link";
import { 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight, 
  Loader2,
  PackageCheck,
  ShieldCheck,
  X
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
  quantity: number;
  image: string;
  stock: number;
}

export default function CartPage() {
  const router = useRouter(); // Initialize router
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Form State
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    houseNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // 🔐 AUTH SESSION
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
      setUserEmail(data.session?.user?.email || null);
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
      toast.error("Error loading cart");
      setLoading(false);
      return;
    }

    const formattedCart = await Promise.all((data || []).map(async (item: any) => {
      let price = 0;
      let stock = 0;
      let varName = "Standard Edition";

      const { data: varData } = await supabase
        .from("product_variations")
        .select(`price, stock, color:attributes!product_variations_color_id_fkey(name), size:attributes!product_variations_size_id_fkey(name)`)
        .eq("id", item.variation_id || 0)
        .single();

    if (varData) {
  price = varData.price;
  stock = varData.stock;

  // Helper to safely get the name from either an object or the first element of an array
  const getName = (val: any) => {
    if (!val) return "";
    return Array.isArray(val) ? (val[0]?.name || "") : (val.name || "");
  };

  const color = getName(varData.color);
  const size = getName(varData.size);
  
  varName = `${color} ${size}`.trim();
}

      return {
        id: item.id,
        productId: item.product_id,
        variationId: item.variation_id,
        variationName: varName || "Standard",
        quantity: item.quantity,
        name: item.products?.name || "Unknown Product",
        price: price,
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
  const shipping = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shipping;

  // 🚀 PLACE ORDER
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Please login");
    setIsPlacingOrder(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          email: userEmail,
          full_name: address.fullName,
          phone_number: address.phone,
          house_number: address.houseNumber,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          payment_method: "COD",
          total_price: subtotal,
          shipping_cost: shipping,
          grand_total: total,
          cart_items: cart, 
          status: "placed"
        })
        .select()
        .single();

      if (error) throw error;

      // 1. Clear Database Cart
      await supabase.from("cart").delete().eq("user_id", userId);
      
      // 2. Clear Local UI State
      setCart([]);
      setIsCheckoutOpen(false);
      toast.success("Order placed successfully!");

      // 3. Navigate to the Order Page
      router.push("/userinterface/order");

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6">
      <Toaster position="bottom-right" />
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 block mb-4">Bag / 0{cart.length}</span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900">MY CA<span className="text-orange-600">R</span>T</h1>
        </header>

        {cart.length === 0 ? (
          <div className="h-[50vh] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center">
            <ShoppingBag size={48} className="text-slate-200 mb-6" />
            <Link href="/userinterface/Gproducts" className="bg-slate-900 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest">Return to Shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem]">
                  <div className="relative w-40 h-40 overflow-hidden rounded-[1.8rem] bg-slate-50">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <h3 className="font-black text-lg uppercase text-slate-900">{item.name}</h3>
                      <button onClick={() => removeFromCart(item)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.variationName}</p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center border border-slate-200 rounded-full p-1">
                        <button onClick={() => updateQuantity(item, item.quantity - 1)} className="w-8 h-8"><Minus size={14} /></button>
                        <span className="w-10 text-center font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item, item.quantity + 1)} className="w-8 h-8"><Plus size={14} /></button>
                      </div>
                      <p className="font-black">₹{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-32 p-8 bg-slate-900 rounded-[3rem] text-white">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between opacity-60"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between opacity-60"><span>Shipping</span><span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                    <span className="text-orange-500 font-black">Total</span><span className="text-3xl font-black">₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-orange-600 py-6 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  Proceed <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📝 CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X /></button>
            <h2 className="text-4xl font-black tracking-tighter mb-8">SHIPPING <span className="text-orange-600">INFO</span></h2>
            
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Full Name" className="col-span-2 p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, fullName: e.target.value})} />
              <input required placeholder="Phone Number" className="p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, phone: e.target.value})} />
              <input required placeholder="Pincode" className="p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, pincode: e.target.value})} />
              <input required placeholder="House/Flat No." className="col-span-2 p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, houseNumber: e.target.value})} />
              <input required placeholder="Street / Area" className="col-span-2 p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, street: e.target.value})} />
              <input required placeholder="City" className="p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, city: e.target.value})} />
              <input required placeholder="State" className="p-4 bg-slate-50 border-none rounded-2xl font-bold" onChange={e => setAddress({...address, state: e.target.value})} />
              
              <button disabled={isPlacingOrder} type="submit" className="col-span-2 bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-3">
                {isPlacingOrder ? <Loader2 className="animate-spin" /> : "Confirm Order ₹" + total.toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}