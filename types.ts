

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
  MISSILE = 'MISSILE',   // Lv2 Option B (Global Homing)
}

export enum DefenseUpgradeType {
  INFECTION_DISPOSAL = 'INFECTION_DISPOSAL',
  SPORE_BARRIER = 'SPORE_BARRIER',
  IMPACT_PLATE = 'IMPACT_PLATE'
}

export enum ModuleType {
  GEL_BARREL = 'GEL_BARREL', // Dmg +40%
  MAG_FEED = 'MAG_FEED', // Mag +100%
  MICRO_RUPTURER = 'MICRO_RUPTURER', // Dmg +60%
  PRESSURIZED_BOLT = 'PRESSURIZED_BOLT' // Fire rate ramp
}

export enum SpaceshipModuleType {
  BASE_REINFORCEMENT = 'BASE_REINFORCEMENT', // Base HP +3000
  CARAPACE_ANALYZER = 'CARAPACE_ANALYZER', // Damage +20%
  ORBITAL_CANNON = 'ORBITAL_CANNON', // Auto attack every 8s
  ATMOSPHERIC_DEFLECTOR = 'ATMOSPHERIC_DEFLECTOR' // Drop cost -50%
}

export interface WeaponModule {
  id: string; // Instance ID
  type: ModuleType;
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
  
  // Module System
  modules: WeaponModule[]; 
  consecutiveShots: number; // For Pressurized Bolt logic
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

export enum EnemyType {
  GRUNT = 'GRUNT',
  RUSHER = 'RUSHER',
  TANK = 'TANK',
  KAMIKAZE = 'KAMIKAZE',
  VIPER = 'VIPER',
}

export enum BossType {
  RED_SUMMONER = 'RED_SUMMONER',
  BLUE_BURST = 'BLUE_BURST',
  PURPLE_ACID = 'PURPLE_ACID',
  HIVE_MOTHER = 'HIVE_MOTHER', // New Offensive Mode Boss
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

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  scoreReward: number;
  lastAttackTime: number;
  detectionRange: number; // Instance value
  
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
}

export type AllyOrder = 'PATROL' | 'FOLLOW' | 'ATTACK';

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

export enum DamageSource {
    PLAYER = 'PLAYER',
    TURRET = 'TURRET',
    ALLY = 'ALLY',
    ORBITAL = 'ORBITAL',
    ENEMY = 'ENEMY' // For incoming damage, not tracked in stats usually
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  rangeRemaining: number;
  fromPlayer: boolean; // true if player/ally/turret, false if enemy
  source: DamageSource; // Specific source for stats
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
}

export interface TurretSpot {
  id: number;
  x: number;
  y: number;
  builtTurret?: Turret;
}

export enum TerrainType {
    CRATER = 'CRATER',
    ROCK = 'ROCK',
    DUST = 'DUST',
    // New Visual Variants
    MAGMA_POOL = 'MAGMA_POOL',
    ICE_SPIKE = 'ICE_SPIKE',
    ALIEN_TREE = 'ALIEN_TREE',
    CRYSTAL = 'CRYSTAL',
    SPORE_POD = 'SPORE_POD'
}

export interface TerrainFeature {
  id: string;
  type: TerrainType;
  x: number;
  y: number;
  radius: number;
  rotation?: number;
  points?: {x: number, y: number}[]; // For irregular shapes
  opacity?: number;
  // Visual specific
  variant?: number; // 0-3 for varied sprite looks
  color?: string; // Custom color override
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
  language: 'EN' | 'CN';
}

export interface GameStats {
  shotsFired: number;
  shotsHit: number;
  damageDealt: number; // Total
  damageBySource: Record<DamageSource, number>; // Breakdown
  killsByType: Record<EnemyType | 'BOSS', number>;
  encounteredEnemies: string[]; // List of EnemyType or BossType IDs encountered in this run
}

export enum SpecialEventType {
  NONE = 'NONE',
  FRENZY = 'FRENZY',
  BOSS = 'BOSS'
}

export enum AppMode {
    START_MENU = 'START_MENU',
    EXPLORATION_MAP = 'EXPLORATION_MAP',
    GAMEPLAY = 'GAMEPLAY',
    SPACESHIP_VIEW = 'SPACESHIP_VIEW',
    ORBITAL_UPGRADES = 'ORBITAL_UPGRADES',
    CARAPACE_GRID = 'CARAPACE_GRID',
    SHIP_COMPUTER = 'SHIP_COMPUTER'
}

export enum GameMode {
    SURVIVAL = 'SURVIVAL',
    EXPLORATION = 'EXPLORATION'
}

export enum MissionType {
    DEFENSE = 'DEFENSE',
    OFFENSE = 'OFFENSE'
}

export enum BiomeType {
    BARREN = 'BARREN',
    ICE = 'ICE',
    VOLCANIC = 'VOLCANIC',
    DESERT = 'DESERT',
    TOXIC = 'TOXIC'
}

// Visual Planet Types
export enum PlanetVisualType {
    TERRAN = 'TERRAN',
    GAS_GIANT = 'GAS_GIANT',
    RINGED = 'RINGED',
    LAVA = 'LAVA',
    ICE = 'ICE',
    BARREN = 'BARREN'
}

export interface AtmosphereGas {
    id: string;
    name: string;
    color: string;
    percentage: number; // 0.0 to 1.0
    description: string;
}

export interface Planet {
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    missionType: MissionType;
    totalWaves: number;
    geneStrength: number;
    sulfurIndex: number; // 0 - 10
    landingDifficulty: number; // 1 - 30 (Percentage cost)
    completed: boolean;
    biome: BiomeType;
    visualType: PlanetVisualType;
    atmosphere: AtmosphereGas[];
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
}

export enum OrbitalUpgradeEffect {
    DAMAGE = 'DAMAGE',
    RATE = 'RATE'
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

export interface SpaceshipState {
    installedModules: SpaceshipModuleType[];
    
