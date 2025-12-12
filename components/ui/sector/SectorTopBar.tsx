
import React from 'react';
import { CyberButton } from '../atoms/CyberButton';
import { useLocale } from '../../contexts/LocaleContext';
import { Icons } from '../Icons';
import { DS } from '../../../theme/designSystem';

interface SectorTopBarProps {
    sectorName: string;
    onSave: () => void;
    onExit: () => void;
}

export const SectorTopBar: React.FC<SectorTopBarProps> = ({ sectorName, onSave, onExit }) => {
    const { t } = useLocale();

    return (
        <div className="h-24 w-full bg-gradient-to-b from-slate-950 via-slate-900/90 to-transparent flex items-start justify-between px-8 pt-6 relative z-20 shrink-0 pointer-events-auto">
            {/* Left: Sector Info */}
            <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div>
                    <h2 className={`${DS.text.label} text-cyan-500`}>{t('PLANET_ANALYSIS')}</h2>
                </div>
                <h1 className="text-5xl font-display font-black text-white tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {sectorName || t('SECTOR_NAME')}
                </h1>
            </div>

            {/* Center: Deco Data */}
            <div className="flex gap-8 mt-2 opacity-50 pointer-events-none hidden md:flex">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-cyan-700 font-mono">SIGNAL_STR</span>
                    <div className="w-24 h-1 bg-slate-800 mt-1"><div className="h-full bg-cyan-500 w-[85%] animate-pulse"></div></div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-cyan-700 font-mono">DARK_MATTER</span>
                    <div className="w-24 h-1 bg-slate-800 mt-1"><div className="h-full bg-cyan-500 w-[42%]"></div></div>
                </div>
            </div>

            {/* Right: System Tools */}
            <div className="flex flex-col gap-2 items-end w-48">
                <CyberButton 
                    onClick={onSave}
                    variant="blue"
                    fullWidth
                    className="py-1 px-4 text-[10px]"
                    label={t('SAVE_STATE')}
                    icon={<div className="w-4 h-4"><svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor"><Icons.Save /></svg></div>}
                />
                <CyberButton 
                    onClick={onExit}
                    variant="slate"
                    fullWidth
                    className="py-1 px-4 text-[10px]"
                    label={t('RETURN_MAIN_MENU')}
                />
            </div>
        </div>
    );
};
