
import { BioBuffType, BioResource, BossType, DamageSource, DefenseUpgradeType, EnemyType, FloatingTextType, GameMode, HeroicUpgradeType, InfrastructureUpgradeType, OrbitalUpgradeEffect, SpaceshipModuleType, WeaponType } from './enums';
import { InventoryItem, WeaponModule, WeaponState } from './items';

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
