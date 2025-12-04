
import React from 'react';
import { CloseButton } from './Shared';

export type ThemeColor = 'cyan' | 'yellow' | 'emerald' | 'blue' | 'purple' | 'red';

interface ModuleWindowProps {
    title: string;
    subtitle: string;
    theme: ThemeColor;
    onClose: () => void;
    children: React.ReactNode;
    headerRight?: React.ReactNode; // For "Available Funds" etc.
    maxWidth?: string; // Tailwind class, e.g. "max-w-7xl"
}

const THEME_STYLES: Record<ThemeColor, {
    border: string;
    text: string;
    textDim: string;
    bg: string;
    bgGradient: string;
    shadow: string;
    closeBtn: string;
}> = {
    cyan: {
        border: 'border-cyan-500/50',
        text: 'text-cyan-400',
        textDim: 'text-cyan-700',
        bg: 'bg-cyan-950/90',
        bgGradient: 'from-cyan-900/20',
        shadow: 'shadow-[0_0_50px_rgba(6,182,212,0.15)]',
        closeBtn: 'border-cyan-700 text-cyan-500 hover:bg-cyan-900',
    },
    yellow: {
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        textDim: 'text-yellow-700',
        bg: 'bg-yellow-950/90', 
        bgGradient: 'from-yellow-900/20',
        shadow: 'shadow-[0_0_50px_rgba(234,179,8,0.15)]',
        closeBtn: 'border-yellow-700 text-yellow-500 hover:bg-yellow-900',
    },
    emerald: {
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        textDim: 'text-emerald-700',
        bg: 'bg-emerald-950/90',
        bgGradient: 'from-emerald-900/20',
        shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.15)]',
        closeBtn: 'border-emerald-700 text-emerald-500 hover:bg-emerald-900',
    },
    blue: {
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        textDim: 'text-blue-700',
        bg: 'bg-blue-950/90',
        bgGradient: 'from-blue-900/20',
        shadow: 'shadow-[0_0_50px_rgba(59,130,246,0.15)]',
        closeBtn: 'border-blue-700 text-blue-500 hover:bg-blue-900',
    },
    purple: {
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        textDim: 'text-purple-700',
        bg: 'bg-purple-950/90',
        bgGradient: 'from-purple-900/20',
        shadow: 'shadow-[0_0_50px_rgba(168,85,247,0.15)]',
        closeBtn: 'border-purple-700 text-purple-500 hover:bg-purple-900',
    },
    red: {
        border: 'border-red-500/50',
        text: 'text-red-400',
        textDim: 'text-red-700',
        bg: 'bg-red-950/90',
        bgGradient: 'from-red-900/20',
        shadow: 'shadow-[0_0_50px_rgba(239,68,68,0.15)]',
        closeBtn: 'border-red-700 text-red-500 hover:bg-red-900',
    }
};

export const ModuleWindow: React.FC<ModuleWindowProps> = ({ 
    title, 
    subtitle, 
    theme, 
    onClose, 
    children, 
    headerRight,
    maxWidth = "max-w-7xl"
}) => {
    const styles = THEME_STYLES[theme];

    // Standardize base background to slate-950/90 for consistency
    const baseBg = "bg-slate-900/95"; 

    return (
        <div className="absolute inset-0 z-[250] bg-black/80 flex items-center justify-center pointer-events-auto select-none font-mono">
            {/* Ambient Background Effects in wrapper - Reduced opacity */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]`}></div>
            </div>

            <div className={`relative w-[95%] ${maxWidth} h-[92vh] flex flex-col p-8 ${baseBg} border-2 ${styles.border} rounded-xl ${styles.shadow} backdrop-blur-md overflow-hidden`}>
                {/* Background Tech Grid inside window */}
                <div className={`absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:40px_40px] opacity-5 pointer-events-none ${styles.text}`}></div>
                <div className={`absolute inset-0 bg-gradient-to-b ${styles.bgGradient} to-transparent opacity-30 pointer-events-none rounded-xl`}></div>

                <CloseButton onClick={onClose} colorClass={`absolute top-6 right-6 ${styles.closeBtn} z-50`} />

                {/* Header */}
                <div className={`flex justify-between items-end mb-6 border-b ${styles.border} pb-4 shrink-0 relative z-10`}>
                    <div>
                        <h1 className="text-5xl font-display font-black text-white tracking-widest uppercase mb-1 drop-shadow-md">
                            {title}
                        </h1>
                        <div className={`${styles.text} text-xs font-bold tracking-[0.5em] uppercase pl-1`}>
                            {subtitle}
                        </div>
                    </div>
                    {headerRight && (
                        <div className="text-right pb-1">
                            {headerRight}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex flex-1 min-h-0 relative overflow-hidden z-10">
                    {children}
                </div>
            </div>
        </div>
    );
};
