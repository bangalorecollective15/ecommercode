"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  PencilIcon, Trash, Plus, X, Layout,
  UploadCloud, Loader2, ImageIcon, Eye, Tag
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Hero {
  id: string;
  images: string[];
  title: string;
  description: string;
  button_text: string;
  lifestyle_tag: string; // New field
  active: boolean;
  created_at: string;
}

interface Attribute {
  id: number;
  name: string;
  type: string;
}

export default function HeroSettings() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<Attribute[]>([]);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [viewHero, setViewHero] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const fetchData = async () => {
    // Fetch Banners
    const { data: heroData } = await supabase
      .from("hero_section")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    
    setHeroes(heroData || []);

    // Fetch Lifestyle Tags from Attributes table
    const { data: attrData } = await supabase
      .from("attributes")
      .select("*")
      .eq("type", "lifestyle_tag");
    
    setLifestyleTags(attrData || []);
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleFileUpload = async (files: FileList) => {
    if (!selectedHero) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hero-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('hero-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      } catch (error: any) {
        toast.error(`Error: ${error.message}`);
      }
    }

    setSelectedHero({ ...selectedHero, images: [...selectedHero.images, ...newUrls] });
    setUploading(false);
  };

  const saveHero = async () => {
    if (!selectedHero || selectedHero.images.length === 0) {
      return toast.error("Please upload at least one image");
    }
    setLoading(true);

    try {
      const payload = {
        images: selectedHero.images,
        title: selectedHero.title,
        description: selectedHero.description,
        button_text: selectedHero.button_text,
        lifestyle_tag: selectedHero.lifestyle_tag,
        active: selectedHero.active
      };

      const { error: saveError } = selectedHero.id
        ? await supabase.from("hero_section").update(payload).eq("id", selectedHero.id)
        : await supabase.from("hero_section").insert(payload);

      if (saveError) throw saveError;

      toast.success("Banner deployed successfully!");
      fetchData(); 
      setSelectedHero(null);
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("hero_section")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (!error) {
      toast.success("Status Updated");
      fetchData();
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#FBFBFC] space-y-10">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg">
              <Layout className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Website Interface</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-[#2b2652]">
            Hero <span className="text-[#c4a174] italic">Management</span>
          </h1>
        </div>

        <button
          onClick={() => setSelectedHero({ 
            id: "", images: [], title: "", description: "", 
            button_text: "Shop Now", lifestyle_tag: "", active: true, created_at: "" 
          })}
          className="group flex items-center gap-3 px-8 py-4 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#1a1733] transition-all"
        >
          <Plus size={20} />
          New Banner
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase tracking-[0.3em] font-black">
            <tr>
              <th className="px-10 py-7">Banner Details</th>
              <th className="px-10 py-7">Lifestyle Tag</th>
              <th className="px-10 py-7 text-center">Status</th>
              <th className="px-10 py-7 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {heroes.map((hero) => (
              <tr key={hero.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                <td className="px-10 py-7">
                  <div className="flex items-center gap-6">
                    <img src={hero.images[0]} className="h-16 w-24 rounded-xl object-cover" alt="Thumb" />
                    <div>
                      <h4 className="font-black text-[#2b2652] uppercase text-sm">{hero.title || "No Title"}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{hero.button_text}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-7">
                  <span className="px-3 py-1 bg-slate-100 text-[#2b2652] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {hero.lifestyle_tag || "General"}
                  </span>
                </td>
                <td className="px-10 py-7 text-center">
                  <button onClick={() => toggleActive(hero.id, hero.active)}>
                    {hero.active ? (
                      <span className="text-[#c4a174] text-[9px] font-black tracking-widest uppercase">● Live</span>
                    ) : (
                      <span className="text-slate-300 text-[9px] font-black tracking-widest uppercase">Draft</span>
                    )}
                  </button>
                </td>
                <td className="px-10 py-7 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewHero(hero)} className="p-2 hover:text-[#c4a174]"><Eye size={18} /></button>
                    <button onClick={() => setSelectedHero(hero)} className="p-2 hover:text-[#c4a174]"><PencilIcon size={18} /></button>
                    <button onClick={() => {/* Delete logic */}} className="p-2 hover:text-red-500"><Trash size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {selectedHero && (
        <div className="fixed inset-0 bg-[#2b2652]/60 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FBFBFC]">
              <h3 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter">Banner Visual Designer</h3>
              <button onClick={() => setSelectedHero(null)}><X className="text-slate-400" /></button>
            </div>

            <div className="p-10 grid md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto">
              {/* Left Side: Content */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em]">Banner Text Content</label>
                  <input
                    placeholder="Headline"
                    className="w-full h-14 px-6 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#c4a174]/20 font-bold"
                    value={selectedHero.title}
                    onChange={e => setSelectedHero({ ...selectedHero, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Description"
                    className="w-full p-6 bg-slate-50 rounded-xl outline-none h-32 font-medium text-sm"
                    value={selectedHero.description}
                    onChange={e => setSelectedHero({ ...selectedHero, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em]">Button Label</label>
                    <input
                      placeholder="Shop Now"
                      className="w-full h-12 px-4 bg-slate-50 rounded-xl font-bold text-xs"
                      value={selectedHero.button_text}
                      onChange={e => setSelectedHero({ ...selectedHero, button_text: e.target.value })}
                    />
                  </div>
                  
                  {/* LIFESTYLE TAG DROPDOWN */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em]">Lifestyle Tag</label>
                    <div className="relative">
                      <select 
                        className="w-full h-12 px-4 bg-[#2b2652] text-[#c4a174] rounded-xl font-black text-[10px] uppercase tracking-widest appearance-none outline-none cursor-pointer"
                        value={selectedHero.lifestyle_tag}
                        onChange={e => setSelectedHero({ ...selectedHero, lifestyle_tag: e.target.value })}
                      >
                        <option value="">No Collection</option>
                        {lifestyleTags.map(tag => (
                          <option key={tag.id} value={tag.name}>{tag.name}</option>
                        ))}
                      </select>
                      <Tag size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Media */}
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em]">Media Assets</label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedHero.images.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-100">
                      <img src={img} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setSelectedHero({...selectedHero, images: selectedHero.images.filter((_, idx) => idx !== i)})}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                    {uploading ? <Loader2 className="animate-spin text-[#c4a174]" /> : <UploadCloud className="text-slate-300" />}
                    <input type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files!)} />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#FBFBFC] border-t flex gap-4">
              <button onClick={() => setSelectedHero(null)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
              <button 
                onClick={saveHero} 
                className="flex-[2] py-4 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg"
              >
                Deploy Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}