
import React, { useState } from 'react';
import { ModuleWindow } from './ModuleWindow';
import { GalaxyConfig } from '../../types';

interface GalaxyIndexModalProps {
    onClose: () => void;
    onScan: (config: GalaxyConfig) => void;
    t: (key: string, params?: any) => string;
}

type DifficultyPreset = 'LOW' | 'MED' | 'HIGH' | 'CUSTOM';

export const GalaxyIndexModal: React.FC<GalaxyIndexModalProps> = ({ onClose, onScan, t }) => {
    const [difficulty, setDifficulty] = useState<DifficultyPreset>('MED');
    const [customMin, setCustomMin] = useState(1.0);
    const [customMax, setCustomMax] = useState(3.0);
    const [showCustom, setShowCustom] = useState(false);

    const handlePreset = (diff: DifficultyPreset) => {
        setDifficulty(diff);
        if (diff === 'LOW') { setCustomMin(0.6); setCustomMax(2.4); setShowCustom(false); }
        else if (diff === 'MED') { setCustomMin(1.0); setCustomMax(3.0); setShowCustom(false); }
        else if (diff === 'HIGH') { setCustomMin(1.0); setCustomMax(4.2); setShowCustom(false); }
        else if (diff === 'CUSTOM') { setShowCustom(true); }
    };

    const handleScan = () => {
        onScan({
            minGeneStrength: customMin,
            maxGeneStrength: customMax
        });
        onClose();
    };

    const avgGene = (customMin + customMax) / 2;

    return (
        <ModuleWindow
            title={t('GALAXY_INDEX_TITLE')}
            subtitle={t('GALAXY_INDEX_SUB')}
            theme="cyan"
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col w-full h-full p-8 gap-8">
                
                {/* Difficulty Presets */}
                <div className="grid grid-cols-3 gap-6">
                    {(['LOW', 'MED', 'HIGH'] as const).map(diff => (
                        <button
                            key={diff}
                            onClick={() => handlePreset(diff)}
                            className={`
                                py-8 border-2 rounded-lg flex flex-col items-center justify-center transition-all relative overflow-hidden group
                                ${difficulty === diff 
                                    ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                                    : 'bg-black/40 border-slate-700 hover:border-slate-500'}
                            `}
                        >
                            <div className={`text-2xl font-black font-display tracking-widest uppercase mb-2 ${difficulty === diff ? 'text-white' : 'text-slate-500'}`}>
                                {t(`DIFF_${diff}`)}
                            </div>
                            <div className="text-xs font-mono text-cyan-500/70">
                                {diff === 'LOW' && 'GENE 0.6 - 2.4'}
                                {diff === 'MED' && 'GENE 1.0 - 3.0'}
                                {diff === 'HIGH' && 'GENE 1.0 - 4.2'}
                            </div>
                            {difficulty === diff && (
                                <div className="absolute inset-0 bg-cyan-400/5 animate-pulse pointer-events-none"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Custom / Details Toggle */}
                <button 
                    onClick={() => handlePreset('CUSTOM')}
                    className={`w-full py-3 border border-slate-700 text-xs font-bold tracking-[0.2em] uppercase transition-all
                        ${difficulty === 'CUSTOM' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-600' : 'bg-black/20 text-slate-500 hover:text-slate-300'}
                    `}
                >
                    {t('INDEX_DEF')} {showCustom ? '▼' : '▶'}
                </button>

                {/* Custom Controls */}
                {difficulty === 'CUSTOM' && (
                    <div className="bg-black/40 border border-cyan-900/30 p-6 rounded-lg animate-fadeIn flex flex-col gap-6">
                        
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-400 mb-2 block">{t('GENE_RANGE')} (MIN)</label>
                                <input 
                                    type="range" min="0.5" max="5.0" step="0.1" 
                                    value={customMin} 
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setCustomMin(Math.min(val, customMax));
                                    }}
                                    className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-right font-mono text-cyan-400 font-bold mt-1">{customMin.toFixed(1)}</div>
                            </div>
                            
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-400 mb-2 block">{t('GENE_RANGE')} (MAX)</label>
                                <input 
                                    type="range" min="0.5" max="8.0" step="0.1" 
                                    value={customMax} 
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setCustomMax(Math.max(val, customMin));
                                    }}
                                    className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-right font-mono text-cyan-400 font-bold mt-1">{customMax.toFixed(1)}</div>
                            </div>
                        </div>

                        <div className="border-t border-cyan-900/30 pt-4 flex justify-between items-center">
                            <span className="text-cyan-600 font-bold text-xs tracking-widest">{t('AVG_GENE_STR')}</span>
                            <span className={`text-2xl font-mono font-bold ${avgGene > 3 ? 'text-red-400' : 'text-white'}`}>
                                x{avgGene.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Scan Button */}
                <button 
                    onClick={handleScan}
                    className="mt-auto w-full py-6 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xl tracking-[0.3em] uppercase border-t-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99]"
                >
                    {t('INITIATE_SCAN')}
                </button>

            </div>
        </ModuleWindow>
    );
};
