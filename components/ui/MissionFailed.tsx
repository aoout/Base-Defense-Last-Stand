
import React from 'react';
import { GameState } from '../../types';

interface MissionFailedScreenProps {
    state: GameState;
    onRestart: () => void;
    t: (key: string) => string;
}

const StatRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline border-b border-red-900/30 pb-1">
        <span className="text-red-800 text-sm font-bold tracking-wider">{label}</span>
        <span className="text-xl text-white font-mono">{value}</span>
    </div>
);

export const MissionFailedScreen: React.FC<MissionFailedScreenProps> = ({ state, onRestart, t }) => {
    const handleDownloadReport = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = '#331111';
        ctx.lineWidth = 1;
        for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke(); }
        for (let i = 0; i < 600; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }
        ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 60px Courier New, monospace'; ctx.fillText('MISSION FAILED', 50, 80);
        ctx.fillStyle = '#7f1d1d'; ctx.font = '20px Courier New, monospace'; ctx.fillText('// AFTER ACTION REPORT // CLASSIFIED', 50, 110);
        ctx.fillText(`// DATE: ${new Date().toLocaleDateString()}`, 50, 135);
        ctx.lineWidth = 4; ctx.strokeStyle = '#b91c1c'; ctx.strokeRect(20, 20, 760, 560);
        ctx.fillStyle = '#ffffff'; ctx.font = '24px Courier New, monospace';
        const drawStat = (label: string, value: string | number, x: number, y: number) => {
            ctx.fillStyle = '#9ca3af'; ctx.fillText(label, x, y);
            ctx.fillStyle = '#ffffff'; ctx.fillText(String(value), x + 250, y);
        };
        let y = 200;
        drawStat('WAVES SURVIVED', state.wave, 50, y); y += 40;
        drawStat('TOTAL SCORE', Math.floor(state.player.score), 50, y); y += 40;
        drawStat('DAMAGE DEALT', state.stats.damageDealt.toLocaleString(), 50, y); y += 40;
        drawStat('SHOTS FIRED', state.stats.shotsFired.toLocaleString(), 50, y); y += 40;
        const accuracy = state.stats.shotsFired > 0 ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) + '%' : '0%';
        drawStat('ACCURACY', accuracy, 50, y); y += 40;
        y = 200; const x2 = 450;
        ctx.fillStyle = '#ef4444'; ctx.fillText('CONFIRMED KILLS', x2, y - 10);
        ctx.font = '18px Courier New, monospace';
        Object.entries(state.stats.killsByType).forEach(([type, count], idx) => {
            ctx.fillStyle = '#9ca3af'; ctx.fillText(type, x2, y + 30 + (idx * 30));
            ctx.fillStyle = '#ef4444'; ctx.fillText(String(count), x2 + 200, y + 30 + (idx * 30));
        });
        ctx.fillStyle = '#331111'; ctx.font = 'bold 100px Arial'; ctx.save();
        ctx.translate(400, 300); ctx.rotate(-Math.PI / 6); ctx.textAlign = 'center'; ctx.fillText('TERMINATED', 0, 0); ctx.restore();
        const image = canvas.toDataURL("image/jpeg");
        const link = document.createElement('a');
        link.href = image; link.download = `MissionReport_${Date.now()}.jpg`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center pointer-events-auto font-mono text-red-600">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(50,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(50,0,0,0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
             <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
             <div className="relative z-10 border-4 border-red-900 bg-black/90 p-12 max-w-4xl w-full shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                 <div className="flex justify-between items-start mb-8 border-b-2 border-red-900 pb-4">
                     <div>
                         <h1 className="text-6xl font-black tracking-tighter text-red-600 mb-2 glitch-text">{t('MISSION_FAILED')}</h1>
                         <p className="text-red-800 tracking-[0.5em] text-sm font-bold">SIGNAL LOST // BASE DESTROYED</p>
                     </div>
                     <div className="text-right">
                         <div className="text-red-900 text-xs">{t('REPORT_ID')}</div>
                         <div className="text-red-500 font-bold">#A7-XX-{Math.floor(Math.random()*9999)}</div>
                     </div>
                 </div>
                 <div className="grid grid-cols-2 gap-12 mb-12">
                     <div className="space-y-4">
                         <StatRow label="WAVES SURVIVED" value={state.wave} />
                         <StatRow label={t('FINAL_SCORE')} value={Math.floor(state.player.score)} />
                         <StatRow label={t('TOTAL_DAMAGE')} value={state.stats.damageDealt.toLocaleString()} />
                         <StatRow label={t('SHOTS_FIRED')} value={state.stats.shotsFired.toLocaleString()} />
                         <StatRow label={t('ACCURACY')} value={state.stats.shotsFired > 0 ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) + '%' : '0%'} />
                     </div>
                     <div>
                         <h3 className="text-red-500 border-b border-red-900/50 pb-2 mb-4 font-bold tracking-widest">{t('HOSTILES_NEUTRALIZED')}</h3>
                         <div className="space-y-2">
                             {Object.entries(state.stats.killsByType).map(([type, count]) => (
                                 <div key={type} className="flex justify-between text-sm">
                                     <span className="text-red-800">{type}</span>
                                     <span className="text-red-500 font-bold">{count}</span>
                                 </div>
                             ))}
                         </div>
                         <div className="mt-6 pt-4 border-t border-red-900/50 flex justify-between">
                             <span className="text-red-400 font-bold">{t('TOTAL_UNITS')}</span>
                             <span className="text-2xl text-white font-bold">
                                 {(Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0)}
                             </span>
                         </div>
                     </div>
                 </div>
                 <div className="flex-1 flex justify-center gap-6">
                     <button onClick={onRestart} className="px-8 py-4 bg-red-900 hover:bg-red-800 text-white font-bold tracking-widest uppercase border border-red-600 transition-all hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.5)]">{t('RE_DEPLOY')}</button>
                     <button onClick={handleDownloadReport} className="px-8 py-4 bg-black hover:bg-gray-900 text-red-500 font-bold tracking-widest uppercase border border-red-900 transition-all hover:text-red-400 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{t('SAVE_INTEL')}</button>
                 </div>
             </div>
        </div>
    );
};
