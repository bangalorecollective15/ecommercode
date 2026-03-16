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
  ShieldCheck
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
  if (!order) return;

  setStatusUpdating(true);

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", order.id);

  if (error) {
    console.error("Status update error:", error);
  } else {
    setOrderStatus(newStatus);

    setOrder(prev =>
      prev ? { ...prev, status: newStatus } : null
    );
  }

  setStatusUpdating(false);
}

  const handlePaymentToggle = async () => {
    if (!order) return;
    const nextPaidState = !paymentPaid;
    const { error } = await supabase.from("orders").update({ payment_status: nextPaidState ? "paid" : "pending" }).eq("id", order.id);
    if (!error) setPaymentPaid(nextPaidState);
  };

  const printInvoice = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${order.id}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
              table { width: 100%; border-collapse: collapse; }
              th { background: #f9f9f9; text-align: left; padding: 12px; border-bottom: 2px solid #eee; }
              td { padding: 12px; border-bottom: 1px solid #eee; }
              .total-box { margin-left: auto; width: 250px; margin-top: 30px; }
              .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
              .grand-total { font-weight: bold; font-size: 1.2rem; color: #ea580c; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div><h1>INVOICE</h1><p>#ORD-${order.id}</p></div>
              <div style="text-align: right font-weight: bold;">SWAADHA STORE</div>
            </div>
            <div class="details">
              <div><strong>Billed To:</strong><br/>${order.full_name}<br/>${order.house_number}, ${order.street}<br/>${order.city}, ${order.pincode}<br/>${order.phone_number}</div>
              <div style="text-align: right;"><strong>Order Date:</strong><br/>${new Date(order.order_date).toLocaleDateString()}</div>
            </div>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                ${order.cart_items?.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-box">
              <div class="total-row"><span>Subtotal</span><span>₹${order.total_price.toFixed(2)}</span></div>
              <div class="total-row"><span>Shipping</span><span>₹${order.shipping_cost.toFixed(2)}</span></div>
              <div class="total-row grand-total"><span>Total</span><span>₹${order.grand_total.toFixed(2)}</span></div>
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
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Top Navigation / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 font-bold">
          <Package size={16} />     <Link href="/orderupdate"><span>ORDERS</span></Link> <ChevronRight size={14} /> <span className="text-orange-600 uppercase tracking-widest">Update Order</span>
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
                    {order?.order_date &&
                      new Date(order.order_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                  </span>

                  <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                    <Clock size={14} />
                    {order?.order_date &&
                      new Date(order.order_date).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                </div>
                <button
                  onClick={printInvoice}
                  className="flex items-center gap-2 bg-white hover:bg-slate-900 hover:text-white text-slate-900 border-2 border-slate-900 px-6 py-3 rounded-2xl font-black transition-all active:scale-95 text-sm"
                >
                  <Printer size={18} /> PRINT INVOICE
                </button>
              </div>

              <div className="p-0">
                <table className="w-full">
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
                              {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="m-auto mt-4 text-slate-300" />}
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

              <div className="p-8 bg-slate-50/30 flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-400">
                    <span>Subtotal</span> <span className="text-slate-700">₹{order?.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-400">
                    <span>Shipping</span> <span className="text-slate-700">₹{order?.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="font-black text-slate-900">GRAND TOTAL</span>
                    <span className="text-2xl font-black text-orange-600">₹{order?.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls (Right Sidebar) */}
          <div className="space-y-6">

            {/* Status Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                <ShieldCheck size={18} className="text-orange-600" /> Fulfillment
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-wider">Order Status</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    value={orderStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="out of delivery">Out of Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Status</p>
                    <p className={`text-xs font-black mt-0.5 ${paymentPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {paymentPaid ? 'RECEIVED' : 'AWAITING'}
                    </p>
                  </div>
                  <button
                    onClick={handlePaymentToggle}
                    className={`w-12 h-6 rounded-full transition-all relative ${paymentPaid ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${paymentPaid ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
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
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Customer ID #{order?.id}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Phone size={16} className="text-slate-400" /> {order?.phone_number}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Mail size={16} className="text-slate-400" /> {order?.email || "No email provided"}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <CreditCard size={16} className="text-slate-400" /> {order?.payment_method?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                <MapPin size={18} className="text-orange-600" /> Shipping Address
              </h3>
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {order?.house_number}, {order?.street}<br />
                  {order?.city}, {order?.state}<br />
                  <span className="text-orange-600 font-black">PIN: {order?.pincode}</span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}