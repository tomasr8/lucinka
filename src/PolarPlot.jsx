import React, { useState, useEffect } from "react";
import {
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useData } from "./util";

export default function BreastfeedingPolarChart({ sessions }) {
  const {
    data: { user },
    loading,
    refetch,
  } = useData("breastfeeding");
  const { t, i18n } = useTranslation();

  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Group sessions by month and hour
    const monthlyGroups = {};

    // Helper function to adjust timezone for displaying old data
    const addHours = (date, hours) => {
      const hoursToAdd = hours * 60 * 60 * 1000;
      date.setTime(date.getTime() + hoursToAdd);
      return date;
    };

    sessions.forEach(session => {
      // Create date object and adjust for timezone offset in old data
      const date = addHours(new Date(session.start_dt), 1);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const hour = date.getHours();

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthLabel: date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          }),
          hourlyData: Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            hourLabel: `${h}h`,
            sessions: 0,
            totalDuration: 0,
          })),
        };
      }

      monthlyGroups[monthKey].hourlyData[hour].sessions += 1;
      monthlyGroups[monthKey].hourlyData[hour].totalDuration +=
        session.right_duration + session.left_duration;
    });

    // Calculate average duration and sort by month (newest first)
    const processedData = Object.values(monthlyGroups)
      .map(month => {
        month.hourlyData.forEach(item => {
          item.avgDuration =
            item.sessions > 0
              ? Math.round(item.totalDuration / item.sessions)
              : 0;
        });
        return month;
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    setMonthlyData(processedData);
    refetch();
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("Loading data...")}</p>
        </div>
      </div>
    );
  }

  // Get current month and other months
  const currentMonth = monthlyData.length > 0 ? monthlyData[0] : null;
  const otherMonths = monthlyData.slice(1);

  const renderMonthChart = (month, isCurrentMonth = false) => (
    <div
      key={month.monthKey}
      className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-3 md:p-4 ${
        isCurrentMonth ? "border-2 border-pink-500" : ""
      }`}
    >
      <h3
        className={`text-base md:text-lg font-semibold ${
          isCurrentMonth
            ? "text-pink-600 dark:text-pink-400"
            : "text-gray-700 dark:text-gray-200"
        } mb-2 text-center`}
      >
        {t(month.monthLabel)}
      </h3>
      <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
        <RadarChart data={month.hourlyData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="hourLabel"
            tick={{ fill: "#ec4899", fontSize: 9 }}
            className="md:text-[10px]"
          />
          <Radar
            dataKey="sessions"
            stroke="#ec4899"
            fill="#ec4899"
            fillOpacity={0.6}
            name="Sessions"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px",
              fontSize: "11px",
            }}
            formatter={(value, name) => {
              if (name === "Sessions") return [value, "Sessions"];
              return [value, name];
            }}
            labelFormatter={label => `Hour: ${label}`}
          />
        </RadarChart>
      </ResponsiveContainer>
      {/* Statistics */}
      <div className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
        {t("Avg Duration:")}{" "}
        {Math.round(
          month.hourlyData.reduce((sum, h) => sum + h.totalDuration, 0) /
            Math.max(
              1,
              month.hourlyData.reduce((sum, h) => sum + h.sessions, 0)
            )
        )}{" "}
        {t("mins")}
      </div>
      <div className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
        {t("Peak Hour:")}{" "}
        {month.hourlyData.reduce(
          (maxHour, h) =>
            h.sessions > month.hourlyData[maxHour].sessions ? h.hour : maxHour,
          0
        )}
        h
      </div>
      <div className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
        {t("Low Hour:")}{" "}
        {month.hourlyData.reduce(
          (minHour, h) =>
            h.sessions < month.hourlyData[minHour].sessions ? h.hour : minHour,
          0
        )}
        h
      </div>
      <div className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-2">
        {t("Total:")} {month.hourlyData.reduce((sum, h) => sum + h.sessions, 0)}{" "}
        {t("sessions")}
      </div>
    </div>
  );

  return (
    <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">
          {t("Breastfeeding Sessions by Hour - Monthly View")}
        </h2>

        {monthlyData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t("No data available")}
          </div>
        ) : (
          <>
            {/* Current Month - Centered at Top */}
            {currentMonth && (
              <div className="mb-6 md:mb-8">
                <div className="w-full md:max-w-md md:mx-auto">
                  {renderMonthChart(currentMonth, true)}
                </div>
              </div>
            )}

            {/* Other Months - Horizontal Scrollable */}
            {otherMonths.length > 0 && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
                  {t("Previous Months")}
                </h3>
                <div className="overflow-x-auto snap-x snap-mandatory -mx-4 md:mx-0">
                  <div className="flex gap-4 md:gap-6 pb-4 px-4 md:px-0">
                    {otherMonths.map(month => (
                      <div
                        key={month.monthKey}
                        className="w-full md:w-[350px] flex-shrink-0 snap-center"
                      >
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
