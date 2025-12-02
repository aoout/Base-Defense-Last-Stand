
import { 
    Player, Enemy, Turret, Ally, Projectile, TerrainFeature, BloodStain, ToxicZone, Planet, TurretSpot,
    WeaponType, EnemyType, BossType, TurretType, BiomeType, GameMode, GameState, PlanetVisualType, TerrainType,
    MissionType, OrbitalBeam, FloatingText, FloatingTextType
} from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { ENEMY_STATS, BOSS_STATS, WEAPONS } from '../data/registry';
import { BIOME_STYLES } from '../data/world';

const pRand = (seed: number) => {
    return Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
};

export const drawTerrain = (ctx: CanvasRenderingContext2D, terrain: TerrainFeature[], gameMode: GameMode, planet: Planet | null) => {
    let style = BIOME_STYLES[BiomeType.BARREN];
    if (gameMode === GameMode.EXPLORATION && planet) {
        style = BIOME_STYLES[planet.biome] || BIOME_STYLES[BiomeType.BARREN];
    }

    ctx.fillStyle = style.groundColor; 
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<WORLD_WIDTH; i+=200) { ctx.moveTo(i,0); ctx.lineTo(i, WORLD_HEIGHT); }
    for(let i=0; i<WORLD_HEIGHT; i+=200) { ctx.moveTo(0,i); ctx.lineTo(WORLD_WIDTH, i); }
    ctx.stroke();

    terrain.forEach((t, idx) => {
        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.rotation) ctx.rotate(t.rotation);
        
        const seed = t.x * t.y + idx;

        if (t.type === TerrainType.DUST) {
            ctx.fillStyle = t.color || style.dustColor; 
            ctx.globalAlpha = t.opacity || 0.2;
            ctx.beginPath(); 
            const r = t.radius;
            ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (t.type === TerrainType.ROCK) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            if (t.points) {
                ctx.moveTo(t.points[0].x + 5, t.points[0].y + 5);
                t.points.forEach(p => ctx.lineTo(p.x + 5, p.y + 5));
            } else {
                ctx.arc(4, 4, t.radius, 0, Math.PI*2);
            }
            ctx.fill();

            ctx.fillStyle = t.color || style.rockColor; 
            ctx.beginPath();
            if (t.points) {
                ctx.moveTo(t.points[0].x, t.points[0].y);
                t.points.forEach(p => ctx.lineTo(p.x, p.y));
            } else {
                ctx.arc(0, 0, t.radius, 0, Math.PI*2);
            }
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255,255,255,0.05)'; 
            ctx.beginPath();
             if (t.points) {
                ctx.arc(0, 0, t.radius * 0.3, 0, Math.PI*2);
            } else {
                ctx.arc(-t.radius*0.3, -t.radius*0.3, t.radius*0.4, 0, Math.PI*2);
            }
            ctx.fill();
        } 
        else if (t.type === TerrainType.CRATER) {
            ctx.fillStyle = style.craterColor; 
            ctx.globalAlpha = t.opacity || 0.6;
            ctx.beginPath(); ctx.arc(0, 0, t.radius, 0, Math.PI * 2); ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, t.radius, 0, Math.PI * 2); ctx.stroke();
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.arc(2, 2, t.radius * 0.8, 0, Math.PI*2); ctx.fill();
        }
        else if (t.type === TerrainType.MAGMA_POOL) {
            const pulse = Math.sin(Date.now() * 0.002 + idx) * 0.05 + 1;
            
            const grad = ctx.createRadialGradient(0,0, t.radius * 0.2, 0,0, t.radius);
            grad.addColorStop(0, '#fef08a'); 
            grad.addColorStop(0.4, '#ef4444'); 
            grad.addColorStop(1, 'rgba(69, 10, 10, 0)'); 
            
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.9;
            
            ctx.beginPath();
            const segments = 12;
            for(let i=0; i<=segments; i++) {
                const angle = (i/segments)*Math.PI*2;
                const offset = Math.sin(angle * 4 + seed) * 5 * pulse;
                const r = t.radius + offset;
                ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
            }
            ctx.fill();
            
            const bubbleTime = Date.now() * 0.001;
            for(let j=0; j<3; j++) {
                const bx = Math.sin(bubbleTime + j + seed) * t.radius * 0.5;
                const by = Math.cos(bubbleTime * 0.8 + j + seed) * t.radius * 0.5;
                const br = 2 + Math.sin(bubbleTime * 2 + j) * 1;
                if (br > 0) {
                    ctx.fillStyle = '#fef9c3';
                    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill();
                }
            }
        }
        else if (t.type === TerrainType.ICE_SPIKE) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(4, -t.radius + 4);
            ctx.lineTo(t.radius * 0.4 + 4, t.radius * 0.2 + 4);
            ctx.lineTo(-t.radius * 0.4 + 4, t.radius * 0.2 + 4);
            ctx.fill();

            const grad = ctx.createLinearGradient(0, -t.radius, 0, t.radius*0.2);
            grad.addColorStop(0, '#e0f2fe'); 
            grad.addColorStop(1, '#0ea5e9'); 
            ctx.fillStyle = grad;
            
            ctx.beginPath();
            ctx.moveTo(0, -t.radius);
            ctx.lineTo(t.radius * 0.35, t.radius * 0.2);
            ctx.lineTo(-t.radius * 0.35, t.radius * 0.2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(0, -t.radius);
            ctx.lineTo(t.radius * 0.1, t.radius * 0.2);
            ctx.lineTo(-t.radius * 0.35, t.radius * 0.2);
            ctx.fill();
        }
        else if (t.type === TerrainType.ALIEN_TREE) {
            ctx.fillStyle = '#4a044e'; 
            ctx.beginPath();
            ctx.moveTo(-3, 0); ctx.lineTo(-2, -t.radius); ctx.lineTo(2, -t.radius); ctx.lineTo(3, 0);
            ctx.fill();
            
            const pulse = Math.sin(Date.now() * 0.001 + seed) * 0.05 + 1;
            ctx.fillStyle = t.variant === 0 ? '#15803d' : t.variant === 1 ? '#be123c' : '#7e22ce';
            ctx.beginPath();
            ctx.arc(0, -t.radius, t.radius * 0.7 * pulse, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.arc(-3, -t.radius-3, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, -t.radius+2, 1.5, 0, Math.PI*2); ctx.fill();
        }
        else if (t.type === TerrainType.CRYSTAL) {
            ctx.fillStyle = 'rgba(216, 180, 254, 0.4)';
            ctx.beginPath();
            ctx.moveTo(0, -t.radius);
            ctx.lineTo(t.radius*0.5, 0);
            ctx.lineTo(0, t.radius);
            ctx.lineTo(-t.radius*0.5, 0);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, -t.radius*0.5, 2, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        else if (t.type === TerrainType.SPORE_POD) {
            const pulse = (Math.sin(Date.now() * 0.003 + seed) + 1) * 0.5;
            ctx.fillStyle = '#365314'; 
            ctx.beginPath(); ctx.arc(0, 0, t.radius, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = `rgba(132, 204, 22, ${pulse})`; 
            ctx.beginPath(); ctx.arc(0, 0, t.radius * 0.4, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    });

    if (style.atmosphereColor !== 'rgba(0,0,0,0)') {
        ctx.fillStyle = style.atmosphereColor;
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }
}

export const drawBloodStains = (ctx: CanvasRenderingContext2D, stains: BloodStain[]) => {
    stains.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        const opacity = Math.min(0.7, s.life / 1000); 
        ctx.globalAlpha = opacity;
        ctx.fillStyle = s.color;
        s.blotches.forEach(b => {
             ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
    });
};

export const drawToxicZones = (ctx: CanvasRenderingContext2D, zones: ToxicZone[], time: number) => {
    zones.forEach(zone => {
        ctx.save();
        ctx.translate(zone.x, zone.y);
        const scale = 1 + Math.sin(time * 0.005 + parseInt(zone.id)) * 0.05;
        
        const grad = ctx.createRadialGradient(0,0, 0, 0,0, zone.radius * scale);
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
        grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.4)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, zone.radius * scale, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#DDD6FE';
        for (let i = 0; i < 5; i++) {
             const r = zone.radius * 0.8 * Math.random();
             const theta = Math.random() * Math.PI * 2;
             const size = 3 + Math.sin(time * 0.01 + i) * 2;
             ctx.beginPath(); ctx.arc(Math.cos(theta) * r, Math.sin(theta) * r, size, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });
}

const drawAR = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#374151'; ctx.fillRect(-10, -3, 8, 6);
    ctx.fillStyle = '#1F2937'; ctx.fillRect(-2, -4, 16, 8);
    ctx.fillStyle = '#4B5563'; ctx.fillRect(14, -2, 12, 4);
    ctx.fillStyle = '#111827'; ctx.fillRect(4, 2, 4, 8);
    ctx.fillStyle = '#9CA3AF'; ctx.fillRect(2, -6, 2, 2); ctx.fillRect(24, -5, 1, 3);
};
const drawSG = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#374151'; ctx.fillRect(-10, -3, 6, 6);
    ctx.fillStyle = '#1F2937'; ctx.fillRect(-4, -4, 14, 8);
    ctx.fillStyle = '#4B5563'; ctx.fillRect(10, -3, 16, 6);
    ctx.fillStyle = '#111827'; ctx.fillRect(14, 1, 8, 4);
};
const drawSR = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#4B5563'; ctx.fillRect(-12, -3, 10, 6);
    ctx.fillStyle = '#1F2937'; ctx.fillRect(-2, -4, 14, 8);
    ctx.fillStyle = '#374151'; ctx.fillRect(12, -2, 30, 4);
    ctx.fillStyle = '#111827'; ctx.fillRect(0, -7, 12, 3);
    ctx.fillStyle = '#EF4444'; ctx.fillRect(0, -7, 2, 3);
};
const drawPistol = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#4B5563'; ctx.fillRect(5, -3, 10, 6);
    ctx.fillStyle = '#1F2937'; ctx.fillRect(5, -4, 10, 2);
};
const drawFlamethrower = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#C2410C'; ctx.beginPath(); ctx.arc(-5, -6, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(-5, 6, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4B5563'; ctx.fillRect(0, -4, 18, 8);
    ctx.fillStyle = '#1F2937'; ctx.fillRect(18, -3, 6, 6);
    ctx.fillStyle = '#3B82F6'; ctx.beginPath(); ctx.arc(24, 1, 2, 0, Math.PI*2); ctx.fill();
};
const drawPulseRifle = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#F3F4F6'; ctx.fillRect(-5, -4, 20, 8);
    ctx.fillStyle = '#06B6D4'; ctx.fillRect(0, -2, 18, 1); ctx.fillRect(0, 1, 18, 1);
    ctx.fillStyle = '#0E7490'; ctx.fillRect(15, -3, 4, 6);
};
const drawGL = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#374151'; ctx.beginPath(); ctx.arc(5, 0, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1F2937'; ctx.fillRect(-10, -4, 10, 8);
    ctx.fillStyle = '#4B5563'; ctx.fillRect(10, -5, 12, 10);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(22, 0, 2, 5, 0, 0, Math.PI*2); ctx.fill();
};

