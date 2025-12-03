
import React from 'react';
import { GalacticEvent, GalacticEventType, GameState } from '../../types';

interface GalacticEventModalProps {
    event: GalacticEvent;
    state: GameState;
    onClose: () => void;
    t: (key: string, params?: any) => string;
}

export const GalacticEventModal: React.FC<GalacticEventModalProps> = ({ event, state, onClose, t }) => {
    let titleKey = '';
    let descKey = '';
    let effectKey = '';
    let effectParam = '';
    let colorClass = '';
    let icon = '';

    switch(event.type) {
        case GalacticEventType.EXPANSION:
            titleKey = 'EVENT_EXPANSION_TITLE';
            descKey = 'EVENT_EXPANSION_DESC';
            effectKey = 'EVENT_EXPANSION_EFFECT';
            colorClass = 'border-purple-500 text-purple-400 bg-purple-900/90';
            icon = '☣';
            break;
        case GalacticEventType.INVASION:
            titleKey = 'EVENT_INVASION_TITLE';
            descKey = 'EVENT_INVASION_DESC';
            effectKey = 'EVENT_INVASION_EFFECT';
            colorClass = 'border-red-500 text-red-400 bg-red-900/90';
            icon = '⚠';
            if (event.targetPlanetId) {
                const p = state.planets.find(p => p.id === event.targetPlanetId);
                if (p) descKey = `PLANET: ${p.name}`; // Override desc slightly or just show target
            }
            break;
        case GalacticEventType.SALVAGE:
            titleKey = 'EVENT_SALVAGE_TITLE';
            descKey = 'EVENT_SALVAGE_DESC';
            effectKey = 'EVENT_SALVAGE_EFFECT';
            effectParam = event.scrapsReward?.toString() || '0';
            colorClass = 'border-yellow-500 text-yellow-400 bg-yellow-900/90';
            icon = '⟡';
            break;
    }

    const targetPlanet = event.targetPlanetId ? state.planets.find(p => p.id === event.targetPlanetId) : null;

    return (
        <div className="absolute inset-0 z-[300] bg-black/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
            <div className={`w-[600px] border-4 p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden ${colorClass}`}>
                {/* Glitch Overlay */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.2)_3px)] pointer-events-none"></div>
                
                <div className="text-6xl mb-4 animate-pulse">{icon}</div>
                
                <h2 className="text-3xl font-display font-black tracking-widest uppercase mb-4 text-white drop-shadow-md">
                    {t(titleKey)}
                </h2>
                
                <div className="w-full h-px bg-white/30 mb-6"></div>

                <p className="text-white/80 font-mono text-sm leading-relaxed mb-6">
                    {targetPlanet ? `${t('EVENT_INVASION_DESC')} [TARGET: ${targetPlanet.name}]` : t(descKey)}
                </p>

                <div className="bg-black/40 w-full p-4 border border-white/20 mb-8">
                    <span className="font-bold text-xs tracking-[0.2em] uppercase block mb-1">EFFECT ANALYSIS</span>
                    <span className="font-mono text-lg font-bold text-white">
                        {t(effectKey, {0: effectParam})}
                    </span>
                </div>

                <button 
                    onClick={onClose}
                    className="px-12 py-3 bg-black/60 border-2 border-white/50 hover:bg-white hover:text-black transition-all font-black tracking-[0.2em] uppercase text-sm"
                >
                    {t('ACKNOWLEDGE')}
                </button>
            </div>
        </div>
    );
};
