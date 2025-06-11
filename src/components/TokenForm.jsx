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

export default function TokenForm({ onCalculate, initialValues }) {
  const [tokens, setTokens] = useState([]);
  const [schedules, setSchedules] = useState([{ ...defaultSchedule }]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false')
      .then(res => res.json())
      .then(setTokens)
      .catch(() => setError('Failed to load token data'));
  }, []);

  useEffect(() => {
    if (!initialValues) return;
    const hydrated = initialValues.map(schedule => {
      const token = schedule.token?.id
        ? tokens.find(t => t.id === schedule.token.id)
        : null;

      return {
        ...defaultSchedule,
        ...schedule,
        token: token || null,
        spotPrice: token ? token.current_price.toFixed(2) : schedule.spotPrice || '',
      };
    });
    setSchedules(hydrated);
  }, [initialValues, tokens]);

  const calculateHistoricalVolatility = (prices) => {
    if (!prices || prices.length < 2) return null;
    const logReturns = [];
    for (let i = 1; i < prices.length; i++) {
      const p0 = prices[i - 1][1];
      const p1 = prices[i][1];
      logReturns.push(Math.log(p1 / p0));
    }
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (logReturns.length - 1);
    const stdDev = Math.sqrt(variance);
    const annualizedVol = stdDev * Math.sqrt(365);
    return (annualizedVol * 100).toFixed(2);
  };

  const handleTokenChange = (index, tokenId) => {
    const token = tokens.find(t => t.id === tokenId) || null;

    setSchedules((prev) => {
      const newSchedules = [...prev];
      newSchedules[index] = {
        ...newSchedules[index],
        token,
        spotPrice: token ? token.current_price.toFixed(2) : '',
        volatility: '',
      };
      return newSchedules;
    });

    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=30`);
        const data = await res.json();
        let vol = calculateHistoricalVolatility(data.prices);

        setSchedules((prev) => {
          const newSchedules = [...prev];
          if (!newSchedules[index]) return prev;
          newSchedules[index] = {
            ...newSchedules[index],
            volatility: vol || (token.symbol === 'eth' ? '70.00' : token.symbol === 'btc' ? '50.00' : '60.00'),
          };
          return newSchedules;
        });
      } catch (e) {
        setSchedules((prev) => {
          const newSchedules = [...prev];
          if (!newSchedules[index]) return prev;
          newSchedules[index] = {
            ...newSchedules[index],
            volatility: token.symbol === 'eth' ? '70.00' : token.symbol === 'btc' ? '50.00' : '60.00',
          };
          return newSchedules;
        });
      }
    })();
  };

  const updateSchedule = (index, field, value) => {
    setSchedules((prev) => {
      const newSchedules = [...prev];
      newSchedules[index] = { ...newSchedules[index], [field]: value };
      return newSchedules;
    });
  };

  const addSchedule = () => setSchedules(prev => [...prev, { ...defaultSchedule }]);

  const removeSchedule = (index) => {
    setSchedules((prev) => {
      const newSchedules = prev.filter((_, i) => i !== index);
      return newSchedules.length ? newSchedules : [{ ...defaultSchedule }];
    });
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
      summary.inputs = schedules; // embed form state for rehydration
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
