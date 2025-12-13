
import React, { useRef, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CloseButton } from './Shared';

const StatRow: React.FC<{ label: string, value: string | number, highlight?: boolean, sub?: string }> = ({ label, value, highlight, sub }) => (
    <div className={`flex justify-between items-baseline border-b border-dashed pb-2 pt-2 ${highlight ? 'border-red-500/50' : 'border-red-900/30'}`}>
        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${highlight ? 'text-red-400' : 'text-red-800/80'}`}>{label}</span>
        <div className="text-right">
             <span className={`text-xl font-mono font-bold ${highlight ? 'text-red-100' : 'text-red-700'}`}>{value}</span>
             {sub && <div className="text-[9px] text-red-900 font-bold">{sub}</div>}
        </div>
    </div>
);

export const MissionFailedScreen: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll effect for the log background
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    const totalKills = (Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0);
    
    const missionDuration = Math.floor(state.time / 1000); // seconds
    const minutes = Math.floor(missionDuration / 60);
    const seconds = missionDuration % 60;
    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const causeOfFailure = state.player.hp <= 0 ? t('OPERATIVE_KIA') : t('BASE_COMPROMISED');

    const handleDownloadReport = () => {
        const width = 960;
        const height = 640;
        const scale = 2; // High resolution render

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.scale(scale, scale);

        // --- THEME CONFIG ---
        const cBg = '#0a0505'; 
        const cBorder = '#7f1d1d'; // Red-900
        const cHeaderBg = 'rgba(69, 10, 10, 0.3)'; 
        const cTextMain = '#ef4444'; // Red-500
        const cTextMuted = '#7f1d1d'; // Red-900 (Darker)
        const cTextLabel = '#991b1b'; // Red-800
        const cTextVal = '#fecaca'; // Red-200
        const cTextSub = '#9ca3af'; // Slate-400

        const fontHeader = '900 36px "ZCOOL QingKe HuangYou", sans-serif';
        const fontSub = 'bold 10px "JetBrains Mono", monospace';
        const fontBigMono = 'bold 48px "JetBrains Mono", monospace';

        // 1. Fill Background
        ctx.fillStyle = cBg;
        ctx.fillRect(0, 0, width, height);
        
        // Log Background Effect (Static)
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = cTextMain;
        ctx.font = '10px monospace';
        for(let i=0; i<35; i++) {
             ctx.fillText(`[${Date.now() - i*150}] FATAL_EXCEPTION_0x${(i*999).toString(16).toUpperCase()} // CONNECTION_LOST // NEURAL_LINK_SEVERED`, 10, 20 + i * 18);
        }
        ctx.restore();

        // 2. Main Border
        ctx.strokeStyle = cBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);

        // 3. Header Area
        ctx.fillStyle = cHeaderBg;
        ctx.fillRect(2, 2, width-4, 80);
        ctx.beginPath(); ctx.moveTo(0, 82); ctx.lineTo(width, 82); ctx.stroke();

        // Header Text
        ctx.fillStyle = cTextMain;
        ctx.font = fontHeader;
        ctx.textAlign = 'left';
        ctx.fillText(t('MISSION_FAILED'), 60, 55);

        ctx.fillStyle = cTextLabel;
        ctx.font = fontSub;
        ctx.fillText("RECORDING TERMINATED", 70, 72);

        // Header ID
        ctx.textAlign = 'right';
        ctx.fillStyle = cTextLabel;
        ctx.fillText("BLACK BOX ID", 900, 35);
        ctx.fillStyle = cTextMain;
        ctx.font = 'bold 12px "JetBrains Mono"';
        ctx.fillText(`BB-${Date.now().toString(36).toUpperCase()}`, 900, 55);

        // --- COLUMNS LAYOUT ---
        ctx.beginPath();
        ctx.moveTo(320, 82); ctx.lineTo(320, 560);
        ctx.moveTo(640, 82); ctx.lineTo(640, 560);
        ctx.strokeStyle = 'rgba(127, 29, 29, 0.3)'; // Faint divider
        ctx.stroke();

        // --- COL 1: METRICS ---
        ctx.save();
        ctx.translate(30, 120);
        
        ctx.fillStyle = cTextLabel;
        ctx.font = fontSub;
        ctx.textAlign = 'left';
        ctx.fillText(t('MISSION_METRICS'), 0, 0);
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(260, 10); ctx.strokeStyle = cTextMuted; ctx.stroke();

        const drawStat = (label: string, val: string, y: number) => {
            ctx.fillStyle = cTextLabel;
            ctx.font = 'bold 10px "JetBrains Mono"';
            ctx.fillText(label, 0, y);
            
            ctx.fillStyle = cTextVal;
            ctx.font = 'bold 16px "JetBrains Mono"';
            ctx.textAlign = 'right';
            ctx.fillText(val, 260, y);
            
            ctx.setLineDash([2, 4]);
            ctx.beginPath(); ctx.moveTo(0, y+10); ctx.lineTo(260, y+10); ctx.stroke();
            ctx.setLineDash([]);
            ctx.textAlign = 'left';
        };

        let cy = 40;
        drawStat(t('TIME_ALIVE'), timeFormatted, cy); cy += 50;
        drawStat(t('WAVES_SUFFIX'), state.wave.index.toString(), cy); cy += 50;
        drawStat(t('TOTAL_DAMAGE'), `${(state.stats.damageDealt / 1000).toFixed(1)}k`, cy); cy += 50;

        // Cause Box
        const causeY = 300;
        ctx.fillStyle = 'rgba(127, 29, 29, 0.1)';
        ctx.fillRect(0, causeY, 260, 80);
        ctx.strokeRect(0, causeY, 260, 80);
        
        ctx.fillStyle = cTextMain;
        ctx.textAlign = 'center';
        ctx.font = fontSub;
        ctx.fillText(t('CAUSE_OF_FAILURE'), 130, causeY + 25);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "ZCOOL QingKe HuangYou", sans-serif';
        ctx.fillText(causeOfFailure, 130, causeY + 55);
        ctx.restore();

        // --- COL 2: SNAPSHOT ---
        ctx.save();
        ctx.translate(480, 220);
        
        // Icon
        ctx.strokeStyle = cTextMuted;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = cTextMain;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = cTextMain;
        ctx.font = '60px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("⚠", 0, 5);

        // Score
        ctx.translate(0, 140);
        ctx.fillStyle = cTextMain;
        ctx.font = fontSub;
        ctx.fillText(t('RECOVERED_RESOURCES'), 0, 0);
        
        ctx.fillStyle = '#fff';
        ctx.font = fontBigMono;
        ctx.shadowColor = cTextMain;
        ctx.shadowBlur = 15;
        ctx.fillText(Math.floor(state.player.score).toString(), 0, 50);
        ctx.shadowBlur = 0;

        ctx.fillStyle = cTextLabel;
        ctx.font = fontSub;
        ctx.fillText(t('SCRAPS_TRANSFER'), 0, 80);
        ctx.restore();

        // --- COL 3: THREATS ---
        ctx.save();
        ctx.translate(670, 120);
        
        // Watermark
        ctx.fillStyle = 'rgba(69,10,10,0.2)';
        ctx.font = '100px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText("☠", 260, 60);

        ctx.textAlign = 'left';
        ctx.fillStyle = cTextMain;
        ctx.font = fontSub;
        ctx.fillText(t('HOSTILES_NEUTRALIZED'), 0, 0);
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(260, 10); ctx.strokeStyle = cTextMuted; ctx.stroke();

        let ky = 40;
        ctx.font = 'bold 12px "JetBrains Mono"';
        Object.entries(state.stats.killsByType).forEach(([type, rawCount]) => {
            const count = rawCount as number;
            if (count > 0) {
                const name = t(`ENEMY_${type}_NAME`);
                ctx.fillStyle = cTextLabel;
                ctx.textAlign = 'left';
                ctx.fillText(name, 0, ky);
                
                ctx.fillStyle = cTextMain;
                ctx.textAlign = 'right';
                ctx.fillText(count.toString(), 260, ky);
                
                ctx.fillStyle = 'rgba(127,29,29,0.2)';
                ctx.fillRect(0, ky+6, 260, 1);
                ky += 30;
            }
        });

        // Total
        const totalY = 380;
        ctx.beginPath(); ctx.moveTo(0, totalY); ctx.lineTo(260, totalY); ctx.strokeStyle = cTextMuted; ctx.stroke();
        ctx.fillStyle = cTextLabel;
        ctx.textAlign = 'left';
        ctx.fillText(t('TOTAL_UNITS'), 0, totalY + 25);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px "JetBrains Mono"';
        ctx.textAlign = 'right';
        ctx.fillText(totalKills.toString(), 260, totalY + 25);
        ctx.restore();

        // --- FOOTER ---
        const footerY = 560;
        ctx.fillStyle = '#000';
        ctx.fillRect(2, footerY, width-4, 78);
        ctx.strokeStyle = cTextMuted;
        ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(width, footerY); ctx.stroke();

        ctx.fillStyle = cTextLabel;
        ctx.font = 'bold 14px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("// VANGUARD FLEET COMMAND // DATA ARCHIVED", width/2, footerY + 40);

        // Download
        try {
            const image = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `Vanguard_Report_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Report generation failed", e);
        }
    };

    return (
        <div className="absolute inset-0 z-[200] bg-black flex items-center justify-center pointer-events-auto font-mono select-none overflow-hidden text-red-600">
             
             {/* --- BACKGROUND FX --- */}
             <div className="absolute inset-0 bg-red-950/20 z-0 animate-pulse"></div>
             {/* Scrolling Log Background */}
             <div ref={scrollRef} className="absolute inset-0 opacity-10 pointer-events-none font-mono text-[10px] text-red-500 overflow-hidden leading-tight p-4 whitespace-nowrap z-0">
                 {Array.from({length: 60}).map((_, i) => (
                     <div key={i}>{`[${Date.now() - i*150}] FATAL_EXCEPTION_0x${(i*999).toString(16).toUpperCase()} // CONNECTION_LOST // NEURAL_LINK_SEVERED`}</div>
                 ))}
             </div>
             {/* Vignette */}
             <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,#000_90%)] z-10 pointer-events-none"></div>

             {/* --- MAIN INTERFACE CARD --- */}
             <div className="relative z-20 w-[960px] h-[640px] bg-black border-2 border-red-900 shadow-[0_0_100px_rgba(220,38,38,0.2)] flex flex-col overflow-hidden">
                 
                 {/* Top Header */}
                 <div className="h-20 border-b border-red-900 bg-red-950/30 flex justify-between items-center px-8 relative overflow-hidden">
                     <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.05)_10px,rgba(220,38,38,0.05)_20px)] pointer-events-none"></div>
                     
                     <div className="flex flex-col z-10">
                         <div className="flex items-center gap-3">
                             <div className="w-3 h-3 bg-red-600 animate-ping rounded-full"></div>
                             <h1 className="text-4xl font-display font-black tracking-widest text-red-500">{t('MISSION_FAILED')}</h1>
                         </div>
                         <div className="text-[10px] font-bold text-red-800 tracking-[0.5em] pl-6 uppercase">
                             RECORDING TERMINATED
                         </div>
                     </div>
                     
                     <div className="text-right z-10">
                         <div className="text-[9px] text-red-900 font-bold uppercase mb-1">BLACK BOX ID</div>
                         <div className="bg-red-900/20 border border-red-900 px-2 py-1 text-red-500 font-mono text-xs">
                             BB-{Date.now().toString(36).toUpperCase()}
                         </div>
                     </div>
                 </div>

                 {/* Main Body - 3 Column Grid */}
                 <div className="flex-1 grid grid-cols-12 gap-0 min-h-0 bg-[#0a0505]">
                     
                     {/* LEFT: Context (4 cols) */}
                     <div className="col-span-4 border-r border-red-900/30 p-8 flex flex-col gap-8">
                         <div>
                             <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-4 border-b border-red-900/30 pb-2">{t('MISSION_METRICS')}</h3>
                             <div className="space-y-2">
                                 <StatRow label={t('TIME_ALIVE')} value={timeFormatted} />
                                 <StatRow label={t('WAVES_SUFFIX')} value={state.wave.index} />
                                 <StatRow label={t('TOTAL_DAMAGE')} value={`${(state.stats.damageDealt / 1000).toFixed(1)}k`} />
                             </div>
                         </div>
                         
                         <div className="mt-auto p-4 bg-red-900/10 border border-red-900/50 text-center">
                             <div className="text-[9px] text-red-700 font-bold uppercase mb-2 tracking-widest">{t('CAUSE_OF_FAILURE')}</div>
                             <div className="text-xl font-display font-bold text-white uppercase tracking-wide">{causeOfFailure}</div>
                         </div>
                     </div>

                     {/* CENTER: Final Snapshot (4 cols) */}
                     <div className="col-span-4 border-r border-red-900/30 p-8 flex flex-col items-center justify-center relative">
                         <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(220,38,38,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                         
                         {/* Animated Icon */}
                         <div className="mb-6 relative">
                             <div className="w-32 h-32 border-2 border-red-800 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                 <div className="w-24 h-24 border border-dashed border-red-900 rounded-full"></div>
                             </div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-5xl">⚠</span>
                             </div>
                         </div>

                         <div className="text-center z-10">
                             <div className="text-xs text-red-500 font-bold tracking-[0.2em] mb-2 uppercase">{t('RECOVERED_RESOURCES')}</div>
                             <div className="text-6xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                                 {Math.floor(state.player.score)}
                             </div>
                             <div className="text-[10px] text-red-800 font-bold mt-2 uppercase">{t('SCRAPS_TRANSFER')}</div>
                         </div>
                     </div>

                     {/* RIGHT: Threat Analysis (4 cols) */}
                     <div className="col-span-4 p-8 flex flex-col relative overflow-hidden">
                         <div className="absolute top-4 right-4 text-[100px] text-red-950 opacity-20 font-black pointer-events-none select-none z-0">☠</div>
                         
                         <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 border-b border-red-900/50 pb-2 z-10">{t('HOSTILES_NEUTRALIZED')}</h3>
                         
                         <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-transparent z-10">
                             {Object.entries(state.stats.killsByType).map(([type, rawCount]) => {
                                 const count = rawCount as number;
                                 if (count <= 0) return null;
                                 return (
                                     <div key={type} className="flex justify-between items-center text-xs py-1.5 border-b border-red-900/10">
                                         <span className="text-red-800 font-bold">{t(`ENEMY_${type}_NAME`)}</span>
                                         <span className="text-red-400 font-mono font-bold">{count}</span>
                                     </div>
                                 );
                             })}
                         </div>

                         <div className="mt-4 pt-4 border-t-2 border-red-900 flex justify-between items-center z-10">
                             <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider">{t('TOTAL_UNITS')}</span>
                             <span className="text-3xl font-mono font-bold text-white">{totalKills}</span>
                         </div>
                     </div>
                 </div>

                 {/* Bottom Actions */}
                 <div className="h-20 bg-black border-t border-red-900 flex items-center px-8 gap-4 shrink-0">
                     <button 
                        onClick={() => engine.sessionManager.returnToMainMenu()}
                        className="flex-1 h-12 border border-red-900 text-red-700 hover:text-red-400 hover:border-red-500 hover:bg-red-950/30 transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 group"
                     >
                         <span className="group-hover:-translate-x-1 transition-transform">«</span>
                         {t('RETURN_MAIN_MENU')}
                     </button>
                     
                     <button 
                        onClick={handleDownloadReport}
                        className="flex-1 h-12 border border-red-900 text-red-700 hover:text-white hover:border-white hover:bg-red-900/50 transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                         {t('SAVE_INTEL')}
                     </button>

                     <button 
                        onClick={() => engine.sessionManager.reset(false, state.gameMode)}
                        className="flex-[1.5] h-12 bg-red-700 text-white hover:bg-red-600 transition-all font-black tracking-[0.2em] uppercase text-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                     >
                         {t('RE_DEPLOY')}
                     </button>
                 </div>

             </div>
        </div>
    );
};
