
import React, { useState, useRef } from 'react';
import { SpaceshipModuleType, GameEventType, ShopPurchaseEvent, AppMode } from '../../types';
import { SPACESHIP_MODULES } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { Icons, ModuleIcons } from './Icons';
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
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
            
            {(title || icon) && (
                <div className="flex items-center justify-between p-6 pb-2 relative z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        {icon && <div className={`text-${active ? accent : 'slate'}-400 text-xl`}>{icon}</div>}
                        {title && <span className={`text-xs font-bold tracking-[0.2em] uppercase ${active ? `text-${accent}-400` : 'text-slate-500'}`}>{title}</span>}
                    </div>
                    {active && <div className={`w-2 h-2 rounded-full bg-${accent}-500 animate-pulse shadow-[0_0_10px_currentColor]`}></div>}
                </div>
            )}

            <div className="p-6 pt-2 flex-1 relative z-10 flex flex-col min-h-0">
                {children}
            </div>

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
}> = ({ type, stats, canAfford, installed, onPurchase, t }) => {
    const IconComponent = ModuleIcons[type];

    return (
        <div className={`
            group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200
            ${installed 
                ? 'bg-emerald-950/10 border-emerald-500/20' 
                : 'bg-slate-950/30 border-white/5 hover:border-white/10 hover:bg-slate-900/50'}
        `}>
            <div className="flex items-center gap-4 max-w-[65%]">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center p-2 border ${installed ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                    <IconComponent />
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
                    {t('OWNED')}
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
};

// --- MAIN COMPONENT ---

export const SpaceshipView: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const installed = state.spaceship.installedModules;
    
    const handleScrapClick = useBackdoorTrigger(() => engine.sessionManager.activateBackdoor());
    const handlePurchase = (modType: SpaceshipModuleType) => engine.eventBus.emit<ShopPurchaseEvent>(GameEventType.SHOP_PURCHASE, { itemId: modType });

    const hullIntegrity = Math.floor((state.base.hp / state.base.maxHp) * 100);
    const moduleCount = installed.length;
    const totalModules = Object.keys(SPACESHIP_MODULES).length;

    return (
        <div className="absolute inset-0 bg-[#09090b] text-slate-200 font-sans overflow-hidden p-8 flex flex-col pointer-events-auto select-none">
            
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>
            
            <div className="flex justify-between items-end mb-8 relative z-10 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_cyan]"></div>
                        <span className="text-[10px] font-mono font-bold text-cyan-500 tracking-[0.3em] uppercase">{t('SHIP_OS_VERSION')}</span>
                    </div>
                    <h1 className="text-5xl font-display font-black text-white tracking-tight leading-none">
                        {t('SHIP_DASHBOARD_TITLE')} <span className="text-slate-600">{t('SHIP_DASHBOARD_SUB')}</span>
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
                        onClick={() => engine.sessionManager.setMode(AppMode.EXPLORATION_MAP)}
                        className="group flex items-center gap-4 px-6 py-3 rounded-full border border-slate-700 bg-slate-900/50 hover:bg-white hover:text-black transition-all"
                    >
                        <span className="text-xs font-bold tracking-widest uppercase">{t('RETURN_SECTOR_BTN')}</span>
                        <div className="text-lg group-hover:translate-x-1 transition-transform">→</div>
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-6 min-h-0 relative z-10">
                
                {/* 1. SHIP STATUS (Top Left, 3x4) */}
                <BentoCard className="col-span-3 row-span-4" title={t('SHIP_STATUS_TITLE')} icon={<Icons.Ship />} accent="blue" active>
                    <div className="flex flex-col h-full justify-between">
                        <div className="relative w-full aspect-square max-h-[160px] flex items-center justify-center self-center my-4">
                            <div className="absolute inset-0 border-4 border-slate-800 rounded-full animate-[spin_20s_linear_infinite]"></div>
                            <div className="absolute inset-4 border-2 border-slate-700 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]"></div>
                            <div className="absolute inset-[30%] bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative z-10 text-4xl font-black text-white">{hullIntegrity}%</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-auto border-t border-white/5 pt-4">
                            <StatPill label={t('HULL_INTEGRITY')} value={`${hullIntegrity}%`} color={hullIntegrity > 50 ? 'green' : 'red'} />
                            <StatPill label={t('SHIP_SYS_LOAD')} value={`${moduleCount}/${totalModules}`} color="blue" />
                        </div>
                    </div>
                </BentoCard>

                {/* 2. FABRICATION QUEUE (Bottom Left, 3x8) */}
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
                                />
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 text-center font-mono shrink-0">
                            {t('SHIP_FAB_CORP')}
                        </div>
                    </div>
                </BentoCard>

                {/* 3. CORE SYSTEMS */}
                
                <BentoCard 
                    className="col-span-9 row-span-3" 
                    onClick={() => engine.sessionManager.setMode(AppMode.SHIP_COMPUTER)}
                    title={t('ACCESS_COMPUTER')}
                    icon={<Icons.Database />}
                    accent="cyan"
                >
                    <div className="flex items-center justify-between h-full">
                        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                            {t('SHIP_COMPUTER_DESC')}
                        </p>
                        <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-2xl group-hover:scale-110 transition-transform">
                            →
                        </div>
                    </div>
                </BentoCard>

                {/* ORBITAL ARRAY */}
                <BentoCard 
                    className="col-span-3 row-span-5"
                    onClick={() => engine.sessionManager.setMode(AppMode.ORBITAL_UPGRADES)}
                    active={installed.includes(SpaceshipModuleType.ORBITAL_CANNON)}
                    disabled={!installed.includes(SpaceshipModuleType.ORBITAL_CANNON)}
                    title={t('ORBITAL_TITLE')}
                    icon={<Icons.Radar />}
                    accent="red"
                >
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-4xl text-red-500/20 font-black tracking-tighter absolute right-6 top-16">{t('SHIP_KINETIC')}</div>
                        <p className="text-xs text-slate-400 mt-2 relative z-10">
                            {t('SHIP_ORBITAL_CARD_DESC')}
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                            <span>{t('SHIP_ORBITAL_BTN')}</span>
                            <span>→</span>
                        </div>
                    </div>
                </BentoCard>

                {/* BIO LAB */}
                <BentoCard 
                    className="col-span-3 row-span-5"
                    onClick={() => { engine.spaceshipManager.generateBioGrid(); engine.sessionManager.setMode(AppMode.BIO_SEQUENCING); }}
                    active={installed.includes(SpaceshipModuleType.BIO_SEQUENCING)}
                    disabled={!installed.includes(SpaceshipModuleType.BIO_SEQUENCING)}
                    title={t('BIO_TITLE')}
                    icon={<Icons.Hazard />}
                    accent="purple"
                >
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-4xl text-purple-500/20 font-black tracking-tighter absolute right-6 top-16">{t('SHIP_GENOME')}</div>
                        <p className="text-xs text-slate-400 mt-2 relative z-10">
                            {t('SHIP_BIO_CARD_DESC')}
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                            <span>{t('SHIP_BIO_BTN')}</span>
                            <span>→</span>
                        </div>
                    </div>
                </BentoCard>

                {/* CARAPACE / TECH */}
                <div className="col-span-3 row-span-9 flex flex-col gap-6">
                    <BentoCard 
                        className="flex-1"
                        onClick={() => { engine.spaceshipManager.generateCarapaceGrid(); engine.sessionManager.setMode(AppMode.CARAPACE_GRID); }}
                        active={installed.includes(SpaceshipModuleType.CARAPACE_ANALYZER)}
                        disabled={!installed.includes(SpaceshipModuleType.CARAPACE_ANALYZER)}
                        title={t('XENO_TITLE')}
                        icon={<Icons.Analysis />}
                        accent="emerald"
                    >
                        <div className="flex flex-col h-full relative">
                            <div className="text-4xl text-emerald-500/20 font-black tracking-tighter absolute right-0 top-0">{t('SHIP_XENO_BG')}</div>
                            <div className="mt-auto text-xs text-slate-400 relative z-10">
                                {t('SHIP_XENO_CARD_DESC')}
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard 
                        className="flex-1"
                        onClick={() => { engine.spaceshipManager.generateInfrastructureOptions(); engine.sessionManager.setMode(AppMode.INFRASTRUCTURE_RESEARCH); }}
                        active={installed.includes(SpaceshipModuleType.BASE_REINFORCEMENT)}
                        disabled={!installed.includes(SpaceshipModuleType.BASE_REINFORCEMENT)}
                        title={t('INFRA_TITLE')}
                        icon={<Icons.Crane />}
                        accent="yellow"
                    >
                        <div className="flex flex-col h-full relative">
                            <div className="text-4xl text-yellow-500/20 font-black tracking-tighter absolute right-0 top-0">{t('SHIP_INFRA_BG')}</div>
                            <div className="mt-auto text-xs text-slate-400 relative z-10">
                                {t('SHIP_INFRA_CARD_DESC')}
                            </div>
                        </div>
                    </BentoCard>
                </div>

                {/* FILLER */}
                <BentoCard className="col-span-6 row-span-4 border-dashed border-slate-800 bg-transparent" disabled>
                    <div className="h-full flex items-center justify-center text-slate-700 font-mono text-xs tracking-widest">
                        {t('SHIP_EXPANSION_SLOT')}
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};
