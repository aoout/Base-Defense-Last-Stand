
import { Enemy } from '../../types';
import { drawCircle, drawEllipse, drawPolygon, drawBioLeg, drawCarapaceBody } from '../drawHelpers';
import { PALETTE } from '../../theme/colors';

/**
 * Draws floating health/armor bars.
 */
export const drawEnemyBars = (ctx: CanvasRenderingContext2D, e: Enemy, lodLevel: number) => {
    if (lodLevel >= 2) return; 

    const isDamaged = e.hp < e.maxHp;
    const hasArmor = e.type === 'TANK' && e.shellValue && e.shellValue > 0;
    
    if (!e.isBoss && !hasArmor && !isDamaged) return;

    const hpPct = Math.max(0, e.hp / e.maxHp);
    const radius = e.radius;
    const yOff = radius + 12;
    
    let barW = 24;
    let barH = 2;
    
    if (e.isBoss) {
        barW = 60;
        barH = 4;
    } else if (e.type === 'TANK') {
        barW = 32;
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; 
    ctx.fillRect(-barW/2, yOff, barW, barH);

    if (e.isBoss) {
        const grad = ctx.createLinearGradient(-barW/2, 0, barW/2, 0);
        grad.addColorStop(0, '#a855f7'); 
        grad.addColorStop(1, '#ef4444'); 
        ctx.fillStyle = grad;
    } else {
        if (hpPct > 0.5) ctx.fillStyle = '#10b981';
        else if (hpPct > 0.25) ctx.fillStyle = '#facc15';
        else ctx.fillStyle = '#ef4444';
    }
    ctx.fillRect(-barW/2, yOff, barW * hpPct, barH);

    if (e.isBoss) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-barW/2 - 2, yOff - 2); ctx.lineTo(-barW/2 - 4, yOff - 2); ctx.lineTo(-barW/2 - 4, yOff + barH + 2); ctx.lineTo(-barW/2 - 2, yOff + barH + 2);
        ctx.moveTo(barW/2 + 2, yOff - 2); ctx.lineTo(barW/2 + 4, yOff - 2); ctx.lineTo(barW/2 + 4, yOff + barH + 2); ctx.lineTo(barW/2 + 2, yOff + barH + 2);
        ctx.stroke();
    }

    if (hasArmor) {
        const maxShell = e.maxShell || 100;
        const shellPct = (e.shellValue || 0) / maxShell;
        const shellY = yOff - 4;
        const shellH = 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; ctx.fillRect(-barW/2, shellY, barW, shellH);
        ctx.fillStyle = '#06b6d4'; ctx.fillRect(-barW/2, shellY, barW * shellPct, shellH);
    }
}

// --- STANDARD ENEMIES ---

