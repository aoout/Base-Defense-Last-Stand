
import React, { useEffect } from 'react';
import { GameState, InfrastructureOption } from '../../types';
import { CloseButton } from './Shared';

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

    return (
        <div className="absolute inset-0 z-[250] bg-slate-950 flex items-center justify-center pointer-events-auto select-none font-mono">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(234,179,8,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]"></div>
            </div>

            <div className="relative w-full max-w-6xl h-[90vh] flex flex-col p-8 bg-slate-900/90 border border-yellow-900/50 rounded-xl shadow-2xl backdrop-blur-md">
                <CloseButton onClick={onClose} colorClass="absolute top-6 right-6 border-yellow-700 text-yellow-500 hover:text-white hover:bg-yellow-900 z-50" />

                {/* Header */}
                <div className="text-center mb-12 relative z-10">
                    <h1 className="text-5xl font-display font-black text-white tracking-widest uppercase mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        {t('INFRA_TITLE')} <span className="text-yellow-500">{t('INFRA_SUB')}</span>
                    </h1>
                    <div className="flex justify-center items-center gap-4">
                        <div className="h-px w-24 bg-yellow-900"></div>
                        <div className="text-yellow-700 text-xs font-bold tracking-[0.3em] uppercase">
                            CAPACITY: {upgrades.length} / {maxUpgrades}
                        </div>
                        <div className="h-px w-24 bg-yellow-900"></div>
                    </div>
                </div>

                <div className="flex-1 flex gap-8 min-h-0">
                    
                    {/* Left Panel: Acquired Tech */}
                    <div className="w-1/3 bg-black/40 border border-yellow-900/30 p-6 flex flex-col overflow-hidden rounded-lg">
                        <h3 className="text-yellow-500 font-bold tracking-widest text-sm border-b border-yellow-900/50 pb-2 mb-4">
                            {t('INFRA_ACQUIRED')}
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-transparent">
                            {upgrades.length === 0 && <div className="text-slate-600 text-xs italic text-center py-8">NO DATA FOUND</div>}
                            {upgrades.map((u, i) => (
                                <div key={u.id} className="bg-yellow-900/10 border border-yellow-900/30 p-3 text-xs text-yellow-200/80">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-yellow-500">#{i+1}</span>
                                        <span className="text-[10px] text-yellow-700">{u.type}</span>
                                    </div>
                                    <div>{getUpgradeName(u)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Selection Cards */}
                    <div className="flex-1 flex flex-col justify-center items-center relative">
                        {/* Funds */}
                        <div className="absolute top-0 right-0 bg-black/40 border border-yellow-900/50 px-4 py-2">
                            <div className="text-xs text-yellow-600 font-bold uppercase tracking-widest">{t('AVAILABLE_FUNDS')}</div>
                            <div className="text-xl text-white font-display font-bold">{Math.floor(state.player.score)} <span className="text-xs">SCRAPS</span></div>
                        </div>

                        <h3 className="text-white font-bold tracking-[0.2em] mb-8 text-lg">{t('INFRA_AVAILABLE')}</h3>

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
                                                relative p-6 border-2 flex flex-col justify-between h-64 transition-all group overflow-hidden
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
                </div>
            </div>
        </div>
    );
};
