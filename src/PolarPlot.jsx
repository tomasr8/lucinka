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

export default function BreastfeedingPolarChart({ sessions }) {
  const { t } = useTranslation();

  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    const monthlyGroups = {};

    sessions.forEach(session => {
      const date = new Date(session.start_dt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const hour = date.getHours();

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthLabel: date.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
          hourlyData: Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            hourLabel: `${h}h`,
            breastfeedingSessions: 0,
            solidSessions: 0,
            totalDuration: 0,
          })),
        };
      }

      if (session.is_solid) {
        monthlyGroups[monthKey].hourlyData[hour].solidSessions += 1;
      } else {
        monthlyGroups[monthKey].hourlyData[hour].breastfeedingSessions += 1;
        monthlyGroups[monthKey].hourlyData[hour].totalDuration +=
          (session.right_duration || 0) + (session.left_duration || 0);
      }
    });

    const processedData = Object.values(monthlyGroups)
      .map(month => {
        month.hourlyData.forEach(item => {
          item.avgDuration =
            item.breastfeedingSessions > 0
              ? Math.round(item.totalDuration / item.breastfeedingSessions)
              : 0;
        });
        return month;
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    setMonthlyData(processedData);
  }, [sessions]);

  const currentMonth = monthlyData.length > 0 ? monthlyData[0] : null;
  const otherMonths = monthlyData.slice(1);

  const renderMonthChart = (month, isCurrentMonth = false) => {
    const totalBreastfeeding = month.hourlyData.reduce((sum, h) => sum + h.breastfeedingSessions, 0);
    const totalSolid = month.hourlyData.reduce((sum, h) => sum + h.solidSessions, 0);
    const peakHour = month.hourlyData.reduce(
      (maxH, h) => (h.breastfeedingSessions + h.solidSessions) > (month.hourlyData[maxH].breastfeedingSessions + month.hourlyData[maxH].solidSessions) ? h.hour : maxH,
      0
    );

    return (
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
            />
            <Radar
              dataKey="breastfeedingSessions"
              stroke="#ec4899"
              fill="#ec4899"
              fillOpacity={0.6}
              name={t("Feedings")}
            />
            <Radar
              dataKey="solidSessions"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name={t("Solid Food")}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "11px",
              }}
              labelFormatter={label => `${t("Hour")}: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
          {totalBreastfeeding > 0 && (
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 mr-1"></span>
              {t("Feedings")}: {totalBreastfeeding}
            </span>
          )}
          {totalSolid > 0 && (
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
              {t("Solid Food")}: {totalSolid}
            </span>
          )}
          <span>{t("Peak Hour:")} {peakHour}h</span>
        </div>
      </div>
    );
  };

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
