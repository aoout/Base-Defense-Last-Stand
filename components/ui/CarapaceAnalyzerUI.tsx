

import React, { useState } from 'react';
import { GameState, CarapaceNode, EnemyType } from '../../types';
import { CloseButton } from './Shared';

interface CarapaceAnalyzerUIProps {
    state: GameState;
    onPurchase: (row: number, col: number) => void;
    onClose: () => void;
}

export const CarapaceAnalyzerUI: React.FC<CarapaceAnalyzerUIProps> = ({ state, onPurchase, onClose }) => {
    const grid = state.spaceship.carapaceGrid;
    const [hoveredNode, setHoveredNode] = useState<CarapaceNode | null>(null);

    if (!grid) return null;

    const renderEnemyIcon = (type: EnemyType) => {
        let label = "?";
        let color = "text-slate-500";
        switch(type) {
            case EnemyType.GRUNT: label = "G"; color = "text-red-400"; break;
            case EnemyType.RUSHER: label = "R"; color = "text-yellow-400"; break;
            case EnemyType.TANK: label = "T"; color = "text-slate-200"; break;
            case EnemyType.KAMIKAZE: label = "K"; color = "text-purple-400"; break;
            case EnemyType.VIPER: label = "V"; color = "text-green-400"; break;
        }
        return <span className={`font-black font-mono text-lg ${color}`}>{label}</span>;
    }

    return (
        <div className="absolute inset-0 z-[250] bg-slate-950 flex items-center justify-center pointer-events-auto select-none">
             {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] opacity-30"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-10"></div>
            </div>

            <div className="relative w-full max-w-5xl h-[90vh] flex flex-col items-center">
                 <CloseButton onClick={onClose} colorClass="absolute top-4 right-4 border-cyan-700 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                 
                 {/* Header */}
                 <div className="mt-8 text-center mb-12 relative z-10">
                     <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                         Xenobiology <span className="text-green-500">Analysis</span>
                     </h1>
                     <div className="text-cyan-400 font-mono text-xs tracking-[0.5em] uppercase">Weakness Identification Matrix</div>
                 </div>

                 {/* Available Funds */}
                 <div className="absolute top-8 left-8 bg-black/40 border border-green-900/50 p-6 backdrop-blur-sm">
                     <div className="text-green-500 text-xs font-bold tracking-widest uppercase mb-1">Available Funds</div>
                     <div className="text-2xl font-mono text-yellow-400 font-bold">{Math.floor(state.player.score)} <span className="text-sm text-yellow-600">SCRAPS</span></div>
                 </div>

                 {/* Main Grid Interface */}
                 <div className="flex relative p-8 bg-black/20 border border-slate-800 rounded-xl backdrop-blur-md">
                    
                    {/* The Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        {grid.nodes.map((row, rIndex) => (
                            <React.Fragment key={rIndex}>
                                {row.map((node, cIndex) => {
                                    const isAffordable = state.player.score >= node.cost;
                                    const bgClass = node.purchased 
                                        ? 'bg-green-900/50 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                                        : isAffordable
                                            ? 'bg-slate-900/80 border-slate-600 hover:border-green-400 hover:bg-slate-800 cursor-pointer'
                                            : 'bg-red-900/10 border-red-900/30 cursor-not-allowed opacity-60';

                                    return (
                                        <div
                                            key={node.id}
                                            onMouseEnter={() => setHoveredNode(node)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                            onClick={() => !node.purchased && isAffordable && onPurchase(rIndex, cIndex)}
                                            className={`w-24 h-24 border-2 rounded flex flex-col items-center justify-center transition-all relative group ${bgClass}`}
                                        >
                                            <div className="absolute top-1 left-2 text-[10px] text-slate-500">#{rIndex}-{cIndex}</div>
                                            {renderEnemyIcon(node.targetEnemy)}
                                            <div className="text-white font-bold text-sm">+{Math.round(node.damageBonus * 100)}%</div>
                                            {node.purchased && <div className="absolute bottom-1 right-2 text-green-500 text-xs">ACQUIRED</div>}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Row Bonuses (Right Side) */}
                    <div className="flex flex-col justify-around ml-8 h-full py-2">
                        {grid.rowBonuses.map((bonus, i) => (
                            <div key={bonus.id} className={`w-32 h-20 border flex flex-col items-center justify-center rounded transition-all ${bonus.unlocked ? 'bg-green-500 text-black border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-black/40 border-slate-800 text-slate-600'}`}>
                                <div className="text-[10px] font-bold tracking-widest uppercase mb-1">ROW {i+1} BONUS</div>
                                <div className="text-xl font-black">+{Math.round(bonus.damageBonus * 100)}%</div>
                                <div className="text-[8px] uppercase">Global Damage</div>
                            </div>
                        ))}
                    </div>

                    {/* Col Bonuses (Bottom Side) */}
                    <div className="absolute -bottom-24 left-8 right-32 flex justify-between px-2">
                        {grid.colBonuses.map((bonus, i) => (
                             <div key={bonus.id} className={`w-20 h-20 border flex flex-col items-center justify-center rounded transition-all ${bonus.unlocked ? 'bg-cyan-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(8,145,178,0.6)]' : 'bg-black/40 border-slate-800 text-slate-600'}`}>
                                <div className="text-[8px] font-bold tracking-widest uppercase mb-1">COL {i+1}</div>
                                <div className="text-xl font-black">+{bonus.armorBonus}</div>
                                <div className="text-[8px] uppercase">Armor</div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Tooltip */}
                 <div className="mt-32 h-24 w-full max-w-2xl bg-slate-900 border border-green-900 flex items-center justify-center relative z-20 shadow-xl">
                     {hoveredNode ? (
                         <div className="flex gap-8 items-center animate-fadeIn px-8 w-full justify-between">
                             <div className="text-left">
                                 <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">TARGET SPECIES</div>
                                 <div className="text-xl font-black uppercase text-green-400">
                                     {hoveredNode.targetEnemy}
                                 </div>
                             </div>
                             
                             <div className="h-12 w-px bg-slate-700"></div>

                             <div className="text-center">
                                 <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">DAMAGE AMPLIFICATION</div>
                                 <div className="text-3xl font-mono text-white">
                                     +{Math.round(hoveredNode.damageBonus * 100)}%
                                 </div>
                             </div>

                             <div className="h-12 w-px bg-slate-700"></div>

                             <div className="text-right">
                                 <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">ANALYSIS COST</div>
                                 <div className={`text-2xl font-mono font-bold ${hoveredNode.purchased ? 'text-green-500' : state.player.score >= hoveredNode.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                                     {hoveredNode.purchased ? 'COMPLETE' : `${hoveredNode.cost} SCRAPS`}
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="text-slate-600 font-mono text-sm tracking-widest animate-pulse">
                             HOVER OVER A DATA NODE TO VIEW DETAILS
                         </div>
                     )}
                 </div>

            </div>
        </div>
    );
};
