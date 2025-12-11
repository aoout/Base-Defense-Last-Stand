
import React, { useCallback, useEffect, useState } from 'react';
import { Planet, MissionType } from '../../types';
import { CyberButton } from './atoms/CyberButton';
import { drawPlanetSprite } from '../../utils/renderers';
import { useLocale } from '../contexts/LocaleContext';
import { CanvasView } from './common/CanvasView';
import { DS } from '../../theme/designSystem';
import { CloseButton } from './Shared';
import { Icons } from './Icons';

interface PlanetDetailScreenProps {
    planet: Planet;
    currentScraps: number;
    dropCost: number;
    canAfford: boolean;
    onClose: () => void;
    onDeploy: () => void;
    onOpenConstruction: () => void;
}

// A decorative bracket component for HUD elements
const Bracket: React.FC<{ side: 'left' | 'right', children: React.ReactNode, className?: string, colorClass?: string }> = ({ side, children, className = "", colorClass = "border-cyan-500" }) => (
    <div className={`relative p-4 ${className}`}>
        {/* Bracket SVG */}
        <div className={`absolute top-0 bottom-0 w-4 ${side === 'left' ? 'left-0 border-l-2 border-t-2 border-b-2 rounded-l-lg' : 'right-0 border-r-2 border-t-2 border-b-2 rounded-r-lg'} ${colorClass} opacity-60 pointer-events-none`}></div>
        {/* Corner Accent */}
        <div className={`absolute ${side === 'left' ? '-left-1 top-1/2 -translate-y-1/2' : '-right-1 top-1/2 -translate-y-1/2'} w-1 h-8 ${colorClass.replace('border-', 'bg-')}`}></div>
        
        <div className="relative z-10">
            {children}
        </div>
    </div>
);

const HexStat: React.FC<{ label: string, value: string, sub?: string, color?: string }> = ({ label, value, sub, color = "cyan" }) => (
    <div className="flex flex-col items-center justify-center w-24 h-24 relative group">
        <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full text-${color}-900/40 fill-current`}>
            <polygon points="50 0, 95 25, 95 75, 50 100, 5 75, 5 25" />
        </svg>
        <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full text-${color}-500/30 stroke-current stroke-2 fill-none group-hover:text-${color}-400 transition-colors`}>
            <polygon points="50 0, 95 25, 95 75, 50 100, 5 75, 5 25" />
        </svg>
        <div className="relative z-10 text-center">
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
            <div className="text-xl font-display font-bold text-white">{value}</div>
            {sub && <div className={`text-[9px] font-mono text-${color}-400`}>{sub}</div>}
        </div>
    </div>
);

