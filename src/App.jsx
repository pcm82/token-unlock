import React, { useState, useEffect } from "react";
import { calculateDLOM } from "./utils/blackScholes";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TOKEN_LIST_API =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1";

export default function App() {
  const [schedules, setSchedules] = useState([
    {
      token: "",
      spotPrice: "",
      volatility: "",
      strikePrice: "",
      type: "cliff",
      amount: "",
      startDate: "",
      endDate: "",
    },
  ]);
  const [tokens, setTokens] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  // Fetch top 20 tokens from CoinGecko on mount
  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch(TOKEN_LIST_API);
        const data = await res.json();
        setTokens(data);
      } catch (e) {
        console.error("Failed to fetch tokens:", e);
      }
    }
    fetchTokens();
  }, []);

  // Calculate all schedules
  const handleCalculate = () => {
    setError("");
    try {
      let allUnlockEvents = [];

      schedules.forEach((schedule, idx) => {
        const {
          token,
          spotPrice,
          volatility,
          strikePrice,
          type,
          amount,
          startDate,
          endDate,
        } = schedule;

        if (
          !token ||
          !spotPrice ||
          !volatility ||
          !strikePrice ||
          !amount ||
          !startDate ||
          (type === "linear" && !endDate)
        ) {
          throw new Error(`Fill all fields in schedule #${idx + 1}`);
        }

        const S = parseFloat(spotPrice);
        const sigma = parseFloat(volatility) / 100; // percent to decimal
        const K = parseFloat(strikePrice);
        const amt = parseFloat(amount);

        if (S <= 0 || sigma <= 0 || K <= 0 || amt <= 0)
          throw new Error(`Invalid numeric values in schedule #${idx + 1}`);

        // Generate unlock events per schedule
        const start = new Date(startDate);
        if (isNaN(start)) throw new Error(`Invalid start date in schedule #${idx + 1}`);

        if (type === "cliff") {
          allUnlockEvents.push({
            token,
            date: start,
            amount: amt,
            spotPrice: S,
            volatility: sigma,
            strikePrice: K,
          });
        } else if (type === "linear") {
          const end = new Date(endDate);
          if (isNaN(end) || end <= start)
            throw new Error(`Invalid end date in schedule #${idx + 1}`);

          const diffTime = end - start;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const dailyUnlock = amt / diffDays;

          for (let i = 0; i <= diffDays; i++) {
            const unlockDate = new Date(start);
            unlockDate.setDate(unlockDate.getDate() + i);

            allUnlockEvents.push({
              token,
              date: unlockDate,
              amount: dailyUnlock,
              spotPrice: S,
              volatility: sigma,
              strikePrice: K,
            });
          }
        }
      });

      // Sort by date ascending
      allUnlockEvents.sort((a, b) => a.date - b.date);

      // Combine events with same token & date
      const combined = [];
      for (const ev of allUnlockEvents) {
        const last =
          combined.length > 0
            ? combined[combined.length - 1]
            : null;
        if (
          last &&
          last.date.getTime() === ev.date.getTime() &&
          last.token === ev.token
        ) {
          last.amount += ev.amount;
        } else {
          combined.push({ ...ev });
        }
      }

      // Calculate option values per unlock event
      const now = new Date();
      const resultsWithValues = combined.map(({ token, date, amount, spotPrice, volatility, strikePrice }) => {
        let timeToExpiry = (date - now) / (1000 * 60 * 60 * 24 * 365);
        if (timeToExpiry < 0) timeToExpiry = 0;

        const putPremium = calculateDLOM({
          spot: spotPrice,
          strike: strikePrice,
          timeToExpiry,
          volatility,
        });

        const discountedPrice = spotPrice - putPremium;
        const totalValue = discountedPrice * amount;
        const discountPercent = (putPremium / spotPrice) * 100;

        return {
          token,
          date: date.toISOString().slice(0, 10),
          amount,
          discountedPrice,
          totalValue,
          discountPercent,
        };
      });

      setResults(resultsWithValues);
    } catch (err) {
      setError(err.message);
      setResults([]);
    }
  };

  // Handlers for schedule changes
  const updateScheduleField = (idx, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[idx][field] = value;
    setSchedules(newSchedules);
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        token: "",
        spotPrice: "",
        volatility: "",
        strikePrice: "",
        type: "cliff",
        amount: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const removeSchedule = (idx) => {
    const newSchedules = schedules.filter((_, i) => i !== idx);
    setSchedules(newSchedules.length ? newSchedules : [
      {
        token: "",
        spotPrice: "",
        volatility: "",
        strikePrice: "",
        type: "cliff",
        amount: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  // Prepare chart data for unlocked tokens and portfolio value over time
  const chartLabels = [...new Set(results.map((r) => r.date))].sort();
  const tokensSet = [...new Set(results.map((r) => r.token))];

  // Aggregate token amounts per date for unlocked tokens chart
  const unlockedTokensData = chartLabels.map((date) => {
    return results
      .filter((r) => r.date === date)
      .reduce((sum, r) => sum + r.amount, 0);
  });

  // Aggregate total portfolio value per date
  const portfolioValueData = chartLabels.map((date) => {
    return results
      .filter((r) => r.date === date)
      .reduce((sum, r) => sum + r.totalValue, 0);
  });

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>Token Unlock Schedule Calculator</h1>

      {schedules.map((schedule, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 20,
            borderRadius: 6,
          }}
        >
          <button onClick={() => removeSchedule(idx)}>Remove Schedule</button>

          <div>
            <label>Token: </label>
            <select
              value={schedule.token}
              onChange={(e) => updateScheduleField(idx, "token", e.target.value)}
            >
              <option value="">Select token</option>
              {tokens.map((t) => (
                <option key={t.id} value={t.symbol}>
                  {t.name} ({t.symbol.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Spot Price ($): </label>
            <input
              type="number"
              step="0.01"
              value={schedule.spotPrice}
              onChange={(e) => updateScheduleField(idx, "spotPrice", e.target.value)}
              placeholder="e.g. 43.25"
            />
          </div>

          <div>
            <label>Implied Volatility (% annualized): </label>
            <input
              type="number"
              step="0.01"
              value={schedule.volatility}
              onChange={(e) => updateScheduleField(idx, "volatility", e.target.value)}
              placeholder="e.g. 60"
            />
          </div>

          <div>
            <label>Strike Price ($): </label>
            <input
              type="number"
              step="0.01"
              value={schedule.strikePrice}
              onChange={(e) => updateScheduleField(idx, "strikePrice", e.target.value)}
              placeholder="e.g. 43.25"
            />
          </div>

          <div>
            <label>Type: </label>
            <select
              value={schedule.type}
              onChange={(e) => updateScheduleField(idx, "type", e.target.value)}
            >
              <option value="cliff">Cliff</option>
              <option value="linear">Linear</option>
            </select>
          </div>

          <div>
            <label>Amount: </label>
            <input
              type="number"
              step="0.01"
              value={schedule.amount}
              onChange={(e) => updateScheduleField(idx, "amount", e.target.value)}
            />
          </div>

          <div>
            <label>Start Date: </label>
            <input
              type="date"
              value={schedule.startDate}
              onChange={(e) => updateScheduleField(idx, "startDate", e.target.value)}
            />
          </div>

          {schedule.type === "linear" && (
            <div>
              <label>End Date: </label>
              <input
                type="date"
                value={schedule.endDate}
                onChange={(e) => updateScheduleField(idx, "endDate", e.target.value)}
              />
            </div>
          )}
        </div>
      ))}

      <button onClick={addSchedule}>Add Schedule</button>
      <button onClick={handleCalculate} style={{ marginLeft: 20 }}>
        Calculate
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {results.length > 0 && (
        <>
          <h2>Results Summary</h2>
          <table border="1" cellPadding="5" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Token</th>
                <th>Amount</th>
                <th>Discounted Price</th>
                <th>Total Value</th>
                <th>Discount %</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.token.toUpperCase()}</td>
                  <td>{r.amount.toFixed(2)}</td>
                  <td>${r.discountedPrice.toFixed(2)}</td>
                  <td>${r.totalValue.toFixed(2)}</td>
                  <td>{r.discountPercent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Charts</h3>

          <div style={{ marginBottom: 50 }}>
            <h4>Unlocked Tokens Over Time (All Tokens Combined)</h4>
            <Line
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    label: "Unlocked Tokens",
                    data: unlockedTokensData,
                    fill: false,
                    borderColor: "blue",
                    tension: 0.3,
                  },
                ],
              }}
            />
          </div>

          <div>
            <h4>Portfolio Value Over Time</h4>
            <Bar
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    label: "Portfolio Value ($)",
                    data: portfolioValueData,
                    backgroundColor: "green",
                  },
                ],
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
