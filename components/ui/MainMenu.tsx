
import React, { useRef, useState } from 'react';
import { GameState, GameSettings } from '../../types';
import { SaveSlotItem } from './SaveSlot';
import { CloseButton } from './Shared';

interface MainMenuProps {
    state: GameState;
    onStartSurvival: () => void;
    onStartExploration: () => void;
    onLoadGame: (id: string) => void;
    onDeleteSave: (id: string) => void;
    onTogglePin: (id: string) => void;
    onExportSave: (id: string) => void;
    onImportSave: (json: string) => void;
    onToggleSetting: (key: keyof GameSettings) => void;
    t: (key: string) => string;
}

const SettingRow: React.FC<{ label: string, value: string, onClick: () => void, description?: string }> = ({ label, value, onClick, description }) => (
    <div 
        className="flex items-center justify-between p-3 border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-cyan-500 cursor-pointer group transition-all"
        onClick={onClick}
    >
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 group-hover:text-cyan-400 tracking-widest">{label}</span>
            {description && <span className="text-[10px] text-slate-600 font-mono">{description}</span>}
        </div>
        <div className="px-3 py-1 bg-black border border-slate-600 text-cyan-500 text-xs font-mono font-bold min-w-[60px] text-center group-hover:border-cyan-500 group-hover:text-cyan-300">
            {value}
        </div>
    </div>
);

export const MainMenu: React.FC<MainMenuProps> = ({ 
    state, 
    onStartSurvival, 
    onStartExploration, 
    onLoadGame, 
    onDeleteSave, 
    onTogglePin, 
    onExportSave,
    onImportSave,
    onToggleSetting,
    t 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSettings, setShowSettings] = useState(false);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            if (content) {
                onImportSave(content);
            }
        };
        reader.readAsText(file);
        // Reset so same file can be selected again if needed
        e.target.value = '';
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            {/* Hidden Input for Import */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
            />

            {/* Floating Cryo Storage (Left) */}
            <div className="absolute top-12 bottom-12 left-12 w-96 flex flex-col justify-center">
                <div className="mb-6 border-b border-blue-500/30 pb-2 flex justify-between items-center">
                    <h2 className="text-blue-400 font-mono text-sm tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] animate-pulse">{t('EXTRACTABLE_MEMORIES')}</h2>
                    <button 
                        onClick={handleImportClick}
                        className="text-[10px] bg-blue-900/50 hover:bg-blue-800 text-blue-300 px-2 py-1 border border-blue-700"
                    >
                        {t('IMPORT_DATA')}
                    </button>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-4 scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
                    {state.saveSlots.length === 0 && (
                        <div className="text-blue-500/30 italic text-xs py-10 border border-blue-900/20 bg-blue-900/5 p-4 text-center tracking-widest">
                            {t('NO_ARCHIVES')}
                        </div>
                    )}
                    {state.saveSlots.map(save => (
                        <SaveSlotItem 
                        key={save.id} 
                        save={save} 
                        onLoad={() => onLoadGame(save.id)}
                        onDelete={() => onDeleteSave(save.id)}
                        onPin={() => onTogglePin(save.id)}
                        onExport={() => onExportSave(save.id)}
                        t={t}
                        />
                    ))}
                </div>
            </div>

            {/* Main Menu (Right Side) */}
            <div className="absolute right-24 flex flex-col items-end space-y-12">
                <div className="text-right">
                    <h1 className="text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        {t('GAME_TITLE')}<br/><span className="text-cyan-500 text-9xl drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">DEFENSE</span>
                    </h1>
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <div className="h-px w-24 bg-cyan-500"></div>
                        <p className="text-cyan-300 font-mono tracking-[0.4em] text-sm">{t('GAME_SUB')}</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-6">
                    <button onClick={onStartSurvival} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-cyan-500/50 hover:border-cyan-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-cyan-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-display font-bold text-white tracking-widest group-hover:text-cyan-100 transition-colors">{t('SURVIVAL_MODE')}</span>
                            <span className="text-[10px] text-cyan-600 group-hover:text-cyan-300 font-mono uppercase tracking-[0.2em]">{t('SURVIVAL_DESC')}</span>
                        </div>
                        
                        <div className="relative z-10 w-8 h-8 border border-cyan-800 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                            ▶
                        </div>
                    </button>

                    <button onClick={onStartExploration} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-purple-500/50 hover:border-purple-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-purple-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-display font-bold text-white tracking-widest group-hover:text-purple-100 transition-colors">{t('EXPLORE_MODE')}</span>
                            <span className="text-[10px] text-purple-600 group-hover:text-purple-300 font-mono uppercase tracking-[0.2em]">{t('EXPLORE_DESC')}</span>
                        </div>

                        <div className="relative z-10 w-8 h-8 border border-purple-800 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-black transition-all">
                            ▲
                        </div>
                    </button>
                </div>
            </div>

            {/* Settings Toggle (Bottom Right) */}
            <div className="absolute bottom-8 right-8">
                <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900/80 border border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 transition-all rounded group shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-mono font-bold text-xs tracking-widest">{t('SETTINGS_BTN')}</span>
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-[500px] bg-slate-900 border-2 border-cyan-600 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative p-8">
                        <CloseButton onClick={() => setShowSettings(false)} colorClass="border-cyan-600 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                        
                        <div className="border-b border-cyan-800 pb-4 mb-6 text-center">
                            <h2 className="text-2xl font-display font-black text-white tracking-widest uppercase">{t('SETTINGS_TITLE')}</h2>
                            <p className="text-[10px] text-cyan-500 font-mono tracking-[0.2em]">{t('SETTINGS_HINT')}</p>
                        </div>

                        <div className="space-y-3">
                            <SettingRow 
                                label={t('SETTING_LANGUAGE')} 
                                value={state.settings.language === 'EN' ? 'EN' : 'CN'} 
                                onClick={() => onToggleSetting('language')} 
                            />
                            
                            <div className="h-px bg-slate-800 my-4"></div>
                            
                            <SettingRow 
                                label={t('SETTING_LOD_LABEL')} 
                                value={t(`SETTING_${state.settings.performanceMode || 'BALANCED'}`)} 
                                onClick={() => onToggleSetting('performanceMode')}
                                description="Adjust Model LOD thresholds."
                            />

                            <SettingRow 
                                label={t('SETTING_PARTICLES')} 
                                value={state.settings.particleIntensity === 'HIGH' ? t('SETTING_HIGH') : t('SETTING_LOW')} 
                                onClick={() => onToggleSetting('particleIntensity')}
                                description="Reduce debris/explosion effects."
                            />
                            
                            <SettingRow 
                                label={t('SETTING_LIGHTING')} 
                                value={state.settings.lightingQuality === 'HIGH' ? t('SETTING_HIGH') : t('SETTING_LOW')} 
                                onClick={() => onToggleSetting('lightingQuality')}
                                description="Toggle glows and bloom effects."
                            />
                            
                            <SettingRow 
                                label={t('SETTING_ANIM_BG')} 
                                value={state.settings.animatedBackground ? t('SETTING_ON') : t('SETTING_OFF')} 
                                onClick={() => onToggleSetting('animatedBackground')}
                                description="Toggle terrain animations (Magma, Trees)."
                            />
                        </div>

                        <div className="mt-8 text-center">
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="px-8 py-2 bg-cyan-900/50 hover:bg-cyan-700 text-cyan-200 text-xs font-bold tracking-widest border border-cyan-600 transition-all"
                            >
                                {t('OS_WINDOW_CLOSE')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}