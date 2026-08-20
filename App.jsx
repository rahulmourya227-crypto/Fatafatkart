import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, MapPin, Clock, ShoppingCart, Plus, Minus, X, ChevronLeft,
  Zap, CheckCircle2, Home as HomeIcon, CreditCard, Wallet, Banknote,
  ArrowRight, Trash2, Star, Loader2, AlertCircle
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Design tokens
// bg canvas   : #FAFAF6 (soft rice-white)
// ink         : #1B1A17
// brand green : #4C7A2A (chutney)
// brand green-dk: #35581C
// accent      : #E8A93B (turmeric)
// price/deal  : #B23A2F (beetroot red)
// muted       : #8A8578
// card border : #ECE8DD
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: "fruitveg", label: "Fruits & Veg", emoji: "🥦" },
  { id: "dairy", label: "Dairy & Eggs", emoji: "🥛" },
  { id: "snacks", label: "Snacks", emoji: "🍪" },
  { id: "beverages", label: "Beverages", emoji: "🥤" },
  { id: "staples", label: "Staples", emoji: "🌾" },
  { id: "personal", label: "Personal Care", emoji: "🧴" },
  { id: "household", label: "Household", emoji: "🧹" },
  { id: "baby", label: "Baby Care", emoji: "🍼" },
  { id: "medicine", label: "Medicine", emoji: "💊" },
];

// Used as instant first paint + offline fallback if Supabase isn't reachable.
// The live product list is fetched from the `products` table on mount.
const SEED_PRODUCTS = [
  { id: 1, cat: "fruitveg", name: "Alphonso Mango", qty: "1 kg", price: 249, mrp: 320, emoji: "🥭", rating: 4.6 },
  { id: 2, cat: "fruitveg", name: "Banana Robusta", qty: "6 pcs", price: 42, mrp: 48, emoji: "🍌", rating: 4.4 },
  { id: 3, cat: "fruitveg", name: "Tomato Local", qty: "500 g", price: 22, mrp: 28, emoji: "🍅", rating: 4.2 },
  { id: 4, cat: "fruitveg", name: "Spinach Palak", qty: "250 g", price: 18, mrp: 20, emoji: "🥬", rating: 4.3 },
  { id: 5, cat: "fruitveg", name: "Onion", qty: "1 kg", price: 34, mrp: 40, emoji: "🧅", rating: 4.5 },
  { id: 6, cat: "fruitveg", name: "Potato", qty: "1 kg", price: 28, mrp: 32, emoji: "🥔", rating: 4.5 },
  { id: 7, cat: "dairy", name: "Amul Toned Milk", qty: "500 ml", price: 27, mrp: 27, emoji: "🥛", rating: 4.7 },
  { id: 8, cat: "dairy", name: "Farm Eggs", qty: "6 pcs", price: 45, mrp: 52, emoji: "🥚", rating: 4.6 },
  { id: 9, cat: "dairy", name: "Amul Butter", qty: "100 g", price: 58, mrp: 62, emoji: "🧈", rating: 4.8 },
  { id: 10, cat: "dairy", name: "Paneer Fresh", qty: "200 g", price: 89, mrp: 99, emoji: "🧀", rating: 4.5 },
  { id: 11, cat: "snacks", name: "Lay's Magic Masala", qty: "52 g", price: 20, mrp: 20, emoji: "🍟", rating: 4.4 },
  { id: 12, cat: "snacks", name: "Parle-G Biscuits", qty: "376 g", price: 40, mrp: 45, emoji: "🍪", rating: 4.7 },
  { id: 13, cat: "snacks", name: "Haldiram Bhujia", qty: "200 g", price: 55, mrp: 60, emoji: "🥨", rating: 4.5 },
  { id: 14, cat: "beverages", name: "Coca-Cola", qty: "750 ml", price: 40, mrp: 45, emoji: "🥤", rating: 4.3 },
  { id: 15, cat: "beverages", name: "Real Fruit Juice", qty: "1 L", price: 110, mrp: 130, emoji: "🧃", rating: 4.4 },
  { id: 16, cat: "beverages", name: "Tata Tea Gold", qty: "250 g", price: 138, mrp: 150, emoji: "🍵", rating: 4.6 },
  { id: 17, cat: "staples", name: "India Gate Basmati", qty: "1 kg", price: 145, mrp: 165, emoji: "🍚", rating: 4.6 },
  { id: 18, cat: "staples", name: "Fortune Sunflower Oil", qty: "1 L", price: 132, mrp: 145, emoji: "🛢️", rating: 4.5 },
  { id: 19, cat: "staples", name: "Toor Dal", qty: "1 kg", price: 158, mrp: 175, emoji: "🌾", rating: 4.4 },
  { id: 20, cat: "personal", name: "Dove Soap", qty: "75 g x3", price: 129, mrp: 145, emoji: "🧼", rating: 4.6 },
  { id: 21, cat: "personal", name: "Colgate Toothpaste", qty: "150 g", price: 89, mrp: 99, emoji: "🪥", rating: 4.5 },
  { id: 22, cat: "household", name: "Vim Dishwash Gel", qty: "500 ml", price: 99, mrp: 110, emoji: "🧴", rating: 4.4 },
  { id: 23, cat: "household", name: "Harpic Toilet Cleaner", qty: "500 ml", price: 95, mrp: 105, emoji: "🧹", rating: 4.5 },
  { id: 24, cat: "baby", name: "Pampers Diapers", qty: "M, 24 pcs", price: 449, mrp: 499, emoji: "🍼", rating: 4.7 },
];

