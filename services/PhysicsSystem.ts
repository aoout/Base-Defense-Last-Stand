
import { GameState, Enemy, GameEventType, DamagePlayerEvent, DamageBaseEvent, DamageAreaEvent, SpawnParticleEvent, SpawnToxicZoneEvent, PlaySoundEvent, DamageSource, Projectile, Entity } from '../types';
import { EventBus } from './EventBus';
import { StatManager } from './managers/StatManager';
import { DataManager } from './DataManager';
import { SpatialHashGrid } from '../utils/spatialHash';
import { circlesIntersect, circleIntersectsAABB } from '../utils/collision';
import { EnemyType } from '../types';
import { CombatEvaluator } from './systems/CombatEvaluator';

/**
 * PhysicsSystem
 * Role: The "Eyes" of the engine. It detects overlaps and geometry checks.
 * It delegates the "Consequences" of those overlaps to the CombatEvaluator.
 */
export class PhysicsSystem {
    private getState: () => GameState;
    private events: EventBus;
    
    public spatialGrid: SpatialHashGrid<Enemy>;
    private combat: CombatEvaluator;
    private nearbyCache: Enemy[] = [];

    // Collision Radii Configuration
    private readonly COL_RADIUS = {
        PLAYER: 15,
        ALLY: 12,
        TURRET: 15,
        PROJECTILE_CHECK: 60
    };

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager, dataManager: DataManager) {
        this.getState = getState;
        this.events = eventBus;
        
        // Instantiate the Logic Sub-system
        this.combat = new CombatEvaluator(statManager, eventBus);
        this.spatialGrid = new SpatialHashGrid<Enemy>(100);
    }

    public resize(width: number, height: number) {
        this.spatialGrid.resize(width, height);
    }

    public update(dt: number) {
        this.updateSpatialHash();
        
        // 1. Combat resolution (Projectiles)
        this.processProjectiles(); 
        
        // 2. Physical Body collisions (Kamikazes)
        this.processEntityCollisions(); 
        
        // 3. Environmental Hazards (Acid pools)
        this.processEnvironmentDamage(dt); 
    }

    private updateSpatialHash() {
        this.spatialGrid.clear();
        const enemies = this.getState().enemies;
        for (let i = 0; i < enemies.length; i++) {
            this.spatialGrid.insert(enemies[i]);
        }
    }

    // --- PROJECTILE PIPELINE ---

    private processProjectiles() {
        const state = this.getState();
        const projectiles = state.projectiles;

        // Iterate backwards for safe removal
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            
            // Mark for removal if range exhausted (handled by ProjectileManager usually, but safe double check)
            if (p.rangeRemaining <= 0) {
                // already marked, skip physics
                continue;
            }

            const collisionHappened = p.fromPlayer 
                ? this.checkPlayerProjectileCollisions(p)
                : this.checkEnemyProjectileCollisions(p, state);

            if (collisionHappened) {
                p.rangeRemaining = -1; // Flag for removal
            }
        }
    }

    /**
     * Checks collisions for Player/Ally/Turret bullets against Enemies.
     */
    private checkPlayerProjectileCollisions(p: Projectile): boolean {
        this.nearbyCache.length = 0;
        this.spatialGrid.query(p.x, p.y, this.COL_RADIUS.PROJECTILE_CHECK, this.nearbyCache);

        for (const enemy of this.nearbyCache) {
            // A. Geometric Check
            if (!circlesIntersect(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
                continue;
            }

            // B. Logic Check (Don't hit same target twice if piercing)
            if (this.combat.hasAlreadyHit(p, enemy.id)) {
                continue;
            }

            // C. Resolution
            this.combat.resolveHit(p, enemy);

            // D. Lifecycle Check
            if (this.combat.shouldTerminate(p, enemy)) {
                return true; // Destroy projectile
            }
        }

        return false;
    }

    /**
     * Checks collisions for Enemy bullets against Player side.
     */
    private checkEnemyProjectileCollisions(p: Projectile, state: GameState): boolean {
        // 1. Player
        if (circlesIntersect(p.x, p.y, p.radius, state.player.x, state.player.y, this.COL_RADIUS.PLAYER)) {
            this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: p.damage });
            this.combat.triggerEnvironmentalEffect(p);
            return true;
        }

        // 2. Allies
        // Optimization: Simple loop is fast enough for < 10 allies
        for (const ally of state.allies) {
            if (circlesIntersect(p.x, p.y, p.radius, ally.x, ally.y, this.COL_RADIUS.ALLY)) {
                ally.hp -= p.damage;
                return true;
            }
        }

        // 3. Turrets
        for (const spot of state.turretSpots) {
            if (spot.builtTurret && circlesIntersect(p.x, p.y, p.radius, spot.x, spot.y, this.COL_RADIUS.TURRET)) {
                spot.builtTurret.hp -= p.damage;
                return true;
            }
        }

        // 4. Bases (AABB)
        const bases = [state.base, state.secondaryBase].filter((b): b is NonNullable<typeof b> => !!b);
        for (const b of bases) {
            if (circleIntersectsAABB(p.x, p.y, p.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height)) {
                b.hp -= p.damage;
                this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: p.damage });
                return true;
            }
        }

        return false;
    }

    // --- PHYSICAL ENTITY COLLISIONS ---

    private processEntityCollisions() {
        const state = this.getState();
        // Check Kamikazes
        const kamikazes = state.enemies.filter(e => e.type === EnemyType.KAMIKAZE && e.hp > 0);
        
        for (const k of kamikazes) {
            if (this.checkKamikazeImpact(k, state)) {
                // Detonate
                this.combat.triggerExplosion({ x: k.x, y: k.y, explosionRadius: 100, source: DamageSource.ENEMY } as Projectile, k.damage);
                this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: k.x, y: k.y });
                this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: k.x, y: k.y, color: '#a855f7', count: 12, speed: 15 });
                
                k.hp = 0; // Destroy entity
            }
        }
    }

    private checkKamikazeImpact(k: Enemy, state: GameState): boolean {
        // Check Player
        if (circlesIntersect(k.x, k.y, k.radius, state.player.x, state.player.y, this.COL_RADIUS.PLAYER)) return true;
        
        // Check Allies
        if (state.allies.some(a => circlesIntersect(k.x, k.y, k.radius, a.x, a.y, this.COL_RADIUS.ALLY))) return true;

        // Check Bases
        const bases = [state.base, state.secondaryBase].filter((b): b is NonNullable<typeof b> => !!b);
        if (bases.some(b => circleIntersectsAABB(k.x, k.y, k.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height))) return true;

        return false;
    }

    private processEnvironmentDamage(dt: number) {
        const state = this.getState();
        const p = state.player;
        const tickRate = 500; // ms

        // Optimization: Only run collision check on tick intervals, not every frame
        for (const z of state.toxicZones) {
            const prevTick = Math.ceil((z.life + dt) / tickRate);
            const currTick = Math.ceil(z.life / tickRate);
            
            if (prevTick !== currTick) {
                if (circlesIntersect(p.x, p.y, this.COL_RADIUS.PLAYER, z.x, z.y, z.radius)) {
                    const tickDamage = z.damagePerSecond * (tickRate / 1000);
                    this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: tickDamage });
                }
            }
        }
    }
}
