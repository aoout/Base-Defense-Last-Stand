
import React, { useCallback } from 'react';
import { Planet, MissionType, SpaceshipState, BioBuffType } from '../../types';
import { drawPlanetSprite } from '../../utils/renderers';
import { useLocale } from '../contexts/LocaleContext';
import { CanvasView } from './common/CanvasView';
import { GAS_INFO } from '../../data/world';
import { Icons } from './Icons';

interface PlanetInfoPanelProps {
    planet: Planet;
    spaceship?: SpaceshipState;
    onShowDetail: () => void;
}

export const PlanetInfoPanel: React.FC<PlanetInfoPanelProps> = ({ planet, spaceship, onShowDetail }) => {
    const { t } = useLocale();

    // Use a transparent background for the canvas to blend with the panel
    const handleDraw = useCallback((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        ctx.clearRect(0,0,w,h);
        drawPlanetSprite(ctx, planet, w/2, h/2, 50, time, false); // Smaller radius for compact view
    }, [planet]);

    // Calculate Reduction
    let reduction = 0;
    if (spaceship && spaceship.bioNodes) {
        reduction = spaceship.bioNodes.reduce((acc, node) => {
            if (node.isUnlocked && node.buffType === BioBuffType.GENE_REDUCTION) return acc + node.buffValue;
            return acc;
        }, 0);
    }
    const effectiveGeneStrength = Math.max(0.5, planet.geneStrength - reduction);
    const isOffense = planet.missionType === MissionType.OFFENSE;

    // Sulfur Visual Logic
    const sulfurLevel = planet.sulfurIndex;
    let sulfurColor = 'text-emerald-400';
    let sulfurBorder = 'border-emerald-900/30';
    let sulfurBg = 'bg-emerald-900/10';
    let SulfurIconComponent = null;

    if (sulfurLevel > 7) {
        sulfurColor = 'text-red-500';
        sulfurBorder = 'border-red-500/50';
        sulfurBg = 'bg-red-900/20';
        SulfurIconComponent = Icons.Hazard;
    } else if (sulfurLevel > 3) {
        sulfurColor = 'text-yellow-400';
        sulfurBorder = 'border-yellow-500/50';
        sulfurBg = 'bg-yellow-900/20';
        SulfurIconComponent = Icons.Warning;
    }

    return (
        <div 
            role="button"
            className="w-full relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl transition-all hover:border-cyan-500/30 group cursor-pointer select-none text-left"
            onClick={onShowDetail} 
        >
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            {/* Decorative Top Line */}
            <div className={`h-1 w-full ${isOffense ? 'bg-red-600' : 'bg-cyan-600'}`}></div>

            <div className="p-5 flex gap-4 items-start">
                
                {/* Left: Info & Stats */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            {planet.completed && <span className="text-[9px] font-black bg-emerald-500 text-black px-1.5 rounded uppercase tracking-wider">SECURED</span>}
                            {isOffense && <span className="text-[9px] font-black bg-red-600 text-white px-1.5 rounded uppercase tracking-wider">KILL</span>}
                            <span className="text-[10px] text-slate-400 font-mono tracking-widest">SEC-{planet.id.substring(5,9)}</span>
                        </div>
                        <h2 className="text-2xl font-black text-white leading-none tracking-wide truncate">{planet.name}</h2>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-4">
                        <div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{t('GENE_MODIFIER')}</div>
                            <div className={`font-mono font-bold text-lg ${effectiveGeneStrength > 2 ? 'text-red-400' : 'text-cyan-300'}`}>
                                x{effectiveGeneStrength.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{t('THREAT_LEVEL')}</div>
                            <div className="font-mono font-bold text-white text-lg">
                                {isOffense ? 'APEX' : planet.totalWaves}
                            </div>
                        </div>
                    </div>

                    {/* Prominent Sulfur Warning */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded border ${sulfurBorder} ${sulfurBg} mb-3`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{t('SULFUR_INDEX')}</span>
                        <div className={`font-mono font-black ${sulfurColor} flex items-center gap-2`}>
                            {SulfurIconComponent && (
                                <div className="w-4 h-4 animate-pulse">
                                    <SulfurIconComponent />
                                </div>
                            )}
                            <span>{sulfurLevel}/10</span>
                        </div>
                    </div>

                    {/* Compact Atmosphere Bar & Legend */}
                    <div className="w-full">
                        <div className="text-[9px] text-slate-500 mb-1 uppercase font-bold tracking-wider">{t('ATMOSPHERE_COMP')}</div>
                        <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-800/50 mb-2">
                            {planet.atmosphere.map((gas, i) => (
                                <div key={i} style={{ width: `${gas.percentage * 100}%`, backgroundColor: gas.color }}></div>
                            ))}
                        </div>
                        
                        {/* Atmosphere Legend */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {planet.atmosphere.map((gas, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: gas.color, color: gas.color }}></div>
                                    <div className="text-[9px] font-mono text-slate-400 leading-none">
                                        <span style={{color: gas.color}}>{t(`GAS_${gas.id}_NAME`)}</span>
                                        <span className="text-slate-600 ml-1">{(gas.percentage * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Floating Planet Visual */}
                <div 
                    className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center self-center group/visual z-10"
                >
                    {/* Glow behind planet */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${isOffense ? 'from-red-500/20' : 'from-cyan-500/20'} to-transparent rounded-full blur-xl opacity-50`}></div>
                    <CanvasView 
                        width={112} 
                        height={112} 
                        className="relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover/visual:scale-110" 
                        draw={handleDraw}
                    />
                    
                    {/* 'Click to Analyze' Hint overlay on hover */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/visual:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 tracking-widest uppercase shadow-lg">
                            {t('VIEW_ANALYSIS')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
