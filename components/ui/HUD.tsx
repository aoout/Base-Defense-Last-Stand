
import React, { useRef, useState } from 'react';
import { WeaponType, GameMode, MissionType, BossType, StatId, AppMode } from '../../types';
import { WEAPONS, PLAYER_STATS } from '../../data/registry';
import { WeaponIcon } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';
import { CyberButton } from './atoms/CyberButton';

// --- SUB-COMPONENTS ---

const StatusWidget: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const hpRef = useRef<HTMLDivElement>(null);
    const hpTextRef = useRef<HTMLSpanElement>(null);
    const secHpRef = useRef<HTMLDivElement>(null);
    const secHpTextRef = useRef<HTMLSpanElement>(null);

    useGameLoop(() => {
        const s = engine.state;
        if (hpRef.current) hpRef.current.style.width = `${Math.max(0, s.base.hp / s.base.maxHp * 100)}%`;
        if (hpTextRef.current) hpTextRef.current.innerText = `${Math.ceil(s.base.hp)} / ${s.base.maxHp}`;
        
        if (s.secondaryBase && secHpRef.current && secHpTextRef.current) {
            secHpRef.current.style.width = `${Math.max(0, s.secondaryBase.hp / s.secondaryBase.maxHp * 100)}%`;
            secHpTextRef.current.innerText = `${Math.ceil(s.secondaryBase.hp)} / ${s.secondaryBase.maxHp}`;
        }
    });

    const isCampaign = state.gameMode === GameMode.CAMPAIGN;

    return (
        <div className="absolute bottom-8 left-8 w-64 flex flex-col gap-4 pointer-events-none">
            <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-display font-black text-white/20 select-none">{t('HUD_BASE_TITLE')}</span>
                <div className="h-px bg-white/20 flex-1 mb-2"></div>
            </div>
            
            <div className="bg-slate-900/80 p-3 border-l-2 border-blue-500 backdrop-blur-sm relative overflow-hidden">
                <div className="flex justify-between text-xs font-mono font-bold mb-1 relative z-10">
                    <span className="text-blue-400">{isCampaign ? t('HUD_PRIMARY') : t('HUD_STRUCTURE')}</span>
                    <span ref={hpTextRef} className="text-white"></span>
                </div>
                <div className="w-full h-3 bg-slate-800 relative z-10">
                    <div ref={hpRef} className="h-full bg-blue-500 transition-all duration-300" style={{ width: '100%' }}></div>
                </div>
                <div className="absolute inset-0 bg-[size:10px_10px] bg-[linear-gradient(to_right,#1e3a8a1a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a1a_1px,transparent_1px)] pointer-events-none"></div>
            </div>

            {state.secondaryBase && (
                <div className="bg-slate-900/80 p-3 border-l-2 border-blue-500 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex justify-between text-xs font-mono font-bold mb-1 relative z-10">
                        <span className="text-blue-400">{t('HUD_SECONDARY')}</span>
                        <span ref={secHpTextRef} className="text-white"></span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 relative z-10">
                        <div ref={secHpRef} className="h-full bg-blue-500 transition-all duration-300" style={{ width: '100%' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WeaponWidget: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    
    const ammoTextRef = useRef<HTMLSpanElement>(null);
    const ammoReserveRef = useRef<HTMLSpanElement>(null);
    const ammoBarRef = useRef<HTMLDivElement>(null);

    const currentType = p.loadout[p.currentWeaponIndex];

    useGameLoop(() => {
        const pl = engine.state.player;
        const w = pl.weapons[pl.loadout[pl.currentWeaponIndex]];
        const stats = WEAPONS[w.type];

        if (ammoTextRef.current) {
            if (w.reloading) {
                ammoTextRef.current.innerText = "RELOAD";
                ammoTextRef.current.className = "text-6xl font-display font-black tracking-wide text-yellow-500 animate-pulse";
            } else {
                const isLow = w.ammoInMag / stats.magSize <= 0.25;
                ammoTextRef.current.innerText = `${w.ammoInMag}`;
                ammoTextRef.current.className = `text-6xl font-display font-black tracking-wide ${isLow ? 'text-red-500 animate-pulse' : 'text-white'}`;
            }
        }
        if (ammoReserveRef.current) {
            ammoReserveRef.current.innerText = `/ ${w.ammoReserve === Infinity ? '∞' : w.ammoReserve}`;
        }
        if (ammoBarRef.current) {
            const pct = w.ammoInMag / stats.magSize;
            ammoBarRef.current.style.width = `${pct * 100}%`;
            ammoBarRef.current.style.backgroundColor = (w.ammoInMag / stats.magSize <= 0.25) ? '#ef4444' : '#ffffff';
        }
    });

    return (
        <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4 pointer-events-none">
            <div className="bg-slate-900/90 border-t-2 border-r-2 border-slate-600 p-4 min-w-[240px] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-1 bg-slate-800">
                    <div className="text-[12px] text-slate-400 font-display font-bold uppercase tracking-wider">
                        {t(`WEAPON_${currentType.replace(/\s+/g, '_').toUpperCase()}_NAME`)}
                    </div>
                </div>
                
                <div className="mt-4 flex justify-between items-end">
                    <div className="flex items-baseline gap-1">
                        <span ref={ammoTextRef} className="text-6xl font-display font-black tracking-wide text-white"></span>
                        <span ref={ammoReserveRef} className="text-sm text-slate-500 font-bold font-mono"></span>
                    </div>
                    <WeaponIcon type={currentType} className="w-12 h-12 text-slate-600" />
                </div>

                <div className="w-full h-1 bg-slate-800 mt-2">
                    <div ref={ammoBarRef} className="h-full bg-white" style={{ width: '100%' }}></div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider">GRENADE [G]</span>
                <div className="flex gap-1">
                    {Array.from({length: PLAYER_STATS.maxGrenades}).map((_, i) => (
                        <div key={i} className={`w-2 h-4 skew-x-[-12deg] ${i < p.grenades ? 'bg-orange-500' : 'bg-slate-800 border border-slate-700'}`} />
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                {p.loadout.map((wType, idx) => (
                    <div key={idx} className={`w-8 h-1 transition-all duration-300 ${p.currentWeaponIndex === idx ? 'bg-white w-12 shadow-[0_0_10px_white]' : 'bg-slate-700'}`} />
                ))}
            </div>
        </div>
    );
};

const ResourceWidget: React.FC = () => {
    const { engine } = useGame();
    const { t } = useLocale();
    const ref = useRef<HTMLSpanElement>(null);
    
    // Backdoor Logic
    const [clickCount, setClickCount] = useState(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleBackdoor = () => {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        const newCount = clickCount + 1;
        setClickCount(newCount);
        
        if (newCount >= 10) {
            engine.sessionManager.activateBackdoor();
            setClickCount(0);
        } else {
            clickTimerRef.current = setTimeout(() => setClickCount(0), 500);
        }
    };

    useGameLoop(() => {
        if (ref.current) ref.current.innerText = `${Math.floor(engine.state.player.score)}`;
    });

    return (
        <div className="absolute top-6 right-6 group pointer-events-auto cursor-help" onClick={handleBackdoor}>
            <div className="bg-slate-900/90 px-5 py-2 border-r-4 border-yellow-500 flex flex-col items-end shadow-lg transform transition-transform group-hover:-translate-x-1 select-none">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></div>
                    <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">{t('HUD_MOLECULAR_STORAGE')}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span ref={ref} className="text-4xl font-display font-bold text-white tracking-wide"></span>
                    <span className="text-xs text-slate-500 font-bold">{t('SCRAPS')}</span>
                </div>
            </div>
        </div>
    );
};

const MissionWidget: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();

    const waveTimerRef = useRef<HTMLSpanElement>(null);
    const waveProgressRef = useRef<HTMLDivElement>(null);
    const waveNumRef = useRef<HTMLSpanElement>(null);
    const bossHpRef = useRef<HTMLDivElement>(null);
    const bossHpTextRef = useRef<HTMLSpanElement>(null);
    const enemyCountRef = useRef<HTMLSpanElement>(null);
    
    // Lure
    const lureRef = useRef<HTMLDivElement>(null);
    const lureRewardRef = useRef<HTMLDivElement>(null);

    const isCampaign = state.gameMode === GameMode.CAMPAIGN;
    const isOffense = state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE;
    const isDefense = state.gameMode === GameMode.SURVIVAL || (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.DEFENSE);
    const hiveMother = state.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);
    const isCleanup = isDefense && state.gameMode === GameMode.EXPLORATION && state.wave.index >= (state.currentPlanet?.totalWaves || 0) && state.wave.timer <= 0;

    const primaryColor = isOffense ? 'border-red-600' : 'border-cyan-600';
    const shadow = isOffense ? 'shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'shadow-[0_0_20px_rgba(8,145,178,0.4)]';

    useGameLoop(() => {
        const s = engine.state;
        
        // 1. Wave Status
        if (!isCampaign && !isOffense) {
            if (waveTimerRef.current) {
                const sec = Math.ceil(s.wave.timer / 1000);
                waveTimerRef.current.innerText = `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
            }
            if (waveProgressRef.current) {
                waveProgressRef.current.style.width = `${(s.wave.timer / s.wave.duration) * 100}%`;
            }
            if (waveNumRef.current) {
                waveNumRef.current.innerText = `${s.wave.index}`;
            }
        }

        // 2. Boss / Offense
        if (isOffense && hiveMother) {
            if (bossHpRef.current) bossHpRef.current.style.width = `${Math.max(0, (hiveMother.hp / hiveMother.maxHp) * 100)}%`;
            if (bossHpTextRef.current) bossHpTextRef.current.innerText = `${Math.ceil(hiveMother.hp).toLocaleString()}`;
        }

        // 3. Cleanup Count
        if (isCleanup && enemyCountRef.current) {
            enemyCountRef.current.innerText = `${s.enemies.length}`;
        }

        // 4. Lure Logic
        if (lureRef.current) {
            const elapsed = s.wave.duration - s.wave.timer;
            const canShow = !isCampaign && !isOffense && elapsed >= 10000 && !isCleanup && !s.missionComplete && !s.isGameOver;
            
            if (canShow) {
                lureRef.current.style.height = '3rem';
                lureRef.current.style.opacity = '1';
                lureRef.current.style.pointerEvents = 'auto';
                if (lureRewardRef.current) {
                    const reward = engine.statManager.get(StatId.LURE_BONUS, Math.max(0, Math.floor((s.wave.timer / 1000) * s.wave.index)));
                    lureRewardRef.current.innerText = `${t('LURE_REWARD', {0: Math.floor(reward)})}`;
                }
            } else {
                lureRef.current.style.height = '0';
                lureRef.current.style.opacity = '0';
                lureRef.current.style.pointerEvents = 'none';
            }
        }
    });

    if (isCampaign) return null; // Campaign has specific layout in other components or simpler HUD

    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <div className={`
                relative min-w-[280px] px-8 py-3 
                bg-slate-900/95 backdrop-blur-md 
                border-x-2 border-b-2 ${primaryColor} 
                rounded-b-xl ${shadow}
                transition-all duration-300
                flex flex-col items-center justify-center
            `}>
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-4 h-2 bg-slate-500"></div>
                <div className="absolute top-0 right-0 w-4 h-2 bg-slate-500"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] pointer-events-none rounded-b-lg"></div>

                {isOffense ? (
                    <div className="flex flex-col items-center w-full z-10">
                        <div className="flex justify-between w-full items-end border-b border-red-900/50 pb-1 mb-1">
                            <span className="text-[14px] font-display font-bold tracking-[0.1em] text-red-700 animate-pulse">{t('ASSAULT_OPS')}</span>
                            <span className="text-[10px] font-mono text-red-400">{t('HUD_TARGET_LOCKED')}</span>
                        </div>
                        {hiveMother ? (
                            <div className="w-full mt-1">
                                <div className="flex justify-between text-xs font-mono font-bold text-red-200 mb-1">
                                    <span>{t('HUD_BOSS_INTEGRITY')}</span>
                                    <span ref={bossHpTextRef} className="font-display text-lg"></span>
                                </div>
                                <div className="h-3 w-full bg-red-950/50 border border-red-800 relative skew-x-[-10deg] overflow-hidden">
                                    <div ref={bossHpRef} className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-300"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-red-500 font-mono text-sm animate-pulse">SEARCHING...</div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full z-10">
                        <div className="flex justify-between w-full items-baseline border-b border-cyan-900/50 pb-1 mb-1">
                            <span className="text-[14px] font-display font-bold tracking-[0.1em] text-cyan-700">{t('HUD_SECTOR_DEFENSE')}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-cyan-600 font-mono">{t('HUD_WAVE')}</span>
                                <span ref={waveNumRef} className="text-2xl font-display font-black text-white leading-none"></span>
                            </div>
                        </div>
                        <div className="relative w-full flex justify-center items-center py-1">
                            {isCleanup ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-yellow-500 animate-pulse tracking-wider">{t('HUD_HOSTILES_REMAINING')}</span>
                                    <span ref={enemyCountRef} className="text-4xl font-display font-bold text-red-500 tracking-widest"></span>
                                </div>
                            ) : (
                                <span ref={waveTimerRef} className="text-5xl font-display font-bold text-white tracking-widest"></span>
                            )}
                        </div>
                        {!isCleanup && (
                            <div className="w-full h-1 bg-slate-800 mt-1 rounded-full overflow-hidden">
                                <div ref={waveProgressRef} className="h-full bg-cyan-500 transition-all duration-100 linear"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lure Button */}
            <div 
                ref={lureRef}
                className="relative transition-all duration-500 ease-out overflow-hidden flex flex-col items-center h-0 opacity-0 -translate-y-4 pointer-events-none"
            >
                <div className="w-24 flex justify-between px-2">
                    <div className="w-1 h-3 bg-yellow-600/50"></div>
                    <div className="w-1 h-3 bg-yellow-600/50"></div>
                </div>
                <button 
                    onClick={() => engine.missionManager.skipWave()}
                    className="group relative bg-yellow-500/10 hover:bg-yellow-500/90 border-x border-b border-yellow-500 text-yellow-400 hover:text-black px-6 py-1 font-black text-xs tracking-[0.2em] uppercase transition-all cursor-pointer clip-path-trapezoid-bottom backdrop-blur-sm pointer-events-auto"
                    style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }}
                >
                    <div className="flex items-center gap-2">
                        <span className="animate-pulse">►►</span>
                        <span>{t('SKIP_WAVE')}</span>
                        <span className="animate-pulse">◄◄</span>
                    </div>
                    <div ref={lureRewardRef} className="text-[9px] font-mono text-center opacity-80 group-hover:font-bold"></div>
                </button>
            </div>
        </div>
    );
};

const HeroicZealTrigger: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();

    if (state.gameMode !== GameMode.CAMPAIGN) return null;

    const handleClick = () => {
        engine.sessionManager.setMode(AppMode.HEROIC_ZEAL);
    }

    return (
        <div className="absolute top-6 left-6 z-20 pointer-events-auto">
            <CyberButton 
                onClick={handleClick}
                variant="red"
                className="px-4 py-2 border-red-700 bg-black/60 hover:bg-red-900/40"
            >
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-red-500 font-bold tracking-widest">{t('HEROIC_BTN')}</span>
                    <span className="text-sm font-black text-white leading-none">ZEAL</span>
                </div>
            </CyberButton>
        </div>
    );
}

export const HUD: React.FC = () => {
    return (
        <>
            <StatusWidget />
            <WeaponWidget />
            <ResourceWidget />
            <MissionWidget />
            <HeroicZealTrigger />
        </>
    );
}
