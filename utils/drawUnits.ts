
import { Player, Enemy, Ally, Turret, WeaponType, TurretType, BossType } from '../types';
import { WEAPONS } from '../data/registry';
import { isVisible } from './drawHelpers';

// ... (Keep existing weapon draw functions: drawAR, drawSG, etc.)
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
    let xOffset = 26;
    if (type === WeaponType.SR) xOffset = 42;
    if (type === WeaponType.PISTOL) xOffset = 15;
    
    ctx.fillStyle = type === WeaponType.PULSE_RIFLE ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)';
    ctx.beginPath(); ctx.arc(xOffset + 5, 0, 15, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#FEF08A'; 
    if (type === WeaponType.PULSE_RIFLE) { ctx.fillStyle = '#67E8F9'; }
    const size = type === WeaponType.SG ? 12 : 8;
    ctx.beginPath(); ctx.moveTo(xOffset, 0); ctx.lineTo(xOffset + size, -size/2); ctx.lineTo(xOffset + size*0.8, 0); ctx.lineTo(xOffset + size, size/2);
    ctx.closePath(); ctx.fill(); 
};

// ... (drawPlayerSprite, drawAllySprite, drawTurret logic remains the same)
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
    
    ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.beginPath(); ctx.ellipse(4, 0, 6, 9, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#93C5FD'; 
    ctx.beginPath(); ctx.ellipse(4, 0, 4, 7, 0, 0, Math.PI*2); ctx.fill(); 

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

        ctx.fillStyle = '#22d3ee'; 
        for(let i=0; i<activeSegments; i++) {
            const x = -barWidth/2 + (i * (barWidth / totalSegments));
            const w = (barWidth / totalSegments) - 1;
            ctx.fillRect(x, armorY, w, barHeight);
        }
    }
};

export const drawAllySprite = (ctx: CanvasRenderingContext2D, ally: Ally, time: number, isMoving: boolean, showShadows: boolean) => {
    if (showShadows) {
        ctx.save();
        ctx.rotate(-ally.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 5, 12, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

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

export const drawTurret = (ctx: CanvasRenderingContext2D, t: Turret, time: number, showShadows: boolean) => {
    ctx.save();
    ctx.translate(t.x, t.y);

    if (showShadows) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(0, 8, 15, 10, 0, 0, Math.PI*2); ctx.fill();
    }

    const hpPct = Math.max(0, t.hp / t.maxHp);
    const barH = 20;
    const barW = 4;
    const barX = -22;
    const barY = -10;

    ctx.fillStyle = '#1f2937'; 
    ctx.fillRect(barX, barY, barW, barH);

    const fillH = barH * hpPct;
    ctx.fillStyle = hpPct > 0.6 ? '#10b981' : hpPct > 0.3 ? '#facc15' : '#ef4444';
    ctx.fillRect(barX, barY + (barH - fillH), barW, fillH);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

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

export const drawBase = (ctx: CanvasRenderingContext2D, base: { x: number, y: number, width: number, height: number, hp: number, maxHp: number }, showShadows: boolean) => {
    if (showShadows) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(base.x - base.width/2 + 10, base.y - base.height/2 + 10, base.width, base.height);
    }

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

export const drawGrunt = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    // SUPER LOW LOD (Level 2) - Minimal Geometry, no strokes
    if (lodLevel >= 2) {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-8, -8, 16, 16); // Simple Box
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(4, -2, 4, 4); // Head indicator
        return;
    }

    const isLowDetail = lodLevel === 1;
    const wiggle = isLowDetail ? 0 : Math.sin(time * 0.02) * 2;
    const breathe = isLowDetail ? 0 : Math.sin(time * 0.005) * 1;

    ctx.strokeStyle = '#5c2b2b'; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (isLowDetail) {
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.lineTo(-8, -16);
        ctx.moveTo(0, -4); ctx.lineTo(4, -18);
        ctx.moveTo(0, -3); ctx.lineTo(14, -14);
        ctx.moveTo(0, 4); ctx.lineTo(-8, 16);
        ctx.moveTo(0, 4); ctx.lineTo(4, 18);
        ctx.moveTo(0, 3); ctx.lineTo(14, 14);
        ctx.stroke();
        
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath(); ctx.arc(5, 0, 4, 0, Math.PI*2); ctx.fill();
    } else {
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
}

export const drawRusher = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    // SUPER LOW LOD
    if (lodLevel >= 2) {
        ctx.fillStyle = '#d97706'; // Amber-600
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5);
        ctx.fill();
        return;
    }

    const isLowDetail = lodLevel === 1;
    if (isLowDetail) {
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.moveTo(15, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(0, 0); ctx.lineTo(10, -10);
        ctx.moveTo(0, 0); ctx.lineTo(10, 10);
        ctx.stroke();
    } else {
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
}

export const drawTank = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    // SUPER LOW LOD
    if (lodLevel >= 2) {
        ctx.fillStyle = '#1f2937';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-5, -5, 10, 10);
        return;
    }

    const isLowDetail = lodLevel === 1;
    if (isLowDetail) {
        ctx.fillStyle = '#1f2937'; 
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#374151'; 
        ctx.fillRect(-10, -15, 20, 30);
    } else {
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
}

export const drawKamikaze = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    // SUPER LOW LOD
    if (lodLevel >= 2) {
        ctx.fillStyle = '#9333ea';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        return;
    }

    const isLowDetail = lodLevel === 1;
    if (isLowDetail) {
        ctx.fillStyle = '#4c1d95'; 
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.beginPath(); ctx.arc(-5, 0, 6, 0, Math.PI*2); ctx.fill();
    } else {
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
}

export const drawViper = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    // SUPER LOW LOD
    if (lodLevel >= 2) {
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.fill();
        return;
    }

    const isLowDetail = lodLevel === 1;
    if (isLowDetail) {
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-20, 0); ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
    } else {
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
        ctx.beginPath(); ctx.arc(-5, 10 + flap*5, 2, 0, Math.PI*2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(-5, -10 - flap*5, 2, 0, Math.PI*2); ctx.fill(); 
    }
}

// ... (Keep existing Boss draw functions: drawBossRed, drawBossBlue, etc.)
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

    ctx.fillStyle = `rgba(254, 226, 226, 0.3)`;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.arc(0, 0, 15 + Math.sin(time * 0.01) * 5, 0, Math.PI * 2);
    ctx.fill();

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
