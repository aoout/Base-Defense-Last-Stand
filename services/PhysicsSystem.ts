
import { GameState, Enemy, GameEventType, Projectile, IGameSystem, EnemyType, CollisionProjectileEnemyEvent, CollisionProjectilePlayerEvent, CollisionProjectileBaseEvent, CollisionProjectileAllyEvent, CollisionKamikazeEvent } from '../types';
import { EventBus } from './EventBus';
import { StatManager } from './managers/StatManager';
import { DataManager } from './DataManager';
import { SpatialHashGrid } from '../utils/spatialHash';
import { circlesIntersect, circleIntersectsAABB } from '../utils/collision';

/**
 * PhysicsSystem (Refactored)
 * Role: The "Eyes" of the engine. It ONLY detects overlaps.
 * It emits collision events that other systems (CombatSystem) react to.
 */
export class PhysicsSystem implements IGameSystem {
    public readonly systemId = 'PHYSICS_SYSTEM';

    private getState: () => GameState;
    private events: EventBus;
    
    public spatialGrid: SpatialHashGrid<Enemy>;
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
        this.spatialGrid = new SpatialHashGrid<Enemy>(100);
    }

    public resize(width: number, height: number) {
        this.spatialGrid.resize(width, height);
    }

    public update(dt: number) {
        this.updateSpatialHash();
        
        // 1. Projectiles
        this.processProjectiles(); 
        
        // 2. Physical Body collisions (Kamikazes)
        this.processEntityCollisions(); 
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

        // Iterate backwards for safe removal references (though removal happens via range flag now)
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            
            // Skip already destroyed projectiles
            if (p.rangeRemaining <= 0) continue;

            if (p.fromPlayer) {
                this.checkPlayerProjectileCollisions(p);
            } else {
                this.checkEnemyProjectileCollisions(p, state);
            }
        }
    }

    /**
     * Checks collisions for Player/Ally/Turret bullets against Enemies.
     */
    private checkPlayerProjectileCollisions(p: Projectile) {
        this.nearbyCache.length = 0;
        this.spatialGrid.query(p.x, p.y, this.COL_RADIUS.PROJECTILE_CHECK, this.nearbyCache);

        for (const enemy of this.nearbyCache) {
            // A. Geometric Check
            if (!circlesIntersect(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
                continue;
            }

            // B. Logic Check (Don't hit same target twice if piercing)
            // Note: Projectile hit history is stored on the projectile itself
            if (p.isPiercing && p.hitIds && p.hitIds.includes(enemy.id)) {
                continue;
            }

            // C. Emit Event
            this.events.emit<CollisionProjectileEnemyEvent>(GameEventType.COLLISION_PROJECTILE_ENEMY, {
                projectile: p,
                enemy: enemy
            });

            // Note: Physics doesn't decide to destroy the bullet. 
            // CombatSystem listens to the event and sets p.rangeRemaining = -1 if needed.
            // If the bullet is destroyed by CombatSystem, we break the loop to prevent hitting multiple enemies in same frame
            // (Unless it's piercing, handled by Logic)
            
            if (p.rangeRemaining <= 0) break;
        }
    }

    /**
     * Checks collisions for Enemy bullets against Player side.
     */
    private checkEnemyProjectileCollisions(p: Projectile, state: GameState) {
        // 1. Player
        if (circlesIntersect(p.x, p.y, p.radius, state.player.x, state.player.y, this.COL_RADIUS.PLAYER)) {
            this.events.emit<CollisionProjectilePlayerEvent>(GameEventType.COLLISION_PROJECTILE_PLAYER, { projectile: p });
            return;
        }

        // 2. Allies
        for (const ally of state.allies) {
            if (circlesIntersect(p.x, p.y, p.radius, ally.x, ally.y, this.COL_RADIUS.ALLY)) {
                this.events.emit<CollisionProjectileAllyEvent>(GameEventType.COLLISION_PROJECTILE_ALLY, { 
                    projectile: p, 
                    allyId: ally.id 
                });
                return;
            }
        }

        // 3. Turrets
        for (const spot of state.turretSpots) {
            if (spot.builtTurret && circlesIntersect(p.x, p.y, p.radius, spot.x, spot.y, this.COL_RADIUS.TURRET)) {
                // Simplified: Treat turret hit as base damage or separate?
                // Legacy system treated it as structure damage.
                // Reusing CollisionProjectileBase for simplicity or logic can be handled in CombatSystem
                // For now, let's treat turret hit as generic base hit or just damage it directly if we want strict decoupling
                // Ideally: Emit COLLISION_PROJECTILE_TURRET. 
                // Fallback: We'll modify CombatSystem to handle Turret HP if we had IDs.
                // Quick Fix: Allow Physics to modify HP ONLY for simple structures? 
                // No, sticking to pattern: Emit Base Hit (structure damage).
                this.events.emit<CollisionProjectileBaseEvent>(GameEventType.COLLISION_PROJECTILE_BASE, { projectile: p });
                return;
            }
        }

        // 4. Bases (AABB)
        const bases = [state.base, state.secondaryBase].filter((b): b is NonNullable<typeof b> => !!b);
        for (const b of bases) {
            if (circleIntersectsAABB(p.x, p.y, p.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height)) {
                this.events.emit<CollisionProjectileBaseEvent>(GameEventType.COLLISION_PROJECTILE_BASE, { projectile: p });
                return;
            }
        }
    }

    // --- PHYSICAL ENTITY COLLISIONS ---

    private processEntityCollisions() {
        const state = this.getState();
        // Check Kamikazes
        const kamikazes = state.enemies.filter(e => e.type === EnemyType.KAMIKAZE && e.hp > 0);
        
        for (const k of kamikazes) {
            // Check Player
            if (circlesIntersect(k.x, k.y, k.radius, state.player.x, state.player.y, this.COL_RADIUS.PLAYER)) {
                this.events.emit<CollisionKamikazeEvent>(GameEventType.COLLISION_KAMIKAZE_IMPACT, { enemy: k, targetType: 'PLAYER' });
                continue;
            }
            
            // Check Allies
            if (state.allies.some(a => circlesIntersect(k.x, k.y, k.radius, a.x, a.y, this.COL_RADIUS.ALLY))) {
                this.events.emit<CollisionKamikazeEvent>(GameEventType.COLLISION_KAMIKAZE_IMPACT, { enemy: k, targetType: 'ALLY' });
                continue;
            }

            // Check Bases
            const bases = [state.base, state.secondaryBase].filter((b): b is NonNullable<typeof b> => !!b);
            if (bases.some(b => circleIntersectsAABB(k.x, k.y, k.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height))) {
                this.events.emit<CollisionKamikazeEvent>(GameEventType.COLLISION_KAMIKAZE_IMPACT, { enemy: k, targetType: 'BASE' });
                continue;
            }
        }
    }
}
