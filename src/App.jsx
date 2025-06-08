import React, { useState } from 'react';
import TokenForm from './TokenForm';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function App() {
  const [results, setResults] = useState(null);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>Token Unlock & DLOM Calculator</h1>
      <TokenForm onCalculate={setResults} />
      {results && <ResultsDisplay results={results} />}
    </div>
  );
}

function ResultsDisplay({ results }) {
  const { results: unlockEvents, spot, totalLocked, totalUnlocked, totalValue } = results;

  // Aggregate data per date for charts
  const dateMap = new Map();
  const now = new Date();

  unlockEvents.forEach(({ date, amount, discountedPrice }) => {
    const d = new Date(date);
    const dateStr = d.toISOString().slice(0, 10);
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, unlocked: 0, locked: 0, totalValue: 0 });
    }
    const entry = dateMap.get(dateStr);

    if (d <= now) {
      entry.unlocked += amount * spot;
    } else {
      entry.locked += amount * discountedPrice;
    }
    entry.totalValue = entry.unlocked + entry.locked;
  });

  const chartData = Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <>
      <h2>Results Summary</h2>
      <p>Spot Price: ${spot.toFixed(2)}</p>
      <p>Total Unlocked Tokens: {totalUnlocked.toFixed(2)}</p>
      <p>Total Locked Tokens: {totalLocked.toFixed(2)}</p>
      <p>Total Portfolio Value: ${totalValue.toFixed(2)}</p>

      <h3>Unlock Events</h3>
      <table border="1" cellPadding={5} cellSpacing={0} style={{ width: '100%', marginBottom: 20 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Discounted Price</th>
            <th>Total Value</th>
            <th>Discount %</th>
            <th>Token</th>
          </tr>
        </thead>
        <tbody>
          {unlockEvents.map(({ date, amount, discountedPrice, totalValue, discountPercent, token }, i) => (
            <tr key={i}>
              <td>{date}</td>
              <td>{amount.toFixed(2)}</td>
              <td>${discountedPrice.toFixed(2)}</td>
              <td>${totalValue.toFixed(2)}</td>
              <td>{discountPercent.toFixed(2)}%</td>
              <td>{token?.symbol.toUpperCase() || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Portfolio Unlock Value Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="locked" stroke="#8884d8" name="Locked Value" />
          <Line type="monotone" dataKey="unlocked" stroke="#82ca9d" name="Unlocked Value" />
          <Line type="monotone" dataKey="totalValue" stroke="#ff7300" name="Total Value" />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
