import React from 'react';
import { GameState, TurretType } from '../../types';
import { TURRET_COSTS, TURRET_STATS } from '../../data/registry';

interface TurretUpgradeUIProps {
    state: GameState;
    onConfirmUpgrade: (type: TurretType) => void;
}

export const TurretUpgradeUI: React.FC<TurretUpgradeUIProps> = ({ state, onConfirmUpgrade }) => {
    const p = state.player;
    const turretId = state.activeTurretId;
    
    if (turretId === undefined) return null;
    const turret = state.turretSpots[turretId]?.builtTurret;
    if (!turret) return null;

    const upgrades = [
        { type: TurretType.GAUSS, name: "GAUSS CANNON", cost: TURRET_COSTS.upgrade_gauss, desc: "High DPS, Rapid Fire" },
        { type: TurretType.SNIPER, name: "RAILGUN SNIPER", cost: TURRET_COSTS.upgrade_sniper, desc: "Extreme Range, High Damage" },
        { type: TurretType.MISSILE, name: "HELLFIRE MISSILE", cost: TURRET_COSTS.upgrade_missile, desc: "Global Range, Homing, AoE" }
    ];

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-gray-900 border-2 border-emerald-500 p-8 rounded-xl max-w-4xl w-full text-center relative">
                <h2 className="text-3xl font-black text-emerald-500 mb-2">SYSTEM UPGRADE</h2>
                <p className="text-emerald-800 mb-8">SELECT UPGRADE MODULE</p>
                <div className="grid grid-cols-3 gap-6">
                    {upgrades.map(u => {
                        const canAfford = p.score >= u.cost;
                        const stats = TURRET_STATS[u.type];
                        return (
                            <button 
                                key={u.type} 
                                disabled={!canAfford} 
                                onClick={() => onConfirmUpgrade(u.type)} 
                                className={`border-2 p-6 rounded-lg flex flex-col items-center transition-all group ${canAfford ? 'border-gray-700 bg-gray-800 hover:border-emerald-500 hover:bg-gray-700' : 'border-red-900/30 bg-gray-900 opacity-50 cursor-not-allowed'}`}
                            >
                                <div className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300">{u.name}</div>
                                <div className="text-xs text-gray-400 mb-4 h-8">{u.desc}</div>
                                <div className="w-full space-y-2 mb-6">
                                    <div className="flex justify-between text-xs text-gray-500"><span>DMG</span><span className="text-white">{stats.damage}</span></div>
                                    <div className="flex justify-between text-xs text-gray-500"><span>RNG</span><span className="text-white">{stats.range > 2000 ? 'GLOBAL' : stats.range}</span></div>
                                    <div className="flex justify-between text-xs text-gray-500"><span>SPD</span><span className="text-white">{stats.fireRate}ms</span></div>
                                </div>
                                <div className={`text-2xl font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>{u.cost} <span className="text-sm">SCRAPS</span></div>
                            </button>
                        )
                    })}
                </div>
                <div className="mt-8 text-xs text-gray-600">PRESS [ESC] TO CANCEL</div>
            </div>
        </div>
    )
};