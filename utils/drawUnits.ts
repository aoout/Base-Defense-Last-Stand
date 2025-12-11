
import { Player, Enemy, Ally, Turret, WeaponType, TurretType, BossType, BaseDropState } from '../types';
import { WEAPONS } from '../data/registry';
import { isVisible, drawCircle, drawEllipse, drawPolygon, drawSmoothLeg, drawStrokeCircle } from './drawHelpers';
import { PALETTE } from '../theme/colors';

// ... (Existing draw functions for weapons, base, player, ally remain unchanged)
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
    drawCircle(ctx, -5, -6, 4, '#C2410C');
    drawCircle(ctx, -5, 6, 4, '#C2410C');
    ctx.fillStyle = '#4B5563'; ctx.fillRect(0, -4, 18, 8);
    ctx.fillStyle = '#1F2937'; ctx.fillRect(18, -3, 6, 6);
    drawCircle(ctx, 24, 1, 2, '#3B82F6');
};
const drawPulseRifle = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#F3F4F6'; ctx.fillRect(-5, -4, 20, 8);
    ctx.fillStyle = '#06B6D4'; ctx.fillRect(0, -2, 18, 1); ctx.fillRect(0, 1, 18, 1);
    ctx.fillStyle = '#0E7490'; ctx.fillRect(15, -3, 4, 6);
};
const drawGL = (ctx: CanvasRenderingContext2D) => {
    drawCircle(ctx, 5, 0, 7, '#374151');
    ctx.fillStyle = '#1F2937'; ctx.fillRect(-10, -4, 10, 8);
    ctx.fillStyle = '#4B5563'; ctx.fillRect(10, -5, 12, 10);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(22, 0, 2, 5, 0, 0, Math.PI*2); ctx.fill();
};

const drawMuzzleFlash = (ctx: CanvasRenderingContext2D, type: WeaponType) => {
    let xOffset = 26;
    if (type === WeaponType.SR) xOffset = 42;
    if (type === WeaponType.PISTOL) xOffset = 15;
    
    drawCircle(ctx, xOffset + 5, 0, 15, type === WeaponType.PULSE_RIFLE ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)');

    ctx.fillStyle = type === WeaponType.PULSE_RIFLE ? '#67E8F9' : '#FEF08A'; 
    const size = type === WeaponType.SG ? 12 : 8;
    ctx.beginPath(); ctx.moveTo(xOffset, 0); ctx.lineTo(xOffset + size, -size/2); ctx.lineTo(xOffset + size*0.8, 0); ctx.lineTo(xOffset + size, size/2);
    ctx.closePath(); ctx.fill(); 
};

export const drawDropPod = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.restore();
};

export const drawPlayerSprite = (ctx: CanvasRenderingContext2D, p: Player, time: number, isMoving: boolean) => {
    const stride = isMoving ? Math.sin(time * 0.015) * 4 : 0;
    
    // Legs
    drawEllipse(ctx, -5 + stride, -10, 6, 4, '#111827');
    drawEllipse(ctx, -5 - stride, 10, 6, 4, '#111827');

    // Body
    drawCircle(ctx, 0, 0, 12, '#1D4ED8'); 
    drawCircle(ctx, 0, 0, 8, '#1E3A8A'); 
    drawEllipse(ctx, 0, -11, 6, 8, '#1E3A8A'); 
    drawEllipse(ctx, 0, 11, 6, 8, '#1E3A8A'); 

    // Helmet
    drawCircle(ctx, 0, 0, 9, '#2563EB');
    drawEllipse(ctx, 4, 0, 6, 9, 'rgba(96, 165, 250, 0.3)'); 
    drawEllipse(ctx, 4, 0, 4, 7, '#93C5FD'); 

    // Weapon
    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    const weaponState = p.weapons[currentWeaponType];
    
    const isFiring = weaponState ? (time - weaponState.lastFireTime < 50) : false;
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
    
    // Hands
    if (currentWeaponType === WeaponType.PISTOL) { drawCircle(ctx, 0, 0, 4, '#1F2937'); } 
    else { drawCircle(ctx, 0, 5, 4, '#1F2937'); drawCircle(ctx, 15, -2, 4, '#1F2937'); }

    if (isFiring && currentWeaponType !== WeaponType.FLAMETHROWER) { drawMuzzleFlash(ctx, currentWeaponType); }
    ctx.restore();

    ctx.rotate(-p.angle);
    drawUnitBars(ctx, p.hp, p.maxHp, p.armor, p.maxArmor, weaponState, WEAPONS[currentWeaponType]);
};

export const drawAllySprite = (ctx: CanvasRenderingContext2D, ally: Ally, time: number, isMoving: boolean, showShadows: boolean) => {
    if (showShadows) {
        ctx.save();
        ctx.rotate(-ally.angle);
        drawEllipse(ctx, 0, 5, 12, 8, PALETTE.UI.SHADOW);
        ctx.restore();
    }

    const stride = isMoving ? Math.sin(time * 0.015) * 4 : 0;
    drawEllipse(ctx, -5 + stride, -10, 6, 4, '#1F2937');
    drawEllipse(ctx, -5 - stride, 10, 6, 4, '#1F2937');

    drawCircle(ctx, 0, 0, 11, '#60A5FA');
    drawCircle(ctx, 0, 0, 7, '#2563EB');
    drawCircle(ctx, 0, 0, 8, '#93C5FD');
    drawEllipse(ctx, 3, 0, 3, 6, '#1E40AF');

    const isFiring = time - ally.lastFireTime < 50;
    const recoil = isFiring ? -2 : 0;

    ctx.save();
    ctx.translate(8 + recoil, 0);
    ctx.fillStyle = '#374151'; ctx.fillRect(-2, -3, 14, 6);
    ctx.fillStyle = '#111827'; ctx.fillRect(12, -2, 8, 4);
    drawCircle(ctx, 0, 4, 3, '#1F2937');
    drawCircle(ctx, 10, -1, 3, '#1F2937');
    if (isFiring) {
        ctx.fillStyle = '#FEF9C3'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(28, -4); ctx.lineTo(26, 0); ctx.lineTo(28, 4); ctx.fill();
    }
    ctx.restore();
};

