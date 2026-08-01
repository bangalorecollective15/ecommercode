"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  UploadCloud, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon, 
  FileText, 
  Sparkles 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AboutTopAdmin() {
  const [longDescription, setLongDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAboutTopData();
  }, []);

  const fetchAboutTopData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_info")
        .select("long_description, top_image_url")
        .eq("id", 1)
        .single();

      if (data && !error) {
        setLongDescription(data.long_description || "");
        setImageUrl(data.top_image_url || null);
      }
    } catch (err) {
      console.error("Error loading site data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    setStatusMessage(null);

    try {
      // Create a clean unique filename for the single top section asset
      const fileExt = file.name.split(".").pop();
      const fileName = `about_top_hero.${fileExt}`;
      const filePath = `hero/${fileName}`;

      // Upload file directly to your 'site-assets' storage bucket (upsert replaces if exists)
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

      // Instantly cache the new URL in component state
      setImageUrl(urlData.publicUrl);
      setStatusMessage({ type: "success", text: "Image uploaded! Click 'Save Changes' to publish live." });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
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
          long_description: longDescription,
          top_image_url: imageUrl
        })
        .eq("id", 1);

      if (error) throw error;
      setStatusMessage({ type: "success", text: "About Us Top Section updated successfully!" });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `Update failed: ${error.message}` });
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
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- HEADER BANNER --- */}
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
            ABOUT US: <span className="text-[#8a6d3b]">TOP SECTION</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Configure your brand's primary presentation imagery and long-form narrative parameters
          </p>
        </div>

        {/* --- STATUS BAR --- */}
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

        {/* --- EDITOR PANEL CONTENT WORKSPACE --- */}
        <form onSubmit={handleSaveChanges} className="bg-white/80 backdrop-blur-xl border border-white rounded-[3rem] p-8 md:p-12 shadow-xl space-y-10">
          
          {/* 1. HERO IMAGE COMPONENT WORKSPACE */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-[#8a6d3b]" /> Hero Presentation Image
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Image Preview Canvas Slot */}
              <div className="md:col-span-7 relative group aspect-[16/9] bg-slate-100 rounded-[2rem] border border-slate-200/60 overflow-hidden flex items-center justify-center shadow-inner">
                {imageUrl ? (
                  <>
                    <img 
                      src={imageUrl} 
                      alt="Top Hero Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                      <p className="text-white text-xs font-black uppercase tracking-widest">Live Active Image</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-400 space-y-1">
                    <ImageIcon className="mx-auto text-slate-300" size={32} />
                    <p className="text-xs font-bold uppercase tracking-wider">No Hero Image Configured</p>
                  </div>
                )}
              </div>

              {/* Upload Interaction Trigger Box */}
              <div className="md:col-span-5">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 px-4 border-2 border-dashed border-slate-200 hover:border-[#8a6d3b] rounded-[2rem] bg-white transition-all flex flex-col items-center justify-center gap-3 text-center group cursor-pointer hover:shadow-md"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin text-[#8a6d3b]" size={24} />
                  ) : (
                    <UploadCloud className="text-slate-400 group-hover:text-[#8a6d3b] transition-colors" size={28} />
                  )}
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {imageUrl ? "Replace Image" : "Upload Image"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Supports PNG, JPG, or WebP</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 2. TEXT AREA LONG DESCRIPTION PARAMETER SLOT */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} className="text-[#8a6d3b]" /> About Us Long Description
            </label>
            <textarea
              required
              rows={5}
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Enter the primary branding narrative story or manifesto sequence profile summary text..."
              className="w-full bg-slate-50 border border-slate-200/60 rounded-[2rem] px-6 py-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#8a6d3b]/10 focus:bg-white transition-all resize-none leading-relaxed text-slate-700 shadow-inner"
            />
          </div>

          {/* --- COMMIT CHANGES SUBMIT TRIGGER ROW --- */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading}
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