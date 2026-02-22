import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';

function AppContent() {
    const { user, loading, loginRedirect } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!user) {
        // Not authenticated, trigger redirect
        loginRedirect();
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                <h2 className="text-xl font-semibold text-slate-800">Kimlik Doğrulanıyor...</h2>
                <p className="text-slate-500 mt-2">Merkezi sisteme (Apex) yönlendiriliyorsunuz.</p>
            </div>
        );
    }

    // Application Router (Simple conditional rendering for MVP)
    return <Dashboard />;
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
