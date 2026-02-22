import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Box, Grid as GridIcon, Hash, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { STRAINS, SPECIES, SEXES } from '../lib/constants';

export default function CageAnimalManager() {
    const { user } = useAuth();

    // Data states
    const [rooms, setRooms] = useState([]);
    const [racks, setRacks] = useState([]);
    const [cages, setCages] = useState([]);
    const [animals, setAnimals] = useState([]);

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

    // Animal Form states
    const [showAnimalForm, setShowAnimalForm] = useState(false);
    const [animalForm, setAnimalForm] = useState({
        species: 'Fare',
        strain: 'BALB/c',
        sex: 'Erkek',
        count: 1,
        dob: new Date().toISOString().split('T')[0],
        projectCode: ''
    });

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

    // Fetch Animals when Cage changes
    useEffect(() => {
        if (selectedCageId) {
            fetchAnimals();
        } else {
            setAnimals([]);
        }
    }, [selectedCageId]);

    const fetchAnimals = () => {
        fetch(`/api/animals?cageId=${selectedCageId}`).then(res => res.json()).then(setAnimals);
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

    // Animal handlers
    const handleAnimalFormChange = (e) => {
        const { name, value } = e.target;
        setAnimalForm(prev => {
            const updated = { ...prev, [name]: value };
            // If species changed, reset strain to first available
            if (name === 'species') {
                updated.strain = STRAINS[value][0];
            }
            return updated;
        });
    }

    const handleAddAnimal = async (e) => {
        e.preventDefault();
        if (!selectedCageId) return;

        try {
            const res = await fetch('/api/animals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cageId: selectedCageId, ...animalForm })
            });
            if (res.ok) {
                setShowAnimalForm(false);
                fetchAnimals();
            }
        } catch (e) {
            console.error(e);
        }
    }

    const handleDeleteAnimal = async (id) => {
        if (!window.confirm('Kaydı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/animals?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchAnimals();
        } catch (e) { console.error(e); }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
            {/* Navigation (Room -> Rack -> Cage Selection) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Filter size={18} className="text-indigo-500" /> Navigasyon
                    </div>
                    <div className="space-y-3">
                        <select
                            value={selectedRoomId}
                            onChange={e => setSelectedRoomId(e.target.value)}
                            className="w-full text-sm border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 py-2.5 px-3"
                        >
                            <option value="">-- Oda Seçiniz --</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <select
                            value={selectedRackId}
                            onChange={e => setSelectedRackId(e.target.value)}
                            disabled={!selectedRoomId}
                            className="w-full text-sm border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 py-2.5 px-3 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="">-- Raf Seçiniz --</option>
                            {racks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {selectedRack ? (
                        <div className="flex flex-col h-full">
                            {/* Rack Sides Tabs */}
                            {selectedRack.sides === 2 && (
                                <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
                                    <button
                                        onClick={() => setActiveSide('A')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSide === 'A' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        A Yüzü
                                    </button>
                                    <button
                                        onClick={() => setActiveSide('B')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSide === 'B' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        B Yüzü
                                    </button>
                                </div>
                            )}

                            {/* Grid Renderer */}
                            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-auto">
                                <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedRack.cols || 1}, minmax(0, 1fr))` }}>
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
                                                        className={`relative flex flex-col items-center justify-center p-2 h-20 w-24 border rounded-lg cursor-pointer transition-all ${selectedCageId === cage.id ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20' : 'bg-[#f0fbf4] border-[#dcfce7] hover:border-green-300'}`}
                                                    >
                                                        <Box size={24} className={selectedCageId === cage.id ? 'text-indigo-600' : 'text-green-600'} />
                                                        <span className="text-xs font-semibold mt-1 text-slate-700 truncate w-full text-center" title={cage.name}>{cage.name}</span>
                                                        <button
                                                            onClick={(e) => handleDeleteCage(e, cage.id)}
                                                            className="absolute top-1 right-1 text-slate-400 hover:text-red-500 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
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
                                                        className="flex flex-col items-center justify-center p-2 h-20 w-24 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-slate-400 group"
                                                    >
                                                        <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] mt-1 font-medium">{activeSide}-{rowNum}-{colNum}</span>
                                                    </div>
                                                )
                                            }
                                        });
                                    })}
                                </div>
                            </div>

                            {/* Add Cage Modal Context */}
                            {isAddingCage && (
                                <form onSubmit={handleAddCage} className="mt-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl space-y-3 relative">
                                    <h4 className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                                        Yeni Kafes Ekle (Slot: {activeSide}-{newCageRow}-{newCageCol})
                                    </h4>
                                    <input type="text" placeholder="Kafes İsmi (Örn: C-101)" value={newCageName} onChange={e => setNewCageName(e.target.value)} required className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                                    <input type="text" placeholder="Barkod / RFID (Opsiyonel)" value={newCageBarcode} onChange={e => setNewCageBarcode(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button type="button" onClick={() => setIsAddingCage(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800">İptal</button>
                                        <button type="submit" disabled={!newCageName} className="bg-indigo-600 text-white font-medium text-sm py-1.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">Ekle</button>
                                    </div>
                                </form>
                            )}

                        </div>
                    ) : (
                        <div className="text-center text-sm text-slate-400 py-10 h-full flex flex-col items-center justify-center">
                            <GridIcon size={48} className="text-slate-200 mb-4" />
                            Lütfen filtrelerden Oda ve Raf seçin.
                        </div>
                    )}
                </div>
            </div>

            {/* Animal Management (The contents of the Cage) */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Box size={18} className="text-indigo-500" />
                        Hayvan Kayıtları
                        {selectedCageId && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full ml-2">Kafes: {cages.find(c => c.id === selectedCageId)?.name}</span>}
                    </h3>
                    {selectedCageId && (
                        <button
                            onClick={() => setShowAnimalForm(!showAnimalForm)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Plus size={16} /> Kayıt Ekle
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 relative">
                    {!selectedCageId ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <GridIcon size={48} className="text-slate-200 mb-4" />
                            Kayıtları görmek için soldan bir kafes seçin.
                        </div>
                    ) : (
                        <>
                            {/* Add Animal Form Modal/Drawer */}
                            {showAnimalForm && (
                                <div className="mb-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl">
                                    <h4 className="font-semibold text-slate-800 mb-4">Yeni Hayvan Kaydı</h4>
                                    <form onSubmit={handleAddAnimal} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Tür</label>
                                            <select name="species" value={animalForm.species} onChange={handleAnimalFormChange} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500">
                                                {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Irk (Strain)</label>
                                            <select name="strain" value={animalForm.strain} onChange={handleAnimalFormChange} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500">
                                                {STRAINS[animalForm.species].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Cinsiyet</label>
                                            <select name="sex" value={animalForm.sex} onChange={handleAnimalFormChange} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500">
                                                {SEXES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Sayı (Adet)</label>
                                            <input type="number" name="count" min="1" value={animalForm.count} onChange={handleAnimalFormChange} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                                            <input type="date" name="dob" value={animalForm.dob} onChange={handleAnimalFormChange} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Proje Kodu</label>
                                            <input type="text" name="projectCode" placeholder="Örn: 2024/01" value={animalForm.projectCode} onChange={handleAnimalFormChange} className="w-full text-sm rounded-lg border-slate-300 py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                        <div className="lg:col-span-3 flex justify-end gap-3 mt-2">
                                            <button type="button" onClick={() => setShowAnimalForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">İptal</button>
                                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2 px-6 rounded-lg transition-colors shadow-sm">Kafese Ekle</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Animal List */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50/50">
                                            <th className="py-3 px-4 rounded-tl-lg">Tür / Irk</th>
                                            <th className="py-3 px-4">Cinsiyet</th>
                                            <th className="py-3 px-4">Adet</th>
                                            <th className="py-3 px-4">Doğum Tarihi</th>
                                            <th className="py-3 px-4">Proje</th>
                                            <th className="py-3 px-4 text-right rounded-tr-lg">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {animals.map(animal => (
                                            <tr key={animal.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-slate-800">{animal.species}</div>
                                                    <div className="text-xs text-slate-500">{animal.strain}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${animal.sex === 'Erkek' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                                                        {animal.sex}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-medium text-slate-700">{animal.count}</td>
                                                <td className="py-3 px-4 text-slate-600">{new Date(animal.dob).toLocaleDateString('tr-TR')}</td>
                                                <td className="py-3 px-4 text-slate-600">
                                                    {animal.projectCode !== '-' ? <span className="px-2 py-1 rounded bg-slate-100 text-xs font-medium">{animal.projectCode}</span> : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button onClick={() => handleDeleteAnimal(animal.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Kaydı Sil">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {animals.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-slate-400">Bu kafeste henüz kayıtlı hayvan bulunmuyor.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
