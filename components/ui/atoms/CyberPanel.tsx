import React from 'react';
import { DS } from '../../../theme/designSystem';

interface CyberPanelProps {
    children: React.ReactNode;
    className?: string;
    noBorder?: boolean;
    decorated?: boolean;
    onClick?: () => void;
}

export const CyberPanel: React.FC<CyberPanelProps> = ({ children, className = "", noBorder = false, decorated = false, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`
            relative bg-slate-900/90 backdrop-blur-md overflow-hidden
            ${noBorder ? '' : 'border border-slate-700'}
            ${className}
        `}>
            {/* Global Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_3px,3px_100%]"></div>
            
            {decorated && (
                <>
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
                </>
            )}

            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};