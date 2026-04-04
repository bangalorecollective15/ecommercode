"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
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
    if (!confirm(`Delete ${brand.name_en}?`)) return;

    try {
      if (brand.image_url) {
        const path = brand.image_url.split("/").pop()?.split("?")[0];
        if (path) {
          await supabase.storage.from("brand-images").remove([path]);
        }
      }

      const { error } = await supabase.from("brands").delete().eq("id", brand.id);
      if (error) throw error;

      toast.success("Brand deleted");
      fetchBrands();
    } catch (err: any) {
      toast.error(err.message);
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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">System Inventory</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase">Brand <span className="text-slate-300">Assets</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="h-14 px-8 bg-black text-white rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 group">
              <Plus className="w-4 h-4" /> Add Registry <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-8 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="SEARCH IDENTITIES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBrands()}
              className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:bg-white focus:border-black text-xs font-bold uppercase tracking-widest transition-all"
            />
          </div>
          <button
            onClick={fetchBrands}
            className="md:col-span-2 h-14 bg-slate-100 text-black border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            Apply Filter
          </button>
          <button className="md:col-span-2 h-14 bg-white text-slate-400 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Index</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visibility</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                    <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-slate-300 font-black text-xs uppercase tracking-widest">
                    No records found
                  </td>
                </tr>
              ) : (
                brands.map((brand, index) => (
                  <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 text-xs font-black text-slate-300">#{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 relative rounded-2xl border border-slate-100 bg-white p-2 overflow-hidden group-hover:border-black transition-colors">
                          {brand.image_url ? (
                            <Image src={brand.image_url} alt="" fill className="object-contain" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                              <ImageIcon className="w-4 h-4 text-slate-200" />
                            </div>
                          )}
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight text-slate-900 group-hover:translate-x-1 transition-transform inline-block">
                          {brand.name_en}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleStatus(brand)}
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative ${brand.status ? 'bg-black' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${brand.status ? 'left-7' : 'left-1'}`} />
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(brand)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-black hover:text-black transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-500 transition-all"
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
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-black text-black uppercase tracking-[0.3em]">Modify Asset</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              {/* IMAGE EDITING */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:border-black transition-colors">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-contain p-4" />
                    ) : selectedBrand.image_url && !requireNewImage ? (
                      <img src={selectedBrand.image_url} className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">New Asset</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedBrand.image_url && !requireNewImage && (
                    <button
                      onClick={() => { setRequireNewImage(true); setImageFile(null); }}
                      className="absolute -top-3 -right-3 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {requireNewImage && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Source</label>
                  <input
                    type="file"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-[10px] font-bold text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-black file:text-white hover:file:bg-slate-800 transition-all cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Naming Convention</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:border-black focus:bg-white text-sm font-black uppercase tracking-tight transition-all"
                  placeholder="IDENTITY NAME"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-black transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-14 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Commit Changes
                </button>
              </div>
            </div>
            
            <div className="bg-black p-6 flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tighter">
                Global Database Sync: Updating these parameters will modify all associated product metadata across your storefront instantly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}