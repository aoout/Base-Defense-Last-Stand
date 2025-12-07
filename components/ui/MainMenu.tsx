
import React, { useRef, useState } from 'react';
import { GameSettings } from '../../types';
import { SaveSlotItem } from './SaveSlot';
import { CloseButton } from './Shared';
import { CHANGELOG, CURRENT_VERSION } from '../../data/changelog';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { KeyBindingUI } from './KeyBindingUI';

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

export const MainMenu: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [showControls, setShowControls] = useState(false);

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
                engine.importSave(content);
            }
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

    const isCN = state.settings.language === 'CN';

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
            />

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
                        onLoad={() => engine.loadGame(save.id)}
                        onDelete={() => engine.deleteSave(save.id)}
                        onPin={() => engine.togglePin(save.id)}
                        onExport={() => handleExportSave(save.id)}
                        />
                    ))}
                </div>
            </div>

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
                    <button onClick={() => engine.enterSurvivalMode()} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-cyan-500/50 hover:border-cyan-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-cyan-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-display font-bold text-white tracking-widest group-hover:text-cyan-100 transition-colors">{t('SURVIVAL_MODE')}</span>
                            <span className="text-[10px] text-cyan-600 group-hover:text-cyan-300 font-mono uppercase tracking-[0.2em]">{t('SURVIVAL_DESC')}</span>
                        </div>
                        
                        <div className="relative z-10 w-8 h-8 border border-cyan-800 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                            ▶
                        </div>
                    </button>

                    <button onClick={() => engine.enterExplorationMode()} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-purple-500/50 hover:border-purple-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-purple-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-display font-bold text-white tracking-widest group-hover:text-purple-100 transition-colors">{t('EXPLORE_MODE')}</span>
                            <span className="text-[10px] text-purple-600 group-hover:text-purple-300 font-mono uppercase tracking-[0.2em]">{t('EXPLORE_DESC')}</span>
                        </div>

                        <div className="relative z-10 w-8 h-8 border border-purple-800 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-black transition-all">
                            ▲
                        </div>
                    </button>

                    <button onClick={() => engine.enterCampaignMode()} className="group relative w-[420px] h-24 bg-slate-900/60 border-l-4 border-yellow-500/50 hover:border-yellow-400 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-yellow-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-4xl font-display font-bold text-white tracking-widest group-hover:text-yellow-100 transition-colors">{isCN ? "战役模式" : "CAMPAIGN"}</span>
                            <span className="text-[10px] text-yellow-600 group-hover:text-yellow-300 font-mono uppercase tracking-[0.2em]">{isCN ? "双基地 // 边境防守" : "DUAL BASE // BORDER DEFENSE"}</span>
                        </div>

                        <div className="relative z-10 w-8 h-8 border border-yellow-800 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                            ★
                        </div>
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <button 
                    onClick={() => setShowChangelog(true)}
                    className="text-slate-600 hover:text-cyan-400 text-xs font-mono tracking-widest uppercase transition-colors p-2"
                >
                    {isCN ? `系统版本 v${CURRENT_VERSION}` : `SYSTEM VERSION ${CURRENT_VERSION}`}
                </button>
                <div className="w-16 h-px bg-slate-800"></div>
            </div>

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

            {showChangelog && (
                <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-[600px] h-[70vh] bg-slate-900 border-2 border-slate-600 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative flex flex-col">
                        <CloseButton onClick={() => setShowChangelog(false)} colorClass="border-slate-600 text-slate-500 hover:text-white hover:bg-slate-800 z-50" />
                        
                        <div className="p-6 border-b border-slate-700 bg-slate-950">
                            <h2 className="text-xl font-display font-black text-white tracking-widest uppercase">{isCN ? '系统更新日志' : 'SYSTEM PATCH LOG'}</h2>
                            <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] mt-1">{isCN ? `当前版本: v${CURRENT_VERSION}` : `CURRENT BUILD: v${CURRENT_VERSION}`}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {CHANGELOG.map((entry, idx) => {
                                const displayTitle = (isCN && entry.titleCN) ? entry.titleCN : entry.title;
                                const displayChanges = (isCN && entry.changesCN) ? entry.changesCN : entry.changes;

                                return (
                                    <div key={entry.version} className={`relative pl-4 border-l-2 ${idx === 0 ? 'border-cyan-500' : 'border-slate-700'}`}>
                                        <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${idx === 0 ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : 'bg-slate-700'}`}></div>
                                        
                                        <div className="flex justify-between items-baseline mb-2">
                                            <div className={`font-mono text-xl font-bold ${idx === 0 ? 'text-white' : 'text-slate-500'}`}>v{entry.version}</div>
                                            <div className="text-xs font-mono text-slate-600">{entry.date}</div>
                                        </div>
                                        
                                        {displayTitle && (
                                            <div className={`text-xs font-bold tracking-widest uppercase mb-3 ${idx === 0 ? 'text-cyan-400' : 'text-slate-600'}`}>
                                                {displayTitle}
                                            </div>
                                        )}

                                        <ul className="space-y-2">
                                            {displayChanges && displayChanges.map((change, cIdx) => (
                                                <li key={cIdx} className="text-xs font-mono text-slate-400 leading-relaxed pl-2 flex">
                                                    <span className="mr-2 text-slate-700">➜</span>
                                                    {change}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="p-4 border-t border-slate-800 text-center text-[10px] text-slate-600 font-mono uppercase bg-slate-950">
                            {isCN ? '先锋操作系统内核更新器' : 'VANGUARD OS KERNEL UPDATER'}
                        </div>
                    </div>
                </div>
            )}

            {showControls && (
                <KeyBindingUI onClose={() => setShowControls(false)} />
            )}

            {showSettings && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-[600px] bg-slate-900 border-2 border-cyan-600 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative p-8">
                        <CloseButton onClick={() => setShowSettings(false)} colorClass="border-cyan-600 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                        
                        <div className="border-b border-cyan-800 pb-4 mb-6 text-center">
                            <h2 className="text-2xl font-display font-black text-white tracking-widest uppercase">{t('SETTINGS_TITLE')}</h2>
                            <p className="text-[10px] text-cyan-500 font-mono tracking-[0.2em]">{t('SETTINGS_HINT')}</p>
                        </div>

                        <div className="space-y-3">
                            <SettingRow 
                                label={t('SETTING_LANGUAGE')} 
                                value={state.settings.language === 'EN' ? 'EN' : 'CN'} 
                                onClick={() => engine.toggleSetting('language')} 
                            />
                            
                            <div className="h-px bg-slate-800 my-4"></div>
                            
                            <button
                                onClick={() => setShowControls(true)}
                                className="w-full p-3 border border-slate-700 bg-slate-900/50 hover:bg-cyan-900/20 hover:border-cyan-500 transition-all text-xs font-bold text-slate-400 hover:text-cyan-400 tracking-widest flex justify-between items-center group"
                            >
                                <span>{t('CONTROLS_BTN')}</span>
                                <span className="group-hover:translate-x-1 transition-transform">»</span>
                            </button>

                            <div className="h-px bg-slate-800 my-4"></div>

                            <SettingRow 
                                label={t('SETTING_RESOLUTION')} 
                                value={`${(state.settings.resolutionScale || 1.0) * 100}%`}
                                onClick={() => engine.toggleSetting('resolutionScale')}
                                description={isCN ? "降低渲染分辨率以显著提高性能。" : "Lower internal resolution for massive FPS boost."}
                            />

                            <SettingRow 
                                label={t('SETTING_LOD_LABEL')} 
                                value={t(`SETTING_${state.settings.performanceMode || 'BALANCED'}`)} 
                                onClick={() => engine.toggleSetting('performanceMode')}
                                description={isCN ? "调整模型细节阈值。" : "Adjust Model LOD thresholds."}
                            />

                            <SettingRow 
                                label={t('SETTING_SHADOWS')} 
                                value={state.settings.showShadows ? t('SETTING_ON') : t('SETTING_OFF')} 
                                onClick={() => engine.toggleSetting('showShadows')}
                                description={isCN ? "切换单位阴影投射。" : "Toggle unit drop shadows."}
                            />

                            <SettingRow 
                                label={t('SETTING_PARTICLES')} 
                                value={state.settings.particleIntensity === 'HIGH' ? t('SETTING_HIGH') : t('SETTING_LOW')} 
                                onClick={() => engine.toggleSetting('particleIntensity')}
                                description={isCN ? "减少碎片/爆炸特效。" : "Reduce debris/explosion effects."}
                            />
                            
                            <SettingRow 
                                label={t('SETTING_LIGHTING')} 
                                value={state.settings.lightingQuality === 'HIGH' ? t('SETTING_HIGH') : t('SETTING_LOW')} 
                                onClick={() => engine.toggleSetting('lightingQuality')}
                                description={isCN ? "切换光晕和泛光效果。" : "Toggle glows and bloom effects."}
                            />
                            
                            <SettingRow 
                                label={t('SETTING_ANIM_BG')} 
                                value={state.settings.animatedBackground ? t('SETTING_ON') : t('SETTING_OFF')} 
                                onClick={() => engine.toggleSetting('animatedBackground')}
                                description={isCN ? "切换地形动画 (岩浆, 树木)。" : "Toggle terrain animations (Magma, Trees)."}
                            />

                            <SettingRow 
                                label={t('DMG_TEXT')} 
                                value={state.settings.showDamageNumbers ? t('SETTING_ON') : t('SETTING_OFF')} 
                                onClick={() => engine.toggleSetting('showDamageNumbers')} 
                                description={isCN ? "显示/隐藏伤害数字浮动文本。" : "Toggle floating damage numbers."}
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
