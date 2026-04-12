import { useState } from "react";
import { CirclePlus, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import FormModal from "./Form.jsx";
import Header from "./Header.jsx";
import { useTheme } from "./theme.jsx";
import { useData } from "./util";
import percentiles from "./percentiles.json";
import heightPercentiles from "./height_percentiles.json";
import PercentileGraph from "./PercentileGraph.jsx";

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
    ...percentiles.map(d => d.Month).slice(0, 13),
    ...weightDataInMonths.map(d => d.month),
  ]);

  const combinedWeightData = Array.from(allMonths)
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

  const heightDataInMonths = sortedEntries
    .filter(entry => !!entry.height)
    .map(item => {
      const birthDate = new Date("2025-10-10");
      const currentDate = new Date(item.date);
      const diffTime = currentDate - birthDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return {
        month: parseFloat((diffDays / 30.44).toFixed(1)),
        height: item.height,
      };
    });

  const allHeightMonths = new Set([
    ...heightPercentiles.map(d => d.Month).slice(0, 13),
    ...heightDataInMonths.map(d => d.month),
  ]);

  const combinedHeightData = Array.from(allHeightMonths)
    .sort((a, b) => a - b)
    .map(month => {
      const percentile = heightPercentiles.find(d => d.Month === month);
      const heightEntry = heightDataInMonths.find(d => d.month === month);
      return {
        month: month,
        ...(percentile && {
          P1: percentile.P1,
          P25: percentile.P25,
          P50: percentile.P50,
          P75: percentile.P75,
          P99: percentile.P99,
        }),
        ...(heightEntry && { actualHeight: heightEntry.height }),
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

          {/* Weight Percentile Chart */}
          <PercentileGraph
            title={t("Weight Percentiles")}
            combinedData={combinedWeightData}
            actualDataKey="actualWeight"
            yAxisLabel="Weight (kg)"
            yDomain={[2, 12]}
            yTicks={[2, 4, 6, 8, 10, 12]}
            xTicks={Array.from({ length: 13 }, (_, i) => i)}
            actualColor="#8b5cf6"
            actualName={t("Actual Weight")}
            labelAtMonth="12"
          />

          {/* Height Percentile Chart */}
          <PercentileGraph
            title={t("Height Percentiles")}
            combinedData={combinedHeightData}
            actualDataKey="actualHeight"
            yAxisLabel="Height (cm)"
            yDomain={[44, 96]}
            yTicks={[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]}
            xTicks={Array.from({ length: 13 }, (_, i) => i)}
            actualColor="#f59e0b"
            actualName={t("Actual Height")}
            labelAtMonth="12"
          />

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
