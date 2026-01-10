import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  AlertCircle,
  Trash2,
  Calendar,
  Play,
  Square,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Header from "./Header";
import { useData } from "./util";

const ACTIVITY_TYPES = {
  sleeping: { label: "Sleeping", color: "#3b82f6", icon: "😴" },
  tummy_time: { label: "Tummy Time", color: "#10b981", icon: "🤸" },
  walking: { label: "Walking", color: "#f59e0b", icon: "🚶" },
  eating: { label: "Eating", color: "#ec4899", icon: "🍼" },
};

export default function ActivitiesPage() {
  const { t, i18n } = useTranslation();
  const {
    data: { activities = [], breastfeeding = [], user },
    loading,
    refetch,
  } = useData("activities", "breastfeeding");
  const isAdmin = user?.is_admin;

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    activity_type: "sleeping",
    start_dt: "",
    end_dt: "",
  });
  const [expandedDays, setExpandedDays] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const logActivityStart = async (activityType) => {
    const now = new Date();

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: activityType,
          start_dt: now.toISOString(),
          end_dt: null,
        }),
      });

      if (res.ok) {
        refetch();
        setSuccessMessage(`${ACTIVITY_TYPES[activityType].label} started!`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error starting activity:", error);
      setSuccessMessage("Failed to start activity");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const logActivityEnd = async (activityId) => {
    const now = new Date();

    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          end_dt: now.toISOString(),
        }),
      });

      if (res.ok) {
        refetch();
        setSuccessMessage("Activity completed!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error ending activity:", error);
      setSuccessMessage("Failed to end activity");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refetch();
        setSuccessMessage("Activity deleted successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualEntry.start_dt || !manualEntry.end_dt) {
      setSuccessMessage("Please fill in both start and end times");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: manualEntry.activity_type,
          start_dt: new Date(manualEntry.start_dt).toISOString(),
          end_dt: new Date(manualEntry.end_dt).toISOString(),
        }),
      });

      if (res.ok) {
        refetch();
        setSuccessMessage("Activity added successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowManualEntry(false);
        setManualEntry({
          activity_type: "sleeping",
          start_dt: "",
          end_dt: "",
        });
      }
    } catch (error) {
      console.error("Error adding manual activity:", error);
      setSuccessMessage("Failed to add activity");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const toggleDay = (dayKey) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  // Helper function to adjust timezone for displaying old data
  const addHours = (date, hours) => {
    const hoursToAdd = hours * 60 * 60 * 1000;
    date.setTime(date.getTime() + hoursToAdd);
    return date;
  };

  // Combine activities and eating sessions (from breastfeeding data)
  const combinedActivities = [
    ...activities,
    ...breastfeeding
      .filter((session) => !session.is_pumped) // Exclude pumped sessions
      .map((session) => ({
        id: `eating-${session.id}`,
        activity_type: "eating",
        start_dt: session.start_dt,
        end_dt: session.end_dt,
        from_breastfeeding: true,
      })),
  ].sort((a, b) => new Date(b.start_dt) - new Date(a.start_dt));

  // Get ongoing activities (only from activities, not eating)
  const ongoingActivities = activities.filter((activity) => !activity.end_dt);

  // Prepare data for the horizontal stacked bar chart
  const prepareChartData = () => {
    const dayMap = {};

    combinedActivities.forEach((activity) => {
      // Only include activities with both start and end times in the chart
      if (!activity.end_dt) return;

      const startDate = addHours(new Date(activity.start_dt), 1);
      const endDate = addHours(new Date(activity.end_dt), 1);
      const dayKey = startDate.toISOString().split("T")[0];

      // Filter by selected month
      const [year, month] = selectedMonth.split('-');
      if (startDate.getFullYear() !== parseInt(year) || startDate.getMonth() + 1 !== parseInt(month)) {
        return;
      }

      if (!dayMap[dayKey]) {
        dayMap[dayKey] = {
          date: dayKey,
          displayDate: startDate.toLocaleDateString(i18n.language || "en", {
            month: "short",
            day: "numeric",
          }),
          fullDate: startDate.toLocaleDateString(i18n.language || "en", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          activities: [],
        };
      }

      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      let durationMinutes = endMinutes - startMinutes;

      // Handle activities that span midnight
      if (durationMinutes < 0) {
        durationMinutes = (24 * 60) - startMinutes + endMinutes;
      }

      // Ensure minimum duration for visibility
      if (durationMinutes < 1) {
        durationMinutes = 1;
      }

      dayMap[dayKey].activities.push({
        type: activity.activity_type,
        start: startMinutes,
        duration: durationMinutes,
        startTime: startDate,
        endTime: endDate,
      });
    });

    // Sort by date descending (most recent first)
    return Object.values(dayMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const chartData = prepareChartData();

  // Calculate statistics for the displayed period
  const calculateStatistics = () => {
    const stats = {
      totalActivities: 0,
      byType: {},
      totalDuration: 0,
    };

    Object.keys(ACTIVITY_TYPES).forEach(type => {
      stats.byType[type] = { count: 0, duration: 0 };
    });

    chartData.forEach(day => {
      day.activities.forEach(activity => {
        stats.totalActivities++;
        stats.totalDuration += activity.duration;
        if (stats.byType[activity.type]) {
          stats.byType[activity.type].count++;
          stats.byType[activity.type].duration += activity.duration;
        }
      });
    });

    return stats;
  };

  const statistics = calculateStatistics();

  // Get available months from activities
  const getAvailableMonths = () => {
    const months = new Set();
    combinedActivities.forEach(activity => {
      if (!activity.end_dt) return;
      const startDate = addHours(new Date(activity.start_dt), 1);
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  };

  const availableMonths = getAvailableMonths();

  // Group activities by day for accordion display
  const groupActivitiesByDay = () => {
    const dayMap = {};

    combinedActivities.forEach((activity) => {
      const startDate = addHours(new Date(activity.start_dt), 1);
      const dayKey = startDate.toISOString().split("T")[0];

      // For non-admin users, only show activities from selected month
      if (!isAdmin) {
        const [year, month] = selectedMonth.split('-');
        if (startDate.getFullYear() !== parseInt(year) || startDate.getMonth() + 1 !== parseInt(month)) {
          return;
        }
      }

      if (!dayMap[dayKey]) {
        dayMap[dayKey] = {
          date: dayKey,
          displayDate: startDate.toLocaleDateString(i18n.language || "en", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          activities: [],
        };
      }

      dayMap[dayKey].activities.push(activity);
    });

    // Sort by date descending
    return Object.values(dayMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const activitiesByDay = groupActivitiesByDay();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-6xl mx-auto p-3 md:p-6">
          <Header isAdmin={isAdmin} />
          <div className="mb-6">
            <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
              {t("Activities")}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-3 md:p-6">
        <Header isAdmin={isAdmin} />

        {showSuccess && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`${
                successMessage.includes("Failed")
                  ? "bg-red-500"
                  : "bg-green-500"
              } text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3`}
            >
              {successMessage.includes("Failed") ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
              <div>
                <p className="font-semibold">
                  {successMessage.includes("Failed") ? "Error!" : "Success!"}
                </p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 md:mb-6">
          <h1 className="dark:text-white text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {t("Activities")}
          </h1>
          <p className="dark:text-white text-sm md:text-base text-gray-600">
            {t("Track daily activities")}
          </p>
        </div>

        {/* Start Activity Buttons */}
        {isAdmin && (
          <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold dark:text-white text-gray-800 mb-4">
              {t("Log Activity Start")}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(ACTIVITY_TYPES)
                .filter(([key]) => key !== "eating") // Exclude eating
                .map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => logActivityStart(key)}
                    className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg flex flex-col items-center gap-2"
                  >
                    <Play className="w-6 h-6" />
                    <div className="text-4xl">{value.icon}</div>
                    <div className="font-semibold">{t(value.label)}</div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Ongoing Activities */}
        {isAdmin && ongoingActivities.length > 0 && (
          <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4">
              {t("Ongoing Activities")} ({ongoingActivities.length})
            </h2>

            <div className="space-y-3">
              {ongoingActivities.map((activity) => {
                const startDate = addHours(new Date(activity.start_dt), 1);
                const activityInfo = ACTIVITY_TYPES[activity.activity_type];

                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 dark:bg-gray-700 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: activityInfo?.color }}
                      >
                        {activityInfo?.icon}
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white text-gray-800">
                          {t(activityInfo?.label || activity.activity_type)}
                        </p>
                        <p className="text-sm dark:text-gray-300 text-gray-600">
                          {t("Started at")}{" "}
                          {startDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => logActivityEnd(activity.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      {t("End")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Timeline Chart */}
        {chartData.length > 0 && (
          <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-lg md:text-xl font-bold dark:text-white text-gray-800">
                {t("Activity Timeline")}
              </h2>

              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto px-3 md:px-4 py-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              >
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                  const monthLabel = date.toLocaleDateString(i18n.language || "en", {
                    year: "numeric",
                    month: "long",
                  });
                  return (
                    <option key={month} value={month}>
                      {monthLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="dark:bg-gray-700 bg-gray-50 rounded-lg p-4">
                <p className="text-sm dark:text-gray-400 text-gray-600">{t("Total Activities")}</p>
                <p className="text-2xl font-bold dark:text-white text-gray-800">{statistics.totalActivities}</p>
              </div>
              <div className="dark:bg-gray-700 bg-gray-50 rounded-lg p-4">
                <p className="text-sm dark:text-gray-400 text-gray-600">{t("Total Time")}</p>
                <p className="text-2xl font-bold dark:text-white text-gray-800">
                  {Math.round(statistics.totalDuration / 60)}h
                </p>
              </div>
              <div className="dark:bg-gray-700 bg-gray-50 rounded-lg p-4">
                <p className="text-sm dark:text-gray-400 text-gray-600">{t("Days")}</p>
                <p className="text-2xl font-bold dark:text-white text-gray-800">{chartData.length}</p>
              </div>
              <div className="dark:bg-gray-700 bg-gray-50 rounded-lg p-4">
                <p className="text-sm dark:text-gray-400 text-gray-600">{t("Avg per Day")}</p>
                <p className="text-2xl font-bold dark:text-white text-gray-800">
                  {chartData.length > 0 ? Math.round(statistics.totalActivities / chartData.length) : 0}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 justify-center">
              {Object.entries(ACTIVITY_TYPES).map(([key, value]) => {
                const typeStats = statistics.byType[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: value.color }}
                    />
                    <span className="text-sm dark:text-gray-300 text-gray-700">
                      {value.icon} {t(value.label)} ({typeStats.count})
                    </span>
                  </div>
                );
              })}
            </div>

            <div>
              <svg
                viewBox={`0 0 ${900} ${chartData.length * 60 + 80}`}
                className="w-full"
                preserveAspectRatio="xMinYMin meet"
              >
                {/* Time axis labels (top) */}
                {[0, 4, 8, 12, 16, 20, 24].map(hour => {
                  const x = 100 + (hour / 24) * 800;
                  return (
                    <g key={`hour-${hour}`}>
                      <text
                        x={x}
                        y={20}
                        textAnchor="middle"
                        className="text-xs fill-gray-600 dark:fill-gray-300"
                      >
                        {hour.toString().padStart(2, '0')}:00
                      </text>
                      <line
                        x1={x}
                        y1={30}
                        x2={x}
                        y2={chartData.length * 60 + 50}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.3"
                      />
                    </g>
                  );
                })}

                {/* Day rows */}
                {chartData.map((day, dayIndex) => {
                  const y = 50 + dayIndex * 60;
                  const barHeight = 40;

                  return (
                    <g key={day.date}>
                      {/* Day label */}
                      <text
                        x={10}
                        y={y + barHeight / 2}
                        dominantBaseline="middle"
                        className="text-xs md:text-sm fill-gray-700 dark:fill-gray-200"
                      >
                        {day.displayDate}
                      </text>

                      {/* Background bar */}
                      <rect
                        x={100}
                        y={y}
                        width={800}
                        height={barHeight}
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />

                      {/* Activity bars */}
                      {day.activities.map((activity, idx) => {
                        // Convert minutes to pixels (800px = 1440 minutes = 24 hours)
                        const startX = 100 + (activity.start / 1440) * 800;
                        const barWidth = Math.max((activity.duration / 1440) * 800, 3);
                        const color = ACTIVITY_TYPES[activity.type]?.color || "#6b7280";

                        return (
                          <rect
                            key={`${day.date}-${activity.type}-${idx}`}
                            x={startX}
                            y={y + 2}
                            width={barWidth}
                            height={barHeight - 4}
                            fill={color}
                            opacity={0.9}
                            stroke="#fff"
                            strokeWidth={0.5}
                            rx={2}
                          >
                            <title>
                              {ACTIVITY_TYPES[activity.type]?.label || activity.type}
                              {"\n"}
                              {activity.startTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {activity.endTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </title>
                          </rect>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Manual Entry Form */}
        {isAdmin && showManualEntry && (
          <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4">
              {t("Add Activity Manually")}
            </h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                  {t("Activity Type")}
                </label>
                <select
                  value={manualEntry.activity_type}
                  onChange={(e) =>
                    setManualEntry({ ...manualEntry, activity_type: e.target.value })
                  }
                  className="w-full p-3 border dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(ACTIVITY_TYPES)
                    .filter(([key]) => key !== "eating")
                    .map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {t(value.label)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                  {t("Start Time")}
                </label>
                <input
                  type="datetime-local"
                  value={manualEntry.start_dt}
                  onChange={(e) =>
                    setManualEntry({ ...manualEntry, start_dt: e.target.value })
                  }
                  className="w-full p-3 border dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                  {t("End Time")}
                </label>
                <input
                  type="datetime-local"
                  value={manualEntry.end_dt}
                  onChange={(e) =>
                    setManualEntry({ ...manualEntry, end_dt: e.target.value })
                  }
                  className="w-full p-3 border dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-lg"
                >
                  {t("Add Activity")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualEntry(false)}
                  className="px-6 py-3 border dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("Cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activities by Day - Accordion */}
        <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white text-gray-800">
              {t("Activities by Day")}
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow"
              >
                <Plus className="w-5 h-5" />
                {t("Add Manually")}
              </button>
            )}
          </div>

          {activitiesByDay.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="dark:text-gray-500 text-gray-500 text-lg">
                {t("No activities logged yet")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activitiesByDay.map((day) => (
                <div
                  key={day.date}
                  className="border dark:border-gray-700 border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleDay(day.date)}
                    className="w-full flex items-center justify-between p-4 dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 dark:text-gray-300 text-gray-600" />
                      <div className="text-left">
                        <p className="font-semibold dark:text-white text-gray-800">
                          {day.displayDate}
                        </p>
                        <p className="text-sm dark:text-gray-400 text-gray-600">
                          {day.activities.length} {t("activities")}
                        </p>
                      </div>
                    </div>
                    {expandedDays[day.date] ? (
                      <ChevronUp className="w-5 h-5 dark:text-gray-300 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 dark:text-gray-300 text-gray-600" />
                    )}
                  </button>

                  {expandedDays[day.date] && (
                    <div className="border-t dark:border-gray-700 border-gray-200 p-4 space-y-2">
                      {day.activities.map((activity) => {
                        const startDate = addHours(new Date(activity.start_dt), 1);
                        const endDate = activity.end_dt
                          ? addHours(new Date(activity.end_dt), 1)
                          : null;
                        const activityInfo = ACTIVITY_TYPES[activity.activity_type];

                        return (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 dark:bg-gray-800 bg-white rounded-lg border dark:border-gray-700 border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                style={{ backgroundColor: activityInfo?.color }}
                              >
                                {activityInfo?.icon}
                              </div>
                              <div>
                                <p className="font-semibold dark:text-white text-gray-800 text-sm">
                                  {t(activityInfo?.label || activity.activity_type)}
                                </p>
                                <p className="text-xs dark:text-gray-400 text-gray-600">
                                  {startDate.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {endDate && (
                                    <>
                                      {" - "}
                                      {endDate.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </>
                                  )}
                                  {!endDate && ` (${t("In progress")})`}
                                </p>
                              </div>
                            </div>
                            {isAdmin && !activity.from_breastfeeding && (
                              <button
                                onClick={() => handleDeleteActivity(activity.id)}
                                className="p-2 dark:text-red-400 text-red-500 dark:hover:bg-red-900/20 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
