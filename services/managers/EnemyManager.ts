


import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, MissionType, Entity, Planet, SpecialEventType, FloatingTextType, DamageSource } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { GAS_INFO } from '../../data/world';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';

export class EnemyManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public spawnEnemy() {
        const state = this.engine.state;
        // Determine Type
        const type = selectEnemyType(state.wave, state.gameMode, state.currentPlanet, state.activeSpecialEvent);
        
        // Determine Position (North Spawn)
        const x = Math.random() * WORLD_WIDTH;
        const y = -50; 

        this.spawnSpecificEnemy(type, x, y);
    }

    public spawnSpecificEnemy(type: EnemyType, x: number, y: number) {
        const state = this.engine.state;
        const baseStats = ENEMY_STATS[type];
        const stats = calculateEnemyStats(type, baseStats, state.currentPlanet, state.gameMode);

        state.enemies.push({
            id: `e-${Date.now()}-${Math.random()}`,
            type,
            x,
            y,
            angle: 0,
            hp: stats.maxHp,
            maxHp: stats.maxHp,
            damage: stats.damage,
            speed: baseStats.speed,
            scoreReward: baseStats.scoreReward,
            radius: baseStats.radius,
            color: baseStats.color,
            lastAttackTime: 0,
            detectionRange: baseStats.detectionRange
        });

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

        this.engine.state.enemies.push({
            id: `boss-${Date.now()}`,
            type: EnemyType.TANK, // Fallback for type safety
            isBoss: true,
            bossType: bossType,
            x, y, angle: Math.PI/2,
            hp: hp,
            maxHp: hp,
            speed: stats.speed,
            damage: stats.damage,
            scoreReward: stats.scoreReward,
            radius: stats.radius,
            color: stats.color,
            lastAttackTime: 0,
            detectionRange: stats.detectionRange,
            bossSummonTimer: 0,
            bossBurstCount: 0,
            bossNextShotTime: 0
        });

        if (!this.engine.state.stats.encounteredEnemies.includes(bossType)) {
            this.engine.state.stats.encounteredEnemies.push(bossType);
        }
    }

    public spawnHiveMother(planet: Planet) {
        const stats = BOSS_STATS[BossType.HIVE_MOTHER];
        let hp = 8000 * planet.geneStrength * (1 + 0.1 * planet.sulfurIndex);

        this.engine.state.enemies.push({
            id: `hive-mother-${Date.now()}`,
            type: EnemyType.TANK,
            isBoss: true,
            bossType: BossType.HIVE_MOTHER,
            x: WORLD_WIDTH / 2,
            y: 400,
            angle: Math.PI/2,
            hp: hp,
            maxHp: hp,
            speed: 0,
            damage: stats.damage,
            scoreReward: stats.scoreReward,
            radius: stats.radius,
            color: stats.color,
            lastAttackTime: 0,
            detectionRange: 2000,
            armorValue: 90,
            shedTimer: 0,
            shedCount: 0
        });

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

        // Hive Mother Mechanics
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE) {
            const mother = state.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);
            if (mother) {
                mother.shedTimer = (mother.shedTimer || 0) + dt;
                if (mother.shedTimer > 30000) {
                    mother.shedTimer = 0;
                    
                    // Shed Armor
                    mother.armorValue = Math.max(0, (mother.armorValue || 90) - 3);
                    mother.shedCount = (mother.shedCount || 0) + 1;
                    
                    // Heal
                    const o2 = state.currentPlanet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id)?.percentage || 0;
                    const healAmount = mother.maxHp * (0.4 * o2);
                    mother.hp = Math.min(mother.maxHp, mother.hp + healAmount);
                    
                    this.engine.addMessage("HIVE MOTHER SHEDDING CARAPACE", mother.x, mother.y - 100, '#fca5a5', FloatingTextType.SYSTEM);
                    this.spawnHiveMinions(mother);
                }
            }
        }

        state.enemies.forEach(e => {
            // AI: Determine Target
            let target = { x: base.x, y: base.y };
            let closestUnit: Entity | null = null;
            let minDist = e.detectionRange || 400;

            const distToBase = Math.sqrt((e.x - base.x)**2 + (e.y - base.y)**2);

            // Check Player
            const distPlayer = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
            if (distPlayer < minDist) {
                minDist = distPlayer;
                closestUnit = player;
            }

            // Check Allies
            state.allies.forEach(ally => {
                 const d = Math.sqrt((e.x - ally.x)**2 + (e.y - ally.y)**2);
                 if (d < minDist) {
                     minDist = d;
                     closestUnit = ally;
                 }
            });

            if (closestUnit) {
                target = { x: closestUnit.x, y: closestUnit.y };
            }

            // Stationary Bosses
            if (e.isBoss && e.bossType === BossType.HIVE_MOTHER) return;
            
            // Movement
            const angle = Math.atan2(target.y - e.y, target.x - e.x);
            e.angle = angle;
            
            const distToTarget = Math.sqrt((e.x - target.x)**2 + (e.y - target.y)**2);
            
            // Stop Range logic
            let stopDist = e.radius + 10;
            if (e.type === EnemyType.VIPER) stopDist = 400;
            if (e.bossType === BossType.BLUE_BURST) stopDist = 600;
            if (e.bossType === BossType.PURPLE_ACID) stopDist = 500;
            
            if (distToTarget > stopDist) {
                e.x += Math.cos(angle) * e.speed * timeScale;
                e.y += Math.sin(angle) * e.speed * timeScale;
            }

            // Attack Logic
            const attackCooldown = e.isBoss ? (e.bossType ? 100 : 1000) : 1000;
            if (Date.now() - e.lastAttackTime > attackCooldown) {
                 this.handleEnemyAttack(e, target, distToTarget, closestUnit || { x: base.x, y: base.y, radius: 200 } as any);
            }
        });
    }

    private handleEnemyAttack(e: Enemy, targetPos: {x: number, y: number}, dist: number, targetEntity: Entity) {
        const now = Date.now();

        // Boss Logic
        if (e.isBoss) {
             if (e.bossType === BossType.RED_SUMMONER) {
                 if (now - e.lastAttackTime > (BOSS_STATS[BossType.RED_SUMMONER].summonRate || 2000)) {
                     // Summon Grunts
                     for(let i=0; i<3; i++) {
                         const a = Math.random() * Math.PI*2;
                         this.spawnSpecificEnemy(EnemyType.GRUNT, e.x + Math.cos(a)*50, e.y + Math.sin(a)*50);
                     }
                     e.lastAttackTime = now;
                 }
             }
             else if (e.bossType === BossType.BLUE_BURST) {
                 if (now - e.lastAttackTime > (BOSS_STATS[BossType.BLUE_BURST].fireRate || 1000)) {
                     // Fire Burst
                     e.bossBurstCount = 3;
                     e.bossNextShotTime = now;
                     e.lastAttackTime = now;
                 }
                 // Handle Burst
                 if (e.bossBurstCount && e.bossBurstCount > 0 && now >= (e.bossNextShotTime || 0)) {
                     this.engine.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 10, e.damage, false, '#60a5fa', undefined, false, false, 1000, DamageSource.ENEMY);
                     e.bossBurstCount--;
                     e.bossNextShotTime = now + (BOSS_STATS[BossType.BLUE_BURST].burstDelay || 100);
                 }
             }
             else if (e.bossType === BossType.PURPLE_ACID) {
                 if (now - e.lastAttackTime > (BOSS_STATS[BossType.PURPLE_ACID].fireRate || 4000)) {
                     // Lob Acid Blob
                     this.engine.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 8, e.damage, false, '#a855f7', undefined, false, true, 1000, DamageSource.ENEMY); 
                     e.lastAttackTime = now;
                 }
             }
             return;
        }

        // Normal Units
        if (e.type === EnemyType.VIPER) {
            if (dist < 450 && now - e.lastAttackTime > 2000) {
                this.engine.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 8, e.damage, false, '#10B981', undefined, false, false, 1000, DamageSource.ENEMY);
                this.engine.audio.playViperShoot();
                e.lastAttackTime = now;
            }
        }
        else if (e.type === EnemyType.KAMIKAZE) {
            if (dist < 30) {
                // Explode
                this.engine.damageArea(e.x, e.y, 100, e.damage);
                this.engine.spawnToxicZone(e.x, e.y);
                this.engine.spawnParticle(e.x, e.y, '#a855f7', 10, 20);
                e.hp = 0; // Suicide
                this.engine.audio.playExplosion();
            }
        }
        else {
            // Melee
            if (dist < e.radius + (targetEntity.radius || 20) + 10 && now - e.lastAttackTime > 1000) {
                // Deal Damage
                if (targetEntity.id === 'player') {
                    this.engine.damagePlayer(e.damage);
                } else if ((targetEntity as any).maxHp && (targetEntity as any).width) { // Base
                    this.engine.damageBase(e.damage);
                } else if ((targetEntity as any).hp !== undefined) { // Ally/Turret
                    (targetEntity as any).hp -= e.damage;
                }
                e.lastAttackTime = now;
                this.engine.audio.playMeleeHit();
            }
        }
    }

    public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) {
        let dmg = amount;
        
        // Hive Mother Armor Reduction
        if (enemy.bossType === BossType.HIVE_MOTHER && enemy.armorValue) {
            const mitigation = enemy.armorValue / 100;
            dmg = dmg * (1 - mitigation);
            dmg = Math.max(1, dmg);
        }
  
        enemy.hp -= dmg;
        if (this.engine.state.settings.showDamageNumbers) {
            // New Floating Text Usage
            const isCrit = Math.random() < 0.1; // Simple random crit visual for now
            const color = isCrit ? '#ef4444' : '#ffffff';
            const type = isCrit ? FloatingTextType.CRIT : FloatingTextType.DAMAGE;
            this.engine.addMessage(`${Math.ceil(dmg)}`, enemy.x, enemy.y, color, type);
        }
  
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    public killEnemy(e: Enemy) {
        let score = e.scoreReward;
        
        if (e.bossType === BossType.HIVE_MOTHER) {
            const gene = this.engine.state.currentPlanet?.geneStrength || 1;
            const armor = e.armorValue || 0;
            const bonus = Math.floor(20 * gene * (armor * armor));
            score += bonus;
            
            this.engine.addMessage(`HIVE MOTHER ELIMINATED`, e.x, e.y, '#ffff00', FloatingTextType.SYSTEM);
            this.engine.addMessage(`DOMINANCE BONUS: +${bonus}`, e.x, e.y + 20, '#ffff00', FloatingTextType.LOOT);
            
            this.engine.completeMission();
        }
  
        this.engine.state.player.score += score;
        
        // Remove from list
        this.engine.state.enemies = this.engine.state.enemies.filter(en => en !== e);
        
        // Stats
        if (e.isBoss) this.engine.state.stats.killsByType['BOSS']++;
        else this.engine.state.stats.killsByType[e.type]++;
  
        // FX
        this.engine.spawnBloodStain(e.x, e.y, e.color, e.maxHp);
        this.engine.audio.playEnemyDeath(e.isBoss);
    }
}