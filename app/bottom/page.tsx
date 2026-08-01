"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Save, Layers, CheckCircle2, Image as ImageIcon, Upload } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminBottomSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form State matching row values
  const [formData, setFormData] = useState({
    live_badge: "",
    live_title: "",
    live_image_url: "",
    live_quote: "",
    stat1_value: "",
    stat1_label: "",
    stat2_value: "",
    stat2_label: "",
    stat3_value: "",
    stat3_label: "",
    stat4_value: "",
    stat4_label: "",
  });

  // Pull existing row parameters
  useEffect(() => {
    const fetchBottomData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("site_info")
          .select("live_badge, live_title, live_image_url, live_quote, stat1_value, stat1_label, stat2_value, stat2_label, stat3_value, stat3_label, stat4_value, stat4_label")
          .eq("id", 1)
          .single();

        if (data && !error) {
          setFormData(data);
        }
      } catch (err) {
        console.error("Error reading site_info content definitions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBottomData();
  }, []);

  // Save changes to single master row
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("site_info")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      setSuccessMessage("Bottom gallery and matrix synchronized successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Error updating parameters:", err);
      alert(err.message || "Error submitting content metadata alterations");
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
        
        {/* Header Module */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-8 mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest mb-1">
              <Layers size={14} /> Global Row Management Panel
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
              Bottom Sections <span className="text-slate-300"> Editor.</span>
            </h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-4 bg-slate-900 hover:bg-amber-600 text-white rounded-full font-bold text-[11px] tracking-widest uppercase transition-all shadow-md flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={14} />}
            Save Configuration Changes
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* SECTION 1: EDITORIAL COPY */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 md:p-10 shadow-sm space-y-6">
            <h2 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase border-b border-slate-100 pb-3 mb-4">
              1. Editorial Branding Copy Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput 
                label="Section Accent Badge Tag" 
                value={formData.live_badge} 
                onChange={(v) => setFormData({ ...formData, live_badge: v })} 
              />
              <FormInput 
                label="Glass Overlay Quote Text" 
                value={formData.live_quote} 
                onChange={(v) => setFormData({ ...formData, live_quote: v })} 
              />
            </div>

            <FormTextArea 
              label="Main Header Title (Supports \n Line-breaks)" 
              value={formData.live_title} 
              onChange={(v) => setFormData({ ...formData, live_title: v })} 
            />
          </div>

          {/* SECTION 2: SHOWCASE VISUAL ASSETS */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 md:p-10 shadow-sm space-y-6">
            <h2 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase border-b border-slate-100 pb-3 mb-4">
              2. Showcase Visual Cover Media
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-3 aspect-[4/3] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                {formData.live_image_url ? (
                  <img src={formData.live_image_url} className="w-full h-full object-cover" alt="Cover Preview" />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
                <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Live Cover</span>
              </div>
              <div className="md:col-span-9">
                <FormImageUploader 
                  label="Direct Resource Target URL / Upload Asset" 
                  value={formData.live_image_url} 
                  onChange={(v) => setFormData({ ...formData, live_image_url: v })} 
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PERFORMANCE METRICS DATA MATRIX */}
          <div className="space-y-6">
            <h2 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase ml-2">
              3. Performance Metrics Data Matrix Blocks
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Stat Card 1 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Slot 1 - Audience Reach Metrics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Stat 1 Value" value={formData.stat1_value} onChange={(v) => setFormData({ ...formData, stat1_value: v })} />
                  <FormInput label="Stat 1 Label" value={formData.stat1_label} onChange={(v) => setFormData({ ...formData, stat1_label: v })} />
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Slot 2 - Build Benchmarks
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Stat 2 Value" value={formData.stat2_value} onChange={(v) => setFormData({ ...formData, stat2_value: v })} />
                  <FormInput label="Stat 2 Label" value={formData.stat2_label} onChange={(v) => setFormData({ ...formData, stat2_label: v })} />
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Slot 3 - Tier Classification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Stat 3 Value" value={formData.stat3_value} onChange={(v) => setFormData({ ...formData, stat3_value: v })} />
                  <FormInput label="Stat 3 Label" value={formData.stat3_label} onChange={(v) => setFormData({ ...formData, stat3_label: v })} />
                </div>
              </div>

              {/* Stat Card 4 */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Slot 4 - Logistics Reach
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Stat 4 Value" value={formData.stat4_value} onChange={(v) => setFormData({ ...formData, stat4_value: v })} />
                  <FormInput label="Stat 4 Label" value={formData.stat4_label} onChange={(v) => setFormData({ ...formData, stat4_label: v })} />
                </div>
              </div>

            </div>
          </div>

          {/* Form Action Footer */}
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

/* Helper Components mirroring the target design pattern */

function FormInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1 w-full">
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
    <div className="space-y-1 w-full">
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

function FormImageUploader({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `live_${Date.now()}.${fileExt}`;
      const filePath = `middle-section/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

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