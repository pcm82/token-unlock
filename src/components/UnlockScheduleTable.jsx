import React from "react";

export default function UnlockScheduleTable({ unlockEvents, setUnlockEvents }) {
  // Add new unlock event with default date today and amount 0
  const addUnlockEvent = () => {
    setUnlockEvents([...unlockEvents, { date: new Date().toISOString().slice(0, 10), amount: 0 }]);
  };

  // Remove event at index
  const removeUnlockEvent = (index) => {
    const newEvents = unlockEvents.filter((_, i) => i !== index);
    setUnlockEvents(newEvents);
  };

  // Update date or amount of event at index
  const updateUnlockEvent = (index, field, value) => {
    const newEvents = [...unlockEvents];
    if (field === "amount") {
      newEvents[index].amount = Number(value);
    } else {
      newEvents[index][field] = value;
    }
    setUnlockEvents(newEvents);
  };

  return (
    <div className="unlock-schedule">
      <h2>Unlock Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Unlock Date</th>
            <th>Amount Unlocking</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {unlockEvents.map((event, i) => (
            <tr key={i}>
              <td>
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => updateUnlockEvent(i, "date", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={event.amount}
                  min={0}
                  onChange={(e) => updateUnlockEvent(i, "amount", e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => removeUnlockEvent(i)}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addUnlockEvent}>Add Unlock Event</button>
    </div>
  );
}
