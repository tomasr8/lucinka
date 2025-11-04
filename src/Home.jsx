import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CirclePlus, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import FormModal from "./Form.jsx";
import Header from "./Header.jsx";
import { useTheme } from "./theme.jsx";
import { useData } from "./util";
import percentiles from "./percentiles.json";
export default function Home() {
  const { t, i18n } = useTranslation();
  const language = i18n.language || "en";
  const { darkMode } = useTheme();

  const {
    data: { data, user },
    loading,
    refetch,
  } = useData("data");
  const isAdmin = user?.is_admin;
  const [formVisible, setFormVisible] = useState(false);

  const deleteEntry = async id => {
    if (!id) return;
    try {
      const res = await fetch(`/api/data/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh data
        refetch();
      } else {
        console.error("Failed to delete entry");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <Header isAdmin={isAdmin} />
          <div className="mb-6">
            <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
              {t("Data")}
            </h1>
            <p className="dark:text-white text-gray-600">
              {t("Lucinka's vitals")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedEntries = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find closest percentile data
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

  const weightDataInMonths = sortedEntries.map(item => {
    const birthDate = new Date("2025-10-10");
    const currentDate = new Date(item.date);
    const diffTime = currentDate - birthDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const months = (diffDays / 30.44).toFixed(1); // Average days per month

    return {
      month: parseFloat(months),
      weight: item.weight,
    };
  });

  // Merge percentile data and weight data
  // Create combined dataset with all unique months
  const allMonths = new Set([
    // take only the first 24 month of percentiles
    ...percentiles.map(d => d.Month).slice(0, 7),
    ...weightDataInMonths.map(d => d.month),
  ]);

  const combinedData = Array.from(allMonths)
    .sort((a, b) => a - b)
    .map(month => {
      const percentile = percentiles.find(d => d.Month === month);
      const weight = weightDataInMonths.find(d => d.month === month);

      return {
        month: month,
        ...(percentile && {
          P1: percentile.P1,
          P25: percentile.P25,
          P50: percentile.P50,
          P75: percentile.P75,
          P99: percentile.P99,
        }),
        ...(weight && { actualWeight: weight.weight }),
      };
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Header isAdmin={isAdmin} />
        <div className="mb-6">
          <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
            {t("Data")}
          </h1>
          <p className="dark:text-white text-gray-600">{t("Lucinka's vitals")}</p>
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
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-8 p-6`}
          >
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100`}
            >
              {t("Weight Percentile Over Time")}
            </h2>
            {/* Percentile plot */}
            <ResponsiveContainer width="100%" height={500}>
              <LineChart
                data={combinedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "gray" : "#e5e7eb"} />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  label={{
                    value: "Age (months)",
                    position: "insideBottom",
                    offset: -2,
                  }}
                  style={{ fontSize: "14px", fontWeight: "500" }}
                  type="number"
                  ticks={Array.from({ length: 6 }, (_, i) => i)} // Ticks from 0 to 25
                  // domain={[0, 25]}
                />
                <YAxis
                  stroke="#6b7280"
                  label={{
                    value: "Weight (kg)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  style={{ fontSize: "14px" }}
                  domain={[2, 12]}
                  ticks={[2, 4, 6, 8, 10, 12]}
                />
                {/* WHO Percentile Lines */}
                {["P01", "P25", "P50", "P75", "P99"].map((key, index) => {
                  const names = ["1st", "25th", "50th", "75th", "99th"];
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={darkMode ? "lightgray" : "gray"}
                      strokeWidth={1}
                      activeDot={false}
                      name={names[index]}
                      dot={false}
                      connectNulls
                      label={(props) => {
                      const { x, y, value, index: pointIndex } = props;
                      const point = combinedData[pointIndex];
                      // Show label only at month 6
                      if (point && point.month === "6" && value) {
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={darkMode ? "lightgray" : "gray"}
                            fontSize={12}
                            fontWeight="bold"
                            textAnchor="start"
                            dominantBaseline="middle"
                          >
                            {names[index]}
                          </text>
                        );
                      }
                      return null;
                    }}
                    />
                  );
                })}

                {/* Actual Weight Line */}
                <Line
                  type="monotone"
                  dataKey="actualWeight"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Actual Weight"
                  dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 3, strokeWidth: 3 }}
                  connectNulls={false}
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
            {t("Weight Over Time")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartWeightData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? "#374151" : "#e5e7eb"}
              />
              <XAxis dataKey="date" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
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
              {isAdmin && (
                <button
                  onClick={() => setFormVisible(v => !v)}
                  className="mb-4 px-2 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors"
                >
                  <CirclePlus />
                </button>
              )}
            </div>
            {formVisible && <FormModal onSubmit={refetch} />}
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
                      {isAdmin && (
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
