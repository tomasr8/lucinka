import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  X,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import Header from "./Header";

export default function VisitsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sample visit data - replace with API call
  const [state, setState] = useState({ loading: true });

  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    // Fetch visits from API
    fetch("/api/visits")
      .then(response => response.json())
      .then(data => {
        setVisits(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching visits:", error);
        setLoading(false);
      });
  }, []);

  const [newVisit, setNewVisit] = useState({
    date: "",
    time: "",
    doctor: "",
    location: "",
    type: "",
    notes: "",
    status: "upcoming",
  });

  const getVisitsForDate = date => {
    const dateStr = date.toISOString().split("T")[0];
    return visits.filter(visit => visit.date.split("T")[0] === dateStr);
  };

  const getDaysInMonth = date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };
  console.log(currentDate);
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth( ) - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleAddVisit = e => {
    e.preventDefault();
    const visitToAdd = {
      ...newVisit,
      // id: visits.length + 1,
    };

    setVisits([...visits, visitToAdd]);
    const data = {
      date: `${newVisit.date} ${newVisit.time}`,
      doctor: newVisit.doctor,
      location: newVisit.location,
      type: newVisit.type,
      notes: newVisit.notes,
    };

    fetch("/api/visits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    });

    setNewVisit({
      date: "",
      time: "",
      doctor: "",
      location: "",
      type: "",
      notes: "",
      status: "upcoming",
    });
    setIsAddModalOpen(false);

    // Show success message
    setSuccessMessage("Visit added successfully!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteVisit = async id => {
    if (!id) return;
    try {
      const res = await fetch(`/api/data/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh data
        s => ({
          ...s,
          data: s.data.filter(entry => entry.id !== id),
        });
      } else {
        console.error("Failed to delete entry");
      }
    } catch (err) {
      console.error(err);
    }
    setVisits(visits.filter(visit => visit.id !== selectedVisit.id));
    setSuccessMessage("Visit deleted successfully!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setSelectedVisit(null);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewVisit(prev => ({ ...prev, [name]: value }));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day + 1
      );
      const dateStr = date.toISOString().split("T")[0];
      const dayVisits = getVisitsForDate(date);
      const isToday = dateStr === todayStr;
      // console.log(date, day, isToday, dateStr, todayStr);
      const hasVisits = dayVisits.length > 0;
      days.push(
        <div
          key={day}
          className={`p-2 min-h-24 border border-gray-100 rounded-lg cursor-pointer transition-all dark:hover:bg-gray-800 hover:bg-gray-50 ${
            isToday ? "dark:bg-gray-800 bg-teal-50 dark:border-gray-100 border-teal-300" : "dark:border-gray-500"
          }`}
          onClick={() => hasVisits && setSelectedVisit(dayVisits[0])}
        >
          <div
            className={`text-sm font-semibold mb-1 ${
              isToday ? "dark:text-white" : "text-gray-500"
            }`}
          >
            {day}
          </div>
          {dayVisits.map(visit => (
            <div
              key={visit.id}
              className={`text-xs p-1 rounded mb-1 ${
                visit.status === "completed"
                  ? "dark:bg-gray-200 bg-gray-700"
                  : "dark:bg-teal-100 bg-teal-700"
              }`}
            >
              <div className="font-medium truncate">{visit.time}</div>
              <div className="truncate">{visit.doctor}</div>
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Header isAdmin={false} />
        <div>
          {/* Success Notification */}
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 animate-slide-in">
              <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Success!</p>
                  <p className="text-sm">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto">
            {/* Title */}
            <div className="flex justify-between items-center">
              <div className="mb-6">
                <h1 className="dark:text-white text-3xl font-bold text-gray-800 mb-2">
                  Visits
                </h1>
                <p className="dark:text-white text-gray-600">Upcoming appointments</p>
              </div>
              {state?.user?.is_admin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Visit
                </button>
              )}
            </div>

            {/* Calendar Card */}
            <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white text-gray-800">
                  {monthName}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 dark:text-white text-gray-600" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 dark:text-white text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div
                    key={day}
                    className="text-center font-semibold dark:text-white text-gray-600 text-sm py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {renderCalendarDays()}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 dark:bg-teal-200 bg-teal-100 rounded"></div>
                  <span className="text-sm dark:text-white text-gray-600">Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 dark:bg-gray-500 bg-gray-200 rounded"></div>
                  <span className="text-sm dark:text-white text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 dark:bg-teal-800 bg-teal-50 border-2 dark:border-teal-500 border-teal-300 rounded"></div>
                  <span className="text-sm dark:text-white text-gray-600">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Visit Modal */}
          {isAddModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsAddModalOpen(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Add New Visit
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Schedule a new medical appointment
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={newVisit.date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        Time
                      </label>
                      <input
                        type="time"
                        name="time"
                        required
                        value={newVisit.time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <User className="w-4 h-4 text-teal-600" />
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      name="doctor"
                      required
                      placeholder="e.g., Dr. Sarah Johnson"
                      value={newVisit.doctor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="e.g., General Medicine - Room 203"
                      value={newVisit.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      Visit Type
                    </label>
                    <input
                      type="text"
                      name="type"
                      required
                      placeholder="e.g., Regular Checkup, Follow-up"
                      value={newVisit.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows="3"
                      placeholder="Add any additional notes..."
                      value={newVisit.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVisit}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Visit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visit Details Modal */}
          {selectedVisit && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedVisit(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        selectedVisit.status === "completed"
                          ? "bg-gray-100"
                          : "bg-teal-100"
                      }`}
                    >
                      <Calendar
                        className={`w-6 h-6 ${
                          selectedVisit.status === "completed"
                            ? "text-gray-600"
                            : "text-teal-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedVisit.type}
                      </h3>
                      <p
                        className={`text-sm mt-1 px-3 py-1 rounded-full inline-block ${
                          selectedVisit.status === "completed"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {selectedVisit.status === "completed"
                          ? "Completed"
                          : "Upcoming"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVisit(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedVisit.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold text-gray-800">
                        {selectedVisit.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Doctor</p>
                      <p className="font-semibold text-gray-800">
                        {selectedVisit.doctor}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold text-gray-800">
                        {selectedVisit.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-gray-800 mt-1">
                        {selectedVisit.notes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  {state?.user?.is_admin && (
                    <button
                      onClick={() => handleDeleteVisit(selectedVisit.id)}
                      className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVisit(null)}
                    className="flex-1 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all"
                  >
                    Close
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
