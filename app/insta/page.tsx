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
  <div className="p-6 md:p-10 min-h-screen bg-[#FBFBFC] space-y-10 selection:bg-[#c4a174] selection:text-white">
    <Toaster position="top-right" />

    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
            <Instagram className="text-[#c4a174] w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Social Integration</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-[#2b2652]">
          Instagram <span className="text-[#c4a174] italic">Feed</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm">Curate your social presence on the homepage wall.</p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="group flex items-center gap-3 px-8 py-4 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 active:scale-95"
      >
        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        Add Social Link
      </button>
    </div>

    {/* Table Section */}
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-50 text-slate-400 text-[9px] uppercase tracking-[0.3em] font-black">
            <tr>
              <th className="px-10 py-7">Source Asset URL</th>
              <th className="px-10 py-7 text-center">Feed Visibility</th>
              <th className="px-10 py-7 text-right">Registry Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && links.length === 0 ? (
              <tr><td colSpan={3} className="px-10 py-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Feed...</td></tr>
            ) : links.length === 0 ? (
              <tr><td colSpan={3} className="px-10 py-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No media assets connected.</td></tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-[#2b2652] text-[#c4a174] rounded-xl shadow-lg shadow-[#2b2652]/10">
                        <Link2 size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#2b2652] uppercase tracking-tight line-clamp-1">{link.url}</span>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] text-[#c4a174] font-black uppercase flex items-center gap-1 hover:text-[#2b2652] transition-colors mt-1 tracking-widest"
                        >
                          Verify on Platform <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex justify-center">
                      {link.published ? (
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c4a174]/10 text-[#c4a174] border border-[#c4a174]/20 rounded-full text-[9px] font-black tracking-widest uppercase">
                          <CheckCircle2 size={12} /> LIVE ON WALL
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[9px] font-black tracking-widest uppercase">
                          STAGED / HIDDEN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(link)} className="p-3 bg-white border border-slate-100 text-[#2b2652] rounded-xl hover:text-[#c4a174] hover:border-[#c4a174] transition-all shadow-sm">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => { setDeleteId(link.id); setShowDeleteModal(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
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
      <div className="fixed inset-0 bg-[#2b2652]/60 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-[#FBFBFC]">
            <div>
              <span className="text-[#c4a174] text-[9px] font-black uppercase tracking-[0.4em]">Resource Connector</span>
              <h3 className="text-3xl font-black text-[#2b2652] tracking-tighter uppercase mt-1">
                {editId ? "Update Asset" : "New Post"}
              </h3>
            </div>
            <button onClick={closeModal} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="p-10 space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em] ml-1">Instagram Media URL</label>
              <div className="relative group">
                <Instagram className="absolute left-5 top-5 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={20} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full bg-slate-50 border-none p-5 pl-14 rounded-2xl focus:ring-2 focus:ring-[#c4a174]/30 outline-none transition font-bold text-sm text-[#2b2652]"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-1">Supports Reels, Professional Posts, and IGTV</p>
            </div>

            <div className="flex items-center justify-between p-6 bg-[#2b2652] rounded-[1.8rem] shadow-xl shadow-[#2b2652]/10 border border-[#2b2652]">
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[#c4a174] uppercase tracking-widest">Visibility Status</p>
                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-1">Render on Social Wall</p>
              </div>
              <button
                onClick={() => setPublished(!published)}
                className={`w-14 h-7 rounded-full transition-all relative ${published ? 'bg-[#c4a174]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full transition-all shadow-md ${published ? 'left-8 bg-[#2b2652]' : 'left-1 bg-white/40'}`} />
              </button>
            </div>
          </div>

          <div className="p-10 bg-[#FBFBFC] border-t border-slate-50 flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-5 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 disabled:opacity-50"
            >
              {loading ? "Processing..." : editId ? "Update Registry" : "Save to Feed"}
            </button>
            <button
              onClick={closeModal}
              className="flex-1 py-5 bg-white border border-slate-100 text-[#2b2652] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* DELETE MODAL */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter mb-2">Remove Asset?</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">
            "This post will be purged from your social registry instantly."
          </p>
          <div className="flex gap-4">
            <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100">Purge</button>
            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95">Retain</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}