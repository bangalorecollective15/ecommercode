"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Toaster, toast } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  payment_status?: string;
  total_price: number;
  shipping_cost: number;
  grand_total: number;
  order_date: string;
  status: string;
}

const statusFlow = ["pending", "confirmed", "processing", "out for delivery", "delivered"];
const statusLabels: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  processing: "Processing",
  "out for delivery": "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "out for delivery": "bg-orange-50 text-orange-700 border-orange-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
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

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("order_date", { ascending: false });

        if (ordersError) throw ordersError;
        if (!ordersData) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const { data: imagesData } = await supabase
          .from("product_images")
          .select("product_id, image_url");

        const imageMap = new Map();
        imagesData?.forEach((img) => {
          if (!imageMap.has(img.product_id)) {
            imageMap.set(img.product_id, img.image_url);
          }
        });

        const updatedOrders = ordersData.map((order) => ({
          ...order,
          cart_items: (order.cart_items || []).map((item: any) => ({
            ...item,
            image_url: imageMap.get(item.productId) || "/placeholder.png",
          })),
        }));

        setOrders(updatedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const submitReview = async () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const user_id = sessionData.session?.user?.id;
    if (!user_id) {
      toast.error("Login required");
      return;
    }

    const { data: existing } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", reviewProduct?.productId)
      .eq("user_id", user_id);

    if (existing && existing.length > 0) {
      toast.error("You already reviewed this product");
      return;
    }

    const { error } = await supabase.from("product_reviews").insert({
      product_id: reviewProduct?.productId,
      user_id,
      rating,
      comment,
    });

    if (error) {
      toast.error("Failed to submit review");
      return;
    }

    toast.success("Review submitted successfully");
    setReviewModal(false);
    setRating(0);
    setComment("");
  };

  const renderStatusTimeline = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus.toLowerCase());
    return (
      <div className="relative pl-8">
        {statusFlow.map((status, idx) => {
          const active = idx <= currentIndex;
          const isLast = idx === statusFlow.length - 1;
          return (
            <div key={status} className="flex items-start mb-6 relative">
              <div className="absolute left-0 top-0 flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full transition-all duration-500 ${active ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-200"}`} />
                {!isLast && <div className={`w-0.5 h-12 transition-colors duration-500 ${active ? "bg-emerald-500" : "bg-gray-200"}`} />}
              </div>
              <div className="ml-6">
                <p className={`text-sm font-bold ${active ? "text-gray-900" : "text-gray-400"}`}>{statusLabels[status]}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 35);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`, 14, 40);
    doc.text(`Customer: ${order.full_name}`, 14, 50);
    doc.text(`Address: ${order.house_number}, ${order.street}, ${order.city}`, 14, 55);

    const tableRows = order.cart_items.map(item => [
      item.variationName ? `${item.name} (${item.variationName})` : item.name,
      item.quantity,
      `INR ${item.price.toFixed(2)}`,
      `INR ${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [["Product", "Qty", "Price", "Total"]],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Shipping: INR ${order.shipping_cost.toFixed(2)}`, 140, finalY + 10);
    doc.setFontSize(12);
    doc.text(`Grand Total: INR ${order.grand_total.toFixed(2)}`, 140, finalY + 20);
    doc.save(`Invoice-${order.id.slice(0, 8)}.pdf`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">Loading your orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track your recent purchases</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {orders.length === 0 ? (
          <div className="text-center bg-white border border-dashed border-gray-300 rounded-3xl p-16">
            <p className="text-gray-400 text-lg">No orders found in your history.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                          <p className="text-sm font-mono font-bold text-gray-700">#{order.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {order.cart_items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="relative">
                            <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-gray-100" />
                            {item.quantity > 1 && (
                              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.quantity}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col justify-between items-end gap-4 pt-6 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      <div className="text-left lg:text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status.toLowerCase()] || "bg-gray-100"}`}>
                          {statusLabels[order.status.toLowerCase()] || order.status}
                        </span>
                        <p className="text-2xl font-black text-gray-900 mt-2">₹{order.grand_total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedOrderId && selectedOrder && (
        <>
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedOrderId(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadInvoice(selectedOrder)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <button onClick={() => setSelectedOrderId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Tracking</h3>
                {renderStatusTimeline(selectedOrder.status)}
              </section>

              <section className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Items Ordered</h3>
                <div className="space-y-3">
                  {selectedOrder.cart_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100">
                      <img src={item.image_url} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x ₹{item.price}</p>
                      </div>
                      {selectedOrder.status === 'delivered' && (
                        <button 
                          onClick={() => { setReviewProduct({ productId: item.productId, name: item.name }); setReviewModal(true); }}
                          className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 border-t bg-gray-50">
               <div className="flex justify-between items-center text-xl font-black text-gray-900">
                  <span>Grand Total</span>
                  <span>₹{selectedOrder.grand_total.toFixed(2)}</span>
               </div>
            </div>
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Write a Review</h2>
            <p className="text-gray-500 text-sm mb-6">How was your experience with {reviewProduct?.name}?</p>
            <div className="flex justify-center space-x-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-transform active:scale-90 ${rating >= star ? "text-yellow-400" : "text-gray-200"}`}>★</button>
              ))}
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Tell others what you loved or how it can be improved..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-3 mt-8">
              <button onClick={() => setReviewModal(false)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
              <button onClick={submitReview} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition">Submit Review</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-slide-in { animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slide-in { 0% { transform: translateX(100%); } 100% { transform: translateX(0%); } }
      `}</style>
    </div>
  );
}