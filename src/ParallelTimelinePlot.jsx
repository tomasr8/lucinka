import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "./util";

export default function ParallelTimelinePlot({ sessions }) {
  const {
    data: { user },
    loading,
    refetch,
  } = useData("breastfeeding");
  const { t, i18n } = useTranslation();

  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Group sessions by month and organize by day
    const monthlyGroups = {};

    // Helper function to adjust timezone for displaying old data
    const addHours = (date, hours) => {
      const hoursToAdd = hours * 60 * 60 * 1000;
      date.setTime(date.getTime() + hoursToAdd);
      return date;
    };

    // First, organize sessions by month and day
    const sessionsByMonthDay = {};

    sessions.forEach(session => {
      const startDate = addHours(new Date(session.start_dt), 1);
      const monthKey = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const dayKey = startDate.toDateString();

      if (!sessionsByMonthDay[monthKey]) {
        sessionsByMonthDay[monthKey] = {};
      }
      if (!sessionsByMonthDay[monthKey][dayKey]) {
        sessionsByMonthDay[monthKey][dayKey] = [];
      }

      const startHour = Math.round(startDate.getHours() + startDate.getMinutes() / 60);
      const duration = session.right_duration + session.left_duration;

      sessionsByMonthDay[monthKey][dayKey].push({
        time: startHour,
        duration,
        date: startDate,
        side: session.right_duration > 0 && session.left_duration > 0
          ? 'both'
          : session.right_duration > 0
            ? 'right'
            : 'left',
      });
    });

    // Sort sessions within each day by time
    Object.values(sessionsByMonthDay).forEach(month => {
      Object.keys(month).forEach(dayKey => {
        month[dayKey].sort((a, b) => a.time - b.time);
      });
    });

    // Process each month
    const processedData = Object.entries(sessionsByMonthDay).map(([monthKey, days]) => {
      // Get all days sorted chronologically
      const sortedDays = Object.entries(days).sort((a, b) =>
        new Date(a[0]) - new Date(b[0])
      );

      // Find max sessions per day to determine how many axes we need
      const maxSessionsPerDay = Math.max(...sortedDays.map(([_, sessions]) => sessions.length));

      // Create parallel coordinates data structure
      // Each axis represents a session position (1st session, 2nd session, etc.)
      const parallelData = [];

      // For each session position (axis)
      for (let sessionIdx = 0; sessionIdx < maxSessionsPerDay; sessionIdx++) {
        // Count frequency of each hour at this session position
        const hourFrequency = {};

        sortedDays.forEach(([dayKey, daySessions]) => {
          if (daySessions[sessionIdx]) {
            const hour = daySessions[sessionIdx].time;
            if (!hourFrequency[hour]) {
              hourFrequency[hour] = { count: 0 };
            }
            hourFrequency[hour].count++;
          }
        });

        parallelData.push({
          sessionIndex: sessionIdx,
          hourFrequency, // { hour: { count: number } }
        });
      }

      // Create connections between consecutive axes
      const connections = [];
      for (let axisIdx = 0; axisIdx < parallelData.length - 1; axisIdx++) {
        // For each transition from axis[i] to axis[i+1]
        const transitionFrequency = {}; // { "hour1->hour2": { count } }

        sortedDays.forEach(([dayKey, daySessions]) => {
          if (daySessions[axisIdx] && daySessions[axisIdx + 1]) {
            const fromHour = daySessions[axisIdx].time;
            const toHour = daySessions[axisIdx + 1].time;
            const key = `${fromHour}->${toHour}`;

            if (!transitionFrequency[key]) {
              transitionFrequency[key] = { count: 0, fromHour, toHour };
            }
            transitionFrequency[key].count++;
          }
        });

        connections.push({
          fromAxis: axisIdx,
          toAxis: axisIdx + 1,
          transitions: Object.values(transitionFrequency),
        });
      }

      const firstSession = sortedDays[0]?.[1]?.[0];
      return {
        monthKey,
        monthLabel: firstSession?.date.toLocaleDateString(i18n.language || "en", {
          year: "numeric",
          month: "long",
        }) || monthKey,
        parallelData,
        connections,
        totalDays: sortedDays.length,
      };
    }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    setMonthlyData(processedData);
    refetch();
  }, [sessions, i18n.language]);

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

  const renderMonthChart = (month, isCurrentMonth = false) => {
    if (!month.parallelData || month.parallelData.length === 0) {
      return null;
    }

    // Calculate chart dimensions based on this month's data only
    const hourHeight = 20; // pixels per hour
    const axisSpacing = 100; // spacing between parallel axes
    const chartHeight = 24 * hourHeight;
    const chartWidth = Math.max((month.parallelData.length - 1) * axisSpacing, 200);
    const leftMargin = 60;
    const topMargin = 40;

    // Single color for all lines - overlapping creates natural heat map
    const lineColor = '#ec4899'; // pink

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

        <div style={{ height: `${chartHeight + topMargin + 40}px` }}>
          <svg
            viewBox={`0 0 ${chartWidth + leftMargin + 40} ${chartHeight + topMargin + 40}`}
            className="w-full h-full mx-auto"
            preserveAspectRatio="none"
          >
            {/* Y-axis (time) labels - only on the left */}
            {Array.from({ length: 25 }, (_, i) => i).map(hour => {
              // Y-axis: 24h at top, 0h at bottom (inverted for better daily visualization)
              const y = topMargin + (24 - hour) * hourHeight;

              return (
                <g key={`hour-${hour}`}>
                  <text
                    x={leftMargin - 10}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-300"
                  >
                    {hour}:00
                  </text>
                  <line
                    x1={leftMargin}
                    y1={y}
                    x2={chartWidth + leftMargin}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.3"
                  />
                </g>
              );
            })}

            {/* Draw connections between axes */}
            {month.connections.map((connection, connIdx) => {
              const fromX = leftMargin + connection.fromAxis * axisSpacing;
              const toX = leftMargin + connection.toAxis * axisSpacing;

              return (
                <g key={`connection-${connIdx}`}>
                  {connection.transitions.map((transition, transIdx) => {
                    // Y-axis: 24h at top, 0h at bottom (inverted for better daily visualization)
                    const fromY = topMargin + (24 - transition.fromHour) * hourHeight;
                    const toY = topMargin + (24 - transition.toHour) * hourHeight;

                    // Line width based on frequency (1-10 range)
                    const strokeWidth = Math.max(1, Math.min(10, transition.count * 2));

                    return (
                      <line
                        key={`transition-${connIdx}-${transIdx}`}
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        opacity="0.6"
                        strokeLinecap="round"
                      >
                        <title>
                          {transition.fromHour}h → {transition.toHour}h ({transition.count} {t("times")})
                        </title>
                      </line>
                    );
                  })}
                </g>
              );
            })}

            {/* Draw vertical axes */}
            {month.parallelData.map((axis, axisIdx) => {
              const x = leftMargin + axisIdx * axisSpacing;

              return (
                <g key={`axis-${axisIdx}`}>
                  {/* Axis label */}
                  <text
                    x={x}
                    y={topMargin - 20}
                    textAnchor="middle"
                    className="text-sm fill-gray-700 dark:fill-gray-200 font-semibold"
                  >
                    #{axisIdx + 1}
                  </text>

                  {/* Vertical axis line */}
                  <line
                    x1={x}
                    y1={topMargin}
                    x2={x}
                    y2={topMargin + chartHeight}
                    stroke="#6b7280"
                    strokeWidth="2"
                  />

                  {/* Frequency markers on the axis */}
                  {Object.entries(axis.hourFrequency).map(([hour, data]) => {
                    // Y-axis: 24h at top, 0h at bottom (inverted for better daily visualization)
                    const y = topMargin + (24 - parseInt(hour)) * hourHeight;
                    const radius = Math.max(3, Math.min(8, data.count * 1.5));

                    return (
                      <circle
                        key={`marker-${axisIdx}-${hour}`}
                        cx={x}
                        cy={y}
                        r={radius}
                        fill="#ec4899"
                        opacity="0.8"
                      >
                        <title>
                          {hour}h: {data.count} {t("times")}
                        </title>
                      </circle>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Statistics */}
        <div className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-4">
          {t("Total:")}{" "}
          {month.totalDays} {t("days")}, {month.parallelData.length} {t("session positions")}
        </div>
      </div>
    );
  };

  return (
    <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">
          {t("Breastfeeding Timeline - Monthly View")}
        </h2>

        {monthlyData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t("No data available")}
          </div>
        ) : (
          <>
            {/* Current Month - Full Width at Top */}
            {currentMonth && (
              <div className="mb-6 md:mb-8">
                {renderMonthChart(currentMonth, true)}
              </div>
            )}

            {/* Other Months - Horizontal Scrollable */}
            {otherMonths.length > 0 && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
                  {t("Previous Months")}
                </h3>
                <div className="overflow-x-auto snap-x snap-mandatory -mx-3 md:-mx-4 lg:mx-0">
                  <div className="flex gap-4 md:gap-6 pb-4 px-3 md:px-4 lg:px-0">
                    {otherMonths.map(month => (
                      <div
                        key={month.monthKey}
                        className="flex-shrink-0 snap-center w-[85vw] md:w-[500px] lg:w-[600px]"
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
