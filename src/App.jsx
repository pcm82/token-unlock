import React, { useState } from "react";
import TokenForm from "./components/TokenForm";
import UnlockScheduleTable from "./components/UnlockScheduleTable";
import Charts from "./components/Charts";

const App = () => {
  const [schedule, setSchedule] = useState([]);
  const [discountedValues, setDiscountedValues] = useState([]);

  return (
    <div className="container">
      <h1>Token Unlock Tracker</h1>
      <TokenForm setSchedule={setSchedule} setDiscountedValues={setDiscountedValues} />
      <Charts schedule={schedule} discountedValues={discountedValues} />
      <UnlockScheduleTable schedule={schedule} discountedValues={discountedValues} />
    </div>
  );
};

export default App;