"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { 
  PencilIcon, 
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
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-10 font-sans text-slate-900">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Deep <span className="text-black">Categories</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage tertiary level catalog groupings.</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowDownTrayIcon className="h-5 w-5" /> Export
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FORM SIDEBAR */}
        <div className="lg:col-span-4 sticky top-10">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              {editing ? <PencilIcon className="h-6 w-6 text-black" /> : <PlusIcon className="h-6 w-6 text-black" />}
              {editing ? "Edit Item" : "New Item"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Item Name</label>
                <input
                  type="text"
                  value={subSubName}
                  onChange={(e) => setSubSubName(e.target.value)}
                  placeholder="e.g. Leather Recliners"
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-4 ${fieldErrors.name ? 'border-black focus:ring-red-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} outline-none font-semibold text-slate-700`}
                />
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Root Category</label>
                  <div className="relative">
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none font-semibold text-slate-700 bg-transparent relative z-10"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 z-0" />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Subcategory</label>
                  <div className="relative">
                    <select
                      disabled={!categoryId}
                      value={subcategoryId || ""}
                      onChange={(e) => setSubcategoryId(Number(e.target.value))}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none font-semibold text-slate-700 bg-transparent relative z-10 disabled:bg-slate-50 disabled:text-slate-300"
                    >
                      <option value="">Select Subcategory</option>
                      {filteredSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 z-0" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Priority</label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none font-semibold text-slate-700"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editing ? "Update Record" : "Create Record"}
                </button>
                {editing && (
                  <button type="button" onClick={resetForm} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-bold placeholder:text-slate-300"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Classification</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={2} className="p-20 text-center font-bold text-slate-300 animate-pulse">Loading dataset...</td></tr>
                  ) : paginatedSubs.length === 0 ? (
                    <tr><td colSpan={2} className="p-20 text-center font-bold text-slate-300">No records found.</td></tr>
                  ) : (
                    paginatedSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-black flex-shrink-0">
                                <RectangleStackIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-lg leading-tight">{sub.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{sub.category_name}</span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-orange-50 text-black rounded uppercase">{sub.subcategory_name}</span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(sub)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => { setItemToDelete(sub); setShowDeleteModal(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-black hover:bg-red-50 rounded-xl transition-all">
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
            <div className="flex justify-center items-center gap-2 py-4">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40">Prev</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-black text-white shadow-lg shadow-orange-100' : 'bg-white border border-slate-200 text-slate-400 hover:border-orange-300'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] p-10 shadow-2xl max-w-sm w-full text-center border border-white/20">
            <div className="h-20 w-20 bg-red-50 text-black rounded-full flex items-center justify-center mx-auto mb-6">
                <TrashIcon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Delete Item?</h2>
            <p className="text-slate-500 font-medium mb-8">Permanently remove <b>{itemToDelete.name}</b> from the database?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs">Cancel</button>
              <button
                onClick={async () => {
                  const { error } = await supabase.from("sub_subcategories").delete().eq("id", itemToDelete.id);
                  if (!error) {
                    toast.success("Deleted");
                    loadSubSubcategories();
                    setShowDeleteModal(false);
                  }
                }}
                className="py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-200"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}