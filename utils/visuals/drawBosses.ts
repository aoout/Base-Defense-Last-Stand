
import { Enemy } from '../../types';
import { drawCircle, drawBioLeg, drawCarapaceBody } from '../drawHelpers';
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

// THE BURROWER (Campaign Boss)
// Redesigned: More menacing, detailed obsidian carapace, magma veins, sharper mandibles.
export const drawDevourer = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const scaleY = e.visualScaleY !== undefined ? e.visualScaleY : 1;
    
    ctx.save();
    ctx.scale(scaleY, scaleY); // Surface emergence scale

    const breathe = Math.sin(time * 0.002);
    const walk = Math.sin(time * 0.008) * 10;

    // --- LEGS (Draw first so they are under body) ---
    const legColor = '#18181b'; // Zinc-950
    const jointColor = '#7f1d1d'; // Deep Red
    
    // 3 Pairs of heavy, armored legs
    const legPairs = [
        { x: 30, y: -25, len: 65, w: 12, angleOffset: -0.4 }, // Front
        { x: 5, y: -45, len: 80, w: 14, angleOffset: 0 },     // Mid (Longest)
        { x: -30, y: -50, len: 70, w: 16, angleOffset: 0.6 }, // Back (Thickest)
    ];

    legPairs.forEach((leg, i) => {
        const sideMult = [1, -1];
        sideMult.forEach(side => {
            const move = Math.sin(time * 0.008 + (i * 2.5) + (side * Math.PI)) * 10;
            const startX = leg.x;
            const startY = leg.y * side;
            
            // Calculate leg endpoint
            const endX = startX + leg.len * Math.cos(leg.angleOffset + (side * 0.15));
            const endY = startY + (leg.len * side) + move;

            // Knee calculation (Midpoint popped out)
            const kneeX = (startX + endX) / 2 + (30 * Math.cos(leg.angleOffset));
            const kneeY = (startY + endY) / 2 + (30 * side * Math.sin(leg.angleOffset + 1.5)); 

            // Draw Leg Segments
            ctx.lineWidth = leg.w;
            ctx.strokeStyle = legColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Thigh
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(kneeX, kneeY);
            ctx.stroke();

            // Shin
            ctx.lineWidth = leg.w * 0.8;
            ctx.beginPath();
            ctx.moveTo(kneeX, kneeY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Armor Plate on Knee
            ctx.fillStyle = '#27272a'; // Dark Grey
            ctx.beginPath();
            ctx.arc(kneeX, kneeY, leg.w * 0.8, 0, Math.PI*2);
            ctx.fill();
            
            // Spike on Knee
            ctx.fillStyle = jointColor;
            ctx.beginPath();
            ctx.moveTo(kneeX, kneeY);
            ctx.lineTo(kneeX + 8, kneeY - (12 * side));
            ctx.lineTo(kneeX - 8, kneeY - (8 * side));
            ctx.fill();
            
            // Claw tip
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX + 5, endY + (5 * side));
            ctx.lineTo(endX - 2, endY + (8 * side));
            ctx.fill();
        });
    });

    // --- BODY SEGMENTS ---
    // Overlapping plates from tail to head
    const segments = 6;
    const bodyWidthBase = 70;
    
    for(let i=0; i<segments; i++) {
        // Calculate taper
        const progress = i / segments; 
        const w = (bodyWidthBase * 0.5) + (bodyWidthBase * 0.5 * Math.sin(progress * Math.PI * 0.8)); 
        const h = w * 0.8;
        
        const xOffset = -60 + (i * 22);
        const yWiggle = Math.sin(time * 0.005 + i) * 2;
        
        ctx.save();
        ctx.translate(xOffset, yWiggle);

        // Armor Plate Shape (Shield-like)
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(0, -h/2);
        ctx.lineTo(-15, -h/2 * 0.8);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-15, h/2 * 0.8);
        ctx.lineTo(0, h/2);
        ctx.closePath();
        
        // Base Fill
        ctx.fillStyle = '#09090b'; // Obsidian
        ctx.fill();

        // Magma Underglow (Internal heat showing at edges)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#c2410c'; // Orange-700
        ctx.strokeStyle = `rgba(249, 115, 22, ${0.1 + breathe * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Metallic Shine
        const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
        grad.addColorStop(0, '#27272a');
        grad.addColorStop(0.4, '#09090b');
        grad.addColorStop(0.6, '#09090b');
        grad.addColorStop(1, '#27272a');
        ctx.fillStyle = grad;
        ctx.fill();

        // Central Spine Ridge
        ctx.fillStyle = '#450a0a'; 
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(8, -4);
        ctx.lineTo(8, 4);
        ctx.fill();

        // Cracks / Veins
        if (i > 1) {
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(5, (i%2 === 0 ? 1 : -1) * 8);
            ctx.stroke();
        }

        ctx.restore();
    }

    // --- HEAD UNIT ---
    ctx.save();
    ctx.translate(65, 0); // Head position

    // Neck Connector
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-15, -15, 15, 30);

    // Mandibles (Lower - Under head)
    const bite = Math.sin(time * 0.01) * 0.2;
    
    const drawMandible = (side: number, size: number, color: string) => {
        ctx.save();
        ctx.scale(1, side);
        ctx.rotate(bite);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.quadraticCurveTo(size * 0.5, size, size, 0); // Hook tip
        ctx.quadraticCurveTo(size * 0.6, 5, 0, 5); // Inner edge
        ctx.fill();
        
        ctx.restore();
    };

    // Inner small jaws
    drawMandible(1, 30, '#7f1d1d');
    drawMandible(-1, 30, '#7f1d1d');

    // Head Armor Plate (Cowl)
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(15, -12);
    ctx.lineTo(30, 0); // Snout
    ctx.lineTo(15, 12);
    ctx.lineTo(-10, 20);
    ctx.lineTo(-5, 0); // Indent
    ctx.closePath();
    ctx.fill();
    
    // Highlight
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer Massive Mandibles
    drawMandible(1, 55, '#1c1917');
    drawMandible(-1, 55, '#1c1917');

    // Glowing Eyes (Cluster)
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fbbf24'; // Amber
    ctx.fillStyle = '#fbbf24';
    
    // 4 Eyes arrangement
    drawCircle(ctx, 15, -8, 3.5, '#fbbf24');
    drawCircle(ctx, 15, 8, 3.5, '#fbbf24');
    drawCircle(ctx, 8, -12, 2.5, '#f59e0b');
    drawCircle(ctx, 8, 12, 2.5, '#f59e0b');
    
    ctx.shadowBlur = 0;
    
    // Pupil highlights
    ctx.fillStyle = '#fff';
    ctx.fillRect(16, -9, 1, 1);
    ctx.fillRect(16, 7, 1, 1);
    
    ctx.restore(); // End Head

    // --- REAR SPIKES ---
    ctx.save();
    ctx.translate(-70, 0);
    ctx.fillStyle = '#450a0a';
    for(let i=0; i<3; i++) {
        const yOff = (i-1) * 12;
        ctx.beginPath();
        ctx.moveTo(0, yOff);
        ctx.lineTo(-25, yOff * 1.8);
        ctx.lineTo(-5, yOff + (i===1 ? 0 : i===0 ? -6 : 6));
        ctx.fill();
    }
    ctx.restore();

    ctx.restore(); // End Scale
};
