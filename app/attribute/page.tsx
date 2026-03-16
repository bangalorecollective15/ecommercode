"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Plus, ListChecks } from "lucide-react"; // Optional: npm install lucide-react

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Attribute {
  id: number;
  name: string;
  type: string;
}

export default function Attributes() {
  const [tastes, setTastes] = useState<Attribute[]>([]);
  const [unitTypes, setUnitTypes] = useState<Attribute[]>([]);
  const [newTaste, setNewTaste] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const { data: tasteData, error: tasteError } = await supabase
        .from("attributes")
        .select("*")
        .eq("type", "taste")
        .order("name", { ascending: true });

      const { data: unitData, error: unitError } = await supabase
        .from("attributes")
        .select("*")
        .eq("type", "unit_type")
        .order("name", { ascending: true });

      if (tasteError) throw tasteError;
      if (unitError) throw unitError;

      setTastes(tasteData ?? []);
      setUnitTypes(unitData ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch attributes");
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = async (name: string, type: "taste" | "unit_type", setter: (val: string) => void) => {
    if (!name.trim()) return toast.error("Value cannot be empty");
    
    try {
      const { error } = await supabase.from("attributes").insert({ name: name.trim(), type });
      if (error) throw error;
      
      setter("");
      toast.success(`${type === 'taste' ? 'Taste' : 'Unit'} added successfully!`);
      fetchAttributes();
    } catch (err: any) {
      toast.error(err.message || "Failed to add attribute");
    }
  };

  const deleteAttribute = async (id: number) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      const { error } = await supabase.from("attributes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted successfully");
      fetchAttributes();
    } catch (err: any) {
      toast.error("Could not delete item");
    }
  };

  return (
    <div className=" bg-gray-50 p-6 md:p-10">
      <Toaster position="top-right" />

      <div className="max-w-8xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg text-white">
            <ListChecks size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Manage Attributes</h1>
            <p className="text-gray-500 text-sm">Configure your product variations like taste and unit types.</p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Tastes Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-xl font-bold text-orange-600">Tastes</h2>
              <p className="text-xs text-gray-400">Available flavor profiles</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400 ">Loading...</div>
              ) : tastes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 ">No tastes added yet.</div>
              ) : (
                tastes.map((t) => (
                  <div key={t.id} className="group flex justify-between items-center bg-gray-50 hover:bg-orange-50 px-4 py-3 rounded-xl transition">
                    <span className="text-gray-700 font-medium">{t.name}</span>
                    <button 
                      onClick={() => deleteAttribute(t.id)}
                      className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-gray-50/50 rounded-b-2xl border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newTaste}
                  onChange={(e) => setNewTaste(e.target.value)}
                  placeholder="e.g. Spicy, Sweet"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-orange-500 focus:ring-0 outline-none transition"
                />
                <button
                  onClick={() => addAttribute(newTaste, "taste", setNewTaste)}
                  className="bg-orange-600 text-white p-2 rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200 active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </section>

          {/* Unit Types Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-xl font-bold text-orange-600">Unit Types</h2>
              <p className="text-xs text-gray-400">Measurement units (kg, ml, pcs)</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400 ">Loading...</div>
              ) : unitTypes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 ">No units added yet.</div>
              ) : (
                unitTypes.map((u) => (
                  <div key={u.id} className="group flex justify-between items-center bg-gray-50 hover:bg-orange-50 px-4 py-3 rounded-xl transition">
                    <span className="text-gray-700 font-medium">{u.name}</span>
                    <button 
                      onClick={() => deleteAttribute(u.id)}
                      className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-gray-50/50 rounded-b-2xl border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="e.g. kg, grams"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-orange-500 focus:ring-0 outline-none transition"
                />
                <button
                  onClick={() => addAttribute(newUnit, "unit_type", setNewUnit)}
                  className="bg-orange-600 text-white p-2 rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200 active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}