import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Box, Grid as GridIcon, MapPin, Layers } from 'lucide-react';
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

    const selectedRack = racks.find(r => r.id === selectedRackId);

    // Fetch initial hierarchy (Rooms)
    useEffect(() => {
        fetch('/api/rooms').then(res => res.json()).then(setRooms);
    }, []);

    // Fetch Racks when Room changes
    useEffect(() => {
        if (selectedRoomId) {
            fetch(`/api/racks?roomId=${selectedRoomId}`).then(res => res.json()).then(data => {
                setRacks(data);
                setSelectedRackId('');
                setCages([]);
                setSelectedCageId(null);
            });
        } else {
            setRacks([]);
            setSelectedRackId('');
        }
    }, [selectedRoomId]);

    // Fetch Cages when Rack changes
    useEffect(() => {
        if (selectedRackId) {
            fetchCages();
        } else {
            setCages([]);
            setSelectedCageId(null);
        }
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

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Top Navigation Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 mb-6 shrink-0">
                <div className="flex items-center gap-2 font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <GridIcon size={18} className="text-indigo-500" />
                    <span>Görsel Navigatör</span>
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="flex items-center gap-2 flex-1">
                        <MapPin size={16} className="text-slate-400" />
                        <select
                            value={selectedRoomId}
                            onChange={e => setSelectedRoomId(e.target.value)}
                            className="flex-1 text-sm border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 py-2 px-3 bg-slate-50"
                        >
                            <option value="">-- Oda Seçiniz --</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                        <Layers size={16} className="text-slate-400" />
                        <select
                            value={selectedRackId}
                            onChange={e => setSelectedRackId(e.target.value)}
                            disabled={!selectedRoomId}
                            className="flex-1 text-sm border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 py-2 px-3 disabled:bg-slate-100 disabled:text-slate-400 bg-slate-50"
                        >
                            <option value="">-- Raf Seçiniz --</option>
                            {racks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                {selectedRack && selectedRack.sides === 2 && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveSide('A')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeSide === 'A' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            A Yüzü
                        </button>
                        <button
                            onClick={() => setActiveSide('B')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeSide === 'B' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            B Yüzü
                        </button>
                    </div>
                )}
            </div>

            {/* Grid Layout Area */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                {!selectedRack ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <GridIcon size={64} className="text-slate-200 mb-4" />
                        <p className="text-lg font-medium text-slate-500">Raf Görüntüleyici</p>
                        <p className="text-sm mt-1">Lütfen yukarıdan bir Oda ve Raf seçin.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto p-8 bg-slate-50/50 flex">
                        <div className="m-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            {/* The Grid */}
                            <div
                                className="inline-grid gap-3"
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
                                                    className={`relative flex flex-col items-center justify-center p-3 h-28 w-32 border-2 rounded-xl cursor-pointer transition-all ${selectedCageId === cage.id ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-105 z-10' : 'bg-[#f0fbf4] border-[#dcfce7] hover:border-green-300 hover:shadow-sm'}`}
                                                >
                                                    <Box size={32} className={selectedCageId === cage.id ? 'text-indigo-600 mb-2' : 'text-green-600 mb-2'} />
                                                    <span className="font-semibold text-slate-700 truncate w-full text-center px-1" title={cage.name}>{cage.name}</span>
                                                    <button
                                                        onClick={(e) => handleDeleteCage(e, cage.id)}
                                                        className="absolute top-1.5 right-1.5 text-slate-400 hover:text-red-500 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity bg-white/80 rounded-full p-1"
                                                        title="Kafesi Sil"
                                                    >
                                                        <Trash2 size={14} />
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
                                                    className="flex flex-col items-center justify-center p-3 h-28 w-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-slate-400 group"
                                                >
                                                    <Plus size={24} className="group-hover:scale-110 transition-transform mb-1 flex-shrink-0" />
                                                    <span className="text-xs font-medium group-hover:text-indigo-500">{activeSide}-{rowNum}-{colNum}</span>
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
                {isAddingCage && (
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
