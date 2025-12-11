
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CombatRecord, SaveFile, GameSettings } from '../../types';
import { SaveSlotItem } from './SaveSlot';
import { HoloWindow, CloseButton, GlitchText } from './Shared';
import { CHANGELOG, CURRENT_VERSION } from '../../data/changelog';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { KeyBindingUI } from './KeyBindingUI';

// --- HI-FIDELITY VECTOR ICONS ---
// Complex, broken-line style for sci-fi aesthetic
const Icons = {
    // Survival: Hazard Skull / Radar Target
    Hazard: () => (
        <g>
            <path d="M12 2a10 10 0 0 0-7.07 17.07l2.12-2.12A7 7 0 0 1 12 5a7 7 0 0 1 4.95 11.95l2.12 2.12A10 10 0 0 0 12 2z" opacity="0.5" />
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            <path d="M12 22v-2M12 2v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="2" strokeLinecap="square" />
        </g>
    ),
    // Exploration: Detailed Ringed Planet
    Planet: () => (
        <g>
            <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
            <path d="M3 15c0-3 6-5 9-5s9 2 9 5" opacity="0.5" />
            <path d="M21 12c0 3-6 5-9 5s-9-2-9-5" strokeWidth="1.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" opacity="0.3" />
            <rect x="16" y="4" width="4" height="1" />
            <rect x="4" y="19" width="4" height="1" />
        </g>
    ),
    // Campaign: Star Chart / Node Network
    StarMap: () => (
        <g>
            <circle cx="5" cy="18" r="2" strokeWidth="1.5" />
            <circle cx="12" cy="6" r="2" strokeWidth="1.5" />
            <circle cx="19" cy="14" r="2" strokeWidth="1.5" />
            <path d="M6.5 16.5l4-8M13.5 7.5l4 5" strokeDasharray="2 1" strokeWidth="1" />
            <circle cx="12" cy="12" r="9" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
        </g>
    ),
    // Utility Icons
    Save: () => <path d="M4 6v14h16V6M4 6l8 8 8-8M12 14V2" />,
    Chart: () => <path d="M3 3v18h18M7 14v4M12 10v8M17 6v12" />,
    Info: () => <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15h-1v-5h1zm0-7h-1V9h1z" />,
    Settings: () => <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z M3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />,
    Gamepad: () => <path d="M2 12h4M18 12h4M12 2v4M12 18v4M7 7l10 10M7 17L17 7" strokeOpacity="0.5" />
};

// --- MODE VISUALIZERS ---

const RadarVisualizer: React.FC<{ active: boolean }> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if(!ctx) return;
        let frame = 0;
        let targets: {x:number, y:number, speed:number}[] = [];
        
        // Init random targets
        for(let i=0; i<8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 80;
            targets.push({x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, speed: 0.2 + Math.random()*0.3});
        }

        const render = () => {
            if (!active) return;
            frame++;
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;
            const cx = w/2; 
            const cy = h/2;

            ctx.clearRect(0, 0, w, h);
            
            // Sweep
            const angle = (frame * 0.05) % (Math.PI * 2);
            
            // Grid
            ctx.strokeStyle = '#0e7490'; // Cyan-700
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx-90, cy); ctx.lineTo(cx+90, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy-90); ctx.lineTo(cx, cy+90); ctx.stroke();

            // Blips (Incoming)
            ctx.fillStyle = '#ef4444'; // Red
            targets.forEach(t => {
                // Move closer
                const d = Math.sqrt(t.x*t.x + t.y*t.y);
                if (d > 5) {
                    t.x -= t.x/d * t.speed;
                    t.y -= t.y/d * t.speed;
                } else {
                    // Reset
                    const a = Math.random() * Math.PI * 2;
                    const dist = 90;
                    t.x = Math.cos(a)*dist; t.y = Math.sin(a)*dist;
                }
                
                // Draw blip opacity based on sweep angle proximity
                const tAngle = Math.atan2(t.y, t.x);
                let diff = Math.abs(angle - (tAngle < 0 ? tAngle + Math.PI*2 : tAngle));
                if (diff > Math.PI) diff = Math.PI*2 - diff;
                
                const alpha = Math.max(0, 1 - diff * 2);
                ctx.globalAlpha = alpha;
                ctx.fillRect(cx + t.x - 2, cy + t.y - 2, 4, 4);
            });
            ctx.globalAlpha = 1;

            // Sweep Line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * 95, cy + Math.sin(angle) * 95);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Sweep Gradient
            const grad = ctx.createConicGradient(angle + Math.PI/2, cx, cy); // Offset for conic start
            // Actually manual sector is easier
            ctx.fillStyle = `rgba(34, 211, 238, 0.1)`;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 95, angle - 0.5, angle);
            ctx.lineTo(cx, cy);
            ctx.fill();

            requestAnimationFrame(render);
        };
        if(active) render();
    }, [active]);

    return <canvas ref={canvasRef} width={200} height={200} className="w-64 h-64" />;
}

