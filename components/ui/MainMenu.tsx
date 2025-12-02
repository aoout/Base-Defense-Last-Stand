import React from 'react';
import { GameState } from '../../types';
import { SaveSlotItem } from './SaveSlot';

interface MainMenuProps {
    state: GameState;
    onStartSurvival: () => void;
    onStartExploration: () => void;
    onLoadGame: (id: string) => void;
    onDeleteSave: (id: string) => void;
    onTogglePin: (id: string) => void;
    t: (key: string) => string;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
    state, 
    onStartSurvival, 
    onStartExploration, 
    onLoadGame, 
    onDeleteSave, 
    onTogglePin,
    t 
}) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            {/* Floating Cryo Storage (Left) */}
            <div className="absolute top-12 bottom-12 left-12 w-96 flex flex-col justify-center">
                <div className="mb-6 border-b border-blue-500/30 pb-2">
                    <h2 className="text-blue-400 font-mono text-sm tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] animate-pulse">{t('EXTRACTABLE_MEMORIES')}</h2>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-4 scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
                    {state.saveSlots.length === 0 && (
                        <div className="text-blue-500/30 italic text-xs py-10 border border-blue-900/20 bg-blue-900/5 p-4 text-center tracking-widest">
                            NO DATA ARCHIVED
                        </div>
                    )}
                    {state.saveSlots.map(save => (
                        <SaveSlotItem 
                        key={save.id} 
                        save={save} 
                        onLoad={() => onLoadGame(save.id)}
                        onDelete={() => onDeleteSave(save.id)}
                        onPin={() => onTogglePin(save.id)}
                        t={t}
                        />
                    ))}
                </div>
            </div>

            {/* Main Menu (Right Side) */}
            <div className="absolute right-24 flex flex-col items-end space-y-12">
                <div className="text-right">
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        BASE<br/><span className="text-cyan-500 text-9xl drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">DEFENSE</span>
                    </h1>
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <div className="h-px w-24 bg-cyan-500"></div>
                        <p className="text-cyan-300 font-mono tracking-[0.4em] text-sm">TACTICAL SURVIVAL SIMULATION</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-6">
                    <button onClick={onStartSurvival} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-cyan-500/50 hover:border-cyan-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-cyan-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-black text-white tracking-widest group-hover:text-cyan-100 transition-colors">SURVIVAL</span>
                            <span className="text-[10px] text-cyan-600 group-hover:text-cyan-300 font-mono uppercase tracking-[0.2em]">Endless Waves // Simulation</span>
                        </div>
                        
                        <div className="relative z-10 w-8 h-8 border border-cyan-800 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                            ▶
                        </div>
                    </button>

                    <button onClick={onStartExploration} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-purple-500/50 hover:border-purple-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-purple-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-black text-white tracking-widest group-hover:text-purple-100 transition-colors">EXPLORE</span>
                            <span className="text-[10px] text-purple-600 group-hover:text-purple-300 font-mono uppercase tracking-[0.2em]">Campaign Mode // Deployment</span>
                        </div>

                        <div className="relative z-10 w-8 h-8 border border-purple-800 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-black transition-all">
                            ▲
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}