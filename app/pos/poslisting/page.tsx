"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  Search, Calendar, Filter, CreditCard, DollarSign,
  ShoppingBag, TrendingUp, RefreshCw, Layers, ArrowLeftRight, X,
  CheckCircle2, HandCoins, Download, FileText, Banknote, Wallet,
  Trash2, AlertTriangle
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EmbeddedVariation {
  id: number;
  size?: { name: string } | null;
  color?: { name: string } | null;
  price?: number;
  stock?: number;
  size_id?: number | null;
  color_id?: number | null;
  created_at?: string;
  product_id?: number;
  sale_price?: number | null;
}

interface OrderItem {
  id: number | string;
  cid?: string;
  qty: number;
  name?: string;
  price?: number;
  originalPrice?: number;
  variation?: EmbeddedVariation | null;
}

interface POSOrder {
  id: number;
  order_date: string;
  full_name: string | null;
  phone_number: string | null;
  payment_method: string | null;
  grand_total: number | string;
  amount_paid: number | string | null;
  order_items: OrderItem[] | null;
}

interface Category {
  id: number;
  name: string;
  priority?: number;
}

interface Product {
  id: number;
  name: string;
  category_id: number | null;
  sku?: string | null;
}

interface SelectableVariation {
  id: number;
  product_id: number;
  size_id: number | null;
  color_id: number | null;
  sizeName: string;
  colorName: string;
  price: number;
  sale_price: number | null;
  stock: number;
  created_at?: string;
}

// ─── Supabase ────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const amountsDiffer = (a: number, b: number) =>
  Math.round(a * 100) !== Math.round(b * 100);

// ─── PDF Download Helper ─────────────────────────────────────────────────────

