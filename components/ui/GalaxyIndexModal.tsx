
import React, { useState, useEffect } from 'react';
import { ModuleWindow, ThemeColor } from './ModuleWindow';
import { GalaxyConfig } from '../../types';
import { useLocale } from '../contexts/LocaleContext';
import { FAMOUS_SECTORS } from '../../data/sectors';

interface GalaxyIndexModalProps {
    onClose: () => void;
    onScan: (config: GalaxyConfig) => void;
}

type DifficultyPreset = 'LOW' | 'MED' | 'HIGH' | 'CUSTOM';
type TabType = 'PROTOCOLS' | 'ARCHIVES';

const PRESETS = {
    LOW: { min: 0.6, max: 2.4, sulfur: 5, oxygen: 80, count: 10, minWaves: 5, maxWaves: 15, offense: true, label: 'DIFF_LOW', color: 'emerald', desc: 'LOW THREAT' },
    MED: { min: 1.0, max: 3.0, sulfur: 10, oxygen: 100, count: 12, minWaves: 8, maxWaves: 25, offense: true, label: 'DIFF_MED', color: 'cyan', desc: 'STANDARD' },
    HIGH: { min: 1.0, max: 4.2, sulfur: 10, oxygen: 100, count: 14, minWaves: 15, maxWaves: 40, offense: true, label: 'DIFF_HIGH', color: 'red', desc: 'HIGH THREAT' },
    CUSTOM: { min: 1.0, max: 3.0, sulfur: 10, oxygen: 100, count: 12, minWaves: 8, maxWaves: 30, offense: true, label: 'DIFF_CUSTOM', color: 'yellow', desc: 'MANUAL' }
};

