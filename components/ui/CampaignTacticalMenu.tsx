
import React from 'react';
import { AllyOrder, GameEventType, DefenseIssueOrderEvent } from '../../types';
import { CloseButton } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

export const CampaignTacticalMenu: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();

    const handleIssueOrder = (order: AllyOrder) => {
        engine.eventBus.emit<DefenseIssueOrderEvent>(GameEventType.DEFENSE_ISSUE_ORDER, { order });
        engine.toggleTacticalMenu(); 
    };

    const handleClose = () => {
        engine.toggleTacticalMenu();
    }

    const allies = state.allies;
    const maxUnits = 10;

    return (
        <div className="absolute inset-0 z-[100] bg-yellow-950/90 pointer-events-auto font-mono flex items-center justify-center">
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(234,179,8,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
             <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

             <div className="w-[1000px] h-[650px] bg-slate-900 border-4 border-yellow-700 shadow-[0_0_50px_rgba(234,179,8,0.3)] flex relative overflow-hidden">
                 <CloseButton onClick={handleClose} colorClass="border-yellow-600 text-yellow-500 hover:text-white hover:bg-yellow-900/50" />
                 
                 {/* Left Panel: Roster */}
                 <div className="w-[400px] border-r-2 border-yellow-800 p-6 bg-black/40 flex flex-col">
                     <h2 className="text-yellow-500 font-black text-2xl mb-1 tracking-widest uppercase">FRONTIER OPS</h2>
                     <div className="text-[10px] text-yellow-700 font-bold mb-6 tracking-[0.2em]">{t('UNIT_STATUS')} // MAX {maxUnits}</div>
                     
                     <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-transparent">
                         {allies.length === 0 && (
                             <div className="text-yellow-900/50 italic text-center py-20 text-sm border-2 border-dashed border-yellow-900/30">
                                 {t('NO_UNITS')}
                             </div>
                         )}
                         
                         <div className="grid grid-cols-2 gap-3">
                             {allies.map((ally, i) => (
                                 <div key={ally.id} className="bg-yellow-950/20 p-3 border border-yellow-800/50 group hover:bg-yellow-900/20 transition-colors">
                                     <div className="flex justify-between items-center mb-2">
                                         <span className="text-yellow-200 font-bold text-xs">CLONE-{i+1}</span>
                                         <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${ally.state === 'COMBAT' ? 'border-red-500 text-red-400 bg-red-900/20' : 'border-yellow-600 text-yellow-600'}`}>
                                             {ally.state.substring(0,3)}
                                         </span>
                                     </div>
                                     <div className="w-full bg-black h-1.5 border border-yellow-900/30">
                                         <div 
                                            className={`h-full transition-all duration-300 ${ally.hp < ally.maxHp*0.3 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                            style={{ width: `${(ally.hp / ally.maxHp) * 100}%` }}
                                         ></div>
                                     </div>
                                 </div>
                             ))}
                             {/* Empty Slots */}
                             {Array.from({length: Math.max(0, maxUnits - allies.length)}).map((_, i) => (
                                 <div key={`empty-${i}`} className="bg-black/20 p-3 border border-dashed border-yellow-900/30 flex items-center justify-center opacity-50">
                                     <span className="text-[9px] text-yellow-900 font-bold">OFFLINE</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                     
                     <div className="mt-4 pt-4 border-t border-yellow-800 flex justify-between items-center">
                         <span className="text-xs text-yellow-600 font-bold tracking-wider">ACTIVE UNITS</span>
                         <span className="text-2xl font-display font-bold text-yellow-400">{allies.length} <span className="text-sm text-yellow-700">/ {maxUnits}</span></span>
                     </div>
                 </div>

                 {/* Right Panel: Command Center */}
                 <div className="flex-1 p-10 flex flex-col justify-center items-center relative bg-[radial-gradient(circle_at_center,rgba(60,30,10,0.4)_0%,transparent_80%)]">
                     
                     <div className="mb-12 text-center">
                         <h1 className="text-4xl font-display font-black text-white tracking-widest mb-2 drop-shadow-[0_4px_0_rgba(0,0,0,1)]">TACTICAL MAP</h1>
                         <p className="text-yellow-600 text-xs tracking-[0.3em] font-bold bg-black/50 px-4 py-1 inline-block border border-yellow-900">
                             {t('PRIORITY_OVERRIDE')}
                         </p>
                     </div>

                     <div className="flex flex-col gap-4 w-full max-w-sm">
                         {[
                             { id: 'F1', order: 'PATROL', label: 'CMD_DEFEND', desc: 'CMD_DEFEND_DESC', color: 'border-yellow-600 text-yellow-100 hover:bg-yellow-600' },
                             { id: 'F2', order: 'FOLLOW', label: 'CMD_FOLLOW', desc: 'CMD_FOLLOW_DESC', color: 'border-blue-500 text-blue-100 hover:bg-blue-600' },
                             { id: 'F3', order: 'ATTACK', label: 'CMD_ASSAULT', desc: 'CMD_ASSAULT_DESC', color: 'border-red-600 text-red-100 hover:bg-red-600' }
                         ].map((btn) => (
                             <button 
                                key={btn.id} 
                                onClick={() => handleIssueOrder(btn.order as AllyOrder)}
                                className={`
                                    group relative h-20 bg-black/60 border-2 ${btn.color} hover:text-black transition-all overflow-hidden flex items-center px-6
                                    hover:scale-105 active:scale-95 shadow-lg
                                `}
                             >
                                 <div className="flex flex-col items-start relative z-10">
                                     <span className="text-xl font-black tracking-tighter uppercase">{t(btn.label)}</span>
                                     <span className="text-[10px] opacity-70 font-bold mt-1">{t(btn.desc)}</span>
                                 </div>
                                 <div className="ml-auto text-5xl font-black opacity-20 group-hover:opacity-40 relative z-10">{btn.id}</div>
                                 
                                 {/* Scanline hover effect */}
                                 <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 skew-x-12"></div>
                             </button>
                         ))}
                     </div>

                     <div className="absolute bottom-6 text-yellow-800 text-[10px] font-mono tracking-widest">
                         {t('CLOSE_CHANNEL')}
                     </div>
                 </div>
             </div>
        </div>
    )
}
