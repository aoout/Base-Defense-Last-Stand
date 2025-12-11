
import React, { useEffect, useState } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { ModuleWindow } from './ModuleWindow';
import { CyberPanel } from './atoms/CyberPanel';
import { CyberButton } from './atoms/CyberButton';
import { DS } from '../../theme/designSystem';

export const PlanetaryYieldReport: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const report = state.pendingYieldReport;
    const [animatedTotal, setAnimatedTotal] = useState(0);

    const handleClaim = () => {
        engine.claimYields();
    }

    useEffect(() => {
        if (!report) return;
        const target = report.totalYield;
        const duration = 1500;
        const start = Date.now();

        const tick = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
            const ease = 1 - Math.pow(1 - progress, 4); // Ease out quart
            
            setAnimatedTotal(Math.floor(target * ease));

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    }, [report]);

    if (!report) return null;

    const headerRight = (
        <div className="text-right text-emerald-500 font-mono text-[10px]">
            LOG_ID: {Date.now().toString(16).toUpperCase()}
        </div>
    );

    return (
        <ModuleWindow
            title={t('REPORT_TITLE')}
            subtitle={t('REPORT_SUB')}
            theme="emerald"
            onClose={() => {}} // No close button, must claim
            headerRight={headerRight}
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col h-full p-8 w-full">
                
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 pb-2 mb-4 border-b border-emerald-900/50 px-4">
                    <div className={`${DS.text.label} text-slate-500`}>{t('REPORT_COL_PLANET')}</div>
                    <div className={`${DS.text.label} text-right text-green-500`}>{t('REPORT_COL_BIO')}</div>
                    <div className={`${DS.text.label} text-right text-blue-500`}>{t('REPORT_COL_OXY')}</div>
                    <div className={`${DS.text.label} text-right text-white`}>{t('REPORT_COL_TOTAL')}</div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-8 pr-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent min-h-0">
                    {report.items.map((item, idx) => (
                        <div 
                            key={item.planetId} 
                            className="grid grid-cols-4 gap-4 py-3 px-4 bg-emerald-900/10 border border-emerald-900/30 items-center hover:bg-emerald-900/20 transition-colors animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="font-bold text-white text-sm">{item.planetName}</div>
                            <div className="text-right text-green-400 font-mono">+{item.biomassYield}</div>
                            <div className="text-right text-blue-400 font-mono">+{item.oxygenYield}</div>
                            <div className="text-right text-yellow-400 font-mono font-bold">+{item.total}</div>
                        </div>
                    ))}
                </div>

                {/* Footer Total */}
                <CyberPanel className="p-6 flex justify-between items-center mb-8 bg-black/40" decorated>
                    <div className={`${DS.text.label} text-emerald-500`}>{t('REPORT_NET_GAIN')}</div>
                    <div className="text-5xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        +{animatedTotal}
                    </div>
                </CyberPanel>

                <CyberButton 
                    onClick={handleClaim}
                    variant="emerald"
                    className="w-full py-4 text-lg"
                    label={t('REPORT_TRANSFER')}
                />
            </div>
        </ModuleWindow>
    );
};
