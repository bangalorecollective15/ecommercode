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
  const [fieldErrors, setFieldErrors] = useState<{name?: string; priority?: string; image?: string}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  async function loadCategories() {
    setLoading(true);
    const { data, error } = await supabase.from("categories").select("*").order("priority", { ascending: true });
    if (!error) setCategories(data || []);
    setLoading(false);
  }

  // Handle Image Upload to Supabase Bucket
  async function uploadToStorage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `category-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('categories')
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      return null;
    }

    const { data } = supabase.storage.from('categories').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const errors: any = {};

    if (!name.trim()) errors.name = "Category name is required.";
    if (!file && !editingCategory) errors.image = "Image is required.";
    
    if (Object.keys(errors).length > 0) return setFieldErrors(errors);

    setSubmitting(true);
    try {
      let finalImageUrl = editingCategory?.image_url || null;

      if (file) {
        const uploadedUrl = await uploadToStorage(file);
        if (!uploadedUrl) throw new Error("Image upload failed");
        finalImageUrl = uploadedUrl;
      }

      const payload = { name: name.trim(), priority, image_url: finalImageUrl };

      if (editingCategory) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Category updated!");
      } else {
        const { error } = await supabase.from("categories").insert({ ...payload, home_status: true });
        if (error) throw error;
        toast.success("Category added!");
      }

      // Reset Form
      setName(""); setPriority(1); setFile(null); setEditingCategory(null); setFileKey(Date.now());
      loadCategories();
    } catch (err) {
      toast.error("Process failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setPriority(cat.priority);
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function toggleHome(id: number, currentStatus: boolean) {
    const { error } = await supabase.from("categories").update({ home_status: !currentStatus }).eq("id", id);
    if (!error) {
      setCategories(categories.map(c => c.id === id ? { ...c, home_status: !currentStatus } : c));
      toast.success("Visibility updated");
    }
  }

  function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(filteredCategories.map(c => ({ ID: c.id, Name: c.name, Priority: c.priority })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "categories_report.xlsx");
  }

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 text-[#2b2652]">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Category <span className="text-[#c4a174] italic">Center</span></h1>
          <p className="text-slate-500 font-medium">Manage e-commerce taxonomy and visual assets.</p>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">
          <ArrowDownTrayIcon className="h-4 w-4 text-[#c4a174]" /> Export Registry
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* FORM */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#2b2652]"></div>
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">{editingCategory ? "Edit Entry" : "New Category"}</h2>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Label</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#c4a174] outline-none font-bold uppercase text-xs tracking-widest" />
                {fieldErrors.name && <p className="text-red-500 text-[10px] mt-1 font-black">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Rank Priority</label>
                <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#c4a174] outline-none font-black" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Image Asset</label>
                <input key={fileKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 rounded-[2rem] hover:bg-[#c4a174]/5 hover:border-[#c4a174] transition-all">
                  {file || editingCategory?.image_url ? (
                    <img src={file ? URL.createObjectURL(file) : editingCategory?.image_url!} className="h-24 w-24 object-cover rounded-2xl shadow-md" />
                  ) : (
                    <PhotoIcon className="h-10 w-10 text-slate-200" />
                  )}
                </label>
                {fieldErrors.image && <p className="text-red-500 text-[10px] mt-1 font-black">{fieldErrors.image}</p>}
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-[#2b2652] text-[#c4a174] py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#1a1733] transition-all shadow-xl disabled:opacity-50">
                {submitting ? "Processing..." : editingCategory ? "Update Asset" : "Publish Now"}
              </button>
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] p-4 shadow-sm flex items-center gap-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-300 ml-2" />
            <input type="text" placeholder="SEARCH CATEGORIES..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 border-none focus:ring-0 text-xs font-black tracking-widest uppercase" />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Home</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={cat.image_url || ''} className="h-12 w-12 rounded-xl object-cover bg-slate-100" />
                        <div>
                          <p className="font-black text-sm uppercase tracking-tighter">{cat.name}</p>
                          <span className="text-[8px] font-black bg-[#2b2652] text-white px-2 py-0.5 rounded">Rank {cat.priority}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button onClick={() => toggleHome(cat.id, cat.home_status)} className={`h-6 w-12 rounded-full relative transition-all ${cat.home_status ? 'bg-[#c4a174]' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${cat.home_status ? 'right-1' : 'left-1'}`} />
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(cat)} className="p-2 hover:text-[#c4a174] transition-colors"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => { setCategoryToDelete(cat); setShowDeleteModal(true); }} className="p-2 hover:text-red-500 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#2b2652]/40 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="bg-white p-10 rounded-[2.5rem] max-w-xs w-full text-center">
            <h2 className="text-xl font-black uppercase mb-4">Confirm Purge?</h2>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-[10px]">Cancel</button>
              <button onClick={async () => {
                await supabase.from("categories").delete().eq("id", categoryToDelete?.id);
                loadCategories();
                setShowDeleteModal(false);
                toast.success("Deleted");
              }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px]">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}