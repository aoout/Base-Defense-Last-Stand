
import React, { useState, useEffect } from 'react';
import { ModuleWindow } from './ModuleWindow';
import { UserAction } from '../../types';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CloseButton } from './Shared';

interface KeyBindingUIProps {
    onClose: () => void;
}

export const KeyBindingUI: React.FC<KeyBindingUIProps> = ({ onClose }) => {
    const { engine } = useGame();
    const { t } = useLocale();
    const [listeningAction, setListeningAction] = useState<UserAction | null>(null);
    const [refresh, setRefresh] = useState(0); // Force re-render after rebind

    const handleKeyListen = (e: KeyboardEvent) => {
        if (!listeningAction) return;
        
        e.preventDefault();
        e.stopPropagation();

        // Prevent binding Escape if it's the cancel key
        if (e.code === 'Escape') {
            setListeningAction(null);
            return;
        }

        engine.inputManager.rebind(listeningAction, e.code);
        setListeningAction(null);
        setRefresh(r => r + 1);
    };

    useEffect(() => {
        if (listeningAction) {
            window.addEventListener('keydown', handleKeyListen, { capture: true });
        }
        return () => {
            window.removeEventListener('keydown', handleKeyListen, { capture: true });
        };
    }, [listeningAction]);

    const handleReset = () => {
        engine.inputManager.resetToDefaults();
        setRefresh(r => r + 1);
    };

    const formatKeyCode = (code: string) => {
        if (code.startsWith('Key')) return code.replace('Key', '');
        if (code.startsWith('Digit')) return code.replace('Digit', '');
        if (code.startsWith('Arrow')) return code.replace('Arrow', '↑');
        return code.toUpperCase();
    };

    // Group actions for better layout
    const groups = [
        { label: 'MOVEMENT', actions: [UserAction.MOVE_UP, UserAction.MOVE_DOWN, UserAction.MOVE_LEFT, UserAction.MOVE_RIGHT] },
        { label: 'COMBAT', actions: [UserAction.RELOAD, UserAction.GRENADE, UserAction.WEAPON_1, UserAction.WEAPON_2, UserAction.WEAPON_3, UserAction.WEAPON_4] },
        { label: 'INTERACTION', actions: [UserAction.INTERACT, UserAction.SHOP, UserAction.INVENTORY, UserAction.TACTICAL_MENU, UserAction.SKIP_WAVE] },
        { label: 'TACTICAL', actions: [UserAction.ORDER_1, UserAction.ORDER_2, UserAction.ORDER_3] },
        { label: 'SYSTEM', actions: [UserAction.PAUSE, UserAction.ESCAPE] },
    ];

    return (
        <div className="absolute inset-0 z-[300] bg-black/80 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
            <div className="w-[800px] bg-slate-900 border-2 border-cyan-600 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-8 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6 border-b border-cyan-900 pb-4">
                    <div>
                        <h2 className="text-2xl font-display font-black text-white tracking-widest">{t('INPUT_TITLE')}</h2>
                        <p className="text-cyan-600 text-xs font-mono tracking-widest">{t('INPUT_SUB')}</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 text-[10px] border border-red-900 text-red-500 hover:bg-red-900/20 uppercase tracking-widest transition-colors"
                        >
                            {t('INPUT_RESET')}
                        </button>
                        <CloseButton onClick={onClose} colorClass="border-cyan-600 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-900">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        {groups.map(group => (
                            <div key={group.label} className="flex flex-col gap-2">
                                <h3 className="text-slate-500 font-bold text-xs tracking-widest border-b border-slate-800 pb-1 mb-2">{group.label}</h3>
                                {group.actions.map(action => {
                                    const currentKey = engine.inputManager.getKeyForAction(action);
                                    const isListening = listeningAction === action;
                                    const locKey = `ACT_${action}`; // e.g. ACT_MOVE_UP

                                    return (
                                        <div key={action} className="flex justify-between items-center bg-slate-900/50 p-2 border border-slate-800 hover:border-cyan-800 transition-colors">
                                            <span className="text-xs text-slate-300 font-bold uppercase">{t(locKey)}</span>
                                            <button
                                                onClick={() => setListeningAction(action)}
                                                className={`
                                                    min-w-[80px] text-center text-xs font-mono py-1 px-2 border rounded transition-all
                                                    ${isListening 
                                                        ? 'bg-cyan-600 text-white border-cyan-400 animate-pulse' 
                                                        : 'bg-black text-cyan-500 border-cyan-900 hover:border-cyan-500 hover:text-cyan-300'}
                                                `}
                                            >
                                                {isListening ? "..." : formatKeyCode(currentKey)}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
                    {listeningAction ? t('INPUT_PRESS_KEY') : t('INPUT_SUB')}
                </div>
            </div>
        </div>
    );
};
