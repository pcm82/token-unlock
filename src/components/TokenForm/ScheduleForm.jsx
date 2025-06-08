// components/TokenForm/ScheduleForm.jsx
import React from 'react';
import cronstrue from 'cronstrue';

export default function ScheduleForm({ index, schedule, tokens, onChange, onTokenChange, onRemove }) {
  const handleFieldChange = (field, value) => onChange(index, field, value);

  const updateCron = (field, value) => {
    const newSchedule = { ...schedule, [field]: value };
    const cronExpr = `${newSchedule.cronMin} ${newSchedule.cronHour} ${newSchedule.cronDom} ${newSchedule.cronMon} ${newSchedule.cronDow}`;
    newSchedule.frequencyValue = cronExpr;
    onChange(index, field, value);
    onChange(index, 'frequencyValue', cronExpr);
  };

  return (
    <fieldset style={{ marginBottom: 20, padding: 15, border: '1px solid #ccc', borderRadius: 8 }}>
      <legend>Schedule #{index + 1}</legend>

      <label>
        Token:
        <select value={schedule.token?.id || ''} onChange={e => onTokenChange(index, e.target.value)} style={{ marginLeft: 10, width: 180 }}>
          <option value="">-- Select token --</option>
          {tokens.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.symbol.toUpperCase()})</option>
          ))}
        </select>
      </label>

      <br />

      <label>
        Spot Price (USD):
        <input type="number" value={schedule.spotPrice} onChange={e => handleFieldChange('spotPrice', e.target.value)} required style={{ marginLeft: 10, width: 120 }} />
      </label>

      <br />

      <label>
        Implied Volatility (%):
        <input type="number" value={schedule.volatility} onChange={e => handleFieldChange('volatility', e.target.value)} required style={{ marginLeft: 10, width: 120 }} />
      </label>

      <br />

      <label>
        Strike Price (USD):
        <input type="number" value={schedule.strikePrice} onChange={e => handleFieldChange('strikePrice', e.target.value)} required style={{ marginLeft: 10, width: 120 }} />
      </label>

      <br />

      <label>
        Amount:
        <input type="number" value={schedule.amount} onChange={e => handleFieldChange('amount', e.target.value)} required style={{ marginLeft: 10, width: 120 }} />
      </label>

      <br />

      <label>
        Unlock Type:
        <select value={schedule.type} onChange={e => handleFieldChange('type', e.target.value)} style={{ marginLeft: 10, width: 120 }}>
          <option value="cliff">Cliff</option>
          <option value="linear">Linear</option>
        </select>
      </label>

      <br />

      <label>
        Start Date:
        <input type="date" value={schedule.startDate} onChange={e => handleFieldChange('startDate', e.target.value)} required style={{ marginLeft: 10, width: 160 }} />
      </label>

      <br />

      {schedule.type === 'linear' && (
        <>
          <label>
            End Date:
            <input type="date" value={schedule.endDate} onChange={e => handleFieldChange('endDate', e.target.value)} required style={{ marginLeft: 10, width: 160 }} />
          </label>

          <br />

          <label>
            Frequency Type:
            <select value={schedule.frequencyType} onChange={e => handleFieldChange('frequencyType', e.target.value)} style={{ marginLeft: 10, width: 140 }}>
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
              <input type="number" min="1" value={schedule.frequencyValue} onChange={(e) => handleFieldChange('frequencyValue', e.target.value)} style={{ marginLeft: 10, width: 60 }} />
            </label>
          )}

          {schedule.frequencyType === 'customCron' && (
            <>
              {/* Cron field inputs */}
              <label>Minute:<input value={schedule.cronMin} onChange={e => updateCron('cronMin', e.target.value)} /></label>
              <label>Hour:<input value={schedule.cronHour} onChange={e => updateCron('cronHour', e.target.value)} /></label>
              <label>Day:<input value={schedule.cronDom} onChange={e => updateCron('cronDom', e.target.value)} /></label>
              <label>Month:<input value={schedule.cronMon} onChange={e => updateCron('cronMon', e.target.value)} /></label>
              <label>Weekday:<input value={schedule.cronDow} onChange={e => updateCron('cronDow', e.target.value)} /></label>
              <br />
              <p style={{ color: '#007' }}>
                Cron Description: {cronstrue.toString(schedule.frequencyValue || '* * * * *')}
              </p>
            </>
          )}
        </>
      )}

      <br />
      <button type="button" onClick={() => onRemove(index)} style={{ color: 'red' }}>Remove Schedule</button>
    </fieldset>
  );
}
