
import { Enemy, Entity, GameState, GameEventType, DamagePlayerEvent, DamageBaseEvent, PlaySoundEvent, WeaponType, EnemySpawnOptions } from '../../types';
import { EventBus } from '../EventBus';
import { TargetingLogic } from './TargetingLogic';

export interface AIContext {
    state: GameState;
    events: EventBus;
    dt: number;
    time: number;
    timeScale: number;
    // Helper function for localization
    t: (key: string, params?: Record<string, string | number>) => string;
}

export interface AIBehavior {
    /**
     * Called immediately after the enemy entity is created but before it enters the game loop.
     * Use this to initialize specific state (timers, counters, flags).
     * Replaces the logic previously hardcoded in EnemyManager.spawn.
     */
    initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void;

    /**
     * Called immediately after spawn (Legacy hook, can be merged into initialize over time).
     */
    onSpawn?(enemy: Enemy, options?: any): void;

    update(enemy: Enemy, context: AIContext): void;
    
    /**
     * Called when enemy takes damage. 
     * @returns The actual damage to apply (allows for armor/mitigation logic).
     */
    onTakeDamage?(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number;
    
    /**
     * Called when enemy HP <= 0.
     */
    onDeath?(enemy: Enemy, context: AIContext): void;
}

export abstract class BaseEnemyBehavior implements AIBehavior {
    
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        // Base initialization handles common overrides
        if (options) {
            if (options.isBoss) {
                enemy.isBoss = true;
                enemy.bossType = options.bossType;
            }
            if (options.scaleY !== undefined) enemy.visualScaleY = options.scaleY;
            if (options.armorValue !== undefined) enemy.armorValue = options.armorValue;
            
            // Campaign Wandering Logic
            if (options.isWandering) {
                enemy.isWandering = true;
                enemy.wanderDuration = options.wanderDuration;
            }
        }
    }

    public onSpawn(enemy: Enemy, options?: any): void {}

    public abstract update(enemy: Enemy, context: AIContext): void;

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        // Break passive state if damaged
        if (enemy.passiveTimer && enemy.passiveTimer > 0) {
            enemy.passiveTimer = 0;
            enemy.isWandering = false;
            // Optionally emit alert?
        }
        return amount;
    }

    public onDeath(enemy: Enemy, context: AIContext): void {}

    // --- SHARED UTILITIES ---

    /**
     * Handles the "Passive / Wandering" state common in Campaign mode.
     * Returns true if the enemy is passive and handled (should skip combat logic).
     */
    protected processPassiveState(enemy: Enemy, context: AIContext): boolean {
        if (!enemy.passiveTimer || enemy.passiveTimer <= 0) return false;

        enemy.passiveTimer -= context.dt;
        
        // If timer just expired, stop wandering and become aggressive
        if (enemy.passiveTimer <= 0) {
            enemy.passiveTimer = 0;
            enemy.isWandering = false;
            enemy.wanderPoint = undefined;
            return false;
        }

        // While passive, just wander around
        this.handleWandering(enemy, context, true); // Force true to ignore internal timer
        
        return true;
    }

    protected acquireTarget(enemy: Enemy, context: AIContext): Entity {
        // Delegate to the specialized static logic
        return TargetingLogic.acquireNearestTarget(enemy, context.state);
    }

    protected moveTowards(enemy: Enemy, target: Entity, speed: number, timeScale: number): void {
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.angle = angle;
        
        enemy.x += Math.cos(angle) * speed * timeScale;
        enemy.y += Math.sin(angle) * speed * timeScale;
    }

    protected handleWandering(enemy: Enemy, context: AIContext, force: boolean = false): boolean {
        if (!enemy.isWandering && !force) return false;

        if (!force) {
            enemy.wanderTimer = (enemy.wanderTimer || 0) + context.dt;
            if (enemy.wanderTimer >= (enemy.wanderDuration || 0)) {
                enemy.isWandering = false;
                return false;
            }
        }

        if (!enemy.wanderPoint) {
            // Pick random point somewhat near current position but within bounds
            // Or just random point in world for better spread
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
        this.moveTowards(enemy, targetEntity, enemy.speed * 0.6, context.timeScale);

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
