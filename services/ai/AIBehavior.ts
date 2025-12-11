
import { Enemy, Entity, GameState, GameEventType, DamagePlayerEvent, DamageBaseEvent, PlaySoundEvent } from '../../types';
import { EventBus } from '../EventBus';

export interface AIContext {
    state: GameState;
    events: EventBus;
    dt: number;
    time: number;
    timeScale: number;
}

export interface AIBehavior {
    update(enemy: Enemy, context: AIContext): void;
    /**
     * Called when enemy takes damage. 
     * @returns The actual damage to apply (allows for armor/mitigation logic).
     */
    onTakeDamage?(enemy: Enemy, amount: number, context: AIContext): number;
    
    /**
     * Called when enemy HP <= 0.
     */
    onDeath?(enemy: Enemy, context: AIContext): void;
}

export abstract class BaseEnemyBehavior implements AIBehavior {
    
    public abstract update(enemy: Enemy, context: AIContext): void;

    // Default: No mitigation
    public onTakeDamage(enemy: Enemy, amount: number, context: AIContext): number {
        return amount;
    }

    // Default: No special death logic
    public onDeath(enemy: Enemy, context: AIContext): void {
        // No-op
    }

    protected acquireTarget(enemy: Enemy, context: AIContext): Entity {
        const { state } = context;
        
        let target: Entity = state.base as unknown as Entity; // Default target
        
        // Distance check for Bases
        let distBaseSq = (enemy.x - state.base.x)**2 + (enemy.y - state.base.y)**2;
        let minDistSq = distBaseSq;

        if (state.secondaryBase) {
            const distSecSq = (enemy.x - state.secondaryBase.x)**2 + (enemy.y - state.secondaryBase.y)**2;
            if (distSecSq < minDistSq) {
                minDistSq = distSecSq;
                target = state.secondaryBase as unknown as Entity;
            }
        }

        // Detection range override
        if (enemy.detectionRange) {
            const detectionSq = enemy.detectionRange ** 2;
            
            // Check Player
            const distPlayerSq = (enemy.x - state.player.x)**2 + (enemy.y - state.player.y)**2;
            if (distPlayerSq < detectionSq && distPlayerSq < minDistSq) { 
                minDistSq = distPlayerSq; 
                target = state.player; 
            }

            // Check Allies
            for (const ally of state.allies) {
                 const dSq = (enemy.x - ally.x)**2 + (enemy.y - ally.y)**2;
                 if (dSq < detectionSq && dSq < minDistSq) { 
                     minDistSq = dSq; 
                     target = ally; 
                }
            }

            // Check Turrets
            for (const spot of state.turretSpots) {
                if (spot.builtTurret) {
                    const dSq = (enemy.x - spot.builtTurret.x)**2 + (enemy.y - spot.builtTurret.y)**2;
                    if (dSq < detectionSq && dSq < minDistSq) { 
                        minDistSq = dSq; 
                        target = spot.builtTurret; 
                    }
                }
            }
        }

        return target;
    }

    protected moveTowards(enemy: Enemy, target: Entity, speed: number, timeScale: number): void {
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.angle = angle;
        
        enemy.x += Math.cos(angle) * speed * timeScale;
        enemy.y += Math.sin(angle) * speed * timeScale;
    }

    protected handleWandering(enemy: Enemy, context: AIContext): boolean {
        if (!enemy.isWandering) return false;

        enemy.wanderTimer = (enemy.wanderTimer || 0) + context.dt;
        if (enemy.wanderTimer >= (enemy.wanderDuration || 0)) {
            enemy.isWandering = false;
            return false;
        }

        if (!enemy.wanderPoint) {
            enemy.wanderPoint = { 
                x: 100 + Math.random() * (context.state.worldWidth - 200),
                y: 100 + Math.random() * (context.state.worldHeight - 200)
            };
        }

        const distSq = (enemy.x - enemy.wanderPoint.x)**2 + (enemy.y - enemy.wanderPoint.y)**2;
        if (distSq < 50 * 50) {
            // Reached point, pick new one
            enemy.wanderPoint = { 
                x: 100 + Math.random() * (context.state.worldWidth - 200),
                y: 100 + Math.random() * (context.state.worldHeight - 200)
            };
        }

        // Move to wander point (slower speed)
        const targetEntity = { x: enemy.wanderPoint.x, y: enemy.wanderPoint.y, radius: 0, id: 'wander', angle: 0, color: '' };
        this.moveTowards(enemy, targetEntity, enemy.speed * 0.7, context.timeScale);

        return true; // Consumed update
    }

    protected performMeleeAttack(enemy: Enemy, target: Entity, context: AIContext, cooldown: number = 1000): void {
        const { time, events } = context;
        if (time - enemy.lastAttackTime < cooldown) return;

        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        const reach = enemy.radius + (target.radius || 20) + 10;

        if (distSq < reach * reach) {
            // Apply Damage
            if (target.id === 'player') {
                events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: enemy.damage });
            } else if ((target as any).maxHp) { 
                if ((target as any).width) {
                     // Determine DamageBaseEvent
                     (target as any).hp -= enemy.damage;
                     events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: enemy.damage });
                } else {
                    (target as any).hp -= enemy.damage;
                }
            }

            enemy.lastAttackTime = time;
            events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'MELEE_HIT' });
        }
    }
}