function currency(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

// Loads the Razorpay checkout script once, on demand.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Little scooter that zips across the header when something is added — the signature moment.
function ScooterBolt({ show }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed top-[52px] left-0 right-0 z-[70] h-6 overflow-hidden">
      <div className="scooter-run absolute text-xl">🛵💨</div>
      <style>{`
        @keyframes scooterRun { from { left: -10%; } to { left: 105%; } }
        .scooter-run { animation: scooterRun 0.9s cubic-bezier(.3,.6,.4,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .scooter-run { animation-duration: 0.01s; }
        }
      `}</style>
    </div>
  );
}

function StepperButton({ qty, onAdd, onInc, onDec, compact }) {
  if (qty > 0) {
    return (
      <div className={`flex items-center justify-between rounded-lg bg-[#4C7A2A] text-white ${compact ? "h-8 px-1 text-xs w-20" : "h-9 px-1.5 text-sm w-24"} shrink-0`}>
        <button
          onClick={onDec}
          aria-label="Decrease quantity"
          className="grid place-items-center h-full w-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
        >
          <Minus size={14} />
        </button>
        <span className="font-semibold tabular-nums">{qty}</span>
        <button
          onClick={onInc}
          aria-label="Increase quantity"
          className="grid place-items-center h-full w-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onAdd}
      className={`rounded-lg border border-[#4C7A2A] text-[#35581C] font-bold ${compact ? "h-8 text-xs w-20" : "h-9 text-sm w-24"} bg-white hover:bg-[#F1F7EA] active:scale-95 transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C7A2A]`}
    >
      ADD
    </button>
  );
}

function ProductCard({ product, qty, onAdd, onInc, onDec }) {
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  return (
    <div className="flex flex-col bg-white border border-[#ECE8DD] rounded-xl p-2.5 w-[148px] shrink-0 snap-start">
      <div className="relative h-20 grid place-items-center bg-[#FAFAF6] rounded-lg mb-2 text-4xl">
        {product.emoji}
        {discount > 0 && (
          <span className="absolute top-1 left-1 bg-[#B23A2F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-[#8A8578] mb-0.5">
        <Clock size={11} />
        <span>10 mins</span>
      </div>
      <p className="text-[13px] font-medium text-[#1B1A17] leading-snug line-clamp-2 min-h-[34px]">
        {product.name}
      </p>
      <p className="text-[11px] text-[#8A8578] mb-1.5">{product.qty}</p>
      <div className="flex items-end justify-between mt-auto gap-1">
        <div className="leading-tight">
          <div className="text-[13px] font-bold text-[#1B1A17]">{currency(product.price)}</div>
          {discount > 0 && (
            <div className="text-[10px] text-[#8A8578] line-through">{currency(product.mrp)}</div>
          )}
        </div>
        <StepperButton qty={qty} onAdd={onAdd} onInc={onInc} onDec={onDec} compact />
      </div>
    </div>
  );
}

export default function FatafatKart() {
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [cart, setCart] = useState({}); // { productId: qty }
  const [view, setView] = useState("home"); // home | cart | checkout | success
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [showScooter, setShowScooter] = useState(false);
  const [payMethod, setPayMethod] = useState("upi");
  const [orderEta, setOrderEta] = useState(9);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [customerName, setCustomerName] = useState("Rahul");
  const [address, setAddress] = useState("302, Sunrise Apartments, Andheri West, Mumbai, Maharashtra 400058");
  const sectionRefs = useRef({});
  const scooterTimeout = useRef(null);

  // Pull live products from Supabase on load. Falls back to the seed list
  // above if the table is empty or Supabase env vars aren't set yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("products").select("*").order("id");
      if (!cancelled && !error && data && data.length > 0) {
        setProducts(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const itemTotal = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((x) => x.id === Number(id));
      return sum + (p ? p.price * qty : 0);
    }, 0),
    [cart, products]
  );
  const deliveryFee = itemTotal > 0 && itemTotal < 199 ? 25 : 0;
  const handlingFee = itemTotal > 0 ? 6 : 0;
  const savings = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((x) => x.id === Number(id));
      return sum + (p ? (p.mrp - p.price) * qty : 0);
    }, 0),
    [cart, products]
  );
  const grandTotal = itemTotal + deliveryFee + handlingFee;

  const bump = () => {
    setShowScooter(true);
    clearTimeout(scooterTimeout.current);
    scooterTimeout.current = setTimeout(() => setShowScooter(false), 950);
  };

  const addItem = (id) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    bump();
  };
  const incItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const decItem = (id) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, products]);

  const scrollToCat = (id) => {
    setActiveCat(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Saves the order (and its line items) to Supabase.
  const saveOrderToDb = async (paymentStatus, razorpayIds = {}) => {
    const cartItems = Object.entries(cart)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
      .filter((x) => x.product);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        address,
        pay_method: payMethod,
        payment_status: paymentStatus,
        razorpay_order_id: razorpayIds.orderId || null,
        razorpay_payment_id: razorpayIds.paymentId || null,
        item_total: itemTotal,
        delivery_fee: deliveryFee,
        handling_fee: handlingFee,
        grand_total: grandTotal,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const rows = cartItems.map(({ product, qty }) => ({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: qty,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) throw itemsErr;

    return order;
  };
// Sends a fire-and-forget email to the admin when a new order comes in.
  const notifyAdminByEmail = async (order, status) => {
    try {
      await fetch("/api/send-order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, status }),
      });
    } catch (err) {
      console.error("Email notify failed:", err);
    }
  };
// Cash on Delivery: just save the order, no payment gateway needed.
  const placeOrderCOD = async () => {
    setPlacing(true);
    setOrderError("");
    try {
      const order = await saveOrderToDb("pending");
      notifyAdminByEmail(order, "pending");
      setView("success");
      setOrderEta(9);
    } catch (err) {
      console.error(err);
      setOrderError("Couldn't save your order. Check your Supabase setup and try again.");
    } finally {
      setPlacing(false);
    }
  };

  
  

  // UPI / Card: create a Razorpay order via the serverless function, open
  // the checkout widget, verify the signature, then save the order.
  const placeOrderRazorpay = async () => {
    setPlacing(true);
    setOrderError("");
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Razorpay SDK failed to load");

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
      });
      if (!res.ok) throw new Error("Failed to create Razorpay order");
      const rpOrder = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "FatafatKart",
        description: "Grocery order",
        order_id: rpOrder.id,
        prefill: { name: customerName },
        theme: { color: "#4C7A2A" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const { verified } = await verifyRes.json();
            await saveOrderToDb(verified ? "paid" : "failed", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });
            if (verified) {
              setView("success");
              setOrderEta(9);
            } else {
              setOrderError("Payment verification failed. Please try again.");
            }
          } catch (err) {
            console.error(err);
            setOrderError("Payment succeeded but saving the order failed. Contact support.");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setOrderError("Something went wrong starting payment. Please try again.");
      setPlacing(false);
    }
  };

  const placeOrder = () => {
    if (payMethod === "cod") {
      placeOrderCOD();
    } else {
      placeOrderRazorpay();
    }
  };

  useEffect(() => {
    if (view !== "success") return;
    const t = setInterval(() => {
      setOrderEta((e) => (e > 0 ? e - 1 : 0));
    }, 1200);
    return () => clearInterval(t);
  }, [view]);

  const resetToHome = () => {
    setCart({});
    setView("home");
    setQuery("");
  };

  // ---------------------------------------------------------------------
  // SUCCESS VIEW
  // ---------------------------------------------------------------------
  if (view === "success") {
    return (
      <div className="min-h-[640px] bg-[#FAFAF6] flex flex-col items-center justify-center p-6 text-center font-[Manrope,sans-serif]">
        <div className="w-16 h-16 rounded-full bg-[#4C7A2A] grid place-items-center mb-4">
          <CheckCircle2 className="text-white" size={34} />
        </div>
        <h1 className="text-xl font-extrabold text-[#1B1A17] mb-1" style={{ fontFamily: "Baloo 2, sans-serif" }}>
          Order placed, fatafat!
        </h1>
        <p className="text-sm text-[#8A8578] mb-6">Your scooter captain is already on the way.</p>

        <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 w-full max-w-xs mb-6">
          <div className="flex items-center justify-center gap-2 text-[#4C7A2A] mb-1">
            <Zap size={18} fill="#4C7A2A" />
            <span className="text-3xl font-extrabold tabular-nums" style={{ fontFamily: "Baloo 2, sans-serif" }}>
              {orderEta}
            </span>
            <span className="text-sm font-semibold self-end mb-1">mins</span>
          </div>
          <p className="text-xs text-[#8A8578]">estimated delivery time</p>
          <div className="h-1.5 rounded-full bg-[#ECE8DD] mt-3 overflow-hidden">
            <div
              className="h-full bg-[#E8A93B] transition-all duration-1000"
              style={{ width: `${((9 - orderEta) / 9) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-left w-full max-w-xs bg-white border border-[#ECE8DD] rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#8A8578] mb-2">BILL SUMMARY</p>
          <div className="flex justify-between text-sm mb-1">
            <span>Item total</span>
            <span className="font-medium">{currency(itemTotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Delivery fee</span>
            <span className="font-medium">{deliveryFee ? currency(deliveryFee) : "FREE"}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>Handling fee</span>
            <span className="font-medium">{currency(handlingFee)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-dashed border-[#ECE8DD] pt-2">
            <span>Total paid</span>
            <span>{currency(grandTotal)}</span>
          </div>
        </div>

        <button
          onClick={resetToHome}
          className="bg-[#4C7A2A] text-white font-bold rounded-xl px-6 py-3 w-full max-w-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35581C]"
        >
          Order more
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // CHECKOUT VIEW
  // ---------------------------------------------------------------------
  if (view === "checkout") {
    return (
      <div className="min-h-[640px] bg-[#FAFAF6] font-[Manrope,sans-serif] pb-28">
        <div className="sticky top-0 z-20 bg-white border-b border-[#ECE8DD] flex items-center gap-3 px-4 h-14">
          <button onClick={() => setView("cart")} aria-label="Back to cart" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C7A2A] rounded p-1">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-bold text-[#1B1A17]">Checkout</h1>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white border border-[#ECE8DD] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-[#4C7A2A]">
              <HomeIcon size={16} />
              <span className="text-sm font-bold">Delivering to Home</span>
            </div>
            <p className="text-sm text-[#1B1A17] font-medium">Rahul • 302, Sunrise Apartments</p>
            <p className="text-xs text-[#8A8578]">Andheri West, Mumbai, Maharashtra 400058</p>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-xl p-4">
            <p className="text-sm font-bold text-[#1B1A17] mb-3">Payment method</p>
            <div className="space-y-2">
              {[
                { id: "upi", label: "UPI (GPay, PhonePe, Paytm)", icon: Wallet },
                { id: "card", label: "Credit / Debit Card", icon: CreditCard },
                { id: "cod", label: "Cash on Delivery", icon: Banknote },
              ].map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition ${
                    payMethod === id ? "border-[#4C7A2A] bg-[#F1F7EA]" : "border-[#ECE8DD]"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={payMethod === id}
                    onChange={() => setPayMethod(id)}
                    className="accent-[#4C7A2A]"
                  />
                  <Icon size={17} className="text-[#4C7A2A]" />
                  <span className="text-sm text-[#1B1A17]">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-xl p-4">
            <p className="text-sm font-bold text-[#1B1A17] mb-2">Bill details</p>
            <div className="flex justify-between text-sm mb-1 text-[#4A4A44]">
              <span>Item total</span>
              <span>{currency(itemTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1 text-[#4A4A44]">
              <span>Delivery fee</span>
              <span>{deliveryFee ? currency(deliveryFee) : "FREE"}</span>
            </div>
            <div className="flex justify-between text-sm mb-2 text-[#4A4A44]">
              <span>Handling fee</span>
              <span>{currency(handlingFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-dashed border-[#ECE8DD] pt-2 text-[#1B1A17]">
              <span>Grand total</span>
              <span>{currency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECE8DD] p-3">
          {orderError && (
            <div className="flex items-start gap-1.5 text-[#B23A2F] text-xs mb-2 px-1">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{orderError}</span>
            </div>
          )}
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-[#4C7A2A] disabled:opacity-70 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35581C]"
          >
            {placing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {payMethod === "cod" ? "Placing order..." : "Opening payment..."}
              </>
            ) : (
              <>
                {payMethod === "cod" ? "Place order" : "Pay & place order"} • {currency(grandTotal)}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // CART VIEW
  // ---------------------------------------------------------------------
  if (view === "cart") {
    const cartItems = Object.entries(cart)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
      .filter((x) => x.product);

    return (
      <div className="min-h-[640px] bg-[#FAFAF6] font-[Manrope,sans-serif] pb-32">
        <div className="sticky top-0 z-20 bg-white border-b border-[#ECE8DD] flex items-center gap-3 px-4 h-14">
          <button onClick={() => setView("home")} aria-label="Back to shopping" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C7A2A] rounded p-1">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-bold text-[#1B1A17]">My Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-6 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="font-bold text-[#1B1A17] mb-1">Your cart is empty</p>
            <p className="text-sm text-[#8A8578] mb-5">Add items and they'll show up here, fatafat.</p>
            <button
              onClick={() => setView("home")}
              className="bg-[#4C7A2A] text-white font-bold rounded-xl px-5 py-2.5"
            >
              Start shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-[#F1F7EA] mx-4 mt-3 rounded-lg px-3 py-2 text-[#35581C] text-xs font-semibold">
              <Clock size={14} />
              Delivery in 10 minutes
            </div>

            <div className="p-4 space-y-3">
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3 bg-white border border-[#ECE8DD] rounded-xl p-3">
                  <div className="w-14 h-14 grid place-items-center bg-[#FAFAF6] rounded-lg text-3xl shrink-0">
                    {product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1B1A17] truncate">{product.name}</p>
                    <p className="text-xs text-[#8A8578]">{product.qty}</p>
                    <p className="text-sm font-bold text-[#1B1A17] mt-0.5">{currency(product.price * qty)}</p>
                  </div>
                  <StepperButton
                    qty={qty}
                    onInc={() => incItem(product.id)}
                    onDec={() => decItem(product.id)}
                  />
                </div>
              ))}

              <button
                onClick={() => setCart({})}
                className="flex items-center gap-1.5 text-xs text-[#B23A2F] font-semibold pt-1"
              >
                <Trash2 size={13} /> Clear cart
              </button>
            </div>

            <div className="px-4">
              <div className="bg-white border border-[#ECE8DD] rounded-xl p-4">
                <p className="text-sm font-bold text-[#1B1A17] mb-2">Bill details</p>
                <div className="flex justify-between text-sm mb-1 text-[#4A4A44]">
                  <span>Item total</span>
                  <span>{currency(itemTotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm mb-1 text-[#4C7A2A]">
                    <span>Savings</span>
                    <span>-{currency(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mb-1 text-[#4A4A44]">
                  <span>Delivery fee</span>
                  <span>{deliveryFee ? currency(deliveryFee) : "FREE"}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-[#4A4A44]">
                  <span>Handling fee</span>
                  <span>{currency(handlingFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-dashed border-[#ECE8DD] pt-2 text-[#1B1A17]">
                  <span>Grand total</span>
                  <span>{currency(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECE8DD] p-3">
              <button
                onClick={() => setView("checkout")}
                className="w-full bg-[#4C7A2A] text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35581C]"
              >
                Proceed to checkout
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // HOME VIEW
  // ---------------------------------------------------------------------
  return (
    <div className="min-h-[640px] bg-[#FAFAF6] font-[Manrope,sans-serif] pb-24 relative">
      <ScooterBolt show={showScooter} />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#ECE8DD]">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-[#1B1A17]" style={{ fontFamily: "Baloo 2, sans-serif" }}>
                Fatafat<span className="text-[#4C7A2A]">Kart</span>
              </span>
              <span className="flex items-center gap-0.5 bg-[#F1F7EA] text-[#35581C] text-[10px] font-bold px-1.5 py-0.5 rounded">
                <Zap size={10} fill="#35581C" /> 10 MIN
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#8A8578] mt-0.5">
              <MapPin size={12} />
              <span className="truncate max-w-[220px]">Andheri West, Mumbai</span>
            </div>
          </div>
          <button
            onClick={() => setView("cart")}
            aria-label="Open cart"
            className="relative bg-[#4C7A2A] text-white p-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35581C]"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E8A93B] text-[#1B1A17] text-[10px] font-bold rounded-full w-4 h-4 grid place-items-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="px-4 pb-2.5">
          <div className="flex items-center gap-2 bg-[#FAFAF6] border border-[#ECE8DD] rounded-lg px-3 h-10">
            <Search size={16} className="text-[#8A8578]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for atta, milk, chips..."
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#8A8578]"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X size={15} className="text-[#8A8578]" />
              </button>
            )}
          </div>
        </div>

        {!filteredProducts && (
          <div className="flex gap-4 overflow-x-auto px-4 pb-2.5 no-scrollbar">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToCat(c.id)}
                className={`flex flex-col items-center gap-1 shrink-0 focus:outline-none`}
              >
                <div
                  className={`w-12 h-12 grid place-items-center rounded-full text-xl border-2 transition ${
                    activeCat === c.id ? "border-[#4C7A2A] bg-[#F1F7EA]" : "border-transparent bg-[#FAFAF6]"
                  }`}
                >
                  {c.emoji}
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight w-14 ${activeCat === c.id ? "text-[#35581C] font-bold" : "text-[#8A8578]"}`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      {filteredProducts ? (
        <div className="p-4">
          <p className="text-xs text-[#8A8578] mb-3">{filteredProducts.length} results for "{query}"</p>
          {filteredProducts.length === 0 ? (
            <div className="text-center pt-16">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm text-[#8A8578]">No products matched. Try "milk" or "chips".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((p) => (
                <ProductCardGrid key={p.id} product={p} cart={cart} addItem={addItem} incItem={incItem} decItem={decItem} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="pt-3">
          {CATEGORIES.map((cat) => {
            const items = products.filter((p) => p.cat === cat.id);
            if (items.length === 0) return null;
            return (
              <div
                key={cat.id}
                ref={(el) => (sectionRefs.current[cat.id] = el)}
                className="mb-5 scroll-mt-32"
              >
                <div className="flex items-center gap-2 px-4 mb-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <h2 className="text-sm font-bold text-[#1B1A17]">{cat.label}</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar snap-x">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      qty={cart[p.id] || 0}
                      onAdd={() => addItem(p.id)}
                      onInc={() => incItem(p.id)}
                      onDec={() => decItem(p.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3">
          <button
            onClick={() => setView("cart")}
            className="w-full bg-[#4C7A2A] text-white rounded-xl py-3 px-4 flex items-center justify-between shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35581C]"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
              {currency(itemTotal)}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold">
              View cart <ArrowRight size={16} />
            </span>
          </button>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function ProductCardGrid({ product, cart, addItem, incItem, decItem }) {
  const qty = cart[product.id] || 0;
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  return (
    <div className="flex flex-col bg-white border border-[#ECE8DD] rounded-xl p-2.5">
      <div className="relative h-20 grid place-items-center bg-[#FAFAF6] rounded-lg mb-2 text-4xl">
        {product.emoji}
        {discount > 0 && (
          <span className="absolute top-1 left-1 bg-[#B23A2F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% OFF
          </span>
        )}
      </div>
      <p className="text-[13px] font-medium text-[#1B1A17] leading-snug line-clamp-2 min-h-[34px]">
        {product.name}
      </p>
      <p className="text-[11px] text-[#8A8578] mb-1.5">{product.qty}</p>
      <div className="flex items-end justify-between mt-auto gap-1">
        <div className="leading-tight">
          <div className="text-[13px] font-bold text-[#1B1A17]">{currency(product.price)}</div>
          {discount > 0 && (
            <div className="text-[10px] text-[#8A8578] line-through">{currency(product.mrp)}</div>
          )}
        </div>
        <StepperButton qty={qty} onAdd={() => addItem(product.id)} onInc={() => incItem(product.id)} onDec={() => decItem(product.id)} compact />
      </div>
    </div>
  );
}
