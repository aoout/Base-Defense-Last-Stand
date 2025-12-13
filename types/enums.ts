
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
  PRESSURIZED_BOLT = 'PRESSURIZED_BOLT', // Fire rate ramp
  KINETIC_STABILIZER = 'KINETIC_STABILIZER', // Pierce once, 80% dmg on 2nd
  TENSION_SPRING = 'TENSION_SPRING' // Reload -20%, Dmg +20%
}

export enum SpaceshipModuleType {
  BASE_REINFORCEMENT = 'BASE_REINFORCEMENT', // Base HP +3000
  CARAPACE_ANALYZER = 'CARAPACE_ANALYZER', // Damage +20%
  ORBITAL_CANNON = 'ORBITAL_CANNON', // Auto attack every 8s
  ATMOSPHERIC_DEFLECTOR = 'ATMOSPHERIC_DEFLECTOR', // Drop cost -50%
  BIO_SEQUENCING = 'BIO_SEQUENCING' // New Module
}

export enum BioBuffType {
    ALLY_HP = 'ALLY_HP',
    ALLY_DMG = 'ALLY_DMG',
    LURE_BONUS = 'LURE_BONUS',
    GENE_REDUCTION = 'GENE_REDUCTION',
    ALPHA_YIELD = 'ALPHA_YIELD',
    BETA_YIELD = 'BETA_YIELD',
    GAMMA_YIELD = 'GAMMA_YIELD'
}

export enum BioResource {
    ALPHA = 'ALPHA',
    BETA = 'BETA',
    GAMMA = 'GAMMA'
}

export enum EnemyType {
  GRUNT = 'GRUNT',
  RUSHER = 'RUSHER',
  TANK = 'TANK',
  KAMIKAZE = 'KAMIKAZE',
  VIPER = 'VIPER',
  PUSTULE = 'PUSTULE',
  TUBE_WORM = 'TUBE_WORM', // New Enemy
}

export enum BossType {
  RED_SUMMONER = 'RED_SUMMONER',
  BLUE_BURST = 'BLUE_BURST',
  PURPLE_ACID = 'PURPLE_ACID',
  HIVE_MOTHER = 'HIVE_MOTHER', // New Offensive Mode Boss
}

export type AllyOrder = 'PATROL' | 'FOLLOW' | 'ATTACK';

export enum DamageSource {
    PLAYER = 'PLAYER',
    TURRET = 'TURRET',
    ALLY = 'ALLY',
    ORBITAL = 'ORBITAL',
    ENEMY = 'ENEMY' // For incoming damage, not tracked in stats usually
}

// New: Projectile Identifiers for Presets
export enum ProjectileID {
    // Player Weapons
    P_PISTOL = 'P_PISTOL',
    P_AR = 'P_AR',
    P_SG = 'P_SG',
    P_SR = 'P_SR',
    P_FLAME = 'P_FLAME',
    P_PULSE = 'P_PULSE',
    P_GRENADE = 'P_GRENADE',
    P_GRENADE_FRAG = 'P_GRENADE_FRAG', // The explosive payload

    // Turrets
    T_STANDARD = 'T_STANDARD',
    T_GAUSS = 'T_GAUSS',
    T_SNIPER = 'T_SNIPER',
    T_MISSILE = 'T_MISSILE',

    // Allies
    ALLY_STD = 'ALLY_STD',

    // Enemies
    E_VIPER = 'E_VIPER',
    E_BOSS_BLUE = 'E_BOSS_BLUE',
    E_BOSS_PURPLE = 'E_BOSS_PURPLE',
    E_DEVOURER = 'E_DEVOURER'
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

export type PerformanceMode = 'QUALITY' | 'BALANCED' | 'PERFORMANCE';

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
    SHIP_COMPUTER = 'SHIP_COMPUTER',
    INFRASTRUCTURE_RESEARCH = 'INFRASTRUCTURE_RESEARCH',
    PLANET_CONSTRUCTION = 'PLANET_CONSTRUCTION',
    YIELD_REPORT = 'YIELD_REPORT',
    BIO_SEQUENCING = 'BIO_SEQUENCING',
    HEROIC_ZEAL = 'HEROIC_ZEAL'
}

export enum GameMode {
    SURVIVAL = 'SURVIVAL',
    EXPLORATION = 'EXPLORATION',
    CAMPAIGN = 'CAMPAIGN'
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

export enum PlanetBuildingType {
    BIOMASS_EXTRACTOR = 'BIOMASS_EXTRACTOR',
    OXYGEN_EXTRACTOR = 'OXYGEN_EXTRACTOR'
}

export enum OrbitalUpgradeEffect {
    DAMAGE = 'DAMAGE',
    RATE = 'RATE'
}

export enum InfrastructureUpgradeType {
    BASE_HP = 'BASE_HP',
    TURRET_HP = 'TURRET_HP',
    TURRET_L1_DMG = 'TURRET_L1_DMG',
    TURRET_GAUSS_RATE = 'TURRET_GAUSS_RATE',
    TURRET_SNIPER_RANGE = 'TURRET_SNIPER_RANGE',
    TURRET_MISSILE_DMG = 'TURRET_MISSILE_DMG',
    GLOBAL_TURRET_DMG = 'GLOBAL_TURRET_DMG',
    GLOBAL_TURRET_RATE = 'GLOBAL_TURRET_RATE',
    TURRET_L1_COST = 'TURRET_L1_COST'
}

export enum HeroicUpgradeType {
    MAX_HP = 'MAX_HP',
    MAX_ARMOR = 'MAX_ARMOR',
    RELOAD_SPEED = 'RELOAD_SPEED',
    MOVE_SPEED = 'MOVE_SPEED',
    DAMAGE = 'DAMAGE',
    TURRET_MASTERY = 'TURRET_MASTERY'
}

export enum FloatingTextType {
    DAMAGE = 'DAMAGE',
    CRIT = 'CRIT',
    SYSTEM = 'SYSTEM',
    LOOT = 'LOOT'
}

export enum GalacticEventType {
    EXPANSION = 'EXPANSION',
    INVASION = 'INVASION',
    SALVAGE = 'SALVAGE'
}

export type SystemIconType = 'DASHBOARD' | 'DATABASE' | 'PLANET' | 'LOGS' | 'SETTINGS' | 'SAVE' | 'CLOSE' | 'BACK' | 'LOCK' | 'UNLOCK' | 'WARNING';
