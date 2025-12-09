
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
