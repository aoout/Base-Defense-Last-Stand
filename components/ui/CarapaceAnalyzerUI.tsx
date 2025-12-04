
import React, { useState, useRef, useEffect } from 'react';
import { GameState, CarapaceNode, EnemyType } from '../../types';
import { ModuleWindow } from './ModuleWindow';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper } from '../../utils/renderers';

interface CarapaceAnalyzerUIProps {
    state: GameState;
    onPurchase: (row: number, col: number) => void;
    onClose: () => void;
    t: (key: string, params?: any) => string;
}

const EnemyPreview: React.FC<{ type: EnemyType }> = ({ type }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const render = (time: number) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            
            const w = canvasRef.current.width;
            const h = canvasRef.current.height;
            
            ctx.clearRect(0, 0, w, h);
            
            // Mock Enemy for Rendering
            const e: any = {
                x: w/2,
                y: h/2,
                angle: -Math.PI/2, // Facing up
                radius: 20, // Base scale
                color: '#fff', // Fallback
                type: type,
                // Add minimal required props for renderers to avoid crashes
                hp: 100, maxHp: 100
            };

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle);
            
            // Adjust scale based on enemy type to fit the large box nicely
            let scale = 3.5; // Larger scale for the main preview
            if (type === EnemyType.TANK) scale = 2.5;
            if (type === EnemyType.GRUNT) scale = 4.0;
            if (type === EnemyType.VIPER) scale = 3.0;
            if (type === EnemyType.KAMIKAZE) scale = 3.5;
            
            ctx.scale(scale, scale);

            switch(type) {
                case EnemyType.GRUNT: drawGrunt(ctx, e, time); break;
                case EnemyType.RUSHER: drawRusher(ctx, e, time); break;
                case EnemyType.TANK: drawTank(ctx, e, time); break;
                case EnemyType.KAMIKAZE: drawKamikaze(ctx, e, time); break;
                case EnemyType.VIPER: drawViper(ctx, e, time); break;
            }
            
            ctx.restore();
            requestRef.current = requestAnimationFrame(render);
        };
        requestRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(requestRef.current);
    }, [type]);

    return <canvas ref={canvasRef} width={300} height={300} className="w-full h-full object-contain" />;
};

