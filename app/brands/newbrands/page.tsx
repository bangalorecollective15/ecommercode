"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  LayoutPanelLeft, 
  ShieldCheck, 
  Globe 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddBrand() {
  const [form, setForm] = useState({ brandName: "", altText: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: any = {};
    if (!form.brandName.trim()) newErrors.brandName = "Brand name is required.";
    else if (form.brandName.length < 2) newErrors.brandName = "Too short.";
    if (!imageFile) newErrors.image = "Upload is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("File size exceeds 2MB");
      setImageFile(file);
    }
  };

  const handleReset = () => {
    setForm({ brandName: "", altText: "" });
    setImageFile(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .ilike("name_en", form.brandName)
      .maybeSingle();

    if (existingBrand) {
      setErrors({ ...errors, brandName: "This brand already exists." });
      setLoading(false);
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const fileName = `brands/brand_${Date.now()}.${imageFile.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("brand-images")
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          upsert: false
        });
      if (uploadError) {
        toast.error("Image upload failed");
        setLoading(false);
        return;
      }
      imageUrl = supabase.storage.from("brand-images").getPublicUrl(fileName).data.publicUrl;
    }

    const { error: insertError } = await supabase.from("brands").insert([
      { name_en: form.brandName, alt_text: form.altText, image_url: imageUrl },
    ]);

    if (insertError) {
      toast.error("Database error");
    } else {
      toast.success("Brand registered successfully!");
      handleReset();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-8xl mx-auto p-6 md:p-12 min-h-screen bg-[#FBFBFC] selection:bg-brand-gold selection:text-brand-blue">
      <Toaster position="top-center" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-slate-100 pb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-blue/20">
            <ShieldCheck className="text-brand-gold w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-brand-blue tracking-tighter uppercase leading-none">Brand <span className="text-brand-gold italic">Registry</span></h2>
            <p className="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.3em]">Protocol: Asset Onboarding</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-full border border-slate-100 shadow-sm">
          <Globe size={14} className="text-brand-gold" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Node Directory v4.2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

        {/* FORM COLUMN */}
        <div className="lg:col-span-7 space-y-10">
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 md:p-12 shadow-2xl shadow-brand-blue/5">
            <div className="space-y-10">

              {/* BRAND NAME */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">
                  Brand Identity (EN)
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value.toUpperCase() })}
                  placeholder="e.g. LUXURY ENTITY"
                  className={`w-full px-8 py-5 rounded-[1.5rem] border text-xs font-black tracking-widest transition-all outline-none uppercase
                    ${errors.brandName ? "border-red-500 ring-4 ring-red-50" : "border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5"}`}
                />
                {errors.brandName && (
                  <p className="text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ml-2">
                    <AlertCircle className="w-3 h-3" /> {errors.brandName}
                  </p>
                )}
              </div>

              {/* IMAGE UPLOAD */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">
                  Logo Asset Profile (1:1)
                </label>
                <div className="relative group">
                  <label className={`group border-2 border-dashed rounded-[2.5rem] w-full h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-500
                    ${imageFile ? "bg-slate-50 border-brand-blue shadow-inner" : "bg-slate-50 border-slate-100 hover:border-brand-gold hover:bg-white hover:shadow-xl"}`}>

                    {imageFile ? (
                      <div className="relative w-40 h-40 rounded-3xl overflow-hidden shadow-2xl border-4 border-white animate-in zoom-in duration-500">
                        <Image
                          src={URL.createObjectURL(imageFile)}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={(e) => { e.preventDefault(); setImageFile(null); }}
                          className="absolute top-2 right-2 bg-brand-blue text-brand-gold p-2 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center group-hover:scale-105 transition-transform duration-500">
                        <div className="mx-auto w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-5 border border-slate-100 group-hover:bg-brand-gold transition-colors">
                          <Upload className="text-brand-blue w-7 h-7" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">Initialize Asset</p>
                        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">SVG / PNG (Max 2MB)</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-5 pt-10 border-t border-slate-50">
                <button
                  onClick={handleReset}
                  className="px-8 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 hover:text-brand-blue transition-all flex items-center gap-3 active:scale-95"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-12 py-5 rounded-2xl bg-brand-blue text-brand-gold font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-gold hover:text-brand-blue shadow-2xl shadow-brand-blue/20 disabled:opacity-30 transition-all flex items-center gap-3 active:scale-95"
                >
                  {loading ? "Processing..." : (
                    <> <CheckCircle2 className="w-4 h-4" /> Sync Asset </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW COLUMN */}
        <div className="lg:col-span-5 space-y-8">
          <div className="sticky top-32">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">Live Architecture</h3>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-gold/30"></div>
                <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
              </div>
            </div>

            {/* LUXURY PREVIEW CARD */}
            <div className="bg-brand-blue rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
              {/* Decorative Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px]" />
              
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 w-full aspect-square flex items-center justify-center mb-10 overflow-hidden relative shadow-inner">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 ease-out"
                  />
                ) : (
                  <div className="text-white/10 flex flex-col items-center gap-5">
                    <LayoutPanelLeft className="w-20 h-20 stroke-[1]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Signal Pending</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 w-full relative z-10">
                <h4 className="text-white text-4xl font-black uppercase tracking-tighter truncate px-4 leading-tight italic">
                  {form.brandName || "ENTITY NULL"}
                </h4>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="h-[1px] w-10 bg-brand-gold/20"></div>
                  <p className="text-brand-gold text-[9px] font-black uppercase tracking-[0.4em]">
                    Verified Node
                  </p>
                  <div className="h-[1px] w-10 bg-brand-gold/20"></div>
                </div>
              </div>
            </div>

            {/* REQUIREMENTS */}
            <div className="mt-10 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
              <h5 className="text-brand-blue font-black text-[10px] tracking-[0.3em] flex items-center gap-3 mb-6 uppercase">
                <AlertCircle className="w-4 h-4 text-brand-gold" /> Registry Standards
              </h5>
              <div className="space-y-5">
                {[
                  "Visuals must utilize high-contrast palette for rendering.",
                  "Perfect 1:1 aspect ratio required for grid alignment.",
                  "Transparent SVG/PNG preferred for boutique aesthetic."
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-brand-gold mt-1.5 shrink-0 shadow-[0_0_5px_rgba(196,161,116,0.5)]" />
                    <p className="text-slate-500 text-[11px] font-bold leading-relaxed tracking-tight">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}