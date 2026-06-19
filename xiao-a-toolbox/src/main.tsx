import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";

// Initialize theme from config
if (window.electronAPI?.getConfig) {
  window.electronAPI.getConfig().then((cfg: any) => {
    const theme = cfg?.theme || "auto";
    document.documentElement.setAttribute("data-theme", theme);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
