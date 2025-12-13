
import React, { useState, useEffect } from 'react';
import { CyberButton } from './atoms/CyberButton';
import { CyberPanel } from './atoms/CyberPanel';
import { DS, Variant } from '../../theme/designSystem';

export { WeaponIcon, SystemIcon } from './Icons';

// --- VISUAL FX COMPONENTS ---

export const MonitorOverlay: React.FC<{ className?: string, opacity?: string, zIndex?: string }> = ({ className = "", opacity = "opacity-20", zIndex = "z-0" }) => (
    <div className={`absolute inset-0 pointer-events-none ${zIndex} ${opacity} bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] ${className}`}></div>
);

export const CRTScanline: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-[10%] animate-[scan_8s_linear_infinite]"></div>
    </div>
);

export const TechCard: React.FC<{ children: React.ReactNode, className?: string, active?: boolean }> = ({ children, className = "", active = false }) => (
    <div className={`relative bg-slate-900/80 border ${active ? 'border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-700/50 hover:border-slate-500'} backdrop-blur-md transition-all duration-300 group overflow-hidden ${className}`}>
        {/* Corner Accents */}
        <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${active ? 'border-cyan-400' : 'border-slate-500'} transition-colors`}></div>
        <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${active ? 'border-cyan-400' : 'border-slate-500'} transition-colors`}></div>
        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${active ? 'border-cyan-400' : 'border-slate-500'} transition-colors`}></div>
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${active ? 'border-cyan-400' : 'border-slate-500'} transition-colors`}></div>
        
        {/* Content */}
        <div className="relative z-10 h-full">
            {children}
        </div>
    </div>
);

export const CyberBar: React.FC<{ value: number, max: number, color?: string, height?: string, label?: string }> = ({ value, max, color = "bg-cyan-500", height = "h-2", label }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400 uppercase tracking-wider">
                    <span>{label}</span>
                    <span>{Math.floor(value)} / {max}</span>
                </div>
            )}
            <div className={`w-full ${height} bg-slate-900/80 border border-slate-700/50 relative overflow-hidden`}>
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_100%]"></div>
                {/* Fill */}
                <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${color} opacity-80`} 
                    style={{ width: `${pct}%` }}
                >
                    <div className="absolute top-0 right-0 h-full w-1 bg-white/50 shadow-[0_0_10px_white]"></div>
                </div>
            </div>
        </div>
    );
};

export const GlitchText: React.FC<{ text: string, className?: string, speed?: number, trigger?: any }> = ({ text, className, speed = 30, trigger }) => {
    const [display, setDisplay] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&";
    
    useEffect(() => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(
                text.split("")
                    .map((char, index) => {
                        if (index < iterations) return char;
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("")
            );
            
            if (iterations >= text.length) clearInterval(interval);
            iterations += 1/3; // Decodes 1 char every 3 frames
        }, speed);
        
        return () => clearInterval(interval);
    }, [text, speed, trigger]);

    return <span className={className}>{display}</span>;
}

export const CloseButton: React.FC<{ onClick: () => void, colorClass?: string }> = ({ onClick, colorClass = "border-white/20 text-white/50 hover:text-white hover:bg-white/10" }) => (
    <button onClick={onClick} className={`absolute top-4 right-4 p-2 rounded-sm border transition-all z-50 backdrop-blur-sm ${colorClass} group hover:rotate-90 duration-300`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

export const HoloWindow: React.FC<{ 
    children: React.ReactNode; 
    onClose: () => void; 
    title: string;
    subtitle?: string;
    width?: string;
    color?: Variant;
}> = ({ children, onClose, title, subtitle, width = "w-[800px]", color = 'cyan' }) => {
    
    // Convert generic Variant to specific styles for HoloWindow if needed, or use them directly.
    const borderColor = `border-${color}-500`;
    const gradientColor = `from-${color}-900/40`;

    return (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className={`relative ${width} bg-slate-900/95 bg-gradient-to-br ${gradientColor} to-slate-950/90 border ${borderColor} rounded-lg backdrop-blur-xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl transition-all duration-300 transform scale-100`}>
                <CRTScanline />
                
                {/* Header */}
                <div className="flex justify-between items-center p-8 pb-4 border-b border-white/10 relative z-10">
                    <div>
                        <h2 className={`${DS.text.header} text-3xl text-white drop-shadow-lg flex items-center gap-3`}>
                            <span className={`w-2 h-8 bg-gradient-to-b from-${color}-400 to-${color}-600`}></span>
                            <GlitchText text={title} />
                        </h2>
                        {subtitle && <p className={`${DS.text.label} text-white/50 mt-1 ml-5`}>{subtitle}</p>}
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Generic Selectable Button (Standardized replacement using CyberButton internally mostly, or styled same)
export const TacticalButton: React.FC<{
    onClick: () => void;
    label: string;
    active?: boolean;
    icon?: React.ReactNode;
    colorClass?: Variant;
    className?: string;
}> = ({ onClick, label, active, icon, colorClass = 'cyan', className = "" }) => {
    
    // We can just wrap CyberButton or use similar styles. 
    // Since TacticalButton is for tabs mainly, let's keep it specific but using DS logic
    
    let activeClass = "";
    let hoverClass = "";
    
    // Quick mapping or move this logic to DS if reused often
    if (colorClass === 'cyan') { activeClass = 'bg-cyan-900/30 text-cyan-400 border-cyan-500'; hoverClass = 'hover:text-cyan-300'; }
    if (colorClass === 'red') { activeClass = 'bg-red-900/30 text-red-400 border-red-500'; hoverClass = 'hover:text-red-300'; }
    if (colorClass === 'emerald') { activeClass = 'bg-emerald-900/30 text-emerald-400 border-emerald-500'; hoverClass = 'hover:text-emerald-300'; }
    if (colorClass === 'yellow') { activeClass = 'bg-yellow-900/30 text-yellow-400 border-yellow-500'; hoverClass = 'hover:text-yellow-300'; }
    if (colorClass === 'purple') { activeClass = 'bg-purple-900/30 text-purple-400 border-purple-500'; hoverClass = 'hover:text-purple-300'; }

    return (
        <button
            onClick={onClick}
            className={`
                group relative w-full flex items-center gap-3 px-6 py-4 transition-all duration-300 overflow-hidden text-left
                ${active ? activeClass + ' border-l-4' : `text-slate-500 ${hoverClass} hover:bg-slate-800/50 border-l-4 border-transparent`}
                ${className}
            `}
        >
            {icon && <div className={`text-xl transition-transform duration-300 ${active ? 'scale-110' : 'scale-100 opacity-70 group-hover:opacity-100'}`}>{icon}</div>}
            <span className={DS.text.label}>{label}</span>
            
            {active && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>}
        </button>
    );
};
