
import { Projectile, OrbitalBeam, ToxicZone, BloodStain, WeaponType, ModuleType, DamageSource } from '../types';
import { isVisible, getSprite } from './drawHelpers';

// NOTE: drawParticlesBatch has been moved to EffectRenderer class to use persistent pooling.

export const drawProjectile = (ctx: CanvasRenderingContext2D, p: Projectile) => {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    
    if (p.isHoming) {
        ctx.fillStyle = p.color; 
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -3); ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FBBF24'; 
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -2); ctx.lineTo(-8, 2); ctx.fill();
    } else if (p.source === DamageSource.TURRET && p.speed > 50) {
        // High Speed Turret Railgun (Beam)
        ctx.fillStyle = p.color;
        // Draw elongated beam
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillRect(-20, -1.5, 40, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-15, -0.5, 30, 1);
        ctx.shadowBlur = 0;
    } else if (p.createsToxicZone) {
        ctx.fillStyle = '#A855F7'; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI*2); ctx.fill();
        if (Math.random() < 0.3) { ctx.fillStyle = '#D8B4FE'; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI*2); ctx.fill(); }
    } else if (p.weaponType === WeaponType.FLAMETHROWER) {
         const maxRange = p.maxRange || 350;
         const lifePct = (maxRange - p.rangeRemaining) / maxRange;
         const currentRadius = 3 + lifePct * 12;
         let color = 'rgba(255, 255, 255, 0.8)';
         if (lifePct > 0.1) color = 'rgba(255, 230, 0, 0.8)'; 
         if (lifePct > 0.3) color = 'rgba(255, 100, 0, 0.7)'; 
         if (lifePct > 0.6) color = 'rgba(200, 20, 20, 0.5)'; 
         if (lifePct > 0.8) color = 'rgba(50, 50, 50, 0.3)'; 
         
         ctx.globalCompositeOperation = 'lighter'; 
         ctx.fillStyle = color; 
         ctx.beginPath(); ctx.arc(0, 0, currentRadius, 0, Math.PI * 2); ctx.fill(); 
         ctx.globalCompositeOperation = 'source-over';
    } else {
        // Fallback for singular draws of normal bullets
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI*2); ctx.fill();
    }

    ctx.rotate(-p.angle);
    ctx.translate(-p.x, -p.y);
}

// BATCHED PROJECTILE RENDERER
export const drawProjectilesBatch = (ctx: CanvasRenderingContext2D, projectiles: Projectile[], camera: {x: number, y: number}) => {
    if (projectiles.length === 0) return;

    const simpleBatches: Record<string, Projectile[]> = {};
    const complexList: Projectile[] = [];
    const BASE_SPRITE_SIZE = 32;

    // 1. Sorting
    for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!isVisible(p.x, p.y, p.radius + 20, camera)) continue;

        // Check for complex rendering types including the new Railgun logic (high speed turret shots)
        if (p.isHoming || p.createsToxicZone || p.weaponType === WeaponType.FLAMETHROWER || (p.source === DamageSource.TURRET && p.speed > 50)) {
            complexList.push(p);
        } else {
            if (!simpleBatches[p.color]) {
                simpleBatches[p.color] = [];
            }
            simpleBatches[p.color].push(p);
        }
    }

    // 2. Draw Simple Batches (Blitting)
    for (const color in simpleBatches) {
        const sprite = getSprite(color, BASE_SPRITE_SIZE);
        const batch = simpleBatches[color];
        
        for (let i = 0; i < batch.length; i++) {
            const p = batch[i];
            const drawSize = p.radius * 4;
            ctx.drawImage(sprite, p.x - drawSize/2, p.y - drawSize/2, drawSize, drawSize);
        }
    }

    // 3. Draw Complex Projectiles (Legacy method)
    for (let i = 0; i < complexList.length; i++) {
        drawProjectile(ctx, complexList[i]);
    }
};

export const drawOrbitalBeam = (ctx: CanvasRenderingContext2D, beam: OrbitalBeam) => {
    ctx.save();
    
    // Ensure beam.life is non-negative to prevent NaN in Math.pow
    const lifeFactor = Math.max(0, beam.life);
    const currentWidth = beam.width * Math.pow(lifeFactor, 0.5);
    const opacity = lifeFactor;
    
    const grad = ctx.createLinearGradient(beam.x - currentWidth/2, 0, beam.x + currentWidth/2, 0);
    grad.addColorStop(0, 'rgba(6,182,212,0)');
    grad.addColorStop(0.2, `rgba(6,182,212,${opacity})`);
    grad.addColorStop(0.5, `rgba(255,255,255,${opacity})`); 
    grad.addColorStop(0.8, `rgba(6,182,212,${opacity})`);
    grad.addColorStop(1, 'rgba(6,182,212,0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(beam.x - currentWidth/2, beam.y - 1000, currentWidth, 1000);
    
    const safeRadius = Math.max(0.1, currentWidth * 2); 
    const grdRadial = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, safeRadius);
    grdRadial.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    grdRadial.addColorStop(0.5, `rgba(6, 182, 212, ${opacity * 0.5})`);
    grdRadial.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = grdRadial;
    ctx.beginPath();
    ctx.arc(beam.x, beam.y, safeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(6,182,212,${opacity * 0.2})`;
    ctx.fillRect(beam.x - currentWidth * 2, beam.y - 1500, currentWidth * 4, 1500);

    ctx.restore();
}

export const drawBloodStains = (ctx: CanvasRenderingContext2D, stains: BloodStain[], camera: {x: number, y: number}) => {
    stains.forEach(s => {
        if (!isVisible(s.x, s.y, 40, camera)) return;

        ctx.save();
        ctx.translate(s.x, s.y);
        const opacity = Math.min(0.7, s.life / 1000); 
        ctx.globalAlpha = opacity;
        ctx.fillStyle = s.color;
        s.blotches.forEach(b => {
             ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
    });
};

export const drawToxicZones = (ctx: CanvasRenderingContext2D, zones: ToxicZone[], time: number, camera: {x: number, y: number}) => {
    zones.forEach(zone => {
        if (!isVisible(zone.x, zone.y, zone.radius, camera)) return;

        ctx.save();
        ctx.translate(zone.x, zone.y);
        
        let seed = 0;
        for(let i=0; i<zone.id.length; i++) seed += zone.id.charCodeAt(i);
        
        const scale = 1 + Math.sin(time * 0.005 + seed) * 0.05;
        
        const radius = Math.max(0.1, zone.radius * scale); 
        const grad = ctx.createRadialGradient(0,0, 0, 0,0, radius);
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
        grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.4)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#DDD6FE';
        for (let i = 0; i < 5; i++) {
             const r = zone.radius * 0.8 * Math.random();
             const theta = Math.random() * Math.PI * 2;
             const size = 3 + Math.sin(time * 0.01 + i) * 2;
             ctx.beginPath(); ctx.arc(Math.cos(theta) * r, Math.sin(theta) * r, size, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });
}
