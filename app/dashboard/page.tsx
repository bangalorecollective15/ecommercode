"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  TrendingUp, Package, Users, ShoppingBag, 
  Layers, Activity, ArrowUpRight, Zap, LayoutDashboard
} from "lucide-react";

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Tooltip, Legend, ChartData,
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

// -------------------- TYPES --------------------
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
  recentOrders: Order[];
  recentPosOrders: Order[];
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, totalPOSOrders: 0, onlineSales: 0, posSales: 0,
    totalCustomers: 0, totalProducts: 0, activeBanners: 0, activeOffers: 0,
    recentOrders: [], recentPosOrders: [],
  });

  const [sevenDayChart, setSevenDayChart] = useState<any>({ labels: [], datasets: [] });
  const [comparisonChart, setComparisonChart] = useState<any>({ labels: [], datasets: [] });
  const [categoryChart, setCategoryChart] = useState<any>({ labels: [], datasets: [] });

  // Load data immediately on mount (Auth is handled by RootLayout)
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [
        orders, posOrders, onlineSales, posSales, products, 
        customers, banners, offers, recentOrders, recentPosOrders, 
        last7DaysOrders, monthlyOrders, monthlyPosOrders, productCategories
      ] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact" }),
        supabase.from("pos_orders").select("id", { count: "exact" }),
        supabase.from("orders").select("grand_total"),
        supabase.from("pos_orders").select("grand_total"),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("customers").select("id", { count: "exact" }),
        supabase.from("banner").select("id", { count: "exact" }).eq("active", true),
        supabase.from("offers").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("orders").select("id, full_name, grand_total, order_date").order("order_date", { ascending: false }).limit(5),
        supabase.from("pos_orders").select("id, full_name, grand_total, order_date").order("order_date", { ascending: false }).limit(5),
        supabase.from("orders").select("grand_total, order_date").gte("order_date", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("orders").select("id").gte("order_date", "2025-01-01"),
        supabase.from("pos_orders").select("id").gte("order_date", "2025-01-01"),
        supabase.from("products").select("id, category_id"),
      ]);

      // --- Chart Data Processing ---
      const daily: Record<string, number> = {};
      last7DaysOrders.data?.forEach((o: any) => {
        const day = new Date(o.order_date).toLocaleDateString("en-IN", { weekday: "short" });
        daily[day] = (daily[day] || 0) + Number(o.grand_total);
      });

      const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      setSevenDayChart({
        labels: week,
        datasets: [{
          label: "Online Sales (₹)",
          data: week.map((d) => daily[d] || 0),
          borderColor: "#000",
          backgroundColor: "rgba(0,0,0,0.05)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        }],
      });

      setComparisonChart({
        labels: ["Online", "POS"],
        datasets: [{
          label: "Orders Count",
          data: [monthlyOrders?.data?.length ?? 0, monthlyPosOrders?.data?.length ?? 0],
          backgroundColor: ["#000", "#E5E5E5"],
          borderRadius: 8,
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
          backgroundColor: ["#000", "#404040", "#737373", "#A3A3A3", "#D4D4D4"],
          borderWidth: 0,
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
        recentOrders: (recentOrders.data as Order[]) || [],
        recentPosOrders: (recentPosOrders.data as Order[]) || [],
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Refreshing Studio...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] selection:bg-black selection:text-white">
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 md:p-10 space-y-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="fill-black" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Live Analytics</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Studio Overview</h1>
            </div>
            <button 
              onClick={loadDashboard}
              className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-black/10"
            >
              Refresh Data
            </button>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <DashboardCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingBag size={18}/>} />
            <DashboardCard title="POS Orders" value={stats.totalPOSOrders} icon={<Activity size={18}/>} />
            <DashboardCard title="Online Sales" value={`₹${stats.onlineSales.toLocaleString()}`} icon={<TrendingUp size={18}/>} />
            <DashboardCard title="POS Sales" value={`₹${stats.posSales.toLocaleString()}`} icon={<LayoutDashboard size={18}/>} />
            <DashboardCard title="Total Products" value={stats.totalProducts} icon={<Package size={18}/>} />
            <DashboardCard title="Total Customers" value={stats.totalCustomers} icon={<Users size={18}/>} />
            <DashboardCard title="Active Banners" value={stats.activeBanners} icon={<Layers size={18}/>} />
            <DashboardCard title="Low Stock" value={stats.activeOffers} icon={<Zap size={18}/>} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartBox title="Category-wise Products" sub="Inventory Distribution">
              <div className="h-[300px] flex items-center justify-center py-6">
                <Pie data={categoryChart} options={pieOptions} />
              </div>
            </ChartBox>
            <ChartBox title="Online vs POS Orders" sub="Monthly Channel Comparison">
              <div className="h-[300px] py-6">
                <Bar data={comparisonChart} options={commonChartOptions} />
              </div>
            </ChartBox>
          </div>

          <div className="w-full">
            <ChartBox title="Sales Trend" sub="7 Day Performance Analysis">
              <div className="h-[400px] w-full py-6">
                <Line data={sevenDayChart} options={commonChartOptions} />
              </div>
            </ChartBox>
          </div>

        </div>
      </main>
    </div>
  );
}

// -------------------- COMPONENTS --------------------

function DashboardCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col justify-between group hover:border-black transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-black/5">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-all duration-500">
          {icon}
        </div>
        <ArrowUpRight size={14} className="text-gray-200 group-hover:text-black transition-colors" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{title}</p>
        <p className="text-xl md:text-2xl font-black tracking-tighter text-black uppercase leading-none">{value}</p>
      </div>
    </div>
  );
}

function ChartBox({ title, sub, children }: any) {
  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-700">
      <div className="mb-2">
        <h2 className="text-[12px] font-black uppercase tracking-widest text-black">{title}</h2>
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.1em] italic">{sub}</p>
      </div>
      {children}
    </div>
  );
}

// -------------------- CHART OPTIONS --------------------
// -------------------- CHART OPTIONS --------------------

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { display: false },
    x: { 
      grid: { display: false }, 
      border: { display: false }, 
      ticks: { 
        font: { 
          size: 9, 
          weight: 900 // Changed from '900' to 900
        } 
      } 
    }
  }
};

const pieOptions = {
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      position: 'bottom' as const, 
      labels: { 
        font: { 
          size: 10, 
          weight: 900 // Changed from '900' to 900
        }, 
        usePointStyle: true 
      } 
    } 
  }
};