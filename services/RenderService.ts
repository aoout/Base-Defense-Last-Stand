
import { GameState, AppMode } from '../types';
import { drawStartScreen, drawExplorationMap } from '../utils/renderers';
import { InputManager } from './InputManager';
import { TerrainRenderer } from './renderers/TerrainRenderer';
import { EffectRenderer } from './renderers/EffectRenderer';
import { EntityRenderer } from './renderers/EntityRenderer';
import { UIRenderer } from './renderers/UIRenderer';

export class RenderService {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    
    // Sub-Renderers
    private terrainRenderer: TerrainRenderer;
    private effectRenderer: EffectRenderer;
    private entityRenderer: EntityRenderer;
    private uiRenderer: UIRenderer;

    constructor() {
        this.terrainRenderer = new TerrainRenderer();
        this.effectRenderer = new EffectRenderer();
        this.entityRenderer = new EntityRenderer();
        this.uiRenderer = new UIRenderer();
    }

    public setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on backbuffer
    }

    public render(state: GameState, input: InputManager, time: number) {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;

        // --- Resolution Scaling Logic ---
        const scale = state.settings.resolutionScale || 1.0;
        // Reset transform to identity then apply scale
        ctx.setTransform(scale, 0, 0, scale, 0, 0); 

        // Clear Screen (Viewport coordinates)
        ctx.clearRect(0, 0, state.viewportWidth, state.viewportHeight);

        // MODE SWITCHING RENDER
        if (state.appMode === AppMode.START_MENU) {
            drawStartScreen(ctx, time, state.viewportWidth, state.viewportHeight);
            return;
        }

        if (state.appMode === AppMode.EXPLORATION_MAP) {
            drawExplorationMap(ctx, state, time);
            return;
        }

        // Don't render gameplay in specific UI modes that cover full screen opaque
        if ([
            AppMode.SPACESHIP_VIEW, 
            AppMode.ORBITAL_UPGRADES, 
            AppMode.CARAPACE_GRID, 
            AppMode.SHIP_COMPUTER, 
            AppMode.INFRASTRUCTURE_RESEARCH, 
            AppMode.PLANET_CONSTRUCTION, 
            AppMode.YIELD_REPORT, 
            AppMode.BIO_SEQUENCING
        ].includes(state.appMode)) {
            return;
        }

        this.renderGameplay(ctx, state, input, time);
    }

    private renderGameplay(ctx: CanvasRenderingContext2D, state: GameState, input: InputManager, time: number) {
        const { camera } = state;

        // Apply Camera Translate (cumulative to scale)
        ctx.translate(-camera.x, -camera.y);

        // 1. Terrain Layer
        // Check for context changes (new planet) inside renderer
        this.terrainRenderer.render(ctx, state, time);
        
        // If terrain changed, clear entity cache too (cleaner lifecycle management)
        // We can detect this via a flag in state or check if terrain object changed, 
        // but for now relying on TerrainRenderer's internal check is mostly for terrain cache.
        // Entity cache clearing is handled by GameService or we can expose a method.
        
        // 2. Underlay Effects (Blood, Toxins)
        this.effectRenderer.renderUnderlay(ctx, state, time);

        // 3. Entities (Base, Turrets, Enemies, Player, Allies)
        this.entityRenderer.render(ctx, state, time);

        // 4. Overlay Effects (Projectiles, Particles, Beams)
        this.effectRenderer.renderOverlay(ctx, state, time);

        // 5. Canvas UI (Floating Text, Reload Bars)
        this.uiRenderer.render(ctx, state);
    }
}
