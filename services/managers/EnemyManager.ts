
import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, MissionType, Entity, Planet, SpecialEventType, FloatingTextType, DamageSource } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { GAS_INFO } from '../../data/world';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';

export class EnemyManager {
    private engine: GameEngine;
    private enemyPool: Enemy[] = [];

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    private resetEnemy(e: Enemy, type: EnemyType, x: number, y: number): Enemy {
        const state = this.engine.state;
        const baseStats = ENEMY_STATS[type];
        const stats = calculateEnemyStats(type, baseStats, state.currentPlanet, state.gameMode);

        e.id = `e-${Date.now()}-${Math.random()}`; // New ID needed for react keys/collision maps
        e.type = type;
        e.x = x;
        e.y = y;
        e.angle = 0;
        e.hp = stats.maxHp;
        e.maxHp = stats.maxHp;
        e.damage = stats.damage;
        e.speed = baseStats.speed;
        e.scoreReward = baseStats.scoreReward;
        e.radius = baseStats.radius;
        e.color = baseStats.color;
        e.lastAttackTime = 0;
        e.detectionRange = baseStats.detectionRange;
        
        // Reset Boss Flags
        e.isBoss = false;
        e.bossType = undefined;
        e.bossSummonTimer = undefined;
        e.bossBurstCount = undefined;
        e.bossNextShotTime = undefined;
        e.armorValue = undefined;
        e.shedTimer = undefined;
        e.shedCount = undefined;

        return e;
    }

    public spawnEnemy() {
        const state = this.engine.state;
        const type = selectEnemyType(state.wave, state.gameMode, state.currentPlanet, state.activeSpecialEvent);
        const x = Math.random() * WORLD_WIDTH;
        const y = -50; 
        this.spawnSpecificEnemy(type, x, y);
    }

    public spawnSpecificEnemy(type: EnemyType, x: number, y: number) {
        const state = this.engine.state;
        let enemy: Enemy;

        if (this.enemyPool.length > 0) {
            enemy = this.enemyPool.pop()!;
            this.resetEnemy(enemy, type, x, y);
        } else {
            // Placeholder values, will be overwritten by resetEnemy immediately logic or manual assignment in fallback
            // But we use the reset logic for consistency
            enemy = { id: '', type: EnemyType.GRUNT } as any; 
            this.resetEnemy(enemy, type, x, y);
        }

        state.enemies.push(enemy);

        if (!state.stats.encounteredEnemies.includes(type)) {
            state.stats.encounteredEnemies.push(type);
        }
    }

    public spawnBoss() {
        const roll = Math.random();
        let bossType = BossType.RED_SUMMONER;
        if (roll > 0.6) bossType = BossType.BLUE_BURST;
        if (roll > 0.85) bossType = BossType.PURPLE_ACID;

        const x = WORLD_WIDTH / 2;
        const y = 100;

        const stats = BOSS_STATS[bossType];
        
        let hp = stats.hp;
        if (this.engine.state.gameMode === GameMode.EXPLORATION && this.engine.state.currentPlanet) {
            hp *= this.engine.state.currentPlanet.geneStrength;
        }

        // Reuse pool for boss too
        let enemy: Enemy;
        if (this.enemyPool.length > 0) {
            enemy = this.enemyPool.pop()!;
        } else {
            enemy = { id: '', type: EnemyType.TANK } as any;
        }

        enemy.id = `boss-${Date.now()}`;
        enemy.type = EnemyType.TANK;
        enemy.isBoss = true;
        enemy.bossType = bossType;
        enemy.x = x;
        enemy.y = y;
        enemy.angle = Math.PI/2;
        enemy.hp = hp;
        enemy.maxHp = hp;
        enemy.speed = stats.speed;
        enemy.damage = stats.damage;
        enemy.scoreReward = stats.scoreReward;
        enemy.radius = stats.radius;
        enemy.color = stats.color;
        enemy.lastAttackTime = 0;
        enemy.detectionRange = stats.detectionRange;
        enemy.bossSummonTimer = 0;
        enemy.bossBurstCount = 0;
        enemy.bossNextShotTime = 0;
        
        // Ensure other boss flags are cleared
        enemy.armorValue = undefined;
        enemy.shedTimer = undefined;
        enemy.shedCount = undefined;

        this.engine.state.enemies.push(enemy);

        if (!this.engine.state.stats.encounteredEnemies.includes(bossType)) {
            this.engine.state.stats.encounteredEnemies.push(bossType);
        }
    }

