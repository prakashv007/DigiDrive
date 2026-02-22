import React, { useEffect, useState } from 'react';
import { folderAPI, fileAPI } from '../../api';
import { useAuth } from '../../context/useAuth';
import { FileText, FolderOpen, HardDrive, Star, Globe, Image, Film, Music, Package, Code, FileCode, MonitorPlay, BarChart3, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const formatBytes = (b) => {
    if (!b) return '0 B';
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
    return `${(b / 1024).toFixed(0)} KB`;
};

const getIcon = (ext) => {
    const e = ext?.toLowerCase();
    const size = "1em";
    if (!e) return <FileText size={size} color="#9ca3af" />;

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(e)) return <Image size={size} color="#8b5cf6" />;
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(e)) return <Film size={size} color="#ec4899" />;
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(e)) return <Music size={size} color="#f59e0b" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return <Package size={size} color="#d97706" />;
    if (['pdf'].includes(e)) return <FileText size={size} color="#ef4444" />;
    if (['doc', 'docx', 'rtf'].includes(e)) return <FileText size={size} color="#3b82f6" />;
    if (['xls', 'xlsx', 'csv'].includes(e)) return <BarChart3 size={size} color="#10b981" />;
    if (['ppt', 'pptx'].includes(e)) return <MonitorPlay size={size} color="#f97316" />;
    if (['html', 'htm', 'xml'].includes(e)) return <Globe size={size} color="#3b82f6" />;
    if (['js', 'jsx', 'ts', 'tsx', 'css', 'py', 'java', 'c', 'cpp', 'json'].includes(e)) return <Code size={size} color="#64748b" />;
    if (['txt', 'md'].includes(e)) return <AlignLeft size={size} color="#6b7280" />;

    return <FileText size={size} color="#9ca3af" />;
};

const EmployeeOverview = () => {
    const { user, loadUser } = useAuth();
    const [recentFiles, setRecentFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadUser();
        fileAPI.search({ sortBy: 'date', order: 'desc', limit: 6 }).then(r => setRecentFiles(r.data.data)).catch(() => { });
        folderAPI.list().then(r => setFolders(r.data.data)).catch(() => { });
    }, []);

    const storagePercent = Math.min(((user?.storageUsed || 0) / (user?.quota || 1)) * 100, 100);
    const storageColor = storagePercent > 85 ? '#ef4444' : storagePercent > 60 ? '#f59e0b' : '#10b981';

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="premium-header">
                <div className="premium-title-group">
                    <h1 className="premium-title">Asset Manager</h1>
                    <p className="premium-subtitle">Welcome back, {user?.name?.split(' ')[0]}! 👋</p>
                </div>
                <div className="header-date-group" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{format(new Date(), 'EEEE')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(), 'MMMM d, yyyy')}</div>
                </div>
            </div>

            {/* Premium Stat Grid */}
            <div className="premium-stat-grid" style={{ marginBottom: '48px' }}>
                <div className="premium-card">
                    <div className="premium-icon-box" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)' }}>
                        <FileText size={28} />
                    </div>
                    <div className="premium-value">{recentFiles.length}</div>
                    <div className="premium-label">Recent Assets</div>
                </div>
                <div className="premium-card" style={{ '--accent-color': 'var(--accent-emerald)' }}>
                    <div className="premium-icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)' }}>
                        <FolderOpen size={28} />
                    </div>
                    <div className="premium-value">{folders.length}</div>
                    <div className="premium-label">Total Folders</div>
                </div>
                <div className="premium-card" style={{ '--accent-color': 'var(--accent-purple)' }}>
                    <div className="premium-icon-box" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)' }}>
                        <HardDrive size={28} />
                    </div>
                    <div className="premium-value" style={{ fontSize: '28px' }}>{formatBytes(user?.storageUsed || 0)}</div>
                    <div className="premium-label">Storage Usage</div>
                </div>
            </div>

            {/* Storage Quota Section */}
            <div className="premium-card premium-bar-container" style={{ marginBottom: '48px' }}>
                <div className="premium-bar-header">
                    <div>
                        <h3 className="premium-section-title" style={{ marginBottom: '4px' }}>
                            <HardDrive size={20} color={storageColor} /> Storage Environment
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Secure enterprise cloud capacity</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{storagePercent.toFixed(1)}%</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Capacity Used</div>
                    </div>
                </div>

                <div className="premium-bar-track">
                    <div className="premium-bar-fill" style={{ width: `${storagePercent}%`, background: `linear-gradient(90deg, ${storageColor}, ${storageColor}aa)` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Used</div>
                            <div style={{ fontSize: '14px', fontWeight: '700' }}>{formatBytes(user?.storageUsed || 0)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available</div>
                            <div style={{ fontSize: '14px', fontWeight: '700' }}>{formatBytes((user?.quota || 0) - (user?.storageUsed || 0))}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Quota</div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{formatBytes(user?.quota || 0)}</div>
                    </div>
                </div>

                {storagePercent > 85 && (
                    <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)', fontSize: '13px' }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <div><strong>Critical Storage Alert:</strong> You are reaching your enterprise limit. Access may be restricted soon.</div>
                    </div>
                )}
            </div>

            {/* Recent Assets Section */}
            <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 className="premium-section-title" style={{ margin: 0 }}>Recent Assets</h3>
                    <button onClick={() => navigate('/dashboard/files')} className="btn btn-ghost btn-sm">Explorer View</button>
                </div>

                {recentFiles.length > 0 ? (
                    <div className="premium-grid-files">
                        {recentFiles.map(f => (
                            <div key={f._id} className="premium-file-card" onClick={() => navigate('/dashboard/files')}>
                                <span className="premium-file-icon">{getIcon(f.extension)}</span>
                                <div className="premium-file-name">{f.originalName}</div>
                                <div className="premium-file-info">{formatBytes(f.size)} • {format(new Date(f.createdAt), 'MMM d')}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="premium-card flex-center" style={{ height: '200px', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={32} color="var(--text-muted)" />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>Your digital vault is empty.</p>
                        <button onClick={() => navigate('/dashboard/files')} className="btn btn-primary btn-sm">Upload first asset</button>
                    </div>
                )}
            </div>

            {/* Folders Section */}
            {folders.length > 0 && (
                <div>
                    <h3 className="premium-section-title">Directory Structure</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {folders.slice(0, 10).map(f => (
                            <button key={f._id} onClick={() => navigate('/dashboard/files')} style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px',
                                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                borderRadius: '14px', cursor: 'pointer', transition: 'var(--transition)',
                                color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px'
                            }} className="folder-pill">
                                <span style={{ fontSize: '18px' }}>📁</span>
                                {f.name}
                                {f.isPrivate && <span className="badge badge-purple" style={{ fontSize: '10px', padding: '2px 8px' }}>Private</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeOverview;
