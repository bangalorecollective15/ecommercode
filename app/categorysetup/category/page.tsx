"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  PhotoIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: number;
  name: string;
  priority: number;
  image_url: string | null;
  home_status: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [fileKey, setFileKey] = useState(Date.now());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    priority?: string;
    image?: string;
  }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  async function loadCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  // --- START OF FIXED SECTION ---
  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setPriority(cat.priority);
    setFile(null); // Reset the file input so it uses existing image unless a new one is picked
    setFieldErrors({}); // Clear any previous validation errors
    
    // Smooth scroll to top for better mobile UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // --- END OF FIXED SECTION ---

  async function uploadImage(): Promise<string | null> {
    if (editingCategory && !file) return editingCategory.image_url;
    if (!file) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: typeof fieldErrors = {};

    if (!name.trim()) errors.name = "Category name is required.";
    if (priority < 1) errors.priority = "Priority must be at least 1.";
    if (!file && !editingCategory) errors.image = "Image is required.";

    const existingPriority = categories.find(
      (cat) => cat.priority === priority && cat.id !== editingCategory?.id
    );
    if (existingPriority) errors.priority = `Priority already used by "${existingPriority.name}".`;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      const payload = { name: name.trim(), priority, image_url: imageUrl };

      if (editingCategory) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Category updated!");
      } else {
        const { error } = await supabase.from("categories").insert({ ...payload, home_status: false });
        if (error) throw error;
        toast.success("Category added!");
      }

      setName("");
      setPriority(1);
      setFile(null);
      setEditingCategory(null);
      setFileKey(Date.now());
      loadCategories();
    } catch (err) {
      toast.error("Process failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleHome(id: number, currentStatus: boolean) {
    try {
      await supabase.from("categories").update({ home_status: !currentStatus }).eq("id", id);
      setCategories(categories.map(c => c.id === id ? { ...c, home_status: !currentStatus } : c));
      toast.success("Visibility updated");
    } catch {
      toast.error("Toggle failed.");
    }
  }

  function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(filteredCategories.map(c => ({ 
      ID: c.id, Name: c.name, Priority: c.priority, OnHome: c.home_status ? "Yes" : "No" 
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "categories_report.xlsx");
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-10 font-sans text-slate-900">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Category <span className="text-orange-600">Center</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Create and organize your business taxonomies.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
                <ArrowDownTrayIcon className="h-5 w-5" /> Export
            </button>
        </div>
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
              {editingCategory ? <PencilIcon className="h-6 w-6 text-orange-600" /> : <PlusIcon className="h-6 w-6 text-orange-600" />}
              {editingCategory ? "Update Entry" : "New Category"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Category Label</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
          //        placeholder="e.g. Living Room Furniture"
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-4 ${fieldErrors.name ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} outline-none font-semibold text-slate-700`}
                />
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1.5 font-bold">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Sorting Priority</label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-4 ${fieldErrors.priority ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} outline-none font-semibold text-slate-700`}
                />
                {fieldErrors.priority && <p className="text-red-500 text-xs mt-1.5 font-bold">{fieldErrors.priority}</p>}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 block">Visual Asset</label>
                <div className="relative group">
                    <input
                        key={fileKey}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                    />
                    <label 
                        htmlFor="file-upload" 
                        className={`cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all ${fieldErrors.image ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300'}`}
                    >
                        {file ? (
                             <img src={URL.createObjectURL(file)} className="h-20 w-20 object-cover rounded-xl shadow-md" />
                        ) : editingCategory?.image_url ? (
                             <img src={editingCategory.image_url} className="h-20 w-20 object-cover rounded-xl shadow-md opacity-60" />
                        ) : (
                            <>
                                <PhotoIcon className="h-8 w-8 text-slate-300 mb-2 group-hover:text-orange-400" />
                                <span className="text-xs font-bold text-slate-400 group-hover:text-orange-500">Click to upload</span>
                            </>
                        )}
                    </label>
                </div>
                {fieldErrors.image && <p className="text-red-500 text-xs mt-1.5 font-bold">{fieldErrors.image}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingCategory ? "Sync Changes" : "Create Now"}
                </button>
                {editingCategory && (
                    <button
                        type="button"
                        onClick={() => { setEditingCategory(null); setName(""); setPriority(1); setFile(null); }}
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
              placeholder="Search by category name..."
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
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Setup</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Home</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="p-20 text-center font-bold text-slate-300 animate-pulse">Loading Database...</td></tr>
                  ) : paginatedCategories.length === 0 ? (
                    <tr><td colSpan={3} className="p-20 text-center font-bold text-slate-300">No entries found.</td></tr>
                  ) : (
                    paginatedCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 p-1 flex-shrink-0">
                                {cat.image_url ? (
                                    <img src={cat.image_url} className="h-full w-full object-cover rounded-xl" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-300"><PhotoIcon className="h-6 w-6" /></div>
                                )}
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-lg leading-tight">{cat.name}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">Priority: <span className="text-orange-600">{cat.priority}</span></p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                            <button 
                                onClick={() => toggleHome(cat.id, cat.home_status)}
                                className={`h-6 w-12 rounded-full transition-all relative ${cat.home_status ? 'bg-orange-600 shadow-lg shadow-orange-100' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all ${cat.home_status ? 'right-1' : 'left-1'}`} />
                            </button>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleEdit(cat)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => { setCategoryToDelete(cat); setShowDeleteModal(true); }}
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
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] p-10 shadow-2xl max-w-sm w-full text-center">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrashIcon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h2>
            <p className="text-slate-500 font-medium mb-8">
              Deleting <b>{categoryToDelete.name}</b> cannot be undone. All linked items may lose their category reference.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
              >
                No, Keep it
              </button>
              <button
                onClick={async () => {
                  if (!categoryToDelete) return;
                  const { error } = await supabase.from("categories").delete().eq("id", categoryToDelete.id);
                  if (error) toast.error("Delete failed");
                  else {
                    setCategories(categories.filter(c => c.id !== categoryToDelete.id));
                    toast.success("Category permanently deleted");
                    setShowDeleteModal(false);
                  }
                }}
                className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}