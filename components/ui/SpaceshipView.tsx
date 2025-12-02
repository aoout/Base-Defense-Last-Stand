


import React, { useState, useRef } from 'react';
import { GameState, SpaceshipModuleType } from '../../types';
import { SPACESHIP_MODULES } from '../../data/registry';

interface SpaceshipViewProps {
    state: GameState;
    onClose: () => void;
    onPurchaseModule: (modType: SpaceshipModuleType) => void;
    onOpenUpgrades: () => void;
    onOpenCarapaceGrid: () => void;
    onOpenInfrastructure: () => void;
    onOpenComputer?: () => void;
    onCheat?: () => void;
    t: (key: string) => string;
}

export const SpaceshipView: React.FC<SpaceshipViewProps> = ({ state, onClose, onPurchaseModule, onOpenUpgrades, onOpenCarapaceGrid, onOpenInfrastructure, onOpenComputer, onCheat, t }) => {
    const installed = state.spaceship.installedModules;
    const availableModules = Object.values(SpaceshipModuleType).filter(m => !installed.includes(m));
    const [clickCount, setClickCount] = useState(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleScrapClick = () => {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        
        const newCount = clickCount + 1;
        setClickCount(newCount);
        
        if (newCount >= 10) {
            if (onCheat) onCheat();
            setClickCount(0);
        } else {
            clickTimerRef.current = setTimeout(() => {
                setClickCount(0);
            }, 500); // 0.5s window between clicks
        }
    };

    return (
        <div className="absolute inset-0 bg-slate-950 z-[200] flex flex-col overflow-hidden pointer-events-auto select-none">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 perspective-[1000px] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
            </div>

            {/* Top UI Bar */}
            <div className="relative z-10 flex justify-between items-start p-8 w-full pointer-events-none">
                {/* Left: Scraps / Fragments */}
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse"></div>
                        <span className="text-cyan-600 text-[10px] font-mono tracking-[0.2em] uppercase">{t('STORAGE_ACCESS')}</span>
                    </div>
                    <div 
                        className="bg-slate-900/90 border-l-2 border-cyan-500 px-6 py-2 backdrop-blur-md shadow-lg flex items-baseline gap-3 cursor-pointer hover:bg-slate-800 transition-colors active:bg-cyan-900/20"
                        onClick={handleScrapClick}
                    >
                         <span className="text-4xl font-display font-black text-white tracking-tighter tabular-nums">{Math.floor(state.player.score)}</span>
                         <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{t('FRAGMENTS')}</span>
                    </div>
                </div>

                {/* Right: Ship Class Info */}
                 <div className="text-right pointer-events-auto opacity-80">
                     <h1 className="text-5xl font-display font-black italic text-slate-700 tracking-wide uppercase">
                         {t('SHIP_CLASS_NAME')}
                     </h1>
                     <div className="flex justify-end items-center gap-2 mt-1">
                         <div className="h-px w-24 bg-cyan-900"></div>
                         <span className="text-cyan-800 font-display font-bold text-[14px] tracking-[0.3em]">{t('SHIP_TYPE_NAME')}</span>
                     </div>
                </div>
            </div>

            <div className="flex-1 flex relative z-10 px-8 pb-8 gap-8 pointer-events-none">
                
                {/* Center: Ship Visual (Simplified for layout) */}
                <div className="flex-1 relative flex flex-col items-center justify-center pointer-events-auto">
                     {/* SVG Container */}
                    <div className="relative w-[800px] h-[400px] filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <svg viewBox="0 0 1000 500" className="w-full h-full">
                            <defs>
                                <linearGradient id="hullMetal" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#0f172a" />
                                    <stop offset="50%" stopColor="#1e293b" />
                                    <stop offset="100%" stopColor="#0f172a" />
                                </linearGradient>
                                <linearGradient id="engineGlow" x1="1" y1="0" x2="0" y2="0">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3"/>
                                </pattern>
                            </defs>

                            <g transform="translate(50, 100)">
                                <path d="M 0 120 L -80 100 L -80 160 L 0 140 Z" fill="url(#engineGlow)" className="animate-pulse" />
                                <path d="M 0 180 L -100 160 L -100 220 L 0 200 Z" fill="url(#engineGlow)" className="animate-pulse" style={{animationDelay: '0.1s'}} />
                                <path d="M 0 80 L 250 80 L 280 120 L 250 240 L 0 240 L -20 160 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                                <path d="M 50 80 L 50 240" stroke="#0f172a" strokeWidth="2" />
                                <path d="M 150 80 L 150 240" stroke="#0f172a" strokeWidth="2" />
                                <path d="M 180 80 L 200 40 L 260 40 L 240 80 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                                <rect x="250" y="45" width="2" height="10" fill="#06b6d4" className="animate-pulse" />
                                <path d="M 280 120 L 600 130 L 600 210 L 250 240 Z" fill="url(#hullMetal)" stroke="#334155" strokeWidth="2" />
                                <path d="M 300 140 L 580 145" stroke="#334155" strokeWidth="4" />
                                <path d="M 300 155 L 580 160" stroke="#334155" strokeWidth="4" />
                                <path d="M 300 200 L 500 210" stroke="#334155" strokeWidth="6" strokeDasharray="10,5" />
                                <path d="M 600 110 L 850 140 L 900 170 L 850 200 L 600 230 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                                <path d="M 750 140 L 880 170 L 750 200" fill="none" stroke="#334155" strokeWidth="2" />
                                <circle cx="820" cy="170" r="4" fill="#ef4444" className="animate-pulse" />
                                <path d="M 350 225 L 550 220 L 520 280 L 380 280 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                                <path d="M 400 125 L 420 80 L 500 80 L 480 125 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                                <line x1="450" y1="80" x2="450" y2="20" stroke="#475569" strokeWidth="2" />
                                <circle cx="450" cy="20" r="2" fill="#06b6d4" />
                                <rect x="0" y="40" width="900" height="260" fill="url(#gridPattern)" style={{mixBlendMode: 'overlay'}} />
                            </g>
                        </svg>
                        
                        {/* Installed Modules List Overlay (Left Side of Ship) */}
                        <div className="absolute top-0 left-0 w-64 bg-slate-900/80 border border-slate-700 p-4">
                            <h3 className="text-cyan-400 text-xs font-bold tracking-widest border-b border-slate-700 pb-2 mb-2">{t('SHIP_MODULES')}</h3>
                            {installed.length === 0 ? (
                                <div className="text-slate-500 text-xs italic">{t('NO_MODULES')}</div>
                            ) : (
                                <div className="space-y-2">
                                    {installed.map((modType) => (
                                        <div key={modType} className="flex flex-col gap-1 text-xs text-white bg-cyan-900/30 p-2 border-l-2 border-cyan-500">
                                            <div className="flex items-center gap-2">
                                                <span>✔️</span>
                                                <span className="font-bold">{t(`SHIP_MOD_${modType}_NAME`)}</span>
                                            </div>
                                            {modType === SpaceshipModuleType.ORBITAL_CANNON && (
                                                <button 
                                                    onClick={onOpenUpgrades}
                                                    className="mt-1 w-full text-[10px] bg-cyan-800 hover:bg-cyan-600 text-cyan-100 py-1 font-bold uppercase tracking-wide border border-cyan-600 transition-colors"
                                                >
                                                    {t('SYSTEM_UPGRADE')}
                                                </button>
                                            )}
                                            {modType === SpaceshipModuleType.CARAPACE_ANALYZER && (
                                                <button 
                                                    onClick={onOpenCarapaceGrid}
                                                    className="mt-1 w-full text-[10px] bg-cyan-800 hover:bg-cyan-600 text-cyan-100 py-1 font-bold uppercase tracking-wide border border-cyan-600 transition-colors"
                                                >
                                                    {t('XENO_MATRIX')}
                                                </button>
                                            )}
                                            {modType === SpaceshipModuleType.BASE_REINFORCEMENT && (
                                                <button 
                                                    onClick={onOpenInfrastructure}
                                                    className="mt-1 w-full text-[10px] bg-yellow-800 hover:bg-yellow-600 text-yellow-100 py-1 font-bold uppercase tracking-wide border border-yellow-600 transition-colors"
                                                >
                                                    {t('RESEARCH_BTN')}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* CORE COMPUTER TERMINAL BUTTON */}
                    <div className="mt-8">
                        <button 
                            onClick={onOpenComputer}
                            className="group relative flex flex-col items-center justify-center w-64 h-24 bg-slate-900 border-2 border-slate-700 hover:border-green-500 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00ff00_2px,#00ff00_4px)] opacity-5 pointer-events-none"></div>
                            <div className="text-green-500 font-mono text-xs tracking-[0.2em] mb-1 group-hover:text-green-400">{t('CORE_DB')}</div>
                            <div className="text-white font-display font-black text-2xl tracking-wide group-hover:text-green-300">{t('ACCESS_COMPUTER')}</div>
                            <div className="absolute bottom-0 w-full h-1 bg-slate-800 group-hover:bg-green-500 transition-colors"></div>
                        </button>
                    </div>
                </div>

                {/* Right Panel: Module Shop */}
                <div className="w-80 bg-slate-900/90 border-l border-cyan-900/50 backdrop-blur-md pointer-events-auto flex flex-col p-6">
                    <h2 className="text-xl font-display font-black text-white mb-1 uppercase tracking-wide">{t('ENGINEERING')}</h2>
                    <p className="text-xs text-cyan-500 mb-6 font-mono tracking-widest">{t('MODULE_FAB')}</p>
                    
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {availableModules.length === 0 && (
                            <div className="text-slate-500 text-center text-sm py-10">
                                {t('ALL_INSTALLED')}
                            </div>
                        )}
                        {availableModules.map(modType => {
                            const mod = SPACESHIP_MODULES[modType];
                            const canAfford = state.player.score >= mod.cost;
                            return (
                                <div key={modType} className="border border-slate-700 bg-slate-800/50 p-4 hover:border-cyan-500 transition-colors group">
                                    <div className="text-cyan-100 font-display font-bold text-sm mb-1">{t(`SHIP_MOD_${modType}_NAME`)}</div>
                                    <div className="text-slate-400 text-xs mb-3 leading-relaxed">{t(`SHIP_MOD_${modType}_DESC`)}</div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-yellow-400 font-mono text-sm font-bold">{mod.cost}</div>
                                        <button 
                                            onClick={() => onPurchaseModule(modType)}
                                            disabled={!canAfford}
                                            className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-all
                                                ${canAfford 
                                                    ? 'bg-cyan-600 text-white hover:bg-cyan-400' 
                                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                            `}
                                        >
                                            {canAfford ? t('INSTALL_BTN') : t('NO_FUNDS')}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-8 z-20 pointer-events-auto">
                <button 
                    onClick={onClose}
                    className="group flex items-center gap-3 px-6 py-3 bg-slate-900/80 border border-slate-700 hover:border-cyan-500 transition-all text-slate-400 hover:text-white"
                >
                    <span className="text-xl">«</span>
                    <span className="font-mono text-xs tracking-widest uppercase">{t('RETURN_SECTOR_BTN')}</span>
                </button>
            </div>
            
            <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
                <div className="text-right text-[10px] text-slate-600 font-mono">
                    <div>{t('VESSEL_ONLINE')}</div>
                    <div>{t('HULL_INTEGRITY')}: 100%</div>
                </div>
            </div>

        </div>
    )
}