    // Orbital Cannon Tree
    orbitalUpgradeTree: OrbitalUpgradeNode[][]; 
    orbitalDamageMultiplier: number;
    orbitalRateMultiplier: number;

    // Carapace Analyzer Grid
    carapaceGrid: CarapaceGridState | null;
}

export enum FloatingTextType {
    DAMAGE = 'DAMAGE',
    CRIT = 'CRIT',
    SYSTEM = 'SYSTEM',
    LOOT = 'LOOT'
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

export interface GameState {
  appMode: AppMode;
  gameMode: GameMode;
  
  // Exploration Data
  planets: Planet[];
  currentPlanet: Planet | null;
  selectedPlanetId: string | null;
  savedPlayerState: PersistentPlayerState | null;

  // Spaceship
  spaceship: SpaceshipState;
  orbitalSupportTimer: number; // Tracks time for ORBITAL_CANNON module

  // Save System
  saveSlots: SaveFile[];

  camera: { x: number; y: number };
  player: Player;
  base: {
    x: number;
    y: number
    width: number;
    height: number;
    hp: number;
    maxHp: number;
  };
  terrain: TerrainFeature[];
  bloodStains: BloodStain[];
  enemies: Enemy[];
  allies: Ally[];
  projectiles: Projectile[];
  particles: Particle[];
  orbitalBeams: OrbitalBeam[];
  turretSpots: TurretSpot[];
  toxicZones: ToxicZone[];
  activeSpecialEvent: SpecialEventType;
  
  wave: number;
  waveTimeRemaining: number;
  waveDuration: number;
  spawnTimer: number;
  enemiesPendingSpawn: number;
  enemiesSpawnedInWave: number;
  totalEnemiesInWave: number;
  lastAllySpawnTime: number;

  isGameOver: boolean;
  missionComplete: boolean;
  isPaused: boolean;
  isTacticalMenuOpen: boolean;
  isInventoryOpen: boolean;
  isShopOpen: boolean;
  
  floatingTexts: FloatingText[];
  activeTurretId?: number;

  settings: GameSettings;
  stats: GameStats;
  
  input?: any; // kept for legacy compat if needed, though strictly handled in engine
}

export interface InputState {
  keys: Record<string, boolean>;
  mouse: { x: number; y: number; down: boolean; rightDown: boolean };
}