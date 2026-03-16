"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Plus
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Brand {
  id: number;
  name_en: string;
  image_url: string | null;
  status?: boolean;
}

export default function BrandList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [requireNewImage, setRequireNewImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    let query = supabase.from("brands").select("*");
    if (search.trim()) query = query.ilike("name_en", `%${search}%`);
    const { data, error } = await query.order("id", { ascending: false });
    
    if (error) toast.error("Failed to fetch brands");
    else setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const toggleStatus = async (brand: Brand) => {
    const { error } = await supabase
      .from("brands")
      .update({ status: !brand.status })
      .eq("id", brand.id);
    
    if (error) toast.error("Status update failed");
    else {
      toast.success("Status updated");
      setBrands(brands.map(b => b.id === brand.id ? { ...b, status: !b.status } : b));
    }
  };

const handleDelete = async (brand: Brand) => {
  if (!confirm(`Delete ${brand.name_en}?`)) return;

  try {
    if (brand.image_url) {
      const path = brand.image_url.split("/").pop()?.split("?")[0];
      if (path) {
        await supabase.storage
          .from("brand-images")
          .remove([path]);
      }
    }

    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", brand.id);

    if (error) throw error;

    toast.success("Brand deleted");
    fetchBrands();

  } catch (err: any) {
    console.error(err);
    toast.error(err.message);
  }
};

  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setNameInput(brand.name_en || "");
    setImageFile(null);
    setRequireNewImage(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedBrand || !nameInput.trim()) {
      return toast.error("Brand name is required");
    }

    setSaving(true);
    let updatedData: any = { name_en: nameInput.trim() };

    // 1. Image logic
    if ((requireNewImage || imageFile) && selectedBrand.image_url) {
      const path = selectedBrand.image_url.split("/").pop()?.split("?")[0];
      if (path) await supabase.storage.from("brand-images").remove([path]);
      if (!imageFile) updatedData.image_url = null;
    }

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filename = `brand_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("brand-images").upload(filename, imageFile);

      if (uploadError) {
        setSaving(false);
        return toast.error("Image upload failed");
      }

      const { data } = supabase.storage.from("brand-images").getPublicUrl(filename);
      updatedData.image_url = `${data?.publicUrl}?v=${Date.now()}`;
    }

    const { error } = await supabase.from("brands").update(updatedData).eq("id", selectedBrand.id);

    if (error) {
      toast.error("Update failed");
    } else {
      toast.success("Brand updated successfully");
      fetchBrands();
      setIsModalOpen(false);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Toaster />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Brand <span className="text-orange-600">Database</span></h2>
            <p className="text-gray-500 text-sm">Manage your product brands and store identity.</p>
          </div>
          <button className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200">
            <Plus className="w-5 h-5" /> Add New Brand
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by brand name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-black"
            />
          </div>
          <button
            onClick={fetchBrands}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-colors"
          >
            Search
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Brand Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                        <p className="text-gray-500 font-medium">Fetching brands...</p>
                      </div>
                    </td>
                  </tr>
                ) : brands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 font-medium">
                      No brands found in the database.
                    </td>
                  </tr>
                ) : (
                  brands.map((brand, index) => (
                    <tr key={brand.id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 relative rounded-xl border border-gray-100 bg-white p-1 overflow-hidden shadow-sm">
                            {brand.image_url ? (
                              <Image
                                src={brand.image_url}
                                alt={brand.name_en}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-gray-800">{brand.name_en}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(brand)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${brand.status ? 'bg-orange-600' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${brand.status ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(brand)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
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
      </div>

      {/* Modernized Edit Modal */}
      {isModalOpen && selectedBrand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Edit <span className="text-orange-600">Brand</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Image Logic Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-contain p-2" />
                    ) : selectedBrand.image_url ? (
                      <img src={selectedBrand.image_url} className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  
                  {selectedBrand.image_url && !requireNewImage && (
                    <button
                      onClick={() => {
                        setRequireNewImage(true);
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Brand Logo Asset</p>
              </div>

              {requireNewImage && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-600" /> Upload Replacement
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Brand Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-medium"
                  placeholder="Enter brand name"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-orange-800 leading-relaxed">
                Updating the brand name will reflect immediately across all linked products. Image changes may take a few seconds to sync.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}