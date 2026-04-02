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
      const { data: variationData } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", productId);

      if (variationData && variationData.length > 0) {
        setVariations(variationData);
        setSelectedVariation(variationData[0]);
      }
    }
    setLoading(false);
  };

  const generateBarcodeItems = () => {
    const items = Array.from({ length: qty }).map((_, index) => ({
      // Added Date.now() to ensure IDs are always fresh on re-generate
      id: `${selectedVariation?.id || product.id}-${index}-${Date.now()}`,
      name: product.name,
      sku: selectedVariation?.sku || product.sku || `PROD-${product.id}`,
      unit: selectedVariation?.unit_value || product.unit_type || "Unit",
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
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="max-w-8xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1" />
            <span className="uppercase tracking-widest text-xs">Back</span>
          </button>
          <h1 className="text-2xl font-black text-gray-900 uppercase">Barcode Generator</h1>
        </div>

       {/* Configuration Card */}
<div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col lg:flex-row gap-8 items-stretch lg:items-end transition-all">
  
  {/* Product Info Section */}
  <div className="flex-1 space-y-3">
    <div className="flex items-center gap-2 px-1">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
      <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.1em]">Selected Product</label>
    </div>
    <div className="group relative overflow-hidden p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-white transition-all duration-300">
      <p className="font-extrabold text-gray-900 text-lg leading-tight">{product.name}</p>
      <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">ID: {product.id}</span>
        <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">SKU: {product.sku}</span>
      </p>
    </div>
  </div>

  {/* Selection Controls */}
  <div className="lg:w-1/3 space-y-3">
    <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.1em] px-1">Variation & Quantity</label>
    <div className="flex gap-3">
      <div className="relative flex-1 group">
        <select
          value={selectedVariation?.id || ""}
          onChange={(e) => setSelectedVariation(variations.find(v => v.id === Number(e.target.value)))}
          className="w-full appearance-none bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
        >
          {variations.map((v) => (
            <option key={v.id} value={v.id}>{v.unit_type} — {v.unit_value}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
          <Tag size={16} />
        </div>
      </div>
      
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="w-24 bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black text-center text-gray-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all"
      />
    </div>
  </div>

  {/* Action Buttons */}
  <div className="flex gap-3">
    <button 
      onClick={generateBarcodeItems} 
      className="flex-[2] bg-gray-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200 hover:shadow-orange-200"
    >
      <LayoutGrid size={20} className="stroke-[2.5px]" />
      <span className="tracking-tight">Generate</span>
    </button>

    <button 
      onClick={handleReset} 
      className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all border border-transparent hover:border-red-100"
      title="Reset"
    >
      <RotateCcw size={20} />
    </button>

    <button 
      disabled={generatedItems.length === 0} 
      onClick={() => handlePrint()} 
      className="flex-1 bg-green-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold px-8 py-4 rounded-2xl hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-100 disabled:shadow-none"
    >
      <Printer size={20} className="stroke-[2.5px]" />
      <span className="tracking-tight">Print</span>
    </button>
  </div>
</div>

        {/* Preview Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-gray-100 rounded-full"></div>
            <span className="text-[10px] font-black text-gray-300 uppercase">Preview</span>
            <div className="h-1 flex-1 bg-gray-100 rounded-full"></div>
          </div>

          {generatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Tag size={48} />
              <p className="text-sm font-medium uppercase mt-2">No Barcodes</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generatedItems.map((item) => (
                <div key={`preview-${item.id}`} className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center shadow-sm">
                   <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Swaadha</p>
                   <p className="text-[10px] font-bold text-gray-800 mb-2">{item.name}</p>
                   {/* PREVIEW ID */}
                   <svg id={`barcode-${item.id}`} className="max-w-full"></svg>
                   <p className="text-[9px] font-bold text-gray-400 mt-2 tracking-widest">{item.unit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden Print Area */}
        {/* We use visibility: hidden instead of display: none to ensure JsBarcode can calculate dimensions */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={printAreaRef} className="print-container">
            <style>{`
              @media print {
                .print-container {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 10px;
                  padding: 10px;
                }
                .print-card {
                  border: 1px solid #000;
                  padding: 15px;
                  text-align: center;
                  page-break-inside: avoid;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                svg { max-width: 100%; height: auto; }
              }
            `}</style>
            {generatedItems.map((item) => (
              <div key={`print-card-${item.id}`} className="print-card">
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Swaadha</p>
                <p style={{ fontSize: '10px', margin: '0 0 5px 0' }}>{item.name}</p>
                {/* UNIQUE PRINT ID */}
                <svg id={`print-barcode-${item.id}`}></svg>
                <p style={{ fontSize: '9px', marginTop: '5px' }}>{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}