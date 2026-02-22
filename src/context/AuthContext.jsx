import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        setUser(data.user);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const loginRedirect = () => {
        // Redirect to the main Apex Hub for login
        let baseUrl = window.location.origin;
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            window.location.href = 'http://localhost:5173/login'; // Adjust port if Apex runs on different local port
        } else {
            window.location.href = 'https://wildtype.app/login';
        }
    };

    const logout = async () => {
        // In Locus, logout just redirects to Apex logout or we would call an Apex API.
        // simpler: clear cookie / redirect to apex login
        loginRedirect();
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, loginRedirect }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
