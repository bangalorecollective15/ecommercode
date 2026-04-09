"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  ChevronRight, RotateCcw, ChevronDown, 
  Calendar, ShieldCheck, Filter 
} from "lucide-react";

export default function ProductFilters({ categories, brands, lifestyleTags, filters = {}, setFilters }: any) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { category_id, subcategory_id, sub_subcategory_id, brand_id, lifestyle_tag_id, sort } = filters;
  const menuRef = useRef<HTMLDivElement>(null);
console.log("Selected Filter:", filters.lifestyle_tag_id);
  // Close dropdowns on click outside
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
    { id: 'latest', label: 'Newest Arrivals' },
    { id: 'oldest', label: 'Archive' },
    { id: 'alpha', label: 'Alphabetical' },
  ];

  return (
    <div className="w-full flex flex-col items-center py-8 px-4 space-y-4">
      {/* --- LAYER 1: THE COMMAND BAR (Sort, Brand, Main Categories) --- */}
      <div className="flex flex-wrap justify-center items-center gap-2 p-2 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-[0_20px_50px_rgba(43,38,82,0.05)] rounded-[2rem] z-[60]">
        
        {/* SORT BUTTON */}
        <div className="relative border-r border-slate-100 pr-2">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'sort' ? null : 'sort')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all font-black text-[11px] uppercase tracking-widest ${activeMenu === 'sort' ? 'text-brand-gold bg-slate-50' : 'text-brand-blue hover:bg-slate-50'}`}
          >
            <Calendar size={14} />
            <span>{sortOptions.find(o => o.id === sort)?.label || "Sort"}</span>
            <ChevronDown size={12} className={`transition-transform duration-300 ${activeMenu === 'sort' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'sort' && (
            <div ref={menuRef} className="absolute top-[130%] left-0 w-48 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2">
              {sortOptions.map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => {
                    setFilters({...filters, sort: opt.id});
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${sort === opt.id ? 'bg-brand-blue text-white' : 'hover:bg-slate-50 text-slate-400 hover:text-brand-blue'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BRAND BUTTON */}
        <div className="relative border-r border-slate-100 pr-2">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'brand' ? null : 'brand')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all font-black text-[11px] uppercase tracking-widest ${brand_id ? 'text-brand-gold' : 'text-brand-blue hover:bg-slate-50'}`}
          >
            <ShieldCheck size={14} />
            <span>{activeBrandName || "Designer"}</span>
          </button>

          {activeMenu === 'brand' && (
            <div ref={menuRef} className="absolute top-[130%] left-0 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2 max-h-[400px] overflow-y-auto no-scrollbar">
              <div className="px-4 py-2 text-[9px] font-black text-slate-300 tracking-[0.3em] uppercase border-b border-slate-50 mb-1">Curation By Maison</div>
              {brands?.map((brand: any) => (
                <button 
                  key={brand.id}
                  onClick={() => {
                    setFilters({...filters, brand_id: brand.id});
                    setActiveMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${Number(brand_id) === Number(brand.id) ? 'bg-brand-gold text-white' : 'hover:bg-brand-blue/5 text-brand-blue'}`}
                >
                  {brand.name_en}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* LIFESTYLE BUTTON */}
<div className="relative border-r border-slate-100 pr-2">
  <button 
    onClick={() => setActiveMenu(activeMenu === 'lifestyle' ? null : 'lifestyle')}
    className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-widest ${
      lifestyle_tag_id ? 'text-brand-gold' : 'text-brand-blue hover:bg-slate-50'
    }`}
  >
    <Filter size={14} />
    <span>
      {lifestyleTags?.find((l:any)=>Number(l.id)===Number(lifestyle_tag_id))?.name || "Lifestyle"}
    </span>
  </button>

  {activeMenu === 'lifestyle' && (
    <div ref={menuRef} className="absolute top-[130%] left-0 w-56 bg-white border shadow-xl rounded-2xl p-2 z-[100]">
      {lifestyleTags?.map((tag:any)=>(
        <button
          key={tag.id}
          onClick={()=>{
            setFilters({...filters, lifestyle_tag_id: tag.id});
            setActiveMenu(null);
          }}
          className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase ${
            Number(lifestyle_tag_id)===Number(tag.id)
              ? 'bg-brand-blue text-white'
              : 'hover:bg-slate-50'
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )}
</div>

        {/* MAIN CATEGORIES */}
        <div className="flex items-center gap-1 px-2">
          {categories?.map((cat: any) => (
            <button 
              key={cat.id} 
              onClick={() => handleCatSelect(cat.id)}
              className={`px-6 py-2 rounded-full transition-all font-black text-[11px] uppercase tracking-widest ${Number(category_id) === Number(cat.id) ? 'bg-brand-blue text-white shadow-xl' : 'text-slate-400 hover:text-brand-blue hover:bg-slate-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* RESET ACTION */}
        {(category_id || brand_id || lifestyle_tag_id || sort !== 'latest') && (
          <button 
            onClick={() => setFilters({
  category_id:null,
  subcategory_id:null,
  sub_subcategory_id:null,
  brand_id:null,
  lifestyle_tag_id:null,
  sort:'latest'
})} 
            className="ml-2 p-2 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-white rounded-full transition-all active:scale-90"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* --- LAYER 2: SUBCATEGORY WRAPPER (No Scroll, Grid-based) --- */}
      {activeCategory && (
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-gold text-white rounded-full text-[9px] font-black uppercase tracking-widest mr-2">
            <Filter size={10} /> Refining
          </div>
          {activeCategory.subcategories?.map((sub: any) => (
            <button 
              key={sub.id} 
              onClick={() => setFilters({...filters, subcategory_id: sub.id, sub_subcategory_id: null})}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${Number(subcategory_id) === Number(sub.id) ? 'bg-brand-blue border-brand-blue text-white' : 'bg-transparent border-slate-100 text-slate-400 hover:border-brand-gold hover:text-brand-gold'}`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* --- LAYER 3: SUB-SUB-CATEGORIES (Minimalist Links) --- */}
      {activeSubCategory && activeSubCategory.sub_subcategories?.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-4 pt-2 animate-in slide-in-from-bottom-2 duration-500">
          {activeSubCategory.sub_subcategories.map((ss: any) => (
            <button 
              key={ss.id} 
              onClick={() => setFilters({...filters, sub_subcategory_id: ss.id})}
              className={`group flex flex-col items-center gap-1 transition-all ${Number(sub_subcategory_id) === Number(ss.id) ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${Number(sub_subcategory_id) === Number(ss.id) ? 'text-brand-blue' : 'text-slate-400'}`}>
                {ss.name}
              </span>
              <div className={`h-1 w-1 rounded-full transition-all ${Number(sub_subcategory_id) === Number(ss.id) ? 'bg-brand-gold w-4' : 'bg-transparent'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}