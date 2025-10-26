import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Moon, Sun, ShieldUser, CirclePlus, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { setLocale } from "./i18n";
import FormModal from "./Form.jsx";
import Visits from "./Visits.jsx";
import Gallery from "./Gallery.jsx";
import Breastfeeding from "./Breastfeeding.jsx";
import Header from "./Header.jsx";

export default function App() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language || "en";
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const theme = darkMode ? "light" : "dark";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark");
    setDarkMode(d => !d);
  };

  const [state, setState] = useState({ loading: true });
  const [formVisible, setFormVisible] = useState(false);

  const deleteEntry = async id => {
    if (!id) return;
    try {
      const res = await fetch(`/api/data/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh data
        setState(s => ({
          ...s,
          data: s.data.filter(entry => entry.id !== id),
        }));
      } else {
        console.error("Failed to delete entry");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, dataRes] = await Promise.all([
          fetch("/api/current-user"),
          fetch("/api/data"),
        ]);

        if (!userRes.ok || !dataRes.ok) {
          // not logged in, redirect to login page
          navigate("login");
          return;
        }

        const user = await userRes.json();
        const data = await dataRes.json();
        setState({ loading: false, user, data });
      } catch (err) {
        console.error(err);
        navigate("login");
        return;
      }
    }

    fetchData();
  }, [navigate]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const sortedEntries = [...(state.data || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartWeightData = sortedEntries
    .filter(entry => !!entry.weight)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString(language, {
        month: "short",
        day: "numeric",
      }),
      weight: entry.weight,
      fullDate: entry.date,
    }));

  const chartHeightData = sortedEntries
    .filter(entry => !!entry.height)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString(language, {
        month: "short",
        day: "numeric",
      }),
      height: entry.height,
      fullDate: entry.date,
    }));

  let weightChange = "N/A";
  const filteredEntries = sortedEntries.filter(entry => !!entry.weight);
  if (filteredEntries.length > 1) {
    const first = sortedEntries[0].weight;
    const last = sortedEntries[sortedEntries.length - 1].weight;
    const diff = (last - first) * 1000;
    const sign = diff >= 0 ? "+" : "";
    weightChange = `${sign}${diff.toFixed(0)}g`;
  }

  let lastWeightChange = "N/A";
  if (filteredEntries.length > 1) {
    const last = filteredEntries.at(-1).weight;
    const secondToLast = filteredEntries.at(-2).weight;
    const diff = (last - secondToLast) * 1000;
    const sign = diff >= 0 ? "+" : "";
    lastWeightChange = `${sign}${diff.toFixed(0)}g`;
  }

  // Calculate Y-axis range with padding
  const weights = sortedEntries.filter(e => !!e.weight).map(e => e.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = (maxWeight - minWeight) * 0.2 || 0.5; // 20% padding or 0.5kg minimum
  const yAxisMin = Math.max(0, minWeight - padding);
  const yAxisMax = maxWeight + padding;

  const heights = sortedEntries.filter(e => !!e.height).map(e => e.height);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  const heightPadding = (maxHeight - minHeight) * 0.2 || 1; // 20% padding or 1cm minimum
  const yAxisMinHeight = Math.max(0, minHeight - heightPadding);
  const yAxisMaxHeight = maxHeight + heightPadding;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Header isAdmin={state.user.is_admin} />
        <div className="mb-6">
          <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
            Data
          </h1>
          <p className="dark:text-white text-gray-600">
            Lucinka's vitals
          </p>
        </div>
        <div>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6`}
            >
              <p className="text-gray-600 dark:text-gray-400">
                {t("Current Weight")}
              </p>
              <p
                className={`text-3xl font-bold text-gray-900 dark:text-gray-100`}
              >
                {filteredEntries[filteredEntries.length - 1]?.weight.toFixed(2)}
                kg
              </p>
            </div>
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6`}
            >
              <p className="text-gray-600 dark:text-gray-400">
                {t("Weight Change (since last measurement)")}
              </p>
              <p
                className={`text-3xl font-bold text-gray-900 dark:text-gray-100`}
              >
                {lastWeightChange}
              </p>
            </div>
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6`}
            >
              <p className="text-gray-600 dark:text-gray-400">
                {t("Weight Change (since birth)")}
              </p>
              <p
                className={`text-3xl font-bold text-gray-900 dark:text-gray-100`}
              >
                {weightChange}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8`}
          >
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100`}
            >
              {t("Weight Over Time")}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartWeightData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#e5e7eb"}
                />
                <XAxis
                  dataKey="date"
                  stroke={darkMode ? "#9ca3af" : "#6b7280"}
                />
                <YAxis
                  stroke={darkMode ? "#9ca3af" : "#6b7280"}
                  domain={[yAxisMin, yAxisMax]}
                  label={{
                    value: t("Weight (kg)"),
                    angle: -90,
                    position: "insideLeft",
                    fill: darkMode ? "#9ca3af" : "#6b7280",
                  }}
                  tickFormatter={value => value.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                    border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    color: darkMode ? "#f3f4f6" : "#111827",
                  }}
                  formatter={value => value.toFixed(2)}
                />
                {/* <Legend  /> */}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8`}
          >
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100`}
            >
              {t("Height Over Time")}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartHeightData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#e5e7eb"}
                />
                <XAxis
                  dataKey="date"
                  stroke={darkMode ? "#9ca3af" : "#6b7280"}
                />
                <YAxis
                  stroke={darkMode ? "#9ca3af" : "#6b7280"}
                  domain={[yAxisMinHeight, yAxisMaxHeight]}
                  label={{
                    value: t("Height (cm)"),
                    angle: -90,
                    position: "insideLeft",
                    fill: darkMode ? "#9ca3af" : "#6b7280",
                  }}
                  tickFormatter={value => value.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                    border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    color: darkMode ? "#f3f4f6" : "#111827",
                  }}
                  formatter={value => value.toFixed(1)}
                />
                {/* <Legend  /> */}
                <Line
                  type="monotone"
                  dataKey="height"
                  stroke="#fed12f"
                  strokeWidth={2}
                  dot={{ fill: "#fed12f", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Entries List */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6`}
          >
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100`}
              >
                {t("All Entries")}
              </h2>
              {state.user.is_admin && (
                <button
                  onClick={() => setFormVisible(v => !v)}
                  className="mb-4 px-2 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors"
                >
                  <CirclePlus />
                </button>
              )}
            </div>
            {formVisible && <FormModal setState={setState} />}
            <div className="space-y-3">
              {sortedEntries.toReversed().map(entry => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p
                        className={`font-semibold text-gray-900 dark:text-gray-100`}
                      >
                        {new Date(entry.date).toLocaleDateString(language, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {entry.weight && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            darkMode
                              ? "bg-violet-900 text-violet-300"
                              : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {entry.weight.toFixed(2)}kg
                        </span>
                      )}
                      {entry.height && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            darkMode
                              ? "bg-amber-900 text-amber-300"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {entry.height.toFixed(1)}cm
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        {entry.notes}
                      </p>
                    )}
                    <div className="flex justify-end">
                      {state.user.is_admin && (
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="mb-4 px-2 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
