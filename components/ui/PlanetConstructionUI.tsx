
import React, { useRef, useEffect, useState } from 'react';
import { GameState, PlanetBuildingType, Planet } from '../../types';
import { CloseButton } from './Shared';
import { drawPlanetSprite } from '../../utils/renderers';
import { GAS_INFO } from '../../data/world';

interface PlanetConstructionUIProps {
    state: GameState;
    onClose: () => void;
    onConstruct: (planetId: string, type: PlanetBuildingType, slotIndex: number) => void;
    t: (key: string, params?: any) => string;
}

export const PlanetConstructionUI: React.FC<PlanetConstructionUIProps> = ({ state, onClose, onConstruct, t }) => {
    const planet = state.planets.find(p => p.id === state.selectedPlanetId);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

    // Planet Animation
    useEffect(() => {
        if (!planet) return;
        const renderPreview = (time: number) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            const w = canvasRef.current.width; 
            const h = canvasRef.current.height; 
            ctx.clearRect(0, 0, w, h); 
            drawPlanetSprite(ctx, planet, w/2, h/2, 120, time, false);
            requestRef.current = requestAnimationFrame(renderPreview);
        };
        requestRef.current = requestAnimationFrame(renderPreview);
        return () => cancelAnimationFrame(requestRef.current);
    }, [planet]);

    if (!planet) return null;

    // Radius scale: 1px = 100km. 1000km = 10px.
    const radiusKm = Math.floor(planet.radius * 100);
    const totalSlots = Math.max(1, Math.floor(radiusKm / 1000));
    
    // Buildings
    const buildings = planet.buildings || [];

    // Yield Calculations
    const o2Gas = planet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
    const o2 = o2Gas ? o2Gas.percentage : 0;
    
    const biomassYield = Math.floor(800 * (1 + planet.geneStrength));
    const oxygenYield = Math.floor(1500 * (1 + o2));

    const renderBuildingCard = (type: PlanetBuildingType, cost: number, yieldVal: number) => {
        const canAfford = state.player.score >= cost;
        const isBiomass = type === PlanetBuildingType.BIOMASS_EXTRACTOR;
        
        return (
            <div className={`p-4 border ${isBiomass ? 'border-green-500/50 bg-green-900/10' : 'border-blue-500/50 bg-blue-900/10'} mb-4 relative overflow-hidden group`}>
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
                            onConstruct(planet.id, type, selectedSlot);
                            setSelectedSlot(null);
                        }
                    }}
                    disabled={!canAfford || selectedSlot === null}
                    className={`w-full py-2 text-[10px] font-bold tracking-widest uppercase transition-all
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
        <div className="absolute inset-0 z-[250] bg-slate-950 flex items-center justify-center pointer-events-auto font-mono">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            <div className="w-full max-w-6xl h-[85vh] bg-slate-900 border border-slate-700 shadow-2xl relative flex overflow-hidden rounded-xl">
                <CloseButton onClick={onClose} colorClass="absolute top-6 right-6 border-slate-600 text-slate-500 hover:text-white hover:bg-slate-800 z-50" />

                {/* Left Panel: Construction Shop */}
                <div className="w-80 bg-black/40 border-r border-slate-800 p-6 flex flex-col overflow-y-auto">
                    <h2 className="text-xl font-display font-black text-white mb-1">{t('PC_TITLE')}</h2>
                    <p className="text-[10px] text-slate-500 tracking-widest uppercase mb-8">{t('PC_SUB')}</p>
                    
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
                        {renderBuildingCard(PlanetBuildingType.BIOMASS_EXTRACTOR, 5500, biomassYield)}
                        {renderBuildingCard(PlanetBuildingType.OXYGEN_EXTRACTOR, 7000, oxygenYield)}
                    </div>
                </div>

                {/* Center: Planet Viz */}
                <div className="flex-1 relative flex items-center justify-center bg-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)]"></div>
                    <canvas ref={canvasRef} width={500} height={500} className="relative z-10" />
                    
                    <div className="absolute bottom-8 left-8 text-xs text-green-500 font-mono">
                        <div>RADIUS: {radiusKm} KM</div>
                        <div>SLOTS: {buildings.length} / {totalSlots}</div>
                    </div>
                </div>

                {/* Right Panel: Slots */}
                <div className="w-80 bg-black/40 border-l border-slate-800 p-6 overflow-y-auto">
                    <h3 className="text-white font-bold tracking-widest text-sm mb-6 border-b border-slate-800 pb-2">{t('PC_SLOTS_AVAILABLE')}</h3>
                    
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
                                                ? 'bg-green-900/20 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
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
                                            <div className={`text-xs ${isSelected ? 'text-green-500' : 'text-slate-600'}`}>{t('PC_SLOT_EMPTY')}</div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
