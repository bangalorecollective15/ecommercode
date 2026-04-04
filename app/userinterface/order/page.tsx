"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Package, 
  ChevronRight, 
  Download, 
  Star, 
  X, 
  Loader2, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  Box
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import supabase from "@/lib/supabase";

// --- Interfaces & Constants ---
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
  user_id: string;
  cart_items: CartItem[];
  full_name: string;
  phone_number: string;
  house_number: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  total_price: number;
  shipping_cost: number;
  grand_total: number;
  order_date: string;
  status: string;
}

const statusFlow = ["placed", "confirmed", "processing", "out for delivery", "delivered"];

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  placed: { label: "Order Placed", icon: Clock, color: "text-amber-500" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-blue-500" },
  processing: { label: "Processing", icon: Package, color: "text-indigo-500" },
  "out for delivery": { label: "In Transit", icon: Truck, color: "text-orange-500" },
  delivered: { label: "Delivered", icon: Box, color: "text-emerald-500" },
  cancelled: { label: "Cancelled", icon: X, color: "text-red-500" },
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<{ productId: number; name: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // 🔐 AUTH SESSION
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchUser();
  }, []);

  // 🛒 FETCH ORDERS
  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("order_date", { ascending: false });

      if (error) throw error;

      // Fetch images to ensure they match current product state
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
    } catch (err: any) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // 📄 INVOICE GENERATOR
  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 40);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`, 14, 45);
    doc.text(`Bill To: ${order.full_name}`, 14, 55);
    
    autoTable(doc, {
      startY: 65,
      head: [["Item", "Qty", "Price", "Total"]],
      body: order.cart_items.map(i => [i.name, i.quantity, `₹${i.price}`, `₹${i.price * i.quantity}`]),
      headStyles: { fillColor: [15, 23, 42] }
    });
    
    doc.save(`Order-${order.id.slice(0, 8)}.pdf`);
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-[#fafafa] pt-32 pb-24 px-6">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header - Styled like Cart Page */}
        <header className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 block mb-4">
            Account / History / {orders.length} Orders
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase">
            MY OR<span className="text-orange-600">D</span>ERS
          </h1>
        </header>

        {orders.length === 0 ? (
          <div className="h-[50vh] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center">
            <Package size={48} className="text-slate-200 mb-6" />
            <p className="font-bold text-slate-400 mb-8 uppercase tracking-widest text-xs">No orders placed yet</p>
            <Link href="/userinterface/Gproducts" className="bg-slate-900 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => {
              const status = statusConfig[order.status.toLowerCase()] || statusConfig.placed;
              return (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="group flex flex-col md:flex-row items-center gap-8 p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-orange-200 transition-all cursor-pointer"
                >
                  {/* Order Images Stack */}
                  <div className="flex -space-x-8">
                    {order.cart_items.slice(0, 3).map((item, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-sm rotate-[-5deg] group-hover:rotate-0 transition-transform">
                        <Image src={item.image_url || "/placeholder.png"} alt={item.name} fill className="object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <status.icon size={14} className={status.color} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-black text-xl uppercase text-slate-900">Order #{order.id.slice(0, 8)}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(order.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">₹{order.grand_total.toLocaleString()}</p>
                    <button className="mt-2 text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2 ml-auto">
                      View Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- ORDER DRAWER (Styled like Checkout Modal) --- */}
      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full p-10 relative overflow-y-auto animate-drawer-in">
            <button onClick={() => setSelectedOrderId(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-transform hover:rotate-90">
              <X size={32} strokeWidth={3} />
            </button>

            <header className="mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 block mb-2">Order Summary</span>
              <h2 className="text-4xl font-black tracking-tighter uppercase">Details</h2>
            </header>

            {/* Timeline */}
            <div className="flex justify-between mb-12 px-4">
              {statusFlow.map((s, idx) => {
                const isCompleted = statusFlow.indexOf(selectedOrder.status.toLowerCase()) >= idx;
                return (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-orange-600 ring-4 ring-orange-100' : 'bg-slate-200'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>{s}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-8">
              {/* Items List */}
              <div className="space-y-4">
                {selectedOrder.cart_items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white">
                      <Image src={item.image_url || "/placeholder.png"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 py-1">
                      <h4 className="font-black text-sm uppercase">{item.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.variationName}</p>
                      <div className="flex justify-between items-end mt-2">
                         <span className="text-xs font-bold text-slate-500">Qty: {item.quantity}</span>
                         <span className="font-black text-sm">₹{item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Info Card */}
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-4">Delivery Address</h4>
                <p className="font-bold text-sm leading-relaxed opacity-80">
                  {selectedOrder.full_name}<br />
                  {selectedOrder.house_number}, {selectedOrder.street}<br />
                  {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                </p>
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Paid</p>
                    <p className="text-3xl font-black">₹{selectedOrder.grand_total.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => downloadInvoice(selectedOrder)}
                    className="bg-white/10 p-4 rounded-2xl hover:bg-orange-600 transition-colors"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drawer-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-drawer-in {
          animation: drawer-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}