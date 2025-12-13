
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, SpawnProjectileEvent, DamageSource, EnemySummonEvent, ShowFloatingTextEvent, FloatingTextType, EnemyType, WeaponType, GameMode, ProjectileID, EnemySpawnOptions } from '../../types';
import { GAS_INFO } from '../../data/world';

export class RedSummonerBehavior extends BaseEnemyBehavior {
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.bossBurstCount = 0;
        enemy.bossNextShotTime = 0;
        
        // Campaign Passive Logic
        if (context.state.gameMode === GameMode.CAMPAIGN && Math.random() < 0.9) {
            enemy.passiveTimer = 45000 + Math.random() * 30000; // 45-75s
            enemy.isWandering = true;
        }
    }

    public update(enemy: Enemy, context: AIContext): void {
        if (this.processPassiveState(enemy, context)) return;

        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
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
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.bossBurstCount = 0;
        enemy.bossNextShotTime = 0;
        
        // Campaign Passive Logic
        if (context.state.gameMode === GameMode.CAMPAIGN && Math.random() < 0.9) {
            enemy.passiveTimer = 45000 + Math.random() * 30000; // 45-75s
            enemy.isWandering = true;
        }
    }

    public update(enemy: Enemy, context: AIContext): void {
        if (this.processPassiveState(enemy, context)) return;

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
                presetId: ProjectileID.E_BOSS_BLUE,
                x: enemy.x, 
                y: enemy.y, 
                targetX: target.x, 
                targetY: target.y, 
                damage: enemy.damage
            });
            enemy.bossBurstCount--;
            enemy.bossNextShotTime = context.time + 100;
        }
    }
}

export class PurpleAcidBehavior extends BaseEnemyBehavior {
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        // Campaign Passive Logic
        if (context.state.gameMode === GameMode.CAMPAIGN && Math.random() < 0.9) {
            enemy.passiveTimer = 45000 + Math.random() * 30000; // 45-75s
            enemy.isWandering = true;
        }
    }

    public update(enemy: Enemy, context: AIContext): void {
        if (this.processPassiveState(enemy, context)) return;

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
                presetId: ProjectileID.E_BOSS_PURPLE,
                x: enemy.x, 
                y: enemy.y, 
                targetX: target.x, 
                targetY: target.y, 
                damage: enemy.damage
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
                    text: context.t('HIVE_SHEDDING'), 
                    x: enemy.x, 
                    y: enemy.y - 100, 
                    color: '#fca5a5', 
                    type: FloatingTextType.SYSTEM
                });

                // Spawn Minions via Event
                context.events.emit<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, {
                    type: EnemyType.GRUNT, 
                    x: enemy.x,
                    y: enemy.y,
                    count: 12
                });
            }
        }
        
        // Defensive melee
        this.performMeleeAttack(enemy, target, context, 500);
    }

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        // Armor mitigation logic
        if (enemy.armorValue) {
            const mitigation = enemy.armorValue / 100;
            let final = amount * (1 - mitigation);
            return Math.max(1, final); // Always take at least 1 damage
        }
        return amount;
    }

    public onDeath(enemy: Enemy, context: AIContext): void {
        const gene = context.state.currentPlanet?.geneStrength || 1;
        const armor = enemy.armorValue || 0;
        
        // Updated Formula: 8 * (Gene^2) * (Armor^1.5)
        const bonus = Math.floor(8 * Math.pow(gene, 2) * Math.pow(armor, 1.5));
        
        context.state.player.score += bonus;

        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { 
            text: context.t('HIVE_ELIMINATED'), x: enemy.x, y: enemy.y, color: '#ffff00', type: FloatingTextType.SYSTEM 
        });
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { 
            text: context.t('DOMINANCE_BONUS', {0: bonus}), x: enemy.x, y: enemy.y + 20, color: '#ffff00', type: FloatingTextType.LOOT 
        });
        
        // Trigger mission complete
        context.events.emit(GameEventType.MISSION_COMPLETE, {});
    }
}

/**
 * The Burrower (The Devourer): Campaign Boss.
 * Logic: Spawns (Surfaces), Wanders for 60s, then Burrows (Retreats).
 * Attacks only if damaged.
 */
export class DevourerBossBehavior extends BaseEnemyBehavior {
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.burrowState = 'SURFACING'; // Starts by surfacing into the world
        enemy.burrowTimer = 0;
        enemy.visualScaleY = 0; // Starts invisible
        enemy.activeTime = 0; // Tracks total time on surface
        
