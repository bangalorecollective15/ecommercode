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
  Eye
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
}

interface OrderCounts {
  pending: number;
  confirmed: number;
  processing: number;
  out_for_delivery: number;
  delivered: number;
}

export default function OrdersDashboard() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<OrderCounts>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    out_for_delivery: 0,
    delivered: 0,
  });

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
    if (statusFilter) query = query.eq("status", statusFilter);

    query = query.order("order_date", { ascending: sortOrder === "asc" }).range(from, to);

    const { data, count, error } = await query;

    if (!error) {
      setOrders(data as Order[]);
      setTotalOrders(count || 0);
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    // Optimization: Only select the status column
    const { data } = await supabase.from("orders").select("status");

    const newCounts: OrderCounts = {
      pending: 0, confirmed: 0, processing: 0, out_for_delivery: 0, delivered: 0,
    };

    data?.forEach((item: any) => {
      const s = item.status?.toLowerCase();
      if (s === "pending") newCounts.pending++;
      else if (s === "confirmed") newCounts.confirmed++;
      else if (s === "processing") newCounts.processing++;
      else if (s === "out_for_delivery" || s === "out of delivery") newCounts.out_for_delivery++;
      else if (s === "delivered") newCounts.delivered++;
    });

    setCounts(newCounts);
  };

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [search, statusFilter, sortOrder, page]);

  const totalPages = Math.ceil(totalOrders / pageSize);

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-black mb-1">
              <LayoutDashboard size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Management</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Orders</h1>
          </div>
          <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
             <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Total Managed</p>
             <p className="text-xl font-black text-orange-700">{totalOrders}</p>
          </div>
        </div>

        {/* Status Counts - Redesigned */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatusCard label="Placed" value={counts.pending} icon={<Clock size={20}/>} color="amber" />
          <StatusCard label="Confirmed" value={counts.confirmed} icon={<Package size={20}/>} color="blue" />
          <StatusCard label="Processing" value={counts.processing} icon={<LayoutDashboard size={20}/>} color="purple" />
          <StatusCard label="Shipping" value={counts.out_for_delivery} icon={<Truck size={20}/>} color="orange" />
          <StatusCard label="Delivered" value={counts.delivered} icon={<CheckCircle2 size={20}/>} color="green" />
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by customer name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-600 focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-600 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>

              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setSortOrder("desc"); setPage(1); }}
                className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-colors"
                title="Clear Filters"
              >
                <FilterX size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-orange-600 font-bold animate-pulse">Loading orders...</td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-xl text-slate-500 group-hover:bg-white group-hover:text-orange-600 transition-colors">
                          <Calendar size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            {new Date(order.order_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                            {new Date(order.order_date).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-800">{order.full_name}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-black">₹{order.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                       onClick={() => router.push(`/orderupdate/vieworder/${order.id}`)}
                        className="inline-flex items-center gap-2 bg-black  text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-orange-100 transition-all active:scale-95"
                      >
                        <Eye size={14} /> UPDATE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-bold">
              Showing <span className="text-slate-900">{orders.length}</span> of {totalOrders} orders
            </p>
            
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                 <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-sm text-orange-600">
                   {page}
                 </span>
                 <span className="text-slate-400 font-bold px-2">/</span>
                 <span className="px-2 font-bold text-slate-500 text-sm">
                   {totalPages}
                 </span>
              </div>

              <button
                className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
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

// Sub-components
function StatusCard({ label, value, icon, color }: any) {
  const themes: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={`${themes[color]} border p-5 rounded-[1.5rem] flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="p-2 bg-white/50 rounded-lg">{icon}</div>
        <span className="text-2xl font-black">{value}</span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-orange-600 text-white", // Featured Orange-600
    delivered: "bg-emerald-100 text-emerald-700",
  };

  const label = status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`px-4 py-1.5 text-[10px] rounded-full font-black uppercase tracking-tighter inline-block shadow-sm ${colors[status] || "bg-slate-100 text-slate-700"}`}>
      {label}
    </span>
  );
}