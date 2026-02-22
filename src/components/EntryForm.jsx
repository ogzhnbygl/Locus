import React, { useState } from 'react';
import { PlusCircle, Save } from 'lucide-react';
import { db } from '../lib/db';
import { STRAINS, REMOVAL_REASONS } from '../lib/constants';

export function EntryForm({ onRecordAdded }) {
    const [selectedSpecies, setSelectedSpecies] = useState('Fare');
    const [showProject, setShowProject] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');

    // Autocomplete states
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/projects-search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                    }
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const record = {
            species: formData.get('species'),
            strain: formData.get('strain'),
            sex: formData.get('sex'),
            count: parseInt(formData.get('count')),
            dob: formData.get('dob'),
            removalDate: formData.get('removalDate'),
            reason: formData.get('reason'), // Store the code (e.g., "EXP-01")
            project: formData.get('project') || '-',
            transferInstitution: formData.get('transferInstitution') || null
        };

        await db.animals.add(record);
        e.target.reset();

        // Reset defaults
        const today = new Date().toISOString().split('T')[0];
        document.querySelector('input[name="removalDate"]').value = today;
        setShowProject(false);
        setSelectedSpecies('Fare');
        setSelectedReason('');
        setQuery(''); // Reset search input

        if (onRecordAdded) onRecordAdded();
    };

    const handleReasonChange = (e) => {
        const code = e.target.value;
        setSelectedReason(code);

        // Find the selected option to check if it requires a project
        let requiresProject = false;
        for (const category of REMOVAL_REASONS) {
            const option = category.options.find(opt => opt.code === code);
            if (option && option.requiresProject) {
                requiresProject = true;
                break;
            }
        }
        setShowProject(requiresProject);
    };

    // Helper to get description for selected reason
    const getSelectedReasonDescription = () => {
        if (!selectedReason) return null;
        for (const category of REMOVAL_REASONS) {
            const option = category.options.find(opt => opt.code === selectedReason);
            if (option) return option.description;
        }
        return null;
    };

    return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PlusCircle className="text-indigo-600" size={20} /> Kayıt Ekle
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                        <select
                            name="species"
                            required
                            className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            onChange={(e) => setSelectedSpecies(e.target.value)}
                            value={selectedSpecies}
                        >
                            <option value="Fare">Fare</option>
                            <option value="Sıçan">Sıçan</option>
                            <option value="Tavşan">Tavşan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Irk (Strain)</label>
                        <select
                            name="strain"
                            required
                            className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        >
                            {STRAINS[selectedSpecies]?.map(strain => (
                                <option key={strain} value={strain}>{strain}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                        <select name="sex" required className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                            <option value="Erkek">Erkek</option>
                            <option value="Dişi">Dişi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sayı</label>
                        <input type="number" name="count" min="1" defaultValue="1" required className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                        <input type="date" name="dob" required className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Çıkış Tarihi</label>
                        <input type="date" name="removalDate" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Çıkarılma Nedeni</label>
                    <select
                        name="reason"
                        onChange={handleReasonChange}
                        required
                        className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={selectedReason}
                    >
                        <option value="">Seçiniz...</option>
                        {REMOVAL_REASONS.map(category => (
                            <optgroup key={category.id} label={category.label}>
                                {category.options.map(option => (
                                    <option key={option.code} value={option.code}>
                                        {option.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {selectedReason && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                            {getSelectedReasonDescription()}
                        </div>
                    )}
                </div>

                {showProject && (
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Proje Adı / No</label>
                        <input
                            type="text"
                            name="project"
                            placeholder="Örn: 2025/12-3"
                            required
                            autoComplete="off"
                            className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            onChange={(e) => {
                                const val = e.target.value;
                                // Basic input update managed by parent form logic naturally, 
                                // but we need local state for search query if we were fully controlled.
                                // Since this is uncontrolled in the original form (using FormData), 
                                // we'll use a local state just for the search trigger.
                                setQuery(val);
                                setIsSuggestionsOpen(true);
                            }}
                            defaultValue={query} // Use defaultValue to start, but we might need controlled if we select...
                            // Actually, to make selection work nicely with FormData submission, let's make this input controlled.
                            value={query}
                        />

                        {/* Suggestions Dropdown */}
                        {isSuggestionsOpen && query.length >= 2 && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-auto">
                                {isLoading ? (
                                    <div className="p-3 text-sm text-slate-500 text-center">Aranıyor...</div>
                                ) : suggestions.length > 0 ? (
                                    <ul className="py-1">
                                        {suggestions.map((project) => (
                                            <li
                                                key={project._id}
                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setQuery(project.code); // Fill input with code
                                                    setIsSuggestionsOpen(false);
                                                }}
                                            >
                                                <div className="font-medium text-sm text-slate-900">{project.code}</div>
                                                <div className="text-xs text-slate-500 truncate">{project.title}</div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-3 text-sm text-slate-500 text-center">Sonuç bulunamadı</div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {selectedReason === 'ADM-02' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Transfer Edilen Kurum Adı</label>
                        <input
                            type="text"
                            name="transferInstitution"
                            placeholder="Örn: X Üniversitesi"
                            required
                            className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                )}

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <Save size={20} /> Kaydet
                </button>
            </form>
        </div>
    );
}
