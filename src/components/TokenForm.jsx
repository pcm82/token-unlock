import React, { useState } from "react";
import { parseSchedule } from "../utils/scheduleParser";
import { getSpotPriceAndVolatility } from "../utils/api";
import { calculateDLOM } from "../utils/blackScholes";

const TokenForm = ({ setSchedule, setDiscountedValues }) => {
  const [form, setForm] = useState({
    token: "solana",
    spotPrice: "",
    volatility: "",
    unlocks: [{ type: "cliff", date: "", amount: "" }]
  });

  const handleChange = (e, index) => {
    const updated = [...form.unlocks];
    updated[index][e.target.name] = e.target.value;
    setForm({ ...form, unlocks: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const spotVol = await getSpotPriceAndVolatility(form.token);
    const spot = parseFloat(form.spotPrice || spotVol.price);
    const vol = parseFloat(form.volatility || spotVol.volatility);
    const schedule = parseSchedule(form.unlocks);
    const discounted = schedule.map(entry => ({
      ...entry,
      discountedValue: entry.amount * (spot - calculateDLOM(spot, vol, entry.date))
    }));
    setSchedule(schedule);
    setDiscountedValues(discounted);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="token" placeholder="Token name" value={form.token} onChange={e => setForm({ ...form, token: e.target.value })} />
      <input name="spotPrice" placeholder="Spot Price (optional)" value={form.spotPrice} onChange={e => setForm({ ...form, spotPrice: e.target.value })} />
      <input name="volatility" placeholder="Volatility (optional)" value={form.volatility} onChange={e => setForm({ ...form, volatility: e.target.value })} />
      {form.unlocks.map((u, i) => (
        <div key={i}>
          <select name="type" value={u.type} onChange={e => handleChange(e, i)}>
            <option value="cliff">Cliff</option>
            <option value="linear">Linear</option>
          </select>
          <input name="date" placeholder="YYYY-MM-DD" value={u.date} onChange={e => handleChange(e, i)} />
          <input name="amount" placeholder="Amount" value={u.amount} onChange={e => handleChange(e, i)} />
        </div>
      ))}
      <button type="submit">Calculate</button>
    </form>
  );
};

export default TokenForm;