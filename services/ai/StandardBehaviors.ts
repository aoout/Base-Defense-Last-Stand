
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, DamageSource, EnemySummonEvent, EnemyType, SpawnParticleEvent, ShowFloatingTextEvent, FloatingTextType, SpawnProjectileEvent, SpawnBloodStainEvent, PlaySoundEvent } from '../../types';
import { GAS_INFO } from '../../data/world';

// Behavior for Grunt, Tank
export class StandardBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        this.performMeleeAttack(enemy, target, context);

        // Tank Specific: Shell Regeneration
        if (enemy.type === EnemyType.TANK && !enemy.isBoss) {
            enemy.shellRegenTimer = (enemy.shellRegenTimer || 0) + context.dt;
            if (enemy.shellRegenTimer >= 10000) {
                // Recover 10 shell instantly
                const current = enemy.shellValue || 0;
                const max = enemy.maxShell || 100;
                if (current < max) {
                    enemy.shellValue = Math.min(max, current + 10);
                }
                enemy.shellRegenTimer = 0;
            }
        }
    }
}

// Behavior for Rusher: Slower base speed, Dash ability
export class RusherBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        
        // Dash Cooldown Logic
        enemy.dashTimer = (enemy.dashTimer || 0) + context.dt;
        const dashCharges = enemy.dashCharges || 0;
        
        if (enemy.dashTimer >= 10000) {
            if (dashCharges < 2) {
                enemy.dashCharges = dashCharges + 1;
            }
            enemy.dashTimer = 0;
        }

        let didDash = false;

        // Dash Trigger Logic
        if (enemy.dashCharges && enemy.dashCharges > 0) {
            // 1% random chance per second approx (assuming ~60 calls/sec)
            const randomChance = Math.random() < (0.01 * (context.dt / 1000));
            
            // Or immediate trigger if target is in sight but not melee range
            const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
            const inSight = enemy.detectionRange && distSq < enemy.detectionRange ** 2;
            const notInMelee = distSq > 60 * 60; // Don't dash if already hitting
            
            if (randomChance || (inSight && notInMelee)) {
                // Perform Dash
                const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                enemy.angle = angle;
                
                const oldX = enemy.x;
                const oldY = enemy.y;
                
                // Calculate Dash Distance with Environmental Scaling
                let dashDist = 65; 
                // Scaling: 65 * (1 + 0.6 * Oxygen)
                const o2Gas = context.state.currentPlanet?.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
                if (o2Gas) {
                    dashDist = 65 * (1 + 0.6 * o2Gas.percentage);
                }

                // Catapult Movement
                const dx = Math.cos(angle) * dashDist;
                const dy = Math.sin(angle) * dashDist;
                
                enemy.x += dx;
                enemy.y += dy;
                
                // Clamp
                enemy.x = Math.max(0, Math.min(context.state.worldWidth, enemy.x));
                enemy.y = Math.max(0, Math.min(context.state.worldHeight, enemy.y));

                // Visuals: Kickback Dust (at launch point)
                context.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                    x: oldX, y: oldY, color: '#94a3b8', count: 6, speed: 3
                });

                // Visuals: Motion Blur Trail (interpolated along path)
                const trailSteps = 5;
                for(let i=1; i<=trailSteps; i++) {
                    const t = i / trailSteps;
                    context.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: oldX + dx * t, 
                        y: oldY + dy * t, 
                        color: 'rgba(245, 158, 11, 0.6)', // Orange glow
                        count: 1, 
                        speed: 0.5 // Minimal spread for trail
                    });
                }

                enemy.dashCharges--;
                didDash = true;
            }
        }

        // Standard movement if didn't dash
        if (!didDash) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        }

        this.performMeleeAttack(enemy, target, context);
    }
}

export class KamikazeBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        
        // NOTE: Explosion trigger logic moved to PhysicsSystem (Centralized Collision)
        // PhysicsSystem detects Entity-Entity overlap and triggers events.
    }
}

