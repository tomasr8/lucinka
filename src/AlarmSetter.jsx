import React, { useState } from "react";
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  Calendar,
  TriangleAlert,
} from "lucide-react";

export default function AlarmSetter() {
  // Set start time to current time
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // Format: HH:MM
  };

  const [startTime, setStartTime] = useState(getCurrentTime());
  const [numberOfAlarms, setNumberOfAlarms] = useState(7);
  const [minutesDifference, setMinutesDifference] = useState(5);
  const [alarms, setAlarms] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const calculateAlarms = () => {
    const [hours, minutes] = startTime.split(":").map(Number);
    let currentTime = new Date();
    currentTime.setHours(hours, minutes, 0, 0);

    const calculatedAlarms = [];
    for (let i = 0; i < numberOfAlarms; i++) {
      const alarmTime = new Date(
        currentTime.getTime() + i * minutesDifference * 60000
      );
      calculatedAlarms.push({
        id: Date.now() + i,
        time: alarmTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        label: `Alarm ${i + 1}`,
      });
    }

    setAlarms(calculatedAlarms);
    setShowModal(true);
  };

  const setPhoneAlarms = () => {
    // Android alarm intent URLs
    alarms.forEach((alarm, index) => {
      const [hours, minutes] = alarm.time.split(":");

      // Create Android alarm intent URL
      // This opens the Android Clock app with pre-filled alarm time
      const alarmUrl = `intent://alarm/new?hour=${parseInt(
        hours
      )}&minutes=${parseInt(minutes)}&message=${encodeURIComponent(
        alarm.label
      )}#Intent;scheme=android;package=com.android.deskclock;end`;

      setTimeout(() => {
        // Try to open the alarm intent
        const link = document.createElement("a");
        link.href = alarmUrl;
        link.click();
      }, index * 1000); // 1 second delay between each alarm
    });

    alert(
      `Opening Android Clock app to set ${alarms.length} alarms. Please confirm each alarm.`
    );
  };

  return (
    <div className="dark:bg-gray-700 bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <TriangleAlert size={32} className="text-white" />
          </div>
          <h1 className="md:text-4xl text-xl font-bold dark:text-white text-gray-800 mb-2">
            Alarm Setter
          </h1>
          <p className="dark:text-white text-gray-600">
            Before starting breastfeed, set multiple alarms to help you stay
            awake.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="dark:bg-gray-800 bg-white dark:text-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold dark:text-white text-gray-900 mb-6">
            Configure Alarms
          </h2>

          {/* Start Time */}
          <div className="mb-6">
            <label className="block text-sm font-medium dark:text-white text-gray-700 mb-2">
              <Clock size={18} className="inline mr-2" />
              Start Time (Current:{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
              )
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Number of Alarms */}
          <div className="mb-6">
            <label className="block text-sm font-medium dark:text-white text-gray-700 mb-2">
              <Bell size={18} className="inline mr-2" />
              Number of Alarms
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numberOfAlarms}
              onChange={e => setNumberOfAlarms(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Minutes Difference */}
          <div className="mb-6">
            <label className="block text-sm font-medium dark:text-white text-gray-700 mb-2">
              <Calendar size={18} className="inline mr-2" />
              Minutes Between Alarms
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={minutesDifference}
              onChange={e =>
                setMinutesDifference(parseInt(e.target.value) || 1)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateAlarms}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Generate Alarm Schedule
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Alarm Schedule Ready!
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Android Users:</strong> Click "Set Alarms on Phone" to
                  automatically set alarms in your phone.
                </p>
              </div>
              <div className="mb-6 max-h-64 overflow-y-auto space-y-2">
                {alarms.map((alarm, index) => (
                  <div
                    key={alarm.id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                  >
                    <div>
                      <span className="font-bold text-purple-700 text-lg">
                        {alarm.time}
                      </span>
                      <span className="text-gray-600 ml-2">{alarm.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={setPhoneAlarms}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Bell size={20} />
                  Set Alarms on Phone
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
