
import React, { useState, useEffect, useRef } from 'react';
import { WeaponType } from '../../types';

// --- ICONS ---
export const WeaponIcon: React.FC<{ type: WeaponType, className?: string }> = ({ type, className }) => {
    let d = "";
    switch(type) {
        case WeaponType.AR: d="M4 12h16M15 12v3M7 12v2"; break;
        case WeaponType.SG: d="M4 11h16v2H4zM16 13v3"; break;
        case WeaponType.SR: d="M2 12h20M14 12v3M6 12v2M18 10v2"; break;
        case WeaponType.PISTOL: d="M6 10h8v4H6zM11 14v3"; break;
        case WeaponType.FLAMETHROWER: d="M4 11h12v2H4zM16 10v4M18 11h2"; break;
        case WeaponType.PULSE_RIFLE: d="M4 10h16v4H4zM10 10v4M16 10v4"; break;
        case WeaponType.GRENADE_LAUNCHER: d="M4 10h10v4H4zM14 9v6M16 11h4"; break;
    }
    return (<svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>)
}

// --- VISUAL FX COMPONENTS ---

/**
 * Renders text that "decodes" itself with random characters.
 */
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
    }, [text, speed, trigger]); // Re-run if trigger changes

    return <span className={className}>{display}</span>;
}

export const CloseButton: React.FC<{ onClick: () => void, colorClass?: string }> = ({ onClick, colorClass = "border-white/20 text-white/50 hover:text-white hover:bg-white/10" }) => (
    <button onClick={onClick} className={`absolute top-4 right-4 p-2 rounded-full border transition-all z-50 backdrop-blur-sm ${colorClass} group`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

/**
 * A modern, glassmorphism-styled modal window.
 */
export const HoloWindow: React.FC<{ 
    children: React.ReactNode; 
    onClose: () => void; 
    title: string;
    subtitle?: string;
    width?: string;
    color?: 'cyan' | 'red' | 'yellow' | 'emerald' | 'purple' | 'blue';
}> = ({ children, onClose, title, subtitle, width = "w-[800px]", color = 'cyan' }) => {
    
    const colors = {
        cyan: "border-cyan-500/30 shadow-cyan-500/20 from-cyan-900/40",
        red: "border-red-500/30 shadow-red-500/20 from-red-900/40",
        yellow: "border-yellow-500/30 shadow-yellow-500/20 from-yellow-900/40",
        emerald: "border-emerald-500/30 shadow-emerald-500/20 from-emerald-900/40",
        purple: "border-purple-500/30 shadow-purple-500/20 from-purple-900/40",
        blue: "border-blue-500/30 shadow-blue-500/20 from-blue-900/40",
    };

    const theme = colors[color];

    return (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className={`relative ${width} bg-slate-900/80 bg-gradient-to-br ${theme} to-slate-950/90 border ${theme.split(' ')[0]} rounded-2xl ${theme.split(' ')[1]} backdrop-blur-xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl transition-all duration-300 transform scale-100`}>
                
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')]"></div>

                {/* Header */}
                <div className="flex justify-between items-center p-8 pb-4 border-b border-white/10 relative z-10">
                    <div>
                        <h2 className="text-3xl font-display font-black tracking-widest uppercase text-white drop-shadow-lg flex items-center gap-3">
                            <span className={`w-2 h-8 rounded-full bg-gradient-to-b ${color === 'cyan' ? 'from-cyan-400 to-blue-600' : color === 'red' ? 'from-red-400 to-orange-600' : 'from-white to-gray-500'}`}></span>
                            <GlitchText text={title} />
                        </h2>
                        {subtitle && <p className="text-[10px] font-mono tracking-[0.3em] font-bold text-white/50 uppercase mt-1 ml-5">{subtitle}</p>}
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

/**
 * A stylized button for the main menu system bar.
 */
export const CyberButton: React.FC<{
    onClick: () => void;
    label: string;
    icon?: React.ReactNode;
    active?: boolean;
    color?: string; // Tailwind text color class e.g. "text-cyan-400"
}> = ({ onClick, label, icon, active, color = "text-slate-400" }) => (
    <button 
        onClick={onClick}
        className={`
            group relative flex flex-col items-center justify-center gap-1.5 px-4 py-3 
            transition-all duration-300 rounded-xl min-w-[90px]
            ${active ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5'}
        `}
    >
        <div className={`text-2xl transition-all duration-300 group-hover:-translate-y-1 ${active ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : color} group-hover:text-white`}>
            {icon}
        </div>
        <div className={`text-[9px] font-bold tracking-widest uppercase transition-colors ${active ? 'text-white' : 'text-slate-500'} group-hover:text-white`}>
            {label}
        </div>
        
        {/* Active Dot */}
        {active && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]"></div>}
    </button>
);
