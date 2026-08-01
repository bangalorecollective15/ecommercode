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

  // ✅ DOWNLOAD SAMPLE
  const downloadSampleExcel = () => {
    const headers = "name,SKU,description,brand,lifestyle(Tags),Categories,Images,colors,Stock,Sale price,Regular price\n";
    const row = `"Chanel Premium Ladies Bags","","Luxury bag","Chanel","Best Selling","Women > Hand Bags > Designer","https://img.com/bag.jpg","Black",2,18500,20000`;
    const blob = new Blob([headers + row], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const aElement = document.createElement("a");
    aElement.href = url;
    aElement.download = "lifestyle_bulk_template.csv";
    aElement.click();
    window.URL.revokeObjectURL(url);
  };

  // ✅ DYNAMIC ID RESOLVER
  const getOrCreateId = async (
    table: string,
    name: string,
    sessionCache: Record<string, string>,
    extra: any = {},
    parent: any = {}
  ) => {
    if (!name) return null;
    const clean = name.trim();

    const nameColumn = table === "brands" ? "name_en" : "name";
    const parentSerialized = Object.entries(parent).map(([k, v]) => `${k}:${v}`).join("|");
    const cacheKey = `${table}-${parentSerialized}-${clean.toLowerCase()}`;

    if (sessionCache[cacheKey]) return sessionCache[cacheKey];

    let query = supabase.from(table).select("id").ilike(nameColumn, clean);
    Object.entries(parent).forEach(([k, v]) => { if (v) query = query.eq(k, v); });

    const { data } = await query.maybeSingle();
    if (data) {
      sessionCache[cacheKey] = data.id;
      return data.id;
    }

    const insertPayload: Record<string, any> = {
      [nameColumn]: clean,
      ...extra,
      ...parent
    };

    if (table === "brands" && !insertPayload.alt_text) {
      insertPayload.alt_text = clean;
    }

    const { data: newData, error: insertError } = await supabase
      .from(table)
      .insert(insertPayload)
      .select("id")
      .maybeSingle();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: retryData } = await query.maybeSingle();
        if (retryData) {
          sessionCache[cacheKey] = retryData.id;
          return retryData.id;
        }
      }
      console.error(`[Supabase Error] Table: ${table} | Value: ${clean} | Msg:`, insertError.message);
      return null;
    }

    if (newData?.id) {
      sessionCache[cacheKey] = newData.id;
      return newData.id;
    }
    return null;
  };

  // ✅ MASTER SUBMIT LOGIC
  const handleBulkSubmit = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    let masterProductsCreated = 0;
    let variantsProcessed = 0;
    let skippedRowsCount = 0;

    const sessionCache: Record<string, string> = {};

    try {
      // ─── STEP 1: PRE-AGGREGATION ENGINE ───────────────────────────────────────
      const groupedProducts: Record<string, {
        productName: string;
        masterRow: any;
        masterPrice: number;
        masterSalePrice: number | null;
        variations: Array<{
          size: string | null;
          color: string;
          stock: number;
          price: number;
          salePrice: number | null;
          csvRowIndex: number;
        }>;
      }> = {};

      let lastValidGroupKey = "";

      parsedData.forEach((item, index) => {
        const humanRowIndex = index + 2;
        const rawName = item.name?.trim() || "";

        // 🛑 FIX: Smarter regex to catch sizes like "105", "105 cm", "9.5 UK", "XXL"
        const variantSizeMatch = rawName.match(/^(.+?)\s*-\s*([\d]+(?:\.\d+)?\s*[a-zA-Z]*|[a-zA-Z]{1,5})$/i);

        let baseProductName = variantSizeMatch ? variantSizeMatch[1].trim() : rawName;
        let extractedSize: string | null = variantSizeMatch ? variantSizeMatch[2].trim() : null;

        const isChildRow =
          variantSizeMatch !== null ||
          (rawName === "" && lastValidGroupKey !== "");

        if (isChildRow && !baseProductName && lastValidGroupKey) {
          baseProductName = groupedProducts[lastValidGroupKey]?.productName || "";
        }

        if (!baseProductName) {
          console.warn(`[Row ${humanRowIndex}] Skipped: No product name context.`);
          skippedRowsCount++;
          return;
        }

        const rawRegularPrice = String(item["Regular price"] || "").replace(/[^0-9.]/g, "");
        const rawSalePrice = String(item["Sale price"] || "").replace(/[^0-9.]/g, "");

        let regularPrice = Number(rawRegularPrice);
        let salePrice: number | null = rawSalePrice !== "" ? Number(rawSalePrice) : null;
        if (salePrice !== null && isNaN(salePrice)) salePrice = null;

        let currentGroupKey = "";

        if (!isChildRow) {
          currentGroupKey = `${baseProductName}_row_${humanRowIndex}`;

          if (isNaN(regularPrice) || regularPrice <= 0) regularPrice = 0;

          lastValidGroupKey = "";

          groupedProducts[currentGroupKey] = {
            productName: baseProductName,
            masterRow: item,
            masterPrice: regularPrice,
            masterSalePrice: salePrice,
            variations: [],
          };

          lastValidGroupKey = currentGroupKey;

        } else if (variantSizeMatch !== null) {
          const brand = item.brand?.trim() || "";
          const cat = item.Categories?.trim() || "";
          currentGroupKey = `variant__${baseProductName}__${brand}__${cat}`;

          if (!groupedProducts[currentGroupKey]) {
            if (isNaN(regularPrice) || regularPrice <= 0) regularPrice = 0;
            groupedProducts[currentGroupKey] = {
              productName: baseProductName,
              masterRow: item,
              masterPrice: regularPrice,
              masterSalePrice: salePrice,
              variations: [],
            };
          }

          if (isNaN(regularPrice) || regularPrice <= 0) {
            regularPrice = groupedProducts[currentGroupKey].masterPrice;
            salePrice = groupedProducts[currentGroupKey].masterSalePrice;
          }

          lastValidGroupKey = currentGroupKey;

        } else {
          currentGroupKey = lastValidGroupKey;

          if (groupedProducts[currentGroupKey]) {
            if (isNaN(regularPrice) || regularPrice <= 0) {
              regularPrice = groupedProducts[currentGroupKey].masterPrice;
              salePrice = groupedProducts[currentGroupKey].masterSalePrice;
            }
          }
        }

        const colorValue = item.colors?.trim() || item.color?.trim() || "Default";

        if (groupedProducts[currentGroupKey]) {
          groupedProducts[currentGroupKey].variations.push({
            size: extractedSize || (item.size?.trim() || null),
            color: colorValue,
            stock: Number(item.Stock) || 0,
            price: regularPrice,
            salePrice,
            csvRowIndex: humanRowIndex,
          });
        } else {
          console.error(`[Row ${humanRowIndex}] Skipped variant: No parent master context.`);
          skippedRowsCount++;
        }
      });

      // ─── STEP 2: SUPABASE DATA TRANSACTION SYNC ───────────────────────────────
      const productsToProcess = Object.entries(groupedProducts);

      for (const [, group] of productsToProcess) {
        const productName = group.productName;
        const mainItem = group.masterRow;

        const parts = mainItem.Categories?.split(">")?.map((c: string) => c.trim()) || [];
        const catId = parts[0]
          ? await getOrCreateId("categories", parts[0], sessionCache)
          : null;
        const subId =
          parts[1] && catId
            ? await getOrCreateId("subcategories", parts[1], sessionCache, {}, { category_id: catId })
            : null;
        const subSubId =
          parts[2] && catId && subId
            ? await getOrCreateId("sub_subcategories", parts[2], sessionCache, {}, {
                category_id: catId,
                subcategory_id: subId,
              })
            : null;

        if (parts[2] && !subSubId) {
          console.error(`❌ Skipped "${productName}" — sub_subcategory resolution error.`);
          skippedRowsCount += group.variations.length;
          continue;
        }

        const brandId = mainItem.brand
          ? await getOrCreateId("brands", mainItem.brand, sessionCache)
          : null;

        const lifestyleId = mainItem["lifestyle(Tags)"]
          ? await getOrCreateId("attributes", mainItem["lifestyle(Tags)"], sessionCache, { type: "lifestyle_tag" })
          : null;

        const sku = mainItem.SKU?.trim() || `SKU-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
        const cleanSku = sku.trim();

        let productId: string | null = null;
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("sku", cleanSku)
          .maybeSingle();

        if (existingProduct) {
          productId = existingProduct.id;
        } else {
          let genderVal = "Unisex";
          if (parts[0] === "Men" || parts[0] === "Women" || parts[0] === "Kids") {
            genderVal = parts[0];
          }

          const hasMultipleVariants = group.variations.length > 1;
          const hasDistinctSizeOrColor = group.variations.some(
            (v) => v.size !== null || v.color !== "Default"
          );
          const hasVariation = hasMultipleVariants || hasDistinctSizeOrColor;

          const { data: newProduct, error: pError } = await supabase
            .from("products")
            .insert({
              name: productName,
              sku: cleanSku,
              description: mainItem.description || "",
              category_id: catId,
              subcategory_id: subId,
              sub_subcategory_id: subSubId,
              brand_id: brandId,
              lifestyle_tag_id: lifestyleId,
              active: true,
              gender: genderVal,
              has_variation: hasVariation,
            })
            .select("id")
            .single();

          if (pError) {
            console.error(`❌ Critical insert failure for [${productName}]:`, pError.message);
            throw pError;
          }
          productId = newProduct?.id ?? null;
          masterProductsCreated++;
        }

        if (mainItem.Images && productId) {
          const cleanImg = mainItem.Images.trim();
          const { data: existingImg } = await supabase
            .from("product_images")
            .select("id")
            .eq("product_id", productId)
            .eq("image_url", cleanImg)
            .maybeSingle();

          if (!existingImg) {
            await supabase.from("product_images").insert({
              product_id: productId,
              image_url: cleanImg,
            });
          }
        }

        if (productId && group.variations.length > 0) {
          for (const variant of group.variations) {
            const colorId = await getOrCreateId(
              "attributes", variant.color, sessionCache, { type: "color" }
            );
            const sizeId = variant.size
              ? await getOrCreateId("attributes", variant.size, sessionCache, { type: "size" })
              : null;

            let variantQuery = supabase
              .from("product_variations")
              .select("id, stock")
              .eq("product_id", productId)
              .eq("color_id", colorId);

            if (sizeId) {
              variantQuery = variantQuery.eq("size_id", sizeId);
            } else {
              variantQuery = variantQuery.is("size_id", null);
            }

            const { data: existingVar } = await variantQuery.maybeSingle();

            if (!existingVar) {
              const { error: varInsErr } = await supabase
                .from("product_variations")
                .insert({
                  product_id: productId,
                  color_id: colorId,
                  size_id: sizeId,
                  price: variant.price,
                  sale_price: variant.salePrice,
                  stock: variant.stock,
                });
              if (!varInsErr) variantsProcessed++;
            } else {
              const accumulatedStock = (existingVar.stock ?? 0) + variant.stock;

              const { error: varUpdErr } = await supabase
                .from("product_variations")
                .update({
                  stock: accumulatedStock,
                  price: variant.price,
                  sale_price: variant.salePrice,
                })
                .eq("id", existingVar.id);
              if (!varUpdErr) variantsProcessed++;
            }
          }
        }
      }

      toast.success(
        `Success! Created ${masterProductsCreated} products and processed ${variantsProcessed} variations.`
      );
      if (skippedRowsCount > 0) {
        toast.error(`Warning: ${skippedRowsCount} rows skipped. Check console logs.`);
      }
      setParsedData([]);
    } catch (err: any) {
      console.error("Processing failure:", err);
      toast.error(err.message || "Failed during database transaction.");
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
      complete: (res) => setParsedData(res.data),
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans p-6 lg:p-12 selection:bg-[#c4a174] selection:text-white">
      <Toaster position="bottom-right" />

      <div className="max-w-7xl mx-auto">
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
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#2b2652] text-[#c4a174] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a1733] transition-all shadow-xl shadow-[#2b2652]/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <Loader2 className="animate-spin" size={16} />
                  : `Finalize ${parsedData.length} Rows`}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[3rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-[#c4a174] hover:bg-white transition-all group bg-white shadow-sm"
            >
              <div className="p-6 bg-slate-50 rounded-full mb-6 group-hover:bg-[#c4a174]/10 transition-colors">
                <Upload
                  size={40}
                  className="text-slate-300 group-hover:text-[#c4a174] group-hover:-translate-y-1 transition-all"
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2b2652]">Upload Source</p>
              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">Supported: .CSV / UTF-8</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={onFileLoad}
              />
            </div>

            <div className="bg-[#2b2652] text-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#2b2652]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#c4a174]/10 rounded-full -mr-12 -mt-12 blur-2xl" />

              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#c4a174] border-b border-white/5 pb-5 flex items-center gap-3">
                <Layers size={14} /> Mapping Logic
              </h3>

              <div className="space-y-5 mt-8">
                {[
                  { label: "Category Path",  value: "Delimited by '>'" },
                  { label: "Grouping Mode",  value: "Name + Brand + Category" },
                  { label: "Asset Fetching", value: "Remote URL Strings" },
                  { label: "Stock Merge",    value: "Accumulated (summed)" },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-white/5 pb-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                      {item.label}:
                    </span>
                    <span className="text-[9px] font-black uppercase text-white/90">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {parsedData.length > 0 ? (
              <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-[#2b2652]/5">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#c4a174] rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2b2652]">
                      Staging Engine Active
                    </span>
                  </div>
                  <span className="px-4 py-1.5 bg-[#2b2652] text-[#c4a174] text-[8px] font-black rounded-full uppercase tracking-widest">
                    Verification Passed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          Entry Details
                        </th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          Stock & Profile
                        </th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          Valuation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedData.slice(0, 8).map((row, i) => (
                        <tr key={i} className="hover:bg-[#c4a174]/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 group-hover:border-[#c4a174]/30 transition-all">
                                {row.Images ? (
                                  <img
                                    src={row.Images}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon size={20} className="text-slate-200" />
                                )}
                              </div>
                              <div>
                                <p className="text-[13px] font-black tracking-tighter uppercase leading-tight text-[#2b2652] group-hover:text-[#c4a174] transition-colors line-clamp-1 max-w-[180px]">
                                  {row.name}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                  {row.brand || "Private Label"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <Package size={12} className="text-[#c4a174]" />
                                <span className="text-[10px] font-black uppercase text-[#2b2652]">
                                  {row.Stock || 0} Units
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tags size={12} className="text-slate-300" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                                  {row.colors || row.color || "Default Color"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black tracking-tighter text-[#2b2652]">
                              ₹{row["Sale price"] || row["Regular price"] || 0}
                            </p>
                            {row["Sale price"] && (
                              <p className="text-[9px] font-bold text-slate-300 line-through mt-0.5">
                                ₹{row["Regular price"]}
                              </p>
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
                  <div className="absolute inset-0 bg-[#c4a174]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <FileSpreadsheet
                    size={80}
                    className="relative mb-8 opacity-20 group-hover:opacity-40 group-hover:text-[#c4a174] transition-all duration-500"
                  />
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-300 group-hover:text-[#2b2652] transition-colors">
                  Staging Area Active
                </p>
                <p className="text-[9px] uppercase mt-3 font-bold text-slate-200 tracking-widest">
                  Connect a manifest to begin indexing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
