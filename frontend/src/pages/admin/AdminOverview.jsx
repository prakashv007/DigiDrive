import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import { Users, FileText, HardDrive, Briefcase, TrendingUp, AlertTriangle, Clock, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const formatBytes = (b) => {
    if (!b) return '0 B';
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
    return `${(b / 1024).toFixed(0)} KB`;
};

const ActionBadge = ({ action }) => {
    const map = {
        upload: 'badge-green', login: 'badge-blue', delete_file: 'badge-red',
        create_folder: 'badge-purple', create_user: 'badge-amber', lock_user: 'badge-red',
        unlock_user: 'badge-green', create_project: 'badge-amber', access_denied: 'badge-red',
    };
    return <span className={`badge ${map[action] || 'badge-gray'}`}>{action.replace(/_/g, ' ')}</span>;
};

const AdminOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI.getStats().then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="page-content">
            <div className="page-header"><div className="page-title">System Overview</div></div>
            <div className="grid-4">{[...Array(4)].map((_, i) => <div key={i} className="stat-card skeleton" style={{ height: '120px' }} />)}</div>
        </div>
    );

    if (!stats) return <div className="page-content"><p style={{ color: 'var(--text-muted)' }}>Failed to load stats. Is the backend running?</p></div>;

    const statCards = [
        { label: 'Total Employees', value: stats.users.total, sub: `${stats.users.active} active · ${stats.users.locked} locked`, icon: <Users size={22} />, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
        { label: 'Total Files', value: stats.files.total, sub: `${stats.files.deleted} deleted`, icon: <FileText size={22} />, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        { label: 'Storage Used', value: formatBytes(stats.storage.totalUsed), sub: `of ${formatBytes(stats.storage.totalCapacity)} capacity`, icon: <HardDrive size={22} />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
        { label: 'Projects', value: stats.projects.total, sub: `${stats.projects.active} active · ${stats.projects.expired} expired`, icon: <Briefcase size={22} />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    ];

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="premium-header">
                <div className="premium-title-group">
                    <h1 className="premium-title">System Overview</h1>
                    <p className="premium-subtitle">Real-time enterprise analytics for DigiDrive</p>
                </div>
                <div className="header-date-group" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{format(new Date(), 'EEEE')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(), 'PPpp')}</div>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="premium-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '48px' }}>
                {statCards.map((s, i) => (
                    <div key={i} className="premium-card">
                        <div className="premium-icon-box" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                        <div className="premium-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="premium-label">{s.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '500' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: '48px', gap: '24px' }}>
                {/* Upload Activity Chart */}
                <div className="premium-card" style={{ padding: '24px' }}>
                    <h3 className="premium-section-title" style={{ marginBottom: '20px' }}>
                        <TrendingUp size={18} color="var(--accent-blue)" /> Upload Trajectory
                    </h3>
                    <div style={{ height: '220px', width: '100%' }}>
                        {stats.uploadTrend?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.uploadTrend} barSize={28}>
                                    <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-modal)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '13px', boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)' }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        labelStyle={{ color: 'var(--text-secondary)' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="count" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>Insufficient data for analytics</div>}
                    </div>
                </div>

                {/* File Distribution Pie Chart */}
                <div className="premium-card" style={{ padding: '24px' }}>
                    <h3 className="premium-section-title" style={{ marginBottom: '20px' }}>Asset Distribution</h3>
                    {stats.mimeBreakdown?.length > 0 ? (
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '220px' }}>
                            <div style={{ width: '160px', height: '160px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.mimeBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} innerRadius={45} stroke="none">
                                            {stats.mimeBreakdown.map((_, idx) => (
                                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: 'var(--bg-modal)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', paddingRight: '8px' }}>
                                {stats.mimeBreakdown.slice(0, 8).map((t, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '12px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ flex: 1, color: 'var(--text-secondary)', fontWeight: '500' }}>.{t._id || 'unknown'}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{t.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <div className="flex-center" style={{ height: '220px', color: 'var(--text-muted)', fontSize: '14px' }}>No assets tracked yet</div>}
                </div>
            </div>

            {/* Recent Global Activity */}
            <div className="premium-card">
                <h3 className="premium-section-title">
                    <Clock size={18} color="var(--accent-emerald)" /> Global Access Log
                </h3>
                {stats.recentActivity?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {stats.recentActivity.map((log, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '14px',
                                background: 'var(--bg-input)', borderRadius: '14px',
                                border: '1px solid var(--border-color)', transition: 'var(--transition)'
                            }} className="activity-item-hover">
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '15px', fontWeight: '800', color: '#fff', flexShrink: 0
                                }}>
                                    {log.userId?.name?.charAt(0) || '?'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{log.userId?.name || 'Unknown User'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.targetName || 'System-level operation'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <ActionBadge action={log.action} />
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', minWidth: '80px', textAlign: 'right' }}>{format(new Date(log.createdAt), 'MMM d, HH:mm')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-center" style={{ height: '120px', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
                        <Activity size={32} opacity={0.3} />
                        <p style={{ fontSize: '14px' }}>No system activity recorded in this period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOverview;
