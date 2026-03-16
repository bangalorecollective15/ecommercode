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
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-10 font-sans text-slate-900">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Subcategory <span className="text-orange-600">Hub</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Define granular segments for your catalog.</p>
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
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              {editingSub ? <PencilIcon className="h-6 w-6 text-orange-600" /> : <PlusIcon className="h-6 w-6 text-orange-600" />}
              {editingSub ? "Update Sub" : "New Subcategory"}
            </h2>

            <div className="space-y-5">
              {/* Name Input */}
              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Sub-Label</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                 //  placeholder="e.g. Sofa Sets"
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-4 ${fieldErrors.name ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} outline-none font-semibold text-slate-700`}
                />
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1.5 font-bold">{fieldErrors.name}</p>}
              </div>

              {/* Category Select */}
              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Parent Category</label>
                <div className="relative">
                    <select
                        value={categoryId || ""}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        className={`w-full appearance-none px-4 py-3 rounded-xl border transition-all focus:ring-4 ${fieldErrors.category ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} outline-none font-semibold text-slate-700 bg-transparent relative z-10`}
                    >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 z-0" />
                </div>
                {fieldErrors.category && <p className="text-red-500 text-xs mt-1.5 font-bold">{fieldErrors.category}</p>}
              </div>

              {/* Priority Input */}
              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-4 ${fieldErrors.priority ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} outline-none font-semibold text-slate-700`}
                />
                {fieldErrors.priority && <p className="text-red-500 text-xs mt-1.5 font-bold">{fieldErrors.priority}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingSub ? "Save Changes" : "Add Subcategory"}
                </button>
                {editingSub && (
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                    >
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
              placeholder="Search subcategories or categories..."
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
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Hierarchy</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={2} className="p-20 text-center font-bold text-slate-300 animate-pulse">Fetching records...</td></tr>
                  ) : paginatedSubs.length === 0 ? (
                    <tr><td colSpan={2} className="p-20 text-center font-bold text-slate-300">No subcategories found.</td></tr>
                  ) : (
                    paginatedSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                                <TagIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-lg leading-tight">{sub.name}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-1">
                                    Parent: <span className="text-slate-600">{sub.category_name}</span> • Priority: <span className="text-orange-600">{sub.priority}</span>
                                </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleEdit(sub)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => { setSubToDelete(sub); setShowDeleteModal(true); }}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
            <div className="flex justify-center items-center gap-2 py-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                Prev
              </button>
              <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white border border-slate-200 text-slate-400 hover:border-orange-300'}`}
                      >
                          {i + 1}
                      </button>
                  ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Glass Delete Modal */}
      {showDeleteModal && subToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] p-10 shadow-2xl max-w-sm w-full text-center border border-white/20">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrashIcon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Remove Item?</h2>
            <p className="text-slate-500 font-medium mb-8">
              Are you sure you want to delete <b>{subToDelete.name}</b>? This action is permanent.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
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
                    toast.success("Subcategory removed");
                    setShowDeleteModal(false);
                  }
                }}
                className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}