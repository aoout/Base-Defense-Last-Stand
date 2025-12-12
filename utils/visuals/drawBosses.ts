
import { Enemy } from '../../types';
import { drawCircle } from '../drawHelpers';
import { PALETTE } from '../../theme/colors';

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
