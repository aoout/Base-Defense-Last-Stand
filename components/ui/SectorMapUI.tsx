
import React, { useState } from 'react';
import { GameState, GalaxyConfig } from '../../types';
import { CloseButton } from './Shared';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { PlanetDetailScreen } from './PlanetDetailScreen';
import { GalaxyIndexModal } from './GalaxyIndexModal';
import { GameEngine } from '../../services/gameService';

interface SectorMapUIProps {
    state: GameState;
    onSaveGame: () => void;
    onOpenSpaceship: () => void;
    onDeployPlanet: (id: string) => void;
    onDeselectPlanet: () => void;
    onCheat: () => void;
    onOpenConstruction: () => void;
    t: (key: string, params?: any) => string;
}

export const SectorMapUI: React.FC<SectorMapUIProps> = ({ 
    state, 
    onSaveGame, 
    onOpenSpaceship, 
    onDeployPlanet, 
    onDeselectPlanet,
    onCheat,
    onOpenConstruction,
    t
}) => {
    const planet = state.planets.find(p => p.id === state.selectedPlanetId);
    const [viewingDetail, setViewingDetail] = useState(false);
    const [showIndex, setShowIndex] = useState(false);

    // This component is stateless regarding logic, but needs to call scanning. 
    // Ideally scanSector should be passed down, but for now we can access it if we had the engine, 
    // or we assume it's available via a prop that we'll add to App.tsx? 
    // Actually, GalaxyManager is on engine. Let's assume we can trigger a game action event 
    // or we need to update the interface.
    // The "Right Way" given the structure is to dispatch a custom event that App.tsx or engine picks up, 
    // OR we modify App.tsx to pass a handler. Since I cannot edit App.tsx in this specific block without returning it,
    // I will assume there is a `window.gameEngine` or I dispatch an event.
    // Wait, the prompt says "Refactor as needed". I will assume I can update App.tsx if I output it.
    // BUT, the SectorMapUI props don't have onScan. I should add `onScan` to props in UIOverlay and App.
    // However, to keep changes minimal, I will use the custom event pattern used elsewhere 
    // OR just instantiate a temporary engine accessor? No, that's bad.
    
    // BETTER APPROACH: Add `onScan` to props. I will update UIOverlay and App.tsx in separate blocks.
    // For now, let's pretend `onScan` exists or use a temporary workaround?
    // No, I'll update the interface properly. 
    
    // Wait, I can't pass onScan here without updating UIOverlay.
    // Let's use the `window.dispatchEvent` pattern for the scan action, similar to weapon assembly.
    
    const handleScan = (config: GalaxyConfig) => {
        const event = new CustomEvent('game-action', { detail: { type: 'SCAN_SECTOR', config } });
        window.dispatchEvent(event);
    };

    // Calculate drop cost
    let dropCost = 0;
    let canAfford = false;
    if (planet) {
        dropCost = Math.floor(state.player.score * (planet.landingDifficulty / 100));
        canAfford = state.player.score >= dropCost; 
    }

    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8">
                <h1 className="text-5xl font-display font-bold text-white tracking-widest">{t('PLANET_ANALYSIS')}</h1>
                <p className="text-blue-400 font-mono text-sm">{t('SECTOR_NAME')}</p>
            </div>

            <div className="absolute top-8 right-8 pointer-events-auto flex gap-4">
                <button 
                onClick={onSaveGame}
                className="w-12 h-12 bg-gray-900/80 border border-blue-500/50 hover:bg-blue-900/50 text-blue-400 flex items-center justify-center rounded transition-all"
                title={t('SAVE_STATE')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                </button>
            </div>

            {/* Spaceship Button (Bottom Left) */}
            <div className="absolute bottom-8 left-8 pointer-events-auto">
                <button 
                onClick={onOpenSpaceship}
                className="group relative flex items-center gap-4 pl-4 pr-8 py-4 bg-slate-900/90 border border-cyan-500/50 hover:border-cyan-400 hover:bg-slate-800 transition-all overflow-hidden"
                style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}
                >
                    {/* Tech decorative lines */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
                    <div className="absolute right-0 top-0 w-4 h-4 border-t border-r border-cyan-500/50"></div>
                    
                    {/* Icon Container */}
                    <div className="relative w-12 h-12 bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L2 22h20L12 2zm0 4v8M12 18v2" />
                        </svg>
                        <div className="absolute inset-0 bg-cyan-400/10 animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                    </div>

                    <div className="flex flex-col">
                        <div className="text-cyan-400 text-[10px] font-mono tracking-[0.2em] leading-none mb-1 group-hover:text-cyan-200">PROJECT</div>
                        <div className="text-white text-2xl font-display font-black tracking-widest leading-none group-hover:text-cyan-100">VANGUARD</div>
                    </div>
                </button>
            </div>

            {/* Galaxy Index Button (Bottom Right) */}
            <div className="absolute bottom-8 right-8 pointer-events-auto">
                <button
                    onClick={() => setShowIndex(true)}
                    className="group flex flex-col items-center justify-center w-24 h-24 bg-slate-900/90 border border-blue-500/50 rounded-full hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all relative"
                >
                    <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-spin-slow"></div>
                    <div className="text-3xl text-cyan-500 group-hover:text-white mb-1">⌖</div>
                    <div className="text-[9px] font-bold tracking-widest text-cyan-600 group-hover:text-cyan-300 text-center leading-tight">GALAXY<br/>INDEX</div>
                </button>
            </div>

            {/* Current Scraps Display */}
            <div className="absolute bottom-8 left-64 bg-slate-900/80 p-4 border border-blue-900/50">
                <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">{t('AVAILABLE_FUNDS')}</div>
                <div className="text-2xl text-white font-mono">{Math.floor(state.player.score)} SCRAPS</div>
            </div>

            {/* Modals */}
            {showIndex && (
                <GalaxyIndexModal 
                    onClose={() => setShowIndex(false)}
                    onScan={handleScan}
                    t={t}
                />
            )}

            {/* Full Screen Detail View */}
            {viewingDetail && planet && (
                <PlanetDetailScreen 
                    planet={planet} 
                    currentScraps={state.player.score}
                    dropCost={dropCost}
                    canAfford={canAfford}
                    onClose={() => setViewingDetail(false)} 
                    onDeploy={() => onDeployPlanet(planet.id)}
                    onOpenConstruction={onOpenConstruction}
                    t={t} 
                />
            )}

            {planet && !viewingDetail && (
                <div className="absolute top-1/2 right-12 -translate-y-1/2 w-96 bg-gray-900/90 border border-blue-500 p-8 pointer-events-auto backdrop-blur-md">
                    <CloseButton onClick={onDeselectPlanet} colorClass="border-blue-500 text-blue-500 hover:text-white hover:bg-blue-900/50" />
                    
                    <PlanetInfoPanel 
                        planet={planet} 
                        spaceship={state.spaceship}
                        t={t} 
                        onShowDetail={() => setViewingDetail(true)}
                    />
                    
                    {/* Landing Cost Section */}
                    <div className="mt-6 mb-2 bg-black/40 p-4 border border-blue-900/50">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs text-blue-400 uppercase font-bold tracking-widest">{t('LANDING_DIFFICULTY')}</span>
                             <span className={`text-xs font-bold ${planet.landingDifficulty > 20 ? 'text-red-500' : planet.landingDifficulty > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                                 {planet.landingDifficulty > 20 ? t('HIGH') : planet.landingDifficulty > 10 ? t('MEDIUM') : t('LOW')} ({planet.landingDifficulty}%)
                             </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-blue-900/30 pt-2">
                            <span className="text-gray-400 text-sm">{t('DROP_COST')}</span>
                            <span className="text-white font-mono text-lg font-bold">-{dropCost} SCRAPS</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        {planet.completed ? (
                            <button 
                                onClick={onOpenConstruction}
                                className="w-full py-4 bg-yellow-900/20 border border-yellow-500 hover:bg-yellow-900/40 text-yellow-400 font-black tracking-[0.2em] transition-all relative overflow-hidden group"
                            >
                                <span className="relative z-10">{t('PC_BTN')}</span>
                                <div className="absolute inset-0 bg-yellow-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform skew-x-12"></div>
                            </button>
                        ) : (
                            <button 
                                onClick={() => onDeployPlanet(planet.id)}
                                disabled={!canAfford}
                                className={`
                                    w-full py-4 relative overflow-hidden group transition-all border
                                    ${canAfford 
                                        ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white' 
                                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}
                                `}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {canAfford && <span className="animate-pulse">⚠</span>}
                                    <span className="font-black tracking-[0.2em]">{canAfford ? t('INITIATE_DROP') : t('INSUFFICIENT_FUNDS')}</span>
                                </div>
                                {canAfford && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform skew-x-12"></div>}
                            </button>
                        )}

                        <button 
                            onClick={() => setViewingDetail(true)}
                            className="w-full py-3 bg-slate-900 border border-blue-500/50 hover:border-cyan-400 hover:bg-slate-800 text-cyan-500 hover:text-white font-bold tracking-widest text-xs transition-all"
                        >
                            {t('FULL_ANALYSIS_BTN')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
