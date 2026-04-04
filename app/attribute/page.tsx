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
  X
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

// Removed "material" from types
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
      <section className="bg-white border border-slate-200 rounded-[2rem] flex flex-col h-[480px] overflow-hidden shadow-sm hover:shadow-md hover:border-black transition-all duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">{title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{filtered.length} Registered</p>
          </div>
          <Icon className="text-black w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-5 h-5 text-slate-300" /></div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Data</div>
          ) : (
            filtered.map((attr) => (
              <div key={attr.id} className="group flex justify-between items-center bg-slate-50 hover:bg-black hover:text-white px-4 py-3 rounded-xl transition-all">
                <span className="text-xs font-bold uppercase">{attr.name}</span>
                <button 
                  onClick={() => deleteAttribute(attr.id)}
                  className="text-slate-300 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={inputs[type]}
              onChange={(e) => setInputs({ ...inputs, [type]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addAttribute(type)}
              placeholder={placeholder}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest outline-none focus:border-black focus:bg-white transition-all"
            />
            <button
              onClick={() => addAttribute(type)}
              className="bg-black text-white p-3 rounded-xl hover:bg-zinc-800 transition shadow-lg active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-12 text-black selection:bg-black selection:text-white">
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
            fontSize: '12px',
            borderRadius: '10px',
          }
        }} 
      />

      <div className="max-w-7xl mx-auto">
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2.5 rounded-2xl text-white">
              <Settings2 size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Inventory System</span>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Global <span className="text-slate-300">Registry</span></h1>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xl leading-relaxed">
            Manage your footwear and apparel variations. All changes are synced to your live database instantly.
          </p>
        </header>

        {/* 3-Column Layout: Color, Size, Lifestyle Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderSection("Color Palette", "color", Palette, "E.G. JET BLACK")}
          {renderSection("Size Guide", "size", Maximize, "E.G. UK 10 / L")}
          {renderSection("Lifestyle Tags", "lifestyle_tag", Settings2, "E.G. NEW ARRIVAL")}
        </div>

 
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #000; }
      `}</style>
    </div>
  );
}