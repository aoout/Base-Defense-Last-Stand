
import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, MissionType, Entity, Planet, SpecialEventType, FloatingTextType, DamageSource, GameEventType, SpawnProjectileEvent, DamagePlayerEvent, DamageBaseEvent, PlaySoundEvent, SpawnParticleEvent, SpawnToxicZoneEvent, SpawnBloodStainEvent, ShowFloatingTextEvent, DamageAreaEvent, DamageEnemyEvent, StatId, EnemySummonEvent } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { GAS_INFO } from '../../data/world';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { StatManager } from './StatManager';
import { AIBehavior } from '../ai/AIBehavior';
import { StandardBehavior, KamikazeBehavior, ViperBehavior } from '../ai/StandardBehaviors';
import { RedSummonerBehavior, BlueBurstBehavior, PurpleAcidBehavior, HiveMotherBehavior } from '../ai/BossBehaviors';

export class EnemyManager {
    private engine: GameEngine;
    private events: EventBus;
    private stats: StatManager;
    private enemyPool: ObjectPool<Enemy>;
    
    // AI Strategies
    private behaviors: Map<string, AIBehavior> = new Map();

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

        this.initializeBehaviors();

        // Listeners
        this.events.on<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, (e) => {
            const enemy = this.engine.state.enemies.find(en => en.id === e.targetId);
            if (enemy) {
                this.damageEnemy(enemy, e.amount, e.source);
            }
        });

        this.events.on<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, (e) => {
            this.handleSummon(e);
        });
    }

    private initializeBehaviors() {
        // Standard
        const standard = new StandardBehavior();
        this.behaviors.set(EnemyType.GRUNT, standard);
        this.behaviors.set(EnemyType.RUSHER, standard);
        this.behaviors.set(EnemyType.TANK, standard);
        this.behaviors.set(EnemyType.KAMIKAZE, new KamikazeBehavior());
        this.behaviors.set(EnemyType.VIPER, new ViperBehavior());

        // Bosses
        this.behaviors.set(BossType.RED_SUMMONER, new RedSummonerBehavior());
        this.behaviors.set(BossType.BLUE_BURST, new BlueBurstBehavior());
        this.behaviors.set(BossType.PURPLE_ACID, new PurpleAcidBehavior());
        this.behaviors.set(BossType.HIVE_MOTHER, new HiveMotherBehavior());
    }

    private getBehavior(enemy: Enemy): AIBehavior {
        if (enemy.isBoss && enemy.bossType) {
            return this.behaviors.get(enemy.bossType) || this.behaviors.get(EnemyType.TANK)!;
        }
        return this.behaviors.get(enemy.type) || this.behaviors.get(EnemyType.GRUNT)!;
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

    private handleSummon(e: EnemySummonEvent) {
        // Special case for Hive Mother massive summon
        if (e.count && e.count > 1) {
            const mother = this.engine.state.enemies.find(en => en.bossType === BossType.HIVE_MOTHER);
            if (!mother) return;
            
            const shedCount = mother.shedCount || 0;
            const simulatedWave = Math.max(1, shedCount);
            
            let effectiveGeneStrength = this.engine.state.currentPlanet?.geneStrength || 1;
            const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
            effectiveGeneStrength = Math.max(0.5, effectiveGeneStrength - reduction);

            const count = Math.ceil(12 * (effectiveGeneStrength + shedCount));

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 100;
                const sx = mother.x + Math.cos(angle) * dist;
                const sy = mother.y + Math.sin(angle) * dist;

                const type = selectEnemyType(
                    simulatedWave,
                    this.engine.state.gameMode,
                    this.engine.state.currentPlanet,
                    SpecialEventType.NONE 
                );
                
                this.spawnSpecificEnemy(type, sx, sy);
            }
        } else {
            // Standard Summon
            this.spawnSpecificEnemy(e.type, e.x, e.y);
        }
    }

    public update(dt: number, timeScale: number) {
        const enemies = this.engine.state.enemies;
        const context = {
            state: this.engine.state,
            events: this.events,
            dt,
            time: this.engine.time.now,
            timeScale
        };

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            
            // Death Check
            if (e.hp <= 0) {
                this.enemyPool.release(e);
                enemies[i] = enemies[enemies.length - 1];
                enemies.pop();
                continue;
            }

            // Strategy Execution
            const behavior = this.getBehavior(e);
            behavior.update(e, context);
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
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'ENEMY_DEATH', variant: e.isBoss, x: e.x, y: e.y });
    }
}
