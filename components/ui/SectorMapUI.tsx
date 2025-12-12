
import React, { useState, useRef, useEffect } from 'react';
import { GalaxyConfig, StatId } from '../../types';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { PlanetDetailScreen } from './PlanetDetailScreen';
import { GalaxyIndexModal } from './GalaxyIndexModal';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';
import { Icons } from './Icons';
import { CyberButton } from './atoms/CyberButton';
import { DS } from '../../theme/designSystem';

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
                        <h2 className={`${DS.text.label} text-cyan-500`}>{t('PLANET_ANALYSIS')}</h2>
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
                <div className="flex flex-col gap-2 pointer-events-auto items-end w-48">
                    <CyberButton 
                        onClick={() => engine.saveGame()}
                        variant="blue"
                        fullWidth
                        className="py-1 px-4 text-[10px]"
                        label={t('SAVE_STATE')}
                        icon={<div className="w-4 h-4"><svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor"><Icons.Save /></svg></div>}
                    />
                    <CyberButton 
                        onClick={() => engine.returnToMainMenu()}
                        variant="slate"
                        fullWidth
                        className="py-1 px-4 text-[10px]"
                        label={t('RETURN_MAIN_MENU')}
                    />
                </div>
            </div>

            {/* --- MIDDLE: INTERACTION LAYER (Planet Panel) --- */}
            <div className="flex-1 relative z-10 pointer-events-none flex flex-col justify-center items-end pr-12 min-h-0">
                {planet && !viewingDetail && (
                    <div className="pointer-events-auto animate-slideInRight w-[400px] flex flex-col gap-2">
                        
                        {/* 1. The Info Panel Card */}
                        <div className="relative">
                            <button 
                                onClick={() => engine.selectPlanet(null)} 
                                className="absolute -top-3 -right-3 z-50 bg-black text-slate-500 hover:text-white border border-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-lg hover:border-white transition-all"
                            >
                                ✕
                            </button>
                            <PlanetInfoPanel 
                                planet={planet} 
                                spaceship={state.spaceship}
                                onShowDetail={() => setViewingDetail(true)}
                            />
                        </div>

                        {/* 2. Docked Action Bar (Glass Style) */}
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-2xl">
                            
                            {/* Cost Indicator */}
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('DROP_COST')}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-xl font-mono font-bold tracking-tighter ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>
                                        {dropCost}
                                    </span>
                                    <span className="text-[9px] text-slate-500">BIO</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                {planet.completed ? (
                                    <button
                                        onClick={() => engine.enterPlanetConstruction()}
                                        className="col-span-2 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-600/50 text-yellow-100 py-3 rounded font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                    >
                                        <div className="w-4 h-4"><svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2"><Icons.Crane /></svg></div>
                                        {t('PC_BTN')}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleDeploy(planet.id)}
                                        disabled={!canAfford}
                                        className={`col-span-2 py-4 rounded font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg
                                            ${canAfford 
                                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30' 
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                                        `}
                                    >
                                        {canAfford ? (
                                            <>
                                                <div className="w-4 h-4 animate-bounce"><svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2"><Icons.DropPod /></svg></div>
                                                {t('INITIATE_DROP')}
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-4 h-4"><svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor"><Icons.Lock /></svg></div>
                                                {t('INSUFFICIENT_FUNDS')}
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => setViewingDetail(true)}
                                    className="col-span-2 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-200 py-2 rounded font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:border-cyan-400"
                                >
                                    <div className="w-3 h-3"><svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2"><Icons.Analysis /></svg></div>
                                    {t('FULL_ANALYSIS_BTN')}
                                </button>
                            </div>
                        </div>

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
                        onClick={() => setShowIndex(true)}
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
