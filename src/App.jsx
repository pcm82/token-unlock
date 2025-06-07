import React, { useState } from "react";
import TokenForm from "./components/TokenForm";
import UnlockScheduleTable from "./components/UnlockScheduleTable";
import Charts from "./components/Charts";
import { blackScholesPut } from "./components/BlackScholes";

export default function App() {
  const [tokenName, setTokenName] = useState("SOL");
  const [totalAmount, setTotalAmount] = useState(100000);
  const [spotPrice, setSpotPrice] = useState(150);
  const [impliedVolatility, setImpliedVolatility] = useState(0.87);
  const [dealDate, setDealDate] = useState(new Date().toISOString().slice(0, 10));
  const [unlockEvents, setUnlockEvents] = useState([
    { date: dealDate, amount: 0 },
  ]);

  // Calculate results for display
  // Sort events by date
  const sortedEvents = [...unlockEvents].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Calculate unlocked tokens cumulative and discounted value
  let cumulativeUnlocked = 0;
  const today = new Date();

  const results = sortedEvents.map(({ date, amount }) => {
    const unlockDate = new Date(date);
    cumulativeUnlocked += amount;

    // Time to unlock in years
    const T = Math.max(0, (unlockDate - new Date(dealDate)) / (1000 * 3600 * 24 * 365));

    // Risk-free rate = 0 for simplicity
    const r = 0;

    // Strike = spot price (ATM)
    const K = spotPrice;

    // Put option premium per token
    const putPremium = T > 0 ? blackScholesPut(spotPrice, K, T, r, impliedVolatility) : 0;

    // Discounted price per token after DLOM
    const discountedPrice = spotPrice - putPremium;

    // Discount % = premium / spotPrice
    const discountPercent = putPremium / spotPrice;

    // Total discounted value for this unlock event
    const discountedValue = discountedPrice * amount;

    return {
      date,
      amount,
      cumulativeUnlocked,
      putPremium,
      discountedPrice,
      discountPercent,
      discountedValue,
    };
  });

  // Total unlocked tokens and total discounted value
  const totalUnlocked = cumulativeUnlocked;
  const totalDiscountedValue = results.reduce((sum, r) => sum + r.discountedValue, 0);

  return (
    <div className="app-container">
      <h1>Token Unlocks Tracker</h1>
      <TokenForm
        tokenName={tokenName}
        setTokenName={setTokenName}
        totalAmount={totalAmount}
        setTotalAmount={setTotalAmount}
        spotPrice={spotPrice}
        setSpotPrice={setSpotPrice}
        impliedVolatility={impliedVolatility}
        setImpliedVolatility={setImpliedVolatility}
        dealDate={dealDate}
        setDealDate={setDealDate}
        unlockEvents={unlockEvents}
        setUnlockEvents={setUnlockEvents}
      />
      <UnlockScheduleTable unlockEvents={unlockEvents} setUnlockEvents={setUnlockEvents} />
      <div className="summary">
        <h2>Summary</h2>
        <p>
          Total Tokens: {totalAmount} | Total Unlocked Tokens: {totalUnlocked}
        </p>
        <p>
          Spot Price: ${spotPrice.toFixed(2)} | Implied Volatility: {(impliedVolatility * 100).toFixed(1)}%
        </p>
        <p>
          Total Discounted Value: ${totalDiscountedValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
        </p>
      </div>
      <Charts results={results} totalAmount={totalAmount} spotPrice={spotPrice} />
      <footer>
        <p>
          Powered by ParaFi Token Unlocks Take-home | Developed by pcm82
        </p>
      </footer>
    </div>
  );
}
