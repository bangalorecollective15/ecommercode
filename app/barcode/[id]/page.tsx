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
    const items = Array.from({ length: qty }).map((_, index) => {
      const hasValidColor = selectedVariation?.color?.name && selectedVariation.color.name.toLowerCase() !== "default";
      const colorPart = hasValidColor ? selectedVariation.color.name : "";
      const sizePart = selectedVariation?.size?.name || "";

      const unitText = [colorPart, sizePart].filter(Boolean).join(" / ");

      return {
        id: `${selectedVariation?.id || product.id}-${index}-${Date.now()}`,
        name: product.name,
        sku: selectedVariation?.sku || product.sku || `PROD-${product.id}`,
        unit: unitText || "N/A",
        price: selectedVariation ? (selectedVariation.sale_price || selectedVariation.price) : (product.price || 0)
      };
    });
    setGeneratedItems(items);
  };

  useEffect(() => {
    if (generatedItems.length > 0) {
      const timer = setTimeout(() => {
        generatedItems.forEach((item) => {
          const options = {
            format: "CODE128",
            displayValue: true,
            fontSize: 10,
            width: 1.2,
            height: 32,
            margin: 0,
          };

          const previewEl = document.getElementById(`barcode-${item.id}`);
          if (previewEl) JsBarcode(previewEl, item.sku, options);

          const printEl = document.getElementById(`print-barcode-${item.id}`);
          if (printEl) {
            // Smaller barcode in print mode so the unit/price footer always
            // has guaranteed room inside the fixed 70mm x 30mm card —
            // previously a long product name + full-height barcode could
            // push the footer row (unit/variation + price) past the
            // physical label boundary, clipping it on the printed output.
            JsBarcode(printEl, item.sku, {
              ...options,
              fontSize: 8,
              width: 1,
              height: 22,
            });
          }
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
                  {variations.map((v) => {
                    const hasValidColor = v.color?.name && v.color.name.toLowerCase() !== "default";
                    const colorLabel = hasValidColor ? v.color.name : "";
                    const sizeLabel = v.size?.name || "";

                    let variationLabel = "";
                    if (colorLabel && sizeLabel) {
                      variationLabel = `${colorLabel} / ${sizeLabel}`;
                    } else {
                      variationLabel = colorLabel || sizeLabel || "Standard";
                    }

                    const displayPrice = v.sale_price ? `₹${v.sale_price} (was ₹${v.price})` : `₹${v.price}`;

                    return (
                      <option key={v.id} value={v.id}>
                        {variationLabel} — {displayPrice}
                      </option>
                    );
                  })}
                </select>
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
                  <p className="text-[9px] font-black text-[#c4a174] uppercase tracking-widest mb-1 group-hover:scale-110 transition-transform">Bangalore Collective</p>
                  <p className="text-[10px] font-bold text-[#2b2652] mb-4 text-center px-2 line-clamp-1 uppercase">{item.name}</p>

                  <div className="bg-slate-50 p-4 rounded-2xl w-full flex justify-center border border-slate-100 group-hover:bg-white transition-colors">
                    <svg id={`barcode-${item.id}`} className="max-w-full"></svg>
                  </div>

                  <div className="mt-4 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">{item.unit}</p>
                    <p className="text-xs font-black text-[#2b2652]">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dedicated 70mm x 30mm Print Environment */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={printAreaRef} className="print-container">
            <style>{`
              @page {
                size: 70mm 30mm;
                margin: 0 !important;
              }
              @media print {
                html, body {
                  width: 70mm;
                  height: 30mm;
                  background: #fff;
                }
                .print-container {
                  display: block;
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                .print-card {
                  width: 70mm;
                  height: 30mm;
                  padding: 1.5mm 3mm;
                  box-sizing: border-box;
                  page-break-inside: avoid;
                  page-break-after: always;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: flex-start;
                  font-family: Arial, sans-serif;
                  overflow: hidden;
                }
                .brand-label {
                  font-size: 6.5pt;
                  font-weight: 800;
                  color: #000;
                  text-transform: uppercase;
                  line-height: 1;
                  margin: 0;
                  flex: 0 0 auto;
                }
                .name-label {
                  font-size: 6pt;
                  font-weight: 700;
                  color: #000;
                  text-transform: uppercase;
                  line-height: 1.05;
                  /* Single line only — long names previously consumed up to
                     2.2em and pushed the footer (unit/variation + price)
                     past the 30mm card boundary, which is why it printed
                     fine on screen but vanished on the physical label. */
                  max-height: 1.1em;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  width: 100%;
                  text-align: center;
                  margin: 1px 0;
                  flex: 0 0 auto;
                }
                .barcode-wrapper {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: 100%;
                  flex: 1 1 auto;
                  min-height: 0;
                  overflow: hidden;
                }
                .barcode-wrapper svg {
                  width: 100% !important;
                  height: 100% !important;
                  max-height: 13mm;
                }
                .footer-row {
                  display: flex;
                  width: 100%;
                  justify-content: space-between;
                  align-items: center;
                  border-top: 0.5px dashed #000;
                  padding-top: 1px;
                  margin-top: 1px;
                  flex: 0 0 auto;
                  /* Guarantees this row is never squeezed out regardless of
                     how much space the name/barcode take above it. */
                }
                .unit-label {
                  font-size: 6pt;
                  font-weight: 700;
                  color: #333;
                  text-transform: uppercase;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 60%;
                }
                .price-label {
                  font-size: 7.5pt;
                  font-weight: 900;
                  color: #000;
                  white-space: nowrap;
                }
              }
            `}</style>
            {generatedItems.map((item) => (
              <div key={`print-card-${item.id}`} className="print-card">
                <p className="brand-label">Bangalore Collective</p>
                <p className="name-label">{item.name}</p>
                <div className="barcode-wrapper">
                  <svg id={`print-barcode-${item.id}`}></svg>
                </div>
                <div className="footer-row">
                  <span className="unit-label">{item.unit}</span>
                  <span className="price-label">MRP: ₹{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}