import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Charts({ results, totalAmount, spotPrice }) {
  // Prepare data for charts
  const data = results.map((r) => ({
    date: r.date,
    unlockedTokens: r.cumulativeUnlocked,
    lockedTokens: totalAmount - r.cumulativeUnlocked,
    discountedValue: r.discountedValue,
    discountPercent: (r.discountPercent * 100).toFixed(2),
  }));

  return (
    <div className="charts-container">
      <h2>Visualizations</h2>
      <div className="chart-wrapper">
        <h3>Tokens Locked / Unlocked Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="unlockedTokens"
              stroke="#82ca9d"
              name="Unlocked Tokens"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="lockedTokens"
              stroke="#8884d8"
              name="Locked Tokens"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-wrapper">
        <h3>Discounted Value Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="discountedValue"
              stroke="#ff7300"
              name="Discounted Value"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
