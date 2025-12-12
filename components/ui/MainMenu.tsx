
import React, { useRef, useState, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { KeyBindingUI } from './KeyBindingUI';
import { SaveSlotItem } from './SaveSlot';
import { CHANGELOG, CURRENT_VERSION } from '../../data/changelog';
import { CombatRecord } from '../../types';
import { DS } from '../../theme/designSystem';

// --- VISUAL PRIMITIVES ---

// 3D Parallax Layer
const ParallaxLayer: React.FC<{ 
    depth: number; 
    mousePos: { x: number, y: number }; 
    children: React.ReactNode; 
    className?: string;
}> = ({ depth, mousePos, children, className = "" }) => {
    // Calculate offset based on mouse position (-1 to 1)
    const x = mousePos.x * depth * 40; 
    const y = mousePos.y * depth * 40;
    
    return (
        <div 
            className={`absolute inset-0 transition-transform duration-100 ease-out will-change-transform ${className}`}
            style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
        >
            {children}
        </div>
    );
};

// Meteor Shower Effect
const MeteorShower: React.FC = () => {
    const [meteors, setMeteors] = useState<{id: number, top: number, left: number}[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Restrained frequency: ~1 meteor every 4 seconds on average
            if (Math.random() < 0.05) { 
                const id = Date.now();
                setMeteors(prev => [...prev, {
                    id,
                    // Spawn mostly in top-right quadrant for diagonal fall
                    top: Math.random() * 40 - 20, 
                    left: 20 + Math.random() * 80
                }]);
                
                // Cleanup after animation
                setTimeout(() => {
                    setMeteors(prev => prev.filter(m => m.id !== id));
                }, 2500); 
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <style>{`
                @keyframes meteor-fall {
                    0% { transform: rotate(215deg) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: rotate(215deg) translateX(120vh); opacity: 0; }
                }
            `}</style>
            {meteors.map(m => (
                <div 
                    key={m.id}
                    className="absolute h-0.5 w-[150px] bg-gradient-to-r from-transparent via-cyan-400 to-white shadow-[0_0_15px_rgba(34,211,238,0.8)] rounded-full"
                    style={{
                        top: `${m.top}%`,
                        left: `${m.left}%`,
                        animation: `meteor-fall 2s linear forwards`,
                    }}
                />
            ))}
        </div>
    );
};

// Main Menu Navigation Button
const NavButton: React.FC<{ 
    label: string; 
    subLabel: string; 
    onClick: () => void; 
    onHover?: () => void;
    active?: boolean;
    accentColor?: string;
    delay?: number;
}> = ({ label, subLabel, onClick, onHover, active, accentColor = "text-cyan-400", delay = 0 }) => (
    <button 
        onClick={onClick}
        onMouseEnter={onHover}
        className="group relative flex flex-col items-end py-6 pl-24 pr-0 transition-all duration-500 ease-out pointer-events-auto hover:pr-8"
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Animated Background Line */}
        <div className={`absolute top-1/2 right-0 w-0 h-[1px] bg-current transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100 ${accentColor}`}></div>
        
        <div className={`text-5xl md:text-7xl font-black font-display tracking-tight uppercase transition-all duration-300 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 origin-right group-hover:scale-105 drop-shadow-2xl`}>
            {label}
        </div>
        <div className={`text-[10px] font-mono tracking-[0.4em] uppercase transition-colors duration-300 ${active ? accentColor : 'text-slate-500 group-hover:text-white'}`}>
            {subLabel}
        </div>
    </button>
);

// Unified Slide-Over Panel for Sub-Menus (Mica Effect & Silky Animation)
const CinematicPanel: React.FC<{
    title: string;
    subtitle: string;
    onClose: () => void;
    children: React.ReactNode;
    accentColor?: string;
}> = ({ title, subtitle, onClose, children, accentColor = "bg-cyan-500" }) => {
    
    // 1. Extract base color name for dynamic gradients
    // e.g. "bg-cyan-500" -> "cyan"
    const colorName = accentColor.replace('bg-', '').replace('-500', '');
    
    // 2. Map color names to RGB values for rgba() usage
    const colorMap: Record<string, string> = {
        'cyan': '34, 211, 238',    // cyan-400
        'blue': '59, 130, 246',    // blue-500
        'emerald': '52, 211, 153', // emerald-400
        'yellow': '250, 204, 21',  // yellow-400
        'purple': '192, 132, 252', // purple-400
        'red': '248, 113, 113',    // red-400
        'slate': '148, 163, 184',  // slate-400
        'white': '255, 255, 255'
    };
    
    const rgb = colorMap[colorName] || '255, 255, 255'; // Fallback to white

    return (
        <>
            <style>{`
                @keyframes silkySlideIn {
                    0% { transform: translateX(100%) scale(0.98); opacity: 0; }
                    100% { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes contentFadeIn {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .mica-panel {
                    /* Base Dark Glass */
                    background-color: rgba(15, 23, 42, 0.60); 
                    
                    /* Dynamic Subtle Gradient Tint */
                    background-image: 
                        linear-gradient(135deg, rgba(${rgb}, 0.08) 0%, rgba(15, 23, 42, 0) 50%),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.2) 100%);

                    /* Advanced Blur & Saturation */
                    backdrop-filter: blur(50px) saturate(200%);
                    
                    /* Edge Lighting & Deep Shadow */
                    box-shadow: 
                        inset 1px 0 0 rgba(255, 255, 255, 0.1),
                        inset 0 0 20px rgba(${rgb}, 0.05), /* Subtle inner color glow */
                        -20px 0 100px rgba(0,0,0,0.9);
                        
                    animation: silkySlideIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
                }
                .mica-content {
                    animation: contentFadeIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.1s forwards;
                    opacity: 0;
                }
                .bg-noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
                }
            `}</style>

            <div className="absolute inset-y-0 right-0 w-full md:w-[65%] lg:w-[50%] z-50 flex flex-col pointer-events-auto mica-panel border-l border-white/5 overflow-hidden">
                
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 bg-noise pointer-events-none mix-blend-overlay opacity-30"></div>
                
                {/* Ambient Glow Blob */}
                <div className={`absolute -top-40 -right-40 w-[800px] h-[800px] ${accentColor} opacity-[0.08] blur-[150px] pointer-events-none rounded-full`}></div>

                {/* Decorative Top Edge */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                {/* Header */}
                <div className="pt-24 pb-8 px-16 flex justify-between items-end shrink-0 relative z-10 mica-content">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-1 h-8 ${accentColor} shadow-[0_0_15px_currentColor]`}></div>
                            <div className="h-px w-12 bg-white/20"></div>
                        </div>
                        <h2 className="text-6xl font-black font-display text-white tracking-wide uppercase leading-none drop-shadow-lg">{title}</h2>
                        <div className="text-xs font-mono text-slate-400 tracking-[0.4em] mt-2 uppercase flex items-center gap-2">
                            <span style={{ color: `rgba(${rgb}, 1)` }}>//</span> {subtitle}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="group flex items-center gap-4 text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="text-[10px] font-bold tracking-widest hidden md:block opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">CLOSE</span>
                        <div className="w-12 h-12 border border-slate-700 rounded-full flex items-center justify-center group-hover:border-white transition-colors bg-slate-900/50 backdrop-blur-sm shadow-lg">
                            <div className="text-2xl font-light group-hover:rotate-90 transition-transform duration-300">×</div>
                        </div>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-16 pb-16 custom-scrollbar relative z-10 mica-content delay-75">
                    {children}
                </div>
            </div>
        </>
    );
};

// --- CONTENT COMPONENTS ---

const SettingRow: React.FC<{ label: string, value: string | number, onClick: () => void }> = ({ label, value, onClick }) => (
    <button onClick={onClick} className="w-full flex justify-between items-center py-6 border-b border-white/5 group hover:bg-white/5 hover:px-6 transition-all duration-500 ease-out text-left relative overflow-hidden rounded-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <span className="text-sm font-bold text-slate-400 group-hover:text-white tracking-widest transition-colors relative z-10">{label}</span>
        <span className="font-mono text-cyan-500 group-hover:scale-110 transition-transform relative z-10 group-hover:text-cyan-300">{value}</span>
    </button>
);

const HistoryCard: React.FC<{ record: CombatRecord }> = ({ record }) => {
    const isVictory = record.result === 'VICTORY';
    return (
        <div className={`border-l-2 ${isVictory ? 'border-emerald-500/50' : 'border-red-500/50'} pl-6 py-4 hover:bg-white/5 transition-all duration-300 group relative overflow-hidden`}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex flex-col">
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${isVictory ? 'text-emerald-500' : 'text-red-500'}`}>
                        {record.result}
                    </span>
                    <span className="text-2xl font-black font-display text-white group-hover:text-cyan-100 transition-colors">
                        {record.details}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-yellow-500">{record.score.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">SCRAPS</div>
                </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 relative z-10">
                <span>{record.subDetails}</span>
                <span>{new Date(record.timestamp).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

// --- MAIN MENU ---

export const MainMenu: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // UI State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [activeOverlay, setActiveOverlay] = useState<'SAVES' | 'HISTORY' | 'SETTINGS' | 'CONTROLS' | 'CHANGELOG' | null>(null);
    const [hoveredSection, setHoveredSection] = useState<'DEFAULT' | 'SURVIVAL' | 'CAMPAIGN' | 'EXPLORE' | 'SYSTEM'>('DEFAULT');

    const handleMouseMove = (e: React.MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMousePos({ x, y });
    };

    // Logic Wrappers
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { if (ev.target?.result) engine.importSave(ev.target.result as string); };
        reader.readAsText(file);
        e.target.value = '';
    };
    const handleExportSave = (id: string) => {
        const json = engine.exportSave(id);
        if (json) {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Vanguard_Save_${Date.now()}.json`;
            a.click(); URL.revokeObjectURL(url);
        }
    };

    // Dynamic Atmosphere Colors
    const getOrbColor = () => {
        switch(hoveredSection) {
            case 'SURVIVAL': return 'shadow-[0_0_150px_rgba(6,182,212,0.4)] bg-cyan-500';
            case 'CAMPAIGN': return 'shadow-[0_0_150px_rgba(234,179,8,0.4)] bg-yellow-500';
            case 'EXPLORE': return 'shadow-[0_0_150px_rgba(168,85,247,0.4)] bg-purple-500';
            default: return 'shadow-[0_0_100px_rgba(255,255,255,0.1)] bg-slate-500';
        }
    };

    // --- CONTENT RENDERERS ---

    const renderSettings = () => (
        <CinematicPanel title={t('SETTINGS_TITLE')} subtitle="SYSTEM CONFIGURATION" onClose={() => setActiveOverlay(null)} accentColor="bg-cyan-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-12">
                <div>
                    <h3 className="text-white font-bold text-xs tracking-[0.2em] mb-6 uppercase border-b border-white/10 pb-2 opacity-50">GAMEPLAY</h3>
                    <SettingRow label={t('SETTING_LANGUAGE')} value={state.settings.language === 'EN' ? 'ENGLISH' : '中文'} onClick={() => engine.toggleSetting('language')} />
                    <SettingRow label={t('HUD_OVERLAY')} value={state.settings.showHUD ? 'ON' : 'OFF'} onClick={() => engine.toggleSetting('showHUD')} />
                    <SettingRow label={t('DMG_TEXT')} value={state.settings.showDamageNumbers ? 'ON' : 'OFF'} onClick={() => engine.toggleSetting('showDamageNumbers')} />
                    <SettingRow label={t('AUTO_RETURN')} value={state.settings.autoReturnToMenu ? 'ON' : 'OFF'} onClick={() => engine.toggleSetting('autoReturnToMenu')} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-xs tracking-[0.2em] mb-6 uppercase border-b border-white/10 pb-2 opacity-50">GRAPHICS</h3>
                    <SettingRow label={t('SETTING_PERFORMANCE')} value={state.settings.performanceMode || 'BALANCED'} onClick={() => engine.toggleSetting('performanceMode')} />
                    <SettingRow label={t('SETTING_RESOLUTION')} value={`${(state.settings.resolutionScale || 1.0)*100}%`} onClick={() => engine.toggleSetting('resolutionScale')} />
                    <SettingRow label={t('SETTING_SHADOWS')} value={state.settings.showShadows ? 'ON' : 'OFF'} onClick={() => engine.toggleSetting('showShadows')} />
                    <SettingRow label={t('SETTING_PARTICLES')} value={state.settings.particleIntensity} onClick={() => engine.toggleSetting('particleIntensity')} />
                    <SettingRow label={t('SETTING_ANIM_BG')} value={state.settings.animatedBackground ? 'ON' : 'OFF'} onClick={() => engine.toggleSetting('animatedBackground')} />
                </div>
            </div>
            <div className="mt-12">
                <button 
                    onClick={() => setActiveOverlay('CONTROLS')}
                    className="px-8 py-4 border border-white/20 text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all uppercase text-sm hover:scale-105 active:scale-95 duration-200"
                >
                    {t('CONTROLS_BTN')}
                </button>
            </div>
        </CinematicPanel>
    );

    const renderSaves = () => (
        <CinematicPanel title={t('MEMORY_STORAGE')} subtitle="LOCAL DATA BANK" onClose={() => setActiveOverlay(null)} accentColor="bg-blue-500">
            <div className="mb-8 flex justify-end">
                <button onClick={handleImportClick} className="px-6 py-3 border border-blue-500/50 text-blue-400 text-xs font-bold tracking-widest hover:bg-blue-500 hover:text-white transition-colors uppercase">
                    {t('IMPORT_DATA')}
                </button>
            </div>
            <div className="space-y-4">
                {state.saveSlots.length === 0 && (
                    <div className="text-slate-600 font-mono text-sm py-20 text-center border-2 border-dashed border-white/10 rounded-lg">
                        // NO DATA FOUND
                    </div>
                )}
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
        </CinematicPanel>
    );

    const renderHistory = () => {
        const history = engine.saveManager.getHistory();
        return (
            <CinematicPanel title={t('COMBAT_HISTORY')} subtitle="BATTLEFIELD RECORDS" onClose={() => setActiveOverlay(null)} accentColor="bg-emerald-500">
                <div className="space-y-6">
                    {history.length === 0 && (
                        <div className="text-slate-600 font-mono text-sm py-20 text-center border-2 border-dashed border-white/10 rounded-lg">
                            // NO RECORDS FOUND
                        </div>
                    )}
                    {history.map((rec, i) => (
                        <HistoryCard key={rec.id || i} record={rec} />
                    ))}
                </div>
            </CinematicPanel>
        );
    };

    const renderChangelog = () => (
        <CinematicPanel title="PATCH NOTES" subtitle={`BUILD v${CURRENT_VERSION}`} onClose={() => setActiveOverlay(null)} accentColor="bg-yellow-500">
            <div className="space-y-12">
                {CHANGELOG.map((entry, idx) => {
                    const isCN = state.settings.language === 'CN';
                    const title = isCN && entry.titleCN ? entry.titleCN : entry.title;
                    const changes = isCN && entry.changesCN ? entry.changesCN : entry.changes;
                    return (
                        <div key={idx} className="relative pl-8 border-l border-slate-700/50">
                            <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-yellow-500 shadow-[0_0_10px_orange]' : 'bg-slate-700'}`}></div>
                            <div className="flex items-baseline gap-4 mb-4">
                                <span className={`text-4xl font-black font-display ${idx === 0 ? 'text-white' : 'text-slate-500'}`}>v{entry.version}</span>
                                <span className="text-xs font-mono text-slate-500 tracking-widest">{entry.date}</span>
                            </div>
                            {title && <div className="text-yellow-500 text-sm font-bold tracking-widest uppercase mb-4">{title}</div>}
                            <ul className="space-y-3">
                                {changes.map((c, i) => (
                                    <li key={i} className="text-sm text-slate-400 leading-relaxed pl-4 relative before:content-['>'] before:absolute before:left-0 before:text-slate-600/50">
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </CinematicPanel>
    );

    return (
        <div className="absolute inset-0 w-full h-full bg-[#020202] overflow-hidden font-sans select-none text-slate-200 pointer-events-auto cursor-default" onMouseMove={handleMouseMove}>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            
            {/* LAYER 0: PARALLAX BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111827_0%,#000000_100%)] z-0"></div>
            
            <ParallaxLayer depth={0.1} mousePos={mousePos}>
                {/* Subtle Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
            </ParallaxLayer>

            {/* LAYER 0.5: METEOR SHOWER (Behind core, in front of grid) */}
            <ParallaxLayer depth={0.15} mousePos={mousePos}>
                <MeteorShower />
            </ParallaxLayer>

            {/* LAYER 1: The Core (Midground Object) */}
            <ParallaxLayer depth={0.3} mousePos={mousePos} className="flex items-center justify-center">
                {/* Dynamic Orb */}
                <div className={`w-[60vh] h-[60vh] rounded-full transition-all duration-1000 opacity-20 blur-3xl ${getOrbColor()}`}></div>
                
                {/* Tech Rings */}
                <div className="absolute w-[50vh] h-[50vh] border border-white/5 rounded-full animate-[spin_60s_linear_infinite]"></div>
                <div className="absolute w-[70vh] h-[70vh] border border-dashed border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
            </ParallaxLayer>

            {/* LAYER 2: Structural Frame (Foreground) */}
            <ParallaxLayer depth={0.6} mousePos={mousePos}>
                <div className="absolute -left-[10%] top-0 bottom-0 w-[40%] bg-black/90 transform -skew-x-12 blur-sm"></div>
                <div className="absolute -right-[10%] top-0 bottom-0 w-[20%] bg-black/90 transform skew-x-12 blur-sm"></div>
            </ParallaxLayer>

            {/* LAYER 3: Particles / Dust (Fastest) */}
            <ParallaxLayer depth={1.2} mousePos={mousePos} className="pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/40 rounded-full blur-[1px]"></div>
                <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-white/20 rounded-full blur-[2px]"></div>
                <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-cyan-500/40 rounded-full"></div>
            </ParallaxLayer>

            {/* MOUSE SPOTLIGHT */}
            <div 
                className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-30"
                style={{
                    background: `radial-gradient(600px circle at ${(mousePos.x + 1) * 50}% ${(mousePos.y + 1) * 50}%, rgba(255,255,255,0.15), transparent 40%)`
                }}
            ></div>

            {/* UI LAYER */}
            <div className={`absolute inset-0 z-40 p-8 md:p-16 flex flex-col justify-between pointer-events-none transition-all duration-500 ${activeOverlay ? 'opacity-30 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
                
                {/* TOP LEFT: Brand */}
                <div className="pointer-events-auto transform transition-transform duration-500 hover:translate-x-2 w-max" style={{ transform: `translate(${-mousePos.x * 10}px, ${-mousePos.y * 10}px)` }}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px w-12 bg-cyan-500"></div>
                        <span className="text-cyan-500 font-mono text-[10px] tracking-[0.4em]">SYSTEM ONLINE</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black font-display tracking-tighter text-white leading-[0.8] mix-blend-overlay opacity-90">
                        PROJECT<br/>VANGUARD
                    </h1>
                    <div className="mt-6 flex items-center gap-6 text-xs font-mono text-slate-500">
                        <div className="bg-slate-800 px-2 py-1 rounded text-slate-300">v{CURRENT_VERSION}</div>
                        <span>|</span>
                        <span>{new Date().toLocaleDateString().toUpperCase()}</span>
                    </div>
                </div>

                {/* BOTTOM RIGHT: Navigation */}
                <div className="absolute bottom-16 right-16 flex flex-col items-end pointer-events-auto" style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` }}>
                    <NavButton 
                        label={t('SURVIVAL_MODE')} 
                        subLabel="ENDLESS DEFENSE PROTOCOL" 
                        onClick={() => engine.enterSurvivalMode()} 
                        onHover={() => setHoveredSection('SURVIVAL')}
                        accentColor="text-cyan-400"
                        delay={100}
                    />
                    <NavButton 
                        label={t('CAMPAIGN_MODE')} 
                        subLabel="NARRATIVE OPERATIONS" 
                        onClick={() => engine.enterCampaignMode()} 
                        onHover={() => setHoveredSection('CAMPAIGN')}
                        accentColor="text-yellow-400"
                        delay={200}
                    />
                    <NavButton 
                        label={t('EXPLORE_MODE')} 
                        subLabel="SECTOR CARTOGRAPHY" 
                        onClick={() => engine.enterExplorationMode()} 
                        onHover={() => setHoveredSection('EXPLORE')}
                        accentColor="text-purple-400"
                        delay={300}
                    />
                    
                    <div className="h-px w-64 bg-gradient-to-l from-slate-700 to-transparent my-10"></div>

                    {/* Secondary Nav */}
                    <div className="flex gap-12">
                        <button 
                            onClick={() => setActiveOverlay('SETTINGS')}
                            onMouseEnter={() => setHoveredSection('SYSTEM')}
                            className="text-xs font-bold tracking-widest text-slate-500 hover:text-white transition-colors relative group"
                        >
                            {t('SETTINGS_BTN')}
                            <div className="absolute -bottom-2 right-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300"></div>
                        </button>
                        <button 
                            onClick={() => setActiveOverlay('SAVES')}
                            onMouseEnter={() => setHoveredSection('SYSTEM')}
                            className="text-xs font-bold tracking-widest text-slate-500 hover:text-white transition-colors relative group"
                        >
                            {t('TAB_MEMORY')}
                            <div className="absolute -bottom-2 right-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300"></div>
                        </button>
                        <button 
                            onClick={() => setActiveOverlay('HISTORY')}
                            onMouseEnter={() => setHoveredSection('SYSTEM')}
                            className="text-xs font-bold tracking-widest text-slate-500 hover:text-white transition-colors relative group"
                        >
                            {t('COMBAT_HISTORY')}
                            <div className="absolute -bottom-2 right-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300"></div>
                        </button>
                        <button 
                            onClick={() => setActiveOverlay('CHANGELOG')}
                            onMouseEnter={() => setHoveredSection('SYSTEM')}
                            className="text-xs font-bold tracking-widest text-slate-500 hover:text-white transition-colors relative group"
                        >
                            PATCH
                            <div className="absolute -bottom-2 right-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300"></div>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- CINEMATIC OVERLAYS --- */}
            {activeOverlay === 'SETTINGS' && renderSettings()}
            {activeOverlay === 'SAVES' && renderSaves()}
            {activeOverlay === 'HISTORY' && renderHistory()}
            {activeOverlay === 'CHANGELOG' && renderChangelog()}
            {activeOverlay === 'CONTROLS' && <KeyBindingUI onClose={() => setActiveOverlay('SETTINGS')} />}

        </div>
    );
};
