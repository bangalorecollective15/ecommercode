"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Trash2, 
  Plus, 
  Settings2, 
  Palette, 
  Maximize, 
  Loader2,
  ChevronRight
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Attribute {
  id: number;
  name: string;
  type: string;
}

type AttrType = "color" | "size" | "lifestyle_tag";

export default function LifestyleAttributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [inputs, setInputs] = useState<Record<AttrType, string>>({
    color: "",
    size: "",
    lifestyle_tag: ""
  });
  const [loading, setLoading] = useState(true);

  const fetchAttributes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attributes")
      .select("*")
      .order("name", { ascending: true });

    if (error) toast.error("Sync failed");
    else setAttributes(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const addAttribute = async (type: AttrType) => {
    const val = inputs[type];
    if (!val.trim()) return toast.error(`Enter ${type} value`);

    try {
      const { error } = await supabase.from("attributes").insert({ 
        name: val.trim(), 
        type 
      });
      if (error) throw error;
      
      setInputs({ ...inputs, [type]: "" });
      toast.success(`${type} added`);
      fetchAttributes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteAttribute = async (id: number) => {
    try {
      const { error } = await supabase.from("attributes").delete().eq("id", id);
      if (error) throw error;
      setAttributes(attributes.filter(a => a.id !== id));
      toast.success("Removed");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const renderSection = (title: string, type: AttrType, Icon: any, placeholder: string) => {
    const filtered = attributes.filter(a => a.type === type);

    return (
      <section className="bg-white border-2 border-slate-50 rounded-[3rem] flex flex-col h-[520px] overflow-hidden shadow-2xl shadow-[#2b2652]/5 hover:border-[#c4a174]/30 transition-all duration-500 group">
        {/* Section Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#2b2652]">{title}</h2>
            <p className="text-[9px] font-bold text-[#c4a174] uppercase mt-1 tracking-widest">{filtered.length} Entries Verified</p>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-sm text-[#c4a174] group-hover:bg-[#2b2652] group-hover:text-white transition-all duration-500">
            <Icon size={18} />
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-6 h-6 text-[#c4a174]" /></div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
                <div className="w-12 h-[1px] bg-slate-100 mb-4"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">Staging Empty</span>
            </div>
          ) : (
            filtered.map((attr) => (
              <div key={attr.id} className="group/item flex justify-between items-center bg-slate-50/50 hover:bg-[#2b2652] px-5 py-4 rounded-[1.5rem] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <ChevronRight size={10} className="text-[#c4a174] opacity-0 group-hover/item:opacity-100 transition-all -ml-2" />
                  <span className="text-[11px] font-black uppercase tracking-tight text-[#2b2652] group-hover/item:text-white transition-colors">{attr.name}</span>
                </div>
                <button 
                  onClick={() => deleteAttribute(attr.id)}
                  className="text-slate-300 hover:text-red-400 transition-all opacity-0 group-hover/item:opacity-100 scale-90 hover:scale-110"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Action Input */}
        <div className="p-8 bg-white border-t border-slate-50">
          <div className="flex gap-3">
            <input
              value={inputs[type]}
              onChange={(e) => setInputs({ ...inputs, [type]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addAttribute(type)}
              placeholder={placeholder}
              className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#c4a174]/20 focus:bg-white transition-all text-[#2b2652] placeholder:text-slate-300"
            />
            <button
              onClick={() => addAttribute(type)}
              className="bg-[#2b2652] text-[#c4a174] p-4 rounded-2xl hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 active:scale-90"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] selection:bg-[#c4a174] selection:text-white font-sans">
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#2b2652',
            color: '#c4a174',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: '20px',
            padding: '16px 24px',
            border: '1px solid rgba(196, 161, 116, 0.2)'
          }
        }} 
      />

      <div className="max-w-7xl mx-auto">
        <header className="mb-20 space-y-6">
          <div className="flex items-center gap-5">
            <div className="bg-[#2b2652] p-4 rounded-[1.8rem] text-[#c4a174] shadow-2xl shadow-[#2b2652]/30 relative overflow-hidden">
              <Settings2 size={28} className="relative z-10" />
              <div className="absolute inset-0 bg-white/5 rotate-45 translate-y-4"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-[1.5px] bg-[#c4a174]"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Infrastructure Hub</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                Global <span className="text-[#c4a174] italic">Registry</span>
              </h1>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] max-w-2xl leading-relaxed">
            Configure the foundational metadata for your collections. Changes deployed here will propagate throughout the inventory mapping engine and staging layers instantly.
          </p>
        </header>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {renderSection("Color Palette", "color", Palette, "E.G. VINTAGE CRIMSON")}
          {renderSection("Size Guide", "size", Maximize, "E.G. EU 44 / XL")}
          {renderSection("Lifestyle Tags", "lifestyle_tag", Settings2, "E.G. LIMITED EDITION")}
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c4a174; }
        
        /* Smooth Scroll behavior for the list */
        .overflow-y-auto {
            scrollbar-gutter: stable;
            scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}