export const PlanetDetailScreen: React.FC<PlanetDetailScreenProps> = ({ 
    planet, 
    currentScraps, 
    dropCost, 
    canAfford, 
    onClose, 
    onDeploy, 
    onOpenConstruction
}) => {
    const { t } = useLocale();
    const [scanLineY, setScanLineY] = useState(0);

    // Animation loop for scanning effect
    useEffect(() => {
        let frame = 0;
        const loop = () => {
            frame = (frame + 2) % 600;
            setScanLineY(frame);
            requestAnimationFrame(loop);
        };
        const id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, []);

    const handleDraw = useCallback((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        ctx.clearRect(0, 0, w, h);
        
        // Draw Planet slightly larger
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = 180;

        // Draw selection ring/grid behind
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(centerX, centerY, radius + 40, 0, Math.PI * 2); ctx.stroke();
        
        ctx.setLineDash([10, 20]);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.beginPath(); ctx.arc(centerX, centerY, radius + 20, time * 0.0001, time * 0.0001 + Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);

        drawPlanetSprite(ctx, planet, centerX, centerY, radius, time, false);
    }, [planet]);

    const isOffense = planet.missionType === MissionType.OFFENSE;
    const themeColor = isOffense ? 'red' : 'cyan';
    const mainColorClass = isOffense ? 'text-red-500' : 'text-cyan-500';
    const borderColorClass = isOffense ? 'border-red-500' : 'border-cyan-500';

    return (
        <div 
            role="button" // Capture input clicks to prevent map fallback logic
            className="absolute inset-0 z-[250] bg-slate-950/95 flex flex-col overflow-hidden animate-fadeIn select-none pointer-events-auto cursor-default"
        >
            
            {/* 1. Background Environment */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0)_0%,rgba(2,6,23,1)_100%)]"></div>
                {/* Tech Grid */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
            </div>

            {/* 2. Top Header Bar */}
            <div className="relative z-20 flex justify-between items-start p-8">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isOffense ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}></div>
                        <span className={`font-mono text-xs font-bold tracking-[0.3em] uppercase ${mainColorClass}`}>
                            {t('PLANETARY_SCAN')} // {planet.id.toUpperCase().substring(0,8)}
                        </span>
                    </div>
                    <h1 className="text-6xl font-display font-black text-white tracking-wide uppercase drop-shadow-lg">{planet.name}</h1>
                </div>
                <CloseButton onClick={onClose} colorClass={`border-${themeColor}-500 text-${themeColor}-500 hover:bg-${themeColor}-900`} />
            </div>

            {/* 3. Main Content Layer */}
            <div className="flex-1 relative w-full h-full">
                
                {/* CENTRAL VISUAL (The Planet) - MOVED UP */}
                <div className="absolute inset-0 flex items-center justify-center z-0 -translate-y-16 pointer-events-none">
                    <CanvasView width={800} height={600} draw={handleDraw} className="opacity-90" />
                    {/* Scanning Line Effect */}
                    <div 
                        className={`absolute left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-${themeColor}-400/50 shadow-[0_0_20px_rgba(6,182,212,0.8)] pointer-events-none`}
                        style={{ top: `${(scanLineY / 600) * 100}%` }}
                    ></div>
                </div>

                {/* LEFT HUD: Scientific Data */}
                <div className="absolute left-12 top-1/2 -translate-y-24 flex flex-col gap-8 z-10 w-80">
                    <Bracket side="left" colorClass={borderColorClass}>
                        <h3 className={`${DS.text.label} ${mainColorClass} mb-4 border-b border-${themeColor}-900/50 pb-2`}>
                            {t('ATMOSPHERIC_BREAKDOWN')}
                        </h3>
                        <div className="space-y-3">
                            {planet.atmosphere.map(gas => (
                                <div key={gas.id} className="relative">
                                    <div className="flex justify-between text-xs mb-1 relative z-10">
                                        <span className="text-slate-300 font-bold drop-shadow-md" style={{color: gas.color}}>{t(`GAS_${gas.id}_NAME`)}</span>
                                        <span className="font-mono text-white">{(gas.percentage * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900/80 rounded-sm overflow-hidden border border-slate-700">
                                        <div className="h-full shadow-[0_0_10px_currentColor]" style={{width: `${gas.percentage * 100}%`, backgroundColor: gas.color}}></div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 opacity-80">{t(`GAS_${gas.id}_DESC`)}</div>
                                </div>
                            ))}
                        </div>
                    </Bracket>

                    <div className="flex gap-4 pl-4">
                        <HexStat 
                            label={t('GENE_MODIFIER')} 
                            value={`x${planet.geneStrength.toFixed(2)}`} 
                            color={planet.geneStrength > 2 ? 'red' : 'purple'} 
                        />
                        <HexStat 
                            label={t('SULFUR_INDEX')} 
                            value={planet.sulfurIndex.toString()} 
                            sub="/ 10"
                            color={planet.sulfurIndex > 5 ? 'yellow' : 'emerald'} 
                        />
                    </div>
                </div>

                {/* RIGHT HUD: Tactical Data */}
                <div className="absolute right-12 top-1/2 -translate-y-24 flex flex-col gap-8 z-10 w-80 items-end text-right">
                    <Bracket side="right" colorClass={borderColorClass} className="w-full">
                        <h3 className={`${DS.text.label} ${mainColorClass} mb-4 border-b border-${themeColor}-900/50 pb-2`}>
                            {t('TACTICAL_ASSESSMENT')}
                        </h3>
                        
                        <div className="mb-6">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t('MISSION_OBJ')}</div>
                            <div className={`text-2xl font-black uppercase tracking-wide text-white drop-shadow-md ${isOffense ? 'text-red-100' : 'text-cyan-100'}`}>
                                {isOffense ? t('MISSION_ASSAULT') : t('CMD_DEFEND')}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-2 leading-relaxed">
                                {isOffense ? t('MANUAL_OFFENSE_DESC') : t('MANUAL_DEFENSE_DESC')}
                            </p>
                        </div>

                        <div className="bg-black/40 p-4 border-r-2 border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 font-bold">{t('THREAT_LEVEL')}</span>
                                <div className="flex gap-1">
                                    {Array.from({length: 5}).map((_,i) => (
                                        <div key={i} className={`w-1.5 h-3 ${i < (planet.landingDifficulty/6) ? 'bg-red-500' : 'bg-slate-800'}`}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold">{t('RESOURCE_DENSITY')}</span>
                                <span className="text-yellow-400 font-mono font-bold">
                                    {t(planet.landingDifficulty > 20 ? 'HIGH' : planet.landingDifficulty > 10 ? 'MEDIUM' : 'LOW')}
                                </span>
                            </div>
                        </div>
                    </Bracket>
                </div>

                {/* BOTTOM: Launch Console (Redesigned Glass) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[600px] flex flex-col items-center">
                    
                    {/* Vertical Link */}
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-white/50 mb-0"></div>
                    
                    {/* Main Console Container */}
                    <div className="w-full bg-slate-900/40 backdrop-blur-2xl border-t border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden relative group">
                        
                        {/* Top Glow Edge */}
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

                        {planet.completed ? (
                            <div className="p-6 flex flex-col items-center gap-4">
                                <div className="text-emerald-400 font-black text-2xl tracking-widest uppercase flex items-center gap-3">
                                    <span className="text-3xl"><Icons.Lock /></span> {t('SECTOR_PACIFIED')}
                                </div>
                                <CyberButton 
                                    onClick={onOpenConstruction}
                                    variant="yellow"
                                    className="w-64 py-3"
                                    label={t('PC_BTN')}
                                    icon={<div className="w-6 h-6"><Icons.Crane /></div>}
                                />
                            </div>
                        ) : (
                            <div className="p-6 flex justify-between items-center gap-8">
                                <div className="flex-1 text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t('DROP_COST')}</div>
                                    <div className={`text-4xl font-mono font-bold tracking-tighter ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>
                                        {dropCost} <span className="text-sm text-yellow-700">BIO</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-1">RESERVES: {Math.floor(currentScraps)}</div>
                                </div>

                                {/* Divider */}
                                <div className="w-px h-12 bg-white/10"></div>

                                <div className="flex-1">
                                    <CyberButton 
                                        onClick={onDeploy}
                                        disabled={!canAfford}
                                        variant={themeColor}
                                        className={`w-full py-4 text-lg font-black tracking-widest shadow-lg ${canAfford ? 'shadow-cyan-500/20' : ''}`}
                                        label={canAfford ? t('INITIATE_DROP') : t('INSUFFICIENT_FUNDS')}
                                        icon={
                                            canAfford 
                                                ? <div className="w-6 h-6 animate-bounce"><Icons.DropPod /></div> 
                                                : <div className="w-5 h-5 opacity-50"><Icons.Lock /></div>
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Bottom Decorative Text */}
                    <div className="text-[9px] text-slate-500 font-mono mt-3 tracking-[0.5em] uppercase opacity-50">
                        Orbital Trajectory Locked
                    </div>
                </div>

            </div>
        </div>
    );
};
