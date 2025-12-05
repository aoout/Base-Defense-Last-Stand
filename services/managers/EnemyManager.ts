
import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, MissionType, Entity, Planet, SpecialEventType, FloatingTextType, DamageSource, GameEventType, SpawnProjectileEvent, DamagePlayerEvent, DamageBaseEvent, PlaySoundEvent, SpawnParticleEvent, SpawnToxicZoneEvent, SpawnBloodStainEvent, ShowFloatingTextEvent, DamageAreaEvent, DamageEnemyEvent, StatId } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { GAS_INFO } from '../../data/world';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { StatManager } from './StatManager';

export class EnemyManager {
    private engine: GameEngine;
    private events: EventBus;
    private stats: StatManager;
    private enemyPool: ObjectPool<Enemy>;

    constructor(engine: GameEngine, eventBus: EventBus, statManager: StatManager) {
        this.engine = engine;
        this.events = eventBus;
        this.stats = statManager;

        this.enemyPool = new ObjectPool<Enemy>(
            () => ({
                id: '', type: EnemyType.GRUNT, x: 0, y: 0, radius: 0, angle: 0, color: '',
                hp: 0, maxHp: 0, speed: 0, damage: 0, scoreReward: 0, lastAttackTime: 0, detectionRange: 0
            }),
            (e) => {
                e.isBoss = false;
                e.bossType = undefined;
                e.bossSummonTimer = undefined;
                e.bossBurstCount = undefined;
                e.bossNextShotTime = undefined;
                e.armorValue = undefined;
                e.shedTimer = undefined;
                e.shedCount = undefined;
            }
        );

        this.events.on<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, (e) => {
            const enemy = this.engine.state.enemies.find(en => en.id === e.targetId);
            if (enemy) {
                this.damageEnemy(enemy, e.amount, e.source);
            }
        });
    }

    private setupEnemy(e: Enemy, type: EnemyType, x: number, y: number): Enemy {
        const state = this.engine.state;
        const baseStats = ENEMY_STATS[type];
        
        let effectiveGeneStrength = state.currentPlanet ? state.currentPlanet.geneStrength : 1;
        if (state.currentPlanet && state.gameMode === GameMode.EXPLORATION) {
            const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
            effectiveGeneStrength = Math.max(0.5, effectiveGeneStrength - reduction);
        }

        const stats = calculateEnemyStats(type, baseStats, state.currentPlanet, state.gameMode, effectiveGeneStrength);

        e.id = generateId('e');
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
        const enemy = this.enemyPool.get();
        this.setupEnemy(enemy, type, x, y);

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

        const baseStats = BOSS_STATS[bossType];
        let hp = baseStats.hp;
        
        if (this.engine.state.gameMode === GameMode.EXPLORATION && this.engine.state.currentPlanet) {
            let effectiveStr = this.engine.state.currentPlanet.geneStrength;
            const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
            effectiveStr = Math.max(0.5, effectiveStr - reduction);
            hp *= effectiveStr;
        }

        const enemy = this.enemyPool.get();
        enemy.id = generateId('boss');
        enemy.type = EnemyType.TANK; // Base type for logic fallback
        enemy.isBoss = true;
        enemy.bossType = bossType;
        enemy.x = x; enemy.y = y; enemy.angle = Math.PI/2;
        enemy.hp = hp; enemy.maxHp = hp;
        enemy.speed = baseStats.speed;
        enemy.damage = baseStats.damage;
        enemy.scoreReward = baseStats.scoreReward;
        enemy.radius = baseStats.radius;
        enemy.color = baseStats.color;
        enemy.lastAttackTime = 0;
        enemy.detectionRange = baseStats.detectionRange;
        
        this.engine.state.enemies.push(enemy);
        if (!this.engine.state.stats.encounteredEnemies.includes(bossType)) {
            this.engine.state.stats.encounteredEnemies.push(bossType);
        }
    }

    public spawnHiveMother(planet: Planet) {
        const stats = BOSS_STATS[BossType.HIVE_MOTHER];
        let effectiveStr = planet.geneStrength;
        const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
        effectiveStr = Math.max(0.5, effectiveStr - reduction);

        let hp = 14000 * effectiveStr * (1 + 0.08 * planet.sulfurIndex);

        const enemy = this.enemyPool.get();
        enemy.id = generateId('mother');
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
        
        this.engine.state.enemies.push(enemy);
        if (!this.engine.state.stats.encounteredEnemies.includes(BossType.HIVE_MOTHER)) {
            this.engine.state.stats.encounteredEnemies.push(BossType.HIVE_MOTHER);
        }
    }

    // ... (spawnHiveMinions same as before but using stats.get for reduction) ...
    private spawnHiveMinions(mother: Enemy) {
        const shedCount = mother.shedCount || 0;
        const simulatedWave = Math.max(1, shedCount);
        
        let effectiveGeneStrength = this.engine.state.currentPlanet?.geneStrength || 1;
        const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
        effectiveGeneStrength = Math.max(0.5, effectiveGeneStrength - reduction);

        const count = Math.ceil(12 * (effectiveGeneStrength + shedCount));

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
        // ... (Update loop remains largely the same, logic is inside entity props already)
        // Hive Mother Update logic copied from previous
        const state = this.engine.state;
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
                    this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                        text: "HIVE MOTHER SHEDDING CARAPACE", x: mother.x, y: mother.y - 100, color: '#fca5a5', type: FloatingTextType.SYSTEM
                    });
                    this.spawnHiveMinions(mother);
                }
            }
        }

        const enemies = state.enemies;
        const now = this.engine.time.now;
        const base = state.base;
        const player = state.player;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.hp <= 0) {
                this.enemyPool.release(e);
                enemies[i] = enemies[enemies.length - 1];
                enemies.pop();
                continue;
            }

            // Movement logic same as before...
            let target = { x: base.x, y: base.y };
            let closestUnit: Entity | null = null;
            let minDistSq = (e.detectionRange || 400) ** 2;

            // ... (Targeting Logic) ...
            const distPlayerSq = (e.x - player.x)**2 + (e.y - player.y)**2;
            if (distPlayerSq < minDistSq) { minDistSq = distPlayerSq; closestUnit = player; }
            for (const ally of state.allies) {
                 const dSq = (e.x - ally.x)**2 + (e.y - ally.y)**2;
                 if (dSq < minDistSq) { minDistSq = dSq; closestUnit = ally; }
            }
            for (const spot of state.turretSpots) {
                if (spot.builtTurret) {
                    const dSq = (e.x - spot.builtTurret.x)**2 + (e.y - spot.builtTurret.y)**2;
                    if (dSq < minDistSq) { minDistSq = dSq; closestUnit = spot.builtTurret; }
                }
            }
            if (closestUnit) target = { x: closestUnit.x, y: closestUnit.y };

            if (e.isBoss && e.bossType === BossType.HIVE_MOTHER) continue;
            
            const angle = Math.atan2(target.y - e.y, target.x - e.x);
            e.angle = angle;
            const distToTargetSq = (e.x - target.x)**2 + (e.y - target.y)**2;
            let stopDist = e.radius + 10;
            if (e.type === EnemyType.VIPER) stopDist = 400;
            if (e.bossType === BossType.BLUE_BURST) stopDist = 600;
            if (e.bossType === BossType.PURPLE_ACID) stopDist = 500;
            
            if (distToTargetSq > stopDist * stopDist) {
                e.x += Math.cos(angle) * e.speed * timeScale;
                e.y += Math.sin(angle) * e.speed * timeScale;
                e.x = Math.max(0, Math.min(WORLD_WIDTH, e.x));
                e.y = Math.max(0, Math.min(WORLD_HEIGHT, e.y));
            }

            const attackCooldown = e.isBoss ? (e.bossType ? 100 : 1000) : 1000;
            if (now - e.lastAttackTime > attackCooldown) {
                 const distToTarget = Math.sqrt(distToTargetSq);
                 this.handleEnemyAttack(e, target, distToTarget, closestUnit || state.base as unknown as Entity);
            }
        }
    }

    private handleEnemyAttack(e: Enemy, targetPos: {x: number, y: number}, dist: number, targetEntity: Entity) {
        // ... (Attack logic mostly emits events, no stat changes needed here usually)
        // ... (Copy existing implementation from previous EnemyManager)
        const now = this.engine.time.now;
        
        // ... Boss logic ...
        if (e.isBoss) {
             if (e.bossType === BossType.RED_SUMMONER) {
                 if (now - e.lastAttackTime > 2000) {
                     for(let i=0; i<3; i++) {
                         const a = Math.random() * Math.PI*2;
                         this.spawnSpecificEnemy(EnemyType.GRUNT, e.x + Math.cos(a)*50, e.y + Math.sin(a)*50);
                     }
                     e.lastAttackTime = now;
                 }
             }
             else if (e.bossType === BossType.BLUE_BURST) {
                 if (now - e.lastAttackTime > 1000) {
                     e.bossBurstCount = 3;
                     e.bossNextShotTime = now;
                     e.lastAttackTime = now;
                 }
                 if (e.bossBurstCount && e.bossBurstCount > 0 && now >= (e.bossNextShotTime || 0)) {
                     this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                         x: e.x, y: e.y, targetX: targetPos.x, targetY: targetPos.y, speed: 10, damage: e.damage, fromPlayer: false, color: '#60a5fa', isHoming: false, createsToxicZone: false, maxRange: 1000, source: DamageSource.ENEMY
                     });
                     e.bossBurstCount--;
                     e.bossNextShotTime = now + 100;
                 }
             }
             else if (e.bossType === BossType.PURPLE_ACID) {
                 if (now - e.lastAttackTime > 4000) {
                     this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                         x: e.x, y: e.y, targetX: targetPos.x, targetY: targetPos.y, speed: 8, damage: e.damage, fromPlayer: false, color: '#a855f7', isHoming: false, createsToxicZone: true, maxRange: 1000, source: DamageSource.ENEMY
                     });
                     e.lastAttackTime = now;
                 }
             }
             return;
        }

        if (e.type === EnemyType.VIPER) {
            if (dist < 450 && now - e.lastAttackTime > 2000) {
                this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                    x: e.x, y: e.y, targetX: targetPos.x, targetY: targetPos.y, speed: 8, damage: e.damage, fromPlayer: false, color: '#10B981', isHoming: false, createsToxicZone: false, maxRange: 1000, source: DamageSource.ENEMY
                });
                this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
                e.lastAttackTime = now;
            }
        }
        else if (e.type === EnemyType.KAMIKAZE) {
            if (dist < 30) {
                this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { x: e.x, y: e.y, radius: 100, damage: e.damage });
                this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: e.x, y: e.y });
                this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: e.x, y: e.y, color: '#a855f7', count: 10, speed: 20 });
                e.hp = 0; 
                this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION' });
            }
        }
        else {
            if (dist < e.radius + (targetEntity.radius || 20) + 10 && now - e.lastAttackTime > 1000) {
                if (targetEntity.id === 'player') {
                    this.events.emit<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, { amount: e.damage });
                } else if ((targetEntity as any).maxHp) { 
                    this.events.emit<DamageBaseEvent>(GameEventType.DAMAGE_BASE, { amount: e.damage });
                } else if ((targetEntity as any).hp !== undefined) { 
                    (targetEntity as any).hp -= e.damage;
                }
                e.lastAttackTime = now;
                this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'MELEE_HIT' });
            }
        }
    }

    public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) {
        if (enemy.hp <= 0) return;

        this.engine.state.stats.damageDealt += amount;
        if (this.engine.state.stats.damageBySource) {
            this.engine.state.stats.damageBySource[source] += amount;
        }

        let dmg = amount;
        
        if (enemy.bossType === BossType.HIVE_MOTHER && enemy.armorValue) {
            const mitigation = enemy.armorValue / 100;
            dmg = dmg * (1 - mitigation);
            dmg = Math.max(1, dmg);
        }
  
        enemy.hp -= dmg;
        if (this.engine.state.settings.showDamageNumbers) {
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: `${Math.ceil(dmg)}`, x: enemy.x, y: enemy.y, color: '#ffffff', type: FloatingTextType.DAMAGE
            });
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
            const bonus = Math.floor(20 * Math.pow(gene, 2) * Math.pow(armor, 1.6));
            score += bonus;
            
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { text: `HIVE MOTHER ELIMINATED`, x: e.x, y: e.y, color: '#ffff00', type: FloatingTextType.SYSTEM });
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { text: `DOMINANCE BONUS: +${bonus}`, x: e.x, y: e.y + 20, color: '#ffff00', type: FloatingTextType.LOOT });
            this.events.emit(GameEventType.MISSION_COMPLETE, {});
        }
  
        this.engine.state.player.score += score;
        if (e.isBoss) this.engine.state.stats.killsByType['BOSS']++;
        else this.engine.state.stats.killsByType[e.type]++;
        this.engine.spaceshipManager.checkBioTaskProgress(e.type);
        this.events.emit<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, { x: e.x, y: e.y, color: e.color, maxHp: e.maxHp });
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'ENEMY_DEATH', variant: e.isBoss });
    }
}
