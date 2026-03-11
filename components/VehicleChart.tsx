import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
}

const VehicleChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }} />
        <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default VehicleChart;
