import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Lock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(empId, password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card animate-fade-in">
                {/* LEFT SIDE - BRANDING */}
                <div className="login-branding">
                    <div className="login-logo-box">
                        <img src="/logo.png" alt="DigiDrive logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                    </div>
                    <h1>DigiDrive</h1>
                    <p style={{ marginTop: '20px', fontSize: '16px', opacity: 0.8, maxWidth: '280px', textAlign: 'center', lineHeight: '1.6', fontWeight: '500' }}>
                        Secure Enterprise Asset Management
                    </p>
                </div>

                {/* RIGHT SIDE - FORM */}
                <div className="login-form-side">
                    <div className="login-form-container">
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>Sign In</h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* EMPLOYEE ID */}
                            <div className="login-input-group">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Employee ID
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="login-input"
                                        placeholder="e.g. EMP001"
                                        value={empId}
                                        onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                                        required
                                        autoFocus
                                    />
                                    <div className="login-input-icon">
                                        <User size={22} />
                                    </div>
                                </div>
                            </div>

                            {/* PASSWORD */}
                            <div className="login-input-group">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="login-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <div className="login-input-icon">
                                        <Lock size={22} />
                                    </div>
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="login-submit-btn"
                                disabled={loading}
                            >
                                {loading ? <div className="spinner-sm" /> : <> <Zap size={20} fill="currentColor" /> Sign In </>}
                            </button>
                        </form>

                        <div style={{ marginTop: '32px', textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Authorized Personnel Only
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