    public spawnHiveMother(planet: Planet) {
        const stats = BOSS_STATS[BossType.HIVE_MOTHER];
        // Updated formula: 14000 * Gene * (1 + 0.08 * Sulfur)
        let hp = 14000 * planet.geneStrength * (1 + 0.08 * planet.sulfurIndex);

        let enemy: Enemy;
        if (this.enemyPool.length > 0) {
            enemy = this.enemyPool.pop()!;
        } else {
            enemy = { id: '', type: EnemyType.TANK } as any;
        }

        enemy.id = `hive-mother-${Date.now()}`;
        enemy.type = EnemyType.TANK;
        enemy.isBoss = true;
        enemy.bossType = BossType.HIVE_MOTHER;
        enemy.x = WORLD_WIDTH / 2;
        enemy.y = 400;
        enemy.angle = Math.PI/2;
        enemy.hp = hp;
        enemy.maxHp = hp;
        enemy.speed = 0;
        enemy.damage = stats.damage;
        enemy.scoreReward = stats.scoreReward;
        enemy.radius = stats.radius;
        enemy.color = stats.color;
        enemy.lastAttackTime = 0;
        enemy.detectionRange = 2000;
        enemy.armorValue = 90;
        enemy.shedTimer = 0;
        enemy.shedCount = 0;
        
        // Clear other boss flags
        enemy.bossSummonTimer = undefined;
        enemy.bossBurstCount = undefined;
        enemy.bossNextShotTime = undefined;

        this.engine.state.enemies.push(enemy);

        if (!this.engine.state.stats.encounteredEnemies.includes(BossType.HIVE_MOTHER)) {
            this.engine.state.stats.encounteredEnemies.push(BossType.HIVE_MOTHER);
        }
    }

