import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../api';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_CONFIG = {
    upload: { color: '#10b981', emoji: '⬆️' }, download: { color: '#3b82f6', emoji: '⬇️' },
    delete_file: { color: '#ef4444', emoji: '🗑️' }, login: { color: '#8b5cf6', emoji: '🔐' },
    logout: { color: '#6b7280', emoji: '🚪' }, create_folder: { color: '#f59e0b', emoji: '📁' },
    delete_folder: { color: '#ef4444', emoji: '📂' }, create_project: { color: '#06b6d4', emoji: '🏗️' },
    lock_user: { color: '#ef4444', emoji: '🔒' }, unlock_user: { color: '#10b981', emoji: '🔓' },
    create_user: { color: '#10b981', emoji: '👤' }, access_denied: { color: '#ef4444', emoji: '⛔' },
    admin_action: { color: '#8b5cf6', emoji: '⚡' },
};

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

const ActivityLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ action: '', severity: '', startDate: '', endDate: '' });


    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getLogs({ ...filters, page, limit: 50 });
            setLogs(data.data);
            setTotal(data.count);
        } catch { toast.error('Failed to load logs'); }
        finally { setLoading(false); }
    }, [filters, page]);

    useEffect(() => { load(); }, [load]);



    const totalPages = Math.ceil(total / 50);

    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Activity Logs</div>
                    <div className="page-subtitle">{total} total events</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>

                    <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <select className="input-field" style={{ width: 'auto' }} value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))}>
                    <option value="">All Actions</option>
                    {ALL_ACTIONS.map(a => <option key={a} value={a}>{ACTION_CONFIG[a]?.emoji} {a.replace(/_/g, ' ')}</option>)}
                </select>
                <select className="input-field" style={{ width: 'auto' }} value={filters.severity} onChange={e => setFilters(p => ({ ...p, severity: e.target.value }))}>
                    <option value="">All Severity</option>
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="critical">🚨 Critical</option>
                </select>
                <input className="input-field" type="date" style={{ width: 'auto' }} value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
                <input className="input-field" type="date" style={{ width: 'auto' }} value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ action: '', severity: '', startDate: '', endDate: '' })}>Clear</button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Log entries */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="var(--accent-emerald)" />
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>Event Stream</span>

                </div>

                {loading && logs.length === 0 ? (
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '8px' }} />)}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex-center" style={{ height: '200px', color: 'var(--text-muted)', fontSize: '14px' }}>No activity logs found</div>
                ) : (
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '600px', overflowY: 'auto' }}>
                        {logs.map((log, i) => {
                            const cfg = ACTION_CONFIG[log.action] || { color: '#6b7280', emoji: '•' };
                            return (
                                <div key={log._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: '10px', transition: 'var(--transition)' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                        {cfg.emoji}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{log.userId?.name || 'System'}</span>
                                            <code style={{ fontSize: '11px', background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{log.userId?.empId || ''}</code>
                                            <span style={{ fontSize: '12px', color: cfg.color, fontWeight: '600' }}>{log.action.replace(/_/g, ' ')}</span>
                                            {log.targetName && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>→ {log.targetName}</span>}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.ipAddress && `IP: ${log.ipAddress}`}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                        <span className={`badge ${log.severity === 'warning' ? 'badge-amber' : log.severity === 'critical' ? 'badge-red' : 'badge-gray'}`} style={{ fontSize: '10px' }}>{log.severity}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogsPage;