        // Passive wandering by default
        enemy.isWandering = true;
        enemy.passiveTimer = 60000; 
    }

    public update(enemy: Enemy, context: AIContext): void {
        const { dt } = context;

        // State Machine
        switch (enemy.burrowState) {
            case 'SURFACING':
                this.updateSurfacing(enemy, context);
                break;
            case 'DIVING':
                this.updateDiving(enemy, context);
                break;
            case 'IDLE': // Active Surface Mode
                this.updateActive(enemy, context);
                break;
        }
    }

    private triggerRetreat(enemy: Enemy, context: AIContext) {
        enemy.burrowState = 'DIVING';
        enemy.burrowTimer = 0;
        
        // Force wandering behavior during retreat just to make it move
        enemy.isWandering = true; 
        
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
            text: context.t('DEVOURER_RETREATING'), 
            x: enemy.x, y: enemy.y - 100, 
            color: '#FACC15', type: FloatingTextType.SYSTEM
        });
    }

    private updateSurfacing(enemy: Enemy, context: AIContext) {
        enemy.burrowTimer = (enemy.burrowTimer || 0) + context.dt;
        const progress = Math.min(1, enemy.burrowTimer / 2000); // Slower surfacing for dramatic effect
        enemy.visualScaleY = progress;
        
        if (enemy.burrowTimer > 2000) {
            enemy.burrowState = 'IDLE';
            enemy.burrowTimer = 0;
            // Immediately ensure a wander point exists so it starts moving
            if (!enemy.wanderPoint) {
                this.pickWanderPoint(enemy, context);
            }
        }
    }

    private updateDiving(enemy: Enemy, context: AIContext) {
        enemy.burrowTimer = (enemy.burrowTimer || 0) + context.dt;
        const progress = Math.min(1, enemy.burrowTimer / 1500); 
        enemy.visualScaleY = 1 - progress;
        
        if (enemy.burrowTimer > 1500) {
            enemy.burrowState = 'UNDERGROUND';
            context.state.campaign.bossHp = enemy.hp; // Persist HP
            // Remove entity from world (it's gone underground)
            const idx = context.state.enemies.indexOf(enemy);
            if (idx > -1) context.state.enemies.splice(idx, 1);
        }
    }

    private updateActive(enemy: Enemy, context: AIContext) {
        // GLOBAL TIMER CHECK: After 60s total surfaced time, it leaves regardless of combat state
        enemy.activeTime = (enemy.activeTime || 0) + context.dt;
        if (enemy.activeTime >= 60000) {
            this.triggerRetreat(enemy, context);
            return;
        }

        // Behavior Logic: Passive (Wander) vs Aggressive (Fight)
        if (enemy.passiveTimer !== undefined && enemy.passiveTimer > 0) {
            // Decrement passive timer
            // Note: Attacking reduces this to 0 immediately in onTakeDamage
            enemy.passiveTimer -= context.dt;
            
            // While passive, WANDER aimlessly
            this.handleWandering(enemy, context, true);
        } else {
            // Aggressive Mode (Triggered by damage)
            const target = this.acquireTarget(enemy, context);
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
            this.performMeleeAttack(enemy, target, context, 1000);
            
            // Ranged attack only if valid target
            const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
            this.attemptRangedAttack(enemy, target, distSq, 600 * 600, context);
        }
    }

    private pickWanderPoint(enemy: Enemy, context: AIContext) {
        // Bias the wander point to be somewhat near the player (within 1200 units) to ensure interaction
        const p = context.state.player;
        const angle = Math.random() * Math.PI * 2;
        const dist = 400 + Math.random() * 800;
        
        let wx = p.x + Math.cos(angle) * dist;
        let wy = p.y + Math.sin(angle) * dist;
        
        // Clamp to world bounds
        wx = Math.max(100, Math.min(context.state.worldWidth - 100, wx));
        wy = Math.max(100, Math.min(context.state.worldHeight - 100, wy));

        enemy.wanderPoint = { x: wx, y: wy };
    }

    private attemptRangedAttack(enemy: Enemy, target: any, distSq: number, rangeSq: number, context: AIContext) {
        const shotCooldown = 3000;
        if (context.time - enemy.lastAttackTime > shotCooldown) {
            if (distSq <= rangeSq) {
                context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                    presetId: ProjectileID.E_DEVOURER,
                    x: enemy.x, y: enemy.y, 
                    targetX: target.x, targetY: target.y, 
                    damage: 55
                });
                enemy.lastAttackTime = context.time;
                context.events.emit(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
            }
        }
    }

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        // If wandering boss takes damage, it targets the player immediately (Enrage)
        // But NOT if it's already retreating (Diving)
        if (enemy.burrowState === 'IDLE' && enemy.passiveTimer && enemy.passiveTimer > 0) {
            enemy.passiveTimer = 0; // Break passive -> Enrage. Does NOT reset activeTime.
            enemy.isWandering = false;
            enemy.wanderPoint = undefined;
            
            context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: context.t('THREAT_ENGAGING'), 
                x: enemy.x,
                y: enemy.y - 50,
                color: '#ef4444', 
                type: FloatingTextType.SYSTEM
            });
            // Visual feedback
            context.events.emit(GameEventType.PLAY_SOUND, { type: 'BOSS_DEATH', x: enemy.x, y: enemy.y }); 
        }
        
        // Armor Logic (High resistance)
        return amount * 0.8; // 20% innate reduction for boss
    }

    public onDeath(enemy: Enemy, context: AIContext): void {
        if (context.state.gameMode === GameMode.CAMPAIGN) {
            context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { 
                text: context.t('DEVOURER_ELIMINATED'), x: enemy.x, y: enemy.y, color: '#FACC15', type: FloatingTextType.SYSTEM 
            });
            // Mark boss as permanently dead (-1 flag)
            context.state.campaign.bossHp = -1; 
            context.events.emit(GameEventType.MISSION_COMPLETE, {}); 
        }
    }
}
