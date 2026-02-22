import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { projectAPI, folderAPI, fileAPI } from '../../api';
import { useAuth } from '../../context/useAuth';
import { Briefcase, Users, Timer, Calendar, Clock, Lock, Upload, FileText, Download, History, Eye, BarChart3, Globe, MonitorPlay, Code, Package, Music, Film, Image, AlignLeft, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-amber', critical: 'badge-red' };

const getIcon = (ext) => {
    const e = ext?.toLowerCase();
    const size = 16;
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

const AssignedProjects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedProject, setSelectedProject] = useState(null);
    const [projectFiles, setProjectFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const loadProjects = useCallback(() => {
        setLoading(true);
        projectAPI.list()
            .then(r => { setProjects(r.data.data); setLoading(false); })
            .catch(() => { toast.error('Failed to load projects'); setLoading(false); });
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const loadProjectFiles = async (project) => {
        if (!project.folder?._id) {
            setProjectFiles([]);
            return;
        }
        setFilesLoading(true);
        try {
            const res = await folderAPI.getFiles(project.folder._id);
            setProjectFiles(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load project files');
        } finally {
            setFilesLoading(false);
        }
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        loadProjectFiles(project);
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!acceptedFiles.length || !selectedProject?.folder?._id) return;

        setUploading(true);
        let successCount = 0;

        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderId', selectedProject.folder._id);
            formData.append('projectId', selectedProject._id);

            try {
                await fileAPI.upload(formData, (progress) => {
                    setUploadProgress(progress);
                });
                successCount++;
            } catch (err) {
                toast.error(`Failed to upload ${file.name}: ${err.response?.data?.message || err.message}`);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} file(s) uploaded successfully!`);
            loadProjectFiles(selectedProject);
        }

        setUploading(false);
        setUploadProgress(0);
    }, [selectedProject]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        disabled: selectedProject?.status === 'expired' || isPast(new Date(selectedProject?.expiryDate))
    });

    const handleBack = () => {
        setSelectedProject(null);
        setProjectFiles([]);
    };

    if (loading) return (
        <div className="page-content">
            <div className="page-header"><div className="page-title">Assigned Projects</div></div>
            <div className="grid-2">{[...Array(4)].map((_, i) => <div key={i} className="glass-card skeleton" style={{ height: '200px' }} />)}</div>
        </div>
    );

    const active = projects.filter(p => p.status === 'active' && !isPast(new Date(p.expiryDate)));
    const expired = projects.filter(p => p.status === 'expired' || isPast(new Date(p.expiryDate)));
    const isProjectExpired = selectedProject?.status === 'expired' || isPast(new Date(selectedProject?.expiryDate));

    if (selectedProject) {
        return (
            <div className="page-content animate-fade-in">
                <div style={{ marginBottom: '20px' }}>
                    <button onClick={handleBack} className="btn btn-ghost btn-sm" style={{ marginBottom: '10px' }}>← Back to Projects</button>
                    <div className="page-header">
                        <div>
                            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {selectedProject.name}
                                <span className={`badge ${PRIORITY_COLORS[selectedProject.priority]}`} style={{ fontSize: '12px' }}>{selectedProject.priority}</span>
                                {selectedProject.status === 'expired' && <span className="badge badge-red">Expired</span>}
                            </div>
                            <div className="page-subtitle">Project Workspace</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
                    {/* Left Sidebar: Metadata */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>About Project</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
                                {selectedProject.description || 'No description provided.'}
                            </p>

                            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Timeline</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Created</span>
                                    <span>{format(new Date(selectedProject.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Deadline</span>
                                    <span style={{ fontWeight: '600', color: isPast(new Date(selectedProject.expiryDate)) ? '#ef4444' : '#10b981' }}>
                                        {format(new Date(selectedProject.expiryDate), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Team ({selectedProject.assignedUsers?.length || 0})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedProject.assignedUsers?.map(u => (
                                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div>{u.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{u.department} · {u.empId}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Files */}
                    <div>
                        <div className="glass-card" style={{ padding: '20px', minHeight: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={18} /> Project Files
                                </h3>
                                {!(selectedProject.status === 'expired' || isPast(new Date(selectedProject.expiryDate))) && (
                                    <div {...getRootProps()} style={{ cursor: 'pointer' }}>
                                        <input {...getInputProps()} />
                                        <button className="btn btn-primary btn-sm" disabled={uploading}>
                                            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload File'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Dropzone Area: Only show if NOT expired */}
                            {!(selectedProject.status === 'expired' || isPast(new Date(selectedProject.expiryDate))) && (
                                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{
                                    padding: '24px',
                                    marginBottom: '20px',
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    background: isDragActive ? 'rgba(59,130,246,0.05)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    <input {...getInputProps()} />
                                    {uploading ? (
                                        <div style={{ width: '100%' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Uploading... {uploadProgress}%</div>
                                            <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', transition: 'width 0.3s ease' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <Upload size={24} color="var(--text-muted)" />
                                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    {isDragActive ? 'Drop files now' : 'Drag & drop files here, or click to browse'}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {filesLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading files...</div>
                            ) : projectFiles.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No files in this project yet.</div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Size</th>
                                            <th>Type</th>
                                            <th>Uploaded</th>
                                            {!isProjectExpired && <th style={{ textAlign: 'center' }}>Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectFiles.map(file => (
                                            <tr key={file._id}>
                                                <td style={{ fontWeight: '600', fontSize: '13px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '18px' }}>{getIcon(file.extension)}</span>
                                                        <span title={file.originalName}>{file.originalName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    {formatBytes(file.size)}
                                                </td>
                                                <td><span className="badge badge-gray" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{file.extension}</span></td>
                                                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {format(new Date(file.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                {!isProjectExpired && (
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => window.open(`http://localhost:5000/api/files/${file._id}?download=true&token=${localStorage.getItem('sentinel_token')}`)}
                                                                className="btn btn-ghost btn-icon btn-sm"
                                                                title="Download"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                            {user?.role === 'admin' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Delete this file?')) {
                                                                            try {
                                                                                await fileAPI.deleteFile(file._id);
                                                                                toast.success('File deleted');
                                                                                loadProjectFiles(selectedProject);
                                                                            } catch { toast.error('Failed to delete'); }
                                                                        }
                                                                    }}
                                                                    className="btn btn-ghost btn-icon btn-sm"
                                                                    style={{ color: '#ef4444' }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Assigned Projects</div>
                    <div className="page-subtitle">{projects.length} projects · {active.length} active · {expired.length} expired</div>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
                    <Briefcase size={48} color="var(--text-muted)" />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No projects assigned to you yet.</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Contact your admin to get assigned to projects.</p>
                </div>
            ) : (
                <>
                    {active.length > 0 && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ✅ Active Projects ({active.length})
                                </h3>
                            </div>
                            <div className="grid-2" style={{ marginBottom: '32px' }}>
                                {active.map(p => {
                                    const timeLeft = formatDistanceToNow(new Date(p.expiryDate), { addSuffix: true });
                                    return (
                                        <div key={p._id} className="glass-card clickable-card" onClick={() => handleProjectClick(p)} style={{ padding: '24px', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: p.color || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                                    <Briefcase size={16} color="#fff" />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '6px', color: 'var(--text-primary)' }}>{p.name}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>{p.description || 'No description provided.'}</div>

                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                                        <span className="badge badge-green">Active</span>
                                                        <span className={`badge ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Countdown timer */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '14px' }}>
                                                <Timer size={14} color="#10b981" />
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>Expires {timeLeft}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{format(new Date(p.expiryDate), 'MMM d, yyyy')}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <Users size={14} />
                                                <span>{p.assignedUsers?.length || 0} people in this project</span>
                                                <Calendar size={13} style={{ marginLeft: 'auto' }} />
                                                <span>{p.startDate ? format(new Date(p.startDate), 'MMM d') : '—'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {expired.length > 0 && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Lock size={14} /> Expired Projects ({expired.length})
                                </h3>
                            </div>
                            <div className="grid-2">
                                {expired.map(p => (
                                    <div key={p._id} className="glass-card clickable-card" onClick={() => handleProjectClick(p)} style={{ padding: '24px', opacity: 0.7, border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Lock size={22} color="#6b7280" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '16px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{p.name}</div>
                                                <span className="badge badge-red" style={{ marginTop: '6px' }}>Access Revoked</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Expired on {format(new Date(p.expiryDate), 'MMM d, yyyy')}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AssignedProjects;
