
import React from 'react';
import { GameState, AppMode } from '../../types';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

export const CampaignFailureScreen: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();

    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center pointer-events-auto font-mono overflow-hidden">
             {/* Background: Dust Storm Effect */}
             <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(234,179,8,0.1)_1px,transparent_1px),linear-gradient(rgba(234,179,8,0.1)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
             <div className="absolute inset-0 bg-yellow-950/40 mix-blend-overlay animate-pulse"></div>
             
             {/* Central Message */}
             <div className="relative z-10 w-[900px] border-4 border-yellow-700 bg-black/90 p-12 shadow-[0_0_100px_rgba(234,179,8,0.3)] flex flex-col items-center text-center">
                 
                 <div className="w-full bg-yellow-900/30 border border-yellow-600/50 p-2 mb-8 flex justify-between items-center">
                     <span className="text-yellow-500 font-bold tracking-[0.2em] text-xs">FRONTIER DEFENSE</span>
                     <span className="text-red-500 font-bold tracking-[0.2em] text-xs">SECTOR LOST</span>
                 </div>

                 <h1 className="text-7xl font-display font-black text-white tracking-wide mb-2">PERIMETER BREACHED</h1>
                 <h2 className="text-2xl text-yellow-600 font-bold tracking-widest mb-12">BASE OVERRUN BY SWARM</h2>

                 <div className="w-full border-t border-b border-yellow-900/50 py-8 mb-8 grid grid-cols-2 gap-4">
                     <div className="text-right border-r border-yellow-900/50 pr-8">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-1">SURVIVAL TIME</div>
                         <div className="text-4xl text-white font-mono font-bold">
                             {Math.floor(state.time / 1000 / 60)}:{(Math.floor(state.time / 1000) % 60).toString().padStart(2, '0')}
                         </div>
                     </div>
                     <div className="text-left pl-8">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-1">KILLS CONFIRMED</div>
                         <div className="text-4xl text-yellow-500 font-mono font-bold">
                             {(Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0)}
                         </div>
                     </div>
                 </div>

                 <p className="text-slate-400 text-xs mb-8 max-w-lg">
                     The frontier outpost has been compromised. The sheer volume of the hive mind overwhelmed local defenses. Reinforcements were unable to arrive in time.
                 </p>

                 <div className="flex gap-4">
                     <button 
                        onClick={() => engine.reset(false, state.gameMode)}
                        className="px-10 py-4 bg-yellow-900 hover:bg-yellow-800 text-white font-bold tracking-widest uppercase border border-yellow-600 transition-all hover:scale-105"
                     >
                         RE-ESTABLISH BASE
                     </button>
                     <button 
                        onClick={() => {
                            engine.state.appMode = AppMode.START_MENU;
                            engine.notifyUI();
                        }}
                        className="px-10 py-4 bg-black hover:bg-slate-900 text-slate-400 font-bold tracking-widest uppercase border border-slate-700 transition-all"
                     >
                         ABORT
                     </button>
                 </div>

             </div>
        </div>
    );
};
