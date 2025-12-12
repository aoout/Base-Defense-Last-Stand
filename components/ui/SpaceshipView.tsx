
import React, { useState, useRef } from 'react';
import { SpaceshipModuleType, GameEventType, ShopPurchaseEvent } from '../../types';
import { SPACESHIP_MODULES } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { Icons } from './Icons';
import { DS } from '../../theme/designSystem';

// --- UTILS ---

const useBackdoorTrigger = (activate: () => void) => {
    const [clickCount, setClickCount] = useState(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleScrapClick = () => {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 10) {
            activate();
            setClickCount(0);
        } else {
            clickTimerRef.current = setTimeout(() => setClickCount(0), 500);
        }
    };
    return handleScrapClick;
};

// --- ASSETS ---

const MODULE_ICONS: Record<SpaceshipModuleType, React.ReactNode> = {
    [SpaceshipModuleType.BASE_REINFORCEMENT]: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 19c-4.41-1.23-7.23-4.9-8-8.86V6.3l8-3.56 8 3.56v4.84c-.77 3.96-3.59 7.63-8 8.86z"/>
            <rect x="11" y="8" width="2" height="8" rx="1"/>
            <rect x="8" y="11" width="8" height="2" rx="1"/>
        </svg>
    ),
    [SpaceshipModuleType.CARAPACE_ANALYZER]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
            <path d="M3 3h6M3 21h6M21 3h-6M21 21h-6M12 8v8M8 12h8" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    [SpaceshipModuleType.ORBITAL_CANNON]: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            <rect x="11" y="2" width="2" height="20" opacity="0.6"/>
            <circle cx="12" cy="12" r="2" fill="white"/>
        </svg>
    ),
    [SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR]: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm-1 12h2v2h-2zm0-10h2v8h-2z"/>
        </svg>
    ),
    [SpaceshipModuleType.BIO_SEQUENCING]: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-1l-1.25-2.75L8 13l2.75-1.25L12 9l1.25 2.75L16 13l-2.75 1.25z"/>
        </svg>
    ),
};

// --- BENTO UI COMPONENTS ---

const BentoCard: React.FC<{ 
    className?: string; 
    children: React.ReactNode; 
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    icon?: React.ReactNode;
    accent?: string;
}> = ({ className = "", children, onClick, active, disabled, title, icon, accent = "cyan" }) => {
    
    // Web-design style hover effects: subtle border glow, lift
    return (
        <div 
            onClick={!disabled ? onClick : undefined}
            className={`
                relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col
                ${disabled ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/20' : 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl'}
                ${active 
                    ? `border-${accent}-500/50 bg-${accent}-950/10 shadow-[0_0_30px_rgba(var(--color-${accent}-500),0.1)]` 
                    : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10'}
                ${className}
            `}
        >
            {/* Background Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
            
            {/* Header */}
            {(title || icon) && (
                <div className="flex items-center justify-between p-6 pb-2 relative z-10">
                    <div className="flex items-center gap-3">
                        {icon && <div className={`text-${active ? accent : 'slate'}-400 text-xl`}>{icon}</div>}
                        {title && <span className={`text-xs font-bold tracking-[0.2em] uppercase ${active ? `text-${accent}-400` : 'text-slate-500'}`}>{title}</span>}
                    </div>
                    {active && <div className={`w-2 h-2 rounded-full bg-${accent}-500 animate-pulse shadow-[0_0_10px_currentColor]`}></div>}
                </div>
            )}

            {/* Content */}
            <div className="p-6 pt-2 flex-1 relative z-10 flex flex-col min-h-0">
                {children}
            </div>

            {/* Decorative Gradient Blob */}
            {!disabled && (
                <div className={`absolute -bottom-20 -right-20 w-64 h-64 bg-${accent}-500/10 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100`}></div>
            )}
        </div>
    );
};

const StatPill: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = "slate" }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`text-xl font-display font-bold text-${color}-400`}>{value}</span>
    </div>
);

