import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Briefcase, Lock, History, Menu } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import EmployeeOverview from './EmployeeOverview';
import FileExplorer from './FileExplorer';
import AssignedProjects from './AssignedProjects';
import OnboardingTour from '../../components/OnboardingTour';
import ChatbotWidget from '../../components/ChatbotWidget';

const EMPLOYEE_NAV = [
    {
        label: 'Asset Manager',
        items: [
            { path: '/dashboard/overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
            { path: '/dashboard/files', label: 'My Files', icon: <FolderOpen size={18} /> },
            { path: '/dashboard/private', label: 'Private Folders', icon: <Lock size={18} /> },
        ],
    },
    {
        label: 'Collaboration',
        items: [
            { path: '/dashboard/projects', label: 'Assigned Projects', icon: <Briefcase size={18} /> },
        ],
    },
];

const TOUR_STEPS = [
    { title: '🗄️ Welcome to Asset Manager', description: 'This is your personal secure file workspace. Everything here is protected with role-based access.' },
    { title: '📁 My Files', description: 'Upload, organize, and preview your files. Drag-and-drop supported for all file types.' },
    { title: '🔐 Private Folders', description: 'Create private folders only you can access. Even other employees cannot see them (but admins can).' },
    { title: '💼 Assigned Projects', description: 'Projects assigned to you by your admin appear here. Access is automatically revoked when the project expires.' },
    { title: '📊 Storage Quota', description: 'You have 5GB of secure storage. Track your usage with the progress bar in the sidebar.' },
];

const EmployeeDashboard = () => {
    const [showTour, setShowTour] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem('sentinel_emp_tour');
        if (!seen) { setShowTour(true); localStorage.setItem('sentinel_emp_tour', '1'); }
    }, []);

    return (
        <div className="app-layout">
            <Sidebar
                navItems={EMPLOYEE_NAV}
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
                    <Route path="overview" element={<EmployeeOverview />} />
                    <Route path="files" element={<FileExplorer />} />
                    <Route path="private" element={<FileExplorer privateMode />} />
                    <Route path="projects" element={<AssignedProjects />} />
                </Routes>
            </main>

            {showTour && <OnboardingTour steps={TOUR_STEPS} onClose={() => setShowTour(false)} />}
            <ChatbotWidget />
        </div>
    );
};

export default EmployeeDashboard;
