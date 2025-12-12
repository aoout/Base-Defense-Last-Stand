
import { GameState, Enemy, WeaponType, ModuleType, GameEventType, DamageEnemyEvent, DamagePlayerEvent, DamageBaseEvent, DamageAreaEvent, SpawnParticleEvent, SpawnToxicZoneEvent, PlaySoundEvent, DamageSource, StatId, Projectile, Entity } from '../types';
import { EventBus } from './EventBus';
import { StatManager } from './managers/StatManager';
import { DataManager } from './DataManager';
import { SpatialHashGrid } from '../utils/spatialHash';
import { circlesIntersect, circleIntersectsAABB } from '../utils/collision';
import { EnemyType } from '../types';

/**
 * Handles all physical interactions, collision detection, and immediate combat resolutions.
 * Refactored for readability: Separation of Detection vs. Resolution.
 */
export class PhysicsSystem {
    private getState: () => GameState;
    private events: EventBus;
    private stats: StatManager;
    private data: DataManager;
    
    public spatialGrid: SpatialHashGrid<Enemy>;
    private nearbyCache: Enemy[] = [];

    // Collision Radii Configuration
    private readonly COL_RADIUS = {
        PLAYER: 15,
        ALLY: 12,
        TURRET: 15,
        PROJECTILE_CHECK: 60 // Optimization radius for spatial query
    };

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager, dataManager: DataManager) {
        this.getState = getState;
        this.events = eventBus;
        this.stats = statManager;
        this.data = dataManager;
        this.spatialGrid = new SpatialHashGrid<Enemy>(100);
    }

    public resize(width: number, height: number) {
        this.spatialGrid.resize(width, height);
    }

    public update(dt: number) {
        this.updateSpatialHash();
        this.processProjectiles(); // Main combat loop
        this.processEntityCollisions(); // Kamikaze / specialized collisions
        this.processEnvironmentDamage(dt); // Toxic zones
    }

    private updateSpatialHash() {
        this.spatialGrid.clear();
        const enemies = this.getState().enemies;
        for (let i = 0; i < enemies.length; i++) {
            this.spatialGrid.insert(enemies[i]);
        }
    }

    // --- PIPELINE: PROJECTILE PROCESSING ---

    private processProjectiles() {
        const state = this.getState();
        const projectiles = state.projectiles;

        // Iterate backwards to allow safe removal
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let isDestroyed = false;

            if (p.fromPlayer) {
                isDestroyed = this.handlePlayerProjectile(p);
            } else {
                isDestroyed = this.handleEnemyProjectile(p, state);
            }

            if (isDestroyed) {
                p.rangeRemaining = -1; // Mark for removal by ProjectileManager
            }
        }
    }

    /**
     * Logic for projectiles fired by Player, Allies, or Turrets.
     * Target: Enemies (via SpatialGrid).
     */
    private handlePlayerProjectile(p: Projectile): boolean {
        this.nearbyCache.length = 0;
        this.spatialGrid.query(p.x, p.y, this.COL_RADIUS.PROJECTILE_CHECK, this.nearbyCache);

        for (const enemy of this.nearbyCache) {
            // 1. Check Geometry
            if (!circlesIntersect(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
                continue;
            }

            // 2. Check Logic (Already hit?)
            if (this.hasAlreadyHit(p, enemy.id)) {
                continue;
            }

            // 3. Resolve Impact
            const destroyProjectile = this.resolveHitOnEnemy(p, enemy);
            
            if (destroyProjectile) return true;
        }

        return false;
    }

    /**
     * Logic for projectiles fired by Enemies.
     * Targets: Player, Allies, Turrets, Base.
     */
    private handleEnemyProjectile(p: Projectile, state: GameState): boolean {
        // 1. Check Player
        if (circlesIntersect(p.x, p.y, p.radius, state.player.x, state.player.y, this.COL_RADIUS.PLAYER)) {
            this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: p.damage });
            this.triggerEnvironmentalEffect(p); // e.g. Toxic Zone
            return true;
        }

        // 2. Check Allies
        for (const ally of state.allies) {
            if (circlesIntersect(p.x, p.y, p.radius, ally.x, ally.y, this.COL_RADIUS.ALLY)) {
                ally.hp -= p.damage;
                return true;
            }
        }

        // 3. Check Turrets
        for (const spot of state.turretSpots) {
            if (spot.builtTurret && circlesIntersect(p.x, p.y, p.radius, spot.x, spot.y, this.COL_RADIUS.TURRET)) {
                spot.builtTurret.hp -= p.damage;
                return true;
            }
        }

        // 4. Check Bases (AABB check)
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

    // --- RESOLUTION LOGIC (The "What Happens" Code) ---

    private resolveHitOnEnemy(p: Projectile, e: Enemy): boolean {
        // 1. Calculate and Apply Damage
        const damage = this.calculateDamage(p, e);
        
        this.events.emit<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, { 
            targetId: e.id, 
            amount: damage, 
            source: p.source,
            weaponType: p.weaponType 
        });

        // 2. Visuals
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BULLET_HIT', x: e.x, y: e.y });

        // 3. Special Behaviors
        if (p.isExplosive) {
            this.triggerExplosion(p, damage);
            return true; // Explosives always die
        }

        if (p.isPiercing) {
            this.recordHit(p, e.id);
            return this.checkPierceExhaustion(p); // Maybe die, maybe continue
        }

        return true; // Standard bullets die
    }

    private calculateDamage(p: Projectile, e: Enemy): number {
        // Base Damage Modifier (e.g. Carapace Analyzer upgrades vs specific enemy types)
        const typeMod = this.stats.get(`DMG_VS_${e.type}` as StatId, 1.0);
        let damage = p.damage * typeMod;

        // Piercing Decay (Damage reduces with each target hit)
        if (p.isPiercing && p.hitIds) {
            const hitCount = p.hitIds.length;
            
            if (p.weaponType === WeaponType.PULSE_RIFLE) {
                damage *= Math.pow(0.8, hitCount); // 20% decay
            } else if (p.source === DamageSource.TURRET) {
                damage *= Math.pow(0.92, hitCount); // 8% decay (Railgun)
            } else if (this.hasModule(p, ModuleType.KINETIC_STABILIZER)) {
                if (hitCount === 1) damage *= 0.8; // 2nd hit deals 80%
            }
        }

        return damage;
    }

    private triggerExplosion(p: Projectile, damage: number) {
        const radius = p.explosionRadius || 100;
        this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { 
            x: p.x, y: p.y, radius, damage, source: p.source 
        });
        this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { 
            x: p.x, y: p.y, color: '#f87171', count: 10, speed: 10 
        });
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: p.x, y: p.y });
    }

    private triggerEnvironmentalEffect(p: Projectile) {
        if (p.createsToxicZone) {
            this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: p.x, y: p.y });
        }
    }

    // --- ENTITY INTERACTIONS (Kamikaze, etc.) ---

    private processEntityCollisions() {
        const state = this.getState();
        const kamikazes = state.enemies.filter(e => e.type === EnemyType.KAMIKAZE && e.hp > 0);
        
        for (const k of kamikazes) {
            if (this.checkKamikazeImpact(k, state)) {
                // Manually trigger explosion logic via events
                this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { 
                    x: k.x, y: k.y, radius: 100, damage: k.damage, source: DamageSource.ENEMY
                });
                this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: k.x, y: k.y });
                this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: k.x, y: k.y, color: '#a855f7', count: 12, speed: 15 });
                this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: k.x, y: k.y });
                
                k.hp = 0; // Self-destruct
            }
        }
    }

    private checkKamikazeImpact(k: Enemy, state: GameState): boolean {
        // Player
        if (circlesIntersect(k.x, k.y, k.radius, state.player.x, state.player.y, this.COL_RADIUS.PLAYER)) return true;
        
        // Allies
        if (state.allies.some(a => circlesIntersect(k.x, k.y, k.radius, a.x, a.y, this.COL_RADIUS.ALLY))) return true;

        // Base
        const bases = [state.base, state.secondaryBase].filter((b): b is NonNullable<typeof b> => !!b);
        if (bases.some(b => circleIntersectsAABB(k.x, k.y, k.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height))) return true;

        return false;
    }

    private processEnvironmentDamage(dt: number) {
        const state = this.getState();
        const p = state.player;
        const tickRate = 500; // ms

        for (const z of state.toxicZones) {
            // Optimized: Only calculate damage on tick interval boundaries
            const prevTick = Math.ceil((z.life + dt) / tickRate);
            const currTick = Math.ceil(z.life / tickRate);
            
            if (prevTick !== currTick) {
                if (circlesIntersect(p.x, p.y, this.COL_RADIUS.PLAYER, z.x, z.y, z.radius)) {
                    // Normalize damage to tick rate
                    const tickDamage = z.damagePerSecond * (tickRate / 1000);
                    this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: tickDamage });
                }
            }
        }
    }

    // --- HELPERS ---

    private hasAlreadyHit(p: Projectile, entityId: string): boolean {
        return !!(p.isPiercing && p.hitIds && p.hitIds.includes(entityId));
    }

    private recordHit(p: Projectile, entityId: string) {
        if (!p.hitIds) p.hitIds = [];
        p.hitIds.push(entityId);
    }

    private hasModule(p: Projectile, moduleType: ModuleType): boolean {
        return !!p.activeModules?.some(m => m.type === moduleType);
    }

    private checkPierceExhaustion(p: Projectile): boolean {
        // Special case: Kinetic Stabilizer limits pierce count to 2
        if (this.hasModule(p, ModuleType.KINETIC_STABILIZER)) {
            return (p.hitIds?.length || 0) >= 2;
        }
        return false; // Default piercing (Pulse/Sniper) is typically unlimited but decays
    }
}
