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
            <p className="text-[#B23A2F] text-xs mb-3">{loginError}</p>
          )}
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
          <button onClick={logout}
