
import React, { useState, useRef, useEffect } from 'react';
import { GalaxyConfig, GameMode, StatId } from '../../types';
import { CloseButton } from './Shared';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { PlanetDetailScreen } from './PlanetDetailScreen';
import { GalaxyIndexModal } from './GalaxyIndexModal';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';

// --- VECTOR ASSETS ---
const NavIcons = {
    Ship: () => <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />,
    Galaxy: () => <g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></g>,
    Save: () => <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>,
    Radar: () => <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c4.41 0 8 3.59 8 8h-2c0-3.31-2.69-6-6-6V4z"/>
};

// --- SUB-COMPONENTS ---

const TechBorder: React.FC<{ children: React.ReactNode, className?: string, color?: string }> = ({ children, className, color = "border-cyan-500" }) => (
    <div className={`relative border-2 ${color} bg-slate-950/80 backdrop-blur-md ${className}`}>
        {/* Corner Accents */}
        <div className={`absolute -top-1 -left-1 w-2 h-2 bg-white`}></div>
        <div className={`absolute -top-1 -right-1 w-2 h-2 bg-white`}></div>
        <div className={`absolute -bottom-1 -left-1 w-2 h-2 bg-white`}></div>
        <div className={`absolute -bottom-1 -right-1 w-2 h-2 bg-white`}></div>
        {children}
    </div>
);

const DecorativeReticle: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-dashed border-cyan-500/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-500"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-500"></div>
        <div className="absolute bottom-24 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-500"></div>
        <div className="absolute bottom-24 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-500"></div>
    </div>
);

