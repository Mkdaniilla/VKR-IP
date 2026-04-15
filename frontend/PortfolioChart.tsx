import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

interface DataItem {
    name: string;
    value: number;
    color: string;
}

interface PortfolioChartProps {
    data: DataItem[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{payload[0].name}</p>
                <p className="text-lg font-black text-white">
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export default function PortfolioChart({ data }: PortfolioChartProps) {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="transparent"
                                style={{ filter: `drop-shadow(0 0 8px ${entry.color}44)` }}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        content={({ payload }) => (
                            <ul className="flex flex-wrap justify-center gap-4 mt-4">
                                {payload?.map((entry: any, index: number) => (
                                    <li key={`item-${index}`} className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                        ></span>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {entry.value}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
