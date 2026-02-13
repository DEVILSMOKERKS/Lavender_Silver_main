import React, { useState, useContext, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AdminContext } from '../../context/AdminContext';
import './AdminAuthPopup.css';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const AdminAuthPopup = ({ open, onLoginSuccess }) => {
    const { loginAdmin } = useContext(AdminContext);
    const [showForgot, setShowForgot] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [forgotForm, setForgotForm] = useState({ email: '' });
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetPassword, setResetPassword] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetToken, setResetToken] = useState('');

    const handleGoogleSuccess = async (response) => {
        try {
            setLoading(true);
            setError('');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/google/admin/login`, {
                credential: response.credential
            });
            const data = res.data;
            if (data.success && data.data.token) {
                loginAdmin(data.data.admin, data.data.token);
                localStorage.setItem("admin", JSON.stringify(data.data.admin));
                localStorage.setItem("admin_token", data.data.token);
                if (onLoginSuccess) onLoginSuccess();
            } else {
                setError(data.message || 'Google login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login with Google');
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            setShowReset(true);
            setResetToken(token);
        }
    }, []);

    useEffect(() => {
        if (!open) {
            setShowForgot(false);
            setShowReset(false);
            setError('');
            setForgotSuccess('');
            setResetSuccess('');
            setResetError('');
            setLoginForm({ email: '', password: '' });
            setForgotForm({ email: '' });
            setResetPassword('');
            setResetToken('');
        }
    }, [open]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (showForgot) {
            setForgotForm((prev) => ({ ...prev, [name]: value }));
        } else {
            setLoginForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/admin/login`, loginForm, {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = res.data;
            if (data.success && data.data.token) {
                setError(''); // Clear any previous error
                loginAdmin(data.data.admin, data.data.token);
                // Force store in localStorage immediately
                localStorage.setItem("admin", JSON.stringify(data.data.admin));
                localStorage.setItem("admin_token", data.data.token);
                // Ensure state updates are complete before calling onLoginSuccess
                setTimeout(() => {
                    if (onLoginSuccess) onLoginSuccess();
                }, 0);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setForgotSuccess('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/admin/forgot-password`, forgotForm, {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = res.data;
            if (data.success) {
                setForgotSuccess('Password reset link sent to your email.');
            } else {
                setError(data.message || 'Failed to send reset link');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResetError('');
        setResetSuccess('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/admin/reset-password`, { token: resetToken, password: resetPassword }, {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = res.data;
            if (data.success) {
                setResetSuccess('Password reset successful. You can now log in.');
                setShowReset(false);
                setShowForgot(false);
            } else {
                setResetError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setResetError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    return (
        <Dialog open={open} className="admin-auth-dialog" maxWidth="xs" fullWidth hideBackdrop={false}>
            <DialogTitle className="admin-auth-title">
                <span className="admin-auth-logo">PVJ</span>
                <span className="admin-auth-heading">Admin Login</span>
            </DialogTitle>
            <DialogContent>
                {showReset ? (
                    <form onSubmit={handleResetPassword} className="admin-auth-form">
                        <TextField
                            label="New Password"
                            name="new-password"
                            type={showPassword ? 'text' : 'password'}
                            value={resetPassword}
                            onChange={e => setResetPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            slotProps={{
                                input: {
                                    style: { fontFamily: 'var(--font-body)' },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(s => !s)}
                                                onMouseDown={e => e.preventDefault()}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        {resetSuccess && <div className="admin-auth-success">{resetSuccess}</div>}
                        {resetError && <div className="admin-auth-error">{resetError}</div>}
                        <DialogActions>
                            <Button type="submit" variant="contained" className="admin-auth-btn" disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                            </Button>
                        </DialogActions>
                    </form>
                ) : showForgot ? (
                    <form onSubmit={handleForgot} className="admin-auth-form">
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={forgotForm.email}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            required
                            slotProps={{ input: { style: { fontFamily: 'var(--font-body)' } } }}
                        />
                        {forgotSuccess && <div className="admin-auth-success">{forgotSuccess}</div>}
                        {error && <div className="admin-auth-error">{error}</div>}
                        <DialogActions>
                            <Button onClick={() => setShowForgot(false)} disabled={loading} className="admin-auth-link">Back to Login</Button>
                            <Button type="submit" variant="contained" className="admin-auth-btn" disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                            </Button>
                        </DialogActions>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="admin-auth-form">
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={loginForm.email}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            required
                            slotProps={{ input: { style: { fontFamily: 'var(--font-body)' } } }}
                        />
                        <TextField
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={loginForm.password}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            required
                            slotProps={{
                                input: {
                                    style: { fontFamily: 'var(--font-body)' },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                onMouseDown={handleMouseDownPassword}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        {error && <div className="admin-auth-error">{error}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                            <Button type="submit" variant="contained" className="admin-auth-btn" disabled={loading} style={{ minWidth: '180px' }}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'LOGIN'}
                            </Button>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                                <Button 
                                    onClick={() => setShowForgot(true)} 
                                    disabled={loading} 
                                    className="admin-auth-link"
                                    style={{ 
                                        textTransform: 'none', 
                                        fontSize: '13px', 
                                        padding: 0,
                                        minWidth: 'auto',
                                        textDecoration: 'none'
                                    }}
                                >
                                    FORGOT PASSWORD?
                                </Button>
                            </div>
                        </div>
                        <div className="social-login-container">
                            <div className="divider">
                                <span>OR</span>
                            </div>
                            <div className="social-buttons-container" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <div style={{ flex: 1 }}>
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google login failed')}
                                        type="standard"
                                        theme="outline"
                                        text="Google"
                                        size="large"
                                        width="100%"
                                        logo_alignment="left"
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                            <Button 
                                onClick={() => window.location.href = '/'} 
                                disabled={loading} 
                                className="admin-auth-link"
                                style={{ fontSize: '12px', opacity: 0.8 }}
                            >
                                BACK TO HOME
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AdminAuthPopup;