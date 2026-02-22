// Separate file to satisfy Vite Fast Refresh requirements
// (files must export only components OR only hooks, not both)
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
