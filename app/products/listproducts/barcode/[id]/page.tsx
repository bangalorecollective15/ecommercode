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

  // Generate barcodes in the state rather than manual DOM manipulation
  const generateBarcodeItems = () => {
    const items = Array.from({ length: qty }).map((_, index) => ({
      id: `${selectedVariation?.id || product.id}-${index}`,
      name: product.name,
      sku: selectedVariation?.sku || product.sku || `PROD-${product.id}`,
      unit: selectedVariation?.unit_value || product.unit_type || "Unit",
    }));
    setGeneratedItems(items);
  };

  // Re-run JsBarcode whenever generatedItems changes
  useEffect(() => {
    if (generatedItems.length > 0) {
      generatedItems.forEach((item) => {
        const el = document.getElementById(`barcode-${item.id}`);
        if (el) {
          JsBarcode(el, item.sku, {
            format: "CODE128",
            displayValue: true,
            fontSize: 12,
            width: 1.5,
            height: 40,
            margin: 0,
          });
        }
      });
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
            <span className="uppercase tracking-widest text-xs">Back to Product</span>
          </button>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Barcode Generator</h1>
        </div>

        {/* Configuration Card */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Product Details</label>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="font-bold text-gray-800">{product.name}</p>
              <p className="text-xs text-gray-500">Master SKU: {product.sku}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Select Variation & Qty</label>
            <div className="flex gap-2">
              <select
                value={selectedVariation?.id || ""}
                onChange={(e) => setSelectedVariation(variations.find(v => v.id === Number(e.target.value)))}
                className="flex-1 bg-gray-50 border border-gray-100 p-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {variations.map((v) => (
                  <option key={v.id} value={v.id}>{v.unit_type} ({v.unit_value})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-20 bg-gray-50 border border-gray-100 p-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none text-center"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generateBarcodeItems}
              className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
            >
              <LayoutGrid size={18} /> Generate
            </button>
            <button
              onClick={handleReset}
              className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all"
            >
              <RotateCcw size={18} />
            </button>
            <button
              disabled={generatedItems.length === 0}
              onClick={() => handlePrint()}
              className="flex-1 bg-green-600 disabled:bg-gray-200 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
            >
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-gray-100 rounded-full"></div>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Preview Area</span>
            <div className="h-1 flex-1 bg-gray-100 rounded-full"></div>
          </div>

          {generatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 space-y-2">
              <Tag size={48} strokeWidth={1} />
              <p className="text-sm font-medium tracking-widest uppercase">No Barcodes Generated</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generatedItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center shadow-sm">
                   <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Swaadha</p>
                   <p className="text-[10px] font-bold text-gray-800 text-center mb-2 truncate w-full">{item.name}</p>
                   <svg id={`barcode-${item.id}`} className="max-w-full"></svg>
                   <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{item.unit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden Print Area */}
        <div className="hidden">
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
                  border: 1px solid #eee;
                  padding: 15px;
                  text-align: center;
                  page-break-inside: avoid;
                }
              }
            `}</style>
            {generatedItems.map((item) => (
              <div key={`print-${item.id}`} className="print-card">
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Swaadha</p>
                <p style={{ fontSize: '10px', margin: '0 0 5px 0' }}>{item.name}</p>
                <svg id={`barcode-${item.id}`} style={{ width: '100%' }}></svg>
                <p style={{ fontSize: '9px', marginTop: '5px' }}>{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}