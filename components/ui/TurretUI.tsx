
import React from 'react';
import { TurretType, GameEventType, DefenseUpgradeTurretEvent } from '../../types';
import { TURRET_COSTS, TURRET_STATS } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

export const TurretUpgradeUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const turretId = state.activeTurretId;
    
    if (turretId === undefined) return null;
    const turret = state.turretSpots[turretId]?.builtTurret;
    if (!turret) return null;

    const handleConfirmUpgrade = (type: TurretType) => {
        engine.eventBus.emit<DefenseUpgradeTurretEvent>(GameEventType.DEFENSE_UPGRADE_TURRET, { type });
    };

    const upgrades = [
        { type: TurretType.GAUSS, name: t('GAUSS_NAME'), cost: TURRET_COSTS.upgrade_gauss, desc: t('GAUSS_DESC') },
        { type: TurretType.SNIPER, name: t('SNIPER_NAME'), cost: TURRET_COSTS.upgrade_sniper, desc: t('SNIPER_DESC') },
        { type: TurretType.MISSILE, name: t('MISSILE_NAME'), cost: TURRET_COSTS.upgrade_missile, desc: t('MISSILE_DESC') }
    ];

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-gray-900 border-2 border-emerald-500 p-8 rounded-xl max-w-4xl w-full text-center relative">
                <h2 className="text-3xl font-black text-emerald-500 mb-2">{t('SYSTEM_UPGRADE')}</h2>
                <p className="text-emerald-800 mb-8">{t('SELECT_MODULE')}</p>
                <div className="grid grid-cols-3 gap-6">
                    {upgrades.map(u => {
                        const canAfford = p.score >= u.cost;
                        const stats = TURRET_STATS[u.type];
                        return (
                            <button 
                                key={u.type} 
                                disabled={!canAfford} 
                                onClick={() => handleConfirmUpgrade(u.type)} 
                                className={`border-2 p-6 rounded-lg flex flex-col items-center transition-all group ${canAfford ? 'border-gray-700 bg-gray-800 hover:border-emerald-500 hover:bg-gray-700' : 'border-red-900/30 bg-gray-900 opacity-50 cursor-not-allowed'}`}
                            >
                                <div className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300">{u.name}</div>
                                <div className="text-xs text-gray-400 mb-4 h-8">{u.desc}</div>
                                <div className="w-full space-y-2 mb-6">
                                    <div className="flex justify-between text-xs text-gray-500"><span>{t('DMG')}</span><span className="text-white">{stats.damage}</span></div>
                                    <div className="flex justify-between text-xs text-gray-500"><span>{t('RNG')}</span><span className="text-white">{stats.range > 2000 ? t('GLOBAL') : stats.range}</span></div>
                                    <div className="flex justify-between text-xs text-gray-500"><span>{t('SPD')}</span><span className="text-white">{stats.fireRate}ms</span></div>
                                </div>
                                <div className={`text-2xl font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>{u.cost} <span className="text-sm">{t('SCRAPS')}</span></div>
                            </button>
                        )
                    })}
                </div>
                <div className="mt-8 text-xs text-gray-600">{t('CANCEL_HINT')}</div>
            </div>
        </div>
    )
};
