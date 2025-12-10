
import React, { useState } from 'react';
import { OrbitalUpgradeEffect, OrbitalUpgradeNode } from '../../types';
import { ModuleWindow } from './ModuleWindow';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

export const OrbitalUpgradeUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const s = state.spaceship;
    const tree = s.orbitalUpgradeTree;
    const [hoveredNode, setHoveredNode] = useState<OrbitalUpgradeNode | null>(null);

    const handlePurchase = (nodeId: string) => {
        engine.purchaseOrbitalUpgrade(nodeId);
    }

    const handleClose = () => {
        engine.exitOrbitalUpgradeMenu();
    }

    // Calculate detailed stats
    const baseDamage = 400;
    const baseRate = 8000;
    const dmgMult = s.orbitalDamageMultiplier || 1;
    const rateMult = s.orbitalRateMultiplier || 1;
    
    const currentDamage = baseDamage * dmgMult;
    const currentRate = baseRate / rateMult;

    let totalInvestment = 0;
    if (tree) {
        tree.forEach(layer => layer.forEach(node => {
            if (node.purchased) totalInvestment += node.cost;
        }));
    }

    const headerRight = (
        <div className="flex flex-col items-end mr-16">
            <div className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase mb-1">{t('AVAILABLE_FUNDS')}</div>
            <div className="text-3xl font-mono text-yellow-400 font-bold">{Math.floor(state.player.score)} <span className="text-sm text-yellow-600">{t('SCRAPS')}</span></div>
        </div>
    );

    return (
        <ModuleWindow
            title={`${t('ORBITAL_TITLE')} ${t('CALIBRATION')}`}
            subtitle={t('ORBITAL_SUB')}
            theme="cyan"
            onClose={handleClose}
            headerRight={headerRight}
            maxWidth="max-w-[1350px]"
        >
             <div className="flex flex-1 w-full overflow-hidden min-h-0 relative z-10 gap-6">
                 
                 {/* LEFT PANEL: Investment & Output Stats */}
                 <div className="w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto">
                     
                     {/* Investment Section */}
                     <div className="bg-black/40 border-l-4 border-cyan-700 p-6 rounded-r-lg">
                         <h3 className="text-cyan-500 font-bold text-sm tracking-widest border-b border-cyan-900/50 pb-2 mb-4 uppercase">{t('TOTAL_INVESTMENT')}</h3>
                         <div>
                             <div className="text-3xl font-mono text-slate-300 font-bold tracking-tighter">{totalInvestment}</div>
                             <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{t('SCRAPS')}</div>
                         </div>
                     </div>

                     {/* Stats Section */}
                     <div className="bg-black/40 border-l-4 border-cyan-500 p-6 flex-1 rounded-r-lg">
                         <h3 className="text-cyan-400 font-bold text-sm tracking-widest border-b border-cyan-900/50 pb-2 mb-4 uppercase">{t('CURRENT_OUTPUT')}</h3>
                         
                         {/* Damage */}
                         <div className="mb-6">
                             <div className="flex items-center gap-2 mb-2">
                                 <div className="w-2 h-2 bg-red-500 rounded-sm rotate-45"></div>
                                 <span className="text-xs text-red-400 font-bold uppercase tracking-wider">{t('STATS_KINETIC')}</span>
                             </div>
                             <div className="space-y-2 font-mono text-xs pl-3 border-l border-slate-700">
                                 <div className="flex justify-between text-slate-500">
                                     <span>{t('STATS_BASE')}</span>
                                     <span>{baseDamage}</span>
                                 </div>
                                 <div className="flex justify-between text-slate-400">
                                     <span>{t('STATS_MULT')}</span>
                                     <span className="text-cyan-400">x{dmgMult.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between text-white font-bold text-sm border-t border-slate-700 pt-2 mt-2">
                                     <span>{t('STATS_TOTAL')}</span>
                                     <span className="text-red-400">{Math.floor(currentDamage)}</span>
                                 </div>
                             </div>
                         </div>

                         {/* Rate */}
                         <div>
                             <div className="flex items-center gap-2 mb-2">
                                 <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                 <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">{t('STATS_CYCLING')}</span>
                             </div>
                             <div className="space-y-2 font-mono text-xs pl-3 border-l border-slate-700">
                                 <div className="flex justify-between text-slate-500">
                                     <span>{t('STATS_BASE')}</span>
                                     <span>{(baseRate/1000).toFixed(1)}s</span>
                                 </div>
                                 <div className="flex justify-between text-slate-400">
                                     <span>{t('STATS_ACCEL')}</span>
                                     <span className="text-yellow-400">x{rateMult.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between text-white font-bold text-sm border-t border-slate-700 pt-2 mt-2">
                                     <span>{t('STATS_ACTUAL')}</span>
                                     <span className="text-yellow-300">{(currentRate/1000).toFixed(2)}s</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* CENTER: The Tree (Compacted Layout) */}
                 <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent bg-slate-900/30 rounded-lg border border-cyan-900/30">
                     <div className="flex flex-col gap-6 items-center">
                         {tree.map((layer, layerIndex) => {
                             const prevLayer = layerIndex > 0 ? tree[layerIndex - 1] : null;
                             const purchasedPrev = prevLayer ? prevLayer.filter(n => n.purchased).length : 0;
                             const requiredPrev = prevLayer ? Math.ceil((layerIndex)/2) : 0;
                             const isLayerUnlocked = layerIndex === 0 || purchasedPrev >= requiredPrev;

                             return (
                                 <div key={layerIndex} className="flex gap-8 relative">
                                     {/* Layer Label */}
                                     <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-cyan-900/50 font-mono text-[10px] font-bold whitespace-nowrap rotate-[-90deg]">
                                         {t('LAYER')} {layerIndex + 1}
                                     </div>
                                     
                                     {layer.map((node) => {
                                         const isAffordable = state.player.score >= node.cost;
                                         const isLocked = !isLayerUnlocked;
                                         const statusColor = node.purchased 
                                            ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)] border-emerald-300'
                                            : isLocked 
                                                ? 'bg-slate-900 border-slate-800 opacity-50'
                                                : isAffordable
                                                    ? 'bg-cyan-900 border-cyan-500 hover:bg-cyan-600 hover:scale-110 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                                    : 'bg-red-900/20 border-red-900 cursor-not-allowed';

                                         return (
                                             <div 
                                                key={node.id}
                                                onMouseEnter={() => setHoveredNode(node)}
                                                onMouseLeave={() => setHoveredNode(null)}
                                                onClick={() => !isLocked && !node.purchased && isAffordable && handlePurchase(node.id)}
                                                className={`
                                                    w-10 h-10 rotate-45 border-2 transition-all duration-300 flex items-center justify-center relative group
                                                    ${statusColor}
                                                `}
                                             >
                                                 <div className="-rotate-45 text-white font-bold text-xs">
                                                     {node.purchased ? '✓' : ''}
                                                     {!node.purchased && !isLocked && (
                                                         <span className={node.effectType === OrbitalUpgradeEffect.DAMAGE ? "text-red-400 font-black" : "text-yellow-400 font-black"}>
                                                             {node.effectType === OrbitalUpgradeEffect.DAMAGE ? 'D' : 'R'}
                                                         </span>
                                                     )}
                                                 </div>
                                                 
                                                 {/* Connector Lines (Visual Only) */}
                                                 {layerIndex < tree.length - 1 && (
                                                     <div className="absolute bottom-[-16px] left-1/2 w-0.5 h-8 bg-slate-800 -z-10 origin-top rotate-45"></div>
                                                 )}
                                             </div>
                                         );
                                     })}
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 {/* RIGHT PANEL: Node Details */}
                 <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                     <div className="bg-black/40 border-r-4 border-slate-600 p-6 h-full flex flex-col justify-center relative rounded-l-lg">
                         <h3 className="text-slate-400 font-bold text-sm tracking-widest border-b border-slate-700 pb-2 mb-6 uppercase text-right">
                             {t('SYSTEM_ANALYSIS')}
                         </h3>

                         {hoveredNode ? (
                             <div className="flex flex-col gap-8 animate-fadeIn text-right">
                                 <div>
                                     <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('UPGRADE_TYPE')}</div>
                                     <div className={`text-2xl font-black uppercase tracking-wide ${hoveredNode.effectType === OrbitalUpgradeEffect.DAMAGE ? 'text-red-500' : 'text-yellow-500'}`}>
                                         {hoveredNode.effectType === OrbitalUpgradeEffect.DAMAGE ? t('KINETIC_AMP') : t('CYCLING_SPD')}
                                     </div>
                                 </div>

                                 <div>
                                     <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('EFFECT')}</div>
                                     <div className="text-5xl font-mono text-white font-bold">
                                         +{Math.round(hoveredNode.effectValue * 100)}%
                                     </div>
                                 </div>

                                 <div>
                                     <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('COST')}</div>
                                     <div className={`text-3xl font-mono font-bold ${hoveredNode.purchased ? 'text-emerald-500' : state.player.score >= hoveredNode.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                                         {hoveredNode.purchased ? t('ACQUIRED') : `${hoveredNode.cost} ${t('SCRAPS')}`}
                                     </div>
                                 </div>
                                 
                                 <div className="mt-4 pt-4 border-t border-slate-800">
                                      <div className="text-[10px] text-slate-400 font-mono">
                                          NODE_ID: {hoveredNode.id.split('-').pop()}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                          LAYER: {hoveredNode.layer}
                                      </div>
                                 </div>
                             </div>
                         ) : (
                             <div className="flex flex-col items-center justify-center text-slate-600 font-mono text-sm tracking-widest animate-pulse h-full gap-4 opacity-50">
                                 <div className="text-6xl">⌖</div>
                                 <div className="text-center leading-relaxed max-w-[200px]">{t('HOVER_NODE')}</div>
                             </div>
                         )}
                     </div>
                 </div>

             </div>
        </ModuleWindow>
    );
};
