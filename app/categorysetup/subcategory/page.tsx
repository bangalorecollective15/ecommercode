"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  TagIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  priority: number;
}

const ITEMS_PER_PAGE = 5;

export default function SubcategoriesPage() {
  const [subName, setSubName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priority, setPriority] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState<Subcategory | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    priority?: string;
    category?: string;
  }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredSubs.length / ITEMS_PER_PAGE);
  const paginatedSubs = filteredSubs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    loadCategories();
    loadSubcategories();
  }, []);

  useEffect(() => {
    const filtered = subcategories.filter((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSubs(filtered);
    setCurrentPage(1);
  }, [searchQuery, subcategories]);

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data || []);
  }

  async function loadSubcategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subcategories")
        .select(`*, categories(name)`)
        .order("priority", { ascending: true });

      if (error) throw error;
      const formatted = (data || []).map((sub: any) => ({
        ...sub,
        category_name: sub.categories?.name,
      }));
      setSubcategories(formatted);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: typeof fieldErrors = {};

    if (!subName.trim()) errors.name = "Subcategory name is required.";
    if (!categoryId) errors.category = "Please select a category.";
    if (priority < 1) errors.priority = "Priority must be at least 1.";

    const existingPriority = subcategories.find(
      (sub) => sub.priority === priority && sub.id !== editingSub?.id
    );
    if (existingPriority) errors.priority = `Priority already used by "${existingPriority.name}".`;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = { name: subName.trim(), category_id: categoryId, priority };

      if (editingSub) {
        const { error } = await supabase.from("subcategories").update(payload).eq("id", editingSub.id);
        if (error) throw error;
        toast.success("Subcategory updated!");
      } else {
        const { error } = await supabase.from("subcategories").insert(payload);
        if (error) throw error;
        toast.success("Subcategory added!");
      }

      resetForm();
      loadSubcategories();
    } catch (err) {
      toast.error("Process failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleEdit = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setCategoryId(sub.category_id);
    setPriority(sub.priority);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingSub(null);
    setSubName("");
    setCategoryId(null);
    setPriority(1);
    setFieldErrors({});
  };

  function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(filteredSubs.map(s => ({ 
      ID: s.id, Name: s.name, Category: s.category_name, Priority: s.priority 
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subcategories");
    XLSX.writeFile(wb, "subcategories_report.xlsx");
  }

return (
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 font-sans text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] bg-[#c4a174]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Inventory Hierarchy</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-[#2b2652] uppercase leading-none">
            Subcategory <span className="text-[#c4a174] italic">Hub</span>
          </h1>
          <p className="text-slate-500 font-medium">Define granular segments for your high-end catalog.</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[#2b2652] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-[#c4a174]" /> Export Registry
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* FORM SIDEBAR */}
        <div className="lg:col-span-4 sticky top-10">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-[#2b2652]/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-[#2b2652]"></div>
            <div className="absolute top-0 right-0 w-1/3 h-2 bg-[#c4a174]"></div>

            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
              {editingSub ? (
                <PencilIcon className="h-6 w-6 text-[#c4a174]" />
              ) : (
                <div className="bg-[#2b2652] p-1 rounded-lg">
                    <PlusIcon className="h-4 w-4 text-[#c4a174]" />
                </div>
              )}
              {editingSub ? "Edit Segment" : "New Segment"}
            </h2>

            <div className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Sub-Label</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="E.G. CHRONOGRAPHS"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all focus:ring-4 uppercase text-xs tracking-widest font-bold ${fieldErrors.name ? 'border-red-500 focus:ring-red-50' : 'border-slate-50 focus:border-[#c4a174] focus:ring-[#c4a174]/10'} bg-slate-50 outline-none text-[#2b2652]`}
                />
                {fieldErrors.name && <p className="text-red-500 text-[10px] mt-2 font-black uppercase tracking-tighter">{fieldErrors.name}</p>}
              </div>

              {/* Category Select */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Parent Category</label>
                <div className="relative">
                    <select
                        value={categoryId || ""}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        className={`w-full appearance-none px-5 py-4 rounded-2xl border-2 transition-all focus:ring-4 uppercase text-xs tracking-widest font-bold ${fieldErrors.category ? 'border-red-500 focus:ring-red-50' : 'border-slate-50 focus:border-[#c4a174] focus:ring-[#c4a174]/10'} bg-slate-50 outline-none text-[#2b2652] relative z-10`}
                    >
                        <option value="">Select Parent</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-[#c4a174] absolute right-4 top-1/2 -translate-y-1/2 z-0" />
                </div>
                {fieldErrors.category && <p className="text-red-500 text-[10px] mt-2 font-black uppercase tracking-tighter">{fieldErrors.category}</p>}
              </div>

              {/* Priority Input */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all focus:ring-4 font-black ${fieldErrors.priority ? 'border-red-500 focus:ring-red-50' : 'border-slate-50 focus:border-[#c4a174] focus:ring-[#c4a174]/10'} bg-slate-50 outline-none text-[#2b2652]`}
                />
                {fieldErrors.priority && <p className="text-red-500 text-[10px] mt-2 font-black uppercase tracking-tighter">{fieldErrors.priority}</p>}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#2b2652] text-[#c4a174] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                >
                  {submitting && <div className="h-3 w-3 border-2 border-[#c4a174]/30 border-t-[#c4a174] rounded-full animate-spin" />}
                  {editingSub ? "Update Hierarchy" : "Confirm Subcategory"}
                </button>
                {editingSub && (
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-2xl shadow-[#2b2652]/5 flex items-center gap-4 group transition-all focus-within:border-[#c4a174]">
            <MagnifyingGlassIcon className="h-6 w-6 text-slate-300 group-focus-within:text-[#c4a174] transition-colors ml-2" />
            <input
              type="text"
              placeholder="SEARCH HIERARCHY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[#2b2652] font-black text-xs tracking-widest placeholder:text-slate-200 uppercase"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-[#2b2652]/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Mapping Hierarchy</th>
                    <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={2} className="p-24 text-center font-black uppercase tracking-[0.4em] text-slate-300 text-[10px] animate-pulse">Syncing Registry...</td></tr>
                  ) : paginatedSubs.length === 0 ? (
                    <tr><td colSpan={2} className="p-24 text-center font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">No records found.</td></tr>
                  ) : (
                    paginatedSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#c4a174]/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-white border border-[#c4a174]/20 flex items-center justify-center text-[#2b2652] flex-shrink-0 shadow-sm group-hover:bg-[#2b2652] group-hover:text-[#c4a174] transition-all">
                                <TagIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-[#2b2652] text-lg uppercase tracking-tighter leading-none group-hover:text-[#c4a174] transition-colors">{sub.name}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parent: <span className="text-[#2b2652]">{sub.category_name}</span></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                                    <span className="text-[9px] font-black text-[#c4a174] uppercase tracking-widest">Priority {sub.priority}</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(sub)}
                                className="p-3 bg-white border border-slate-100 text-[#2b2652] hover:text-[#c4a174] hover:border-[#c4a174] rounded-xl transition-all shadow-sm active:scale-90"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => { setSubToDelete(sub); setShowDeleteModal(true); }}
                                className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-red-600 hover:border-red-100 rounded-xl transition-all shadow-sm active:scale-90"
                            >
                                <TrashIcon className="h-5 w-5" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-5 py-3 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#2b2652] disabled:opacity-20 transition-all shadow-sm"
              >
                Prev
              </button>
              <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-11 h-11 rounded-2xl font-black text-[10px] transition-all ${currentPage === i + 1 ? 'bg-[#2b2652] text-[#c4a174] shadow-xl shadow-[#2b2652]/20' : 'bg-white border border-slate-100 text-slate-300 hover:border-[#c4a174] hover:text-[#c4a174]'}`}
                      >
                          {i + 1}
                      </button>
                  ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-5 py-3 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#2b2652] disabled:opacity-20 transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && subToDelete && (
        <div className="fixed inset-0 bg-[#2b2652]/60 backdrop-blur-lg flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl max-w-sm w-full text-center border border-white/20">
            <div className="h-24 w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white">
                <TrashIcon className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black text-[#2b2652] mb-3 uppercase tracking-tighter">Purge Segment?</h2>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-10 leading-relaxed">
              De-registering <b>{subToDelete.name}</b> will remove it from all associated filters permanently.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!subToDelete) return;
                  const { error } = await supabase.from("subcategories").delete().eq("id", subToDelete.id);
                  if (error) {
                    toast.error("Deletion failed");
                  } else {
                    setSubcategories(subcategories.filter(s => s.id !== subToDelete.id));
                    toast.success("Registry Purged");
                    setShowDeleteModal(false);
                  }
                }}
                className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
);
}