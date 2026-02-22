import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Search, ClipboardList, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { db } from '../lib/db';
import { REMOVAL_REASONS, STRAINS } from '../lib/constants';

export function RecordList({ records, onSearch, onDelete }) {
    const [filters, setFilters] = useState({
        date: '',
        species: '',
        strain: '',
        sex: '',
        reason: ''
    });

    const [activeFilter, setActiveFilter] = useState(null);
    const filterRef = useRef(null);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 50
    });

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setActiveFilter(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleDelete = async (id) => {
        if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await db.animals.delete(id);
            if (onDelete) onDelete();
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    const getReasonLabel = (code) => {
        if (!code) return '-';
        for (const category of REMOVAL_REASONS) {
            const option = category.options.find(opt => opt.code === code);
            if (option) return option.label;
        }
        return code;
    };

    // Filter records
    const filteredRecords = useMemo(() => {
        return records.filter(item => {
            const matchDate = !filters.date || item.removalDate === filters.date;
            const matchSpecies = !filters.species || item.species === filters.species;
            const matchStrain = !filters.strain || item.strain === filters.strain;
            const matchSex = !filters.sex || item.sex === filters.sex;
            // Exact match for reason code
            const matchReason = !filters.reason || item.reason === filters.reason;

            return matchDate && matchSpecies && matchStrain && matchSex && matchReason;
        });
    }, [records, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredRecords.length / pagination.itemsPerPage);
    const paginatedRecords = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
        return filteredRecords.slice(start, start + pagination.itemsPerPage);
    }, [filteredRecords, pagination]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const clearFilter = (key) => {
        handleFilterChange(key, '');
        if (key === 'species') handleFilterChange('strain', ''); // Clear strain if species cleared
    };

    const FilterButton = ({ column, label, hasFilter, align = 'left', children }) => (
        <div className="relative inline-block ml-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilter(activeFilter === column ? null : column);
                }}
                className={`p-1 rounded-md transition-colors ${hasFilter ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
                <Filter size={14} />
            </button>
            {activeFilter === column && (
                <div
                    ref={filterRef}
                    className={`absolute top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 ${align === 'right' ? 'right-0' : 'left-0'}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{label} Filtrele</span>
                        <button onClick={() => setActiveFilter(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Kayıt Listesi ({filteredRecords.length})</h2>
            </div>

            <div className="overflow-x-auto flex-1 min-h-[400px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3 min-w-[140px]">
                                <div className="flex items-center">
                                    Tarih
                                    <FilterButton column="date" label="Tarih" hasFilter={!!filters.date}>
                                        <input
                                            type="date"
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={filters.date}
                                            onChange={(e) => handleFilterChange('date', e.target.value)}
                                        />
                                        {filters.date && (
                                            <button onClick={() => clearFilter('date')} className="text-xs text-red-500 hover:underline mt-1">Filtreyi Temizle</button>
                                        )}
                                    </FilterButton>
                                </div>
                            </th>
                            <th className="px-5 py-3 min-w-[160px]">
                                <div className="flex items-center">
                                    Tür / Irk
                                    <FilterButton column="species" label="Tür ve Irk" hasFilter={!!filters.species || !!filters.strain}>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Tür</label>
                                            <select
                                                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                                                value={filters.species}
                                                onChange={(e) => {
                                                    handleFilterChange('species', e.target.value);
                                                    handleFilterChange('strain', ''); // Reset strain when species changes
                                                }}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="Fare">Fare</option>
                                                <option value="Sıçan">Sıçan</option>
                                                <option value="Tavşan">Tavşan</option>
                                            </select>
                                        </div>
                                        {filters.species && (
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Irk</label>
                                                <select
                                                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={filters.strain}
                                                    onChange={(e) => handleFilterChange('strain', e.target.value)}
                                                >
                                                    <option value="">Tümü</option>
                                                    {STRAINS[filters.species]?.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {(filters.species || filters.strain) && (
                                            <button onClick={() => { clearFilter('species'); clearFilter('strain'); }} className="text-xs text-red-500 hover:underline mt-1">Filtreyi Temizle</button>
                                        )}
                                    </FilterButton>
                                </div>
                            </th>
                            <th className="px-5 py-3 min-w-[100px]">
                                <div className="flex items-center">
                                    Detaylar
                                    <FilterButton column="sex" label="Cinsiyet" hasFilter={!!filters.sex}>
                                        <select
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={filters.sex}
                                            onChange={(e) => handleFilterChange('sex', e.target.value)}
                                        >
                                            <option value="">Tümü</option>
                                            <option value="Erkek">Erkek</option>
                                            <option value="Dişi">Dişi</option>
                                        </select>
                                        {filters.sex && (
                                            <button onClick={() => clearFilter('sex')} className="text-xs text-red-500 hover:underline mt-1">Filtreyi Temizle</button>
                                        )}
                                    </FilterButton>
                                </div>
                            </th>
                            <th className="px-5 py-3 min-w-[80px]">Sayı</th>
                            <th className="px-5 py-3 min-w-[200px]">
                                <div className="flex items-center">
                                    Neden
                                    <FilterButton column="reason" label="Neden Kodu" hasFilter={!!filters.reason} align="right">
                                        <select
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={filters.reason}
                                            onChange={(e) => handleFilterChange('reason', e.target.value)}
                                        >
                                            <option value="">Tümü</option>
                                            {REMOVAL_REASONS.map(category => (
                                                <optgroup key={category.id} label={category.id}>
                                                    {category.options.map(opt => (
                                                        <option key={opt.code} value={opt.code}>{opt.code}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {filters.reason && (
                                            <button onClick={() => clearFilter('reason')} className="text-xs text-red-500 hover:underline mt-1">Filtreyi Temizle</button>
                                        )}
                                    </FilterButton>
                                </div>
                            </th>
                            <th className="px-5 py-3 text-right w-[80px]">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedRecords.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList size={48} />
                                        <p>Kayıt bulunamadı.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedRecords.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-5 py-4 text-slate-600">
                                        <div className="font-medium text-slate-900">{formatDate(item.removalDate)}</div>
                                        <div className="text-xs text-slate-400">Doğum: {formatDate(item.dob)}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-medium text-slate-900">{item.species}</div>
                                        <div className="text-xs text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-0.5">{item.strain}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-slate-600 flex items-center gap-1">
                                            <span className={item.sex === 'Erkek' ? 'text-blue-500' : 'text-pink-500'}>
                                                {item.sex === 'Erkek' ? '♂' : '♀'}
                                            </span>
                                            {item.sex}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-slate-700">{item.count}</td>
                                    <td className="px-5 py-4">
                                        <div className="text-slate-700">{getReasonLabel(item.reason)}</div>
                                        {item.project !== '-' && <div className="text-xs text-indigo-600 font-medium">{item.project}</div>}
                                        {item.transferInstitution && <div className="text-xs text-amber-600 font-medium">{item.transferInstitution}</div>}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <span>Sayfa başına satır:</span>
                    <select
                        className="border border-slate-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={pagination.itemsPerPage}
                        onChange={(e) => setPagination(prev => ({ ...prev, itemsPerPage: Number(e.target.value), currentPage: 1 }))}
                    >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                    </select>
                    <span className="ml-2">
                        Toplam {filteredRecords.length} kayıt
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-medium">
                        {pagination.currentPage} / {totalPages || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === totalPages || totalPages === 0}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
