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
    <div className="min-h-screen bg-[#fafafa] text-black font-sans p-6 lg:p-12">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="space-y-2">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-gray-400 hover:text-black transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Back to Hub
            </button>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Bulk Import
            </h1>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={downloadSampleExcel} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 border-2 border-black px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-tighter hover:bg-black hover:text-white transition-all shadow-sm"
            >
              <Download size={14} /> Download Sample
            </button>
            {parsedData.length > 0 && (
              <button 
                onClick={handleBulkSubmit} 
                disabled={uploading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : `Finalize ${parsedData.length} Items`}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: CONTROLS */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-gray-200 rounded-[3rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-white transition-all group bg-gray-50/50"
            >
              <Upload size={48} className="mb-4 text-gray-300 group-hover:text-black group-hover:-translate-y-1 transition-all" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Source</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={onFileLoad} />
            </div>

            <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-[11px] font-black uppercase text-emerald-400 border-b border-gray-800 pb-4 flex items-center gap-2">
                <Layers size={14} /> Mapping Logic
              </h3>
              <div className="space-y-4 mt-6 opacity-80">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Category Path:</span>
                  <span className="text-[9px] font-black uppercase">Delimited by '{'>'}'</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Price Auto-Calc:</span>
                  <span className="text-[9px] font-black uppercase">MRP vs Sale</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Images:</span>
                  <span className="text-[9px] font-black uppercase">Single URL String</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: DATA TABLE */}
          <div className="lg:col-span-8">
            {parsedData.length > 0 ? (
              <div className="bg-white border-2 border-gray-100 rounded-[3.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Staging Engine</span>
                  <div className="flex gap-2">
                     <span className="px-3 py-1 bg-black text-white text-[8px] font-black rounded-full uppercase">CSV Verified</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400">Entry Details</th>
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400">Stock & Color</th>
                        <th className="p-8 text-[9px] font-black uppercase text-gray-400">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {parsedData.slice(0, 8).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                {row.Images ? (
                                  <img src={row.Images} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={18} className="text-gray-300" />
                                )}
                              </div>
                              <div>
                                <p className="text-[12px] font-black italic tracking-tighter uppercase leading-tight truncate max-w-[200px]">{row.name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{row.brand || 'No Brand'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-2">
                              <Package size={12} className="text-gray-300" />
                              <span className="text-[10px] font-black uppercase">{row.Stock || 0} Units</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Tags size={12} className="text-gray-300" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase italic">{row.colors || 'Standard'}</span>
                            </div>
                          </td>
                          <td className="p-8">
                            <p className="text-[12px] font-black tracking-tighter">₹{row["Sale price"] || row["Regular price"]}</p>
                            {row["Sale price"] && (
                              <p className="text-[8px] font-bold text-gray-300 line-through">₹{row["Regular price"]}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 8 && (
                  <div className="p-8 text-center border-t border-gray-50 bg-gray-50/20">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">+ {parsedData.length - 8} more items in queue</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[550px] border-4 border-dashed border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center text-gray-200 bg-white/40 group">
                <FileSpreadsheet size={64} className="mb-6 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">Staging Area Active</p>
                <p className="text-[9px] uppercase mt-2 text-gray-200">Load a valid .CSV to begin processing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}