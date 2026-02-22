import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';

const ChangePassword = () => {
    const navigate = useNavigate();
    const { token, logout, user } = useAuth();

    // Default old password for first-time users is usually Employee@123
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { data } = await import('../api').then(module => module.authAPI.changePassword({ currentPassword, newPassword }));

            if (data.success) {
                toast.success('Password updated successfully!');
                await logout();
                navigate('/login');
                toast('Please login with your new password.', { icon: '🔐' });
            } else {
                toast.error(data.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Change Password Error:', error);
            const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
            toast.error(msg);

            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            {/* Back Button */}
            <button
                onClick={async () => { await logout(); navigate('/login'); }}
                style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', zIndex: 10 }}
            >
                <ArrowLeft size={15} /> Back
            </button>
            {/* Background Blobs */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)' }} />

            <div className="animate-slide-up" style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #ef4444, #f87171)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }}>
                        <ShieldCheck size={32} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Security Update Required
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
                        To secure your account, you must change your password before proceeding.
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', marginLeft: '4px' }}>Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '15px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', marginLeft: '4px' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '15px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', marginLeft: '4px' }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <CheckCircle2 size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '15px' }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                        >
                            {loading ? 'Updating...' : <>Update Password <ArrowRight size={18} /></>}
                        </button>

                        <button
                            type="button"
                            onClick={async () => { await logout(); navigate('/login'); }}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '10px' }}
                        >
                            <ArrowLeft size={15} /> Back to Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
