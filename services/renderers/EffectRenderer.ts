
import { GameState } from '../../types';
import { 
    drawBloodStains, 
    drawToxicZones, 
    drawOrbitalBeam, 
    drawProjectilesBatch, 
    drawParticlesBatch 
} from '../../utils/renderers';

export class EffectRenderer {
    
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

        // Draw Particles
        drawParticlesBatch(ctx, state.particles, camera);
    }
}
