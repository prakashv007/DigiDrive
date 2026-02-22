import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fileAPI, folderAPI } from '../../api';
import { useAuth } from '../../context/useAuth';
import { Upload, FolderPlus, Search, Trash2, Download, History, Eye, Lock, Unlock, X, Clock, ChevronRight, SlidersHorizontal, Calendar, ArrowDownAZ, HardDrive, Tag, Settings2, ArrowUp, ArrowDown, Globe, Image, Film, Music, Package, Code, FileCode, MonitorPlay, BarChart3, AlignLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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

// ── File Preview Modal ──────────────────────────────────────────────────────
const PreviewModal = ({ file, onClose }) => {
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file.extension?.toLowerCase());
    const isVideo = ['mp4', 'avi', 'mov', 'webm'].includes(file.extension?.toLowerCase());
    const isPDF = file.extension?.toLowerCase() === 'pdf';
    const previewUrl = `http://localhost:5000/api/files/${file._id}?download=false&token=${localStorage.getItem('sentinel_token')}`;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{getIcon(file.extension)}</span>
                        <div>
                            <h2 style={{ fontSize: '16px' }}>{file.originalName}</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatBytes(file.size)} · v{file.currentVersion}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <div className="modal-body" style={{ padding: '20px' }}>
                    {isImage && <img src={`http://localhost:5000/api/files/${file._id}`} alt={file.originalName} style={{ width: '100%', height: 'auto', borderRadius: '10px', maxHeight: '60vh', objectFit: 'contain' }} onError={e => e.target.src = ''} />}
                    {isVideo && <video controls style={{ width: '100%', borderRadius: '10px' }} src={`http://localhost:5000/api/files/${file._id}`} />}
                    {isPDF && <iframe src={`http://localhost:5000/api/files/${file._id}`} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '10px' }} />}
                    {!isImage && !isVideo && !isPDF && (
                        <div className="flex-center" style={{ height: '200px', flexDirection: 'column', gap: '16px' }}>
                            <span style={{ fontSize: '64px' }}>{getIcon(file.extension)}</span>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Preview not available for this file type</p>
                            <button className="btn btn-primary btn-sm" onClick={() => { const token = localStorage.getItem('sentinel_token'); window.open(`http://localhost:5000/api/files/${file._id}?download=true&token=${token}`, '_blank'); }}>
                                <Download size={14} /> Download to View
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Timeline (Version History) Modal ────────────────────────────────────────
const TimelineModal = ({ file, onClose }) => {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fileAPI.getVersions(file._id).then(r => { setVersions(r.data.data); setLoading(false); }).catch(() => setLoading(false));
    }, [file._id]);

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '540px' }}>
                <div className="modal-header">
                    <h2>Version Timeline — {file.originalName}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '10px' }} />)}
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="flex-center" style={{ height: '120px', color: 'var(--text-muted)' }}>No version history found</div>
                    ) : (
                        <div className="timeline">
                            {versions.map((v, i) => (
                                <div key={v._id} className="timeline-item">
                                    <div className="timeline-dot" style={{ background: i === 0 ? '#3b82f6' : '#6b7280' }}>v{v.versionNumber}</div>
                                    <div className="timeline-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{i === 0 ? '🔵 Current' : `Version ${v.versionNumber}`}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{v.changelog || 'No changelog'}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', gap: '12px' }}>
                                                    <span>📤 {v.uploadedBy?.name || 'Unknown'}</span>
                                                    <span>📦 {formatBytes(v.size)}</span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                                                {format(new Date(v.createdAt), 'MMM d, yyyy')}<br />{format(new Date(v.createdAt), 'HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Create Folder Modal ──────────────────────────────────────────────────────
const CreateFolderModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;
        setLoading(true);
        try {
            await folderAPI.create({ name, isPrivate });
            toast.success('Folder created!');
            onCreate();
            onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '420px' }}>
                <div className="modal-header"><h2>Create Folder</h2><button onClick={onClose} className="btn btn-ghost btn-icon">✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Folder Name</label>
                            <input className="input-field" placeholder="My Documents" value={name} onChange={e => setName(e.target.value)} autoFocus required />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: `1px solid ${isPrivate ? 'var(--accent-purple)' : 'var(--border-color)'}` }}>
                            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-purple)' }} />
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Private Folder</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Only visible to you (and admins)</div>
                            </div>
                        </label>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Size preset helpers ──────────────────────────────────────────────────────
const SIZE_PRESETS = [
    { label: 'Any', min: '', max: '' },
    { label: '< 100 KB', min: '', max: String(100 * 1024) },
    { label: '100 KB – 1 MB', min: String(100 * 1024), max: String(1024 * 1024) },
    { label: '1 – 10 MB', min: String(1024 * 1024), max: String(10 * 1024 * 1024) },
    { label: '10 – 50 MB', min: String(10 * 1024 * 1024), max: String(50 * 1024 * 1024) },
    { label: '> 50 MB', min: String(50 * 1024 * 1024), max: '' },
];

// ── Main FileExplorer Component ──────────────────────────────────────────────
const FileExplorer = ({ privateMode = false }) => {
    const { user, updateUser, loadUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [order, setOrder] = useState('desc');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewFile, setPreviewFile] = useState(null);
    const [timelineFile, setTimelineFile] = useState(null);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    // Advanced filters
    const [showFilters, setShowFilters] = useState(false);
    const [sizePreset, setSizePreset] = useState(0);
    const [minSizeKB, setMinSizeKB] = useState('');
    const [maxSizeKB, setMaxSizeKB] = useState('');
    const [dateMode, setDateMode] = useState('none');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [yearInput, setYearInput] = useState('');

    // Resolve effective size in bytes from state (preset overrides manual if preset != 0)
    const effectiveMinSize = sizePreset > 0 ? SIZE_PRESETS[sizePreset].min : (minSizeKB ? String(parseFloat(minSizeKB) * 1024) : '');
    const effectiveMaxSize = sizePreset > 0 ? SIZE_PRESETS[sizePreset].max : (maxSizeKB ? String(parseFloat(maxSizeKB) * 1024) : '');

    const activeFilterCount = [
        effectiveMinSize || effectiveMaxSize,
        dateMode !== 'none' && dateFrom,
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSizePreset(0); setMinSizeKB(''); setMaxSizeKB('');
        setDateMode('none'); setDateFrom(''); setDateTo(''); setYearInput('');
    };

    const loadData = useCallback(async () => {
        try {
            const foldersRes = await folderAPI.list();
            const allFolders = foldersRes.data.data;
            const filtered = privateMode ? allFolders.filter(f => f.isPrivate) : allFolders.filter(f => !f.isPrivate);
            setFolders(filtered);

            const params = { sortBy, order, q: search, privateMode: String(privateMode) };
            if (effectiveMinSize) params.minSize = effectiveMinSize;
            if (effectiveMaxSize) params.maxSize = effectiveMaxSize;
            if (dateMode !== 'none' && dateFrom) { params.dateMode = dateMode; params.dateFrom = dateFrom; }
            if (dateMode === 'range' && dateTo) params.dateTo = dateTo;

            if (selectedFolder) {
                const filesRes = await folderAPI.getFiles(selectedFolder, { sortBy, order });
                setFiles(filesRes.data.data);
            } else {
                const filesRes = await fileAPI.search(params);
                setFiles(filesRes.data.data);
            }
        } catch (err) { console.error(err); }
    }, [selectedFolder, sortBy, order, search, privateMode, effectiveMinSize, effectiveMaxSize, dateMode, dateFrom, dateTo]);

    useEffect(() => { loadData(); }, [loadData]);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!acceptedFiles.length) return;
        setUploading(true);
        let successCount = 0;
        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            if (selectedFolder) {
                formData.append('folderId', selectedFolder);
            } else if (privateMode) {
                // No specific folder but we're in private mode — tag the file as private
                formData.append('isPrivate', 'true');
            }
            try {
                await fileAPI.upload(formData, setUploadProgress);
                successCount++;
            } catch (err) {
                toast.error(`Failed to upload ${file.name}: ${err.response?.data?.message || err.message}`);
            }
        }
        if (successCount > 0) {
            toast.success(`${successCount} file(s) uploaded!`);
            loadData();
            loadUser(); // Refresh storageUsed in auth context → updates sidebar widget
        }
        setUploading(false);
        setUploadProgress(0);
    }, [selectedFolder, loadData]);

    // Derive whether the currently selected folder belongs to an expired project
    const selectedFolderObj = selectedFolder ? folders.find(f => f._id === selectedFolder) : null;
    const isProjectExpired = selectedFolderObj?.project?.status === 'expired';

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true, disabled: isProjectExpired });

    const deleteFile = async (file, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${file.originalName}"?`)) return;
        try {
            await fileAPI.deleteFile(file._id);
            toast.success('File deleted');
            loadData();
            loadUser(); // Refresh storageUsed in auth context → updates sidebar widget
        } catch { toast.error('Failed to delete'); }
    };

    const downloadFile = (file, e) => {
        e.stopPropagation();
        const token = localStorage.getItem('sentinel_token');
        window.open(`http://localhost:5000/api/files/${file._id}?download=true&token=${token}`, '_blank');
    };

    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">{privateMode ? '🔐 Private Folders' : '📁 My Files'}</div>
                    <div className="page-subtitle">{privateMode ? 'Visible only to you and admins' : `${files.length} files`}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowCreateFolder(true)} className="btn btn-ghost btn-sm"><FolderPlus size={14} /> New Folder</button>
                </div>
            </div>

            {/* Folders row */}
            {folders.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={() => setSelectedFolder(null)} className={`btn btn-sm ${!selectedFolder ? 'btn-primary' : 'btn-ghost'}`}>
                        All Files
                    </button>
                    {folders.map(f => (
                        <button key={f._id} onClick={() => setSelectedFolder(f._id)} className={`btn btn-sm ${selectedFolder === f._id ? 'btn-primary' : 'btn-ghost'}`} style={{ gap: '6px' }}>
                            📁 {f.name}
                            {f.isPrivate && <span className="badge badge-purple" style={{ fontSize: '9px' }}>🔒</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* Search & sort */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
                    <Search className="search-icon" />
                    <input className="input-field" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {/* Sort by segment control */}
                <div style={{ display: 'flex', background: 'var(--bg-input, rgba(255,255,255,0.06))', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                    {[
                        { k: 'date', Icon: Calendar, label: 'Date' },
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

                    {/* Size filter */}
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

                    {/* Date filter */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <Calendar size={13} /> Upload Date
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {[['none', 'Any Time'], ['date', 'Exact Date'], ['month', 'Month'], ['year', 'Year'], ['range', 'Date Range']].map(([m, l]) => (
                                <button key={m} onClick={() => { setDateMode(m); setDateFrom(''); setDateTo(''); }} className={`btn btn-sm ${dateMode === m ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '11px' }}>{l}</button>
                            ))}
                        </div>
                        {dateMode === 'date' && (
                            <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '180px', fontSize: '12px' }} />
                        )}
                        {dateMode === 'month' && (
                            <input type="month" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px', fontSize: '12px' }} />
                        )}
                        {dateMode === 'year' && (
                            <input
                                type="text"
                                inputMode="numeric"
                                className="input-field"
                                placeholder="e.g. 2024"
                                maxLength={4}
                                value={yearInput}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setYearInput(val);
                                    setDateFrom(val.length === 4 ? `${val}-01-01` : '');
                                }}
                                style={{ width: '120px', fontSize: '12px' }}
                            />
                        )}
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

            {/* Dropzone — hidden when filter panel is open */}
            {!showFilters && (
                isProjectExpired ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '32px', marginBottom: '24px', borderRadius: '14px',
                        border: '2px dashed rgba(239,68,68,0.35)',
                        background: 'rgba(239,68,68,0.05)',
                        gap: '10px',
                    }}>
                        <span style={{ fontSize: '28px' }}>🔒</span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>Project Expired</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            File uploads are disabled for expired projects. Contact your admin to extend the project.
                        </div>
                    </div>
                ) : (
                    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: '24px' }}>
                        <input {...getInputProps()} />
                        <div className="dropzone-icon"><Upload size={40} /></div>
                        {uploading ? (
                            <div>
                                <div className="dropzone-text">Uploading... {uploadProgress}%</div>
                                <div className="progress-bar" style={{ width: '200px', margin: '12px auto 0' }}>
                                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="dropzone-text">{isDragActive ? 'Drop files here!' : 'Drag & drop files, or click to browse'}</div>
                                <div className="dropzone-sub">All file types supported · Max 100MB per file</div>
                            </>
                        )}
                    </div>
                )
            )}

            {/* File grid */}
            {files.length === 0 ? (
                <div className="flex-center" style={{ height: '200px', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '48px' }}>📂</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No files here. Drop some above to get started!</p>
                </div>
            ) : (
                <div className="file-grid">
                    {files.map(file => (
                        <div key={file._id} className="file-card" onClick={() => setPreviewFile(file)}>
                            <span className="file-icon">{getIcon(file.extension)}</span>
                            <div className="file-name" title={file.originalName}>{file.originalName}</div>
                            <div className="file-meta">{formatBytes(file.size)}</div>
                            <div className="file-meta">{format(new Date(file.createdAt), 'MMM d, yyyy')}</div>
                            {file.currentVersion > 1 && <div className="file-meta" style={{ color: 'var(--accent-blue-light)' }}>v{file.currentVersion}</div>}
                            {file.expiresAt && <div className="file-meta" style={{ color: 'var(--accent-amber)', fontSize: '11px' }}>⏳ Expires {format(new Date(file.expiresAt), 'MMM d')}</div>}
                            <div className="file-actions">
                                <button onClick={e => { e.stopPropagation(); setTimelineFile(file); }} className="btn btn-ghost btn-icon btn-sm" title="Version History"><History size={12} /></button>
                                <button onClick={e => downloadFile(file, e)} className="btn btn-ghost btn-icon btn-sm" title="Download"><Download size={12} /></button>
                                <button onClick={e => deleteFile(file, e)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--accent-red)' }} title="Delete"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
            {timelineFile && <TimelineModal file={timelineFile} onClose={() => setTimelineFile(null)} />}
            {showCreateFolder && <CreateFolderModal onClose={() => setShowCreateFolder(false)} onCreate={loadData} />}
        </div>
    );
};

export default FileExplorer;
