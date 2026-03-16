"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Trash, 
  Pencil, 
  Plus, 
  X, 
  CheckCircle2, 
  UploadCloud, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  BellRing
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NotificationBanner {
  id: string;
  image_url: string;
  active: boolean;
  created_at: string;
}

export default function NotificationBannerSettings() {
  const [banners, setBanners] = useState<NotificationBanner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<NotificationBanner | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(banners.length / itemsPerPage) || 1;
  const paginatedData = banners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_banner")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadstart = () => setUploading(true);
    reader.onload = () => {
      const fullDataUrl = reader.result as string;
      setSelectedBanner(prev => ({
        ...(prev || { id: "", active: true, created_at: new Date().toISOString() }),
        image_url: fullDataUrl,
      }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const saveBanner = async () => {
    if (!selectedBanner?.image_url) return toast.error("Please upload an image");
    setLoading(true);

    try {
      if (selectedBanner.id) {
        const { error } = await supabase
          .from("notification_banner")
          .update({ image_url: selectedBanner.image_url, active: selectedBanner.active })
          .eq("id", selectedBanner.id);
        if (error) throw error;
        toast.success("Banner updated!");
      } else {
        const { error } = await supabase.from("notification_banner").insert({
          image_url: selectedBanner.image_url,
          active: selectedBanner.active,
        });
        if (error) throw error;
        toast.success("Banner created!");
      }
      fetchBanners();
      setSelectedBanner(null);
    } catch (err) {
      toast.error("Failed to save banner");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const { error } = await supabase.from("notification_banner").delete().eq("id", deleteId);
    if (error) toast.error("Delete failed");
    else {
      toast.success("Banner deleted");
      fetchBanners();
    }
    setShowDeleteModal(false);
    setDeleteId(null);
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 space-y-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight flex items-center gap-2">
             Notification Banners
          </h1>
          <p className="text-gray-500 font-medium">Manage promotional and alert banners for your users.</p>
        </div>
        <button
          onClick={() => setSelectedBanner({ id: "", image_url: "", active: true, created_at: "" })}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New Banner
        </button>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedData.map(banner => (
          <div key={banner.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative aspect-[21/9] bg-gray-100">
              {banner.image_url ? (
                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><UploadCloud /></div>
              )}
              <div className="absolute top-3 right-3">
                {banner.active ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    <CheckCircle2 size={10} /> Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-white">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Added {new Date(banner.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setSelectedBanner(banner)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">
                  <Pencil size={18} />
                </button>
                <button onClick={() => { setDeleteId(banner.id); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(p => p - 1)}
          className="p-2 bg-white rounded-xl border border-gray-200 disabled:opacity-30 hover:shadow-sm transition"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-black text-gray-500 uppercase tracking-widest">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          disabled={currentPage === totalPages} 
          onClick={() => setCurrentPage(p => p + 1)}
          className="p-2 bg-white rounded-xl border border-gray-200 disabled:opacity-30 hover:shadow-sm transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* CREATE/EDIT MODAL */}
      {selectedBanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <BellRing className="text-orange-600" />
                {selectedBanner.id ? "Edit Banner" : "New Notification"}
              </h3>
              <button onClick={() => setSelectedBanner(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Image Upload Area */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Banner Artwork</label>
                {selectedBanner.image_url ? (
                  <div className="relative group aspect-[21/9] rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
                    <img src={selectedBanner.image_url} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold gap-2">
                      <UploadCloud size={20} /> Change Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                ) : (
                  <label className="aspect-[21/9] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-400 hover:text-orange-600 group">
                    <div className="bg-gray-50 p-4 rounded-full group-hover:bg-orange-100 transition-colors">
                      <UploadCloud size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase mt-3 tracking-tighter">Click to upload banner</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
                {uploading && <p className="text-orange-600 text-[10px] font-bold animate-pulse uppercase tracking-widest text-center">Reading file data...</p>}
              </div>

              {/* Toggle Status */}
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Active Status</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Toggle visibility on the storefront</p>
                </div>
                <button
                  onClick={() => setSelectedBanner({ ...selectedBanner, active: !selectedBanner.active })}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${selectedBanner.active ? 'bg-orange-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${selectedBanner.active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={saveBanner}
                disabled={loading}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Deploy Banner"}
              </button>
              <button
                onClick={() => setSelectedBanner(null)}
                className="px-8 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Delete Banner?</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium ">"This action will permanently remove this banner from your site records."</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition active:scale-95">Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Keep</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}