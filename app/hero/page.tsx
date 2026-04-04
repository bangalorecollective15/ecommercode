"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  PencilIcon, 
  Trash, 
  Plus, 
  X, 
  Image as ImageIcon, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  UploadCloud
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Hero {
  id: string;
  images: string[];
  active: boolean;
  created_at: string;
}

export default function HeroSettings() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [totalHeroes, setTotalHeroes] = useState(0);

  const fetchHeroes = async () => {
    const { data, count, error } = await supabase
      .from("hero_section")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) toast.error("Failed to fetch heroes");
    else {
      setHeroes(data || []);
      setTotalHeroes(count || 0);
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, [page]);

  const openCreateModal = () => {
    setSelectedHero({
      id: "",
      images: [],
      active: true,
      created_at: new Date().toISOString(),
    });
  };

  const saveHero = async () => {
    if (!selectedHero || selectedHero.images.length === 0) {
      return toast.error("Please upload at least one image");
    }
    setLoading(true);

    try {
      // If setting this one to active, deactivate others
      if (selectedHero.active) {
        await supabase
          .from("hero_section")
          .update({ active: false })
          .neq("id", selectedHero.id || '00000000-0000-0000-0000-000000000000');
      }

      if (selectedHero.id) {
        await supabase
          .from("hero_section")
          .update({ images: selectedHero.images, active: selectedHero.active })
          .eq("id", selectedHero.id);
        toast.success("Slider updated!");
      } else {
        await supabase.from("hero_section").insert({
          images: selectedHero.images,
          active: selectedHero.active,
        });
        toast.success("New slider created!");
      }

      fetchHeroes();
      setSelectedHero(null);
    } catch (err) {
      toast.error("Error saving slider");
    } finally {
      setLoading(false);
    }
  };

  const deleteHero = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("hero_section").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted successfully");
      fetchHeroes();
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!selectedHero) return;
    setUploading(true);
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      urls.push(base64);
    }

    setSelectedHero({ ...selectedHero, images: [...selectedHero.images, ...urls] });
    setUploading(false);
  };

  const removeImage = (index: number) => {
    if (!selectedHero) return;
    setSelectedHero({ 
      ...selectedHero, 
      images: selectedHero.images.filter((_, i) => i !== index) 
    });
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 space-y-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blacktracking-tight">Hero Management</h1>
          <p className="text-gray-500">Update and organize your homepage banner sliders.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blacktext-white rounded-xl font-bold hover:bg-blackshadow-lg shadow-black transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New Slider
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Slider Gallery</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {heroes.map((hero) => (
                <tr key={hero.id} className="hover:bg-orange-50/20 transition">
                  <td className="px-6 py-4">
                    <div className="flex gap-2 overflow-hidden">
                      {hero.images.slice(0, 4).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          className="w-14 h-10 object-cover rounded-lg border border-gray-100 shadow-sm"
                        />
                      ))}
                      {hero.images.length > 4 && (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400">
                          +{hero.images.length - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {hero.active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedHero(hero)} className="p-2 text-gray-400 hover:text-blacktransition">
                        <PencilIcon size={18} />
                      </button>
                      <button onClick={() => { setDeleteId(hero.id); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-red-600 transition">
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30 hover:shadow-sm transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Page {page} / {Math.ceil(totalHeroes / pageSize) || 1}
          </span>
          <button 
            disabled={page >= Math.ceil(totalHeroes / pageSize)} 
            onClick={() => setPage(p => p + 1)}
            className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30 hover:shadow-sm transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {selectedHero && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                  {selectedHero.id ? "Edit Slider" : "New Slider"}
                </h3>
                <p className="text-xs text-gray-500">Manage images and visibility for this slider.</p>
              </div>
              <button onClick={() => setSelectedHero(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Upload Grid */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tight">Slider Images</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedHero.images.map((img, i) => (
                    <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-all text-gray-400 hover:text-orange-600">
                    <UploadCloud size={28} />
                    <span className="text-[10px] font-bold uppercase mt-1">Upload</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files!)} />
                  </label>
                </div>
                {uploading && <p className="text-blacktext-[10px] font-bold animate-pulse">Processing images...</p>}
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-800">Active Status</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Show this slider on the homepage</p>
                </div>
                <button
                  onClick={() => setSelectedHero({ ...selectedHero, active: !selectedHero.active })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${selectedHero.active ? 'bg-orange-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${selectedHero.active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={saveHero}
                disabled={loading}
                className="flex-1 py-4 bg-blacktext-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blackshadow-lg shadow-black transition-all disabled:opacity-50"
              >
                {loading ? "Processing..." : "Save Configuration"}
              </button>
              <button
                onClick={() => setSelectedHero(null)}
                className="px-8 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={28} />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Delete Slider?</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium ">
              "This action is permanent and will remove these images from your carousel."
            </p>
            <div className="flex gap-3">
              <button onClick={deleteHero} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">
                Delete
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}