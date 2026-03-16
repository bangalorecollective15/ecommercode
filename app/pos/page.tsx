"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Search, ShoppingCart, User, CreditCard, Plus, Minus, X, Check, RefreshCw 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [customerType, setCustomerType] = useState(""); 
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedVariations, setSelectedVariations] = useState<{ [key: number]: number }>({});
  
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [editingField, setEditingField] = useState<"tax" | "discount" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");

  // Search state for existing customers
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Data Fetching
  const fetchData = async () => {
    setLoading(true);
    const [catRes, prodRes, custRes] = await Promise.all([
      supabase.from("categories").select("*").order("priority", { ascending: true }),
      supabase.from("products").select(`*, product_variations (*)`),
      supabase.from("customers").select("*").order("name", { ascending: true })
    ]);
    
    if (catRes.data) setCategories(catRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (custRes.data) setCustomers(custRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter customers based on search (name or phone)
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const lowerSearch = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.phone?.includes(customerSearch) || 
      c.name?.toLowerCase().includes(lowerSearch)
    );
  }, [customerSearch, customers]);

  const addToCart = (product: any) => {
    const variationId = selectedVariations[product.id];
    const variation =
      product.product_variations?.find((v: any) => v.id === variationId) ||
      (product.product_variations?.length === 1 ? product.product_variations[0] : null);

    if (product.product_variations?.length > 1 && !variation) {
      return toast.error("Please select a size/variation first");
    }

    const cid = variation ? `${product.id}-${variation.id}` : product.id;
    const existing = cart.find((item) => item.cid === cid);
    const availableStock = variation ? variation.stock : product.stock;
    const currentQty = existing ? existing.qty : 0;

    if (currentQty + 1 > availableStock) {
      return toast.error("Insufficient stock!");
    }

    if (existing) {
      setCart(cart.map((item) => item.cid === cid ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        cid, id: product.id, name: product.name, variation,
        price: variation ? variation.price : product.price, qty: 1,
      }]);
    }
    toast.success(`${product.name} added`);
  };

  const updateQty = (cid: string, change: number) => {
    const item = cart.find((i) => i.cid === cid);
    if (!item) return;
    const availableStock = item.variation ? item.variation.stock : products.find((p) => p.id === item.id)?.stock || 0;
    const newQty = item.qty + change;

    if (newQty > availableStock) return toast.error("Stock limit reached");
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.cid !== cid));
    } else {
      setCart(cart.map((i) => (i.cid === cid ? { ...i, qty: newQty } : i)));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = subtotal + taxAmount - discountAmount;

  const placeOrder = async () => {
    if (!cart.length || !customerType || !paymentMethod) {
      return toast.error("Please complete cart, customer, and payment details.");
    }

    let customerId = selectedCustomerId;
    let customerName = "";
    let customerPhone = "";

    if (customerType === "new") {
        if (!newCustomer.name || !newCustomer.phone) return toast.error("Name and Phone are required");
        const { data, error } = await supabase.from("customers").insert([newCustomer]).select();
        if (error) return toast.error("Failed to create customer");
        customerId = data[0].id;
        customerName = data[0].name;
        customerPhone = data[0].phone;
    } else {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer) return toast.error("Please select a valid customer");
        customerId = customer.id;
        customerName = customer.name;
        customerPhone = customer.phone;
    }

    const { data, error } = await supabase.from("pos_orders").insert([{
      customer_id: customerId, full_name: customerName, phone_number: customerPhone,
      payment_method: paymentMethod.toLowerCase(), subtotal, tax_amount: taxAmount,
      discount_amount: discountAmount, grand_total: grandTotal, order_items: JSON.stringify(cart),
    }]).select();

    if (error) return toast.error("Order failed");

    toast.success("Order Placed Successfully!");
    
    // Reset States
    setCart([]);
    setCustomerType("");
    setSelectedCustomerId("");
    setCustomerSearch("");
    setPaymentMethod("");
    setTaxAmount(0);
    setDiscountAmount(0);
    fetchData(); // Refresh stock and customers
  };

  const filteredProducts = products
    .filter((p) => searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
    .filter((p) => selectedCategory ? p.category_id === selectedCategory : true);

  if (loading && products.length === 0) return <div className="h-screen flex items-center justify-center text-orange-600 font-bold">Initializing POS System...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />

      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
        <header className="bg-white p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">STORE<span className="text-orange-600">POS</span></h1>
            
            <div className="flex flex-1 max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-black"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value) || "")}
                className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500 text-black"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const variations = p.product_variations || [];
              const singleVar = variations.length === 1 ? variations[0] : null;

              return (
                <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase rounded tracking-wider">
                         {categories.find(c => c.id === p.category_id)?.name || 'General'}
                       </span>
                    </div>
                    <h3 className="font-bold text-gray-800 line-clamp-2">{p.name}</h3>
                    
                    {singleVar ? (
                      <div className="mt-2 text-black">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{singleVar.unit_value} {singleVar.unit_type}</span>
                          <span className={`text-[10px] font-bold ${singleVar.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {singleVar.stock} IN STOCK
                          </span>
                        </div>
                        <p className="text-lg font-black text-gray-900 mt-1">₹{singleVar.price}</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <select
                          value={selectedVariations[p.id] || ""}
                          onChange={(e) => setSelectedVariations({...selectedVariations, [p.id]: Number(e.target.value)})}
                          className="w-full text-xs border border-gray-200 rounded p-1.5 mb-2 outline-none focus:border-orange-500 text-black"
                        >
                          <option value="">Select Variation</option>
                          {variations.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.unit_value} {v.unit_type} - ₹{v.price}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={singleVar ? singleVar.stock === 0 : false}
                    className="w-full mt-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* RIGHT: Checkout Sidebar */}
      <div className="w-full md:w-[400px] bg-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" /> Current Order
          </h2>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                <ShoppingCart className="w-16 h-16 mb-2" />
                <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cid} className="flex gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-gray-500">₹{item.price} {item.variation && `• ${item.variation.unit_value}${item.variation.unit_type}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                    <button onClick={() => updateQty(item.cid, -1)} className="p-1 hover:text-orange-600 text-black"><Minus className="w-3 h-3"/></button>
                    <span className="w-6 text-center text-xs font-bold text-black">{item.qty}</span>
                    <button onClick={() => updateQty(item.cid, 1)} className="p-1 hover:text-orange-600 text-black"><Plus className="w-3 h-3"/></button>
                  </div>
                  <p className="text-sm font-bold w-16 text-right text-black">₹{item.price * item.qty}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Payment Section */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-gray-700">
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-orange-600" /> Customer</div>
                <button onClick={fetchData} className="text-gray-400 hover:text-orange-600 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
            </div>
            
            <select
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                setCustomerSearch("");
                setSelectedCustomerId("");
              }}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-500 text-black"
            >
              <option value="">Select Customer Mode</option>
              <option value="existing">Search Existing</option>
              <option value="new">Add New</option>
            </select>

            {customerType === "existing" && (
              <div className="relative mt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Name or Phone..."
                    value={customerSearch}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 pl-8 outline-none focus:ring-2 focus:ring-orange-500 text-black"
                  />
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  {customerSearch && (
                    <button 
                      onClick={() => { setCustomerSearch(""); setSelectedCustomerId(""); }}
                      className="absolute right-2 top-2.5"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>

                {isCustomerDropdownOpen && (
                  <div className="absolute bottom-full mb-1 z-[60] w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearch(`${c.name} (${c.phone})`);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className={`p-3 text-sm cursor-pointer hover:bg-orange-50 flex justify-between items-center border-b border-gray-50 last:border-0 ${selectedCustomerId === c.id ? 'bg-orange-50 text-orange-600 font-bold' : 'text-black'}`}
                        >
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-[10px] text-gray-500">{c.phone}</p>
                          </div>
                          {selectedCustomerId === c.id && <Check className="w-4 h-4" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500  text-center">No customers found</div>
                    )}
                  </div>
                )}
                {/* Click outside closer overlay */}
                {isCustomerDropdownOpen && (
                  <div className="fixed inset-0 z-50" onClick={() => setIsCustomerDropdownOpen(false)} />
                )}
              </div>
            )}

            {customerType === "new" && (
                <div className="grid gap-2">
                    <input 
                        placeholder="Customer Name" 
                        value={newCustomer.name}
                        className="text-sm p-2 border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-orange-500 outline-none"
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                    <input 
                        placeholder="Phone Number" 
                        value={newCustomer.phone}
                        className="text-sm p-2 border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-orange-500 outline-none"
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <CreditCard className="w-4 h-4 text-orange-600" /> Payment
            </div>
            <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Card', 'UPI'].map((method) => (
                    <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${paymentMethod === method ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}
                    >
                        {method}
                    </button>
                ))}
            </div>
          </div>

          {/* Totals Section with NaN Protection */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₹{(subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 items-center">
              <button onClick={() => setEditingField('tax')} className="hover:text-orange-600 underline decoration-dotted">Tax (+)</button>
              <span>₹{(taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 items-center">
              <button onClick={() => setEditingField('discount')} className="hover:text-orange-600 underline decoration-dotted">Discount (-)</button>
              <span>₹{(discountAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-gray-900 pt-2">
              <span>Total</span>
              <span className="text-orange-600">₹{(grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={cart.length === 0}
            className="w-full py-4 bg-orange-600 text-white rounded-xl font-black text-lg hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none"
          >
            PROCESS ORDER
          </button>
        </div>
      </div>

      {/* MODAL */}
      {editingField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4 text-black">
                <h3 className="font-bold uppercase tracking-wide">Edit {editingField}</h3>
                <button onClick={() => setEditingField(null)}><X className="w-5 h-5 text-gray-400 hover:text-black"/></button>
            </div>
            <input
              type="number"
              autoFocus
              value={editingField === "tax" ? (taxAmount || 0) : (discountAmount || 0)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                editingField === "tax" ? setTaxAmount(val) : setDiscountAmount(val);
              }}
              className="w-full border-2 border-orange-100 rounded-xl p-3 text-2xl font-bold text-center focus:border-orange-500 outline-none text-black"
            />
            <button
              onClick={() => setEditingField(null)}
              className="w-full mt-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}