"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { 
  PencilIcon, ChevronRightIcon,
  TrashIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  RectangleStackIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category { id: number; name: string; }
interface Subcategory { id: number; name: string; category_id: number; }
interface SubSubcategory {
  id: number;
  name: string;
  category_id: number;
  subcategory_id: number;
  priority: number;
  category_name?: string;
  subcategory_name?: string;
}

const ITEMS_PER_PAGE = 5;

export default function SubSubcategoriesPage() {
  const [subSubName, setSubSubName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [priority, setPriority] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<SubSubcategory[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<SubSubcategory[]>([]);

  const [editing, setEditing] = useState<SubSubcategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SubSubcategory | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string; category?: string; subcategory?: string; priority?: string;
  }>({});

  const totalPages = Math.ceil(filteredSubs.length / ITEMS_PER_PAGE);
  const paginatedSubs = filteredSubs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    loadCategories();
    loadSubcategories();
    loadSubSubcategories();
  }, []);

  useEffect(() => {
    if (categoryId) {
      setFilteredSubcategories(subcategories.filter((sub) => sub.category_id === categoryId));
    } else {
      setFilteredSubcategories([]);
    }
    if (!editing) setSubcategoryId(null);
  }, [categoryId, subcategories, editing]);

  useEffect(() => {
    const filtered = subSubcategories.filter((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.subcategory_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSubs(filtered);
    setCurrentPage(1);
  }, [searchQuery, subSubcategories]);

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*").order("priority");
    setCategories(data || []);
  }

  async function loadSubcategories() {
    const { data } = await supabase.from("subcategories").select("*").order("priority");
    setSubcategories(data || []);
  }

  async function loadSubSubcategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sub_subcategories")
        .select(`*, categories(name), subcategories(name)`)
        .order("priority");
      if (error) throw error;
      setSubSubcategories((data || []).map((s: any) => ({
        ...s,
        category_name: s.categories?.name,
        subcategory_name: s.subcategories?.name,
      })));
    } catch (err) {
      toast.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!subSubName.trim()) errors.name = "Name is required";
    if (!categoryId) errors.category = "Category is required";
    if (!subcategoryId) errors.subcategory = "Subcategory is required";
    if (priority < 1) errors.priority = "Invalid priority";

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const payload = { name: subSubName.trim(), category_id: categoryId, subcategory_id: subcategoryId, priority };
      const { error } = editing 
        ? await supabase.from("sub_subcategories").update(payload).eq("id", editing.id)
        : await supabase.from("sub_subcategories").insert(payload);

      if (error) throw error;
      toast.success(editing ? "Updated successfully" : "Added successfully");
      resetForm();
      loadSubSubcategories();
    } catch (err) {
      toast.error("Process failed");
    } finally {
      setSubmitting(false);
    }
  }

  const resetForm = () => {
    setEditing(null);
    setSubSubName("");
    setCategoryId(null);
    setSubcategoryId(null);
    setPriority(1);
    setFieldErrors({});
  };

  function handleEdit(item: SubSubcategory) {
    setEditing(item);
    setSubSubName(item.name);
    setCategoryId(item.category_id);
    setSubcategoryId(item.subcategory_id);
    setPriority(item.priority);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(filteredSubs.map(s => ({ 
      Name: s.name, Category: s.category_name, Subcategory: s.subcategory_name, Priority: s.priority 
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sub-Subcategories");
    XLSX.writeFile(wb, "sub_sub_report.xlsx");
  }

 return (
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 font-sans text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-center" />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] bg-[#c4a174]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Tertiary Level Management</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-[#2b2652] uppercase leading-none">
            Deep <span className="text-[#c4a174] italic">Categories</span>
          </h1>
          <p className="text-slate-500 font-medium">Refine your collection with granular groupings.</p>
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
            <div className="absolute top-0 right-0 w-1/4 h-2 bg-[#c4a174]"></div>

            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
              {editing ? (
                <PencilIcon className="h-6 w-6 text-[#c4a174]" />
              ) : (
                <div className="bg-[#2b2652] p-1 rounded-lg">
                    <PlusIcon className="h-4 w-4 text-[#c4a174]" />
                </div>
              )}
              {editing ? "Edit Registry" : "New Deep-Link"}
            </h2>

            <div className="space-y-6">
              {/* Item Name */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Refined Label</label>
                <input
                  type="text"
                  value={subSubName}
                  onChange={(e) => setSubSubName(e.target.value)}
                  placeholder="E.G. LIMITED EDITION DIVE"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all focus:ring-4 uppercase text-xs tracking-widest font-bold ${fieldErrors.name ? 'border-red-500 focus:ring-red-50' : 'border-slate-50 focus:border-[#c4a174] focus:ring-[#c4a174]/10'} bg-slate-50 outline-none text-[#2b2652]`}
                />
              </div>

              {/* Category Selects */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Level 01: Root</label>
                  <div className="relative">
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full appearance-none px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#c4a174] focus:ring-4 focus:ring-[#c4a174]/10 outline-none uppercase text-[10px] tracking-widest font-black text-[#2b2652] bg-slate-50 relative z-10"
                    >
                      <option value="">Select Root</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-[#c4a174] absolute right-4 top-1/2 -translate-y-1/2 z-0" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Level 02: Sub-Tier</label>
                  <div className="relative">
                    <select
                      disabled={!categoryId}
                      value={subcategoryId || ""}
                      onChange={(e) => setSubcategoryId(Number(e.target.value))}
                      className="w-full appearance-none px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#c4a174] focus:ring-4 focus:ring-[#c4a174]/10 outline-none uppercase text-[10px] tracking-widest font-black text-[#2b2652] bg-slate-50 relative z-10 disabled:opacity-30 disabled:grayscale"
                    >
                      <option value="">Select Sub-Tier</option>
                      {filteredSubcategories.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-[#c4a174] absolute right-4 top-1/2 -translate-y-1/2 z-0" />
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 block ml-1">Sequence Priority</label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-[#c4a174] focus:ring-4 focus:ring-[#c4a174]/10 outline-none font-black text-[#2b2652] bg-slate-50"
                />
              </div>

              {/* Submit Actions */}
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#2b2652] text-[#c4a174] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                >
                  {submitting && <div className="h-3 w-3 border-2 border-[#c4a174]/30 border-t-[#c4a174] rounded-full animate-spin" />}
                  {editing ? "Update Hierarchy" : "Create Grouping"}
                </button>
                {editing && (
                  <button type="button" onClick={resetForm} className="px-6 py-5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
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
              placeholder="SEARCH DEEP-LINKS..."
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
                    <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Full Path Classification</th>
                    <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={2} className="p-24 text-center font-black uppercase tracking-[0.4em] text-slate-300 text-[10px] animate-pulse">Syncing Deep Data...</td></tr>
                  ) : paginatedSubs.length === 0 ? (
                    <tr><td colSpan={2} className="p-24 text-center font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Registry Empty.</td></tr>
                  ) : (
                    paginatedSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#c4a174]/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-white border border-[#c4a174]/20 flex items-center justify-center text-[#2b2652] flex-shrink-0 shadow-sm group-hover:bg-[#2b2652] group-hover:text-[#c4a174] transition-all">
                                <RectangleStackIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-[#2b2652] text-lg uppercase tracking-tighter leading-none group-hover:text-[#c4a174] transition-colors">{sub.name}</p>
                                <div className="flex items-center gap-1.5 mt-2.5">
                                    <span className="text-[8px] font-black px-2 py-0.5 bg-[#2b2652] text-white rounded uppercase tracking-tighter">{sub.category_name}</span>
                                    <ChevronRightIcon className="h-3 w-3 text-[#c4a174]" />
                                    <span className="text-[8px] font-black px-2 py-0.5 bg-[#c4a174] text-white rounded uppercase tracking-tighter">{sub.subcategory_name}</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(sub)} className="p-3 bg-white border border-slate-100 text-[#2b2652] hover:text-[#c4a174] hover:border-[#c4a174] rounded-xl transition-all shadow-sm active:scale-90">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => { setItemToDelete(sub); setShowDeleteModal(true); }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-red-600 hover:border-red-100 rounded-xl transition-all shadow-sm active:scale-90">
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
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#2b2652] disabled:opacity-20 transition-all shadow-sm">Prev</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-11 h-11 rounded-2xl font-black text-[10px] transition-all ${currentPage === i + 1 ? 'bg-[#2b2652] text-[#c4a174] shadow-xl shadow-[#2b2652]/20' : 'bg-white border border-slate-100 text-slate-300 hover:border-[#c4a174] hover:text-[#c4a174]'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#2b2652] disabled:opacity-20 transition-all shadow-sm">Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-[#2b2652]/60 backdrop-blur-lg flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl max-w-sm w-full text-center border border-white/20">
            <div className="h-24 w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white">
                <TrashIcon className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black text-[#2b2652] mb-3 uppercase tracking-tighter">Confirm Deletion</h2>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-10 leading-relaxed">Permanently purge <b>{itemToDelete.name}</b> from the master directory?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 transition-all">Cancel</button>
              <button
                onClick={async () => {
                  const { error } = await supabase.from("sub_subcategories").delete().eq("id", itemToDelete.id);
                  if (!error) {
                    toast.success("Record Purged");
                    loadSubSubcategories();
                    setShowDeleteModal(false);
                  }
                }}
                className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-200"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
);
}