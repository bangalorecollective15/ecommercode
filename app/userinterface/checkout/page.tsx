"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ChevronLeft, CreditCard, MapPin, ShieldCheck, Upload, CheckCircle2, Copy, Info } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import supabase from "@/lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [gateway, setGateway] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    altPhone: "",
    houseNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login");
        return router.push("/login");
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const saved = localStorage.getItem("active_checkout");
      if (!saved) return router.push("/userinterface/cart");
      setCheckoutData(JSON.parse(saved));

      const { data: pay } = await supabase.from("payment_gateways").select("*").eq("is_active", true).single();
      setGateway(pay);
      setLoading(false);
    };
    init();
  }, []);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProof) return toast.error("Please upload payment proof");
    setIsSubmitting(true);

    try {
      // 1. Upload Screenshot to Storage
      const fileName = `${userId}/${Date.now()}-${paymentProof.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, paymentProof);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      // 2. Create Order in Database
      const tax = checkoutData.subtotal * 0.18;
      const { error: orderErr } = await supabase.from("orders").insert({
        user_id: userId,
        full_name: address.fullName,
        phone_number: address.phone,
        alt_phone_number: address.altPhone,
        house_number: address.houseNumber,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        payment_method: "Bank Transfer",
        payment_id: publicUrl, // Public URL stored as payment reference
        total_price: checkoutData.subtotal,
        shipping_cost: checkoutData.shipping,
        grand_total: checkoutData.total + tax,
        cart_items: checkoutData.items,
        email: userEmail
      });

      if (orderErr) throw orderErr;

      // 3. Cleanup
      localStorage.removeItem("active_checkout");
      toast.success("Order Placed Successfully!");
      router.push("/userinterface/order");

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#fafafa]"><Loader2 className="animate-spin text-orange-600" /></div>;

  const tax = checkoutData.subtotal * 0.18;
  const grandTotal = checkoutData.total + tax;

  return (
    <div className="min-h-screen bg-[#fafafa] pt-28 pb-20 px-6">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 font-black text-[10px] uppercase tracking-widest transition-all">
          <ChevronLeft size={16} /> Back to Bag
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* FORM COLUMN */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><MapPin size={20}/></div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Shipping Address</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Full Name" className="col-span-2 p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-orange-600/20" onChange={e => setAddress({...address, fullName: e.target.value})} />
                <input required placeholder="Phone Number" className="p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" onChange={e => setAddress({...address, phone: e.target.value})} />
                <input placeholder="Alt Phone (Optional)" className="p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" onChange={e => setAddress({...address, altPhone: e.target.value})} />
                <input required placeholder="House / Flat No." className="p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" onChange={e => setAddress({...address, houseNumber: e.target.value})} />
                <input required placeholder="Pincode" className="p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" onChange={e => setAddress({...address, pincode: e.target.value})} />
                <textarea required placeholder="Full Street Address" className="col-span-2 p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none h-24" onChange={e => setAddress({...address, street: e.target.value})} />
                <input required placeholder="City" className="p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" onChange={e => setAddress({...address, city: e.target.value})} />
                <input required placeholder="State" className="p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" onChange={e => setAddress({...address, state: e.target.value})} />
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <h2 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><CreditCard size={20}/></div>
                Payment Details
              </h2>
              {gateway && (
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4 mb-6">
                  <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Bank</span><span className="font-black text-sm">{gateway.bank_name}</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">A/C Number</span><span className="font-black text-sm">{gateway.account_number}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">IFSC</span><span className="font-black text-sm text-orange-500">{gateway.ifsc_code}</span></div>
                </div>
              )}
              <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
                <p className="text-[10px] font-black uppercase text-orange-600 mb-4 tracking-widest">Upload Payment Proof</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-200 rounded-2xl bg-white cursor-pointer hover:bg-orange-100/50 transition-all">
                  <input type="file" className="hidden" accept="image/*" onChange={e => setPaymentProof(e.target.files?.[0] || null)} />
                  {paymentProof ? <span className="text-xs font-black text-green-600 flex items-center gap-2"><CheckCircle2 size={16}/> {paymentProof.name}</span> : <Upload className="text-orange-400" />}
                </label>
              </div>
            </section>
          </div>

          {/* BILLING COLUMN */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-6">Order Total</h3>
              <div className="space-y-3 pb-6 mb-6 border-b border-slate-50">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>Subtotal</span><span>₹{checkoutData.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>Shipping</span><span>₹{checkoutData.shipping}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>GST (18%)</span><span>₹{tax.toLocaleString()}</span></div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-orange-600 font-black text-xs uppercase tracking-widest">Grand Total</span>
                <span className="text-5xl font-black tracking-tighter">₹{grandTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleOrder} 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white mt-10 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Complete Purchase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}