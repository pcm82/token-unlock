// components/TokenForm/helpers.js
import cronParser from 'cron-parser';

export function generateUnlockEvents(schedule) {
  const {
    token, spotPrice, volatility, strikePrice, type, amount, startDate, endDate,
    frequencyType, frequencyValue,
  } = schedule;

  if (!token || !amount || !startDate || !strikePrice) throw new Error('Missing required fields');
  if (type === 'linear' && !endDate) throw new Error('End date required for linear');
  if (type !== 'cliff' && !frequencyType) throw new Error('Missing frequency type');

  const amt = parseFloat(amount);
  const spot = parseFloat(spotPrice);
  const vol = parseFloat(volatility);
  const strike = parseFloat(strikePrice);
  const start = new Date(startDate);
  const end = type === 'linear' ? new Date(endDate) : start;

  let unlockDates = [];

  if (type === 'cliff') {
    unlockDates = [start];
  } else {
    if (frequencyType === 'daily') {
      const interval = parseInt(frequencyValue);
      let current = new Date(start);
      while (current <= end) {
        unlockDates.push(new Date(current));
        current.setDate(current.getDate() + interval);
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
      const interval = cronParser.parseExpression(frequencyValue, {
        currentDate: start,
        endDate: end,
      });
      while (true) {
        const date = interval.next().toDate();
        if (date > end) break;
        unlockDates.push(date);
      }
    }
  }

  const amountPerUnlock = amt / unlockDates.length;
  return unlockDates.map(date => ({
    date, amount: amountPerUnlock, spot, vol, strike, token,
  }));
}

export function summarizeUnlockEvents(events, schedules) {
  const now = new Date();
  let totalUnlocked = 0, totalLocked = 0, totalValue = 0;
  const spot = schedules[0]?.spotPrice || 0;

  events.forEach(({ date, amount, discountedPrice }) => {
    const isUnlocked = new Date(date) <= now;
    const value = discountedPrice * amount;
    if (isUnlocked) totalUnlocked += amount;
    else totalLocked += amount;
    totalValue += value;
  });

  return {
    results: events,
    totalUnlocked,
    totalLocked,
    totalValue,
    spot,
  };
}
