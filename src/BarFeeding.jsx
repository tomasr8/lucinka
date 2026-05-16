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
    const monthlyGroups = {};
    dailyData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString(i18n.language || "en", {
        year: "numeric",
        month: "long",
      });

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { monthKey, monthLabel, days: [] };
      }

      const feedCount = day.sessions.filter(s => !s.is_pumped && !s.is_solid).length;
      const solidCount = day.sessions.filter(s => !!s.is_solid).length;

      if (feedCount === 0 && solidCount === 0) return;

      monthlyGroups[monthKey].days.push({
        date: date.toLocaleDateString(i18n.language || "en", {
          month: "short",
          day: "numeric",
        }),
        FeedCount: feedCount,
        SolidCount: solidCount,
        fullDate: date,
      });
    });

    return Object.values(monthlyGroups)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(month => ({
        ...month,
        days: month.days.sort((a, b) => a.fullDate - b.fullDate),
        totalFeedCount: month.days.reduce((sum, day) => sum + day.FeedCount, 0),
        totalSolidCount: month.days.reduce((sum, day) => sum + day.SolidCount, 0),
      }));
  }, [dailyData, i18n.language]);

  const currentMonth = monthlyCharts.length > 0 ? monthlyCharts[0] : null;
  const otherMonths = monthlyCharts.slice(1);

  const renderMonthChart = (month, isCurrentMonth = false) => (
    <div
      key={month.monthKey}
      className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-3 md:p-4 ${
        isCurrentMonth ? 'border-2 border-pink-500' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h3 className={`text-base md:text-lg font-semibold ${
          isCurrentMonth
            ? 'text-pink-600 dark:text-pink-400'
            : 'text-gray-700 dark:text-gray-200'
        }`}>
          {month.monthLabel} {isCurrentMonth && '(Current)'}
        </h3>
      </div>

      <div style={{ width: "100%", height: 250 }} className="md:h-[300px]">
        <ResponsiveContainer>
          <BarChart data={month.days} barGap={2}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              dataKey="date"
              stroke={darkMode ? "#9ca3af" : "#6b7280"}
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              stroke={darkMode ? "#9ca3af" : "#6b7280"}
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              label={{
                value: t("Sessions"),
                angle: -90,
                position: "insideLeft",
                fill: darkMode ? "#9ca3af" : "#6b7280",
                style: { fontSize: '11px' }
              }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                borderRadius: "0.5rem",
                color: darkMode ? "#f3f4f6" : "#111827",
                fontSize: "11px",
              }}
              formatter={(value, name) => [value, t(name)]}
            />
            <Bar dataKey="FeedCount" name="Feedings" fill="#ec4899" />
            <Bar dataKey="SolidCount" name="Solid Food" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm mt-3 md:mt-4 justify-center">
        <span className="text-gray-600 dark:text-gray-300">
          <span className="inline-block w-3 h-3 bg-pink-500 rounded mr-1"></span>
          {t("Feedings")}: {month.totalFeedCount}
        </span>
        <span className="text-gray-600 dark:text-gray-300">
          <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
          {t("Solid Food")}: {month.totalSolidCount}
        </span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          {t("Total")}: {month.totalFeedCount + month.totalSolidCount}
        </span>
      </div>
    </div>
  );

  return (
    <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">
          {t("Daily Feeding - Monthly View")}
        </h2>

        {monthlyCharts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t("No data available")}
          </div>
        ) : (
          <>
            {currentMonth && (
              <div className="mb-6 md:mb-8">
                <div className="w-full md:max-w-4xl md:mx-auto">
                  {renderMonthChart(currentMonth, true)}
                </div>
              </div>
            )}

            {otherMonths.length > 0 && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
                  {t("Previous Months")}
                </h3>
                <div className="overflow-x-auto snap-x snap-mandatory -mx-4 md:mx-0">
                  <div className="flex gap-4 md:gap-6 pb-4 px-4 md:px-0">
                    {otherMonths.map((month) => (
                      <div key={month.monthKey} className="w-full md:w-[600px] flex-shrink-0 snap-center">
                        {renderMonthChart(month, false)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
