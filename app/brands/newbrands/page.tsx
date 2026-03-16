"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Upload, X, CheckCircle2, AlertCircle, RefreshCcw, LayoutPanelLeft } from "lucide-react";
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
    if (!form.altText.trim()) newErrors.altText = "Alt text is required.";
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
          contentType: imageFile.type, // Explicitly set the content type
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
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <Toaster />

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-600 rounded-xl">
          <LayoutPanelLeft className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Brand Management</h2>
          <p className="text-gray-500 text-sm">Create and register new brands for your store.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="space-y-6">

            {/* BRAND NAME */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Brand Name (English)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                //      placeholder="Ex: Samsung, Apple, LUX"
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-4 ${errors.brandName ? "border-red-500 focus:ring-red-50 dark:focus:ring-red-900/10" : "border-gray-200 focus:ring-blue-50 focus:border-orange-600"
                  }`}
              />
              {errors.brandName && (
                <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.brandName}</p>
              )}
            </div>

            {/* ALT TEXT */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Image SEO Alt Text *</label>
              <input
                type="text"
                value={form.altText}
                onChange={(e) => setForm({ ...form, altText: e.target.value })}
                //     placeholder="Ex: Official Logo of Samsung"
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-4 ${errors.altText ? "border-red-500 focus:ring-red-50" : "border-gray-200 focus:ring-blue-50 focus:border-orange-600"
                  }`}
              />
              {errors.altText && (
                <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.altText}</p>
              )}
            </div>

            {/* IMAGE UPLOAD AREA */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Brand Asset (1:1 Ratio)</label>
              <div className="relative group">
                <label className={`border-2 border-dashed rounded-2xl w-full h-48 flex flex-col items-center justify-center cursor-pointer transition-all ${imageFile ? "bg-gray-50 border-blue-400" : "bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-white"
                  }`}>
                  {imageFile ? (
                    <div className="relative w-32 h-32 shadow-lg rounded-lg overflow-hidden border-4 border-white">
                      <Image
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={(e) => { e.preventDefault(); setImageFile(null); }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <Upload className="text-orange-600 w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click to upload brand logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or JPEG (Max. 2MB)</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                </label>
              </div>
              {errors.image && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.image}</p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
              >
                {loading ? "Registering..." : (
                  <> <CheckCircle2 className="w-4 h-4" /> Submit Brand </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Live Preview</h3>
          <div className="bg-orange-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-blue-100">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 w-full aspect-square flex items-center justify-center mb-4 overflow-hidden shadow-inner">
              {imageFile ? (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg drop-shadow-2xl"
                />
              ) : (
                <div className="text-white/40  flex flex-col items-center gap-2">
                  <LayoutPanelLeft className="w-12 h-12 opacity-20" />
                  <span>Logo will appear here</span>
                </div>
              )}
            </div>
            <h4 className="text-white text-2xl font-black uppercase tracking-widest truncate w-full">
              {form.brandName || "Brand Name"}
            </h4>
            <p className="text-white/70 text-xs mt-2 font-medium tracking-tighter ">
              {form.altText ? `SEO: ${form.altText}` : "Alt text preview"}
            </p>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <h5 className="text-orange-800 font-bold text-xs flex items-center gap-2 mb-2 uppercase">
              <AlertCircle className="w-3 h-3" /> Quick Tips
            </h5>
            <ul className="text-orange-700 text-[11px] space-y-2 list-disc pl-4">
              <li>Use transparent PNGs for the best look in dark mode.</li>
              <li>Ensure logos are square (1:1) to prevent stretching.</li>
              <li>Names are case-insensitive when checking for duplicates.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}