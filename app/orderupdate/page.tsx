"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  LayoutDashboard,
  Calendar,
  ArrowUpRight,
  XCircle,
  PauseCircle,
  Ban,
  RotateCcw,
  AlertTriangle,
  FileEdit,
  IndianRupee,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Order {
  id: number;
  full_name: string;
  grand_total: number;
  order_date: string;
  status: string;
  payment_status?: string;
}

interface OrderCounts {
  pending: number;
  prcoessing: number;
  onhold: number;
  confirmed: number;
  Cancelled: number;
  refunded: number;
  failed: number;
  draft: number;
  rejected: number; // payment_status = rejected
}

export default function OrdersDashboard() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<OrderCounts>({
    pending: 0,
    prcoessing: 0,
    onhold: 0,
    confirmed: 0,
    Cancelled: 0,
    refunded: 0,
    failed: 0,
    draft: 0,
    rejected: 0,
  });
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("orders").select("*", { count: "exact" });
    if (search) query = query.ilike("full_name", `%${search}%`);

    // Special case: filter by payment_status = rejected
    if (statusFilter === "payment_rejected") {
      query = query.eq("payment_status", "rejected");
    } else if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    query = query.order("order_date", { ascending: sortOrder === "asc" }).range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setOrders(data as Order[]);
      setTotalOrders(count || 0);
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    const { data } = await supabase.from("orders").select("status, payment_status, grand_total");

    const newCounts: OrderCounts = {
      pending: 0, prcoessing: 0, onhold: 0, confirmed: 0,
      Cancelled: 0, refunded: 0, failed: 0, draft: 0, rejected: 0,
    };
    let revenue = 0;

    data?.forEach((item: any) => {
      const s = item.status;
      if (s === "pending") newCounts.pending++;
      else if (s === "prcoessing") newCounts.prcoessing++;
      else if (s === "onhold") newCounts.onhold++;
      else if (s === "confirmed") newCounts.confirmed++;
      else if (s === "Cancelled") newCounts.Cancelled++;
      else if (s === "refunded") newCounts.refunded++;
      else if (s === "failed") newCounts.failed++;
      else if (s === "draft") newCounts.draft++;

      if (item.payment_status === "rejected") newCounts.rejected++;

      // Count revenue only from paid / confirmed orders
     if (item.status === "confirmed") {
  revenue += Number(item.grand_total) || 0;
}
    });

    setCounts(newCounts);
    setTotalRevenue(revenue);
  };

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [search, statusFilter, sortOrder, page]);

  const totalPages = Math.ceil(totalOrders / pageSize);

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 selection:bg-brand-gold selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-[2px] bg-brand-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold">Studio Registry</span>
            </div>
            <h1 className="text-5xl font-black text-brand-blue tracking-tighter uppercase leading-none">
              Order <span className="text-brand-gold italic">Ledger</span>
            </h1>
          </div>

          {/* Total Orders + Revenue */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-brand-blue/5">
              <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-brand-gold shadow-lg">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
                <p className="text-2xl font-black text-brand-blue leading-none tracking-tight">{totalOrders}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-brand-blue p-4 rounded-[2rem] shadow-xl shadow-brand-blue/20">
              <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-blue shadow-lg">
                <IndianRupee size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-brand-gold/60 uppercase tracking-widest">Revenue Received</p>
                <p className="text-2xl font-black text-white leading-none tracking-tight">
                  ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Analytics Cards — ALL statuses */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <StatusCard label="Pending" value={counts.pending} icon={<Clock size={16} />} color="gold" />
          <StatusCard label="Processing" value={counts.prcoessing} icon={<LayoutDashboard size={16} />} color="blue" />
          <StatusCard label="On Hold" value={counts.onhold} icon={<PauseCircle size={16} />} color="slate" />
          <StatusCard label="Completed" value={counts.confirmed} icon={<CheckCircle2 size={16} />} color="green" />
          <StatusCard label="Cancelled" value={counts.Cancelled} icon={<Ban size={16} />} color="red" />
          <StatusCard label="Refunded" value={counts.refunded} icon={<RotateCcw size={16} />} color="purple" />
          <StatusCard label="Failed" value={counts.failed} icon={<AlertTriangle size={16} />} color="red" />
          <StatusCard label="Draft" value={counts.draft} icon={<FileEdit size={16} />} color="slate" />
          <StatusCard label="Pay Rejected" value={counts.rejected} icon={<XCircle size={16} />} color="red" />
          {/* Filler to keep grid even on larger screens */}
          <div className="hidden md:block" />
        </div>

        {/* Filter Controls */}
        <div className="bg-brand-blue p-6 rounded-[2.5rem] shadow-2xl shadow-brand-blue/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="FIND CLIENT BY NAME..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border-none rounded-[1.5rem] focus:ring-2 focus:ring-brand-gold text-[11px] font-bold text-white uppercase tracking-widest transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-white/5 border-none rounded-2xl px-6 py-5 text-[10px] font-black text-white uppercase tracking-widest focus:ring-2 focus:ring-brand-gold outline-none cursor-pointer"
              >
                <option className="text-black" value="">All Statuses</option>
                <option className="text-brand-blue" value="pending">Pending Payment</option>
                <option className="text-brand-blue" value="prcoessing">Processing</option>
                <option className="text-brand-blue" value="onhold">On Hold</option>
                <option className="text-brand-blue" value="confirmed">Completed</option>
                <option className="text-brand-blue" value="Cancelled">Cancelled</option>
                <option className="text-brand-blue" value="refunded">Refunded</option>
                <option className="text-brand-blue" value="failed">Failed</option>
                <option className="text-brand-blue" value="draft">Draft</option>
                <option className="text-brand-blue" value="payment_rejected">Payment Rejected</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="bg-white/5 border-none rounded-2xl px-6 py-5 text-[10px] font-black text-white uppercase tracking-widest focus:ring-2 focus:ring-brand-gold outline-none cursor-pointer"
              >
                <option className="text-black" value="desc">Newest First</option>
                <option className="text-black" value="asc">Oldest First</option>
              </select>

              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setSortOrder("desc"); setPage(1); }}
                className="p-5 bg-brand-gold text-brand-blue rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-brand-gold/20"
                title="Reset Filters"
              >
                <FilterX size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-brand-blue/5 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settlement</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Payment</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <div className="inline-flex items-center gap-3 text-brand-gold animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-brand-gold" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Synchronizing Registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No orders found</p>
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-brand-blue group-hover:text-brand-gold transition-colors">
                          <Calendar size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-brand-blue">
                            {new Date(order.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(order.order_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-black text-brand-blue uppercase tracking-wider">{order.full_name}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm font-black text-brand-blue tracking-tighter">
                        ₹{order.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-10 py-6 text-center">
                      <PaymentBadge status={order.payment_status} />
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => router.push(`/orderupdate/vieworder/${order.id}`)}
                        className="p-3 bg-brand-blue text-white rounded-xl hover:bg-brand-gold hover:text-brand-blue transition-all shadow-lg hover:shadow-brand-gold/20"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-10 py-8 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page</span>
              <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-black text-brand-blue">{page}</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-black text-slate-400">{totalPages || 1}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                {totalOrders} records
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-30 transition-all shadow-sm"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-30 transition-all shadow-sm"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function StatusCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const themes: Record<string, string> = {
    gold:   "bg-brand-gold/5   text-brand-gold  border-brand-gold/10",
    blue:   "bg-brand-blue/5   text-brand-blue  border-brand-blue/10",
    green:  "bg-emerald-50     text-emerald-600 border-emerald-100",
    red:    "bg-red-50         text-red-500     border-red-100",
    slate:  "bg-slate-50       text-slate-500   border-slate-100",
    purple: "bg-purple-50      text-purple-600  border-purple-100",
  };

  return (
    <div className={`${themes[color] ?? themes.slate} border p-5 rounded-[2rem] flex flex-col gap-3 shadow-sm hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">{icon}</div>
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:          "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
    prcoessing:       "bg-blue-50 text-blue-600 border-blue-100",
    onhold:           "bg-slate-100 text-slate-500 border-slate-200",
    confirmed:        "bg-emerald-50 text-emerald-700 border-emerald-100",
    Cancelled:        "bg-red-50 text-red-500 border-red-100",
    refunded:         "bg-purple-50 text-purple-600 border-purple-100",
    failed:           "bg-red-100 text-red-600 border-red-200",
    draft:            "bg-slate-50 text-slate-400 border-slate-100",
  };

  const labels: Record<string, string> = {
    pending:    "Pending",
    prcoessing: "Processing",
    onhold:     "On Hold",
    confirmed:  "Completed",
    Cancelled:  "Cancelled",
    refunded:   "Refunded",
    failed:     "Failed",
    draft:      "Draft",
  };

  return (
    <span className={`px-4 py-1.5 text-[9px] rounded-xl font-black uppercase tracking-widest border inline-block ${map[status] ?? "bg-slate-50 text-slate-400 border-slate-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">—</span>;

  const map: Record<string, string> = {
    paid:     "bg-emerald-50 text-emerald-700 border-emerald-100",
    pending:  "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
    rejected: "bg-red-50 text-red-500 border-red-100",
  };

  const labels: Record<string, string> = {
    paid:     "Paid",
    pending:  "Pending",
    rejected: "Rejected",
  };

  return (
    <span className={`px-4 py-1.5 text-[9px] rounded-xl font-black uppercase tracking-widest border inline-block ${map[status] ?? "bg-slate-50 text-slate-400 border-slate-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}