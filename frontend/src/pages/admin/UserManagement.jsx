import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../api';
import { UserPlus, Lock, Unlock, Search, Filter, ChevronDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const formatBytes = (b) => b >= 1073741824 ? `${(b / 1073741824).toFixed(1)}GB` : `${(b / 1048576).toFixed(0)}MB`;

const CreateUserModal = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({ empId: '', name: '', email: '', password: '', role: 'employee', department: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminAPI.createUser(form);
            toast.success('Employee account created!');
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Create Employee Account</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Employee ID *</label>
                                <input className="input-field" placeholder="e.g. EMP002" value={form.empId} onChange={e => setForm(p => ({ ...p, empId: e.target.value.toUpperCase() }))} required />
                            </div>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input className="input-field" placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input className="input-field" type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Password *</label>
                                <input className="input-field" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select className="input-field" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <input className="input-field" placeholder="e.g. Engineering" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState({ role: '', status: '' });
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getUsers({ search, ...filter });
            setUsers(data.data);
            setTotal(data.count);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    }, [search, filter]);

    useEffect(() => { load(); }, [load]);

    const toggleStatus = async (user) => {
        try {
            await adminAPI.updateUserStatus(user._id, { isActive: !user.isActive });
            toast.success(`User ${user.isActive ? 'locked' : 'unlocked'} successfully`);
            load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const deleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) return;
        try {
            await adminAPI.deleteUser(user._id);
            toast.success('User deleted successfully');
            load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete user'); }
    };


    return (
        <div className="page-content animate-fade-in">
            <div className="page-header">
                <div>
                    <div className="page-title">User Management</div>
                    <div className="page-subtitle">{total} employee accounts</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}><UserPlus size={16} /> New Employee</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
                    <Search className="search-icon" />
                    <input className="input-field" placeholder="Search by name, ID, or email..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input-field" style={{ width: 'auto' }} value={filter.role} onChange={e => setFilter(p => ({ ...p, role: e.target.value }))}>
                    <option value="">All Roles</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                </select>
                <select className="input-field" style={{ width: 'auto' }} value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>EmpID</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Storage</th>
                            <th>Last Login</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    {[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: '16px', borderRadius: '4px' }} /></td>)}
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No users found</td></tr>
                        ) : users.map(user => (
                            <tr key={user._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{user.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><code style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{user.empId}</code></td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user.department || '—'}</td>
                                <td><span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{user.role}</span></td>
                                <td>
                                    <div style={{ fontSize: '12px' }}>
                                        <div style={{ fontWeight: '600' }}>{formatBytes(user.storageUsed || 0)}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{user.fileCount} files</div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : 'Never'}
                                </td>
                                <td><span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>{user.isActive ? 'Active' : 'Locked'}</span></td>
                                <td>
                                    {user.role !== 'admin' && (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                                style={{ gap: '4px' }}
                                                title={user.isActive ? 'Lock Account' : 'Unlock Account'}
                                            >
                                                {user.isActive ? <><Lock size={12} /> Lock</> : <><Unlock size={12} /> Unlock</>}
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user)}
                                                className="btn btn-sm btn-ghost"
                                                style={{ color: '#ef4444', padding: '6px' }}
                                                title="Delete Employee"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={load} />}
        </div>
    );
};

export default UserManagement;
