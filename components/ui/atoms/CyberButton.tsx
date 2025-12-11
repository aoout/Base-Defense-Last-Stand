
import React from 'react';
import { Variant, getThemeClasses, DS } from '../../../theme/designSystem';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    active?: boolean;
    icon?: React.ReactNode;
    label?: string;
    subLabel?: string;
    fullWidth?: boolean;
}

export const CyberButton: React.FC<CyberButtonProps> = ({ 
    variant = 'cyan', 
    active = false, 
    icon, 
    label, 
    subLabel,
    fullWidth = false,
    className = "",
    disabled,
    children,
    ...props 
}) => {
    
    // Logic for active vs inactive styles
    // If active, use color. If not, use slate/gray look but hover into color?
    // Let's stick to the design system helper
    
    const themeClasses = active 
        ? getThemeClasses(variant, true) 
        : `border-slate-800 text-slate-500 hover:border-${variant}-500/50 hover:text-${variant}-400 hover:bg-slate-900`;

    const disabledClasses = "opacity-50 cursor-not-allowed grayscale";

    return (
        <button 
            className={`
                group relative flex items-center justify-center gap-3 px-6 py-3 border-2 transition-all duration-200 overflow-hidden
                ${fullWidth ? 'w-full' : ''}
                ${disabled ? disabledClasses : themeClasses}
                ${className}
            `}
            disabled={disabled}
            {...props}
        >
            {/* Background Scanline Effect on Hover/Active */}
            {(active || !disabled) && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${active ? 'bg-white' : ''}`}></div>
            )}
            
            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-inherit opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-inherit opacity-50"></div>

            {/* Content */}
            {icon && <div className={`text-xl ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>{icon}</div>}
            
            <div className="flex flex-col items-start text-left">
                {label && <span className={`${DS.text.header} text-sm leading-none`}>{label}</span>}
                {subLabel && <span className="font-mono text-[9px] font-bold tracking-[0.2em] opacity-70">{subLabel}</span>}
                {!label && children}
            </div>
        </button>
    );
};
