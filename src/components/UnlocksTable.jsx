import React from 'react';
import './UnlocksTable.css';

export default function UnlocksTable({ data }) {
  return (
    <table className="unlocks-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            <td>{row.date}</td>
            <td>{row.value.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
