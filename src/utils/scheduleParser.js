export const parseSchedule = (events) => {
  return events.map(e => ({
    date: e.date,
    amount: parseFloat(e.amount)
  }));
};