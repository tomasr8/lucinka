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
import { useData } from "./util";

export default function BreastfeedingPolarChart({ sessions }) {
  const {
    data: { user },
    loading,
    refetch,
  } = useData("breastfeeding");
  
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Group sessions by month and hour
    const monthlyGroups = {};
    
    sessions.forEach(session => {
      const date = new Date(session.start_dt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const hour = date.getHours();
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthLabel: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          hourlyData: Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            hourLabel: `${h}h`,
            sessions: 0,
            totalDuration: 0,
          }))
        };
      }
      
      monthlyGroups[monthKey].hourlyData[hour].sessions += 1;
      monthlyGroups[monthKey].hourlyData[hour].totalDuration +=
        session.right_duration + session.left_duration;
    });
    
    // Calculate average duration and sort by month
    const processedData = Object.values(monthlyGroups)
      .map(month => {
        month.hourlyData.forEach(item => {
          item.avgDuration =
            item.sessions > 0 ? Math.round(item.totalDuration / item.sessions) : 0;
        });
        return month;
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    setMonthlyData(processedData);
    refetch();
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Breastfeeding Sessions by Hour - Monthly View
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyData.map((month) => (
            <div key={month.monthKey} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-center">
                {month.monthLabel}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={month.hourlyData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="hourLabel"
                    tick={{ fill: "#ec4899", fontSize: 10 }}
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
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => {
                      if (name === "Sessions") return [value, "Sessions"];
                      return [value, name];
                    }}
                    labelFormatter={label => `Hour: ${label}`}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {/* Some statistics: average duration, hour with min number of sessions, and max */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                Avg Duration: {Math.round(month.hourlyData.reduce((sum, h) => sum + h.totalDuration, 0) / Math.max(1, month.hourlyData.reduce((sum, h) => sum + h.sessions, 0)))} mins
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                Peak Hour: {month.hourlyData.reduce((maxHour, h) => h.sessions > month.hourlyData[maxHour].sessions ? h.hour : maxHour, 0)}h
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                Low Hour: {month.hourlyData.reduce((minHour, h) => h.sessions < month.hourlyData[minHour].sessions ? h.hour : minHour, 0)}h
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                Total: {month.hourlyData.reduce((sum, h) => sum + h.sessions, 0)} sessions
              </div>

            </div>
          ))}
        </div>
        
        {monthlyData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}