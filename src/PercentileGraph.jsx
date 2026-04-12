import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useTheme } from "./theme.jsx";

const PERCENTILE_KEYS = ["P1", "P25", "P50", "P75", "P99"];
const PERCENTILE_NAMES = ["10th", "25th", "50th", "75th", "99th"];

export default function PercentileGraph({
  title,
  combinedData,
  actualDataKey,
  yAxisLabel,
  yDomain,
  yTicks,
  xTicks,
  actualColor = "#8b5cf6",
  actualName,
  labelAtMonth = "6",
}) {
  const { t } = useTranslation();
  const { darkMode } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-8 p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={combinedData}
          margin={{ top: 5, right: 26, left: 2, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "gray" : "#e5e7eb"}
          />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            label={{
              value: t("Age (months)"),
              position: "insideBottom",
              offset: -2,
            }}
            style={{ fontSize: "14px", fontWeight: "500" }}
            type="number"
            ticks={xTicks}
          />
          <YAxis
            stroke="#6b7280"
            label={{
              value: yAxisLabel,
              angle: -90,
              position: "insideLeft",
              offset: 5,
            }}
            style={{ fontSize: "14px" }}
            domain={yDomain}
            ticks={yTicks}
          />
          {PERCENTILE_KEYS.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={darkMode ? "lightgray" : "gray"}
              strokeWidth={1}
              activeDot={false}
              name={t(PERCENTILE_NAMES[index])}
              dot={false}
              connectNulls
              label={props => {
                const { x, y, value, index: pointIndex } = props;
                const point = combinedData[pointIndex];
                if (point && point.month === labelAtMonth && value) {
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={darkMode ? "lightgray" : "gray"}
                      fontSize={12}
                      fontWeight="bold"
                      textAnchor="start"
                      dominantBaseline="middle"
                    >
                      {t(PERCENTILE_NAMES[index])}
                    </text>
                  );
                }
                return null;
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey={actualDataKey}
            stroke={actualColor}
            strokeWidth={2}
            name={actualName}
            dot={{ fill: actualColor, r: 3, strokeWidth: 1 }}
            activeDot={{ r: 3, strokeWidth: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
