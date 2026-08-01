"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Megaphone, 
  Pencil, 
  X, 
  Loader2,
  Type,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Banner {
  id: string;
  title: string | null;
  text_color: string | null;
  active: boolean | null;
  created_at: string;
}

export default function BannerSettings() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchBanner = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("banner")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Failed to fetch banner settings");
    } else {
      setBanner(data || null);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  const openForm = () => {
    if (banner) {
      setEditingBanner({ ...banner });
    } else {
      setEditingBanner({
        id: "",
        title: "",
        text_color: "#000000",
        active: true,
        created_at: new Date().toISOString(),
      });
    }
  };

  const saveBanner = async () => {
    if (!editingBanner) return;
    setLoading(true);

    try {
      if (banner && banner.id) {
        const { error } = await supabase
          .from("banner")
          .update({
            title: editingBanner.title,
            text_color: editingBanner.text_color,
            active: editingBanner.active,
          })
          .eq("id", banner.id);

        if (error) throw error;
        toast.success("Banner updated successfully");
      } else {
        const { error } = await supabase.from("banner").insert({
          title: editingBanner.title,
          text_color: editingBanner.text_color,
          active: editingBanner.active,
        });

        if (error) throw error;
        toast.success("Banner created successfully");
      }

      fetchBanner();
      setEditingBanner(null);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async () => {
    if (!banner) return;
    const newStatus = !banner.active;

    const { error } = await supabase
      .from("banner")
      .update({ active: newStatus })
      .eq("id", banner.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(newStatus ? "Banner activated successfully" : "Banner hidden successfully");
      setBanner({ ...banner, active: newStatus });
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
      <Toaster position="top-center" />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
              <Megaphone className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Header Management Protocol</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Site <span className="text-[#c4a174] italic">Banner</span>
          </h1>
        </div>

        {!banner && !fetching && (
          <button
            onClick={openForm}
            className="h-14 px-8 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition-all flex items-center gap-3 shadow-xl shadow-[#2b2652]/10 active:scale-95 group"
          >
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            Configure Banner
          </button>
        )}
      </div>

      {/* Main Dashboard Panel */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
        {fetching ? (
          <div className="py-32 text-center">
            <Loader2 className="w-8 h-8 text-[#c4a174] animate-spin mx-auto" />
          </div>
        ) : banner ? (
          <div>
            {/* Live Interactive Preview */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Live Render Preview</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#c4a174] bg-[#c4a174]/10 px-3 py-1 rounded-full border border-[#c4a174]/20">
                  Single Instance Active
                </span>
              </div>
              <div 
                className="w-full py-4 px-6 rounded-2xl font-bold text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-3 text-center border border-slate-200"
                style={{ 
                  color: banner.text_color || "#000000" 
                }}
              >
                <span className="tracking-wide text-black uppercase font-black">{banner.title || "No announcement text configured."}</span>
              </div>
            </div>

            {/* Properties Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Announcement Configuration</th>
                    <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Palette Tokens</th>
                    <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Visibility Protocol</th>
                    <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="group hover:bg-[#c4a174]/5 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#2b2652] flex items-center justify-center text-[#c4a174] shadow-md group-hover:scale-110 transition-transform">
                          <Megaphone size={20} />
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#2b2652] uppercase tracking-tight">
                            {banner.title || "Untitled Announcement"}
                          </div>
                          <div className="text-[9px] text-slate-400 font-black tracking-widest mt-1 uppercase">
                            Registry Timestamp: {new Date(banner.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          <span className="w-4 h-4 rounded-full border border-slate-200 shadow-inner inline-block" style={{ backgroundColor: banner.text_color || "#000" }}></span>
                          <span>{banner.text_color}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <button 
                        onClick={toggleActiveStatus}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${
                          banner.active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {banner.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {banner.active ? "Published Live" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={openForm}
                          className="h-11 px-6 flex items-center gap-2.5 bg-white border border-slate-200 text-[#2b2652] hover:bg-[#2b2652] hover:text-[#c4a174] hover:border-[#2b2652] rounded-xl transition-all shadow-sm font-black text-[10px] uppercase tracking-widest active:scale-95"
                        >
                          <Pencil size={15} />
                          Modify Banner
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300 shadow-inner">
              <Megaphone size={32} />
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">
                No active banner instances found in storage
              </p>
            </div>
            <div>
              <button
                onClick={openForm}
                className="h-14 px-8 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition-all shadow-xl shadow-[#2b2652]/10 active:scale-95"
              >
                Create Banner Instance
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMPACT & REFINED EDIT / CREATE MODAL */}
      {editingBanner && (
        <div className="fixed inset-0 bg-[#2b2652]/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 my-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[9px] text-[#c4a174] font-black uppercase tracking-[0.25em]">Configuration</span>
                <h3 className="text-lg font-black text-[#2b2652] uppercase tracking-tight mt-0.5">
                  {banner ? "Update Banner" : "New Banner"}
                </h3>
              </div>
              <button 
                onClick={() => setEditingBanner(null)} 
                className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center rounded-xl hover:bg-[#2b2652] hover:text-[#c4a174] hover:border-[#2b2652] transition-all group"
              >
                <X size={16} className="text-slate-400 group-hover:text-inherit" />
              </button>
            </div>

            {/* Modal Body - Compact Spacing */}
            <div className="p-6 space-y-4">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Message</label>
                <div className="relative group">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={16} />
                  <input
                    type="text"
                    value={editingBanner.title || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    placeholder="E.G. 🚀 SPECIAL SALE - 50% OFF"
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-xs uppercase tracking-wider text-[#2b2652]"
                  />
                </div>
              </div>

              {/* Text Color Picker */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Text Color</label>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#c4a174] transition">
                  <input
                    type="color"
                    value={editingBanner.text_color || "#000000"}
                    onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                    className="w-7 h-7 rounded-lg bg-transparent cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={editingBanner.text_color || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                    className="w-full bg-transparent outline-none font-black text-[11px] uppercase text-slate-700"
                  />
                </div>
              </div>

              {/* Status Switcher Row */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black uppercase text-[#2b2652] tracking-widest">Active State</span>
                <button
                  type="button"
                  onClick={() => setEditingBanner({ ...editingBanner, active: !editingBanner.active })}
                  className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${editingBanner.active ? 'bg-[#2b2652]' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${editingBanner.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Live Mini Preview Box */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Instant Preview</label>
                <div 
                  className="w-full py-3 px-3 rounded-xl text-center font-bold text-[11px] shadow-sm truncate uppercase tracking-wider border border-slate-200"
                  style={{ 
                    color: editingBanner.text_color || "#000000" 
                  }}
                >
                  {editingBanner.title || "Preview Announcement"}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-3">
              <button
                onClick={saveBanner}
                disabled={loading}
                className="flex-[2] h-12 bg-[#2b2652] text-[#c4a174] rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#c4a174] hover:text-[#2b2652] shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
              <button
                onClick={() => setEditingBanner(null)}
                className="flex-1 h-12 bg-white text-slate-500 border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-[#2b2652] hover:text-[#2b2652] transition-all"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}