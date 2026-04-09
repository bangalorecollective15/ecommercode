"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Loader2, 
  ChevronLeft, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  Copy, 
  Info,
  Sparkles,
  QrCode
} from "lucide-react";
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
        toast.error("Session expired. Please login.");
        return router.push("/login");
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const saved = localStorage.getItem("active_checkout");
      if (!saved) return router.push("/userinterface/cart");
      setCheckoutData(JSON.parse(saved));

      // Fetching the QR enabled gateway
      const { data: pay } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("is_active", true)
        .single();
      setGateway(pay);
      setLoading(false);
    };
    init();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`, { style: { fontSize: '10px', fontWeight: 'bold' } });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.city) return toast.error("Complete shipping info");
    if (!paymentProof) return toast.error("Upload payment proof to proceed");
    setIsSubmitting(true);

    try {
      const fileName = `${userId}/${Date.now()}-${paymentProof.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, paymentProof);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

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
        payment_id: publicUrl,
        total_price: checkoutData.subtotal,
        shipping_cost: checkoutData.shipping,
        grand_total: checkoutData.total + tax,
        cart_items: checkoutData.items,
        email: userEmail
      });

      if (orderErr) throw orderErr;

      localStorage.removeItem("active_checkout");
      toast.success("Order Archive Created");
      router.push("/userinterface/order");

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-brand-gold" size={24} />
    </div>
  );

  const tax = checkoutData.subtotal * 0.18;
  const grandTotal = checkoutData.total + tax;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pt-24 pb-20 px-6">
      <Toaster position="bottom-center" />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-10 font-bold text-[9px] uppercase tracking-[0.2em] transition-all group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Bag
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: FORMS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* DESTINATION */}
            <section className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-xl flex items-center justify-center"><MapPin size={16}/></div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Destination</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Full Name" className="col-span-2" onChange={v => setAddress({...address, fullName: v})} />
                <Input placeholder="Primary Phone" onChange={v => setAddress({...address, phone: v})} />
                <Input placeholder="Secondary Phone" onChange={v => setAddress({...address, altPhone: v})} />
                <Input placeholder="Flat / House No." onChange={v => setAddress({...address, houseNumber: v})} />
                <Input placeholder="Pincode" onChange={v => setAddress({...address, pincode: v})} />
                <textarea 
                   required 
                   placeholder="Street Address & Landmark" 
                   className="col-span-2 p-4 bg-white/50 rounded-2xl text-[11px] font-bold border border-white focus:outline-none focus:border-brand-gold/50 h-24 transition-all" 
                   onChange={e => setAddress({...address, street: e.target.value})} 
                />
                <Input placeholder="City" onChange={v => setAddress({...address, city: v})} />
                <Input placeholder="State" onChange={v => setAddress({...address, state: v})} />
              </div>
            </section>

            {/* SETTLEMENT & QR */}
            <section className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3 text-slate-900">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center"><CreditCard size={16}/></div>
                Settlement
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Bank Details Card */}
                {gateway && (
                  <div className="p-6 bg-slate-950 rounded-[2rem] text-white space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={30} /></div>
                    <BankRow label="Institution" value={gateway.bank_name} onCopy={() => copyToClipboard(gateway.bank_name, 'Bank')} />
                    <BankRow label="A/C Holder" value={gateway.account_holder} onCopy={() => copyToClipboard(gateway.account_holder, 'Holder')} />
                    <BankRow label="Number" value={gateway.account_number} onCopy={() => copyToClipboard(gateway.account_number, 'A/C Number')} />
                    <BankRow label="IFSC" value={gateway.ifsc_code} isLast onCopy={() => copyToClipboard(gateway.ifsc_code, 'IFSC')} />
                  </div>
                )}

              {/* QR Code Display - Increased Size */}
{gateway?.qr_url && (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-center justify-center text-center shadow-inner group">
    <div className="relative w-48 h-48 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
      <Image 
        src={gateway.qr_url} 
        alt="Payment QR" 
        fill 
        className="object-contain p-2"
        priority
      />
      {/* Subtle overlay for high-end feel */}
      <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
    
    <div className="space-y-1">
      <div className="flex items-center justify-center gap-2 text-brand-gold">
        <QrCode size={14} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scan to Pay</span>
      </div>
      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
        Ensure brightness is up for faster scanning
      </p>
    </div>
  </div>
)}
              </div>

              {/* Upload Proof */}
              <div className="bg-brand-gold/5 p-6 rounded-[2rem] border border-brand-gold/10">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={12} className="text-brand-gold" />
                  <p className="text-[9px] font-black uppercase text-brand-gold tracking-widest">Transaction Receipt Required</p>
                </div>
                <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-brand-gold/30 rounded-2xl bg-white/50 cursor-pointer hover:bg-white transition-all">
                  <input type="file" className="hidden" accept="image/*" onChange={e => setPaymentProof(e.target.files?.[0] || null)} />
                  {paymentProof ? (
                    <span className="text-[10px] font-black text-green-600 flex items-center gap-2 px-4 text-center">
                      <CheckCircle2 size={14}/> {paymentProof.name}
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={18} className="text-brand-gold/40" />
                      <span className="text-[9px] font-bold uppercase text-slate-400">Select Image</span>
                    </div>
                  )}
                </label>
              </div>
            </section>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50">
              <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-slate-900">Total Valuation</h3>
              <div className="space-y-4 pb-8 mb-8 border-b border-slate-100">
                <SummaryRow label="Items Subtotal" value={checkoutData.subtotal} />
                <SummaryRow label="Logistics" value={checkoutData.shipping} />
                <SummaryRow label="Govt. Tax (GST)" value={tax} />
              </div>
              <div className="flex justify-between items-end mb-10">
                <div className="flex flex-col">
                  <span className="text-brand-gold font-black text-[9px] uppercase tracking-widest mb-1">Grand Amount</span>
                  <span className="text-4xl font-black tracking-tighter text-slate-950">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={handleOrder} 
                disabled={isSubmitting}
                className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-brand-gold transition-all shadow-xl shadow-slate-950/10 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Finalize Order"}
              </button>
              <div className="mt-8 flex items-center gap-3 justify-center text-slate-300">
                <ShieldCheck size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">PCI-DSS Secure Archive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ placeholder, className = "", onChange }: { placeholder: string, className?: string, onChange: (v: string) => void }) {
  return (
    <input 
      required 
      placeholder={placeholder} 
      className={`p-4 bg-white/50 rounded-2xl text-[11px] font-bold border border-white focus:outline-none focus:border-brand-gold/50 transition-all ${className}`} 
      onChange={e => onChange(e.target.value)} 
    />
  );
}

function BankRow({ label, value, onCopy, isLast = false }: any) {
  return (
    <div className={`flex justify-between items-center ${!isLast ? 'border-b border-white/5 pb-3' : ''}`}>
      <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-[11px] text-white/90">{value}</span>
        <button onClick={onCopy} className="text-white/20 hover:text-brand-gold transition-colors"><Copy size={10} /></button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      <span>{label}</span>
      <span className="text-slate-900">₹{value.toLocaleString()}</span>
    </div>
  );
}