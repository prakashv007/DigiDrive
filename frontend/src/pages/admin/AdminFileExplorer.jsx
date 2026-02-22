import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../../api';
import { Search, Trash2, Download, FileText, RefreshCw, SlidersHorizontal, Calendar, ArrowDownAZ, HardDrive, Tag, Settings2, ArrowUp, ArrowDown, Image, Film, Music, Package, Code, MonitorPlay, BarChart3, AlignLeft, Globe, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SIZE_PRESETS = [
    { label: 'Any', min: '', max: '' },
    { label: '< 100 KB', min: '', max: String(100 * 1024) },
    { label: '100 KB – 1 MB', min: String(100 * 1024), max: String(1024 * 1024) },
    { label: '1 – 10 MB', min: String(1024 * 1024), max: String(10 * 1024 * 1024) },
    { label: '10 – 50 MB', min: String(10 * 1024 * 1024), max: String(50 * 1024 * 1024) },
    { label: '> 50 MB', min: String(50 * 1024 * 1024), max: '' },
];

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

const formatBytes = (b) => {
    if (!b) return '0 B';
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
    return `${(b / 1024).toFixed(0)} KB`;
};

const AdminFileExplorer = () => {
    const [files, setFiles] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    // Advanced filters
    const [showFilters, setShowFilters] = useState(false);
    const [sizePreset, setSizePreset] = useState(0);
    const [minSizeKB, setMinSizeKB] = useState('');
    const [maxSizeKB, setMaxSizeKB] = useState('');
    const [dateMode, setDateMode] = useState('none');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [yearInput, setYearInput] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employees, setEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState('');
    const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
    const empDropdownRef = useRef(null);

    // Close employee dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (empDropdownRef.current && !empDropdownRef.current.contains(e.target)) setEmpDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const effectiveMinSize = sizePreset > 0 ? SIZE_PRESETS[sizePreset].min : (minSizeKB ? String(parseFloat(minSizeKB) * 1024) : '');
    const effectiveMaxSize = sizePreset > 0 ? SIZE_PRESETS[sizePreset].max : (maxSizeKB ? String(parseFloat(maxSizeKB) * 1024) : '');
    const activeFilterCount = [effectiveMinSize || effectiveMaxSize, dateMode !== 'none' && dateFrom, selectedEmployee].filter(Boolean).length;
    const clearFilters = () => { setSizePreset(0); setMinSizeKB(''); setMaxSizeKB(''); setDateMode('none'); setDateFrom(''); setDateTo(''); setYearInput(''); setSelectedEmployee(''); setEmpSearch(''); setEmpDropdownOpen(false); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { search, sortBy, order, page, limit: 50 };
            if (effectiveMinSize) params.minSize = effectiveMinSize;
            if (effectiveMaxSize) params.maxSize = effectiveMaxSize;
            if (dateMode !== 'none' && dateFrom) { params.dateMode = dateMode; params.dateFrom = dateFrom; }
            if (dateMode === 'range' && dateTo) params.dateTo = dateTo;
            if (selectedEmployee) params.owner = selectedEmployee;
            const { data } = await adminAPI.getAllFiles(params);
            setFiles(data.data);
            setTotal(data.count);
        } catch { toast.error('Failed to load files'); }
        finally { setLoading(false); }
    }, [search, sortBy, order, page, effectiveMinSize, effectiveMaxSize, dateMode, dateFrom, dateTo, selectedEmployee]);

    // Load employees for filter dropdown
    useEffect(() => {
        adminAPI.getUsers({ limit: 200 }).then(r => setEmployees(r.data.data || [])).catch(() => { });
    }, []);

    useEffect(() => { load(); }, [load]);

    const downloadFile = (file) => {
        const token = localStorage.getItem('sentinel_token');
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
        window.open(`${apiBase}/files/${file._id}?download=true&token=${token}`, '_blank');
    };

    const deleteFile = async (file) => {
        if (!window.confirm(`Delete "${file.originalName}" permanently?`)) return;
        try {
            await adminAPI.deleteFile(file._id);
            toast.success('File deleted');
            load();
        } catch { toast.error('Failed to delete'); }
    };

    const totalPages = Math.ceil(total / 50);

    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">All Files</div>
                    <div className="page-subtitle">Superuser view — {total} files across all users</div>
                </div>
                <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Search & Sort */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
                    <Search className="search-icon" />
                    <input className="input-field" placeholder="Search files..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                {/* Sort by segment control */}
                <div style={{ display: 'flex', background: 'var(--bg-input, rgba(255,255,255,0.06))', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                    {[
                        { k: 'createdAt', Icon: Calendar, label: 'Date' },
                        { k: 'name', Icon: ArrowDownAZ, label: 'Name' },
                        { k: 'size', Icon: HardDrive, label: 'Size' },
                        { k: 'type', Icon: Tag, label: 'Type' },
                    ].map(({ k, Icon, label }) => (
                        <button
                            key={k}
                            onClick={() => setSortBy(k)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 11px', borderRadius: '7px',
                                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                transition: 'all 0.15s',
                                background: sortBy === k ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
                                color: sortBy === k ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            <Icon size={13} />{label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    title={order === 'asc' ? 'Ascending' : 'Descending'}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input, rgba(255,255,255,0.06))', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                >
                    {order === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                    {order === 'asc' ? 'Asc' : 'Desc'}
                </button>
                <button onClick={() => setShowFilters(v => !v)} className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-ghost'}`} style={{ position: 'relative' }}>
                    <SlidersHorizontal size={14} /> Filters
                    {activeFilterCount > 0 && (
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeFilterCount}</span>
                    )}
                </button>
            </div>

            {/* Advanced Filter Panel */}
            {showFilters && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Settings2 size={15} style={{ color: '#6366f1' }} /> Advanced Filters
                        </span>
                        {activeFilterCount > 0 && <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ color: '#ef4444', fontSize: '12px' }}>✕ Clear All</button>}
                    </div>
                    {/* Employee Filter */}
                    <div ref={empDropdownRef} style={{ marginBottom: '16px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <User size={13} /> Filter by Employee
                        </div>
                        {/* Trigger */}
                        <button
                            onClick={() => setEmpDropdownOpen(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                                padding: '8px 12px', borderRadius: '10px', minWidth: '260px',
                                background: 'var(--bg-input, rgba(255,255,255,0.06))',
                                border: `1px solid ${selectedEmployee ? '#6366f1' : 'var(--border-color)'}`,
                                color: selectedEmployee ? '#6366f1' : 'var(--text-secondary)',
                                fontSize: '13px', fontWeight: selectedEmployee ? '600' : '400', cursor: 'pointer',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <User size={14} />
                                {selectedEmployee
                                    ? (() => { const e = employees.find(e => e._id === selectedEmployee); return e ? `${e.name} (${e.empId})` : 'Selected'; })()
                                    : 'All Employees'}
                            </span>
                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{empDropdownOpen ? '▲' : '▼'}</span>
                        </button>

                        {/* Dropdown */}
                        {empDropdownOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                minWidth: '280px', overflow: 'hidden',
                            }}>
                                {/* Search */}
                                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)' }}>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="input-field"
                                        placeholder="Search employee name or ID..."
                                        value={empSearch}
                                        onChange={e => setEmpSearch(e.target.value)}
                                        style={{ width: '100%', fontSize: '12px', margin: 0 }}
                                    />
                                </div>
                                {/* Options */}
                                <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '6px' }}>
                                    <button
                                        onClick={() => { setSelectedEmployee(''); setEmpSearch(''); setEmpDropdownOpen(false); }}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '8px 12px',
                                            borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
                                            background: !selectedEmployee ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
                                            color: !selectedEmployee ? '#fff' : 'var(--text-primary)',
                                            fontWeight: !selectedEmployee ? '600' : '400',
                                        }}
                                    >
                                        All Employees
                                    </button>
                                    {employees
                                        .filter(e => !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()) || e.empId.toLowerCase().includes(empSearch.toLowerCase()))
                                        .map(emp => (
                                            <button
                                                key={emp._id}
                                                onClick={() => { setSelectedEmployee(emp._id); setEmpDropdownOpen(false); setEmpSearch(''); }}
                                                style={{
                                                    width: '100%', textAlign: 'left', padding: '8px 12px',
                                                    borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
                                                    background: selectedEmployee === emp._id ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
                                                    color: selectedEmployee === emp._id ? '#fff' : 'var(--text-primary)',
                                                    fontWeight: selectedEmployee === emp._id ? '600' : '400',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                }}
                                            >
                                                <span>{emp.name}</span>
                                                <span style={{ opacity: 0.5, fontSize: '11px' }}>{emp.empId}</span>
                                            </button>
                                        ))
                                    }
                                    {employees.filter(e => !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()) || e.empId.toLowerCase().includes(empSearch.toLowerCase())).length === 0 && (
                                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>No employees found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <HardDrive size={13} /> File Size
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {SIZE_PRESETS.map((p, i) => (
                                <button key={i} onClick={() => { setSizePreset(i); setMinSizeKB(''); setMaxSizeKB(''); }} className={`btn btn-sm ${sizePreset === i ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '11px' }}>{p.label}</button>
                            ))}
                        </div>
                        {sizePreset === 0 && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="number" className="input-field" placeholder="Min (KB)" value={minSizeKB} onChange={e => setMinSizeKB(e.target.value)} style={{ width: '120px', fontSize: '12px' }} />
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                <input type="number" className="input-field" placeholder="Max (KB)" value={maxSizeKB} onChange={e => setMaxSizeKB(e.target.value)} style={{ width: '120px', fontSize: '12px' }} />
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>KB</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <Calendar size={13} /> Upload Date
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {[['none', 'Any Time'], ['date', 'Exact Date'], ['month', 'Month'], ['year', 'Year'], ['range', 'Date Range']].map(([m, l]) => (
                                <button key={m} onClick={() => { setDateMode(m); setDateFrom(''); setDateTo(''); }} className={`btn btn-sm ${dateMode === m ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '11px' }}>{l}</button>
                            ))}
                        </div>
                        {dateMode === 'date' && <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '180px', fontSize: '12px' }} />}
                        {dateMode === 'month' && <input type="month" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px', fontSize: '12px' }} />}
                        {dateMode === 'year' && <input type="number" className="input-field" placeholder="e.g. 2024" min="2000" max="2099" value={dateFrom} onChange={e => setDateFrom(e.target.value ? `${e.target.value}-01-01` : '')} style={{ width: '120px', fontSize: '12px' }} />}
                        {dateMode === 'range' && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px', fontSize: '12px' }} />
                                <span style={{ color: 'var(--text-muted)' }}>→</span>
                                <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px', fontSize: '12px' }} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Owner</th>
                            <th>Folder</th>
                            <th>Size</th>
                            <th>Type</th>
                            <th>Uploaded</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(8)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>)}</tr>)
                        ) : files.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No files found</td></tr>
                        ) : files.map(file => (
                            <tr key={file._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '22px' }}>{getIcon(file.extension)}</span>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.originalName}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>v{file.currentVersion}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{file.owner?.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{file.owner?.empId}</div>
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{file.folder?.name || '— Root'}</td>
                                <td style={{ fontSize: '12px', fontWeight: '600' }}>{formatBytes(file.size)}</td>
                                <td><span className="badge badge-gray" style={{ fontSize: '10px' }}>.{file.extension || '?'}</span></td>
                                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(file.createdAt), 'MMM d, yyyy')}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => downloadFile(file)} className="btn btn-ghost btn-icon btn-sm" title="Download"><Download size={13} /></button>
                                        <button onClick={() => deleteFile(file)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--accent-red)' }} title="Delete"><Trash2 size={13} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                    <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            )}
        </div>
    );
};

export default AdminFileExplorer;
