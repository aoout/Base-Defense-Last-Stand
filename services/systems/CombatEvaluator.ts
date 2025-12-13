
import { Enemy, Projectile, WeaponType, ModuleType, DamageSource, GameEventType, StatId, DamageEnemyEvent, PlaySoundEvent, SpawnParticleEvent, DamageAreaEvent, SpawnToxicZoneEvent, IGameSystem, GameState, DamagePlayerEvent, DamageBaseEvent, CollisionProjectileEnemyEvent, CollisionProjectilePlayerEvent, CollisionKamikazeEvent, CollisionProjectileAllyEvent } from '../../types';
import { StatManager } from '../managers/StatManager';
import { EventBus } from '../EventBus';
import { TOXIC_ZONE_STATS } from '../../data/registry';
import { circlesIntersect, circleIntersectsAABB } from '../../utils/collision';
import { SpatialHashGrid } from '../../utils/spatialHash';

/**
 * CombatSystem
 * Responsibilities:
 * 1. Listen for Collision Events from PhysicsSystem.
 * 2. Calculate Damage (Stats, Armor, Tech).
 * 3. Apply Damage to Entities.
 * 4. Trigger FX (Sound, Particles).
 */
export class CombatSystem implements IGameSystem {
    public readonly systemId = 'COMBAT_SYSTEM';

    private getState: () => GameState;
    private stats: StatManager;
    private events: EventBus;
    private spatialGrid: SpatialHashGrid<Enemy>;
    private areaTargetsCache: Enemy[] = [];

    constructor(getState: () => GameState, statManager: StatManager, events: EventBus, spatialGrid: SpatialHashGrid<Enemy>) {
        this.getState = getState;
        this.stats = statManager;
        this.events = events;
        this.spatialGrid = spatialGrid;

        this.bindEvents();
    }

    private bindEvents() {
        // Projectile vs Enemy
        this.events.on<CollisionProjectileEnemyEvent>(GameEventType.COLLISION_PROJECTILE_ENEMY, (e) => {
            this.handleProjectileEnemyHit(e.projectile, e.enemy);
        });

        // Projectile vs Player
        this.events.on<CollisionProjectilePlayerEvent>(GameEventType.COLLISION_PROJECTILE_PLAYER, (e) => {
            this.handleProjectilePlayerHit(e.projectile);
        });

        // Projectile vs Base
        this.events.on(GameEventType.COLLISION_PROJECTILE_BASE, (e: any) => {
            this.handleProjectileBaseHit(e.projectile);
        });

        // Projectile vs Ally
        this.events.on<CollisionProjectileAllyEvent>(GameEventType.COLLISION_PROJECTILE_ALLY, (e) => {
            this.handleProjectileAllyHit(e.projectile, e.allyId);
        });

        // Kamikaze
        this.events.on<CollisionKamikazeEvent>(GameEventType.COLLISION_KAMIKAZE_IMPACT, (e) => {
            this.handleKamikazeExplosion(e.enemy);
        });

        // Area Damage (Grenades, Explosions, Orbital)
        this.events.on<DamageAreaEvent>(GameEventType.DAMAGE_AREA, (e) => {
            this.handleAreaDamage(e);
        });
    }

    public update(dt: number, time: number, timeScale: number) {
        // Handle Damage over Time (Toxic Zones)
        this.processEnvironmentalHazards(dt);
    }

    // --- COLLISION HANDLERS ---

    private handleProjectileEnemyHit(p: Projectile, e: Enemy) {
        // 1. Calculate Damage
        const damage = this.calculateDamage(p, e);

        // 2. Apply Damage (Logic is now in EnemyManager via event, but we trigger it here)
        this.events.emit<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, { 
            targetId: e.id, 
            amount: damage, 
            source: p.source,
            weaponType: p.weaponType 
        });

        // 3. FX
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BULLET_HIT', x: e.x, y: e.y });

        // 4. Special Effects
        if (p.isExplosive) {
            this.triggerExplosion(p, damage);
        }

