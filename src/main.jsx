import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Home from "./Home.jsx";
import LoginPage from "./LoginPage.jsx";
import Stats from "./Stats.jsx";
import Gallery from "./Gallery.jsx";
import VisitsPage from "./Visits.jsx";
import BreastfeedingPage from "./Breastfeeding.jsx";
import "./i18n";
import { ThemeProvider } from "./theme.jsx";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/breastfeeding" element={<BreastfeedingPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
