
import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, MissionType, Entity, Planet, SpecialEventType, FloatingTextType, DamageSource, GameEventType, SpawnProjectileEvent, DamagePlayerEvent, DamageBaseEvent, PlaySoundEvent, SpawnParticleEvent, SpawnToxicZoneEvent, SpawnBloodStainEvent, ShowFloatingTextEvent, DamageAreaEvent, DamageEnemyEvent, StatId, EnemySummonEvent, WeaponType } from '../../types';
import { GAS_INFO } from '../../data/world';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { StatManager } from './StatManager';
import { DataManager } from '../DataManager';
import { AIBehavior } from '../ai/AIBehavior';
import { StandardBehavior, KamikazeBehavior, ViperBehavior, PustuleBehavior, RusherBehavior, TubeWormBehavior } from '../ai/StandardBehaviors';
import { RedSummonerBehavior, BlueBurstBehavior, PurpleAcidBehavior, HiveMotherBehavior } from '../ai/BossBehaviors';

export class EnemyManager {
    private engine: GameEngine;
    private events: EventBus;
    private stats: StatManager;
    private data: DataManager;
    private enemyPool: ObjectPool<Enemy>;
    
    // AI Strategies
    private behaviors: Map<string, AIBehavior> = new Map();

    constructor(engine: GameEngine, eventBus: EventBus, statManager: StatManager, dataManager: DataManager) {
        this.engine = engine;
        this.events = eventBus;
        this.stats = statManager;
        this.data = dataManager;

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
                e.dashCharges = undefined;
                e.dashTimer = undefined;
                e.shellValue = undefined;
                e.maxShell = undefined;
                e.shellRegenTimer = undefined;
                
                // Tube Worm / Boss Specifics
                e.burrowState = undefined;
                e.burrowTimer = undefined;
                e.cannibalTimer = undefined;
                e.visualScaleY = 1;
                e.storedScore = 0;
                e.huntingTargetId = undefined;
                e.eatingTimer = 0;
                e.isWandering = false;
                e.wanderTimer = 0;
                e.wanderDuration = 0;
                e.wanderPoint = undefined;
                e.activeTime = 0; // Total surface time
            }
        );

        this.initializeBehaviors();

        // Listeners
        this.events.on<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, (e) => {
            const enemy = this.engine.state.enemies.find(en => en.id === e.targetId);
            if (enemy) {
                this.damageEnemy(enemy, e.amount, e.source, e.weaponType);
            }
        });

        this.events.on<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, (e) => {
            this.handleSummon(e);
        });
    }

    private initializeBehaviors() {
        const standard = new StandardBehavior();
        this.behaviors.set(EnemyType.GRUNT, standard);
        this.behaviors.set(EnemyType.RUSHER, new RusherBehavior());
        this.behaviors.set(EnemyType.TANK, standard);
        this.behaviors.set(EnemyType.KAMIKAZE, new KamikazeBehavior());
        this.behaviors.set(EnemyType.VIPER, new ViperBehavior());
        this.behaviors.set(EnemyType.PUSTULE, new PustuleBehavior());
        this.behaviors.set(EnemyType.TUBE_WORM, new TubeWormBehavior());

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
        // Use DataManager
        const baseStats = this.data.getEnemyStats(type);
        
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
        e.speed = stats.speed !== undefined ? stats.speed : baseStats.speed;
        e.scoreReward = baseStats.scoreReward;
        e.radius = baseStats.radius;
        e.color = baseStats.color;
        e.lastAttackTime = 0;
        e.detectionRange = baseStats.detectionRange;
        
        if (type === EnemyType.RUSHER) {
            e.dashCharges = 0;
            e.dashTimer = 0;
        }

        if (type === EnemyType.TANK) {
            e.shellValue = 100;
            e.maxShell = 100;
            e.shellRegenTimer = 0;
        }

        return e;
    }

    public spawnEnemy() {
        const state = this.engine.state;
        const type = selectEnemyType(state.wave.index, state.gameMode, state.currentPlanet, state.wave.activeEvent);
        const x = Math.random() * state.worldWidth;
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
        return enemy;
    }

    public spawnPustule(x: number, y: number) {
        const state = this.engine.state;
        const type = EnemyType.PUSTULE;
        const enemy = this.enemyPool.get();
        this.setupEnemy(enemy, type, x, y);
        enemy.bossSummonTimer = 15000;
        enemy.lastAttackTime = this.engine.time.now;
        state.enemies.push(enemy);
        if (!state.stats.encounteredEnemies.includes(type)) {
            state.stats.encounteredEnemies.push(type);
        }
    }

    public spawnCampaignBoss() {
        const state = this.engine.state;
        
        const corners = [
            { x: 100, y: 100 },
            { x: state.worldWidth - 100, y: 100 },
            { x: 100, y: state.worldHeight - 100 },
            { x: state.worldWidth - 100, y: state.worldHeight - 100 }
        ];
        const corner = corners[Math.floor(Math.random() * corners.length)];

        const enemy = this.enemyPool.get();
        enemy.id = generateId('devourer');
        enemy.type = EnemyType.TUBE_WORM;
        enemy.x = corner.x;
        enemy.y = corner.y;
        enemy.angle = Math.PI/2;
        enemy.radius = 50; 
        enemy.color = '#FACC15';
        
        enemy.hp = state.campaign.bossHp;
        enemy.maxHp = 4000000;
        
        enemy.damage = 70;
        enemy.speed = 1.0; 
        enemy.scoreReward = 50000;
        
        enemy.isBoss = true;
        enemy.isWandering = true;
        enemy.activeTime = 0; 
        enemy.wanderDuration = 60000;
        
        enemy.burrowState = 'SURFACING';
        enemy.burrowTimer = 0;
        enemy.visualScaleY = 0;

        state.enemies.push(enemy);
        
        if (!state.stats.encounteredEnemies.includes(EnemyType.TUBE_WORM)) {
            state.stats.encounteredEnemies.push(EnemyType.TUBE_WORM);
        }
        
        return enemy;
    }

    public spawnBoss() {
        const state = this.engine.state;
        const roll = Math.random();
        let bossType = BossType.RED_SUMMONER;
        if (roll > 0.6) bossType = BossType.BLUE_BURST;
        if (roll > 0.85) bossType = BossType.PURPLE_ACID;

        const x = state.worldWidth / 2;
        const y = 100;

        // Use DataManager
        const baseStats = this.data.getBossStats(bossType);
        let hp = baseStats.hp;
        
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet) {
            let effectiveStr = state.currentPlanet.geneStrength;
            const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
            effectiveStr = Math.max(0.5, effectiveStr - reduction);
            hp *= effectiveStr;
        }

        const enemy = this.enemyPool.get();
        enemy.id = generateId('boss');
        enemy.type = EnemyType.TANK;
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
        
        // Load boss specific properties from data if available, otherwise rely on hardcoded defaults in behaviors or here
        enemy.bossBurstCount = 0;
        enemy.bossNextShotTime = 0;
        
        state.enemies.push(enemy);
        if (!state.stats.encounteredEnemies.includes(bossType)) {
            state.stats.encounteredEnemies.push(bossType);
        }
        return enemy;
    }

    public spawnHiveMother(planet: Planet) {
        const state = this.engine.state;
        // Use DataManager
        const stats = this.data.getBossStats(BossType.HIVE_MOTHER);
        let effectiveStr = planet.geneStrength;
        const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
        effectiveStr = Math.max(0.5, effectiveStr - reduction);

        let hp = 14000 * effectiveStr * (1 + 0.08 * planet.sulfurIndex);

        const enemy = this.enemyPool.get();
        enemy.id = generateId('mother');
        enemy.type = EnemyType.TANK;
        enemy.isBoss = true;
        enemy.bossType = BossType.HIVE_MOTHER;
        enemy.x = state.worldWidth / 2;
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
        
        state.enemies.push(enemy);
        if (!state.stats.encounteredEnemies.includes(BossType.HIVE_MOTHER)) {
            state.stats.encounteredEnemies.push(BossType.HIVE_MOTHER);
        }
    }

    private handleSummon(e: EnemySummonEvent) {
        if (e.count && e.count > 1) {
            const mother = this.engine.state.enemies.find(en => en.bossType === BossType.HIVE_MOTHER);
            if (!mother) return;
            
            const shedCount = mother.shedCount || 0;
            const simulatedWave = Math.max(1, shedCount);
            const count = 10 + 3 * shedCount;

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
                this.killEnemy(e); 
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

    public damageEnemy(enemy: Enemy, amount: number, source: DamageSource, weaponType?: WeaponType) {
        if (enemy.hp <= 0) return;

        this.engine.state.stats.damageDealt += amount;
        if (this.engine.state.stats.damageBySource) {
            this.engine.state.stats.damageBySource[source] += amount;
        }

        let dmg = amount;
        
        // Polymorphic Hook: onTakeDamage
        const behavior = this.getBehavior(enemy);
        if (behavior.onTakeDamage) {
            const context = {
                state: this.engine.state,
                events: this.events,
                dt: 0,
                time: this.engine.time.now,
                timeScale: 1
            };
            dmg = behavior.onTakeDamage(enemy, dmg, context);
        }

        // TANK SHELL LOGIC (Weapon Specific, hard to move to Behavior without extensive Context)
        // Keep Weapon Interaction logic here as it's game rule based, not enemy-AI based
        if (enemy.type === EnemyType.TANK && !enemy.isBoss) {
            if (weaponType !== WeaponType.FLAMETHROWER) {
                if (enemy.shellValue && enemy.shellValue > 0) {
                    const reduction = weaponType === WeaponType.PULSE_RIFLE ? 1 : 8;
                    enemy.shellValue = Math.max(0, enemy.shellValue - reduction);
                }
            }
        }
  
        enemy.hp -= dmg;
        if (this.engine.state.settings.showDamageNumbers) {
            let color = '#ffffff';
            if (enemy.type === EnemyType.TANK && enemy.shellValue && enemy.shellValue > 0) {
                color = '#9ca3af';
            }
            this.engine.fxManager.addFloatingText(`${Math.ceil(dmg)}`, enemy.x, enemy.y, color, FloatingTextType.DAMAGE);
        }
    }

    public killEnemy(e: Enemy) {
        const context = {
            state: this.engine.state,
            events: this.events,
            dt: 0,
            time: this.engine.time.now,
            timeScale: 1
        };

        // Polymorphic Hook: onDeath
        const behavior = this.getBehavior(e);
        if (behavior.onDeath) {
            behavior.onDeath(e, context);
        }

        let geneMultiplier = 1;
        if (this.engine.state.gameMode === GameMode.EXPLORATION && this.engine.state.currentPlanet) {
            geneMultiplier = this.engine.state.currentPlanet.geneStrength;
        }

        let score = Math.floor(e.scoreReward * geneMultiplier);
        
        if (e.storedScore && e.storedScore > 0) {
            score += Math.floor(e.storedScore * geneMultiplier);
            if (e.storedScore > 50) {
                this.engine.fxManager.addFloatingText(`HOARD RECOVERED: +${Math.floor(e.storedScore * geneMultiplier)}`, e.x, e.y - 20, '#fbbf24', FloatingTextType.LOOT);
            }
        }
  
        this.engine.state.player.score += score;
        if (e.isBoss) this.engine.state.stats.killsByType['BOSS']++;
        else this.engine.state.stats.killsByType[e.type]++;
        this.engine.spaceshipManager.checkBioTaskProgress(e.type);
        this.events.emit<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, { x: e.x, y: e.y, color: e.color, maxHp: e.maxHp });
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'ENEMY_DEATH', variant: e.isBoss, x: e.x, y: e.y });
    }
}
