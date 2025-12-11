
import React, { useState, useEffect } from 'react';
import { Ally, AllyOrder, GameEventType, DefenseIssueOrderEvent, StatId, GameMode } from '../../types';
import { CloseButton } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';
import { DS } from '../../theme/designSystem';
import { CanvasView } from './common/CanvasView';
import { drawAllySprite } from '../../utils/renderers';
import { ALLY_STATS } from '../../data/registry';

const AllyPreview: React.FC<{ ally: Ally }> = ({ ally }) => {
    const draw = (ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(4, 4); // Scale up for visibility
        // Rotate to face somewhat towards the user/camera
        ctx.rotate(-Math.PI / 2 + Math.sin(time * 0.002) * 0.2);
        
        // Mock moving animation if in combat
        const isMoving = ally.state === 'COMBAT' || ally.state === 'FOLLOW';
        drawAllySprite(ctx, ally, time, isMoving, true);
        
        ctx.restore();
        
        // Draw status ring
        ctx.strokeStyle = ally.state === 'COMBAT' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        const rot = time * 0.0005;
        ctx.beginPath();
        ctx.arc(w/2, h/2, 60, rot, rot + Math.PI*2);
        ctx.stroke();
    };

    return <CanvasView width={300} height={300} className="w-full h-full object-contain" draw={draw} />;
};

const CommandButton: React.FC<{ 
    label: string, 
    sub: string, 
    hotkey: string, 
    active: boolean, 
    color: string,
    onClick: () => void 
}> = ({ label, sub, hotkey, active, color, onClick }) => {
    let borderColor = 'border-slate-700';
    let textColor = 'text-slate-500';
    let bg = 'bg-slate-900/80';

    if (active) {
        if (color === 'yellow') { borderColor = 'border-yellow-500'; textColor = 'text-yellow-400'; bg = 'bg-yellow-900/40 shadow-[0_0_20px_rgba(234,179,8,0.3)]'; }
        if (color === 'blue') { borderColor = 'border-blue-500'; textColor = 'text-blue-400'; bg = 'bg-blue-900/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]'; }
        if (color === 'red') { borderColor = 'border-red-500'; textColor = 'text-red-400'; bg = 'bg-red-900/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]'; }
    } else {
        bg += ' hover:bg-slate-800';
    }

    return (
        <button 
            onClick={onClick}
            className={`flex-1 h-20 sm:h-24 border-2 ${borderColor} ${bg} transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden group min-w-[100px]`}
        >
            <div className="absolute top-1 left-2 text-[9px] sm:text-[10px] font-mono opacity-50 font-bold">{hotkey}</div>
            <div className={`${DS.text.header} text-lg sm:text-2xl ${textColor} mb-1 group-hover:scale-110 transition-transform`}>{label}</div>
            <div className="text-[8px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest">{sub}</div>
            {active && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>}
        </button>
    );
};

