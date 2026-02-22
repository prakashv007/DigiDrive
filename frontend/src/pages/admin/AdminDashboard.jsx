import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderOpen, Activity, FileText, Briefcase, Shield, Menu } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import ActivityLogsPage from './ActivityLogsPage';
import ProjectGovernance from './ProjectGovernance';
import AdminFileExplorer from './AdminFileExplorer';
import RansomwareProtection from './RansomwareProtection';
import OnboardingTour from '../../components/OnboardingTour';
import ChatbotWidget from '../../components/ChatbotWidget';

const ADMIN_NAV = [
    {
        label: 'Command Center',
        items: [
            { path: '/admin/overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
            { path: '/admin/users', label: 'User Management', icon: <Users size={18} /> },
            { path: '/admin/projects', label: 'Project Governance', icon: <Briefcase size={18} /> },
        ],
    },
    {
        label: 'Security',
        items: [
            { path: '/admin/logs', label: 'Activity Logs', icon: <Activity size={18} /> },
            { path: '/admin/security', label: 'Ransomware Shield', icon: <Shield size={18} /> },
        ],
    },
    {
        label: 'Assets',
        items: [
            { path: '/admin/files', label: 'All Files', icon: <FileText size={18} /> },
        ],
    },
];

const TOUR_STEPS = [
    { title: '👋 Welcome back!', description: 'This is your admin command center. From here you manage users, projects, files, and security.', target: 'sidebar' },
    { title: '📊 System Overview', description: 'The Overview panel shows real-time stats: users, files, storage, and upload trends.', target: 'overview' },
    { title: '👥 User Management', description: 'Create employee accounts, lock/unlock users, and track storage usage per employee.', target: 'users' },
    { title: '📁 Project Governance', description: 'Create projects, assign employees, and set duration timers. Access is auto-revoked when the timer expires.', target: 'projects' },
    { title: '🔒 Activity Logs', description: 'View all user activity, uploads, deletions, and access events in one place.', target: 'logs' },
];

const AdminDashboard = () => {
    const [showTour, setShowTour] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem('sentinel_admin_tour');
        if (!seen) { setShowTour(true); localStorage.setItem('sentinel_admin_tour', '1'); }
    }, []);

    return (
        <div className="app-layout">
            <Sidebar
                navItems={ADMIN_NAV}
                onTourStart={() => setShowTour(true)}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="main-content">
                <div className="mobile-header mobile-only">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--accent-blue-light)' }}>DigiDrive</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                        <Menu size={24} />
                    </button>
                </div>

                <Routes>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<AdminOverview />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="projects" element={<ProjectGovernance />} />
                    <Route path="logs" element={<ActivityLogsPage />} />
                    <Route path="security" element={<RansomwareProtection />} />
                    <Route path="files" element={<AdminFileExplorer />} />
                </Routes>
            </main>

            {showTour && <OnboardingTour steps={TOUR_STEPS} onClose={() => setShowTour(false)} />}
            <ChatbotWidget />
        </div>
    );
};

export default AdminDashboard;
