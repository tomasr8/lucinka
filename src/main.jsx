import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import Stats from "./Stats.jsx";
import "./i18n";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/lucie/login" element={<LoginPage />} />
        <Route path="/lucie/home" element={<App />} />
        <Route path="/lucie/stats" element={<Stats />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
