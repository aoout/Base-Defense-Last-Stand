
import { GameEngine } from '../gameService';
import { Projectile, WeaponType, Entity, DamageSource, Enemy } from '../../types';

export class ProjectileManager {
    private engine: GameEngine;
    private pool: Projectile[] = [];
    private nearbyCache: Enemy[] = []; // Reusable array for spatial queries

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public registerProjectile(projectile: Projectile) {
        this.engine.state.projectiles.push(projectile);
    }

    public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange: number = 1000, source: DamageSource = DamageSource.ENEMY): Projectile {
        const angle = Math.atan2(ty - y, tx - x);
        let proj: Projectile;

        // RECYCLING LOGIC: Try to get from pool
        if (this.pool.length > 0) {
            proj = this.pool.pop()!;
            // Reset Properties
            proj.id = `proj-${Date.now()}-${Math.random()}`; // New ID
            proj.x = x;
            proj.y = y;
            proj.vx = Math.cos(angle) * speed;
            proj.vy = Math.sin(angle) * speed;
            proj.damage = dmg;
            proj.color = color;
            proj.radius = 4; // Reset default
            proj.rangeRemaining = maxRange;
            proj.fromPlayer = fromPlayer;
            proj.angle = angle;
            proj.targetId = homingTarget;
            proj.isHoming = !!isHoming;
            proj.createsToxicZone = !!createsToxicZone;
            proj.maxRange = maxRange;
            proj.source = source;
            
            // Clear optional flags that might persist
            proj.isExplosive = false;
            proj.isPiercing = false;
            proj.weaponType = undefined;
            proj.hitIds = undefined;
            proj.activeModules = undefined;
        } else {
            // Create New
            proj = {
                id: `proj-${Date.now()}-${Math.random()}`,
                x, y, 
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: dmg,
                color,
                radius: 4,
                rangeRemaining: maxRange,
                fromPlayer,
                angle,
                targetId: homingTarget,
                isHoming,
                createsToxicZone,
                maxRange: maxRange,
                source
            };
        }

        this.engine.state.projectiles.push(proj);
        return proj;
    }

    public update(dt: number, timeScale: number) {
        const state = this.engine.state;
        const projectiles = state.projectiles;
        
        // Use the global spatial grid which is already populated by GameEngine

        // --- UPDATE PROJECTILES (Reverse Loop + Swap-Pop + Recycling) ---
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let shouldRemove = false;

            // Update Homing Logic
            if (p.isHoming && p.targetId) {
                const target = state.enemies.find(e => e.id === p.targetId);
                if (target) {
                    const angle = Math.atan2(target.y - p.y, target.x - p.x);
                    const speed = Math.sqrt(p.vx**2 + p.vy**2);
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                }
            }
            
            // Move
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            // Distance Travelled
            // We use simple Euclidean for range tracking
            const distTravelled = Math.sqrt((p.vx * timeScale)**2 + (p.vy * timeScale)**2);
            p.rangeRemaining -= distTravelled;

            if (p.rangeRemaining <= 0) {
                shouldRemove = true;
            } else {
                // Collision Detection
                if (p.fromPlayer) {
                    // Query nearby enemies using Shared Spatial Hash w/ Zero-Allocation Cache
                    this.nearbyCache.length = 0; // Clear previous query
                    this.engine.spatialGrid.query(p.x, p.y, 70, this.nearbyCache);

                    for (const e of this.nearbyCache) {
                        const dx = p.x - e.x;
                        const dy = p.y - e.y;
                        const distSq = dx*dx + dy*dy;
                        const hitRadius = e.radius + 5; 
                        
                        if (distSq < hitRadius * hitRadius) {
                            
                            // PIERCING LOGIC
                            if (p.isPiercing) {
                                if (!p.hitIds) p.hitIds = [];
                                if (p.hitIds.includes(e.id)) continue; 
                            }

                            const multiplier = this.engine.spaceshipManager.getCarapaceDamageMultiplier(e.type);
                            let finalDamage = p.damage * multiplier;

                            // PULSE RIFLE DECAY LOGIC
                            if (p.isPiercing && p.weaponType === WeaponType.PULSE_RIFLE) {
                                const hitCount = p.hitIds ? p.hitIds.length : 0;
                                if (hitCount > 0) {
                                    finalDamage *= Math.pow(0.9, hitCount);
                                }
                            }

                            this.engine.damageEnemy(e, finalDamage, p.source);
                            
                            if (p.isPiercing) {
                                p.hitIds!.push(e.id);
                            } else if (p.isExplosive) {
                                this.engine.damageArea(p.x, p.y, 100, finalDamage);
                                this.engine.spawnParticle(p.x, p.y, '#f87171', 10, 10);
                                shouldRemove = true;
                            } else {
                                shouldRemove = true;
                            }
                            
                            // Break inner enemy loop if bullet is destroyed
                            if (shouldRemove) break;
                        }
                    }
                } else {
                    // Enemy Projectile vs Player
                    const dx = p.x - state.player.x;
                    const dy = p.y - state.player.y;
                    const distSq = dx*dx + dy*dy;
                    const hitRad = state.player.radius;

                    if (distSq < hitRad * hitRad) {
                        this.engine.damagePlayer(p.damage);
                        shouldRemove = true;
                        if (p.createsToxicZone) this.engine.spawnToxicZone(p.x, p.y);
                    }

                    if (!shouldRemove) {
                        // Simple AABB for Base
                        if (p.x > state.base.x - state.base.width/2 && p.x < state.base.x + state.base.width/2 &&
                            p.y > state.base.y - state.base.height/2 && p.y < state.base.y + state.base.height/2) {
                                this.engine.damageBase(p.damage);
                                shouldRemove = true;
                        }
                    }
                }
            }

            if (shouldRemove) {
                // Recycle: Push to pool
                this.pool.push(p);

                // Swap-and-Pop Removal
                projectiles[i] = projectiles[projectiles.length - 1];
                projectiles.pop();
            }
        }
    }
}
