import React, { useState, useEffect, useRef } from 'react';
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
  const [resetKey, setResetKey] = useState(0);

  const importInputRef = useRef(null);

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
    e.target.value = null;
  };

  // Reset everything with confirmation + clear first schedule inputs
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.removeItem('tokenUnlockResults');
      setResults(null);
      setInitialFormValues(null);
      setResetKey(prev => prev + 1); // This will re-mount TokenForm and reset all its state
    }
  };


  // Check if results contain unlock events for display
  const hasUnlockEvents =
    results &&
    Array.isArray(results.results) &&
    results.results.length > 0;

  return (
    <div className="app-container">
      <h1>Token Unlock & DLOM Calculator</h1>
  <TokenForm
    key={resetKey}
    onCalculate={setResults}
    initialValues={initialFormValues}
  />

      <div
        className="import-export-buttons"
        style={{ marginTop: '1rem', marginBottom: '1rem' }}
      >
        <button
          onClick={handleExportJSON}
          disabled={!hasUnlockEvents}
          style={{
            opacity: hasUnlockEvents ? 1 : 0.5,
            cursor: hasUnlockEvents ? 'pointer' : 'not-allowed',
          }}
        >
          Export Results JSON
        </button>

        <button
          onClick={() => importInputRef.current && importInputRef.current.click()}
          style={{ marginLeft: '1rem' }}
        >
          Import Results JSON
        </button>

        <input
          type="file"
          accept="application/json"
          onChange={handleImportJSON}
          ref={importInputRef}
          style={{ display: 'none' }}
        />

        <button
          onClick={handleReset}
          style={{
            marginLeft: '1rem',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Reset All
        </button>
      </div>

      {hasUnlockEvents && (
        <>
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
                  <span className="switch-text">
                    Display Mode: {showInDollars ? 'Dollars ($)' : 'Tokens'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <ResultsDisplay
            results={results}
            showTable={showTable}
            showCumulative={showCumulative}
            showInDollars={showInDollars}
          />
        </>
      )}
    </div>
  );
}

function ResultsDisplay({ results, showTable, showCumulative, showInDollars }) {
  const { results: unlockEvents } = results;

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
      unlockValue *= Number(results.spot || 0);
      lockValue *= Number(discountedPrice || 0);
    }

    if (d <= now) {
      entry.unlocked += unlockValue;
    } else {
      entry.locked += lockValue;
    }
  });

  const sortedData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  sortedData.forEach((entry) => {
    cumulativeUnlocked += entry.unlocked;
    cumulativeLocked += entry.locked;
    entry.totalValue = entry.unlocked + entry.locked;
    entry.cumulativeUnlocked = cumulativeUnlocked;
    entry.cumulativeLocked = cumulativeLocked;
  });

  const chartData = sortedData;

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

  const getValue = (obj, key) => {
    return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };

  const sortedUnlockEvents = [...unlockEvents].sort((a, b) => {
    const aVal = getValue(a, sortConfig.key);
    const bVal = getValue(b, sortConfig.key);

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

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

  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      {chartData.length > 0 && (
        <>
          <h3>Portfolio Unlock {showInDollars ? 'Value ($)' : 'Tokens'} Over Time</h3>
          <ResponsiveContainer
            width="100%"
            height={300}
            style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}
          >
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
        </>
      )}

      {showTable && unlockEvents.length > 0 && (
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
              {sortedUnlockEvents.map(
                (
                  {
                    date,
                    amount,
                    discountedPrice,
                    totalValue,
                    discountPercent,
                    token,
                  },
                  i
                ) => (
                  <tr key={i}>
                    <td>{date}</td>
                    <td>{Number(amount || 0).toFixed(2)}</td>
                    <td>${Number(discountedPrice || 0).toFixed(2)}</td>
                    <td>${Number(totalValue || 0).toFixed(2)}</td>
                    <td>{Number(discountPercent || 0).toFixed(2)}%</td>
                    <td>{token?.symbol?.toUpperCase() || 'N/A'}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
