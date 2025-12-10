
import { EnemyType, BossType, Projectile, Enemy } from '../../types';
import { 
    drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawTubeWorm,
    drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother,
    drawProjectile
} from '../../utils/renderers';

export class AssetManager {
    private spriteCache: Map<string, HTMLCanvasElement> = new Map();

    /**
     * Clears the entire cache. Useful when changing quality settings or themes.
     */
    public clearCache() {
        this.spriteCache.clear();
    }

    /**
     * Generates or retrieves a cached sprite for an enemy.
     * The sprite is a static snapshot (time = 0) of the entity.
     */
    public getEnemySprite(type: EnemyType, bossType: BossType | undefined, color: string, radius: number): HTMLCanvasElement {
        // Create a unique key for this specific visual configuration
        const key = `ENEMY_${type}_${bossType || 'NONE'}_${color}_${radius}`;

        if (this.spriteCache.has(key)) {
            return this.spriteCache.get(key)!;
        }

        // Generate the sprite
        const buffer = 40; // Extra space for limbs/glows extending beyond radius
        const size = (radius + buffer) * 2;
        const center = size / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (ctx) {
            ctx.translate(center, center);
            // Mock enemy object for the drawer
            const mockEnemy: any = {
                type,
                bossType,
                isBoss: !!bossType,
                color,
                radius,
                // Static mock data
                x: 0, y: 0, angle: 0, hp: 100, maxHp: 100,
                visualScaleY: 1 // For Tube Worm
            };

            // Rotate -90deg because our draw functions assume facing right (0), 
            // but for a sprite we usually want it facing UP or Right consistently.
            // Actually, drawUnits assume standard canvas orientation. 
            // Let's draw it neutral.
            
            // Draw the unit at time=0 (Static Pose)
            if (bossType) {
                switch (bossType) {
                    case BossType.RED_SUMMONER: drawBossRed(ctx, mockEnemy, 0); break;
                    case BossType.BLUE_BURST: drawBossBlue(ctx, mockEnemy, 0); break;
                    case BossType.PURPLE_ACID: drawBossPurple(ctx, mockEnemy, 0); break;
                    case BossType.HIVE_MOTHER: drawHiveMother(ctx, mockEnemy, 0); break;
                }
            } else {
                switch (type) {
                    case EnemyType.GRUNT: drawGrunt(ctx, mockEnemy, 0, 0); break;
                    case EnemyType.RUSHER: drawRusher(ctx, mockEnemy, 0, 0); break;
                    case EnemyType.TANK: drawTank(ctx, mockEnemy, 0, 0); break;
                    case EnemyType.KAMIKAZE: drawKamikaze(ctx, mockEnemy, 0, 0); break;
                    case EnemyType.VIPER: drawViper(ctx, mockEnemy, 0, 0); break;
                    case EnemyType.TUBE_WORM: drawTubeWorm(ctx, mockEnemy, 0); break;
                }
            }
        }

        this.spriteCache.set(key, canvas);
        return canvas;
    }

    /**
     * Generates or retrieves a cached sprite for a projectile.
     * Mostly useful for complex projectiles, as simple circles are fast enough.
     */
    public getProjectileSprite(p: Projectile): HTMLCanvasElement | null {
        // Only cache complex projectiles
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
            // Mock projectile
            const mockProj: any = {
                ...p,
                x: 0, y: 0, angle: 0
            };
            drawProjectile(ctx, mockProj);
        }

        this.spriteCache.set(key, canvas);
        return canvas;
    }
}
