
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Planet, MissionType, AtmosphereGas } from '../../types';
import { ModuleWindow } from './ModuleWindow';
import { CyberButton } from './atoms/CyberButton';
import { CyberPanel } from './atoms/CyberPanel';
import { drawPlanetSprite } from '../../utils/renderers';
import { useLocale } from '../contexts/LocaleContext';
import { CanvasView } from './common/CanvasView';
import { GAS_INFO } from '../../data/world';
import { DS } from '../../theme/designSystem';

interface PlanetDetailScreenProps {
    planet: Planet;
    currentScraps: number;
    dropCost: number;
    canAfford: boolean;
    onClose: () => void;
    onDeploy: () => void;
    onOpenConstruction: () => void;
}

export const PlanetDetailScreen: React.FC<PlanetDetailScreenProps> = ({ 
    planet, 
    currentScraps, 
    dropCost, 
    canAfford, 
    onClose, 
    onDeploy, 
    onOpenConstruction
}) => {
    const { t } = useLocale();
    const chartRef = useRef<SVGSVGElement>(null);
    const [hoveredGas, setHoveredGas] = useState<AtmosphereGas | null>(null);

    const handleDraw = useCallback((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        // Transparent background used here so it blends with UI bg
        drawPlanetSprite(ctx, planet, w/2, h/2, 120, time, false);
    }, [planet]);

    // D3 Atmosphere Chart
    useEffect(() => {
        if (!chartRef.current) return;
        
        const width = 300;
        const height = 300;
        const radius = Math.min(width, height) / 2;

        const svg = d3.select(chartRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const pie = d3.pie<AtmosphereGas>()
            .value(d => d.percentage)
            .sort(null);

        const arc = d3.arc<d3.PieArcDatum<AtmosphereGas>>()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 0.9);

        const paths = g.selectAll("path")
            .data(pie(planet.atmosphere))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => d.data.color)
            .attr("stroke", "#0f172a")
            .attr("stroke-width", "2px")
            .style("cursor", "pointer")
            .style("opacity", 0.8)
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 1).attr("transform", "scale(1.05)");
                setHoveredGas(d.data);
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.8).attr("transform", "scale(1)");
                setHoveredGas(null);
            });

        // Center Text
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.2em")
            .text("ATMOS")
            .attr("fill", "#64748b")
            .attr("font-family", "monospace")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");
            
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1.2em")
            .text("100%")
            .attr("fill", "#ffffff")
            .attr("font-family", "monospace")
            .attr("font-size", "20px")
            .attr("font-weight", "bold");

    }, [planet]);

    const headerRight = (
        <div className="text-right">
            <div className="text-cyan-700 font-mono text-xs mb-1">{t('SCAN_ID')}</div>
            <div className="text-cyan-400 font-mono text-xl">#{planet.id.toUpperCase().substring(0,8)}</div>
        </div>
    );

    return (
        <ModuleWindow
            title={planet.name}
            subtitle={t('PLANETARY_SCAN')}
            theme="cyan"
            onClose={onClose}
            headerRight={headerRight}
            maxWidth="max-w-7xl"
        >
            <div className="flex-1 grid grid-cols-3 gap-8 overflow-hidden min-h-0">
                
                {/* COL 1: Visuals & Bio-Data */}
                <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-900">
                    <CyberPanel className="aspect-square flex items-center justify-center relative overflow-hidden shrink-0" decorated>
                        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none"></div>
                        <CanvasView 
                            width={400} 
                            height={400} 
                            className="relative z-0 w-full h-full" 
                            draw={handleDraw}
                        />
                        
                        {/* Overlay Stats */}
                        <div className="absolute bottom-4 left-4 z-20 text-xs font-mono text-cyan-300">
                            <div>RADIUS: {Math.floor(planet.radius * 100)}km</div>
                            <div>GRAVITY: {(planet.radius / 50).toFixed(2)}g</div>
                        </div>
                    </CyberPanel>

                    <CyberPanel className="p-6 border-l-4 border-l-purple-500">
                        <h3 className={`${DS.text.label} text-purple-400 mb-4`}>{t('HAZARD_ASSESSMENT')}</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                                    <span>{t('GENE_MODIFIER')}</span>
                                    <span className={planet.geneStrength > 1.5 ? 'text-red-400' : 'text-white'}>x{planet.geneStrength.toFixed(2)}</span>
                                </div>
                                <div className="h-1 bg-slate-800 w-full overflow-hidden">
                                    <div className={`h-full ${planet.geneStrength > 1.5 ? 'bg-red-500' : 'bg-purple-500'}`} style={{width: `${(planet.geneStrength / 3) * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                                    <span>{t('SULFUR_INDEX')}</span>
                                    <span className={planet.sulfurIndex > 5 ? 'text-yellow-400' : 'text-white'}>{planet.sulfurIndex}/10</span>
                                </div>
                                <div className="h-1 bg-slate-800 w-full overflow-hidden">
                                    <div className={`h-full ${planet.sulfurIndex > 5 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${(planet.sulfurIndex / 10) * 100}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </CyberPanel>
                </div>

                {/* COL 2: Atmosphere */}
                <CyberPanel className="flex flex-col relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-900" noBorder>
                    <div className="sticky top-0 left-0 bg-slate-800 px-4 py-1 text-xs font-bold text-slate-300 z-10">{t('ATMOSPHERIC_BREAKDOWN')}</div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
                        <svg ref={chartRef} width={300} height={300} className="filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"></svg>
                        
                        <div className="mt-8 h-24 w-full flex flex-col items-center justify-center text-center">
                            {hoveredGas ? (
                                <div className="animate-fadeIn">
                                    <div className="text-2xl font-display font-black" style={{color: hoveredGas.color}}>{t(`GAS_${hoveredGas.id}_NAME`)}</div>
                                    <div className="text-4xl font-mono text-white font-bold mb-1">{(hoveredGas.percentage * 100).toFixed(1)}%</div>
                                    <div className="text-[10px] text-slate-400 max-w-xs leading-tight">{t(`GAS_${hoveredGas.id}_DESC`)}</div>
                                </div>
                            ) : (
                                <div className="text-slate-600 text-xs font-mono animate-pulse">HOVER SECTOR FOR DATA</div>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="border-t border-slate-800 p-4">
                        {planet.atmosphere.map(gas => (
                            <div key={gas.id} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 px-2 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: gas.color}}></div>
                                    <span className="text-xs font-bold text-slate-300">{t(`GAS_${gas.id}_NAME`)}</span>
                                </div>
                                <span className="text-xs font-mono text-slate-500">{(gas.percentage * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </CyberPanel>

                {/* COL 3: Tactical & Launch */}
                <div className="flex flex-col gap-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-900 pr-2">
                    
                    {/* Mission Type Card */}
                    <CyberPanel className={`p-6 border-l-4 shrink-0 ${planet.missionType === MissionType.OFFENSE ? 'border-red-600 bg-red-900/10' : 'border-blue-600 bg-blue-900/10'}`}>
                        <h3 className={`text-sm font-bold tracking-widest mb-2 ${planet.missionType === MissionType.OFFENSE ? 'text-red-500' : 'text-blue-500'}`}>
                            {t('TACTICAL_ASSESSMENT')}
                        </h3>
                        <div className="text-3xl font-display font-black text-white mb-4">
                            {planet.missionType === MissionType.OFFENSE ? t('MISSION_ASSAULT') : t('CMD_DEFEND')}
                        </div>
                        <div className="text-xs text-slate-400 font-mono leading-relaxed">
                            {planet.missionType === MissionType.OFFENSE 
                                ? t('MANUAL_OFFENSE_DESC')
                                : t('MANUAL_DEFENSE_DESC')
                            }
                        </div>
                    </CyberPanel>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="bg-black/40 p-4 border border-slate-800">
                            <div className="text-[10px] text-slate-500 mb-1">{t('ESTIMATED_HOSTILES')}</div>
                            <div className="text-xl text-white font-mono">{planet.missionType === MissionType.OFFENSE ? "UNKNOWN" : planet.totalWaves * 20 + "+"}</div>
                        </div>
                        <div className="bg-black/40 p-4 border border-slate-800">
                            <div className="text-[10px] text-slate-500 mb-1">{t('RESOURCE_DENSITY')}</div>
                            <div className="text-xl text-yellow-400 font-mono">{t(planet.landingDifficulty > 20 ? 'HIGH' : planet.landingDifficulty > 10 ? 'MEDIUM' : 'LOW')}</div>
                        </div>
                    </div>

                    {/* Launch Control */}
                    <CyberPanel className="mt-auto p-6 flex flex-col gap-4 shrink-0" decorated>
                        {planet.completed ? (
                            <>
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-yellow-500">{t('PC_TITLE')}</span>
                                    <span className="text-green-500">{t('CLEARED_TAG')}</span>
                                </div>
                                
                                <CyberButton 
                                    onClick={onOpenConstruction}
                                    variant="yellow"
                                    className="py-6 text-xl"
                                    label={t('PC_BTN')}
                                    fullWidth
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-cyan-500">{t('LAUNCH_WINDOW')}</span>
                                    <span className={canAfford ? 'text-green-500' : 'text-red-500'}>{canAfford ? 'READY' : 'INSUFFICIENT FUEL'}</span>
                                </div>
                                
                                <div className="flex justify-between items-center bg-black/50 p-3 border border-slate-800">
                                    <span className="text-slate-400 text-xs">{t('DROP_COST')}</span>
                                    <span className="text-yellow-400 font-mono font-bold text-lg">-{dropCost} SCRAPS</span>
                                </div>

                                <CyberButton 
                                    onClick={onDeploy}
                                    disabled={!canAfford}
                                    variant="cyan"
                                    className="py-6 text-xl"
                                    label={t('INITIATE_DROP')}
                                    fullWidth
                                />
                            </>
                        )}
                    </CyberPanel>

                </div>
            </div>
        </ModuleWindow>
    );
};
