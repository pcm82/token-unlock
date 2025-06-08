// components/TokenForm/TokenForm.jsx
import React, { useState, useEffect } from 'react';
import ScheduleForm from './TokenForm/ScheduleForm';
import { generateUnlockEvents, summarizeUnlockEvents } from './TokenForm/helpers';
import { calculateDLOM } from '../utils/blackScholes';

const defaultSchedule = {
  token: null,
  spotPrice: '',
  volatility: '',
  strikePrice: '',
  type: 'cliff',
  amount: '',
  startDate: '',
  endDate: '',
  frequencyType: 'daily',
  frequencyValue: '1',
  cronMin: '*',
  cronHour: '*',
  cronDom: '*',
  cronMon: '*',
  cronDow: '*',
};

export default function TokenForm({ onCalculate }) {
  const [tokens, setTokens] = useState([]);
  const [schedules, setSchedules] = useState([{ ...defaultSchedule }]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false')
      .then(res => res.json())
      .then(setTokens)
      .catch(() => setError('Failed to load token data'));
  }, []);

  const updateSchedule = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleTokenChange = (index, tokenId) => {
    const token = tokens.find(t => t.id === tokenId) || null;
    const newSchedules = [...schedules];
    newSchedules[index].token = token;

    if (!newSchedules[index].spotPrice && token)
      newSchedules[index].spotPrice = token.current_price.toFixed(2);

    if (!newSchedules[index].volatility && token)
      newSchedules[index].volatility = (token.symbol === 'eth' ? 70 : token.symbol === 'btc' ? 50 : 60).toFixed(2);

    setSchedules(newSchedules);
  };

  const addSchedule = () => setSchedules([...schedules, { ...defaultSchedule }]);

  const removeSchedule = (index) => {
    const newSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(newSchedules.length ? newSchedules : [{ ...defaultSchedule }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      let allUnlockEvents = [];

      for (const schedule of schedules) {
        const unlockEvents = generateUnlockEvents(schedule);
        unlockEvents.forEach(event => {
          const now = new Date();
          let timeToExpiry = (event.date - now) / (1000 * 60 * 60 * 24 * 365);
          timeToExpiry = Math.max(0, timeToExpiry);

          const putPremium = calculateDLOM({
            spot: event.spot,
            strike: event.strike,
            timeToExpiry,
            volatility: event.vol / 100,
          });

          const discountedPrice = event.spot - putPremium;
          const totalValue = discountedPrice * event.amount;
          const discountPercent = (putPremium / event.spot) * 100;

          allUnlockEvents.push({
            date: event.date.toISOString().slice(0, 10),
            amount: event.amount,
            discountedPrice,
            totalValue,
            discountPercent,
            token: event.token,
          });
        });
      }

      const summary = summarizeUnlockEvents(allUnlockEvents, schedules);
      onCalculate(summary);
    } catch (e) {
      setError(e.message || 'Error calculating unlocks');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      {schedules.map((schedule, index) => (
        <ScheduleForm
          key={index}
          index={index}
          schedule={schedule}
          tokens={tokens}
          onChange={updateSchedule}
          onTokenChange={handleTokenChange}
          onRemove={removeSchedule}
        />
      ))}
      <button type="button" onClick={addSchedule}>+ Add Schedule</button>
      <br /><br />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Calculate Unlocks & DLOM</button>
    </form>
  );
}
