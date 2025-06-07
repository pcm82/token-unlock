import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement);

export default function Charts({ data }) {
  const labels = data.map((u) => `${u.days}d`);
  const values = data.map((u) => u.amount);
  return (
    <div>
      <Line data={{
        labels,
        datasets: [{
          label: "Unlocks",
          data: values,
          borderColor: "blue",
          backgroundColor: "lightblue"
        }]
      }} />
    </div>
  );
}