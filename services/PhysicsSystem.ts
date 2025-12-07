
import { GameState, Enemy, WeaponType, ModuleType, GameEventType, DamageEnemyEvent, DamagePlayerEvent, DamageBaseEvent, DamageAreaEvent, SpawnParticleEvent, SpawnToxicZoneEvent, PlaySoundEvent, DamageSource, StatId } from '../types';
import { EventBus } from './EventBus';
import { StatManager } from './managers/StatManager';
import { SpatialHashGrid } from '../utils/spatialHash';
import { circlesIntersect, circleIntersectsAABB } from '../utils/collision';
import { EnemyType } from '../types';

export class PhysicsSystem {
    private getState: () => GameState;
    private events: EventBus;
    private stats: StatManager;
    
    public spatialGrid: SpatialHashGrid<Enemy>;
    private nearbyCache: Enemy[] = [];

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.stats = statManager;
        this.spatialGrid = new SpatialHashGrid<Enemy>(100);
    }

    public resize(width: number, height: number) {
        this.spatialGrid.resize(width, height);
    }

    public update(dt: number) {
        this.updateSpatialHash();
        this.handleProjectileCollisions();
        this.handleEntityCollisions();
        this.handleEnvironmentCollisions(dt);
    }

    private updateSpatialHash() {
        this.spatialGrid.clear();
        const enemies = this.getState().enemies;
        for (let i = 0; i < enemies.length; i++) {
            this.spatialGrid.insert(enemies[i]);
        }
    }

    private handleProjectileCollisions() {
        const state = this.getState();
        const projectiles = state.projectiles;

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let shouldRemove = false;

            if (p.fromPlayer) {
                // --- Player Projectiles vs Enemies ---
                this.nearbyCache.length = 0;
                this.spatialGrid.query(p.x, p.y, 70, this.nearbyCache); // Broad phase

                for (const e of this.nearbyCache) {
                    // Narrow phase: Circle-Circle
                    if (circlesIntersect(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
                        
                        if (p.isPiercing) {
                            if (!p.hitIds) p.hitIds = [];
                            if (p.hitIds.includes(e.id)) continue; 
                        }

                        // Calculate Damage
                        const statKey = `DMG_VS_${e.type}` as StatId;
                        const multiplier = this.stats.get(statKey, 1.0);
                        let finalDamage = p.damage * multiplier;

                        // Module Logic: Pulse Rifle Decay
                        if (p.isPiercing && p.weaponType === WeaponType.PULSE_RIFLE) {
                            const hitCount = p.hitIds ? p.hitIds.length : 0;
                            if (hitCount > 0) {
                                finalDamage *= Math.pow(0.9, hitCount);
                            }
                        }

                        // Module Logic: Kinetic Stabilizer
                        if (p.activeModules && p.activeModules.some(m => m.type === ModuleType.KINETIC_STABILIZER)) {
                            const hitCount = p.hitIds ? p.hitIds.length : 0;
                            if (hitCount === 1) {
                                finalDamage *= 0.8;
                            }
                        }

                        this.events.emit<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, { 
                            targetId: e.id, 
                            amount: finalDamage, 
                            source: p.source 
                        });
                        
                        // Hit Sound (Throttled by AudioService profile)
                        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BULLET_HIT', x: e.x, y: e.y });
                        
                        // Collision Response
                        if (p.isPiercing) {
                            p.hitIds!.push(e.id);
                            // Kinetic Stabilizer limit: 2 hits
                            if (p.activeModules && p.activeModules.some(m => m.type === ModuleType.KINETIC_STABILIZER)) {
                                if (p.hitIds.length >= 2) {
                                    shouldRemove = true;
                                }
                            }
                        } else if (p.isExplosive) {
                            this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { x: p.x, y: p.y, radius: 100, damage: finalDamage, source: p.source });
                            this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: p.x, y: p.y, color: '#f87171', count: 10, speed: 10 });
                            this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: p.x, y: p.y });
                            shouldRemove = true;
                        } else {
                            shouldRemove = true;
                        }
                        
                        if (shouldRemove) break;
                    }
                }
            } else {
                // --- Enemy Projectiles vs Player/Base/Allies ---
                
                // 1. Vs Player
                if (circlesIntersect(p.x, p.y, p.radius, state.player.x, state.player.y, state.player.radius)) {
                    this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: p.damage });
                    shouldRemove = true;
                    if (p.createsToxicZone) {
                        this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: p.x, y: p.y });
                    }
                }

                // 2. Vs Allies
                if (!shouldRemove) {
                    for (const ally of state.allies) {
                        if (circlesIntersect(p.x, p.y, p.radius, ally.x, ally.y, 12)) {
                            ally.hp -= p.damage; // Direct modification for allies for now (simple)
                            shouldRemove = true;
                            break;
                        }
                    }
                }

                // 3. Vs Turrets
                if (!shouldRemove) {
                    for (const spot of state.turretSpots) {
                        if (spot.builtTurret) {
                            if (circlesIntersect(p.x, p.y, p.radius, spot.x, spot.y, 15)) {
                                spot.builtTurret.hp -= p.damage;
                                shouldRemove = true;
                                break;
                            }
                        }
                    }
                }

                // 4. Vs Bases
                if (!shouldRemove) {
                    // Check primary base
                    const b = state.base;
                    if (circleIntersectsAABB(p.x, p.y, p.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height)) {
                        state.base.hp -= p.damage;
                        this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: p.damage });
                        shouldRemove = true;
                    } 
                    // Check secondary base
                    else if (state.secondaryBase) {
                        const sb = state.secondaryBase;
                        if (circleIntersectsAABB(p.x, p.y, p.radius, sb.x - sb.width/2, sb.y - sb.height/2, sb.width, sb.height)) {
                            state.secondaryBase.hp -= p.damage;
                            this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: p.damage });
                            shouldRemove = true;
                        }
                    }
                }
            }

            if (shouldRemove) {
                // Mark for removal (handled by ProjectileManager update loop usually, but we can set range to 0)
                p.rangeRemaining = -1;
            }
        }
    }

    private handleEntityCollisions() {
        const state = this.getState();
        
        // Kamikaze Check
        for (const enemy of state.enemies) {
            if (enemy.type === EnemyType.KAMIKAZE && enemy.hp > 0) {
                // Check Collision with Player
                if (circlesIntersect(enemy.x, enemy.y, enemy.radius, state.player.x, state.player.y, state.player.radius)) {
                    this.triggerKamikazeExplosion(enemy);
                    continue; 
                }
                
                // Check Collision with Bases
                const b = state.base;
                if (circleIntersectsAABB(enemy.x, enemy.y, enemy.radius, b.x - b.width/2, b.y - b.height/2, b.width, b.height)) {
                    this.triggerKamikazeExplosion(enemy);
                    continue;
                }
                
                if (state.secondaryBase) {
                    const sb = state.secondaryBase;
                    if (circleIntersectsAABB(enemy.x, enemy.y, enemy.radius, sb.x - sb.width/2, sb.y - sb.height/2, sb.width, sb.height)) {
                        this.triggerKamikazeExplosion(enemy);
                        continue;
                    }
                }

                // Check Collision with Allies
                for (const ally of state.allies) {
                    if (circlesIntersect(enemy.x, enemy.y, enemy.radius, ally.x, ally.y, 12)) {
                        this.triggerKamikazeExplosion(enemy);
                        break;
                    }
                }
            }
        }
    }

    private triggerKamikazeExplosion(enemy: Enemy) {
        this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { 
            x: enemy.x, 
            y: enemy.y, 
            radius: 100, 
            damage: enemy.damage,
            source: DamageSource.ENEMY
        });
        this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: enemy.x, y: enemy.y });
        this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: enemy.x, y: enemy.y, color: '#a855f7', count: 10, speed: 20 });
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: enemy.x, y: enemy.y });
        
        enemy.hp = 0; // Kill the enemy
    }

    private handleEnvironmentCollisions(dt: number) {
        const state = this.getState();
        const p = state.player;

        for (const z of state.toxicZones) {
            // Periodic Damage logic
            // Use life modulo to throttle damage events
            // Assuming 500ms tick rate
            const tickRate = 500;
            const prevLife = z.life + dt;
            
            // Check if a tick boundary was crossed
            if (Math.ceil(prevLife / tickRate) !== Math.ceil(z.life / tickRate)) {
                if (circlesIntersect(p.x, p.y, p.radius, z.x, z.y, z.radius)) {
                    this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: z.damagePerSecond * (tickRate/1000) });
                }
            }
        }
    }
}
