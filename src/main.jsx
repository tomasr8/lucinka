import { StrictMode, createContext, useContext, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  createBrowserRouter,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import Home from "./Home.jsx";
import LoginPage from "./LoginPage.jsx";
import Stats from "./Stats.jsx";
import Gallery from "./Gallery.jsx";
import VisitsPage from "./Visits.jsx";
import BreastfeedingPage from "./Breastfeeding.jsx";
import "./i18n";
import { ThemeProvider } from "./theme.jsx";
import { UserProvider } from "./user.jsx";

// async function loadUserData() {
//   const response = await fetch("/api/current-user");
//   if (!response.ok) {
//     return null;
//   }
//   return response.json();
// }

// async function loadData() {
//   const response = await fetch("/api/data");
//   if (!response.ok) {
//     return null;
//   }
//   return response.json();
// }

// const router = createBrowserRouter([
//   {
//     path: "/",
//     Component: App,
//     loader: async () => {
//       const [user, data] = await Promise.all([loadUserData(), loadData()]);
//       return { user, data };
//     },
//   },
// ]);

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
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
      </UserProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
