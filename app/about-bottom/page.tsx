"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  UploadCloud, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon, 
  Type, 
  Sparkles 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AboutBottomAdmin() {
  const [bottomTitle, setBottomTitle] = useState("");
  const [imageUrl1, setImageUrl1] = useState<string | null>(null);
  const [imageUrl2, setImageUrl2] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAboutBottomData();
  }, []);

  const fetchAboutBottomData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_info")
        .select("bottom_title, bottom_image_url_1, bottom_image_url_2")
        .eq("id", 1)
        .single();

      if (data && !error) {
        setBottomTitle(data.bottom_title || "Simply Timeless.");
        setImageUrl1(data.bottom_image_url_1 || null);
        setImageUrl2(data.bottom_image_url_2 || null);
      }
    } catch (err) {
      console.error("Error loading bottom section elements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageSlot: 1 | 2) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (imageSlot === 1) setUploading1(true);
    else setUploading2(true);
    setStatusMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `about_bottom_img_${imageSlot}.${fileExt}`;
      const filePath = `bottom/${fileName}`;

      // Upload or replace image directly inside the site-assets bucket
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

      if (imageSlot === 1) setImageUrl1(urlData.publicUrl);
      else setImageUrl2(urlData.publicUrl);

      setStatusMessage({ type: "success", text: `Image ${imageSlot} uploaded temporarily! Click save to publish live.` });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `Upload block failure: ${error.message}` });
    } finally {
      setUploading1(false);
      setUploading2(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("site_info")
        .update({
          bottom_title: bottomTitle,
          bottom_image_url_1: imageUrl1,
          bottom_image_url_2: imageUrl2
        })
        .eq("id", 1);

      if (error) throw error;
      setStatusMessage({ type: "success", text: "About Us Bottom Gallery section customized successfully!" });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `Database mutation failure: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#8a6d3b]" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- HEADER TITLE --- */}
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
            ABOUT US: <span className="text-[#8a6d3b]">BOTTOM GALLERY</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Configure layout grid variables, editorial titles, and promotional images
          </p>
        </div>

        {/* --- STATUS BANNER FEEDBACK --- */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold shadow-sm transition-all ${
            statusMessage.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            <CheckCircle2 size={18} className={statusMessage.type === "success" ? "text-emerald-500" : "text-rose-500"} />
            <p>{statusMessage.text}</p>
          </div>
        )}

        {/* --- WORKSPACE CORE EDITOR --- */}
        <form onSubmit={handleSaveChanges} className="bg-white/80 backdrop-blur-xl border border-white rounded-[3rem] p-8 md:p-12 shadow-xl space-y-10">
          
          {/* 1. TITLE CONTROLLER MATRIX */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} className="text-[#8a6d3b]" /> Gallery Display Title
            </label>
            <input
              type="text"
              required
              value={bottomTitle}
              onChange={(e) => setBottomTitle(e.target.value)}
              placeholder="e.g., Simply Timeless."
              className="w-full bg-slate-50 border border-slate-200/60 rounded-full px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#8a6d3b]/10 focus:bg-white transition-all text-slate-800 shadow-inner"
            />
          </div>

          {/* 2. DUAL IMAGE SECTIONS SELECTION ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            
            {/* COLUMN COMPONENT A: GALLERY IMAGE ONE */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} className="text-[#8a6d3b]" /> Grid Asset Slot 1 (Large Panel)
              </label>

              <div className="relative aspect-[4/3] bg-slate-100 rounded-[2rem] border border-slate-200/60 overflow-hidden flex items-center justify-center group shadow-inner">
                {imageUrl1 ? (
                  <img src={imageUrl1} alt="Large Panel Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-300 text-xs font-bold uppercase tracking-wider">No Image Array Selected</div>
                )}
              </div>

              <input type="file" ref={fileInputRef1} onChange={(e) => handleImageUpload(e, 1)} accept="image/*" className="hidden" />
              <button
                type="button"
                disabled={uploading1}
                onClick={() => fileInputRef1.current?.click()}
                className="w-full py-4 px-4 bg-white border border-slate-200 hover:border-[#8a6d3b] rounded-full text-xs font-black uppercase tracking-widest text-slate-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {uploading1 ? <Loader2 className="animate-spin text-[#8a6d3b]" size={14} /> : <UploadCloud size={14} />}
                Upload Image 1
              </button>
            </div>

            {/* COLUMN COMPONENT B: GALLERY IMAGE TWO */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} className="text-[#8a6d3b]" /> Grid Asset Slot 2 (Square Panel)
              </label>

              <div className="relative aspect-[4/3] bg-slate-100 rounded-[2rem] border border-slate-200/60 overflow-hidden flex items-center justify-center group shadow-inner">
                {imageUrl2 ? (
                  <img src={imageUrl2} alt="Square Panel Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-300 text-xs font-bold uppercase tracking-wider">No Image Array Selected</div>
                )}
              </div>

              <input type="file" ref={fileInputRef2} onChange={(e) => handleImageUpload(e, 2)} accept="image/*" className="hidden" />
              <button
                type="button"
                disabled={uploading2}
                onClick={() => fileInputRef2.current?.click()}
                className="w-full py-4 px-4 bg-white border border-slate-200 hover:border-[#8a6d3b] rounded-full text-xs font-black uppercase tracking-widest text-slate-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {uploading2 ? <Loader2 className="animate-spin text-[#8a6d3b]" size={14} /> : <UploadCloud size={14} />}
                Upload Image 2
              </button>
            </div>

          </div>

          {/* --- SAVE DISPATCH SUBMIT ROW --- */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading1 || uploading2}
              className="px-8 py-4 bg-gradient-to-r from-[#c4a174] to-[#8a6d3b] text-white rounded-full font-black text-xs uppercase tracking-[0.25em] shadow-lg shadow-[#8a6d3b]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none group"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Save Changes 
                  <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}