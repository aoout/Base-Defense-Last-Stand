
import React from 'react';
import { InfrastructureOption, InfrastructureUpgradeType } from '../../types';
import { ModuleWindow } from './ModuleWindow';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

export const InfrastructureResearchUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const s = state.spaceship;
    const options = s.infrastructureOptions || [];
    const upgrades = s.infrastructureUpgrades || [];
    const maxUpgrades = 9;
    const isLocked = s.infrastructureLocked;
    const isMaxed = upgrades.length >= maxUpgrades;

    const handlePurchase = (optionId: string) => {
        engine.purchaseInfrastructureUpgrade(optionId);
    }

    const handleClose = () => {
        engine.exitInfrastructureResearch();
    }

    const getUpgradeName = (option: InfrastructureOption) => {
        let valStr = "";
        // Determine format based on type (percentage vs absolute)
        const isPercent = 
            option.type.includes('RATE') || 
            option.type.includes('L1_DMG') || 
            option.type.includes('L1_COST') || 
            option.type.includes('GLOBAL') || 
            option.type.includes('MISSILE_DMG') || 
            option.type.includes('SNIPER_RANGE');

        if (isPercent) {
            valStr = Math.round(option.value * 100).toString();
        } else {
            valStr = option.value.toString();
        }
        return t(`INFRA_${option.type}_DESC`, {0: valStr});
    }

    // Calculate Totals for Statistics Panel
    let totalBaseHp = 0;
    let totalTurretHp = 0;
    let totalGlobalDmg = 0;
    let totalGlobalRate = 0;
    
    upgrades.forEach(u => {
        if (u.type === InfrastructureUpgradeType.BASE_HP) totalBaseHp += u.value;
        if (u.type === InfrastructureUpgradeType.TURRET_HP) totalTurretHp += u.value;
        if (u.type === InfrastructureUpgradeType.GLOBAL_TURRET_DMG) totalGlobalDmg += u.value;
        if (u.type === InfrastructureUpgradeType.GLOBAL_TURRET_RATE) totalGlobalRate += u.value;
    });

    const headerRight = (
        <div className="flex flex-col items-end mr-16">
            <div className="text-yellow-600 text-[10px] font-bold tracking-widest uppercase mb-1">{t('AVAILABLE_FUNDS')}</div>
            <div className="text-3xl font-mono text-white font-bold">{Math.floor(state.player.score)} <span className="text-sm text-yellow-500">{t('SCRAPS')}</span></div>
        </div>
    );

    return (
        <ModuleWindow
            title={t('INFRA_TITLE')}
            subtitle={t('INFRA_SUB')}
            theme="yellow"
            onClose={handleClose}
            headerRight={headerRight}
            maxWidth="max-w-[1350px]"
        >
            <div className="flex flex-1 gap-8 w-full h-full min-h-0">
                
                {/* Left Panel: Performance Metrics */}
                <div className="w-72 flex flex-col gap-4 shrink-0 bg-black/40 border border-yellow-900/30 p-6 rounded-lg">
                    <h3 className="text-yellow-500 font-bold tracking-widest text-sm border-b border-yellow-900/50 pb-2 mb-4 uppercase">{t('XENO_STATS')}</h3>
                    
                    <div className="space-y-4 font-mono text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">BASE HP BONUS</span>
                            <span className="text-white font-bold">+{totalBaseHp}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">TURRET HP BONUS</span>
                            <span className="text-white font-bold">+{totalTurretHp}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">GLOBAL DMG</span>
                            <span className="text-yellow-400 font-bold">+{Math.round(totalGlobalDmg * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">GLOBAL RATE</span>
                            <span className="text-yellow-400 font-bold">+{Math.round(totalGlobalRate * 100)}%</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-yellow-900/30">
                        <div className="text-[10px] text-slate-500 mb-1 tracking-widest">CAPACITY</div>
                        <div className="flex gap-1 h-2">
                            {Array.from({length: maxUpgrades}).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`flex-1 rounded-sm ${i < upgrades.length ? 'bg-yellow-500' : 'bg-slate-800'}`}
                                />
                            ))}
                        </div>
                        <div className="text-right text-[10px] text-yellow-600 mt-1">{upgrades.length} / {maxUpgrades}</div>
                    </div>
                </div>

                {/* Center: Selection Cards */}
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    {isMaxed ? (
                        <div className="text-yellow-500 font-bold tracking-widest text-lg border border-yellow-500/50 p-8 bg-yellow-900/10 rounded">
                            {t('INFRA_MAXED_MSG')}
                        </div>
                    ) : isLocked ? (
                        <div className="text-slate-500 font-bold tracking-widest text-sm border border-slate-700 p-8 bg-black/40 rounded max-w-md text-center">
                            {t('INFRA_LOCKED_MSG')}
                        </div>
                    ) : (
                        <div className="flex gap-4 w-full justify-center">
                            {options.map(opt => {
                                const canAfford = state.player.score >= opt.cost;
                                return (
                                    <button 
                                        key={opt.id}
                                        onClick={() => canAfford && handlePurchase(opt.id)}
                                        disabled={!canAfford}
                                        className={`
                                            flex-1 max-w-[280px] h-80 border-2 rounded-xl p-6 flex flex-col justify-between items-center transition-all group relative overflow-hidden
                                            ${canAfford 
                                                ? 'bg-slate-900 border-slate-600 hover:border-yellow-400 hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                                                : 'bg-black/40 border-red-900/30 opacity-60 cursor-not-allowed'}
                                        `}
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl group-hover:opacity-20 transition-opacity">🏗</div>
                                        
                                        <div className="text-center w-full relative z-10">
                                            <div className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mb-2 uppercase">PROJECT</div>
                                            <div className="text-yellow-100 font-bold text-sm leading-snug h-12 flex items-center justify-center">
                                                {getUpgradeName(opt)}
                                            </div>
                                        </div>

                                        <div className="w-16 h-16 border border-yellow-500/30 rounded-full flex items-center justify-center text-yellow-500 text-2xl bg-black/20 group-hover:bg-yellow-500/10 transition-colors">
                                            +
                                        </div>

                                        <div className="w-full text-center relative z-10">
                                            <div className="text-[10px] text-slate-500 mb-1">{t('INFRA_COST')}</div>
                                            <div className={`text-xl font-mono font-bold ${canAfford ? 'text-white' : 'text-red-500'}`}>
                                                {opt.cost}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel: Acquired Log */}
                <div className="w-72 bg-black/20 border-l border-yellow-900/30 p-0 flex flex-col overflow-hidden rounded-r-lg">
                    <div className="bg-slate-900/50 p-4 border-b border-yellow-900/30">
                        <h3 className="text-yellow-600 font-bold text-xs tracking-widest uppercase">{t('INFRA_ACQUIRED')}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-yellow-900">
                        {upgrades.length === 0 && <div className="text-slate-600 text-xs italic text-center mt-10">NO UPGRADES</div>}
                        {upgrades.map((u, i) => (
                            <div key={i} className="bg-slate-800/50 border-l-2 border-yellow-600 p-3 text-xs text-slate-300">
                                {getUpgradeName(u)}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </ModuleWindow>
    );
};
