
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Planet, MissionType, AtmosphereGas } from '../../types';
import { CloseButton } from './Shared';
import { drawPlanetSprite } from '../../utils/renderers';

interface PlanetDetailScreenProps {
    planet: Planet;
    currentScraps: number;
    dropCost: number;
    canAfford: boolean;
    onClose: () => void;
    onDeploy: () => void;
    t: (key: string, params?: any) => string;
}

export const PlanetDetailScreen: React.FC<PlanetDetailScreenProps> = ({ 
    planet, 
    currentScraps, 
    dropCost, 
    canAfford, 
    onClose, 
    onDeploy, 
    t 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const chartRef = useRef<SVGSVGElement>(null);
    const [hoveredGas, setHoveredGas] = useState<AtmosphereGas | null>(null);

    // Planet Animation Loop
    useEffect(() => {
        const renderPreview = (time: number) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            const w = canvasRef.current.width; 
            const h = canvasRef.current.height; 
            ctx.clearRect(0, 0, w, h); 
            // Transparent background for canvas itself
            drawPlanetSprite(ctx, planet, w/2, h/2, 120, time, false);
            requestRef.current = requestAnimationFrame(renderPreview);
        };
        requestRef.current = requestAnimationFrame(renderPreview);
        return () => cancelAnimationFrame(requestRef.current);
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

    return (
        <div className="absolute inset-0 z-[200] bg-slate-950 flex items-center justify-center pointer-events-auto">
            {/* Background Tech Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(56,189,248,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]"></div>

            <div className="w-full max-w-7xl h-[90vh] flex flex-col relative z-10 p-12 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
                <CloseButton onClick={onClose} colorClass="absolute top-8 right-8 border-cyan-500 text-cyan-500 hover:text-white hover:bg-cyan-900/50 z-20" />

                {/* Header */}
                <div className="flex justify-between items-end border-b border-cyan-900/50 pb-6 mb-8 shrink-0">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-3 h-3 bg-cyan-500 animate-pulse shadow-[0_0_10px_cyan]"></div>
                            <h2 className="text-cyan-500 font-mono text-sm tracking-[0.3em]">{t('PLANETARY_SCAN')}</h2>
                        </div>
                        <h1 className="text-6xl font-display font-black text-white uppercase tracking-wide">{planet.name}</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-cyan-700 font-mono text-xs mb-1">{t('SCAN_ID')}</div>
                        <div className="text-cyan-400 font-mono text-xl">#{planet.id.toUpperCase().substring(0,8)}</div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-8 overflow-hidden min-h-0">
                    
                    {/* COL 1: Visuals & Bio-Data */}
                    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-900">
                        <div className="aspect-square bg-black/40 border border-cyan-900/30 flex items-center justify-center relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none"></div>
                            <canvas ref={canvasRef} width={400} height={400} className="relative z-0 w-full h-full" />
                            
                            {/* Overlay Stats */}
                            <div className="absolute bottom-4 left-4 z-20 text-xs font-mono text-cyan-300">
                                <div>RADIUS: {Math.floor(planet.radius * 100)}km</div>
                                <div>GRAVITY: {(planet.radius / 50).toFixed(2)}g</div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border-l-2 border-purple-500 p-6">
                            <h3 className="text-purple-400 font-bold mb-4 tracking-widest text-sm">{t('HAZARD_ASSESSMENT')}</h3>
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
                        </div>
                    </div>

                    {/* COL 2: Atmosphere */}
                    <div className="flex flex-col bg-slate-900/30 border border-slate-800 relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-900">
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
                    </div>

                    {/* COL 3: Tactical & Launch */}
                    <div className="flex flex-col gap-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-900 pr-2">
                        
                        {/* Mission Type Card */}
                        <div className={`p-6 border-l-4 shrink-0 ${planet.missionType === MissionType.OFFENSE ? 'bg-red-900/20 border-red-600' : 'bg-blue-900/20 border-blue-600'}`}>
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
                        </div>

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

                        {/* Launch Control - Pushed to bottom but part of scroll if needed */}
                        <div className="mt-auto bg-slate-900 border border-cyan-900 p-6 flex flex-col gap-4 shrink-0">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-cyan-500">{t('LAUNCH_WINDOW')}</span>
                                <span className={canAfford ? 'text-green-500' : 'text-red-500'}>{canAfford ? 'READY' : 'INSUFFICIENT FUEL'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center bg-black/50 p-3 border border-slate-800">
                                <span className="text-slate-400 text-xs">{t('DROP_COST')}</span>
                                <span className="text-yellow-400 font-mono font-bold text-lg">-{dropCost} SCRAPS</span>
                            </div>

                            <button 
                                onClick={onDeploy}
                                disabled={!canAfford}
                                className={`
                                    w-full py-6 text-xl font-black tracking-[0.2em] transition-all relative overflow-hidden group
                                    ${canAfford 
                                        ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                <span className="relative z-10">{t('INITIATE_DROP')}</span>
                                {canAfford && <div className="absolute inset-0 bg-cyan-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
