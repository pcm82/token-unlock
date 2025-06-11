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

  // Load from localStorage on mount (optional, can be removed if you want no persistence)
  useEffect(() => {
    const saved = localStorage.getItem('tokenUnlockResults');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setResults(parsed);
        setInitialFormValues(parsed.inputs || null);
      } catch {}
    }
  }, []);

  // Save results to localStorage on update (optional)
  useEffect(() => {
    if (results) {
      localStorage.setItem('tokenUnlockResults', JSON.stringify(results));
    }
  }, [results]);

  // JSON export
  const handleExportJSON = () => {
    if (!results) return;
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'token-unlock-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON import
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        setResults(imported);
        setInitialFormValues(imported.inputs || null);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again if needed
    e.target.value = null;
  };

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

          <div className="import-export-buttons">
            <button onClick={handleExportJSON}>Export Results JSON</button>
            <label className="import-json-label">
              Import Results JSON
              <input type="file" accept="application/json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
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

  // Prepare date aggregated data for the chart
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

  // Sorting logic for table with single-column sort & arrow indicator
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

  // Helper to get nested key values (like 'token.symbol')
  const getValue = (obj, key) => {
    return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };

  // Sort unlockEvents based on sortConfig
  const sortedUnlockEvents = [...unlockEvents].sort((a, b) => {
    const aVal = getValue(a, sortConfig.key);
    const bVal = getValue(b, sortConfig.key);

    // Handle numbers and strings
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Change sorting on header click
  const requestSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  // Render sort arrow
  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

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
                <th onClick={() => requestSort('date')}>
                  Date
                  <SortArrow columnKey="date" />
                </th>
                <th onClick={() => requestSort('amount')}>
                  Amount
                  <SortArrow columnKey="amount" />
                </th>
                <th onClick={() => requestSort('discountedPrice')}>
                  Discounted Price
                  <SortArrow columnKey="discountedPrice" />
                </th>
                <th onClick={() => requestSort('totalValue')}>
                  Total Value
                  <SortArrow columnKey="totalValue" />
                </th>
                <th onClick={() => requestSort('discountPercent')}>
                  Discount %
                  <SortArrow columnKey="discountPercent" />
                </th>
                <th onClick={() => requestSort('token.symbol')}>
                  Token
                  <SortArrow columnKey="token.symbol" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUnlockEvents.map(({ date, amount, discountedPrice, totalValue, discountPercent, token }, i) => (
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
