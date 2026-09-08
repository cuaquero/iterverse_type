import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import KioskPage from "./pages/KioskPage";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
