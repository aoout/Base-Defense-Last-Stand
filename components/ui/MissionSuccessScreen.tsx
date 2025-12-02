
import React, { useEffect, useState } from 'react';
import { GameState } from '../../types';

interface MissionSuccessScreenProps {
    state: GameState;
    onReturn: () => void;
    t: (key: string) => string;
}

export const MissionSuccessScreen: React.FC<MissionSuccessScreenProps> = ({ state, onReturn, t }) => {
    const [tallyScore, setTallyScore] = useState(0);
    
    useEffect(() => {
        // Simple counter animation for score
        const target = Math.floor(state.player.score);
        const duration = 1500;
        const start = Date.now();
        
        const tick = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);
            
            setTallyScore(Math.floor(target * ease));
            
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };
        
        requestAnimationFrame(tick);
    }, [state.player.score]);

    const totalKills = (Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0);
    const baseIntegrity = Math.floor((state.base.hp / state.base.maxHp) * 100);

    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center pointer-events-auto font-mono overflow-hidden">
             {/* Background Data Stream Effect */}
             <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 animate-[pulse_4s_infinite]"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,78,59,0.4)_0%,rgba(2,6,23,0.9)_100%)]"></div>
             
             {/* Upward particles (CSS simulation via repeating gradient animation) */}
             <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_49px,rgba(34,197,94,0.1)_50px)] bg-[length:100%_50px] animate-[scrollUp_2s_linear_infinite]"></div>

             {/* Central Terminal */}
             <div className="relative z-10 w-[800px] border-y-4 border-emerald-500 bg-slate-900/90 p-12 shadow-[0_0_100px_rgba(16,185,129,0.4)] flex flex-col items-center text-center backdrop-blur-md">
                 
                 {/* Top Success Banner */}
                 <div className="w-full bg-emerald-900/30 border border-emerald-500/50 p-2 mb-8 flex justify-between items-center">
                     <span className="text-emerald-400 font-bold tracking-[0.2em] text-xs">{t('UPLINK_EST')}</span>
                     <span className="text-emerald-400 font-bold tracking-[0.2em] text-xs">{t('PROTOCOL_ZULU')}</span>
                 </div>

                 <h1 className="text-6xl font-black text-white tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">{t('SECTOR_PACIFIED')}</h1>
                 <h2 className="text-xl text-emerald-500 font-bold tracking-widest mb-12">{t('MISSION_OBJ')} <span className="text-white bg-emerald-600 px-2 py-0.5 text-sm ml-2 rounded">{t('COMPLETE')}</span></h2>

                 <div className="w-full grid grid-cols-2 gap-8 mb-12">
                     {/* Left: Resource Tally */}
                     <div className="bg-black/40 border border-emerald-900/50 p-6 flex flex-col justify-center items-center relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 shadow-[0_0_10px_#eab308]"></div>
                         <div className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-2">{t('RESOURCES_SECURED')}</div>
                         <div className="text-5xl font-mono font-bold text-yellow-400 tabular-nums tracking-tighter group-hover:scale-110 transition-transform">
                             {tallyScore}
                         </div>
                         <div className="text-[10px] text-yellow-600 mt-1">{t('SCRAPS_TRANSFER')}</div>
                     </div>

                     {/* Right: Combat Stats */}
                     <div className="flex flex-col gap-4">
                         <div className="flex-1 bg-black/40 border border-emerald-900/50 p-4 flex justify-between items-center px-8">
                             <div className="text-left">
                                 <div className="text-xs text-emerald-600 font-bold uppercase">{t('HOSTILES_NEUTRALIZED')}</div>
                                 <div className="text-2xl text-white font-bold">{totalKills}</div>
                             </div>
                             <div className="w-10 h-10 border border-emerald-800 rounded-full flex items-center justify-center text-emerald-500">
                                 ☠
                             </div>
                         </div>
                         <div className="flex-1 bg-black/40 border border-emerald-900/50 p-4 flex justify-between items-center px-8">
                             <div className="text-left">
                                 <div className="text-xs text-emerald-600 font-bold uppercase">{t('BASE_INTEGRITY')}</div>
                                 <div className={`text-2xl font-bold ${baseIntegrity > 80 ? 'text-green-400' : baseIntegrity > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                     {baseIntegrity}%
                                 </div>
                             </div>
                             <div className="w-10 h-10 border border-emerald-800 rounded-full flex items-center justify-center text-emerald-500">
                                 ⌂
                             </div>
                         </div>
                     </div>
                 </div>

                 <p className="text-slate-400 text-xs mb-8 max-w-md border-t border-emerald-900/30 pt-4">
                     {t('SUCCESS_DESC')}
                 </p>

                 <button 
                    onClick={onReturn}
                    className="group relative px-16 py-5 bg-emerald-950 border border-emerald-500 hover:bg-emerald-900 transition-all overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                 >
                     <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     <div className="relative flex items-center gap-4">
                         <span className="text-emerald-100 font-black tracking-[0.2em] text-xl">{t('INITIATE_ASCENT')}</span>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400 group-hover:text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                         </svg>
                     </div>
                 </button>

             </div>

             {/* Footer Tech Text */}
             <div className="absolute bottom-8 text-emerald-900 font-mono text-xs tracking-[0.5em]">
                 {t('NET_SECURE')}
             </div>
             
             <style>{`
                @keyframes scrollUp {
                    from { background-position: 0 0; }
                    to { background-position: 0 -50px; }
                }
             `}</style>
        </div>
    );
};
