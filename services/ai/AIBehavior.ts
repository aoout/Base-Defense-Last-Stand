
import { Enemy, Entity, GameState, GameEventType, DamagePlayerEvent, DamageBaseEvent, PlaySoundEvent } from '../../types';
import { EventBus } from '../EventBus';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export interface AIContext {
    state: GameState;
    events: EventBus;
    dt: number;
    time: number;
    timeScale: number;
}

export interface AIBehavior {
    update(enemy: Enemy, context: AIContext): void;
}

export abstract class BaseEnemyBehavior implements AIBehavior {
    
    public abstract update(enemy: Enemy, context: AIContext): void;

    protected acquireTarget(enemy: Enemy, context: AIContext): Entity {
        const { state } = context;
        
        let target: Entity = state.base as unknown as Entity; // Default target
        let minDistSq = (enemy.detectionRange || 400) ** 2;

        // Check Player
        const distPlayerSq = (enemy.x - state.player.x)**2 + (enemy.y - state.player.y)**2;
        if (distPlayerSq < minDistSq) { 
            minDistSq = distPlayerSq; 
            target = state.player; 
        }

        // Check Allies
        for (const ally of state.allies) {
             const dSq = (enemy.x - ally.x)**2 + (enemy.y - ally.y)**2;
             if (dSq < minDistSq) { 
                 minDistSq = dSq; 
                 target = ally; 
            }
        }

        // Check Turrets
        for (const spot of state.turretSpots) {
            if (spot.builtTurret) {
                const dSq = (enemy.x - spot.builtTurret.x)**2 + (enemy.y - spot.builtTurret.y)**2;
                if (dSq < minDistSq) { 
                    minDistSq = dSq; 
                    target = spot.builtTurret; 
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
        
        // Clamp to world
        enemy.x = Math.max(0, Math.min(WORLD_WIDTH, enemy.x));
        enemy.y = Math.max(0, Math.min(WORLD_HEIGHT, enemy.y));
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
                // Base or Entity with HP
                if ((target as any).width) {
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
