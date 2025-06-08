import React, { useState } from 'react';
import { calculateDLOM } from '../utils/blackScholes'; // Your Black-Scholes implementation

const defaultSchedule = {
  type: 'cliff', // or 'linear'
  amount: '',
  startDate: '',
  endDate: '', // only for linear
};

export default function TokenForm({ onCalculate }) {
  const [spotPrice, setSpotPrice] = useState('');
  const [volatility, setVolatility] = useState('');
  const [strikePrice, setStrikePrice] = useState('');
  const [schedules, setSchedules] = useState([{ ...defaultSchedule }]);
  const [error, setError] = useState('');

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { ...defaultSchedule }]);
  };

const removeSchedule = (index) => {
  const newSchedules = schedules.filter((_, i) => i !== index);
  if (newSchedules.length === 0) {
    setSchedules([{ ...defaultSchedule }]);
  } else {
    setSchedules(newSchedules);
  }
};


  const parseSchedules = () => {
    // Turn schedules into a unified array of unlock events: [{date, amount}]
    // For cliff, one event on startDate
    // For linear, daily unlocks from startDate to endDate

    let unlockEvents = [];

    for (const schedule of schedules) {
      const { type, amount, startDate, endDate } = schedule;
      if (!amount || !startDate || (type === 'linear' && !endDate)) {
        throw new Error('Please fill in all schedule fields');
      }
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Amount must be positive number');
      }

      const start = new Date(startDate);
      if (isNaN(start)) throw new Error('Invalid start date');

      if (type === 'cliff') {
        // One unlock event on startDate
        unlockEvents.push({ date: start, amount: amt });
      } else if (type === 'linear') {
        const end = new Date(endDate);
        if (isNaN(end) || end <= start) throw new Error('Invalid end date for linear schedule');

        // Calculate days between
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dailyUnlock = amt / diffDays;

        for (let i = 0; i <= diffDays; i++) {
          const unlockDate = new Date(start);
          unlockDate.setDate(unlockDate.getDate() + i);
          unlockEvents.push({ date: unlockDate, amount: dailyUnlock });
        }
      }
    }

    // Sort by date ascending
    unlockEvents.sort((a, b) => a.date - b.date);

    // Combine events on same date
    const combined = [];
    for (const event of unlockEvents) {
      const last = combined.length ? combined[combined.length - 1] : null;
      if (last && last.date.getTime() === event.date.getTime()) {
        last.amount += event.amount;
      } else {
        combined.push({ date: event.date, amount: event.amount });
      }
    }

    return combined;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      const spot = parseFloat(spotPrice);
      const vol = parseFloat(volatility);
      const strike = parseFloat(strikePrice);

      if (isNaN(spot) || spot <= 0) throw new Error('Spot price must be a positive number');
      if (isNaN(vol) || vol <= 0) throw new Error('Volatility must be a positive number');
      if (isNaN(strike) || strike <= 0) throw new Error('Strike price must be a positive number');

      const unlockEvents = parseSchedules();

      // Calculate values for each unlock event
      const results = unlockEvents.map(({ date, amount }) => {
        const now = new Date();
        let timeToExpiry = (date - now) / (1000 * 60 * 60 * 24 * 365); // years
        if (timeToExpiry < 0) timeToExpiry = 0; // already unlocked

        const putPremium = calculateDLOM({
          spot,
          strike,
          timeToExpiry,
          volatility: vol / 100,
        });

        const discountedPrice = spot - putPremium;
        const totalValue = discountedPrice * amount;
        const discountPercent = (putPremium / spot) * 100;

        return {
          date: date.toISOString().slice(0, 10),
          amount,
          discountedPrice,
          totalValue,
          discountPercent,
        };
      });

      // Aggregate total locked and unlocked tokens
      const now = new Date();
      let totalUnlocked = 0;
      let totalLocked = 0;
      let totalValue = 0;

      for (const r of results) {
        const unlockDate = new Date(r.date);
        if (unlockDate <= now) {
          totalUnlocked += r.amount;
          totalValue += r.amount * spot;
        } else {
          totalLocked += r.amount;
          totalValue += r.totalValue;
        }
      }

      onCalculate({
        results,
        spot,
        totalUnlocked,
        totalLocked,
        totalValue,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Token Unlock Calculator</h2>
      <div>
        <label>Spot Price ($): </label>
        <input
          type="number"
          step="0.01"
          value={spotPrice}
          onChange={(e) => setSpotPrice(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Implied Volatility (% annualized): </label>
        <input
          type="number"
          step="0.01"
          value={volatility}
          onChange={(e) => setVolatility(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Strike Price ($): </label>
        <input
          type="number"
          step="0.01"
          value={strikePrice}
          onChange={(e) => setStrikePrice(e.target.value)}
          required
        />
      </div>

      <h3>Unlock Schedules</h3>

      {schedules.map((schedule, idx) => (
        <div key={idx} style={{border: '1px solid #ccc', margin: '10px 0', padding: '10px'}}>
          <button type="button" onClick={() => removeSchedule(idx)}>
            Remove
          </button>
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
              required
            />
          </div>
          <div>
            <label>Start Date: </label>
            <input
              type="date"
              value={schedule.startDate}
              onChange={(e) => handleScheduleChange(idx, 'startDate', e.target.value)}
              required
            />
          </div>
          {schedule.type === 'linear' && (
            <div>
              <label>End Date: </label>
              <input
                type="date"
                value={schedule.endDate}
                onChange={(e) => handleScheduleChange(idx, 'endDate', e.target.value)}
                required
              />
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={addSchedule}>Add Schedule</button>
      <br />
      <button type="submit">Calculate</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