export const drawGrunt = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawCircle(ctx, 0, 0, 10, PALETTE.ZERG.SKIN_LIGHT);
        return;
    }

    const isLowDetail = lodLevel === 1;
    const wiggle = isLowDetail ? 0 : Math.sin(time * 0.02) * 2;
    const breathe = isLowDetail ? 0 : Math.sin(time * 0.005) * 1;

    // Draw Legs (3 pairs)
    // Fixed flip directions to ensure knees point OUTWARD relative to body
    const legConfigs = [
        { start: {x:-2, y:-4}, end: {x:-10, y:-16}, flip: -1 }, // Front Left (Outward)
        { start: {x:2, y:-4}, end: {x:10, y:-16}, flip: 1 },   // Front Right (Outward)
        { start: {x:-2, y:0}, end: {x:-14, y:0}, flip: 1 },     // Mid Left (Arch Up)
        { start: {x:2, y:0}, end: {x:14, y:0}, flip: -1 },      // Mid Right (Arch Up)
        { start: {x:-2, y:4}, end: {x:-8, y:16}, flip: 1 },     // Back Left (Arch Up)
        { start: {x:2, y:4}, end: {x:8, y:16}, flip: -1 },      // Back Right (Arch Up)
    ];

    legConfigs.forEach((leg, i) => {
        const move = i % 2 === 0 ? wiggle : -wiggle;
        drawBioLeg(ctx, leg.start, { x: leg.end.x + move, y: leg.end.y }, {
            color: PALETTE.ZERG.LEG,
            width: isLowDetail ? 2 : 3,
            kneeOffset: 5 * leg.flip,
            segments: true // Use hard segments for insect look
        });
    });

    if (!isLowDetail) {
        drawEllipse(ctx, -6, 0, 9, 7 + breathe, PALETTE.ZERG.SKIN_DARK);
        drawCarapaceBody(ctx, 3, 0, 7, 6, { main: PALETTE.ZERG.SKIN_LIGHT, highlight: '#b91c1c' });
        drawPolygon(ctx, [{x: -2, y: -4}, {x: 8, y: -3}, {x: 8, y: 3}, {x: -2, y: 4}], PALETTE.ZERG.CARAPACE);

        ctx.strokeStyle = PALETTE.ZERG.MANDIBLE; 
        ctx.lineWidth = 2;
        const bite = Math.sin(time * 0.015) * 2;
        ctx.beginPath();
        ctx.moveTo(12, -2); ctx.lineTo(18, -4 + bite); ctx.lineTo(16, -1);
        ctx.moveTo(12, 2); ctx.lineTo(18, 4 - bite); ctx.lineTo(16, 1);
        ctx.stroke();

        drawCircle(ctx, 11, -2, 1.5, PALETTE.ZERG.EYE);
        drawCircle(ctx, 11, 2, 1.5, PALETTE.ZERG.EYE);
    } else {
        drawCircle(ctx, 0, 0, 8, PALETTE.ZERG.SKIN_DARK);
        drawCircle(ctx, 5, 0, 4, PALETTE.ZERG.CARAPACE);
    }
}

export const drawRusher = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawPolygon(ctx, [{x:10, y:0}, {x:-5, y:-5}, {x:-5, y:5}], PALETTE.RUSHER.BODY_GRAD_END);
        return;
    }

    if (lodLevel < 1) {
        const enginePulse = Math.sin(time * 0.05);
        ctx.fillStyle = PALETTE.RUSHER.GLOW;
        ctx.beginPath(); 
        ctx.moveTo(-5, 0); ctx.lineTo(-25 - enginePulse*5, -8); ctx.lineTo(-20, 0); ctx.lineTo(-25 - enginePulse*5, 8); 
        ctx.fill();
    }

    const grad = ctx.createLinearGradient(-10, 0, 15, 0); 
    grad.addColorStop(0, PALETTE.RUSHER.BODY_GRAD_START); grad.addColorStop(1, PALETTE.RUSHER.BODY_GRAD_END);
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.quadraticCurveTo(5, 7, -10, 4); ctx.lineTo(-12, 0); ctx.quadraticCurveTo(5, -7, 15, 0); 
    ctx.fill();

    if (lodLevel < 1) {
        // Scythe Arms - Curves work better for Rushers
        drawBioLeg(ctx, {x: 5, y: 3}, {x: 20, y: 6}, { color: PALETTE.RUSHER.CARAPACE_STROKE, width: 2, kneeOffset: 8, segments: false });
        drawBioLeg(ctx, {x: 5, y: -3}, {x: 20, y: -6}, { color: PALETTE.RUSHER.CARAPACE_STROKE, width: 2, kneeOffset: -8, segments: false });

        ctx.fillStyle = PALETTE.RUSHER.CARAPACE_STROKE;
        drawPolygon(ctx, [{x:-5, y:0}, {x:-2, y:-5}, {x:1, y:0}], PALETTE.RUSHER.CARAPACE_STROKE);
        drawPolygon(ctx, [{x:0, y:0}, {x:3, y:5}, {x:6, y:0}], PALETTE.RUSHER.CARAPACE_STROKE);

        drawCircle(ctx, 12, -2, 1.5, PALETTE.RUSHER.EYE);
        drawCircle(ctx, 12, 2, 1.5, PALETTE.RUSHER.EYE);
    }
}

