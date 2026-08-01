"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Fingerprint, 
  Target, 
  FileText 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AboutIdentityAdminPage() {
  const [identityTitle, setIdentityTitle] = useState("");
  const [identityDescription, setIdentityDescription] = useState("");
  const [missionDescription, setMissionDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchIdentityData();
  }, []);

  const fetchIdentityData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_info")
        .select("identity_title, identity_description, mission_description")
        .eq("id", 1)
        .single();

      if (data && !error) {
        // Set state values or fallback on design defaults gracefully if empty inside DB row
        setIdentityTitle(data.identity_title || "Quality Reimagined.");
        setIdentityDescription(data.identity_description || "We are more than a destination—we are curators. Every piece in our collection is a testament to thoughtful design and urban sophistication.");
        setMissionDescription(data.mission_description || "To elevate daily living through collections that balance global trends with local reliability.");
      }
    } catch (err) {
      console.error("Error connecting with core metadata rows:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("site_info")
        .update({
          identity_title: identityTitle,
          identity_description: identityDescription,
          mission_description: missionDescription
        })
        .eq("id", 1);

      if (error) throw error;
      setStatusMessage({ type: "success", text: "Identity parameters updated and pushed live!" });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `Matrix synchronizer error: ${error.message}` });
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
        
        {/* --- HEADER TITLE BANNER --- */}
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
            IDENTITY & <span className="text-[#8a6d3b]">MISSION SETTINGS</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Configure your brand value descriptions, copy text arrays, and manifesto statements
          </p>
        </div>

        {/* --- DYNAMIC OPERATION ALERTS BAR --- */}
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

        {/* --- WORKSPACE PANEL --- */}
        <form onSubmit={handleSaveIdentity} className="bg-white/80 backdrop-blur-xl border border-white rounded-[3rem] p-8 md:p-12 shadow-xl space-y-8">
          
          {/* Section A: Brand Identity Core Block */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Fingerprint className="text-[#8a6d3b]" size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">1. Brand Identity Copy</h2>
            </div>

            {/* Title Property Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Display Title</label>
              <input
                type="text"
                required
                value={identityTitle}
                onChange={(e) => setIdentityTitle(e.target.value)}
                placeholder="e.g., Quality Reimagined."
                className="w-full bg-slate-50 border border-slate-200/60 rounded-full px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#8a6d3b]/10 focus:bg-white transition-all text-slate-800 shadow-inner"
              />
            </div>

            {/* Description Property Area Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Core Description text</label>
              <textarea
                required
                rows={4}
                value={identityDescription}
                onChange={(e) => setIdentityDescription(e.target.value)}
                placeholder="Enter narrative segment text details describing identity variables..."
                className="w-full bg-slate-50 border border-slate-200/60 rounded-[2rem] px-6 py-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#8a6d3b]/10 focus:bg-white transition-all resize-none leading-relaxed text-slate-700 shadow-inner"
              />
            </div>
          </div>

          {/* Section B: Operational Mission Block */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="text-[#8a6d3b]" size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">2. Operational Mission Statement</h2>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Copy Content Text</label>
              <textarea
                required
                rows={4}
                value={missionDescription}
                onChange={(e) => setMissionDescription(e.target.value)}
                placeholder="Enter your enterprise mission parameters here..."
                className="w-full bg-slate-50 border border-slate-200/60 rounded-[2rem] px-6 py-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#8a6d3b]/10 focus:bg-white transition-all resize-none leading-relaxed text-slate-700 shadow-inner"
              />
            </div>
          </div>

          {/* --- SUBMIT TRIGGER CONTROL --- */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-[#c4a174] to-[#8a6d3b] text-white rounded-full font-black text-xs uppercase tracking-[0.25em] shadow-lg shadow-[#8a6d3b]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none group"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Publish Settings 
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