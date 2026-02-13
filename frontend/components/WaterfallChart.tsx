import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

interface WaterfallChartProps {
    baseline: number;
    adjustment: number;
    final: number;
    currency: string;
}

export default function WaterfallChart({ baseline, adjustment, final, currency }: WaterfallChartProps) {
    const data = [
        {
            name: 'Базовая',
            value: baseline,
            fill: 'rgba(255,255,255,0.1)',
            stroke: 'rgba(255,255,255,0.2)'
        },
        {
            name: 'Коррекция',
            value: adjustment,
            fill: adjustment >= 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(244, 63, 94, 0.2)',
            stroke: adjustment >= 0 ? '#34d399' : '#f43f5e'
        },
        {
            name: 'Итоговая',
            value: final,
            fill: 'rgba(34, 211, 238, 0.2)',
            stroke: '#22d3ee'
        }
    ];

    const formatValue = (val: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(val);
    };

    return (
        <div className="w-full h-[250px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(val) => formatValue(val)}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const entry = payload[0].payload;
                                return (
                                    <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{entry.name}</p>
                                        <p className={`text-sm font-black ${entry.name === 'Итоговая' ? 'text-cyan-400' : 'text-white'}`}>
                                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: currency }).format(payload[0].value as number)}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.fill}
                                stroke={entry.stroke}
                                strokeWidth={2}
                                className="transition-all duration-500 hover:opacity-80"
                            />
                        ))}
                        <LabelList
                            dataKey="value"
                            position="top"
                            formatter={(val: number) => formatValue(val)}
                            style={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 800 }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
