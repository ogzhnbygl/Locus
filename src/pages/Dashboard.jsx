import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, MapPin, Layers, Grid as GridIcon } from 'lucide-react';
import RoomRackManager from '../components/RoomRackManager';
import Navigator from '../components/Navigator';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activeView, setActiveView] = useState('rooms');

    const renderContent = () => {
        if (activeView === 'rooms') return <RoomRackManager />;
        if (activeView === 'navigator') return <Navigator />;
        return null;
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white">
                            <MapPin size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-none">Locus</h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Dijital İkiz | Vivaryum</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveView('rooms')}
                            className={`px - 4 py - 1.5 text - sm font - medium rounded - md transition - all flex items - center gap - 2 ${activeView === 'rooms'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                } `}
                        >
                            <Layers size={16} /> Odalar & Raflar
                        </button>
                        <button
                            onClick={() => setActiveView('navigator')}
                            className={`px - 4 py - 1.5 text - sm font - medium rounded - md transition - all flex items - center gap - 2 ${activeView === 'navigator'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                } `}
                        >
                            <GridIcon size={16} /> Navigatör
                        </button>
                    </nav>

                    {/* User Profile & Actions */}
                    <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-700 leading-tight">
                                {user?.name || 'Kullanıcı'}
                            </span>
                            <span className="text-xs text-slate-500 capitalize leading-tight">
                                {user?.role || 'Yetkisiz'}
                            </span>
                        </div>

                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
                            title="Çıkış Yap"
                        >
                            <LogOut size={20} />
                            <span className="text-sm font-medium sm:hidden">Çıkış</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-[1600px] mx-auto w-full p-6">
                {activeView === 'rooms' && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Tesis Yapısı</h2>
                        <p className="text-sm text-slate-500 mt-1">Vivaryum odalarınızı ve bu odalardaki kafes raflarını yönetin.</p>
                    </div>
                )}
                {activeView === 'navigator' && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Navigatör</h2>
                        <p className="text-sm text-slate-500 mt-1">Fiziksel kafes ızgarasında gezinerek direkt slotlar üzerinde işlem yapın.</p>
                    </div>
                )}

                {renderContent()}
            </main>
        </div>
    );
}
