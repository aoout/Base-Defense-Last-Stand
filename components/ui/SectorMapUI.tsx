
import React, { useState } from 'react';
import { GalaxyConfig, StatId, AppMode } from '../../types';
import { PlanetDetailScreen } from './PlanetDetailScreen';
import { GalaxyIndexModal } from './GalaxyIndexModal';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { SectorTopBar } from './sector/SectorTopBar';
import { SectorBottomDeck } from './sector/SectorBottomDeck';
import { SectorActionPanel } from './sector/SectorActionPanel';

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

    const handleScan = (config: GalaxyConfig) => {
        engine.galaxyManager.scanSector(config);
    };

    const handleDeploy = (id: string) => {
        engine.galaxyManager.deployToPlanet(id);
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
            <SectorTopBar 
                sectorName={state.sectorName || t('SECTOR_NAME')} 
                onSave={() => engine.saveManager.saveGame()} 
                onExit={() => engine.sessionManager.returnToMainMenu()}
            />

            {/* --- MIDDLE: INTERACTION LAYER (Planet Panel) --- */}
            <div className="flex-1 relative z-10 pointer-events-none flex flex-col justify-center items-end pr-12 min-h-0">
                {planet && !viewingDetail && (
                    <SectorActionPanel 
                        planet={planet}
                        spaceship={state.spaceship}
                        playerScore={state.player.score}
                        dropCost={dropCost}
                        onClose={() => engine.selectPlanet(null)}
                        onShowDetail={() => setViewingDetail(true)}
                        onDeploy={handleDeploy}
                        onConstruct={() => engine.sessionManager.setMode(AppMode.PLANET_CONSTRUCTION)}
                    />
                )}
            </div>

            {/* --- BOTTOM: CONTROL DECK --- */}
            <SectorBottomDeck 
                onOpenShip={() => engine.sessionManager.setMode(AppMode.SPACESHIP_VIEW)} 
                onOpenIndex={() => setShowIndex(true)} 
            />

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
                    onOpenConstruction={() => engine.sessionManager.setMode(AppMode.PLANET_CONSTRUCTION)}
                />
            )}

        </div>
    );
};
