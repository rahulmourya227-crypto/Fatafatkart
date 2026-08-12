import React, { useState, useEffect } from "react";
import { Lock, LogOut, RefreshCw, Package, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";

const STATUS_OPTIONS = ["pending", "packed", "out_for_delivery", "delivered"];
const STATUS_LABELS = {
  pending: "Pending",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};
const STATUS_COLORS = {
  pending: "#E8A93B",
  packed: "#4C7A2A",
  out_for_delivery: "#2C6ABF",
  delivered: "#35581C",
};

function currency(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(
    sessionStorage.getItem("fk_admin_authed") === "true"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const login = (e) => {
    e.preventDefault();
    const validUser = import.meta.env.VITE_ADMIN_USERNAME;
    const validPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (username === validUser && password === validPass) {
      sessionStorage.setItem("fk_admin_authed", "true");
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Galat username ya password.");
    }
  };

  const logout = () => {
    sessionStorage.removeItem("fk_admin_authed");
    setAuthed(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: itemsData, error: itemsErr } = await supabase
      .from("order_items")
      .select("*");

    if (ordersErr || itemsErr) {
      setError("Orders load nahi ho paaye. Supabase check karo.");
    } else {
      setOrders(ordersData || []);
      setItems(itemsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchOrders();
  }, [authed]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const { error: updErr } = await supabase
      .from("orders")
      .update({ order_status: newStatus })
      .eq("id", orderId);
    if (!updErr) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
      );
    }
    setUpdatingId(null);
  };

  if (!authed) {
    return (
      <div className="min-h-[640px] bg-[#FAFAF6] flex items-center justify-center p-6 font-[Manrope,sans-serif]">
        <form
          onSubmit={login}
          className="bg-white border border-[#ECE8DD] rounded-2xl p-6 w-full max-w-xs"
        >
          <div className="flex items-center gap-2 mb-4 text-[#4C7A2A]">
            <Lock size={20} />
            <h1 className="font-bold text-[#1B1A17] text-lg">Admin Login</h1>
          </div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-[#ECE8DD] rounded-lg px-3 h-11 mb-3 text-sm outline-none focus:border-[#4C7A2A]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#ECE8DD] rounded-lg px-3 h-11 mb-3 text-sm outline-none focus:border-[#4C7A2A]"
          />
          {loginError && (
            <p className="text-[#B23A2F] text-xs mb-3">{loginError}</p>)}
          <button
            type="submit"
            className="w-full bg-[#4C7A2A] text-white font-bold rounded-lg py-2.5 text-sm"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[640px] bg-[#FAFAF6] font-[Manrope,sans-serif] pb-10">
      <div className="sticky top-0 z-20 bg-white border-b border-[#ECE8DD] flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 text-[#1B1A17] font-bold">
          <Package size={18} className="text-[#4C7A2A]" />
          Admin Dashboard
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} aria-label="Refresh">
            <RefreshCw size={18} className="text-[#4C7A2A]" />
          </button>
          <button onClick={logout} aria-label="Logout">
            <LogOut size={18} className="text-[#B23A2F]" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-[#8A8578] py-10">
            <Loader2 size={18} className="animate-spin" /> Loading orders...
          </div>
        )}

        {error && <p className="text-[#B23A2F] text-sm mb-3">{error}</p>}

        {!loading && orders.length === 0 && !error && (
          <p className="text-[#8A8578] text-sm text-center py-10">
            Abhi tak koi order nahi aaya.
          </p>
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            const orderItems = items.filter((it) => it.order_id === order.id);
            const status = order.order_status || "pending";
            return (
              <div
                key={order.id}
                className="bg-white border border-[#ECE8DD] rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#1B1A17] text-sm">
                      #{order.id} • {order.customer_name}
                    </p>
                    <p className="text-xs text-[#8A8578]">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded text-white shrink-0"
                    style={{ background: STATUS_COLORS[status] }}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                <p className="text-xs text-[#8A8578] mb-2">{order.address}</p>

                <div className="border-t border-dashed border-[#ECE8DD] pt-2 mb-2">
                  {orderItems.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between text-xs text-[#4A4A44] mb-1"
                    >
                      <span>
                        {it.product_name} x{it.quantity}
                      </span>
                      <span>{currency(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-[#ECE8DD] pt-2 mb-3">
                  <span className="text-xs text-[#8A8578]">
                    {order.pay_method?.toUpperCase()} • {order.payment_status}
                  </span>
                  <span className="font-bold text-[#1B1A17] text-sm">
                    {currency(order.grand_total)}
                  </span>
                </div>

                <select
                  value={status}
                  disabled={updatingId === order.id}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="w-full border border-[#ECE8DD] rounded-lg h-10 px-2 text-sm outline-none focus:border-[#4C7A2A] bg-[#FAFAF6]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
