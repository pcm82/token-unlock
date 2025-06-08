import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, LinearScale, CategoryScale } from "chart.js";

Chart.register(LineElement, PointElement, LinearScale, CategoryScale);

const Charts = ({ schedule, discountedValues }) => {
  const dates = schedule.map(s => s.date);
  const unlocks = schedule.map(s => s.amount);
  const discounted = discountedValues.map(s => s.discountedValue);

  return (
    <div>
      <h3>Unlock Chart</h3>
      <Line data={{ labels: dates, datasets: [{ label: "Unlocked", data: unlocks }] }} />
      <h3>Discounted Value</h3>
      <Line data={{ labels: dates, datasets: [{ label: "Value", data: discounted }] }} />
    </div>
  );
};

export default Charts;