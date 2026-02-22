import React, { useEffect, useState } from 'react';
import { StatsCard } from './StatsCard';
import { DashboardChart } from './DashboardChart';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
    const [stats, setStats] = useState({ year: 0, month: 0, projectTermination: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/dashboard-stats');
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats');
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-8">
                Veriler yüklenirken bir hata oluştu: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatsCard
                    title="Bu Yıl Sürüden Çıkan"
                    value={stats.year}
                    colorClass="text-slate-800"
                />
                <StatsCard
                    title="Bu Ay Sürüden Çıkan"
                    value={stats.month}
                    colorClass="text-indigo-600"
                />
                <StatsCard
                    title="Proje Sonlandırma (EXP-01)"
                    value={stats.projectTermination}
                    colorClass="text-emerald-600"
                />
            </div>

            {/* Monthly Trend Chart */}
            <DashboardChart data={stats.monthlyData || []} />
        </div>
    );
}