const PlanetVisualizer: React.FC<{ active: boolean }> = ({ active }) => {
    // Reusing the wireframe logic but made specific
    return (
        <div className={`relative w-64 h-64 flex items-center justify-center transition-all duration-1000 ${active ? 'opacity-100 scale-100' : 'opacity-20 scale-90 grayscale'}`}>
            <div className="absolute inset-0 border border-purple-500/30 rounded-full animate-[spin-slow_20s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-purple-500/20 rounded-full animate-[spin-slow_15s_linear_infinite_reverse]"></div>
            
            {/* Analysis Text */}
            <div className="absolute top-0 right-0 text-[10px] font-mono text-purple-400 flex flex-col items-end gap-1">
                <span className="bg-purple-900/50 px-1">ATMOS: 88%</span>
                <span className="bg-purple-900/50 px-1">BIO: LETHAL</span>
            </div>

            <svg viewBox="0 0 100 100" className="w-48 h-48 animate-[spin_30s_linear_infinite]">
                <defs>
                    <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#3b0764" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="40" stroke="url(#planetGrad)" strokeWidth="0.5" fill="none" />
                <path d="M10 50 Q 50 20 90 50" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
                <path d="M10 50 Q 50 80 90 50" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
                <path d="M50 10 Q 20 50 50 90" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
                <path d="M50 10 Q 80 50 50 90" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
            </svg>
        </div>
    );
}

