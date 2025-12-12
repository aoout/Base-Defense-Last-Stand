
import { Enemy } from '../../types';
import { drawCircle, drawEllipse, drawPolygon, drawSmoothLeg } from '../drawHelpers';
import { PALETTE } from '../../theme/colors';

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