export const drawTank = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawCircle(ctx, 0, 0, 30, PALETTE.TANK.SHELL);
        return;
    }

    const breathe = Math.sin(time * 0.002);
    const walk = Math.sin(time * 0.005) * 5;
    const legColor = PALETTE.TANK.LEG;
    const jColor = PALETTE.TANK.SHELL;
    
    // Front Legs - Outward
    drawBioLeg(ctx, {x: 0, y: 20}, {x: 20, y: 35 - walk}, { color: legColor, width: 6, kneeOffset: 10, jointColor: jColor, segments: true });
    drawBioLeg(ctx, {x: 0, y: -20}, {x: 20, y: -35 + walk}, { color: legColor, width: 6, kneeOffset: -10, jointColor: jColor, segments: true });
    
    // Back Legs - Corrected offsets to buckle outward/back
    // Left (Bottom)
    drawBioLeg(ctx, {x: -20, y: 15}, {x: -30, y: 25 + walk}, { color: legColor, width: 8, kneeOffset: -12, jointColor: jColor, segments: true });
    // Right (Top)
    drawBioLeg(ctx, {x: -20, y: -15}, {x: -30, y: -25 - walk}, { color: legColor, width: 8, kneeOffset: 12, jointColor: jColor, segments: true });

    drawCarapaceBody(ctx, 0, 0, 35, 25 + breathe, { main: PALETTE.TANK.BODY });

    ctx.fillStyle = PALETTE.TANK.SHELL;
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(15, 20); ctx.lineTo(-15, 0); ctx.lineTo(15, -20);
    ctx.fill(); ctx.stroke();

    drawCarapaceBody(ctx, 35, 0, 15, 10, { main: PALETTE.TANK.PLATE, highlight: PALETTE.TANK.HIGHLIGHT });
    
    drawCircle(ctx, 40, -6, 2, PALETTE.TANK.EYE);
    drawCircle(ctx, 40, 6, 2, PALETTE.TANK.EYE);

    if (e.shellValue && e.shellValue > 0) {
        const shellPct = e.shellValue / (e.maxShell || 100);
        ctx.save();
        ctx.globalAlpha = (shellPct * 0.3 + 0.1);
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 55, 40, 0, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = `rgba(34, 211, 238, 0.1)`; ctx.fill();
        ctx.restore();
    }
}

export const drawKamikaze = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawCircle(ctx, 0, 0, 8, '#9333ea');
        return;
    }

    const pulse = (Math.sin(time * 0.015) + 1) * 0.5; 
    const shake = Math.sin(time * 0.1) * 0.5;
    
    ctx.save(); ctx.translate(shake, shake);

    const sackGrad = ctx.createRadialGradient(-5, 0, 2, -5, 0, 14); 
    sackGrad.addColorStop(0, PALETTE.KAMIKAZE.SACK_START); 
    sackGrad.addColorStop(0.5, PALETTE.KAMIKAZE.SACK_MID); 
    sackGrad.addColorStop(1, PALETTE.KAMIKAZE.SACK_END);
    ctx.fillStyle = sackGrad; 
    ctx.beginPath(); ctx.ellipse(-5, 0, 12 + pulse*2, 10 + pulse*2, 0, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = PALETTE.KAMIKAZE.VEIN; ctx.lineWidth = 1; 
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12 - pulse, -6 - pulse); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12 - pulse, 6 + pulse); ctx.stroke(); 

    drawCircle(ctx, 8, 0, 5, PALETTE.KAMIKAZE.BODY);
    
    const legSpeed = Math.sin(time * 0.05) * 3; 
    drawBioLeg(ctx, {x: 8, y: -2}, {x: 14, y: -8 + legSpeed}, { color: PALETTE.KAMIKAZE.LEG, width: 2, kneeOffset: -3, segments: true });
    drawBioLeg(ctx, {x: 8, y: 2}, {x: 14, y: 8 + legSpeed}, { color: PALETTE.KAMIKAZE.LEG, width: 2, kneeOffset: 3, segments: true });
    
    ctx.restore();
}

