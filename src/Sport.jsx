import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Plus, X, Clock, TrendingUp, Calendar, Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:5000/api';

export default function SportTracker() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    photo: null,
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`api/activities`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
      setError(t('Failed to load activities. Make sure the backend server is running.'));
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    if (diffMs <= 0) return null;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatistics = () => {
    if (activities.length === 0) {
      return {
        total: 0,
        totalDuration: 0,
        thisWeek: 0,
        thisMonth: 0,
        mostFrequent: null
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalDuration = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    const typeCounts = {};

    activities.forEach(activity => {
      const activityDate = new Date(activity.startTime || activity.createdAt);
      
      if (activityDate >= weekAgo) thisWeek++;
      if (activityDate >= monthAgo) thisMonth++;

      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;

      if (activity.startTime && activity.endTime) {
        const start = new Date(activity.startTime);
        const end = new Date(activity.endTime);
        const diffMs = end - start;
        if (diffMs > 0) {
          totalDuration += diffMs;
        }
      }
    });

    const mostFrequent = Object.keys(typeCounts).length > 0
      ? Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    return {
      total: activities.length,
      totalDuration,
      thisWeek,
      thisMonth,
      mostFrequent
    };
  };

  const formatTotalDuration = (ms) => {
    if (ms === 0) return t('No duration data');
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m total`;
    }
    return `${minutes}m total`;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type.trim() || !formData.startTime) return;

    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          description: formData.description,
          photo: formData.photo,
          startTime: formData.startTime,
          endTime: formData.endTime || null
        })
      });

      if (!response.ok) throw new Error('Failed to create activity');
      
      await loadActivities();
      setFormData({ type: '', description: '', photo: null, startTime: '', endTime: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating activity:', error);
      alert(t('Failed to create activity. Please try again.'));
    }
  };

  const deleteActivity = async (id) => {
    if (!window.confirm(t('Delete this activity?'))) return;

    try {
      const response = await fetch(`${API_URL}/activities/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete activity');
      await loadActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert(t('Failed to delete activity. Please try again.'));
    }
  };

  const openForm = () => {
    setShowForm(true);
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({ type: '', description: '', photo: null, startTime: localDateTime, endTime: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600 flex items-center gap-2">
          <RefreshCw size={20} className="animate-spin" />
          {t('Loading activities...')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('Connection Error')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadActivities}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            {t('Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('Sport Activities')}</h1>
          <p className="text-gray-600">{t('Track your activities and progress')}</p>
        </div>

        {activities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Activity size={24} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('Total Activities')}</p>
                  <p className="text-2xl font-bold text-gray-800">{getStatistics().total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('Duration')}</p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatTotalDuration(getStatistics().totalDuration)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('This Week')}</p>
                  <p className="text-2xl font-bold text-gray-800">{getStatistics().thisWeek}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('Most Frequent')}</p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {getStatistics().mostFrequent || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => showForm ? setShowForm(false) : openForm()}
            className="flex-1 sm:flex-initial px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? t('Cancel') : t('Add New Activity')}
          </button>

          <button
            onClick={loadActivities}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg"
          >
            <RefreshCw size={20} />
            {t('Refresh')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Activity Type *')}
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder={t('e.g., Tummy Time, Swimming, Running...')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Start Date & Time *')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('End Date & Time (optional)')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Description (optional)')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('Add notes about this activity...')}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Photo (optional)')}
                </label>
                <div className="flex flex-col gap-3">
                  <label className="cursor-pointer">
                    <div className="px-4 py-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                      <Camera size={20} className="text-gray-600" />
                      <span className="text-gray-600">{t('Upload Photo')}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.photo && (
                    <div className="relative">
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: null })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
              >
                {t('Save Activity')}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Camera size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">{t('No activities yet')}</h3>
              <p className="text-gray-500">{t('Start tracking your sport activities!')}</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{activity.type}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            {new Date(activity.startTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {activity.endTime && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span>
                              {new Date(activity.endTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      {activity.startTime && activity.endTime && (
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {t('Duration: ')}{calculateDuration(activity.startTime, activity.endTime)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  {activity.description && (
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                  )}
                  
                  {activity.photo && (
                    <img
                      src={activity.photo}
                      alt={activity.type}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}