
import { Turret, TurretType, BaseDropState } from '../../types';
import { drawCircle, drawStrokeCircle, drawEllipse } from '../drawHelpers';
import { PALETTE } from '../../theme/colors';

export const drawDropPod = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
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
