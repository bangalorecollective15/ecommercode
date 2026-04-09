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
  CreditCard,ArrowUpRight,
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
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 text-brand-blue selection:bg-brand-gold selection:text-white">
      <div className="max-w-7xl mx-auto">

        {/* Top Navigation */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-8 font-black tracking-[0.2em]">
          <Package size={14} className="text-brand-gold" /> 
          <Link href="/orders" className="hover:text-brand-blue transition-colors">REGISTRY</Link> 
          <ChevronRight size={12} /> 
          <span className="text-brand-gold">ORDER ARCHIVE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-brand-blue/5 border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                    <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Official Statement</span>
                  </div>
                  <h1 className="text-3xl font-black text-brand-blue tracking-tighter uppercase">Order <span className="text-brand-gold">#ORD-{order?.id}</span></h1>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    <Calendar size={14} className="text-slate-300" />
                    {order?.order_date && new Date(order.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={printInvoice}
                  className="flex items-center gap-3 bg-brand-blue text-brand-gold border border-brand-blue px-8 py-4 rounded-2xl font-black transition-all text-[11px] tracking-widest hover:bg-brand-gold hover:text-brand-blue shadow-lg shadow-brand-blue/10 active:scale-95"
                >
                  <Printer size={18} /> GENERATE INVOICE
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black border-b border-slate-50 bg-slate-50/20">
                      <th className="px-10 py-5 text-left">Manifest Items</th>
                      <th className="px-10 py-5 text-center">Qty</th>
                      <th className="px-10 py-5 text-right">Unit Price</th>
                      <th className="px-10 py-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order?.cart_items?.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm group-hover:border-brand-gold transition-colors">
                              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="m-auto mt-5 text-slate-200" />}
                            </div>
                            <div>
                              <p className="font-black text-brand-blue text-sm uppercase tracking-tight leading-tight">{item.name}</p>
                              <p className="text-[9px] font-black text-brand-gold mt-1.5 uppercase tracking-[0.15em] px-2 py-0.5 bg-brand-gold/10 rounded-full inline-block">
                                {item.variation_name || "Standard Edition"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center font-black text-brand-blue text-sm">{item.quantity}</td>
                        <td className="px-10 py-8 text-right font-bold text-slate-400 text-sm">₹{item.price.toFixed(2)}</td>
                        <td className="px-10 py-8 text-right font-black text-brand-blue text-sm">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="p-10 bg-brand-blue flex justify-end">
                <div className="w-full max-w-[320px] space-y-4">
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Registry Subtotal</span> <span className="text-white">₹{order?.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2">Taxes <span className="text-[8px] bg-brand-gold text-brand-blue px-2 py-0.5 rounded-full">GST 18%</span></span> 
                    <span className="text-white">₹{(order ? order.total_price * 0.18 : 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Logistics</span> <span className="text-white">₹{order?.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className="font-black text-brand-gold leading-none tracking-widest text-xs uppercase">Settlement Total</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase mt-2">Certified Authentic Transaction</span>
                    </div>
                    <span className="text-4xl font-black text-white tracking-tighter">₹{order?.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-8">

            {/* Payment Verification */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-blue/5 border border-slate-100">
              <h3 className="flex items-center gap-3 text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-8">
                <ShieldCheck size={18} className="text-brand-gold" /> Verification
              </h3>

              <div className="space-y-6">
                <div className={`p-5 rounded-2xl flex flex-col gap-3 ${paymentPaid ? 'bg-emerald-50 border border-emerald-100' : 'bg-brand-gold/5 border border-brand-gold/10'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    {paymentPaid ? 
                      <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] tracking-widest"><CheckCircle2 size={12}/> CLEARED</span> :
                      <span className="flex items-center gap-1.5 text-brand-gold font-black text-[9px] tracking-widest"><Clock size={12}/> AWAITING</span>
                    }
                  </div>
                  <p className="text-xs font-bold text-brand-blue leading-relaxed">
                    {paymentPaid ? "Transaction has been authenticated and funds verified." : "Awaiting manual verification of receipt."}
                  </p>
                </div>

                {order?.payment_id ? (
                  <div className="p-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-3 block tracking-[0.2em]">Transaction Artifact</label>
                    <a 
                      href={order.payment_id} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-brand-gold transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-brand-gold group-hover:text-brand-gold transition-all shadow-sm">
                          <Eye size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-brand-blue uppercase">Evidence.jpg</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">External Link</p>
                        </div>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-300 group-hover:text-brand-gold transition-all" />
                    </a>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Artifact Provided</p>
                  </div>
                )}

                {!paymentPaid && (
                  <button 
                    onClick={handleApprovePayment}
                    className="w-full bg-brand-blue text-brand-gold p-5 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-brand-gold hover:text-brand-blue transition-all shadow-lg shadow-brand-blue/10 uppercase"
                  >
                    Authorize Payment
                  </button>
                )}
              </div>
            </div>

            {/* Status Update */}
            <div className={`bg-brand-blue rounded-[2.5rem] p-8 shadow-xl shadow-brand-blue/20 transition-all ${!paymentPaid ? 'opacity-50 grayscale' : ''}`}>
              <h3 className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">
                <Package size={18} className="text-brand-gold" /> Logistics
              </h3>

              <div className="space-y-4">
                {!paymentPaid && (
                  <div className="flex items-center gap-2 p-3 bg-white/10 text-brand-gold rounded-xl text-[8px] font-black border border-white/10 uppercase tracking-widest">
                    <AlertCircle size={12}/> Secure: Verification Required
                  </div>
                )}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-3 block tracking-widest">Order Life-cycle</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-[11px] font-black text-white uppercase tracking-widest focus:ring-2 focus:ring-brand-gold transition-all outline-none disabled:cursor-not-allowed appearance-none"
                    value={orderStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={!paymentPaid || statusUpdating}
                  >
                    <option className="text-brand-blue" value="pending">In Queue</option>
                    <option className="text-brand-blue" value="confirmed">Confirmed</option>
                    <option className="text-brand-blue" value="processing">Workplace</option>
                    <option className="text-brand-blue" value="out of delivery">In Transit</option>
                    <option className="text-brand-blue" value="delivered">Archived</option>
                    <option className="text-brand-blue" value="cancelled">Voided</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-blue/5 border border-slate-100">
              <h3 className="flex items-center gap-3 text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-8">
                <User size={18} className="text-brand-gold" /> Client Profile
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-brand-blue text-brand-gold rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-brand-blue/10">
                    {order?.full_name[0]}
                  </div>
                  <div>
                    <p className="font-black text-brand-blue uppercase tracking-tight leading-none">{order?.full_name}</p>
                    <p className="text-[9px] font-black text-brand-gold mt-2 uppercase tracking-widest">Legacy ID #{order?.id}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 text-[11px] font-black text-brand-blue/70 uppercase tracking-widest">
                  <div className="flex items-center gap-4"><Phone size={16} className="text-brand-gold" /> {order?.phone_number}</div>
                  <div className="flex items-center gap-4"><Mail size={16} className="text-brand-gold" /> {order?.email || "NOT PROVIDED"}</div>
                  <div className="flex items-center gap-4 border-t border-slate-50 pt-4"><CreditCard size={16} className="text-brand-gold" /> {order?.payment_method?.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="bg-brand-gold rounded-[2.5rem] p-8 shadow-xl shadow-brand-gold/10 text-brand-blue">
              <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                <MapPin size={18} /> Destination
              </h3>
              <div className="p-6 bg-white/30 backdrop-blur-sm rounded-2xl text-[11px] font-black uppercase tracking-widest leading-relaxed border border-white/40">
                {order?.house_number}, {order?.street}<br />
                {order?.city}, {order?.state}<br />
                <span className="mt-4 block text-xs underline decoration-2 underline-offset-4 font-black">ZIP: {order?.pincode}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}