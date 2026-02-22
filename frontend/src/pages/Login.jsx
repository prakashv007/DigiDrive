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
                        <img src="/logo.png" alt="DigiDrive logo" />
                    </div>
                    <h1>DigiDrive</h1>
                    <p>
                        Secure Enterprise Asset Management
                    </p>
                </div>

                {/* RIGHT SIDE - FORM */}
                <div className="login-form-side">
                    <div className="login-form-container">
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 className="login-form-title">Sign In</h2>
                        </div>


                        <form onSubmit={handleSubmit}>
                            {/* EMPLOYEE ID */}
                            <div className="login-input-group">
                                <label className="login-label">
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
                                <label className="login-label">
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
                                {loading ? (
                                    <>
                                        <div className="spinner-sm" />
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={20} fill="currentColor" />
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-footer-text">
                            <p>Authorized Personnel Only</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
