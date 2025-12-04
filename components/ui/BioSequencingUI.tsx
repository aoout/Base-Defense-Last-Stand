
import React, { useState, useEffect, useRef } from 'react';
import { GameState, BioResource, BioBuffType, BioTask, EnemyType } from '../../types';
import { ModuleWindow } from './ModuleWindow';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper } from '../../utils/renderers';

interface BioSequencingUIProps {
    state: GameState;
    onClose: () => void;
    onConductResearch: () => void;
    onUnlockNode: (id: number) => void;
    onAcceptTask: (id: string) => void;
    onAbortTask: (id: string) => void; 
    t: (key: string, params?: any) => string;
}

// Reusable Enemy Preview Component
const EnemyPreview: React.FC<{ type: EnemyType, size?: number }> = ({ type, size = 100 }) => {
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
                radius: 15, 
                color: '#fff', 
                type: type,
                hp: 100, maxHp: 100
            };

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle);
            
            // Scale based on size prop to keep it fitting
            let scale = size / 40; 
            if (type === EnemyType.TANK) scale *= 0.8;
            
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
    }, [type, size]);

    return <canvas ref={canvasRef} width={size} height={size} />;
};

export const BioSequencingUI: React.FC<BioSequencingUIProps> = ({ state, onClose, onConductResearch, onUnlockNode, onAcceptTask, onAbortTask, t }) => {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);
    const s = state.spaceship;
    
    // Auto-generate if missing (safety check)
    useEffect(() => {
        if (!s.bioNodes || s.bioNodes.length === 0) {
            // This assumes the parent component triggers generation or engine handles it.
        }
    }, [s.bioNodes]);

    // Calculate Total Buffs
    const totalBuffs: Record<string, number> = {};
    if (s.bioNodes) {
        s.bioNodes.forEach(node => {
            if (node.isUnlocked) {
                totalBuffs[node.buffType] = (totalBuffs[node.buffType] || 0) + node.buffValue;
            }
        });
    }

    if (!s.bioNodes) return null;

    const resources = s.bioResources || { [BioResource.ALPHA]: 0, [BioResource.BETA]: 0, [BioResource.GAMMA]: 0 };

    const getBuffText = (type: BioBuffType, val: number) => {
        const valStr = type === BioBuffType.GENE_REDUCTION ? val.toFixed(2) : Math.round(val * 100);
        return t(`BIO_BUFF_${type}`, {0: valStr});
    };

    const getNodeColor = (type: BioBuffType) => {
        switch(type) {
            case BioBuffType.ALLY_HP: return '#60a5fa'; // Blue-400
            case BioBuffType.ALLY_DMG: return '#f87171'; // Red-400
            case BioBuffType.LURE_BONUS: return '#facc15'; // Yellow-400
            case BioBuffType.GENE_REDUCTION: return '#4ade80'; // Green-400
            case BioBuffType.ALPHA_YIELD: return '#22d3ee'; // Cyan-400
            case BioBuffType.BETA_YIELD: return '#fb923c'; // Orange-400
            case BioBuffType.GAMMA_YIELD: return '#c084fc'; // Purple-400
            default: return '#94a3b8';
        }
    };

    const getNodeSymbol = (type: BioBuffType) => {
        switch(type) {
            case BioBuffType.ALLY_HP: return '♥';
            case BioBuffType.ALLY_DMG: return '⚔';
            case BioBuffType.LURE_BONUS: return '$';
            case BioBuffType.GENE_REDUCTION: return '🧬';
            case BioBuffType.ALPHA_YIELD: return 'α';
            case BioBuffType.BETA_YIELD: return 'β';
            case BioBuffType.GAMMA_YIELD: return 'γ';
            default: return '?';
        }
    };

    const renderHex = (x: number, y: number, r: number) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            points.push(`${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`);
        }
        return points.join(' ');
    };

    const activeTask = s.activeBioTask;

    const headerRight = (
        <div className="flex flex-col items-end mr-16">
            <div className="text-xs text-purple-400 font-bold mb-1 tracking-widest">{t('AVAILABLE_FUNDS')}</div>
            <div className="text-3xl font-mono text-white font-bold">{Math.floor(state.player.score)} <span className="text-sm text-purple-500">SCRAPS</span></div>
        </div>
    );

    return (
        <ModuleWindow
            title={t('BIO_TITLE')}
            subtitle={t('BIO_SUB')}
            theme="purple"
            onClose={onClose}
            headerRight={headerRight}
            maxWidth="max-w-[1350px]"
        >
            <div className="flex flex-1 gap-6 min-h-0 w-full h-full">
                
                {/* Left: Research & Stats Console */}
                <div className="w-72 flex flex-col gap-4 shrink-0">
                    {/* Compact Resource Monitor */}
                    <div className="bg-black/60 border border-purple-900/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-purple-400 font-bold text-xs tracking-widest">{t('BIO_RESOURCES')}</h3>
                            <div className="text-[10px] text-slate-500 font-mono">RES_ID: 99</div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center bg-slate-800/50 px-2 py-1 rounded border border-cyan-900/30">
                                <span className="text-cyan-400 text-xs font-black">α ALPHA</span>
                                <span className="text-sm font-mono text-white">{resources[BioResource.ALPHA]}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 px-2 py-1 rounded border border-orange-900/30">
                                <span className="text-orange-400 text-xs font-black">β BETA</span>
                                <span className="text-sm font-mono text-white">{resources[BioResource.BETA]}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 px-2 py-1 rounded border border-purple-900/30">
                                <span className="text-purple-400 text-xs font-black">γ GAMMA</span>
                                <span className="text-sm font-mono text-white">{resources[BioResource.GAMMA]}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onConductResearch}
                            disabled={state.player.score < 1000}
                            className={`w-full mt-3 py-2 font-bold tracking-widest text-[10px] uppercase border transition-all
                                ${state.player.score >= 1000 
                                    ? 'bg-purple-700 border-purple-500 text-white hover:bg-purple-600 shadow-[0_0_10px_rgba(192,132,252,0.3)]' 
                                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}
                            `}
                        >
                            {t('BIO_RESEARCH_BTN')} ({t('BIO_COST')})
                        </button>
                    </div>

                    {/* Total Stats Panel */}
                    <div className="flex-1 bg-purple-950/20 border border-purple-900/50 p-4 flex flex-col rounded-lg overflow-hidden">
                        <h3 className="text-white font-bold mb-3 text-xs tracking-widest border-b border-purple-800 pb-2">{t('ACTIVE_SYSTEMS')}</h3>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-purple-900">
                            {Object.keys(totalBuffs).length === 0 && <div className="text-slate-500 text-[10px] italic">{t('NO_MODULES')}</div>}
                            {Object.entries(totalBuffs).map(([key, val]) => {
                                const type = key as BioBuffType;
                                const v = val as number;
                                return (
                                    <div key={type} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span style={{color: getNodeColor(type)}}>{getNodeSymbol(type)}</span>
                                            <span className="text-slate-300 font-bold text-[10px]">{t(`BIO_BUFF_${type}`, {0: ''}).split('+')[0].trim()}</span>
                                        </div>
                                        <span className="text-white font-mono font-bold bg-slate-900/50 px-1 rounded">
                                            +{type === BioBuffType.GENE_REDUCTION ? v.toFixed(2) : Math.round(v * 100) + '%'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Center: Grid */}
                <div className="flex-1 bg-[#020617] border-2 border-slate-800 rounded-lg relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
                    {/* Subtle Grid Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" 
                            style={{backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                    </div>
                    
                    <div className="absolute top-4 left-4 text-[10px] text-purple-400 font-bold tracking-widest bg-black/80 px-3 py-1 border border-purple-900 rounded">{t('BIO_GRID')}</div>
                    
                    {/* Tooltip / Info Panel */}
                    {hoveredNode !== null && (
                        <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-purple-500 p-4 rounded-lg z-20 w-80 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fadeIn">
                            {(() => {
                                const node = s.bioNodes.find(n => n.id === hoveredNode);
                                if (!node) return null;
                                const isAffordable = resources[BioResource.ALPHA] >= node.cost[BioResource.ALPHA] &&
                                                        resources[BioResource.BETA] >= node.cost[BioResource.BETA] &&
                                                        resources[BioResource.GAMMA] >= node.cost[BioResource.GAMMA];
                                
                                const isReachable = node.id === 0 || node.connections.some(cid => {
                                    const neighbor = s.bioNodes.find(n => n.id === cid);
                                    return neighbor && neighbor.isUnlocked;
                                });

                                const buffColor = getNodeColor(node.buffType);

                                return (
                                    <>
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                                            <div className={`font-bold text-sm ${node.isUnlocked ? 'text-white' : isReachable ? 'text-purple-400' : 'text-slate-500'}`}>
                                                {node.id === 0 ? t('BIO_CENTER_NODE') : node.isUnlocked ? 'SEQUENCE ACTIVE' : t('BIO_LOCKED_NODE')}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">ID: {node.id.toString().padStart(3, '0')}</div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mb-4 bg-slate-800/50 p-2 rounded border border-slate-700">
                                            <div className="text-2xl" style={{color: buffColor}}>{getNodeSymbol(node.buffType)}</div>
                                            <div className="text-xs text-white font-bold leading-tight">
                                                {getBuffText(node.buffType, node.buffValue)}
                                            </div>
                                        </div>

                                        {!node.isUnlocked && (
                                            <div className="space-y-1 text-[10px] mb-4 font-mono bg-black/60 p-3 rounded border border-slate-800">
                                                <div className="flex justify-between border-b border-slate-700 pb-1 mb-1">
                                                    <span className="text-slate-400 font-bold">REQUIRED</span>
                                                    <span className="text-slate-400 font-bold">CURRENT</span>
                                                </div>
                                                {Object.values(BioResource).map(res => {
                                                    const cost = node.cost[res];
                                                    if (cost === 0) return null;
                                                    const hasEnough = resources[res] >= cost;
                                                    let label = res === BioResource.ALPHA ? 'α' : res === BioResource.BETA ? 'β' : 'γ';
                                                    let color = res === BioResource.ALPHA ? 'text-cyan-400' : res === BioResource.BETA ? 'text-orange-400' : 'text-purple-400';
                                                    
                                                    return (
                                                        <div key={res} className="flex justify-between items-center">
                                                            <span className={`${color} font-bold`}>{label} {cost}</span>
                                                            <span className={hasEnough ? 'text-green-400' : 'text-red-500'}>{resources[res]}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {node.isUnlocked ? (
                                            <div className="text-green-400 text-xs font-bold text-center border border-green-500/50 bg-green-900/20 py-3 rounded tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                                STATUS: ONLINE
                                            </div>
                                        ) : isReachable ? (
                                            <button 
                                                disabled={!isAffordable}
                                                onClick={() => onUnlockNode(node.id)}
                                                className={`w-full py-3 text-xs font-bold tracking-widest border transition-all relative overflow-hidden group
                                                    ${isAffordable 
                                                        ? 'bg-purple-600 text-white border-purple-400 hover:bg-purple-500 shadow-[0_0_20px_rgba(192,132,252,0.4)] animate-pulse' 
                                                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
                                                `}
                                            >
                                                {isAffordable ? t('BIO_UNLOCK_BTN') : t('BIO_INSUFFICIENT_RES')}
                                            </button>
                                        ) : (
                                            <div className="text-slate-500 text-xs italic text-center border border-slate-700 p-3 bg-slate-900/50">
                                                LINK UNAVAILABLE
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    <svg width="100%" height="100%" viewBox="-400 -300 800 600" preserveAspectRatio="xMidYMid meet" className="drop-shadow-2xl">
                        <defs>
                            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                            <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Connections Layer */}
                        {s.bioNodes.map(node => {
                            return node.connections.map(targetId => {
                                if (targetId < node.id) return null; // Avoid duplicate lines
                                const target = s.bioNodes.find(n => n.id === targetId);
                                if (!target) return null;
                                
                                const size = 45; // Spacing multiplier
                                const x1 = size * (1.5 * node.q);
                                const y1 = size * (Math.sqrt(3)/2 * node.q + Math.sqrt(3) * node.r);
                                const x2 = size * (1.5 * target.q);
                                const y2 = size * (Math.sqrt(3)/2 * target.q + Math.sqrt(3) * target.r);
                                
                                const bothUnlocked = node.isUnlocked && target.isUnlocked;
                                const oneUnlocked = node.isUnlocked || target.isUnlocked;
                                
                                // Highlight logic
                                const isHovered = hoveredNode === node.id || hoveredNode === target.id;

                                return (
                                    <line 
                                        key={`conn-${node.id}-${target.id}`} 
                                        x1={x1} y1={y1} x2={x2} y2={y2} 
                                        stroke={bothUnlocked ? (isHovered ? '#fff' : '#c084fc') : oneUnlocked ? '#64748b' : '#334155'} 
                                        strokeWidth={bothUnlocked ? 3 : 1}
                                        opacity={bothUnlocked ? 1 : oneUnlocked ? 0.6 : 0.2}
                                        filter={bothUnlocked ? "url(#lineGlow)" : undefined}
                                        className="transition-all duration-300"
                                        pointerEvents="none"
                                    />
                                );
                            });
                        })}

                        {/* Nodes Layer */}
                        {s.bioNodes.map(node => {
                            const size = 45;
                            const x = size * (1.5 * node.q);
                            const y = size * (Math.sqrt(3)/2 * node.q + Math.sqrt(3) * node.r);
                            const r = 18; // Hex radius
                            
                            const isReachable = node.id === 0 || node.connections.some(cid => {
                                const neighbor = s.bioNodes.find(n => n.id === cid);
                                return neighbor && neighbor.isUnlocked;
                            });

                            const color = getNodeColor(node.buffType);
                            const isHovered = hoveredNode === node.id;

                            // Style calculation
                            let fill = '#0f172a';
                            let stroke = '#334155';
                            let strokeWidth = 1;
                            let glow = false;
                            let textColor = '#475569';

                            if (node.isUnlocked) {
                                fill = color; 
                                stroke = '#fff';
                                strokeWidth = 2;
                                glow = true;
                                textColor = '#fff';
                            } else if (isReachable) {
                                fill = '#1e293b';
                                stroke = color;
                                strokeWidth = 2;
                                textColor = color;
                            }

                            return (
                                <g 
                                    key={node.id} 
                                    onClick={() => onUnlockNode(node.id)}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className="cursor-pointer transition-all duration-300"
                                    filter={glow || isHovered ? "url(#nodeGlow)" : undefined}
                                >
                                    {/* Hitbox for stability */}
                                    <circle cx={x} cy={y} r={r * 1.5} fill="transparent" />

                                    {/* Interaction Halo */}
                                    {isHovered && <circle cx={x} cy={y} r={r + 10} fill="rgba(255,255,255,0.1)" pointerEvents="none" />}
                                    
                                    {/* Reachable Pulse Animation */}
                                    {!node.isUnlocked && isReachable && (
                                        <circle cx={x} cy={y} r={r + 5} stroke={color} strokeWidth="1" fill="none" opacity="0.5" pointerEvents="none">
                                            <animate attributeName="r" values={`${r};${r+8};${r}`} dur="2s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                    )}

                                    <path 
                                        d={renderHex(x, y, r)} 
                                        fill={fill} 
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                        opacity={node.isUnlocked || isReachable ? 1 : 0.4}
                                        pointerEvents="none"
                                    />
                                    
                                    {/* Buff Icon/Symbol */}
                                    <text 
                                        x={x} y={y} dy="0.35em" 
                                        textAnchor="middle" 
                                        fill={textColor} 
                                        fontSize="14px" 
                                        fontWeight="bold"
                                        className="pointer-events-none select-none"
                                    >
                                        {getNodeSymbol(node.buffType)}
                                    </text>
                                </g>
                            )
                        })}
                    </svg>
                </div>

                {/* Right: Task Board */}
                <div className="w-80 flex flex-col shrink-0">
                    <div className="bg-slate-900/80 border border-slate-700 flex-1 p-6 overflow-y-auto rounded-lg">
                        <h3 className="text-white font-bold tracking-widest text-sm mb-6 border-b border-slate-700 pb-2">{t('BIO_TASKS')}</h3>
                        
                        {activeTask ? (
                            <div className="bg-purple-950/40 border border-purple-500/50 p-4 rounded animate-fadeIn relative overflow-hidden flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="text-purple-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                        {t('BIO_TASK_ACTIVE')}
                                    </div>
                                    <div className="w-20 h-20 border border-purple-500/30 bg-black/50 rounded flex items-center justify-center relative overflow-hidden">
                                        <EnemyPreview type={activeTask.targetEnemy} size={80} />
                                    </div>
                                </div>

                                <div className="text-white font-bold text-sm leading-relaxed">
                                    {t('BIO_TASK_DESC', {0: activeTask.count, 1: t(`ENEMY_${activeTask.targetEnemy}_NAME`)})}
                                </div>
                                
                                <div>
                                    <div className="mb-1 flex justify-between text-xs text-slate-400 font-mono">
                                        <span>{t('BIO_TASK_PROGRESS')}</span>
                                        <span className="text-white">{activeTask.progress} / {activeTask.count}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded overflow-hidden border border-slate-700">
                                        <div className="h-full bg-purple-500 transition-all duration-500" style={{width: `${Math.min(100, (activeTask.progress / activeTask.count) * 100)}%`}}></div>
                                    </div>
                                </div>

                                <div className="text-xs text-yellow-400 font-mono border-t border-purple-900/30 pt-2 flex justify-between items-center">
                                    <span>REWARD:</span>
                                    <span className="font-bold bg-yellow-900/20 px-2 py-1 rounded border border-yellow-700/30">+{activeTask.rewardAmount} {t(`BIO_RES_${activeTask.rewardResource}`)}</span>
                                </div>

                                <button onClick={() => onAbortTask(activeTask.id)} className="w-full py-2 border border-red-900/50 text-red-500 hover:bg-red-900/20 text-xs font-bold transition-colors uppercase tracking-wider">
                                    {t('BIO_ABORT')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {s.bioTasks.length === 0 && <div className="text-slate-500 text-xs italic text-center py-8">{t('BIO_NO_TASKS')}</div>}
                                {s.bioTasks.map(task => (
                                    <div key={task.id} className="bg-black/40 border border-slate-700 p-3 hover:border-slate-500 transition-colors group relative flex flex-col gap-3">
                                        <div className="flex gap-3">
                                            <div className="w-16 h-16 bg-slate-900 border border-slate-600 rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                                <EnemyPreview type={task.targetEnemy} size={64} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white text-xs font-bold mb-1 leading-tight">
                                                    {t('BIO_TASK_DESC', {0: task.count, 1: t(`ENEMY_${task.targetEnemy}_NAME`)})}
                                                </div>
                                                <div className="text-[10px] text-yellow-500 font-mono">
                                                    {t('BIO_REWARD', {0: task.rewardAmount, 1: t(`BIO_RES_${task.rewardResource}`)})}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => onAcceptTask(task.id)}
                                            className="w-full py-1.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase hover:bg-purple-700 hover:text-white transition-all border border-slate-700 hover:border-purple-500"
                                        >
                                            {t('BIO_ACCEPT')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ModuleWindow>
    );
};
