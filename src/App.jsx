import React, { useState, useEffect } from 'react';
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
import './App.css';

export default function App() {
  const [results, setResults] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [showTable, setShowTable] = useState(true);
  const [showCumulative, setShowCumulative] = useState(false);
  const [showInDollars, setShowInDollars] = useState(true);

  // Load from URL on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedData = params.get('data');
    const parsed = storedData ? JSON.parse(decodeURIComponent(storedData)) : null;

    if (parsed) {
      setResults(parsed);
      setInitialFormValues(parsed.inputs || null);
    }
    setShowTable(params.get('showTable') === 'true');
    setShowCumulative(params.get('showCumulative') === 'true');
    setShowInDollars(params.get('showInDollars') !== 'false');
  }, []);

  // Update URL on state change
  useEffect(() => {
    if (!results) return;

    const params = new URLSearchParams();
    params.set('showTable', showTable);
    params.set('showCumulative', showCumulative);
    params.set('showInDollars', showInDollars);
    params.set('data', encodeURIComponent(JSON.stringify(results)));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [results, showTable, showCumulative, showInDollars]);

  return (
    <div className="app-container">
      <h1>Token Unlock & DLOM Calculator</h1>
      <TokenForm onCalculate={setResults} initialValues={initialFormValues} />

      {results && (
        <div className="controls">
          <div className="switch-group">
            <div className="switch-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showTable}
                  onChange={(e) => setShowTable(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="switch-text">Show Table</span>
            </div>

            <div className="switch-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showCumulative}
                  onChange={(e) => setShowCumulative(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="switch-text">Show Cumulative Values</span>
            </div>

            <div className="switch-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showInDollars}
                  onChange={(e) => setShowInDollars(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="switch-text">Display Mode: {showInDollars ? 'Dollars ($)' : 'Tokens'}</span>
            </div>
          </div>
        </div>
      )}

      {results && (
        <ResultsDisplay
          results={results}
          showTable={showTable}
          showCumulative={showCumulative}
          showInDollars={showInDollars}
        />
      )}
    </div>
  );
}

function ResultsDisplay({ results, showTable, showCumulative, showInDollars }) {
  const { results: unlockEvents, spot, totalLocked, totalUnlocked, totalValue } = results;

  const dateMap = new Map();
  const now = new Date();
  let cumulativeUnlocked = 0;
  let cumulativeLocked = 0;

  unlockEvents.forEach(({ date, amount, discountedPrice }) => {
    const d = new Date(date);
    const dateStr = d.toISOString().slice(0, 10);
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, {
        date: dateStr,
        unlocked: 0,
        locked: 0,
        totalValue: 0,
        cumulativeUnlocked: 0,
        cumulativeLocked: 0,
      });
    }
    const entry = dateMap.get(dateStr);

    let unlockValue = Number(amount);
    let lockValue = Number(amount);

    if (showInDollars) {
      unlockValue *= Number(spot || 0);
      lockValue *= Number(discountedPrice || 0);
    }

    if (d <= now) {
      entry.unlocked += unlockValue;
    } else {
      entry.locked += lockValue;
    }
  });

  const sortedData = Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedData.forEach((entry) => {
    cumulativeUnlocked += entry.unlocked;
    cumulativeLocked += entry.locked;
    entry.totalValue = entry.unlocked + entry.locked;
    entry.cumulativeUnlocked = cumulativeUnlocked;
    entry.cumulativeLocked = cumulativeLocked;
  });

  const chartData = sortedData;

  return (
    <>
      <h2>Results Summary</h2>
      <p>Spot Price: ${Number(spot || 0).toFixed(2)}</p>
      <p>Total Unlocked Tokens: {Number(totalUnlocked || 0).toFixed(2)}</p>
      <p>Total Locked Tokens: {Number(totalLocked || 0).toFixed(2)}</p>
      <p>Total Portfolio Value: ${Number(totalValue || 0).toFixed(2)}</p>

      <h3>Portfolio Unlock {showInDollars ? 'Value ($)' : 'Tokens'} Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={showCumulative ? 'cumulativeUnlocked' : 'unlocked'}
            stroke="#82ca9d"
            name={`Unlocked ${showInDollars ? 'Value ($)' : 'Tokens'}`}
          />
          <Line
            type="monotone"
            dataKey={showCumulative ? 'cumulativeLocked' : 'locked'}
            stroke="#8884d8"
            name={`Locked ${showInDollars ? 'Value ($)' : 'Tokens'}`}
          />
          <Line
            type="monotone"
            dataKey="totalValue"
            stroke="#ff7300"
            name="Total Value ($)"
          />
        </LineChart>
      </ResponsiveContainer>

      {showTable && (
        <>
          <h3>Unlock Events Table</h3>
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
              {unlockEvents.map(({ date, amount, discountedPrice, totalValue, discountPercent, token }, i) => (
                <tr key={i}>
                  <td>{date}</td>
                  <td>{Number(amount || 0).toFixed(2)}</td>
                  <td>${Number(discountedPrice || 0).toFixed(2)}</td>
                  <td>${Number(totalValue || 0).toFixed(2)}</td>
                  <td>{Number(discountPercent || 0).toFixed(2)}%</td>
                  <td>{token?.symbol?.toUpperCase() || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