    private spawnHiveMinions(mother: Enemy) {
        const shedCount = mother.shedCount || 0;
        const simulatedWave = Math.max(1, shedCount);
        const geneStrength = this.engine.state.currentPlanet?.geneStrength || 1;
        const count = Math.ceil(12 * (geneStrength + shedCount));

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 100;
            const x = mother.x + Math.cos(angle) * dist;
            const y = mother.y + Math.sin(angle) * dist;

            const type = selectEnemyType(
                simulatedWave,
                this.engine.state.gameMode,
                this.engine.state.currentPlanet,
                SpecialEventType.NONE 
            );
            
            this.spawnSpecificEnemy(type, x, y);
        }
    }

    public update(dt: number, timeScale: number) {
        const state = this.engine.state;
        const base = state.base;
        const player = state.player;
        const now = this.engine.time.now;

        // Hive Mother Mechanics
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE) {
            const mother = state.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);
            if (mother) {
                mother.shedTimer = (mother.shedTimer || 0) + dt;
                if (mother.shedTimer > 30000) {
                    mother.shedTimer = 0;
                    
                    mother.armorValue = Math.max(0, (mother.armorValue || 90) - 3);
                    mother.shedCount = (mother.shedCount || 0) + 1;
                    
                    const o2 = state.currentPlanet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id)?.percentage || 0;
                    const healAmount = mother.maxHp * (0.4 * o2);
                    mother.hp = Math.min(mother.maxHp, mother.hp + healAmount);
                    
                    this.engine.addMessage("HIVE MOTHER SHEDDING CARAPACE", mother.x, mother.y - 100, '#fca5a5', FloatingTextType.SYSTEM);
                    this.spawnHiveMinions(mother);
                }
            }
        }

        // Reverse Iteration with Swap-Pop Removal
        const enemies = state.enemies;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            if (e.hp <= 0) {
                // Recycle: Push to pool
                this.enemyPool.push(e);

                // Swap-Pop Removal
                enemies[i] = enemies[enemies.length - 1];
                enemies.pop();
                continue;
            }

            let target = { x: base.x, y: base.y };
            let closestUnit: Entity | null = null;
            let minDistSq = (e.detectionRange || 400) ** 2;

            // OPTIMIZATION: Squared Distance Calculation
            const distToBaseSq = (e.x - base.x)**2 + (e.y - base.y)**2;

            // 1. Check Player
            const distPlayerSq = (e.x - player.x)**2 + (e.y - player.y)**2;
            if (distPlayerSq < minDistSq) {
                minDistSq = distPlayerSq;
                closestUnit = player;
            }

            // 2. Check Allies
            for (const ally of state.allies) {
                 const dSq = (e.x - ally.x)**2 + (e.y - ally.y)**2;
                 if (dSq < minDistSq) {
                     minDistSq = dSq;
                     closestUnit = ally;
                 }
            }

            // 3. Check Turrets
            for (const spot of state.turretSpots) {
                if (spot.builtTurret) {
                    const dSq = (e.x - spot.builtTurret.x)**2 + (e.y - spot.builtTurret.y)**2;
                    if (dSq < minDistSq) {
                        minDistSq = dSq;
                        closestUnit = spot.builtTurret;
                    }
                }
            }

            if (closestUnit) {
                target = { x: closestUnit.x, y: closestUnit.y };
            }

            if (e.isBoss && e.bossType === BossType.HIVE_MOTHER) continue;
            
            const angle = Math.atan2(target.y - e.y, target.x - e.x);
            e.angle = angle;
            
            // Only calculate actual sqrt distance when necessary for movement threshold
            const distToTargetSq = (e.x - target.x)**2 + (e.y - target.y)**2;
            
            let stopDist = e.radius + 10;
            if (e.type === EnemyType.VIPER) stopDist = 400;
            if (e.bossType === BossType.BLUE_BURST) stopDist = 600;
            if (e.bossType === BossType.PURPLE_ACID) stopDist = 500;
            
            const stopDistSq = stopDist * stopDist;

            if (distToTargetSq > stopDistSq) {
                e.x += Math.cos(angle) * e.speed * timeScale;
                e.y += Math.sin(angle) * e.speed * timeScale;

                // Clamp to Map Boundaries
                e.x = Math.max(0, Math.min(WORLD_WIDTH, e.x));
                e.y = Math.max(0, Math.min(WORLD_HEIGHT, e.y));
            }

            const attackCooldown = e.isBoss ? (e.bossType ? 100 : 1000) : 1000;
            if (now - e.lastAttackTime > attackCooldown) {
                 // For logic requiring actual distance, we calculate it here
                 const distToTarget = Math.sqrt(distToTargetSq);
                 this.handleEnemyAttack(e, target, distToTarget, closestUnit || { x: base.x, y: base.y, radius: 200 } as any);
            }
        }
    }

    private handleEnemyAttack(e: Enemy, targetPos: {x: number, y: number}, dist: number, targetEntity: Entity) {
        const now = this.engine.time.now;

        if (e.isBoss) {
             if (e.bossType === BossType.RED_SUMMONER) {
                 if (now - e.lastAttackTime > (BOSS_STATS[BossType.RED_SUMMONER].summonRate || 2000)) {
                     for(let i=0; i<3; i++) {
                         const a = Math.random() * Math.PI*2;
                         this.spawnSpecificEnemy(EnemyType.GRUNT, e.x + Math.cos(a)*50, e.y + Math.sin(a)*50);
                     }
                     e.lastAttackTime = now;
                 }
             }
             else if (e.bossType === BossType.BLUE_BURST) {
                 if (now - e.lastAttackTime > (BOSS_STATS[BossType.BLUE_BURST].fireRate || 1000)) {
                     e.bossBurstCount = 3;
                     e.bossNextShotTime = now;
                     e.lastAttackTime = now;
                 }
                 if (e.bossBurstCount && e.bossBurstCount > 0 && now >= (e.bossNextShotTime || 0)) {
                     this.engine.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 10, e.damage, false, '#60a5fa', undefined, false, false, 1000, DamageSource.ENEMY);
                     e.bossBurstCount--;
                     e.bossNextShotTime = now + (BOSS_STATS[BossType.BLUE_BURST].burstDelay || 100);
                 }
             }
             else if (e.bossType === BossType.PURPLE_ACID) {
                 if (now - e.lastAttackTime > (BOSS_STATS[BossType.PURPLE_ACID].fireRate || 4000)) {
                     this.engine.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 8, e.damage, false, '#a855f7', undefined, false, true, 1000, DamageSource.ENEMY); 
                     e.lastAttackTime = now;
                 }
             }
             return;
        }

        if (e.type === EnemyType.VIPER) {
            if (dist < 450 && now - e.lastAttackTime > 2000) {
                this.engine.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 8, e.damage, false, '#10B981', undefined, false, false, 1000, DamageSource.ENEMY);
                this.engine.audio.playViperShoot();
                e.lastAttackTime = now;
            }
        }
        else if (e.type === EnemyType.KAMIKAZE) {
            if (dist < 30) {
                this.engine.damageArea(e.x, e.y, 100, e.damage);
                this.engine.spawnToxicZone(e.x, e.y);
                this.engine.spawnParticle(e.x, e.y, '#a855f7', 10, 20);
                e.hp = 0; 
                this.engine.audio.playExplosion();
            }
        }
        else {
            if (dist < e.radius + (targetEntity.radius || 20) + 10 && now - e.lastAttackTime > 1000) {
                if (targetEntity.id === 'player') {
                    this.engine.damagePlayer(e.damage);
                } else if ((targetEntity as any).maxHp && (targetEntity as any).width) { 
                    this.engine.damageBase(e.damage);
                } else if ((targetEntity as any).hp !== undefined) { 
                    // Generic damage to Ally or Turret
                    (targetEntity as any).hp -= e.damage;
                }
                e.lastAttackTime = now;
                this.engine.audio.playMeleeHit();
            }
        }
    }

    public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) {
        // Prevent double-dipping on dead entities
        if (enemy.hp <= 0) return;

        let dmg = amount;
        
        if (enemy.bossType === BossType.HIVE_MOTHER && enemy.armorValue) {
            const mitigation = enemy.armorValue / 100;
            dmg = dmg * (1 - mitigation);
            dmg = Math.max(1, dmg);
        }
  
        enemy.hp -= dmg;
        if (this.engine.state.settings.showDamageNumbers) {
            const isCrit = Math.random() < 0.1;
            const color = isCrit ? '#ef4444' : '#ffffff';
            const type = isCrit ? FloatingTextType.CRIT : FloatingTextType.DAMAGE;
            this.engine.addMessage(`${Math.ceil(dmg)}`, enemy.x, enemy.y, color, type);
        }
  
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    public killEnemy(e: Enemy) {
        // Just handle rewards and effects. 
        // Removal is handled by the main loop's swap-pop to avoid array allocation during damage event.
        let score = e.scoreReward;
        
        if (e.bossType === BossType.HIVE_MOTHER) {
            const gene = this.engine.state.currentPlanet?.geneStrength || 1;
            const armor = e.armorValue || 0;
            // Updated Formula: 20 * Gene^2 * Armor^1.6
            const bonus = Math.floor(20 * Math.pow(gene, 2) * Math.pow(armor, 1.6));
            score += bonus;
            
            this.engine.addMessage(`HIVE MOTHER ELIMINATED`, e.x, e.y, '#ffff00', FloatingTextType.SYSTEM);
            this.engine.addMessage(`DOMINANCE BONUS: +${bonus}`, e.x, e.y + 20, '#ffff00', FloatingTextType.LOOT);
            
            this.engine.completeMission();
        }
  
        this.engine.state.player.score += score;
        
        // Stats
        if (e.isBoss) this.engine.state.stats.killsByType['BOSS']++;
        else this.engine.state.stats.killsByType[e.type]++;
  
        this.engine.spawnBloodStain(e.x, e.y, e.color, e.maxHp);
        this.engine.audio.playEnemyDeath(e.isBoss);
    }
}
