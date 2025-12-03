import { useNavigate, useLocation } from "react-router";
import {
  Moon,
  Sun,
  Wrench,
  HouseHeart,
  Stethoscope,
  Milk,
  BookImage,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { setLocale } from "./i18n";
import { useTheme } from "./theme.jsx";

export default function Header({ isAdmin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language || "en";

  const commonStyle =
    "flex gap-4 items-center justify-center cursor-pointer font-medium rounded-lg text-sm px-5 py-4 text-center me-2 mb-2";
  const activeStyle =
    "text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl";
  const defaultStyle =
    "text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity";

  async function logOut() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Lucinka
          </h1>
        </div>
        {/* Language selector */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={() => navigate("/stats")}
                className="cursor-pointer p-2 sm:p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
              >
                {darkMode ? (
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                ) : (
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                )}
              </button>
              <div className="hidden sm:block py-4 border-l-2 border-solid border-gray-200 dark:border-gray-700"></div>
            </>
          )}
          <select
            value={language}
            onChange={e => setLocale(e.target.value)}
            className="cursor-pointer p-2 sm:p-3 text-sm sm:text-base rounded-lg border border-gray-200 dark:border-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 hover:opacity-80 transition-opacity"
          >
            <option value="en">🇬🇧 English</option>
            <option value="cs">🇨🇿 Čeština</option>
            <option value="it">🇮🇹 Italiano</option>
          </select>
          <button
            onClick={toggleDarkMode}
            className="cursor-pointer p-2 sm:p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            )}
          </button>
          <button
            onClick={logOut}
            className="cursor-pointer p-2 sm:p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
      <div>
        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`${
              location.pathname === "/" ? activeStyle : defaultStyle
            } ${commonStyle}`}
          >
            <HouseHeart />
            {t("Home")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/visits")}
            className={`${
              location.pathname === "/visits" ? activeStyle : defaultStyle
            } ${commonStyle}`}
          >
            <Stethoscope />
            {t("Visits")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/breastfeeding")}
            className={`${
              location.pathname === "/breastfeeding"
                ? activeStyle
                : defaultStyle
            } ${commonStyle}`}
          >
            <Milk />
            {t("Breastfeeding")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className={`${
              location.pathname === "/gallery" ? activeStyle : defaultStyle
            } ${commonStyle}`}
          >
            <BookImage />
            {t("Gallery")}
          </button>
        </div>
      </div>
    </div>
  );
}
