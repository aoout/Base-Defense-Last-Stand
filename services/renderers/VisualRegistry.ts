
import { Enemy, EnemyType, BossType, IVisualDefinition } from '../../types';
import { 
    drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, 
    drawPustule, drawTubeWorm, drawDevourer, 
    drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother 
} from '../../utils/renderers';

class VisualRegistry {
    private enemyRegistry: Map<EnemyType, IVisualDefinition<Enemy>> = new Map();
    private bossRegistry: Map<BossType, IVisualDefinition<Enemy>> = new Map();

    // Default definition for fallback
    private readonly defaultDef: IVisualDefinition<Enemy> = {
        render: drawGrunt,
        getCachePolicy: () => 'STATIC',
        getCacheKey: (e) => `DEFAULT_${e.color}_${e.radius}`
    };

    constructor() {
        this.registerDefaults();
    }

    private registerDefaults() {
        // --- STANDARD ENEMIES ---
        
        // Grunt: Animated on High Quality (LOD 0), Cached on others
        this.registerEnemy(EnemyType.GRUNT, drawGrunt, (lod) => lod === 0 ? 'DYNAMIC' : 'STATIC');
        
        // Rusher: Animated on High Quality (LOD 0), Cached on others
        this.registerEnemy(EnemyType.RUSHER, drawRusher, (lod) => lod === 0 ? 'DYNAMIC' : 'STATIC');
        
        // Tank: Has moving legs animation, but in Low LOD we cache it static
        this.registerEnemy(EnemyType.TANK, drawTank, (lod) => lod > 0 ? 'STATIC' : 'DYNAMIC');
        
        // Kamikaze: Pulsing effect, generally dynamic on High quality
        this.registerEnemy(EnemyType.KAMIKAZE, drawKamikaze, (lod) => lod > 0 ? 'STATIC' : 'DYNAMIC');
        
        // Viper: Flying wing movement
        this.registerEnemy(EnemyType.VIPER, drawViper, (lod) => lod > 0 ? 'STATIC' : 'DYNAMIC');
        
        // Pustule: Pulsing organic structure, rarely moves but pulses. 
        // Cacheable on low settings, but dynamic logic is simple.
        this.registerEnemy(EnemyType.PUSTULE, drawPustule, (lod) => lod > 1 ? 'STATIC' : 'DYNAMIC');

        // Tube Worm: Complex logic (burrowing, segments). 
        // NEVER CACHE unless totally static underground (which we don't render anyway).
        // Actually, Tube Worm needs dynamic drawing for its segments.
        this.registerEnemy(EnemyType.TUBE_WORM, (ctx, e, t, l) => {
            if (e.isBoss) drawDevourer(ctx, e, t);
            else drawTubeWorm(ctx, e, t);
        }, 'DYNAMIC');

        // --- BOSSES ---
        // Bosses are generally unique and high-detail, so DYNAMIC is preferred unless heavily optimized.
        this.registerBoss(BossType.RED_SUMMONER, drawBossRed);
        this.registerBoss(BossType.BLUE_BURST, drawBossBlue);
        this.registerBoss(BossType.PURPLE_ACID, drawBossPurple);
        this.registerBoss(BossType.HIVE_MOTHER, drawHiveMother);
    }

    private registerEnemy(
        type: EnemyType, 
        renderFn: (ctx: CanvasRenderingContext2D, e: any, t: number, l?: number) => void,
        cachePolicy: 'STATIC' | 'DYNAMIC' | ((lod: number) => 'STATIC' | 'DYNAMIC')
    ) {
        this.enemyRegistry.set(type, {
            render: renderFn,
            getCachePolicy: typeof cachePolicy === 'function' ? cachePolicy : () => cachePolicy,
            getCacheKey: (e) => `ENEMY_${type}_${e.color}_${e.radius}`
        });
    }

    private registerBoss(
        type: BossType,
        renderFn: (ctx: CanvasRenderingContext2D, e: any, t: number) => void
    ) {
        this.bossRegistry.set(type, {
            render: renderFn,
            getCachePolicy: () => 'DYNAMIC', // Bosses are always dynamic
            getCacheKey: (e) => `BOSS_${type}_${e.color}_${e.radius}` // Unused if dynamic
        });
    }

    /**
     * Retrieves the visual definition for a given enemy entity.
     * Automatically resolves Boss vs Standard types.
     */
    public getDefinition(enemy: Enemy): IVisualDefinition<Enemy> {
        if (enemy.isBoss && enemy.bossType && this.bossRegistry.has(enemy.bossType)) {
            return this.bossRegistry.get(enemy.bossType)!;
        }
        return this.enemyRegistry.get(enemy.type) || this.defaultDef;
    }

    /**
     * Legacy support for direct rendering if needed, 
     * though direct usage of getDefinition is preferred.
     */
    public renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number, lodLevel: number = 0) {
        const def = this.getDefinition(enemy);
        def.render(ctx, enemy, time, lodLevel);
    }
}

export const visualRegistry = new VisualRegistry();
