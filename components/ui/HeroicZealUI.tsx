
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { HeroicNode, HeroicUpgradeType, AppMode } from '../../types';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CloseButton } from './Shared';
import { Icons } from './Icons';

// Constants for the new visual layout
const NODE_SIZE = 48; // Slightly larger for better icon visibility
const CANVAS_WIDTH = 800; 
const Y_SCALE = 120; 
const X_SCALE = 100; 

// --- SVG ICONS MAPPED FROM ICONS.TSX OR LOCAL FALLBACKS FOR SPECIFIC HEROIC TYPES ---
// Since Icons.tsx has generic icons, we map logical types to visual metaphors
const HeroicIcons: Record<HeroicUpgradeType, React.ReactNode> = {
    [HeroicUpgradeType.MAX_HP]: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
    [HeroicUpgradeType.MAX_ARMOR]: <Icons.Lock />, // Reuse Lock for Armor/Defense metaphor
    [HeroicUpgradeType.DAMAGE]: <Icons.Hazard />, // Reuse Hazard for Damage
    [HeroicUpgradeType.MOVE_SPEED]: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, // Bolt
    [HeroicUpgradeType.RELOAD_SPEED]: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1 2.12-9.36L23 10"/></svg>, // Refresh
    [HeroicUpgradeType.TURRET_MASTERY]: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L8 6h3v10H8v4h8v-4h-3V6h3L12 2z"/><rect x="4" y="20" width="16" height="2"/></svg> // Turret Base
};

