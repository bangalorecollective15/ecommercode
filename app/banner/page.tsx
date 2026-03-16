"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Trash, Pencil, Plus, X, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Palette } from "lucide-react";

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
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 space-y-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight">Banner Ads</h1>
          <p className="text-gray-500">Manage promotional text banners for your site header.</p>
        </div>
        <button
          onClick={() => setSelectedBanner({ id: "", title: "", bg_color: "#ea580c", text_color: "#ffffff", active: true, created_at: "" })}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New Banner
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Preview & Title</th>
                <th className="px-6 py-4">Colors</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-orange-50/20 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-6 rounded border shadow-sm shrink-0" 
                        style={{ backgroundColor: banner.bg_color }}
                      />
                      <span className="font-semibold text-gray-800 line-clamp-1">{banner.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">BG: {banner.bg_color}</div>
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">TX: {banner.text_color}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {banner.active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedBanner(banner)} className="p-2 text-gray-400 hover:text-orange-600 transition">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => { setDeleteId(banner.id); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-red-600 transition">
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
        <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30 hover:shadow-sm transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Page {page} / {Math.ceil(totalBanners / pageSize) || 1}
          </span>
          <button 
            disabled={page >= Math.ceil(totalBanners / pageSize)} 
            onClick={() => setPage(p => p + 1)}
            className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30 hover:shadow-sm transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* POPUP MODAL FORM */}
      {selectedBanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <Palette className="text-orange-600" />
                {selectedBanner.id ? "Edit Banner" : "New Banner"}
              </h3>
              <button onClick={() => setSelectedBanner(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Live Preview Card */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Live Preview</label>
                <div 
                  className="w-full h-16 rounded-2xl flex items-center justify-center px-6 text-center font-bold shadow-inner transition-colors duration-300"
                  style={{ backgroundColor: selectedBanner.bg_color, color: selectedBanner.text_color }}
                >
                  {selectedBanner.title || "Your Banner Text Here"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Banner Text</label>
                  <input
                    type="text"
                    placeholder="Enter promotion title..."
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-orange-500 outline-none transition font-medium"
                    value={selectedBanner.title}
                    onChange={(e) => setSelectedBanner({ ...selectedBanner, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Background</label>
                    <div className="flex items-center gap-2 border-2 border-gray-100 p-2 rounded-xl">
                      <input
                        type="color"
                        className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-none"
                        value={selectedBanner.bg_color}
                        onChange={(e) => setSelectedBanner({ ...selectedBanner, bg_color: e.target.value })}
                      />
                      <span className="text-xs font-mono uppercase text-gray-500">{selectedBanner.bg_color}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Text Color</label>
                    <div className="flex items-center gap-2 border-2 border-gray-100 p-2 rounded-xl">
                      <input
                        type="color"
                        className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-none"
                        value={selectedBanner.text_color}
                        onChange={(e) => setSelectedBanner({ ...selectedBanner, text_color: e.target.value })}
                      />
                      <span className="text-xs font-mono uppercase text-gray-500">{selectedBanner.text_color}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-sm font-bold text-gray-700 uppercase">Visible on site</span>
                  <button
                    onClick={() => setSelectedBanner({ ...selectedBanner, active: !selectedBanner.active })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${selectedBanner.active ? 'bg-orange-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${selectedBanner.active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={saveBanner}
                disabled={loading}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 shadow-lg shadow-orange-100 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Banner"}
              </button>
              <button
                onClick={() => setSelectedBanner(null)}
                className="px-8 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Delete Banner?</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium ">"Once removed, this banner text will no longer be available."</p>
            <div className="flex gap-3">
              <button onClick={deleteBanner} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Keep it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}