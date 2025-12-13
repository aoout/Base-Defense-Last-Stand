
import { GameState, Entity, Enemy } from '../../types';
import { LOD_THRESHOLDS } from '../../data/registry';
import { AssetManager } from '../managers/AssetManager';
import { visualRegistry } from './VisualRegistry';
import { 
    drawTurretSpot, drawBase, drawEnemyBars, isVisible
} from '../../utils/renderers';
import { PALETTE } from '../../theme/colors';

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
        const dropActive = state.baseDrop && state.baseDrop.active;

        // 1. Static Structures (Turret Spots)
        if (!dropActive || state.baseDrop!.phase === 'DEPLOY') {
            state.turretSpots.forEach(spot => {
                if (!isVisible(spot.x, spot.y, 20, camera)) return;
                if (!spot.builtTurret) {
                    drawTurretSpot(ctx, spot, time);
                }
            });
        }

        // 2. The Base (Special Case: Large Structure with Drop Animation)
        const dropState = dropActive ? state.baseDrop : null;
        const baseY = dropState ? dropState.y : state.base.y;
        const drawingBase = { ...state.base, y: baseY };
        drawBase(ctx, drawingBase, state.settings.showShadows, dropState);
        
        if (state.secondaryBase) {
            drawBase(ctx, state.secondaryBase, state.settings.showShadows, null);
        }

        // 3. Dynamic Entities (Polymorphic Rendering)
        // Group all renderable entities
        const turrets = state.turretSpots.map(s => s.builtTurret).filter((t): t is NonNullable<typeof t> => !!t);
        const allies = state.allies;
        const enemies = state.enemies;
        const player = dropActive ? [] : [state.player]; // Hide player during drop

        // --- BATCH 1: SHADOWS ---
        if (state.settings.showShadows) {
            this.renderShadows(ctx, [...turrets, ...allies, ...enemies, ...player], camera);
        }

        // --- BATCH 2: ENTITIES ---
        // Render order: Turrets -> Enemies -> Allies -> Player (Painter's algorithm)
        this.renderGroup(ctx, turrets, time, camera);
        this.renderGroup(ctx, enemies, time, camera, state.settings.performanceMode);
        this.renderGroup(ctx, allies, time, camera);
        this.renderGroup(ctx, player, time, camera);

        // --- BATCH 3: UI OVERLAYS (Bars, Aim Lines) ---
        if (state.player.isAiming && !dropActive) {
            this.renderAimLine(ctx, state.player);
        }
        
        // Render Health Bars for Enemies (Specific LOD logic)
        const perfMode = state.settings.performanceMode || 'BALANCED';
        const thresholds = LOD_THRESHOLDS[perfMode];
        const count = enemies.length;
        let lod = 0;
        if (count > thresholds.superLow) lod = 2;
        else if (count > thresholds.low) lod = 1;

        enemies.forEach(e => {
            if (!isVisible(e.x, e.y, e.radius + 20, camera)) return;
            
            if (e.type !== 'TUBE_WORM' || (e.visualScaleY || 1) > 0.1) {
                ctx.save();
                ctx.translate(e.x, e.y);
                drawEnemyBars(ctx, e, lod);
                ctx.restore();
            }
        });
    }

    private renderGroup(ctx: CanvasRenderingContext2D, entities: any[], time: number, camera: {x: number, y: number}, perfMode?: string) {
        // Calculate LOD if needed
        let lodLevel = 0;
        if (perfMode) {
            const thresholds = LOD_THRESHOLDS[perfMode as any];
            const count = entities.length;
            if (count > thresholds.superLow) lodLevel = 2;
            else if (count > thresholds.low) lodLevel = 1;
        }

        entities.forEach(e => {
            if (!isVisible(e.x, e.y, e.radius + 20, camera)) return;

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle);

            // Fetch generic definition
            const def = visualRegistry.getDefinition(e);
            
            // Asset Management
            const sprite = this.assetManager.getSprite(e, def, lodLevel);

            if (sprite) {
                const size = sprite.width;
                ctx.drawImage(sprite, -size/2, -size/2, size, size);
            } else {
                def.render(ctx, e, time, lodLevel);
            }

            ctx.restore();
        });
    }

    private renderShadows(ctx: CanvasRenderingContext2D, entities: any[], camera: {x: number, y: number}) {
        ctx.fillStyle = PALETTE.UI.SHADOW;
        ctx.beginPath();
        entities.forEach(e => {
            if (!isVisible(e.x, e.y, e.radius, camera)) return;
            // Skip burrowed
            if (e.visualScaleY !== undefined && e.visualScaleY <= 0.5) return;

            ctx.moveTo(e.x + e.radius, e.y + 5);
            ctx.ellipse(e.x, e.y + 5, e.radius, e.radius * 0.6, 0, 0, Math.PI*2);
        });
        ctx.fill();
    }

    private renderAimLine(ctx: CanvasRenderingContext2D, p: any) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        const endX = p.x + Math.cos(p.angle) * 3000;
        const endY = p.y + Math.sin(p.angle) * 3000;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
