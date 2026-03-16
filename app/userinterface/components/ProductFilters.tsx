"use client";
import { ChevronRight, Filter, Check, RotateCcw } from "lucide-react";

export default function ProductFilters({ categories, brands, filters, setFilters }: any) {

  const handleClearAll = () => {
    setFilters({ category_id: null, subcategory_id: null, sub_subcategory_id: null, brand_id: null, sort: "latest" });
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-50">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Filters</h3>
        <button onClick={handleClearAll} className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-wider">
          <RotateCcw size={12} /> Clear All
        </button>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Filter size={12} /> Sort Price
        </h3>
        <select 
          className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-orange-500 transition-all"
          value={filters.sort}
          onChange={(e) => setFilters({...filters, sort: e.target.value})}
        >
          <option value="latest">Newest First</option>
          <option value="low-high">Price: Low to High</option>
          <option value="high-low">Price: High to Low</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Product Hierarchy</h3>
        <div className="space-y-3">
          {categories?.map((cat: any) => {
            const isActive = Number(filters.category_id) === Number(cat.id);
            return (
              <div key={cat.id} className="space-y-2">
                <button
                  onClick={() => setFilters({ ...filters, category_id: isActive ? null : Number(cat.id), subcategory_id: null, sub_subcategory_id: null })}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center transition-all ${
                    isActive ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {cat.name}
                  <ChevronRight size={14} className={`transition-transform duration-300 ${isActive ? "rotate-90" : ""}`} />
                </button>
                
                {isActive && (
                  <div className="ml-5 border-l-2 border-slate-100 pl-4 space-y-2 py-1">
                    {cat.subcategories?.map((sub: any) => {
                      const isSubActive = Number(filters.subcategory_id) === Number(sub.id);
                      return (
                        <div key={sub.id}>
                          <button 
                            onClick={() => setFilters({ ...filters, subcategory_id: isSubActive ? null : Number(sub.id), sub_subcategory_id: null })}
                            className={`w-full text-left text-xs font-bold py-1 transition-colors ${isSubActive ? "text-orange-600" : "text-slate-400 hover:text-slate-900"}`}
                          >
                            {sub.name}
                          </button>
                          {isSubActive && sub.sub_subcategories?.map((ssub: any) => (
                            <button
                              key={ssub.id}
                              onClick={() => setFilters({ ...filters, sub_subcategory_id: Number(filters.sub_subcategory_id) === Number(ssub.id) ? null : Number(ssub.id) })}
                              className={`w-full text-left py-1 text-[10px] font-bold block transition-all pl-3 ${Number(filters.sub_subcategory_id) === Number(ssub.id) ? "text-orange-400 translate-x-1" : "text-slate-300 hover:text-orange-400"}`}
                            >
                              • {ssub.name}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands */}
   {/* Brands Selection */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Brands
          </h3>
          {filters.brand_id && (
            <button 
              onClick={() => setFilters({...filters, brand_id: null})}
              className="text-[9px] font-bold text-orange-600 uppercase hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {brands?.map((brand: any) => {
            const isBrandActive = Number(filters.brand_id) === Number(brand.id);
            return (
              <button
                key={brand.id}
                onClick={() => setFilters({...filters, brand_id: isBrandActive ? null : Number(brand.id)})}
                className={`group flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 ${
                  isBrandActive 
                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-orange-200 hover:bg-orange-50/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Custom Checkbox UI */}
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    isBrandActive 
                      ? "bg-orange-600 border-orange-600" 
                      : "bg-white border-slate-200 group-hover:border-orange-400"
                  }`}>
                    {isBrandActive && <Check size={10} className="text-white" strokeWidth={4} />}
                  </div>
                  
                  <span className={`text-xs font-bold ${isBrandActive ? "text-white" : "text-slate-600"}`}>
                    {brand.name_en}
                  </span>
                </div>

            
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}