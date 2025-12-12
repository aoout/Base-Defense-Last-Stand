
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, EnemyType, BossType, GameMode, DamageSource } from '../../types';
import { BESTIARY_DB, ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother, drawTubeWorm } from '../../utils/renderers';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { useLocale, Translator } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';
import { CanvasView } from './common/CanvasView';
import { KeyBindingUI } from './KeyBindingUI';
import { DS } from '../../theme/designSystem';
import { Icons } from './Icons';
import { SaveSlotItem } from './SaveSlot';

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
                <div className={`p-3 rounded-lg bg-black/40 ${iconColor} group-hover:scale-110 transition-transform duration-300 group-hover:text-white`}>
                    <div className="w-8 h-8 group-hover:animate-spin-slow">{icon}</div>
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

// --- AUDIO DECK SUB-VIEW ---

const AudioDeck: React.FC<{ engine: any, t: Translator, onBack: () => void }> = ({ engine, t, onBack }) => {
    // Local state for sliders (sync with audio engine on mount)
    // Accessing protected members directly is a bit hacky but efficient for this view without exposing everything public
    const audioCore = (engine.audio as any).core; 
    
    const [masterVol, setMasterVol] = useState(audioCore.masterGain.gain.value);
    const [musicVol, setMusicVol] = useState(audioCore.musicGain.gain.value);
    const [sfxVol, setSfxVol] = useState(audioCore.sfxCompressor.threshold.value === -100 ? 0 : 1.0); // Simplified sfx check
    const [ambienceVol, setAmbienceVol] = useState(audioCore.ambienceGain.gain.value);

    const updateVolume = (type: 'MASTER' | 'MUSIC' | 'AMBIENCE', val: number) => {
        const v = parseFloat(val.toString());
        if (type === 'MASTER') {
            audioCore.masterGain.gain.setValueAtTime(v, audioCore.currentTime);
            setMasterVol(v);
        } else if (type === 'MUSIC') {
            audioCore.musicGain.gain.setValueAtTime(v, audioCore.currentTime);
            setMusicVol(v);
        } else if (type === 'AMBIENCE') {
            audioCore.ambienceGain.gain.setValueAtTime(v, audioCore.currentTime);
            setAmbienceVol(v);
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl animate-fadeIn relative">
            {/* Ambient Backlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none"></div>

            {/* Left: Visualization Panel */}
            <div className="w-[450px] border-r border-slate-800 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
                <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 z-20 transition-colors">
                    <span className="text-xl">«</span> <span className="font-bold text-xs tracking-widest">{t('BACK')}</span>
                </button>

                {/* Spinning Disc */}
                <div className="relative w-64 h-64">
                    {/* Disc Body */}
                    <div className="absolute inset-0 rounded-full bg-black border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center animate-[spin_4s_linear_infinite]">
                        {/* Grooves */}
                        <div className="absolute inset-2 rounded-full border border-slate-800/50"></div>
                        <div className="absolute inset-6 rounded-full border border-slate-800/50"></div>
                        <div className="absolute inset-10 rounded-full border border-slate-800/50"></div>
                        
                        {/* Label */}
                        <div className="w-24 h-24 bg-gradient-to-tr from-cyan-600 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle,transparent_20%,#000_120%)]"></div>
                            <div className="text-[8px] font-black text-white/80 tracking-widest z-10">VANGUARD</div>
                        </div>
                    </div>
                    
                    {/* Needle Arm (Static Visual) */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 border-l-4 border-b-4 border-slate-600 rounded-bl-full pointer-events-none opacity-50 origin-top-right rotate-12"></div>
                </div>

                {/* Spectrum Analyzer (CSS Fake) */}
                <div className="mt-12 flex gap-1 h-16 items-end">
                    {Array.from({length: 20}).map((_, i) => (
                        <div 
                            key={i} 
                            className="w-2 bg-cyan-500/50 animate-pulse" 
                            style={{
                                height: `${20 + Math.random() * 80}%`,
                                animationDuration: `${0.2 + Math.random() * 0.5}s`
                            }}
                        ></div>
                    ))}
                </div>
                <div className="mt-2 text-[10px] font-mono text-cyan-500 tracking-[0.3em]">{t('FREQ_ANALYSIS')}</div>
            </div>

            {/* Right: Controls */}
            <div className="flex-1 p-12 bg-slate-900/30 flex flex-col justify-center">
                <div className="mb-10 border-b border-slate-800 pb-4">
                    <h2 className="text-4xl font-display font-black text-white mb-2">{t('AUDIO_TITLE')}</h2>
                    <p className="text-slate-500 font-mono text-xs tracking-widest">{t('AUDIO_SUB')}</p>
                </div>

                <div className="space-y-8 max-w-xl">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold tracking-widest text-cyan-400">
                            <span>{t('VOL_MASTER')}</span>
                            <span>{Math.round(masterVol * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={masterVol}
                            onChange={(e) => updateVolume('MASTER', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold tracking-widest text-purple-400">
                            <span>{t('VOL_MUSIC')}</span>
                            <span>{Math.round(musicVol * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="0.8" step="0.05" 
                            value={musicVol}
                            onChange={(e) => updateVolume('MUSIC', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold tracking-widest text-emerald-400">
                            <span>{t('VOL_AMBIENCE')}</span>
                            <span>{Math.round(ambienceVol * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="0.5" step="0.05" 
                            value={ambienceVol}
                            onChange={(e) => updateVolume('AMBIENCE', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-VIEWS ---

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
                    <span className="text-xl">«</span> <span className="font-bold text-sm tracking-widest">{t('BACK')}</span>
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
                    <div className="flex items-center justify-center h-full text-slate-700 font-mono text-sm tracking-widest">{t('BESTIARY_HINT')}</div>
                )}
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ engine: any, state: GameState, t: Translator, onBack: () => void }> = ({ engine, state, t, onBack }) => {
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

const LogsView: React.FC<{ t: Translator, onBack: () => void }> = ({ t, onBack }) => {
    const [selectedLog, setSelectedLog] = useState(1);
    const logs = [1, 2, 3, 4, 5];

    return (
        <div className="flex h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl animate-fadeIn">
            <div className="w-72 border-r border-slate-800 bg-black/40 p-6 flex flex-col">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
                    <span className="text-xl">«</span> <span className="font-bold text-xs tracking-widest">{t('BACK')}</span>
                </button>
                <h2 className="text-2xl font-display font-black text-white mb-2">{t('LOG_TITLE')}</h2>
                <div className="text-[10px] text-yellow-600 font-mono mb-4 tracking-widest uppercase">{t('LOG_SUBTITLE')}</div>
                
                <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-2">
                    {logs.map(id => (
                        <button 
                            key={id} 
                            onClick={() => setSelectedLog(id)}
                            className={`w-full p-3 text-left border-l-2 transition-all ${selectedLog === id ? 'bg-slate-800 border-yellow-500 text-yellow-100' : 'border-transparent text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                        >
                            <div className="text-[9px] font-bold tracking-widest uppercase mb-1">{t(`LOG_${id}_DATE`)}</div>
                            <div className="text-xs font-bold truncate">{t(`LOG_${id}_TITLE`)}</div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 bg-slate-900/50 p-12 overflow-y-auto">
                <div className="max-w-3xl">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-8">
                        <div>
                            <div className="text-yellow-500 font-bold text-xs tracking-[0.3em] mb-2">{t(`LOG_${selectedLog}_DATE`)}</div>
                            <h1 className="text-3xl font-display font-black text-white">{t(`LOG_${selectedLog}_TITLE`)}</h1>
                        </div>
                        <div className="text-slate-600 font-mono text-xs">ARCHIVE_ID: 00{selectedLog}</div>
                    </div>
                    <div className="prose prose-invert prose-sm font-mono text-slate-300 leading-loose">
                        {t(`LOG_${selectedLog}_CONTENT`)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemoryView: React.FC<{ engine: any, state: GameState, t: Translator, onBack: () => void }> = ({ engine, state, t, onBack }) => {
    return (
        <div className="flex h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl animate-fadeIn">
            <div className="w-72 border-r border-slate-800 bg-black/40 p-6 flex flex-col">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
                    <span className="text-xl">«</span> <span className="font-bold text-xs tracking-widest">{t('BACK')}</span>
                </button>
                <h2 className="text-2xl font-display font-black text-white mb-2">{t('MEMORY_STORAGE')}</h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">{t('MANUAL_MEMORY_DESC')}</p>
                
                <button 
                    onClick={() => engine.saveGame()}
                    className="w-full py-3 bg-blue-900/30 border border-blue-500/50 hover:bg-blue-900/50 hover:border-blue-400 text-blue-200 font-bold tracking-widest uppercase text-xs transition-all mb-2"
                >
                    {t('CREATE_SAVE')}
                </button>
            </div>
            
            <div className="flex-1 bg-slate-900/50 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                    {state.saveSlots.length === 0 && (
                        <div className="text-center py-20 text-slate-600 font-mono border-2 border-dashed border-slate-800 rounded">
                            {t('NO_ARCHIVES')}
                        </div>
                    )}
                    {state.saveSlots.map(save => (
                        <SaveSlotItem 
                            key={save.id} 
                            save={save} 
                            onLoad={() => engine.loadGame(save.id)} 
                            onDelete={() => engine.deleteSave(save.id)} 
                            onPin={() => engine.togglePin(save.id)} 
                            onExport={() => engine.exportSave(save.id)} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const TacticalTerminal: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const [view, setView] = useState<'HOME' | 'DATABASE' | 'PLANET' | 'SETTINGS' | 'CONTROLS' | 'LOGS' | 'MEMORY' | 'AUDIO'>('HOME');

    const handleResume = () => engine.togglePause();
    const handleQuit = () => engine.returnToMainMenu();

    // Accuracy Calculation
    const damageSources = state.stats.damageBySource;
    const totalPlayerSideDamage = (damageSources.PLAYER || 0) + (damageSources.TURRET || 0) + (damageSources.ALLY || 0) + (damageSources.ORBITAL || 0);
    const playerShare = totalPlayerSideDamage > 0 
        ? ((damageSources.PLAYER / totalPlayerSideDamage) * 100).toFixed(1) 
        : '0.0';

    const renderContent = () => {
        switch(view) {
            case 'DATABASE': return <BestiaryView state={state} t={t} onBack={() => setView('HOME')} />;
            case 'SETTINGS': return <SettingsView engine={engine} state={state} t={t} onBack={() => setView('HOME')} />;
            case 'CONTROLS': return <KeyBindingUI onClose={() => setView('HOME')} />;
            case 'LOGS': return <LogsView t={t} onBack={() => setView('HOME')} />;
            case 'MEMORY': return <MemoryView engine={engine} state={state} t={t} onBack={() => setView('HOME')} />;
            case 'AUDIO': return <AudioDeck engine={engine} t={t} onBack={() => setView('HOME')} />;
            case 'PLANET': 
                return state.currentPlanet ? (
                    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl p-8 relative animate-fadeIn">
                        <button onClick={() => setView('HOME')} className="absolute top-6 right-6 text-slate-400 hover:text-white font-bold tracking-widest text-xs z-50 flex items-center gap-2">
                            {t('CLOSE_ANALYSIS')} <span className="text-lg">×</span>
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
                            <h3 className="text-cyan-500 font-bold text-xs tracking-widest mb-4 border-b border-cyan-900/30 pb-2">{t('SESSION_TELEMETRY')}</h3>
                            
                            <div className="space-y-1">
                                <TelemetryRow label={t('MISSION_TIME')} value={(state.time / 60000).toFixed(2) + " m"} color="text-cyan-300" />
                                <TelemetryRow label={t('CURRENT_WAVE')} value={state.wave.index} color="text-yellow-400" />
                                <TelemetryRow label={t('ENEMIES_KILLED')} value={(Object.values(state.stats.killsByType) as number[]).reduce((a,b)=>a+b,0)} />
                                <TelemetryRow label={t('PLAYER_DMG_SHARE')} value={playerShare + "%"} />
                                <TelemetryRow label={t('DAMAGE_DEALT')} value={(state.stats.damageDealt / 1000).toFixed(1) + "k"} />
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 backdrop-blur-sm flex-1 relative overflow-hidden flex flex-col">
                            <h3 className="text-emerald-500 font-bold text-xs tracking-widest mb-4 border-b border-emerald-900/30 pb-2">{t('RESOURCE_LOG')}</h3>
                            <div className="flex-1 flex flex-col justify-center items-center gap-2">
                                <div className="text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-lg">{Math.floor(state.player.score)}</div>
                                <div className="text-xs text-slate-500 font-bold tracking-[0.3em]">{t('BIOMASS_UNITS')}</div>
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
                    <div className="col-span-8 grid grid-cols-4 grid-rows-3 gap-4">
                        {/* ROW 1 */}
                        {/* RESUME (Double Width) */}
                        <div className="col-span-2 row-span-1">
                            <MenuCard 
                                title={t('RESUME_HINT').replace('PRESS ESC TO ','')} 
                                subtitle={t('RETURN_TO_COMBAT')} 
                                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Play /></svg>}
                                onClick={handleResume}
                                variant="primary"
                            />
                        </div>

                        {/* DATABASE */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('TAB_DATABASE')} 
                                subtitle={t('XENO_INTEL')} 
                                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Database /></svg>}
                                onClick={() => setView('DATABASE')}
                            />
                        </div>

                        {/* PLANET (Only in Exploration) */}
                        {state.gameMode === GameMode.EXPLORATION ? (
                            <div className="col-span-1 row-span-1">
                                <MenuCard 
                                    title={t('TAB_PLANET')} 
                                    subtitle={t('ENV_SCAN')} 
                                    icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Planet /></svg>}
                                    onClick={() => setView('PLANET')}
                                />
                            </div>
                        ) : (
                            // Placeholder if not exploration to keep grid alignment
                            <div className="col-span-1 row-span-1 opacity-20 pointer-events-none"></div>
                        )}

                        {/* ROW 2 */}
                        {/* LOGS */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('TAB_LOGS')} 
                                subtitle={t('MISSION_ARCHIVES')} 
                                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Logs /></svg>}
                                onClick={() => setView('LOGS')}
                            />
                        </div>

                        {/* MEMORY (Saves) */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('TAB_MEMORY')} 
                                subtitle={t('CRYO_STASIS')} 
                                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Save /></svg>}
                                onClick={() => setView('MEMORY')}
                            />
                        </div>

                        {/* SETTINGS */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('SETTINGS_BTN')} 
                                subtitle={t('CONFIG')} 
                                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Settings /></svg>}
                                onClick={() => setView('SETTINGS')}
                            />
                        </div>

                        {/* CONTROLS */}
                        <div className="col-span-1 row-span-1">
                            <MenuCard 
                                title={t('CONTROLS_BTN')} 
                                subtitle={t('INPUT_MAP')} 
                                icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><Icons.Gamepad /></svg>}
                                onClick={() => setView('CONTROLS')}
                            />
                        </div>

                        {/* ROW 3: AUDIO & ABORT */}
                        <div className="col-span-1 row-span-1 mt-auto">
                            <MenuCard 
                                title={t('TAB_AUDIO')} 
                                subtitle={t('AUDIO_TITLE')} 
                                icon={<div className="w-full h-full text-purple-400"><Icons.Disc /></div>}
                                onClick={() => setView('AUDIO')}
                            />
                        </div>

                        <div className="col-span-3 row-span-1 mt-auto">
                            <button 
                                onClick={handleQuit}
                                className="w-full h-full py-4 border border-red-900/50 bg-red-950/20 text-red-600 hover:bg-red-900 hover:text-white hover:border-red-500 transition-all font-bold tracking-[0.3em] uppercase text-xs flex items-center justify-center gap-4 group rounded-xl"
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
                            <span className="text-yellow-500 font-mono text-xs font-bold tracking-[0.3em]">{t('SIMULATION_PAUSED')}</span>
                        </div>
                        <h1 className={`${DS.text.header} text-5xl text-white`}>
                            {t('SYSTEM_PAUSED_TITLE')}
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
                    <div>VANGUARD OS v4.0.2 // {t('CONNECTED')}</div>
                    <div>{t('PRESS_ESC_CLOSE')}</div>
                </div>
            </div>
        </div>
    );
};
