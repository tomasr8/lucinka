import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import { useData } from "./util";
import { useUser } from "./user.jsx";

function getDurationInMinutes(startDt, endDt) {
  const startTime = new Date(startDt);
  const endTime = new Date(endDt);
  const diffMs = endTime - startTime;
  return Math.round(diffMs / 1000 / 60);
}

export default function BreastfeedingPage() {
  const { t, i18n } = useTranslation();
  const {
    data: { breastfeeding: sessions },
    loading,
    refetch,
  } = useData("breastfeeding");
  const { isAdmin } = useUser();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Timer states
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeBreast, setActiveBreast] = useState(null); // 'left' or 'right'
  const [leftTime, setLeftTime] = useState(0);
  const [rightTime, setRightTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Manual entry states
  const now = new Date();
  const nowDate = now.toISOString().split("T")[0];
  const nowTime = `${now.getHours()}:${now.getMinutes()}`;

  const [newSession, setNewSession] = useState({
    date: nowDate,
    time: nowTime,
    left_duration: 0,
    right_duration: 0,
  });

  const [errors, setErrors] = useState({
    date: false,
    time: false,
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
      left_duration: leftTime,
      right_duration: rightTime,
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

  const calculateDuration = (start_dt, end_dt) => {
    const startTime = new Date(start_dt);
    const endTime = new Date(end_dt);
    const diff = (endTime - startTime) / 1000 / 60;
    return Math.round(diff);
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleManualEntry = e => {
    // console.log('submitting', newSession)
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

    const startDt = new Date(`${newSession.date}T${newSession.time}`);
    const endDt = new Date(startDt);
    endDt.setMinutes(
      startDt.getMinutes() +
        parseFloat(newSession.left_duration) +
        parseFloat(newSession.right_duration)
    );

    setSubmitting(true);

    fetch("/api/breastfeeding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_dt: startDt,
        end_dt: endDt,
        left_duration: parseFloat(newSession.left_duration),
        right_duration: parseFloat(newSession.right_duration),
      }),
    })
      .then(response => response.json())
      .then(() => {
        refetch();
        setNewSession({
          date: "",
          time: "",
          left_duration: 0,
          right_duration: 0,
        });
        setErrors({ date: false, time: false });
        setIsManualModalOpen(false);
        setSubmitting(false);
        setSuccessMessage("Session added successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      })
      .catch(error => {
        console.error("Error:", error);
        setSubmitting(false);
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
          <Header />
          <div>
            <div>
              <div className="grid grid-cols-3 md:grid-cols-2 flex mb-8">
                <div className="mb-6">
                  <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
                    {t("Breastfeeding")}
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
      const duration =
        session.left_duration && session.right_duration
          ? Math.round(session.left_duration + session.right_duration)
          : calculateDuration(session.start_dt, session.end_dt);

      // console.log(session.start_dt)
      const dateKey = new Date(session.start_dt).toISOString().split("T")[0];
      if (dayMap[dateKey]) {
        dayMap[dateKey].total += duration;
        dayMap[dateKey].leftTotal += session.left_duration;
        dayMap[dateKey].rightTotal += session.right_duration;
        dayMap[dateKey].sessions.push(session);
      } else {
        dayMap[dateKey] = {
          total: duration,
          leftTotal: session.left_duration,
          rightTotal: session.right_duration,
          sessions: [session],
        };
      }
    });

    return Object.entries(dayMap)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, data]) => ({ date, ...data }));
  };

  const dailyData = aggregateByDay();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Header />
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
            <div className="grid grid-cols-3 md:grid-cols-2 flex">
              <div className="mb-6">
                <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
                  {t("Breastfeeding")}
                </h1>
                <p className="dark:text-white text-gray-600">
                  {t("Breastfeeding over days")}
                </p>
              </div>
              <div className={`flex justify-end md:justify-end md:mb-6 p-2`}>
                <p
                  className={`text-3xl font-bold text-gray-900 dark:text-gray-100`}
                >
                  {t("Last session:")} {formatRelativeTime(sessions[0].end_dt)}
                  {/* {formatDuration(
                    getDurationInMinutes(sessions[0].end_dt, new Date())
                  )}{" "}
                  {t("ago")} */}
                </p>
              </div>
            </div>

            {/* Timer Section */}
            {isAdmin && (
              <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4">
                  Active Session
                </h2>

                {/* Breast Selection Buttons */}
                {!isTimerActive && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => startTimer("left")}
                      className="p-8 bg-gradient-to-br from-pink-400 to-pink-500 text-white rounded-xl hover:from-pink-500 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                    >
                      <div className="text-4xl font-bold mb-2">L</div>
                      <div className="text-sm">Left Breast</div>
                    </button>
                    <button
                      onClick={() => startTimer("right")}
                      className="p-8 bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                    >
                      <div className="text-4xl font-bold mb-2">R</div>
                      <div className="text-sm">Right Breast</div>
                    </button>
                  </div>
                )}

                {/* Active Timer Display */}
                {isTimerActive && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-6 rounded-xl ${
                          activeBreast === "left"
                            ? "bg-pink-100 border-2 border-pink-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="text-sm text-gray-600 mb-1">
                          Left Breast
                        </div>
                        <div className="text-3xl font-bold text-gray-800">
                          {formatTime(leftTime)}
                        </div>
                      </div>
                      <div
                        className={`p-6 rounded-xl ${
                          activeBreast === "right"
                            ? "bg-purple-100 border-2 border-purple-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="text-sm text-gray-600 mb-1">
                          Right Breast
                        </div>
                        <div className="text-3xl font-bold text-gray-800">
                          {formatTime(rightTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={pauseTimer}
                        className="flex-1 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                      >
                        {isPaused ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Pause className="w-5 h-5" />
                        )}
                        {isPaused ? "Resume" : "Pause"}
                      </button>
                      <button
                        onClick={switchBreast}
                        className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all"
                      >
                        Switch Breast
                      </button>
                      <button
                        onClick={stopAndSaveTimer}
                        className="flex-1 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Square className="w-5 h-5" />
                        Stop & Save
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
                  Manual Entry
                </button>
              </div>
            )}

            {/* Daily Sessions */}
            <div className="space-y-4">
              {dailyData.length === 0 ? (
                <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="dark:text-gray-500 text-gray-500 text-lg">
                    No sessions logged yet
                  </p>
                  <p className="dark:text-gray-400 text-gray-400 text-sm mt-2">
                    Start a timer or add manual entry
                  </p>
                </div>
              ) : (
                dailyData.map(day => (
                  <div
                    key={day.date}
                    className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {new Date(day.date).toLocaleDateString(
                            i18n.language || "en",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </h3>
                        <p className="text-sm dark:text-gray-100 text-gray-500 mt-1">
                          {day.sessions.length} {t("session")}
                          {day.sessions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex gap-16">
                        <div className="text-right">
                          <div className="text-3xl font-bold dark:text-white text-pink-600">
                            {formatDuration(day.total)}
                          </div>
                          <p className="text-sm dark:text-white text-gray-500">
                            {t("Total time")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold dark:text-white text-pink-600">
                            {formatDuration(day.leftTotal)}
                          </div>
                          <p className="text-sm dark:text-white text-gray-500">
                            {t("Total left")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold dark:text-white text-pink-600">
                            {formatDuration(day.rightTotal)}
                          </div>
                          <p className="text-sm dark:text-white text-gray-500">
                            {t("Total right")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.sessions.map(session => {
                        const duration =
                          session.left_duration && session.right_duration
                            ? Math.round(
                                (session.left_duration +
                                  session.right_duration) /
                                  60
                              )
                            : calculateDuration(
                                session.start_dt,
                                session.end_dt
                              );
                        const breast =
                          session.right_duration === 0
                            ? "L"
                            : session.left_duration === 0
                            ? "R"
                            : "B";

                        return (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 dark:bg-gray-600 bg-pink-50 rounded-lg hover:dark:bg-gray-700 hover:bg-pink-100 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                  breast === "L"
                                    ? "bg-pink-500"
                                    : breast === "R"
                                    ? "bg-purple-500"
                                    : "bg-teal-500"
                                }`}
                              >
                                {breast}
                              </div>
                              <div>
                                <p className="font-semibold dark:text-white text-gray-800">
                                  {formatDuration(
                                    getDurationInMinutes(
                                      session.end_dt,
                                      new Date()
                                    )
                                  )}{" "}
                                  ago
                                </p>
                                <p className="text-sm dark:text-white text-gray-600">
                                  {formatDuration(
                                    getDurationInMinutes(
                                      session.start_dt,
                                      session.end_dt
                                    )
                                  )}{" "}
                                  (
                                  {session.left_duration &&
                                  session.right_duration ? (
                                    <>
                                      L:{" "}
                                      {formatDuration(
                                        Math.floor(session.left_duration / 60)
                                      )}{" "}
                                      | R:{" "}
                                      {formatDuration(
                                        Math.floor(session.right_duration / 60)
                                      )}
                                    </>
                                  ) : (
                                    <>Duration: {formatDuration(duration)}</>
                                  )}
                                  )
                                </p>
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteSession(session.id)}
                                className="cursor-pointer p-2 dark:text-white text-red-500 dark:hover:bg-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Manual Entry Modal */}
          {isManualModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsManualModalOpen(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Manual Entry
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Enter session manually
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 text-pink-600" />
                      Date <span className="text-red-500">*</span>
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
                          : "border-gray-200"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white`}
                    />
                    {errors.date && (
                      <p className="text-red-500 text-xs mt-1">
                        This field is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 text-pink-600" />
                      Start Time <span className="text-red-500">*</span>
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
                          : "border-gray-200"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white`}
                    />
                    {errors.time && (
                      <p className="text-red-500 text-xs mt-1">
                        This field is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      Left Breast
                    </label>
                    <input
                      type="number"
                      name="left_duration"
                      value={newSession.left_duration}
                      onChange={handleInputChange}
                      placeholder="minutes"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      Right Breast
                    </label>
                    <input
                      type="number"
                      name="right_duration"
                      value={newSession.right_duration}
                      onChange={handleInputChange}
                      placeholder="minutes"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleManualEntry}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add Session
                      </>
                    )}
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
