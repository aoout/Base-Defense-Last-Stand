
import { GameState } from '../../types';
import { renderStaticTerrainToCache, drawCachedTerrain, drawDynamicTerrainFeatures } from '../../utils/renderers';

export class TerrainRenderer {
    private terrainCache: HTMLCanvasElement | null = null;
    private lastTerrainRef: any = null;

    public render(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
        // 1. Draw Space Terrain (Background) - Optimized Cache
        if (state.terrain !== this.lastTerrainRef) {
            // Regenerate cache if terrain reference changed (New planet or reset)
            this.terrainCache = renderStaticTerrainToCache(
                state.terrain, 
                state.gameMode, 
                state.currentPlanet, 
                state.worldWidth, 
                state.worldHeight
            );
            this.lastTerrainRef = state.terrain;
        }

        if (this.terrainCache) {
            drawCachedTerrain(ctx, this.terrainCache);
        }
        
        // Draw only animated parts if setting is enabled
        if (state.settings.animatedBackground) {
            drawDynamicTerrainFeatures(ctx, state.terrain, time, state.camera);
        }

        // Draw World Borders
        ctx.strokeStyle = '#4B5563';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, state.worldWidth, state.worldHeight);
    }

    public clearCache() {
        this.terrainCache = null;
        this.lastTerrainRef = null;
    }
}
