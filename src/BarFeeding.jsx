import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useTheme } from "./theme.jsx";

export default function BarFeeding({ dailyData }) {
  const { t, i18n } = useTranslation();
  const { darkMode } = useTheme();

  const monthlyCharts = useMemo(() => {
    // Group daily data by month
    const monthlyGroups = {};

    dailyData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString(i18n.language || "en", {
        year: "numeric",
        month: "long",
      });

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthLabel,
          days: [],
        };
      }

      monthlyGroups[monthKey].days.push({
        date: date.toLocaleDateString(i18n.language || "en", {
          month: "short",
          day: "numeric",
        }),
        Left: Math.floor(day.leftTotal),
        Right: Math.floor(day.rightTotal),
        fullDate: date,
      });
    });

    // Sort months and days within each month
    return Object.values(monthlyGroups)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(month => ({
        ...month,
        days: month.days.sort((a, b) => a.fullDate - b.fullDate),
        totalLeft: month.days.reduce((sum, day) => sum + day.Left, 0),
        totalRight: month.days.reduce((sum, day) => sum + day.Right, 0),
      }));
  }, [dailyData, i18n.language]);

  return (
    <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {t("Daily Feeding Duration - Monthly View")}
        </h2>

        <div className="space-y-8">
          {monthlyCharts.map((month) => (
            <div
              key={month.monthKey}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {month.monthLabel}
                </h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    <span className="inline-block w-3 h-3 bg-pink-500 rounded mr-1"></span>
                    {t("Left")}: {month.totalLeft} {t("min")}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    <span className="inline-block w-3 h-3 bg-purple-500 rounded mr-1"></span>
                    {t("Right")}: {month.totalRight} {t("min")}
                  </span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {t("Total")}: {month.totalLeft + month.totalRight} {t("min")}
                  </span>
                </div>
              </div>

              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={month.days}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#374151" : "#e5e7eb"}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      label={{
                        value: t("Duration (minutes)"),
                        angle: -90,
                        position: "insideLeft",
                        fill: darkMode ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        color: darkMode ? "#f3f4f6" : "#111827",
                      }}
                      formatter={(value, name) => [
                        `${value} ${t("min")}`,
                        t(name),
                      ]}
                    />
                    <Bar dataKey="Left" stackId="a" fill="#ec4899" />
                    <Bar dataKey="Right" stackId="a" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {monthlyCharts.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t("No data available")}
          </div>
        )}
      </div>
    </div>
  );
}