const CampaignVisualizer: React.FC<{ active: boolean }> = ({ active }) => {
    return (
        <div className={`relative w-64 h-64 flex items-center justify-center transition-all duration-1000 ${active ? 'opacity-100 scale-100' : 'opacity-20 scale-90 grayscale'}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Nodes */}
                <circle cx="20" cy="80" r="3" fill="#eab308" className="animate-pulse" />
                <circle cx="40" cy="60" r="3" fill="#eab308" opacity="0.6" />
                <circle cx="50" cy="30" r="4" fill="#eab308" opacity="0.8" />
                <circle cx="80" cy="20" r="6" fill="#eab308" className="animate-pulse">
                    <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Paths */}
                <path d="M20 80 L40 60 L50 30 L80 20" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="4 2" className="animate-[dash_20s_linear_infinite]" />
                
                {/* Current Loc Indicator */}
                <g transform="translate(20, 80)">
                    <circle r="8" stroke="#eab308" strokeWidth="1" fill="none" className="animate-ping" />
                </g>
            </svg>
            <div className="absolute bottom-4 left-4 text-[10px] font-mono text-yellow-600 bg-yellow-900/20 px-2 border border-yellow-700">
                SECTOR 1 [SECURED]
            </div>
        </div>
    );
}

// --- SETTINGS SUB-COMPONENTS ---

const SettingToggle: React.FC<{ label: string, value: boolean, onClick: () => void }> = ({ label, value, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 border-l-2 transition-all duration-200 group
            ${value ? 'bg-cyan-900/20 border-cyan-500' : 'bg-slate-900/40 border-slate-700 hover:bg-slate-800'}
        `}
    >
        <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${value ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-400'}`}>{label}</span>
        <div className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-cyan-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
        </div>
    </button>
);

const SettingCycler: React.FC<{ label: string, value: string | number, options?: string[], onClick: () => void }> = ({ label, value, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 border-l-2 border-slate-700 bg-slate-900/40 hover:bg-slate-800 hover:border-cyan-500 transition-all group"
    >
        <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 tracking-widest uppercase">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-700 group-hover:text-cyan-500">◀</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 min-w-[60px] text-center">{value}</span>
            <span className="text-[10px] text-cyan-700 group-hover:text-cyan-500">▶</span>
        </div>
    </button>
);

const TacticalModeButton: React.FC<{
    label: string;
    subLabel: string;
    Icon: React.FC<any>;
    accentColor: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, subLabel, Icon, accentColor, isActive, onClick }) => {
    const baseColor = accentColor.split('-')[0];

    return (
        <button 
            onClick={onClick}
            className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300 cursor-pointer
                ${isActive ? `bg-${baseColor}-900/10` : 'hover:bg-white/5'}
            `}
        >
            <div className={`transition-all duration-500 transform ${isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-30 group-hover:opacity-50'}`}>
                <div className={`w-32 h-32 ${isActive ? `text-${baseColor}-500` : 'text-slate-600'} transition-colors`}>
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor">
                        <Icon />
                    </svg>
                </div>
            </div>
            
            <div className="absolute bottom-8 text-center z-10 w-full px-4">
                <div className={`text-[10px] font-bold tracking-[0.3em] mb-2 transition-colors uppercase ${isActive ? `text-${baseColor}-400` : 'text-slate-600'}`}>{subLabel}</div>
                <div className={`text-2xl font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white drop-shadow-lg' : 'text-slate-500'}`}>{label}</div>
            </div>

            {isActive && (
                <div className={`absolute inset-0 border-2 border-${baseColor}-500/50 pointer-events-none`}></div>
            )}
            
            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
        </button>
    );
};

const FuncKey: React.FC<{
    label: string;
    Icon: React.FC<any>;
    onClick: () => void;
    highlight?: boolean;
}> = ({ label, Icon, onClick, highlight }) => (
    <button 
        onClick={onClick}
        className={`
            w-full h-full flex flex-col items-center justify-center gap-1 transition-all duration-200 group relative overflow-hidden
            ${highlight ? 'bg-slate-800 border border-cyan-500/50' : 'bg-slate-900 border border-slate-800 hover:border-slate-600'}
        `}
    >
        <div className={`w-5 h-5 ${highlight ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
                <Icon />
            </svg>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${highlight ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>
            {label}
        </span>
        {highlight && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>}
    </button>
);

// --- MAIN MENU LAYOUT ---

export const MainMenu: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // State
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);
    const [activeOverlay, setActiveOverlay] = useState<'SAVES' | 'HISTORY' | 'SETTINGS' | 'CHANGELOG' | 'CONTROLS' | null>(null);
    const [history, setHistory] = useState<CombatRecord[]>([]);

    useEffect(() => {
        setHistory(engine.saveManager.getHistory());
    }, [engine, activeOverlay]);

    // Helpers
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

    // --- RENDERERS ---

    const renderSettingsPanel = () => (
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-2">
            {/* Column 1: General */}
            <div className="space-y-3">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">GENERAL</div>
                <SettingCycler 
                    label={t('SETTING_LANGUAGE')} 
                    value={state.settings.language === 'EN' ? 'ENGLISH' : '中文'} 
                    onClick={() => engine.toggleSetting('language')} 
                />
                <button onClick={() => setActiveOverlay('CONTROLS')} className="w-full p-3 bg-slate-800 border border-slate-600 hover:border-cyan-500 text-xs font-bold text-white uppercase tracking-widest transition-all">
                    {t('CONTROLS_BTN')}
                </button>
            </div>

            {/* Column 2: Graphics */}
            <div className="space-y-3">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">GRAPHICS</div>
                
                <SettingCycler 
                    label={t('SETTING_PERFORMANCE')} 
                    value={t(`SETTING_${state.settings.performanceMode || 'BALANCED'}`)} 
                    onClick={() => engine.toggleSetting('performanceMode')} 
                />
                <SettingCycler 
                    label={t('SETTING_RESOLUTION')} 
                    value={`${Math.round((state.settings.resolutionScale || 1.0) * 100)}%`} 
                    onClick={() => engine.toggleSetting('resolutionScale')} 
                />
                <div className="grid grid-cols-2 gap-2">
                    <SettingToggle label={t('SETTING_SHADOWS')} value={state.settings.showShadows} onClick={() => engine.toggleSetting('showShadows')} />
                    <SettingToggle label={t('SETTING_ANIM_BG')} value={state.settings.animatedBackground} onClick={() => engine.toggleSetting('animatedBackground')} />
                    <SettingToggle label={t('SETTING_LIGHTING')} value={state.settings.lightingQuality === 'HIGH'} onClick={() => engine.toggleSetting('lightingQuality')} />
                    <SettingToggle label={t('SETTING_PARTICLES')} value={state.settings.particleIntensity === 'HIGH'} onClick={() => engine.toggleSetting('particleIntensity')} />
                </div>
            </div>

            {/* Footer: Interface */}
            <div className="col-span-2 space-y-3">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">INTERFACE</div>
                <div className="grid grid-cols-3 gap-3">
                    <SettingToggle label={t('DMG_TEXT')} value={state.settings.showDamageNumbers} onClick={() => engine.toggleSetting('showDamageNumbers')} />
                    <SettingToggle label={t('HUD_OVERLAY')} value={state.settings.showHUD} onClick={() => engine.toggleSetting('showHUD')} />
                    <SettingToggle label={t('GORE')} value={state.settings.showBlood} onClick={() => engine.toggleSetting('showBlood')} />
                </div>
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
                            
                            <div className="text-slate-600 font-mono text-xs tracking-widest mt-24 animate-pulse border-t border-slate-800 pt-4">
                                SELECT OPERATION MODE
                            </div>
                        </div>
                    )}

                    {hoveredMode === 'SURVIVAL' && (
                        <div className="animate-fadeIn flex flex-col items-center">
                            <RadarVisualizer active={true} />
                            <h2 className="text-5xl font-black text-white mt-8 tracking-widest">{t('SURVIVAL_MODE')}</h2>
                            <div className="w-16 h-1 bg-cyan-500 my-4"></div>
                            <p className="text-cyan-400 font-mono tracking-widest text-sm">{t('SURVIVAL_DESC')}</p>
                        </div>
                    )}

                    {hoveredMode === 'EXPLORE' && (
                        <div className="animate-fadeIn flex flex-col items-center">
                            <PlanetVisualizer active={true} />
                            <h2 className="text-5xl font-black text-white mt-8 tracking-widest">{t('EXPLORE_MODE')}</h2>
                            <div className="w-16 h-1 bg-purple-500 my-4"></div>
                            <p className="text-purple-400 font-mono tracking-widest text-sm">{t('EXPLORE_DESC')}</p>
                        </div>
                    )}

                    {hoveredMode === 'CAMPAIGN' && (
                        <div className="animate-fadeIn flex flex-col items-center">
                            <CampaignVisualizer active={true} />
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
                            Icon={Icons.Hazard}
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
                            Icon={Icons.StarMap}
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
                <HoloWindow title={t('SETTINGS_TITLE')} subtitle="CONFIGURATION" onClose={() => setActiveOverlay(null)} color="blue" width="w-[700px]">
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
