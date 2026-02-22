import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../api';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';

const RansomwareProtection = () => {
    const [security, setSecurity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(new Date());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getSecurity();
            setSecurity(data.data);
            setLastChecked(new Date());
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);



    if (loading && !security) return (
        <div className="page-content">
            <div className="page-header"><div className="page-title">Ransomware Shield</div></div>
            <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />
        </div>
    );

    const TL = security?.threatLevel || 'LOW';
    const TL_ICON = TL === 'LOW' ? <CheckCircle size={48} color="#10b981" /> : TL === 'MEDIUM' ? <AlertTriangle size={48} color="#f59e0b" /> : <Shield size={48} color="#ef4444" />;

    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Ransomware Shield</div>
                    <div className="page-subtitle">System integrity & threat monitoring</div>
                </div>
                <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Threat level card */}
            <div className={`threat-indicator threat-${TL}`} style={{ padding: '28px 32px', borderRadius: '20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                {TL_ICON}
                <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '6px' }}>Threat Level</div>
                    <div style={{ fontSize: '40px', fontWeight: '900', lineHeight: 1 }}>{TL}</div>
                    <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.85 }}>{security?.status}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} /> Last checked: {format(lastChecked, 'HH:mm:ss')}
                    </div>

                </div>
            </div>

            {/* 24h Stats */}
            <div className="grid-3" style={{ marginBottom: '28px' }}>
                {[
                    { label: 'File Deletions (24h)', value: security?.last24h?.deletes || 0, threshold: 20, icon: '🗑️', warn: 'High deletion rate may indicate ransomware' },
                    { label: 'File Uploads (24h)', value: security?.last24h?.uploads || 0, icon: '⬆️' },
                    { label: 'Access Denied (24h)', value: security?.last24h?.accessDenied || 0, threshold: 10, icon: '⛔', warn: 'Multiple denied accesses may indicate probing' },
                ].map((stat, i) => {
                    const isAlert = stat.threshold && stat.value > stat.threshold;
                    return (
                        <div key={i} className="stat-card" style={{ borderColor: isAlert ? 'rgba(239,68,68,0.4)' : 'var(--border-color)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{stat.icon}</div>
                            <div className="stat-value" style={{ color: isAlert ? '#ef4444' : 'var(--text-primary)', fontSize: '36px' }}>{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                            {isAlert && <div style={{ marginTop: '10px', fontSize: '11px', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: '6px' }}>⚠️ {stat.warn}</div>}
                        </div>
                    );
                })}
            </div>

            {/* Warning logs */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#f59e0b" /> Recent Security Events (Last 24h)
                </h3>
                {security?.warningLogs?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {security.warningLogs.map((log, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: log.severity === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${log.severity === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '10px' }}>
                                <span style={{ fontSize: '18px' }}>{log.severity === 'warning' ? '⚠️' : '🚨'}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{log.userId?.name || 'System'}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{log.action?.replace(/_/g, ' ')}</span>
                                    {log.targetName && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> → {log.targetName}</span>}
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{format(new Date(log.createdAt), 'MMM d, HH:mm')}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-center" style={{ height: '100px', gap: '10px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={20} color="#10b981" />
                        <span style={{ fontSize: '14px' }}>No security events in the last 24 hours. System is clean.</span>
                    </div>
                )}
            </div>

            {/* Protection features */}
            <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Protection Mechanisms</h3>
                <div className="grid-2">
                    {[
                        { name: 'Deletion Rate Monitor', desc: 'Active monitoring of file streams; triggers ALERT if >20 files are deleted within 24 hours.', status: 'Active' },
                        { name: 'Access Control Logs', desc: 'Deep audit trail logging IP, User Agent, and timestamps for every denied request.', status: 'Active' },
                        { name: 'Project Expiry Guard', desc: 'Automated Revocation: Access rights are instantly purged upon project expiration.', status: 'Active' },
                        { name: 'Inactivity Lockout', desc: 'Zero-Trust Protocol: Accounts are auto-locked after 30 days of inactivity.', status: 'Active' },
                        { name: 'File Self-Destruct', desc: 'Secure Purge: Files with expiry timers are physically shredded from the server disk.', status: 'Active' },
                        { name: 'Integrity Checksum', desc: 'Real-time hashing ensures file contents haven\'t been tampered with or corrupted.', status: 'Active' },
                    ].map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
                            <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{feat.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{feat.desc}</div>
                            </div>
                            <span className="badge badge-green" style={{ marginLeft: 'auto', flexShrink: 0 }}>{feat.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RansomwareProtection;
