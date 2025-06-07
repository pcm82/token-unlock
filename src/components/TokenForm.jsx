import React from "react";

export default function TokenForm({
  tokenName,
  setTokenName,
  totalAmount,
  setTotalAmount,
  spotPrice,
  setSpotPrice,
  impliedVolatility,
  setImpliedVolatility,
  dealDate,
  setDealDate,
  unlockEvents,
  setUnlockEvents,
}) {
  // Auto update unlockEvents if totalAmount changes or dealDate changes
  React.useEffect(() => {
    if (unlockEvents.length === 0) {
      setUnlockEvents([{ date: dealDate, amount: totalAmount }]);
    }
  }, [totalAmount, dealDate]);

  return (
    <form className="token-form" onSubmit={(e) => e.preventDefault()}>
      <label>
        Token Name:
        <input
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value.toUpperCase())}
          maxLength={10}
        />
      </label>

      <label>
        Total Tokens:
        <input
          type="number"
          value={totalAmount}
          min={0}
          onChange={(e) => setTotalAmount(Number(e.target.value))}
        />
      </label>

      <label>
        Spot Price ($):
        <input
          type="number"
          value={spotPrice}
          min={0}
          step={0.01}
          onChange={(e) => setSpotPrice(Number(e.target.value))}
        />
      </label>

      <label>
        Implied Volatility (annual %):
        <input
          type="number"
          value={(impliedVolatility * 100).toFixed(2)}
          min={0}
          max={500}
          step={0.1}
          onChange={(e) =>
            setImpliedVolatility(Math.min(Math.max(Number(e.target.value) / 100, 0), 5))
          }
        />
      </label>

      <label>
        Deal Date:
        <input
          type="date"
          value={dealDate}
          onChange={(e) => setDealDate(e.target.value)}
        />
      </label>
    </form>
  );
}
