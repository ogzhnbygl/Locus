import React from 'react';

export function StatsCard({ title, value, colorClass }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1">{title}</div>
            <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
        </div>
    );
}
