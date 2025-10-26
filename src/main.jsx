import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import Stats from "./Stats.jsx";
import Gallery from "./Gallery.jsx";
import VisitsPage from "./Visits.jsx";
import BreastfeedingPage from "./Breastfeeding.jsx";
import "./i18n";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<App />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/visits" element={<VisitsPage />} />
        <Route path="/breastfeeding" element={<BreastfeedingPage />} />



      </Routes>
    </BrowserRouter>
  </StrictMode>
);
