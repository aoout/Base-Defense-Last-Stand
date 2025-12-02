import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Planet, AtmosphereGas } from '../../types';
import { CloseButton } from './Shared';

interface AtmosphereAnalysisModalProps {
    planet: Planet;
    onClose: () => void;
    t: (key: string) => string;
}

export const AtmosphereAnalysisModal: React.FC<AtmosphereAnalysisModalProps> = ({ planet, onClose, t }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;
        
        const width = containerRef.current.clientWidth; 
        const height = containerRef.current.clientHeight;
        const radius = Math.min(width, height) / 2.8; 

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        svg.attr("width", width).attr("height", height);

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const pieGenerator = d3.pie<AtmosphereGas>()
            .value(d => d.percentage)
            .sort(null);

        const arcGenerator = d3.arc<d3.PieArcDatum<AtmosphereGas>>()
            .innerRadius(radius * 0.6) 
            .outerRadius(radius * 0.9);
        
        g.selectAll("path")
            .data(pieGenerator(planet.atmosphere))
            .enter()
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", d => d.data.color)
            .attr("stroke", "#0f172a") 
            .attr("stroke-width", "4px")
            .style("opacity", 0.9)
            .on("mouseover", function() {
                d3.select(this).style("opacity", 1).attr("transform", "scale(1.05)").attr("stroke-width", "0px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.9).attr("transform", "scale(1)").attr("stroke-width", "4px");
            });

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .text(t('ATMOS_LABEL'))
            .attr("fill", "#64748b")
            .attr("font-size", "32px") 
            .attr("font-family", "ZCOOL QingKe HuangYou, cursive")
            .attr("letter-spacing", "0.1em");
        
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1em")
            .text("100%")
            .attr("fill", "#ffffff")
            .attr("font-size", "64px") 
            .attr("font-weight", "900")
            .attr("font-family", "ZCOOL QingKe HuangYou, cursive");

    }, [planet, t]);

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 pointer-events-auto flex flex-col">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
             
            <div className="flex w-full h-full relative z-10">
                <CloseButton onClick={onClose} colorClass="fixed top-8 right-8 w-12 h-12 border-green-500 text-green-500 hover:bg-green-500 hover:text-black z-50 flex items-center justify-center" />
                
                <div ref={containerRef} className="w-2/3 h-full bg-gradient-to-br from-slate-900/50 to-slate-950/50 flex flex-col items-center justify-center border-r border-green-900/30 relative">
                     <div className="absolute top-12 left-12">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-3 h-3 bg-green-500 animate-pulse"></div>
                            <h3 className="text-green-500 font-display tracking-[0.2em] uppercase text-2xl">{t('PLANET_ATMOS_ANALYSIS')}</h3>
                        </div>
                        <h1 className="text-7xl font-display text-white font-black tracking-wide drop-shadow-2xl">{planet.name}</h1>
                        <div className="h-1 w-full bg-gradient-to-r from-green-500 to-transparent mt-4"></div>
                     </div>
                    
                    <svg ref={svgRef} className="z-10 filter drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"></svg>
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[800px] h-[800px] rounded-full border border-green-500/5 animate-[spin_40s_linear_infinite]"></div>
                        <div className="w-[1000px] h-[1000px] rounded-full border border-green-500/5 border-dashed animate-[spin_80s_linear_infinite_reverse]"></div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-[5%] w-full animate-[scan_4s_linear_infinite] pointer-events-none"></div>
                </div>

                <div className="w-1/3 h-full p-12 overflow-y-auto bg-slate-950/80 relative backdrop-blur-sm border-l border-green-500/20">
                    <div className="mb-12 mt-4">
                        <div className="text-xs text-green-600 font-bold uppercase tracking-[0.3em] mb-4">{t('SPECTROSCOPIC_DATA')}</div>
                        <div className="text-xl text-green-400/80 font-mono leading-relaxed">
                            {t('ATMOS_DETAILS_PRE')} <span className="text-white font-bold">{planet.name}</span>{t('ATMOS_DETAILS_MID')} <span className={planet.biome === 'TOXIC' ? 'text-purple-400' : 'text-blue-400'}>{t(`BIOME_${planet.biome}`)}</span> {t('ATMOS_DETAILS_POST')}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {planet.atmosphere.map((gas, i) => (
                            <div key={i} className="group bg-slate-900/50 border border-slate-800 hover:border-green-500 hover:bg-slate-900 p-8 rounded-none transition-all duration-300 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-hover:bg-green-500 transition-colors"></div>
                                <div className="flex justify-between items-end mb-4 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-6 h-6 shadow-[0_0_10px_currentColor]" style={{backgroundColor: gas.color, color: gas.color}}></div>
                                        <span className="text-green-100 font-bold font-display text-3xl tracking-wide uppercase">{t(`GAS_${gas.id}_NAME`)}</span>
                                    </div>
                                    <span className="text-4xl font-display font-black text-white tabular-nums tracking-tighter">{(gas.percentage * 100).toFixed(2)}%</span>
                                </div>
                                <p className="text-base text-slate-400 leading-relaxed font-mono relative z-10 pl-12 group-hover:text-slate-300 transition-colors">
                                    {t(`GAS_${gas.id}_DESC`)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-12 left-12 right-12 pt-8 border-t border-slate-800 flex justify-between items-center text-green-800">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 animate-ping rounded-full"></div>
                            <span className="font-mono text-xs tracking-[0.2em]">{t('UPLINK_ESTABLISHED')}</span>
                         </div>
                         <div className="font-mono text-xs">{t('SECURE_CONNECTION')}</div>
                    </div>
                </div>
            </div>
        </div>
    )
};