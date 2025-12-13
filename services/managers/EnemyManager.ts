
import { GameEngine } from '../gameService';
import { Enemy, EnemyType, BossType, GameMode, StatId, EnemySummonEvent, FloatingTextType, IGameSystem, EnemyKilledEvent, WeaponType, EnemySpawnOptions } from '../../types';
import { calculateEnemyStats, selectEnemyType } from '../../utils/enemyUtils';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { StatManager } from './StatManager';
import { DataManager } from '../DataManager';
import { AIBehavior } from '../ai/AIBehavior';
import { StandardBehavior, TankBehavior, KamikazeBehavior, ViperBehavior, PustuleBehavior, RusherBehavior, TubeWormBehavior } from '../ai/StandardBehaviors';
import { RedSummonerBehavior, BlueBurstBehavior, PurpleAcidBehavior, HiveMotherBehavior, DevourerBossBehavior } from '../ai/BossBehaviors';
import { GameEventType, DamageSource, DamageEnemyEvent } from '../../types';

const DEFAULT_ENEMY_PROPS: Partial<Enemy> = {
    isBoss: false,
    bossType: undefined,
    bossSummonTimer: undefined,
    bossBurstCount: undefined,
    bossNextShotTime: undefined,
    shedTimer: undefined,
    shedCount: undefined,
    shellRegenTimer: undefined,
    burrowTimer: undefined,
    cannibalTimer: undefined,
    eatingTimer: 0,
    activeTime: 0,
    wanderTimer: 0,
    armorValue: undefined,
    dashCharges: undefined,
    dashTimer: undefined,
    shellValue: undefined,
    maxShell: undefined,
    burrowState: undefined,
    visualScaleY: 1,
    storedScore: 0,
    huntingTargetId: undefined,
    isWandering: false,
    wanderPoint: undefined,
};

export class EnemyManager implements IGameSystem {
    public readonly systemId = 'ENEMY_SYSTEM';

    private engine: GameEngine;
    private events: EventBus;
    private stats: StatManager;
    private data: DataManager;
    private enemyPool: ObjectPool<Enemy>;
    
    // AI Strategies Registry
    private behaviors: Map<string, AIBehavior> = new Map();

    constructor(engine: GameEngine, eventBus: EventBus, statManager: StatManager, dataManager: DataManager) {
        this.engine = engine;
        this.events = eventBus;
        this.stats = statManager;
        this.data = dataManager;

        // Initialize Pool
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
        this.behaviors.set(EnemyType.TANK, new TankBehavior());
        this.behaviors.set(EnemyType.KAMIKAZE, new KamikazeBehavior());
        this.behaviors.set(EnemyType.VIPER, new ViperBehavior());
        this.behaviors.set(EnemyType.PUSTULE, new PustuleBehavior());
        this.behaviors.set(EnemyType.TUBE_WORM, new TubeWormBehavior());

        // Bosses
        this.behaviors.set(BossType.RED_SUMMONER, new RedSummonerBehavior());
        this.behaviors.set(BossType.BLUE_BURST, new BlueBurstBehavior());
        this.behaviors.set(BossType.PURPLE_ACID, new PurpleAcidBehavior());
        this.behaviors.set(BossType.HIVE_MOTHER, new HiveMotherBehavior());
        
        // Campaign Special Boss (The Devourer)
        this.behaviors.set('DEVOURER', new DevourerBossBehavior());
    }

    private getBehavior(enemy: Enemy): AIBehavior {
        // Handle explicit Boss Types first
        if (enemy.isBoss && enemy.bossType) {
            return this.behaviors.get(enemy.bossType) || this.behaviors.get(EnemyType.TANK)!;
        }
        // Handle Campaign Devourer (Tube Worm Boss variant)
        if (enemy.isBoss && enemy.type === EnemyType.TUBE_WORM) {
            return this.behaviors.get('DEVOURER')!;
        }
        // Standard mapping
        return this.behaviors.get(enemy.type) || this.behaviors.get(EnemyType.GRUNT)!;
    }

