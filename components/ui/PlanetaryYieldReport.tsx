
import React, { useEffect, useState } from 'react';
import { GameState } from '../../types';

interface PlanetaryYieldReportProps {
    state: GameState;
    onClaim: () => void;
    t: (key: string, params?: any) => string;
}

export const PlanetaryYieldReport: React.FC<PlanetaryYieldReportProps> = ({ state, onClaim, t }) => {
    const report = state.pendingYieldReport;
    const [animatedTotal, setAnimatedTotal] = useState(0);

    useEffect(() => {
        if (!report) return;
        const target = report.totalYield;
        const duration = 1500;
        const start = Date.now();

        const tick = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
            const ease = 1 - Math.pow(1 - progress, 4); // Ease out quart
            
            setAnimatedTotal(Math.floor(target * ease));

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    }, [report]);

    if (!report) return null;

    return (
        <div className="absolute inset-0 z-[300] bg-slate-950 flex items-center justify-center pointer-events-auto font-mono">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(6,78,59,0.5)_100%)]"></div>

            <div className="relative w-[800px] border-y-4 border-emerald-500 bg-slate-900/95 shadow-2xl p-12 flex flex-col backdrop-blur-md">
                
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-emerald-900 pb-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-black text-white tracking-widest">{t('REPORT_TITLE')}</h1>
                        <div className="text-emerald-500 text-xs tracking-[0.3em] font-bold">{t('REPORT_SUB')}</div>
                    </div>
                    <div className="text-right text-emerald-800 text-[10px] font-mono">
                        LOG_ID: {Date.now().toString(16).toUpperCase()}
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 border-b border-emerald-900/50 pb-2 mb-4 tracking-widest px-4">
                    <div className="col-span-1">{t('REPORT_COL_PLANET')}</div>
                    <div className="text-right text-green-400">{t('REPORT_COL_BIO')}</div>
                    <div className="text-right text-blue-400">{t('REPORT_COL_OXY')}</div>
                    <div className="text-right text-white">{t('REPORT_COL_TOTAL')}</div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 mb-8 pr-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
                    {report.items.map((item, idx) => (
                        <div 
                            key={item.planetId} 
                            className="grid grid-cols-4 gap-4 py-3 px-4 bg-emerald-900/10 border border-emerald-900/30 items-center hover:bg-emerald-900/20 transition-colors animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="font-bold text-white text-sm">{item.planetName}</div>
                            <div className="text-right text-green-400 font-mono">+{item.biomassYield}</div>
                            <div className="text-right text-blue-400 font-mono">+{item.oxygenYield}</div>
                            <div className="text-right text-yellow-400 font-mono font-bold">+{item.total}</div>
                        </div>
                    ))}
                </div>

                {/* Footer Total */}
                <div className="bg-black/40 border border-emerald-500/50 p-6 flex justify-between items-center mb-8">
                    <div className="text-emerald-500 font-bold tracking-[0.2em] text-sm uppercase">{t('REPORT_NET_GAIN')}</div>
                    <div className="text-5xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        +{animatedTotal}
                    </div>
                </div>

                <button 
                    onClick={onClaim}
                    className="group w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-[0.2em] text-lg uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] relative overflow-hidden"
                >
                    <span className="relative z-10">{t('REPORT_TRANSFER')}</span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform skew-x-12 duration-300"></div>
                </button>

            </div>
        </div>
    );
};
