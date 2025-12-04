
import React from 'react';
import { GameState, InfrastructureOption, InfrastructureUpgradeType, TurretType } from '../../types';
import { ModuleWindow } from './ModuleWindow';

interface InfrastructureResearchUIProps {
    state: GameState;
    onPurchase: (optionId: string) => void;
    onClose: () => void;
    t: (key: string, params?: any) => string;
}

export const InfrastructureResearchUI: React.FC<InfrastructureResearchUIProps> = ({ state, onPurchase, onClose, t }) => {
    const s = state.spaceship;
    const options = s.infrastructureOptions || [];
    const upgrades = s.infrastructureUpgrades || [];
    const maxUpgrades = 9;
    const isLocked = s.infrastructureLocked;
    const isMaxed = upgrades.length >= maxUpgrades;

    const getUpgradeName = (option: InfrastructureOption) => {
        let valStr = "";
        if (option.type.includes('RATE') || option.type.includes('L1_DMG') || option.type.includes('L1_COST') || option.type.includes('GLOBAL') || option.type.includes('MISSILE_DMG') || option.type.includes('SNIPER_RANGE')) {
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
            onClose={onClose}
            headerRight={headerRight}
            maxWidth="max-w-[1350px]"
        >
            <div className="flex flex-1 gap-8 w-full h-full min-h-0">
                
                {/* Left Panel: Performance Metrics */}
                <div className="w-80 flex-shrink-0 bg-black/40 border-r border-yellow-900/30 p-6 flex flex-col rounded-l-lg">
                    <h3 className="text-yellow-500 font-bold tracking-widest text-sm border-b border-yellow-900/50 pb-2 mb-6 uppercase">
                        {t('CURRENT_OUTPUT')}
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Structural */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-yellow-200">
                                <span className="text-lg">⌂</span>
                                <span className="text-xs font-bold uppercase tracking-wider">STRUCTURAL INTEGRITY</span>
                            </div>
                            <div className="pl-6 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">BASE HP</span>
                                    <span className="text-white font-mono font-bold">+{totalBaseHp}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">TURRET HP</span>
                                    <span className="text-white font-mono font-bold">+{totalTurretHp}</span>
                                </div>
                            </div>
                        </div>

                        {/* Offensive */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-red-300">
                                <span className="text-lg">⚔</span>
                                <span className="text-xs font-bold uppercase tracking-wider">OFFENSIVE GRID</span>
                            </div>
                            <div className="pl-6 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">GLOBAL DMG</span>
                                    <span className="text-white font-mono font-bold">+{Math.round(totalGlobalDmg*100)}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">CYCLE RATE</span>
                                    <span className="text-white font-mono font-bold">+{Math.round(totalGlobalRate*100)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Capacity Status */}
                        <div className="mt-8 border-t border-yellow-900/30 pt-4">
                            <div className="text-xs text-yellow-700 font-bold uppercase tracking-widest mb-2">SYSTEM CAPACITY</div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-yellow-900/50">
                                <div 
                                    className="h-full bg-yellow-600 transition-all duration-500" 
                                    style={{width: `${(upgrades.length / maxUpgrades) * 100}%`}}
                                ></div>
                            </div>
                            <div className="text-right text-[10px] text-yellow-500 font-mono mt-1">
                                {upgrades.length} / {maxUpgrades} SLOTS
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Selection Cards */}
                <div className="flex-1 flex flex-col justify-center items-center relative p-4">
                    <h3 className="text-white font-bold tracking-[0.2em] mb-8 text-lg border-b border-white/10 pb-2">{t('INFRA_AVAILABLE')}</h3>

                    {isLocked || isMaxed ? (
                        <div className="w-full h-64 border-2 border-dashed border-red-900/50 bg-red-900/10 flex flex-col items-center justify-center text-center p-8 rounded-xl">
                            <div className="text-4xl text-red-500 mb-4">⚠</div>
                            <div className="text-red-400 font-bold tracking-widest text-xl mb-2">SYSTEM LOCKED</div>
                            <p className="text-red-300/70 text-sm max-w-md font-mono leading-relaxed">
                                {isMaxed ? t('INFRA_MAXED_MSG') : t('INFRA_LOCKED_MSG')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-6 w-full">
                            {options.map(opt => {
                                const canAfford = state.player.score >= opt.cost;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => canAfford && onPurchase(opt.id)}
                                        disabled={!canAfford}
                                        className={`
                                            relative p-6 border-2 flex flex-col justify-between h-64 transition-all group overflow-hidden rounded-lg
                                            ${canAfford 
                                                ? 'bg-slate-900/80 border-yellow-700 hover:border-yellow-400 hover:bg-slate-800 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                                                : 'bg-slate-950 border-slate-800 opacity-60 cursor-not-allowed'}
                                        `}
                                    >
                                        <div className="text-left">
                                            <div className="text-[10px] text-yellow-600 font-bold tracking-widest mb-2">PROJECT-{opt.id.substring(13,17)}</div>
                                            <div className="text-sm font-bold text-white leading-relaxed group-hover:text-yellow-200 transition-colors">
                                                {getUpgradeName(opt)}
                                            </div>
                                        </div>

                                        <div className="w-full border-t border-yellow-900/30 pt-4 flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] text-slate-500">{t('INFRA_COST')}</div>
                                                <div className={`text-xl font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>
                                                    {opt.cost}
                                                </div>
                                            </div>
                                            {canAfford && <div className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity text-xl">➜</div>}
                                        </div>
                                        
                                        {/* Scan line effect */}
                                        {canAfford && <div className="absolute inset-0 bg-yellow-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel: Research Log (Moved from Left) */}
                <div className="w-80 flex-shrink-0 bg-black/40 border-l border-yellow-900/30 p-6 flex flex-col overflow-hidden rounded-r-lg">
                    <h3 className="text-yellow-500 font-bold tracking-widest text-sm border-b border-yellow-900/50 pb-2 mb-4 uppercase">
                        {t('INFRA_ACQUIRED')}
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-transparent">
                        {upgrades.length === 0 && <div className="text-slate-600 text-xs italic text-center py-8">NO DATA FOUND</div>}
                        {upgrades.map((u, i) => (
                            <div key={u.id} className="bg-yellow-900/10 border border-yellow-900/30 p-3 text-xs text-yellow-200/80 rounded">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-yellow-500">#{i+1}</span>
                                    <span className="text-[10px] text-yellow-700 font-mono tracking-wider">{u.type.split('_').slice(0,2).join(' ')}</span>
                                </div>
                                <div className="leading-tight">{getUpgradeName(u)}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </ModuleWindow>
    );
};
