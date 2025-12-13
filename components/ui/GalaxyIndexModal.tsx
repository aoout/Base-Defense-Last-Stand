
import React, { useState, useEffect } from 'react';
import { ModuleWindow } from './ModuleWindow';
import { Variant } from '../../theme/designSystem';
import { GalaxyConfig } from '../../types';
import { useLocale } from '../contexts/LocaleContext';
import { FAMOUS_SECTORS } from '../../data/sectors';
import { BIOME_STYLES } from '../../data/world'; // Still needed for list rendering if any
import { PRESETS, getColorHex } from '../../data/config/galaxyPresets';
import { SectorRadar } from './visuals/SectorRadar';

interface GalaxyIndexModalProps {
    onClose: () => void;
    onScan: (config: GalaxyConfig) => void;
}

interface TacticalSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    disabled?: boolean;
    onChange: (val: number) => void;
    color: string;
}

type DifficultyPreset = 'LOW' | 'MED' | 'HIGH' | 'CUSTOM';
type TabType = 'PROTOCOLS' | 'ARCHIVES';

// --- VISUALIZATION COMPONENTS ---

const ScanlineOverlay = () => (
    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] z-0"></div>
);

// --- UI COMPONENTS ---

const TacticalSlider: React.FC<TacticalSliderProps> = ({ label, value, min, max, step, unit = "", disabled, onChange, color }) => {
    let textClass = "text-cyan-400";
    let bgClass = "bg-cyan-500";
    if (color === 'emerald') { textClass = "text-emerald-400"; bgClass = "bg-emerald-500"; }
    if (color === 'red') { textClass = "text-red-400"; bgClass = "bg-red-500"; }
    if (color === 'yellow') { textClass = "text-yellow-400"; bgClass = "bg-yellow-500"; }
    if (color === 'purple') { textClass = "text-purple-400"; bgClass = "bg-purple-500"; }

    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    return (
        <div className={`mb-2 group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase group-hover:text-slate-300 transition-colors">{label}</label>
                <div className={`font-mono text-xs font-bold ${textClass} bg-slate-900 px-2 py-0.5 border border-slate-700 rounded`}>
                    {value.toFixed(Number.isInteger(step) ? 0 : 1)}{unit}
                </div>
            </div>
            <div className="relative h-2 bg-slate-900 rounded-sm overflow-hidden border border-slate-700">
                <div 
                    className={`absolute top-0 left-0 h-full ${bgClass} transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-white opacity-50 shadow-[0_0_5px_white]"></div>
                </div>
                {/* Ticks */}
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                    {Array.from({length: 5}).map((_, i) => <div key={i} className="w-px h-full bg-slate-800"></div>)}
                </div>
                <input 
                    type="range" min={min} max={max} step={step} value={value} disabled={disabled}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
};

export const GalaxyIndexModal: React.FC<GalaxyIndexModalProps> = ({ onClose, onScan }) => {
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<TabType>('PROTOCOLS');
    const [mode, setMode] = useState<DifficultyPreset>('MED');
    const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
    
    // Values
    const [minGene, setMinGene] = useState(PRESETS.MED.min);
    const [maxGene, setMaxGene] = useState(PRESETS.MED.max);
    const [maxSulfur, setMaxSulfur] = useState(PRESETS.MED.sulfur);
    const [maxOxygen, setMaxOxygen] = useState(PRESETS.MED.oxygen);
    const [planetCount, setPlanetCount] = useState(PRESETS.MED.count);
    const [minWaves, setMinWaves] = useState(PRESETS.MED.minWaves);
    const [maxWaves, setMaxWaves] = useState(PRESETS.MED.maxWaves);
    const [offenseEnabled, setOffenseEnabled] = useState(PRESETS.MED.offense);

    useEffect(() => {
        if (activeTab === 'PROTOCOLS' && mode !== 'CUSTOM') {
            const p = PRESETS[mode];
            setMinGene(p.min);
            setMaxGene(p.max);
            setMaxSulfur(p.sulfur);
            setMaxOxygen(p.oxygen);
            setPlanetCount(p.count);
            setMinWaves(p.minWaves);
            setMaxWaves(p.maxWaves);
            setOffenseEnabled(p.offense);
        } else if (activeTab === 'ARCHIVES' && selectedSectorId) {
            // Recalculate display stats based on the selected sector
            const sector = FAMOUS_SECTORS.find(s => s.id === selectedSectorId);
            if (sector) {
                let totalGene = 0, maxS = 0;
                sector.planets.forEach(p => {
                    totalGene += (p.geneStrength || 1);
                    maxS = Math.max(maxS, p.sulfurIndex || 0);
                });
                const avg = totalGene / sector.planets.length;
                
                // Update UI state for visuals
                setMinGene(avg);
                setMaxGene(avg);
                setMaxSulfur(maxS);
                setPlanetCount(sector.planets.length);
            }
        }
    }, [mode, activeTab, selectedSectorId]);

    const handleScan = () => {
        if (activeTab === 'ARCHIVES' && selectedSectorId) {
            onScan({
                minGeneStrength: 0, maxGeneStrength: 0, 
                presetId: selectedSectorId
            });
        } else {
            onScan({
                minGeneStrength: minGene,
                maxGeneStrength: maxGene,
                maxSulfur: maxSulfur,
                maxOxygen: maxOxygen / 100,
                planetCount: planetCount,
                minWaves: minWaves,
                maxWaves: maxWaves,
                enableOffense: offenseEnabled
            });
        }
        onClose();
    };

    const avgGene = (minGene + maxGene) / 2;
    const isLocked = mode !== 'CUSTOM';
    
    // Theme color based on mode
    let themeColor: Variant = 'cyan';
    if (activeTab === 'ARCHIVES') {
        const sector = FAMOUS_SECTORS.find(s => s.id === selectedSectorId);
        if (sector) themeColor = sector.difficultyColor as Variant;
    } else {
        if (mode === 'LOW') themeColor = 'emerald';
        if (mode === 'HIGH') themeColor = 'red';
        if (mode === 'CUSTOM') themeColor = 'yellow';
    }

    const selectedSector = FAMOUS_SECTORS.find(s => s.id === selectedSectorId);

    return (
        <ModuleWindow
            title={t('GALAXY_INDEX_TITLE')}
            subtitle={t('GALAXY_INDEX_SUB')}
            theme={themeColor}
            onClose={onClose}
            maxWidth="max-w-[1400px]"
        >
            <div className="flex w-full h-full gap-0 relative overflow-hidden">
                <ScanlineOverlay />

                {/* LEFT: Selection List */}
                <div className="w-[300px] flex flex-col border-r border-slate-800 bg-slate-950/50 z-10 overflow-hidden min-h-0">
                    <div className="flex border-b border-slate-800 shrink-0">
                        <button 
                            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.2em] transition-all relative overflow-hidden group
                                ${activeTab === 'PROTOCOLS' ? 'text-cyan-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                            onClick={() => setActiveTab('PROTOCOLS')}
                        >
                            {activeTab === 'PROTOCOLS' && <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_cyan]"></div>}
                            {t('TAB_PROTOCOLS')}
                        </button>
                        <button 
                            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.2em] transition-all relative overflow-hidden group
                                ${activeTab === 'ARCHIVES' ? 'text-purple-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                            onClick={() => { setActiveTab('ARCHIVES'); if(!selectedSectorId) setSelectedSectorId(FAMOUS_SECTORS[0].id); }}
                        >
                            {activeTab === 'ARCHIVES' && <div className="absolute top-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_purple]"></div>}
                            {t('TAB_ARCHIVES')}
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
                        {activeTab === 'PROTOCOLS' ? (
                            (['LOW', 'MED', 'HIGH', 'CUSTOM'] as const).map(preset => {
                                const config = PRESETS[preset];
                                const isActive = mode === preset;
                                
                                let colorClass = "text-slate-400 border-slate-800 hover:border-slate-600";
                                if (isActive) {
                                    if (preset === 'LOW') colorClass = "text-emerald-400 border-emerald-500 bg-emerald-900/10";
                                    if (preset === 'MED') colorClass = "text-cyan-400 border-cyan-500 bg-cyan-900/10";
                                    if (preset === 'HIGH') colorClass = "text-red-400 border-red-500 bg-red-900/10";
                                    if (preset === 'CUSTOM') colorClass = "text-yellow-400 border-yellow-500 bg-yellow-900/10";
                                }

                                return (
                                    <button 
                                        key={preset} 
                                        onClick={() => setMode(preset)} 
                                        className={`w-full p-3 border transition-all text-left group relative overflow-hidden ${colorClass}`}
                                    >
                                        <div className="relative z-10 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold font-display tracking-widest text-sm">{t(config.label)}</div>
                                                <div className="text-[10px] font-mono opacity-70 mt-1">{preset === 'CUSTOM' ? t('MANUAL_OVERRIDE') : config.desc}</div>
                                            </div>
                                            {isActive && <div className="text-xl animate-pulse">⯈</div>}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            FAMOUS_SECTORS.map(sector => {
                                const isActive = selectedSectorId === sector.id;
                                const color = sector.difficultyColor;
                                
                                let colorClass = "text-slate-400 border-slate-800 hover:border-slate-600";
                                if (isActive) {
                                    if(color === 'red') colorClass = "text-red-400 border-red-500 bg-red-900/10";
                                    if(color === 'purple') colorClass = "text-purple-400 border-purple-500 bg-purple-900/10";
                                    if(color === 'cyan') colorClass = "text-cyan-400 border-cyan-500 bg-cyan-900/10";
                                    if(color === 'emerald') colorClass = "text-emerald-400 border-emerald-500 bg-emerald-900/10";
                                    if(color === 'yellow') colorClass = "text-yellow-400 border-yellow-500 bg-yellow-900/10";
                                }

                                return (
                                    <button 
                                        key={sector.id} 
                                        onClick={() => setSelectedSectorId(sector.id)} 
                                        className={`w-full p-3 border transition-all text-left group relative overflow-hidden ${colorClass}`}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-bold font-display tracking-widest text-sm">{t(sector.nameKey)}</div>
                                                {isActive && <div className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_5px_currentColor]"></div>}
                                            </div>
                                            <div className="text-[9px] font-mono opacity-50 flex items-center gap-2">
                                                <span>ID: {sector.id}</span>
                                                <span className="opacity-50">|</span>
                                                <span>{sector.planets.length} BODIES</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CENTER: Radar & Viz */}
                <div className="flex-1 flex flex-col relative z-10 overflow-hidden bg-black/40 min-w-0 min-h-0">
                    <div className="absolute top-6 left-6 text-[10px] font-mono text-slate-500 z-20 flex gap-4">
                        <div>
                            <span className="text-slate-600 mr-2">SYS.MODE</span>
                            <span className={`font-bold ${themeColor === 'red' ? 'text-red-500' : 'text-cyan-500'}`}>{activeTab}</span>
                        </div>
                        <div>
                            <span className="text-slate-600 mr-2">COORD</span>
                            <span className="text-white">{Math.floor(Math.random()*999)}.{Math.floor(Math.random()*99)} - {Math.floor(Math.random()*999)}.{Math.floor(Math.random()*99)}</span>
                        </div>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center min-h-0 p-4">
                        {/* THE VISUALIZER - Constrained Size */}
                        <div className="w-full max-w-[400px] max-h-[400px] aspect-square relative mb-8">
                            {/* Refactored Component */}
                            <SectorRadar 
                                mode={activeTab} 
                                color={themeColor} 
                                sectorId={selectedSectorId || undefined} 
                            />
                            
                            {/* Danger Overlay Text */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                                <div className="text-[10px] text-slate-500 font-bold mb-1 tracking-[0.2em] uppercase bg-black/80 px-2">{t('ESTIMATED_DANGER')}</div>
                                <div className={`text-4xl font-display font-black tracking-wide drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]`} style={{
                                    color: getColorHex(themeColor)
                                }}>
                                    {avgGene > 3 ? 'EXTREME' : avgGene > 2 ? 'MODERATE' : 'MINIMAL'}
                                </div>
                                <div className="text-sm font-mono font-bold text-white mt-1 bg-black/50 inline-block px-2">GENE x{avgGene.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="h-20 border-t border-slate-800 bg-slate-950 flex items-center px-8 justify-between relative z-50 shrink-0">
                        <div className="text-[10px] text-slate-600 font-mono max-w-xs hidden md:block">
                            WARNING: FTL JUMP REQUIRES SIGNIFICANT ENERGY. ENSURE PREPARATIONS ARE COMPLETE.
                        </div>
                        <button 
                            onClick={handleScan}
                            className={`
                                h-12 px-12 font-black text-xl tracking-[0.2em] uppercase border-2 transition-all shadow-lg active:scale-[0.99] group overflow-hidden relative flex items-center
                                ${activeTab === 'ARCHIVES' 
                                    ? 'bg-purple-900/20 hover:bg-purple-900 border-purple-500 text-purple-100 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                                    : mode === 'HIGH' ? 'bg-red-900/20 hover:bg-red-900 border-red-500 text-red-100 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 
                                      mode === 'LOW' ? 'bg-emerald-900/20 hover:bg-emerald-900 border-emerald-500 text-emerald-100 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]' :
                                      mode === 'CUSTOM' ? 'bg-yellow-900/20 hover:bg-yellow-900 border-yellow-500 text-yellow-100 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]' :
                                      'bg-cyan-900/20 hover:bg-cyan-900 border-cyan-500 text-cyan-100 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]'}
                            `}
                        >
                            <span className="relative z-10">{t('INITIATE_SCAN')}</span>
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-2 h-2 bg-current"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 bg-current"></div>
                        </button>
                    </div>
                </div>

                {/* RIGHT: Instrument Panel */}
                <div className="w-[350px] flex flex-col border-l border-slate-800 bg-slate-950/80 z-10 relative overflow-hidden min-h-0">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center h-12 px-4 border-b border-slate-800 bg-slate-900 shrink-0">
                        <h3 className="text-xs font-bold text-slate-300 tracking-[0.2em] uppercase">{t('INDEX_DEF')}</h3>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isLocked || activeTab === 'ARCHIVES' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                            <span className={`text-[9px] font-bold ${isLocked || activeTab === 'ARCHIVES' ? 'text-slate-500' : 'text-yellow-500'}`}>
                                {isLocked || activeTab === 'ARCHIVES' ? 'LOCKED' : 'MANUAL'}
                            </span>
                        </div>
                    </div>

                    {/* Content - DYNAMIC SCROLLING HANDLING */}
                    <div className={`flex-1 flex flex-col relative min-h-0 ${activeTab === 'PROTOCOLS' ? 'overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-800' : 'overflow-hidden'}`}>
                        
                        {activeTab === 'PROTOCOLS' ? (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Random Generation Sliders */}
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-1 flex justify-between">
                                        <span>{t('MISSION_PARAMS')}</span>
                                        <span className="text-slate-700">/// 01</span>
                                    </div>
                                    <TacticalSlider label={t('MIN_WAVES')} value={minWaves} min={1} max={50} step={1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMinWaves(Math.min(v, maxWaves))} />
                                    <TacticalSlider label={t('MAX_WAVES')} value={maxWaves} min={1} max={60} step={1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMaxWaves(Math.max(v, minWaves))} />
                                    
                                    <div className={`mt-2 flex justify-between items-center p-2 border rounded transition-colors ${offenseEnabled ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-900 border-slate-700'} ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}`} onClick={() => !isLocked && setOffenseEnabled(!offenseEnabled)}>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold tracking-wider ${offenseEnabled ? 'text-red-400' : 'text-slate-500'}`}>{t('ENABLE_OFFENSE')}</span>
                                            <span className="text-[9px] text-slate-600 font-mono">BOSS ENCOUNTER PROBABILITY</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full border relative transition-all ${offenseEnabled ? 'bg-red-900 border-red-500' : 'bg-slate-800 border-slate-600'}`}>
                                            <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${offenseEnabled ? 'left-[22px]' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-1 flex justify-between">
                                        <span>GENETIC SEQUENCER</span>
                                        <span className="text-slate-700">/// 02</span>
                                    </div>
                                    <TacticalSlider label="Gene Min" value={minGene} min={0.5} max={8.0} step={0.1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMinGene(Math.min(v, maxGene))} />
                                    <TacticalSlider label="Gene Max" value={maxGene} min={0.5} max={8.0} step={0.1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMaxGene(Math.max(v, minGene))} />
                                </div>
                                
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-1 flex justify-between">
                                        <span>TOPOGRAPHY</span>
                                        <span className="text-slate-700">/// 03</span>
                                    </div>
                                    <TacticalSlider label={t('PLANET_COUNT')} value={planetCount} min={5} max={20} step={1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setPlanetCount(v)} />
                                </div>

                                {isLocked && (
                                    <div className="mt-4 p-2 border border-slate-800 bg-slate-900/50 text-center">
                                        <div className="text-red-500 text-[10px] font-mono tracking-widest animate-pulse">PARAMETER LOCK ENGAGED</div>
                                        <div className="text-slate-600 text-[9px] mt-1">SWITCH TO MANUAL MODE TO OVERRIDE</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ARCHIVE DETAILS VIEW
                            selectedSector ? (
                                <div className="flex flex-col h-full animate-fadeIn min-h-0">
                                    {/* LORE SECTION (Top 40%) - Independently Scrollable */}
                                    <div className="p-4 pb-0 shrink-0 max-h-[40%] flex flex-col min-h-0">
                                        <div className="bg-purple-900/10 border border-purple-500/30 p-4 relative overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900 max-h-full">
                                            <div className="sticky top-0 right-0 float-right -mt-2 -mr-2 p-1 z-10">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                                            </div>
                                            <div className="text-[10px] text-purple-400 font-bold uppercase mb-2 tracking-widest sticky top-0 backdrop-blur-sm z-0">{t('SECTOR_LORE')}</div>
                                            <p className="text-xs text-slate-300 font-mono leading-relaxed text-justify">{t(selectedSector.descKey)}</p>
                                        </div>
                                    </div>
                                    
                                    {/* DIVIDER */}
                                    <div className="px-4 pt-4 pb-2 shrink-0">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800 pb-1 flex justify-between">
                                            <span>STELLAR BODIES</span>
                                            <span className="text-slate-700">/// {selectedSector.planets.length} DETECTED</span>
                                        </div>
                                    </div>

                                    {/* PLANET LIST - Fixed Height */}
                                    <div className="h-[350px] overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-black/20 bg-black/20 border-t border-slate-800">
                                        <div className="space-y-1">
                                            {selectedSector.planets.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs py-1.5 px-3 bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: BIOME_STYLES[p.biome || 'BARREN' as any].planetColor}}></div>
                                                        <span className="text-slate-300 font-bold">{p.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {p.sulfurIndex && p.sulfurIndex > 5 && <span className="text-[9px] text-yellow-500 font-bold">⚠ S</span>}
                                                        <span className={`font-mono font-bold ${p.geneStrength && p.geneStrength > 2 ? 'text-red-400' : 'text-cyan-400'}`}>x{(p.geneStrength || 1).toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-4 opacity-50 p-6">
                                    <div className="text-4xl">⚠</div>
                                    <div className="text-xs font-mono tracking-widest">{t('ARCHIVE_LOCKED')}</div>
                                </div>
                            )
                        )}
                    </div>
                </div>

            </div>
        </ModuleWindow>
    );
};
