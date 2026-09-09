import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import KioskPage from "./pages/KioskPage";
import AdminPage from "./pages/AdminPage";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
