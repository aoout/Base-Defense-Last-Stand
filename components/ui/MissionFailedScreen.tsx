
import React, { useRef, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CloseButton } from './Shared';

const StatRow: React.FC<{ label: string, value: string | number, highlight?: boolean, sub?: string }> = ({ label, value, highlight, sub }) => (
    <div className={`flex justify-between items-baseline border-b border-dashed pb-2 pt-2 ${highlight ? 'border-red-500/50' : 'border-red-900/30'}`}>
        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${highlight ? 'text-red-400' : 'text-red-800/80'}`}>{label}</span>
        <div className="text-right">
             <span className={`text-xl font-mono font-bold ${highlight ? 'text-red-100' : 'text-red-700'}`}>{value}</span>
             {sub && <div className="text-[9px] text-red-900 font-bold">{sub}</div>}
        </div>
    </div>
);

export const MissionFailedScreen: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll effect for the log background
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Explicitly cast the value to number to avoid type errors
    const totalKills = (Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0);
    
    const missionDuration = Math.floor(state.time / 1000); // seconds
    const minutes = Math.floor(missionDuration / 60);
    const seconds = missionDuration % 60;
    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const causeOfFailure = state.player.hp <= 0 ? t('OPERATIVE_KIA') : t('BASE_COMPROMISED');

    return (
        <div className="absolute inset-0 z-[200] bg-black flex items-center justify-center pointer-events-auto font-mono select-none overflow-hidden text-red-600">
             
             {/* --- BACKGROUND FX --- */}
             <div className="absolute inset-0 bg-red-950/20 z-0 animate-pulse"></div>
             {/* Scrolling Log Background */}
             <div ref={scrollRef} className="absolute inset-0 opacity-10 pointer-events-none font-mono text-[10px] text-red-500 overflow-hidden leading-tight p-4 whitespace-nowrap z-0">
                 {Array.from({length: 60}).map((_, i) => (
                     <div key={i}>{`[${Date.now() - i*150}] FATAL_EXCEPTION_0x${(i*999).toString(16).toUpperCase()} // CONNECTION_LOST // NEURAL_LINK_SEVERED`}</div>
                 ))}
             </div>
             {/* Vignette */}
             <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,#000_90%)] z-10 pointer-events-none"></div>

             {/* --- MAIN INTERFACE CARD --- */}
             <div className="relative z-20 w-[960px] h-[640px] bg-black border-2 border-red-900 shadow-[0_0_100px_rgba(220,38,38,0.2)] flex flex-col overflow-hidden">
                 
                 {/* Top Header */}
                 <div className="h-20 border-b border-red-900 bg-red-950/30 flex justify-between items-center px-8 relative overflow-hidden">
                     <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.05)_10px,rgba(220,38,38,0.05)_20px)] pointer-events-none"></div>
                     
                     <div className="flex flex-col z-10">
                         <div className="flex items-center gap-3">
                             <div className="w-3 h-3 bg-red-600 animate-ping rounded-full"></div>
                             <h1 className="text-4xl font-display font-black tracking-widest text-red-500">{t('MISSION_FAILED')}</h1>
                         </div>
                         <div className="text-[10px] font-bold text-red-800 tracking-[0.5em] pl-6 uppercase">
                             RECORDING TERMINATED
                         </div>
                     </div>
                     
                     <div className="text-right z-10">
                         <div className="text-[9px] text-red-900 font-bold uppercase mb-1">BLACK BOX ID</div>
                         <div className="bg-red-900/20 border border-red-900 px-2 py-1 text-red-500 font-mono text-xs">
                             BB-{Date.now().toString(36).toUpperCase()}
                         </div>
                     </div>
                 </div>

                 {/* Main Body - 3 Column Grid */}
                 <div className="flex-1 grid grid-cols-12 gap-0 min-h-0 bg-[#0a0505]">
                     
                     {/* LEFT: Context (4 cols) */}
                     <div className="col-span-4 border-r border-red-900/30 p-8 flex flex-col gap-8">
                         <div>
                             <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-4 border-b border-red-900/30 pb-2">{t('MISSION_METRICS')}</h3>
                             <div className="space-y-2">
                                 <StatRow label={t('TIME_ALIVE')} value={timeFormatted} />
                                 <StatRow label={t('WAVES_SUFFIX')} value={state.wave.index} />
                                 <StatRow label={t('TOTAL_DAMAGE')} value={`${(state.stats.damageDealt / 1000).toFixed(1)}k`} />
                             </div>
                         </div>
                         
                         <div className="mt-auto p-4 bg-red-900/10 border border-red-900/50 text-center">
                             <div className="text-[9px] text-red-700 font-bold uppercase mb-2 tracking-widest">{t('CAUSE_OF_FAILURE')}</div>
                             <div className="text-xl font-display font-bold text-white uppercase tracking-wide">{causeOfFailure}</div>
                         </div>
                     </div>

                     {/* CENTER: Final Snapshot (4 cols) */}
                     <div className="col-span-4 border-r border-red-900/30 p-8 flex flex-col items-center justify-center relative">
                         <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(220,38,38,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                         
                         {/* Animated Icon */}
                         <div className="mb-6 relative">
                             <div className="w-32 h-32 border-2 border-red-800 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                 <div className="w-24 h-24 border border-dashed border-red-900 rounded-full"></div>
                             </div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-5xl">⚠</span>
                             </div>
                         </div>

                         <div className="text-center z-10">
                             <div className="text-xs text-red-500 font-bold tracking-[0.2em] mb-2 uppercase">{t('RECOVERED_RESOURCES')}</div>
                             <div className="text-6xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                                 {Math.floor(state.player.score)}
                             </div>
                             <div className="text-[10px] text-red-800 font-bold mt-2 uppercase">{t('SCRAPS_TRANSFER')}</div>
                         </div>
                     </div>

                     {/* RIGHT: Threat Analysis (4 cols) */}
                     <div className="col-span-4 p-8 flex flex-col relative overflow-hidden">
                         <div className="absolute top-4 right-4 text-[100px] text-red-950 opacity-20 font-black pointer-events-none select-none z-0">☠</div>
                         
                         <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 border-b border-red-900/50 pb-2 z-10">{t('HOSTILES_NEUTRALIZED')}</h3>
                         
                         <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-transparent z-10">
                             {Object.entries(state.stats.killsByType).map(([type, count]) => {
                                 // Safely cast count to number
                                 if ((count as number) <= 0) return null;
                                 return (
                                     <div key={type} className="flex justify-between items-center text-xs py-1.5 border-b border-red-900/10">
                                         <span className="text-red-800 font-bold">{t(`ENEMY_${type}_NAME`)}</span>
                                         <span className="text-red-400 font-mono font-bold">{count as number}</span>
                                     </div>
                                 );
                             })}
                         </div>

                         <div className="mt-4 pt-4 border-t-2 border-red-900 flex justify-between items-center z-10">
                             <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider">{t('TOTAL_UNITS')}</span>
                             <span className="text-3xl font-mono font-bold text-white">{totalKills}</span>
                         </div>
                     </div>
                 </div>

                 {/* Bottom Actions */}
                 <div className="h-20 bg-black border-t border-red-900 flex items-center px-8 gap-4 shrink-0">
                     <button 
                        onClick={() => engine.returnToMainMenu()}
                        className="flex-1 h-12 border border-red-900 text-red-700 hover:text-red-400 hover:border-red-500 hover:bg-red-950/30 transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 group"
                     >
                         <span className="group-hover:-translate-x-1 transition-transform">«</span>
                         {t('RETURN_MAIN_MENU')}
                     </button>
                     
                     <button 
                        onClick={() => engine.saveGame()}
                        className="flex-1 h-12 border border-red-900 text-red-700 hover:text-white hover:border-white hover:bg-red-900/50 transition-all font-bold tracking-widest uppercase text-xs"
                     >
                         {t('SAVE_INTEL')}
                     </button>

                     <button 
                        onClick={() => engine.reset(false, state.gameMode)}
                        className="flex-[1.5] h-12 bg-red-700 text-white hover:bg-red-600 transition-all font-black tracking-[0.2em] uppercase text-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                     >
                         {t('RE_DEPLOY')}
                     </button>
                 </div>

             </div>
        </div>
    );
};
