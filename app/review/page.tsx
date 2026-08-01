"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  Trash2,
  ShieldCheck,
  X,
  AlertTriangle,
  Loader2,
  Star,
  MessageSquareText,
  Ban,
  CheckCircle2,
  PackageSearch,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReviewRow {
  id: number;
  product_id: number | null;
  user_id: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  is_active: boolean | null;
  products?: { name: string | null } | null;
  reviewer_name?: string | null;
}

type StatusFilter = "all" | "active" | "inactive";

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < value ? "fill-[#c4a174] text-[#c4a174]" : "text-slate-200"}
        />
      ))}
    </div>
  );
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchReviews = async () => {
    setFetching(true);

    const { data, error } = await supabase
      .from("reviews")
      .select("*, products(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch reviews");
      setFetching(false);
      return;
    }

    const rows = data || [];
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];

    let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      profileMap = (profileRows || []).reduce((acc, p) => {
        acc[p.id] = { full_name: p.full_name, email: p.email };
        return acc;
      }, {} as Record<string, { full_name: string | null; email: string | null }>);
    }

    setReviews(
      rows.map((r) => ({
        ...r,
        reviewer_name:
          profileMap[r.user_id || ""]?.full_name ||
          profileMap[r.user_id || ""]?.email?.split("@")[0] ||
          "Unknown User",
      }))
    );
    setFetching(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleActive = async (review: ReviewRow) => {
    setTogglingId(review.id);
    const nextState = !review.is_active;

    const { error } = await supabase
      .from("reviews")
      .update({ is_active: nextState })
      .eq("id", review.id);

    if (error) {
      toast.error("Couldn't update review status");
    } else {
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, is_active: nextState } : r))
      );
      toast.success(nextState ? "Review activated" : "Review deactivated");
    }
    setTogglingId(null);
  };

  const deleteReview = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase.from("reviews").delete().eq("id", deleteTarget.id);

    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review permanently deleted");
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filteredReviews = useMemo(() => {
    if (statusFilter === "active") return reviews.filter((r) => r.is_active !== false);
    if (statusFilter === "inactive") return reviews.filter((r) => r.is_active === false);
    return reviews;
  }, [reviews, statusFilter]);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      active: reviews.filter((r) => r.is_active !== false).length,
      inactive: reviews.filter((r) => r.is_active === false).length,
    }),
    [reviews]
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
              <MessageSquareText className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
              Content Moderation
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Review <span className="text-[#c4a174] italic">Registry</span>
          </h1>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
          {(["all", "active", "inactive"] as StatusFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-5 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                statusFilter === tab
                  ? "bg-[#2b2652] text-[#c4a174] shadow-md"
                  : "text-slate-400 hover:text-[#2b2652]"
              }`}
            >
              {tab}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab ? "bg-[#c4a174]/20 text-[#c4a174]" : "bg-slate-100 text-slate-400"
                }`}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Reviewer</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Product</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Rating &amp; Review</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Status</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">
                  Operational Controls
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-[#c4a174] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((r) => {
                  const isActive = r.is_active !== false;
                  return (
                    <tr key={r.id} className="group hover:bg-[#c4a174]/5 transition-colors align-top">
                      {/* Reviewer */}
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#2b2652] flex items-center justify-center text-[#c4a174] font-black text-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                            {(r.reviewer_name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-sm text-[#2b2652] uppercase tracking-tight">
                              {r.reviewer_name}
                            </div>
                            <div className="text-[9px] text-slate-400 font-black tracking-widest mt-1 uppercase">
                              {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <PackageSearch size={14} className="text-slate-300 flex-shrink-0" />
                          <span className="font-black text-xs text-[#2b2652] uppercase tracking-tight truncate">
                            {r.products?.name || "Deleted Product"}
                          </span>
                        </div>
                      </td>

                      {/* Rating + text */}
                      <td className="px-10 py-6 max-w-sm">
                        <div className="space-y-2">
                          <StarRow value={r.rating || 0} />
                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {r.review_text || <span className="italic text-slate-300">No comment left</span>}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-10 py-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            isActive
                              ? "bg-[#c4a174]/10 text-[#c4a174] border-[#c4a174]/20"
                              : "bg-red-50 text-red-500 border-red-200"
                          }`}
                        >
                          {isActive ? <CheckCircle2 size={11} /> : <Ban size={11} />}
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Controls */}
                      <td className="px-10 py-6">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => toggleActive(r)}
                            disabled={togglingId === r.id}
                            title={isActive ? "Deactivate review" : "Activate review"}
                            className={`w-10 h-10 flex items-center justify-center bg-white border rounded-xl transition-all shadow-sm disabled:opacity-40 ${
                              isActive
                                ? "border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200"
                                : "border-slate-100 text-slate-400 hover:text-[#c4a174] hover:border-[#c4a174]"
                            }`}
                          >
                            {togglingId === r.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : isActive ? (
                              <Ban size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            title="Delete review"
                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
                    No reviews found in registry
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#2b2652]/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl shadow-red-200">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter mb-2">Delete Review?</h2>
            <p className="text-[11px] text-slate-400 mb-4 font-bold uppercase tracking-wide leading-relaxed">
              Permanently remove this review by <br />
              <span className="text-[#2b2652]">{deleteTarget.reviewer_name}</span>
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left">
              <StarRow value={deleteTarget.rating || 0} />
              <p className="text-[11px] text-slate-500 font-medium mt-2 line-clamp-3">
                {deleteTarget.review_text || "No comment left"}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={deleteReview}
                disabled={deleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-4 bg-slate-100 text-[#2b2652] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
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