
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, DamageSource, EnemySummonEvent, EnemyType, SpawnParticleEvent, ShowFloatingTextEvent, FloatingTextType } from '../../types';
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
                    // Visual or Sound effect could go here
                    // e.g. Metal clank sound
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
        // Stationary: No movement logic
        
        // Passive Melee Check (Thorns/Contact Damage) handled by PhysicsSystem 
        // since Pustule has 30 damage. However, PhysicsSystem handles *movement* based collisions mainly.
        // Or we can invoke melee check here against player/allies if they get too close.
        const target = this.acquireTarget(enemy, context);
        // Using performMeleeAttack triggers standard melee hit with sound
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
        
        // 1. Initial Setup if missing
        if (!enemy.burrowState) {
            enemy.burrowState = 'IDLE';
            enemy.burrowTimer = 0;
            enemy.visualScaleY = 1;
            enemy.cannibalTimer = 0;
            enemy.storedScore = 0;
            enemy.eatingTimer = 0;
        }

        // 2. Swallow Animation State (Blocking)
        if (enemy.eatingTimer && enemy.eatingTimer > 0) {
            enemy.eatingTimer -= dt;
            if (enemy.eatingTimer <= 0) enemy.eatingTimer = 0;
            return; // Busy eating
        }

        // 3. HUNTING LOGIC (State Machine Override)
        if (enemy.huntingTargetId) {
            const victim = state.enemies.find(e => e.id === enemy.huntingTargetId);

            // Victim died or invalid?
            if (!victim || victim.hp <= 0) {
                enemy.huntingTargetId = undefined;
                // If underground while target dies, surface immediately
                if (enemy.burrowState === 'UNDERGROUND') {
                    enemy.burrowState = 'SURFACING';
                    enemy.burrowTimer = 0;
                }
                return;
            }

            const distSq = (enemy.x - victim.x)**2 + (enemy.y - victim.y)**2;
            const eatRange = enemy.radius + victim.radius + 15; // Proximity to eat

            // State: IDLE (Surface)
            if (enemy.burrowState === 'IDLE') {
                enemy.angle = Math.atan2(victim.y - enemy.y, victim.x - enemy.x);
                
                if (distSq < eatRange * eatRange) {
                    // --- CONSUME ACTION ---
                    enemy.storedScore = (enemy.storedScore || 0) + victim.scoreReward;
                    victim.scoreReward = 0; // Deny player score
                    victim.hp = 0; // Kill victim
                    
                    enemy.maxHp += 200;
                    enemy.hp += 200;
                    enemy.radius *= 1.1; // Grow
                    
                    // FX
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: enemy.x, y: enemy.y, color: '#facc15', count: 12, speed: 6
                    });
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: victim.x, y: victim.y, color: '#F87171', count: 10, speed: 5
                    });
                    events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                        text: "GULP!", x: enemy.x, y: enemy.y - 40, color: '#facc15', type: FloatingTextType.SYSTEM
                    });

                    // Set state
                    enemy.huntingTargetId = undefined;
                    enemy.eatingTimer = 800; // 0.8s pause for digestion animation
                } else {
                    // Too far to eat? DIVE IMMEDIATELY to chase
                    enemy.burrowState = 'DIVING';
                    enemy.burrowTimer = 0;
                }
            }
            // State: DIVING
            else if (enemy.burrowState === 'DIVING') {
                enemy.burrowTimer = (enemy.burrowTimer || 0) + dt;
                const progress = Math.min(1, enemy.burrowTimer / 400); // Fast dive
                enemy.visualScaleY = 1 - progress;
                
                if (enemy.burrowTimer > 400) {
                    enemy.burrowState = 'UNDERGROUND';
                    enemy.burrowTimer = 0;
                    enemy.visualScaleY = 0;
                }
            }
            // State: UNDERGROUND (The Chase)
            else if (enemy.burrowState === 'UNDERGROUND') {
                // Move FAST towards victim
                const angle = Math.atan2(victim.y - enemy.y, victim.x - enemy.x);
                const speed = 4.5; // Very fast underground speed
                
                enemy.x += Math.cos(angle) * speed * timeScale;
                enemy.y += Math.sin(angle) * speed * timeScale;
                
                // Trail FX
                if (Math.random() < 0.3) {
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: enemy.x, y: enemy.y, color: '#574135', count: 1, speed: 2
                    });
                }

                // If reached target area (close enough to pop up)
                if (distSq < 20 * 20) {
                    enemy.burrowState = 'SURFACING';
                    enemy.burrowTimer = 0;
                }
            }
            // State: SURFACING
            else if (enemy.burrowState === 'SURFACING') {
                enemy.burrowTimer = (enemy.burrowTimer || 0) + dt;
                const progress = Math.min(1, enemy.burrowTimer / 400); // Fast surface
                enemy.visualScaleY = progress;
                
                if (enemy.burrowTimer > 400) {
                    enemy.burrowState = 'IDLE';
                    enemy.burrowTimer = 0;
                    enemy.visualScaleY = 1;
                    // Will loop back to IDLE state next frame and trigger eat check
                }
            }
            return; // Skip standard behavior while hunting
        }

        // 4. Hunger Check (Only if IDLE)
        enemy.cannibalTimer = (enemy.cannibalTimer || 0) + dt;
        if (enemy.cannibalTimer > 2000) {
            enemy.cannibalTimer = 0;
            // Only search if idle (not burrowing)
            if (enemy.burrowState === 'IDLE' && Math.random() < 0.5) {
                // Scan double range (1000)
                let victim: Enemy | null = null;
                const rangeSq = 1000 * 1000;
                let minDist = rangeSq;

                for (const other of state.enemies) {
                    if (other.type === EnemyType.GRUNT && other.hp > 0) {
                        const dSq = (other.x - enemy.x)**2 + (other.y - enemy.y)**2;
                        if (dSq < rangeSq && dSq < minDist) {
                            minDist = dSq;
                            victim = other;
                        }
                    }
                }

                if (victim) {
                    enemy.huntingTargetId = victim.id;
                    return; // Start hunting next frame
                }
            }
        }

        // 5. Standard Movement (Default Burrowing logic against base/player)
        
        enemy.burrowTimer = (enemy.burrowTimer || 0) + dt;

        if (enemy.burrowState === 'IDLE') {
            // Face target (Base/Player)
            const target = this.acquireTarget(enemy, context);
            enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
            
            // Melee if possible
            this.performMeleeAttack(enemy, target, context);

            if (enemy.burrowTimer > 2000) {
                enemy.burrowState = 'DIVING';
                enemy.burrowTimer = 0;
            }
        }
        else if (enemy.burrowState === 'DIVING') {
            const progress = Math.min(1, enemy.burrowTimer! / 500);
            enemy.visualScaleY = 1 - progress;
            
            if (enemy.burrowTimer! > 500) {
                enemy.burrowState = 'UNDERGROUND';
                enemy.burrowTimer = 0;
                enemy.visualScaleY = 0; 
            }
        }
        else if (enemy.burrowState === 'UNDERGROUND') {
            if (enemy.burrowTimer! > 1000) {
                const target = this.acquireTarget(enemy, context);
                const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                const dist = 200;
                enemy.x += Math.cos(angle) * dist;
                enemy.y += Math.sin(angle) * dist;
                
                enemy.x = Math.max(0, Math.min(state.worldWidth, enemy.x));
                enemy.y = Math.max(0, Math.min(state.worldHeight, enemy.y));

                events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                    x: enemy.x, y: enemy.y, color: '#3f2c22', count: 8, speed: 4
                });

                enemy.burrowState = 'SURFACING';
                enemy.burrowTimer = 0;
            }
        }
        else if (enemy.burrowState === 'SURFACING') {
            const progress = Math.min(1, enemy.burrowTimer! / 500);
            enemy.visualScaleY = progress;
            
            if (enemy.burrowTimer! > 500) {
                enemy.burrowState = 'IDLE';
                enemy.burrowTimer = 0;
                enemy.visualScaleY = 1;
            }
        }
    }
}
