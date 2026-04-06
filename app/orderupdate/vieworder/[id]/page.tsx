"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Printer,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Package,
  Clock,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem {
  id: number;
  productId: number;
  name: string;
  variation_name?: string;
  quantity: number;
  shipping_charge?: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  full_name: string;
  phone_number: string;
  alt_phone_number?: string;
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
  cart_items?: CartItem[];
  email?: string;
  reference_code?: string;
  payment_status?: string;
  payment_id?: string;
}

export default function OrderUpdatePage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const orderId = segments[segments.length - 1];
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [paymentPaid, setPaymentPaid] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setError("Invalid order ID");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const result = await res.json();

        if (!result.order) {
          setError(result.error || "Order not found");
          setLoading(false);
          return;
        }

        const orderData: Order = result.order;
        let items: CartItem[] = Array.isArray(orderData.cart_items) ? orderData.cart_items : [];

        if (items.length > 0) {
          const productIds = items.map((item) => item.productId);
          const { data: productsData } = await supabase
            .from("products")
            .select("id, shipping_charge")
            .in("id", productIds);

          items = items.map((item) => {
            const product = productsData?.find((p) => p.id === item.productId);
            return { ...item, shipping_charge: product?.shipping_charge ?? 0 };
          });
        }

        setOrder({ ...orderData, cart_items: items });
        setOrderStatus(orderData.status);
        setPaymentPaid(orderData.payment_status === "paid");
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  async function handleStatusChange(newStatus: string) {
    if (!order || !paymentPaid) return;

    setStatusUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      console.error("Status update error:", error);
    } else {
      setOrderStatus(newStatus);
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setStatusUpdating(false);
  }

  const handleApprovePayment = async () => {
    if (!order) return;
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", order.id);
    
    if (!error) {
      setPaymentPaid(true);
      setOrder(prev => prev ? { ...prev, payment_status: "paid" } : null);
    }
  };

  const printInvoice = () => {
    if (!order) return;
    const gstAmount = order.total_price * 0.18;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${order.id}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; }
              .header h1 { margin: 0; font-size: 2rem; font-weight: 900; letter-spacing: -0.025em; }
              .details { margin: 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #f8fafc; text-align: left; padding: 14px; border-bottom: 2px solid #e2e8f0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
              td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }
              .total-box { margin-left: auto; width: 280px; margin-top: 40px; background: #f8fafc; padding: 20px; rounded: 12px; }
              .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.875rem; }
              .gst-row { color: #64748b; font-style: italic; }
              .grand-total { font-weight: 900; font-size: 1.25rem; color: #ea580c; border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div><h1>INVOICE</h1><p style="color: #64748b; font-weight: 700;">#ORD-${order.id}</p></div>
              <div style="text-align: right;">
                <div style="font-weight: 900; font-size: 1.2rem;">SWAADHA STORE</div>
                <div style="font-size: 0.75rem; color: #64748b;">Premium Quality Essentials</div>
              </div>
            </div>
            <div class="details">
              <div><strong style="text-transform: uppercase; font-size: 0.7rem; color: #94a3b8;">Billed To:</strong><br/>
                <span style="font-weight: 800;">${order.full_name}</span><br/>
                ${order.house_number}, ${order.street}<br/>
                ${order.city}, ${order.state} - ${order.pincode}<br/>
                Phone: ${order.phone_number}</div>
              <div style="text-align: right;"><strong style="text-transform: uppercase; font-size: 0.7rem; color: #94a3b8;">Order Summary:</strong><br/>
                Date: ${new Date(order.order_date).toLocaleDateString()}<br/>
                Payment: ${order.payment_method.toUpperCase()}<br/>
                Status: ${order.payment_status?.toUpperCase()}</div>
            </div>
            <table>
              <thead><tr><th>Item Description</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr></thead>
              <tbody>
                ${order.cart_items?.map(item => `
                  <tr>
                    <td><div style="font-weight: 700;">${item.name}</div><div style="font-size: 0.7rem; color: #64748b;">${item.variation_name || "Standard"}</div></td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
                    <td style="text-align: right; font-weight: 700;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-box">
              <div class="total-row"><span>Subtotal</span><span>₹${order.total_price.toFixed(2)}</span></div>
              <div class="total-row gst-row"><span>GST (18%)</span><span>+ ₹${gstAmount.toFixed(2)}</span></div>
              <div class="total-row"><span>Shipping Fees</span><span>₹${order.shipping_cost.toFixed(2)}</span></div>
              <div class="total-row grand-total"><span>Grand Total</span><span>₹${order.grand_total.toFixed(2)}</span></div>
            </div>
            <div style="margin-top: 50px; text-align: center; font-size: 0.75rem; color: #94a3b8;">
              Thank you for shopping with Swaadha Store!
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-600"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10 text-slate-900">
      <div className="max-w-6xl mx-auto">

        {/* Top Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 font-bold">
          <Package size={16} /> <Link href="/orderupdate" className="hover:text-slate-600"><span>ORDERS</span></Link> <ChevronRight size={14} /> <span className="text-orange-600 uppercase tracking-widest">Update Order</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Order #ORD-{order?.id}</h1>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                    <Calendar size={14} />
                    {order?.order_date && new Date(order.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={printInvoice}
                  className="flex items-center gap-2 bg-white hover:bg-slate-900 hover:text-white text-slate-900 border-2 border-slate-900 px-6 py-3 rounded-2xl font-black transition-all text-sm"
                >
                  <Printer size={18} /> PRINT INVOICE
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black border-b border-slate-50">
                      <th className="px-8 py-4 text-left">Item Details</th>
                      <th className="px-8 py-4 text-center">Qty</th>
                      <th className="px-8 py-4 text-right">Price</th>
                      <th className="px-8 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order?.cart_items?.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="m-auto mt-4 text-slate-300" />}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm leading-tight">{item.name}</p>
                              <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-wider">{item.variation_name || "Standard"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center font-bold text-slate-600">{item.quantity}</td>
                        <td className="px-8 py-6 text-right font-bold text-slate-600">₹{item.price.toFixed(2)}</td>
                        <td className="px-8 py-6 text-right font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Totals Section with GST */}
              <div className="p-8 bg-slate-50/30 flex justify-end">
                <div className="w-full max-w-[300px] space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-400">
                    <span>Subtotal</span> <span className="text-slate-700">₹{order?.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">GST <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded-full">18%</span></span> 
                    <span className="text-slate-700">₹{(order ? order.total_price * 0.18 : 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-400">
                    <span>Shipping</span> <span className="text-slate-700">₹{order?.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 leading-none tracking-tighter">GRAND TOTAL</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Inclusive of all taxes</span>
                    </div>
                    <span className="text-3xl font-black text-orange-600">₹{order?.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls (Right Sidebar) */}
          <div className="space-y-6">

            {/* Payment Verification Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                <ShieldCheck size={18} className="text-orange-600" /> Payment Verification
              </h3>

              <div className="space-y-4">
                <div className={`p-4 rounded-2xl flex flex-col gap-2 ${paymentPaid ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                    {paymentPaid ? 
                      <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px]"><CheckCircle2 size={12}/> APPROVED</span> :
                      <span className="flex items-center gap-1 text-amber-600 font-black text-[10px]"><Clock size={12}/> PENDING</span>
                    }
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    {paymentPaid ? "Payment has been verified." : "Awaiting admin confirmation."}
                  </p>
                </div>

                {order?.payment_id ? (
                  <div className="p-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-wider">Transaction Proof</label>
                    <a 
                      href={order.payment_id} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-orange-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:text-orange-600 transition-colors">
                          <Eye size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">View Attachment</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Opens in new tab</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 italic">No proof uploaded by customer</p>
                  </div>
                )}

                {!paymentPaid && (
                  <button 
                    onClick={handleApprovePayment}
                    className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 mt-2"
                  >
                    APPROVE PAYMENT
                  </button>
                )}
              </div>
            </div>

            {/* Fulfillment Card */}
            <div className={`bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 transition-all ${!paymentPaid ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                <Package size={18} className="text-orange-600" /> Fulfillment
              </h3>

              <div className="space-y-4">
                {!paymentPaid && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                    <AlertCircle size={14}/> LOCK: APPROVE PAYMENT TO UPDATE STATUS
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-wider">Order Status</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={orderStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={!paymentPaid || statusUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="out of delivery">Out of Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                <User size={18} className="text-orange-600" /> Customer Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black text-lg">
                    {order?.full_name[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 leading-none">{order?.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">ID #{order?.id}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2 text-sm font-bold text-slate-600">
                  <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /> {order?.phone_number}</div>
                  <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /> {order?.email || "N/A"}</div>
                  <div className="flex items-center gap-3"><CreditCard size={16} className="text-slate-400" /> {order?.payment_method?.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                <MapPin size={18} className="text-orange-600" /> Shipping
              </h3>
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-sm font-bold text-slate-700 leading-relaxed">
                {order?.house_number}, {order?.street}<br />
                {order?.city}, {order?.state}<br />
                <span className="text-orange-600 font-black">PIN: {order?.pincode}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black text-slate-900 uppercase">Payment Proof</h2>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-slate-900 font-black">CLOSE</button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-50">
               {order?.payment_id ? (
                  <img src={order.payment_id} alt="Proof" className="max-h-[60vh] rounded-2xl object-contain shadow-md" />
               ) : (
                  <p className="p-10 text-slate-400 font-bold">No image available</p>
               )}
            </div>
            <div className="p-6">
              <button 
                onClick={() => { handleApprovePayment(); setShowProofModal(false); }}
                className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-colors"
              >
                CONFIRM & APPROVE PAYMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}