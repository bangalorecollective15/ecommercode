"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  QrCode, Upload, Building2, User, Hash, MapPin, 
  ArrowLeft, Save, Loader2, Trash2, CheckCircle2, Eye
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
// lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// This is the "Named Export" the error is looking for
export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function UPIScannerSetup() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    branch: ""
  });

  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  // 1. FETCH DATA ON LOAD
  useEffect(() => {
    fetchGateways();
  }, []);

  async function fetchGateways() {
    const { data, error } = await supabase
      .from("payment_gateways")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) toast.error("Error loading gateways");
    else setSavedAccounts(data || []);
  }

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

  // 2. SAVE TO SUPABASE (IMAGE + DATA)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountNumber) {
      return toast.error("Please fill in the bank details");
    }

    setLoading(true);
    try {
      let qrUrl = "";

      // A. Upload Image if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `qrcodes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-assets") // Ensure this bucket exists in Supabase
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("payment-assets")
          .getPublicUrl(filePath);
        
        qrUrl = publicUrlData.publicUrl;
      }

      // B. Insert into payment_gateways table
      const { error: insertError } = await supabase
        .from("payment_gateways")
        .insert([{
          bank_name: formData.bankName,
          account_holder: formData.accountHolder,
          account_number: formData.accountNumber,
          ifsc_code: formData.ifsc,
          branch_name: formData.branch,
          qr_url: qrUrl,
          is_active: true
        }]);

      if (insertError) throw insertError;

      toast.success("Gateway Deployed to Supabase");
      setFormData({ bankName: "", accountHolder: "", accountNumber: "", ifsc: "", branch: "" });
      setPreviewUrl(null);
      setSelectedFile(null);
      fetchGateways(); // Refresh table
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // 3. DELETE FROM SUPABASE
  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("payment_gateways")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Could not delete record");
    } else {
      setSavedAccounts(savedAccounts.filter(acc => acc.id !== id));
      toast.success("Gateway Removed");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black p-6 lg:p-12 font-sans selection:bg-black selection:text-white">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="space-y-2">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-black transition-all text-[10px] font-black uppercase tracking-widest">
              <ArrowLeft size={14} /> Hub Dashboard
            </button>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Payment Setup
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-8 shadow-sm">
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <QrCode size={16} className="text-gray-400" /> Merchant QR
                </h2>
              <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50/50 transition-all group overflow-hidden relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="QR" className="w-full h-full object-contain p-6" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-gray-200 group-hover:text-black transition-all" />
                    <p className="text-[9px] font-black uppercase mt-4 tracking-widest text-gray-400">Scan & Upload</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-black text-white rounded-[3.5rem] p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 italic text-emerald-400">Settlement Logic</h2>
                  <div className="px-4 py-1 border border-white/20 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-500">Cloud Sync Active</div>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSave}>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Bank Name</label>
                    <input name="bankName" value={formData.bankName} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[11px] font-black focus:border-emerald-400 focus:outline-none transition-all uppercase" placeholder="HDFC / ICICI" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Account Holder</label>
                    <input name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[11px] font-black focus:border-emerald-400 focus:outline-none transition-all uppercase" placeholder="ENTER NAME" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Account Number</label>
                    <input name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[11px] font-black focus:border-emerald-400 focus:outline-none transition-all" placeholder="XXXX XXXX XXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">IFSC Code</label>
                    <input name="ifsc" value={formData.ifsc} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[11px] font-black focus:border-emerald-400 focus:outline-none transition-all uppercase" placeholder="HDFC000123" />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button type="submit" disabled={loading} className="bg-emerald-500 text-black px-12 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-2">
                      {loading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Sync to Database</>}
                    </button>
                  </div>
                </form>
            </div>
          </div>

          <div className="lg:col-span-12 mt-10">
            <div className="bg-white border-2 border-gray-100 rounded-[3.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Live Cloud Data</span>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400">Scanner</th>
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400">Bank Entity</th>
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400">Credentials</th>
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {savedAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-8">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center p-2 group relative overflow-hidden">
                               {acc.qr_url ? (
                                  <img src={acc.qr_url} alt="QR" className="w-full h-full object-contain" />
                               ) : <QrCode className="text-gray-300" size={20} />}
                            </div>
                          </td>
                          <td className="p-8">
                            <p className="text-[12px] font-black uppercase italic tracking-tighter">{acc.bank_name}</p>
                          </td>
                          <td className="p-8">
                            <p className="text-[11px] font-black font-mono">{acc.account_number}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 italic">{acc.ifsc_code}</p>
                          </td>
                          <td className="p-8 text-right">
                             <button onClick={() => deleteAccount(acc.id)} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}