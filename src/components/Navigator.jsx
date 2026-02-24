import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Box, Grid as GridIcon, MapPin, Layers, ChevronRight, ChevronLeft, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navigator() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Data states
    const [rooms, setRooms] = useState([]);
    const [racks, setRacks] = useState([]);
    const [cages, setCages] = useState([]);

    // Selection states
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedRackId, setSelectedRackId] = useState('');
    const [selectedCageId, setSelectedCageId] = useState(null);

    const [newCageName, setNewCageName] = useState('');
    const [newCageBarcode, setNewCageBarcode] = useState('');

    // Grid states
    const [activeSide, setActiveSide] = useState('A');
    const [isAddingCage, setIsAddingCage] = useState(false);
    const [newCageRow, setNewCageRow] = useState(1);
    const [newCageCol, setNewCageCol] = useState(1);

    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
    const selectedRack = racks.find(r => r.id === selectedRackId);

    const activeRoomIndex = rooms.findIndex(r => r.id === selectedRoomId);
    const prevRoom = activeRoomIndex > 0 ? rooms[activeRoomIndex - 1] : null;
    const nextRoom = activeRoomIndex >= 0 && activeRoomIndex < rooms.length - 1 ? rooms[activeRoomIndex + 1] : null;

    const activeRackIndex = racks.findIndex(r => r.id === selectedRackId);
    const prevRack = activeRackIndex > 0 ? racks[activeRackIndex - 1] : null;
    const nextRack = activeRackIndex >= 0 && activeRackIndex < racks.length - 1 ? racks[activeRackIndex + 1] : null;

    // Fetch initial hierarchy (Rooms)
    useEffect(() => {
        fetch('/api/rooms').then(res => res.json()).then(setRooms);
    }, []);

    // Fetch Racks when Room changes
    useEffect(() => {
        if (selectedRoomId) {
            fetch(`/api/racks?roomId=${selectedRoomId}`).then(res => res.json()).then(data => {
                setRacks(data);
            });
        } else {
            setRacks([]);
        }
        setSelectedRackId('');
        setCages([]);
        setSelectedCageId(null);
    }, [selectedRoomId]);

    // Fetch Cages when Rack changes
    useEffect(() => {
        if (selectedRackId) {
            fetchCages();
        } else {
            setCages([]);
        }
        setSelectedCageId(null);
    }, [selectedRackId]);

    const fetchCages = () => {
        fetch(`/api/cages?rackId=${selectedRackId}`).then(res => res.json()).then(setCages);
    };

    // Cage handlers
    const handleAddCage = async (e) => {
        e.preventDefault();
        if (!newCageName || !selectedRackId) return;
        try {
            const res = await fetch('/api/cages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rackId: selectedRackId,
                    name: newCageName,
                    barcode: newCageBarcode,
                    side: activeSide,
                    row: newCageRow,
                    column: newCageCol
                })
            });
            if (res.ok) {
                setNewCageName('');
                setNewCageBarcode('');
                setIsAddingCage(false);
                fetchCages();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCage = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Bu kafesi ve içindeki hayvanları silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/cages?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (selectedCageId === id) setSelectedCageId(null);
                fetchCages();
            }
        } catch (e) { console.error(e); }
    }

    // Navigation Helpers
    const handleBreadcrumbClick = (level) => {
        if (level === 'root') {
            setSelectedRoomId('');
            setSelectedRackId('');
        } else if (level === 'room') {
            setSelectedRackId('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] font-sans">
            {/* Minimal Breadcrumb Header */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between mb-6 shrink-0">
                <nav className="flex items-center text-sm font-medium text-slate-500 gap-1.5 overflow-x-auto">
                    <button
                        onClick={() => handleBreadcrumbClick('root')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!selectedRoomId && !selectedRackId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'}`}
                    >
                        <Home size={16} /> Tüm Odalar
                    </button>

                    {selectedRoom && (
                        <>
                            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                            <button
                                onClick={() => handleBreadcrumbClick('room')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${selectedRoomId && !selectedRackId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'}`}
                            >
                                <MapPin size={16} className={selectedRoomId && !selectedRackId ? 'text-indigo-500' : 'text-slate-400'} /> {selectedRoom.name}
                            </button>
                        </>
                    )}

                    {selectedRack && (
                        <>
                            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 whitespace-nowrap cursor-default border border-indigo-100">
                                <Layers size={16} className="text-indigo-500" /> {selectedRack.name}
                            </div>
                        </>
                    )}
                </nav>

                {/* Back Button / Actions */}
                <div className="flex items-center gap-3">
                    {selectedRoomId && (
                        <button
                            onClick={() => handleBreadcrumbClick(selectedRackId ? 'room' : 'root')}
                            className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft size={16} /> Geri Dön
                        </button>
                    )}
                    {selectedRack && selectedRack.sides === 2 && (
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                            <button
                                onClick={() => setActiveSide('A')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-shadow ${activeSide === 'A' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                A Yüzü
                            </button>
                            <button
                                onClick={() => setActiveSide('B')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-shadow ${activeSide === 'B' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                B Yüzü
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic View Area */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">

                {/* 1. ROOM LEVEL VIEW */}
                {!selectedRoomId && (
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#fafcff]">
                        <div className="mb-4 text-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Tesis Odaları</h3>
                        </div>
                        {rooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                                <Home size={48} className="text-slate-200 mb-4" />
                                <p>Henüz kayıtlı bir oda bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                {rooms.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => setSelectedRoomId(room.id)}
                                        className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md"
                                    >
                                        <div className="px-2">
                                            <h4 className="font-semibold text-slate-800 text-sm sm:text-base group-hover:text-indigo-700 transition-colors line-clamp-1">{room.name}</h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Oda</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. RACK LEVEL VIEW */}
                {selectedRoomId && !selectedRackId && (
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#fafcff]">
                        <div className="mb-4 flex items-center justify-center gap-4">
                            <button
                                onClick={() => prevRoom && setSelectedRoomId(prevRoom.id)}
                                disabled={!prevRoom}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                title={prevRoom ? prevRoom.name : ''}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight min-w-[120px] text-center">
                                {selectedRoom?.name}
                            </h3>
                            <button
                                onClick={() => nextRoom && setSelectedRoomId(nextRoom.id)}
                                disabled={!nextRoom}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                title={nextRoom ? nextRoom.name : ''}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                        {racks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                                <Layers size={48} className="text-slate-200 mb-4" />
                                <p>Bu odada kayıtlı bir raf bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                {racks.map(rack => (
                                    <div
                                        key={rack.id}
                                        onClick={() => setSelectedRackId(rack.id)}
                                        className={`group cursor-pointer bg-white border rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md ${selectedRackId === rack.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
                                    >
                                        <div className="px-2">
                                            <h4 className={`font-semibold text-sm sm:text-base transition-colors line-clamp-1 ${selectedRackId === rack.id ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-700'}`}>{rack.name}</h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{rack.rows}x{rack.cols} • {rack.sides === 2 ? 'Çift Yüzlü' : 'Tek Yüzlü'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. CAGE (GRID) LEVEL VIEW */}
                {selectedRackId && selectedRack && (
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#fafcff] flex flex-col">
                        <div className="mb-4 flex items-center justify-center gap-4">
                            <button
                                onClick={() => prevRack && setSelectedRackId(prevRack.id)}
                                disabled={!prevRack}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                title={prevRack ? prevRack.name : ''}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight min-w-[120px] text-center">
                                {selectedRack?.name}
                            </h3>
                            <button
                                onClick={() => nextRack && setSelectedRackId(nextRack.id)}
                                disabled={!nextRack}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                title={nextRack ? nextRack.name : ''}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                        <div className="m-auto bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-x-auto">
                            {/* The Grid */}
                            <div
                                className="inline-grid gap-2 sm:gap-3"
                                style={{ gridTemplateColumns: `repeat(${selectedRack.cols || 1}, minmax(0, 1fr))` }}
                            >
                                {Array.from({ length: selectedRack.rows || 1 }).map((_, rIdx) => {
                                    const rowNum = rIdx + 1;
                                    return Array.from({ length: selectedRack.cols || 1 }).map((_, cIdx) => {
                                        const colNum = cIdx + 1;
                                        const cage = cages.find(c => (c.side || 'A') === activeSide && c.row === rowNum && c.column === colNum);

                                        if (cage) {
                                            // Filled Slot
                                            return (
                                                <div
                                                    key={`slot-${rowNum}-${colNum}`}
                                                    onClick={() => setSelectedCageId(cage.id)}
                                                    className={`relative flex flex-col items-center justify-center p-2 min-h-[4.5rem] min-w-[5rem] sm:min-h-[5rem] sm:min-w-[6rem] border rounded-xl cursor-pointer transition-all ${selectedCageId === cage.id ? 'bg-indigo-50 border-indigo-500 shadow-sm z-10' : 'bg-[#f4fbf7] border-[#d8f4e2] hover:border-green-300'}`}
                                                >
                                                    <Box size={20} className={selectedCageId === cage.id ? 'text-indigo-600 mb-1' : 'text-green-600 mb-1'} />
                                                    <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate w-full text-center px-1" title={cage.name}>{cage.name}</span>
                                                    <button
                                                        onClick={(e) => handleDeleteCage(e, cage.id)}
                                                        className="absolute top-1 right-1 text-slate-400 hover:text-red-500 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity bg-white/90 rounded-full p-0.5"
                                                        title="Kafesi Sil"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )
                                        } else {
                                            // Empty Slot
                                            return (
                                                <div
                                                    key={`slot-${rowNum}-${colNum}`}
                                                    onClick={() => {
                                                        setNewCageRow(rowNum);
                                                        setNewCageCol(colNum);
                                                        setNewCageName(`C-${activeSide}${rowNum}${colNum}`);
                                                        setIsAddingCage(true);
                                                    }}
                                                    className="flex flex-col items-center justify-center p-2 min-h-[4.5rem] min-w-[5rem] sm:min-h-[5rem] sm:min-w-[6rem] border border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-slate-400 group"
                                                >
                                                    <Plus size={18} className="transition-transform mb-1 flex-shrink-0" />
                                                    <span className="text-[10px] sm:text-xs font-medium group-hover:text-indigo-500">{activeSide}-{rowNum}-{colNum}</span>
                                                </div>
                                            )
                                        }
                                    });
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Cage Modal Context */}
                {isAddingCage && selectedRackId && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 min-w-[400px] bg-white p-5 border border-slate-200 shadow-xl rounded-2xl z-50">
                        <form onSubmit={handleAddCage} className="space-y-4">
                            <h4 className="font-semibold text-indigo-800 flex items-center gap-2 border-b border-indigo-100 pb-2">
                                <Plus size={18} /> Yeni Kafes Ekle (Slot: {activeSide}-{newCageRow}-{newCageCol})
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Kafes Adı/Kodu</label>
                                    <input type="text" placeholder="Örn: C-101" value={newCageName} onChange={e => setNewCageName(e.target.value)} required className="w-full text-sm rounded-lg border-slate-300 py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Barkod / RFID (Opsiyonel)</label>
                                    <input type="text" placeholder="Okutun veya yazın..." value={newCageBarcode} onChange={e => setNewCageBarcode(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddingCage(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">İptal</button>
                                <button type="submit" disabled={!newCageName} className="bg-indigo-600 text-white font-medium text-sm py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm">Slota Ekle</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
