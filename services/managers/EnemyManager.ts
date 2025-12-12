
import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, StatId, EnemySummonEvent, WeaponType, FloatingTextType } from '../../types';
import { GAS_INFO } from '../../data/world';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { StatManager } from './StatManager';
import { DataManager } from '../DataManager';
import { AIBehavior } from '../ai/AIBehavior';
import { StandardBehavior, KamikazeBehavior, ViperBehavior, PustuleBehavior, RusherBehavior, TubeWormBehavior } from '../ai/StandardBehaviors';
import { RedSummonerBehavior, BlueBurstBehavior, PurpleAcidBehavior, HiveMotherBehavior } from '../ai/BossBehaviors';
import { GameEventType, SpawnBloodStainEvent, PlaySoundEvent, DamageSource, DamageEnemyEvent } from '../../types';

// Interface for spawn overrides to avoid massive argument lists
interface EnemySpawnOptions {
    isBoss?: boolean;
    bossType?: BossType;
    hpMultiplier?: number; // Multiplicative override
    flatHp?: number; // Absolute override
    scaleY?: number; // For burrowing visuals
    scoreOverride?: number;
    angleOverride?: number;
    speedOverride?: number;
    // Special Flags
    armorValue?: number;
    burrowState?: 'SURFACING' | 'IDLE' | 'DIVING' | 'UNDERGROUND';
    isWandering?: boolean;
    wanderDuration?: number;
    bossSummonTimer?: number;
}

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

        // Initialize Pool with factory and resetter
        this.enemyPool = new ObjectPool<Enemy>(
            () => ({
                id: '', type: EnemyType.GRUNT, x: 0, y: 0, radius: 0, angle: 0, color: '',
                hp: 0, maxHp: 0, speed: 0, damage: 0, scoreReward: 0, lastAttackTime: 0, detectionRange: 0
            }),
            (e) => this.resetEnemyState(e)
        );

        this.initializeBehaviors();
        this.setupEventListeners();
    }

    private setupEventListeners() {
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
        this.behaviors.set(EnemyType.GRUNT, new StandardBehavior());
        this.behaviors.set(EnemyType.RUSHER, new RusherBehavior());
        this.behaviors.set(EnemyType.TANK, new StandardBehavior());
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

    /**
     * Resets a pooled enemy object to a clean state.
     */
    private resetEnemyState(e: Enemy) {
        // Core Identity
        e.isBoss = false;
        e.bossType = undefined;
        
        // Timers & Counters
        e.bossSummonTimer = undefined;
        e.bossBurstCount = undefined;
        e.bossNextShotTime = undefined;
        e.shedTimer = undefined;
        e.shedCount = undefined;
        e.shellRegenTimer = undefined;
        e.burrowTimer = undefined;
        e.cannibalTimer = undefined;
        e.eatingTimer = 0;
        e.activeTime = 0;
        e.wanderTimer = 0;
        
        // Status
        e.armorValue = undefined;
        e.dashCharges = undefined;
        e.dashTimer = undefined;
        e.shellValue = undefined;
        e.maxShell = undefined;
        
        // State
        e.burrowState = undefined;
        e.visualScaleY = 1;
        e.storedScore = 0;
        e.huntingTargetId = undefined;
        e.isWandering = false;
        e.wanderPoint = undefined;
    }

    /**
     * UNIFIED ENEMY FACTORY
     * Centralizes creation logic, stats calculation, and state injection.
     */
    private createEnemyInstance(type: EnemyType, x: number, y: number, options: EnemySpawnOptions = {}): Enemy {
        const state = this.engine.state;
        
        // 1. Get Base Data
        const baseStats = options.isBoss && options.bossType 
            ? this.data.getBossStats(options.bossType) 
            : this.data.getEnemyStats(type);

        // 2. Calculate Environment Multipliers
        let effectiveGeneStrength = state.currentPlanet ? state.currentPlanet.geneStrength : 1;
        if (state.currentPlanet && state.gameMode === GameMode.EXPLORATION) {
            const reduction = this.stats.get(StatId.GENE_REDUCTION, 0);
            effectiveGeneStrength = Math.max(0.5, effectiveGeneStrength - reduction);
        }

        const calculatedStats = calculateEnemyStats(type, baseStats, state.currentPlanet, state.gameMode, effectiveGeneStrength);

        // 3. Hydrate Object from Pool
        const e = this.enemyPool.get();
        e.id = generateId(options.isBoss ? 'boss' : 'e');
        e.type = type;
        e.x = x;
        e.y = y;
        e.angle = options.angleOverride || 0;
        
        // 4. Apply Stats (with optional overrides)
        e.maxHp = options.flatHp || calculatedStats.maxHp * (options.hpMultiplier || 1);
        e.hp = e.maxHp;
        e.damage = calculatedStats.damage;
        e.speed = options.speedOverride !== undefined ? options.speedOverride : calculatedStats.speed || baseStats.speed;
        e.scoreReward = options.scoreOverride || baseStats.scoreReward;
        
        e.radius = baseStats.radius;
        e.color = baseStats.color;
        e.detectionRange = baseStats.detectionRange;
        e.lastAttackTime = this.engine.time.now;

        // 5. Apply Specific Flags from Options
        if (options.isBoss) {
            e.isBoss = true;
            e.bossType = options.bossType;
        }
        if (options.scaleY !== undefined) e.visualScaleY = options.scaleY;
        if (options.armorValue !== undefined) e.armorValue = options.armorValue;
        if (options.burrowState) e.burrowState = options.burrowState;
        if (options.isWandering) e.isWandering = true;
        if (options.wanderDuration) e.wanderDuration = options.wanderDuration;
        if (options.bossSummonTimer) e.bossSummonTimer = options.bossSummonTimer;

        // 6. Unit Specific Initializations (Cleaned up from messy ifs)
        if (type === EnemyType.RUSHER) {
            e.dashCharges = 0;
            e.dashTimer = 0;
        }
        if (type === EnemyType.TANK) {
            e.shellValue = 100;
            e.maxShell = 100;
            e.shellRegenTimer = 0;
        }
        // Boss initialization defaults
        if (e.isBoss) {
            e.bossBurstCount = 0;
            e.bossNextShotTime = 0;
        }

        // 7. Register
        state.enemies.push(e);
        const trackingId = options.bossType || type;
        if (!state.stats.encounteredEnemies.includes(trackingId)) {
            state.stats.encounteredEnemies.push(trackingId);
        }

        return e;
    }

    // --- PUBLIC SPAWNERS (Now just wrappers around createEnemyInstance) ---

    public spawnEnemy() {
        const state = this.engine.state;
        const type = selectEnemyType(state.wave.index, state.gameMode, state.currentPlanet, state.wave.activeEvent);
        const x = Math.random() * state.worldWidth;
        const y = -50; 
        this.createEnemyInstance(type, x, y);
    }

    public spawnSpecificEnemy(type: EnemyType, x: number, y: number) {
        return this.createEnemyInstance(type, x, y);
    }

    public spawnPustule(x: number, y: number) {
        this.createEnemyInstance(EnemyType.PUSTULE, x, y, {
            bossSummonTimer: 15000
        });
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

        return this.createEnemyInstance(EnemyType.TUBE_WORM, corner.x, corner.y, {
            isBoss: true,
            flatHp: state.campaign.bossHp || 4000000,
            angleOverride: Math.PI/2,
            scoreOverride: 50000,
            isWandering: true,
            wanderDuration: 60000,
            burrowState: 'SURFACING',
            scaleY: 0
        });
    }

    public spawnBoss() {
        const state = this.engine.state;
        const roll = Math.random();
        let bossType = BossType.RED_SUMMONER;
        if (roll > 0.6) bossType = BossType.BLUE_BURST;
        if (roll > 0.85) bossType = BossType.PURPLE_ACID;

        const x = state.worldWidth / 2;
        const y = 100;

        // Apply Exploration Mode scaling logic handled inside factory via effectiveGeneStrength,
        // but we pass it implicitly via GameMode check inside factory.
        
        return this.createEnemyInstance(EnemyType.TANK, x, y, {
            isBoss: true,
            bossType: bossType,
            angleOverride: Math.PI/2
        });
    }

    public spawnHiveMother(planet: any) {
        const state = this.engine.state;
        
        let hpMultiplier = 1;
        // Sulfur Logic for Hive Mother HP scaling was: 1 + 0.08 * sulfur
        if (planet) {
            hpMultiplier = (1 + 0.08 * planet.sulfurIndex);
        }

        this.createEnemyInstance(EnemyType.TANK, state.worldWidth / 2, 400, {
            isBoss: true,
            bossType: BossType.HIVE_MOTHER,
            flatHp: 14000, // Base HP, will be multiplied by GeneStrength in factory, then we apply sulfur
            hpMultiplier: hpMultiplier,
            angleOverride: Math.PI/2,
            speedOverride: 0, // Stationary
            armorValue: 90
        });
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
                    this.engine.state.wave.activeEvent 
                );
                
                this.spawnSpecificEnemy(type, sx, sy);
            }
        } else {
            this.spawnSpecificEnemy(e.type, e.x, e.y);
        }
    }

    // --- GAME LOOP ---

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
            
            if (e.hp <= 0) {
                this.killEnemy(e); 
                this.enemyPool.release(e);
                enemies[i] = enemies[enemies.length - 1];
                enemies.pop();
                continue;
            }

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
        const behavior = this.getBehavior(enemy);
        
        // AI Logic Hook
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

        // Hardcoded Tank Shell Logic (Game Rule Override)
        if (enemy.type === EnemyType.TANK && !enemy.isBoss && weaponType !== WeaponType.FLAMETHROWER) {
            if (enemy.shellValue && enemy.shellValue > 0) {
                const reduction = weaponType === WeaponType.PULSE_RIFLE ? 1 : 8;
                enemy.shellValue = Math.max(0, enemy.shellValue - reduction);
            }
        }
  
        enemy.hp -= dmg;
        
        if (this.engine.state.settings.showDamageNumbers) {
            let color = '#ffffff';
            if (enemy.type === EnemyType.TANK && enemy.shellValue && enemy.shellValue > 0) {
                color = '#9ca3af'; // Grey for armor hit
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