export const TacticalCallInterface: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const [selectedAllyId, setSelectedAllyId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Sync timer for spawn progress
    useGameLoop(() => {
        setCurrentTime(Date.now());
    });

    // Auto-select first ally if none selected
    useEffect(() => {
        if (!selectedAllyId && state.allies.length > 0) {
            setSelectedAllyId(state.allies[0].id);
        }
    }, [state.allies.length]);

    const handleIssueOrder = (order: AllyOrder) => {
        engine.eventBus.emit<DefenseIssueOrderEvent>(GameEventType.DEFENSE_ISSUE_ORDER, { order });
        engine.toggleTacticalMenu(); 
    };

    const handleClose = () => engine.toggleTacticalMenu();

    const currentOrder = state.allies.length > 0 ? state.allies[0].currentOrder : null;
    const selectedAlly = state.allies.find(a => a.id === selectedAllyId) || state.allies[0];

    // Reinforcement Logic
    const maxAllies = state.gameMode === GameMode.CAMPAIGN ? 10 : ALLY_STATS.maxCount;
    const spawnInterval = 60000;
    const timeSinceLastSpawn = currentTime - state.lastAllySpawnTime;
    const timeToNext = Math.max(0, spawnInterval - timeSinceLastSpawn);
    const spawnProgress = Math.min(100, (timeSinceLastSpawn / spawnInterval) * 100);
    const isMaxed = state.allies.length >= maxAllies;

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center pointer-events-auto font-mono select-none p-4">
             {/* Background Effects */}
             <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(234,179,8,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/5 to-slate-950/80 pointer-events-none"></div>

             {/* MAIN CONTAINER */}
             <div className="w-full h-full max-w-[1200px] max-h-[800px] bg-[#0b1120] border-2 border-yellow-700 shadow-[0_0_100px_rgba(234,179,8,0.2)] flex flex-col relative overflow-hidden rounded-lg">
                 <CloseButton onClick={handleClose} colorClass="border-yellow-600 text-yellow-500 hover:text-white hover:bg-yellow-900 top-4 right-4" />
                 
                 {/* HEADER */}
                 <div className="h-20 border-b border-yellow-900/50 bg-slate-900/80 flex items-center px-6 shrink-0 justify-between">
                     <div>
                         <div className="flex items-center gap-3 mb-1">
                             <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]"></div>
                             <span className="text-yellow-600 font-mono text-[10px] font-bold tracking-[0.3em] uppercase">BATTLE NET // ACTIVE</span>
                         </div>
                         <h1 className={`${DS.text.header} text-2xl sm:text-4xl text-white`}>{t('TACTICAL_COMMAND')}</h1>
                     </div>
                     <div className="flex gap-8 text-right pr-8 hidden sm:flex">
                         <div>
                             <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">ACTIVE UNITS</div>
                             <div className="text-2xl font-mono text-white font-bold">{state.allies.length} <span className="text-sm text-slate-600">/ {maxAllies}</span></div>
                         </div>
                     </div>
                 </div>

                 {/* MAIN CONTENT */}
                 <div className="flex-1 flex min-h-0">
                     
                     {/* LEFT: ROSTER LIST */}
                     <div className="w-64 sm:w-72 md:w-80 border-r border-yellow-900/30 bg-black/20 flex flex-col shrink-0">
                         <div className="p-3 border-b border-yellow-900/30 bg-slate-900/50">
                             <h3 className="text-[10px] font-bold text-yellow-600 tracking-[0.2em] uppercase">{t('UNIT_STATUS')}</h3>
                         </div>
                         <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-yellow-900">
                             {state.allies.length === 0 && (
                                 <div className="text-center py-10 border border-dashed border-slate-800 text-slate-600 text-xs italic">
                                     {t('NO_UNITS')}
                                 </div>
                             )}
                             {state.allies.map((ally, i) => {
                                 const hpPct = ally.hp / ally.maxHp;
                                 const isSelected = selectedAllyId === ally.id;
                                 return (
                                     <div 
                                        key={ally.id} 
                                        onClick={() => setSelectedAllyId(ally.id)}
                                        className={`
                                            p-3 relative overflow-hidden group cursor-pointer border transition-all
                                            ${isSelected 
                                                ? 'bg-yellow-900/20 border-yellow-500' 
                                                : 'bg-slate-900/80 border-slate-700 hover:border-yellow-600/50'}
                                        `}
                                     >
                                         <div className="flex justify-between items-center mb-2 relative z-10">
                                             <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>UNIT-0{i+1}</span>
                                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${ally.state === 'COMBAT' ? 'border-red-900 text-red-400 bg-red-900/20 animate-pulse' : 'border-slate-600 text-slate-500'}`}>
                                                 {ally.state}
                                             </span>
                                         </div>
                                         <div className="w-full h-1 bg-black rounded-full overflow-hidden mb-1 relative z-10">
                                             <div className={`h-full ${hpPct < 0.3 ? 'bg-red-500' : 'bg-green-500'} transition-all duration-300`} style={{ width: `${hpPct * 100}%` }}></div>
                                         </div>
                                         <div className="text-[9px] text-slate-500 font-mono text-right relative z-10">{Math.ceil(ally.hp)}/{ally.maxHp}</div>
                                         
                                         {/* Selection Marker */}
                                         {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>}
                                     </div>
                                 );
                             })}
                         </div>
                     </div>

                     {/* CENTER: TELEMETRY DASHBOARD */}
                     <div className="flex-1 flex flex-col bg-slate-900/30 relative min-w-0">
                         
                         {/* 1. Reinforcement Bar */}
                         <div className="h-16 border-b border-yellow-900/30 bg-slate-950/50 flex items-center px-6 gap-6">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24 shrink-0">REINFORCEMENT</div>
                             <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                                 {isMaxed ? (
                                     <div className="w-full h-full bg-slate-700 striped-bg"></div>
                                 ) : (
                                     <>
                                        <div className="h-full bg-cyan-600 transition-all duration-1000 ease-linear" style={{ width: `${spawnProgress}%` }}></div>
                                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] w-1/2 animate-[shimmer_2s_infinite]"></div>
                                     </>
                                 )}
                             </div>
                             <div className="text-mono text-xs font-bold text-cyan-400 w-20 text-right">
                                 {isMaxed ? 'MAX CAP' : `-${Math.ceil(timeToNext/1000)}s`}
                             </div>
                         </div>

                         {/* 2. Unit Detail View */}
                         <div className="flex-1 p-8 flex gap-8 items-center justify-center">
                             {selectedAlly ? (
                                 <>
                                     {/* 3D Visual */}
                                     <div className="w-1/2 aspect-square max-w-[400px] relative border border-slate-700 bg-black/40 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                                         <div className="absolute inset-0 border border-slate-800 rounded-full animate-[spin-slow_20s_linear_infinite]"></div>
                                         <div className="absolute inset-4 border border-slate-800 rounded-full animate-[spin-slow_15s_linear_infinite_reverse]"></div>
                                         <AllyPreview ally={selectedAlly} />
                                     </div>

                                     {/* Stats Panel */}
                                     <div className="w-1/2 flex flex-col gap-6">
                                         <div>
                                             <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">UNIT STATUS</div>
                                             <div className={`text-4xl font-black font-display uppercase tracking-wide ${selectedAlly.state === 'COMBAT' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                                                 {selectedAlly.state}
                                             </div>
                                         </div>

                                         <div className="space-y-4 bg-black/20 p-6 border border-slate-700 rounded">
                                             <div>
                                                 <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                     <span>INTEGRITY</span>
                                                     <span className="text-white font-mono">{Math.ceil(selectedAlly.hp)} / {selectedAlly.maxHp}</span>
                                                 </div>
                                                 <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
                                                     <div className={`h-full ${selectedAlly.hp < selectedAlly.maxHp*0.3 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${(selectedAlly.hp/selectedAlly.maxHp)*100}%`}}></div>
                                                 </div>
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                 <div>
                                                     <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">DAMAGE OUTPUT</div>
                                                     <div className="text-xl font-mono text-yellow-400 font-bold">{selectedAlly.damage}</div>
                                                 </div>
                                                 <div>
                                                     <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">MOVEMENT SPD</div>
                                                     <div className="text-xl font-mono text-cyan-400 font-bold">{selectedAlly.speed.toFixed(2)}</div>
                                                 </div>
                                             </div>
                                         </div>
                                         
                                         <div className="text-[10px] text-slate-600 font-mono">
                                             ID: {selectedAlly.id.split('-')[1]}<br/>
                                             ORD: {selectedAlly.currentOrder}
                                         </div>
                                     </div>
                                 </>
                             ) : (
                                 <div className="text-slate-600 font-mono text-sm tracking-widest animate-pulse">NO DATA STREAM</div>
                             )}
                         </div>

                         {/* 3. Bottom Command Deck */}
                         <div className="h-auto bg-slate-950 border-t border-yellow-900/50 p-4 flex gap-3 shrink-0 overflow-x-auto">
                             <CommandButton 
                                label={t('CMD_DEFEND')} 
                                sub={t('CMD_DEFEND_DESC')} 
                                hotkey="F1" 
                                active={currentOrder === 'PATROL'} 
                                color="yellow"
                                onClick={() => handleIssueOrder('PATROL')}
                             />
                             <CommandButton 
                                label={t('CMD_FOLLOW')} 
                                sub={t('CMD_FOLLOW_DESC')} 
                                hotkey="F2" 
                                active={currentOrder === 'FOLLOW'} 
                                color="blue"
                                onClick={() => handleIssueOrder('FOLLOW')}
                             />
                             <CommandButton 
                                label={t('CMD_ASSAULT')} 
                                sub={t('CMD_ASSAULT_DESC')} 
                                hotkey="F3" 
                                active={currentOrder === 'ATTACK'} 
                                color="red"
                                onClick={() => handleIssueOrder('ATTACK')}
                             />
                         </div>
                     </div>

                 </div>
             </div>
        </div>
    )
}
