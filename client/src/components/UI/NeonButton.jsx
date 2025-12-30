import React from 'react';
import { motion } from 'framer-motion';

const NeonButton = ({ children, onClick, variant = 'primary', style = {}, fullWidth, ...props }) => {
    const isPrimary = variant === 'primary';
    const baseColor = isPrimary ? 'var(--color-primary)' : 'var(--color-accent)';

    return (
        <motion.button
            whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${baseColor}` }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                background: 'transparent',
                border: `1px solid ${baseColor}`,
                color: baseColor,
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: fullWidth ? '100%' : 'auto',
                transition: 'all 0.2s ease',
                ...style
            }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default NeonButton;
