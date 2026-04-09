"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Printer, RotateCcw, LayoutGrid, Tag } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BarcodePage() {
  const params = useParams();
  const productId = Number(params.id);
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProductAndVariations();
  }, [productId]);

  const fetchProductAndVariations = async () => {
    setLoading(true);
    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productData) {
      setProduct(productData);
     const { data: variationData, error } = await supabase
  .from("product_variations")
  .select(`
    *,
    color:color_id (name),
    size:size_id (name)
  `)
  .eq("product_id", productId);

console.log("VARIATIONS:", variationData);
console.log("ERROR:", error);
      if (variationData && variationData.length > 0) {
        setVariations(variationData);
        setSelectedVariation(variationData[0]);
      }
    }
    setLoading(false);
  };

  const generateBarcodeItems = () => {
    const items = Array.from({ length: qty }).map((_, index) => ({
      id: `${selectedVariation?.id || product.id}-${index}-${Date.now()}`,
      name: product.name,
      sku: selectedVariation?.sku || product.sku || `PROD-${product.id}`,
      unit: `${selectedVariation?.color?.name || ""}${selectedVariation?.size?.name ? " / " + selectedVariation.size.name : ""}`
    }));
    setGeneratedItems(items);
  };


  // This effect targets BOTH the preview and the print elements by their specific IDs
  useEffect(() => {
    if (generatedItems.length > 0) {
      // Use a small timeout to ensure the hidden DOM elements are rendered
      const timer = setTimeout(() => {
        generatedItems.forEach((item) => {
          const options = {
            format: "CODE128",
            displayValue: true,
            fontSize: 12,
            width: 1.5,
            height: 40,
            margin: 10,
          };

          // Render to Preview
          const previewEl = document.getElementById(`barcode-${item.id}`);
          if (previewEl) JsBarcode(previewEl, item.sku, options);

          // Render to Print Area
          const printEl = document.getElementById(`print-barcode-${item.id}`);
          if (printEl) JsBarcode(printEl, item.sku, options);
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [generatedItems]);

  const handlePrint = useReactToPrint({
    contentRef: printAreaRef,
    documentTitle: `${product?.name}_Barcodes`,
  });

  const handleReset = () => {
    setGeneratedItems([]);
    setQty(1);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-100 border-t-orange-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 text-slate-400 hover:text-[#c4a174] font-black transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" />
            <span className="uppercase tracking-[0.3em] text-[10px]">Back to Fleet</span>
          </button>
          <div className="text-right">
             <h1 className="text-3xl font-black text-[#2b2652] uppercase tracking-tighter">
                Barcode <span className="text-[#c4a174] italic">Engine</span>
             </h1>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-50 flex flex-col lg:flex-row gap-10 items-stretch lg:items-end transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c4a174]"></div>

          {/* Product Info Section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-2 h-2 rounded-full bg-[#c4a174]"></div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Target Entity</label>
            </div>
            <div className="group relative overflow-hidden p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-[#c4a174]/30 hover:bg-white transition-all duration-500">
              <p className="font-black text-[#2b2652] text-2xl tracking-tighter uppercase">{product.name}</p>
              <div className="text-[9px] text-[#c4a174] font-black mt-2 flex items-center gap-3 tracking-widest uppercase">
                <span className="px-3 py-1 bg-[#2b2652] text-white rounded-lg">ID: {product.id}</span>
                <span className="px-3 py-1 bg-[#2b2652] text-white rounded-lg">SKU: {product.sku}</span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="lg:w-1/3 space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Variant Configuration</label>
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <select
                  value={selectedVariation?.id || ""}
                  onChange={(e) => setSelectedVariation(variations.find(v => v.id === Number(e.target.value)))}
                  className="w-full appearance-none bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#2b2652] outline-none focus:border-[#c4a174] focus:bg-white transition-all cursor-pointer"
                >
                  {variations.map((v) => (
                    <option key={v.id} value={v.id}>
                      {[v.color?.name, v.size?.name].filter(Boolean).join(" — ") || "Default Variation"}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#c4a174]">
                  <Tag size={16} />
                </div>
              </div>

              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-28 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-lg font-black text-center text-[#2b2652] outline-none focus:border-[#c4a174] transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={generateBarcodeItems}
              className="flex-[2] bg-[#2b2652] text-[#c4a174] font-black px-10 py-5 rounded-[1.5rem] hover:bg-[#1a1733] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#2b2652]/20 uppercase text-[10px] tracking-widest"
            >
              <LayoutGrid size={18} strokeWidth={3} />
              Generate
            </button>

            <button
              onClick={handleReset}
              className="p-5 bg-slate-50 text-slate-300 rounded-[1.5rem] hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all border border-transparent hover:border-red-100"
              title="Reset"
            >
              <RotateCcw size={20} />
            </button>

            <button
              disabled={generatedItems.length === 0}
              onClick={() => handlePrint()}
              className="flex-1 bg-[#c4a174] disabled:bg-slate-100 disabled:text-slate-300 text-white font-black px-10 py-5 rounded-[1.5rem] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#c4a174]/20 uppercase text-[10px] tracking-widest disabled:shadow-none"
            >
              <Printer size={18} strokeWidth={3} />
              Print
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Digital Proof</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {generatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-200">
              <div className="relative mb-4">
                 <Tag size={64} className="opacity-20" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-[2px] bg-[#c4a174]/30 rotate-45"></div>
                 </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2">Awaiting Generation</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {generatedItems.map((item) => (
                <div key={`preview-${item.id}`} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex flex-col items-center shadow-sm hover:shadow-xl hover:shadow-[#2b2652]/5 transition-all duration-500 group">
                  <p className="text-[9px] font-black text-[#c4a174] uppercase tracking-widest mb-1 group-hover:scale-110 transition-transform">Swaadha</p>
                  <p className="text-[10px] font-bold text-[#2b2652] mb-4 text-center px-2 line-clamp-1 uppercase">{item.name}</p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl w-full flex justify-center border border-slate-100 group-hover:bg-white transition-colors">
                    <svg id={`barcode-${item.id}`} className="max-w-full"></svg>
                  </div>
                  
                  <p className="text-[9px] font-black text-slate-400 mt-4 tracking-[0.2em] uppercase">{item.unit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden Print Area */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={printAreaRef} className="print-container">
            <style>{`
              @media print {
                .print-container {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 15px;
                  padding: 20px;
                  background: white;
                }
                .print-card {
                  border: 0.5pt solid #2b2652;
                  padding: 15px;
                  text-align: center;
                  page-break-inside: avoid;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-family: sans-serif;
                }
                .brand-label { font-size: 10pt; font-weight: 900; color: #2b2652; text-transform: uppercase; margin-bottom: 2pt; }
                .name-label { font-size: 8pt; font-weight: 700; color: #000; margin-bottom: 5pt; text-transform: uppercase; }
                .unit-label { font-size: 7pt; font-weight: 900; color: #666; margin-top: 5pt; text-transform: uppercase; }
                svg { max-width: 100%; height: auto; }
              }
            `}</style>
            {generatedItems.map((item) => (
              <div key={`print-card-${item.id}`} className="print-card">
                <p className="brand-label">Swaadha</p>
                <p className="name-label">{item.name}</p>
                <svg id={`print-barcode-${item.id}`}></svg>
                <p className="unit-label">{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}