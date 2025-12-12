
import { AllyOrder, BossType, DamageSource, DefenseUpgradeType, EnemyType, TurretType, WeaponType } from './enums';
import { InventoryItem, WeaponModule, WeaponState } from './items';

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number; // radians
  color: string;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  speed: number;
  lastHitTime: number;
  
  // Inventory System
  weapons: Record<WeaponType, WeaponState>; // Data store for ammo states
  loadout: [WeaponType, WeaponType, WeaponType, WeaponType]; // 0-2: Main, 3: Pistol
  inventory: (InventoryItem | null)[]; // Backpack slots
  
  // Upgrades
  upgrades: DefenseUpgradeType[];
  
  // Modules
  freeModules: WeaponModule[]; // Modules not installed on any weapon
  grenadeModules: WeaponModule[]; // Modules installed on grenades

  currentWeaponIndex: number; // 0-3 pointing to loadout
  grenades: number;
  score: number; // Used as currency (Scraps)
  isAiming: boolean; // New: Scope state
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  scoreReward: number;
  lastAttackTime: number;
  detectionRange: number; // Instance value
  
  // Tank Mechanics
  shellValue?: number; // Current Shell
  maxShell?: number;   // Max Shell (100)
  shellRegenTimer?: number;

  // Boss Specifics
  isBoss?: boolean;
  bossType?: BossType;
  bossSummonTimer?: number; // For Red Boss
  bossBurstCount?: number; // For Blue Boss
  bossNextShotTime?: number; // For Blue Boss burst timing
  
  // Hive Mother Specifics
  armorValue?: number; // Percentage 0-100
  shedTimer?: number;
  shedCount?: number;

  // Rusher Ability
  dashCharges?: number;
  dashTimer?: number;

  // Tube Worm Mechanics
  burrowState?: 'IDLE' | 'DIVING' | 'UNDERGROUND' | 'SURFACING';
  burrowTimer?: number;
  cannibalTimer?: number;
  visualScaleY?: number; // For dive animation
  storedScore?: number; // Biomass from eaten enemies
  huntingTargetId?: string; // ID of the Grunt being chased
  eatingTimer?: number; // Visual timer for swallowing animation

  // Campaign Wandering Logic
  isWandering?: boolean;
  wanderTimer?: number;     // How long they have been wandering or how long left
  wanderDuration?: number;  // Total duration to wander
  wanderPoint?: { x: number, y: number }; // Current random destination
  activeTime?: number; // Total active surface time for campaign boss
}

export interface Ally extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  currentOrder: AllyOrder;
  state: 'PATROL' | 'COMBAT' | 'FOLLOW' | 'ATTACK';
  targetEnemyId?: string;
  lastFireTime: number;
  patrolPoint: { x: number; y: number };
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  speed: number;
  damage: number;
  rangeRemaining: number;
  fromPlayer: boolean; // true if player/ally/turret, false if enemy
  source: DamageSource; // Specific source for stats
  isExplosive?: boolean;
  explosionRadius?: number;
  isPiercing?: boolean;
  weaponType?: WeaponType; // For rendering specific visuals
  maxRange?: number; // Total initial range
  hitIds?: string[]; // IDs of entities hit (for piercing)
  
  // New: Active Modules for dynamic effects
  activeModules?: WeaponModule[];

  // Missile Logic
  isHoming?: boolean;
  targetId?: string;
  turnSpeed?: number;

  // Boss Logic
  createsToxicZone?: boolean; // For Purple Boss
}

export interface ToxicZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number;
  damagePerSecond: number;
  createdAt: number;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface OrbitalBeam {
    id: string;
    x: number;
    y: number;
    life: number; // 0 to 1
    maxLife: number; // In ms
    width: number;
    color: string;
}

export interface Turret extends Entity {
  level: number;
  type: TurretType;
  lastFireTime: number;
  range: number;
  hp: number;
  maxHp: number;
  damage: number;
  fireRate: number;
  spinUp?: number; // 0.0 to 2.0 (0% to 200%)
}

export interface TurretSpot {
  id: number;
  x: number;
  y: number;
  builtTurret?: Turret;
}

export interface BloodStain {
  id: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  blotches: {x: number, y: number, r: number}[]; // Array of circles composing the stain
}