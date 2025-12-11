
import { GameState, PerformanceMode } from '../../types';
import { LOD_THRESHOLDS } from '../../data/registry';
import { AssetManager } from '../managers/AssetManager';
import { 
    drawTurretSpot, drawBase, drawTurret, drawAllySprite, drawPlayerSprite, 
    drawEnemyBars, drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, 
    drawPustule, drawTubeWorm, drawDevourer, drawBossRed, drawBossBlue, 
    drawBossPurple, drawHiveMother, isVisible
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
            ctx.rotate(ally.angle);
            const isMoving = ally.speed > 0;
            drawAllySprite(ctx, ally, time, isMoving, state.settings.showShadows);
            ctx.restore();
        });

        // Draw Enemies
        this.renderEnemies(ctx, state, time);

        // Draw Player (Only if Base is NOT dropping)
        if (!state.baseDrop || !state.baseDrop.active) {
            this.renderPlayer(ctx, state, time);
        }
    }

    private renderEnemies(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        const { camera } = state;
        
        // Dynamic Level-of-Detail Calculation
        const perfMode = state.settings.performanceMode || 'BALANCED';
        const thresholds = LOD_THRESHOLDS[perfMode];
        
        let lodLevel = 0;
        const count = state.enemies.length;
        
        if (count > thresholds.superLow) lodLevel = 2; // Super Low
        else if (count > thresholds.low) lodLevel = 1; // Low

        const useCachedSprites = lodLevel > 0;

        state.enemies.forEach(e => {
            if (!isVisible(e.x, e.y, e.radius, camera)) return;

            ctx.save();
            ctx.translate(e.x, e.y);
            
            // Shadow
            if (state.settings.showShadows && (e.visualScaleY === undefined || e.visualScaleY > 0.5)) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(0, 5, e.radius, e.radius*0.6, 0, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.rotate(e.angle);

            if (useCachedSprites && e.type !== 'PUSTULE' && e.type !== 'TUBE_WORM') {
                const sprite = this.assetManager.getEnemySprite(e.type, e.bossType, e.color, e.radius);
                const size = sprite.width;
                const offset = size / 2;
                ctx.drawImage(sprite, -offset, -offset, size, size);
            } else {
                // Vector Drawing (Animated)
                if (e.isBoss && e.bossType) {
                    switch(e.bossType) {
                        case 'RED_SUMMONER': drawBossRed(ctx, e, time); break;
                        case 'BLUE_BURST': drawBossBlue(ctx, e, time); break;
                        case 'PURPLE_ACID': drawBossPurple(ctx, e, time); break;
                        case 'HIVE_MOTHER': drawHiveMother(ctx, e, time); break;
                    }
                } else {
                    switch(e.type) {
                        case 'GRUNT': drawGrunt(ctx, e, time, lodLevel); break;
                        case 'RUSHER': drawRusher(ctx, e, time, lodLevel); break;
                        case 'TANK': drawTank(ctx, e, time, lodLevel); break;
                        case 'KAMIKAZE': drawKamikaze(ctx, e, time, lodLevel); break;
                        case 'VIPER': drawViper(ctx, e, time, lodLevel); break;
                        case 'PUSTULE': drawPustule(ctx, e, time, lodLevel); break;
                        case 'TUBE_WORM': 
                            if (e.isBoss) drawDevourer(ctx, e, time);
                            else drawTubeWorm(ctx, e, time);
                            break;
                    }
                }
            }
            
            // UI Bars (HP / Shell)
            // Hide bars if underground
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
        // We assume InputManager is handled by the Engine and passed via state flags if needed, 
        // but here we might need to know if player is moving for animation.
        // A clean way is to check player velocity if we had physics, 
        // but currently we check Input keys in RenderService. 
        // For now, let's assume 'true' for simplicity or add a flag to Player entity later.
        // Or simpler: pass isMoving as an argument? 
        // Since we split the renderer, we lost the `input` reference.
        // Let's rely on a visual trick or add a prop to Player. 
        // Hack: Math.sin(time) always animates "breathing", movement leg stride only matters a bit.
        // We will default isMoving to true for breathing animation, or derive it.
        // Just always animate for now to keep it simple.
        drawPlayerSprite(ctx, p, time, true);
        ctx.restore();
    }
}