export class ViperBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        
        const attackRange = 450;
        const stopDist = 400;

        // Move only if out of range
        if (distSq > stopDist * stopDist) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        } else {
            // Face target even if stopped
            enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        }

        // Only shoot if within attack range
        if (distSq <= attackRange * attackRange) {
            this.tryShoot(enemy, target, context);
        }
    }

    private tryShoot(enemy: Enemy, target: any, context: AIContext) {
        const { time, events } = context;
        if (time - enemy.lastAttackTime < 2000) return;

        events.emit(GameEventType.SPAWN_PROJECTILE, {
            x: enemy.x, 
            y: enemy.y, 
            targetX: target.x, 
            targetY: target.y, 
            speed: 8, 
            damage: enemy.damage, 
            fromPlayer: false, 
            color: '#10B981', 
            isHoming: false, 
            createsToxicZone: false, 
            maxRange: 1000, 
            source: DamageSource.ENEMY
        });
        events.emit(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
        enemy.lastAttackTime = time;
    }
}

export class PustuleBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.performMeleeAttack(enemy, target, context, 500);

        // Summon Logic
        const spawnInterval = enemy.bossSummonTimer || 15000;
        
        if (context.time - enemy.lastAttackTime > spawnInterval) {
            enemy.lastAttackTime = context.time; // Reset timer
            
            // Spawn 2 Random Enemies
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 30;
                const types = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.VIPER];
                const type = types[Math.floor(Math.random() * types.length)];
                
                context.events.emit<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, {
                    type: type,
                    x: enemy.x + Math.cos(angle) * dist,
                    y: enemy.y + Math.sin(angle) * dist
                });
            }
        }
    }
}

