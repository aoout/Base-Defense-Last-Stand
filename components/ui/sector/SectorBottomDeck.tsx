
import React, { useRef } from 'react';
import { useGame, useGameLoop } from '../../contexts/GameContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Icons } from '../Icons';
import { DS } from '../../../theme/designSystem';

interface SectorBottomDeckProps {
    onOpenShip: () => void;
    onOpenIndex: () => void;
}

export const SectorBottomDeck: React.FC<SectorBottomDeckProps> = ({ onOpenShip, onOpenIndex }) => {
    const { engine } = useGame();
    const { t } = useLocale();
    const fundsRef = useRef<HTMLDivElement>(null);

    // Transient Update for Funds to avoid React Renders
    useGameLoop(() => {
        if (fundsRef.current) {
            fundsRef.current.innerText = `${Math.floor(engine.state.player.score)}`;
        }
    });

    return (
        <div className="h-24 bg-slate-950 border-t-4 border-slate-900 flex relative z-20 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] pointer-events-auto shrink-0">
            
            {/* 1. SHIP SYSTEMS (Left) */}
            <div className="flex-1 flex items-center pl-8 border-r border-slate-800 relative group overflow-hidden">
                <button 
                    onClick={onOpenShip}
                    className="flex items-center gap-6 w-full h-full hover:bg-white/5 transition-colors text-left"
                >
                    <div className="w-16 h-16 border-2 border-cyan-500/50 rounded flex items-center justify-center bg-cyan-950/30 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_cyan] transition-all relative overflow-hidden">
                        <div className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform">
                            <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor"><Icons.Ship /></svg>
                        </div>
                        <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </div>
                    <div>
                        <div className={`${DS.text.label} text-cyan-600 mb-1`}>COMMAND DECK</div>
                        <div className={`${DS.text.header} text-2xl text-white group-hover:text-cyan-100`}>{t('GAME_TITLE')} {t('GAME_SUB')}</div>
                    </div>
                </button>
            </div>

            {/* 2. NAVIGATION (Center) */}
            <div className="w-64 flex items-center justify-center border-r border-slate-800 relative bg-black">
                <button 
                    onClick={onOpenIndex}
                    className="group relative w-full h-full flex flex-col items-center justify-center hover:bg-cyan-900/20 transition-colors"
                >
                    <div className="absolute inset-0 border-x border-cyan-900/30 group-hover:border-cyan-500/50 transition-colors"></div>
                    <div className="text-4xl mb-1 text-cyan-600 group-hover:text-white transition-colors group-hover:scale-110 duration-300">
                        ⟡
                    </div>
                    <div className={`${DS.text.label} text-cyan-500 group-hover:text-cyan-300`}>
                        {t('GALAXY_INDEX_TITLE')}
                    </div>
                    {/* Pulse Ring */}
                    <div className="absolute w-32 h-32 border border-cyan-500/0 rounded-full group-hover:border-cyan-500/20 group-hover:scale-110 transition-all duration-500"></div>
                </button>
            </div>

            {/* 3. RESOURCES (Right) */}
            <div className="flex-1 flex items-center justify-end pr-8 bg-slate-900/50">
                <div className="text-right">
                    <div className={`${DS.text.label} text-yellow-600 mb-1`}>{t('AVAILABLE_FUNDS')}</div>
                    <div className="flex items-baseline justify-end gap-2">
                        <div ref={fundsRef} className="text-4xl font-mono font-bold text-white tabular-nums tracking-tighter">0</div>
                        <div className="text-sm font-bold text-yellow-500">BIO</div>
                    </div>
                </div>
                <div className="ml-6 w-12 h-12 border-2 border-yellow-600/50 rounded-full flex items-center justify-center bg-yellow-900/20">
                    <div className="w-6 h-6 bg-yellow-500 rotate-45"></div>
                </div>
            </div>
        </div>
    );
};
