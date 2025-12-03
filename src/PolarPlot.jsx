import React, { useState, useEffect } from "react";
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
  const [data, setData] = useState([]);
  //   const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Group sessions by hour of day (0-23)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      hourLabel: `${hour.toString()}`,
      sessions: 0,
      totalDuration: 0,
    }));

    sessions.forEach(session => {
      console.log(session);
      const date = new Date(session.start_dt);
      const hour = date.getHours();
      hourlyData[hour].sessions += 1;
      hourlyData[hour].totalDuration +=
        session.right_duration + session.left_duration;
    });

    // Calculate average duration per session for each hour
    hourlyData.forEach(item => {
      item.avgDuration =
        item.sessions > 0 ? Math.round(item.totalDuration / item.sessions) : 0;
    });

    setData(hourlyData);
    refetch();
  }, []);

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
    <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}

        {/* Polar Chart */}
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="hourLabel"
                tick={{ fill: "#ec4899", fontSize: 12 }}
              />
              <Radar
                dataKey="sessions"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                formatter={(value, name) => {
                  if (name === "Number of Sessions") return [value, "Sessions"];
                  return [value, name];
                }}
                labelFormatter={label => `Time: ${label}`}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
}
