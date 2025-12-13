
import { GameState } from '../../types';
import { LOD_THRESHOLDS } from '../../data/registry';
import { AssetManager } from '../managers/AssetManager';
import { visualRegistry } from './VisualRegistry';
import { 
    drawTurretSpot, drawBase, drawTurret, drawAllySprite, drawPlayerSprite, 
    drawEnemyBars, isVisible
} from '../../utils/renderers';

export class EntityRenderer {
    private assetManager: AssetManager;

    constructor() {
        this.assetManager = new AssetManager();
    }

    public clearCache() {
        this.assetManager.clearCache();
    }

    public render(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        const { camera } = state;

        // Draw Turret Spots
        if (!state.baseDrop || !state.baseDrop.active || state.baseDrop.phase === 'DEPLOY') {
            state.turretSpots.forEach(spot => {
                if (!isVisible(spot.x, spot.y, 20, camera)) return;
                if (!spot.builtTurret) {
                    drawTurretSpot(ctx, spot, time);
                }
            });
        }

        // Draw Base(s)
        const dropState = (state.baseDrop && state.baseDrop.active) ? state.baseDrop : null;
        const baseY = dropState ? dropState.y : state.base.y;
        const drawingBase = { ...state.base, y: baseY };
        
        drawBase(ctx, drawingBase, state.settings.showShadows, dropState);
        
        if (state.secondaryBase) {
            drawBase(ctx, state.secondaryBase, state.settings.showShadows, null);
        }

        // Draw Turrets
        state.turretSpots.forEach(spot => {
            if (spot.builtTurret) {
                if (!isVisible(spot.x, spot.y, 30, camera)) return;
                drawTurret(ctx, spot.builtTurret, time, state.settings.showShadows);
            }
        });

        // Draw Allies
        state.allies.forEach(ally => {
            if (!isVisible(ally.x, ally.y, ally.radius, camera)) return;
            ctx.save();
            ctx.translate(ally.x, ally.y);
            
            // Render Sprite (Rotated)
            ctx.save();
            ctx.rotate(ally.angle);
            const isMoving = ally.speed > 0;
            drawAllySprite(ctx, ally, time, isMoving, state.settings.showShadows);
            ctx.restore();
            
            ctx.restore();
        });

        // Draw Enemies (Optimized)
        this.renderEnemies(ctx, state, time);

        // Draw Player
        if (!state.baseDrop || !state.baseDrop.active) {
            this.renderPlayer(ctx, state, time);
        }
    }

    private renderEnemies(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        const { camera } = state;
        const showShadows = state.settings.showShadows;
        
        // Dynamic Level-of-Detail Calculation
        const perfMode = state.settings.performanceMode || 'BALANCED';
        const thresholds = LOD_THRESHOLDS[perfMode];
        
        let lodLevel = 0;
        const count = state.enemies.length;
        
        if (count > thresholds.superLow) lodLevel = 2; // Super Low
        else if (count > thresholds.low) lodLevel = 1; // Low

        // --- BATCHING: DRAW ALL SHADOWS FIRST ---
        // This avoids switching ctx.fillStyle and ctx.save/restore thousands of times interleaved
        if (showShadows && lodLevel < 2) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            state.enemies.forEach(e => {
                if (!isVisible(e.x, e.y, e.radius, camera)) return;
                if (e.visualScaleY !== undefined && e.visualScaleY <= 0.5) return; // Don't shadow burrowed units

                // Draw ellipse directly without save/restore/translate overhead if possible
                // Using standard ellipse command
                ctx.moveTo(e.x + e.radius, e.y + 5);
                ctx.ellipse(e.x, e.y + 5, e.radius, e.radius * 0.6, 0, 0, Math.PI*2);
            });
            ctx.fill();
        }

        // --- DRAW ENTITIES ---
        state.enemies.forEach(e => {
            if (!isVisible(e.x, e.y, e.radius, camera)) return;

            ctx.save();
            ctx.translate(e.x, e.y);
            
            // 1. Render Body (Rotated)
            ctx.save();
            ctx.rotate(e.angle);

            // --- DATA DRIVEN RENDERING ---
            const def = visualRegistry.getDefinition(e);
            
            // Try to get a cached sprite
            const sprite = this.assetManager.getSprite(e, def, lodLevel);

            if (sprite) {
                // Static Render (Cached)
                const size = sprite.width;
                const offset = size / 2;
                ctx.drawImage(sprite, -offset, -offset, size, size);
            } else {
                // Dynamic Render (Direct)
                def.render(ctx, e, time, lodLevel);
            }
            ctx.restore(); // End Body Rotation

            // 2. Render UI Bars (Fixed Horizontal Orientation)
            if (e.type !== 'TUBE_WORM' || (e.visualScaleY || 1) > 0.1) {
                drawEnemyBars(ctx, e, lodLevel);
            }
            
            ctx.restore();
        });
    }

    private renderPlayer(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        if (state.player.isAiming) {
            ctx.beginPath();
            ctx.moveTo(state.player.x, state.player.y);
            const endX = state.player.x + Math.cos(state.player.angle) * 3000;
            const endY = state.player.y + Math.sin(state.player.angle) * 3000;
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        const p = state.player;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        
        if (state.settings.showShadows) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(0, 5, p.radius, p.radius*0.6, 0, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.rotate(p.angle);
        drawPlayerSprite(ctx, p, time, true);
        ctx.restore();
    }
}
