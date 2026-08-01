"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  RotateCcw, ChevronDown, Filter, Search, X, ArrowUpDown, Layers
} from "lucide-react";

export default function ProductFilters({ categories, brands, lifestyleTags, filters = {}, setFilters, isMobile = false }: any) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { category_id, subcategory_id, sub_subcategory_id, brand_id, lifestyle_tag_id, sort, search } = filters;
  
  const menuRef = useRef<HTMLDivElement>(null);
  const secondaryRowRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside (Only for Desktop viewports)
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        secondaryRowRef.current && !secondaryRowRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Sort Brands List Alphabetically A-Z dynamically
  const sortedBrands = useMemo(() => {
    if (!brands) return [];
    return [...brands].sort((a: any, b: any) => {
      const nameA = (a.name_en || "").toLowerCase();
      const nameB = (b.name_en || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [brands]);

  const activeCategory = useMemo(() =>
    categories?.find((c: any) => Number(c.id) === Number(category_id)),
    [categories, category_id]
  );

  const activeSubCategory = useMemo(() =>
    activeCategory?.subcategories?.find((s: any) => Number(s.id) === Number(subcategory_id)),
    [activeCategory, subcategory_id]
  );

  const activeBrandName = useMemo(() =>
    sortedBrands?.find((b: any) => Number(b.id) === Number(brand_id))?.name_en,
    [sortedBrands, brand_id]
  );

  const handleCatSelect = (id: number) => {
    const selectedCat = categories?.find((c: any) => Number(c.id) === Number(id));
    const hasSubcategories = selectedCat?.subcategories && selectedCat.subcategories.length > 0;
    const isSame = Number(category_id) === Number(id);

    setFilters({ 
      ...filters, 
      category_id: isSame ? null : id, 
      subcategory_id: null, 
      sub_subcategory_id: null 
    });

    // If it has no subcategories or we are toggling off, do not show the refinement row
    setActiveMenu(isSame ? null : (hasSubcategories ? 'refinement' : null));
  };

  const sortOptions = [
    { id: 'latest', label: 'Newest' },
    { id: 'alpha', label: 'Alphabetical' },
    { id: 'price_asc', label: 'Price: Low-High' },
    { id: 'price_desc', label: 'Price: High-Low' },
    { id: 'oldest', label: 'Oldest' },
  ];

  // Global reset handler explicitly invoked across viewport boundaries
  const handleGlobalReset = () => {
    setFilters({
      category_id: null,
      subcategory_id: null,
      sub_subcategory_id: null,
      brand_id: null,
      lifestyle_tag_id: null,
      sort: 'latest',
      search: ""
    });
    setActiveMenu(null);
  };

  // --- MOBILE FILTER UI RENDER ---
  if (isMobile) {
    return (
      <div className="w-full flex flex-col gap-6 text-left p-1">
        {/* SEARCH FILTER */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Search Products</label>
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-xl w-full focus-within:border-slate-900 dark:focus-within:border-gray-400 transition-all">
            <Search size={14} className="text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="What are you looking for?"
              value={search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-transparent border-none outline-none text-xs font-semibold text-slate-800 dark:text-gray-200 placeholder:text-slate-300 dark:placeholder:text-gray-600 flex-1"
            />
            {search && (
              <button 
                onClick={() => setFilters({ ...filters, search: "" })}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-[#333] transition-all"
              >
                <X size={14} className="text-slate-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* SORT */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Sort Ordering</label>
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilters({ ...filters, sort: opt.id })}
                className={`py-2.5 px-3 border text-center rounded-xl text-[11px] font-semibold tracking-wide transition-all ${sort === opt.id ? 'bg-slate-950 border-slate-950 text-white shadow-sm dark:bg-white dark:border-white dark:text-black' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50 dark:bg-[#111] dark:border-[#333] dark:text-gray-300 dark:active:bg-[#222]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* BRANDS */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Select Brand</label>
            {brand_id && (
              <button 
                onClick={() => setFilters({ ...filters, brand_id: null })}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider transition-all"
              >
                Clear Brand
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-[#111] rounded-xl border border-slate-200/60 dark:border-[#333]">
            {sortedBrands?.map((brand: any) => {
              const isSelected = Number(brand_id) === Number(brand.id);
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setFilters({ ...filters, brand_id: isSelected ? null : brand.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-sm dark:bg-white dark:border-white dark:text-black' : 'bg-white text-slate-700 border-slate-200 active:bg-slate-100 dark:bg-[#222] dark:text-gray-300 dark:border-[#333] dark:active:bg-[#333]'}`}
                >
                  {brand.name_en}
                </button>
              );
            })}
          </div>
        </div>

        {/* LIFESTYLE */}
        {lifestyleTags && lifestyleTags.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Lifestyle</label>
              {lifestyle_tag_id && (
                <button 
                  onClick={() => setFilters({ ...filters, lifestyle_tag_id: null })}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider transition-all"
                >
                  Clear Lifestyle
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lifestyleTags.map((tag: any) => {
                const isSelected = Number(lifestyle_tag_id) === Number(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setFilters({ ...filters, lifestyle_tag_id: isSelected ? null : tag.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white text-slate-600 border-slate-200 dark:bg-[#222] dark:text-gray-400 dark:border-[#333]'}`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MASTER DEPARTMENT SELECTORS */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Department</label>
            {category_id && (
              <button 
                onClick={() => setFilters({ ...filters, category_id: null, subcategory_id: null, sub_subcategory_id: null })}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider transition-all"
              >
                Clear Dept
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {categories?.map((cat: any) => {
              const isCatSelected = Number(category_id) === Number(cat.id);
              const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
              
              return (
                <div key={cat.id} className="flex flex-col w-full">
                  <button
                    type="button"
                    onClick={() => handleCatSelect(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold text-xs border ${isCatSelected ? 'bg-slate-950 border-slate-950 text-white shadow-md dark:bg-white dark:border-white dark:text-black' : 'bg-white border-slate-200 text-slate-700 dark:bg-[#111] dark:border-[#333] dark:text-gray-300'}`}
                  >
                    <span>{cat.name}</span>
                    {hasSubcategories && (
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isCatSelected ? 'rotate-180 text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-gray-500'}`} />
                    )}
                  </button>

                  {/* Render Mobile Deep Subcategories inline when selected */}
                  {isCatSelected && hasSubcategories && (
                    <div className="p-3 bg-slate-50 dark:bg-[#111] border-x border-b border-slate-200 dark:border-[#333] rounded-b-xl flex flex-col gap-3 -mt-1 mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.map((sub: any) => {
                          const isSubSelected = Number(subcategory_id) === Number(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setFilters({ ...filters, subcategory_id: isSubSelected ? null : sub.id, sub_subcategory_id: null })}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${isSubSelected ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-500 dark:border-amber-500 dark:text-black' : 'bg-white border-slate-200 text-slate-600 dark:bg-[#222] dark:border-[#333] dark:text-gray-400'}`}
                            >
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* Level 3 deep nested categories wrapper */}
                      {activeSubCategory && Number(subcategory_id) === Number(cat.subcategories.find((s: any) => Number(s.id) === Number(subcategory_id))?.id) && activeSubCategory.sub_subcategories?.length > 0 && (
                        <div className="mt-1 pt-2 border-t border-slate-200/60 dark:border-[#333] flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Layers size={10} /> Refined Grouping:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {activeSubCategory.sub_subcategories.map((ss: any) => {
                              const isSubSubSelected = Number(sub_subcategory_id) === Number(ss.id);
                              return (
                                <button
                                  key={ss.id}
                                  type="button"
                                  onClick={() => setFilters({ ...filters, sub_subcategory_id: isSubSubSelected ? null : ss.id })}
                                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${isSubSubSelected ? 'text-slate-950 bg-amber-100 font-bold border border-amber-200 dark:text-amber-100 dark:bg-amber-950/50 dark:border-amber-800' : 'text-slate-500 bg-white border border-slate-100 dark:text-gray-400 dark:bg-[#222] dark:border-[#333]'}`}
                                >
                                  • {ss.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* GLOBAL MASTER RESET */}
        {(category_id || brand_id || lifestyle_tag_id || sort !== 'latest' || search) && (
          <button
            type="button"
            onClick={handleGlobalReset}
            className="w-full mt-4 py-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <RotateCcw size={14} />
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  // --- DESKTOP RENDER VIEWPORT LAYER ---
  return (
    <div className="relative w-full flex items-center justify-between gap-2 z-[60]">
      
      {/* SEARCH FIELD */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-[#111] rounded-full border border-slate-200 dark:border-[#333] focus-within:border-slate-900 dark:focus-within:border-gray-400 transition-all max-w-[200px]">
        <Search size={13} className="text-slate-400 dark:text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="SEARCH..."
          value={search || ""}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="bg-transparent border-none outline-none text-[10px] font-bold tracking-wider text-slate-800 dark:text-gray-200 placeholder:text-slate-300 dark:placeholder:text-gray-600 w-full"
        />
        {search && (
          <button onClick={() => setFilters({ ...filters, search: "" })} className="shrink-0">
            <X size={12} className="text-slate-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400" />
          </button>
        )}
      </div>

      {/* FILTER ACTION DROPDOWNS WRAPPER */}
      <div className="flex items-center gap-1.5 flex-1 justify-start ml-2">
        
        {/* SORT CONTROL */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'sort' ? null : 'sort')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-semibold ${activeMenu === 'sort' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-[#222]'}`}
          >
            <ArrowUpDown size={12} />
            <span className="max-w-[90px] truncate">{sortOptions.find(o => o.id === sort)?.label || "Sort"}</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${activeMenu === 'sort' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'sort' && (
            <div ref={menuRef} className="absolute top-[125%] left-0 w-44 bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-xl rounded-xl p-1 z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, sort: opt.id });
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sort === opt.id ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'hover:bg-slate-50 text-slate-600 dark:hover:bg-[#222] dark:text-gray-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BRAND CONTROL */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'brand' ? null : 'brand')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-semibold ${brand_id ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300' : 'text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-[#222]'}`}
          >
            <span className="max-w-[90px] truncate">{activeBrandName || "Brand"}</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${activeMenu === 'brand' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'brand' && (
            <div ref={menuRef} className="absolute top-[125%] left-0 w-48 bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-xl rounded-xl p-1 z-[100] animate-in fade-in slide-in-from-top-1 max-h-[240px] overflow-y-auto duration-150">
              {sortedBrands?.map((brand: any) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, brand_id: brand_id === brand.id ? null : brand.id });
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Number(brand_id) === Number(brand.id) ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-[#222] dark:text-gray-400'}`}
                >
                  {brand.name_en}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LIFESTYLE CONTROL */}
        {lifestyleTags && lifestyleTags.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'lifestyle' ? null : 'lifestyle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${lifestyle_tag_id ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300' : 'text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-[#222]'}`}
            >
              <Filter size={12} />
              <span className="max-w-[90px] truncate">
                {lifestyleTags?.find((l: any) => Number(l.id) === Number(lifestyle_tag_id))?.name || "Lifestyle"}
              </span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${activeMenu === 'lifestyle' ? 'rotate-180' : ''}`} />
            </button>

            {activeMenu === 'lifestyle' && (
              <div ref={menuRef} className="absolute top-[125%] left-0 w-44 bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-xl rounded-xl p-1 z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
                {lifestyleTags?.map((tag: any) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, lifestyle_tag_id: lifestyle_tag_id === tag.id ? null : tag.id });
                      setActiveMenu(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Number(lifestyle_tag_id) === Number(tag.id) ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'hover:bg-slate-50 text-slate-600 dark:hover:bg-[#222] dark:text-gray-400'}`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEPARTMENT ROOT NAVIGATION CHIPS */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111] p-1 rounded-full border border-slate-200 dark:border-[#333]">
        {categories?.map((cat: any) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCatSelect(cat.id)}
            className={`px-4 py-1.5 rounded-full transition-all text-xs font-semibold ${Number(category_id) === Number(cat.id) ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-black' : 'text-slate-600 hover:text-slate-950 dark:text-gray-400 dark:hover:text-white'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* RESET GLOBALS BUTTON */}
      {(category_id || brand_id || lifestyle_tag_id || sort !== 'latest' || search) && (
        <button
          type="button"
          onClick={handleGlobalReset}
          className="ml-2 p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-full transition-all shadow-sm"
          title="Reset selections"
        >
          <RotateCcw size={13} />
        </button>
      )}

      {/* --- LAYER 2 & 3: DESKTOP SUB-REFINEMENT FLOATING CONTAINER --- */}
      {activeCategory && activeCategory.subcategories && activeCategory.subcategories.length > 0 && activeMenu === 'refinement' && (
        <div 
          ref={secondaryRowRef} 
          className="absolute top-[140%] right-0 min-w-[340px] max-w-xl bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border border-slate-200 dark:border-[#333] rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[110]"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              Sub-Groups
            </div>
            {activeCategory.subcategories?.map((sub: any) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setFilters({ ...filters, subcategory_id: subcategory_id === sub.id ? null : sub.id, sub_subcategory_id: null })}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${Number(subcategory_id) === Number(sub.id) ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 dark:bg-[#222] dark:border-[#333] dark:text-gray-400 dark:hover:text-white'}`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {activeSubCategory && activeSubCategory.sub_subcategories?.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-2.5 border-t border-dashed border-slate-200 dark:border-[#333]">
              {activeSubCategory.sub_subcategories.map((ss: any) => (
                <button
                  key={ss.id}
                  type="button"
                  onClick={() => setFilters({ ...filters, sub_subcategory_id: sub_subcategory_id === ss.id ? null : ss.id })}
                  className="flex items-center gap-1.5 group"
                >
                  <div className={`h-1 w-1 rounded-full transition-all ${Number(sub_subcategory_id) === Number(ss.id) ? 'bg-amber-500 scale-150' : 'bg-slate-300 dark:bg-gray-600'}`} />
                  <span className={`text-xs font-medium transition-colors ${Number(sub_subcategory_id) === Number(ss.id) ? 'text-slate-950 dark:text-white font-semibold' : 'text-slate-400 group-hover:text-slate-700 dark:text-gray-500 dark:group-hover:text-gray-300'}`}>
                    {ss.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}