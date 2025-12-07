
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, DamageSource, EnemySummonEvent, EnemyType } from '../../types';

// Behavior for Grunt, Rusher, Tank
export class StandardBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
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
