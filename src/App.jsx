import React, { useState } from "react";
import TokenForm from "./components/TokenForm";
import UnlockScheduleTable from "./components/UnlockScheduleTable";
import Charts from "./components/Charts";
import { calculateUnlocks } from "./utils/vestingLogic";
import { fetchTokenPriceAndVolatility } from "./utils/api";

export default function App() {
  const [unlockData, setUnlockData] = useState([]);

  const handleFormSubmit = async (form) => {
    const { unlocks, impliedVolatility, spotPrice } = form;
    const unlocksWithDLOM = unlocks.map((u) => ({
      ...u,
      ...window.BlackScholes(spotPrice, spotPrice, u.days / 365, impliedVolatility, 0)
    }));
    setUnlockData(unlocksWithDLOM);
  };

  return (
    <div className="app">
      <h1>Token Unlock Tracker</h1>
      <TokenForm onSubmit={handleFormSubmit} />
      <UnlockScheduleTable data={unlockData} />
      <Charts data={unlockData} />
    </div>
  );
}