import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Chart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="x" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
        <YAxis />
        <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
        <Line type="monotone" dataKey="y" stroke="#007acc" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}