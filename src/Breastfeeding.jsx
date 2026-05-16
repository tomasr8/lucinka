import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  Utensils,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import { useData } from "./util";

import BreastfeedingPolarChart from "./PolarPlot.jsx";

export default function BreastfeedingPage() {
  const { t, i18n } = useTranslation();
  const {
    data: { breastfeeding: sessions = [], user },
    loading,
    refetch,
  } = useData("breastfeeding");
  const isAdmin = user?.is_admin;

  const [foodStatuses, setFoodStatuses] = useState([]);

  const fetchFoodStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/food-status");
      if (res.ok) setFoodStatuses(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchFoodStatuses(); }, [fetchFoodStatuses]);

  const solidFoods = useMemo(() => {
    const foods = new Set();
    sessions.forEach(s => {
      if (s.is_solid && s.solid_food && s.solid_food.trim()) {
        foods.add(s.solid_food.trim().toLowerCase());
      }
    });
    return [...foods].sort();
  }, [sessions]);

  const foodStatusMap = useMemo(() => {
    const map = {};
    foodStatuses.forEach(fs => { map[fs.food_name.toLowerCase()] = fs.status; });
    return map;
  }, [foodStatuses]);


  const [expandedDays, setExpandedDays] = useState({});
  const toggleDay = (dateKey) => setExpandedDays(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [solidFoodList, setSolidFoodList] = useState([]);
  const [solidFoodInput, setSolidFoodInput] = useState("");
  // const [isBreast, setIsBreast] = useState(true);

  // Timer states
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeBreast, setActiveBreast] = useState(null); // 'left' or 'right'
  const [leftTime, setLeftTime] = useState(0);
  const [rightTime, setRightTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Manual entry states
  const now = new Date();
  const nowDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [newSession, setNewSession] = useState({
    date: nowDate,
    time: nowTime,
    breast_side: "left",
    is_pumped: false,
    is_breast: true,
    ml_amount: 0,
    is_solid: false,
    solid_food: "",
  });

  const [errors, setErrors] = useState({
    ml_amount: true,
  });

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && !isPaused && activeBreast) {
      interval = setInterval(() => {
        if (activeBreast === "left") {
          setLeftTime(time => time + 1);
        } else {
          setRightTime(time => time + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isPaused, activeBreast]);

  const startTimer = breast => {
    if (!isTimerActive) {
      setSessionStartTime(new Date());
    }
    setActiveBreast(breast);
    setIsTimerActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const switchBreast = () => {
    setActiveBreast(activeBreast === "left" ? "right" : "left");
  };

  const stopAndSaveTimer = () => {
    setIsPaused(true);
    if (!isTimerActive || (leftTime === 0 && rightTime === 0)) return;

    const now = new Date();
    const data = {
      start_dt: sessionStartTime.toISOString(),
      end_dt: now.toISOString(),
      left_duration: Math.floor(leftTime / 60),
      right_duration: Math.floor(rightTime / 60),
      is_pumped: newSession.is_pumped,
      is_breast: newSession.is_breast,
      ml_amount: newSession.ml_amount,
    };
    fetch("/api/breastfeeding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(() => {
        refetch();
        resetTimer();
        setSuccessMessage("Session saved successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      })
      .catch(error => {
        console.error("Error:", error);
        setSuccessMessage("Failed to save session");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      });
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setIsPaused(false);
    setActiveBreast(null);
    setLeftTime(0);
    setRightTime(0);
    setSessionStartTime(null);
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  const formatDuration = minutes => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  function formatRelativeTime(date) {
    const locale = i18n.language || "en";
    const style = "long";
    const rounding = "round";
    const now = Date.now();
    const diff = now - new Date(date);
    const seconds = Math.abs(diff) / 1000;

    const rtf = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
      style, // 'long', 'short', or 'narrow'
    });

    const units = [
      { name: "year", seconds: 31536000 },
      { name: "month", seconds: 2592000 },
      { name: "week", seconds: 604800 },
      { name: "day", seconds: 86400 },
      { name: "hour", seconds: 3600 },
      { name: "minute", seconds: 60 },
      { name: "second", seconds: 1 },
    ];

    // Find the most suitable unit
    for (const unit of units) {
      const value = seconds / unit.seconds;
      if (value >= 1) {
        const roundedValue =
          rounding === "round"
            ? Math.round(value)
            : rounding === "ceil"
            ? Math.ceil(value)
            : Math.floor(value);

        return rtf.format(-roundedValue, unit.name);
      }
    }

    // Less than a second
    return rtf.format(0, "second");
  }

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewSession(prev => ({ ...prev, [name]: value }));
    if (name === "ml_amount" && errors.ml_amount) {
      setErrors(prev => ({ ...prev, ml_amount: false }));
    }
  };

  const handleManualEntry = e => {
    e.preventDefault();

    const newErrors = {
      date: !newSession.date,
      time: !newSession.time,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      setSuccessMessage("Please fill in all required fields!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }

    if (newSession.is_solid && solidFoodList.length === 0) {
      setSuccessMessage("Please add at least one food!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }

    const startDt = new Date(`${newSession.date}T${newSession.time}`);
    const endDt = new Date(startDt);
    endDt.setMinutes(startDt.getMinutes() + 1);

    const leftDur = newSession.is_breast ? (newSession.breast_side === "right" ? 0 : 1) : 0;
    const rightDur = newSession.is_breast ? (newSession.breast_side === "left" ? 0 : 1) : 0;

    const basePayload = {
      start_dt: startDt.toISOString(),
      end_dt: endDt.toISOString(),
      left_duration: newSession.is_solid ? 0 : leftDur,
      right_duration: newSession.is_solid ? 0 : rightDur,
      is_pumped: false,
      is_breast: newSession.is_solid ? false : newSession.is_breast,
      ml_amount: newSession.is_solid ? 0 : parseFloat(newSession.ml_amount),
      is_solid: newSession.is_solid,
    };

    const requests = newSession.is_solid
      ? solidFoodList.map(food =>
          fetch("/api/breastfeeding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePayload, solid_food: food }),
          })
        )
      : [fetch("/api/breastfeeding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, solid_food: "" }),
        })];

    Promise.all(requests)
      .then(() => {
        refetch();
        setNewSession({
          date: "",
          time: "",
          breast_side: "left",
          is_pumped: false,
          is_breast: true,
          ml_amount: 0,
          is_solid: false,
          solid_food: "",
        });
        setSolidFoodList([]);
        setSolidFoodInput("");
        setErrors({ ml_amount: true });
        setIsManualModalOpen(false);
        setSuccessMessage("Session added successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      })
      .catch(error => {
        console.error("Error:", error);
        setSuccessMessage("Failed to add session");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      });
  };

  const handleDeleteSession = async id => {
    try {
      const res = await fetch(`/api/breastfeeding/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refetch();
        setSuccessMessage("Session deleted successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
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
          <div>
            <div>
              <div className="grid grid-cols-3 md:grid-cols-2 flex mb-8">
                <div className="mb-6">
                  <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
                    {t("Food")}
                  </h1>
                  <p className="dark:text-white text-gray-600">
                    {t("Breastfeeding over days")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const aggregateByDay = () => {
    const dayMap = {};
    sessions.forEach(session => {
      const leftDuration = !session.is_pumped ? Math.floor(session.left_duration || 0) : 0;
      const rightDuration = !session.is_pumped ? Math.floor(session.right_duration || 0) : 0;
      const mlAmount = !session.is_breast ? Math.floor(session.ml_amount || 0) : 0;

      const sessionDate = new Date(session.start_dt);
      const dateKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
      if (dayMap[dateKey]) {
        dayMap[dateKey].total += leftDuration + rightDuration;
        dayMap[dateKey].leftTotal += leftDuration;
        dayMap[dateKey].rightTotal += rightDuration;
        dayMap[dateKey].mlTotal += mlAmount;
        dayMap[dateKey].sessions.push(session);

      } else {
        dayMap[dateKey] = {
          total: leftDuration + rightDuration,
          leftTotal: leftDuration,
          rightTotal: rightDuration,
          mlTotal: mlAmount,
          sessions: [session],
        };
      }
    });

    return Object.entries(dayMap)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, data]) => ({ date, ...data }));
  };
  const cancelTimer = () => {
    resetTimer();
    setSuccessMessage("Session cancelled successfully!");
    setShowSuccess(true);
  };
  const dailyData = aggregateByDay();

  // Filter out pumped sessions for all displays and plots
  const nonPumpedSessions = sessions.filter(session => !session.is_pumped);

  // Get last non-pumped session for the card display
  const lastNonPumpedSession = nonPumpedSessions[0];

  const getFoodStatus = food => foodStatusMap[food] || "undecided";

  const updateFoodStatus = async (foodName, newStatus) => {
    await fetch("/api/food-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ food_name: foodName, status: newStatus }),
    });
    fetchFoodStatuses();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Header isAdmin={isAdmin} />
        <div>
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50">
              <div
                className={`${
                  successMessage.includes("required") ||
                  successMessage.includes("Failed") ||
                  successMessage.includes("must be")
                    ? "bg-red-500"
                    : "bg-green-500"
                } text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3`}
              >
                {successMessage.includes("required") ||
                successMessage.includes("Failed") ||
                successMessage.includes("must be") ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
                <div>
                  <p className="font-semibold">
                    {successMessage.includes("required") ||
                    successMessage.includes("Failed") ||
                    successMessage.includes("must be")
                      ? "Error!"
                      : "Success!"}
                  </p>
                  <p className="text-sm">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            {dailyData.length > 0 ? (
              <div className="flex grid md:grid-cols-3 grid-cols-1 md:text-left mb-8">
                <div className="mb-6">
                  <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
                    {t("Food")}
                  </h1>
                  <p className="dark:text-white text-gray-600">
                    {t("Breastfeeding over days")}
                  </p>
                </div>
                <div></div>
                {lastNonPumpedSession && (
                  <div className="flex justify-center dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6 mb-2">
                    <p
                      className={`justify-end md:text-3xl text-xl font-bold text-gray-900 dark:text-gray-100`}
                    >
                      {t("Last session")}:{" "}
                      {new Date(lastNonPumpedSession.end_dt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}{" "}
                      <br />
                      {t("About")}{" "}
                      {formatRelativeTime(
                        new Date(lastNonPumpedSession.end_dt)
                      )}
                      <br />
                      {t("Side")}:{" "}
                      {lastNonPumpedSession.left_duration === 0
                        ? t("right")
                        : lastNonPumpedSession.right_duration === 0
                        ? t("left")
                        : t("both")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t("No breastfeeding data available")}
                </p>
              </div>
            )}
            {/* Timer Section */}
            {isAdmin && (
              <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4">
                  {t("Active Session")}
                </h2>

                {/* Breast Selection Buttons */}
                {!isTimerActive && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => startTimer("left")}
                      className="p-8 bg-gradient-to-br from-pink-400 to-pink-500 text-white rounded-xl hover:from-pink-500 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                    >
                      <div className="text-4xl font-bold mb-2">L</div>
                      <div className="text-sm">{t("Left Breast")}</div>
                    </button>
                    <button
                      onClick={() => startTimer("right")}
                      className="p-8 bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                    >
                      <div className="text-4xl font-bold mb-2">R</div>
                      <div className="text-sm">{t("Right Breast")}</div>
                    </button>
                  </div>
                )}

                {/* Active Timer Display */}
                {isTimerActive && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 md:p-5 rounded-xl ${
                          activeBreast === "left"
                            ? "bg-pink-100 border-2 border-pink-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="text-xs md:text-sm text-gray-600 mb-1">
                          {t("Left Breast")}
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-800">
                          {formatTime(leftTime)}
                        </div>
                      </div>
                      <div
                        className={`p-3 md:p-5 rounded-xl ${
                          activeBreast === "right"
                            ? "bg-purple-100 border-2 border-purple-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="text-xs md:text-sm text-gray-600 mb-1">
                          {t("Right Breast")}
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-800">
                          {formatTime(rightTime)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        onClick={pauseTimer}
                        className="px-3 py-2 md:py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-all flex items-center justify-center gap-1 text-sm"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {isPaused ? t("Resume") : t("Pause")}
                      </button>
                      <button
                        onClick={switchBreast}
                        className="px-3 py-2 md:py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all text-sm"
                      >
                        {t("Switch Breast")}
                      </button>
                      <button
                        onClick={() => cancelTimer()}
                        className="px-3 py-2 md:py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all text-sm"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        onClick={stopAndSaveTimer}
                        className="px-3 py-2 md:py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-1 text-sm"
                      >
                        <Square className="w-4 h-4" />
                        {t("Stop & Save")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Entry Button */}
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="w-full mt-4 px-6 py-3 dark:bg-gray-400 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {t("Manual Entry")}
                </button>
              </div>
            )}
            {/* Polar chart */}
            <div className="mb-6">
              <BreastfeedingPolarChart sessions={nonPumpedSessions} />
            </div>

            {/* Food Journal */}
            {solidFoods.length > 0 && (
              <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
                <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4">
                  {t("Food Journal")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: "undecided", label: t("Undecided"), color: "bg-gray-400", ring: "border-gray-300 dark:border-gray-600" },
                    { key: "ok",        label: t("OK"),         color: "bg-green-500", ring: "border-green-300 dark:border-green-700" },
                    { key: "not_ok",    label: t("Not OK"),     color: "bg-red-500",   ring: "border-red-300 dark:border-red-700" },
                  ].map(col => (
                    <div key={col.key} className={`rounded-xl border-2 ${col.ring} p-3`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-3 h-3 rounded-full ${col.color} flex-shrink-0`}></span>
                        <h3 className="font-semibold text-sm md:text-base text-gray-700 dark:text-gray-200">
                          {col.label}
                        </h3>
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {solidFoods.filter(f => getFoodStatus(f) === col.key).length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {solidFoods.filter(f => getFoodStatus(f) === col.key).map(food => (
                          <div
                            key={food}
                            className="flex items-center justify-between gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                          >
                            <span className="text-xs md:text-sm font-medium dark:text-white text-gray-800 truncate leading-tight">
                              {food}
                            </span>
                            {isAdmin && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  title={t("OK")}
                                  onClick={() => updateFoodStatus(food, getFoodStatus(food) === "ok" ? "undecided" : "ok")}
                                  className={`p-1 rounded-md transition-colors ${
                                    getFoodStatus(food) === "ok"
                                      ? "bg-green-500 text-white"
                                      : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  title={t("Not OK")}
                                  onClick={() => updateFoodStatus(food, getFoodStatus(food) === "not_ok" ? "undecided" : "not_ok")}
                                  className={`p-1 rounded-md transition-colors ${
                                    getFoodStatus(food) === "not_ok"
                                      ? "bg-red-500 text-white"
                                      : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  }`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {solidFoods.filter(f => getFoodStatus(f) === col.key).length === 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">—</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Sessions */}
            <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6">
              {dailyData.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="dark:text-gray-500 text-gray-500 text-lg">{t("No sessions logged yet")}</p>
                  <p className="dark:text-gray-400 text-gray-400 text-sm mt-2">{t("Start a timer or add manual entry")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(isAdmin ? dailyData : dailyData.slice(0, 1)).map(day => {
                    const feedCount = day.sessions.filter(s => !s.is_solid).length;
                    const solidCount = day.sessions.filter(s => s.is_solid).length;
                    const isExpanded = !!expandedDays[day.date];
                    return (
                      <div key={day.date} className="border dark:border-gray-700 border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleDay(day.date)}
                          className="w-full flex items-center justify-between p-4 dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 dark:text-gray-300 text-gray-600" />
                            <div className="text-left">
                              <p className="font-semibold dark:text-white text-gray-800">
                                {new Date(day.date + "T12:00:00").toLocaleDateString(i18n.language || "en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                              </p>
                              <p className="text-sm dark:text-gray-400 text-gray-600 flex gap-3">
                                {feedCount > 0 && (
                                  <span className="text-pink-500 font-medium">{feedCount} 🍼</span>
                                )}
                                {solidCount > 0 && (
                                  <span className="text-emerald-500 font-medium">{solidCount} 🥣</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-5 h-5 dark:text-gray-300 text-gray-600 flex-shrink-0" />
                            : <ChevronDown className="w-5 h-5 dark:text-gray-300 text-gray-600 flex-shrink-0" />
                          }
                        </button>

                        {isExpanded && (
                          <div className="border-t dark:border-gray-700 border-gray-200 p-4 space-y-2">
                            {day.sessions.map(session => {
                              const isSolid = !!session.is_solid;
                              const isPumped = session.is_pumped;
                              const sideLabel = session.right_duration === 0 && session.ml_amount === 0 ? "L"
                                : session.left_duration === 0 && session.ml_amount === 0 ? "R"
                                : session.ml_amount === 0 ? "B"
                                : null;
                              const iconBg = isSolid ? "bg-emerald-500"
                                : isPumped ? "bg-yellow-400"
                                : sideLabel === "L" ? "bg-pink-500"
                                : sideLabel === "R" ? "bg-purple-500"
                                : "bg-blue-500";
                              return (
                                <div key={session.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                  isSolid ? "dark:bg-green-900/30 bg-green-50" : "dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200"
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${iconBg}`}>
                                      {isSolid ? "🥣" : isPumped ? "🍶" : "🍼"}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm dark:text-white text-gray-800">
                                        {isSolid
                                          ? (session.solid_food || t("Solid Food"))
                                          : `${new Date(session.start_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} – ${new Date(session.end_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
                                        }
                                      </p>
                                      <p className="text-xs dark:text-gray-400 text-gray-500">
                                        {isSolid
                                          ? new Date(session.start_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                                          : sideLabel === "B" ? `L: ${Math.floor(session.left_duration)}m | R: ${Math.floor(session.right_duration)}m`
                                          : sideLabel === "L" ? `L: ${Math.floor(session.left_duration)}m`
                                          : sideLabel === "R" ? `R: ${Math.floor(session.right_duration)}m`
                                          : `${Math.floor(session.ml_amount)} ml`
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <button onClick={() => handleDeleteSession(session.id)} className="cursor-pointer p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Modal */}
          {isManualModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => { setIsManualModalOpen(false); setSolidFoodList([]); setSolidFoodInput(""); }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {t("Manual Entry")}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {t("Enter session manually")}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 text-pink-600" />
                      {t("Date")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={newSession.date}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${
                        errors.date
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100`}
                    />
                    {errors.date && (
                      <p className="text-red-500 text-xs mt-1">
                        {t("This field is required")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 text-pink-600" />
                      {t("Start Time")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="time"
                      required
                      value={newSession.time}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${
                        errors.time
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100`}
                    />
                    {errors.time && (
                      <p className="text-red-500 text-xs mt-1">
                        {t("This field is required")}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="feeding_type"
                        checked={newSession.is_breast && !newSession.is_solid}
                        onChange={() =>
                          setNewSession(prev => ({ ...prev, is_breast: true, is_solid: false }))
                        }
                        className="w-4 h-4"
                      />
                      {t("Breastfeeding")}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="feeding_type"
                        checked={!newSession.is_breast && !newSession.is_solid}
                        onChange={() =>
                          setNewSession(prev => ({ ...prev, is_breast: false, is_solid: false }))
                        }
                        className="w-4 h-4"
                      />
                      {t("Bottle Feeding")}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="feeding_type"
                        checked={newSession.is_solid}
                        onChange={() =>
                          setNewSession(prev => ({ ...prev, is_breast: false, is_solid: true }))
                        }
                        className="w-4 h-4"
                      />
                      {t("Solid Food")}
                    </label>
                  </div>

                  {newSession.is_solid ? (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Utensils className="w-4 h-4 text-green-600" />
                        {t("What did she eat?")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={solidFoodInput}
                          onChange={e => setSolidFoodInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const food = solidFoodInput.trim().toLowerCase();
                              if (food) {
                                setSolidFoodList(prev => [...prev, food]);
                                setSolidFoodInput("");
                              }
                            }
                          }}
                          placeholder={t("e.g. apple")}
                          className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const food = solidFoodInput.trim();
                            if (food) {
                              setSolidFoodList(prev => [...prev, food]);
                              setSolidFoodInput("");
                            }
                          }}
                          className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {solidFoodList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {solidFoodList.map(food => (
                            <span key={food} className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                              {food}
                              <button
                                type="button"
                                onClick={() => setSolidFoodList(prev => prev.filter(f => f !== food))}
                                className="ml-1 text-green-600 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : newSession.is_breast ? (
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name="breast_side"
                          checked={newSession.breast_side === "left"}
                          onChange={() => setNewSession(prev => ({ ...prev, breast_side: "left" }))}
                          className="w-4 h-4 accent-pink-500"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-pink-500 inline-flex items-center justify-center text-white text-xs font-bold">L</span>
                          {t("Left")}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name="breast_side"
                          checked={newSession.breast_side === "right"}
                          onChange={() => setNewSession(prev => ({ ...prev, breast_side: "right" }))}
                          className="w-4 h-4 accent-purple-500"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-purple-500 inline-flex items-center justify-center text-white text-xs font-bold">R</span>
                          {t("Right")}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name="breast_side"
                          checked={newSession.breast_side === "both"}
                          onChange={() => setNewSession(prev => ({ ...prev, breast_side: "both" }))}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-blue-500 inline-flex items-center justify-center text-white text-xs font-bold">B</span>
                          {t("both")}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t("amount in ml")}
                      </label>
                      <input
                        type="number"
                        name="ml_amount"
                        value={newSession.ml_amount}
                        onChange={handleInputChange}
                        placeholder={t("amount in ml")}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => { setIsManualModalOpen(false); setSolidFoodList([]); setSolidFoodInput(""); }}
                    className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleManualEntry}
                    disabled={
                      newSession.is_solid
                        ? solidFoodList.length === 0
                        : !newSession.is_breast && errors.ml_amount
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <>
                      <Plus className="w-5 h-5" />
                      {t("Add Session")}
                    </>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