const drawMuzzleFlash = (ctx: CanvasRenderingContext2D, type: WeaponType) => {
    ctx.fillStyle = '#FEF08A'; ctx.shadowColor = '#F59E0B'; ctx.shadowBlur = 10;
    let xOffset = 26;
    if (type === WeaponType.SR) xOffset = 42;
    if (type === WeaponType.PISTOL) xOffset = 15;
    if (type === WeaponType.PULSE_RIFLE) { ctx.fillStyle = '#67E8F9'; ctx.shadowColor = '#06B6D4'; }
    const size = type === WeaponType.SG ? 12 : 8;
    ctx.beginPath(); ctx.moveTo(xOffset, 0); ctx.lineTo(xOffset + size, -size/2); ctx.lineTo(xOffset + size*0.8, 0); ctx.lineTo(xOffset + size, size/2);
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
};

export const drawPlayerSprite = (ctx: CanvasRenderingContext2D, p: Player, time: number, isMoving: boolean) => {
    const stride = isMoving ? Math.sin(time * 0.015) * 4 : 0;
    ctx.fillStyle = '#111827'; 
    ctx.beginPath(); ctx.ellipse(-5 + stride, -10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.ellipse(-5 - stride, 10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); 

    ctx.fillStyle = '#1D4ED8'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1E3A8A'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -11, 6, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 11, 6, 8, 0, 0, Math.PI*2); ctx.fill(); 

    ctx.fillStyle = '#2563EB'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#93C5FD'; ctx.shadowColor = '#60A5FA'; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.ellipse(4, 0, 4, 7, 0, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    const weaponState = p.weapons[currentWeaponType];
    const isFiring = time - weaponState.lastFireTime < 50;
    const recoil = isFiring ? -2 : 0;

    ctx.save();
    ctx.translate(10 + recoil, 0);
    switch(currentWeaponType) {
        case WeaponType.AR: drawAR(ctx); break;
        case WeaponType.SG: drawSG(ctx); break;
        case WeaponType.SR: drawSR(ctx); break;
        case WeaponType.PISTOL: drawPistol(ctx); break;
        case WeaponType.FLAMETHROWER: drawFlamethrower(ctx); break;
        case WeaponType.PULSE_RIFLE: drawPulseRifle(ctx); break;
        case WeaponType.GRENADE_LAUNCHER: drawGL(ctx); break;
    }
    
    ctx.fillStyle = '#1F2937'; 
    if (currentWeaponType === WeaponType.PISTOL) { ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill(); } 
    else { ctx.beginPath(); ctx.arc(0, 5, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(15, -2, 4, 0, Math.PI*2); ctx.fill(); }

    if (isFiring && currentWeaponType !== WeaponType.FLAMETHROWER) { drawMuzzleFlash(ctx, currentWeaponType); }
    ctx.restore();

    ctx.rotate(-p.angle);
    
    const hpPct = Math.max(0, p.hp / p.maxHp);
    const armorPct = Math.max(0, p.armor / p.maxArmor);
    
    const barWidth = 40;
    const barYOffset = 30; 
    const barHeight = 4;
    const spacing = 2;

    const wepStats = WEAPONS[currentWeaponType];
    if (currentWeaponType !== WeaponType.PISTOL) {
        const ammoPct = weaponState.ammoInMag / wepStats.magSize;
        ctx.fillStyle = weaponState.reloading ? '#f59e0b' : '#3b82f6';
        ctx.fillRect(-barWidth/2, barYOffset - 3, barWidth * ammoPct, 1);
    }

    let hpColor = '#10b981'; 
    if (hpPct < 0.6) hpColor = '#eab308'; 
    if (hpPct < 0.3) hpColor = '#ef4444'; 

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barWidth/2 - 1, barYOffset, barWidth + 2, barHeight + (p.maxArmor > 0 ? barHeight + spacing : 0) + 2);

    ctx.fillStyle = hpColor;
    ctx.fillRect(-barWidth/2, barYOffset + 1, barWidth * hpPct, barHeight);

    if (p.maxArmor > 0) {
        const armorY = barYOffset + 1 + barHeight + spacing;
        const totalSegments = 10;
        const activeSegments = Math.ceil(totalSegments * armorPct);
        const segWidth = (barWidth - (totalSegments - 1)) / totalSegments; 

        ctx.fillStyle = '#22d3ee'; 
        for(let i=0; i<activeSegments; i++) {
            const x = -barWidth/2 + (i * (barWidth / totalSegments));
            const w = (barWidth / totalSegments) - 1;
            ctx.fillRect(x, armorY, w, barHeight);
        }
    }
};

export const drawAllySprite = (ctx: CanvasRenderingContext2D, ally: Ally, time: number, isMoving: boolean) => {
    const stride = isMoving ? Math.sin(time * 0.015) * 4 : 0;
    ctx.fillStyle = '#1F2937'; 
    ctx.beginPath(); ctx.ellipse(-5 + stride, -10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.ellipse(-5 - stride, 10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); 

    ctx.fillStyle = '#60A5FA'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2563EB'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#93C5FD'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1E40AF'; ctx.beginPath(); ctx.ellipse(3, 0, 3, 6, 0, 0, Math.PI*2); ctx.fill();

    const isFiring = time - ally.lastFireTime < 50;
    const recoil = isFiring ? -2 : 0;

    ctx.save();
    ctx.translate(8 + recoil, 0);
    ctx.fillStyle = '#374151'; ctx.fillRect(-2, -3, 14, 6);
    ctx.fillStyle = '#111827'; ctx.fillRect(12, -2, 8, 4);
    ctx.fillStyle = '#1F2937'; ctx.beginPath(); ctx.arc(0, 4, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -1, 3, 0, Math.PI*2); ctx.fill(); 
    if (isFiring) {
        ctx.fillStyle = '#FEF9C3'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(28, -4); ctx.lineTo(26, 0); ctx.lineTo(28, 4); ctx.fill();
    }
    ctx.restore();
};

export const drawTurretSpot = (ctx: CanvasRenderingContext2D, spot: TurretSpot, time: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 15, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
    const pulse = (Math.sin(time * 0.005) + 1) * 0.5;
    ctx.fillStyle = `rgba(16, 185, 129, ${pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 10, 0, Math.PI*2);
    ctx.fill();
}

const drawCloneCenter = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 25, y - 25, 50, 50);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 25, y - 25, 50, 50);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(x - 15, y - 15, 30, 30);
    const liquidLevel = Math.sin(time * 0.002) * 2;
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.rect(x - 15, y - 5 + liquidLevel, 30, 20 - liquidLevel);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x - 15, y - 15, 30, 10);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 28, y - 10, 3, 20); 
    ctx.fillRect(x + 25, y - 10, 3, 20); 
    const pulse = Math.sin(time * 0.005) > 0;
    ctx.fillStyle = pulse ? '#22c55e' : '#14532d';
    ctx.beginPath(); ctx.arc(x, y - 20, 2, 0, Math.PI*2); ctx.fill();
};

export const drawBase = (ctx: CanvasRenderingContext2D, base: { x: number, y: number, width: number, height: number, hp: number, maxHp: number }) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(base.x - base.width/2, base.y - base.height/2, base.width, base.height);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(base.x - base.width/2 - 5, base.y - base.height/2 - 5, 20, 20);
    ctx.fillRect(base.x + base.width/2 - 15, base.y - base.height/2 - 5, 20, 20);
    ctx.fillRect(base.x - base.width/2 - 5, base.y + base.height/2 - 15, 20, 20);
    ctx.fillRect(base.x + base.width/2 - 15, base.y + base.height/2 - 15, 20, 20);
    ctx.fillStyle = '#172554';
    ctx.fillRect(base.x - base.width/2 + 10, base.y - base.height/2 + 10, base.width - 20, base.height - 20);
    ctx.fillStyle = '#2563EB';
    ctx.beginPath(); ctx.arc(base.x, base.y, 20, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#60A5FA'; ctx.lineWidth = 2; ctx.stroke();

    const time = Date.now();
    drawCloneCenter(ctx, base.x - base.width/2 - 35, base.y, time); 
    drawCloneCenter(ctx, base.x + base.width/2 + 35, base.y, time); 

    const bHpPct = base.hp / base.maxHp;
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(base.x - base.width/2, base.y - base.height/2 - 15, base.width, 6);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(base.x - base.width/2, base.y - base.height/2 - 15, base.width * bHpPct, 6);
}

export const drawTurret = (ctx: CanvasRenderingContext2D, t: Turret, time: number) => {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = '#064E3B'; 
    for(let i=0; i<3; i++) { ctx.save(); ctx.rotate(i * (Math.PI * 2 / 3)); ctx.fillRect(5, -2, 12, 4); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();

    ctx.rotate(t.angle);
    const isFiring = time - t.lastFireTime < 60;
    const recoil = isFiring ? -3 : 0;
    const flash = isFiring;

    if (t.level === 1 || t.type === TurretType.GAUSS) {
        ctx.save(); ctx.translate(recoil, 0);
        ctx.fillStyle = t.type === TurretType.GAUSS ? '#047857' : '#059669'; ctx.fillRect(-8, -8, 16, 16);
        const spin = isFiring ? time * 0.5 : 0;
        ctx.fillStyle = '#374151'; 
        for(let i=0; i<3; i++) { const yOff = Math.sin(spin + i*2) * 3; ctx.fillRect(8, yOff-1.5, 14, 3); }
        ctx.fillStyle = '#065F46'; ctx.fillRect(-8, -12, 10, 4);
        if (flash) { ctx.fillStyle = '#FEF9C3'; ctx.beginPath(); ctx.arc(25, 0, 8 + Math.random()*4, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    } else if (t.type === TurretType.SNIPER) {
        ctx.save(); ctx.translate(recoil, 0);
        ctx.fillStyle = '#1F2937'; ctx.fillRect(-8, -6, 20, 12);
        ctx.fillStyle = '#374151'; ctx.fillRect(12, -3, 30, 6);
        ctx.fillStyle = '#4B5563'; ctx.fillRect(12, -3, 30, 6);
        if (flash) { ctx.fillStyle = '#FEF9C3'; ctx.shadowColor = '#FDE047'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(60, -2); ctx.lineTo(60, 2); ctx.fill(); ctx.shadowBlur = 0; }
        ctx.restore();
    } else if (t.type === TurretType.MISSILE) {
        ctx.fillStyle = '#1F2937'; ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(-8, -12, 4, 8); ctx.fillRect(4, -12, 4, 8);
        ctx.fillRect(-8, 4, 4, 8); ctx.fillRect(4, 4, 4, 8);
    }
    
    ctx.restore();
};

export const drawProjectile = (ctx: CanvasRenderingContext2D, p: Projectile) => {
    if (p.isHoming) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -3); ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FBBF24'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -2); ctx.lineTo(-8, 2); ctx.fill();
        ctx.restore();
    } else if (p.createsToxicZone) {
        ctx.fillStyle = '#A855F7'; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        if (Math.random() < 0.3) { ctx.fillStyle = '#D8B4FE'; ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI*2); ctx.fill(); }
    } else if (p.weaponType === WeaponType.FLAMETHROWER) {
         const maxRange = p.maxRange || 350;
         const lifePct = (maxRange - p.rangeRemaining) / maxRange;
         const currentRadius = 3 + lifePct * 12;
         let color = 'rgba(255, 255, 255, 0.8)';
         if (lifePct > 0.1) color = 'rgba(255, 230, 0, 0.8)'; 
         if (lifePct > 0.3) color = 'rgba(255, 100, 0, 0.7)'; 
         if (lifePct > 0.6) color = 'rgba(200, 20, 20, 0.5)'; 
         if (lifePct > 0.8) color = 'rgba(50, 50, 50, 0.3)'; 
         ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*2, p.y - p.vy*2); ctx.strokeStyle = p.color; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1.0;
    }
}

// ... [Keep existing Enemy renderers] ...
// ... [drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother] ...
export const drawGrunt = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const wiggle = Math.sin(time * 0.02) * 2;
    const breathe = Math.sin(time * 0.005) * 1;

    ctx.strokeStyle = '#5c2b2b'; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const legPairs = [
        { x: -2, y: -4, reachX: -8, reachY: -16 }, 
        { x: 2, y: -4, reachX: 4, reachY: -18 },   
        { x: 6, y: -3, reachX: 14, reachY: -14 },  
        { x: -2, y: 4, reachX: -8, reachY: 16 },   
        { x: 2, y: 4, reachX: 4, reachY: 18 },     
        { x: 6, y: 3, reachX: 14, reachY: 14 },    
    ];

    legPairs.forEach((leg, i) => {
        const isLeft = leg.reachY < 0;
        const move = isLeft ? wiggle : -wiggle;
        const kneeX = (leg.x + leg.reachX) / 2;
        const kneeY = (leg.y + leg.reachY) / 2 - (isLeft ? 5 : -5); 

        ctx.beginPath();
        ctx.moveTo(leg.x, leg.y);
        ctx.quadraticCurveTo(kneeX, kneeY, leg.reachX + (i%3===0 ? move : -move), leg.reachY);
        ctx.stroke();
    });

    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(-6, 0, 9, 7 + breathe, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(-12, 0); ctx.lineTo(-2, 0); ctx.stroke(); 

    ctx.fillStyle = '#7f1d1d'; 
    ctx.beginPath();
    ctx.ellipse(3, 0, 7, 6, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-2, -4); ctx.lineTo(8, -3); ctx.lineTo(8, 3); ctx.lineTo(-2, 4);
    ctx.fill();

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(10, 0, 5, 4, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = '#1a0505'; 
    ctx.lineWidth = 2;
    const bite = Math.sin(time * 0.015) * 2;
    ctx.beginPath();
    ctx.moveTo(12, -2); ctx.lineTo(18, -4 + bite); ctx.lineTo(16, -1);
    ctx.stroke();
    ctx.moveTo(12, 2); ctx.lineTo(18, 4 - bite); ctx.lineTo(16, 1);
    ctx.stroke();

    ctx.fillStyle = '#fca5a5'; 
    ctx.beginPath(); ctx.arc(11, -2, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, 2, 1.5, 0, Math.PI*2); ctx.fill();
}

export const drawRusher = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const enginePulse = Math.sin(time * 0.05);

    ctx.fillStyle = 'rgba(217, 119, 6, 0.3)'; 
    ctx.beginPath(); 
    ctx.moveTo(-5, 0); 
    ctx.lineTo(-25 - enginePulse*5, -8); 
    ctx.lineTo(-20, 0);
    ctx.lineTo(-25 - enginePulse*5, 8); 
    ctx.fill();

    const grad = ctx.createLinearGradient(-10, 0, 15, 0); 
    grad.addColorStop(0, '#7c2d12'); grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.quadraticCurveTo(5, 7, -10, 4); 
    ctx.lineTo(-12, 0);
    ctx.quadraticCurveTo(5, -7, 15, 0); 
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.moveTo(5, 3); ctx.lineTo(12, 12); ctx.lineTo(20, 6); 
    ctx.moveTo(5, -3); ctx.lineTo(12, -12); ctx.lineTo(20, -6); 
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-2, -5); ctx.lineTo(1, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3, 5); ctx.lineTo(6, 0); ctx.fill();

    ctx.fillStyle = '#10b981'; 
    ctx.beginPath(); ctx.arc(12, -2, 1.5, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(12, 2, 1.5, 0, Math.PI*2); ctx.fill(); 
}

export const drawTank = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const walkOffset = Math.sin(time * 0.005) * 2;
    
    ctx.strokeStyle = '#111827'; 
    ctx.lineWidth = 6; 
    ctx.lineCap = 'round';
    for(let i=0; i<4; i++) { 
        const angle = Math.PI/4 + (i * Math.PI/6); 
        const legX = Math.cos(angle) * 20;
        const legY = Math.sin(angle) * 20;
        
        ctx.beginPath(); 
        ctx.moveTo(5, 5); 
        ctx.lineTo(legX + walkOffset, legY + walkOffset); 
        ctx.stroke();
        
        ctx.beginPath(); 
        ctx.moveTo(5, -5); 
        ctx.lineTo(legX + walkOffset, -legY - walkOffset); 
        ctx.stroke(); 
    }

    ctx.fillStyle = '#1f2937'; 
    ctx.beginPath(); ctx.arc(-5, 0, 20, 0, Math.PI*2); ctx.fill(); 
    
    ctx.fillStyle = '#374151'; 
    ctx.beginPath(); ctx.arc(5, 0, 18, 0, Math.PI*2); ctx.fill(); 
    ctx.stroke();

    ctx.fillStyle = '#4b5563'; 
    ctx.beginPath(); ctx.arc(12, 0, 14, 0, Math.PI*2); ctx.fill(); 
    ctx.stroke();

    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath(); ctx.moveTo(18, -8); ctx.quadraticCurveTo(35, -12, 30, -2); ctx.lineTo(20, -6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, 8); ctx.quadraticCurveTo(35, 12, 30, 2); ctx.lineTo(20, 6); ctx.fill();

    ctx.fillStyle = '#ef4444'; 
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 5; 
    ctx.beginPath(); ctx.arc(20, 0, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
}

export const drawKamikaze = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const pulse = (Math.sin(time * 0.015) + 1) * 0.5; 
    const shake = Math.sin(time * 0.1) * 0.5;
    
    ctx.save(); 
    ctx.translate(shake, shake);

    const sackGrad = ctx.createRadialGradient(-5, 0, 2, -5, 0, 14); 
    sackGrad.addColorStop(0, '#e9d5ff'); 
    sackGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)'); 
    sackGrad.addColorStop(1, 'rgba(88, 28, 135, 0.9)');
    
    ctx.fillStyle = sackGrad; 
    ctx.beginPath(); 
    ctx.ellipse(-5, 0, 12 + pulse*2, 10 + pulse*2, 0, 0, Math.PI*2); 
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
    ctx.lineWidth = 1; 
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12 - pulse, -6 - pulse); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12 - pulse, 6 + pulse); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-16 - pulse, 0); ctx.stroke();

    ctx.fillStyle = '#4c1d95'; 
    ctx.beginPath(); ctx.arc(8, 0, 5, 0, Math.PI*2); ctx.fill(); 
    
    ctx.strokeStyle = '#4c1d95'; 
    ctx.lineWidth = 2; 
    const legSpeed = time * 0.05; 
    for(let i=-1; i<=1; i+=2) { 
        ctx.beginPath(); 
        ctx.moveTo(8, i*2); 
        ctx.lineTo(14, i*8 + Math.sin(legSpeed)*3); 
        ctx.stroke(); 
    }
    
    ctx.restore();
}

export const drawViper = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const flap = Math.sin(time * 0.008) * 0.5;

    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, 10, -25, 0); 
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; 
    ctx.strokeStyle = '#065f46'; 
    ctx.lineWidth = 1;
    ctx.save(); 
    ctx.scale(1, 1 + flap * 0.2); 
    ctx.beginPath(); 
    ctx.moveTo(5, 0); 
    ctx.bezierCurveTo(-5, 25, -20, 20, -15, 0); 
    ctx.bezierCurveTo(-20, -20, -5, -25, 5, 0); 
    ctx.fill(); 
    ctx.stroke(); 
    ctx.restore();

    ctx.fillStyle = '#064e3b'; 
    ctx.beginPath(); 
    ctx.moveTo(5, -4); ctx.lineTo(18, -6); ctx.lineTo(15, -2); 
    ctx.lineTo(5, 0);
    ctx.lineTo(15, 2); ctx.lineTo(18, 6); ctx.lineTo(5, 4); 
    ctx.fill();

    ctx.fillStyle = '#34d399'; 
    ctx.shadowColor = '#34d399'; ctx.shadowBlur = 5; 
    ctx.beginPath(); ctx.arc(-5, 10 + flap*5, 2, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(-5, -10 - flap*5, 2, 0, Math.PI*2); ctx.fill(); 
    ctx.shadowBlur = 0;
}

export const drawBossRed = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const pulse = Math.sin(time * 0.003) * 3;
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 4;
    for(let i=0; i<8; i++) { const angle = (Math.PI*2/8)*i + time*0.001; const len = 50 + Math.sin(time*0.005 + i)*10; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(Math.cos(angle)*len*0.5, Math.sin(angle)*len*0.5, Math.cos(angle+0.2)*len, Math.sin(angle+0.2)*len); ctx.stroke(); }
    const grad = ctx.createRadialGradient(0,0, 10, 0,0, 40); grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#450a0a'); ctx.fillStyle = grad;
    ctx.beginPath(); for(let i=0; i<=20; i++) { const a = (i/20) * Math.PI*2; const r = 35 + Math.sin(a*5 + time*0.002)*2 + pulse; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.fill();
    ctx.fillStyle = '#fee2e2'; for(let i=0; i<5; i++) { const angle = (Math.PI*2/5) * i; const x = Math.cos(angle)*20; const y = Math.sin(angle)*20; ctx.beginPath(); ctx.arc(x, y, 6 + Math.sin(time*0.01 + i)*2, 0, Math.PI*2); ctx.fill(); }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 8, 0, 0, Math.PI*2); ctx.fill();
}
export const drawBossBlue = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
    for(let i=0; i<3; i++) { const angle = time * 0.001 + (i * Math.PI*2/3); ctx.save(); ctx.rotate(angle); ctx.beginPath(); ctx.arc(50, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(40, -5); ctx.lineTo(60, 0); ctx.lineTo(40, 5); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(15, 25); ctx.lineTo(-20, 15); ctx.lineTo(-30, 0); ctx.lineTo(-20, -15); ctx.lineTo(15, -25); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.rect(10, -20, 30, 8); ctx.fill(); ctx.beginPath(); ctx.rect(10, 12, 30, 8); ctx.fill();
    const charge = Math.abs(Math.sin(time * 0.005)); ctx.fillStyle = `rgba(147, 197, 253, ${charge})`; ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.rect(35, -18, 5, 4); ctx.fill(); ctx.beginPath(); ctx.rect(35, 14, 5, 4); ctx.fill(); ctx.shadowBlur = 0;
}
export const drawBossPurple = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    ctx.fillStyle = 'rgba(88, 28, 135, 0.9)'; ctx.beginPath(); const radius = 40; for (let i = 0; i <= 30; i++) { const angle = (i / 30) * Math.PI * 2; const wobble = Math.sin(angle * 5 + time * 0.002) * 5 + Math.cos(angle * 3 - time * 0.003) * 5; const r = radius + wobble; ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r); } ctx.fill();
    ctx.fillStyle = '#d8b4fe'; for(let i=0; i<5; i++) { const bx = Math.sin(time * 0.001 * (i+1)) * 20; const by = Math.cos(time * 0.0013 * (i+1)) * 20; const s = 5 + Math.sin(time*0.005 + i)*2; ctx.beginPath(); ctx.arc(bx, by, s, 0, Math.PI*2); ctx.fill(); }
    const grad = ctx.createRadialGradient(0,0, 30, 0,0, 60); grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0,0, 60, 0, Math.PI*2); ctx.fill();
}
export const drawHiveMother = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const pulse = Math.sin(time * 0.002) * 2;
    const armor = e.armorValue || 0;
    
    const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 70);
    grad.addColorStop(0, '#f87171');
    grad.addColorStop(0.6, '#991b1b');
    grad.addColorStop(1, '#450a0a');
    
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const wobble = Math.sin(angle * 8 + time * 0.001) * 3;
        const r = 60 + wobble + pulse;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.fill();

    const armorScale = armor / 90; 
    if (armorScale > 0) {
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 4 * armorScale + 1;
        ctx.lineCap = 'round';
        
        const numPlates = 6;
        for (let i = 0; i < numPlates; i++) {
            const angle = (Math.PI * 2 / numPlates) * i + time * 0.0005;
            ctx.beginPath();
            ctx.arc(0, 0, 65, angle - 0.4 * armorScale, angle + 0.4 * armorScale);
            ctx.stroke();
        }
    }

    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.arc(0, 0, 15 + Math.sin(time * 0.01) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
        const tipX = Math.cos(angle) * (90 + Math.sin(time * 0.005 + i) * 10);
        const tipY = Math.sin(angle) * (90 + Math.sin(time * 0.005 + i) * 10);
        ctx.quadraticCurveTo(
            Math.cos(angle + 0.2) * 100, 
            Math.sin(angle + 0.2) * 100, 
            tipX, tipY
        );
        ctx.stroke();
    }
}

export const drawPlanetSprite = (ctx: CanvasRenderingContext2D, planet: Planet, x: number, y: number, radius: number, time: number, isSelected: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    
    let seed = 0;
    for(let i=0; i<planet.id.length; i++) seed += planet.id.charCodeAt(i);

    if (planet.visualType === PlanetVisualType.RINGED) {
        ctx.save();
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = radius * 0.1;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 2.2, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); 
    ctx.save();
    ctx.clip();

    ctx.fillStyle = planet.color;
    ctx.fillRect(-radius, -radius, radius*2, radius*2);

    const rot = time * 0.00002; 

    if (planet.visualType === PlanetVisualType.GAS_GIANT) {
        for(let i=0; i<5; i++) {
            const yOff = (i - 2.5) * (radius * 0.4);
            ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            for(let bx = -radius; bx <= radius; bx+=5) {
                const by = yOff + Math.sin(bx * 0.02 + rot * 5 + i + seed)*5;
                ctx.lineTo(bx, by);
            }
            ctx.lineTo(radius, radius); ctx.lineTo(-radius, radius);
            ctx.fill();
        }
    } 
    else if (planet.visualType === PlanetVisualType.LAVA) {
        const magmaGrad = ctx.createRadialGradient(-radius*0.4, -radius*0.4, 0, 0, 0, radius * 1.5);
        magmaGrad.addColorStop(0, '#fef08a'); 
        magmaGrad.addColorStop(0.5, '#f97316'); 
        magmaGrad.addColorStop(1, '#7f1d1d'); 
        ctx.fillStyle = magmaGrad;
        ctx.fillRect(-radius, -radius, radius*2, radius*2);

        ctx.fillStyle = 'rgba(20, 5, 5, 0.85)'; 
        
        for (let i = 0; i < 12; i++) {
            const plateSeed = seed + i * 100;
            const moveSpeed = 0.00005;
            const px = Math.sin(plateSeed + time * moveSpeed) * radius * 0.8;
            const py = Math.cos(plateSeed + time * moveSpeed * 0.7) * radius * 0.8;
            const plateSize = radius * (0.3 + pRand(i) * 0.4);
            
            ctx.beginPath();
            for (let j = 0; j <= 6; j++) {
                const angle = (j / 6) * Math.PI * 2;
                const deform = 1 + Math.sin(j * 2 + plateSeed) * 0.3;
                const r = plateSize * deform * 0.5;
                ctx.lineTo(px + Math.cos(angle) * r, py + Math.sin(angle) * r);
            }
            ctx.fill();
        }
        
        ctx.shadowColor = '#ea580c'; 
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke(); 
        ctx.shadowBlur = 0;
    }
    else if (planet.visualType === PlanetVisualType.TERRAN) {
        ctx.fillStyle = '#15803d'; 
        for(let i=0; i<6; i++) {
            const cx = Math.sin(rot * 1.5 + i + seed) * radius * 0.6;
            const cy = Math.cos(rot + i*1.3 + seed) * radius * 0.4;
            ctx.beginPath(); ctx.arc(cx, cy, radius * (0.3 + pRand(i+seed)*0.2), 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for(let i=0; i<8; i++) {
            const cx = Math.sin(rot * 2 + i + 10 + seed) * radius * 0.8;
            const cy = Math.cos(rot * 2.2 + i + seed) * radius * 0.6;
            ctx.beginPath(); ctx.ellipse(cx, cy, radius*0.25, radius*0.1, 0, 0, Math.PI*2); ctx.fill();
        }
    }
    else if (planet.visualType === PlanetVisualType.ICE) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-radius, -radius*0.5); ctx.lineTo(radius, radius*0.5);
        ctx.moveTo(radius*0.2, -radius); ctx.lineTo(-radius*0.2, radius);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(-radius*0.3, -radius*0.3, radius*0.4, 0, Math.PI*2); ctx.fill();
    }
    else if (planet.visualType === PlanetVisualType.BARREN) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for(let i=0; i<10; i++) {
            const cx = Math.sin(i*123 + seed) * radius * 0.6;
            const cy = Math.cos(i*321 + seed) * radius * 0.6;
            const r = radius * (0.05 + pRand(i+seed)*0.15);
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        }
    }

    const shadowGrad = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.8, 0, 0, radius * 1.5);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.6)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath(); ctx.rect(-radius, -radius, radius*2, radius*2); ctx.fill();
    ctx.restore();

    if (planet.visualType === PlanetVisualType.RINGED) {
        ctx.save();
        ctx.rotate(Math.PI / 6);
        ctx.lineWidth = radius * 0.15;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(radius * 2.2, 0);
        ctx.bezierCurveTo(radius*2.2, radius*0.8, -radius*2.2, radius*0.8, -radius*2.2, 0);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();

    if (isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const rRot = time * 0.0005;
        ctx.beginPath(); ctx.arc(x, y, radius + 8, rRot, rRot + Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        const br = radius + 15;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - br, y - br + 10); ctx.lineTo(x - br, y - br); ctx.lineTo(x - br + 10, y - br);
        ctx.moveTo(x + br - 10, y - br); ctx.lineTo(x + br, y - br); ctx.lineTo(x + br, y - br + 10);
        ctx.moveTo(x + br, y + br - 10); ctx.lineTo(x + br, y + br); ctx.lineTo(x + br - 10, y + br);
        ctx.moveTo(x - br + 10, y + br); ctx.lineTo(x - br, y + br); ctx.lineTo(x - br, y + br - 10);
        ctx.stroke();
    }
}

export const drawStartScreen = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    
    for(let i = 0; i < 150; i++) {
        const t = (time * 0.5 + i * 100) % 3000;
        const pct = t / 3000;
        const radius = pct * Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.8;
        
        const angle = i * (Math.PI * 2 / 150) * 13; 
        
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        const size = Math.pow(pct, 3) * 4;
        const length = size * 10;
        
        const tx = cx + Math.cos(angle) * (radius - length);
        const ty = cy + Math.sin(angle) * (radius - length);
        
        const alpha = pct;
        
        ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
    }
}

export const drawExplorationMap = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
    const bgGradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    bgGradient.addColorStop(0, '#0f172a'); bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    for(let i=0; i<200; i++) {
        const seed = i * 1337;
        const x = (seed * 123) % CANVAS_WIDTH;
        const y = (seed * 456) % CANVAS_HEIGHT;
        const size = (seed % 2) + 0.5;
        ctx.fillStyle = `rgba(255,255,255,${(Math.sin(time*0.001 + i) + 1) * 0.4})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
    }

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<state.planets.length - 1; i++) {
        const p1 = state.planets[i];
        const p2 = state.planets[i+1];
        if (Math.abs(p1.x - p2.x) < 300 && Math.abs(p1.y - p2.y) < 300) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }
    }
    ctx.stroke();

    state.planets.forEach(p => {
        const isSelected = state.selectedPlanetId === p.id;
        drawPlanetSprite(ctx, p, p.x, p.y, p.radius, time, isSelected);
        if (p.completed) {
            ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x - 2, p.y + 5); ctx.lineTo(p.x + 7, p.y - 6); ctx.stroke();
        }
        ctx.fillStyle = isSelected ? '#fff' : '#94a3b8';
        ctx.font = isSelected ? 'bold 12px monospace' : '10px monospace';
        ctx.textAlign = 'center';
        
        let label = p.name;
        if (p.missionType === MissionType.OFFENSE) {
            ctx.fillStyle = isSelected ? '#f87171' : '#7f1d1d';
            label = "⚠ " + p.name;
        }

        ctx.fillText(label, p.x, p.y + p.radius + 18);
    });
}

