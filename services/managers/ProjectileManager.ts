
import { GameEngine } from '../gameService';
import { Projectile, WeaponType, Entity } from '../../types';

export class ProjectileManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public registerProjectile(projectile: Projectile) {
        this.engine.state.projectiles.push(projectile);
    }

    public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange: number = 1000) {
        const angle = Math.atan2(ty - y, tx - x);
        this.engine.state.projectiles.push({
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
            maxRange: maxRange // Store initial range for potential visual effects (fade out etc)
        });
    }

    public update(dt: number, timeScale: number) {
        const state = this.engine.state;
        
        state.projectiles.forEach(p => {
            // Homing Logic
            if (p.isHoming && p.targetId) {
                const target = state.enemies.find(e => e.id === p.targetId);
                if (target) {
                    const angle = Math.atan2(target.y - p.y, target.x - p.x);
                    // Simple instant turn for now, can be lerped for smooth homing
                    const speed = Math.sqrt(p.vx**2 + p.vy**2);
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                }
            }
            
            // Movement
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            const distTravelled = Math.sqrt((p.vx * timeScale)**2 + (p.vy * timeScale)**2);
            p.rangeRemaining -= distTravelled;

            // Collision Detection
            if (p.fromPlayer) {
                // Check Enemy Hits
                for (const e of state.enemies) {
                    const d = Math.sqrt((p.x - e.x)**2 + (p.y - e.y)**2);
                    if (d < e.radius + 5) {
                        // Apply Carapace Analyzer Damage Modifiers Here
                        const multiplier = this.engine.spaceshipManager.getCarapaceDamageMultiplier(e.type);
                        const finalDamage = p.damage * multiplier;

                        this.engine.damageEnemy(e, finalDamage);
                        
                        // Piercing / Explosive Logic
                        if (p.isPiercing) {
                            if (!p.hitIds) p.hitIds = [];
                            if (!p.hitIds.includes(e.id)) {
                                p.hitIds.push(e.id);
                                // Optional: Reduce damage per pierce here
                            }
                        } else if (p.isExplosive) {
                             // Explosion also benefits from multipliers? Assuming yes for consistency
                             this.engine.damageArea(p.x, p.y, 100, finalDamage);
                             this.engine.spawnParticle(p.x, p.y, '#f87171', 10, 10);
                             p.rangeRemaining = 0; // Destroy
                        } else {
                             p.rangeRemaining = 0; // Destroy single target
                        }
                        
                        if (p.rangeRemaining <= 0) break;
                    }
                }
            } else {
                // Check Player/Base/Ally Hits (Enemy Projectiles)
                
                // 1. Player Hit
                const dPlayer = Math.sqrt((p.x - state.player.x)**2 + (p.y - state.player.y)**2);
                if (dPlayer < state.player.radius) {
                    this.engine.damagePlayer(p.damage);
                    p.rangeRemaining = 0;
                    if (p.createsToxicZone) this.engine.spawnToxicZone(p.x, p.y);
                }

                // 2. Base Hit
                if (p.rangeRemaining > 0) {
                     if (p.x > state.base.x - state.base.width/2 && p.x < state.base.x + state.base.width/2 &&
                        p.y > state.base.y - state.base.height/2 && p.y < state.base.y + state.base.height/2) {
                            this.engine.damageBase(p.damage);
                            p.rangeRemaining = 0;
                    }
                }

                // 3. Ally Hit (Optional, usually we don't have friendly fire or enemy-on-ally projectile collision for simplicity, but can add here)
            }
        });
        
        // Cleanup dead projectiles
        state.projectiles = state.projectiles.filter(p => p.rangeRemaining > 0);
    }
}
