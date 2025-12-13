
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlanetBuildingType, AppMode } from '../../types';
import { ModuleWindow } from './ModuleWindow';
import { drawPlanetSprite } from '../../utils/renderers';
import { GAS_INFO } from '../../data/world';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CanvasView } from './common/CanvasView';

export const PlanetConstructionUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const planet = state.planets.find(p => p.id === state.selectedPlanetId);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

    const handleConstruct = (planetId: string, type: PlanetBuildingType, slotIndex: number) => {
        engine.galaxyManager.constructBuilding(planetId, type, slotIndex);
    }

    const handleClose = () => {
        engine.sessionManager.setMode(AppMode.EXPLORATION_MAP);
    }

    const handleDraw = useCallback((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        if (!planet) return;
        drawPlanetSprite(ctx, planet, w/2, h/2, 120, time, false);
    }, [planet]);

    if (!planet) return null;

    // Radius scale: 1px = 100km. 1000km = 10px.
    const radiusKm = Math.floor(planet.radius * 100);
    const totalSlots = Math.max(1, Math.floor(radiusKm / 1000));
    
    // Buildings
    const buildings = planet.buildings || [];

    // Retrieve Centralized Yield Estimates (Refactored to remove logic from View)
    const estimates = engine.galaxyManager.estimatePlanetYields(planet);
    const oxygenGas = planet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
    const o2 = oxygenGas ? oxygenGas.percentage : 0;

    const renderBuildingCard = (type: PlanetBuildingType, cost: number, yieldVal: number) => {
        const canAfford = state.player.score >= cost;
        const isBiomass = type === PlanetBuildingType.BIOMASS_EXTRACTOR;
        
        return (
            <div className={`p-4 border ${isBiomass ? 'border-green-500/50 bg-green-900/10' : 'border-blue-500/50 bg-blue-900/10'} mb-4 relative overflow-hidden group rounded`}>
                <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-sm font-bold ${isBiomass ? 'text-green-400' : 'text-blue-400'}`}>{t(isBiomass ? 'PC_BIOMASS' : 'PC_OXYGEN')}</h4>
                    <div className="text-xs text-white font-mono">{cost} SCRAPS</div>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{t(isBiomass ? 'PC_BIOMASS_DESC' : 'PC_OXYGEN_DESC')}</p>
                
                <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2 mb-2">
                    <span className="text-slate-500">{t('PC_YIELD')}</span>
                    <span className="text-yellow-400 font-mono font-bold">+{yieldVal} / {t('PC_PER_MISSION')}</span>
                </div>

                <button 
                    onClick={() => {
                        if (selectedSlot !== null && canAfford) {
                            handleConstruct(planet.id, type, selectedSlot);
                            setSelectedSlot(null);
                        }
                    }}
                    disabled={!canAfford || selectedSlot === null}
                    className={`w-full py-2 text-[10px] font-bold tracking-widest uppercase transition-all rounded
                        ${canAfford && selectedSlot !== null
                            ? (isBiomass ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                >
                    {selectedSlot === null ? t('PC_SLOT_LOCKED') : t('PC_BUILD')}
                </button>
            </div>
        )
    }

    return (
        <ModuleWindow
            title={t('PC_TITLE')}
            subtitle={t('PC_SUB')}
            theme="blue"
            onClose={handleClose}
            maxWidth="max-w-[1350px]"
        >
            <div className="flex-1 flex gap-0 h-full w-full">
                {/* Left Panel: Construction Shop */}
                <div className="w-80 bg-black/40 border-r border-blue-900/30 p-6 flex flex-col overflow-y-auto rounded-l-lg">
                    {/* Planet Stats */}
                    <div className="mb-8 space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>{t('GENE_MODIFIER')}</span>
                            <span className="text-white">x{planet.geneStrength.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>{t('GAS_OXYGEN_NAME')}</span>
                            <span className="text-white">{(o2 * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>{t('AVAILABLE_FUNDS')}</span>
                            <span className="text-yellow-400">{Math.floor(state.player.score)}</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        {renderBuildingCard(PlanetBuildingType.BIOMASS_EXTRACTOR, 5500, estimates.biomass)}
                        {renderBuildingCard(PlanetBuildingType.OXYGEN_EXTRACTOR, 7000, estimates.oxygen)}
                    </div>
                </div>

                {/* Center: Planet Viz */}
                <div className="flex-1 relative flex items-center justify-center bg-slate-950/50">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_70%)]"></div>
                    <CanvasView width={500} height={500} className="relative z-10" draw={handleDraw} />
                    
                    <div className="absolute bottom-8 left-8 text-xs text-blue-500 font-mono">
                        <div>RADIUS: {radiusKm} KM</div>
                        <div>SLOTS: {buildings.length} / {totalSlots}</div>
                    </div>
                </div>

                {/* Right Panel: Slots */}
                <div className="w-80 bg-black/40 border-l border-blue-900/30 p-6 overflow-y-auto rounded-r-lg">
                    <h3 className="text-white font-bold tracking-widest text-sm mb-6 border-b border-blue-900/50 pb-2">{t('PC_SLOTS_AVAILABLE')}</h3>
                    
                    <div className="space-y-3">
                        {Array.from({length: totalSlots}).map((_, i) => {
                            const building = buildings.find(b => b.slotIndex === i);
                            const isSelected = selectedSlot === i;
                            
                            return (
                                <div 
                                    key={i}
                                    onClick={() => !building && setSelectedSlot(i)}
                                    className={`
                                        p-4 border rounded transition-all cursor-pointer relative group
                                        ${building 
                                            ? 'bg-slate-800 border-slate-600' 
                                            : isSelected 
                                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                                : 'bg-black/20 border-slate-700 hover:border-slate-500'}
                                    `}
                                >
                                    <div className="absolute top-2 left-2 text-[10px] text-slate-600 font-bold">SLOT {i+1}</div>
                                    
                                    {building ? (
                                        <div className="flex flex-col items-end mt-4">
                                            <div className={`text-sm font-bold ${building.type === PlanetBuildingType.BIOMASS_EXTRACTOR ? 'text-green-400' : 'text-blue-400'}`}>
                                                {t(building.type === PlanetBuildingType.BIOMASS_EXTRACTOR ? 'PC_BIOMASS' : 'PC_OXYGEN')}
                                            </div>
                                            <div className="text-[10px] text-slate-400">ONLINE</div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end mt-4">
                                            <div className={`text-xs ${isSelected ? 'text-blue-500' : 'text-slate-600'}`}>{t('PC_SLOT_EMPTY')}</div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </ModuleWindow>
    );
};