export const drawOrbitalBeam = (ctx: CanvasRenderingContext2D, beam: OrbitalBeam) => {
    ctx.save();
    
    const currentWidth = beam.width * Math.pow(beam.life, 0.5);
    const opacity = beam.life;
    
    const grad = ctx.createLinearGradient(beam.x - currentWidth/2, 0, beam.x + currentWidth/2, 0);
    grad.addColorStop(0, 'rgba(6,182,212,0)');
    grad.addColorStop(0.2, `rgba(6,182,212,${opacity})`);
    grad.addColorStop(0.5, `rgba(255,255,255,${opacity})`); 
    grad.addColorStop(0.8, `rgba(6,182,212,${opacity})`);
    grad.addColorStop(1, 'rgba(6,182,212,0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(beam.x - currentWidth/2, beam.y - 1000, currentWidth, 1000);
    
    const grdRadial = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, currentWidth * 2);
    grdRadial.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    grdRadial.addColorStop(0.5, `rgba(6, 182, 212, ${opacity * 0.5})`);
    grdRadial.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = grdRadial;
    ctx.beginPath();
    ctx.arc(beam.x, beam.y, currentWidth * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(6,182,212,${opacity * 0.2})`;
    ctx.fillRect(beam.x - currentWidth * 2, beam.y - 1500, currentWidth * 4, 1500);

    ctx.restore();
}

export const drawFloatingText = (ctx: CanvasRenderingContext2D, ft: FloatingText) => {
    ctx.save();
    ctx.translate(ft.x, ft.y);
    
    const alpha = Math.min(1, ft.life / 500); 
    ctx.globalAlpha = alpha;

    let scale = 1.0;
    if (ft.type === FloatingTextType.CRIT) {
        const progress = 1 - (ft.life / ft.maxLife);
        if (progress < 0.1) scale = 1 + progress * 5; 
        else scale = 1.5;
    } else if (ft.type === FloatingTextType.DAMAGE) {
        scale = 1 - (0.5 * (1 - (ft.life/ft.maxLife))); 
    }

    ctx.scale(scale, scale);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;

    if (ft.type === FloatingTextType.SYSTEM) {
        const jitterX = Math.random() < 0.1 ? (Math.random()-0.5)*4 : 0;
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillText(`[ ${ft.text} ]`, jitterX, 0);
        
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#fff';
        ctx.fillRect(-ft.text.length*4, -1, ft.text.length*8, 1);
    } 
    else if (ft.type === FloatingTextType.LOOT) {
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillText(`+${ft.text}`, 0, 0);
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillRect(-1, 5, 2, 10);
    }
    else {
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(ft.text, 2, 2);
        
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = ft.type === FloatingTextType.CRIT ? 15 : 5; 
        ctx.fillText(ft.text, 0, 0);
    }

    ctx.restore();
}
