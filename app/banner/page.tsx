"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Trash, Pencil, Plus, X, CheckCircle2, Megaphone, AlertCircle, ChevronLeft, ChevronRight, Palette } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Banner {
  id: string;
  title: string;
  bg_color: string;
  text_color: string;
  active: boolean;
  created_at: string;
}

export default function BannerSettings() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [totalBanners, setTotalBanners] = useState(0);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("banner")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setBanners(data || []);
      if (count !== null) setTotalBanners(count);
    } catch (err) {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page]);

  const saveBanner = async () => {
    if (!selectedBanner || !selectedBanner.title.trim()) {
      return toast.error("Please provide a banner title");
    }

    setLoading(true);
    try {
      if (selectedBanner.id) {
        const { error } = await supabase
          .from("banner")
          .update({
            title: selectedBanner.title,
            bg_color: selectedBanner.bg_color,
            text_color: selectedBanner.text_color,
            active: selectedBanner.active,
          })
          .eq("id", selectedBanner.id);

        if (error) throw error;
        toast.success("Banner updated!");
      } else {
        const { error } = await supabase.from("banner").insert({
          title: selectedBanner.title,
          bg_color: selectedBanner.bg_color,
          text_color: selectedBanner.text_color,
          active: selectedBanner.active,
        });

        if (error) throw error;
        toast.success("Banner created!");
      }
      fetchBanners();
      setSelectedBanner(null);
    } catch (err) {
      toast.error("Error saving banner");
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("banner").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Banner removed");
      fetchBanners();
    } catch (err) {
      toast.error("Failed to delete");
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#FBFBFC] space-y-10 selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
              <Megaphone className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Marketing & Promotions</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-[#2b2652]">
            Banner <span className="text-[#c4a174] italic">Ads</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">Configure promotional text alerts for the global site header.</p>
        </div>

        <button
          onClick={() => setSelectedBanner({ id: "", title: "", bg_color: "#2b2652", text_color: "#c4a174", active: true, created_at: "" })}
          className="group flex items-center gap-3 px-8 py-4 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 active:scale-95"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          Create New Alert
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-50 text-slate-400 text-[9px] uppercase tracking-[0.3em] font-black">
              <tr>
                <th className="px-10 py-7">Preview & Title</th>
                <th className="px-10 py-7">Color DNA</th>
                <th className="px-10 py-7 text-center">Market Status</th>
                <th className="px-10 py-7 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {banners.map((banner) => (
                <tr key={banner.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div 
                        className="w-12 h-7 rounded-lg border border-slate-200 shadow-sm shrink-0" 
                        style={{ backgroundColor: banner.bg_color }}
                      />
                      <span className="font-black text-sm text-[#2b2652] uppercase tracking-tight group-hover:text-[#c4a174] transition-colors line-clamp-1">
                        {banner.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex gap-2">
                      <div className="text-[9px] font-black px-3 py-1 rounded-md bg-[#2b2652] text-white tracking-widest">BG: {banner.bg_color}</div>
                      <div className="text-[9px] font-black px-3 py-1 rounded-md bg-[#c4a174] text-[#2b2652] tracking-widest uppercase">TX: {banner.text_color}</div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <div className="flex justify-center">
                      {banner.active ? (
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c4a174]/10 text-[#c4a174] border border-[#c4a174]/20 rounded-full text-[9px] font-black tracking-widest">
                          <CheckCircle2 size={12} /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[9px] font-black tracking-widest uppercase">
                          ARCHIVED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedBanner(banner)} className="p-3 bg-white border border-slate-100 text-[#2b2652] rounded-xl hover:text-[#c4a174] hover:border-[#c4a174] transition-all shadow-sm">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => { setDeleteId(banner.id); setShowDeleteModal(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-10 py-8 bg-slate-50/5 flex items-center justify-between border-t border-slate-50">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-3 bg-white rounded-xl border border-slate-100 text-[#2b2652] disabled:opacity-20 hover:border-[#c4a174] transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            REGISTRY {page} <span className="text-[#c4a174]">/</span> {Math.ceil(totalBanners / pageSize) || 1}
          </span>
          <button 
            disabled={page >= Math.ceil(totalBanners / pageSize)} 
            onClick={() => setPage(p => p + 1)}
            className="p-3 bg-white rounded-xl border border-slate-100 text-[#2b2652] disabled:opacity-20 hover:border-[#c4a174] transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* POPUP MODAL FORM */}
      {selectedBanner && (
        <div className="fixed inset-0 bg-[#2b2652]/60 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-[#FBFBFC]">
              <div>
                <span className="text-[#c4a174] text-[9px] font-black uppercase tracking-[0.4em]">UI Customizer</span>
                <h3 className="text-3xl font-black text-[#2b2652] tracking-tighter uppercase mt-1">
                  {selectedBanner.id ? "Edit Alert" : "New Alert"}
                </h3>
              </div>
              <button onClick={() => setSelectedBanner(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-10 space-y-10">
              {/* Live Preview Card */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em] ml-1">Live Asset Preview</label>
                <div 
                  className="w-full h-20 rounded-[1.5rem] flex items-center justify-center px-8 text-center font-black uppercase tracking-widest text-xs shadow-2xl transition-all duration-500 border-4 border-white"
                  style={{ backgroundColor: selectedBanner.bg_color, color: selectedBanner.text_color }}
                >
                  {selectedBanner.title || "Your Promotional Message Here"}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Banner Content</label>
                  <input
                    type="text"
                    placeholder="ENTER PROMOTION TITLE..."
                    className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#c4a174]/30 font-black text-[#2b2652] uppercase text-[11px] tracking-widest outline-none transition-all"
                    value={selectedBanner.title}
                    onChange={(e) => setSelectedBanner({ ...selectedBanner, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Background</label>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <input
                        type="color"
                        className="w-10 h-10 rounded-lg cursor-pointer overflow-hidden border-none bg-transparent"
                        value={selectedBanner.bg_color}
                        onChange={(e) => setSelectedBanner({ ...selectedBanner, bg_color: e.target.value })}
                      />
                      <span className="text-[10px] font-black font-mono text-[#2b2652]">{selectedBanner.bg_color}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Text Color DNA</label>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <input
                        type="color"
                        className="w-10 h-10 rounded-lg cursor-pointer overflow-hidden border-none bg-transparent"
                        value={selectedBanner.text_color}
                        onChange={(e) => setSelectedBanner({ ...selectedBanner, text_color: e.target.value })}
                      />
                      <span className="text-[10px] font-black font-mono text-[#2b2652]">{selectedBanner.text_color}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-[#2b2652] rounded-[1.8rem] shadow-xl shadow-[#2b2652]/10">
                  <div className="leading-tight">
                    <span className="text-[10px] font-black text-[#c4a174] uppercase tracking-widest">Visibility Status</span>
                    <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-1">Global Header Display</p>
                  </div>
                  <button
                    onClick={() => setSelectedBanner({ ...selectedBanner, active: !selectedBanner.active })}
                    className={`w-14 h-7 rounded-full transition-all relative ${selectedBanner.active ? 'bg-[#c4a174]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${selectedBanner.active ? 'left-8 bg-[#2b2652]' : 'left-1 bg-white/40'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-[#FBFBFC] border-t border-slate-50 flex gap-4">
              <button
                onClick={saveBanner}
                disabled={loading}
                className="flex-[2] py-5 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 disabled:opacity-50"
              >
                {loading ? "Synchronizing..." : "Publish Banner"}
              </button>
              <button
                onClick={() => setSelectedBanner(null)}
                className="flex-1 py-5 bg-white border border-slate-100 text-[#2b2652] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter mb-2">Delete Alert?</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">
              "This action will permanently remove the promotional asset from the store registry."
            </p>
            <div className="flex gap-4">
              <button onClick={deleteBanner} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200">Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}