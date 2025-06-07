import React from "react";
import { addDays } from "date-fns";

export default function UnlockScheduleTable({ data }) {
  return (
    <table>
      <thead>
        <tr><th>Date</th><th>Amount</th><th>DLOM Price</th></tr>
      </thead>
      <tbody>
        {data.map((u, i) => (
          <tr key={i}>
            <td>{addDays(new Date(), u.days).toDateString()}</td>
            <td>{u.amount}</td>
            <td>${(u.putPrice ? u.spotPrice - u.putPrice : u.spotPrice).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}