export const drawTurret = (ctx: CanvasRenderingContext2D, t: Turret, time: number, showShadows: boolean) => {
    ctx.save();
    ctx.translate(t.x, t.y);

    if (showShadows) {
        drawEllipse(ctx, 0, 8, 15, 10, PALETTE.UI.SHADOW);
    }

    const hpPct = Math.max(0, t.hp / t.maxHp);
    const barH = 20; const barW = 4; const barX = -22; const barY = -10;
    ctx.fillStyle = '#1f2937'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.6 ? PALETTE.UI.HP_GOOD : hpPct > 0.3 ? PALETTE.UI.HP_MED : PALETTE.UI.HP_LOW;
    ctx.fillRect(barX, barY + (barH * (1 - hpPct)), barW, barH * hpPct);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#064E3B'; 
    for(let i=0; i<3; i++) { ctx.save(); ctx.rotate(i * (Math.PI * 2 / 3)); ctx.fillRect(5, -2, 12, 4); ctx.restore(); }
    drawCircle(ctx, 0, 0, 10, '#064E3B');

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
        if (flash) { drawCircle(ctx, 25, 0, 8 + Math.random()*4, '#FEF9C3'); }
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

export const drawBase = (ctx: CanvasRenderingContext2D, base: { x: number, y: number, width: number, height: number, hp: number, maxHp: number }, showShadows: boolean, dropState: BaseDropState | null) => {
    
    const time = Date.now();
    ctx.save();
    ctx.translate(base.x, base.y);

    const isEntry = dropState && dropState.phase === 'ENTRY';
    const isActive = !dropState;

    if (isEntry) {
        ctx.save();
        const heatGrad = ctx.createRadialGradient(0, base.height/2, 20, 0, base.height/2, 120);
        heatGrad.addColorStop(0, '#fff'); 
        heatGrad.addColorStop(0.3, '#f97316'); 
        heatGrad.addColorStop(0.6, '#dc2626'); 
        heatGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = heatGrad;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.ellipse(0, base.height/2 + 10, 100, 30, 0, 0, Math.PI*2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,200,100,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<5; i++) {
            const lx = (Math.random()-0.5) * base.width;
            const ly = base.height/2;
            const len = 100 + Math.random()*100;
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx, ly - len);
        }
        ctx.stroke();
        ctx.restore();
    }

    if (isEntry) {
        const cornerOffset = base.width / 2 - 25;
        const thrusterY = base.height / 2;
        
        const drawThruster = (x: number, scale: number) => {
            const flicker = Math.random() * 0.2 + 0.8;
            const len = 120 * scale * flicker;
            const width = 20 * scale;
            
            const grad = ctx.createLinearGradient(0, thrusterY, 0, thrusterY + len);
            grad.addColorStop(0, '#60a5fa'); 
            grad.addColorStop(0.3, '#ffffff'); 
            grad.addColorStop(0.6, '#f97316'); 
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - width/2, thrusterY);
            ctx.lineTo(x, thrusterY + len);
            ctx.lineTo(x + width/2, thrusterY);
            ctx.fill();
        };

        drawThruster(-cornerOffset, 1.0);
        drawThruster(cornerOffset, 1.0);
        drawThruster(-20, 0.6);
        drawThruster(20, 0.6);
    }

    if (showShadows && !isEntry) {
        ctx.fillStyle = PALETTE.UI.SHADOW;
        ctx.fillRect(-base.width/2 + 10, -base.height/2 + 10, base.width, base.height);
    }

    ctx.fillStyle = '#1e293b'; 
    const chamfer = 20;
    const w = base.width;
    const h = base.height;
    
    ctx.beginPath();
    ctx.moveTo(-w/2 + chamfer, -h/2);
    ctx.lineTo(w/2 - chamfer, -h/2);
    ctx.lineTo(w/2, -h/2 + chamfer);
    ctx.lineTo(w/2, h/2 - chamfer);
    ctx.lineTo(w/2 - chamfer, h/2);
    ctx.lineTo(-w/2 + chamfer, h/2);
    ctx.lineTo(-w/2, h/2 - chamfer);
    ctx.lineTo(-w/2, -h/2 + chamfer);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#334155'; 
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(-w/2 + 10, -h/2 + 10, w - 20, h - 20);

    ctx.save();
    ctx.beginPath();
    ctx.rect(-w/2 + 10, -h/2 + 10, w - 20, 10); 
    ctx.rect(-w/2 + 10, h/2 - 20, w - 20, 10); 
    ctx.clip();
    
    ctx.fillStyle = '#f59e0b'; 
    ctx.fillRect(-w/2, -h/2, w, h);
    
    ctx.fillStyle = '#000';
    for(let i=-w; i<w; i+=20) {
        ctx.beginPath();
        ctx.moveTo(i, -h/2);
        ctx.lineTo(i+10, -h/2);
        ctx.lineTo(i, h/2);
        ctx.lineTo(i-10, h/2);
        ctx.fill();
    }
    ctx.restore();

    if (isActive) {
        drawCloneCenter(ctx, -35, 0, time); 
        drawCloneCenter(ctx, 35, 0, time); 
        
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        
        const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
        const coreGrad = ctx.createRadialGradient(0,0, 5, 0,0, 18);
        coreGrad.addColorStop(0, '#60a5fa');
        coreGrad.addColorStop(1, 'rgba(37,99,235,0)');
        ctx.fillStyle = coreGrad;
        ctx.globalAlpha = pulse;
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
        
        drawStrokeCircle(ctx, 0, 0, 20, '#3b82f6', 2);
    } else {
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=0; i<3; i++) {
            const a = (i * Math.PI * 2 / 3) - Math.PI/2;
            ctx.moveTo(0,0);
            ctx.lineTo(Math.cos(a)*25, Math.sin(a)*25);
        }
        ctx.stroke();

        const lightPulse = Math.sin(time * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(239, 68, 68, ${lightPulse})`;
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
    }

    const bHpPct = base.hp / base.maxHp;
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(-w/2, h/2 + 5, w, 6);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(-w/2, h/2 + 5, w * bHpPct, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-w/2, h/2 + 5, w * bHpPct, 2);

    ctx.restore();
}

const drawCloneCenter = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 20, y - 25, 40, 50);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 20, y - 25, 40, 50);
    
    ctx.fillStyle = '#0c4a6e'; 
    ctx.fillRect(x - 15, y - 20, 30, 40);
    
    const liquidLevel = Math.sin(time * 0.002 + x) * 2;
    ctx.fillStyle = '#0ea5e9'; 
    ctx.beginPath();
    ctx.rect(x - 15, y - 10 + liquidLevel, 30, 30 - liquidLevel);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 20);
    ctx.lineTo(x + 5, y - 20);
    ctx.lineTo(x - 15, y + 10);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(x, y - 5, 6, 0, Math.PI*2); 
    ctx.rect(x - 4, y, 8, 15); 
    ctx.fill();
    
    const pulse = Math.sin(time * 0.005) > 0;
    drawCircle(ctx, x, y - 28, 2, pulse ? '#22c55e' : '#14532d');
};

const drawUnitBars = (ctx: CanvasRenderingContext2D, hp: number, maxHp: number, armor: number, maxArmor: number, weaponState: any, weaponStats: any) => {
    const hpPct = Math.max(0, hp / maxHp);
    const armPct = Math.max(0, armor / maxArmor);
    
    const yOff = 25;
    const barW = 20;
    
    // HP Bar
    ctx.fillStyle = PALETTE.UI.BAR_BG;
    ctx.fillRect(-barW/2, yOff, barW, 3);
    ctx.fillStyle = hpPct > 0.5 ? PALETTE.UI.HP_GOOD : PALETTE.UI.HP_LOW;
    ctx.fillRect(-barW/2, yOff, barW * hpPct, 3);
    
    // Armor Bar
    if (maxArmor > 0) {
        ctx.fillStyle = PALETTE.UI.BAR_BG;
        ctx.fillRect(-barW/2, yOff + 4, barW, 2);
        ctx.fillStyle = PALETTE.UI.ARMOR;
        ctx.fillRect(-barW/2, yOff + 4, barW * armPct, 2);
    }

    // Reload Bar
    if (weaponState && weaponState.reloading) {
        const reloadPct = Math.min(1, (Date.now() - weaponState.reloadStartTime) / weaponStats.reloadTime);
        ctx.fillStyle = PALETTE.UI.BAR_BG;
        ctx.fillRect(-barW/2, yOff - 5, barW, 2);
        ctx.fillStyle = PALETTE.UI.RELOAD;
        ctx.fillRect(-barW/2, yOff - 5, barW * reloadPct, 2);
    }
}

export const drawEnemyBars = (ctx: CanvasRenderingContext2D, e: Enemy, lodLevel: number) => {
    if (lodLevel >= 2) return; // Hide bars on lowest settings

    const hpPct = Math.max(0, e.hp / e.maxHp);
    const radius = e.radius;
    const yOff = radius + 8;
    const barW = Math.max(20, radius * 1.5);

    ctx.fillStyle = PALETTE.UI.BAR_BG;
    ctx.fillRect(-barW/2, yOff, barW, 3);
    
    // Boss Health Bar Color (Purple/Red) vs Normal
    if (e.isBoss) {
        const grad = ctx.createLinearGradient(-barW/2, 0, barW/2, 0);
        grad.addColorStop(0, '#a855f7'); 
        grad.addColorStop(1, '#ef4444');
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = PALETTE.UI.HP_LOW;
    }
    ctx.fillRect(-barW/2, yOff, barW * hpPct, 3);

    // Shell Bar (Tank)
    if (e.type === 'TANK' && e.shellValue && e.maxShell) {
        const shellPct = e.shellValue / e.maxShell;
        if (shellPct > 0) {
            ctx.fillStyle = PALETTE.UI.BAR_BG;
            ctx.fillRect(-barW/2, yOff + 4, barW, 2);
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(-barW/2, yOff + 4, barW * shellPct, 2);
        }
    }
}

export const drawGrunt = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        ctx.fillStyle = PALETTE.ZERG.SKIN_LIGHT;
        ctx.fillRect(-8, -8, 16, 16); 
        ctx.fillStyle = PALETTE.ZERG.EYE;
        ctx.fillRect(4, -2, 4, 4); 
        return;
    }

    const isLowDetail = lodLevel === 1;
    const wiggle = isLowDetail ? 0 : Math.sin(time * 0.02) * 2;
    const breathe = isLowDetail ? 0 : Math.sin(time * 0.005) * 1;

    if (isLowDetail) {
        ctx.strokeStyle = PALETTE.ZERG.LEG; 
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.lineTo(-8, -16);
        ctx.moveTo(0, -4); ctx.lineTo(4, -18);
        ctx.moveTo(0, -3); ctx.lineTo(14, -14);
        ctx.moveTo(0, 4); ctx.lineTo(-8, 16);
        ctx.moveTo(0, 4); ctx.lineTo(4, 18);
        ctx.moveTo(0, 3); ctx.lineTo(14, 14);
        ctx.stroke();
        
        drawCircle(ctx, 0, 0, 8, PALETTE.ZERG.SKIN_DARK);
        drawCircle(ctx, 5, 0, 4, PALETTE.ZERG.CARAPACE);
    } else {
        const legPairs = [
            { start: {x:-2, y:-4}, end: {x:-8, y:-16} }, 
            { start: {x:2, y:-4}, end: {x:4, y:-18} },   
            { start: {x:6, y:-3}, end: {x:14, y:-14} },  
            { start: {x:-2, y:4}, end: {x:-8, y:16} },   
            { start: {x:2, y:4}, end: {x:4, y:18} },     
            { start: {x:6, y:3}, end: {x:14, y:14} },    
        ];

        legPairs.forEach((leg, i) => {
            const isLeft = leg.end.y < 0;
            const move = isLeft ? wiggle : -wiggle;
            const offsetY = isLeft ? 5 : -5;
            drawSmoothLeg(ctx, leg.start, { x: leg.end.x + (i%3===0 ? move : -move), y: leg.end.y }, {x: 0, y: offsetY}, PALETTE.ZERG.LEG, 3);
        });

        drawEllipse(ctx, -6, 0, 9, 7 + breathe, PALETTE.ZERG.SKIN_DARK);
        ctx.strokeStyle = PALETTE.ZERG.SKIN_LIGHT;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-2, 0); ctx.stroke(); 

        drawEllipse(ctx, 3, 0, 7, 6, PALETTE.ZERG.SKIN_LIGHT);
        drawPolygon(ctx, [{x: -2, y: -4}, {x: 8, y: -3}, {x: 8, y: 3}, {x: -2, y: 4}], PALETTE.ZERG.CARAPACE);
        drawEllipse(ctx, 10, 0, 5, 4, PALETTE.ZERG.TAIL_SPOT);

        ctx.strokeStyle = PALETTE.ZERG.MANDIBLE; 
        ctx.lineWidth = 2;
        const bite = Math.sin(time * 0.015) * 2;
        ctx.beginPath();
        ctx.moveTo(12, -2); ctx.lineTo(18, -4 + bite); ctx.lineTo(16, -1);
        ctx.stroke();
        ctx.moveTo(12, 2); ctx.lineTo(18, 4 - bite); ctx.lineTo(16, 1);
        ctx.stroke();

        drawCircle(ctx, 11, -2, 1.5, PALETTE.ZERG.EYE);
        drawCircle(ctx, 11, 2, 1.5, PALETTE.ZERG.EYE);
    }
}

export const drawRusher = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawPolygon(ctx, [{x:10, y:0}, {x:-5, y:-5}, {x:-5, y:5}], PALETTE.RUSHER.BODY_GRAD_END);
        return;
    }

    if (lodLevel === 1) {
        drawPolygon(ctx, [{x:15, y:0}, {x:-10, y:-5}, {x:-10, y:5}], PALETTE.RUSHER.BODY_GRAD_START);
        ctx.strokeStyle = PALETTE.RUSHER.CARAPACE_STROKE;
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(0, 0); ctx.lineTo(10, -10);
        ctx.moveTo(0, 0); ctx.lineTo(10, 10);
        ctx.stroke();
    } else {
        const enginePulse = Math.sin(time * 0.05);
        ctx.fillStyle = PALETTE.RUSHER.GLOW;
        ctx.beginPath(); 
        ctx.moveTo(-5, 0); 
        ctx.lineTo(-25 - enginePulse*5, -8); 
        ctx.lineTo(-20, 0);
        ctx.lineTo(-25 - enginePulse*5, 8); 
        ctx.fill();

        const grad = ctx.createLinearGradient(-10, 0, 15, 0); 
        grad.addColorStop(0, PALETTE.RUSHER.BODY_GRAD_START); grad.addColorStop(1, PALETTE.RUSHER.BODY_GRAD_END);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.quadraticCurveTo(5, 7, -10, 4); 
        ctx.lineTo(-12, 0);
        ctx.quadraticCurveTo(5, -7, 15, 0); 
        ctx.fill();

        ctx.strokeStyle = PALETTE.RUSHER.CARAPACE_STROKE;
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(5, 3); ctx.lineTo(12, 12); ctx.lineTo(20, 6); 
        ctx.moveTo(5, -3); ctx.lineTo(12, -12); ctx.lineTo(20, -6); 
        ctx.stroke();

        ctx.fillStyle = PALETTE.RUSHER.CARAPACE_STROKE;
        drawPolygon(ctx, [{x:-5, y:0}, {x:-2, y:-5}, {x:1, y:0}], PALETTE.RUSHER.CARAPACE_STROKE);
        drawPolygon(ctx, [{x:0, y:0}, {x:3, y:5}, {x:6, y:0}], PALETTE.RUSHER.CARAPACE_STROKE);

        drawCircle(ctx, 12, -2, 1.5, PALETTE.RUSHER.EYE);
        drawCircle(ctx, 12, 2, 1.5, PALETTE.RUSHER.EYE);
    }
}

export const drawTank = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    const fleshColor = PALETTE.TANK.BODY;
    const plateColorDark = PALETTE.TANK.SHELL; 
    const plateColorLight = PALETTE.TANK.PLATE; 
    const plateEdge = PALETTE.TANK.HIGHLIGHT; 
    const glowColor = '#b91c1c';  
    const legColor = PALETTE.TANK.LEG;   

    if (lodLevel >= 2) {
        ctx.fillStyle = plateColorDark;
        ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();
        return;
    }

    const breathe = Math.sin(time * 0.002);
    const walk = Math.sin(time * 0.005);
    const walkAlt = Math.cos(time * 0.005);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = legColor;

    const drawLeg = (offsetX: number, offsetY: number, kneeX: number, kneeY: number, tipX: number, tipY: number, width: number) => {
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        ctx.lineTo(offsetX + kneeX, offsetY + kneeY);
        ctx.lineTo(offsetX + kneeX + tipX, offsetY + kneeY + tipY);
        ctx.stroke();
        
        ctx.fillStyle = plateColorDark;
        ctx.beginPath();
        ctx.moveTo(offsetX + kneeX, offsetY + kneeY);
        ctx.lineTo(offsetX + kneeX + 5, offsetY + kneeY - 5);
        ctx.lineTo(offsetX + kneeX + 2, offsetY + kneeY);
        ctx.fill();
    };

    drawLeg(-20, 15, -15, 20 + walk*5, -10, 10, 8);
    drawLeg(-20, -15, -15, -20 - walk*5, -10, -10, 8);

    drawLeg(0, 20, 10, 25 - walkAlt*5, 10, 15, 6);
    drawLeg(0, -20, 10, -25 + walkAlt*5, 10, -15, 6);

    ctx.strokeStyle = '#27272a';
    drawLeg(25, 10, 20, 15, 15, -5, 5);
    drawLeg(25, -10, 20, -15, 15, 5, 5);

    ctx.fillStyle = fleshColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 25 + breathe*1, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = plateColorDark;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.bezierCurveTo(-15, 25, -35, 20, -45, 0); 
    ctx.bezierCurveTo(-35, -20, -15, -25, -10, 0); 
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = plateColorLight;
    ctx.beginPath();
    ctx.ellipse(-30, 0, 8, 12, 0, 0, Math.PI*2); 
    ctx.fill();
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = 0.5 + breathe * 0.2;
    ctx.beginPath(); ctx.ellipse(-25, 8, 2, 4, 0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-25, -8, 2, 4, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = plateColorDark;
    const midGradient = ctx.createLinearGradient(0, -20, 0, 20);
    midGradient.addColorStop(0, plateColorDark);
    midGradient.addColorStop(0.5, '#52525b');
    midGradient.addColorStop(1, plateColorDark);
    ctx.fillStyle = midGradient;

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(15, 20); 
    ctx.bezierCurveTo(0, 28, -20, 25, -15, 0); 
    ctx.bezierCurveTo(-20, -25, 0, -28, 15, -20); 
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = plateEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -15); ctx.quadraticCurveTo(5, 0, -5, 15); 
    ctx.stroke();

    ctx.fillStyle = plateColorLight;
    ctx.beginPath();
    ctx.moveTo(15, -15);
    ctx.quadraticCurveTo(45, -10, 50, 0); 
    ctx.quadraticCurveTo(45, 10, 15, 15);
    ctx.quadraticCurveTo(20, 0, 15, -15); 
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = PALETTE.TANK.EYE;
    ctx.shadowColor = PALETTE.TANK.EYE;
    ctx.shadowBlur = 5;
    drawCircle(ctx, 40, -6, 2, PALETTE.TANK.EYE);
    drawCircle(ctx, 40, 6, 2, PALETTE.TANK.EYE);
    drawCircle(ctx, 45, -3, 1.5, PALETTE.TANK.EYE);
    drawCircle(ctx, 45, 3, 1.5, PALETTE.TANK.EYE);
    ctx.shadowBlur = 0;

    if (e.shellValue && e.shellValue > 0) {
        const shellPct = e.shellValue / (e.maxShell || 100);
        ctx.save();
        
        const shieldPulse = Math.sin(time * 0.01) * 0.1 + 0.9;
        ctx.globalAlpha = (shellPct * 0.3 + 0.1) * shieldPulse;
        
        ctx.strokeStyle = '#22d3ee'; 
        ctx.lineWidth = 1;
        
        const hexPoints = [
            {x: 0, y: 0}, {x: -20, y: 15}, {x: -20, y: -15}, 
            {x: 20, y: 15}, {x: 20, y: -15}, {x: 40, y: 0}
        ];
        
        hexPoints.forEach(p => {
            if (Math.random() > 0.5) return; 
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const r = 8;
                ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.ellipse(0, 0, 55, 40, 0, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${shellPct})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(34, 211, 238, 0.05)`;
        ctx.fill();

        ctx.restore();
    }
}

