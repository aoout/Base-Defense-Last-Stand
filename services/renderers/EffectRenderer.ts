
import { GameState, Particle } from '../../types';
import { 
    drawBloodStains, 
    drawToxicZones, 
    drawOrbitalBeam, 
    drawProjectilesBatch
} from '../../utils/renderers';
import { getSprite, isVisible } from '../../utils/drawHelpers';

export class EffectRenderer {
    
    // Persistent buffers to avoid creating new Arrays/Objects every frame
    // Key: Color string, Value: Array of particles
    private particleBatches: Map<string, Particle[]> = new Map();

    public renderUnderlay(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        const { camera } = state;

        // Draw Blood Stains (Under everything else)
        if (state.settings.showBlood) {
            drawBloodStains(ctx, state.bloodStains, camera);
        }

        // Draw Toxic Zones (Purple Acid)
        drawToxicZones(ctx, state.toxicZones, time, camera);
    }

    public renderOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        const { camera } = state;

        // Draw Orbital Beams
        if (state.orbitalBeams && state.orbitalBeams.length > 0) {
            state.orbitalBeams.forEach(beam => {
                // Visibility Check
                if (beam.x + 50 > camera.x && beam.x - 50 < camera.x + state.viewportWidth) {
                    drawOrbitalBeam(ctx, beam);
                }
            });
        }

        // Draw Projectiles
        drawProjectilesBatch(ctx, state.projectiles, camera);

        // Draw Particles (Optimized)
        this.renderParticles(ctx, state.particles, camera);
    }

    private renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camera: {x: number, y: number}) {
        if (particles.length === 0) return;

        // 1. Clear previous batches without allocating new Map
        for (const batch of this.particleBatches.values()) {
            batch.length = 0; // Clear array in-place
        }

        // 2. Sort into batches (No new object allocation)
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (!isVisible(p.x, p.y, p.radius, camera)) continue;

            let batch = this.particleBatches.get(p.color);
            if (!batch) {
                batch = [];
                this.particleBatches.set(p.color, batch);
            }
            batch.push(p);
        }

        // 3. Render
        const BASE_SPRITE_SIZE = 32;
        
        // Iterate Map
        for (const [color, batch] of this.particleBatches) {
            if (batch.length === 0) continue;

            const sprite = getSprite(color, BASE_SPRITE_SIZE);
            
            for (let i = 0; i < batch.length; i++) {
                const p = batch[i];
                const drawSize = p.radius * 4; 
                
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.drawImage(
                    sprite, 
                    p.x - drawSize/2, 
                    p.y - drawSize/2, 
                    drawSize, 
                    drawSize
                );
            }
        }
        ctx.globalAlpha = 1.0;
    }
}
