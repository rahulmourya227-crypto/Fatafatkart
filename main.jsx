import React from "react";
import ReactDOM from "react-dom/client";
import FatafatKart from "./App.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import "./index.css";

const isAdmin = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? <AdminDashboard /> : <FatafatKart />}
  </React.StrictMode>
);
