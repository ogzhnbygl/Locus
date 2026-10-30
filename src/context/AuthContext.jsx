import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const isPreviewHost = () => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h === 'test.wildtype.app' || h.startsWith('test-') || h.endsWith('.vercel.app');
};

export const getApexUrl = () => {
    if (typeof window !== 'undefined') {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5173';
        if (isPreviewHost()) return 'https://test.wildtype.app';
    }
    return 'https://wildtype.app';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // Local Development Mock
            if (import.meta.env.DEV) {
                console.log('DEV MODE: Simulating authenticated user for localhost (Locus)');
                await new Promise(resolve => setTimeout(resolve, 500));
                setUser({
                    id: 'mock-user-id',
                    email: 'dev@wildtype.app',
                    name: 'Geliştirici Modu (Locus)',
                    role: 'admin',
                    isAuthenticated: true
                });
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/auth/session', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        setUser(data.user);
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                } else if (response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    alert(errorData.error || 'Bu uygulamaya erişim yetkiniz bulunmamaktadır.');
                    window.location.href = getApexUrl();
                } else {
                    setUser(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth error:', error);
                setUser(null);
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const loginRedirect = () => {
        window.location.href = `${getApexUrl()}/login`;
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        window.location.href = `${getApexUrl()}/login`;
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, loginRedirect }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
