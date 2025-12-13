import { Enemy, EnemyType, BossType, IVisualDefinition, Player, Ally, Turret, TurretType, Entity } from '../../types';
import { 
    drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, 
    drawPustule, drawTubeWorm, drawDevourer, 
    drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother,
    drawPlayerSprite, drawAllySprite, drawTurret
} from '../../utils/renderers';

class VisualRegistry {
    private definitions: Map<string, IVisualDefinition<any>> = new Map();

    // Default definition for fallback
    private readonly defaultDef: IVisualDefinition<Entity> = {
        render: (ctx, e) => {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI*2); ctx.fill();
        },
        getCachePolicy: () => 'STATIC',
        getCacheKey: (e) => `DEFAULT_${e.color}_${e.radius}`
    };

    constructor() {
        this.registerEnemies();
        this.registerFriendlies();
    }

    private registerEnemies() {
        // Standard Enemies
        this.register(EnemyType.GRUNT, drawGrunt, (lod) => lod === 0 ? 'DYNAMIC' : 'STATIC');
        this.register(EnemyType.RUSHER, drawRusher, (lod) => lod === 0 ? 'DYNAMIC' : 'STATIC');
        this.register(EnemyType.TANK, drawTank, (lod) => lod > 0 ? 'STATIC' : 'DYNAMIC');
        this.register(EnemyType.KAMIKAZE, drawKamikaze, (lod) => lod > 0 ? 'STATIC' : 'DYNAMIC');
        this.register(EnemyType.VIPER, drawViper, (lod) => lod > 0 ? 'STATIC' : 'DYNAMIC');
        this.register(EnemyType.PUSTULE, drawPustule, (lod) => lod > 1 ? 'STATIC' : 'DYNAMIC');
        
        // Complex Enemy
        this.register(EnemyType.TUBE_WORM, (ctx, e: Enemy, t, l) => {
            if (e.isBoss) drawDevourer(ctx, e, t);
            else drawTubeWorm(ctx, e, t);
        }, 'DYNAMIC');

        // Bosses (Always Dynamic)
        this.register(BossType.RED_SUMMONER, drawBossRed, 'DYNAMIC');
        this.register(BossType.BLUE_BURST, drawBossBlue, 'DYNAMIC');
        this.register(BossType.PURPLE_ACID, drawBossPurple, 'DYNAMIC');
        this.register(BossType.HIVE_MOTHER, drawHiveMother, 'DYNAMIC');
    }

    private registerFriendlies() {
        // Player: Wrapper to adapt specific signature to generic interface
        this.register('PLAYER', (ctx, e: Player, t) => {
            // NOTE: We assume player is always dynamic, aiming lines are handled separately
            // Movement stride effect depends on input, we simulate or pass logic
            // Ideally Player struct has 'isMoving' state or we derive it
            drawPlayerSprite(ctx, e, t, true); 
        }, 'DYNAMIC');

        // Ally
        this.register('ALLY', (ctx, e: Ally, t) => {
            const isMoving = e.speed > 0 && e.state !== 'PATROL'; // Simplified logic for visual
            drawAllySprite(ctx, e, t, isMoving, false); // Shadows handled by renderer pass
        }, 'DYNAMIC');

        // Turrets (All types use same base function with internal logic)
        const turretRender = (ctx: CanvasRenderingContext2D, e: Turret, t: number) => {
            drawTurret(ctx, e, t, false);
        };
        
        // Register all turret types
        Object.values(TurretType).forEach(type => {
            this.register(type, turretRender, 'STATIC');
        });
    }

    public register<T>(
        key: string, 
        renderFn: (ctx: CanvasRenderingContext2D, e: T, t: number, l?: number) => void,
        cachePolicy: 'STATIC' | 'DYNAMIC' | ((lod: number) => 'STATIC' | 'DYNAMIC')
    ) {
        this.definitions.set(key, {
            render: renderFn,
            getCachePolicy: typeof cachePolicy === 'function' ? cachePolicy : () => cachePolicy,
            getCacheKey: (e: any) => `${key}_${e.color || ''}_${e.radius || 0}_${e.level || 0}`
        });
    }

    /**
     * Resolves the visual key for any entity.
     */
    public resolveKey(entity: any): string {
        if (entity.id === 'player') return 'PLAYER';
        if (entity.type && this.definitions.has(entity.type)) return entity.type;
        if (entity.isBoss && entity.bossType) return entity.bossType;
        if (entity.currentOrder) return 'ALLY'; // Duck typing for Ally
        return 'DEFAULT';
    }

    public getDefinition(entity: any): IVisualDefinition<any> {
        const key = this.resolveKey(entity);
        return this.definitions.get(key) || this.defaultDef;
    }
}

export const visualRegistry = new VisualRegistry();