
import React from 'react';
import { GalacticEventType } from '../../types';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CyberPanel } from './atoms/CyberPanel';
import { CyberButton } from './atoms/CyberButton';
import { DS, Variant } from '../../theme/designSystem';

export const GalacticEventModal: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const event = state.activeGalacticEvent;

    if (!event) return null;

    let titleKey = '';
    let descKey = '';
    let effectKey = '';
    let effectParam = '';
    let theme: Variant = 'cyan';
    let icon = '';

    switch(event.type) {
        case GalacticEventType.EXPANSION:
            titleKey = 'EVENT_EXPANSION_TITLE';
            descKey = 'EVENT_EXPANSION_DESC';
            effectKey = 'EVENT_EXPANSION_EFFECT';
            theme = 'purple';
            icon = '☣';
            break;
        case GalacticEventType.INVASION:
            titleKey = 'EVENT_INVASION_TITLE';
            descKey = 'EVENT_INVASION_DESC';
            effectKey = 'EVENT_INVASION_EFFECT';
            theme = 'red';
            icon = '⚠';
            if (event.targetPlanetId) {
                const p = state.planets.find(p => p.id === event.targetPlanetId);
                if (p) descKey = `PLANET: ${p.name}`;
            }
            break;
        case GalacticEventType.SALVAGE:
            titleKey = 'EVENT_SALVAGE_TITLE';
            descKey = 'EVENT_SALVAGE_DESC';
            effectKey = 'EVENT_SALVAGE_EFFECT';
            effectParam = event.scrapsReward?.toString() || '0';
            theme = 'yellow';
            icon = '⟡';
            break;
    }

    const targetPlanet = event.targetPlanetId ? state.planets.find(p => p.id === event.targetPlanetId) : null;

    return (
        <div className="absolute inset-0 z-[300] bg-black/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm animate-fadeIn">
            <CyberPanel className="w-[600px] p-8 flex flex-col items-center text-center relative" decorated>
                <div className={`text-6xl mb-4 animate-pulse text-${theme}-500`}>{icon}</div>
                
                <h2 className={`${DS.text.header} text-3xl text-white mb-4 drop-shadow-md`}>
                    {t(titleKey)}
                </h2>
                
                <div className={`w-full h-px bg-${theme}-500/50 mb-6`}></div>

                <p className={`${DS.text.body} mb-8 max-w-md`}>
                    {targetPlanet ? `${t('EVENT_INVASION_DESC')} [TARGET: ${targetPlanet.name}]` : t(descKey)}
                </p>

                <div className={`bg-${theme}-900/20 w-full p-4 border border-${theme}-500/30 mb-8 rounded`}>
                    <span className={`${DS.text.label} text-${theme}-400 mb-1 block`}>EFFECT ANALYSIS</span>
                    <span className="font-mono text-lg font-bold text-white">
                        {t(effectKey, {0: effectParam})}
                    </span>
                </div>

                <CyberButton 
                    onClick={() => engine.closeGalacticEvent()}
                    variant={theme}
                    label={t('ACKNOWLEDGE')}
                    className="px-12 py-3"
                />
            </CyberPanel>
        </div>
    );
};
