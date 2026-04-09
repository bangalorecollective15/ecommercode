"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Package, ChevronRight, Download, X, Loader2, Clock, 
  CheckCircle2, Truck, Box, ReceiptText, ShieldCheck
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import supabase from "@/lib/supabase";

interface CartItem {
  productId: number;
  name: string;
  variationName?: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface Order {
  id: string;
  cart_items: CartItem[];
  payment_status: string;
  payment_rejection_reason?: string;
  full_name: string;
  total_price: number;
  grand_total: number;
  order_date: string;
  status: string;
  payment_method: string;
  house_number: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

const statusFlow = ["placed", "confirmed", "processing", "out for delivery", "delivered"];

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  placed: { label: "Logged", icon: Clock, color: "text-slate-400" },
  confirmed: { label: "Verified", icon: CheckCircle2, color: "text-blue-500" },
  processing: { label: "Crafting", icon: Package, color: "text-brand-gold" },
  "out for delivery": { label: "In Transit", icon: Truck, color: "text-brand-blue" },
  delivered: { label: "Received", icon: Box, color: "text-emerald-600" },
  cancelled: { label: "Void", icon: X, color: "text-red-500" },
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "Awaiting Clearance", color: "text-amber-600", bgColor: "bg-amber-50" },
    paid: { label: "Funds Verified", color: "text-emerald-600", bgColor: "bg-emerald-50" },
    rejected: { label: "Declined", color: "text-red-600", bgColor: "bg-red-50" },
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchUser();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: ordersData } = await supabase.from("orders").select("*").eq("user_id", userId).order("order_date", { ascending: false });
      const { data: imagesData } = await supabase.from("product_images").select("product_id, image_url");
      const imageMap = new Map(imagesData?.map(img => [img.product_id, img.image_url]));

      const formatted = (ordersData || []).map(order => ({
        ...order,
        cart_items: (order.cart_items || []).map((item: any) => ({
          ...item,
          image_url: imageMap.get(item.productId) || "/placeholder.png",
        }))
      }));
      setOrders(formatted);
    } catch (err) {
      toast.error("Failed to sync history");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(43, 38, 82); // brand-blue
    doc.text("PURCHASE MANIFEST", 105, 20, { align: "center" });
    autoTable(doc, {
      startY: 40,
      head: [["Asset", "Qty", "Unit Price", "Subtotal"]],
      body: order.cart_items.map(i => [i.name, i.quantity, `₹${i.price}`, `₹${i.price * i.quantity}`]),
      headStyles: { fillColor: [43, 38, 82] }
    });
    doc.save(`Invoice-${order.id.slice(0, 8)}.pdf`);
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-gold" /></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-24 px-6 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold block mb-2">Vault / Archive</span>
            <h1 className="text-5xl font-black tracking-tighter text-brand-blue uppercase">Collections<span className="text-brand-gold">.</span></h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acquisitions</p>
            <p className="text-2xl font-black text-brand-blue">{orders.length}</p>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="h-[40vh] border border-slate-100 bg-white rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12">
            <Package size={40} className="text-slate-200 mb-4" />
            <h2 className="text-lg font-black text-brand-blue uppercase tracking-widest mb-2">No History Found</h2>
            <Link href="/userinterface/Gproducts" className="text-[10px] font-black uppercase tracking-widest text-brand-gold border-b-2 border-brand-gold pb-1">Begin Collection</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status.toLowerCase()] || statusConfig.placed;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="group relative bg-white border border-slate-100 p-5 md:p-6 rounded-[2rem] hover:border-brand-gold/30 hover:shadow-xl hover:shadow-brand-blue/5 transition-all duration-500 cursor-pointer flex flex-col md:flex-row items-center gap-6"
                >
                  {/* IMAGE STACK */}
                  <div className="flex -space-x-8 shrink-0 py-2">
                    {order.cart_items.slice(0, 3).map((item, i) => (
                      <div key={i} className="relative w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden border-2 border-white shadow-md transition-transform group-hover:-translate-y-1" style={{ zIndex: 10 - i }}>
                        <Image src={item.image_url || "/placeholder.png"} alt="item" fill className="object-cover" />
                      </div>
                    ))}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-slate-50 ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight truncate">
                      {order.cart_items.map(i => i.name).join(", ")}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Clock size={10} /> {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* PRICE & ACTION */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[8px] font-black text-brand-gold uppercase tracking-widest">Total Value</p>
                      <p className="text-xl font-black text-brand-blue">₹{order.grand_total.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-full bg-slate-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- DRAWER --- */}
      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-brand-blue/40 backdrop-blur-md flex justify-end">
          <div className="bg-white w-full max-w-xl h-full p-8 md:p-12 relative overflow-y-auto shadow-2xl animate-drawer-in">
            <button onClick={() => setSelectedOrderId(null)} className="absolute top-8 right-8 text-slate-300 hover:text-brand-blue transition-all">
              <X size={24} />
            </button>

            <header className="mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold block mb-2">Manifest Summary</span>
              <h2 className="text-3xl font-black text-brand-blue tracking-tighter uppercase">Order Details</h2>
            </header>

            {/* STATUS TRACKER */}
            <div className="flex justify-between mb-12 relative">
              <div className="absolute top-1.5 left-0 w-full h-[1px] bg-slate-100 -z-10" />
              {statusFlow.map((s, idx) => {
                const isDone = statusFlow.indexOf(selectedOrder.status.toLowerCase()) >= idx;
                return (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-all ${isDone ? 'bg-brand-gold ring-4 ring-brand-gold/10' : 'bg-slate-200'}`} />
                    <span className={`text-[7px] font-black uppercase tracking-tighter ${isDone ? 'text-brand-blue' : 'text-slate-300'}`}>{s}</span>
                  </div>
                );
              })}
            </div>

            {/* PRODUCT LIST */}
            <div className="space-y-3 mb-8">
              {selectedOrder.cart_items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-50 bg-[#fafafa]">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white">
                    <Image src={item.image_url || "/placeholder.png"} alt="p" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[10px] font-black text-brand-blue uppercase truncate pr-4">{item.name}</h4>
                      <span className="text-[10px] font-black text-brand-blue">₹{item.price.toLocaleString()}</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.variationName} • Qty {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                <p className="text-[10px] font-bold text-brand-blue uppercase">{selectedOrder.payment_method}</p>
              </div>
              <div className={`p-4 rounded-2xl border border-slate-100 ${paymentStatusConfig[selectedOrder.payment_status]?.bgColor}`}>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className={`text-[10px] font-black uppercase ${paymentStatusConfig[selectedOrder.payment_status]?.color}`}>
                  {paymentStatusConfig[selectedOrder.payment_status]?.label}
                </p>
              </div>
            </div>

            {/* ADDRESS & FINAL */}
            <div className="bg-brand-blue p-8 rounded-[2.5rem] text-white shadow-2xl shadow-brand-blue/20">
              <div className="flex items-start gap-3 mb-6">
                <ShieldCheck size={16} className="text-brand-gold mt-0.5" />
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-brand-gold mb-2">Delivery Credentials</h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">
                    {selectedOrder.full_name}<br />
                    {selectedOrder.house_number}, {selectedOrder.street}<br />
                    {selectedOrder.city}, {selectedOrder.state} {selectedOrder.pincode}
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Total Investment</p>
                  <p className="text-3xl font-black tracking-tighter text-brand-gold">₹{selectedOrder.grand_total.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => downloadInvoice(selectedOrder)}
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-brand-gold transition-all rounded-full"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-drawer-in { animation: drawer-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}