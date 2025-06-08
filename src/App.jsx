import React, { useState, useEffect } from 'react';
import { calculateDLOM } from './utils/blackScholes';

// Fetch top 20 tokens live from CoinGecko
async function fetchTopTokens() {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tokens');
  const data = await res.json();
  return data.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price,
  }));
}

export default function App() {
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [spotPrice, setSpotPrice] = useState('');
  const [volatility, setVolatility] = useState('');
  const [strikePrice, setStrikePrice] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Fetch tokens on mount
  useEffect(() => {
    fetchTopTokens()
      .then((list) => {
        setTokens(list);
        if (list.length > 0) {
          setSelectedTokenId(list[0].id);
          setSpotPrice(list[0].price.toString());
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  // Update spotPrice when selected token changes
  useEffect(() => {
    const token = tokens.find((t) => t.id === selectedTokenId);
    if (token) {
      setSpotPrice(token.price.toString());
      setSchedules([]); // reset schedules when switching tokens
      setResults(null);
    }
  }, [selectedTokenId, tokens]);

  // Add schedule handlers
  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        tokenId: selectedTokenId,
        type: 'cliff',
        amount: '',
        startDate: '',
        endDate: '',
      },
    ]);
  };

  const removeSchedule = (index) => {
    const newSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(newSchedules);
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  // Calculation function (similar to your TokenForm's handleSubmit)
  const handleCalculate = () => {
    setError('');
    try {
      if (!spotPrice || !volatility || !strikePrice) {
        throw new Error('Please enter spot price, volatility, and strike price.');
      }
      const spot = parseFloat(spotPrice);
      const vol = parseFloat(volatility) / 100;
      const strike = parseFloat(strikePrice);

      if (isNaN(spot) || spot <= 0) throw new Error('Spot price must be positive.');
      if (isNaN(vol) || vol <= 0) throw new Error('Volatility must be positive.');
      if (isNaN(strike) || strike <= 0) throw new Error('Strike price must be positive.');

      if (schedules.length === 0) throw new Error('Please add at least one schedule.');

      // Parse unlock events for all schedules
      let unlockEvents = [];
      for (const sched of schedules) {
        const token = tokens.find((t) => t.id === sched.tokenId);
        if (!token) throw new Error('Invalid token in schedule.');

        if (!sched.amount || !sched.startDate || (sched.type === 'linear' && !sched.endDate)) {
          throw new Error('Please fill all schedule fields.');
        }

        const amount = parseFloat(sched.amount);
        if (isNaN(amount) || amount <= 0) throw new Error('Amount must be positive.');

        const start = new Date(sched.startDate);
        if (isNaN(start)) throw new Error('Invalid start date.');

        if (sched.type === 'cliff') {
          unlockEvents.push({
            tokenId: sched.tokenId,
            tokenSymbol: token.symbol,
            date: start,
            amount,
            spotPrice: token.price,
          });
        } else if (sched.type === 'linear') {
          const end = new Date(sched.endDate);
          if (isNaN(end) || end <= start) throw new Error('Invalid end date for linear schedule.');

          const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          const dailyAmount = amount / diffDays;

          for (let i = 0; i <= diffDays; i++) {
            const unlockDate = new Date(start);
            unlockDate.setDate(unlockDate.getDate() + i);
            unlockEvents.push({
              tokenId: sched.tokenId,
              tokenSymbol: token.symbol,
              date: unlockDate,
              amount: dailyAmount,
              spotPrice: token.price,
            });
          }
        }
      }

      // Sort and combine unlock events by date and token
      unlockEvents.sort((a, b) => a.date - b.date);

      const combined = [];
      for (const event of unlockEvents) {
        const last = combined.length ? combined[combined.length - 1] : null;
        if (
          last &&
          last.date.getTime() === event.date.getTime() &&
          last.tokenId === event.tokenId
        ) {
          last.amount += event.amount;
        } else {
          combined.push({ ...event });
        }
      }

      // Calculate Black-Scholes DLOM for each unlock event
      const now = new Date();
      const detailedResults = combined.map(({ date, amount, spotPrice, tokenSymbol }) => {
        let timeToExpiry = (date - now) / (1000 * 60 * 60 * 24 * 365);
        if (timeToExpiry < 0) timeToExpiry = 0;

        const putPremium = calculateDLOM({
          spot: spotPrice,
          strike: strike,
          timeToExpiry,
          volatility: vol,
        });

        const discountedPrice = spotPrice - putPremium;
        const totalValue = discountedPrice * amount;
        const discountPercent = (putPremium / spotPrice) * 100;

        return {
          date: date.toISOString().slice(0, 10),
          tokenSymbol,
          amount,
          discountedPrice,
          totalValue,
          discountPercent,
        };
      });

      // Aggregate totals by token
      const aggregates = {};
      for (const r of detailedResults) {
        if (!aggregates[r.tokenSymbol]) {
          aggregates[r.tokenSymbol] = {
            totalUnlocked: 0,
            totalLocked: 0,
            totalValue: 0,
            spotPrice: null,
          };
        }
        const unlockDate = new Date(r.date);
        if (unlockDate <= now) {
          aggregates[r.tokenSymbol].totalUnlocked += r.amount;
          aggregates[r.tokenSymbol].totalValue += r.amount * spotPrice; // unlocked at spot price
        } else {
          aggregates[r.tokenSymbol].totalLocked += r.amount;
          aggregates[r.tokenSymbol].totalValue += r.totalValue;
        }
        aggregates[r.tokenSymbol].spotPrice = spotPrice;
      }

      setResults({ detailedResults, aggregates });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Token Unlock Calculator (Live Tokens)</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label>Select Token: </label>
        <select
          value={selectedTokenId}
          onChange={(e) => setSelectedTokenId(e.target.value)}
        >
          {tokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.name} ({token.symbol}) - ${token.price}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Spot Price ($): </label>
        <input
          type="number"
          step="0.01"
          value={spotPrice}
          onChange={(e) => setSpotPrice(e.target.value)}
        />
      </div>

      <div>
        <label>Volatility (% annualized): </label>
        <input
          type="number"
          step="0.01"
          value={volatility}
          onChange={(e) => setVolatility(e.target.value)}
          placeholder="E.g., 60"
        />
      </div>

      <div>
        <label>Strike Price ($): </label>
        <input
          type="number"
          step="0.01"
          value={strikePrice}
          onChange={(e) => setStrikePrice(e.target.value)}
        />
      </div>

      <h2>Unlock Schedules (for multiple tokens)</h2>
      {schedules.length === 0 && <p>No unlock schedules added yet.</p>}
      {schedules.map((schedule, idx) => {
        const token = tokens.find((t) => t.id === schedule.tokenId) || {};
        return (
          <div key={idx} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <button type="button" onClick={() => removeSchedule(idx)}>
              Remove Schedule
            </button>

            <div>
              <label>Token: </label>
              <select
                value={schedule.tokenId}
                onChange={(e) => handleScheduleChange(idx, 'tokenId', e.target.value)}
              >
                {tokens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Type: </label>
              <select
                value={schedule.type}
                onChange={(e) => handleScheduleChange(idx, 'type', e.target.value)}
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
                onChange={(e) => handleScheduleChange(idx, 'amount', e.target.value)}
              />
            </div>

            <div>
              <label>Start Date: </label>
              <input
                type="date"
                value={schedule.startDate}
                onChange={(e) => handleScheduleChange(idx, 'startDate', e.target.value)}
              />
            </div>

            {schedule.type === 'linear' && (
              <div>
                <label>End Date: </label>
                <input
                  type="date"
                  value={schedule.endDate}
                  onChange={(e) => handleScheduleChange(idx, 'endDate', e.target.value)}
                />
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={addSchedule}>
        Add Schedule
      </button>

      <div style={{ marginTop: '20px' }}>
        <button type="button" onClick={handleCalculate}>
          Calculate
        </button>
      </div>

      {results && (
        <>
          <h2>Results</h2>

          <h3>Aggregate by Token</h3>
          <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Total Unlocked</th>
                <th>Total Locked</th>
                <th>Total Value ($)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results.aggregates).map(([token, agg]) => (
                <tr key={token}>
                  <td>{token}</td>
                  <td>{agg.totalUnlocked.toFixed(2)}</td>
                  <td>{agg.totalLocked.toFixed(2)}</td>
                  <td>{agg.totalValue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Unlock Events Details</h3>
          <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Token</th>
                <th>Amount</th>
                <th>Discounted Price ($)</th>
                <th>Total Value ($)</th>
                <th>Discount %</th>
              </tr>
            </thead>
            <tbody>
              {results.detailedResults.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.date}</td>
                  <td>{r.tokenSymbol}</td>
                  <td>{r.amount.toFixed(2)}</td>
                  <td>{r.discountedPrice.toFixed(2)}</td>
                  <td>{r.totalValue.toFixed(2)}</td>
                  <td>{r.discountPercent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
