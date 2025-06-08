import React from "react";

const UnlockScheduleTable = ({ schedule, discountedValues }) => (
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Unlocked</th>
        <th>Discounted Value</th>
      </tr>
    </thead>
    <tbody>
      {discountedValues.map((row, idx) => (
        <tr key={idx}>
          <td>{row.date}</td>
          <td>{row.amount}</td>
          <td>{row.discountedValue.toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default UnlockScheduleTable;