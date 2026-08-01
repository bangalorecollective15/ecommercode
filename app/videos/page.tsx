"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Video, Plus, Trash2, Pencil, X, Link as LinkIcon, CheckCircle2,
  PlayCircle, Loader2, AlertTriangle, Package, Upload, Image as ImageIcon
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VideoManagement() {
  const [videos, setVideos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<"video" | "thumbnail" | null>(null);
  const [fetching, setFetching] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setFetching(true);
    const { data: vData } = await supabase.from("videos").select("*, products(name)").order("created_at", { ascending: false });
    const { data: pData } = await supabase.from("products").select("id, name").eq("active", true);
    setVideos(vData || []);
    setProducts(pData || []);
    setFetching(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- REUSABLE UPLOAD HANDLER FOR BOTH VIDEO & THUMBNAIL ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size safety checks
    if (type === "video" && file.size > 50 * 1024 * 1024) {
      return toast.error("Video file is too large. Max 50MB.");
    }
    if (type === "thumbnail" && file.size > 5 * 1024 * 1024) {
      return toast.error("Thumbnail image is too large. Max 5MB.");
    }

    setUploadingField(type);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    // Store videos and thumbnails in logical folder subdirectories
    const filePath = `${type}s/${fileName}`; 

    try {
      // 1. Upload to Supabase Storage Bucket ("videos")
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public Asset URL
      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath);

      // 3. Update the form state based on what field was targeting
      if (type === "video") {
        setSelectedVideo((prev: any) => ({ ...prev, video_url: publicUrl }));
        toast.success("Video file uploaded successfully!");
      } else {
        setSelectedVideo((prev: any) => ({ ...prev, thumbnail_url: publicUrl }));
        toast.success("Thumbnail image uploaded successfully!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingField(null);
    }
  };

  const openForm = (video?: any) => {
    if (video) setSelectedVideo(video);
    else setSelectedVideo({ title: "", video_url: "", thumbnail_url: "", product_id: null, is_active: true });
  };

  const saveVideo = async () => {
    if (!selectedVideo?.title || !selectedVideo?.video_url) return toast.error("Title and Video are required");
    setLoading(true);
    try {
      const payload = {
        title: selectedVideo.title,
        video_url: selectedVideo.video_url,
        thumbnail_url: selectedVideo.thumbnail_url,
        product_id: selectedVideo.product_id,
        is_active: selectedVideo.is_active
      };

      if (selectedVideo.id) {
        await supabase.from("videos").update(payload).eq("id", selectedVideo.id);
      } else {
        await supabase.from("videos").insert(payload);
      }
      fetchData();
      setSelectedVideo(null);
      toast.success("Database updated successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async () => {
    if (!deleteTarget) return;
    await supabase.from("videos").delete().eq("id", deleteTarget.id);
    toast.success("Video removed");
    fetchData();
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] p-6 md:p-10 font-sans">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg">
              <Video className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Media Assets</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Video <span className="text-[#c4a174] italic">Library</span>
          </h1>
        </div>

        <button onClick={() => openForm()} className="h-14 px-8 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition-all flex items-center gap-3 shadow-xl active:scale-95">
          <Plus size={18} /> Upload New Content
        </button>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {fetching ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#c4a174]" /></div>
        ) : videos.map((v) => (
          <div key={v.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl group">
            <div className="aspect-video bg-black relative">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover opacity-80" />
              ) : (
                <video src={v.video_url} className="w-full h-full object-cover opacity-80" muted />
              )}
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <PlayCircle size={48} className="text-white" />
               </div>
            </div>
            <div className="p-8">
              <h3 className="font-black uppercase text-sm tracking-tight mb-2">{v.title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Package size={14} className="text-[#c4a174]" /> Linked: {v.products?.name || "Unlinked"}
              </p>
              <div className="flex gap-3">
                <button onClick={() => openForm(v)} className="flex-1 h-12 border border-slate-100 rounded-xl flex items-center justify-center hover:border-[#c4a174] transition-all"><Pencil size={16} /></button>
                <button onClick={() => setDeleteTarget(v)} className="flex-1 h-12 border border-slate-100 rounded-xl flex items-center justify-center text-red-400 hover:border-red-200 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter">Content Production</h3>
              <button onClick={() => setSelectedVideo(null)}><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="p-10 space-y-6 max-h-[65vh] overflow-y-auto">
              
              {/* VIDEO SOURCE UPLOAD SECTION */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Video Source</label>
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-[#c4a174] hover:bg-[#c4a174]/5 transition-all cursor-pointer group"
                >
                  <input type="file" hidden ref={videoInputRef} accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
                  {uploadingField === "video" ? (
                    <Loader2 className="animate-spin text-[#c4a174]" />
                  ) : selectedVideo.video_url ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="text-green-500 mb-1" size={20} />
                      <span className="text-[10px] font-black text-green-600 uppercase">Video Loaded</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="text-slate-300 group-hover:text-[#c4a174] w-5 h-5" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload video file</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                  <LinkIcon size={14} className="text-slate-400" />
                  <input 
                    className="bg-transparent w-full text-[10px] font-bold text-slate-500 outline-none"
                    placeholder="Or paste video URL here..."
                    value={selectedVideo.video_url || ""}
                    onChange={(e) => setSelectedVideo({...selectedVideo, video_url: e.target.value})}
                  />
                </div>
              </div>

              {/* NEW: THUMBNAIL PHOTO UPLOAD SECTION */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Thumbnail Cover Photo</label>
                <div 
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-[#c4a174] hover:bg-[#c4a174]/5 transition-all cursor-pointer group"
                >
                  <input type="file" hidden ref={thumbnailInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, "thumbnail")} />
                  {uploadingField === "thumbnail" ? (
                    <Loader2 className="animate-spin text-[#c4a174]" />
                  ) : selectedVideo.thumbnail_url ? (
                    <div className="flex flex-col items-center w-full h-full p-2 relative">
                      <img src={selectedVideo.thumbnail_url} alt="Cover Preview" className="w-full h-full object-cover rounded-2xl opacity-40" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <CheckCircle2 className="text-green-500 mb-1" size={20} />
                        <span className="text-[10px] font-black text-green-600 uppercase">Thumbnail Uploaded</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="text-slate-300 group-hover:text-[#c4a174] w-5 h-5" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload thumbnail photo</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                  <LinkIcon size={14} className="text-slate-400" />
                  <input 
                    className="bg-transparent w-full text-[10px] font-bold text-slate-500 outline-none"
                    placeholder="Or paste thumbnail image URL here..."
                    value={selectedVideo.thumbnail_url || ""}
                    onChange={(e) => setSelectedVideo({...selectedVideo, thumbnail_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Title</label>
                <input 
                  value={selectedVideo.title}
                  onChange={(e) => setSelectedVideo({...selectedVideo, title: e.target.value})}
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#c4a174] outline-none font-black text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Link Product</label>
                <select 
                  value={selectedVideo.product_id || ""}
                  onChange={(e) => setSelectedVideo({...selectedVideo, product_id: e.target.value ? Number(e.target.value) : null})}
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase"
                >
                  <option value="">No Product Linked</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t flex gap-4">
              <button onClick={saveVideo} disabled={loading || uploadingField !== null} className="flex-[2] h-16 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl disabled:opacity-50 transition-all">
                {loading ? "Saving..." : "Commit Content"}
              </button>
              <button onClick={() => setSelectedVideo(null)} className="flex-1 h-16 bg-white border rounded-2xl font-black uppercase text-[11px] text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#2b2652]/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-black uppercase mb-8">Delete Asset?</h2>
            <div className="flex gap-4">
              <button onClick={deleteVideo} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px]">Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}