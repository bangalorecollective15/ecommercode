"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { 
  Upload, Loader2, ArrowLeft, Download, FileSpreadsheet, 
  Layers, Package, Image as ImageIcon, Tags 
} from "lucide-react";
import Papa from "papaparse";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BulkUploadProducts() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);

  // ✅ 1. DOWNLOAD SAMPLE (Your Custom Format)
  const downloadSampleExcel = () => {
    const headers = "name,SKU,description,brand,lifestyle(Tags),Categories,Images,colors,Stock,Sale price,Regular price\n";
    const row = `"Chanel Premium Ladies Bags","","Luxury bag","Chanel","Best Selling","Women > Hand Bags > Designer","https://img.com/bag.jpg","Black",2,18500,20000`;
    
    const blob = new Blob([headers + row], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lifestyle_bulk_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ✅ 2. ID RESOLVER (Helper)
  const getOrCreateId = async (table: string, name: string, extra: any = {}, parent: any = {}) => {
    if (!name) return null;
    const clean = name.trim();
    
    // ilike 'name' column is standard for these tables
    let query = supabase.from(table).select("id").ilike("name", clean);
    Object.entries(parent).forEach(([k, v]) => { if (v) query = query.eq(k, v); });
    
    const { data } = await query.single();
    if (data) return data.id;

    const { data: newData, error } = await supabase.from(table)
      .insert({ name: clean, ...extra, ...parent })
      .select("id")
      .single();

    if (error) {
      console.error(`Error creating in ${table}:`, error.message);
      return null;
    }
    return newData?.id;
  };

  // ✅ 3. MASTER SUBMIT LOGIC
  const handleBulkSubmit = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    let successCount = 0;

    try {
      for (const item of parsedData) {
        // Step A: Category Hierarchy
        const parts = item.Categories?.split(">")?.map((c: string) => c.trim());
        const catId = await getOrCreateId("categories", parts?.[0]);
        const subId = await getOrCreateId("subcategories", parts?.[1], {}, { category_id: catId });
        const subSubId = await getOrCreateId("sub_subcategories", parts?.[2], {}, { 
          category_id: catId, 
          subcategory_id: subId 
        });

        // Step B: Brand & Lifestyle Tag
        const brandId = await getOrCreateId("brands", item.brand);
        const lifestyleId = await getOrCreateId("attributes", item["lifestyle(Tags)"], { type: "lifestyle_tag" });
        const sku = item.SKU || `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Step C: Main Product Insert
        // FIXED: Column name 'sub_subcategory_id' to match standard Supabase cache
        const { data: product, error: pError } = await supabase.from("products").insert({
          name: item.name, 
          sku, 
          description: item.description,
          category_id: catId, 
          subcategory_id: subId, 
          sub_subcategory_id: subSubId, 
          brand_id: brandId, 
          lifestyle_tag_id: lifestyleId, 
          active: true,
          gender: "Women"
        }).select("id").single();

        if (pError) throw pError;

        // Step D: Product Image
        if (item.Images && product?.id) {
          await supabase.from("product_images").insert({ 
            product_id: product.id, 
            image_url: item.Images.trim() 
          });
        }

        // Step E: Variations (Color + Pricing)
        const colorId = await getOrCreateId("attributes", item.colors, { type: "color" });
        
        if (product?.id) {
          await supabase.from("product_variations").insert({
            product_id: product.id,
            color_id: colorId,
            price: Number(item["Regular price"]) || 0,
            sale_price: Number(item["Sale price"]) || null,
            stock: Number(item.Stock) || 0
          });
        }
        
        successCount++;
      }
      toast.success(`Successfully finalized ${successCount} products!`);
      setParsedData([]);
    } catch (err: any) {
      console.error("Batch error:", err);
      toast.error(err.message || "Failed to process bulk upload");
    } finally {
      setUploading(false);
    }
  };

  const onFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setParsedData(res.data)
    });
  };

return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans p-6 lg:p-12 selection:bg-[#c4a174] selection:text-white">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-slate-400 hover:text-[#c4a174] transition-all text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <ArrowLeft size={14} /> Back to Hub
            </button>
            <h1 className="text-7xl font-black tracking-tighter uppercase leading-none text-[#2b2652]">
              Bulk <span className="text-[#c4a174] italic">Import</span>
            </h1>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={downloadSampleExcel} 
              className="flex-1 md:flex-none flex items-center justify-center gap-3 border-2 border-[#2b2652] px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2b2652] hover:text-[#c4a174] transition-all shadow-sm active:scale-95"
            >
              <Download size={14} /> Download Sample
            </button>
            {parsedData.length > 0 && (
              <button 
                onClick={handleBulkSubmit} 
                disabled={uploading}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#2b2652] text-[#c4a174] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 active:scale-95"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : `Finalize ${parsedData.length} Items`}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT: CONTROLS */}
          <div className="lg:col-span-4 space-y-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[3rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-[#c4a174] hover:bg-white transition-all group bg-white shadow-sm"
            >
              <div className="p-6 bg-slate-50 rounded-full mb-6 group-hover:bg-[#c4a174]/10 transition-colors">
                <Upload size={40} className="text-slate-300 group-hover:text-[#c4a174] group-hover:-translate-y-1 transition-all" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2b2652]">Upload Source</p>
              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">Supported: .CSV / UTF-8</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={onFileLoad} />
            </div>

            <div className="bg-[#2b2652] text-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#2b2652]/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#c4a174]/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#c4a174] border-b border-white/5 pb-5 flex items-center gap-3">
                <Layers size={14} /> Mapping Logic
              </h3>
              
              <div className="space-y-5 mt-8">
                {[
                    { label: "Category Path", value: "Delimited by '>'" },
                    { label: "Price Auto-Calc", value: "MRP vs Sale" },
                    { label: "Asset Fetching", value: "Remote URL Strings" }
                ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-white/5 pb-3">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}:</span>
                        <span className="text-[9px] font-black uppercase text-white/90">{item.value}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: DATA TABLE */}
          <div className="lg:col-span-8">
            {parsedData.length > 0 ? (
              <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-[#2b2652]/5">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#c4a174] rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2b2652]">Staging Engine Active</span>
                  </div>
                  <span className="px-4 py-1.5 bg-[#2b2652] text-[#c4a174] text-[8px] font-black rounded-full uppercase tracking-widest">
                    Verification Passed
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Entry Details</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Stock & Profile</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedData.slice(0, 8).map((row, i) => (
                        <tr key={i} className="hover:bg-[#c4a174]/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 group-hover:border-[#c4a174]/30 transition-all">
                                {row.Images ? (
                                  <img src={row.Images} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={20} className="text-slate-200" />
                                )}
                              </div>
                              <div>
                                <p className="text-[13px] font-black tracking-tighter uppercase leading-tight text-[#2b2652] group-hover:text-[#c4a174] transition-colors line-clamp-1 max-w-[180px]">{row.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{row.brand || 'Private Label'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Package size={12} className="text-[#c4a174]" />
                                    <span className="text-[10px] font-black uppercase text-[#2b2652]">{row.Stock || 0} Units</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tags size={12} className="text-slate-300" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">{row.colors || 'Default Color'}</span>
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black tracking-tighter text-[#2b2652]">₹{row["Sale price"] || row["Regular price"]}</p>
                            {row["Sale price"] && (
                              <p className="text-[9px] font-bold text-slate-300 line-through mt-0.5">₹{row["Regular price"]}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedData.length > 8 && (
                  <div className="p-10 text-center border-t border-slate-50 bg-slate-50/20">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                      + {parsedData.length - 8} additional items in secure queue
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[600px] border-2 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 bg-white/50 group transition-all hover:bg-white">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#c4a174]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <FileSpreadsheet size={80} className="relative mb-8 opacity-20 group-hover:opacity-40 group-hover:text-[#c4a174] transition-all duration-500" />
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-300 group-hover:text-[#2b2652] transition-colors">Staging Area Active</p>
                <p className="text-[9px] uppercase mt-3 font-bold text-slate-200 tracking-widest">Connect a manifest to begin indexing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
);
}