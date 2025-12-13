
import { Projectile, IVisualDefinition } from '../../types';
import { drawProjectile } from '../../utils/renderers';

export class AssetManager {
    private spriteCache: Map<string, HTMLCanvasElement> = new Map();

    /**
     * Clears the entire cache.
     */
    public clearCache() {
        this.spriteCache.clear();
    }

    /**
     * Generic sprite retrieval.
     * If the definition says STATIC, it attempts to fetch/create a cached canvas.
     * If DYNAMIC, it returns null (caller should draw directly).
     */
    public getSprite<T>(entity: T, def: IVisualDefinition<T>, lodLevel: number): HTMLCanvasElement | null {
        // 1. Check Policy
        const policy = def.getCachePolicy(lodLevel);
        if (policy === 'DYNAMIC') return null;

        // 2. Generate Key
        // We append LOD level to key because Low LOD might draw differently (less detail) even if static
        const key = `${def.getCacheKey(entity)}_LOD${lodLevel}`;

        if (this.spriteCache.has(key)) {
            return this.spriteCache.get(key)!;
        }

        // 3. Generate Sprite
        // We assume 'radius' exists on entity for sizing, or we pass a size?
        // In this game, all renderable entities have a radius.
        const radius = (entity as any).radius || 20;
        const buffer = 40; // Extra draw space
        const size = (radius + buffer) * 2;
        const center = size / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (ctx) {
            ctx.translate(center, center);
            // Render at time 0 for static snapshot
            def.render(ctx, entity, 0, lodLevel);
        }

        this.spriteCache.set(key, canvas);
        return canvas;
    }

    /**
     * Legacy projectile caching (could be refactored into VisualRegistry too, but kept simple here)
     */
    public getProjectileSprite(p: Projectile): HTMLCanvasElement | null {
        if (!p.isHoming && !p.createsToxicZone && p.weaponType !== 'Flamethrower') return null;

        const key = `PROJ_${p.weaponType}_${p.color}_${p.isHoming}`;
        
        if (this.spriteCache.has(key)) {
            return this.spriteCache.get(key)!;
        }

        const size = 32;
        const center = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.translate(center, center);
            const mockProj: any = { ...p, x: 0, y: 0, angle: 0 };
            drawProjectile(ctx, mockProj);
        }

        this.spriteCache.set(key, canvas);
        return canvas;
    }
}
