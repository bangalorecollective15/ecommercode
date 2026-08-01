"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  Pencil, 
  ShieldCheck, 
  X, 
  Mail, 
  Lock,
  AlertTriangle,
  Loader2,
  Copy,
  Tag,
  Percent,
  Users,
  RefreshCw,
  DollarSign,
  TrendingUp
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  usage_limit?: number;
  usage_count: number;
  min_purchase_amount?: number;
  created_at: string;
  active: boolean;
}

export default function CouponsSettings() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [generateMode, setGenerateMode] = useState(false);

  const fetchCoupons = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Fetch error:", error);
        toast.error(`Failed to fetch coupons: ${error.message}`);
      } else {
        setCoupons(data || []);
      }
    } catch (err) {
      console.error("Fetch exception:", err);
      toast.error("Failed to fetch coupons");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Generate random coupon code starting with BC
  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "BC";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const openForm = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setGenerateMode(false);
    } else {
      setSelectedCoupon({
        id: "",
        code: generateCouponCode(),
        discount_type: "percentage",
        discount_value: 10,
        usage_limit: undefined,
        usage_count: 0,
        min_purchase_amount: 0,
        created_at: new Date().toISOString(),
        active: true,
      });
      setGenerateMode(true);
    }
  };

  const regenerateCode = () => {
    if (selectedCoupon) {
      setSelectedCoupon({
        ...selectedCoupon,
        code: generateCouponCode(),
      });
    }
  };

  const saveCoupon = async () => {
    if (!selectedCoupon || !selectedCoupon.code || !selectedCoupon.discount_value) {
      return toast.error("Please fill in all required fields");
    }

    // Validate code format
    if (selectedCoupon.code.length < 3) {
      return toast.error("Coupon code must be at least 3 characters");
    }

    if (selectedCoupon.discount_value <= 0) {
      return toast.error("Discount value must be greater than 0");
    }

    if (selectedCoupon.discount_type === "percentage" && selectedCoupon.discount_value > 100) {
      return toast.error("Percentage discount cannot exceed 100%");
    }

    if ((selectedCoupon.min_purchase_amount || 0) < 0) {
      return toast.error("Minimum purchase amount cannot be negative");
    }

    setLoading(true);

    try {
      if (selectedCoupon.id) {
        // Update existing coupon
        const { error } = await supabase
          .from("coupons")
          .update({
            code: selectedCoupon.code.toUpperCase(),
            discount_type: selectedCoupon.discount_type,
            discount_value: selectedCoupon.discount_value,
            usage_limit: selectedCoupon.usage_limit || null,
            min_purchase_amount: selectedCoupon.min_purchase_amount || 0,
            active: selectedCoupon.active,
          })
          .eq("id", selectedCoupon.id);
        
        if (error) {
          console.error("Update error:", error);
          throw new Error(error.message || "Failed to update coupon");
        }
        toast.success("✅ Coupon updated successfully");
      } else {
        // Insert new coupon
        const { error } = await supabase.from("coupons").insert({
          code: selectedCoupon.code.toUpperCase(),
          discount_type: selectedCoupon.discount_type,
          discount_value: selectedCoupon.discount_value,
          usage_limit: selectedCoupon.usage_limit || null,
          min_purchase_amount: selectedCoupon.min_purchase_amount || 0,
          usage_count: 0,
          active: true,
        });
        
        if (error) {
          console.error("Insert error:", error);
          
          // Check for specific error types
          if (error.code === "23505") {
            throw new Error("This coupon code already exists");
          } else if (error.code === "PGRST301") {
            throw new Error("Permission denied. Make sure RLS is disabled or you have proper admin role");
          } else {
            throw new Error(error.message || "Failed to create coupon");
          }
        }
        toast.success("✅ Coupon created successfully");
      }
      
      fetchCoupons();
      setSelectedCoupon(null);
      setGenerateMode(false);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteCoupon = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", deleteTarget.id);
      
      if (error) {
        console.error("Delete error:", error);
        throw new Error(error.message || "Failed to delete coupon");
      }
      
      toast.success("✅ Coupon deleted successfully");
      fetchCoupons();
    } catch (err: any) {
      console.error("Delete catch:", err);
      toast.error(err.message || "Deletion failed");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("📋 Code copied to clipboard");
  };

  const closeModal = () => {
    setSelectedCoupon(null);
    setGenerateMode(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
              <Tag className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Promotional Management</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Discount <span className="text-[#c4a174] italic">Registry</span>
          </h1>
        </div>

        <button
          onClick={() => openForm()}
          className="h-14 px-8 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition-all flex items-center gap-3 shadow-xl shadow-[#2b2652]/10 active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-12 transition-transform" />
          Create Coupon
        </button>
      </div>

      {/* Coupons Table Card */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Coupon Code</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Discount</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Min Purchase</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Usage</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Status</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-[#c4a174] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : coupons.length > 0 ? (
                coupons.map((c) => (
                  <tr key={c.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                    {/* Coupon Code */}
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#2b2652] flex items-center justify-center text-[#c4a174] font-black text-sm shadow-md group-hover:scale-110 transition-transform">
                          {c.code.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-sm text-[#2b2652] uppercase tracking-tight font-mono">{c.code}</div>
                          <div className="text-[9px] text-slate-400 font-black tracking-widest mt-1 uppercase">Created: {new Date(c.created_at).toLocaleDateString()}</div>
                        </div>
                        <button
                          onClick={() => copyCouponCode(c.code)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-[#c4a174]/10 text-slate-400 hover:text-[#c4a174] rounded-lg transition-all"
                          title="Copy code"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#c4a174]/10 flex items-center justify-center">
                          {c.discount_type === "percentage" ? (
                            <Percent className="text-[#c4a174]" size={18} />
                          ) : (
                            <DollarSign className="text-[#c4a174]" size={18} />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#2b2652]">
                            {c.discount_value}
                            {c.discount_type === "percentage" ? "%" : " ₹"}
                          </div>
                          <div className="text-[8px] text-slate-400 font-black uppercase">{c.discount_type === "percentage" ? "Percentage" : "Fixed Amount"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Min Purchase Amount */}
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                          <TrendingUp className="text-amber-600" size={18} />
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#2b2652]">
                            {c.min_purchase_amount ? `₹${c.min_purchase_amount}` : "No Min"}
                          </div>
                          <div className="text-[8px] text-slate-400 font-black uppercase">Min Amount</div>
                        </div>
                      </div>
                    </td>

                    {/* Usage */}
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Users className="text-blue-600" size={18} />
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#2b2652]">{c.usage_count}</div>
                          <div className="text-[8px] text-slate-400 font-black uppercase">
                            {c.usage_limit ? `of ${c.usage_limit}` : "Unlimited"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        c.active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Controls */}
                    <td className="px-10 py-6">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setSelectedCoupon(c)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-[#2b2652] hover:border-[#c4a174] rounded-xl transition-all shadow-sm"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(c)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
                    No coupons in registry
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* FORM MODAL - SMALLER & CLEANER VERSION */}
      {/* ============================================ */}
      {selectedCoupon && (
        <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - VISIBLE & PROMINENT */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 w-10 h-10 bg-[#2b2652] flex items-center justify-center rounded-full hover:bg-red-500 transition-all z-50 shadow-lg"
              title="Close"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Header */}
            <div className="p-8 border-b border-slate-100">
              <span className="text-[9px] text-[#c4a174] font-black uppercase tracking-[0.3em] block mb-2">Coupon Management</span>
              <h3 className="text-xl font-black text-[#2b2652] uppercase tracking-tighter">
                {selectedCoupon.id ? "Edit Coupon" : "New Coupon"}
              </h3>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Coupon Code Section */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={16} />
                    <input
                      type="text"
                      value={selectedCoupon.code}
                      onChange={(e) => setSelectedCoupon({ ...selectedCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="BC000000"
                      className="w-full h-12 pl-14 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-sm uppercase tracking-widest"
                    />
                  </div>
                  {!selectedCoupon.id && (
                    <button
                      type="button"
                      onClick={regenerateCode}
                      className="h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-400 hover:text-[#c4a174] hover:border-[#c4a174] transition-all flex items-center gap-1 font-black text-[9px] uppercase tracking-widest"
                      title="Generate new code"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                {/* Discount Type */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select
                    value={selectedCoupon.discount_type}
                    onChange={(e) => setSelectedCoupon({ 
                      ...selectedCoupon, 
                      discount_type: e.target.value as "percentage" | "fixed"
                    })}
                    className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-sm uppercase tracking-widest"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Value</label>
                  <div className="relative group">
                    {selectedCoupon.discount_type === "percentage" ? (
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={16} />
                    ) : (
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={16} />
                    )}
                    <input
                      type="number"
                      value={selectedCoupon.discount_value}
                      onChange={(e) => setSelectedCoupon({ ...selectedCoupon, discount_value: parseFloat(e.target.value) || 0 })}
                      placeholder="10"
                      min="0"
                      step="0.01"
                      max={selectedCoupon.discount_type === "percentage" ? "100" : "999999"}
                      className="w-full h-12 pl-14 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Purchase Amount */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Minimum Purchase Amount (Optional)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={16} />
                  <input
                    type="number"
                    value={selectedCoupon.min_purchase_amount || ""}
                    onChange={(e) => setSelectedCoupon({ 
                      ...selectedCoupon, 
                      min_purchase_amount: e.target.value ? parseFloat(e.target.value) : 0
                    })}
                    placeholder="e.g., 500"
                    min="0"
                    step="0.01"
                    className="w-full h-12 pl-14 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-sm"
                  />
                </div>
                <p className="text-[8px] text-slate-400 ml-1">Leave blank or enter 0 for no minimum</p>
              </div>

              {/* Usage Limit */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Usage Limit (Optional)</label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={16} />
                  <input
                    type="number"
                    value={selectedCoupon.usage_limit || ""}
                    onChange={(e) => setSelectedCoupon({ 
                      ...selectedCoupon, 
                      usage_limit: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="e.g., 100"
                    min="1"
                    className="w-full h-12 pl-14 pr-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-sm"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              {selectedCoupon.id && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Status</span>
                  <button
                    onClick={() => setSelectedCoupon({ ...selectedCoupon, active: !selectedCoupon.active })}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all ${
                      selectedCoupon.active ? "bg-green-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        selectedCoupon.active ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Usage Info */}
              {selectedCoupon.id && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Users className="text-blue-600" size={18} />
                    <div>
                      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Current Usage</div>
                      <div className="text-lg font-black text-[#2b2652]">{selectedCoupon.usage_count} {selectedCoupon.usage_limit ? `/ ${selectedCoupon.usage_limit}` : "unlimited"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={saveCoupon}
                disabled={loading}
                className="flex-1 h-12 bg-[#2b2652] text-[#c4a174] rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#c4a174] hover:text-[#2b2652] shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 h-12 bg-white text-slate-600 border-2 border-slate-200 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-[#2b2652] hover:text-[#2b2652] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* DELETE CONFIRMATION - SMALL & CLEAN */}
      {/* ============================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#2b2652]/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div 
            className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
              <AlertTriangle size={40} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-black text-[#2b2652] uppercase tracking-tighter mb-2">Delete Coupon?</h2>

            {/* Message */}
            <p className="text-[10px] text-slate-500 mb-8 font-bold uppercase tracking-wide leading-relaxed">
              Permanent deletion of <br/>
              <span className="text-[#2b2652] font-black text-sm">{deleteTarget.code}</span> <br/>
              Cannot be undone.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={deleteCoupon}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition active:scale-95 shadow-lg disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-100 text-[#2b2652] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}