
import React, { useEffect, useState } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { ModuleWindow } from './ModuleWindow';
import { CyberPanel } from './atoms/CyberPanel';
import { CyberButton } from './atoms/CyberButton';
import { DS } from '../../theme/designSystem';

export const MissionSuccessScreen: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const [tallyScore, setTallyScore] = useState(0);
    
    useEffect(() => {
        const target = Math.floor(state.player.score);
        const duration = 1500;
        const start = Date.now();
        
        const tick = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
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

    const headerRight = (
        <div className="flex flex-col items-end">
            <span className={`${DS.text.label} text-emerald-500`}>{t('PROTOCOL_ZULU')}</span>
            <span className="text-emerald-300 font-bold">{t('UPLINK_EST')}</span>
        </div>
    );

    return (
        <ModuleWindow
            title={t('SECTOR_PACIFIED')}
            subtitle={t('MISSION_OBJ') + ": " + t('COMPLETE')}
            theme="emerald"
            onClose={() => {}} 
            headerRight={headerRight}
            maxWidth="max-w-5xl"
        >
            <div className="flex flex-col h-full w-full p-8 gap-8">
                
                <div className="flex-1 grid grid-cols-2 gap-8 min-h-0">
                    {/* Left: Resource Tally */}
                    <CyberPanel className="flex flex-col justify-center items-center relative overflow-hidden group bg-black/40" decorated>
                        <div className={`${DS.text.label} text-emerald-500 mb-4`}>{t('RESOURCES_SECURED')}</div>
                        <div className="text-7xl font-display font-bold text-yellow-400 tabular-nums tracking-tighter group-hover:scale-110 transition-transform drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                            {tallyScore}
                        </div>
                        <div className="text-xs text-yellow-600 font-bold mt-2">{t('SCRAPS_TRANSFER')}</div>
                    </CyberPanel>

                    {/* Right: Combat Stats */}
                    <div className="flex flex-col gap-4">
                        <CyberPanel className="flex-1 flex justify-between items-center px-8 bg-black/40">
                            <div className="text-left">
                                <div className={`${DS.text.label} text-emerald-600 mb-1`}>{t('HOSTILES_NEUTRALIZED')}</div>
                                <div className="text-4xl font-display text-white font-bold">{totalKills}</div>
                            </div>
                            <div className="text-4xl text-emerald-800">☠</div>
                        </CyberPanel>
                        
                        <CyberPanel className="flex-1 flex justify-between items-center px-8 bg-black/40">
                            <div className="text-left">
                                <div className={`${DS.text.label} text-emerald-600 mb-1`}>{t('BASE_INTEGRITY')}</div>
                                <div className={`text-4xl font-display font-bold ${baseIntegrity > 80 ? 'text-green-400' : baseIntegrity > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {baseIntegrity}%
                                </div>
                            </div>
                            <div className="text-4xl text-emerald-800">⌂</div>
                        </CyberPanel>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <p className={`${DS.text.body} text-center max-w-lg border-t border-emerald-900/30 pt-4`}>
                        {t('SUCCESS_DESC')}
                    </p>

                    <CyberButton 
                        onClick={() => engine.sessionManager.ascendToOrbit()}
                        variant="emerald"
                        className="py-4 px-16 text-xl w-96"
                        label={t('INITIATE_ASCENT')}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        }
                    />
                </div>

            </div>
        </ModuleWindow>
    );
};
