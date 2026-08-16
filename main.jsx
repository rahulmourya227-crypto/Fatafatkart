import React from "react";
import ReactDOM from "react-dom/client";
import FatafatKart from "./App.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import "./index.css";

window.addEventListener("error", (e) => {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;top:0;left:0;right:0;background:#B23A2F;color:white;padding:14px;font-family:monospace;z-index:99999;white-space:pre-wrap;font-size:13px;line-height:1.4;";
  el.textContent =
    "JS ERROR: " + e.message + "\nFile: " + e.filename + " Line: " + e.lineno;
  document.body.appendChild(el);
});

window.addEventListener("unhandledrejection", (e) => {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;top:0;left:0;right:0;background:#B23A2F;color:white;padding:14px;font-family:monospace;z-index:99999;white-space:pre-wrap;font-size:13px;line-height:1.4;";
  el.textContent = "PROMISE ERROR: " + (e.reason?.message || e.reason);
  document.body.appendChild(el);
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: "monospace", color: "#B23A2F", whiteSpace: "pre-wrap", fontSize: 13 }}>
          <h2>App crashed while rendering:</h2>
          <p>{this.state.error.message}</p>
          <p>{this.state.error.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const isAdmin = window.location.pathname.startsWith("/admin");

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        {isAdmin ? <AdminDashboard /> : <FatafatKart />}
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  document.getElementById("root").innerText = "MOUNT ERROR: " + err.message;
}