export const drawKamikaze = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawCircle(ctx, 0, 0, 8, '#9333ea');
        return;
    }

    if (lodLevel === 1) {
        drawCircle(ctx, 0, 0, 10, PALETTE.KAMIKAZE.BODY);
        drawCircle(ctx, -5, 0, 6, PALETTE.KAMIKAZE.SACK_MID);
    } else {
        const pulse = (Math.sin(time * 0.015) + 1) * 0.5; 
        const shake = Math.sin(time * 0.1) * 0.5;
        
        ctx.save(); 
        ctx.translate(shake, shake);

        const sackGrad = ctx.createRadialGradient(-5, 0, 2, -5, 0, 14); 
        sackGrad.addColorStop(0, PALETTE.KAMIKAZE.SACK_START); 
        sackGrad.addColorStop(0.5, PALETTE.KAMIKAZE.SACK_MID); 
        sackGrad.addColorStop(1, PALETTE.KAMIKAZE.SACK_END);
        
        ctx.fillStyle = sackGrad; 
        ctx.beginPath(); 
        ctx.ellipse(-5, 0, 12 + pulse*2, 10 + pulse*2, 0, 0, Math.PI*2); 
        ctx.fill();

        ctx.strokeStyle = PALETTE.KAMIKAZE.VEIN; 
        ctx.lineWidth = 1; 
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12 - pulse, -6 - pulse); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12 - pulse, 6 + pulse); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-16 - pulse, 0); ctx.stroke();

        drawCircle(ctx, 8, 0, 5, PALETTE.KAMIKAZE.BODY);
        
        ctx.strokeStyle = PALETTE.KAMIKAZE.LEG; 
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
    if (lodLevel >= 2) {
        drawPolygon(ctx, [{x:10, y:0}, {x:-10, y:-5}, {x:-10, y:5}], PALETTE.VIPER.BODY_STROKE);
        return;
    }

    if (lodLevel === 1) {
        ctx.strokeStyle = PALETTE.VIPER.BODY_STROKE;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-20, 0); ctx.stroke();
        drawCircle(ctx, 0, 0, 5, PALETTE.VIPER.GLOW);
    } else {
        const flap = Math.sin(time * 0.008) * 0.5;

        ctx.strokeStyle = PALETTE.VIPER.BODY_STROKE;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, 10, -25, 0); 
        ctx.stroke();

        ctx.fillStyle = PALETTE.VIPER.WING_FILL; 
        ctx.strokeStyle = PALETTE.VIPER.WING_STROKE; 
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

        ctx.fillStyle = PALETTE.VIPER.BODY_STROKE; 
        drawPolygon(ctx, [{x:5, y:-4}, {x:18, y:-6}, {x:15, y:-2}, {x:5, y:0}, {x:15, y:2}, {x:18, y:6}, {x:5, y:4}], PALETTE.VIPER.BODY_STROKE);

        drawCircle(ctx, -5, 10 + flap*5, 2, PALETTE.VIPER.GLOW);
        drawCircle(ctx, -5, -10 - flap*5, 2, PALETTE.VIPER.GLOW);
    }
}

