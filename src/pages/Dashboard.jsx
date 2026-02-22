import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Box, Grid as GridIcon, MapPin, Plus } from 'lucide-react';
import RoomRackManager from '../components/RoomRackManager';
import CageAnimalManager from '../components/CageAnimalManager';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('rooms');

    const renderContent = () => {
        if (activeTab === 'rooms') return <RoomRackManager />;
        if (activeTab === 'cages' || activeTab === 'animals') return <CageAnimalManager />;
        return null;
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                        <MapPin className="text-indigo-500" />
                        Locus
                    </h1>
                    <p className="text-sm mt-1 text-slate-400 font-medium">Dijital İkiz | Vivaryum</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'rooms'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Home size={18} />
                        Odalar & Raflar (Admin)
                    </button>
                    <button
                        onClick={() => setActiveTab('cages')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'cages'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <GridIcon size={18} />
                        Kafesler
                    </button>
                    <button
                        onClick={() => setActiveTab('animals')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'animals'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Box size={18} />
                        Hayvan Kayıtları
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4 px-2">
                        <div className="text-sm font-medium text-white">{user?.name || 'Kullanıcı'}</div>
                        <div className="text-xs text-slate-500 capitalize">{user?.role || 'Kullanıcı'}</div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-400/10 transition-colors"
                    >
                        <LogOut size={18} />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-slate-800 capitalize">
                        {activeTab === 'rooms' ? 'Tesis Yapısı (Oda & Raf)' : activeTab === 'cages' ? 'Kafes Yönetimi' : 'Hayvan Kayıtları'}
                    </h2>
                </header>

                <div className="p-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
