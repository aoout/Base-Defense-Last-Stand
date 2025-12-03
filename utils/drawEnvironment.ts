
import { TerrainFeature, TerrainType, Planet, GameMode, BiomeType, TurretSpot, PlanetVisualType, MissionType } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { BIOME_STYLES } from '../data/world';
import { pRand, isVisible } from './drawHelpers';

// New Optimization: Render static terrain to an off-screen canvas once
export const renderStaticTerrainToCache = (terrain: TerrainFeature[], gameMode: GameMode, planet: Planet | null): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    let style = BIOME_STYLES[BiomeType.BARREN];
    if (gameMode === GameMode.EXPLORATION && planet) {
        style = BIOME_STYLES[planet.biome] || BIOME_STYLES[BiomeType.BARREN];
    }

    // 1. Ground Color
    ctx.fillStyle = style.groundColor; 
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 2. Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<WORLD_WIDTH; i+=200) { ctx.moveTo(i,0); ctx.lineTo(i, WORLD_HEIGHT); }
    for(let i=0; i<WORLD_HEIGHT; i+=200) { ctx.moveTo(0,i); ctx.lineTo(WORLD_WIDTH, i); }
    ctx.stroke();

    // 3. Static Features
    terrain.forEach((t, idx) => {
        if ([TerrainType.MAGMA_POOL, TerrainType.ALIEN_TREE, TerrainType.SPORE_POD].includes(t.type)) return;

        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.rotation) ctx.rotate(t.rotation);
        
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
            
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, -t.radius*0.5, 2, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    });

    if (style.atmosphereColor !== 'rgba(0,0,0,0)') {
        ctx.fillStyle = style.atmosphereColor;
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    return canvas;
};

export const drawDynamicTerrainFeatures = (ctx: CanvasRenderingContext2D, terrain: TerrainFeature[], time: number, camera: {x: number, y: number}) => {
    terrain.forEach((t, idx) => {
        if (![TerrainType.MAGMA_POOL, TerrainType.ALIEN_TREE, TerrainType.SPORE_POD].includes(t.type)) return;
        
        if (!isVisible(t.x, t.y, t.radius, camera)) return;

        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.rotation) ctx.rotate(t.rotation);
        const seed = t.x * t.y + idx;

        if (t.type === TerrainType.MAGMA_POOL) {
            const pulse = Math.sin(time * 0.002 + idx) * 0.05 + 1;
            
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
            
            const bubbleTime = time * 0.001;
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
        else if (t.type === TerrainType.ALIEN_TREE) {
            ctx.fillStyle = '#4a044e'; 
            ctx.beginPath();
            ctx.moveTo(-3, 0); ctx.lineTo(-2, -t.radius); ctx.lineTo(2, -t.radius); ctx.lineTo(3, 0);
            ctx.fill();
            
            const pulse = Math.sin(time * 0.001 + seed) * 0.05 + 1;
            ctx.fillStyle = t.variant === 0 ? '#15803d' : t.variant === 1 ? '#be123c' : '#7e22ce';
            ctx.beginPath();
            ctx.arc(0, -t.radius, t.radius * 0.7 * pulse, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.arc(-3, -t.radius-3, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, -t.radius+2, 1.5, 0, Math.PI*2); ctx.fill();
        }
        else if (t.type === TerrainType.SPORE_POD) {
            const pulse = (Math.sin(time * 0.003 + seed) + 1) * 0.5;
            ctx.fillStyle = '#365314'; 
            ctx.beginPath(); ctx.arc(0, 0, t.radius, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = `rgba(132, 204, 22, ${pulse})`; 
            ctx.beginPath(); ctx.arc(0, 0, t.radius * 0.4, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    });
};

export const drawCachedTerrain = (ctx: CanvasRenderingContext2D, cache: HTMLCanvasElement) => {
    ctx.drawImage(cache, 0, 0);
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
        
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke(); 
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
