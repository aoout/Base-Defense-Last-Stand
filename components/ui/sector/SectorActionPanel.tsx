
import React from 'react';
import { Planet, SpaceshipState, PlanetBuildingType } from '../../../types';
import { PlanetInfoPanel } from '../PlanetInfoPanel';
import { Icons } from '../Icons';
import { useLocale } from '../../contexts/LocaleContext';

interface SectorActionPanelProps {
    planet: Planet;
    spaceship: SpaceshipState;
    playerScore: number;
    dropCost: number;
    onClose: () => void;
    onShowDetail: () => void;
    onDeploy: (id: string) => void;
    onConstruct: () => void;
}

export const SectorActionPanel: React.FC<SectorActionPanelProps> = ({ 
    planet, spaceship, playerScore, dropCost, onClose, onShowDetail, onDeploy, onConstruct 
}) => {
    const { t } = useLocale();
    const canAfford = playerScore >= dropCost;

    return (
        <div className="pointer-events-auto animate-slideInRight w-[400px] flex flex-col gap-2">
            
            {/* 1. The Info Panel Card */}
            <div className="relative">
                <button 
                    onClick={onClose} 
                    className="absolute -top-3 -right-3 z-50 bg-black text-slate-500 hover:text-white border border-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-lg hover:border-white transition-all"
                >
                    ✕
                </button>
                <PlanetInfoPanel 
                    planet={planet} 
                    spaceship={spaceship}
                    onShowDetail={onShowDetail}
                />
            </div>

            {/* 2. Docked Action Bar (Glass Style) */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-2xl">
                
                {/* Cost Indicator */}
                <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('DROP_COST')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-mono font-bold tracking-tighter ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>
                            {dropCost}
                        </span>
                        <span className="text-[9px] text-slate-500">BIO</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    {planet.completed ? (
                        <button
                            onClick={onConstruct}
                            className="col-span-2 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-600/50 text-yellow-100 py-3 rounded font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                        >
                            <div className="w-4 h-4"><svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2"><Icons.Crane /></svg></div>
                            {t('PC_BTN')}
                        </button>
                    ) : (
                        <button
                            onClick={() => onDeploy(planet.id)}
                            disabled={!canAfford}
                            className={`col-span-2 py-4 rounded font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg
                                ${canAfford 
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30' 
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                            `}
                        >
                            {canAfford ? (
                                <>
                                    <div className="w-4 h-4 animate-bounce"><svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2"><Icons.DropPod /></svg></div>
                                    {t('INITIATE_DROP')}
                                </>
                            ) : (
                                <>
                                    <div className="w-4 h-4"><svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor"><Icons.Lock /></svg></div>
                                    {t('INSUFFICIENT_FUNDS')}
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={onShowDetail}
                        className="col-span-2 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-200 py-2 rounded font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:border-cyan-400"
                    >
                        <div className="w-3 h-3"><svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2"><Icons.Analysis /></svg></div>
                        {t('FULL_ANALYSIS_BTN')}
                    </button>
                </div>
            </div>
        </div>
    );
};
