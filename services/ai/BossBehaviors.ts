
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, SpawnProjectileEvent, DamageSource, EnemySummonEvent, ShowFloatingTextEvent, FloatingTextType, EnemyType } from '../../types';
import { GAS_INFO } from '../../data/world';

export class RedSummonerBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        if (this.handleWandering(enemy, context)) return;

        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        
        // Melee if close
        this.performMeleeAttack(enemy, target, context, 1000);

        // Summon Logic
        if (context.time - enemy.lastAttackTime > (enemy.bossSummonTimer || 2000)) {
            // Summon 3 Grunts
            const angle = Math.random() * Math.PI * 2;
            for(let i=0; i<3; i++) {
                const offsetA = angle + (i * (Math.PI * 2 / 3));
                context.events.emit<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, {
                    type: EnemyType.GRUNT,
                    x: enemy.x + Math.cos(offsetA) * 50,
                    y: enemy.y + Math.sin(offsetA) * 50
                });
            }
            enemy.lastAttackTime = context.time;
        }
    }
}

export class BlueBurstBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        if (this.handleWandering(enemy, context)) return;

        const target = this.acquireTarget(enemy, context);
        
        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        const stopDist = 600;

        if (distSq > stopDist * stopDist) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        } else {
            enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        }

        // Burst Logic
        if (context.time - enemy.lastAttackTime > 1000 && !enemy.bossBurstCount) {
            enemy.bossBurstCount = 3;
            enemy.bossNextShotTime = context.time;
            enemy.lastAttackTime = context.time;
        }

        if (enemy.bossBurstCount && enemy.bossBurstCount > 0 && context.time >= (enemy.bossNextShotTime || 0)) {
            context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                x: enemy.x, 
                y: enemy.y, 
                targetX: target.x, 
                targetY: target.y, 
                speed: 10, 
                damage: enemy.damage, 
                fromPlayer: false, 
                color: '#60a5fa', 
                isHoming: false, 
                maxRange: 1000, 
                source: DamageSource.ENEMY
            });
            enemy.bossBurstCount--;
            enemy.bossNextShotTime = context.time + 100;
        }
    }
}

export class PurpleAcidBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        if (this.handleWandering(enemy, context)) return;

        const target = this.acquireTarget(enemy, context);
        
        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        const stopDist = 500;

        if (distSq > stopDist * stopDist) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        } else {
            enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        }

        // Lob Logic
        if (context.time - enemy.lastAttackTime > 4000) {
            context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                x: enemy.x, 
                y: enemy.y, 
                targetX: target.x, 
                targetY: target.y, 
                speed: 8, 
                damage: enemy.damage, 
                fromPlayer: false, 
                color: '#a855f7', 
                isHoming: false, 
                createsToxicZone: true, 
                maxRange: 1000, 
                source: DamageSource.ENEMY
            });
            enemy.lastAttackTime = context.time;
        }
    }
}

export class HiveMotherBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        // Stationary, just rotates to face player
        const target = context.state.player;
        enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);

        // Shedding Logic
        if (context.state.gameMode === 'EXPLORATION') {
            enemy.shedTimer = (enemy.shedTimer || 0) + context.dt;
            if (enemy.shedTimer > 30000) {
                enemy.shedTimer = 0;
                enemy.armorValue = Math.max(0, (enemy.armorValue || 90) - 3);
                enemy.shedCount = (enemy.shedCount || 0) + 1;
                
                // Heal based on O2
                const o2 = context.state.currentPlanet?.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id)?.percentage || 0;
                const healAmount = enemy.maxHp * (0.4 * o2);
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
                
                context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                    text: "HIVE MOTHER SHEDDING CARAPACE", 
                    x: enemy.x, 
                    y: enemy.y - 100, 
                    color: '#fca5a5', 
                    type: FloatingTextType.SYSTEM
                });

                // Spawn Minions via Event (EnemyManager will listen)
                context.events.emit<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, {
                    type: EnemyType.GRUNT, // Placeholder type, logic handled by Manager receiver usually or passed here
                    x: enemy.x,
                    y: enemy.y,
                    count: 12 // Signal large spawn
                });
            }
        }
        
        // Defensive melee if player gets too close
        this.performMeleeAttack(enemy, target, context, 500);
    }
}
