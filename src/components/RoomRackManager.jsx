import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Home, Layers, Settings, ChevronRight, Edit, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoomRackManager() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [rooms, setRooms] = useState([]);
    const [racks, setRacks] = useState({});
    const [loading, setLoading] = useState(true);

    // Form states
    const [newRoomName, setNewRoomName] = useState('');
    const [newRackName, setNewRackName] = useState('');
    const [newRackRows, setNewRackRows] = useState(7);
    const [newRackCols, setNewRackCols] = useState(10);
    const [activeRoomId, setActiveRoomId] = useState(null);

    // Edit states
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editRoomName, setEditRoomName] = useState('');

    const [editingRackId, setEditingRackId] = useState(null);
    const [editRackData, setEditRackData] = useState({ name: '', rows: 7, cols: 10 });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/rooms');
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
                if (data.length > 0 && !activeRoomId) {
                    setActiveRoomId(data[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRacks = async (roomId) => {
        try {
            const res = await fetch(`/api/racks?roomId=${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setRacks(prev => ({ ...prev, [roomId]: data }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (activeRoomId) {
            fetchRacks(activeRoomId);
        }
    }, [activeRoomId]);

    const handleAddRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName) return;
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newRoomName })
            });
            if (res.ok) {
                setNewRoomName('');
                fetchRooms();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Bu odayı ve içindeki tüm raf/kafesleri silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (activeRoomId === id) setActiveRoomId(null);
                fetchRooms();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateRoom = async (id) => {
        if (!editRoomName) return;
        try {
            const res = await fetch('/api/rooms', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editRoomName })
            });
            if (res.ok) {
                setEditingRoomId(null);
                fetchRooms();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddRack = async (e) => {
        e.preventDefault();
        if (!newRackName || !activeRoomId) return;
        try {
            const res = await fetch('/api/racks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: activeRoomId,
                    name: newRackName,
                    rows: newRackRows,
                    cols: newRackCols
                })
            });
            if (res.ok) {
                setNewRackName('');
                setNewRackRows(7);
                setNewRackCols(10);
                fetchRacks(activeRoomId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteRack = async (id, roomId) => {
        if (!window.confirm('Bu rafı ve içindeki tüm kafes/hayvan kayıtlarını silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/racks?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchRacks(roomId);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateRack = async (id, roomId) => {
        if (!editRackData.name) return;
        try {
            const res = await fetch('/api/racks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name: editRackData.name,
                    rows: editRackData.rows,
                    cols: editRackData.cols
                })
            });
            if (res.ok) {
                setEditingRackId(null);
                fetchRacks(roomId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Odalar yükleniyor...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Odalar Sütunu */}
            <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-[75vh]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Home size={18} className="text-indigo-500" />
                        Odalar
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            onClick={() => { if (!editingRoomId) setActiveRoomId(room.id); }}
                            className={`group flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${activeRoomId === room.id
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {editingRoomId === room.id ? (
                                <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editRoomName}
                                        onChange={e => setEditRoomName(e.target.value)}
                                        className="flex-1 text-sm border-slate-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateRoom(room.id);
                                            if (e.key === 'Escape') setEditingRoomId(null);
                                        }}
                                    />
                                    <button onClick={() => handleUpdateRoom(room.id)} className="text-green-600 hover:text-green-700 p-1"><Check size={16} /></button>
                                    <button onClick={() => setEditingRoomId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-800">{room.name}</span>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingRoomId(room.id); setEditRoomName(room.name); }}
                                                className="text-slate-400 hover:text-indigo-500 p-1"
                                                title="Düzenle"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                                title="Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                ID: {room.id.slice(-4)}
                            </div>
                        </div>
                    ))}
                    {rooms.length === 0 && <div className="text-sm text-slate-500 text-center py-6">Henüz oda oluşturulmadı.</div>}
                </div>

                {isAdmin && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <form onSubmit={handleAddRoom} className="flex gap-2">
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={e => setNewRoomName(e.target.value)}
                                placeholder="Yeni Oda Adı"
                                className="flex-1 text-sm border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={!newRoomName}
                                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Raflar Sütunu */}
            <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-[75vh]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Layers size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-slate-700">
                        Raflar <span className="font-normal text-slate-500 text-sm ml-2">({rooms.find(r => r.id === activeRoomId)?.name || 'Oda Seçilmedi'})</span>
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {!activeRoomId ? (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            Sol taraftan bir oda seçiniz.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {racks[activeRoomId]?.map(rack => (
                                <div key={rack.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between group relative overflow-hidden">
                                    {editingRackId === rack.id ? (
                                        <div className="flex flex-col gap-2 relative z-10 w-full bg-white">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-sm font-medium text-slate-700">Rafı Düzenle</h4>
                                                <button onClick={() => setEditingRackId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
                                            </div>
                                            <input
                                                type="text"
                                                value={editRackData.name}
                                                onChange={e => setEditRackData({ ...editRackData, name: e.target.value })}
                                                className="text-sm border-slate-300 rounded px-2 py-1.5 w-full outline-none focus:ring-1 focus:ring-indigo-500 mb-1"
                                                placeholder="Raf Adı"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className="flex flex-col flex-1">
                                                    <label className="text-slate-500 mb-0.5">Satır:</label>
                                                    <input type="number" min="1" value={editRackData.rows} onChange={e => setEditRackData({ ...editRackData, rows: Number(e.target.value) })} className="w-full border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500" />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <label className="text-slate-500 mb-0.5">Sütun:</label>
                                                    <input type="number" min="1" value={editRackData.cols} onChange={e => setEditRackData({ ...editRackData, cols: Number(e.target.value) })} className="w-full border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500" />
                                                </div>
                                            </div>
                                            <button onClick={() => handleUpdateRack(rack.id, activeRoomId)} className="bg-indigo-600 text-white rounded py-1.5 text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1 transition-colors mt-1">
                                                <Check size={14} /> Kaydet
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-slate-800">{rack.name}</h4>
                                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">Raf</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-2">
                                                    Kapasite: {rack.rows * rack.cols} Kafes <br />
                                                    <span className="opacity-75">({rack.rows}x{rack.cols})</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                                                    İncele <ChevronRight size={16} />
                                                </button>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { setEditingRackId(rack.id); setEditRackData({ name: rack.name, rows: rack.rows, cols: rack.cols }); }}
                                                            className="text-slate-400 hover:text-indigo-500 p-1"
                                                            title="Rafı Düzenle"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRack(rack.id, activeRoomId)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                            title="Rafı Sil"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {racks[activeRoomId]?.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center">
                                    <Layers size={32} className="text-slate-300 mb-3" />
                                    Bu odada henüz raf bulunmuyor.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isAdmin && activeRoomId && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <form onSubmit={handleAddRack} className="flex flex-col gap-3">
                            <div className="text-sm font-medium text-slate-700 mb-1">Yeni Raf Ekle</div>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    value={newRackName}
                                    onChange={e => setNewRackName(e.target.value)}
                                    placeholder="Raf Adı (Örn: R1-A)"
                                    className="flex-1 text-sm border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="flex gap-4 items-center flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500">Satır:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRackRows}
                                        onChange={e => setNewRackRows(Number(e.target.value))}
                                        className="w-16 text-sm border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500">Sütun:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRackCols}
                                        onChange={e => setNewRackCols(Number(e.target.value))}
                                        className="w-16 text-sm border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newRackName}
                                    className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                                >
                                    <Plus size={18} /> Raf Ekle
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            {!isAdmin &&
                <div className="col-span-full mt-4 p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 text-sm">
                    Bilgi: Sadece Admin rolüne sahip kullanıcılar Oda veya Raf ekleyip silebilir. Normal kullanıcı yetkisindesiniz.
                </div>
            }
        </div>
    );
}
