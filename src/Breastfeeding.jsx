import { useState, useEffect } from "react";
import { Clock, Calendar, Plus, Trash2, CheckCircle, AlertCircle, Play, Pause, Square } from "lucide-react";


function getDurationInMinutes(startDt, endDt) {
    const startTime = new Date(startDt);
    const endTime = new Date(endDt);
    const diffMs = endTime - startTime;
    return Math.round(diffMs / 1000 / 60);
}


function _formatDuration(startDt, endDt) {
    const startTime = new Date(startDt);
    const endTime = new Date(endDt);

    const diffMs = endTime - startTime;

    // Convert to duration object
    const duration = {
        hours: Math.floor(diffMs / (1000 * 60 * 60)),
        minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diffMs % (1000 * 60)) / 1000)
    };

    const formatter = new Intl.DurationFormat('en', {
        style: 'long',
        hours: 'numeric',
        minutes: 'numeric',
        seconds: 'numeric'
    });
    return formatter.format(duration);
}


export default function BreastfeedingPage() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // console.log('Sessions:', sessions);
    // Timer states
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeBreast, setActiveBreast] = useState(null); // 'left' or 'right'
    const [leftTime, setLeftTime] = useState(0);
    const [rightTime, setRightTime] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);

    console.log((new Date()).toISOString().split('T')[1])
    // Manual entry states

    const now = new Date();
    const nowDate = now.toISOString().split('T')[0];
    const nowTime = `${now.getHours()}:${now.getMinutes()}`

    const [newSession, setNewSession] = useState({
        date: nowDate,
        time: nowTime,
        left_duration: 0,
        right_duration: 0
    });

    const [errors, setErrors] = useState({
        date: false,
        time: false
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (isTimerActive && !isPaused && activeBreast) {
            interval = setInterval(() => {
                if (activeBreast === 'left') {
                    setLeftTime(time => time + 1);
                } else {
                    setRightTime(time => time + 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, isPaused, activeBreast]);

    const fetchSessions = () => {
        fetch('/api/breastfeeding')
            .then(response => response.json())
            .then(data => {
                setSessions(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching sessions:', error);
                setLoading(false);
            });
    };

    const startTimer = (breast) => {
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
        setActiveBreast(activeBreast === 'left' ? 'right' : 'left');
    };

    const stopAndSaveTimer = () => {
        setIsPaused(true);
        if (!isTimerActive || (leftTime === 0 && rightTime === 0)) return;

        const now = new Date();
        const data = {
            start_dt: sessionStartTime.toISOString(),
            end_dt: now.toISOString(),
            left_duration: leftTime,
            right_duration: rightTime
        };
        console.log(data);
        fetch('/api/breastfeeding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(() => {
                setSessions([...sessions, data]);
                resetTimer();
                setSuccessMessage('Session saved successfully!');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            })
            .catch((error) => {
                console.error('Error:', error);
                setSuccessMessage('Failed to save session');
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateDuration = (start_dt, end_dt) => {
        const startTime = new Date(start_dt);
        const endTime = new Date(end_dt);
        const diff = (endTime - startTime) / 1000 / 60;
        return Math.round(diff);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const aggregateByDay = () => {
        const dayMap = {};

        sessions.forEach(session => {
            const duration = session.left_duration && session.right_duration
                ? Math.round((session.left_duration + session.right_duration))
                : calculateDuration(session.start_dt, session.end_dt);


            // console.log(session.start_dt)
            const dateKey = new Date(session.start_dt).toISOString().split('T')[0];
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
                    sessions: [session]
                };
            }
        });

        return Object.entries(dayMap)
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .map(([date, data]) => ({ date, ...data }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(name, value)
        setNewSession(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handleManualEntry = (e) => {
        // console.log('submitting', newSession)
        e.preventDefault();

        const newErrors = {
            date: !newSession.date,
            time: !newSession.time,
        };
        console.log(newErrors);
        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            setSuccessMessage('Please fill in all required fields!');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            return;
        }

        const startDt = new Date(`${newSession.date}T${newSession.time}`)
        const endDt = new Date(startDt)
        endDt.setMinutes(startDt.getMinutes() + parseFloat(newSession.left_duration) + parseFloat(newSession.right_duration))

        // console.log(startDt)
        // console.log(startDt.getMinutes())
        // console.log(newSession.left_duration + newSession.right_duration)
        // console.log(endDt)

        setSubmitting(true);

        fetch('/api/breastfeeding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start_dt: startDt,
                end_dt: endDt,
                left_duration: parseFloat(newSession.left_duration),
                right_duration: parseFloat(newSession.right_duration)
            })
        })
            .then(response => response.json())
            .then(() => {
                setSessions([...sessions, {
                    start_dt: startDt,
                    end_dt: endDt,
                    left_duration: parseFloat(newSession.left_duration),
                    right_duration: parseFloat(newSession.right_duration)
                }]);
                setNewSession({
                    date: '',
                    time: '',
                    left_duration: 0,
                    right_duration: 0
                });
                setErrors({ date: false, time: false });
                setIsManualModalOpen(false);
                setSubmitting(false);
                setSuccessMessage('Session added successfully!');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            })
            .catch((error) => {
                console.error('Error:', error);
                setSubmitting(false);
                setSuccessMessage('Failed to add session');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            });
    };

    const handleDeleteSession = async (id) => {
        try {
            const res = await fetch(`/api/breastfeeding/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setSessions(sessions.filter(session => session.id !== id));
                setSuccessMessage('Session deleted successfully!');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const dailyData = aggregateByDay();
    // console.log('Daily Data:', dailyData);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sessions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`${successMessage.includes('required') || successMessage.includes('Failed') || successMessage.includes('must be')
                        ? 'bg-red-500'
                        : 'bg-green-500'
                        } text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3`}>
                        {successMessage.includes('required') || successMessage.includes('Failed') || successMessage.includes('must be') ? (
                            <AlertCircle className="w-6 h-6" />
                        ) : (
                            <CheckCircle className="w-6 h-6" />
                        )}
                        <div>
                            <p className="font-semibold">
                                {successMessage.includes('required') || successMessage.includes('Failed') || successMessage.includes('must be') ? 'Error!' : 'Success!'}
                            </p>
                            <p className="text-sm">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Breastfeeding Tracker</h1>
                    <p className="text-gray-600">Track feeding sessions with timer or manual entry</p>
                </div>

                {/* Timer Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Active Session</h2>

                    {/* Breast Selection Buttons */}
                    {!isTimerActive && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => startTimer('left')}
                                className="p-8 bg-gradient-to-br from-pink-400 to-pink-500 text-white rounded-xl hover:from-pink-500 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                            >
                                <div className="text-4xl font-bold mb-2">L</div>
                                <div className="text-sm">Left Breast</div>
                            </button>
                            <button
                                onClick={() => startTimer('right')}
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
                                <div className={`p-6 rounded-xl ${activeBreast === 'left' ? 'bg-pink-100 border-2 border-pink-500' : 'bg-gray-100'}`}>
                                    <div className="text-sm text-gray-600 mb-1">Left Breast</div>
                                    <div className="text-3xl font-bold text-gray-800">{formatTime(leftTime)}</div>
                                </div>
                                <div className={`p-6 rounded-xl ${activeBreast === 'right' ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-100'}`}>
                                    <div className="text-sm text-gray-600 mb-1">Right Breast</div>
                                    <div className="text-3xl font-bold text-gray-800">{formatTime(rightTime)}</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={pauseTimer}
                                    className="flex-1 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                    {isPaused ? 'Resume' : 'Pause'}
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
                        className="w-full mt-4 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Manual Entry
                    </button>
                </div>

                {/* Daily Sessions */}
                <div className="space-y-4">
                    {dailyData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No sessions logged yet</p>
                            <p className="text-gray-400 text-sm mt-2">Start a timer or add manual entry</p>
                        </div>
                    ) : (
                        dailyData.map(day => (
                            <div key={day.date} className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-16">
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-pink-600">
                                                {formatDuration(day.total)}
                                            </div>
                                            <p className="text-sm text-gray-500">Total time</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-pink-600">
                                                {formatDuration(day.leftTotal)}
                                            </div>
                                            <p className="text-sm text-gray-500">Total left</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-pink-600">
                                                {formatDuration(day.rightTotal)}
                                            </div>
                                            <p className="text-sm text-gray-500">Total right</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {day.sessions.map((session, i) => {
                                        const duration = session.left_duration && session.right_duration
                                            ? Math.round((session.left_duration + session.right_duration) / 60)
                                            : calculateDuration(session.start_dt, session.end_dt);
                                        const breast = session.right_duration === 0 ? 'L' : session.left_duration === 0 ? 'R' : 'B';

                                        return (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${breast === 'L' ? 'bg-pink-500' : breast === 'R' ? 'bg-purple-500' : 'bg-teal-500'
                                                        }`}>
                                                        {breast}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {formatDuration(getDurationInMinutes(session.end_dt, new Date()))} ago
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {formatDuration(getDurationInMinutes(session.start_dt, session.end_dt))}{" "}
                                                            ({session.left_duration && session.right_duration ? (
                                                                <>L: {formatDuration(Math.floor(session.left_duration / 60))} | R: {formatDuration(Math.floor(session.right_duration / 60))}</>
                                                            ) : (
                                                                <>Duration: {formatDuration(duration)}</>
                                                            )})
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSession(session.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800">Manual Entry</h2>
                            <p className="text-gray-500 text-sm mt-1">Enter feeding session manually</p>
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
                                    className={`w-full px-4 py-3 border ${errors.date ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white`}
                                />
                                {errors.date && <p className="text-red-500 text-xs mt-1">This field is required</p>}
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
                                    className={`w-full px-4 py-3 border ${errors.time ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white`}
                                />
                                {errors.time && <p className="text-red-500 text-xs mt-1">This field is required</p>}
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
    );
}