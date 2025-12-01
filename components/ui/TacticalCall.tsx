
import React from 'react';
import { GameState, AllyOrder } from '../../types';
import { CloseButton } from './Shared';

export const TacticalCallInterface: React.FC<{ state: GameState, onIssueOrder: (o: AllyOrder) => void, onClose: () => void, t: any }> = ({ state, onIssueOrder, onClose, t }) => {
    return (
        <div className="absolute inset-0 z-[100] bg-cyan-900/90 pointer-events-auto font-mono flex items-center justify-center">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
             <div className="w-[900px] h-[600px] bg-black/80 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex relative overflow-hidden">
                 <CloseButton onClick={onClose} colorClass="border-cyan-500 text-cyan-500 hover:text-white hover:bg-cyan-900/50" />
                 <div className="w-1/3 border-r border-cyan-800 p-6 bg-cyan-950/20">
                     <h2 className="text-cyan-400 font-bold text-xl mb-6 tracking-widest border-b border-cyan-800 pb-2">{t('UNIT_STATUS')}</h2>
                     <div className="space-y-4">
                         {state.allies.length === 0 && <div className="text-cyan-700 italic">{t('NO_UNITS')}</div>}
                         {state.allies.map((ally, i) => (
                             <div key={ally.id} className="bg-black/40 p-3 border border-cyan-900/50">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-cyan-300 font-bold text-sm">UNIT-{i+1}</span>
                                     <span className={`text-[10px] px-2 py-0.5 rounded ${ally.state === 'COMBAT' ? 'bg-red-900/50 text-red-400' : 'bg-cyan-900/50 text-cyan-400'}`}>{ally.state}</span>
                                 </div>
                                 <div className="w-full bg-gray-900 h-1.5 mt-2"><div className="bg-cyan-500 h-full" style={{ width: `${(ally.hp / ally.maxHp) * 100}%` }}></div></div>
                             </div>
                         ))}
                     </div>
                     <div className="mt-8 pt-4 border-t border-cyan-800 text-xs text-cyan-600">{t('TOTAL_UNITS')}: {state.allies.length} / 5</div>
                 </div>
                 <div className="flex-1 p-10 flex flex-col justify-center items-center relative">
                     <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2 text-center drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{t('TACTICAL_COMMAND')}</h1>
                     <p className="text-cyan-500 mb-12 text-sm tracking-widest">{t('PRIORITY_OVERRIDE')}</p>
                     <div className="grid grid-cols-1 gap-6 w-full max-w-md">
                         <button onClick={() => onIssueOrder('PATROL')} className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4"><span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_DEFEND')}</span><span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_DEFEND_DESC')}</span></div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F1</div>
                         </button>
                         <button onClick={() => onIssueOrder('FOLLOW')} className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4"><span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_FOLLOW')}</span><span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_FOLLOW_DESC')}</span></div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F2</div>
                         </button>
                         <button onClick={() => onIssueOrder('ATTACK')} className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4"><span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_ASSAULT')}</span><span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_ASSAULT_DESC')}</span></div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F3</div>
                         </button>
                     </div>
                     <div className="absolute bottom-4 text-cyan-700 text-xs">{t('CLOSE_CHANNEL')}</div>
                 </div>
             </div>
        </div>
    )
}
