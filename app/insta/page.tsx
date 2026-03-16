"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Trash2, 
  Pencil, 
  Plus, 
  X, 
  Instagram, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Link2
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InstagramLink {
  id: number;
  url: string;
  published: boolean;
}

export default function AdminInstagramLinks() {
  const [links, setLinks] = useState<InstagramLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [url, setUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("instagram_links")
      .select("*")
      .order("id", { ascending: true });
    
    if (error) toast.error("Failed to fetch links");
    else setLinks(data || []);
    setLoading(false);
  };

  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[A-Za-z0-9_\-]+\/?(\?.*)?$/;

  const handleSubmit = async () => {
    if (!url) return toast.error("Instagram URL is required");
    if (!instagramRegex.test(url)) return toast.error("Enter a valid Instagram URL");

    setLoading(true);
    try {
      if (editId) {
        const { error } = await supabase
          .from("instagram_links")
          .update({ url, published })
          .eq("id", editId);
        if (error) throw error;
        toast.success("Link updated successfully");
      } else {
        const { error } = await supabase.from("instagram_links").insert({ url, published });
        if (error) throw error;
        toast.success("New link added");
      }
      closeModal();
      fetchLinks();
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (link: InstagramLink) => {
    setEditId(link.id);
    setUrl(link.url);
    setPublished(link.published);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditId(null);
    setUrl("");
    setPublished(true);
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("instagram_links").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Link removed");
      fetchLinks();
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
          <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight flex items-center gap-2">
            <Instagram size={32} />
            Instagram Feed
          </h1>
          <p className="text-gray-500 font-medium text-sm">Manage the reels and posts visible on your landing page.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add New Link
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <tr>
                <th className="px-8 py-5">Source Link</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && links.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-400 font-medium">Loading feed...</td></tr>
              ) : links.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-400 font-medium">No links added yet.</td></tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="hover:bg-orange-50/20 transition">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                          <Link2 size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 line-clamp-1">{link.url}</span>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            className="text-[10px] text-orange-500 font-black uppercase flex items-center gap-1 hover:underline"
                          >
                            Preview on Instagram <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        {link.published ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                            <CheckCircle2 size={12} /> Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(link)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => { setDeleteId(link.id); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                  {editId ? "Update Link" : "Add New Post"}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">Feed Configuration</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-widest">Instagram URL</label>
                <div className="relative group">
                  <Instagram className="absolute left-4 top-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 pl-12 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition font-medium text-sm"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Supports Reels, Posts, and IGTV</p>
              </div>

              <div className="flex items-center justify-between p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Published</p>
                  <p className="text-[10px] text-orange-600/60 font-black uppercase">Visible to public visitors</p>
                </div>
                <button
                  onClick={() => setPublished(!published)}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${published ? 'bg-orange-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${published ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving..." : editId ? "Update Link" : "Save Link"}
              </button>
              <button
                onClick={closeModal}
                className="px-8 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Delete Link?</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium ">"This post will be removed from your social wall instantly."</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition active:scale-95">Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Keep</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}