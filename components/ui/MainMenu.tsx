
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CombatRecord, SaveFile } from '../../types';
import { SaveSlotItem } from './SaveSlot';
import { HoloWindow, CloseButton, GlitchText } from './Shared';
import { CHANGELOG, CURRENT_VERSION } from '../../data/changelog';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { KeyBindingUI } from './KeyBindingUI';

// --- VECTOR ICONS (No More Emojis) ---
const Icons = {
    Shield: () => <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    Planet: () => <g><circle cx="12" cy="12" r="8" /><path d="M2.5 12h19M12 2.5v19" opacity="0.3" /><path d="M18 6l-12 12" opacity="0.3" /></g>,
    Campaign: () => <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    Save: () => <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8V3" />,
    Chart: () => <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
    Info: () => <g><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></g>,
    Settings: () => <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.29 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />,
    Gamepad: () => <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
};

// --- WIREFRAME PLANET VISUALIZER (No Canvas, Pure SVG for crisp lines) ---
const WireframePlanet: React.FC<{ active: boolean, color: string }> = ({ active, color }) => {
    const [rotation, setRotation] = useState(0);
    
    useEffect(() => {
        let ani: number;
        const loop = () => {
            setRotation(r => (r + 0.2) % 360);
            ani = requestAnimationFrame(loop);
        };
        if (active) loop();
        return () => cancelAnimationFrame(ani);
    }, [active]);

    const lines = [0, 45, 90, 135];
    
    return (
        <div className={`relative w-48 h-48 transition-all duration-1000 ${active ? 'opacity-100 scale-100' : 'opacity-20 scale-90 grayscale'}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                {/* Outer Ring */}
                <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="4 2" className="animate-[spin-slow_20s_linear_infinite]" />
                
                {/* Rotating Sphere Wireframe */}
                <g transform={`rotate(${rotation} 50 50)`}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="1" filter="url(#glow)" />
                    {lines.map((deg, i) => (
                        <ellipse key={i} cx="50" cy="50" rx="40" ry={15} transform={`rotate(${deg} 50 50)`} fill="none" stroke={color} strokeWidth="0.5" opacity="0.6" />
                    ))}
                </g>
                
                {/* Scanning reticle */}
                {active && (
                    <>
                        <path d="M10 10 L20 10 L10 20" fill="none" stroke="white" strokeWidth="2" />
                        <path d="M90 10 L80 10 L90 20" fill="none" stroke="white" strokeWidth="2" />
                        <path d="M10 90 L20 90 L10 80" fill="none" stroke="white" strokeWidth="2" />
                        <path d="M90 90 L80 90 L90 80" fill="none" stroke="white" strokeWidth="2" />
                        <rect x="0" y="48" width="100" height="4" fill={color} opacity="0.2" className="animate-pulse" />
                    </>
                )}
            </svg>
        </div>
    );
};

// --- STYLIZED COMPONENTS ---

const TacticalModeButton: React.FC<{ 
    label: string, 
    subLabel: string,
    onClick: () => void, 
    isActive: boolean,
    accentColor: string,
    Icon: React.FC<any>
}> = ({ label, subLabel, onClick, isActive, accentColor, Icon }) => (
    <button 
        onClick={onClick}
        className={`
            relative h-full flex-1 flex flex-col justify-center px-8 transition-all duration-300 group overflow-hidden border-r border-slate-800
            ${isActive ? 'bg-slate-900' : 'bg-slate-950 hover:bg-slate-900/50'}
        `}
    >
        {/* Animated Top Border */}
        <div className={`absolute top-0 left-0 w-full h-0.5 transition-all duration-300 transform origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ backgroundColor: accentColor }}></div>
        
        {/* Tech Decor Corners */}
        <div className={`absolute top-2 right-2 w-2 h-2 border-t border-r transition-opacity ${isActive ? 'opacity-100 border-white' : 'opacity-0 border-slate-600'}`}></div>
        <div className={`absolute bottom-2 left-2 w-2 h-2 border-b border-l transition-opacity ${isActive ? 'opacity-100 border-white' : 'opacity-0 border-slate-600'}`}></div>

        <div className="flex items-center gap-6 relative z-10">
            {/* Icon Box */}
            <div className={`
                w-16 h-16 flex items-center justify-center border-2 transition-all duration-500
                ${isActive ? `border-${accentColor} text-${accentColor} shadow-[0_0_20px_rgba(0,0,0,0.5)]` : 'border-slate-700 text-slate-600 group-hover:text-slate-400 group-hover:border-slate-500'}
            `}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-8 h-8 transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    <Icon />
                </svg>
            </div>

            <div className="text-left flex flex-col">
                <div className={`font-black font-display text-3xl uppercase tracking-tighter leading-none transition-colors ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-300'}`}>
                    {label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] px-1 py-0.5 border rounded font-mono ${isActive ? `border-${accentColor} text-${accentColor}` : 'border-slate-700 text-slate-700'}`}>
                        {isActive ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <div className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? 'text-white' : 'text-slate-600'}`}>
                        {subLabel}
                    </div>
                </div>
            </div>
        </div>

        {/* Hover Scanline */}
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] w-full transition-transform duration-1000 ${isActive ? 'translate-y-0' : '-translate-y-full group-hover:translate-y-full'}`}></div>
    </button>
);

const FuncKey: React.FC<{ 
    label: string, 
    Icon: React.FC<any>, 
    onClick: () => void,
    highlight?: boolean
}> = ({ label, Icon, onClick, highlight }) => (
    <button 
        onClick={onClick}
        className="relative flex flex-col items-center justify-center bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all active:scale-95 group overflow-hidden"
    >
        {/* LED Indicator */}
        <div className={`absolute top-1 left-1 w-1 h-1 rounded-full ${highlight ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-slate-800'}`}></div>
        
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-5 h-5 mb-1 transition-colors ${highlight ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}`}>
            <Icon />
        </svg>
        <div className={`text-[9px] font-bold tracking-wider uppercase ${highlight ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>{label}</div>
    </button>
);

// --- MAIN MENU LAYOUT ---

export const MainMenu: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);
    const [activeOverlay, setActiveOverlay] = useState<'SAVES' | 'HISTORY' | 'SETTINGS' | 'CHANGELOG' | 'CONTROLS' | null>(null);
    const [history, setHistory] = useState<CombatRecord[]>([]);

    useEffect(() => {
        setHistory(engine.saveManager.getHistory());
    }, [engine, activeOverlay]);

    // File Handlers
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            if (content) engine.importSave(content);
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    const handleExportSave = (id: string) => {
        const json = engine.exportSave(id);
        if (json) {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Vanguard_Save_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Render Sub-Components for Overlays
    const renderSettingsPanel = () => (
        <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => engine.toggleSetting('language')} className="bg-slate-900 border border-slate-700 p-3 flex justify-between items-center hover:border-cyan-500 transition-colors group">
                    <span className="text-xs text-slate-400 font-bold group-hover:text-white">{t('SETTING_LANGUAGE')}</span>
                    <span className="text-cyan-500 font-mono text-xs">{state.settings.language}</span>
                </button>
                <button onClick={() => engine.toggleSetting('performanceMode')} className="bg-slate-900 border border-slate-700 p-3 flex justify-between items-center hover:border-cyan-500 transition-colors group">
                    <span className="text-xs text-slate-400 font-bold group-hover:text-white">PERFORMANCE</span>
                    <span className="text-cyan-500 font-mono text-xs">{state.settings.performanceMode}</span>
                </button>
                <button onClick={() => engine.toggleSetting('showDamageNumbers')} className="bg-slate-900 border border-slate-700 p-3 flex justify-between items-center hover:border-cyan-500 transition-colors group">
                    <span className="text-xs text-slate-400 font-bold group-hover:text-white">{t('DMG_TEXT')}</span>
                    <div className={`w-2 h-2 rounded-full ${state.settings.showDamageNumbers ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </button>
                <button onClick={() => setActiveOverlay('CONTROLS')} className="bg-slate-900 border border-slate-700 p-3 text-center hover:bg-cyan-900/30 hover:border-cyan-500 text-slate-300 font-bold text-xs transition-colors">
                    {t('CONTROLS_BTN')}
                </button>
            </div>
        </div>
    );

    const renderHistoryPanel = () => (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
            {history.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 text-slate-600 font-mono text-xs">
                    // NO COMBAT DATA LOGGED //
                </div>
            ) : history.map(rec => {
                const isVictory = rec.result === 'VICTORY';
                return (
                    <div key={rec.id} className="flex justify-between items-center p-3 bg-slate-900/50 border-l-2 border-slate-700 hover:border-cyan-500 transition-colors group">
                        <div>
                            <div className={`text-[10px] font-bold tracking-wider mb-1 ${isVictory ? 'text-emerald-500' : 'text-red-500'}`}>{rec.result}</div>
                            <div className="text-white text-xs font-bold">{rec.details}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{rec.subDetails}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-yellow-500 font-mono text-sm">{rec.score.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-600">{new Date(rec.timestamp).toLocaleDateString()}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    );

    return (
        <div className="absolute inset-0 bg-[#050505] overflow-hidden flex flex-col font-sans select-none pointer-events-auto">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />

            {/* --- TOP: HOLOGRAPHIC VIEWPORT (70%) --- */}
            <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-[#050505] flex items-center justify-center overflow-hidden border-b-4 border-slate-800">
                
                {/* Background Grid Animation */}
                <div className="absolute inset-0 opacity-20 pointer-events-none perspective-[500px]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] transform rotate-x-60 scale-150 animate-[pulse_10s_infinite]"></div>
                </div>

                {/* Central Content */}
                <div className="relative z-10 text-center flex flex-col items-center">
                    
                    {hoveredMode === null && (
                        <div className="animate-fadeIn flex flex-col items-center gap-8">
                            <div className="relative">
                                <GlitchText text="PROJECT VANGUARD" className="text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
                                <div className="absolute -bottom-4 left-0 w-full flex justify-between text-[10px] font-mono text-cyan-900 tracking-[1em]">
                                    <span>sys.init</span>
                                    <span>v{CURRENT_VERSION}</span>
                                </div>
                            </div>
                            
                            <WireframePlanet active={true} color="#334155" />
                            
                            <div className="text-slate-600 font-mono text-xs tracking-widest mt-8 animate-pulse">
                                AWAITING OPERATOR INPUT
                            </div>
                        </div>
                    )}

                    {hoveredMode === 'SURVIVAL' && (
                        <div className="animate-fadeIn flex flex-col items-center">
                            <WireframePlanet active={true} color="#06b6d4" />
                            <h2 className="text-5xl font-black text-white mt-8 tracking-widest">{t('SURVIVAL_MODE')}</h2>
                            <div className="w-16 h-1 bg-cyan-500 my-4"></div>
                            <p className="text-cyan-400 font-mono tracking-widest text-sm">{t('SURVIVAL_DESC')}</p>
                        </div>
                    )}

                    {hoveredMode === 'EXPLORE' && (
                        <div className="animate-fadeIn flex flex-col items-center">
                            <WireframePlanet active={true} color="#a855f7" />
                            <h2 className="text-5xl font-black text-white mt-8 tracking-widest">{t('EXPLORE_MODE')}</h2>
                            <div className="w-16 h-1 bg-purple-500 my-4"></div>
                            <p className="text-purple-400 font-mono tracking-widest text-sm">{t('EXPLORE_DESC')}</p>
                        </div>
                    )}

                    {hoveredMode === 'CAMPAIGN' && (
                        <div className="animate-fadeIn flex flex-col items-center">
                            <WireframePlanet active={true} color="#eab308" />
                            <h2 className="text-5xl font-black text-white mt-8 tracking-widest">{t('CAMPAIGN_MODE')}</h2>
                            <div className="w-16 h-1 bg-yellow-500 my-4"></div>
                            <p className="text-yellow-400 font-mono tracking-widest text-sm">{t('CAMPAIGN_DESC')}</p>
                        </div>
                    )}
                </div>

                {/* Decorative UI elements */}
                <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-700 flex flex-col gap-1">
                    <span>CPU: OPTIMAL</span>
                    <span>MEM: 64TB FREE</span>
                    <span>NET: SECURE</span>
                </div>
                <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-700 text-right">
                    <div>UNAUTHORIZED ACCESS</div>
                    <div>WILL BE TERMINATED</div>
                </div>
            </div>

            {/* --- BOTTOM: CONTROL DECK (30%) --- */}
            <div className="h-72 bg-[#020202] flex relative z-20 border-t border-slate-800 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]">
                
                {/* 1. DEPLOYMENT CONTROLS (Left - 50%) */}
                <div className="flex-1 flex bg-[#050505]" onMouseLeave={() => setHoveredMode(null)}>
                    <div 
                        onMouseEnter={() => setHoveredMode('SURVIVAL')}
                        className="flex-1 border-r border-slate-800 relative"
                    >
                        <TacticalModeButton 
                            label={t('SURVIVAL_MODE')} 
                            subLabel="DEFENSE"
                            Icon={Icons.Shield}
                            accentColor="cyan-500"
                            isActive={hoveredMode === 'SURVIVAL'}
                            onClick={() => engine.enterSurvivalMode()}
                        />
                    </div>
                    <div 
                        onMouseEnter={() => setHoveredMode('EXPLORE')}
                        className="flex-1 border-r border-slate-800 relative"
                    >
                        <TacticalModeButton 
                            label={t('EXPLORE_MODE')} 
                            subLabel="CONQUEST"
                            Icon={Icons.Planet}
                            accentColor="purple-500"
                            isActive={hoveredMode === 'EXPLORE'}
                            onClick={() => engine.enterExplorationMode()}
                        />
                    </div>
                    <div 
                        onMouseEnter={() => setHoveredMode('CAMPAIGN')}
                        className="flex-1 border-r border-slate-800 relative"
                    >
                        <TacticalModeButton 
                            label={t('CAMPAIGN_MODE')} 
                            subLabel="STORY"
                            Icon={Icons.Campaign}
                            accentColor="yellow-500"
                            isActive={hoveredMode === 'CAMPAIGN'}
                            onClick={() => engine.enterCampaignMode()}
                        />
                    </div>
                </div>

                {/* 2. STATUS MONITOR (Center - 20%) */}
                <div className="w-64 bg-[#080808] border-r border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase mb-2">SYSTEM INTEGRITY</div>
                    
                    {/* Visualizer Bar Graph */}
                    <div className="flex items-end gap-1 h-12 w-full mb-auto opacity-50">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="bg-cyan-900 w-full animate-pulse" style={{
                                height: `${Math.random() * 80 + 20}%`,
                                animationDuration: `${0.2 + Math.random() * 0.5}s`
                            }}></div>
                        ))}
                    </div>

                    <div className="space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-500">
                            <span>KERNEL</span>
                            <span className="text-emerald-500">OK</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>UPLINK</span>
                            <span className="text-emerald-500">98%</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>BUILD</span>
                            <span className="text-cyan-500">{CURRENT_VERSION}</span>
                        </div>
                    </div>
                    
                    {/* Decorative Scanline */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/50 animate-[scan_4s_linear_infinite]"></div>
                </div>

                {/* 3. SYSTEM GRID (Right - 30%) */}
                <div className="w-96 bg-[#050505] p-1 grid grid-cols-3 grid-rows-2 gap-1">
                    <FuncKey label={t('EXTRACTABLE_MEMORIES')} Icon={Icons.Save} onClick={() => setActiveOverlay('SAVES')} highlight={activeOverlay === 'SAVES'} />
                    <FuncKey label={t('COMBAT_HISTORY')} Icon={Icons.Chart} onClick={() => setActiveOverlay('HISTORY')} highlight={activeOverlay === 'HISTORY'} />
                    <FuncKey label="PATCH NOTES" Icon={Icons.Info} onClick={() => setActiveOverlay('CHANGELOG')} highlight={activeOverlay === 'CHANGELOG'} />
                    
                    <FuncKey label={t('SETTINGS_BTN')} Icon={Icons.Settings} onClick={() => setActiveOverlay('SETTINGS')} highlight={activeOverlay === 'SETTINGS'} />
                    <FuncKey label={t('CONTROLS_BTN')} Icon={Icons.Gamepad} onClick={() => setActiveOverlay('CONTROLS')} highlight={activeOverlay === 'CONTROLS'} />
                    
                    {/* Dead Key / Filler */}
                    <div className="bg-[#030303] border border-slate-900 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-slate-600 animate-spin"></div>
                    </div>
                </div>
            </div>

            {/* --- MODAL OVERLAYS --- */}
            
            {activeOverlay === 'SAVES' && (
                <HoloWindow title={t('MEMORY_STORAGE')} subtitle="LOCAL ARCHIVES" onClose={() => setActiveOverlay(null)} color="cyan" width="w-[600px]">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <span className="text-xs text-slate-500">{t('MANUAL_MEMORY_DESC')}</span>
                        <button onClick={handleImportClick} className="text-[10px] bg-slate-800 px-3 py-1 border border-slate-600 hover:border-white text-white font-bold">{t('IMPORT_DATA')}</button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {state.saveSlots.length === 0 && <div className="text-center text-slate-600 italic py-12 border-2 border-dashed border-slate-800">{t('NO_ARCHIVES')}</div>}
                        {state.saveSlots.map(save => (
                            <SaveSlotItem 
                                key={save.id} 
                                save={save} 
                                onLoad={() => engine.loadGame(save.id)}
                                onDelete={() => engine.deleteSave(save.id)}
                                onPin={() => engine.togglePin(save.id)}
                                onExport={() => handleExportSave(save.id)}
                            />
                        ))}
                    </div>
                </HoloWindow>
            )}

            {activeOverlay === 'HISTORY' && (
                <HoloWindow title={t('COMBAT_HISTORY')} subtitle="BATTLE LOGS" onClose={() => setActiveOverlay(null)} color="yellow" width="w-[600px]">
                    {renderHistoryPanel()}
                </HoloWindow>
            )}

            {activeOverlay === 'SETTINGS' && (
                <HoloWindow title={t('SETTINGS_TITLE')} subtitle="CONFIGURATION" onClose={() => setActiveOverlay(null)} color="blue" width="w-[500px]">
                    {renderSettingsPanel()}
                </HoloWindow>
            )}

            {activeOverlay === 'CONTROLS' && <KeyBindingUI onClose={() => setActiveOverlay('SETTINGS')} />}

            {activeOverlay === 'CHANGELOG' && (
                <HoloWindow title="SYSTEM PATCH NOTES" subtitle={`v${CURRENT_VERSION}`} onClose={() => setActiveOverlay(null)} color="emerald" width="w-[700px]">
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {CHANGELOG.map((entry, idx) => {
                            const isCN = state.settings.language === 'CN';
                            const title = isCN && entry.titleCN ? entry.titleCN : entry.title;
                            const changes = isCN && entry.changesCN ? entry.changesCN : entry.changes;
                            return (
                                <div key={idx} className="border-l-2 border-slate-800 pl-6 relative">
                                    <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${idx===0 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className={`font-black text-lg ${idx===0 ? 'text-white' : 'text-slate-500'}`}>v{entry.version}</span>
                                        <span className="text-xs text-slate-600 font-mono">{entry.date}</span>
                                    </div>
                                    {title && <div className="text-emerald-600 text-xs font-bold tracking-widest uppercase mb-2">{title}</div>}
                                    <ul className="list-disc list-outside text-xs text-slate-400 space-y-1 ml-4">
                                        {changes.map((c, i) => (
                                            <li key={i} className="pl-1 leading-relaxed">{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </HoloWindow>
            )}

        </div>
    );
};
