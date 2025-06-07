// src/components/TokenForm.jsx

import React, { useState } from 'react';
import { parseSchedule } from '../utils/scheduleParser';
import { blackScholes } from '../utils/blackScholes';

const TokenForm = ({ setSchedule, setDiscountedSchedule }) => {
  const [spotPrice, setSpotPrice] = useState('');
  const [volatility, setVolatility] = useState('');
  const [scheduleInput, setScheduleInput] = useState('');
  const [error, setError] = useState(null);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    try {
      const parsed = parseSchedule(scheduleInput);
      setSchedule(parsed);

      const r = 0.05; // 5% risk-free rate

      const discounted = parsed.map(event => {
        const T = (new Date(event.date) - new Date()) / (365 * 24 * 60 * 60 * 1000); // time in years
        const putPrice = blackScholes(
          Number(spotPrice),
          Number(spotPrice),
          T,
          r,
          Number(volatility),
          'put'
        );
        const discountedValuePerToken = Number(spotPrice) - putPrice;
        const discountPercent = (putPrice / Number(spotPrice)) * 100;
        return {
          ...event,
          discountPercent,
          discountedValue: discountedValuePerToken * event.amount
        };
      });

      setDiscountedSchedule(discounted);
      setError(null);
    } catch (err) {
      setError('Failed to parse input. Please check your format.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="token-form">
      <div>
        <label>Spot Price ($):</label>
        <input
          type="number"
          value={spotPrice}
          onChange={e => setSpotPrice(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Volatility (as decimal, e.g., 0.87):</label>
        <input
          type="number"
          step="0.01"
          value={volatility}
          onChange={e => setVolatility(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Unlock Schedule (e.g., "20k in 30d"):</label>
        <textarea
          rows={5}
          value={scheduleInput}
          onChange={e => setScheduleInput(e.target.value)}
          placeholder={`Examples:\n20000 in 30d\n50000 in 90d\n50000 in 180d`}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit">Calculate</button>
    </form>
  );
};

export default TokenForm;
