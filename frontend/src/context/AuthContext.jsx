import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('sentinel_token');
        if (!token) { setLoading(false); return; }
        try {
            const { data } = await authAPI.me();
            if (data.success) setUser(data.data);
        } catch {
            localStorage.removeItem('sentinel_token');
            localStorage.removeItem('sentinel_user');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = async (empId, password) => {
        const { data } = await authAPI.login({ empId, password });
        if (data.success) {
            localStorage.setItem('sentinel_token', data.token);
            localStorage.setItem('sentinel_user', JSON.stringify(data.data));
            setUser(data.data);
            return data.data;
        }
        throw new Error(data.message);
    };

    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch { }
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
        setUser(null);
    }, []);

    // Session Timeout Logic (30 mins)
    const timerRef = React.useRef(null);
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (user) {
            timerRef.current = setTimeout(() => {
                toast.error('Session expired due to inactivity');
                logout();
            }, INACTIVITY_LIMIT);
        }
    }, [user, logout]);

    useEffect(() => {
        if (!user) return;

        const handleActivity = () => resetTimer();
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // Initial timer start
        resetTimer();

        // Attach listeners
        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [user, resetTimer]);

    const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, updateUser, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// useAuth hook is in ./useAuth.js (separated for Vite Fast Refresh compatibility)