export const drawPustule = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    const pulse = Math.sin(time * 0.002) * 2;
    const r = e.radius + pulse;

    const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
    grad.addColorStop(0, '#bef264'); 
    grad.addColorStop(0.6, '#65a30d'); 
    grad.addColorStop(1, '#3f6212'); 
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    for(let i=0; i<8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const offset = Math.sin(angle * 3 + time * 0.001) * 3;
        const lx = Math.cos(angle) * (r + offset);
        const ly = Math.sin(angle) * (r + offset);
        if (i===0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
    }
    ctx.closePath();
    ctx.fill();

    const orificeOpen = Math.sin(time * 0.005);
    ctx.fillStyle = '#1a2e05';
    ctx.beginPath();
    ctx.ellipse(0, -5, r * 0.4 + orificeOpen * 2, r * 0.3 + orificeOpen * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        ctx.moveTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
        ctx.lineTo(Math.cos(angle) * (r + 5), Math.sin(angle) * (r + 5));
    }
    ctx.stroke();
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#a3e635';
    drawCircle(ctx, 0, -5, 5, '#bef264');
    ctx.shadowBlur = 0;
}

export const drawTubeWorm = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const scaleY = e.visualScaleY !== undefined ? e.visualScaleY : 1;
    const isEating = e.eatingTimer && e.eatingTimer > 0;
    const isHunting = !!e.huntingTargetId;
    
    if (scaleY <= 0.05) {
        ctx.fillStyle = '#574135'; 
        ctx.beginPath();
        // Mound size relative to radius
        ctx.ellipse(0, 0, e.radius, e.radius * 0.4, 0, 0, Math.PI*2);
        ctx.fill();
        
        if (Math.random() < 0.3) {
            ctx.fillStyle = '#a16207';
            for(let i=0; i<3; i++) {
                const rx = (Math.random()-0.5)*e.radius;
                const ry = (Math.random()-0.5)*e.radius*0.5;
                ctx.fillRect(rx, ry, 2, 2);
            }
        }
        return;
    }

    ctx.save();
    
    const segmentCount = 8;
    // Length scales with radius
    const maxLen = e.radius * 3.6; 
    const currentLen = maxLen * scaleY;
    const segSpacing = currentLen / segmentCount;
    
    let breatheSpeed = 0.008;
    let breatheAmp = 2;
    
    if (isHunting) {
        breatheSpeed = 0.03; 
        breatheAmp = 4; 
    }
    const breathe = Math.sin(time * breatheSpeed) * breatheAmp;
    
    let baseWidth = e.radius * 1.6; 
    
    let bulgeOffset = 0;
    if (isEating) {
        const normalizedTime = 1 - (e.eatingTimer! / 500); 
        bulgeOffset = normalizedTime * segmentCount;
    }

    for(let i = segmentCount; i >= 0; i--) {
        const progress = i / segmentCount; 
        
        const wiggleSpeed = isHunting ? 0.02 : 0.005;
        const wiggleAmp = isHunting ? 8 : 5;
        const wiggle = Math.sin(progress * Math.PI * 1.5 + time * wiggleSpeed) * (wiggleAmp * scaleY);
        
        const segX = (segmentCount - i) * (segSpacing * 0.8) - (e.radius * 0.6); 
        const segY = wiggle;
        
        let segWidth = baseWidth;
        
        if (isEating) {
             const dist = Math.abs(i - bulgeOffset);
             if (dist < 2) {
                 segWidth *= (1.5 - dist * 0.2);
             }
        }
        
        const width = (segWidth - Math.abs(progress - 0.5) * 8) * scaleY;
        
        const isHead = i === 0;
        let color = i % 2 === 0 ? '#d97706' : '#f59e0b'; 
        if (isHunting) color = i % 2 === 0 ? '#b45309' : '#d97706'; 
        if (isHead) color = '#78350f'; 
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(segX, segY, segSpacing * 0.8, width / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400e'; 
        ctx.lineWidth = 1;
        ctx.stroke();
        
        if (isHead) {
            const headX = segX + 4;
            const headY = segY;
            
            const mawSize = width * 0.35;
            ctx.fillStyle = '#451a03'; 
            ctx.beginPath();
            ctx.arc(headX, headY, mawSize, 0, Math.PI*2);
            ctx.fill();
            
            const teethCount = 8;
            ctx.fillStyle = '#fef3c7'; 
            
            const teethSpeed = isHunting ? 0.05 : 0.002;
            const teethRadius = isHunting ? (width * 0.1) : (width * 0.06);

            for(let t=0; t<teethCount; t++) {
                const angle = (t / teethCount) * Math.PI * 2 + time * teethSpeed; 
                const tx = headX + Math.cos(angle) * (mawSize - 1);
                const ty = headY + Math.sin(angle) * (mawSize - 1);
                
                ctx.beginPath();
                ctx.arc(tx, ty, teethRadius * scaleY, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    ctx.restore();
    
    if (scaleY > 0) {
        ctx.fillStyle = 'rgba(63, 44, 34, 0.6)';
        ctx.beginPath();
        const moundSize = (e.radius) + 3 + breathe;
        ctx.ellipse(-e.radius * 0.3, 0, moundSize, moundSize * 0.6, 0, 0, Math.PI*2);
        ctx.fill();
        
        if (scaleY < 0.9) { 
            ctx.fillStyle = '#a16207';
            for(let i=0; i<6; i++) {
                const px = (Math.random()-0.5)*e.radius*1.5;
                const py = (Math.random()-0.5)*e.radius;
                ctx.fillRect(px, py, 3, 3);
            }
        }
    }
}

// THE DEVOURER (Boss Variant of Tube Worm)
export const drawDevourer = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const scaleY = e.visualScaleY !== undefined ? e.visualScaleY : 1;
    const isWandering = e.isWandering;
    
    if (scaleY <= 0.05) {
        // Molten Mound
        const glow = Math.sin(time * 0.005) * 5;
        ctx.fillStyle = '#1c1917'; // Obsidian
        ctx.beginPath();
        ctx.ellipse(0, 0, e.radius, e.radius * 0.4, 0, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowBlur = 20 + glow;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#b91c1c'; // Magma cracks
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        return;
    }

    ctx.save();
    
    const segmentCount = 10;
    const maxLen = e.radius * 4.0; 
    const currentLen = maxLen * scaleY;
    const segSpacing = currentLen / segmentCount;
    let baseWidth = e.radius * 1.8; 

    // Pulse effect
    const rage = Math.sin(time * 0.01) * 2;

    for(let i = segmentCount; i >= 0; i--) {
        const progress = i / segmentCount; 
        const wiggle = Math.sin(progress * Math.PI * 1.5 + time * 0.003) * (10 * scaleY);
        const segX = (segmentCount - i) * (segSpacing * 0.8) - (e.radius * 0.6); 
        const segY = wiggle;
        const width = (baseWidth - Math.abs(progress - 0.5) * 15) * scaleY;
        const isHead = i === 0;

        // Obsidian Shell
        ctx.fillStyle = '#0c0a09'; 
        if (i % 2 === 0) ctx.fillStyle = '#1c1917';
        
        ctx.beginPath();
        ctx.ellipse(segX, segY, segSpacing * 0.9, width / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Magma Veins
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ef4444'; // Red Magma
        if (isWandering) ctx.strokeStyle = '#f59e0b'; // Amber when calm
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Spikes
        if (i % 2 !== 0 && !isHead) {
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.moveTo(segX, segY - width/2);
            ctx.lineTo(segX - 5, segY - width/2 - 15);
            ctx.lineTo(segX + 5, segY - width/2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(segX, segY + width/2);
            ctx.lineTo(segX - 5, segY + width/2 + 15);
            ctx.lineTo(segX + 5, segY + width/2);
            ctx.fill();
        }
        
        if (isHead) {
            const headX = segX + 5;
            const headY = segY;
            const mawSize = width * 0.4;
            
            // Glowing Maw
            const mawGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, mawSize);
            mawGrad.addColorStop(0, '#fef2f2');
            mawGrad.addColorStop(0.4, '#ef4444');
            mawGrad.addColorStop(1, '#450a0a');
            
            ctx.fillStyle = mawGrad;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ef4444';
            ctx.beginPath();
            ctx.arc(headX, headY, mawSize, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Mandibles
            ctx.fillStyle = '#000';
            const openAmount = Math.abs(Math.sin(time * 0.005)) * 10;
            
            // Top
            ctx.beginPath();
            ctx.moveTo(headX, headY - mawSize - 5 - openAmount);
            ctx.lineTo(headX + 30, headY - 10 - openAmount);
            ctx.lineTo(headX, headY - 5 - openAmount);
            ctx.fill();
            
            // Bottom
            ctx.beginPath();
            ctx.moveTo(headX, headY + mawSize + 5 + openAmount);
            ctx.lineTo(headX + 30, headY + 10 + openAmount);
            ctx.lineTo(headX, headY + 5 + openAmount);
            ctx.fill();
        }
    }
    ctx.restore();
}

export const drawBossRed = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const scale = 1.2;
    const pulse = Math.sin(time * 0.003) * 2;
    const breathe = Math.sin(time * 0.005) * 1.5;

    const sacGrad = ctx.createRadialGradient(-30, 0, 10, -20, 0, 50);
    sacGrad.addColorStop(0, '#fca5a5'); 
    sacGrad.addColorStop(0.5, PALETTE.BOSS_RED.GRAD_START); 
    sacGrad.addColorStop(1, PALETTE.BOSS_RED.GRAD_END); 
    
    ctx.fillStyle = sacGrad;
    ctx.beginPath();
    ctx.ellipse(-25, 0, 40 + pulse, 35 + breathe, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, -10); ctx.quadraticCurveTo(-40, 0, -25, 10);
    ctx.moveTo(-15, -20); ctx.quadraticCurveTo(-50, 0, -15, 20);
    ctx.stroke();

    ctx.fillStyle = PALETTE.BOSS_RED.STROKE;
    for(let i=0; i<3; i++) {
        const angle = (i-1) * 0.5;
        const wiggle = Math.sin(time * 0.005 + i) * 5;
        ctx.save();
        ctx.translate(-50, 0);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.quadraticCurveTo(-20, wiggle, -30, 0);
        ctx.lineTo(0, -5);
        ctx.fill();
        ctx.restore();
    }

    ctx.fillStyle = PALETTE.BOSS_RED.STROKE; 
    ctx.beginPath();
    ctx.moveTo(10, -25);
    ctx.lineTo(40, -15); 
    ctx.lineTo(50, 0);   
    ctx.lineTo(40, 15);
    ctx.lineTo(10, 25);
    ctx.quadraticCurveTo(0, 0, 10, -25);
    ctx.fill();
    
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a'; 
    drawCircle(ctx, 35, -10, 3, '#fef08a');
    drawCircle(ctx, 35, 10, 3, '#fef08a');
    drawCircle(ctx, 40, -5, 2, '#fef08a');
    drawCircle(ctx, 40, 5, 2, '#fef08a');

    ctx.strokeStyle = '#450a0a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    for(let i=0; i<6; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const xOff = (Math.floor(i/2) * 15) - 10;
        const legWiggle = Math.sin(time * 0.01 + i) * 5;
        
        ctx.beginPath();
        ctx.moveTo(xOff, side * 20);
        ctx.lineTo(xOff + 10, side * 45 + legWiggle);
        ctx.lineTo(xOff + 20, side * 60 + legWiggle);
        ctx.stroke();
    }
}

export const drawBossBlue = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const charge = Math.abs(Math.sin(time * 0.005));
    const glowIntensity = 10 + charge * 20;

    ctx.fillStyle = `rgba(6, 182, 212, ${0.5 + charge * 0.5})`; 
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = '#06b6d4';
    
    ctx.beginPath();
    ctx.moveTo(-20, -10); ctx.lineTo(-40, -30); ctx.lineTo(-10, -20);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-20, 10); ctx.lineTo(-40, 30); ctx.lineTo(-10, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = PALETTE.BOSS_BLUE.BODY; 
    ctx.strokeStyle = PALETTE.BOSS_BLUE.STROKE; 
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(30, 0); 
    ctx.lineTo(10, 30); 
    ctx.lineTo(-20, 20); 
    ctx.lineTo(-30, 0); 
    ctx.lineTo(-20, -20); 
    ctx.lineTo(10, -30); 
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#172554';
    ctx.fillRect(-20, -8, 50, 16); 
    
    const barrelGlow = ctx.createLinearGradient(0, 0, 40, 0);
    barrelGlow.addColorStop(0, '#2563eb');
    barrelGlow.addColorStop(1, '#93c5fd');
    ctx.fillStyle = barrelGlow;
    ctx.fillRect(0, -4, 40, 8); 

    if (charge > 0.7) {
        ctx.fillStyle = '#fff';
        for(let i=0; i<3; i++) {
            const rx = 30 + Math.random() * 20;
            const ry = (Math.random() - 0.5) * 20;
            ctx.fillRect(rx, ry, 2, 2);
        }
    }

    ctx.strokeStyle = PALETTE.BOSS_BLUE.PLATE;
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const xOff = (i > 1 ? -10 : 10);
        ctx.beginPath();
        ctx.moveTo(xOff, side * 20);
        ctx.lineTo(xOff + 10, side * 40); 
        ctx.lineTo(xOff + 5, side * 55); 
        ctx.stroke();
    }
}

export const drawBossPurple = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const wobble = (angle: number) => Math.sin(angle * 5 + time * 0.002) * 3;
    
    ctx.fillStyle = PALETTE.BOSS_PURPLE.AURA_GRAD_START;
    for(let i=0; i<5; i++) {
        const angle = time * 0.001 + i;
        const r = 50 + Math.sin(time*0.003 + i)*10;
        drawCircle(ctx, Math.cos(angle)*r, Math.sin(angle)*r, 10, 'rgba(168, 85, 247, 0.1)');
    }

    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 45);
    grad.addColorStop(0, '#581c87'); 
    grad.addColorStop(0.7, PALETTE.BOSS_PURPLE.BODY_ALPHA); 
    grad.addColorStop(1, 'rgba(192, 132, 252, 0.4)'); 
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const r = 45 + wobble(angle);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3b0764'; 
    drawCircle(ctx, -10, -10, 12 + Math.sin(time*0.004)*2, '#3b0764');
    drawCircle(ctx, 10, 15, 8 + Math.cos(time*0.004)*2, '#3b0764');
    drawCircle(ctx, 15, -15, 6, '#3b0764');

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 15, 0, 0, Math.PI*2);
    ctx.fill();
    
    const drip = (time % 1000) / 1000; 
    ctx.fillStyle = '#a3e635'; 
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI*2); 
    ctx.fill();
    
    if (drip > 0.5) {
        ctx.beginPath();
        ctx.arc(0, 15 + drip * 20, 4 * (1-drip), 0, Math.PI*2);
        ctx.fill();
    }

    ctx.strokeStyle = PALETTE.BOSS_PURPLE.ORB;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for(let i=0; i<6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const startX = Math.cos(angle) * 40;
        const startY = Math.sin(angle) * 40;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const wave = Math.sin(time * 0.005 + i);
        ctx.quadraticCurveTo(
            startX * 1.5 + wave * 10, 
            startY * 1.5 + wave * 10, 
            startX * 1.8, 
            startY * 1.8
        );
        ctx.stroke();
    }
}

export const drawHiveMother = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const pulse = Math.sin(time * 0.002) * 2;
    const armor = e.armorValue || 0;
    
    const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 70);
    grad.addColorStop(0, PALETTE.HIVE_MOTHER.GRAD_1);
    grad.addColorStop(0.6, PALETTE.HIVE_MOTHER.GRAD_2);
    grad.addColorStop(1, PALETTE.HIVE_MOTHER.GRAD_3);
    
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
        ctx.strokeStyle = PALETTE.HIVE_MOTHER.ARMOR_STROKE;
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

    drawCircle(ctx, 0, 0, 25, PALETTE.HIVE_MOTHER.CORE);
    const innerPulse = Math.sin(time * 0.005) * 5;
    ctx.shadowBlur = 20 + innerPulse;
    ctx.shadowColor = '#fca5a5';
    drawCircle(ctx, 0, 0, 20 + innerPulse * 0.5, PALETTE.HIVE_MOTHER.INNER_GLOW);
    ctx.shadowBlur = 0;
}