export const drawViper = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    if (lodLevel >= 2) {
        drawPolygon(ctx, [{x:10, y:0}, {x:-10, y:-5}, {x:-10, y:5}], PALETTE.VIPER.BODY_STROKE);
        return;
    }

    const flap = Math.sin(time * 0.008) * 0.5;

    ctx.strokeStyle = PALETTE.VIPER.BODY_STROKE; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-15, 10, -25, 0); ctx.stroke();

    ctx.fillStyle = PALETTE.VIPER.WING_FILL; ctx.strokeStyle = PALETTE.VIPER.WING_STROKE; ctx.lineWidth = 1;
    ctx.save(); ctx.scale(1, 1 + flap * 0.2); 
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.bezierCurveTo(-5, 25, -20, 20, -15, 0); ctx.bezierCurveTo(-20, -20, -5, -25, 5, 0); 
    ctx.fill(); ctx.stroke(); ctx.restore();

    ctx.fillStyle = PALETTE.VIPER.BODY_STROKE; 
    drawPolygon(ctx, [{x:5, y:-4}, {x:18, y:-6}, {x:15, y:-2}, {x:5, y:0}, {x:15, y:2}, {x:18, y:6}, {x:5, y:4}], PALETTE.VIPER.BODY_STROKE);

    drawCircle(ctx, -5, 10 + flap*5, 2, PALETTE.VIPER.GLOW);
    drawCircle(ctx, -5, -10 - flap*5, 2, PALETTE.VIPER.GLOW);
}

export const drawPustule = (ctx: CanvasRenderingContext2D, e: Enemy, time: number, lodLevel: number = 0) => {
    const pulse = Math.sin(time * 0.002) * 2;
    const r = e.radius + pulse;

    const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
    grad.addColorStop(0, '#bef264'); grad.addColorStop(0.6, '#65a30d'); grad.addColorStop(1, '#3f6212'); 
    
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
    ctx.closePath(); ctx.fill();

    const orificeOpen = Math.sin(time * 0.005);
    ctx.fillStyle = '#1a2e05';
    ctx.beginPath(); ctx.ellipse(0, -5, r * 0.4 + orificeOpen * 2, r * 0.3 + orificeOpen * 2, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        ctx.moveTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
        ctx.lineTo(Math.cos(angle) * (r + 5), Math.sin(angle) * (r + 5));
    }
    ctx.stroke();
}

export const drawTubeWorm = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const scaleY = e.visualScaleY !== undefined ? e.visualScaleY : 1;
    if (scaleY <= 0.05) {
        ctx.fillStyle = '#574135'; drawEllipse(ctx, 0, 0, e.radius, e.radius * 0.4, '#574135');
        return;
    }

    ctx.save();
    const segmentCount = 8;
    const maxLen = e.radius * 3.6; 
    const currentLen = maxLen * scaleY;
    const segSpacing = currentLen / segmentCount;
    let baseWidth = e.radius * 1.6; 

    for(let i = segmentCount; i >= 0; i--) {
        const progress = i / segmentCount; 
        const wiggle = Math.sin(progress * Math.PI * 1.5 + time * 0.005) * (5 * scaleY);
        const segX = (segmentCount - i) * (segSpacing * 0.8) - (e.radius * 0.6); 
        const segY = wiggle;
        const width = (baseWidth - Math.abs(progress - 0.5) * 8) * scaleY;
        const isHead = i === 0;
        let color = i % 2 === 0 ? '#d97706' : '#f59e0b'; 
        if (isHead) color = '#78350f'; 
        
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(segX, segY, segSpacing * 0.8, width / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1; ctx.stroke();
        
        if (isHead) {
            const headX = segX + 4;
            const mawSize = width * 0.35;
            drawCircle(ctx, headX, segY, mawSize, '#451a03'); 
            ctx.fillStyle = '#fef3c7'; 
            const teethCount = 8;
            for(let t=0; t<teethCount; t++) {
                const angle = (t / teethCount) * Math.PI * 2 + time * 0.002; 
                const tx = headX + Math.cos(angle) * (mawSize - 1);
                const ty = segY + Math.sin(angle) * (mawSize - 1);
                drawCircle(ctx, tx, ty, (width * 0.06) * scaleY, '#fef3c7');
            }
        }
    }
    ctx.restore();
    
    if (scaleY > 0) {
        ctx.fillStyle = 'rgba(63, 44, 34, 0.6)';
        const moundSize = (e.radius) + 3;
        drawEllipse(ctx, -e.radius * 0.3, 0, moundSize, moundSize * 0.6, 'rgba(63, 44, 34, 0.6)');
    }
}
