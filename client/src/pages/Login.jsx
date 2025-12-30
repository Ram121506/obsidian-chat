import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Chrome } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import NeonButton from '../components/UI/NeonButton';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await fetch('http://localhost:3001/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/chat');
        } catch (err) {
            setError(err.message);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const url = `http://localhost:3001${endpoint}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Something went wrong');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/chat');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, #1a1033 0%, var(--color-bg-dark) 80%)',
            padding: '1rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: 'var(--glass-overlay)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '24px',
                    padding: '3rem',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Glow */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                    background: 'linear-gradient(45deg, transparent 40%, rgba(155,92,255,0.1) 50%, transparent 60%)',
                    animation: 'rotate 10s linear infinite', pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'Outfit' }}>
                        {isLogin ? 'SYSTEM ACCESS' : 'NEW OPERATOR'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {isLogin ? 'Enter credentials to decrypt session.' : 'Register for end-to-end secure comms.'}
                    </p>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ff6b6b',
                            padding: '0.8rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!isLogin && (
                            <div className="input-group" style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    required={!isLogin}
                                    style={inputStyle}
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="input-group" style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                style={inputStyle}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                style={inputStyle}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <NeonButton type="submit" fullWidth disabled={loading}>
                            {loading ? 'PROCESSING...' : (isLogin ? 'INITIATE LOGIN' : 'CREATE ACCOUNT')}
                        </NeonButton>
                    </form>

                    <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                        <div style={{ height: '1px', flex: 1, background: 'var(--glass-border)' }}></div>
                        <span>OR</span>
                        <div style={{ height: '1px', flex: 1, background: 'var(--glass-border)' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Login Failed")}
                            theme="filled_black"
                            shape="pill"
                            width="280"
                        />
                    </div>

                    <p style={{ fontSize: '0.7rem', color: 'gray', marginTop: '10px' }}>
                        Note: Google Auth requires a valid CLIENT_ID in main.jsx
                    </p>

                    <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isLogin ? "Need an account? " : "Already have an account? "}
                        <span
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}
                        >
                            {isLogin ? 'Register' : 'Login'}
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '1rem',
    transition: 'border-color 0.3s'
};

export default Login;