export const CarapaceAnalyzerUI: React.FC<CarapaceAnalyzerUIProps> = ({ state, onPurchase, onClose, t }) => {
    const grid = state.spaceship.carapaceGrid;
    const [hoveredNode, setHoveredNode] = useState<CarapaceNode | null>(null);

    if (!grid) return null;

    // Calculate Totals (Directly in render to ensure fresh data from mutable state)
    let spent = 0;
    let armor = 0;
    let globalDmg = 0;
    const enemyBonuses: Record<string, number> = {};

    // Init all types to 0
    Object.values(EnemyType).forEach(type => enemyBonuses[type] = 0);

    // Nodes
    grid.nodes.flat().forEach(node => {
        if (node.purchased) {
            spent += node.cost;
            enemyBonuses[node.targetEnemy] += node.damageBonus;
        }
    });

    // Bonuses
    grid.rowBonuses.forEach(r => { if (r.unlocked) globalDmg += r.damageBonus; });
    grid.colBonuses.forEach(c => { if (c.unlocked) armor += c.armorBonus; });

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

    const headerRight = (
        <div className="flex flex-col items-end mr-16">
            <div className="text-green-500 text-[10px] font-bold tracking-widest uppercase mb-1">{t('AVAILABLE_FUNDS')}</div>
            <div className="text-3xl font-mono text-yellow-400 font-bold">{Math.floor(state.player.score)} <span className="text-sm text-yellow-600">{t('SCRAPS')}</span></div>
        </div>
    );

    return (
        <ModuleWindow
            title={`${t('XENO_TITLE')} ${t('ANALYSIS')}`}
            subtitle={t('WEAKNESS_MATRIX')}
            theme="emerald"
            onClose={onClose}
            headerRight={headerRight}
            maxWidth="max-w-[1350px]"
        >
             <div className="flex flex-1 gap-8 min-h-0">
                
                {/* LEFT COLUMN: Summary Stats */}
                <div className="w-72 flex flex-col gap-4 shrink-0">
                    <div className="bg-black/40 border border-emerald-900/30 p-6 rounded-lg">
                        <h3 className="text-emerald-400 font-bold tracking-widest text-sm border-b border-emerald-900/50 pb-2 mb-4">{t('XENO_STATS')}</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>{t('TOTAL_INVESTMENT')}</span>
                                    <span className="text-yellow-400 font-mono">{spent}</span>
                                </div>
                                <div className="w-full h-1 bg-slate-800 rounded overflow-hidden"><div className="h-full bg-yellow-600" style={{width: '100%'}}></div></div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-slate-900 p-2 border border-slate-700 text-center rounded">
                                    <div className="text-[10px] text-slate-500">{t('GLOBAL_DMG')}</div>
                                    <div className="text-emerald-400 font-bold text-lg">+{Math.round(globalDmg * 100)}%</div>
                                </div>
                                <div className="bg-slate-900 p-2 border border-slate-700 text-center rounded">
                                    <div className="text-[10px] text-slate-500">{t('COL_BONUS_ARMOR')}</div>
                                    <div className="text-cyan-400 font-bold text-lg">+{armor}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-black/40 border border-emerald-900/30 p-6 rounded-lg overflow-y-auto">
                        <h3 className="text-slate-300 font-bold tracking-widest text-xs border-b border-slate-700 pb-2 mb-4">{t('BONUS_BREAKDOWN')}</h3>
                        <div className="space-y-3">
                            {Object.entries(enemyBonuses).map(([type, bonus]: [string, number]) => (
                                <div key={type} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded">{renderEnemyIcon(type as EnemyType)}</div>
                                        <span className="text-xs text-slate-400 font-bold">{t(`ENEMY_${type}_NAME`)}</span>
                                    </div>
                                    <span className={`font-mono text-sm font-bold ${bonus > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        +{Math.round(bonus * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: The Grid (Unified Layout) */}
                <div className="flex-1 bg-black/20 border border-emerald-900/20 rounded-xl relative flex items-center justify-center p-8">
                    {/* Grid Container */}
                    <div className="grid grid-cols-5 gap-3">
                        
                        {/* Rows 0-3: Nodes + Row Bonus */}
                        {grid.nodes.map((row, rIndex) => (
                            <React.Fragment key={rIndex}>
                                {/* 4 Nodes */}
                                {row.map((node, cIndex) => {
                                    const isAffordable = state.player.score >= node.cost;
                                    const bgClass = node.purchased 
                                        ? 'bg-emerald-900/50 border-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                                        : isAffordable
                                            ? 'bg-slate-900/80 border-slate-600 hover:border-emerald-400 hover:bg-slate-800 cursor-pointer'
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
                                            {node.purchased && <div className="absolute bottom-1 right-2 text-emerald-500 text-xs">✓</div>}
                                        </div>
                                    )
                                })}

                                {/* 5th Column: Row Bonus */}
                                <div className={`w-24 h-24 border-l-4 flex flex-col items-center justify-center rounded-r transition-all ml-2
                                    ${grid.rowBonuses[rIndex].unlocked 
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                                        : 'bg-black/40 border-slate-800 text-slate-700'
                                    }`}
                                >
                                    <div className="text-[9px] font-bold tracking-widest uppercase mb-1">{t('ROW_BONUS', {0: rIndex+1})}</div>
                                    <div className="text-lg font-black">+{Math.round(grid.rowBonuses[rIndex].damageBonus * 100)}%</div>
                                    <div className="text-[8px] uppercase">{t('GLOBAL_DMG')}</div>
                                </div>
                            </React.Fragment>
                        ))}

                        {/* Row 4: Column Bonuses + Empty Corner */}
                        {/* 4 Col Bonuses */}
                        {grid.colBonuses.map((bonus, i) => (
                            <div key={bonus.id} className={`w-24 h-24 border-t-4 flex flex-col items-center justify-center rounded-b transition-all mt-2
                                ${bonus.unlocked 
                                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' 
                                    : 'bg-black/40 border-slate-800 text-slate-700'
                                }`}
                            >
                                <div className="text-[8px] font-bold tracking-widest uppercase mb-1">{t('COL_BONUS_LABEL')} {i+1}</div>
                                <div className="text-xl font-black">+{bonus.armorBonus}</div>
                                <div className="text-[8px] uppercase">{t('COL_BONUS_ARMOR')}</div>
                            </div>
                        ))}

                        {/* Empty Corner Slot */}
                        <div className="w-24 h-24 flex items-center justify-center opacity-20">
                            <div className="text-6xl text-slate-800">✛</div>
                        </div>

                    </div>
                </div>

                {/* RIGHT COLUMN: Details / Tooltip */}
                <div className="w-80 bg-slate-900 border border-emerald-900/50 p-0 flex flex-col shrink-0 relative overflow-hidden rounded-lg">
                    {/* Decorative scanline */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
                    
                    {hoveredNode ? (
                        <div className="flex flex-col h-full animate-fadeIn">
                            {/* Visual Preview Header */}
                            <div className="bg-black/60 relative h-64 border-b border-emerald-800 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(34,197,94,0.1)_0%,transparent_70%)]"></div>
                                <div className="relative z-10 w-full h-full">
                                    <EnemyPreview type={hoveredNode.targetEnemy} />
                                </div>
                                <div className="absolute bottom-2 right-2 text-xs font-mono text-emerald-500 font-bold bg-black/80 px-2 rounded">
                                    MODEL: {t(`ENEMY_${hoveredNode.targetEnemy}_NAME`)}
                                </div>
                            </div>

                            <div className="p-6 flex-1 space-y-6">
                                <div>
                                    <div className="text-2xl text-white font-black uppercase tracking-tight">{t(`ENEMY_${hoveredNode.targetEnemy}_NAME`)}</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-widest mb-4">{t(`ENEMY_${hoveredNode.targetEnemy}_CLASS`)}</div>
                                </div>

                                <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded">
                                    <div className="text-xs text-slate-500 font-bold tracking-widest mb-1">{t('DMG_AMP')}</div>
                                    <div className="text-5xl font-mono text-white font-bold tracking-tighter">
                                        +{Math.round(hoveredNode.damageBonus * 100)}%
                                    </div>
                                    <div className="text-[10px] text-emerald-600 mt-1">APPLIES TO ALL WEAPONS</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 font-bold tracking-widest mb-2">{t('ANALYSIS_COST')}</div>
                                    <div className={`text-3xl font-mono font-bold ${hoveredNode.purchased ? 'text-emerald-500' : state.player.score >= hoveredNode.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                                        {hoveredNode.purchased ? t('COMPLETE_BTN') : `${hoveredNode.cost}`}
                                    </div>
                                    {!hoveredNode.purchased && <div className="text-[10px] text-slate-600">SCRAPS REQUIRED</div>}
                                </div>
                                
                                <div className="text-[10px] text-slate-500 leading-relaxed font-mono border-t border-slate-800 pt-4">
                                    {t(`ENEMY_${hoveredNode.targetEnemy}_DESC`)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                            <div className="text-6xl opacity-20 animate-pulse">✛</div>
                            <div className="font-mono text-sm tracking-widest">{t('IDLE_ANALYSIS')}</div>
                            <div className="text-[10px] text-center max-w-[200px]">{t('HOVER_DATA')}</div>
                        </div>
                    )}
                </div>

             </div>
        </ModuleWindow>
    );
};
