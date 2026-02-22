import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Loader2, X, FileJson } from 'lucide-react';
import { db } from '../lib/db';

export function DataTransfer({ records, onClose, onImportComplete }) {
    const [activeTab, setActiveTab] = useState('import'); // 'import' or 'export'

    // Import State
    const [jsonContent, setJsonContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState({ type: '', message: '' });

    // Export State
    const [exportStatus, setExportStatus] = useState({ type: '', message: '' });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setJsonContent(event.target.result);
            setStatus({ type: 'info', message: `Dosya yüklendi. ${(file.size / 1024).toFixed(2)} KB` });
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (!jsonContent) {
            setStatus({ type: 'error', message: 'Lütfen önce bir JSON dosyası yükleyin veya içeriği yapıştırın.' });
            return;
        }

        let data;
        try {
            const sanitizedContent = jsonContent
                .replace(/\t/g, ' ')
                .replace(/[\u0000-\u001F]+/g, (match) => {
                    return (match === '\n' || match === '\r') ? match : '';
                });

            data = JSON.parse(sanitizedContent);
            if (!Array.isArray(data)) {
                throw new Error('JSON verisi bir dizi (array) olmalıdır.');
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Geçersiz JSON formatı: ' + e.message });
            return;
        }

        setLoading(true);
        setProgress({ current: 0, total: data.length });
        setStatus({ type: 'info', message: 'İçe aktarma başlatılıyor...' });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            try {
                const cleanItem = {};
                for (const key in item) {
                    if (typeof item[key] === 'string') {
                        cleanItem[key] = item[key].trim();
                    } else {
                        cleanItem[key] = item[key];
                    }
                }
                if (cleanItem.count) cleanItem.count = parseInt(cleanItem.count);

                await db.animals.add(cleanItem);
                successCount++;
            } catch (e) {
                console.error('Import error for item:', item, e);
                errorCount++;
            }
            setProgress({ current: i + 1, total: data.length });
        }

        setLoading(false);
        setStatus({
            type: errorCount === 0 ? 'success' : 'warning',
            message: `İşlem tamamlandı. ${successCount} başarılı, ${errorCount} hatalı.`
        });

        if (onImportComplete) onImportComplete();
    };

    const handleExport = () => {
        if (!records || records.length === 0) {
            setExportStatus({ type: 'error', message: 'Dışa aktarılacak veri bulunamadı.' });
            return;
        }

        try {
            const dataStr = JSON.stringify(records, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lab_colony_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportStatus({ type: 'success', message: 'Veriler başarıyla dışa aktarıldı.' });
        } catch (error) {
            console.error('Export error:', error);
            setExportStatus({ type: 'error', message: 'Dışa aktarma sırasında bir hata oluştu.' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <FileJson className="text-indigo-600" size={24} /> Veri Transferi
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'import' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        İçe Aktar (Import)
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'export' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        Dışa Aktar (Export)
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'import' ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">JSON Dosyası Seç</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">veya JSON İçeriğini Yapıştır</label>
                                <textarea
                                    value={jsonContent}
                                    onChange={(e) => setJsonContent(e.target.value)}
                                    className="w-full h-48 p-3 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder='[{"species": "Fare", ...}]'
                                ></textarea>
                            </div>

                            {status.message && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'error' ? 'bg-red-50 text-red-700' :
                                    status.type === 'success' ? 'bg-green-50 text-green-700' :
                                        status.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                                            'bg-blue-50 text-blue-700'
                                    }`}>
                                    {status.type === 'error' ? <AlertCircle size={20} /> :
                                        status.type === 'success' ? <CheckCircle size={20} /> :
                                            <Loader2 size={20} className={loading ? 'animate-spin' : ''} />}
                                    <div>
                                        <p className="font-medium">{status.message}</p>
                                        {loading && (
                                            <p className="text-xs mt-1 opacity-80">
                                                İlerleme: {progress.current} / {progress.total}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 text-center py-8">
                            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-4">
                                <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
                                    <FileJson size={48} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Verileri JSON Olarak İndir</h3>
                                    <p className="text-slate-500 mt-1 text-sm">
                                        Mevcut {records?.length || 0} kaydı JSON formatında dışa aktarın.
                                    </p>
                                </div>
                                <button
                                    onClick={handleExport}
                                    disabled={!records || records.length === 0}
                                    className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                                >
                                    <Download size={20} /> JSON İndir
                                </button>
                            </div>

                            {exportStatus.message && (
                                <div className={`p-4 rounded-lg flex items-center justify-center gap-2 ${exportStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {exportStatus.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                    <span className="font-medium">{exportStatus.message}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === 'import' && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            İptal
                        </button>
                        <button
                            onClick={processImport}
                            disabled={loading || !jsonContent}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            {loading ? 'Yükleniyor...' : 'İçe Aktar'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
