import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

interface AssetHealthRadarProps {
    metrics: Record<string, number>;
}

const metricLabels: Record<string, string> = {
    // SaaS
    mrr: 'MRR/ARR',
    churn: 'LTV/Churn',
    scalability: 'Масштаб.',
    tech_debt: 'Код/Архит.',
    // Game
    players: 'DAU/MAU',
    retention: 'Retention',
    arpu: 'ARPU',
    ip_potential: 'IP Потенц.',
    // Pharma
    development_stage: 'Стадия',
    market_size: 'Рынок',
    efficacy: 'Эффект.',
    patent_strength: 'Патенты',
    // Literature
    circulation: 'Тираж',
    literary_value: 'Ценность',
    adaptation_potential: 'Адаптация',
    // Default
    uniqueness: 'Уникальность',
    commercial_potential: 'Потенциал',
    protection: 'Защита',
    market_fit: 'Market Fit'
};

export default function AssetHealthRadar({ metrics }: AssetHealthRadarProps) {
    const data = Object.entries(metrics).map(([key, value]) => ({
        subject: metricLabels[key] || key,
        A: value,
        fullMark: 10,
    }));

    if (data.length === 0) return null;

    return (
        <div className="w-full h-[300px] animate-in fade-in duration-1000">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 10]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Показатели"
                        dataKey="A"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