export const SectorMapUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const planet = state.planets.find(p => p.id === state.selectedPlanetId);
    const [viewingDetail, setViewingDetail] = useState(false);
    const [showIndex, setShowIndex] = useState(false);
    
    // Transient Update for Funds
    const fundsRef = useRef<HTMLDivElement>(null);
    useGameLoop(() => {
        if (fundsRef.current) {
            fundsRef.current.innerText = `${Math.floor(engine.state.player.score)}`;
        }
    });

    const handleScan = (config: GalaxyConfig) => {
        const event = new CustomEvent('game-action', { detail: { type: 'SCAN_SECTOR', config } });
        window.dispatchEvent(event);
    };

    const handleDeploy = (id: string) => {
        engine.deployToPlanet(id);
    };

    // Calculate drop cost
    let dropCost = 0;
    let canAfford = false;
    if (planet) {
        const reduction = engine.statManager.get(StatId.DROP_COST_REDUCTION, 0);
        const basePct = planet.landingDifficulty / 100;
        const effectivePct = basePct * (1 - reduction);
        dropCost = Math.floor(state.player.score * effectivePct);
        canAfford = state.player.score >= dropCost; 
    }

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
            
            {/* Global Overlay Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-0"></div>
            <DecorativeReticle />

            {/* --- TOP: TELEMETRY BAR --- */}
            <div className="h-24 w-full bg-gradient-to-b from-slate-950 via-slate-900/90 to-transparent flex items-start justify-between px-8 pt-6 relative z-20 shrink-0">
                
                {/* Left: Sector Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div>
                        <h2 className="text-cyan-500 font-mono text-xs tracking-[0.3em] uppercase">{t('PLANET_ANALYSIS')}</h2>
                    </div>
                    <h1 className="text-5xl font-display font-black text-white tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        {state.sectorName || t('SECTOR_NAME')}
                    </h1>
                </div>

                {/* Center: Deco Data */}
                <div className="flex gap-8 mt-2 opacity-50">
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
                <div className="flex flex-col gap-2 pointer-events-auto items-end">
                    <button 
                        onClick={() => engine.saveGame()}
                        className="group flex items-center gap-2 px-4 py-2 border border-blue-900/50 bg-blue-950/30 hover:bg-blue-900/50 hover:border-blue-500 transition-all rounded w-full justify-center"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-blue-400 group-hover:text-white">
                            <NavIcons.Save />
                        </svg>
                        <span className="text-[10px] font-bold text-blue-400 group-hover:text-white tracking-widest uppercase">{t('SAVE_STATE')}</span>
                    </button>
                    <button 
                        onClick={() => engine.returnToMainMenu()}
                        className="group flex items-center gap-2 px-4 py-1 border border-slate-800 bg-black/40 hover:bg-slate-800 hover:border-slate-500 transition-all rounded w-full justify-center"
                    >
                        <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-300 tracking-widest uppercase">{t('RETURN_MAIN_MENU')}</span>
                    </button>
                </div>
            </div>

            {/* --- MIDDLE: INTERACTION LAYER (Planet Panel) --- */}
            {/* Using flex-1 to occupy remaining space, ensuring the panel doesn't overlap header/footer */}
            <div className="flex-1 relative z-10 pointer-events-none flex flex-col justify-center items-end pr-8 min-h-0">
                {planet && !viewingDetail && (
                    <div className="pointer-events-auto animate-slideInRight max-h-full flex flex-col justify-center py-4">
                        <TechBorder className="p-6 flex flex-col gap-4 shadow-2xl w-[450px] overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent bg-slate-950/95">
                            <div className="flex justify-between items-start border-b border-cyan-900/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-cyan-400 animate-spin-slow text-2xl">⌖</div>
                                    <div>
                                        <div className="text-[10px] text-cyan-600 font-bold tracking-widest">TARGET LOCKED</div>
                                        <div className="text-2xl font-black text-white uppercase">{planet.name}</div>
                                    </div>
                                </div>
                                <button onClick={() => engine.selectPlanet(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                            </div>

                            <PlanetInfoPanel 
                                planet={planet} 
                                spaceship={state.spaceship}
                                onShowDetail={() => setViewingDetail(true)}
                            />

                            {/* Tactical Footer inside Panel */}
                            <div className="bg-black/40 p-4 border border-cyan-900/30 mt-2 shrink-0">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('DROP_COST')}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>{dropCost}</span>
                                        <span className="text-[9px] text-slate-500">BIO</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {planet.completed ? (
                                        <button 
                                            onClick={() => engine.enterPlanetConstruction()}
                                            className="col-span-2 py-3 bg-yellow-600/20 border border-yellow-500 hover:bg-yellow-600/40 text-yellow-400 font-black tracking-widest text-xs uppercase transition-all"
                                        >
                                            {t('PC_BTN')}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleDeploy(planet.id)}
                                            disabled={!canAfford}
                                            className={`
                                                col-span-2 py-4 relative overflow-hidden group border transition-all
                                                ${canAfford 
                                                    ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}
                                            `}
                                        >
                                            <div className="relative z-10 flex justify-center items-center gap-2">
                                                {canAfford && <span className="animate-pulse">⚠</span>}
                                                <span className="font-black tracking-[0.2em] uppercase text-sm">{canAfford ? t('INITIATE_DROP') : t('INSUFFICIENT_FUNDS')}</span>
                                            </div>
                                            {canAfford && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform skew-x-12 duration-300"></div>}
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setViewingDetail(true)}
                                        className="col-span-2 py-2 bg-slate-900 border border-cyan-800 text-cyan-500 hover:text-white hover:border-cyan-400 text-[10px] font-bold tracking-widest uppercase transition-all"
                                    >
                                        {t('FULL_ANALYSIS_BTN')}
                                    </button>
                                </div>
                            </div>
                        </TechBorder>
                    </div>
                )}
            </div>

            {/* --- BOTTOM: CONTROL DECK --- */}
            <div className="h-24 bg-slate-950 border-t-4 border-slate-900 flex relative z-20 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] pointer-events-auto shrink-0">
                
                {/* 1. SHIP SYSTEMS (Left) */}
                <div className="flex-1 flex items-center pl-8 border-r border-slate-800 relative group overflow-hidden">
                    <button 
                        onClick={() => engine.enterSpaceshipView()}
                        className="flex items-center gap-6 w-full h-full hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="w-16 h-16 border-2 border-cyan-500/50 rounded flex items-center justify-center bg-cyan-950/30 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_cyan] transition-all relative overflow-hidden">
                            <svg viewBox="0 0 24 24" className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" fill="currentColor">
                                <NavIcons.Ship />
                            </svg>
                            <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </div>
                        <div>
                            <div className="text-[10px] text-cyan-600 font-mono tracking-widest uppercase mb-1">COMMAND DECK</div>
                            <div className="text-2xl font-display font-black text-white tracking-wide group-hover:text-cyan-100">{t('GAME_TITLE')} {t('GAME_SUB')}</div>
                        </div>
                    </button>
                </div>

                {/* 2. NAVIGATION (Center) */}
                <div className="w-64 flex items-center justify-center border-r border-slate-800 relative bg-black">
                    <button 
                        onClick={() => setShowIndex(true)}
                        className="group relative w-full h-full flex flex-col items-center justify-center hover:bg-cyan-900/20 transition-colors"
                    >
                        <div className="absolute inset-0 border-x border-cyan-900/30 group-hover:border-cyan-500/50 transition-colors"></div>
                        <div className="text-4xl mb-1 text-cyan-600 group-hover:text-white transition-colors group-hover:scale-110 duration-300">
                            ⟡
                        </div>
                        <div className="text-[10px] font-black tracking-[0.3em] text-cyan-500 group-hover:text-cyan-300 uppercase">
                            {t('GALAXY_INDEX_TITLE')}
                        </div>
                        {/* Pulse Ring */}
                        <div className="absolute w-32 h-32 border border-cyan-500/0 rounded-full group-hover:border-cyan-500/20 group-hover:scale-110 transition-all duration-500"></div>
                    </button>
                </div>

                {/* 3. RESOURCES (Right) */}
                <div className="flex-1 flex items-center justify-end pr-8 bg-slate-900/50">
                    <div className="text-right">
                        <div className="text-[10px] text-yellow-600 font-bold tracking-widest uppercase mb-1">{t('AVAILABLE_FUNDS')}</div>
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

            {/* --- MODALS --- */}
            
            {showIndex && (
                <GalaxyIndexModal 
                    onClose={() => setShowIndex(false)}
                    onScan={handleScan}
                />
            )}

            {viewingDetail && planet && (
                <PlanetDetailScreen 
                    planet={planet} 
                    currentScraps={state.player.score}
                    dropCost={dropCost}
                    canAfford={canAfford}
                    onClose={() => setViewingDetail(false)} 
                    onDeploy={() => handleDeploy(planet.id)}
                    onOpenConstruction={() => engine.enterPlanetConstruction()}
                />
            )}

        </div>
    );
};
