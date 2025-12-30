import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Lock } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <style>{`
                .landing-container {
                    min-height: 100vh;
                    background: radial-gradient(circle at 50% 10%, #1a1033 0%, var(--color-bg-dark) 60%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .hero-content {
                    z-index: 10;
                    max-width: 800px;
                }

                .glitch-text {
                    font-size: 4rem;
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, #fff 0%, var(--color-primary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 30px rgba(155, 92, 255, 0.5);
                }

                .subtitle {
                    font-size: 1.25rem;
                    color: var(--text-muted);
                    margin-bottom: 3rem;
                    line-height: 1.6;
                }

                .cta-button {
                    background: transparent;
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    padding: 1rem 3rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                    border-radius: 4px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    box-shadow: 0 0 10px rgba(155, 92, 255, 0.2);
                }

                .cta-button:hover {
                    background: var(--color-primary);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(155, 92, 255, 0.6);
                    transform: translateY(-2px);
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2rem;
                    margin-top: 4rem;
                    width: 100%;
                }

                .feature-card {
                    background: var(--glass-overlay);
                    border: 1px solid var(--glass-border);
                    padding: 2rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    transition: transform 0.3s ease;
                }

                .feature-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--color-primary);
                }

                .feature-icon {
                    color: var(--color-accent);
                    margin-bottom: 1rem;
                }

                .feature-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--text-primary);
                }

                .bg-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    background: var(--color-primary);
                    filter: blur(150px);
                    opacity: 0.1;
                    border-radius: 50%;
                    z-index: 1;
                }
            `}</style>

            <div className="bg-glow" style={{ top: '-10%', left: '20%' }} />
            <div className="bg-glow" style={{ bottom: '-10%', right: '20%', background: 'var(--color-accent)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="hero-content"
            >
                <motion.h1
                    className="glitch-text"
                    animate={{ textShadow: ["0 0 30px rgba(155,92,255,0.5)", "0 0 10px rgba(155,92,255,0.8)", "0 0 30px rgba(155,92,255,0.5)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    OBSIDIAN CHAT
                </motion.h1>
                <p className="subtitle">
                    End-to-End Encrypted messaging for the modern era. <br />
                    Military-grade security meets cyberpunk aesthetics.
                </p>

                <button className="cta-button" onClick={() => navigate('/login')}>
                    Initialize System
                </button>

                <div className="features-grid">
                    <div className="feature-card">
                        <Lock className="feature-icon" size={32} />
                        <h3 className="feature-title">E2E Encryption</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Only you and the recipient can read messages.</p>
                    </div>
                    <div className="feature-card">
                        <Zap className="feature-icon" size={32} />
                        <h3 className="feature-title">Real-Time</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Low-latency socket connection for instant delivery.</p>
                    </div>
                    <div className="feature-card">
                        <Shield className="feature-icon" size={32} />
                        <h3 className="feature-title">Zero Logs</h3>
                        <p style={{ color: 'var(--text-muted)' }}>We don't store your keys. Your privacy is absolute.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Landing;
