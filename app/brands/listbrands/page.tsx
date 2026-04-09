"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Brand {
  id: number;
  name_en: string;
  image_url: string | null;
  status?: boolean;
}

export default function BrandList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [requireNewImage, setRequireNewImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    let query = supabase.from("brands").select("*");
    if (search.trim()) query = query.ilike("name_en", `%${search}%`);
    const { data, error } = await query.order("id", { ascending: false });
    
    if (error) toast.error("Failed to fetch brands");
    else setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const toggleStatus = async (brand: Brand) => {
    const { error } = await supabase
      .from("brands")
      .update({ status: !brand.status })
      .eq("id", brand.id);
    
    if (error) toast.error("Status update failed");
    else {
      toast.success("Status updated");
      setBrands(brands.map(b => b.id === brand.id ? { ...b, status: !b.status } : b));
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`CAUTION: Deleting "${brand.name_en}" will remove it from all linked products. Continue?`)) return;

    setLoading(true);
    try {
      if (brand.image_url && brand.image_url.includes("supabase.co")) {
        try {
          const parts = brand.image_url.split("/");
          const fileName = parts[parts.length - 1].split("?")[0];
          if (fileName) {
            await supabase.storage.from("brand-images").remove([fileName]);
          }
        } catch (storageErr) {
          console.warn("Storage cleanup failed:", storageErr);
        }
      }

      const { error } = await supabase.from("brands").delete().eq("id", brand.id);

      if (error) {
        if (error.code === '23503') throw new Error("Linked to active products.");
        throw error;
      }

      toast.success("Identity Purged");
      setBrands(prev => prev.filter(b => b.id !== brand.id));
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setNameInput(brand.name_en || "");
    setImageFile(null);
    setRequireNewImage(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedBrand || !nameInput.trim()) return toast.error("Name required");

    setSaving(true);
    let updatedData: any = { name_en: nameInput.trim() };

    if ((requireNewImage || imageFile) && selectedBrand.image_url) {
      const path = selectedBrand.image_url.split("/").pop()?.split("?")[0];
      if (path) await supabase.storage.from("brand-images").remove([path]);
      if (!imageFile) updatedData.image_url = null;
    }

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filename = `brand_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("brand-images").upload(filename, imageFile);

      if (uploadError) {
        setSaving(false);
        return toast.error("Upload failed");
      }

      const { data } = supabase.storage.from("brand-images").getPublicUrl(filename);
      updatedData.image_url = `${data?.publicUrl}?v=${Date.now()}`;
    }

    const { error } = await supabase.from("brands").update(updatedData).eq("id", selectedBrand.id);

    if (error) {
      toast.error("Update failed");
    } else {
      toast.success("Changes saved");
      fetchBrands();
      setIsModalOpen(false);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white">
      <Toaster 
        toastOptions={{
          style: { background: '#2b2652', color: '#c4a174', border: '1px solid #c4a174' }
        }} 
        position="bottom-right" 
      />
      
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#c4a174] rounded-full animate-pulse shadow-[0_0_8px_rgba(196,161,116,0.6)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Inventory Nexus</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none text-[#2b2652]">
              Brand <span className="text-[#c4a174] italic">Assets</span>
            </h1>
          </div>
          
          <Link href="/brands/newbrands">
            <button className="h-16 px-10 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#c4a174] hover:text-[#2b2652] transition-all flex items-center gap-4 group shadow-2xl shadow-[#2b2652]/20 active:scale-95">
              <Plus className="w-4 h-4" /> 
              Add Registry 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-10">
          <div className="md:col-span-10 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#c4a174] transition-colors" />
            <input
              type="text"
              placeholder="SEARCH IDENTITIES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBrands()}
              className="w-full h-16 pl-14 pr-8 bg-white border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-[#c4a174]/5 focus:border-[#c4a174] text-xs font-black uppercase tracking-widest transition-all shadow-sm"
            />
          </div>

          <button className="md:col-span-2 h-16 bg-white text-slate-400 border border-slate-100 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:border-[#2b2652] hover:text-[#2b2652] transition-all flex items-center justify-center gap-3 shadow-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#2b2652]/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Index</th>
                <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Asset</th>
                <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Visibility</th>
                <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-40 text-center">
                    <Loader2 className="w-10 h-10 text-[#c4a174] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-40 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
                    Registry Empty
                  </td>
                </tr>
              ) : (
                brands.map((brand, index) => (
                  <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8 text-[10px] font-black text-[#c4a174] opacity-50 tracking-widest">
                      #{(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 relative rounded-2xl border border-slate-100 bg-white p-2.5 overflow-hidden group-hover:border-[#c4a174] transition-all shadow-sm">
                          {brand.image_url ? (
                            <Image src={brand.image_url} alt="" fill className="object-contain" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                              <ImageIcon className="w-5 h-5 text-slate-200" />
                            </div>
                          )}
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight text-[#2b2652] group-hover:translate-x-1 transition-transform inline-block">
                          {brand.name_en}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => toggleStatus(brand)}
                        className={`w-14 h-7 rounded-full transition-all duration-500 relative shadow-inner ${brand.status ? 'bg-[#2b2652]' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1.5 w-4 h-4 rounded-full transition-all duration-500 ${brand.status ? 'left-8 bg-[#c4a174] shadow-[0_0_10px_rgba(196,161,116,0.8)]' : 'left-1.5 bg-white'}`} />
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => openEditModal(brand)}
                          className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-100 text-slate-400 hover:border-[#2b2652] hover:text-[#2b2652] hover:bg-white transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand)}
                          className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-100 text-slate-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && selectedBrand && (
        <div className="fixed inset-0 bg-[#2b2652]/40 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white border border-white/20 rounded-[3rem] w-full max-w-xl shadow-[0_30px_100px_-20px_rgba(43,38,82,0.3)] overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-black text-[#2b2652] uppercase tracking-[0.4em]">Asset Reconfiguration</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#2b2652]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-12 space-y-10">
              <div className="flex flex-col items-center gap-8">
                <div className="relative group">
                  <div className="w-44 h-44 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:border-[#c4a174] transition-all duration-500 shadow-inner">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-contain p-6" />
                    ) : selectedBrand.image_url && !requireNewImage ? (
                      <img src={selectedBrand.image_url} className="w-full h-full object-contain p-6" />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-slate-200" />
                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">New Visual</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedBrand.image_url && !requireNewImage && (
                    <button
                      onClick={() => { setRequireNewImage(true); setImageFile(null); }}
                      className="absolute -top-3 -right-3 bg-[#2b2652] text-[#c4a174] w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {requireNewImage && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Upload Source</label>
                  <input
                    type="file"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-[10px] font-black text-slate-400 file:mr-6 file:py-4 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#2b2652] file:text-[#c4a174] hover:file:bg-[#c4a174] hover:file:text-[#2b2652] transition-all cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Identity Specification</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full h-16 px-8 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:border-[#c4a174] focus:ring-4 focus:ring-[#c4a174]/5 focus:bg-white text-xs font-black uppercase tracking-widest transition-all"
                  placeholder="IDENTIFIER NAME"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 hover:text-[#2b2652] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] h-16 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#c4a174] hover:text-[#2b2652] shadow-xl shadow-[#2b2652]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Commit Protocol
                </button>
              </div>
            </div>
            
            <div className="bg-[#2b2652] p-8 flex items-start gap-5">
              <div className="w-10 h-10 rounded-xl bg-[#c4a174]/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-[#c4a174]" />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                <span className="text-[#c4a174]">Network Warning:</span> Modifying these parameters will trigger an instant metadata refresh across all decentralized product nodes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}