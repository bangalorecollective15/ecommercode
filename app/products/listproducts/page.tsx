"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Eye, Plus, Pencil, Trash2, QrCode, Search, ChevronLeft, ChevronRight, ChevronDown, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: number;
  name: string;
  sku: string | null;
  active: boolean;
  product_images?: { image_url: string }[];
}

export default function ProductList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = usePersistentState("prod_filter_cat", "");
  const [selectedSubCategory, setSelectedSubCategory] = usePersistentState("prod_filter_sub", "");
const [selectedSubSubCategory, setSelectedSubSubCategory] = usePersistentState("prod_filter_subsub", "");
const [search, setSearch] = usePersistentState("prod_filter_search", "");
const [selectedStatus, setSelectedStatus] = usePersistentState("prod_filter_status", "");
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const pageSize = 20;
  const page = Number(searchParams.get("page")) || 1;

  const handleFilterChange = (type: "category" | "subcategory" | "subsubcategory" | "search", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (type === "category") {
      setSelectedCategory(value);
      setSelectedSubCategory("");
      setSelectedSubSubCategory("");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("prod_filter_sub");
        sessionStorage.removeItem("prod_filter_subsub");
      }
      if (value) params.set("category_id", value); else params.delete("category_id");
      params.delete("subcategory_id");
      params.delete("sub_subcategory_id");
    } else if (type === "subcategory") {
      setSelectedSubCategory(value);
      setSelectedSubSubCategory("");
      if (typeof window !== "undefined") sessionStorage.removeItem("prod_filter_subsub");
      if (value) params.set("subcategory_id", value); else params.delete("subcategory_id");
      params.delete("sub_subcategory_id");
    } else if (type === "subsubcategory") {
      setSelectedSubSubCategory(value);
      if (value) params.set("sub_subcategory_id", value); else params.delete("sub_subcategory_id");
  } else if (type === "search") {
      setSearch(value);
    } else if (type === "status") {
      setSelectedStatus(value);
      if (value) params.set("active", value); else params.delete("active");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearch("");
    setSelectedStatus("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("prod_filter_cat");
      sessionStorage.removeItem("prod_filter_sub");
      sessionStorage.removeItem("prod_filter_subsub");
      sessionStorage.removeItem("prod_filter_search");
      sessionStorage.removeItem("prod_filter_status");
    }
    router.push(pathname);
    toast.success("All Filters Cleared");
  };
  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) params.delete("page");
    else params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("products").select(`*, product_images(image_url)`, { count: "exact" });
    if (selectedCategory) query = query.eq("category_id", selectedCategory);
    if (selectedSubCategory) query = query.eq("subcategory_id", selectedSubCategory);
    if (selectedSubSubCategory) query = query.eq("sub_subcategory_id", selectedSubSubCategory);
    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    if (selectedStatus) query = query.eq("active", selectedStatus === "public");
    const { data, count, error } = await query.order("id", { ascending: true }).range((page - 1) * pageSize, page * pageSize - 1);
    if (error) { console.error(error); toast.error("Failed to load products"); }
    else { setProducts(data || []); setTotalCount(count || 0); }
    setLoading(false);
  }, [selectedCategory, selectedSubCategory, selectedSubSubCategory, search, selectedStatus, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    supabase.from("categories").select("*").order("priority").then(({ data }) => setCategories(data || []));
  }, []);
  useEffect(() => {
    if (selectedCategory) supabase.from("subcategories").select("*").eq("category_id", selectedCategory).then(({ data }) => setSubCategories(data || []));
    else setSubCategories([]);
  }, [selectedCategory]);
  useEffect(() => {
    if (selectedSubCategory) supabase.from("sub_subcategories").select("*").eq("subcategory_id", selectedSubCategory).then(({ data }) => setSubSubCategories(data || []));
    else setSubSubCategories([]);
  }, [selectedSubCategory]);

  // ─── Fetch ALL matching products with full details for export ───────────────
  const fetchAllForExport = async () => {
    try {
      // Step 1: Base products
      let query = supabase.from("products").select(
        "id, name, sku, description, pack_of, has_variation, shipping_charge, shipping_type, youtube_url, active, created_at, category_id, subcategory_id, sub_subcategory_id, brand_id"
      );

      if (selectedCategory) query = query.eq("category_id", selectedCategory);
      if (selectedSubCategory) query = query.eq("subcategory_id", selectedSubCategory);
      if (selectedSubSubCategory) query = query.eq("sub_subcategory_id", selectedSubSubCategory);
      if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);

      const { data: prods, error: e1 } = await query.order("id", { ascending: true });
      if (e1) { console.error("Products fetch error:", e1); throw e1; }
      if (!prods || prods.length === 0) return [];

      const ids = prods.map((p: any) => p.id);

      // Step 2: Parallel lookups
      const [
        { data: cats, error: e2 },
        { data: subs, error: e3 },
        { data: subSubs, error: e4 },
        { data: brands, error: e5 },
        { data: variations, error: e6 },
        { data: images, error: e7 },
      ] = await Promise.all([
        supabase.from("categories").select("id, name"),
        supabase.from("subcategories").select("id, name"),
        supabase.from("sub_subcategories").select("id, name"),
        supabase.from("brands").select("id, name_en"),
        supabase.from("product_variations").select("id, product_id, price, sale_price, stock, color_id, size_id").in("product_id", ids),
        supabase.from("product_images").select("id, product_id, image_url").in("product_id", ids),
      ]);

      if (e2) console.error("Categories error:", e2);
      if (e3) console.error("Subcategories error:", e3);
      if (e4) console.error("Sub-subcategories error:", e4);
      if (e5) console.error("Brands error:", e5);
      if (e6) { console.error("Variations error:", e6); throw e6; }
      if (e7) console.error("Images error:", e7);

      // Step 3: Attribute IDs from variations
      const attrIds = [...new Set([
        ...(variations || []).map((v: any) => v.color_id).filter(Boolean),
        ...(variations || []).map((v: any) => v.size_id).filter(Boolean),
      ])];

      const { data: attrs, error: e8 } = attrIds.length > 0
        ? await supabase.from("attributes").select("id, name").in("id", attrIds)
        : { data: [], error: null };
      if (e8) console.error("Attributes error:", e8);

      // Step 4: Lookup maps
      const catMap: Record<number, string> = Object.fromEntries((cats || []).map((c: any) => [c.id, c.name]));
      const subMap: Record<number, string> = Object.fromEntries((subs || []).map((s: any) => [s.id, s.name]));
      const subSubMap: Record<number, string> = Object.fromEntries((subSubs || []).map((s: any) => [s.id, s.name]));
      const brandMap: Record<number, string> = Object.fromEntries((brands || []).map((b: any) => [b.id, b.name_en]));
      const attrMap: Record<number, string> = Object.fromEntries((attrs || []).map((a: any) => [a.id, a.name]));

      // Step 5: Group by product
      const varsByProduct: Record<number, any[]> = {};
      for (const v of variations || []) {
        if (!varsByProduct[v.product_id]) varsByProduct[v.product_id] = [];
        varsByProduct[v.product_id].push({
          id: v.id,
          price: v.price,
          sale_price: v.sale_price,
          stock: v.stock,
          colorName: attrMap[v.color_id] || "",
          sizeName: attrMap[v.size_id] || "",
        });
      }

      const imgsByProduct: Record<number, string[]> = {};
      for (const img of images || []) {
        if (!imgsByProduct[img.product_id]) imgsByProduct[img.product_id] = [];
        // Clean image URL
        let url = img.image_url || "";
        try {
          if (url.startsWith("[") || url.startsWith("{")) {
            const parsed = JSON.parse(url);
            url = Array.isArray(parsed) ? parsed[0] : parsed;
          }
        } catch { }
        url = String(url).split(",")[0].replace(/[\[\]"'\\]/g, "").trim();
        if (url.startsWith("http:")) url = url.replace(/^http:/i, "https:");
        if (!/\.(mp4|webm|ogg|mov)$/i.test(url) && url) {
          imgsByProduct[img.product_id].push(url);
        }
      }

      // Step 6: Assemble
      return prods.map((p: any) => ({
        ...p,
        categoryName: catMap[p.category_id] || "",
        subcategoryName: subMap[p.subcategory_id] || "",
        subSubName: subSubMap[p.sub_subcategory_id] || "",
        brandName: brandMap[p.brand_id] || "",
        variations: varsByProduct[p.id] || [],
        images: imgsByProduct[p.id] || [],
      }));
    } catch (err) {
      console.error("fetchAllForExport failed:", err);
      throw err;
    }
  };

  const flattenForExport = (data: any[]) => {
    const rows: any[] = [];
    for (const p of data) {
      const base = {
        "Product ID": p.id,
        "Product Name": p.name,
        "SKU": p.sku || "",
        "Description": p.description || "",
        "Category": p.categoryName,
        "Sub-Category": p.subcategoryName,
        "Deep Category": p.subSubName,
        "Brand": p.brandName,
        "Has Variation": p.has_variation ? "Yes" : "No",
        "Status": p.active ? "Active" : "Archived",
        "Images": p.images.join(" | "),
      };

      if (p.variations.length === 0) {
        rows.push({ ...base, "Variation ID": "", "Color": "", "Size": "", "Price (₹)": "", "Sale Price (₹)": "", "Stock": "" });
      } else {
        p.variations.forEach((v: any) => {
          rows.push({
            ...base,
            "Variation ID": v.id,
            "Color": v.colorName,
            "Size": v.sizeName,
            "Price (₹)": v.price,
            "Sale Price (₹)": v.sale_price || "",
            "Stock": v.stock ?? 0,
          });
        });
      }
    }
    return rows;
  };

  const downloadExcel = async () => {
    setDownloading("excel");
    setShowDownloadMenu(false);
    try {
      const data = await fetchAllForExport();
      if (data.length === 0) { toast.error("No products to export"); return; }

      const rows = flattenForExport(data);
      const wb = XLSX.utils.book_new();

      // Sheet 1 — Full detail (one row per variation)
      const ws1 = XLSX.utils.json_to_sheet(rows);
      ws1["!cols"] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 4, 20) }));
      XLSX.utils.book_append_sheet(wb, ws1, "Products & Variations");

      // Sheet 2 — Summary (one row per product)
      const summaryRows = data.map((p: any) => ({
        "Product ID": p.id,
        "Name": p.name,
        "SKU": p.sku || "",
        "Category": p.categoryName,
        "Sub-Category": p.subcategoryName,
        "Deep Category": p.subSubName,
        "Brand": p.brandName,
        "Pack Of": p.pack_of || "",
        "Shipping Type": p.shipping_type || "",
        "Shipping Charge (₹)": p.shipping_charge ?? 0,
        "Status": p.active ? "Active" : "Archived",
        "Total Variations": p.variations.length,
        "Total Stock": p.variations.reduce((s: number, v: any) => s + (v.stock || 0), 0),
        "Min Price (₹)": p.variations.length ? Math.min(...p.variations.map((v: any) => Number(v.price) || 0)) : "",
        "Max Price (₹)": p.variations.length ? Math.max(...p.variations.map((v: any) => Number(v.price) || 0)) : "",
        "Created At": p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "",
        "Image URLs": p.images.join(" | "),
      }));
      const ws2 = XLSX.utils.json_to_sheet(summaryRows);
      ws2["!cols"] = Object.keys(summaryRows[0]).map(k => ({ wch: Math.max(k.length + 4, 20) }));
      XLSX.utils.book_append_sheet(wb, ws2, "Product Summary");

      XLSX.writeFile(wb, `products_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${data.length} products (${rows.length} rows) to Excel`);
    } catch (err: any) {
      console.error("Excel export error:", err);
      toast.error(`Excel export failed: ${err?.message || "Unknown error"}`);
    } finally {
      setDownloading(null);
    }
  };

  const downloadPDF = async () => {
    setDownloading("pdf");
    setShowDownloadMenu(false);
    try {
      const data = await fetchAllForExport();
      if (data.length === 0) { toast.error("No products to export"); return; }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      const PAGE_W = 420;

      // ── Cover / Summary page ─────────────────────────────────────────────
      doc.setFillColor(43, 38, 82);
      doc.rect(0, 0, PAGE_W, 40, "F");
      doc.setFontSize(24);
      doc.setTextColor(196, 161, 116);
      doc.setFont("helvetica", "bold");
      doc.text("PRODUCTS REGISTRY", 20, 22);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}   |   Total Products: ${data.length}`, 20, 32);

      const summaryBody = data.map((p: any) => [
        String(p.id),
        p.name || "",
        p.sku || "-",
        p.categoryName || "-",
        p.subcategoryName || "-",
        p.subSubName || "-",
        p.brandName || "-",

      ]);

      autoTable(doc, {
        startY: 46,
        head: [["ID", "Product Name", "SKU", "Category", "Sub-Category", "Deep Category", "Brand"]],
        body: summaryBody,
        headStyles: { fillColor: [43, 38, 82], textColor: [196, 161, 116], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [43, 38, 82] },
        alternateRowStyles: { fillColor: [251, 251, 252] },
        styles: { cellPadding: 3, overflow: "linebreak", font: "helvetica" },
        columnStyles: { 1: { cellWidth: 55 }, 3: { cellWidth: 30 } },
      });

      // ── Per-product detail pages ──────────────────────────────────────────
      for (const p of data) {
        doc.addPage();

        // Header bar
        doc.setFillColor(43, 38, 82);
        doc.rect(0, 0, PAGE_W, 36, "F");
        doc.setFontSize(16);
        doc.setTextColor(196, 161, 116);
        doc.setFont("helvetica", "bold");
        // Sanitize name — strip any non-latin chars that crash helvetica
        const safeName = (p.name || "").replace(/[^\x00-\xFF]/g, "");
        doc.text(safeName.toUpperCase(), 20, 16);

        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.setFont("helvetica", "normal");
        const headerLine = `SKU: ${p.sku || "-"}     Category: ${p.categoryName || "-"} > ${p.subcategoryName || "-"} > ${p.subSubName || "-"}     Brand: ${p.brandName || "-"}   Pack: ${p.pack_of || "-"}   Shipping: ${p.shipping_type || "-"}   Created: ${p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "-"}`;
        doc.text(headerLine, 20, 26);

        let cursorY = 44;

        // Description
        if (p.description) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.setFont("helvetica", "normal");
          const safeDesc = p.description.replace(/[^\x00-\xFF]/g, "");
          const lines = doc.splitTextToSize(`Description: ${safeDesc}`, PAGE_W - 40);
          doc.text(lines.slice(0, 3), 20, cursorY);
          cursorY += lines.slice(0, 3).length * 5 + 4;
        }

        // Images
        if (p.images.length > 0) {
          doc.setFontSize(7);
          doc.setTextColor(43, 38, 82);
          doc.setFont("helvetica", "bold");
          doc.text("PRODUCT IMAGES", 20, cursorY);
          cursorY += 5;

          const imgSize = 38;
          const imgGap = 6;
          let imgX = 20;
          let imagesLoaded = 0;

          const imageResults = await Promise.all(
            p.images.slice(0, 1).map((imgUrl: string) =>
              new Promise<string | null>((resolve) => {
                const timer = setTimeout(() => resolve(null), 300);

                try {
                  const img = new window.Image();
                  img.crossOrigin = "anonymous";

                  img.onload = () => {
                    clearTimeout(timer);

                    try {
                      const canvas = document.createElement("canvas");
                      canvas.width = img.naturalWidth || 200;
                      canvas.height = img.naturalHeight || 200;

                      const ctx = canvas.getContext("2d");

                      if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/jpeg", 0.6));
                      } else {
                        resolve(null);
                      }
                    } catch {
                      resolve(null);
                    }
                  };

                  img.onerror = () => {
                    clearTimeout(timer);
                    resolve(null);
                  };

                  img.src = imgUrl;
                } catch {
                  clearTimeout(timer);
                  resolve(null);
                }
              })
            )
          );

          for (const dataUrl of imageResults) {
            if (dataUrl) {
              try {
                doc.addImage(dataUrl, "JPEG", imgX, cursorY, imgSize, imgSize);
                imgX += imgSize + imgGap;
                imagesLoaded++;
              } catch { }
            }
          }

          cursorY += imagesLoaded > 0 ? imgSize + 8 : 2;
        }

        // Variations table — use Rs. instead of ₹ to avoid font crash
        if (p.variations.length > 0) {
          doc.setFontSize(7);
          doc.setTextColor(43, 38, 82);
          doc.setFont("helvetica", "bold");
          doc.text("VARIATIONS", 20, cursorY);
          cursorY += 4;

          const varBody = p.variations.map((v: any) => [
            String(v.id),
            v.colorName || "-",
            v.sizeName || "-",
            `Rs. ${Number(v.price).toLocaleString("en-IN")}`,
            v.sale_price ? `Rs. ${Number(v.sale_price).toLocaleString("en-IN")}` : "-",
            String(v.stock ?? 0),
            (v.stock ?? 0) < 10 ? "LOW STOCK" : "In Stock",
          ]);

          autoTable(doc, {
            startY: cursorY,
            head: [["Var. ID", "Color", "Size", "Price", "Sale Price", "Stock", "Stock Status"]],
            body: varBody,
            headStyles: { fillColor: [43, 38, 82], textColor: [196, 161, 116], fontStyle: "bold", fontSize: 8 },
            bodyStyles: { fontSize: 8, textColor: [43, 38, 82] },
            alternateRowStyles: { fillColor: [251, 251, 252] },
            styles: { cellPadding: 3, font: "helvetica" },
            columnStyles: { 6: { cellWidth: 28 } },
            didParseCell: (hookData) => {
              if (hookData.column.index === 6) {
                if (hookData.cell.text[0] === "LOW STOCK") {
                  hookData.cell.styles.textColor = [220, 38, 38];
                  hookData.cell.styles.fontStyle = "bold";
                  hookData.cell.styles.fillColor = [255, 240, 240];
                } else {
                  hookData.cell.styles.textColor = [22, 163, 74];
                  hookData.cell.styles.fontStyle = "bold";
                }
              }
            },
          });
        } else {
          doc.setFontSize(8);
          doc.setTextColor(180, 180, 180);
          doc.setFont("helvetica", "normal");
          doc.text("No variations found for this product.", 20, cursorY + 6);
        }
      }

      doc.save(`products_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`PDF exported - ${data.length} products`);
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error(`PDF export failed: ${err?.message || "Unknown error"}`);
    } finally {
      setDownloading(null);
    }
  };

  const deleteProduct = async () => {
    if (!deleteId) return;
    try {
      const { data: images } = await supabase.from("product_images").select("image_url").eq("product_id", deleteId);
      if (images && images.length > 0) {
        const paths = images.map(img => img.image_url.split('/product-images/')[1]);
        await supabase.storage.from('product-images').remove(paths);
      }
      const { error } = await supabase.from("products").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Product Purged from Registry");
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    } catch (error: any) {
      toast.error(error.message || "Deletion Failed");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getCleanImageUrl = (product: any) => {
    const images = product.product_images || [];
    for (const item of images) {
      let raw = item?.image_url;
      if (!raw) continue;
      try {
        if (typeof raw === "string" && (raw.startsWith("[") || raw.startsWith("{"))) {
          const parsed = JSON.parse(raw);
          raw = Array.isArray(parsed) ? parsed[0] : parsed;
        }
      } catch { }
      let clean = String(raw).split(",")[0].replace(/[\[\]"'\\]/g, "").trim();
      if (clean.startsWith("http:")) clean = clean.replace(/^http:/i, "https:");
      if (!/\.(mp4|webm|ogg|mov)$/i.test(clean)) return clean;
    }
    return null;
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActiveFilters = !!(selectedCategory || selectedSubCategory || selectedSubSubCategory || search || selectedStatus);

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-[#c4a174]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Inventory Nexus</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Products <span className="text-[#c4a174] italic">Registry</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm">Centralized orchestration of global asset variations.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-8 py-5 bg-white border-2 border-slate-100 text-[#2b2652] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-[#c4a174] transition-all active:scale-95 flex items-center gap-3 shadow-sm"
              >
                <Download size={16} strokeWidth={3} />
                Export
                <ChevronDown size={12} className={`transition-transform ${showDownloadMenu ? "rotate-180" : ""}`} />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-[1.5rem] shadow-2xl shadow-[#2b2652]/10 border border-slate-50 overflow-hidden z-30 min-w-[200px]">
                  <button
                    onClick={downloadExcel}
                    disabled={!!downloading}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-emerald-50 transition-colors text-left group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        {downloading === "excel" ? "Exporting..." : "Excel (.xlsx)"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">Full data + variations</div>
                    </div>
                  </button>

                  <div className="h-[1px] bg-slate-50 mx-4" />

                  <button
                    onClick={downloadPDF}
                    disabled={!!downloading}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-red-50 transition-colors text-left group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-red-100 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-600">
                        {downloading === "pdf" ? "Generating..." : "PDF Report"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">Summary + variation detail</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/products/addproducts')}
              className="px-10 py-5 bg-[#2b2652] text-[#c4a174] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-[#2b2652]/20 hover:bg-[#1a1733] transition-all active:scale-95 flex items-center gap-3"
            >
              <Plus size={16} strokeWidth={3} />
              Initialize Product
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-[3rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-50">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative group flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search name or SKU..."
                value={search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50/30 rounded-[2rem] outline-none font-bold text-sm text-[#2b2652] placeholder:text-slate-200"
              />
            </div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-[2]">
              <div className="relative">
                <select value={selectedCategory} onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[2rem] outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652]/60 appearance-none cursor-pointer transition-all hover:bg-slate-50">
                  <option value="">Category</option>
                  {categories.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
              </div>
              <div className="relative">
                <select value={selectedSubCategory} disabled={!subCategories.length} onChange={(e) => handleFilterChange("subcategory", e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[2rem] outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652]/60 appearance-none cursor-pointer disabled:opacity-30 transition-all hover:bg-slate-50">
                  <option value="">Sub-Category</option>
                  {subCategories.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
              </div>
              <div className="relative">
                <select value={selectedSubSubCategory} disabled={!subSubCategories.length} onChange={(e) => handleFilterChange("subsubcategory", e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[2rem] outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652]/60 appearance-none cursor-pointer disabled:opacity-30 transition-all hover:bg-slate-50">
                  <option value="">Deep Category</option>
                  {subSubCategories.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
              </div>
              <div className="relative">
                <select value={selectedStatus} onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[2rem] outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652]/60 appearance-none cursor-pointer transition-all hover:bg-slate-50">
                  <option value="">Visibility</option>
                  <option value="public">Public</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={handleClearFilters}
                className="px-6 py-5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                <X size={14} strokeWidth={3} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 -mt-6 px-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Showing</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#c4a174]">{products.length}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">of {totalCount} products</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-50 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-[#c4a174]"></div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#2b2652]">
                <tr>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Product Image</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Product Info</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Visibility</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-xs uppercase font-black tracking-widest text-slate-300">No Records Available</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="group hover:bg-[#c4a174]/5 transition-all duration-300">
                      <td className="px-10 py-7">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                          {getCleanImageUrl(product) ? (
                            <img src={getCleanImageUrl(product)!} alt={product.name} className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300 font-black">NO IMG</div>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="font-black text-[#2b2652] text-lg tracking-tight uppercase group-hover:text-[#c4a174] transition-colors">{product.name}</div>
                        {product.sku && <div className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">SKU: {product.sku}</div>}
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={async () => {
                              const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
                              if (!error) {
                                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
                                toast.success(`Visibility: ${!product.active ? 'Public' : 'Hidden'}`);
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 outline-none ${product.active ? 'bg-[#c4a174] shadow-lg shadow-[#c4a174]/20' : 'bg-slate-200'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${product.active ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${product.active ? 'text-[#c4a174]' : 'text-slate-300'}`}>
                            {product.active ? 'Public' : 'Archived'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all duration-500">
                          <ActionButton icon={<QrCode size={16} />} onClick={() => router.push(`/products/listproducts/barcode/${product.id}`)} />
                          <ActionButton icon={<Eye size={16} />} onClick={() => router.push(`/products/listproducts/view/${product.id}`)} />
                          <ActionButton icon={<Pencil size={16} />} onClick={() => router.push(`/products/listproducts/edit/${product.id}`)} />
                          <ActionButton icon={<Trash2 size={16} />} color="red" onClick={() => { setDeleteId(product.id); setShowDeleteModal(true); }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-16">
            <button onClick={() => updatePage(page - 1)} disabled={page === 1}
              className="p-5 bg-white border border-slate-100 rounded-[1.5rem] disabled:opacity-20 hover:border-[#c4a174] transition shadow-sm active:scale-90">
              <ChevronLeft size={20} className="text-[#c4a174]" />
            </button>
            <div className="flex items-center bg-[#2b2652] px-6 py-3 rounded-[1.5rem] shadow-xl shadow-[#2b2652]/10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#c4a174] opacity-60 mr-4">Protocol</span>
              <span className="text-xl font-black text-white">{page}</span>
              <span className="mx-3 text-[#c4a174]/30 font-light">/</span>
              <span className="text-sm font-bold text-[#c4a174]">{totalPages}</span>
            </div>
            <button onClick={() => updatePage(page + 1)} disabled={page === totalPages}
              className="p-5 bg-white border border-slate-100 rounded-[1.5rem] disabled:opacity-20 hover:border-[#c4a174] transition shadow-sm active:scale-90">
              <ChevronRight size={20} className="text-[#c4a174]" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8"><Trash2 size={40} /></div>
            <h2 className="text-3xl font-black text-[#2b2652] tracking-tighter uppercase mb-4">Registry Purge</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10">
              This action will permanently erase this entity and all linked variations. <span className="text-red-500 font-black">This cannot be undone.</span>
            </p>
            <div className="flex flex-col gap-4">
              <button className="w-full py-5 bg-[#2b2652] text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-[#2b2652]/20" onClick={deleteProduct}>
                Confirm Deletion
              </button>
              <button className="w-full py-5 bg-transparent text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-[#2b2652] transition-all" onClick={() => setShowDeleteModal(false)}>
                Retain Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close download menu */}
      {showDownloadMenu && <div className="fixed inset-0 z-20" onClick={() => setShowDownloadMenu(false)} />}
    </div>
  );
}

function usePersistentState(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem(key) || defaultValue;
    return defaultValue;
  });
  const keyRef = useRef(key);
  useEffect(() => { keyRef.current = key; }, [key]);
  useEffect(() => { sessionStorage.setItem(keyRef.current, value); }, [value]);
  return [value, setValue] as const;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'gold' | 'red';
}

function ActionButton({ icon, onClick, color = 'gold' }: ActionButtonProps) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`group relative flex items-center justify-center p-3 rounded-[1.2rem] border transition-all duration-300 active:scale-90
        ${color === 'red'
          ? "bg-white text-slate-300 border-slate-100 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
          : "bg-white text-[#c4a174] border-slate-100 hover:text-white hover:border-[#2b2652] hover:bg-[#2b2652] hover:shadow-lg"}`}>
      <div className="transition-transform duration-300 group-hover:scale-110">{icon}</div>
    </button>
  );
}