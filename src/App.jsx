import React, { useState } from 'react';
import TokenForm from './components/TokenForm';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function App() {
  const [calculationData, setCalculationData] = useState(null);

  const onCalculate = (data) => {
    setCalculationData(data);
  };

  // Prepare data for charts if calculationData is present
  const dates = calculationData?.results.map(r => r.date) || [];
  const amounts = calculationData?.results.map(r => r.amount) || [];
  const totalValues = calculationData?.results.map(r => r.totalValue) || [];

  const tokensChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Tokens Unlocking',
        data: amounts,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const valuesChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Total Value ($)',
        data: totalValues,
        borderColor: 'rgba(53, 162, 235, 0.8)',
        backgroundColor: 'rgba(53, 162, 235, 0.4)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '',
      },
    },
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>Token Unlock Tracker</h1>

      <TokenForm onCalculate={onCalculate} />

      {calculationData && (
        <div style={{ marginTop: 40 }}>
          <h2>Results Summary</h2>
          <p><strong>Spot Price:</strong> ${calculationData.spot.toFixed(2)}</p>
          <p><strong>Total Unlocked Tokens:</strong> {calculationData.totalUnlocked.toFixed(2)}</p>
          <p><strong>Total Locked Tokens:</strong> {calculationData.totalLocked.toFixed(2)}</p>
          <p><strong>Total Portfolio Value:</strong> ${calculationData.totalValue.toFixed(2)}</p>

          <h3>Unlock Events</h3>
          <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 40 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Discounted Price</th>
                <th>Total Value</th>
                <th>Discount %</th>
              </tr>
            </thead>
            <tbody>
              {calculationData.results.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.amount.toFixed(2)}</td>
                  <td>${r.discountedPrice.toFixed(2)}</td>
                  <td>${r.totalValue.toFixed(2)}</td>
                  <td>{r.discountPercent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Tokens Unlocking by Date</h3>
          <Bar options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Tokens Unlocking by Date' } }}} data={tokensChartData} />

          <h3>Total Value Over Time</h3>
          <Line options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Total Value Over Time' } }}} data={valuesChartData} />
        </div>
      )}
    </div>
  );
}