const RadarVisual: React.FC<{ color: string }> = ({ color }) => {
    let hex = '#06b6d4'; // cyan
    if (color === 'emerald') hex = '#10b981';
    if (color === 'red') hex = '#ef4444';
    if (color === 'yellow') hex = '#eab308';
    if (color === 'purple') hex = '#a855f7';

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-slate-700 opacity-50"></div>
            <div className="absolute inset-4 rounded-full border border-slate-700 border-dashed opacity-30"></div>
            <div className="absolute inset-0 rounded-full animate-spin-slow" style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${hex}33 360deg)` }}></div>
            <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_5px_white]"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_5px_white]" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-2/3 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_5px_white]" style={{animationDelay: '1s'}}></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-slate-800"></div>
                <div className="h-full w-px bg-slate-800 absolute"></div>
                <div className="w-20 h-20 border border-slate-600 rounded-full"></div>
            </div>
            <div className="absolute bottom-[-40px] text-xs font-mono font-bold tracking-widest" style={{color: hex}}>
                SCANNING...
            </div>
        </div>
    );
};

interface TacticalSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    disabled: boolean;
    onChange: (val: number) => void;
    color: string; 
}

const TacticalSlider: React.FC<TacticalSliderProps> = ({ label, value, min, max, step, unit = "", disabled, onChange, color }) => {
    let textClass = "text-cyan-400";
    let borderClass = "border-cyan-500/30";
    if (color === 'emerald') { textClass = "text-emerald-400"; borderClass = "border-emerald-500/30"; }
    if (color === 'red') { textClass = "text-red-400"; borderClass = "border-red-500/30"; }
    if (color === 'yellow') { textClass = "text-yellow-400"; borderClass = "border-yellow-500/30"; }
    if (color === 'purple') { textClass = "text-purple-400"; borderClass = "border-purple-500/30"; }

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`flex flex-col gap-1 mb-3 relative ${disabled ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex justify-between items-end mb-1">
                <label className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">{label}</label>
                <div className={`bg-black border ${borderClass} px-2 py-0.5 rounded min-w-[50px] text-right`}>
                    <span className={`font-mono text-xs font-bold ${textClass} tabular-nums`}>
                        {value.toFixed(Number.isInteger(step) ? 0 : 1)}{unit}
                    </span>
                </div>
            </div>
            <div className="relative h-6 flex items-center">
                <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full opacity-30 ${textClass.replace('text-', 'bg-')}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="absolute inset-x-0 top-3 flex justify-between px-1">
                    {Array.from({length: 11}).map((_, i) => (<div key={i} className="w-px h-1 bg-slate-700"></div>))}
                </div>
                <input 
                    type="range" min={min} max={max} step={step} value={value} disabled={disabled}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`w-full h-full appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-slate-200 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:mt-[-6px] ${disabled ? 'cursor-not-allowed' : ''}`}
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
                // Calculate averages for visual feedback
                let totalGene = 0, maxS = 0;
                sector.planets.forEach(p => {
                    totalGene += (p.geneStrength || 1);
                    maxS = Math.max(maxS, p.sulfurIndex || 0);
                });
                const avg = totalGene / sector.planets.length;
                
                // Update UI state for visuals (not actual scan config, scan config uses presetId)
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
                minGeneStrength: 0, maxGeneStrength: 0, // Ignored by generator when presetId is present
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
    let themeColor: ThemeColor = 'cyan';
    if (activeTab === 'ARCHIVES') {
        const sector = FAMOUS_SECTORS.find(s => s.id === selectedSectorId);
        if (sector) themeColor = sector.difficultyColor as ThemeColor;
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
            maxWidth="max-w-6xl"
        >
            <div className="flex w-full h-full gap-8 p-4">
                
                {/* LEFT: Selection List */}
                <div className="w-1/4 flex flex-col border-r border-slate-700/50 pr-4">
                    <div className="flex mb-4 border-b border-slate-700">
                        <button 
                            className={`flex-1 pb-2 text-[10px] font-bold tracking-widest transition-colors ${activeTab === 'PROTOCOLS' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                            onClick={() => setActiveTab('PROTOCOLS')}
                        >
                            {t('TAB_PROTOCOLS')}
                        </button>
                        <button 
                            className={`flex-1 pb-2 text-[10px] font-bold tracking-widest transition-colors ${activeTab === 'ARCHIVES' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                            onClick={() => { setActiveTab('ARCHIVES'); if(!selectedSectorId) setSelectedSectorId(FAMOUS_SECTORS[0].id); }}
                        >
                            {t('TAB_ARCHIVES')}
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {activeTab === 'PROTOCOLS' ? (
                            (['LOW', 'MED', 'HIGH', 'CUSTOM'] as const).map(preset => {
                                const config = PRESETS[preset];
                                const isActive = mode === preset;
                                let activeClass = "border-slate-700 bg-slate-900/50 text-slate-500 hover:text-slate-300";
                                if (isActive) {
                                    if (preset === 'LOW') activeClass = "border-green-500 bg-green-900/20 text-green-400 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]";
                                    if (preset === 'MED') activeClass = "border-cyan-500 bg-cyan-900/20 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]";
                                    if (preset === 'HIGH') activeClass = "border-red-500 bg-red-900/20 text-red-400 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]";
                                    if (preset === 'CUSTOM') activeClass = "border-yellow-500 bg-yellow-900/20 text-yellow-400 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]";
                                }
                                return (
                                    <button key={preset} onClick={() => setMode(preset)} className={`flex items-center justify-between p-4 border-l-4 transition-all text-left group ${activeClass}`}>
                                        <div>
                                            <div className="font-bold font-display tracking-widest text-sm">{t(config.label)}</div>
                                            <div className="text-[10px] font-mono opacity-70 mt-1">{preset === 'CUSTOM' ? t('MANUAL_OVERRIDE') : config.desc}</div>
                                        </div>
                                        {isActive && <div className="text-xl animate-pulse">►</div>}
                                    </button>
                                );
                            })
                        ) : (
                            FAMOUS_SECTORS.map(sector => {
                                const isActive = selectedSectorId === sector.id;
                                const color = sector.difficultyColor;
                                let border = 'border-slate-700';
                                let text = 'text-slate-500';
                                let bg = 'bg-slate-900/50';
                                
                                if (isActive) {
                                    if(color === 'red') { border='border-red-500'; text='text-red-400'; bg='bg-red-900/20'; }
                                    if(color === 'purple') { border='border-purple-500'; text='text-purple-400'; bg='bg-purple-900/20'; }
                                    if(color === 'cyan') { border='border-cyan-500'; text='text-cyan-400'; bg='bg-cyan-900/20'; }
                                    if(color === 'emerald') { border='border-emerald-500'; text='text-emerald-400'; bg='bg-emerald-900/20'; }
                                    if(color === 'yellow') { border='border-yellow-500'; text='text-yellow-400'; bg='bg-yellow-900/20'; }
                                }

                                return (
                                    <button key={sector.id} onClick={() => setSelectedSectorId(sector.id)} className={`flex flex-col p-4 border-l-4 transition-all text-left group ${border} ${bg}`}>
                                        <div className={`font-bold font-display tracking-widest text-sm ${text}`}>{t(sector.nameKey)}</div>
                                        <div className="text-[10px] font-mono opacity-50 mt-1 text-slate-400">ID: {sector.id}</div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CENTER: Radar & Viz */}
                <div className="flex-1 flex flex-col items-center justify-center relative bg-black/20 rounded-xl border border-slate-800">
                    <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-500">{t('THREAT_ANALYSIS')}</div>
                    
                    <RadarVisual color={themeColor} />

                    <div className="mt-8 grid grid-cols-2 gap-8 w-full px-12">
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">{t('ESTIMATED_DANGER')}</div>
                            <div className={`text-3xl font-display font-black tracking-wide`} style={{
                                color: themeColor === 'red' ? '#ef4444' : themeColor === 'purple' ? '#a855f7' : themeColor === 'emerald' ? '#10b981' : themeColor === 'yellow' ? '#eab308' : '#06b6d4'
                            }}>
                                {avgGene > 3 ? 'EXTREME' : avgGene > 2 ? 'MODERATE' : 'MINIMAL'}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">{t('AVG_GENE_STR')}</div>
                            <div className="text-3xl font-mono font-bold text-white">x{avgGene.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Instrument Panel */}
                <div className="w-1/3 flex flex-col pl-4 border-l border-slate-700/50 relative">
                    
                    {/* Panel Header */}
                    <div className="flex justify-between items-center mb-6 bg-slate-900 p-2 border-b border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">{t('INDEX_DEF')}</h3>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isLocked || activeTab === 'ARCHIVES' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                            <span className={`text-[9px] font-bold ${isLocked || activeTab === 'ARCHIVES' ? 'text-slate-500' : 'text-yellow-500'}`}>
                                {isLocked || activeTab === 'ARCHIVES' ? 'LOCKED' : 'MANUAL'}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-3 relative overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        
                        {activeTab === 'PROTOCOLS' ? (
                            <>
                                {/* Random Generation Sliders */}
                                <div className="bg-slate-900/40 p-4 border border-slate-700 rounded mb-2">
                                    <div className="text-[9px] text-slate-600 font-bold uppercase mb-3 border-b border-slate-700/50 pb-1">{t('MISSION_PARAMS')}</div>
                                    <TacticalSlider label={t('MIN_WAVES')} value={minWaves} min={1} max={50} step={1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMinWaves(Math.min(v, maxWaves))} />
                                    <TacticalSlider label={t('MAX_WAVES')} value={maxWaves} min={1} max={60} step={1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMaxWaves(Math.max(v, minWaves))} />
                                    <div className={`mt-3 flex justify-between items-center p-2 border rounded transition-colors ${offenseEnabled ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-900 border-slate-700'} ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}`} onClick={() => !isLocked && setOffenseEnabled(!offenseEnabled)}>
                                        <span className={`text-[9px] font-bold tracking-wider ${offenseEnabled ? 'text-red-400' : 'text-slate-500'}`}>{t('ENABLE_OFFENSE')}</span>
                                        <div className={`px-2 py-0.5 text-[9px] font-bold rounded ${offenseEnabled ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{t(offenseEnabled ? 'OFFENSE_ENABLED' : 'OFFENSE_DISABLED')}</div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 p-4 border border-slate-700 rounded mb-2">
                                    <div className="text-[9px] text-slate-600 font-bold uppercase mb-3 border-b border-slate-700/50 pb-1">Genetic Sequencer</div>
                                    <TacticalSlider label="Gene Min" value={minGene} min={0.5} max={8.0} step={0.1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMinGene(Math.min(v, maxGene))} />
                                    <TacticalSlider label="Gene Max" value={maxGene} min={0.5} max={8.0} step={0.1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setMaxGene(Math.max(v, minGene))} />
                                </div>
                                <div className="bg-slate-900/40 p-4 border border-slate-700 rounded">
                                    <div className="text-[9px] text-slate-600 font-bold uppercase mb-3 border-b border-slate-700/50 pb-1">Sector Topography</div>
                                    <TacticalSlider label={t('PLANET_COUNT')} value={planetCount} min={5} max={20} step={1} color={PRESETS[mode].color} disabled={isLocked} onChange={(v) => setPlanetCount(v)} />
                                </div>
                                {isLocked && (
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:10px_10px] z-20 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                                        <div className="bg-black/80 border border-red-900/50 text-red-500 px-4 py-2 text-xs font-mono font-bold tracking-widest shadow-2xl">PARAMETER LOCK ENGAGED</div>
                                    </div>
                                )}
                            </>
                        ) : (
                            // ARCHIVE DETAILS VIEW
                            selectedSector ? (
                                <div className="flex flex-col h-full animate-fadeIn">
                                    <div className="bg-slate-900/40 border border-slate-700 p-4 mb-4">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-1">{t('SECTOR_LORE')}</div>
                                        <p className="text-xs text-slate-300 font-mono leading-relaxed">{t(selectedSector.descKey)}</p>
                                    </div>
                                    <div className="bg-slate-900/40 border border-slate-700 p-4 flex-1 overflow-y-auto">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-1">STELLAR BODIES</div>
                                        {selectedSector.planets.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0">
                                                <span className="text-slate-400">{p.name}</span>
                                                <span className={`font-mono ${p.geneStrength && p.geneStrength > 2 ? 'text-red-400' : 'text-cyan-400'}`}>x{(p.geneStrength || 1).toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">{t('ARCHIVE_LOCKED')}</div>
                            )
                        )}
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleScan}
                        className={`mt-4 w-full py-5 font-black text-xl tracking-[0.2em] uppercase border-t-4 transition-all shadow-lg active:scale-[0.99] group overflow-hidden relative
                            ${activeTab === 'ARCHIVES' 
                                ? 'bg-purple-900 hover:bg-purple-800 border-purple-500 text-purple-100'
                                : mode === 'HIGH' ? 'bg-red-900 hover:bg-red-800 border-red-500 text-red-100' : 
                                  mode === 'LOW' ? 'bg-emerald-900 hover:bg-emerald-800 border-emerald-500 text-emerald-100' :
                                  mode === 'CUSTOM' ? 'bg-yellow-900 hover:bg-yellow-800 border-yellow-500 text-yellow-100' :
                                  'bg-cyan-900 hover:bg-cyan-800 border-cyan-500 text-cyan-100'}
                        `}
                    >
                        <span className="relative z-10">{t('INITIATE_SCAN')}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                </div>

            </div>
        </ModuleWindow>
    );
};
