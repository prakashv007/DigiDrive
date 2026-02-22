import React, { useEffect, useState, useCallback } from 'react';
import { projectAPI, adminAPI, folderAPI, fileAPI } from '../../api';
import { Plus, Users, Clock, Timer, Calendar, Trash2, Edit3, Check, Briefcase, Upload, FileText, Download, ArrowLeft, Search, Image, Film, Music, Package, Code, MonitorPlay, BarChart3, AlignLeft, Globe } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
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

const PRIORITY_COLORS = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-amber', critical: 'badge-red' };

const ProjectModal = ({ project, users, onClose, onSave }) => {
    const [form, setForm] = useState(project ? {
        name: project.name, description: project.description, expiryDate: project.expiryDate?.split('T')[0],
        assignedUsers: project.assignedUsers?.map(u => u._id || u), color: project.color, priority: project.priority,
    } : { name: '', description: '', expiryDate: '', assignedUsers: [], color: '#10b981', priority: 'medium' });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleUser = (id) => setForm(p => ({
        ...p,
        assignedUsers: p.assignedUsers.includes(id) ? p.assignedUsers.filter(u => u !== id) : [...p.assignedUsers, id],
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (project) { await projectAPI.update(project._id, form); toast.success('Project updated!'); }
            else { await projectAPI.create(form); toast.success('Project created!'); }
            onSave();
            onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '580px' }}>
                <div className="modal-header">
                    <h2>{project ? 'Edit Project' : 'Create Project'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Project Name *</label>
                            <input className="input-field" placeholder="e.g. Q1 Marketing Campaign" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea className="input-field" placeholder="Project overview..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
                        </div>
                        <div className="grid-2">
                            {!project && (
                                <div className="form-group">
                                    <label>Expiry Date *</label>
                                    <input className="input-field" type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
                                </div>
                            )}
                            <div className="form-group" style={project ? { gridColumn: '1 / -1' } : {}}>
                                <label>Priority</label>
                                <select className="input-field" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Assign Users */}
                        <div className="form-group">
                            <label>Assign Employees ({form.assignedUsers.length} selected)</label>

                            <div className="search-bar" style={{ marginBottom: '10px' }}>
                                <Search className="search-icon" size={16} />
                                <input
                                    className="input-field"
                                    placeholder="Search employees by name or ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>

                            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {users.filter(u => u.role === 'employee' && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.empId.toLowerCase().includes(searchQuery.toLowerCase()))).map(u => (
                                    <button key={u._id} type="button" onClick={() => toggleUser(u._id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: '1px solid', borderColor: form.assignedUsers.includes(u._id) ? 'var(--accent-blue)' : 'transparent', background: form.assignedUsers.includes(u._id) ? 'rgba(59,130,246,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: '700', flexShrink: 0 }}>{u.name?.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.empId} · {u.department || 'No dept'}</div>
                                        </div>
                                        {form.assignedUsers.includes(u._id) && <Check size={14} color="var(--accent-blue)" />}
                                    </button>
                                ))}
                                {users.filter(u => u.role === 'employee' && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.empId.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                        {searchQuery ? 'No employees match your search.' : 'No employees found. Create some first.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : project ? 'Update' : 'Create Project'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProjectGovernance = () => {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalProject, setModalProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [usersPopup, setUsersPopup] = useState(null); // project._id whose popup is open

    // Detail View State
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectFiles, setProjectFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, uRes] = await Promise.all([projectAPI.list(), adminAPI.getUsers({ limit: 100 })]);
            setProjects(pRes.data.data);
            setUsers(uRes.data.data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    }, []);

    const fetchProjectFiles = async (p) => {
        setFilesLoading(true);
        try {
            if (p.folder?._id) {
                const res = await folderAPI.getFiles(p.folder._id);
                setProjectFiles(res.data.data);
            } else {
                setProjectFiles([]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load files');
        } finally {
            setFilesLoading(false);
        }
    };

    const handleProjectClick = (p) => {
        setSelectedProject(p);
        fetchProjectFiles(p);
    };

    const handleBack = () => {
        setSelectedProject(null);
        setProjectFiles([]);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        // Admin upload to specific project folder
        if (selectedProject?.folder?._id) {
            formData.append('folderId', selectedProject.folder._id);
        }

        try {
            await fileAPI.upload(formData);
            toast.success('Files uploaded');
            fetchProjectFiles(selectedProject); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('Permanently delete this file?')) return;
        try {
            await fileAPI.deleteFile(fileId);
            toast.success('File deleted');
            setProjectFiles(prev => prev.filter(f => f._id !== fileId));
        } catch (error) {
            toast.error('Failed to delete file');
        }
    };

    useEffect(() => { load(); }, [load]);

    const deleteProject = async (id) => {
        if (!window.confirm('Delete this project? Users will lose access.')) return;
        try { await projectAPI.delete(id); toast.success('Project deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const STATUS_COLORS = { active: 'badge-green', expired: 'badge-red', archived: 'badge-gray' };

    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">Project Governance</div>
                    <div className="page-subtitle">Manage project access and duration timers</div>
                </div>
                <button className="btn btn-primary" onClick={() => { setModalProject(null); setShowModal(true); }}><Plus size={16} /> New Project</button>
            </div>

            {loading ? (
                <div className="grid-2">{[...Array(4)].map((_, i) => <div key={i} className="glass-card skeleton" style={{ height: '200px' }} />)}</div>
            ) : projects.length === 0 ? (
                <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
                    <Briefcase size={48} color="var(--text-muted)" />
                    <p style={{ color: 'var(--text-muted)' }}>No projects yet. Create your first project.</p>
                    <button className="btn btn-primary" onClick={() => { setModalProject(null); setShowModal(true); }}><Plus size={16} /> Create Project</button>
                </div>
            ) : selectedProject ? (
                // Detail View
                <div className="animate-fade-in">
                    <button onClick={handleBack} className="btn btn-ghost btn-sm" style={{ marginBottom: '14px', gap: '6px' }}><ArrowLeft size={14} /> Back to Projects</button>

                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{selectedProject.name}</h2>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.5' }}>{selectedProject.description}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                    <span className={`badge ${PRIORITY_COLORS[selectedProject.priority]}`}>{selectedProject.priority}</span>
                                    <span className={`badge ${STATUS_COLORS[selectedProject.status]}`}>{selectedProject.status}</span>
                                    {selectedProject.expiryDate && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '6px' }}>
                                            <Timer size={13} /> Expires {format(new Date(selectedProject.expiryDate), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Project Folder ID</div>
                                <code style={{ background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{selectedProject.folder?._id || 'No Folder'}</code>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} className="text-blue-500" /> Project Files
                            </h3>
                            <div>
                                <input type="file" id="project-file-upload" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
                                <label htmlFor="project-file-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                                    {uploading ? 'Uploading...' : <><Upload size={16} /> Upload File</>}
                                </label>
                            </div>
                        </div>

                        {filesLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading files...</div>
                        ) : projectFiles.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No files uploaded to this project yet.
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Size</th>
                                        <th>Type</th>
                                        <th>Uploaded By</th>
                                        <th>Date</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectFiles.map(file => (
                                        <tr key={file._id}>
                                            <td style={{ fontWeight: '500' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '16px' }}>{getIcon(file.extension)}</span>
                                                    {file.originalName}
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{(file.size / 1024).toFixed(1)} KB</td>
                                            <td><span className="badge badge-gray">{file.extension}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                                        {file.owner?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <span style={{ fontSize: '13px' }}>{file.owner?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{format(new Date(file.createdAt), 'MMM d, p')}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        onClick={() => window.open(`http://localhost:5000/api/files/${file._id}?download=true&token=${localStorage.getItem('sentinel_token')}`)}
                                                        className="btn btn-ghost btn-icon btn-sm"
                                                        title="Download"
                                                    >
                                                        <Download size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFile(file._id)}
                                                        className="btn btn-ghost btn-icon btn-sm"
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid-2">
                    {projects.map(p => {
                        const isExpired = isPast(new Date(p.expiryDate)) || p.status === 'expired';
                        const timeLeft = !isExpired ? formatDistanceToNow(new Date(p.expiryDate), { addSuffix: true }) : 'Expired';
                        return (
                            <div key={p._id} className="glass-card clickable-card" onClick={() => handleProjectClick(p)} style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: p.color || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                            <Briefcase size={14} color="#fff" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '15px' }}>{p.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.description || 'No description'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); setModalProject(p); setShowModal(true); }} className="btn btn-ghost btn-icon btn-sm"><Edit3 size={13} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteProject(p._id); }} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--accent-red)' }}><Trash2 size={13} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                    <span className={`badge ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                                    <span className={`badge ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                                </div>

                                {/* Countdown timer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: isExpired ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', borderRadius: '10px', border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, marginBottom: '14px' }}>
                                    <Timer size={14} color={isExpired ? '#ef4444' : '#10b981'} />
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: isExpired ? '#ef4444' : '#10b981' }}>{timeLeft}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{format(new Date(p.expiryDate), 'MMM d, yyyy')}</span>
                                </div>

                                {/* Assigned users */}
                                <div style={{ position: 'relative' }}>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setUsersPopup(usersPopup === p._id ? null : p._id); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Users size={14} color="var(--text-muted)" />
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.assignedUsers?.length || 0} users assigned</span>
                                        <div style={{ display: 'flex', marginLeft: 'auto' }}>
                                            {(p.assignedUsers || []).slice(0, 4).map((u, i) => (
                                                <div key={i} title={u.name || u} style={{ width: '26px', height: '26px', borderRadius: '50%', background: `hsl(${(i * 60) + 210}, 70%, 55%)`, border: '2px solid var(--bg-card)', marginLeft: i > 0 ? '-8px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff' }}>
                                                    {(u.name || u)?.[0]}
                                                </div>
                                            ))}
                                            {(p.assignedUsers?.length || 0) > 4 && <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-input)', border: '2px solid var(--bg-card)', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>+{p.assignedUsers.length - 4}</div>}
                                        </div>
                                    </div>

                                    {/* Users Popup */}
                                    {usersPopup === p._id && (
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 100,
                                                background: 'var(--bg-modal)', border: '1px solid var(--border-color)',
                                                borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                                                minWidth: '240px', overflow: 'hidden',
                                            }}
                                        >
                                            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Assigned Users ({p.assignedUsers?.length || 0})</span>
                                                <button onClick={() => setUsersPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1 }}>✕</button>
                                            </div>
                                            <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px' }}>
                                                {(p.assignedUsers || []).length === 0 ? (
                                                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>No users assigned</div>
                                                ) : (p.assignedUsers || []).map((u, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${(i * 60) + 210}, 70%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                                            {(u.name || '?')[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.name || 'Unknown'}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.empId || ''}{u.department ? ` · ${u.department}` : ''}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && <ProjectModal project={modalProject} users={users} onClose={() => setShowModal(false)} onSave={load} />}
        </div>
    );
};

export default ProjectGovernance;