export const HeroicZealUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const s = state.spaceship;
    
    // --- Scroll State ---
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<HeroicNode | null>(null);
    
    // Auto-generate if missing
    useEffect(() => {
        engine.spaceshipManager.generateHeroicGrid();
    }, [engine]);

    // Calculate Render Positions
    const layout = useMemo(() => {
        if (!s.heroicNodes || s.heroicNodes.length === 0) return { height: 0, nodes: [] };
        
        const minY = Math.min(...s.heroicNodes.map(n => n.y));
        const height = Math.abs(minY) * Y_SCALE + 600;

        return {
            height,
            nodes: s.heroicNodes.map(n => ({
                ...n,
                renderX: (CANVAS_WIDTH / 2) + (n.x * X_SCALE),
                renderY: height - (Math.abs(n.y) * Y_SCALE) - 200
            }))
        };
    }, [s.heroicNodes]);

    // Scroll to bottom on open
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [layout.height]);

    // --- Stats ---
    const stats = useMemo(() => {
        if (!s.heroicNodes || s.heroicNodes.length === 0) return { progress: 0, totalCost: 0, dmg: 0, hp: 0 };
        const purchased = s.heroicNodes.filter(n => n.purchased);
        return {
            progress: Math.floor((purchased.length / s.heroicNodes.length) * 100),
            totalCost: purchased.reduce((a, b) => a + b.cost, 0),
            dmg: purchased.filter(n => n.type === HeroicUpgradeType.DAMAGE).reduce((a, b) => a + b.value, 0),
            hp: purchased.filter(n => n.type === HeroicUpgradeType.MAX_HP).reduce((a, b) => a + b.value, 0)
        };
    }, [s.heroicNodes]);

    const handlePurchase = (id: number) => {
        engine.spaceshipManager.purchaseHeroicNode(id);
    };

    const handleClose = () => {
        engine.sessionManager.setMode(AppMode.GAMEPLAY);
    }

    const getNodeColorKey = (type: HeroicUpgradeType) => {
        switch(type) {
            case HeroicUpgradeType.MAX_HP: return 'red';
            case HeroicUpgradeType.MAX_ARMOR: return 'blue';
            case HeroicUpgradeType.DAMAGE: return 'amber';
            case HeroicUpgradeType.MOVE_SPEED: return 'emerald';
            case HeroicUpgradeType.RELOAD_SPEED: return 'cyan';
            case HeroicUpgradeType.TURRET_MASTERY: return 'purple';
            default: return 'slate';
        }
    };

    // Helper to get hex for SVG lines
    const getHexColor = (colorKey: string) => {
        switch(colorKey) {
            case 'red': return '#ef4444';
            case 'blue': return '#3b82f6';
            case 'amber': return '#f59e0b';
            case 'emerald': return '#10b981';
            case 'cyan': return '#06b6d4';
            case 'purple': return '#a855f7';
            default: return '#64748b';
        }
    };

    return (
        <div className="absolute inset-0 bg-[#050505] z-[200] overflow-hidden font-mono select-none flex pointer-events-auto">
            
            {/* LEFT PANEL: Summary & Stats */}
            <div className="w-80 bg-[#0a0a0a] border-r border-slate-800 p-8 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.8)] relative">
                {/* Tech Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(0deg,transparent_50%,#fff_50%)] bg-[size:100%_4px]"></div>

                <div className="mb-8 relative">
                    <h1 className="text-4xl font-display font-black text-white tracking-widest uppercase mb-1 leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{t('HEROIC_TITLE')}</h1>
                    <div className="text-[10px] text-red-500 font-bold tracking-[0.3em] uppercase bg-red-950/30 inline-block px-2 py-1 border border-red-900/50">{t('HEROIC_SUB')}</div>
                </div>

                <div className="flex-1 space-y-6">
                    {/* Funds Card */}
                    <div className="bg-slate-900/50 border border-slate-700 p-5 rounded-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl font-black group-hover:opacity-20 transition-opacity">§</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-wider">{t('AVAILABLE_FUNDS')}</div>
                        <div className="text-3xl font-mono font-bold text-yellow-400 tabular-nums">{Math.floor(state.player.score)}</div>
                        <div className="text-[10px] text-yellow-700 font-bold mt-1">BIOMASS UNITS</div>
                    </div>

                    {/* Progress Circle */}
                    <div className="bg-slate-900/50 border border-slate-700 p-5 rounded-sm flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">{t('HEROIC_PROGRESS')}</div>
                            <div className="text-2xl font-mono font-bold text-white">{stats.progress}%</div>
                        </div>
                        <div className="w-12 h-12 relative flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="none" />
                                <circle cx="24" cy="24" r="20" stroke="#ef4444" strokeWidth="4" fill="none" strokeDasharray={`${stats.progress * 1.25} 125`} strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-6">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">SEQUENCED TRAITS</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-red-900/20 border border-red-900 flex items-center justify-center text-red-500">{HeroicIcons[HeroicUpgradeType.DAMAGE]}</div>
                                    <span className="text-xs text-slate-400 font-bold group-hover:text-red-400 transition-colors">FATAL DAMAGE</span>
                                </div>
                                <span className="text-white font-mono text-sm font-bold">+{Math.round(stats.dmg * 100)}%</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-900/20 border border-blue-900 flex items-center justify-center text-blue-500">{HeroicIcons[HeroicUpgradeType.MAX_HP]}</div>
                                    <span className="text-xs text-slate-400 font-bold group-hover:text-blue-400 transition-colors">VITALITY</span>
                                </div>
                                <span className="text-white font-mono text-sm font-bold">+{stats.hp}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleClose} className="mt-8 py-4 bg-slate-900 border border-slate-600 hover:bg-slate-800 hover:border-white text-white font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3 group">
                    <span className="group-hover:-translate-x-1 transition-transform">«</span>
                    {t('RETURN_BRIDGE')}
                </button>
            </div>

            {/* CENTER: The Ascension Spire */}
            <div className="flex-1 relative bg-black overflow-hidden flex justify-center perspective-[1000px]">
                {/* Background Atmosphere */}
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,20,30,1)_0%,rgba(0,0,0,1)_100%)]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_40px]"></div>
                    {/* Center Beam */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-red-900/50 to-transparent"></div>
                </div>

                <div ref={containerRef} className="w-full h-full overflow-y-auto scrollbar-none relative z-10 scroll-smooth">
                    <div style={{ width: '100%', height: layout.height, position: 'relative' }}>
                        
                        {/* Connecting Lines (SVG Layer) */}
                        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                            <defs>
                                <filter id="glowLine" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="3" result="blur"/>
                                    <feMerge>
                                        <feMergeNode in="blur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            
                            {/* Draw strands */}
                            {[0, 1, 2].map(strand => {
                                const strandNodes = layout.nodes.filter((_, i) => i % 3 === strand);
                                
                                return strandNodes.map((node, i) => {
                                    if (i === 0) return null;
                                    const prev = strandNodes[i-1];
                                    const active = node.purchased && prev.purchased;
                                    const colorKey = getNodeColorKey(node.type);
                                    const hexColor = getHexColor(colorKey);

                                    return (
                                        <path 
                                            key={`link-${node.id}`}
                                            d={`M${prev.renderX},${prev.renderY + NODE_SIZE/2} C${prev.renderX},${prev.renderY + NODE_SIZE/2 + 50} ${node.renderX},${node.renderY - 50} ${node.renderX},${node.renderY + NODE_SIZE/2}`}
                                            fill="none"
                                            stroke={active ? hexColor : '#333'}
                                            strokeWidth={active ? 3 : 1}
                                            strokeOpacity={active ? 0.6 : 0.3}
                                            filter={active ? "url(#glowLine)" : ""}
                                            strokeDasharray={active ? "none" : "5,5"}
                                        />
                                    );
                                });
                            })}
                        </svg>

                        {/* Nodes (Divs) */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-[800px] h-full pointer-events-none">
                            {layout.nodes.map((node) => {
                                const row = Math.floor(node.id / 3);
                                let isUnlockable = false;
                                if (row === 0) isUnlockable = true;
                                else {
                                    const startPrev = (row - 1) * 3;
                                    const endPrev = startPrev + 3;
                                    for(let j=startPrev; j<endPrev; j++) {
                                        if (s.heroicNodes[j] && s.heroicNodes[j].purchased) isUnlockable = true;
                                    }
                                }

                                const isAffordable = state.player.score >= node.cost;
                                const colorKey = getNodeColorKey(node.type);
                                const isHovered = hoveredNode?.id === node.id;

                                // --- STYLE LOGIC ---
                                // Using Tailwind dynamic class composition is tricky, so standardizing string construction
                                let containerClasses = "absolute transition-all duration-300 pointer-events-auto flex items-center justify-center group";
                                
                                // Shapes: Diamond (rotate-45)
                                containerClasses += " rotate-45 border-2";

                                let bgClass = "bg-slate-950";
                                let borderClass = "border-slate-800";
                                let iconColor = "text-slate-700";
                                let glowStyle = {};

                                if (node.purchased) {
                                    bgClass = `bg-${colorKey}-950`;
                                    borderClass = `border-${colorKey}-500`;
                                    iconColor = `text-${colorKey}-400`;
                                    glowStyle = { boxShadow: `0 0 20px ${getHexColor(colorKey)}66` }; // 66 = 40% opacity
                                } else if (isUnlockable) {
                                    if (isAffordable) {
                                        bgClass = "bg-slate-900";
                                        borderClass = "border-white animate-pulse";
                                        iconColor = "text-white";
                                        glowStyle = { boxShadow: '0 0 10px rgba(255,255,255,0.3)' };
                                    } else {
                                        borderClass = "border-red-900";
                                        iconColor = "text-red-900";
                                    }
                                } else {
                                    // Locked
                                    iconColor = "text-slate-800";
                                }

                                if (isHovered) {
                                    bgClass = `bg-${colorKey}-900`;
                                    borderClass = `border-${colorKey}-400`;
                                    iconColor = `text-${colorKey}-300`;
                                    containerClasses += " scale-125 z-50";
                                } else {
                                    containerClasses += node.purchased ? " scale-100 z-10" : " scale-90 z-0";
                                }

                                return (
                                    <div
                                        key={node.id}
                                        className={`${containerClasses} ${bgClass} ${borderClass}`}
                                        style={{
                                            left: node.renderX - NODE_SIZE/2,
                                            top: node.renderY,
                                            width: NODE_SIZE,
                                            height: NODE_SIZE,
                                            ...glowStyle
                                        }}
                                        onClick={() => !node.purchased && isUnlockable && isAffordable && handlePurchase(node.id)}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                    >
                                        {/* Inner Icon Container (Counter-Rotate to keep icon upright) */}
                                        <div className={`-rotate-45 ${iconColor} transition-colors duration-300`}>
                                            {HeroicIcons[node.type]}
                                        </div>
                                        
                                        {/* Tiny connection dots for aesthetics */}
                                        {node.purchased && <div className="absolute top-0 right-0 w-1 h-1 bg-white shadow-[0_0_5px_white]"></div>}
                                        {node.purchased && <div className="absolute bottom-0 left-0 w-1 h-1 bg-white shadow-[0_0_5px_white]"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Details (Fixed) */}
            <div className="w-80 bg-[#0a0a0a] border-l border-slate-800 p-0 flex flex-col z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] relative">
                {hoveredNode ? (
                    <div className="flex flex-col h-full animate-fadeIn">
                        {/* Visual Header - Tech Card Style */}
                        <div className="h-56 relative flex items-center justify-center border-b border-slate-800 overflow-hidden">
                            {/* Animated BG for header */}
                            <div className={`absolute inset-0 bg-gradient-to-b from-${getNodeColorKey(hoveredNode.type)}-900/20 to-transparent`}></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#0a0a0a_100%)]"></div>
                            
                            {/* Large Icon Display */}
                            <div className={`scale-[3.0] ${hoveredNode.purchased ? `text-${getNodeColorKey(hoveredNode.type)}-500` : 'text-slate-600'} drop-shadow-2xl`}>
                                {HeroicIcons[hoveredNode.type]}
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div className="text-[10px] text-slate-500 font-mono">
                                    <div className="uppercase tracking-widest">SEQ_ID</div>
                                    <div className="text-white font-bold">{hoveredNode.id.toString().padStart(4, '0')}</div>
                                </div>
                                <div className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase ${hoveredNode.purchased ? 'border-green-800 text-green-500 bg-green-950/30' : 'border-slate-700 text-slate-500'}`}>
                                    {hoveredNode.purchased ? 'INSTALLED' : 'AVAILABLE'}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-1 h-4 bg-${getNodeColorKey(hoveredNode.type)}-500`}></div>
                                    <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">{t('UPGRADE_TYPE')}</div>
                                </div>
                                <div className={`text-2xl font-black text-white uppercase tracking-tight leading-none`}>
                                    {t(`HEROIC_${hoveredNode.type}`)}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 border border-slate-800 rounded-sm relative overflow-hidden">
                                <div className={`absolute top-0 right-0 p-2 opacity-10 text-6xl font-black text-${getNodeColorKey(hoveredNode.type)}-500`}>+</div>
                                <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-2">{t('EFFECT')}</div>
                                <div className="text-5xl font-mono font-bold text-white tracking-tighter relative z-10">
                                    {hoveredNode.type === HeroicUpgradeType.RELOAD_SPEED ? '-' : '+'}
                                    {hoveredNode.type === HeroicUpgradeType.MAX_HP || hoveredNode.type === HeroicUpgradeType.MAX_ARMOR 
                                        ? hoveredNode.value 
                                        : Math.round(hoveredNode.value * 100) + '%'
                                    }
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex justify-between items-center text-xs font-bold mb-3">
                                    <span className="text-slate-500 tracking-widest">{t('COST')}</span>
                                    <span className={`font-mono ${hoveredNode.purchased ? 'text-green-500' : state.player.score >= hoveredNode.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                                        {hoveredNode.purchased ? t('OWNED') : `${hoveredNode.cost} ${t('SCRAPS')}`}
                                    </span>
                                </div>
                                
                                {/* Progress Bar / Buy Button Visual */}
                                <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                                    <div className={`h-full ${hoveredNode.purchased ? 'bg-green-500' : state.player.score >= hoveredNode.cost ? 'bg-yellow-500' : 'bg-red-900'}`} style={{width: '100%'}}></div>
                                </div>
                                
                                {!hoveredNode.purchased && state.player.score < hoveredNode.cost && (
                                    <div className="mt-2 text-[9px] text-red-700 text-center font-mono uppercase tracking-widest animate-pulse">INSUFFICIENT BIOMASS</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-6 opacity-60">
                        <div className="w-24 h-24 border-2 border-slate-800 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-20 h-20 border border-slate-800 rounded-full flex items-center justify-center">
                                <span className="text-4xl">⌖</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-center max-w-[150px] leading-relaxed">{t('HEROIC_HINT')}</div>
                    </div>
                )}
            </div>

        </div>
    );
};
