
import { Player, Ally, WeaponType } from '../../types';
import { WEAPONS } from '../../data/registry';
import { drawCircle, drawEllipse } from '../drawHelpers';
import { PALETTE } from '../../theme/colors';

// --- WEAPON RENDERERS ---

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

// --- UNIT UI ---

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

// --- ENTITY RENDERERS ---

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
