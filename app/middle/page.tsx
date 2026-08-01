"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Save, Layers, CheckCircle2, Image as ImageIcon, Upload } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MiddleSectionAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    middle_badge: "",
    middle_title: "",
    middle_description: "",
    cat1_title: "",
    cat1_description: "",
    cat1_image_url: "",
    cat2_title: "",
    cat2_description: "",
    cat2_image_url: "",
    cat3_title: "",
    cat3_description: "",
    cat3_image_url: "",
  });

  useEffect(() => {
    const fetchCurrentData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("site_info")
          .select("middle_badge, middle_title, middle_description, cat1_title, cat1_description, cat1_image_url, cat2_title, cat2_description, cat2_image_url, cat3_title, cat3_description, cat3_image_url")
          .eq("id", 1)
          .single();

        if (data && !error) {
          setFormData(data);
        }
      } catch (err) {
        console.error("Failed loading configurations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentData();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("site_info")
        .update({
          middle_badge: formData.middle_badge,
          middle_title: formData.middle_title,
          middle_description: formData.middle_description,
          cat1_title: formData.cat1_title,
          cat1_description: formData.cat1_description,
          cat1_image_url: formData.cat1_image_url,
          cat2_title: formData.cat2_title,
          cat2_description: formData.cat2_description,
          cat2_image_url: formData.cat2_image_url,
          cat3_title: formData.cat3_title,
          cat3_description: formData.cat3_description,
          cat3_image_url: formData.cat3_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (!error) {
        setSuccessMessage("Changes saved successfully directly to site_info matrix!");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Error updates parameters:", err);
      alert("Failed updating records.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-amber-600" size={32} />
          <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase">Connecting to Site Info Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto px-6 pt-16">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-8 mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest mb-1">
              <Layers size={14} /> Global Row Management Panel
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
              Middle Section <span className="text-slate-300">Editor</span>
            </h1>
          </div>
          <button
            onClick={handleFormSubmit}
            disabled={saving}
            className="px-8 py-4 bg-slate-900 hover:bg-amber-600 text-white rounded-full font-bold text-[11px] tracking-widest uppercase transition-all shadow-md flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={14} />}
            Save Changes
          </button>
        </div>

        {successMessage && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-12">
          
          {/* HEADER PARAMETERS */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 md:p-10 shadow-sm space-y-6">
            <h2 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase border-b border-slate-100 pb-3 mb-4">
              1. Title Layout Text Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Badge Subtitle</label>
                <input
                  type="text"
                  required
                  value={formData.middle_badge || ""}
                  onChange={(e) => setFormData({ ...formData, middle_badge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Main Heading</label>
                <input
                  type="text"
                  required
                  value={formData.middle_title || ""}
                  onChange={(e) => setFormData({ ...formData, middle_title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Main Description Statement</label>
              <textarea
                required
                rows={3}
                value={formData.middle_description || ""}
                onChange={(e) => setFormData({ ...formData, middle_description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-amber-500/5 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* THREE GRID CARDS SETTINGS */}
          <div className="space-y-6">
            <h2 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase ml-2">
              2. Category Showcase Grid Items
            </h2>

            <div className="grid grid-cols-1 gap-8">
              
              {/* CARD SLOT 1 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-3 aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                  {formData.cat1_image_url ? (
                    <img src={formData.cat1_image_url} className="w-full h-full object-cover" alt="Card 1 Preview" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                  <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Slot 1</span>
                </div>
                <div className="md:col-span-9 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormInput label="Card 1 Title" value={formData.cat1_title} onChange={(v) => setFormData({ ...formData, cat1_title: v })} />
                    <FormImageUploader label="Card 1 Image Upload" value={formData.cat1_image_url} onChange={(v) => setFormData({ ...formData, cat1_image_url: v })} />
                  </div>
                  <FormTextArea label="Card 1 Description" value={formData.cat1_description} onChange={(v) => setFormData({ ...formData, cat1_description: v })} />
                </div>
              </div>

              {/* CARD SLOT 2 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-3 aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                  {formData.cat2_image_url ? (
                    <img src={formData.cat2_image_url} className="w-full h-full object-cover" alt="Card 2 Preview" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                  <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Slot 2</span>
                </div>
                <div className="md:col-span-9 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormInput label="Card 2 Title" value={formData.cat2_title} onChange={(v) => setFormData({ ...formData, cat2_title: v })} />
                    <FormImageUploader label="Card 2 Image Upload" value={formData.cat2_image_url} onChange={(v) => setFormData({ ...formData, cat2_image_url: v })} />
                  </div>
                  <FormTextArea label="Card 2 Description" value={formData.cat2_description} onChange={(v) => setFormData({ ...formData, cat2_description: v })} />
                </div>
              </div>

              {/* CARD SLOT 3 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-3 aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                  {formData.cat3_image_url ? (
                    <img src={formData.cat3_image_url} className="w-full h-full object-cover" alt="Card 3 Preview" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                  <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Slot 3</span>
                </div>
                <div className="md:col-span-9 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormInput label="Card 3 Title" value={formData.cat3_title} onChange={(v) => setFormData({ ...formData, cat3_title: v })} />
                    <FormImageUploader label="Card 3 Image Upload" value={formData.cat3_image_url} onChange={(v) => setFormData({ ...formData, cat3_image_url: v })} />
                  </div>
                  <FormTextArea label="Card 3 Description" value={formData.cat3_description} onChange={(v) => setFormData({ ...formData, cat3_description: v })} />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-12 py-5 bg-amber-600 hover:bg-slate-900 text-white rounded-full font-black text-[11px] tracking-[0.25em] uppercase transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={14} />}
              Publish Dynamic Content
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
      <input
        type="text"
        required
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:ring-4 focus:ring-amber-500/5 outline-none transition-all"
      />
    </div>
  );
}

function FormTextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
      <textarea
        required
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:ring-4 focus:ring-amber-500/5 outline-none transition-all resize-none"
      />
    </div>
  );
}

// Custom Built-In Image File Storage Uploader Utility 
function FormImageUploader({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `middle_${Date.now()}.${fileExt}`;
      const filePath = `middle-section/${fileName}`;

      // Uploading image file to 'site-assets' bucket
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // Getting public download web address link
      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

      // Sending link back to master parent state row configuration object 
      onChange(urlData.publicUrl);
    } catch (error: any) {
      console.error("Storage upload failure context:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1 w-full">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />
        <input
          type="text"
          readOnly
          placeholder="Select or upload custom photo file asset..."
          value={value || ""}
          className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 outline-none truncate"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors shrink-0 flex items-center gap-2 min-w-[120px] justify-center disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <>
              <Upload size={12} />
              Choose File
            </>
          )}
        </button>
      </div>
    </div>
  );
}