const ModuleListItem: React.FC<{ 
    type: SpaceshipModuleType; 
    stats: any; 
    canAfford: boolean; 
    installed: boolean;
    onPurchase: () => void; 
    t: any;
    icon: React.ReactNode;
}> = ({ type, stats, canAfford, installed, onPurchase, t, icon }) => (
    <div className={`
        group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200
        ${installed 
            ? 'bg-emerald-950/10 border-emerald-500/20' 
            : 'bg-slate-950/30 border-white/5 hover:border-white/10 hover:bg-slate-900/50'}
    `}>
        <div className="flex items-center gap-4 max-w-[65%]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center p-2 border ${installed ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                {icon}
            </div>
            <div className="flex flex-col gap-1">
                <div className={`text-xs font-bold tracking-wide ${installed ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t(`SHIP_MOD_${type}_NAME`)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono leading-relaxed line-clamp-1">
                    {t(`SHIP_MOD_${type}_DESC`)}
                </div>
            </div>
        </div>

        {installed ? (
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                INSTALLED
            </div>
        ) : (
            <button
                onClick={(e) => { e.stopPropagation(); onPurchase(); }}
                disabled={!canAfford}
                className={`
                    px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded border transition-all shrink-0
                    ${canAfford 
                        ? 'bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400 hover:scale-105 shadow-lg shadow-cyan-500/20' 
                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
                `}
            >
                {stats.cost} BIO
            </button>
        )}
    </div>
);

// --- MAIN COMPONENT ---

export const SpaceshipView: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const installed = state.spaceship.installedModules;
    
    const handleScrapClick = useBackdoorTrigger(() => engine.activateBackdoor());
    const handlePurchase = (modType: SpaceshipModuleType) => engine.eventBus.emit<ShopPurchaseEvent>(GameEventType.SHOP_PURCHASE, { itemId: modType });

    // Computed status
    const hullIntegrity = Math.floor((state.base.hp / state.base.maxHp) * 100);
    const moduleCount = installed.length;
    const totalModules = Object.keys(SPACESHIP_MODULES).length;

    return (
        <div className="absolute inset-0 bg-[#09090b] text-slate-200 font-sans overflow-hidden p-8 flex flex-col pointer-events-auto select-none">
            
            {/* Background Grid - "Blueprint Paper" feel */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>
            
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8 relative z-10 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_cyan]"></div>
                        <span className="text-[10px] font-mono font-bold text-cyan-500 tracking-[0.3em] uppercase">Vanguard OS v4.2</span>
                    </div>
                    <h1 className="text-5xl font-display font-black text-white tracking-tight leading-none">
                        COMMAND <span className="text-slate-600">DASHBOARD</span>
                    </h1>
                </div>
                
                <div className="flex items-end gap-12">
                    <div className="text-right cursor-help" onClick={handleScrapClick}>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('STORAGE_ACCESS')}</div>
                        <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                            {Math.floor(state.player.score)} <span className="text-lg text-yellow-500">BIO</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => engine.exitSpaceshipView()}
                        className="group flex items-center gap-4 px-6 py-3 rounded-full border border-slate-700 bg-slate-900/50 hover:bg-white hover:text-black transition-all"
                    >
                        <span className="text-xs font-bold tracking-widest uppercase">{t('RETURN_SECTOR_BTN')}</span>
                        <div className="text-lg group-hover:translate-x-1 transition-transform">→</div>
                    </button>
                </div>
            </div>

            {/* MAIN BENTO GRID */}
            <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-6 min-h-0 relative z-10">
                
                {/* 1. SHIP STATUS (Top Left, 3x4) */}
                <BentoCard className="col-span-3 row-span-4" title="VESSEL STATUS" icon={<Icons.Ship />} accent="blue" active>
                    <div className="flex flex-col h-full justify-between">
                        <div className="relative w-full aspect-square max-h-[160px] flex items-center justify-center self-center my-4">
                            {/* Abstract Ship Visualization using CSS Rings */}
                            <div className="absolute inset-0 border-4 border-slate-800 rounded-full animate-[spin_20s_linear_infinite]"></div>
                            <div className="absolute inset-4 border-2 border-slate-700 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]"></div>
                            <div className="absolute inset-[30%] bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative z-10 text-4xl font-black text-white">{hullIntegrity}%</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-auto border-t border-white/5 pt-4">
                            <StatPill label={t('HULL_INTEGRITY')} value={`${hullIntegrity}%`} color={hullIntegrity > 50 ? 'green' : 'red'} />
                            <StatPill label="SYS. LOAD" value={`${moduleCount}/${totalModules}`} color="blue" />
                        </div>
                    </div>
                </BentoCard>

                {/* 2. FABRICATION QUEUE (Bottom Left, 3x8) - Scrollable list of uninstalled modules */}
                <BentoCard className="col-span-3 row-span-8 bg-slate-950" title={t('MODULE_FAB')} icon={<Icons.Settings />} accent="slate">
                    <div className="flex flex-col h-full overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {Object.values(SpaceshipModuleType).map(modType => (
                                <ModuleListItem 
                                    key={modType}
                                    type={modType}
                                    stats={SPACESHIP_MODULES[modType]}
                                    canAfford={state.player.score >= SPACESHIP_MODULES[modType].cost}
                                    installed={installed.includes(modType)}
                                    onPurchase={() => handlePurchase(modType)}
                                    t={t}
                                    icon={MODULE_ICONS[modType]}
                                />
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 text-center font-mono shrink-0">
                            VANGUARD ENGINEERING CORP // AUTH_KEY_99
                        </div>
                    </div>
                </BentoCard>

                {/* 3. CORE SYSTEMS (Right side, 9x12 Grid) */}
                
                {/* 3a. SHIP COMPUTER (Top Row, Wide) */}
                <BentoCard 
                    className="col-span-9 row-span-3" 
                    onClick={() => engine.enterShipComputer()}
                    title={t('ACCESS_COMPUTER')}
                    icon={<Icons.Database />}
                    accent="cyan"
                >
                    <div className="flex items-center justify-between h-full">
                        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                            Access operational logs, historical archives, and flight navigation protocols. 
                            Kernel version 4.4.2 stable.
                        </p>
                        <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-2xl group-hover:scale-110 transition-transform">
                            →
                        </div>
                    </div>
                </BentoCard>

                {/* 3b. SUBSYSTEMS (Middle/Bottom Area - The "Apps") */}
                
                {/* ORBITAL ARRAY */}
                <BentoCard 
                    className="col-span-3 row-span-5"
                    onClick={() => engine.enterOrbitalUpgradeMenu()}
                    active={installed.includes(SpaceshipModuleType.ORBITAL_CANNON)}
                    disabled={!installed.includes(SpaceshipModuleType.ORBITAL_CANNON)}
                    title={t('ORBITAL_TITLE')}
                    icon={<Icons.Radar />}
                    accent="red"
                >
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-4xl text-red-500/20 font-black tracking-tighter absolute right-6 top-16">KINETIC</div>
                        <p className="text-xs text-slate-400 mt-2 relative z-10">
                            Configure orbital bombardment parameters and auto-targeting priority.
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                            <span>Open Console</span>
                            <span>→</span>
                        </div>
                    </div>
                </BentoCard>

                {/* BIO LAB */}
                <BentoCard 
                    className="col-span-3 row-span-5"
                    onClick={() => { engine.generateBioGrid(); engine.enterBioSequencing(); }}
                    active={installed.includes(SpaceshipModuleType.BIO_SEQUENCING)}
                    disabled={!installed.includes(SpaceshipModuleType.BIO_SEQUENCING)}
                    title={t('BIO_TITLE')}
                    icon={<Icons.Hazard />}
                    accent="purple"
                >
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-4xl text-purple-500/20 font-black tracking-tighter absolute right-6 top-16">GENOME</div>
                        <p className="text-xs text-slate-400 mt-2 relative z-10">
                            Sequence collected biomass to unlock evolutionary advantages.
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                            <span>Enter Lab</span>
                            <span>→</span>
                        </div>
                    </div>
                </BentoCard>

                {/* CARAPACE / TECH (Shared Column) */}
                <div className="col-span-3 row-span-9 flex flex-col gap-6">
                    <BentoCard 
                        className="flex-1"
                        onClick={() => { engine.generateCarapaceGrid(); engine.enterCarapaceGrid(); }}
                        active={installed.includes(SpaceshipModuleType.CARAPACE_ANALYZER)}
                        disabled={!installed.includes(SpaceshipModuleType.CARAPACE_ANALYZER)}
                        title={t('XENO_TITLE')}
                        icon={<Icons.Analysis />}
                        accent="emerald"
                    >
                        <div className="text-4xl text-emerald-500/20 font-black tracking-tighter absolute right-6 top-12">ANALYZE</div>
                        <div className="mt-auto pt-8 text-xs text-slate-400">
                            Study enemy physiology for damage bonuses.
                        </div>
                    </BentoCard>

                    <BentoCard 
                        className="flex-1"
                        onClick={() => { engine.generateInfrastructureOptions(); engine.enterInfrastructureResearch(); }}
                        active={installed.includes(SpaceshipModuleType.BASE_REINFORCEMENT)}
                        disabled={!installed.includes(SpaceshipModuleType.BASE_REINFORCEMENT)}
                        title={t('INFRA_TITLE')}
                        icon={<Icons.Crane />}
                        accent="yellow"
                    >
                        <div className="text-4xl text-yellow-500/20 font-black tracking-tighter absolute right-6 top-12">BUILD</div>
                        <div className="mt-auto pt-8 text-xs text-slate-400">
                            Permanent base fortifications.
                        </div>
                    </BentoCard>
                </div>

                {/* FILLER / DECORATIVE (Bottom Row Center) */}
                <BentoCard className="col-span-6 row-span-4 border-dashed border-slate-800 bg-transparent" disabled>
                    <div className="h-full flex items-center justify-center text-slate-700 font-mono text-xs tracking-widest">
                        // EXPANSION SLOT A-9
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};
