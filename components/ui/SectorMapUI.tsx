import React, { useState } from 'react';
import { GameState } from '../../types';
import { CloseButton } from './Shared';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { AtmosphereAnalysisModal } from './AtmosphereModal';

interface SectorMapUIProps {
    state: GameState;
    onSaveGame: () => void;
    onOpenSpaceship: () => void;
    onDeployPlanet: (id: string) => void;
    onDeselectPlanet: () => void;
    onCheat: () => void;
    t: (key: string) => string;
}

export const SectorMapUI: React.FC<SectorMapUIProps> = ({ 
    state, 
    onSaveGame, 
    onOpenSpaceship, 
    onDeployPlanet, 
    onDeselectPlanet,
    onCheat,
    t
}) => {
    const planet = state.planets.find(p => p.id === state.selectedPlanetId);
    const [viewingAtmosphere, setViewingAtmosphere] = useState(false);

    // Calculate drop cost
    let dropCost = 0;
    let canAfford = false;
    if (planet) {
        dropCost = Math.floor(state.player.score * (planet.landingDifficulty / 100));
        canAfford = state.player.score >= dropCost; // Should always be true since it's % based, but safe to check
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

            {/* Current Scraps Display */}
            <div className="absolute bottom-8 left-64 bg-slate-900/80 p-4 border border-blue-900/50">
                <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">{t('AVAILABLE_FUNDS')}</div>
                <div className="text-2xl text-white font-mono">{Math.floor(state.player.score)} SCRAPS</div>
            </div>

            {/* Full Screen Atmosphere Modal */}
            {viewingAtmosphere && planet && (
                <AtmosphereAnalysisModal planet={planet} onClose={() => setViewingAtmosphere(false)} t={t} />
            )}

            {planet && (
                <div className="absolute top-1/2 right-12 -translate-y-1/2 w-96 bg-gray-900/90 border border-blue-500 p-8 pointer-events-auto backdrop-blur-md">
                    <CloseButton onClick={onDeselectPlanet} colorClass="border-blue-500 text-blue-500 hover:text-white hover:bg-blue-900/50" />
                    
                    <PlanetInfoPanel 
                        planet={planet} 
                        t={t} 
                        onShowDetail={() => setViewingAtmosphere(true)}
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

                    <button 
                        onClick={() => onDeployPlanet(planet.id)}
                        disabled={!canAfford}
                        className={`w-full mt-2 py-4 font-bold tracking-[0.2em] transition-all
                            ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {canAfford ? t('INITIATE_DROP') : t('INSUFFICIENT_FUNDS')}
                    </button>
                </div>
            )}
        </div>
    )
}