
import React, { useRef } from 'react';
import { WeaponType, GameMode, MissionType, BossType, StatId } from '../../types';
import { WEAPONS, PLAYER_STATS } from '../../data/registry';
import { WeaponIcon } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';

export const HUD: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    
    // Direct DOM Refs for High Frequency Updates
    const waveTimerRef = useRef<HTMLSpanElement>(null);
    const waveProgressRef = useRef<HTMLDivElement>(null);
    const waveNumberRef = useRef<HTMLSpanElement>(null); // New Ref for Wave Number
    const healthBarRef = useRef<HTMLDivElement>(null);
    const healthTextRef = useRef<HTMLSpanElement>(null);
    const armorBarRef = useRef<HTMLDivElement>(null);
    const ammoTextRef = useRef<HTMLSpanElement>(null);
    const ammoReserveRef = useRef<HTMLSpanElement>(null); // New Ref for Reserve
    const ammoBarRef = useRef<HTMLDivElement>(null);
    const scrapTextRef = useRef<HTMLSpanElement>(null);
    const bossHpRef = useRef<HTMLDivElement>(null);
    const bossHpTextRef = useRef<HTMLSpanElement>(null);
    const enemiesRemainingRef = useRef<HTMLSpanElement>(null);
    
    // Lure Refs
    const lureContainerRef = useRef<HTMLDivElement>(null);
    const lureRewardRef = useRef<HTMLDivElement>(null);

    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    const currentWep = p.weapons[currentWeaponType];
    const wepStats = WEAPONS[currentWeaponType];

    const isOffenseMode = state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE;
    const hiveMother = state.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);

    // Defense Mode Logic
    const isDefense = state.gameMode === GameMode.SURVIVAL || (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.DEFENSE);
    
    // Check for Cleanup Phase (Last wave, no time left)
    const isCleanupPhase = isDefense && 
                           state.gameMode === GameMode.EXPLORATION && 
                           state.wave >= (state.currentPlanet?.totalWaves || 0) &&
                           state.waveTimeRemaining <= 0;

    // Theme Colors
    const primaryColor = isOffenseMode ? 'border-red-600' : 'border-cyan-600';
    const glowShadow = isOffenseMode ? 'shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'shadow-[0_0_20px_rgba(8,145,178,0.4)]';

    // --- TRANSIENT UPDATE LOOP ---
    useGameLoop(() => {
        const s = engine.state;
        const pl = s.player;
        const w = pl.weapons[pl.loadout[pl.currentWeaponIndex]];
        const stats = WEAPONS[w.type];

        // 1. Base Health
        if (healthBarRef.current) healthBarRef.current.style.width = `${Math.max(0, s.base.hp / s.base.maxHp * 100)}%`;
        if (healthTextRef.current) healthTextRef.current.innerText = `${Math.ceil(s.base.hp)} / ${s.base.maxHp}`;

        // 2. Scraps
        if (scrapTextRef.current) scrapTextRef.current.innerText = `${Math.floor(pl.score)}`;

        // 3. Ammo
        if (ammoTextRef.current) {
            if (w.reloading) ammoTextRef.current.innerText = "RELOAD";
            else ammoTextRef.current.innerText = `${w.ammoInMag}`; 
        }
        if (ammoReserveRef.current) {
            ammoReserveRef.current.innerText = `/ ${w.ammoReserve === Infinity ? '∞' : w.ammoReserve}`;
        }
        if (ammoBarRef.current) {
            const pct = w.ammoInMag / stats.magSize;
            ammoBarRef.current.style.width = `${pct * 100}%`;
        }

        // 4. Wave Timer & Number
        if (waveTimerRef.current) {
            const sec = Math.ceil(s.waveTimeRemaining / 1000);
            const fmt = `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
            waveTimerRef.current.innerText = fmt;
        }
        if (waveProgressRef.current) {
            const pct = s.waveTimeRemaining / s.waveDuration;
            waveProgressRef.current.style.width = `${pct * 100}%`;
        }
        if (waveNumberRef.current) {
            waveNumberRef.current.innerText = `${s.wave}`;
        }

        // 5. Boss HP
        if (isOffenseMode) {
            const boss = s.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);
            if (boss) {
                if (bossHpRef.current) bossHpRef.current.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
                if (bossHpTextRef.current) bossHpTextRef.current.innerText = `${Math.ceil(boss.hp).toLocaleString()}`;
            }
        }

        // 6. Enemies Remaining (Cleanup)
        if (isCleanupPhase && enemiesRemainingRef.current) {
            enemiesRemainingRef.current.innerText = `${s.enemies.length}`;
        }

        // 7. Lure Logic (Real-time visibility check)
        if (lureContainerRef.current) {
            const isOffense = s.gameMode === GameMode.EXPLORATION && s.currentPlanet?.missionType === MissionType.OFFENSE;
            const elapsed = s.waveDuration - s.waveTimeRemaining;
            const isDef = s.gameMode === GameMode.SURVIVAL || (s.gameMode === GameMode.EXPLORATION && s.currentPlanet?.missionType === MissionType.DEFENSE);
            const noWaves = isDef && s.gameMode === GameMode.EXPLORATION && s.wave >= (s.currentPlanet?.totalWaves || 0);
            
            // Show after 10 seconds if not game over/complete/offense/last wave
            const showLure = !isOffense && elapsed >= 10000 && !noWaves && !s.missionComplete && !s.isGameOver;

            if (showLure) {
                lureContainerRef.current.style.height = '3rem'; // h-12
                lureContainerRef.current.style.opacity = '1';
                lureContainerRef.current.style.transform = 'translateY(0)';
                lureContainerRef.current.style.pointerEvents = 'auto';
                
                // Update Reward Text
                if (lureRewardRef.current) {
                    const baseReward = Math.max(0, Math.floor((s.waveTimeRemaining / 1000) * s.wave));
                    const finalReward = engine.statManager.get(StatId.LURE_BONUS, baseReward);
                    lureRewardRef.current.innerText = `REWARD: ${Math.floor(finalReward)}`;
                }
            } else {
                lureContainerRef.current.style.height = '0px';
                lureContainerRef.current.style.opacity = '0';
                lureContainerRef.current.style.transform = 'translateY(-1rem)';
                lureContainerRef.current.style.pointerEvents = 'none';
            }
        }
    });

    return (
        <>
            {/* --- TOP CENTER: TACTICAL CHRONOMETER --- */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                
                {/* Main Dashboard Panel */}
                <div className={`
                    relative min-w-[280px] px-8 py-3 
                    bg-slate-900/95 backdrop-blur-md 
                    border-x-2 border-b-2 ${primaryColor} 
                    rounded-b-xl 
                    ${glowShadow}
                    transition-all duration-300
                    flex flex-col items-center justify-center
                    group
                `}>
                    {/* Decorative Top Hooks */}
                    <div className="absolute top-0 left-0 w-4 h-2 bg-slate-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-2 bg-slate-500"></div>
                    
                    {/* Internal Scanline Texture */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] pointer-events-none rounded-b-lg"></div>

                    {isOffenseMode ? (
                        /* OFFENSE MODE UI */
                        <div className="flex flex-col items-center w-full z-10">
                            <div className="flex justify-between w-full items-end border-b border-red-900/50 pb-1 mb-1">
                                <span className="text-[14px] font-display font-bold tracking-[0.1em] text-red-700 animate-pulse">ASSAULT OPS</span>
                                <span className="text-[10px] font-mono text-red-400">TARGET LOCKED</span>
                            </div>
                            
                            {hiveMother ? (
                                <div className="w-full mt-1">
                                    <div className="flex justify-between text-xs font-mono font-bold text-red-200 mb-1">
                                        <span>BOSS INTEGRITY</span>
                                        <span ref={bossHpTextRef} className="font-display text-lg">{Math.ceil(hiveMother.hp).toLocaleString()}</span>
                                    </div>
                                    <div className="h-3 w-full bg-red-950/50 border border-red-800 relative skew-x-[-10deg] overflow-hidden">
                                        <div 
                                            ref={bossHpRef}
                                            className="h-full bg-red-600 transition-all duration-300"
                                            style={{ width: `${Math.max(0, (hiveMother.hp / hiveMother.maxHp) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-red-500 mt-1">
                                        <span>ARMOR PLATING: {Math.floor(hiveMother.armorValue || 0)}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-red-500 font-mono text-sm animate-pulse">SEARCHING FOR TARGET...</div>
                            )}
                        </div>
                    ) : (
                        /* DEFENSE MODE UI */
                        <div className="flex flex-col items-center w-full z-10">
                            <div className="flex justify-between w-full items-baseline border-b border-cyan-900/50 pb-1 mb-1">
                                <span className="text-[14px] font-display font-bold tracking-[0.1em] text-cyan-700">SECTOR DEFENSE</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-cyan-600 font-mono">WAVE</span>
                                    <span ref={waveNumberRef} className="text-2xl font-display font-black text-white leading-none">{state.wave}</span>
                                </div>
                            </div>

                            <div className="relative w-full flex justify-center items-center py-1">
                                {isCleanupPhase ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-bold text-yellow-500 animate-pulse tracking-wider">HOSTILES REMAINING</span>
                                        <span ref={enemiesRemainingRef} className="text-4xl font-display font-bold text-red-500 tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                            {state.enemies.length}
                                        </span>
                                    </div>
                                ) : (
                                    <span ref={waveTimerRef} className="text-5xl font-display font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        00:00
                                    </span>
                                )}
                            </div>

                            {/* Wave Progress Micro-Bar */}
                            {!isCleanupPhase && (
                                <div className="w-full h-1 bg-slate-800 mt-1 rounded-full overflow-hidden">
                                    <div 
                                        ref={waveProgressRef}
                                        className="h-full bg-cyan-500 transition-all duration-100 linear"
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- THE LURE (SKIP BUTTON) --- */}
                <div 
                    ref={lureContainerRef}
                    className="relative transition-all duration-500 ease-out overflow-hidden flex flex-col items-center h-0 opacity-0 -translate-y-4"
                >
                    <div className="w-24 flex justify-between px-2">
                        <div className="w-1 h-3 bg-yellow-600/50"></div>
                        <div className="w-1 h-3 bg-yellow-600/50"></div>
                    </div>

                    <button 
                        onClick={() => engine.skipWave()}
                        className="
                            group relative bg-yellow-500/10 hover:bg-yellow-500/90 
                            border-x border-b border-yellow-500 
                            text-yellow-400 hover:text-black
                            px-6 py-1 
                            font-black text-xs tracking-[0.2em] uppercase
                            transition-all cursor-pointer
                            clip-path-trapezoid-bottom
                            backdrop-blur-sm
                        "
                        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="animate-pulse">►►</span>
                            <span>{t('SKIP_WAVE')}</span>
                            <span className="animate-pulse">◄◄</span>
                        </div>
                        <div ref={lureRewardRef} className="text-[9px] font-mono text-center opacity-80 group-hover:font-bold">
                            REWARD: 0
                        </div>
                    </button>
                </div>
            </div>

            {/* Top Right: Resource Monitor */}
            <div className="absolute top-6 right-6 group">
                <div className="bg-slate-900/90 px-5 py-2 border-r-4 border-yellow-500 flex flex-col items-end shadow-lg transform transition-transform group-hover:-translate-x-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">Molecular Storage</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span ref={scrapTextRef} className="text-4xl font-display font-bold text-white tracking-wide">{Math.floor(p.score)}</span>
                        <span className="text-xs text-slate-500 font-bold">{t('SCRAPS')}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Left: Integrity Monitor */}
            <div className="absolute bottom-8 left-8 w-64">
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-display font-black text-white/20 select-none">BASE</span>
                    <div className="h-px bg-white/20 flex-1 mb-2"></div>
                </div>
                
                <div className="bg-slate-900/80 p-3 border-l-2 border-blue-500 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex justify-between text-xs font-mono font-bold mb-1 relative z-10">
                        <span className="text-blue-400">STRUCTURE</span>
                        <span ref={healthTextRef} className="text-white">{Math.ceil(state.base.hp)} / {state.base.maxHp}</span>
                    </div>
                    {/* Health Bar */}
                    <div className="w-full h-3 bg-slate-800 relative z-10">
                        <div 
                            ref={healthBarRef}
                            className={`h-full transition-all duration-300 bg-blue-500`} 
                            style={{ width: `${Math.max(0, state.base.hp / state.base.maxHp * 100)}%` }}
                        ></div>
                    </div>
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[size:10px_10px] bg-[linear-gradient(to_right,#1e3a8a1a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a1a_1px,transparent_1px)] pointer-events-none"></div>
                </div>
            </div>

            {/* Bottom Right: Weapon Systems */}
            <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4">
                
                {/* Active Weapon Card */}
                <div className="bg-slate-900/90 border-t-2 border-r-2 border-slate-600 p-4 min-w-[240px] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-1 bg-slate-800">
                        <div className="text-[12px] text-slate-400 font-display font-bold uppercase tracking-wider">
                            {t(`WEAPON_${currentWeaponType.replace(/\s+/g, '_').toUpperCase()}_NAME`)}
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-end">
                        {currentWep.reloading ? (
                            <div className="text-3xl font-display font-black text-yellow-500 animate-pulse tracking-widest">RELOADING</div>
                        ) : (
                            <div className="flex items-baseline gap-1">
                                <span ref={ammoTextRef} className={`text-6xl font-display font-black tracking-wide text-white`}>
                                    {currentWep.ammoInMag}
                                </span>
                                <span ref={ammoReserveRef} className="text-sm text-slate-500 font-bold font-mono">/ {currentWep.ammoReserve === Infinity ? '∞' : currentWep.ammoReserve}</span>
                            </div>
                        )}
                        <WeaponIcon type={currentWeaponType} className="w-12 h-12 text-slate-600" />
                    </div>

                    <div className="w-full h-1 bg-slate-800 mt-2">
                        <div 
                            ref={ammoBarRef}
                            className="h-full bg-white" 
                            style={{ width: `${(currentWep.ammoInMag / wepStats.magSize) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Tactical Grenades */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">GRENADE [G]</span>
                    <div className="flex gap-1">
                        {Array.from({length: PLAYER_STATS.maxGrenades}).map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-2 h-4 skew-x-[-12deg] ${i < p.grenades ? 'bg-orange-500' : 'bg-slate-800 border border-slate-700'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Weapon Selector Dots */}
                <div className="flex gap-2">
                    {p.loadout.map((wType, idx) => (
                        <div 
                            key={idx}
                            className={`
                                w-8 h-1 transition-all duration-300
                                ${p.currentWeaponIndex === idx ? 'bg-white w-12 shadow-[0_0_10px_white]' : 'bg-slate-700'}
                            `}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