    private resetEnemyState(e: Enemy) {
        Object.assign(e, DEFAULT_ENEMY_PROPS);
    }

    /**
     * Generic Spawn Method.
     * Refactored to delegate specific initialization to AIBehavior strategies.
     */
    public spawn(type: EnemyType, x: number, y: number, options: EnemySpawnOptions = {}): Enemy {
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
        
        // 4. Apply Calculated Stats
        e.maxHp = options.flatHp || calculatedStats.maxHp * (options.hpMultiplier || 1);
        e.hp = e.maxHp;
        e.damage = calculatedStats.damage;
        e.speed = options.speedOverride !== undefined ? options.speedOverride : calculatedStats.speed || baseStats.speed;
        e.scoreReward = options.scoreOverride || baseStats.scoreReward;
        
        e.radius = baseStats.radius;
        e.color = baseStats.color;
        e.detectionRange = baseStats.detectionRange;
        e.lastAttackTime = this.engine.time.gameTime;

        // 5. Strategy Pattern Initialization (Replaces hardcoded logic)
        const behavior = this.getBehavior(e);
        
        // Create context for initialization
        const context = {
            state: this.engine.state,
            events: this.events,
            dt: 0,
            time: this.engine.time.gameTime,
            timeScale: 1,
            t: (key: string, params?: Record<string, string | number>) => this.engine.t(key, params)
        };

        // Delegate initialization
        if (behavior.initialize) {
            behavior.initialize(e, context, options);
        }
        
        // Legacy Hook (can be removed later once all logic is moved to initialize)
        if (behavior.onSpawn) {
            behavior.onSpawn(e, options);
        }

        // 6. Register
        state.enemies.push(e);
        const trackingId = options.bossType || type;
        if (!state.stats.encounteredEnemies.includes(trackingId)) {
            state.stats.encounteredEnemies.push(trackingId);
        }

        return e;
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
                
                this.spawn(type, sx, sy);
            }
        } else {
            this.spawn(e.type, e.x, e.y);
        }
    }

    // --- GAME LOOP ---

    public update(dt: number, time: number, timeScale: number) {
        const enemies = this.engine.state.enemies;
        const context = {
            state: this.engine.state,
            events: this.events,
            dt,
            time: this.engine.time.gameTime,
            timeScale,
            t: (key: string, params?: Record<string, string | number>) => this.engine.t(key, params)
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
        
        // AI Logic Hook (Armor / Shell / Enrage)
        if (behavior.onTakeDamage) {
            const context = {
                state: this.engine.state,
                events: this.events,
                dt: 0,
                time: this.engine.time.gameTime,
                timeScale: 1,
                t: (key: string, params?: Record<string, string | number>) => this.engine.t(key, params)
            };
            dmg = behavior.onTakeDamage(enemy, dmg, weaponType, context);
        }
  
        enemy.hp -= dmg;
        
        if (this.engine.state.settings.showDamageNumbers) {
            let color = '#ffffff';
            // Specific check for visual feedback on shell hits (can be generalized in onTakeDamage return if needed)
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
            time: this.engine.time.gameTime,
            timeScale: 1,
            t: (key: string, params?: Record<string, string | number>) => this.engine.t(key, params)
        };

        const behavior = this.getBehavior(e);
        if (behavior.onDeath) {
            behavior.onDeath(e, context);
        }

        // DECOUPLED LOGIC:
        // We now just emit the event. 
        // Score calculation, Audio, FX, and BioTasks are handled by listeners.
        
        let geneMultiplier = 1;
        if (this.engine.state.gameMode === GameMode.EXPLORATION && this.engine.state.currentPlanet) {
            geneMultiplier = this.engine.state.currentPlanet.geneStrength;
        }
        const score = Math.floor(e.scoreReward * geneMultiplier);

        this.events.emit<EnemyKilledEvent>(GameEventType.ENEMY_KILLED, {
            enemy: e,
            x: e.x,
            y: e.y,
            scoreReward: score,
            type: e.type,
            isBoss: !!e.isBoss,
            color: e.color,
            maxHp: e.maxHp,
            storedScore: e.storedScore
        });
    }
}
