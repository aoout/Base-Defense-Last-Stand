
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, EnemyType, BossType, GameMode } from '../../types';
import { BESTIARY_DB, ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother, drawTubeWorm } from '../../utils/renderers';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { useLocale, Translator } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CanvasView } from './common/CanvasView';
import { KeyBindingUI } from './KeyBindingUI';
import { DS } from '../../theme/designSystem';
import { Icons } from './Icons';

// --- SUB-COMPONENTS ---

const MenuCard: React.FC<{ 
    title: string; 
    subtitle: string; 
    icon: React.ReactNode; 
    onClick: () => void; 
    variant?: 'default' | 'danger' | 'primary';
    disabled?: boolean;
}> = ({ title, subtitle, icon, onClick, variant = 'default', disabled }) => {
    let borderColor = 'border-slate-700';
    let hoverBorder = 'hover:border-cyan-500';
    let bg = 'bg-slate-900/60';
    let iconColor = 'text-slate-400';
    
    if (variant === 'primary') {
        borderColor = 'border-cyan-600';
        hoverBorder = 'hover:border-cyan-400';
        bg = 'bg-cyan-950/40';
        iconColor = 'text-cyan-400';
    } else if (variant === 'danger') {
        borderColor = 'border-red-900';
        hoverBorder = 'hover:border-red-500';
        bg = 'bg-red-950/20';
        iconColor = 'text-red-500';
    }

    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`
                group relative flex flex-col justify-between p-6 h-40 border-2 rounded-xl backdrop-blur-md transition-all duration-300
                ${bg} ${borderColor} ${disabled ? 'opacity-50 cursor-not-allowed' : `${hoverBorder} hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-1`}
            `}
        >
            <div className="flex justify-between items-start w-full">
                <div className={`p-3 rounded-lg bg-black/40 ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-8 h-8">{icon}</div>
                </div>
                {variant === 'primary' && <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div>}
            </div>
            
            <div className="text-left">
                <div className={`${DS.text.header} text-xl text-white mb-1 group-hover:text-cyan-100`}>{title}</div>
                <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase group-hover:text-slate-300">{subtitle}</div>
            </div>

            {/* Tech Decoration */}
            <div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden">
                <div className={`absolute bottom-0 right-0 w-[150%] h-1 bg-current opacity-20 -rotate-45 transform origin-bottom-right group-hover:w-[200%] transition-all ${iconColor}`}></div>
            </div>
        </button>
    );
};

const TelemetryRow: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = "text-white" }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
        <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">{label}</span>
        <span className={`font-mono font-bold text-lg ${color}`}>{value}</span>
    </div>
);

// --- SUB-VIEWS (Re-wrapped for new design) ---

const BestiaryView: React.FC<{ state: GameState, t: Translator, onBack: () => void }> = ({ state, t, onBack }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const discoveredList = state.stats.encounteredEnemies;
    
    const allEntities = [
        EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.VIPER, EnemyType.TANK, 
        EnemyType.KAMIKAZE, EnemyType.TUBE_WORM,
        BossType.RED_SUMMONER, BossType.BLUE_BURST, BossType.PURPLE_ACID, BossType.HIVE_MOTHER
    ];

    useEffect(() => {
        if (!selectedId && discoveredList.length > 0) {
            const first = allEntities.find(id => discoveredList.includes(id));
            if (first) setSelectedId(first);
        }
    }, [discoveredList]);

    const handleDraw = useCallback((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        if (!selectedId) return;
        ctx.clearRect(0, 0, w, h);
        
        let radius = 20;
        let color = '#fff';
        if (ENEMY_STATS[selectedId as EnemyType]) {
            radius = ENEMY_STATS[selectedId as EnemyType].radius;
            color = ENEMY_STATS[selectedId as EnemyType].color;
        } else if (BOSS_STATS[selectedId as BossType]) {
            radius = BOSS_STATS[selectedId as BossType].radius;
            color = BOSS_STATS[selectedId as BossType].color;
        }

        const isBoss = selectedId.includes('BOSS') || selectedId.includes('SUMMONER') || selectedId.includes('BURST') || selectedId.includes('ACID') || selectedId.includes('HIVE');
        const mockEntity: any = { 
            x: 0, y: 0, radius: radius * 2, angle: 0, hp: 100, maxHp: 100, 
            color: color, type: selectedId, bossType: selectedId, isBoss: isBoss,
            armorValue: 90, visualScaleY: 1
        };
        
        ctx.save();
        ctx.translate(w/2, h/2); 
        let scale = isBoss ? 1.5 : 3.0;
        if (selectedId === BossType.HIVE_MOTHER) scale = 0.8;
        
        ctx.scale(scale, scale);
        ctx.rotate(-Math.PI / 2 + Math.sin(time * 0.0005) * 0.2); 

        switch(selectedId) {
            case EnemyType.GRUNT: drawGrunt(ctx, mockEntity, time); break;
            case EnemyType.RUSHER: drawRusher(ctx, mockEntity, time); break;
            case EnemyType.TANK: drawTank(ctx, mockEntity, time); break;
            case EnemyType.KAMIKAZE: drawKamikaze(ctx, mockEntity, time); break;
            case EnemyType.VIPER: drawViper(ctx, mockEntity, time); break;
            case EnemyType.TUBE_WORM: drawTubeWorm(ctx, mockEntity, time); break;
            case BossType.RED_SUMMONER: drawBossRed(ctx, mockEntity, time); break;
            case BossType.BLUE_BURST: drawBossBlue(ctx, mockEntity, time); break;
            case BossType.PURPLE_ACID: drawBossPurple(ctx, mockEntity, time); break;
            case BossType.HIVE_MOTHER: drawHiveMother(ctx, mockEntity, time); break;
        }
        ctx.restore();
    }, [selectedId]);

    const info = selectedId && BESTIARY_DB[selectedId];

    return (
        <div className="flex h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl animate-fadeIn">
            {/* List */}
            <div className="w-72 flex flex-col h-full border-r border-slate-800 bg-black/40">
                <button onClick={onBack} className="p-6 text-left border-b border-slate-800 hover:bg-white/5 transition-colors flex items-center gap-3 text-slate-400 hover:text-white">
                    <span className="text-xl">«</span> <span className="font-bold text-sm tracking-widest">RETURN</span>
                </button>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-2 space-y-1">
                    {allEntities.map(id => {
                        const discovered = discoveredList.includes(id);
                        return (
                            <button 
                                key={id} 
                                onClick={() => discovered && setSelectedId(id)}
                                disabled={!discovered}
                                className={`
                                    w-full px-4 py-3 text-left font-mono text-xs tracking-widest transition-all rounded
                                    ${selectedId === id 
                                        ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/30' 
                                        : discovered 
                                            ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent' 
                                            : 'text-slate-800 cursor-not-allowed border border-transparent'}
                                `}
                            >
                                {discovered ? t(`ENEMY_${id}_NAME`).toUpperCase() : '/// ENCRYPTED'}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col relative bg-slate-900/50">
                {info ? (
                    <div className="flex h-full">
                        <div className="w-1/2 relative bg-gradient-to-b from-black/20 to-transparent flex items-center justify-center">
                            <CanvasView width={400} height={400} draw={handleDraw} />
                        </div>
                        <div className="w-1/2 p-8 overflow-y-auto border-l border-slate-800">
                             <div className="mb-8">
                                 <div className="text-xs text-slate-500 font-bold mb-1 tracking-widest">SUBJECT IDENTIFIER</div>
                                 <div className={`${DS.text.header} text-3xl text-white mb-2`}>{t(`ENEMY_${selectedId}_NAME`)}</div>
                                 <div className="inline-block px-2 py-1 bg-slate-800 rounded text-[10px] text-cyan-400 font-mono tracking-wider border border-slate-700">
                                     {info.classification}
                                 </div>
                             </div>
                             
                             <div className="mb-8">
                                 <div className="text-xs text-slate-500 font-bold mb-2 tracking-widest">{t('DANGER_LEVEL')}</div>
                                 <div className="flex gap-1">
                                     {Array.from({length: 10}).map((_, i) => (
                                         <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < info.danger ? 'bg-red-500' : 'bg-slate-800'}`}></div>
                                     ))}
                                 </div>
                             </div>

                             <div>
                                 <div className="text-xs text-slate-500 font-bold mb-2 tracking-widest">MORPHOLOGY</div>
                                 <p className={`${DS.text.body} text-justify`}>{t(`ENEMY_${selectedId}_DESC`)}</p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-700 font-mono text-sm tracking-widest">SELECT DATABASE ENTRY</div>
                )}
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ engine: any, state: GameState, t: Translator, onBack: () => void }> = ({ engine, state, t, onBack }) => {
    // Reusing logic, wrapping in new UI
    return (
        <div className="flex h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl animate-fadeIn">
            <div className="w-72 border-r border-slate-800 bg-black/40 p-6 flex flex-col">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
                    <span className="text-xl">«</span> <span className="font-bold text-xs tracking-widest">{t('BACK')}</span>
                </button>
                <h2 className="text-2xl font-display font-black text-white mb-2">{t('SETTINGS_TITLE')}</h2>
                <p className="text-xs text-slate-500 leading-relaxed">Configure system performance, audio interfaces, and accessibility protocols.</p>
            </div>
            <div className="flex-1 p-12 bg-slate-900/50 overflow-y-auto">
                <div className="grid grid-cols-2 gap-12 max-w-4xl">
                    <div className="space-y-6">
                        <h3 className="text-cyan-500 text-xs font-bold tracking-[0.2em] border-b border-cyan-900/50 pb-2 mb-4">GRAPHICS</h3>
                        <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-slate-300">{t('SETTING_PERFORMANCE')}</span>
                             <button onClick={() => engine.toggleSetting('performanceMode')} className="bg-slate-800 px-4 py-1.5 rounded border border-slate-600 hover:border-cyan-500 text-xs font-mono text-cyan-400 transition-all w-32">{t(`SETTING_${state.settings.performanceMode || 'BALANCED'}`)}</button>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-slate-300">{t('SETTING_SHADOWS')}</span>
                             <button onClick={() => engine.toggleSetting('showShadows')} className="bg-slate-800 px-4 py-1.5 rounded border border-slate-600 hover:border-cyan-500 text-xs font-mono text-cyan-400 transition-all w-32">{state.settings.showShadows ? t('SETTING_ON') : t('SETTING_OFF')}</button>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-slate-300">{t('SETTING_LIGHTING')}</span>
                             <button onClick={() => engine.toggleSetting('lightingQuality')} className="bg-slate-800 px-4 py-1.5 rounded border border-slate-600 hover:border-cyan-500 text-xs font-mono text-cyan-400 transition-all w-32">{state.settings.lightingQuality === 'HIGH' ? t('SETTING_HIGH') : t('SETTING_LOW')}</button>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-cyan-500 text-xs font-bold tracking-[0.2em] border-b border-cyan-900/50 pb-2 mb-4">SYSTEM</h3>
                        <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-slate-300">{t('SETTING_LANGUAGE')}</span>
                             <button onClick={() => engine.toggleSetting('language')} className="bg-slate-800 px-4 py-1.5 rounded border border-slate-600 hover:border-cyan-500 text-xs font-mono text-cyan-400 transition-all w-32">{state.settings.language === 'EN' ? 'ENGLISH' : '中文'}</button>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-slate-300">{t('HUD_OVERLAY')}</span>
                             <button onClick={() => engine.toggleSetting('showHUD')} className="bg-slate-800 px-4 py-1.5 rounded border border-slate-600 hover:border-cyan-500 text-xs font-mono text-cyan-400 transition-all w-32">{state.settings.showHUD ? t('SETTING_ON') : t('SETTING_OFF')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN COMPONENT ---

export const TacticalTerminal: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const [view, setView] = useState<'HOME' | 'DATABASE' | 'PLANET' | 'SETTINGS' | 'CONTROLS'>('HOME');

    const handleResume = () => engine.togglePause();
    const handleQuit = () => engine.returnToMainMenu();

    // Accuracy Calculation
    const accuracy = state.stats.shotsFired > 0 
        ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) 
        : '0.0';

    const renderContent = () => {
        switch(view) {
            case 'DATABASE': return <BestiaryView state={state} t={t} onBack={() => setView('HOME')} />;
            case 'SETTINGS': return <SettingsView engine={engine} state={state} t={t} onBack={() => setView('HOME')} />;
            case 'CONTROLS': return <KeyBindingUI onClose={() => setView('HOME')} />;
            case 'PLANET': 
                return state.currentPlanet ? (
                    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl p-8 relative animate-fadeIn">
                        <button onClick={() => setView('HOME')} className="absolute top-6 right-6 text-slate-400 hover:text-white font-bold tracking-widest text-xs z-50 flex items-center gap-2">
                            CLOSE ANALYSIS <span className="text-lg">×</span>
                        </button>
                        <PlanetInfoPanel planet={state.currentPlanet} spaceship={state.spaceship} onShowDetail={() => {}} />
                    </div>
                ) : null;
            default: return (
                <div className="w-full h-full grid grid-cols-12 gap-8 animate-slideInRight">
                    
                    {/* LEFT COLUMN: Telemetry (4 Cols) */}
                    <div className="col-span-4 flex flex-col gap-6">
                        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10"><Icons.Chart /></div>
                            <h3 className="text-cyan-500 font-bold text-xs tracking-widest mb-4 border-b border-cyan-900/30 pb-2">SESSION TELEMETRY</h3>
                            
                            <div className="space-y-1">
                                <TelemetryRow label="MISSION TIME" value={(state.time / 60000).toFixed(2) + " m"} color="text-cyan-300" />
                                <TelemetryRow label="CURRENT WAVE" value={state.wave.index} color="text-yellow-400" />
                                <TelemetryRow label="ENEMIES KILLED" value={(Object.values(state.stats.killsByType) as number[]).reduce((a,b)=>a+b,0)} />
                                <TelemetryRow label="ACCURACY" value={accuracy + "%"} />
                                <TelemetryRow label="DAMAGE DEALT" value={(state.stats.damageDealt / 1000).toFixed(1) + "k"} />
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 backdrop-blur-sm flex-1 relative overflow-hidden flex flex-col">
                            <h3 className="text-emerald-500 font-bold text-xs tracking-widest mb-4 border-b border-emerald-900/30 pb-2">RESOURCE LOG</h3>
                            <div className="flex-1 flex flex-col justify-center items-center gap-2">
                                <div className="text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-lg">{Math.floor(state.player.score)}</div>
                                <div className="text-xs text-slate-500 font-bold tracking-[0.3em]">BIOMASS UNITS</div>
                            </div>
                            {state.spaceship.bioResources && (
                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
                                    <div className="text-center">
                                        <div className="text-[9px] text-cyan-500 font-bold">ALPHA</div>
                                        <div className="text-white font-mono font-bold">{state.spaceship.bioResources.ALPHA}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-orange-500 font-bold">BETA</div>
                                        <div className="text-white font-mono font-bold">{state.spaceship.bioResources.BETA}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-purple-500 font-bold">GAMMA</div>
                                        <div className="text-white font-mono font-bold">{state.spaceship.bioResources.GAMMA}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Navigation Grid (8 Cols) */}
                    <div className="col-span-8 grid grid-cols-3 grid-rows-2 gap-4">
                        {/* RESUME (Double Width) */}
                        <div className="col-span-2 row-span-1">
                            <MenuCard 
                                title={t('RESUME_HINT').replace('PRESS ESC TO ','')} 
                                subtitle="RETURN TO COMBAT" 
                                icon={<div className="text-2xl">▶</div>}
                                onClick={handleResume}
                                variant="primary"
                            />
                        </div>

                        {/* DATABASE */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('TAB_DATABASE')} 
                                subtitle="XENO INTEL" 
                                icon={<Icons.Database />}
                                onClick={() => setView('DATABASE')}
                            />
                        </div>

                        {/* PLANET (Only in Exploration) */}
                        {state.gameMode === GameMode.EXPLORATION && (
                            <div className="col-span-1 row-span-1">
                                <MenuCard 
                                    title="PLANET" 
                                    subtitle="ENV. SCAN" 
                                    icon={<Icons.Planet />}
                                    onClick={() => setView('PLANET')}
                                />
                            </div>
                        )}

                        {/* SETTINGS */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('SETTINGS_BTN')} 
                                subtitle="CONFIG" 
                                icon={<Icons.Settings />}
                                onClick={() => setView('SETTINGS')}
                            />
                        </div>

                        {/* CONTROLS */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('CONTROLS_BTN')} 
                                subtitle="INPUT MAP" 
                                icon={<Icons.Gamepad />}
                                onClick={() => setView('CONTROLS')}
                            />
                        </div>

                        {/* ABORT */}
                        <div className="col-span-3 row-span-1 mt-4">
                            <button 
                                onClick={handleQuit}
                                className="w-full py-4 border border-red-900/50 bg-red-950/20 text-red-600 hover:bg-red-900 hover:text-white hover:border-red-500 transition-all font-bold tracking-[0.3em] uppercase text-xs flex items-center justify-center gap-4 group"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">«</span>
                                {t('RETURN_MAIN_MENU')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/60 backdrop-blur-xl flex items-center justify-center pointer-events-auto">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/80"></div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-6xl h-[80vh] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-white/10 pb-6 mb-8 px-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]"></div>
                            <span className="text-yellow-500 font-mono text-xs font-bold tracking-[0.3em]">SIMULATION PAUSED</span>
                        </div>
                        <h1 className={`${DS.text.header} text-5xl text-white`}>
                            TACTICAL COMMAND
                        </h1>
                    </div>
                    <div className="text-right opacity-50">
                        <div className="text-xs font-mono text-slate-400">SECTOR ID</div>
                        <div className="text-xl font-bold text-white uppercase tracking-widest">{state.sectorName || 'UNKNOWN'}</div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-0 relative px-4">
                    {renderContent()}
                </div>

                {/* Footer */}
                <div className="h-12 border-t border-white/5 mt-8 flex items-center justify-between px-4 opacity-40 text-[10px] font-mono text-slate-500">
                    <div>VANGUARD OS v4.0.2 // CONNECTED</div>
                    <div>PRESS [ESC] TO CLOSE</div>
                </div>
            </div>
        </div>
    );
};