        // 5. Piercing / Destruction Logic
        // Mark projectile as handled if it shouldn't continue
        if (p.isExplosive) {
            p.rangeRemaining = -1; // Destroy
        } else if (p.isPiercing) {
            this.recordHit(p, e.id);
            if (this.hasModule(p, ModuleType.KINETIC_STABILIZER)) {
                // Kinetic Stabilizer limits piercing to 1 extra target
                if ((p.hitIds?.length || 0) >= 2) p.rangeRemaining = -1;
            }
        } else {
            p.rangeRemaining = -1; // Destroy standard bullet
        }
    }

    private handleProjectilePlayerHit(p: Projectile) {
        this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: p.damage });
        if (p.createsToxicZone) {
            this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: p.x, y: p.y });
        }
        p.rangeRemaining = -1;
    }

    private handleProjectileBaseHit(p: Projectile) {
        const state = this.getState();
        // Determine which base was hit? 
        // For simplicity, damage applies to main base HP pool logic in GameService/Physics usually,
        // but let's centralize damage application.
        // Ideally we check which base rect it hit, but simplified: damage active base.
        if (state.base) {
            state.base.hp -= p.damage;
            this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: p.damage });
            this.checkBaseIntegrity(state);
        }
        p.rangeRemaining = -1;
    }

    private handleProjectileAllyHit(p: Projectile, allyId: string) {
        const ally = this.getState().allies.find(a => a.id === allyId);
        if (ally) {
            ally.hp -= p.damage;
        }
        p.rangeRemaining = -1;
    }

    private handleKamikazeExplosion(k: Enemy) {
        // Trigger Explosion logic
        this.triggerExplosion({ 
            x: k.x, y: k.y, 
            explosionRadius: 100, 
            source: DamageSource.ENEMY, 
            id: 'temp-explos', angle:0, color: '', radius:0, vx:0, vy:0, speed:0, damage:0, rangeRemaining:0, fromPlayer: false 
        } as Projectile, k.damage);
        
        this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: k.x, y: k.y });
        this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: k.x, y: k.y, color: '#a855f7', count: 12, speed: 15 });
        
        // Kill the Kamikaze
        k.hp = 0;
    }

    private handleAreaDamage(e: DamageAreaEvent) {
        // 1. Damage Enemies
        this.areaTargetsCache.length = 0;
        this.spatialGrid.query(e.x, e.y, e.radius, this.areaTargetsCache);

        for (const enemy of this.areaTargetsCache) {
            if (circlesIntersect(e.x, e.y, e.radius, enemy.x, enemy.y, enemy.radius)) {
                const dmg = e.damage;
                this.events.emit<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, {
                    targetId: enemy.id,
                    amount: dmg,
                    source: e.source,
                    weaponType: WeaponType.GRENADE_LAUNCHER 
                });
            }
        }

        // 2. Damage Base (If source is enemy or friendly fire logic exists, though typically AOE doesn't FF base unless specified)
        // Assuming Kamikaze/Enemy explosions hurt base
        if (e.source === DamageSource.ENEMY) {
            const state = this.getState();
            const b = state.base;
            if (circleIntersectsAABB(e.x, e.y, e.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height)) {
                b.hp -= e.damage;
                this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: e.damage });
                this.checkBaseIntegrity(state);
            }
        }
    }

    private checkBaseIntegrity(state: GameState) {
        if (state.base.hp <= 0 && !state.isGameOver) {
             state.base.hp = 0;
             this.events.emit(GameEventType.GAME_OVER, {});
        }
    }

    private processEnvironmentalHazards(dt: number) {
        const state = this.getState();
        const p = state.player;
        const tickRate = 500; // ms

        // We check overlap here because we need the timer logic.
        for (const z of state.toxicZones) {
            // Calculate if a tick happened in this frame
            const prevTick = Math.ceil((z.life + dt) / tickRate);
            const currTick = Math.ceil(z.life / tickRate);
            
            if (prevTick !== currTick) {
                // Collision Check
                if (circlesIntersect(p.x, p.y, 15, z.x, z.y, z.radius)) {
                    const tickDamage = z.damagePerSecond * (tickRate / 1000);
                    this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: tickDamage });
                }
            }
        }
    }

    // --- CALCULATION LOGIC ---

    private calculateDamage(p: Projectile, e: Enemy): number {
        // 1. Base Damage Multiplier
        const typeMod = this.stats.get(`DMG_VS_${e.type}` as StatId, 1.0);
        let damage = p.damage * typeMod;

        // 2. Piercing Decay Logic
        if (p.isPiercing && p.hitIds) {
            const hitCount = p.hitIds.length;
            
            if (p.weaponType === WeaponType.PULSE_RIFLE) {
                damage *= Math.pow(0.8, hitCount); 
            } else if (p.source === DamageSource.TURRET) {
                damage *= Math.pow(0.92, hitCount); 
            } else if (this.hasModule(p, ModuleType.KINETIC_STABILIZER)) {
                if (hitCount === 1) damage *= 0.8; 
            }
        }

        return Math.max(1, damage);
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

    // --- HELPERS ---

    private recordHit(p: Projectile, entityId: string) {
        if (!p.hitIds) p.hitIds = [];
        p.hitIds.push(entityId);
    }

    private hasModule(p: Projectile, moduleType: ModuleType): boolean {
        return !!p.activeModules?.some(m => m.type === moduleType);
    }
}