function generateReportHTML(
  orders: POSOrder[],
  productLookupMap: Map<number, { name: string; categoryId: number | null; sku: string }>,
  filters: {
    dateFrom: string;
    dateTo: string;
    payment: string;
  },
  stats: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    cashTotal: number;
    upiTotal: number;
    cardTotal: number;
  }
): string {
  const now = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });

  const dateLabel =
    filters.dateFrom && filters.dateTo
      ? filters.dateFrom === filters.dateTo
        ? filters.dateFrom
        : `${filters.dateFrom} → ${filters.dateTo}`
      : filters.dateFrom || filters.dateTo || "All Dates";

  const paymentLabel = filters.payment || "All Methods";

  const rows = orders
    .map((order) => {
      const grandTotal = Number(order.grand_total) || 0;
      const hasAmountPaid =
        order.amount_paid != null && order.amount_paid !== "";
      const amountPaid = hasAmountPaid
        ? Number(order.amount_paid)
        : grandTotal;
      const wasNegotiated = hasAmountPaid && amountsDiffer(amountPaid, grandTotal);

      const itemsText = Array.isArray(order.order_items)
        ? order.order_items
            .map((item) => {
              const info = productLookupMap.get(Number(item.id));
              const name = item.name || info?.name || `#${item.id}`;
              const size = item.variation?.size?.name
                ? ` (${item.variation.size.name})`
                : "";
              return `${name}${size} ×${item.qty}`;
            })
            .join(", ")
        : "—";

      const dateStr = order.order_date
        ? new Date(order.order_date).toLocaleString("en-IN", {
            dateStyle: "short",
            timeStyle: "short",
            hour12: true,
          })
        : "N/A";

      return `
        <tr>
          <td>#${String(order.id).slice(-6)}</td>
          <td>${dateStr}</td>
          <td>
            <strong>${order.full_name || "Walk-In"}</strong><br/>
            <span style="color:#94a3b8;font-size:10px">${order.phone_number || "—"}</span>
          </td>
          <td>
            <span class="badge badge-${(order.payment_method || "").toLowerCase()}">
              ${order.payment_method || "N/A"}
            </span>
          </td>
          <td style="max-width:220px;word-break:break-word;font-size:10px">${itemsText}</td>
          <td style="text-align:right;font-weight:700">₹${grandTotal.toFixed(2)}</td>
          <td style="text-align:right">
            ${
              wasNegotiated
                ? `<span style="color:#f43f5e;font-weight:700">₹${amountPaid.toFixed(2)}</span><br/><span style="color:#94a3b8;font-size:9px">−₹${(grandTotal - amountPaid).toFixed(2)}</span>`
                : `<span style="color:#94a3b8">—</span>`
            }
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>POS Report — ${dateLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      padding: 32px 36px;
    }

    /* ── Header ── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1e3a5f;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand-block h1 {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #1e3a5f;
      text-transform: uppercase;
    }
    .brand-block .sub {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: #94a3b8;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .meta-block {
      text-align: right;
      font-size: 10px;
      color: #64748b;
      line-height: 1.8;
    }
    .meta-block strong { color: #1e3a5f; }

    /* ── Summary cards ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .card .label {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .card .value {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #1e3a5f;
    }
    .card .note {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .card.gold .value { color: #d97706; }

    /* ── Breakdown bar ── */
    .breakdown {
      display: flex;
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 24px;
      align-items: center;
    }
    .breakdown .title {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: #94a3b8;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    .breakdown .chips { display: flex; gap: 10px; flex-wrap: wrap; }
    .breakdown .chip {
      display: flex; align-items: center; gap: 6px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 10px;
    }
    .breakdown .chip .method { font-weight: 800; color: #1e3a5f; min-width: 30px; }
    .breakdown .chip .amt { font-weight: 700; color: #d97706; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-cash { background: #10b981; }
    .dot-upi { background: #6366f1; }
    .dot-card { background: #f59e0b; }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background: #1e3a5f;
      color: #fff;
    }
    thead th {
      padding: 10px 12px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-align: left;
    }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 9px 12px; vertical-align: top; line-height: 1.5; }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .badge-cash { background: #d1fae5; color: #065f46; }
    .badge-upi  { background: #e0e7ff; color: #3730a3; }
    .badge-card { background: #fef3c7; color: #92400e; }

    /* ── Footer ── */
    .report-footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
    .report-footer strong { color: #1e3a5f; }

    @media print {
      body { padding: 16px 20px; }
      @page { margin: 12mm; size: A4 landscape; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="report-header">
    <div class="brand-block">
      <h1>POS Transaction <span style="color:#d97706">Report</span></h1>
      <div class="sub">Point of Sale · Transaction Ledger Export</div>
    </div>
    <div class="meta-block">
      <div><strong>Generated:</strong> ${now}</div>
      <div><strong>Period:</strong> ${dateLabel}</div>
      <div><strong>Payment Filter:</strong> ${paymentLabel}</div>
      <div><strong>Total Records:</strong> ${orders.length}</div>
    </div>
  </div>

  <!-- Summary cards -->
  <div class="summary-grid">
    <div class="card gold">
      <div class="label">Gross Revenue</div>
      <div class="value">₹${stats.totalRevenue.toFixed(2)}</div>
      <div class="note">Settled collected amount</div>
    </div>
    <div class="card">
      <div class="label">Total Orders</div>
      <div class="value">${stats.totalOrders}</div>
      <div class="note">Matching this filter</div>
    </div>
    <div class="card">
      <div class="label">Avg. Order Value</div>
      <div class="value">₹${stats.avgOrderValue.toFixed(2)}</div>
      <div class="note">Per transaction</div>
    </div>
    <div class="card">
      <div class="label">Payment Split</div>
      <div class="value" style="font-size:13px;margin-top:2px">
        <span style="color:#10b981">C</span>
        <span style="color:#6366f1"> U</span>
        <span style="color:#f59e0b"> K</span>
      </div>
      <div class="note">Cash · UPI · Card</div>
    </div>
  </div>

  <!-- Breakdown bar -->
  <div class="breakdown">
    <span class="title">Payment Breakdown</span>
    <div class="chips">
      <div class="chip">
        <span class="dot dot-cash"></span>
        <span class="method">CASH</span>
        <span class="amt">₹${stats.cashTotal.toFixed(2)}</span>
      </div>
      <div class="chip">
        <span class="dot dot-upi"></span>
        <span class="method">UPI</span>
        <span class="amt">₹${stats.upiTotal.toFixed(2)}</span>
      </div>
      <div class="chip">
        <span class="dot dot-card"></span>
        <span class="method">CARD</span>
        <span class="amt">₹${stats.cardTotal.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th>Order ID</th>
        <th>Date & Time</th>
        <th>Customer</th>
        <th>Payment</th>
        <th>Items</th>
        <th style="text-align:right">Grand Total</th>
        <th style="text-align:right">Settled / Negotiated</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Footer -->
  <div class="report-footer">
    <div><strong>POS Transaction Ledger</strong> · Auto-generated report</div>
    <div>Period: ${dateLabel} · Filter: ${paymentLabel} · ${orders.length} record(s)</div>
  </div>

</body>
</html>`;
}

function downloadReport(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateCSV(
  orders: POSOrder[],
  productLookupMap: Map<number, { name: string; categoryId: number | null; sku: string }>
): string {
  const escape = (val: string | number | null | undefined) => {
    const s = val == null ? "" : String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const headers = [
    "Order ID",
    "Date",
    "Time",
    "Customer Name",
    "Phone",
    "Payment Method",
    "Items",
    "Quantities",
    "Sizes",
    "Grand Total (INR)",
    "Amount Paid (INR)",
    "Discount Negotiated (INR)",
    "Was Negotiated",
  ];

  const rows = orders.map((order) => {
    const grandTotal = Number(order.grand_total) || 0;
    const hasAmountPaid = order.amount_paid != null && order.amount_paid !== "";
    const amountPaid = hasAmountPaid ? Number(order.amount_paid) : grandTotal;
    const wasNegotiated = hasAmountPaid && amountsDiffer(amountPaid, grandTotal);
    const delta = grandTotal - amountPaid;

    const dt = order.order_date ? new Date(order.order_date) : null;
    const dateStr = dt ? dt.toLocaleDateString("en-IN") : "";
    const timeStr = dt ? dt.toLocaleTimeString("en-IN", { hour12: true }) : "";

    const itemNames = Array.isArray(order.order_items)
      ? order.order_items.map((i) => {
          const info = productLookupMap.get(Number(i.id));
          return i.name || info?.name || `#${i.id}`;
        }).join(" | ")
      : "";

    const itemQtys = Array.isArray(order.order_items)
      ? order.order_items.map((i) => i.qty).join(" | ")
      : "";

    const itemSizes = Array.isArray(order.order_items)
      ? order.order_items.map((i) => i.variation?.size?.name || "-").join(" | ")
      : "";

    return [
      escape(`#${String(order.id).slice(-6)}`),
      escape(dateStr),
      escape(timeStr),
      escape(order.full_name || "Walk-In"),
      escape(order.phone_number || ""),
      escape(order.payment_method || ""),
      escape(itemNames),
      escape(itemQtys),
      escape(itemSizes),
      escape(grandTotal.toFixed(2)),
      escape(amountPaid.toFixed(2)),
      escape(wasNegotiated ? delta.toFixed(2) : "0.00"),
      escape(wasNegotiated ? "Yes" : "No"),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function POSListingPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Exchange Modal State
  const [exchangeOrder, setExchangeOrder] = useState<POSOrder | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [targetSku, setTargetSku] = useState("");
  const [discoveredProduct, setDiscoveredProduct] = useState<Product | null>(null);
  const [skuSearching, setSkuSearching] = useState(false);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [replacementVariations, setReplacementVariations] = useState<SelectableVariation[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);

// Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [dlDateFrom, setDlDateFrom] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [dlDateTo, setDlDateTo] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [dlPayment, setDlPayment] = useState<string>("");
  const [dlSingleDate, setDlSingleDate] = useState(false);
  const [dlFormat, setDlFormat] = useState<"html" | "csv">("html");

  // Remove Items Modal State
  const [removeOrder, setRemoveOrder] = useState<POSOrder | null>(null);
  const [selectedRemoveIndices, setSelectedRemoveIndices] = useState<Set<number>>(new Set());
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  // Main Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA")
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("priority", { ascending: true });
      if (catData) setCategories(catData);

      const { data: prodData } = await supabase
        .from("products")
        .select("id, name, category_id, sku");
      if (prodData) setProducts(prodData);

      const { data: orderData, error: orderError } = await supabase
        .from("pos_orders")
        .select("*")
        .order("order_date", { ascending: false });

      if (orderError) throw orderError;
      if (orderData) setOrders(orderData);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const productLookupMap = useMemo(() => {
    const map = new Map<number, { name: string; categoryId: number | null; sku: string }>();
    products.forEach((p) => {
      map.set(p.id, { name: p.name, categoryId: p.category_id, sku: p.sku || "" });
    });
    return map;
  }, [products]);

  // SKU debounce search
  useEffect(() => {
    if (!targetSku.trim()) { setDiscoveredProduct(null); return; }
    const t = setTimeout(async () => {
      setSkuSearching(true);
      try {
        const { data } = await supabase
          .from("products")
          .select("id, name, category_id, sku")
          .eq("sku", targetSku.trim())
          .maybeSingle();
        setDiscoveredProduct(data ?? null);
      } catch { setDiscoveredProduct(null); }
      finally { setSkuSearching(false); }
    }, 450);
    return () => clearTimeout(t);
  }, [targetSku]);

  // Load variations for replacement product
  useEffect(() => {
    setSelectedVariationId(null);
    setReplacementVariations([]);
    if (!discoveredProduct) return;
    const load = async () => {
      setVariationsLoading(true);
      try {
        const { data: variationRows, error } = await supabase
          .from("product_variations")
          .select("id, product_id, size_id, color_id, price, sale_price, stock, created_at")
          .eq("product_id", discoveredProduct.id);
        if (error) throw error;
        if (!variationRows?.length) return;

        const attrIds = Array.from(new Set(
          variationRows.flatMap((v) => [v.size_id, v.color_id]).filter((x): x is number => x != null)
        ));
        const attrMap = new Map<number, string>();
        if (attrIds.length) {
          const { data: attrRows } = await supabase.from("attributes").select("id, name").in("id", attrIds);
          attrRows?.forEach((a) => attrMap.set(a.id, a.name));
        }
        setReplacementVariations(variationRows.map((v) => ({
          id: v.id,
          product_id: v.product_id,
          size_id: v.size_id,
          color_id: v.color_id,
          sizeName: v.size_id != null ? attrMap.get(v.size_id) || "Unknown" : "—",
          colorName: v.color_id != null ? attrMap.get(v.color_id) || "Unknown" : "—",
          price: v.price,
          sale_price: v.sale_price,
          stock: v.stock ?? 0,
          created_at: v.created_at,
        })));
      } catch (err: any) {
        toast.error("Could not load variations");
      } finally {
        setVariationsLoading(false);
      }
    };
    load();
  }, [discoveredProduct]);
const openRemoveModal = (order: POSOrder) => {
  setRemoveOrder(order);
  setSelectedRemoveIndices(new Set());
};

const closeRemoveModal = () => {
  setRemoveOrder(null);
  setSelectedRemoveIndices(new Set());
};

const toggleRemoveIndex = (idx: number) => {
  setSelectedRemoveIndices((prev) => {
    const next = new Set(prev);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return next;
  });
};

const toggleSelectAllRemove = () => {
  if (!removeOrder?.order_items) return;
  setSelectedRemoveIndices((prev) =>
    prev.size === removeOrder.order_items!.length
      ? new Set()
      : new Set(removeOrder.order_items!.map((_, idx) => idx))
  );
};

const handleProcessRemoval = async () => {
  if (!removeOrder || selectedRemoveIndices.size === 0) {
    toast.error("Select at least one item to remove");
    return;
  }
  const items = removeOrder.order_items || [];
  const indicesToRemove = Array.from(selectedRemoveIndices);
  const itemsToRemove = indicesToRemove.map((idx) => items[idx]);

  // Guard: block if it would remove every item (order must keep at least 1 item;
  // if you want to allow emptying the order entirely, just remove this check)
  if (itemsToRemove.length === items.length) {
    toast.error("Cannot remove all items — cancel the order instead");
    return;
  }

  setRemoveSubmitting(true);
  const restockedVariationIds: number[] = [];
  try {
    // Aggregate qty per variation in case the same variation appears twice
    const restockMap = new Map<number, number>();
    itemsToRemove.forEach((item) => {
      const vId = item.variation?.id;
      if (vId != null) {
        restockMap.set(vId, (restockMap.get(vId) || 0) + item.qty);
      }
    });

    // Restock sequentially so we always add to the latest known stock
    for (const [variationId, qty] of restockMap.entries()) {
      const { data: varRow, error: fetchErr } = await supabase
        .from("product_variations")
        .select("id, stock")
        .eq("id", variationId)
        .single();
      if (fetchErr || !varRow) {
        throw new Error(`Could not find variation #${variationId} to restock`);
      }
      const { error: updateErr } = await supabase
        .from("product_variations")
        .update({ stock: varRow.stock + qty })
        .eq("id", variationId);
      if (updateErr) throw new Error(`Restock failed for variation #${variationId}`);
      restockedVariationIds.push(variationId);
    }

    // Compute value removed (use current price if present, else variation price/sale_price)
    const removedValue = itemsToRemove.reduce((sum, item) => {
      const unitPrice = item.price ?? item.variation?.sale_price ?? item.variation?.price ?? 0;
      return sum + unitPrice * item.qty;
    }, 0);

    const remainingItems = items.filter((_, idx) => !selectedRemoveIndices.has(idx));
    const currentGrandTotal = Number(removeOrder.grand_total) || 0;
    const newGrandTotal = Math.max(0, currentGrandTotal - removedValue);

    const { data, error: orderErr } = await supabase
      .from("pos_orders")
      .update({ order_items: remainingItems, grand_total: newGrandTotal })
      .eq("id", Number(removeOrder.id))
      .select();

    if (orderErr || !data?.length) {
      throw new Error(orderErr?.message || "Order update failed — check RLS");
    }

    toast.success(`Removed ${itemsToRemove.length} item(s) — stock restored, total updated`);
    closeRemoveModal();
    await fetchData();
  } catch (err: any) {
    // Best-effort rollback note: stock updates that already succeeded are NOT auto-reverted here.
    // If you want strict atomicity, consider a Postgres RPC/transaction instead of sequential calls.
    toast.error(err.message || "Removal failed");
  } finally {
    setRemoveSubmitting(false);
  }
};
  const closeExchangeModal = () => {
    setExchangeOrder(null);
    setSelectedItemIndex(null);
    setTargetSku("");
    setDiscoveredProduct(null);
    setReplacementVariations([]);
    setSelectedVariationId(null);
  };

  const handleProcessExchange = async () => {
    if (!exchangeOrder || selectedItemIndex === null || !discoveredProduct || !selectedVariationId) {
      toast.error("Please complete all fields");
      return;
    }
    const oldItem = exchangeOrder.order_items?.[selectedItemIndex];
    const newVariation = replacementVariations.find((v) => v.id === selectedVariationId);
    if (!oldItem || !newVariation) { toast.error("Could not resolve items"); return; }
    const oldVariationId = oldItem.variation?.id;
    const exchangeQty = oldItem.qty;
    if (oldVariationId == null) { toast.error("No variation recorded — cannot restock"); return; }
    if (newVariation.stock < exchangeQty) {
      toast.error(`Only ${newVariation.stock} in stock — need ${exchangeQty}`); return;
    }
    setExchangeSubmitting(true);
    try {
      const { data: oldVarRow, error: e1 } = await supabase
        .from("product_variations").select("id, stock").eq("id", oldVariationId).single();
      if (e1 || !oldVarRow) throw new Error("Could not find original variation");

      const { data: rr, error: e2 } = await supabase
        .from("product_variations")
        .update({ stock: oldVarRow.stock + exchangeQty }).eq("id", oldVariationId).select("id, stock");
      if (e2 || !rr?.length) throw new Error("Restock failed — check RLS");

      const { data: dr, error: e3 } = await supabase
        .from("product_variations")
        .update({ stock: newVariation.stock - exchangeQty }).eq("id", newVariation.id).select("id, stock");
      if (e3 || !dr?.length) {
        await supabase.from("product_variations").update({ stock: oldVarRow.stock }).eq("id", oldVariationId);
        throw new Error("Stock deduction failed — check RLS");
      }

      const alteredItems = [...(exchangeOrder.order_items || [])];
      alteredItems[selectedItemIndex] = {
        id: Number(discoveredProduct.id),
        cid: `${discoveredProduct.id}-${newVariation.id}`,
        qty: exchangeQty,
        name: discoveredProduct.name,
        price: newVariation.sale_price ?? newVariation.price,
        originalPrice: newVariation.price,
        variation: {
          id: newVariation.id,
          size: { name: newVariation.sizeName },
          color: { name: newVariation.colorName },
          price: newVariation.price,
          stock: dr[0].stock,
          size_id: newVariation.size_id,
          color_id: newVariation.color_id,
          created_at: newVariation.created_at,
          product_id: newVariation.product_id,
          sale_price: newVariation.sale_price,
        },
      };

      const { data, error: e4 } = await supabase
        .from("pos_orders").update({ order_items: alteredItems }).eq("id", Number(exchangeOrder.id)).select();
      if (e4 || !data?.length) {
        await supabase.from("product_variations").update({ stock: oldVarRow.stock }).eq("id", oldVariationId);
        await supabase.from("product_variations").update({ stock: newVariation.stock }).eq("id", newVariation.id);
        throw new Error(e4?.message || "Order update failed — check RLS");
      }

      toast.success("Exchange complete — stock updated");
      closeExchangeModal();
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Exchange failed");
    } finally {
      setExchangeSubmitting(false);
    }
  };

  // ── Filter + Stats ────────────────────────────────────────────────────────

  const { filteredOrders, stats } = useMemo(() => {
    const filtered = orders.filter((order) => {
      const q = searchTerm.toLowerCase().trim();
      const textMatch = !searchTerm || [
        order.full_name?.toLowerCase(),
        order.phone_number,
        order.id?.toString(),
        ...(Array.isArray(order.order_items)
          ? order.order_items.map((i) => productLookupMap.get(Number(i.id))?.name?.toLowerCase())
          : []),
      ].some((v) => v?.includes(q));

      const dateMatch = !selectedDate || (order.order_date || "").startsWith(selectedDate);
      const paymentMatch = !selectedPayment ||
        order.payment_method?.toLowerCase() === selectedPayment.toLowerCase();
      const catMatch = !selectedCategory || (Array.isArray(order.order_items) &&
        order.order_items.some((i) => productLookupMap.get(Number(i.id))?.categoryId === selectedCategory));

      return textMatch && dateMatch && paymentMatch && catMatch;
    });

    let totalRevenue = 0, cashTotal = 0, upiTotal = 0, cardTotal = 0;
    filtered.forEach((o) => {
      const gt = Number(o.grand_total) || 0;
      const settled = o.amount_paid != null && o.amount_paid !== "" ? Number(o.amount_paid) : gt;
      totalRevenue += settled;
      const m = o.payment_method?.toLowerCase();
      if (m === "cash") cashTotal += settled;
      if (m === "upi") upiTotal += settled;
      if (m === "card") cardTotal += settled;
    });

    return {
      filteredOrders: filtered,
      stats: {
        totalRevenue,
        totalOrders: filtered.length,
        avgOrderValue: filtered.length > 0 ? totalRevenue / filtered.length : 0,
        cashTotal, upiTotal, cardTotal,
      },
    };
  }, [orders, searchTerm, selectedCategory, selectedPayment, selectedDate, productLookupMap]);

  // ── Download handler ─────────────────────────────────────────────────────

  const handleDownload = () => {
    const fromDate = dlDateFrom;
    const toDate = dlSingleDate ? dlDateFrom : dlDateTo;

    const exportOrders = orders.filter((o) => {
      const oDate = (o.order_date || "").slice(0, 10);
      const dateMatch = (!fromDate || oDate >= fromDate) && (!toDate || oDate <= toDate);
      const payMatch = !dlPayment || o.payment_method?.toLowerCase() === dlPayment.toLowerCase();
      return dateMatch && payMatch;
    });

    const baseName = `POS_Report_${dlSingleDate ? fromDate : `${fromDate}_to_${toDate}`}${dlPayment ? `_${dlPayment}` : ""}`;

    if (dlFormat === "csv") {
      const csv = generateCSV(exportOrders, productLookupMap);
      downloadCSV(csv, `${baseName}.csv`);
      toast.success(`CSV downloaded — ${exportOrders.length} orders`);
    } else {
      let totalRevenue = 0, cashTotal = 0, upiTotal = 0, cardTotal = 0;
      exportOrders.forEach((o) => {
        const gt = Number(o.grand_total) || 0;
        const settled = o.amount_paid != null && o.amount_paid !== "" ? Number(o.amount_paid) : gt;
        totalRevenue += settled;
        const m = o.payment_method?.toLowerCase();
        if (m === "cash") cashTotal += settled;
        if (m === "upi") upiTotal += settled;
        if (m === "card") cardTotal += settled;
      });
      const exportStats = {
        totalRevenue,
        totalOrders: exportOrders.length,
        avgOrderValue: exportOrders.length > 0 ? totalRevenue / exportOrders.length : 0,
        cashTotal, upiTotal, cardTotal,
      };
      const html = generateReportHTML(
        exportOrders,
        productLookupMap,
        { dateFrom: fromDate, dateTo: toDate, payment: dlPayment },
        exportStats
      );
      downloadReport(html, `${baseName}.html`);
      toast.success(`HTML report downloaded — ${exportOrders.length} orders`);
    }

    setShowDownloadModal(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading && orders.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-black" />
        <div className="text-black font-black tracking-tighter text-xl uppercase">Compiling Archives...</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-8 selection:bg-brand-gold selection:text-white relative">
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Terminal Registry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-brand-blue uppercase leading-none">
            POS Transaction <span className="text-brand-gold">Ledger</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Download Report Button */}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-brand-gold text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-amber-600 transition-all shadow-sm"
          >
            <Download size={14} />
            Download Report
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-brand-blue hover:text-white transition-all text-brand-blue disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── METRICS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Filtered Gross Volume</span>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><DollarSign size={16} /></div>
          </div>
          <h3 className="text-3xl font-black tracking-tighter text-brand-blue">₹{stats.totalRevenue.toFixed(2)}</h3>
          <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Settled value for current view</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Ticket Count</span>
            <div className="p-3 bg-brand-blue/5 rounded-xl text-brand-blue"><ShoppingBag size={16} /></div>
          </div>
          <h3 className="text-3xl font-black tracking-tighter text-brand-blue">{stats.totalOrders} Orders</h3>
          <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Total matching parameters</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Average Cart Value</span>
            <div className="p-3 bg-amber-50 rounded-xl text-brand-gold"><TrendingUp size={16} /></div>
          </div>
          <h3 className="text-3xl font-black tracking-tighter text-brand-blue">₹{stats.avgOrderValue.toFixed(2)}</h3>
          <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Mean value per sequence</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Distribution Breakdown</span>
            <CreditCard size={14} className="text-slate-300" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500">
              <span>UPI:</span><span className="font-black text-brand-blue">₹{stats.upiTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500">
              <span>CASH:</span><span className="font-black text-brand-blue">₹{stats.cashTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500">
              <span>CARD:</span><span className="font-black text-brand-blue">₹{stats.cardTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTERS ── */}
      <section className="bg-white border border-slate-100 rounded-[2rem] p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
          <Filter className="w-3.5 h-3.5 text-brand-gold" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">Granular Sorting Core Matrix</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              type="text"
              placeholder="SEARCH CLIENT, RECEIPT OR PRODUCT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/20 text-[10px] font-bold text-brand-blue uppercase tracking-wider placeholder:text-slate-300 outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-brand-blue cursor-pointer outline-none focus:ring-2 focus:ring-brand-gold/20 appearance-none"
            >
              <option value="">All Payment Protocols</option>
              <option value="Cash">Cash Protocol</option>
              <option value="Card">Card Gateway</option>
              <option value="UPI">UPI Instant Networks</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-[10px] font-black text-brand-blue outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">Category Scope Matrix</span>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                selectedCategory === ""
                  ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                  : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100"
              }`}
            >All Categories</button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                  selectedCategory === cat.id
                    ? "bg-brand-gold text-white border-brand-gold shadow-sm"
                    : "bg-slate-50 text-brand-blue border-transparent hover:bg-slate-100"
                }`}
              >{cat.name}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TABLE ── */}
      <section className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="py-5 px-8">Transaction ID</th>
                <th className="py-5 px-6">Timestamp</th>
                <th className="py-5 px-6">Client</th>
                <th className="py-5 px-6">Payment</th>
                <th className="py-5 px-6 text-right">Items</th>
                <th className="py-5 px-8 text-right">Grand Total</th>
                <th className="py-5 px-6 text-right">Negotiated</th>
                <th className="py-5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-300">
                      <Layers className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">No transactions found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const grandTotalNum = Number(order.grand_total) || 0;
                  const hasAmountPaid = order.amount_paid != null && order.amount_paid !== "";
                  const amountPaidNum = hasAmountPaid ? Number(order.amount_paid) : grandTotalNum;
                  const wasNegotiated = hasAmountPaid && amountsDiffer(amountPaidNum, grandTotalNum);
                  const delta = grandTotalNum - amountPaidNum;

                  return (
                    <tr key={order.id} className="group hover:bg-slate-50/40 transition-colors">
                      <td className="py-5 px-8">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          #{order.id?.toString().slice(-6) || "000000"}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-[10px] font-medium text-slate-500">
                        {order.order_date
                          ? new Date(order.order_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", hour12: true })
                          : "N/A"}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-wide text-brand-blue">
                            {order.full_name || "Walk-In"}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400">{order.phone_number || "—"}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                          order.payment_method?.toLowerCase() === "upi" ? "bg-indigo-50 text-indigo-500" :
                          order.payment_method?.toLowerCase() === "card" ? "bg-amber-50 text-brand-gold" :
                          "bg-emerald-50 text-emerald-500"
                        }`}>
                          {order.payment_method || "N/A"}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {Array.isArray(order.order_items) && order.order_items.length > 0 ? (
                            order.order_items.map((item, idx) => {
                              const info = productLookupMap.get(Number(item.id));
                              return (
                                <div key={idx} className="flex items-center gap-1.5 justify-end">
                                  <span className="text-[10px] font-black uppercase tracking-wide text-brand-blue">
                                    {item.name || info?.name || `Product #${item.id}`}
                                    {item.variation?.size?.name ? ` (${item.variation.size.name})` : ""}
                                  </span>
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                                    ×{item.qty}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">0 items</span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right font-black text-[11px] text-brand-blue tracking-tighter">
                        ₹{grandTotalNum.toFixed(2)}
                      </td>
                      <td className="py-5 px-6 text-right">
                        {wasNegotiated ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 tracking-tighter">
                              <HandCoins size={11} />₹{amountPaidNum.toFixed(2)}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              {delta > 0 ? `−₹${delta.toFixed(2)} off` : `+₹${Math.abs(delta).toFixed(2)}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300">—</span>
                        )}
                      </td>
                     <td className="py-5 px-4 text-center">
  <div className="flex items-center justify-center gap-1.5">
    <button
      onClick={() => setExchangeOrder(order)}
      className="px-3 py-1.5 bg-slate-50 hover:bg-brand-blue hover:text-white rounded-xl border border-slate-150 flex items-center gap-1.5 text-[9px] font-black text-brand-blue uppercase transition-all"
    >
      <ArrowLeftRight size={12} />
      Exchange
    </button>
    <button
      onClick={() => openRemoveModal(order)}
      disabled={!order.order_items || order.order_items.length === 0}
      className="px-3 py-1.5 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl border border-slate-150 flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Trash2 size={12} />
      Remove
    </button>
  </div>
</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── DOWNLOAD MODAL ── */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                  Export Engine
                </span>
                <h3 className="text-sm font-black text-brand-blue uppercase flex items-center gap-2">
                  <FileText size={14} className="text-brand-gold" />
                  Download POS Report
                </h3>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Date Mode Toggle */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                  1. Date Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDlSingleDate(true)}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                      dlSingleDate
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    Single Date
                  </button>
                  <button
                    onClick={() => setDlSingleDate(false)}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                      !dlSingleDate
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    Date Range
                  </button>
                </div>
              </div>

              {/* Date Inputs */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                  2. {dlSingleDate ? "Select Date" : "Select Date Range"}
                </label>

                {dlSingleDate ? (
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={dlDateFrom}
                      onChange={(e) => setDlDateFrom(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-brand-blue outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">From</span>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <input
                          type="date"
                          value={dlDateFrom}
                          onChange={(e) => setDlDateFrom(e.target.value)}
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-brand-blue outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">To</span>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <input
                          type="date"
                          value={dlDateTo}
                          onChange={(e) => setDlDateTo(e.target.value)}
                          min={dlDateFrom}
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-brand-blue outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Filter */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                  3. Payment Method Filter
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "", label: "All Methods", icon: <Layers size={13} /> },
                    { value: "Cash", label: "Cash", icon: <Banknote size={13} /> },
                    { value: "UPI", label: "UPI", icon: <Wallet size={13} /> },
                    { value: "Card", label: "Card", icon: <CreditCard size={13} /> },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDlPayment(opt.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                        dlPayment === opt.value
                          ? "bg-brand-gold text-white border-brand-gold"
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Format Selection */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                  4. Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDlFormat("html")}
                    className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                      dlFormat === "html"
                        ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <FileText size={13} />
                    HTML Report
                  </button>
                  <button
                    onClick={() => setDlFormat("csv")}
                    className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                      dlFormat === "csv"
                        ? "bg-brand-gold text-white border-brand-gold shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <Download size={13} />
                    CSV Sheet
                  </button>
                </div>
              </div>

              {/* CSV Options (show when CSV is selected) */}
              {dlFormat === "csv" && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">💡 CSV Format</span>
                  </div>
                  <ul className="space-y-1.5 text-[9px] text-slate-600 font-bold">
                    <li>✓ Comma-separated values (UTF-8 with BOM)</li>
                    <li>✓ Includes all order details & items</li>
                    <li>✓ Compatible with Excel, Sheets & databases</li>
                    <li>✓ Size/Color variants expanded</li>
                    <li>✓ Negotiated discounts tracked</li>
                  </ul>
                </div>
              )}

              {/* HTML Options (show when HTML is selected) */}
              {dlFormat === "html" && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">📊 HTML Report</span>
                  </div>
                  <ul className="space-y-1.5 text-[9px] text-slate-600 font-bold">
                    <li>✓ Print-ready formatted report</li>
                    <li>✓ Summary statistics & breakdowns</li>
                    <li>✓ Payment method distribution</li>
                    <li>✓ Professional styling (landscape A4)</li>
                    <li>✓ Negotiated amounts highlighted</li>
                  </ul>
                </div>
              )}

              {/* Preview count */}
              <div className="bg-brand-blue/5 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Orders in this export</span>
                <span className="text-sm font-black text-brand-blue">
                  {orders.filter((o) => {
                    const oDate = (o.order_date || "").slice(0, 10);
                    const from = dlDateFrom;
                    const to = dlSingleDate ? dlDateFrom : dlDateTo;
                    const dateMatch = (!from || oDate >= from) && (!to || oDate <= to);
                    const payMatch = !dlPayment || o.payment_method?.toLowerCase() === dlPayment.toLowerCase();
                    return dateMatch && payMatch;
                  }).length} records
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 text-[10px] font-black text-white uppercase tracking-wider rounded-xl bg-brand-gold hover:bg-amber-600 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download size={12} />
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}

{/* ── REMOVE ITEMS MODAL ── */}
{removeOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-lg rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
            Inventory Reversal Core
          </span>
          <h3 className="text-sm font-black text-brand-blue uppercase">Remove Order Items</h3>
        </div>
        <button onClick={closeRemoveModal} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-4 flex-1">
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[9px] font-bold text-amber-700 leading-relaxed">
            Selected items will be removed from this order, their stock will be restored,
            and the order's grand total will be reduced accordingly.
          </span>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Select Items To Remove
          </label>
          <button
            onClick={toggleSelectAllRemove}
            className="text-[8px] font-black uppercase tracking-wider text-brand-blue hover:underline"
          >
            {selectedRemoveIndices.size === (removeOrder.order_items?.length || 0) ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="space-y-2">
          {removeOrder.order_items?.map((item, idx) => {
            const info = productLookupMap.get(Number(item.id));
            const checked = selectedRemoveIndices.has(idx);
            const unitPrice = item.price ?? item.variation?.sale_price ?? item.variation?.price ?? 0;
            return (
              <div
                key={idx}
                onClick={() => toggleRemoveIndex(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  checked ? "bg-rose-50 border-rose-300" : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    checked ? "bg-rose-500 border-rose-500" : "border-slate-300"
                  }`}>
                    {checked && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-brand-blue uppercase">
                      {item.name || info?.name || `Product ID: ${item.id}`}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.variation?.size?.name && item.variation.size.name !== "Default"
                        ? `${item.variation.size.name}${item.variation.color?.name && item.variation.color.name !== "Default" ? ` / ${item.variation.color.name}` : ""} · `
                        : ""}
                      ₹{unitPrice.toFixed(2)} × {item.qty}
                      {item.variation?.id == null && (
                        <span className="text-amber-500 font-bold"> · no variation, won't restock</span>
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  ₹{(unitPrice * item.qty).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {selectedRemoveIndices.size > 0 && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">
              Total To Deduct
            </span>
            <span className="text-sm font-black text-rose-600">
              −₹{Array.from(selectedRemoveIndices)
                .reduce((sum, idx) => {
                  const item = removeOrder.order_items![idx];
                  const unitPrice = item.price ?? item.variation?.sale_price ?? item.variation?.price ?? 0;
                  return sum + unitPrice * item.qty;
                }, 0)
                .toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
        <button onClick={closeRemoveModal} className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors">
          Cancel
        </button>
        <button
          disabled={selectedRemoveIndices.size === 0 || removeSubmitting}
          onClick={handleProcessRemoval}
          className="px-5 py-2.5 text-[10px] font-black text-white uppercase tracking-wider rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
        >
          {removeSubmitting && <RefreshCw size={12} className="animate-spin" />}
          <Trash2 size={12} />
          Remove {selectedRemoveIndices.size > 0 ? `${selectedRemoveIndices.size} Item(s)` : ""}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── EXCHANGE MODAL ── */}
      {exchangeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Reverse Logistics Core</span>
                <h3 className="text-sm font-black text-brand-blue uppercase">Process Item Replacement</h3>
              </div>
              <button onClick={closeExchangeModal} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  1. Select Target Return Item
                </label>
                <div className="space-y-2">
                  {exchangeOrder.order_items?.map((item, idx) => {
                    const info = productLookupMap.get(Number(item.id));
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedItemIndex(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                          selectedItemIndex === idx
                            ? "bg-brand-blue/5 border-brand-blue"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-brand-blue uppercase">{item.name || info?.name || `Product ID: ${item.id}`}</span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {item.variation?.size?.name && item.variation.size.name !== "Default"
                              ? `${item.variation.size.name}${item.variation.color?.name && item.variation.color.name !== "Default" ? ` / ${item.variation.color.name}` : ""} · `
                              : ""}
                            Variation ID: {item.variation?.id ?? "N/A"}
                          </span>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">×{item.qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItemIndex !== null && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      2. Input Replacement SKU
                    </label>
                    <input
                      type="text"
                      placeholder="ENTER REPLACEMENT SKU..."
                      value={targetSku}
                      onChange={(e) => setTargetSku(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-brand-gold rounded-xl text-[10px] font-bold text-brand-blue uppercase tracking-wider outline-none transition-all"
                    />
                  </div>

                  {targetSku.trim() && (
                    <div className="p-4 rounded-xl border transition-all min-h-[58px] flex items-center bg-slate-50/50">
                      {skuSearching ? (
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                          <RefreshCw size={12} className="animate-spin" /> Scanning...
                        </div>
                      ) : discoveredProduct ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={10} /> SKU Match Found
                            </span>
                            <span className="text-xs font-black text-brand-blue uppercase mt-0.5">{discoveredProduct.name}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-1 rounded-md">
                            ID: {discoveredProduct.id}
                          </span>
                        </div>
                      ) : (
                        <div className="text-red-500 font-black text-[10px] uppercase tracking-wide">⚠️ No product found for this SKU</div>
                      )}
                    </div>
                  )}

                  {discoveredProduct && (
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        3. Select Size / Color Variant
                      </label>
                      {variationsLoading ? (
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase p-3">
                          <RefreshCw size={12} className="animate-spin" /> Loading variants...
                        </div>
                      ) : replacementVariations.length === 0 ? (
                        <div className="text-red-500 font-black text-[10px] uppercase tracking-wide p-3 bg-red-50 rounded-xl">⚠️ No variations exist for this product</div>
                      ) : (
                        <div className="space-y-2">
                          {replacementVariations.map((v) => {
                            const insufficient = v.stock < (exchangeOrder.order_items?.[selectedItemIndex]?.qty || 1);
                            return (
                              <div
                                key={v.id}
                                onClick={() => !insufficient && setSelectedVariationId(v.id)}
                                className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                                  insufficient
                                    ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                                    : selectedVariationId === v.id
                                      ? "bg-brand-gold/10 border-brand-gold cursor-pointer"
                                      : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer"
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-brand-blue uppercase">
                                    {v.sizeName}{v.colorName !== "—" && v.colorName !== "Default" ? ` / ${v.colorName}` : ""}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">₹{(v.sale_price ?? v.price).toFixed(2)} · ID: {v.id}</span>
                                </div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md font-mono ${insufficient ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600"}`}>
                                  Stock: {v.stock}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={closeExchangeModal} className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                disabled={selectedItemIndex === null || !discoveredProduct || !selectedVariationId || exchangeSubmitting}
                onClick={handleProcessExchange}
                className="px-5 py-2.5 text-[10px] font-black text-white uppercase tracking-wider rounded-xl bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
              >
                {exchangeSubmitting && <RefreshCw size={12} className="animate-spin" />}
                Commit Replacement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}