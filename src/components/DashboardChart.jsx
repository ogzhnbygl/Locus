import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { REMOVAL_REASONS } from '../lib/constants';

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function DashboardChart({ data }) {
    const [selectedReasons, setSelectedReasons] = useState([]);

    // Flatten all reasons for the filter dropdown
    const allReasons = useMemo(() => {
        return REMOVAL_REASONS.flatMap(category => category.options);
    }, []);

    // Process data for the chart
    const chartData = useMemo(() => {
        return data.map(item => {
            // Calculate filtered count based on selected reasons
            let filteredCount = 0;
            if (selectedReasons.length > 0) {
                selectedReasons.forEach(reasonCode => {
                    filteredCount += (item.reasons[reasonCode] || 0);
                });
            }

            return {
                name: MONTH_NAMES[parseInt(item.month) - 1],
                total: item.total,
                filtered: filteredCount,
                remainder: item.total - filteredCount,
                originalData: item
            };
        });
    }, [data, selectedReasons]);

    const handleReasonToggle = (value) => {
        // Check if it's a category selection
        if (value.startsWith('CAT:')) {
            const catId = value.split(':')[1];
            const category = REMOVAL_REASONS.find(c => c.id === catId);
            if (category) {
                const catCodes = category.options.map(o => o.code);
                setSelectedReasons(prev => {
                    // If all are already selected, deselect them
                    const allSelected = catCodes.every(code => prev.includes(code));
                    if (allSelected) {
                        return prev.filter(code => !catCodes.includes(code));
                    } else {
                        // Add missing ones
                        const newSet = new Set([...prev, ...catCodes]);
                        return Array.from(newSet);
                    }
                });
            }
            return;
        }

        // Normal single reason toggle
        const code = value;
        setSelectedReasons(prev => {
            if (prev.includes(code)) {
                return prev.filter(c => c !== code);
            } else {
                return [...prev, code];
            }
        });
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const total = data.total;
            const filtered = data.filtered;
            const percentage = total > 0 ? ((filtered / total) * 100).toFixed(1) : 0;

            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    <p className="text-slate-600">Toplam: <span className="font-semibold">{total}</span></p>
                    {selectedReasons.length > 0 && (
                        <>
                            <div className="my-1 border-t border-slate-100"></div>
                            <p className="text-indigo-600">Seçilenler: <span className="font-semibold">{filtered}</span></p>
                            <p className="text-slate-500 text-xs">Oran: %{percentage}</p>
                        </>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Aylık Çıkarılma Analizi</h3>

                {/* Reason Filter */}
                <div className="relative group">
                    <select
                        className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
                        onChange={(e) => {
                            if (e.target.value) handleReasonToggle(e.target.value);
                            e.target.value = ""; // Reset select to allow re-selecting same option if needed (though toggle handles it)
                        }}
                    >
                        <option value="">Filtrele...</option>
                        {REMOVAL_REASONS.map(category => (
                            <optgroup key={category.id} label={category.label}>
                                <option value={`CAT:${category.id}`} className="font-semibold text-indigo-600">
                                    ↳ Tümünü Seç ({category.id})
                                </option>
                                {category.options.map(option => (
                                    <option key={option.code} value={option.code} disabled={selectedReasons.includes(option.code)}>
                                        {option.code}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </div>

            {/* Selected Filters Tags */}
            {selectedReasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedReasons.map(code => (
                        <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {code}
                            <button
                                onClick={() => handleReasonToggle(code)}
                                className="hover:text-indigo-900"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={() => setSelectedReasons([])}
                        className="text-xs text-slate-500 hover:text-slate-700 underline ml-2"
                    >
                        Temizle
                    </button>
                </div>
            )}

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

                        {/* Stacked Bars */}
                        {/* Filtered portion (Highlighted) */}
                        <Bar dataKey="filtered" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />

                        {/* Remainder portion (Faded) */}
                        <Bar dataKey="remainder" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
