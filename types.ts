

export enum WeaponType {
  AR = 'AR',
  SG = 'SG',
  SR = 'SR',
  PISTOL = 'Pistol',
  FLAMETHROWER = 'Flamethrower',
  PULSE_RIFLE = 'Pulse Rifle',
  GRENADE_LAUNCHER = 'Grenade Launcher'
}

export enum TurretType {
  STANDARD = 'STANDARD', // Lv1
  GAUSS = 'GAUSS',       // Lv2 Option A (Machine Gun)
  SNIPER = 'SNIPER',     // Lv2 Option B (Long Range)
  MISSILE = 'MISSILE',   // Lv2 Option C (Global Homing)
}

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // ms
  spread: number;
  magSize: number;
  reloadTime: number; // ms
  range: number;
  projectileSpeed: number;
  pellets?: number; // For shotgun
  isExplosive?: boolean; // For GL
  isPiercing?: boolean; // For Pulse/Flame
}

export interface WeaponState {
  type: WeaponType;
  ammoInMag: number;
  ammoReserve: number;
  lastFireTime: number;
  reloading: boolean;
  reloadStartTime: number;
}

export interface InventoryItem {
    id: string;
    type: WeaponType;
}

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
  
  currentWeaponIndex: number; // 0-3 pointing to loadout
  grenades: number;
  score: number; // Used as currency (Scraps)
  isAiming: boolean; // New: Scope state
}

export enum EnemyType {
  GRUNT = 'GRUNT',
  RUSHER = 'RUSHER',
  TANK = 'TANK',
  KAMIKAZE = 'KAMIKAZE',
  VIPER = 'VIPER',
  // Boss Types are handled via isBoss flag, but we can treat them as special entities
}

export enum BossType {
  RED_SUMMONER = 'RED_SUMMONER',
  BLUE_BURST = 'BLUE_BURST',
  PURPLE_ACID = 'PURPLE_ACID',
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  scoreReward: number;
  lastAttackTime: number;
  // AI State
  targetId?: string; // 'player' or 'base' or 'ally'
  
  // Boss Specifics
  isBoss?: boolean;
  bossType?: BossType;
  bossSummonTimer?: number; // For Red Boss
  bossBurstCount?: number; // For Blue Boss
  bossNextShotTime?: number; // For Blue Boss burst timing
}

export type AllyOrder = 'PATROL' | 'FOLLOW' | 'ATTACK';

export interface Ally extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  currentOrder: AllyOrder;
  state: 'PATROL' | 'COMBAT' | 'FOLLOW' | 'ATTACK';
  targetEnemyId?: string;
  lastFireTime: number;
  patrolPoint: { x: number; y: number };
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  rangeRemaining: number;
  fromPlayer: boolean; // true if player/ally/turret, false if enemy
  isExplosive?: boolean;
  isPiercing?: boolean;
  weaponType?: WeaponType; // For rendering specific visuals
  maxRange?: number; // Total initial range
  hitIds?: string[]; // IDs of entities hit (for piercing)
  
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

export interface Turret extends Entity {
  level: number;
  type: TurretType;
  lastFireTime: number;
  range: number;
  hp: number;
  maxHp: number;
  damage: number;
}

export interface TurretSpot {
  id: number;
  x: number;
  y: number;
  builtTurret?: Turret;
}

export interface TerrainFeature {
  id: string;
  type: 'CRATER' | 'ROCK' | 'DUST';
  x: number;
  y: number;
  radius: number;
  rotation?: number;
  points?: {x: number, y: number}[]; // For irregular rock shapes
  opacity?: number;
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

export interface GameSettings {
  showHUD: boolean;
  showBlood: boolean;
  showDamageNumbers: boolean;
}

export interface GameStats {
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  killsByType: Record<EnemyType | 'BOSS', number>;
}

export enum SpecialEventType {
  NONE = 'NONE',
  FRENZY = 'FRENZY',
  BOSS = 'BOSS'
}

export interface GameState {
  camera: { x: number; y: number };
  player: Player;
  base: {
    x: number;
    y: number;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
  };
  terrain: TerrainFeature[]; // Background details
  bloodStains: BloodStain[]; // Dead enemy remains
  enemies: Enemy[];
  allies: Ally[];
  projectiles: Projectile[];
  particles: Particle[];
  turretSpots: TurretSpot[];
  activeTurretId?: number; // ID of turret spot being upgraded
  activeSpecialEvent: SpecialEventType;
  toxicZones: ToxicZone[];

  wave: number;
  
  // Wave Timer Logic
  waveTimeRemaining: number; // Time left in current wave (ms)
  spawnTimer: number; // Time accumulation for next enemy spawn (ms)
  
  enemiesSpawnedInWave: number;
  totalEnemiesInWave: number;
  lastAllySpawnTime: number;
  isGameOver: boolean;
  isPaused: boolean;
  isTacticalMenuOpen: boolean; 
  isInventoryOpen: boolean;
  isShopOpen: boolean;
  messages: { text: string; time: number; x: number; y: number; color: string }[];
  
  settings: GameSettings;
  stats: GameStats;
}

export interface InputState {
  keys: Record<string, boolean>;
  mouse: { x: number; y: number; down: boolean; rightDown: boolean };
}
