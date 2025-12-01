
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
                    <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        BASE<br/><span className="text-blue-500 text-9xl">DEFENSE</span>
                    </h1>
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <div className="h-px w-24 bg-blue-500"></div>
                        <p className="text-blue-300 font-mono tracking-[0.4em] text-sm">TACTICAL SURVIVAL SIMULATION</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-6">
                    <button onClick={onStartSurvival} className="group relative w-[420px] h-24 bg-gray-900/40 border-l-4 border-white/20 hover:border-blue-500 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        <span className="relative z-10 text-4xl font-black text-white tracking-widest group-hover:text-blue-100 transition-colors">SURVIVAL</span>
                        <span className="relative z-10 text-xs text-gray-500 group-hover:text-blue-300 font-mono uppercase tracking-wider">Endless Waves</span>
                    </button>

                    <button onClick={onStartExploration} className="group relative w-[420px] h-24 bg-gray-900/40 border-l-4 border-white/20 hover:border-purple-500 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        <span className="relative z-10 text-4xl font-black text-white tracking-widest group-hover:text-purple-100 transition-colors">EXPLORE</span>
                        <span className="relative z-10 text-xs text-gray-500 group-hover:text-purple-300 font-mono uppercase tracking-wider">Campaign Mode</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
