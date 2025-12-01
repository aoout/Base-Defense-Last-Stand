
import React from 'react';
import { CloseButton } from './Shared';

interface ExplorationManualProps {
    onClose: () => void;
    t: (key: string) => string;
}

export const ExplorationManual: React.FC<ExplorationManualProps> = ({ onClose, t }) => {
    return (
        <div className="absolute inset-0 z-[250] bg-slate-950/90 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
            <div className="w-[800px] bg-slate-900 border-2 border-slate-700 shadow-2xl relative flex flex-col max-h-[90vh]">
                <CloseButton onClick={onClose} colorClass="border-slate-600 text-slate-500 hover:text-white hover:bg-slate-800" />
                
                {/* Header */}
                <div className="p-8 border-b border-slate-800 bg-slate-950/50">
                    <h1 className="text-3xl font-black text-slate-100 tracking-widest uppercase">{t('MANUAL_TITLE')}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-px w-12 bg-cyan-500"></div>
                        <span className="text-cyan-500 font-mono text-xs tracking-[0.3em]">{t('MANUAL_SUB')}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8">
                    
                    {/* Section 1: Landing */}
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center border border-slate-700 text-cyan-500 font-bold font-mono">01</div>
                            <h2 className="text-xl font-bold text-white tracking-wide uppercase">{t('MANUAL_SEC_LANDING')}</h2>
                        </div>
                        <div className="pl-12 text-slate-400 text-sm leading-relaxed font-mono border-l-2 border-slate-800">
                            {t('MANUAL_LANDING_DESC')}
                        </div>
                    </section>

                    {/* Section 2: Atmosphere */}
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center border border-slate-700 text-cyan-500 font-bold font-mono">02</div>
                            <h2 className="text-xl font-bold text-white tracking-wide uppercase">{t('MANUAL_SEC_ATMOS')}</h2>
                        </div>
                        <div className="pl-12 space-y-4 font-mono text-sm">
                            <div className="bg-blue-900/10 p-4 border border-blue-900/30">
                                <span className="text-blue-400 font-bold block mb-1">OXYGEN (O2)</span>
                                <span className="text-slate-400">{t('MANUAL_OXYGEN_DESC')}</span>
                            </div>
                             <div className="bg-yellow-900/10 p-4 border border-yellow-900/30">
                                <span className="text-yellow-500 font-bold block mb-1">SULFUR (S)</span>
                                <span className="text-slate-400">{t('MANUAL_SULFUR_DESC')}</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Geology */}
                    <section>
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center border border-slate-700 text-cyan-500 font-bold font-mono">03</div>
                            <h2 className="text-xl font-bold text-white tracking-wide uppercase">{t('MANUAL_SEC_GEO')}</h2>
                        </div>
                        <div className="pl-12 text-slate-400 text-sm leading-relaxed font-mono border-l-2 border-slate-800">
                             {t('MANUAL_GENE_DESC')}
                        </div>
                    </section>

                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-center">
                    <button onClick={onClose} className="text-xs text-slate-500 hover:text-white tracking-widest uppercase transition-colors">
                        {t('MANUAL_CLOSE')}
                    </button>
                </div>
            </div>
        </div>
    );
};
