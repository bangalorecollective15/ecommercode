"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Upload, X, CheckCircle2, AlertCircle, RefreshCcw, LayoutPanelLeft, ShieldCheck, Globe } from "lucide-react";
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
    <div className="max-w-8xl mx-auto p-6 md:p-12 min-h-screen">
      <Toaster position="top-center" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Brand Registry</h2>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">New Asset Onboarding</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
          <Globe size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Directory v4.0</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* FORM COLUMN */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-10">
            <div className="space-y-8">

              {/* BRAND NAME */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Brand Identity (EN)
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  placeholder="e.g. BALENCIAGA"
                  className={`w-full px-6 py-4 rounded-2xl border text-sm font-bold tracking-tight transition-all outline-none 
                    ${errors.brandName ? "border-red-500 ring-4 ring-red-50" : "border-slate-100 bg-slate-50 focus:bg-white focus:border-black focus:ring-4 focus:ring-slate-100"}`}
                />
                {errors.brandName && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ml-1">
                    <AlertCircle className="w-3 h-3" /> {errors.brandName}
                  </p>
                )}
              </div>

              {/* ALT TEXT */}


              {/* IMAGE UPLOAD */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Logo Asset (1:1)
                </label>
                <div className="relative group">
                  <label className={`group border-2 border-dashed rounded-3xl w-full h-56 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                    ${imageFile ? "bg-slate-50 border-black" : "bg-slate-50 border-slate-200 hover:border-black hover:bg-white"}`}>

                    {imageFile ? (
                      <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-white">
                        <Image
                          src={URL.createObjectURL(imageFile)}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={(e) => { e.preventDefault(); setImageFile(null); }}
                          className="absolute top-2 right-2 bg-black text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center group-hover:scale-105 transition-transform duration-300">
                        <div className="mx-auto w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                          <Upload className="text-slate-900 w-6 h-6" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-900">Upload Visual</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">SVG, PNG or JPG (Max 2MB)</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-50">
                <button
                  onClick={handleReset}
                  className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-black transition-all flex items-center gap-2"
                >
                  <RefreshCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-10 py-4 rounded-2xl bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-slate-200 disabled:opacity-30 transition-all flex items-center gap-2"
                >
                  {loading ? "Processing..." : (
                    <> <CheckCircle2 className="w-4 h-4" /> Save Brand </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-32">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Live Render</h3>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              </div>
            </div>

            {/* LUXURY PREVIEW CARD */}
            <div className="bg-slate-950 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 w-full aspect-square flex items-center justify-center mb-8 overflow-hidden relative group">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-white/20 flex flex-col items-center gap-4">
                    <LayoutPanelLeft className="w-16 h-16 stroke-[1]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Asset</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 w-full">
                <h4 className="text-white text-3xl font-black uppercase tracking-[0.1em] truncate px-4">
                  {form.brandName || "NO NAME"}
                </h4>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-[1px] w-8 bg-white/20"></div>
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">
                    Verified Brand
                  </p>
                  <div className="h-[1px] w-8 bg-white/20"></div>
                </div>
              </div>
            </div>

            {/* TIPS */}
            <div className="mt-8 bg-white border border-slate-100 rounded-3xl p-6">
              <h5 className="text-black font-black text-[10px] tracking-[0.2em] flex items-center gap-2 mb-4 uppercase">
                <AlertCircle className="w-3 h-3" /> System Requirements
              </h5>
              <div className="space-y-4">
                {[
                  "Visuals must be high-contrast for modern UI rendering.",
                  "Square aspect ratios are preferred for grid consistency.",
                  "Transparent backgrounds (PNG/SVG) are recommended."
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                    <p className="text-slate-500 text-[11px] font-bold leading-relaxed">{tip}</p>
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