
import React, { useRef, useEffect } from 'react';
import { Planet, MissionType, SpaceshipState, BioBuffType } from '../../types';
import { drawPlanetSprite } from '../../utils/renderers';

interface PlanetInfoPanelProps {
    planet: Planet;
    spaceship?: SpaceshipState; // Pass spaceship to calculate reductions
    t: (key: string) => string;
    onShowDetail: () => void;
}

export const PlanetInfoPanel: React.FC<PlanetInfoPanelProps> = ({ planet, spaceship, t, onShowDetail }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const renderPreview = (time: number) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            const w = canvasRef.current.width; 
            const h = canvasRef.current.height; 
            ctx.clearRect(0, 0, w, h); 
            ctx.fillStyle = '#020617'; 
            ctx.fillRect(0, 0, w, h);
            drawPlanetSprite(ctx, planet, w/2, h/2, 80, time, false);
            requestRef.current = requestAnimationFrame(renderPreview);
        };
        requestRef.current = requestAnimationFrame(renderPreview);
        return () => cancelAnimationFrame(requestRef.current);
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

    const mainGases = planet.atmosphere.slice(0, 3);

    return (
        <div className="flex flex-col h-full gap-4">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <div className="flex items-center gap-2">
                         <h2 className="text-3xl font-black text-white leading-none">{planet.name}</h2>
                         {planet.missionType === MissionType.OFFENSE && <span className="text-[10px] bg-red-900 text-red-200 px-2 rounded border border-red-700 font-bold">{t('OFFENSE_TAG')}</span>}
                     </div>
                     {planet.completed && <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 font-bold tracking-widest uppercase inline-block mt-1">{t('CLEARED_TAG')}</span>}
                 </div>
                 <div className="w-24 h-24 border border-blue-900/50 rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                     <canvas ref={canvasRef} width={96} height={96} className="w-full h-full"></canvas>
                     <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                 </div>
             </div>
             <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                 <div className="bg-blue-950/30 p-3 border border-blue-900/50">
                     <div className="text-blue-500 mb-1">{t('THREAT_LEVEL')}</div>
                     <div className="text-white text-lg font-bold">
                         {planet.missionType === MissionType.OFFENSE ? t('ASSAULT_OPS') : `${planet.totalWaves} ${t('WAVES_SUFFIX')}`}
                     </div>
                 </div>
                 <div className="bg-blue-950/30 p-3 border border-blue-900/50">
                     <div className="text-blue-500 mb-1">{t('GENE_MODIFIER')}</div>
                     {reduction > 0 ? (
                         <div>
                             <div className="text-lg font-bold text-green-400">x{effectiveGeneStrength.toFixed(2)}</div>
                             <div className="text-[9px] text-slate-400">
                                 (Base {planet.geneStrength.toFixed(2)} - {reduction.toFixed(2)})
                             </div>
                         </div>
                     ) : (
                         <div className={`text-lg font-bold ${planet.geneStrength > 2 ? 'text-red-400' : 'text-yellow-400'}`}>x{planet.geneStrength.toFixed(1)}</div>
                     )}
                 </div>
                 <div className="bg-blue-950/30 p-3 border border-blue-900/50 col-span-2">
                     <div className="text-blue-500 mb-1 flex justify-between">
                        <span>{t('SULFUR_INDEX')}</span>
                        <span className="text-yellow-500 font-bold">{planet.sulfurIndex}/10</span>
                     </div>
                     <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${planet.sulfurIndex > 7 ? 'bg-red-500' : planet.sulfurIndex > 4 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                            style={{width: `${(planet.sulfurIndex/10)*100}%`}}
                        ></div>
                     </div>
                 </div>
             </div>
             
             {/* Atmosphere Preview Box */}
             <div 
                className="group bg-blue-950/20 p-4 border border-blue-900/50 flex flex-col gap-3 mt-2 flex-1 cursor-pointer hover:bg-blue-900/30 transition-colors"
                onClick={onShowDetail}
             >
                  <div className="flex justify-between items-center">
                      <label className="text-blue-400 text-xs tracking-widest uppercase font-bold">{t('ATMOSPHERE_COMP')}</label>
                      <div className="text-[10px] text-cyan-500 group-hover:text-white transition-colors">{t('VIEW_ANALYSIS')} »</div>
                  </div>
                  <div className="h-4 w-full flex rounded overflow-hidden bg-gray-900 border border-blue-900/30 group-hover:border-cyan-400 transition-all shadow-sm">
                      {planet.atmosphere.map((gas, i) => (
                          <div key={i} style={{ width: `${gas.percentage * 100}%`, backgroundColor: gas.color }}></div>
                      ))}
                  </div>
                  <div className="space-y-1 mt-1">
                      {mainGases.map(gas => (
                          <div key={gas.id} className="flex justify-between items-center text-xs border-b border-blue-900/20 pb-1 last:border-0">
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-sm" style={{backgroundColor: gas.color}}></div>
                                  <span className="text-gray-300 font-mono">{t(`GAS_${gas.id}_NAME`)}</span>
                              </div>
                              <span className="text-white font-bold font-mono">{(gas.percentage * 100).toFixed(1)}%</span>
                          </div>
                      ))}
                  </div>
             </div>
        </div>
    );
};
