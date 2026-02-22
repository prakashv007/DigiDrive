import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Shield, LayoutDashboard, Users, FolderOpen, Activity, Lock, FileText,
    LogOut, Sun, Moon, ChevronRight, Briefcase, HelpCircle, Bell, Settings
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Sidebar = ({ navItems, onTourStart }) => {
    const { user, logout, loadUser } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifCount] = useState(2);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    // Refresh storage data every 30 seconds
    useEffect(() => {
        if (user?.role !== 'employee') return;
        const interval = setInterval(() => loadUser(), 30000);
        return () => clearInterval(interval);
    }, [user?.role, loadUser]);

    const formatStorage = (bytes) => {
        if (!bytes) return '0 MB';
        if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
        return `${(bytes / 1048576).toFixed(0)} MB`;
    };

    const storagePercent = Math.min(((user?.storageUsed || 0) / (user?.quota || 1)) * 100, 100);
    const storageColor = storagePercent > 85 ? '#ef4444' : storagePercent > 60 ? '#f59e0b' : '#10b981';

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', flexShrink: 0 }}>
                        <img src="/logo.png" alt="DigiDrive" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div className="logo-text">DigiDrive</div>
                        <div className="logo-sub">{user?.role === 'admin' ? '' : '🗄️ Asset Manager'}</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((section, si) => (
                    <div key={si} className="nav-section">
                        {section.label && <div className="nav-section-label">{section.label}</div>}
                        {section.items.map((item, ii) => {
                            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                            return (
                                <button
                                    key={ii}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                    title={item.label}
                                >
                                    {item.icon}
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {item.badge && <span className="badge badge-red" style={{ padding: '1px 6px', fontSize: '10px' }}>{item.badge}</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* System Guide */}
                <div className="nav-section">
                    <div className="nav-section-label">Support</div>
                    <button className="nav-item" onClick={onTourStart}>
                        <HelpCircle size={18} />
                        <span>System Guide</span>
                    </button>
                </div>
            </nav>

            {/* Storage widget (employee only) */}
            {user?.role === 'employee' && (
                <div style={{ padding: '12px 16px' }}>
                    <div className="storage-widget">
                        <h4>Storage Used</h4>
                        <div className="storage-numbers">
                            <span className="storage-used">{formatStorage(user.storageUsed)}</span>
                            <span className="storage-total">of {formatStorage(user.quota)}</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${storagePercent}%`, background: `linear-gradient(90deg, ${storageColor}, ${storageColor}88)` }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{storagePercent.toFixed(1)}% used</div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="sidebar-footer">
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-card)', borderRadius: '12px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.empId}</div>
                    </div>
                    <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '10px' }}>{user?.role}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} title="Toggle theme">
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#ef4444' }} title="Logout">
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
