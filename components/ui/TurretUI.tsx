
import React, { useCallback } from 'react';
import { TurretType, GameEventType, DefenseUpgradeTurretEvent, StatId, ModifierType, Turret } from '../../types';
import { TURRET_COSTS, TURRET_STATS, TURRET_RETROFIT_COSTS } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { CloseButton } from './Shared';
import { CanvasView } from './common/CanvasView';
import { drawTurret } from '../../utils/renderers';

const TurretPreview: React.FC<{ type: TurretType, color: string }> = ({ type, color }) => {
    const handleDraw = useCallback((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
        ctx.clearRect(0, 0, w, h);
        
        // Mock Turret for visualization
        const t: Turret = {
            id: 'preview',
            type: type,
            level: 2,
            x: 0, y: 0, // Drawn at origin after translate
            radius: 15,
            angle: -Math.PI / 2, // Facing Up
            color: '#fff',
            hp: 100, maxHp: 100,
            damage: 0, range: 0, fireRate: 0, lastFireTime: 0
        };

        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.scale(2.5, 2.5); // Scale up for visibility
        
        // Draw decorative ring
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}33`; // Low opacity hex
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Manual Rotation required because drawTurret now expects context to be rotated
        ctx.rotate(t.angle);

        // Draw Turret
        drawTurret(ctx, t, time, false);
        
        ctx.restore();
    }, [type, color]);

    return <CanvasView width={140} height={140} draw={handleDraw} className="pointer-events-none" />;
};

const StatBadge: React.FC<{ label: string, value: string | number, color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col items-center bg-black/40 p-2 rounded border border-white/5 w-full">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
    </div>
);

export const TurretUpgradeUI: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const turretId = state.activeTurretId;
    
    if (turretId === undefined) return null;
    const spot = state.turretSpots[turretId];
    if (!spot || !spot.builtTurret) return null;

    const currentTurret = spot.builtTurret;
    const isRetrofit = currentTurret.level === 2;

    const handleConfirmUpgrade = (type: TurretType) => {
        engine.eventBus.emit<DefenseUpgradeTurretEvent>(GameEventType.DEFENSE_UPGRADE_TURRET, { type });
    };

    const handleClose = () => {
        engine.eventBus.emit(GameEventType.DEFENSE_CLOSE_MENU, {});
    };

    // Calculate dynamic stats for preview
    const getCalculatedStats = (type: TurretType) => {
        const base = TURRET_STATS[type];
        const stats = engine.statManager;

        // HP
        const hp = stats.get(StatId.TURRET_HP, base.hp);

        // Damage
        let dmg = stats.get(StatId.TURRET_DAMAGE_GLOBAL, base.damage);
        if (type === TurretType.MISSILE) dmg = stats.get(StatId.TURRET_MISSILE_DAMAGE, dmg);

        // Range
        let range = base.range;
        if (type === TurretType.SNIPER) range = stats.get(StatId.TURRET_SNIPER_RANGE, range);

        // Fire Rate
        let rateMult = 1.0;
        const rateBonus = stats.get(StatId.TURRET_RATE_GLOBAL, 0); 
        rateMult = 1 + rateBonus; 
        
        if (type === TurretType.GAUSS) {
            const gaussBonus = stats.get(StatId.TURRET_GAUSS_RATE, 0);
            rateMult *= (1 + gaussBonus);
        }

        const rate = base.fireRate / rateMult;

        return {
            hp: Math.floor(hp),
            damage: Math.floor(dmg),
            range: range > 2000 ? "GLOBAL" : Math.floor(range),
            rate: Math.floor(rate)
        };
    };

    let upgrades = [
        { 
            type: TurretType.GAUSS, 
            name: t('GAUSS_NAME'), 
            cost: isRetrofit ? TURRET_RETROFIT_COSTS[TurretType.GAUSS] : TURRET_COSTS.upgrade_gauss, 
            desc: t('GAUSS_DESC'),
            color: '#10b981', // Emerald
            textColor: 'text-emerald-400',
            borderColor: 'border-emerald-500',
            bgGradient: 'from-emerald-900/40'
        },
        { 
            type: TurretType.SNIPER, 
            name: t('SNIPER_NAME'), 
            cost: isRetrofit ? TURRET_RETROFIT_COSTS[TurretType.SNIPER] : TURRET_COSTS.upgrade_sniper, 
            desc: t('SNIPER_DESC'),
            color: '#ffffff', // White
            textColor: 'text-slate-200',
            borderColor: 'border-slate-400',
            bgGradient: 'from-slate-800/60'
        },
        { 
            type: TurretType.MISSILE, 
            name: t('MISSILE_NAME'), 
            cost: isRetrofit ? TURRET_RETROFIT_COSTS[TurretType.MISSILE] : TURRET_COSTS.upgrade_missile, 
            desc: t('MISSILE_DESC'),
            color: '#ef4444', // Red
            textColor: 'text-red-400',
            borderColor: 'border-red-500',
            bgGradient: 'from-red-900/40'
        }
    ];

    // Filter out current type for Retrofit
    if (isRetrofit) {
        upgrades = upgrades.filter(u => u.type !== currentTurret.type);
    }

    return (
        <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center pointer-events-auto z-[150] backdrop-blur-sm">
            <div className="w-[1000px] bg-slate-900 border-2 border-slate-700 shadow-2xl rounded-xl relative overflow-hidden flex flex-col p-8">
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[size:40px_40px] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]"></div>
                
                <CloseButton onClick={handleClose} colorClass="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 z-20" />

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-display font-black text-white tracking-[0.2em] uppercase">
                        {t(isRetrofit ? 'SYSTEM_RETROFIT' : 'SYSTEM_UPGRADE')}
                    </h2>
                    <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 font-mono tracking-widest">{t('SELECT_MODULE')}</span>
                        <div className="h-px w-12 bg-slate-700"></div>
                        <span className="text-yellow-400 font-mono font-bold">{Math.floor(p.score)} {t('SCRAPS')}</span>
                    </div>
                </div>

                <div className={`grid ${isRetrofit ? 'grid-cols-2' : 'grid-cols-3'} gap-6 relative z-10 px-8`}>
                    {upgrades.map(u => {
                        const canAfford = p.score >= u.cost;
                        const stats = getCalculatedStats(u.type);

                        return (
                            <div 
                                key={u.type}
                                className={`
                                    relative border-2 rounded-lg flex flex-col overflow-hidden transition-all duration-300 group
                                    ${u.borderColor} bg-slate-900
                                `}
                            >
                                {/* Header Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${u.bgGradient} to-transparent h-32 pointer-events-none`}></div>

                                {/* Preview Section */}
                                <div className="h-40 flex items-center justify-center relative mt-4">
                                    <TurretPreview type={u.type} color={u.color} />
                                    <div className={`absolute bottom-0 text-sm font-black tracking-wider uppercase ${u.textColor}`}>{u.name}</div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col gap-4 bg-slate-950/30">
                                    <p className="text-[10px] text-slate-400 text-center font-mono h-8 leading-tight">{u.desc}</p>
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatBadge label={t('HEALTH')} value={stats.hp} color={u.textColor} />
                                        <StatBadge label={t('DMG')} value={stats.damage} color={u.textColor} />
                                        <StatBadge label={t('RNG')} value={stats.range} color="text-white" />
                                        <StatBadge label={t('SPD')} value={`${stats.rate}ms`} color="text-yellow-400" />
                                    </div>

                                    {/* Footer Action */}
                                    <button
                                        onClick={() => handleConfirmUpgrade(u.type)}
                                        disabled={!canAfford}
                                        className={`
                                            w-full py-3 mt-auto font-black text-sm tracking-[0.2em] uppercase transition-all
                                            ${canAfford 
                                                ? `bg-white text-black hover:bg-${u.color === '#ffffff' ? 'gray-300' : u.color.replace('#','')} hover:text-white`
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                        `}
                                        style={canAfford && u.color !== '#ffffff' ? { backgroundColor: u.color } : {}}
                                    >
                                        {canAfford ? `${u.cost}` : t('NO_FUNDS')}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="text-center mt-6 text-[10px] text-slate-600 font-mono">
                    {t('CANCEL_HINT')}
                </div>
            </div>
        </div>
    )
};
