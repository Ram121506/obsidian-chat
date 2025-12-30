import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, LogOut, LogIn } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NeonButton from './UI/NeonButton';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem('user'));
    const isLoggedIn = !!user;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <motion.nav
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 2rem',
                background: 'var(--color-bg-secondary)', // Use semitransparent for glass?
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
        >
            {/* Logo */}
            <div
                onClick={() => navigate('/')}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <div style={{
                    width: '32px', height: '32px',
                    background: 'var(--color-primary)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-neon)'
                }}></div>
                <h1 style={{
                    fontFamily: 'Outfit',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    letterSpacing: '1px'
                }}>
                    OBSIDIAN CHAT
                </h1>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Theme Toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                </motion.button>

                {/* Auth Buttons */}
                {!isLoggedIn && location.pathname !== '/login' && (
                    <NeonButton onClick={() => navigate('/login')} style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}>
                        Login
                    </NeonButton>
                )}

                {isLoggedIn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <img
                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                alt="avatar"
                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--color-primary)' }}
                            />
                            <span style={{ fontWeight: '600', display: window.innerWidth > 768 ? 'block' : 'none' }}>
                                {user.username}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-error)',
                                color: 'var(--color-error)',
                                borderRadius: '8px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>
        </motion.nav>
    );
};

export default Navbar;
