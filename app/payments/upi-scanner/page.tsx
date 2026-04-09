"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  QrCode, Upload, Save, Loader2, ArrowLeft, ShieldCheck, RefreshCw, CreditCard
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UPIScannerSetup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    id: null,
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    upiId: "", // Added UPI ID field
  });

  useEffect(() => {
    async function fetchSingleGateway() {
      setFetching(true);
      const { data } = await supabase
        .from("payment_gateways")
        .select("*")
        .limit(1)
        .maybeSingle(); // maybeSingle handles "no rows" without an error
      
      if (data) {
        setFormData({
          id: data.id,
          bankName: data.bank_name || "",
          accountHolder: data.account_holder || "",
          accountNumber: data.account_number || "",
          ifsc: data.ifsc_code || "",
          upiId: data.upi_id || "", // Load existing UPI ID
        });
        if (data.qr_url) setPreviewUrl(data.qr_url);
      }
      setFetching(false);
    }
    fetchSingleGateway();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let qrUrl = previewUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `master_qr_${Date.now()}.${fileExt}`;
        const filePath = `qrcodes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-assets")
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("payment-assets")
          .getPublicUrl(filePath);
        
        qrUrl = publicUrlData.publicUrl;
      }

      const payload = {
        id: formData.id || undefined,
        bank_name: formData.bankName,
        account_holder: formData.accountHolder,
        account_number: formData.accountNumber,
        ifsc_code: formData.ifsc,
        upi_id: formData.upiId, // Include UPI ID in payload
        qr_url: qrUrl,
        is_active: true
      };

      const { data, error: upsertError } = await supabase
        .from("payment_gateways")
        .upsert(payload)
        .select()
        .single();

      if (upsertError) throw upsertError;

      setFormData(prev => ({ ...prev, id: data.id }));
      toast.success("Master Ledger Synchronized Successfully");
    } catch (error: any) {
      toast.error(error.message || "Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-brand-blue p-6 lg:p-20 selection:bg-brand-gold/30">
      <Toaster position="bottom-center" />
      
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <header className="mb-20">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-8"
          >
            <ArrowLeft size={14} className="text-brand-gold" /> Protocol Return
          </button>
          <h1 className="text-4xl lg:text-4xl font-black tracking-tighter uppercase leading-[0.8] mb-4">
            Payment <span className="text-brand-gold">BAnk Deatils.</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-12 bg-brand-gold" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Single Source Settlement Logic</p>
          </div>
        </header>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT: QR & IDENTITY */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-2xl shadow-brand-blue/5">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue/40 flex items-center gap-2">
                    <QrCode size={16} className="text-brand-gold" /> Visual Protocol
                  </h2>
               </div>

              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-brand-gold hover:bg-white transition-all group overflow-hidden relative"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full p-10">
                    <img src={previewUrl} alt="QR" className="w-full h-full object-contain mix-blend-multiply animate-in fade-in duration-700" />
                    <div className="absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white p-6 text-center">
                       <RefreshCw className="animate-spin-slow mb-4" size={32} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Update QR Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={40} className="text-slate-200 group-hover:text-brand-gold mb-6 transition-colors" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Upload Merchant QR</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
              </div>
            </div>

            <div className="p-10 bg-brand-gold/5 rounded-[3rem] border border-brand-gold/10 flex gap-6 items-start">
               <ShieldCheck className="text-brand-gold flex-shrink-0" size={24} />
               <p className="text-[11px] text-brand-blue/70 leading-relaxed font-bold uppercase tracking-tight">
                Warning: Modifying this ledger will re-route all incoming capital. 
                Ensure account credentials match the QR identity exactly.
               </p>
            </div>
          </div>

          {/* RIGHT: DATA LOGIC */}
          <div className="lg:col-span-7">
            <div className="bg-brand-blue text-white rounded-[5rem] p-14 lg:p-20 shadow-2xl relative overflow-hidden">
               {/* Decorative Background Element */}
               <div className="absolute -top-20 -right-20 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px]" />

               <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-gold">Core Credentials</span>
                    <div className="h-[1px] flex-1 bg-white/10" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                    {/* UPI ID - Highlighted Field */}
                    <div className="md:col-span-2 space-y-4">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">UPI Identifier</label>
                      <div className="relative">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" size={18} />
                        <input 
                          name="upiId"
                          value={formData.upiId}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border-2 border-white/10 rounded-3xl py-6 pl-16 pr-8 text-sm font-black tracking-widest focus:border-brand-gold outline-none transition-all uppercase placeholder:text-white/5"
                          placeholder="merchant@upi"
                        />
                      </div>
                    </div>

                    {[
                      { label: "Account Holder", name: "accountHolder", placeholder: "FULL LEGAL NAME" },
                      { label: "Bank Entity", name: "bankName", placeholder: "e.g. ICICI BANK" },
                      { label: "Serial Number", name: "accountNumber", placeholder: "0000 0000 0000" },
                      { label: "IFSC Code", name: "ifsc", placeholder: "XXXX0001234" }
                    ].map((f) => (
                      <div key={f.name} className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">{f.label}</label>
                        <input 
                          name={f.name}
                          value={formData[f.name as keyof typeof formData] || ""}
                          onChange={handleInputChange}
                          autoComplete="off"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-xs font-black tracking-widest focus:border-brand-gold outline-none transition-all uppercase placeholder:text-white/5"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Secure Sync</span>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full md:w-auto bg-brand-gold text-brand-blue px-16 py-6 rounded-full font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-brand-gold/20"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Update Ledger</>}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}