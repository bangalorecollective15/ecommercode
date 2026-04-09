"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  TrendingUp, Package, Users, ShoppingBag, 
  Layers, Activity, ArrowUpRight, Zap, LayoutDashboard,
  RefreshCcw, Calendar
} from "lucide-react";

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Tooltip, Legend
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
  id: number;
  full_name: string;
  grand_total: number;
  order_date: string;
};

type Stats = {
  totalOrders: number;
  totalPOSOrders: number;
  onlineSales: number;
  posSales: number;
  totalCustomers: number;
  totalProducts: number;
  activeBanners: number;
  activeOffers: number;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, totalPOSOrders: 0, onlineSales: 0, posSales: 0,
    totalCustomers: 0, totalProducts: 0, activeBanners: 0, activeOffers: 0,
  });

  const [sevenDayChart, setSevenDayChart] = useState<any>({ labels: [], datasets: [] });
  const [comparisonChart, setComparisonChart] = useState<any>({ labels: [], datasets: [] });
  const [categoryChart, setCategoryChart] = useState<any>({ labels: [], datasets: [] });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [
        orders, posOrders, onlineSales, posSales, products, 
        customers, banners, offers, last7DaysOrders, monthlyOrders, 
        monthlyPosOrders, productCategories
      ] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact" }),
        supabase.from("pos_orders").select("id", { count: "exact" }),
        supabase.from("orders").select("grand_total"),
        supabase.from("pos_orders").select("grand_total"),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("customers").select("id", { count: "exact" }),
        supabase.from("banner").select("id", { count: "exact" }).eq("active", true),
        supabase.from("offers").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("orders").select("grand_total, order_date").gte("order_date", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("orders").select("id").gte("order_date", "2025-01-01"),
        supabase.from("pos_orders").select("id").gte("order_date", "2025-01-01"),
        supabase.from("products").select("category_id"),
      ]);

      // Sales Trend Processing
      const daily: Record<string, number> = {};
      last7DaysOrders.data?.forEach((o: any) => {
        const day = new Date(o.order_date).toLocaleDateString("en-IN", { weekday: "short" });
        daily[day] = (daily[day] || 0) + Number(o.grand_total);
      });

      const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      setSevenDayChart({
        labels: week,
        datasets: [{
          label: "Online Revenue",
          data: week.map((d) => daily[d] || 0),
          borderColor: "#c4a174", // brand-gold
          backgroundColor: "rgba(196, 161, 116, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#2b2652", // brand-blue
        }],
      });

      setComparisonChart({
        labels: ["Online Store", "In-Store POS"],
        datasets: [{
          data: [monthlyOrders?.data?.length ?? 0, monthlyPosOrders?.data?.length ?? 0],
          backgroundColor: ["#2b2652", "#c4a174"],
          borderRadius: 12,
          barThickness: 40,
        }],
      });

      const catCount: Record<string, number> = {};
      productCategories.data?.forEach((p: any) => {
        catCount[p.category_id] = (catCount[p.category_id] || 0) + 1;
      });

      setCategoryChart({
        labels: Object.keys(catCount),
        datasets: [{
          data: Object.values(catCount),
          backgroundColor: ["#2b2652", "#c4a174", "#4a447a", "#dec3a1", "#1a1733"],
          borderWidth: 2,
          borderColor: "#fff",
        }],
      });

      setStats({
        totalOrders: orders.count || 0,
        totalPOSOrders: posOrders.count || 0,
        onlineSales: onlineSales.data?.reduce((s: number, o: any) => s + Number(o.grand_total), 0) || 0,
        posSales: posSales.data?.reduce((s: number, o: any) => s + Number(o.grand_total), 0) || 0,
        totalProducts: products.count || 0,
        totalCustomers: customers.count || 0,
        activeBanners: banners.count || 0,
        activeOffers: offers.count || 0,
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-brand-gold border-t-brand-blue rounded-full animate-spin mb-4" />
      <div className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-blue">Synchronizing Analytics...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] selection:bg-brand-gold selection:text-white">
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 md:p-10 space-y-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Executive Insight</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-brand-blue">
                Studio <span className="text-brand-gold">Dashboard</span>
              </h1>
            </div>
            <button 
              onClick={loadDashboard}
              className="flex items-center gap-2 px-8 py-4 bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-gold transition-all shadow-2xl shadow-brand-blue/20"
            >
              <RefreshCcw size={14} /> Refresh Intel
            </button>
          </header>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <DashboardCard title="Digital Orders" value={stats.totalOrders} icon={<ShoppingBag size={20}/>} />
            <DashboardCard title="POS Transactions" value={stats.totalPOSOrders} icon={<Activity size={20}/>} />
            <DashboardCard title="Online Revenue" value={`₹${stats.onlineSales.toLocaleString()}`} icon={<TrendingUp size={20}/>} gold />
            <DashboardCard title="POS Revenue" value={`₹${stats.posSales.toLocaleString()}`} icon={<LayoutDashboard size={20}/>} gold />
            <DashboardCard title="Inventory" value={stats.totalProducts} icon={<Package size={20}/>} />
            <DashboardCard title="Members" value={stats.totalCustomers} icon={<Users size={20}/>} />
            <DashboardCard title="Campaign Banners" value={stats.activeBanners} icon={<Layers size={20}/>} />
            <DashboardCard title="Live Offers" value={stats.activeOffers} icon={<Zap size={20}/>} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartBox title="Collection Distribution" sub="Inventory by Category">
              <div className="h-[320px] flex items-center justify-center p-6">
                <Pie data={categoryChart} options={pieOptions} />
              </div>
            </ChartBox>
            <ChartBox title="Channel Performance" sub="Online vs Retail Volume">
              <div className="h-[320px] p-6">
                <Bar data={comparisonChart} options={commonChartOptions} />
              </div>
            </ChartBox>
          </div>

          {/* Charts Row 2 */}
          <div className="w-full">
            <ChartBox title="Revenue Trajectory" sub="Rolling 7-Day Performance Window">
              <div className="h-[450px] w-full p-6">
                <Line data={sevenDayChart} options={commonChartOptions} />
              </div>
            </ChartBox>
          </div>

        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, value, icon, gold }: any) {
  return (
    <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-50 flex flex-col justify-between group hover:border-brand-gold/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-brand-blue/5 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${gold ? 'bg-brand-gold' : 'bg-brand-blue'}`} />
      <div className="flex justify-between items-start mb-8">
        <div className={`p-4 rounded-2xl transition-all duration-500 ${gold ? 'bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-white' : 'bg-brand-blue/5 text-brand-blue group-hover:bg-brand-blue group-hover:text-white'}`}>
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-slate-200 group-hover:text-brand-gold transition-colors" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
        <p className={`text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none ${gold ? 'text-brand-gold' : 'text-brand-blue'}`}>{value}</p>
      </div>
    </div>
  );
}

function ChartBox({ title, sub, children }: any) {
  return (
    <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all duration-700">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-blue">{title}</h2>
          <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.1em] italic mt-1">{sub}</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Calendar size={14} className="text-slate-400" />
        </div>
      </div>
      {children}
    </div>
  );
}

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { 
      grid: { color: "rgba(0,0,0,0.03)" },
      ticks: { font: { size: 10, weight: 700 }, color: "#94a3b8" }
    },
    x: { 
      grid: { display: false }, 
      ticks: { font: { size: 10, weight: 800 }, color: "#2b2652" } 
    }
  }
};

const pieOptions = {
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      position: 'bottom' as const, 
      labels: { 
        padding: 20,
        font: { size: 11, weight: 800 }, 
        color: "#2b2652",
        usePointStyle: true 
      } 
    } 
  }
};