import React, { useState, useEffect } from 'react';
import cronParser from 'cron-parser';
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
  frequencyValue: '1', // For daily: interval days; for cron: expression
};

export default function TokenForm({ onCalculate }) {
  const [tokens, setTokens] = useState([]);
  const [schedules, setSchedules] = useState([{ ...defaultSchedule }]);
  const [error, setError] = useState('');

  // Fetch top 20 tokens live
  useEffect(() => {
    fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false'
    )
      .then((res) => res.json())
      .then((data) => setTokens(data))
      .catch(() => setError('Failed to load token data'));
  }, []);

  const handleTokenChange = (index, tokenId) => {
    const token = tokens.find((t) => t.id === tokenId) || null;
    const newSchedules = [...schedules];
    newSchedules[index].token = token;

    if (!newSchedules[index].spotPrice && token) {
      newSchedules[index].spotPrice = token.current_price.toFixed(2);
    }
    // Volatility estimate fallback (manual input recommended)
    if (!newSchedules[index].volatility && token) {
      const vol = token.symbol === 'eth' ? 70 : token.symbol === 'btc' ? 50 : 60;
      newSchedules[index].volatility = vol.toFixed(2);
    }

    setSchedules(newSchedules);
  };

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
    setSchedules(newSchedules.length ? newSchedules : [{ ...defaultSchedule }]);
  };

  // Generate unlock events from schedule and frequency
  const generateUnlockEvents = (schedule) => {
    const {
      token,
      spotPrice,
      volatility,
      strikePrice,
      type,
      amount,
      startDate,
      endDate,
      frequencyType,
      frequencyValue,
    } = schedule;

    if (!token) throw new Error('Token is required');
    if (!amount || !startDate || !strikePrice) throw new Error('Amount, start date, and strike price are required');
    if (type === 'linear' && !endDate) throw new Error('End date is required for linear schedules');

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Amount must be positive number');

    const spot = parseFloat(spotPrice);
    if (isNaN(spot) || spot <= 0) throw new Error('Spot price must be positive number');

    const vol = parseFloat(volatility);
    if (isNaN(vol) || vol <= 0) throw new Error('Volatility must be positive number');

    const strike = parseFloat(strikePrice);
    if (isNaN(strike) || strike <= 0) throw new Error('Strike price must be positive number');

    let unlockEvents = [];

    if (type === 'cliff') {
      unlockEvents.push({ date: new Date(startDate), amount: amt, spot, vol, strike, token });
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) throw new Error('End date must be after start date');

      let unlockDates = [];

      if (frequencyType === 'daily') {
        const intervalDays = frequencyValue ? parseInt(frequencyValue) : 1;
        let current = new Date(start);
        while (current <= end) {
          unlockDates.push(new Date(current));
          current.setDate(current.getDate() + intervalDays);
        }
      } else if (frequencyType === 'weekly') {
        let current = new Date(start);
        while (current <= end) {
          unlockDates.push(new Date(current));
          current.setDate(current.getDate() + 7);
        }
      } else if (frequencyType === 'monthly') {
        let current = new Date(start);
        while (current <= end) {
          unlockDates.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
      } else if (frequencyType === 'customCron') {
        if (!frequencyValue) throw new Error('Cron expression required for customCron frequency');
        try {
          const interval = cronParser.parseExpression(frequencyValue, { currentDate: start, endDate: end, iterator: true });
          while (true) {
            const obj = interval.next();
            const date = obj.value.toDate();
            if (date > end) break;
            unlockDates.push(date);
          }
        } catch {
          throw new Error('Invalid cron expression');
        }
      } else {
        throw new Error('Unsupported frequency type');
      }

      const amountPerUnlock = amt / unlockDates.length;
      unlockEvents = unlockDates.map((date) => ({ date, amount: amountPerUnlock, spot, vol, strike, token }));
    }

    return unlockEvents;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      let allUnlockEvents = [];

      schedules.forEach((schedule) => {
        const unlockEvents = generateUnlockEvents(schedule);

        unlockEvents.forEach((event) => {
          const now = new Date();
          let timeToExpiry = (event.date - now) / (1000 * 60 * 60 * 24 * 365);
          if (timeToExpiry < 0) timeToExpiry = 0;

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
      });

      // Aggregate totals
      const now = new Date();
      let totalUnlocked = 0;
      let totalLocked = 0;
      let totalValue = 0;
      let spotForSummary = schedules.length > 0 ? parseFloat(schedules[0].spotPrice) : 0;

      allUnlockEvents.forEach(({ date, amount, discountedPrice }) => {
        const eventDate = new Date(date);
        if (eventDate <= now) {
          totalUnlocked += amount;
          totalValue += discountedPrice * amount;
        } else {
          totalLocked += amount;
          totalValue += discountedPrice * amount;
        }
      });

      onCalculate({ results: allUnlockEvents, totalUnlocked, totalLocked, totalValue, spot: spotForSummary });
    } catch (e) {
      setError(e.message || 'Error calculating unlocks');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        {schedules.map((schedule, i) => (
          <fieldset
            key={i}
            style={{ marginBottom: 20, padding: 15, border: '1px solid #ccc', borderRadius: 8 }}
          >
            <legend>Schedule #{i + 1}</legend>

            <label>
              Token:
              <select
                value={schedule.token?.id || ''}
                onChange={(e) => handleTokenChange(i, e.target.value)}
                style={{ marginLeft: 10, width: 180 }}
              >
                <option value="">-- Select token --</option>
                {tokens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.symbol.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>

            <br />

            <label>
              Spot Price (USD):
              <input
                type="number"
                min="0"
                step="any"
                value={schedule.spotPrice}
                onChange={(e) => handleScheduleChange(i, 'spotPrice', e.target.value)}
                placeholder="Spot price"
                required
                style={{ marginLeft: 10, width: 120 }}
              />
            </label>

            <br />

            <label>
              Implied Volatility (%):
              <input
                type="number"
                min="0"
                step="any"
                value={schedule.volatility}
                onChange={(e) => handleScheduleChange(i, 'volatility', e.target.value)}
                placeholder="Volatility"
                required
                style={{ marginLeft: 10, width: 120 }}
              />
            </label>

            <br />

            <label>
              Strike Price (USD):
              <input
                type="number"
                min="0"
                step="any"
                value={schedule.strikePrice}
                onChange={(e) => handleScheduleChange(i, 'strikePrice', e.target.value)}
                placeholder="Strike price"
                required
                style={{ marginLeft: 10, width: 120 }}
              />
            </label>

            <br />

            <label>
              Amount:
              <input
                type="number"
                min="0"
                step="any"
                value={schedule.amount}
                onChange={(e) => handleScheduleChange(i, 'amount', e.target.value)}
                placeholder="Amount tokens"
                required
                style={{ marginLeft: 10, width: 120 }}
              />
            </label>

            <br />

            <label>
              Unlock Type:
              <select
                value={schedule.type}
                onChange={(e) => handleScheduleChange(i, 'type', e.target.value)}
                style={{ marginLeft: 10, width: 120 }}
              >
                <option value="cliff">Cliff</option>
                <option value="linear">Linear</option>
              </select>
            </label>

            <br />

            <label>
              Start Date:
              <input
                type="date"
                value={schedule.startDate}
                onChange={(e) => handleScheduleChange(i, 'startDate', e.target.value)}
                required
                style={{ marginLeft: 10, width: 160 }}
              />
            </label>

            <br />

            {schedule.type === 'linear' && (
              <>
                <label>
                  End Date:
                  <input
                    type="date"
                    value={schedule.endDate}
                    onChange={(e) => handleScheduleChange(i, 'endDate', e.target.value)}
                    required
                    style={{ marginLeft: 10, width: 160 }}
                  />
                </label>

                <br />

                <label>
                  Frequency Type:
                  <select
                    value={schedule.frequencyType}
                    onChange={(e) => handleScheduleChange(i, 'frequencyType', e.target.value)}
                    style={{ marginLeft: 10, width: 140 }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="customCron">Custom Cron</option>
                  </select>
                </label>

                <br />

                {schedule.frequencyType === 'daily' && (
                  <label>
                    Days Between Unlocks:
                    <input
                      type="number"
                      min="1"
                      value={schedule.frequencyValue}
                      onChange={(e) => handleScheduleChange(i, 'frequencyValue', e.target.value)}
                      style={{ marginLeft: 10, width: 60 }}
                    />
                  </label>
                )}

                {(schedule.frequencyType === 'weekly' || schedule.frequencyType === 'monthly') && (
                  <p style={{ marginLeft: 10, color: '#555' }}>
                    Unlocks every {schedule.frequencyType}
                  </p>
                )}

                {schedule.frequencyType === 'customCron' && (
                  <label>
                    Cron Expression:
                    <input
                      type="text"
                      value={schedule.frequencyValue}
                      onChange={(e) => handleScheduleChange(i, 'frequencyValue', e.target.value)}
                      placeholder="e.g. 0 0 1 * *"
                      style={{ marginLeft: 10, width: 200 }}
                    />
                  </label>
                )}
              </>
            )}

            <br />
            <button type="button" onClick={() => removeSchedule(i)} style={{ color: 'red' }}>
              Remove Schedule
            </button>
          </fieldset>
        ))}

        <button type="button" onClick={addSchedule}>
          + Add Schedule
        </button>

        <br />
        <br />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Calculate Unlocks & DLOM</button>
      </form>
    </>
  );
}
