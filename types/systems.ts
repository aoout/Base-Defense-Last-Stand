
import { BioBuffType, BioResource, BossType, DamageSource, DefenseUpgradeType, EnemyType, FloatingTextType, GameMode, HeroicUpgradeType, InfrastructureUpgradeType, OrbitalUpgradeEffect, SpaceshipModuleType, WeaponType } from './enums';
import { InventoryItem, WeaponModule, WeaponState } from './items';

// --- VISUAL SYSTEM TYPES ---
export type CachePolicy = 'STATIC' | 'DYNAMIC';

export interface IVisualDefinition<T> {
    /** The render function to draw this entity */
    render: (ctx: CanvasRenderingContext2D, entity: T, time: number, lodLevel: number) => void;
    /** 
     * Determines if this entity should be cached as a static sprite.
     * @param lodLevel Current LOD level (0=Quality, 1=Balanced, 2=Performance)
     */
    getCachePolicy: (lodLevel: number) => CachePolicy;
    /** Generates a unique key for the cache (e.g. based on Type + Color + Radius) */
    getCacheKey: (entity: T) => string;
}

/**
 * Standard interface for any system that needs to run in the main game loop.
 */
export interface IGameSystem {
    /**
     * Unique identifier for the system (used for debugging or dependency resolution.
     */
    readonly systemId: string;

    /**
     * Called every frame.
     * @param dt Delta time in milliseconds since last frame.
     * @param time Total game time in milliseconds.
     * @param timeScale Simulation speed multiplier (0 for pause, 1 for normal).
     */
    update(dt: number, time: number, timeScale: number): void;
}

// Interface for spawn overrides (Moved from EnemyManager to prevent circular deps)
export interface EnemySpawnOptions {
    isBoss?: boolean;
    bossType?: BossType;
    hpMultiplier?: number;
    flatHp?: number;
    scaleY?: number;
    scoreOverride?: number;
    angleOverride?: number;
    speedOverride?: number;
    armorValue?: number;
    burrowState?: 'SURFACING' | 'IDLE' | 'DIVING' | 'UNDERGROUND';
    isWandering?: boolean;
    wanderDuration?: number;
    bossSummonTimer?: number;
}

export interface BioNode {
    id: number;
    q: number;
    r: number;
    buffType: BioBuffType;
    buffValue: number;
    isUnlocked: boolean;
    cost: Record<BioResource, number>;
    connections: number[]; // IDs of connected nodes
}

export interface BioTask {
    id: string;
    targetEnemy: EnemyType;
    count: number;
    progress: number;
    rewardResource: BioResource;
    rewardAmount: number;
}

export interface HeroicNode {
    id: number;
    x: number;
    y: number; // Normalized coordinates -1 to 1 usually, mapped to UI
    type: HeroicUpgradeType;
    value: number;
    cost: number;
    purchased: boolean;
}

export interface EnemyStatsConfig {
    hp: number;
    speed: number;
    damage: number;
    scoreReward: number;
    radius: number;
    color: string;
    detectionRange: number; // AI vision range
    attackRate?: number;
    range?: number;
    fireRate?: number; // For bosses
    burstDelay?: number; // For bosses
    summonRate?: number; // For bosses
    projectileDamage?: number; // For bosses
}

export interface GameStats {
  shotsFired: number;
  shotsHit: number;
  damageDealt: number; // Total
  damageBySource: Record<DamageSource, number>; // Breakdown
  killsByType: Record<EnemyType | 'BOSS', number>;
  encounteredEnemies: string[]; // List of EnemyType or BossType IDs encountered in this run
}

export interface PersistentPlayerState {
    score: number;
    weapons: Record<WeaponType, WeaponState>;
    loadout: [WeaponType, WeaponType, WeaponType, WeaponType];
    inventory: (InventoryItem | null)[];
    grenades: number;
    upgrades: DefenseUpgradeType[];
    freeModules: WeaponModule[];
    grenadeModules: WeaponModule[];
}

export interface SaveFile {
    id: string;
    timestamp: number; // Date.now()
    label: string; // e.g. "SURVIVAL - WAVE 10" or "EXPLORATION - PX-99"
    isPinned: boolean;
    data: string; // JSON string of GameState
    mode: GameMode;
    version?: string; // Schema version of the save data
}

export interface CombatRecord {
    id: string;
    timestamp: number;
    mode: GameMode;
    result: 'VICTORY' | 'DEFEAT' | 'EXTRACTION';
    details: string; // Pre-formatted string key or raw text
    subDetails?: string; // e.g. "Wave 17" or "14:20"
    score: number;
}

export interface OrbitalUpgradeNode {
    id: string;
    layer: number; // 1-7
    index: number; // 0 to layer-1
    cost: number;
    effectType: OrbitalUpgradeEffect;
    effectValue: number; // Percentage float (e.g. 0.05)
    purchased: boolean;
}

// Carapace Analyzer Grid
export interface CarapaceNode {
    id: string;
    row: number; // 0-3
    col: number; // 0-3
    cost: number;
    targetEnemy: EnemyType;
    damageBonus: number; // 0.1 - 0.3
    purchased: boolean;
}

export interface CarapaceRowBonus {
    id: string;
    rowIndex: number;
    damageBonus: number; // 0.2 - 0.6
    unlocked: boolean;
}

export interface CarapaceColBonus {
    id: string;
    colIndex: number;
    armorBonus: number; // 10 - 30
    unlocked: boolean;
}

export interface CarapaceGridState {
    nodes: CarapaceNode[][]; // 4x4
    rowBonuses: CarapaceRowBonus[];
    colBonuses: CarapaceColBonus[];
}

export interface InfrastructureOption {
    id: string;
    type: InfrastructureUpgradeType;
    value: number; // The random roll value
    cost: number;
}

export interface SpaceshipState {
    installedModules: SpaceshipModuleType[];
    
    // Orbital Cannon Tree
    orbitalUpgradeTree: OrbitalUpgradeNode[][]; 
    orbitalDamageMultiplier: number;
    orbitalRateMultiplier: number;

    // Carapace Analyzer Grid
    carapaceGrid: CarapaceGridState | null;

    // Infrastructure Research
    infrastructureUpgrades: InfrastructureOption[];
    infrastructureOptions: InfrastructureOption[]; // Current 3 choices
    infrastructureLocked: boolean; // True after picking, resets on mission success

    // Bio Sequencing
    bioNodes: BioNode[];
    bioResources: Record<BioResource, number>;
    bioTasks: BioTask[]; // 3 available options
    activeBioTask: BioTask | null;

    // Heroic Zeal (Campaign)
    heroicNodes: HeroicNode[];

    // Mini-game State
    snakeRewardClaimed: boolean;
}

export interface FloatingText {
    id: string;
    text: string;
    x: number;
    y: number;
    vx: number; // Velocity X
    vy: number; // Velocity Y
    life: number;
    maxLife: number;
    color: string;
    type: FloatingTextType;
    size: number;
}
