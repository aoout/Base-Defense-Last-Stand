


import React from 'react';
import { GameState, WeaponType, GameMode, MissionType, BossType } from '../../types';
import { WEAPONS, PLAYER_STATS } from '../../data/registry';
import { WeaponIcon } from './Shared';

interface HUDProps {
    state: GameState;
    t: (key: string) => string;
    onSkipWave: () => void;
}

export const HUD: React.FC<HUDProps> = ({ state, t, onSkipWave }) => {
    const p = state.player;
    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    const currentWep = p.weapons[currentWeaponType];
    const wepStats = WEAPONS[currentWeaponType];

    const isOffenseMode = state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE;
    const hiveMother = state.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);

    const secondsLeft = Math.ceil(state.waveTimeRemaining / 1000);
    const formattedTime = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`;
    
    // Skip Wave Logic
    const elapsedWaveTime = state.waveDuration - state.waveTimeRemaining;
    const canSkip = !isOffenseMode && elapsedWaveTime >= 10000;
    const skipReward = Math.max(0, Math.floor((state.waveTimeRemaining / 1000) * state.wave));

    return (
        <>
            {/* Top Center: Wave Counter & Skip Button */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="flex items-center gap-4">
                    {/* Wave Status */}
                    <div className="bg-black/60 px-8 py-2 rounded-full border border-gray-600 backdrop-blur-sm shadow-lg flex flex-col items-center min-w-[200px]">
                        {isOffenseMode ? (
                            <>
                                <div className="flex items-center">
                                    <span className="text-red-400 text-xs font-bold tracking-[0.2em]">OFFENSE MISSION</span>
                                </div>
                                
                                {/* New HP Bar */}
                                {hiveMother && (
                                    <div className="w-full h-3 bg-gray-900 border border-red-900 mt-2 mb-1 relative">
                                        <div 
                                            className="h-full bg-red-600 transition-all duration-300"
                                            style={{ width: `${Math.max(0, (hiveMother.hp / hiveMother.maxHp) * 100)}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-mono shadow-sm">
                                            {Math.ceil(hiveMother.hp)} / {Math.ceil(hiveMother.maxHp)}
                                        </div>
                                    </div>
                                )}

                                <div className="text-red-500 font-mono text-xl font-bold tracking-widest leading-none mt-1">
                                    ARMOR: {hiveMother?.armorValue ?? '??'}%
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center">
                                    <span className="text-gray-400 text-xs font-bold tracking-[0.2em] mr-3">WAVE</span>
                                    <span className="text-white text-3xl font-black italic">{state.wave}</span>
                                    {state.gameMode === GameMode.EXPLORATION && state.currentPlanet && (
                                        <span className="text-gray-500 text-sm ml-2 font-mono">/ {state.currentPlanet.totalWaves}</span>
                                    )}
                                </div>
                                <div className="text-yellow-400 font-mono text-xl font-bold tracking-widest leading-none mt-1">
                                    {formattedTime}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Lure / Skip Button */}
                    {canSkip && (
                        <button 
                            onClick={onSkipWave}
                            className="bg-cyan-900/80 hover:bg-cyan-600 border border-cyan-500 text-cyan-100 px-4 py-2 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex flex-col items-center group animate-fadeIn"
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase mb-0.5">{t('SKIP_WAVE')}</span>
                            <span className="text-xs font-mono group-hover:text-white">+{skipReward} SCRAPS</span>
                            <div className="text-[8px] text-cyan-400 mt-1">[L] TO DEPLOY</div>
                        </button>
                    )}
                </div>
            </div>

            {/* Top Right: Score */}
            <div className="absolute top-6 right-6">
                <div className="bg-black/60 px-6 py-3 rounded-xl border border-yellow-600/40 backdrop-blur-sm flex items-center gap-4 shadow-lg">
                    <div className="flex flex-col items-end">
                        <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">{t('SCRAPS')}</span>
                        <span className="text-3xl font-mono font-bold text-white leading-none">{Math.floor(p.score)}</span>
                    </div>
                    <div className="text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Bottom Left: Health & Base */}
            <div className="absolute bottom-6 left-6 w-72">
                <div className="bg-black/70 p-4 rounded-xl border border-blue-900/50 backdrop-blur-sm shadow-xl">
                    <div className="flex justify-between items-baseline mb-2">
                        <span className="text-blue-400 text-xs font-bold tracking-widest">BASE INTEGRITY</span>
                        <span className="text-white font-mono text-sm">{Math.ceil(state.base.hp)} / {state.base.maxHp}</span>
                    </div>
                    <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                        <div 
                            className={`h-full transition-all duration-300 ${state.base.hp < state.base.maxHp * 0.3 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`} 
                            style={{ width: `${Math.max(0, state.base.hp / state.base.maxHp * 100)}%` }}
                        ></div>
                    </div>
                </div>
                <div className="mt-2 text-gray-500 text-xs font-mono">
                    {t('CLOSE_BACKPACK').replace("CLOSE", "OPEN")}
                </div>
            </div>

            {/* Bottom Right: Weapons */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 scale-50 origin-bottom-right">
                <div className="bg-black/80 p-6 rounded-2xl border border-gray-700 backdrop-blur-md text-right min-w-[260px] shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-gray-900 px-2 py-1 rounded">
                            {wepStats.name}
                        </div>
                        {currentWep.reloading && (
                            <span className="text-yellow-400 text-xs font-bold animate-pulse">RELOADING</span>
                        )}
                    </div>
                    <div className="flex items-baseline justify-end gap-1 mb-4">
                        <span className={`text-6xl font-black tracking-tighter leading-none ${currentWep.ammoInMag === 0 ? 'text-red-500' : 'text-white'}`}>
                            {currentWep.ammoInMag}
                        </span>
                        <div className="flex flex-col items-start ml-2">
                            <span className="text-xs text-gray-500 font-bold uppercase">RESERVE</span>
                            <span className="text-xl text-gray-400 font-mono font-medium leading-none">
                                {currentWep.ammoReserve === Infinity ? '∞' : currentWep.ammoReserve}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-px bg-gradient-to-l from-gray-600 to-transparent w-full my-3"></div>

                    <div className="flex items-center justify-end gap-3 text-white">
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider">{t('GRENADE')} [G]</span>
                        <div className="flex gap-1">
                            {Array.from({length: PLAYER_STATS.maxGrenades}).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-3 h-5 rounded-sm border border-black/50 ${i < p.grenades ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-gray-800'}`}
                                />
                            ))}
                        </div>
                        <span className="font-mono text-xl font-bold ml-1 text-orange-400">{p.grenades}</span>
                    </div>
                </div>

                <div className="flex gap-2 bg-black/40 p-2 rounded-xl backdrop-blur-sm border border-gray-800">
                    {p.loadout.map((wType, idx) => (
                        <div 
                            key={idx}
                            className={`
                                w-12 h-12 flex flex-col items-center justify-center rounded-lg border transition-all duration-200
                                ${p.currentWeaponIndex === idx 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg -translate-y-1' 
                                    : 'bg-gray-800/80 border-gray-700 text-gray-500'}
                            `}
                        >
                            <span className="text-[10px] opacity-70 leading-none mb-0.5">{idx + 1}</span>
                            <WeaponIcon type={wType} className="w-5 h-5 fill-current" />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
