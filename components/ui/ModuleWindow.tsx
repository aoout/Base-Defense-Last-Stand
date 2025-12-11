
import React from 'react';
import { CloseButton } from './Shared';
import { CyberPanel } from './atoms/CyberPanel';
import { DS, Variant } from '../../theme/designSystem';

interface ModuleWindowProps {
    title: string;
    subtitle: string;
    theme: Variant;
    onClose: () => void;
    children: React.ReactNode;
    headerRight?: React.ReactNode; // For "Available Funds" etc.
    maxWidth?: string; // Tailwind class, e.g. "max-w-7xl"
}

export const ModuleWindow: React.FC<ModuleWindowProps> = ({ 
    title, 
    subtitle, 
    theme, 
    onClose, 
    children, 
    headerRight,
    maxWidth = "max-w-7xl"
}) => {
    // Map theme variants to specific text colors for the header if needed, 
    // though CyberPanel handles the border/glow.
    // We can use DS tokens for text colors.
    
    const getHeaderColor = (t: Variant) => {
        switch(t) {
            case 'cyan': return 'text-cyan-400';
            case 'yellow': return 'text-yellow-400';
            case 'emerald': return 'text-emerald-400';
            case 'red': return 'text-red-400';
            case 'purple': return 'text-purple-400';
            case 'blue': return 'text-blue-400';
            default: return 'text-slate-400';
        }
    }

    const headerColorClass = getHeaderColor(theme);

    return (
        <div className="absolute inset-0 z-[250] bg-black/80 flex items-center justify-center pointer-events-auto select-none font-mono p-4">
            {/* Ambient Background Effects in wrapper */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]`}></div>
            </div>

            <CyberPanel 
                className={`w-full ${maxWidth} h-[92vh] flex flex-col p-8`} 
                decorated={false} // We build our own header structure
            >
                <div className={`absolute inset-0 bg-gradient-to-b from-${theme}-900/10 to-transparent opacity-30 pointer-events-none`}></div>

                <CloseButton onClick={onClose} colorClass={`absolute top-6 right-6 border-${theme}-500/50 text-${theme}-500 hover:bg-${theme}-900 z-50`} />

                {/* Header */}
                <div className={`flex justify-between items-end mb-6 border-b border-${theme}-900/50 pb-4 shrink-0 relative z-10`}>
                    <div>
                        <h1 className={`${DS.text.header} text-5xl text-white mb-1 drop-shadow-md`}>
                            {title}
                        </h1>
                        <div className={`${DS.text.label} ${headerColorClass} pl-1`}>
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
            </CyberPanel>
        </div>
    );
};
