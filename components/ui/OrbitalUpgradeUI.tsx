import React, { useState } from 'react';
import { GameState, OrbitalUpgradeEffect, OrbitalUpgradeNode } from '../../types';
import { CloseButton } from './Shared';

interface OrbitalUpgradeUIProps {
    state: GameState;
    onPurchase: (nodeId: string) => void;
    onClose: () => void;
    t: (key: string) => string;
}

export const OrbitalUpgradeUI: React.FC<OrbitalUpgradeUIProps> = ({ state, onPurchase, onClose, t }) => {
    const s = state.spaceship;
    const tree = s.orbitalUpgradeTree;
    const [hoveredNode, setHoveredNode] = useState<OrbitalUpgradeNode | null>(null);

    return (
        <div className="absolute inset-0 z-[250] bg-slate-950 flex items-center justify-center pointer-events-auto select-none">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/50 to-transparent"></div>
            </div>

            <div className="relative w-full max-w-5xl h-[90vh] flex flex-col items-center">
                 <CloseButton onClick={onClose} colorClass="absolute top-4 right-4 border-cyan-700 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                 
                 {/* Header */}
                 <div className="mt-8 text-center mb-12 relative z-10">
                     <h1 className="text-5xl font-display font-black text-white tracking-widest uppercase mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                         {t('ORBITAL_TITLE')} <span className="text-cyan-500">{t('CALIBRATION')}</span>
                     </h1>
                     <div className="text-cyan-400 font-mono text-xs tracking-[0.5em] uppercase">{t('ORBITAL_SUB')}</div>
                 </div>

                 {/* Stats Summary */}
                 <div className="absolute top-8 left-8 bg-black/40 border border-cyan-900/50 p-6 backdrop-blur-sm">
                     <h3 className="text-cyan-500 text-xs font-bold tracking-widest border-b border-cyan-900 pb-2 mb-4">{t('CURRENT_OUTPUT')}</h3>
                     <div className="space-y-2 font-mono text-sm">
                         <div className="flex justify-between w-48">
                             <span className="text-slate-400">{t('DMG_MULT')}</span>
                             <span className="text-white font-bold">x{(s.orbitalDamageMultiplier || 1).toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between w-48">
                             <span className="text-slate-400">{t('RATE_DIV')}</span>
                             <span className="text-white font-bold">/{(s.orbitalRateMultiplier || 1).toFixed(2)}</span>
                         </div>
                     </div>
                 </div>

                 {/* Available Funds */}
                 <div className="absolute top-8 left-64 bg-black/40 border border-cyan-900/50 p-6 backdrop-blur-sm">
                     <div className="text-cyan-500 text-xs font-bold tracking-widest uppercase mb-1">{t('AVAILABLE_FUNDS')}</div>
                     <div className="text-2xl font-mono text-yellow-400 font-bold">{Math.floor(state.player.score)} <span className="text-sm text-yellow-600">{t('SCRAPS')}</span></div>
                 </div>

                 {/* The Tree (Pyramid) */}
                 <div className="flex-1 flex flex-col justify-center items-center gap-8 relative z-10 w-full">
                     {tree.map((layer, layerIndex) => {
                         // Unlock Logic Visualization
                         const prevLayer = layerIndex > 0 ? tree[layerIndex - 1] : null;
                         const purchasedPrev = prevLayer ? prevLayer.filter(n => n.purchased).length : 0;
                         const requiredPrev = prevLayer ? Math.ceil((layerIndex)/2) : 0;
                         const isLayerUnlocked = layerIndex === 0 || purchasedPrev >= requiredPrev;

                         return (
                             <div key={layerIndex} className="flex gap-12 relative">
                                 {/* Layer Label */}
                                 <div className="absolute -left-24 top-1/2 -translate-y-1/2 text-cyan-900 font-mono text-xs font-bold">
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
                                            onClick={() => !isLocked && !node.purchased && isAffordable && onPurchase(node.id)}
                                            className={`
                                                w-12 h-12 rotate-45 border-2 transition-all duration-300 flex items-center justify-center
                                                ${statusColor}
                                            `}
                                         >
                                             <div className="-rotate-45 text-white font-bold text-lg">
                                                 {node.purchased ? '✓' : ''}
                                                 {!node.purchased && !isLocked && (
                                                     <span className={node.effectType === OrbitalUpgradeEffect.DAMAGE ? "text-red-400" : "text-yellow-400"}>
                                                         {node.effectType === OrbitalUpgradeEffect.DAMAGE ? 'D' : 'R'}
                                                     </span>
                                                 )}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         );
                     })}
                 </div>

                 {/* Tooltip / Info Panel at Bottom */}
                 <div className="h-32 w-full bg-slate-900 border-t border-cyan-900 flex items-center justify-center relative z-20">
                     {hoveredNode ? (
                         <div className="flex gap-12 items-center animate-fadeIn">
                             <div className="text-right">
                                 <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('UPGRADE_TYPE')}</div>
                                 <div className={`text-2xl font-black uppercase ${hoveredNode.effectType === OrbitalUpgradeEffect.DAMAGE ? 'text-red-500' : 'text-yellow-500'}`}>
                                     {hoveredNode.effectType === OrbitalUpgradeEffect.DAMAGE ? t('KINETIC_AMP') : t('CYCLING_SPD')}
                                 </div>
                             </div>
                             
                             <div className="h-12 w-px bg-slate-700"></div>

                             <div className="text-center">
                                 <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('EFFECT')}</div>
                                 <div className="text-4xl font-mono text-white">
                                     +{Math.round(hoveredNode.effectValue * 100)}%
                                 </div>
                             </div>

                             <div className="h-12 w-px bg-slate-700"></div>

                             <div className="text-left">
                                 <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{t('COST')}</div>
                                 <div className={`text-2xl font-mono font-bold ${hoveredNode.purchased ? 'text-emerald-500' : state.player.score >= hoveredNode.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                                     {hoveredNode.purchased ? t('ACQUIRED') : `${hoveredNode.cost} ${t('SCRAPS')}`}
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="text-slate-600 font-mono text-sm tracking-widest animate-pulse">
                             {t('HOVER_NODE')}
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
};