export class TubeWormBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const { dt, events, state, timeScale } = context;
        
        // --- 1. BOSS LOGIC (DEVOURER) - Unchanged ---
        if (enemy.isBoss) {
            this.handleBossBehavior(enemy, context);
            return;
        }

        // --- 2. STANDARD TUBE WORM LOGIC ---
        
        // Init visual state if missing
        if (enemy.visualScaleY === undefined) enemy.visualScaleY = 1;
        if (enemy.cannibalTimer === undefined) enemy.cannibalTimer = 0;

        // -- HUNTING CHECK (Every 2s) --
        enemy.cannibalTimer += dt;
        if (enemy.cannibalTimer >= 2000) {
            enemy.cannibalTimer = 0;
            // 50% chance to start hunting if not already hunting
            if (!enemy.huntingTargetId && Math.random() < 0.5) {
                this.findPrey(enemy, state);
            }
        }

        // -- STATE MACHINE --
        if (enemy.huntingTargetId) {
            // HUNTING STATE
            const prey = state.enemies.find(e => e.id === enemy.huntingTargetId);
            
            if (!prey || prey.hp <= 0) {
                // Prey lost or dead, stop hunting
                enemy.huntingTargetId = undefined;
            } else {
                // Dive / Burrow Animation
                if (enemy.visualScaleY > 0.2) {
                    enemy.visualScaleY -= 0.05 * timeScale; // Dive down
                }

                // Move towards prey (Fast when burrowed)
                const speedMult = 2.5; // Very fast underground
                this.moveTowards(enemy, prey, enemy.speed * speedMult, timeScale);
                
                // Spawn dirt particles while moving underground
                if (Math.random() < 0.3) {
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: enemy.x, y: enemy.y, color: '#a16207', count: 2, speed: 2
                    });
                }

                // Check Consumption Distance
                const distSq = (enemy.x - prey.x)**2 + (enemy.y - prey.y)**2;
                if (distSq < (30 * 30)) {
                    this.consumePrey(enemy, prey, context);
                }
            }
        } else {
            // IDLE STATE (Surfaced)
            // Emerge Animation
            if (enemy.visualScaleY < 1) {
                enemy.visualScaleY += 0.05 * timeScale;
                // Dust effect on emergence
                if (enemy.visualScaleY > 0.8 && Math.random() < 0.2) {
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: enemy.x, y: enemy.y, color: '#a16207', count: 5, speed: 5
                    });
                }
            } else {
                enemy.visualScaleY = 1;
            }
            
            // Very slow random drift or stationary when idle
            // It does NOT attack player actively
        }
    }

    private findPrey(enemy: Enemy, state: any) {
        const range = (enemy.detectionRange || 600) * 2; // Double detection range for food
        let closestPrey: Enemy | null = null;
        let minDst = range * range;

        for (const other of state.enemies) {
            if (other.id !== enemy.id && other.type === EnemyType.GRUNT) {
                const dst = (enemy.x - other.x)**2 + (enemy.y - other.y)**2;
                if (dst < minDst) {
                    minDst = dst;
                    closestPrey = other;
                }
            }
        }

        if (closestPrey) {
            enemy.huntingTargetId = closestPrey.id;
        }
    }

    private consumePrey(predator: Enemy, prey: Enemy, context: AIContext) {
        // Kill Prey
        prey.hp = 0; 
        
        // FX
        context.events.emit<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, {
            x: prey.x, y: prey.y, color: prey.color, maxHp: prey.maxHp
        });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'MELEE_HIT', x: predator.x, y: predator.y });
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
            text: "CONSUMED", x: predator.x, y: predator.y - 20, color: '#ef4444', type: FloatingTextType.SYSTEM
        });

        // Buff Predator
        predator.maxHp += 200;
        predator.hp += 200;
        predator.radius += 5; // Grow
        predator.radius = Math.min(predator.radius, 60); // Cap size
        
        // Stop hunting this target
        predator.huntingTargetId = undefined;
        // Eating pause?
        predator.eatingTimer = 500; // Visual pause
    }

    // --- Original Boss Logic (Preserved) ---
    private handleBossBehavior(enemy: Enemy, context: AIContext) {
        const { dt, events, state, timeScale } = context;
        
        if (!enemy.burrowState) {
            enemy.burrowState = 'SURFACING';
            enemy.burrowTimer = 0;
            enemy.visualScaleY = 0;
            enemy.activeTime = 0;
        }

        enemy.activeTime = (enemy.activeTime || 0) + dt;
        
        if (enemy.activeTime >= 60000 && enemy.burrowState !== 'DIVING' && enemy.burrowState !== 'UNDERGROUND') {
            enemy.burrowState = 'DIVING';
            enemy.burrowTimer = 0;
            enemy.isWandering = true; 
            events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: "DEVOURER RETREATING", 
                x: enemy.x, y: enemy.y - 100, 
                color: '#FACC15', type: FloatingTextType.SYSTEM
            });
        }

        if (enemy.burrowState === 'SURFACING') {
            enemy.burrowTimer = (enemy.burrowTimer || 0) + dt;
            const progress = Math.min(1, enemy.burrowTimer / 1000); 
            enemy.visualScaleY = progress;
            if (enemy.burrowTimer > 1000) {
                enemy.burrowState = 'IDLE';
                enemy.burrowTimer = 0;
                if (!enemy.wanderPoint && enemy.isWandering) {
                    enemy.wanderPoint = { 
                        x: 100 + Math.random() * (state.worldWidth - 200), 
                        y: 100 + Math.random() * (state.worldHeight - 200) 
                    };
                }
            }
            return;
        }

        if (enemy.burrowState === 'DIVING') {
            enemy.burrowTimer = (enemy.burrowTimer || 0) + dt;
            const progress = Math.min(1, enemy.burrowTimer / 1500); 
            enemy.visualScaleY = 1 - progress;
            if (enemy.burrowTimer > 1500) {
                enemy.burrowState = 'UNDERGROUND';
                state.campaign.bossHp = enemy.hp;
                const idx = state.enemies.indexOf(enemy);
                if (idx > -1) state.enemies.splice(idx, 1);
            }
            return;
        }

        if (enemy.burrowState === 'IDLE') {
            if (enemy.isWandering) {
                this.handleWandering(enemy, context);
            } else {
                const target = this.acquireTarget(enemy, context);
                const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
                const attackRange = 550;
                
                if (distSq > attackRange * attackRange) {
                    this.moveTowards(enemy, target, enemy.speed, timeScale);
                } else {
                    enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                }

                this.performMeleeAttack(enemy, target, context, 1000);

                const shotCooldown = 3300;
                if (context.time - enemy.lastAttackTime > shotCooldown) {
                    if (distSq <= attackRange * attackRange) {
                        context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                            x: enemy.x, y: enemy.y, targetX: target.x, targetY: target.y, speed: 12, damage: 55, fromPlayer: false, color: '#FACC15', isHoming: false, createsToxicZone: true, maxRange: 550, source: DamageSource.ENEMY
                        });
                        enemy.lastAttackTime = context.time;
                        context.events.emit(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
                    }
                }
            }
        }
    }
}
