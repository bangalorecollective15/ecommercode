"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  ChevronRight, RotateCcw, ChevronDown, 
  Calendar, ShieldCheck 
} from "lucide-react";

export default function ProductFilters({ categories, brands, filters = {}, setFilters }: any) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { category_id, subcategory_id, sub_subcategory_id, brand_id, sort } = filters;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCategory = useMemo(() => 
    categories?.find((c: any) => Number(c.id) === Number(category_id)),
    [categories, category_id]
  );

  const activeSubCategory = useMemo(() => 
    activeCategory?.subcategories?.find((s: any) => Number(s.id) === Number(subcategory_id)),
    [activeCategory, subcategory_id]
  );

  const activeBrandName = useMemo(() => 
    brands?.find((b: any) => Number(b.id) === Number(brand_id))?.name_en,
    [brands, brand_id]
  );

  const handleCatSelect = (id: number) => {
    setFilters({ ...filters, category_id: id, subcategory_id: null, sub_subcategory_id: null });
    setActiveMenu(null);
  };

  const sortOptions = [
    { id: 'latest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'alpha', label: 'A-Z' },
  ];

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="inline-flex items-center gap-1 p-2 bg-white border border-slate-200 shadow-2xl rounded-full z-[60] transition-all duration-500 ease-in-out">
        
        {/* 1. SORTING DROPDOWN */}
        <div className="relative border-r border-slate-100 pr-2 shrink-0">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'sort' ? null : 'sort')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all font-bold text-[13px] uppercase tracking-tighter ${activeMenu === 'sort' ? 'bg-slate-50' : ''}`}
          >
            <Calendar size={15} className="text-slate-400" />
            <span className="text-slate-900">{sortOptions.find(o => o.id === sort)?.label || "Sort"}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'sort' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'sort' && (
            <div ref={menuRef} className="absolute top-[125%] left-0 w-44 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[100] animate-in fade-in zoom-in-95">
              {sortOptions.map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => {
                    setFilters({...filters, sort: opt.id});
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${sort === opt.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. BRAND DROPDOWN (New Addition) */}
        <div className="relative border-r border-slate-100 pr-2 shrink-0">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'brand' ? null : 'brand')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all font-bold text-[13px] uppercase tracking-tighter ${brand_id ? 'bg-orange-50 text-orange-600' : 'text-slate-900 hover:bg-slate-50'}`}
          >
            <ShieldCheck size={15} className={brand_id ? 'text-orange-500' : 'text-slate-400'} />
            <span>{activeBrandName || "Brand"}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'brand' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'brand' && (
            <div ref={menuRef} className="absolute top-[125%] left-0 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[100] animate-in fade-in zoom-in-95 max-h-[300px] overflow-y-auto custom-scrollbar">
              <p className="px-4 py-2 text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Select Maison</p>
              {brands?.filter((b: any) => b.status).map((brand: any) => (
                <button 
                  key={brand.id}
                  onClick={() => {
                    setFilters({...filters, brand_id: brand.id});
                    setActiveMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${Number(brand_id) === Number(brand.id) ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                >
                  {brand.name_en}
                  {brand.image_url && <img src={brand.image_url} alt="" className="w-4 h-4 rounded-full grayscale" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. MAIN CATEGORIES */}
        <div className="flex items-center gap-1 px-2 shrink-0">
          {categories?.map((cat: any) => (
            <button 
              key={cat.id} 
              onClick={() => handleCatSelect(cat.id)}
              className={`px-5 py-2.5 rounded-full transition-all whitespace-nowrap font-bold text-[13px] uppercase tracking-widest ${Number(category_id) === Number(cat.id) ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 4. SUB-CATEGORIES */}
        {activeCategory && (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in duration-500 border-l border-slate-100 pl-3 shrink-0">
            <ChevronRight size={18} className="text-orange-500" />
            <div className="flex items-center gap-1">
              {activeCategory.subcategories?.map((sub: any) => (
                <button 
                  key={sub.id} 
                  onClick={() => setFilters({...filters, subcategory_id: sub.id, sub_subcategory_id: null})}
                  className={`px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${Number(subcategory_id) === Number(sub.id) ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300'}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. SUB-SUB-CATEGORIES */}
        {activeSubCategory && activeSubCategory.sub_subcategories?.length > 0 && (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-500 border-l border-slate-100 pl-3 pr-2 shrink-0">
             <ChevronRight size={18} className="text-orange-500" />
            <div className="flex items-center gap-1.5">
              {activeSubCategory.sub_subcategories.map((ss: any) => (
                <button 
                  key={ss.id} 
                  onClick={() => setFilters({...filters, sub_subcategory_id: ss.id})}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all whitespace-nowrap ${Number(sub_subcategory_id) === Number(ss.id) ? 'text-white bg-slate-600' : 'text-slate-400 hover:text-slate-800 bg-slate-50'}`}
                >
                  {ss.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESET BUTTON */}
        {(category_id || brand_id || sort !== 'latest') && (
          <button 
            onClick={() => setFilters({category_id:null, subcategory_id:null, sub_subcategory_id:null, brand_id:null, sort:'latest'})} 
            className="ml-2 mr-1 p-2.5 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all shrink-0"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  );
}