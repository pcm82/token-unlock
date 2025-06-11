import React, { useState } from 'react';
import TokenForm from '../src/components/TokenForm';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './components/UnlocksTable.css';

export default function App() {
  const [results, setResults] = useState(null);
  const [showTable, setShowTable] = useState(true);
  const [showCumulative, setShowCumulative] = useState(false);
  const [showDollars, setShowDollars] = useState(true);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>Token Unlock & DLOM Calculator</h1>
      <TokenForm onCalculate={setResults} />

      {results && (
        <ResultsDisplay
          results={results}
          showTable={showTable}
          setShowTable={setShowTable}
          showCumulative={showCumulative}
          setShowCumulative={setShowCumulative}
          showDollars={showDollars}
          setShowDollars={setShowDollars}
        />
      )}
    </div>
  );
}

function ResultsDisplay({
  results,
  showTable,
  setShowTable,
  showCumulative,
  setShowCumulative,
  showDollars,
  setShowDollars,
}) {
  const { results: unlockEvents, spot, totalLocked, totalUnlocked, totalValue } = results;
  const dateMap = new Map();
  const now = new Date();
  let cumulativeUnlocked = 0;
  let cumulativeLocked = 0;

  unlockEvents.forEach(({ date, amount, discountedPrice }) => {
    const d = new Date(date);
    const dateStr = d.toISOString().slice(0, 10);
    const key = dateStr;
    if (!dateMap.has(key)) {
      dateMap.set(key, { date: key, unlocked: 0, locked: 0, totalValue: 0 });
    }
    const entry = dateMap.get(key);

    const unlockedValue = Number(amount) * Number(spot || 0);
    const lockedValue = Number(amount) * Number(discountedPrice || 0);

    if (d <= now) {
      entry.unlocked += showDollars ? unlockedValue : Number(amount);
    } else {
      entry.locked += showDollars ? lockedValue : Number(amount);
    }
  });

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([_, val]) => {
      if (showCumulative) {
        cumulativeUnlocked += val.unlocked;
        cumulativeLocked += val.locked;
        return {
          date: val.date,
          unlocked: cumulativeUnlocked,
          locked: cumulativeLocked,
          totalValue: cumulativeUnlocked + cumulativeLocked,
        };
      } else {
        return val;
      }
    });

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={showCumulative}
            onChange={() => setShowCumulative((v) => !v)}
          />{' '}
          Cumulative
        </label>
        <label>
          <input
            type="checkbox"
            checked={showDollars}
            onChange={() => setShowDollars((v) => !v)}
          />{' '}
          Show in Dollars
        </label>
        <label>
          <input
            type="checkbox"
            checked={showTable}
            onChange={() => setShowTable((v) => !v)}
          />{' '}
          Show Table
        </label>
      </div>

      <h3>Portfolio Unlock Value Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="locked" stroke="#8884d8" name="Locked" />
          <Line type="monotone" dataKey="unlocked" stroke="#82ca9d" name="Unlocked" />
          <Line type="monotone" dataKey="totalValue" stroke="#ff7300" name="Total" />
        </LineChart>
      </ResponsiveContainer>

      {showTable && (
        <>
          <h3 style={{ marginTop: 40 }}>Unlock Events</h3>
          <table className="unlocks-table">
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
              {unlockEvents.map((ev, i) => (
                <tr key={i}>
                  <td>{ev.date}</td>
                  <td>{Number(ev.amount || 0).toFixed(2)}</td>
                  <td>${Number(ev.discountedPrice || 0).toFixed(2)}</td>
                  <td>${Number(ev.totalValue || 0).toFixed(2)}</td>
                  <td>{Number(ev.discountPercent || 0).toFixed(2)}%</td>
                  <td>{ev.token?.symbol?.toUpperCase() || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
