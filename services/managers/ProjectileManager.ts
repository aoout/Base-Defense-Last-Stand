
import { GameState, Projectile, WeaponType, Enemy, WeaponModule, ModuleType, GameEventType, DamageEnemyEvent, DamagePlayerEvent, DamageBaseEvent, DamageAreaEvent, SpawnParticleEvent, SpawnToxicZoneEvent, SpawnProjectileEvent, DamageSource, StatId } from '../../types';
import { EventBus } from '../EventBus';
import { SpatialHashGrid } from '../../utils/spatialHash';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { StatManager } from './StatManager';

export class ProjectileManager {
    private getState: () => GameState;
    private events: EventBus;
    private spatialGrid: SpatialHashGrid<Enemy>;
    private stats: StatManager; 
    private pool: ObjectPool<Projectile>;
    private nearbyCache: Enemy[] = [];

    constructor(getState: () => GameState, eventBus: EventBus, spatialGrid: SpatialHashGrid<Enemy>, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.spatialGrid = spatialGrid;
        this.stats = statManager;

        // Initialize Pool
        this.pool = new ObjectPool<Projectile>(
            () => ({
                id: '',
                x: 0, y: 0, radius: 4, angle: 0, color: '#fff',
                vx: 0, vy: 0,
                damage: 0,
                rangeRemaining: 0,
                fromPlayer: false,
                source: DamageSource.ENEMY
            }),
            (p) => {
                p.isExplosive = false;
                p.isPiercing = false;
                p.weaponType = undefined;
                p.hitIds = undefined;
                p.isHoming = false;
                p.createsToxicZone = false;
                p.activeModules = undefined;
                p.targetId = undefined;
            }
        );

        this.events.on<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, (e) => {
            this.spawnProjectile(e.x, e.y, e.targetX, e.targetY, e.speed, e.damage, e.fromPlayer, e.color, e.homingTargetId, e.isHoming, e.createsToxicZone, e.maxRange, e.source, e.activeModules);
        });
    }

    public registerProjectile(projectile: Projectile) {
        this.getState().projectiles.push(projectile);
    }

    public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange: number = 1000, source: DamageSource = DamageSource.ENEMY, activeModules?: WeaponModule[]) {
        const angle = Math.atan2(ty - y, tx - x);
        
        const proj = this.pool.get();
        proj.id = generateId('p');
        proj.x = x; proj.y = y;
        proj.vx = Math.cos(angle) * speed;
        proj.vy = Math.sin(angle) * speed;
        proj.damage = dmg;
        proj.color = color;
        proj.radius = 4;
        proj.rangeRemaining = maxRange;
        proj.fromPlayer = fromPlayer;
        proj.angle = angle;
        proj.maxRange = maxRange;
        proj.source = source;
        
        proj.targetId = homingTarget;
        proj.isHoming = !!isHoming;
        proj.createsToxicZone = !!createsToxicZone;
        proj.activeModules = activeModules;

        this.getState().projectiles.push(proj);
    }

    public update(dt: number, timeScale: number) {
        const state = this.getState();
        const projectiles = state.projectiles;
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let shouldRemove = false;

            if (p.isHoming && p.targetId) {
                const target = state.enemies.find(e => e.id === p.targetId);
                if (target) {
                    const angle = Math.atan2(target.y - p.y, target.x - p.x);
                    const speed = Math.sqrt(p.vx**2 + p.vy**2);
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                }
            }
            
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            const distTravelled = Math.sqrt((p.vx * timeScale)**2 + (p.vy * timeScale)**2);
            p.rangeRemaining -= distTravelled;

            if (p.rangeRemaining <= 0) {
                shouldRemove = true;
            } else {
                if (p.fromPlayer) {
                    this.nearbyCache.length = 0;
                    this.spatialGrid.query(p.x, p.y, 70, this.nearbyCache);

                    for (const e of this.nearbyCache) {
                        const dx = p.x - e.x;
                        const dy = p.y - e.y;
                        const distSq = dx*dx + dy*dy;
                        const hitRadius = e.radius + 5; 
                        
                        if (distSq < hitRadius * hitRadius) {
                            
                            if (p.isPiercing) {
                                if (!p.hitIds) p.hitIds = [];
                                if (p.hitIds.includes(e.id)) continue; 
                            }

                            // Calculate specific enemy damage multiplier from StatManager
                            const statKey = `DMG_VS_${e.type}` as StatId;
                            const multiplier = this.stats.get(statKey, 1.0);
                            
                            let finalDamage = p.damage * multiplier;

                            if (p.isPiercing && p.weaponType === WeaponType.PULSE_RIFLE) {
                                const hitCount = p.hitIds ? p.hitIds.length : 0;
                                if (hitCount > 0) {
                                    finalDamage *= Math.pow(0.9, hitCount);
                                }
                            }

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
                            
                            if (p.isPiercing) {
                                p.hitIds!.push(e.id);
                                if (p.activeModules && p.activeModules.some(m => m.type === ModuleType.KINETIC_STABILIZER)) {
                                    if (p.hitIds.length >= 2) {
                                        shouldRemove = true;
                                    }
                                }
                            } else if (p.isExplosive) {
                                this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { x: p.x, y: p.y, radius: 100, damage: finalDamage });
                                this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: p.x, y: p.y, color: '#f87171', count: 10, speed: 10 });
                                shouldRemove = true;
                            } else {
                                shouldRemove = true;
                            }
                            
                            if (shouldRemove) break;
                        }
                    }
                } else {
                    const dx = p.x - state.player.x;
                    const dy = p.y - state.player.y;
                    const distSq = dx*dx + dy*dy;
                    const hitRad = state.player.radius;

                    if (distSq < hitRad * hitRad) {
                        this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: p.damage });
                        shouldRemove = true;
                        if (p.createsToxicZone) {
                            this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: p.x, y: p.y });
                        }
                    }

                    if (!shouldRemove) {
                        for (const ally of state.allies) {
                            const dx = p.x - ally.x;
                            const dy = p.y - ally.y;
                            const distSq = dx*dx + dy*dy;
                            if (distSq < (12 + p.radius)**2) {
                                ally.hp -= p.damage;
                                shouldRemove = true;
                                break;
                            }
                        }
                    }

                    if (!shouldRemove) {
                        for (const spot of state.turretSpots) {
                            if (spot.builtTurret) {
                                const t = spot.builtTurret;
                                const dx = p.x - t.x;
                                const dy = p.y - t.y;
                                const distSq = dx*dx + dy*dy;
                                if (distSq < (15 + p.radius)**2) {
                                    t.hp -= p.damage;
                                    shouldRemove = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (!shouldRemove) {
                        if (p.x > state.base.x - state.base.width/2 && p.x < state.base.x + state.base.width/2 &&
                            p.y > state.base.y - state.base.height/2 && p.y < state.base.y + state.base.height/2) {
                                this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: p.damage });
                                shouldRemove = true;
                        }
                    }
                }
            }

            if (shouldRemove) {
                this.pool.release(p);
                projectiles[i] = projectiles[projectiles.length - 1];
                projectiles.pop();
            }
        }
    }
}
