
import { GameState, FloatingText, FloatingTextType, MissionType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { drawPlanetSprite } from './drawEnvironment';

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
        
        // Fake text shadow
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(ft.text, 2, 2);
        
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, 0, 0);
    }

    ctx.restore();
}
