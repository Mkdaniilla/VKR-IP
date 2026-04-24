import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface DataItem {
    name: string;
    value: number;
}

interface ValueBarChartProps {
    data: DataItem[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                <p className="text-sm font-black text-cyan-400">
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export default function ValueBarChart({ data }: ValueBarChartProps) {
    return (
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                        hide
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        fill="url(#barGradient)"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} className="hover:opacity-80 transition-opacity cursor-pointer" />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
