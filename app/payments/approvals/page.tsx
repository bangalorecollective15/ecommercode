"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Check, X, ArrowLeft, Loader2, Search, Eye,
  ChevronRight, ShieldCheck, Clock, CheckCircle2,
  XCircle, PauseCircle, FilterX, AlertCircle
} from "lucide-react";
import supabase from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const REJECT_REASONS = [
  { value: "wrong_screenshot", label: "Wrong screenshot / unrelated image" },
  { value: "amount_mismatch", label: "Amount doesn't match order total" },
  { value: "suspected_fraud", label: "Suspected fraud / fake receipt" },
  { value: "spam", label: "Spam / test order" },
  { value: "other", label: "Other" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_date", { ascending: false });

    if (error) toast.error("Database sync failed");
    else setOrders(data || []);
    setLoading(false);
  };

  const handleApprove = async (orderId: string) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: "prcoessing", payment_status: "paid" })
      .eq("id", orderId);

    if (error) {
      toast.error("Approval failed");
    } else {
      toast.success("Payment authorized");
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: "prcoessing", payment_status: "paid" } : o
      ));
    }
    setIsUpdating(false);
  };

  const handleReject = async () => {
    if (!rejectionTarget || !rejectReason) return;
    setIsUpdating(true);

    const fullReason = rejectNote
      ? `${rejectReason} — ${rejectNote}`
      : rejectReason;

    const { error } = await supabase
      .from("orders")
      .update({
        status: "onhold",
        payment_status: "rejected",
        payment_rejection_reason: fullReason,
      })
      .eq("id", rejectionTarget);

    if (error) {
      toast.error("Rejection failed");
    } else {
      toast.success("Payment rejected");
      setOrders(prev => prev.map(o =>
        o.id === rejectionTarget
          ? { ...o, status: "onhold", payment_status: "rejected", payment_rejection_reason: fullReason }
          : o
      ));
      setShowRejectModal(false);
      setRejectReason("");
      setRejectNote("");
      setRejectionTarget(null);
    }
    setIsUpdating(false);
  };

  // Stats from loaded orders
  const stats = {
    total: orders.length,
    awaiting: orders.filter(o => !o.payment_status || o.payment_status === "pending").length,
    paid: orders.filter(o => o.payment_status === "paid").length,
    rejected: orders.filter(o => o.payment_status === "rejected").length,
    onhold: orders.filter(o => o.status === "onhold").length,
  };

  const filtered = orders.filter(o => {
    const matchesSearch =
      o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone_number?.includes(searchTerm);

    const matchesFilter =
      !statusFilter ||
      (statusFilter === "awaiting" && (!o.payment_status || o.payment_status === "pending")) ||
      (statusFilter === "paid" && o.payment_status === "paid") ||
      (statusFilter === "rejected" && o.payment_status === "rejected") ||
      (statusFilter === "onhold" && o.status === "onhold");

    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FBFBFC]">
      <Loader2 className="animate-spin text-brand-gold" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 lg:p-12 text-brand-blue selection:bg-brand-gold selection:text-brand-blue">
      <Toaster position="bottom-right" />

      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-all text-[10px] font-black uppercase tracking-[0.3em]">
              <ArrowLeft size={14} className="text-brand-gold" /> Central Command
            </Link>
            <h1 className="text-5xl font-black tracking-tighter uppercase text-brand-blue leading-none">
              Payment <span className="text-brand-gold">Approval</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authenticated Ledger Access</p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={18} />
            <input
              placeholder="Search client or phone..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 transition-all shadow-xl shadow-brand-blue/5"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* STATUS STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Orders" value={stats.total} icon={<ShieldCheck size={16} />} color="blue" />
          <StatCard label="Awaiting" value={stats.awaiting} icon={<Clock size={16} />} color="gold" />
          <StatCard label="Authorized" value={stats.paid} icon={<CheckCircle2 size={16} />} color="green" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle size={16} />} color="red" />
          <StatCard label="On Hold" value={stats.onhold} icon={<PauseCircle size={16} />} color="slate" />
        </div>

        {/* FILTERS */}
        <div className="bg-brand-blue p-5 rounded-[2.5rem] shadow-2xl shadow-brand-blue/20 flex flex-wrap items-center gap-4">
          {[
            { value: "", label: "All Orders" },
            { value: "awaiting", label: "Awaiting" },
            { value: "paid", label: "Authorized" },
            { value: "rejected", label: "Rejected" },
            { value: "onhold", label: "On Hold" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f.value
                  ? "bg-brand-gold text-brand-blue shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => { setStatusFilter(""); setSearchTerm(""); }}
            className="ml-auto p-4 bg-brand-gold/20 text-brand-gold rounded-2xl hover:bg-brand-gold hover:text-brand-blue transition-all"
            title="Reset"
          >
            <FilterX size={18} />
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-brand-blue/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Client</th>
                  <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                  <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Status</th>
                  <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Proof</th>
                  <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">
                      No orders found
                    </td>
                  </tr>
                ) : filtered.map((order) => {
                  const isPaid = order.payment_status === "paid";
                  const isRejected = order.payment_status === "rejected";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-8">
                        <p className="font-black text-sm uppercase text-brand-blue tracking-tight">{order.full_name}</p>
                        <p className="text-[9px] font-black text-brand-gold mt-1 tracking-widest uppercase opacity-70">{order.phone_number}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          {new Date(order.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </td>

                      <td className="p-8">
                        <p className="font-black text-brand-blue text-xl tracking-tighter">₹{order.grand_total?.toLocaleString()}</p>
                        <span className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest px-2 py-0.5 bg-slate-100 rounded-full inline-block">
                          {order.payment_method}
                        </span>
                      </td>

                      <td className="p-8">
                        <div className="flex flex-col gap-2">
                          {/* Payment status badge */}
                          <span className={`w-fit px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            isPaid    ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            isRejected ? "bg-red-50 text-red-500 border-red-100" :
                            "bg-brand-gold/10 text-brand-gold border-brand-gold/20"
                          }`}>
                            {isPaid ? "Authorized" : isRejected ? "Rejected" : "Awaiting"}
                          </span>

                          {/* Show rejection reason if rejected */}
                          {isRejected && order.payment_rejection_reason && (
                            <div className="mt-1 p-2 bg-red-50 border border-red-100 rounded-xl max-w-[200px]">
                              <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-0.5">Reason</p>
                              <p className="text-[9px] font-bold text-red-600 leading-tight">{order.payment_rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-8">
                        {order.payment_id ? (
                          <button
                            onClick={() => setSelectedImage(order.payment_id)}
                            className="px-5 py-3 bg-brand-blue text-brand-gold rounded-2xl flex items-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-brand-gold hover:text-brand-blue transition-all shadow-lg shadow-brand-blue/10 active:scale-95"
                          >
                            <Eye size={14} /> View Proof
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">No proof</span>
                        )}
                      </td>

                      <td className="p-8 text-right">
                        {isPaid ? (
                          // Already paid — show audit link only
                          <Link
                            href={`/orderupdate/vieworder/${order.id}`}
                            className="inline-flex items-center gap-2 text-slate-300 hover:text-brand-gold transition-colors text-[9px] font-black uppercase tracking-widest"
                          >
                            View Order <ChevronRight size={14} />
                          </Link>
                        ) : isRejected ? (
                          // Rejected — show disabled state + re-approve option
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[9px] font-black text-red-300 uppercase tracking-widest">Payment Rejected</span>
                            <button
                              onClick={() => handleApprove(order.id)}
                              disabled={isUpdating}
                              className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Override & Approve
                            </button>
                          </div>
                        ) : (
                          // Awaiting — show reject + approve
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                setRejectionTarget(order.id);
                                setShowRejectModal(true);
                              }}
                              className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
                            >
                              <X size={20} />
                            </button>
                            <button
                              onClick={() => handleApprove(order.id)}
                              disabled={isUpdating}
                              className="px-8 h-12 rounded-2xl bg-brand-gold text-brand-blue flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-xl shadow-brand-gold/20 active:scale-95 disabled:opacity-50"
                            >
                              <Check size={16} /> Authorize
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── REJECT MODAL ─────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-black text-brand-blue uppercase tracking-tight">Reject Proof</h3>
              </div>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectNote(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-black mb-5 uppercase tracking-widest">
              Order goes on hold. Customer will be notified.
            </p>

            <div className="space-y-2 mb-5">
              {REJECT_REASONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer text-xs font-bold transition-all ${
                    rejectReason === opt.value
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-slate-100 text-brand-blue hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={opt.value}
                    checked={rejectReason === opt.value}
                    onChange={e => setRejectReason(e.target.value)}
                    className="accent-red-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <textarea
              placeholder="Add a note (optional)"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              className="w-full border border-slate-100 rounded-2xl p-4 text-xs font-bold mb-5 resize-none h-20 focus:outline-none focus:border-red-200 transition-colors"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectNote(""); }}
                className="p-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || isUpdating}
                className="p-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 className="animate-spin" size={14} /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE PROOF MODAL ────────────────────────────── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] bg-brand-blue/95 backdrop-blur-2xl flex items-center justify-center p-8 md:p-20"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full max-w-4xl shadow-2xl rounded-3xl overflow-hidden border border-white/10">
            <Image src={selectedImage} alt="Payment proof" fill className="object-contain" unoptimized />
            <button
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-brand-gold hover:text-brand-blue text-white rounded-full flex items-center justify-center transition-all"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const themes: Record<string, string> = {
    blue:  "bg-brand-blue/5  text-brand-blue  border-brand-blue/10",
    gold:  "bg-brand-gold/5  text-brand-gold  border-brand-gold/10",
    green: "bg-emerald-50    text-emerald-600 border-emerald-100",
    red:   "bg-red-50        text-red-500     border-red-100",
    slate: "bg-slate-50      text-slate-500   border-slate-100",
  };

  return (
    <div className={`${themes[color]} border p-5 rounded-[2rem] flex flex-col gap-3 hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">{icon}</div>
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">{label}</span>
    </div>
  );
}