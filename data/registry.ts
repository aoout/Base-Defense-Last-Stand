


import { WeaponType, WeaponStats, EnemyType, BossType, DefenseUpgradeType, ModuleType, SpaceshipModuleType, TurretType, EnemyStatsConfig } from "../types";

export const PLAYER_STATS = {
  maxHp: 200,
  maxArmor: 100,
  speed: 3.2, // Increased by 60% (was 2)
  armorRegenDelay: 5000,
  armorRegenRate: 6 / 60, 
  hpRegenDelay: 10000,
  hpRegenRate: 0.5 / 60,
  grenadeRadius: 150,
  grenadeDamage: 500,
  maxGrenades: 3,
  initialScore: 300, 
};

export const BASE_STATS = {
  maxHp: 5000,
  width: 200,
  height: 100,
};

export const TURRET_COSTS = {
  baseCost: 1200,
  costIncrement: 100,
  upgrade_gauss: 3500,
  upgrade_sniper: 3700,
  upgrade_missile: 4100,
};

export const TURRET_STATS = {
  [TurretType.STANDARD]: { hp: 600, range: 400, damage: 60, fireRate: 120 },
  [TurretType.GAUSS]:    { hp: 800, range: 650, damage: 90, fireRate: 100 },
  [TurretType.SNIPER]:   { hp: 800, range: 1300, damage: 140, fireRate: 250 },
  [TurretType.MISSILE]:  { hp: 1000, range: 9999, damage: 160, fireRate: 840 }, 
};

export const ALLY_STATS = {
  hp: 200,
  speed: 1.44, // Increased by 60% (was 0.9)
  damage: 20,
  range: 400,
  maxCount: 5,
};

export const TOXIC_ZONE_STATS = {
    dps: 10,
    radius: 60,
    duration: 8000,
};

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  [WeaponType.AR]: {
    name: 'Assault Rifle',
    damage: 45,
    fireRate: 100,
    spread: 0.1,
    magSize: 30,
    reloadTime: 1500,
    range: 600,
    projectileSpeed: 20,
  },
  [WeaponType.SG]: {
    name: 'Shotgun',
    damage: 35,
    pellets: 8,
    fireRate: 600,
    spread: 0.3,
    magSize: 8,
    reloadTime: 2000,
    range: 300,
    projectileSpeed: 18,
  },
  [WeaponType.SR]: {
    name: 'Sniper Rifle',
    damage: 400,
    fireRate: 1500,
    spread: 0.01,
    magSize: 5,
    reloadTime: 2500,
    range: 1200,
    projectileSpeed: 40,
  },
  [WeaponType.PISTOL]: {
    name: 'Pistol',
    damage: 60,
    fireRate: 300,
    spread: 0.05,
    magSize: 12,
    reloadTime: 1000,
    range: 500,
    projectileSpeed: 18,
  },
  [WeaponType.FLAMETHROWER]: {
    name: 'Flamethrower',
    damage: 15,
    fireRate: 40,
    spread: 0.15,
    magSize: 100,
    reloadTime: 3000,
    range: 350,
    projectileSpeed: 12,
    isPiercing: true
  },
  [WeaponType.PULSE_RIFLE]: {
    name: 'Pulse Rifle',
    damage: 35,
    fireRate: 80,
    spread: 0.02,
    magSize: 45,
    reloadTime: 1200,
    range: 700,
    projectileSpeed: 30,
    isPiercing: true
  },
  [WeaponType.GRENADE_LAUNCHER]: {
    name: 'Grenade Launcher',
    damage: 300,
    fireRate: 1200,
    spread: 0.1,
    magSize: 6,
    reloadTime: 3500,
    range: 600,
    projectileSpeed: 15,
    isExplosive: true
  }
};

export const INITIAL_AMMO = {
  [WeaponType.AR]: 300,
  [WeaponType.SG]: 60,
  [WeaponType.SR]: 50,
  [WeaponType.PISTOL]: Infinity,
  [WeaponType.FLAMETHROWER]: 400,
  [WeaponType.PULSE_RIFLE]: 200,
  [WeaponType.GRENADE_LAUNCHER]: 24,
};

export const ENEMY_STATS: Record<EnemyType, EnemyStatsConfig> = {
  [EnemyType.GRUNT]: { 
      hp: 100, speed: 0.96, damage: 10, scoreReward: 10, radius: 15, color: '#F87171',
      detectionRange: 400 // Short sighted
  },
  [EnemyType.RUSHER]: { 
      hp: 300, speed: 1.68, damage: 15, scoreReward: 20, radius: 12, color: '#FCD34D',
      detectionRange: 600 // High alertness
  },
  [EnemyType.TANK]: { 
      hp: 1500, speed: 0.48, damage: 30, scoreReward: 50, radius: 25, color: '#1F2937',
      detectionRange: 500
  },
  [EnemyType.KAMIKAZE]: { 
      hp: 50, speed: 2.4, damage: 200, scoreReward: 15, radius: 10, color: '#A855F7',
      detectionRange: 500
  },
  [EnemyType.VIPER]: { 
      hp: 150, speed: 0.72, damage: 40, scoreReward: 30, radius: 18, color: '#10B981', 
      attackRate: 2000, range: 450,
      detectionRange: 800 // Hunter behavior
  },
};

export const BOSS_STATS: Record<BossType, EnemyStatsConfig> = {
    [BossType.RED_SUMMONER]: {
        hp: 10000, damage: 50, speed: 1.12, scoreReward: 1000, radius: 40, color: '#7f1d1d',
        summonRate: 2000,
        detectionRange: 1000
    },
    [BossType.BLUE_BURST]: {
        hp: 8000, damage: 30, speed: 0.96, scoreReward: 1000, radius: 35, color: '#1e3a8a',
        fireRate: 1200, burstDelay: 100,
        detectionRange: 1200
    },
    [BossType.PURPLE_ACID]: {
        hp: 12000, damage: 40, speed: 1.04, scoreReward: 1000, radius: 45, color: '#581c87',
        fireRate: 4000, projectileDamage: 60,
        detectionRange: 1000
    },
    [BossType.HIVE_MOTHER]: {
        hp: 20000, damage: 60, speed: 0, scoreReward: 5000, radius: 60, color: '#ef4444',
        detectionRange: 2000
    }
};

export const DEFENSE_UPGRADE_INFO = {
    [DefenseUpgradeType.INFECTION_DISPOSAL]: {
        cost: 3500,
        armorMitigation: 0.9,
        regenRate: 10 / 60
    },
    [DefenseUpgradeType.SPORE_BARRIER]: {
        cost: 2700,
        maxArmorBonus: 100
    },
    [DefenseUpgradeType.IMPACT_PLATE]: {
        cost: 3100,
        meleeReduction: 0.2
    }
};

export const MODULE_STATS = {
    [ModuleType.GEL_BARREL]: {
        name: "Gel Penetration Diffuser",
        cost: 1900,
        desc: "Damage +40%",
        exclude: [WeaponType.FLAMETHROWER, WeaponType.GRENADE_LAUNCHER, WeaponType.PULSE_RIFLE, 'GRENADE']
    },
    [ModuleType.MAG_FEED]: {
        name: "Efficient Stack Feed",
        cost: 1700,
        desc: "Mag Capacity +100%",
        exclude: [WeaponType.FLAMETHROWER, WeaponType.GRENADE_LAUNCHER, WeaponType.PULSE_RIFLE, 'GRENADE']
    },
    [ModuleType.MICRO_RUPTURER]: {
        name: "Micro-Vibration Rupturer",
        cost: 2100,
        desc: "Damage +60%",
        only: [WeaponType.SR, WeaponType.GRENADE_LAUNCHER, WeaponType.PULSE_RIFLE, 'GRENADE']
    },
    [ModuleType.PRESSURIZED_BOLT]: {
        name: "Pressurized Bolt",
        cost: 2300,
        desc: "+10% Fire Rate per shot (Stacks)",
        only: [WeaponType.AR, WeaponType.FLAMETHROWER, WeaponType.PULSE_RIFLE]
    }
};

export const SPACESHIP_MODULES = {
    [SpaceshipModuleType.BASE_REINFORCEMENT]: {
        name: "Base Reinforcement Module",
        cost: 4000,
        desc: "Deployed Base HP +3000"
    },
    [SpaceshipModuleType.CARAPACE_ANALYZER]: {
        name: "Xenobiology Carapace Analyzer",
        cost: 7000,
        desc: "All Player Damage +20%"
    },
    [SpaceshipModuleType.ORBITAL_CANNON]: {
        name: "Orbital Long-Range Support",
        cost: 6700,
        desc: "Strikes nearest enemy every 8s (400 Dmg)"
    },
    [SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR]: {
        name: "Atmospheric Drag Adaptive Deflector",
        cost: 4700,
        desc: "Orbital Drop Cost -50%"
    }
};

export const SHOP_PRICES = {
  AR_AMMO: 50,
  SG_AMMO: 80,
  SR_AMMO: 100,
  GRENADE: 150,
  PULSE_AMMO: 60,
  FLAME_AMMO: 50,
  GL_AMMO: 120,
  WEAPON_PULSE: 1300,
  WEAPON_FLAME: 1900,
  WEAPON_GL: 2100,
};

export const BESTIARY_DB: Record<string, { codeName: string, classification: string, danger: number, description: string }> = {
    [EnemyType.GRUNT]: {
        codeName: "GRUNT",
        classification: "SWARM INFANTRY",
        danger: 1,
        description: "Standard biological drone. Exhibits rudimentary intelligence. Relies on overwhelming numbers to breach defenses. Vulnerable to small arms fire."
    },
    [EnemyType.RUSHER]: {
        codeName: "RUSHER",
        classification: "RAPID ASSAULT",
        danger: 2,
        description: "Fast-moving agile variant evolved for closing distance. Notable orange carapace and scythe-like appendages. Prioritize elimination before they reach melee range."
    },
    [EnemyType.TANK]: {
        codeName: "TANK",
        classification: "HEAVY ARMOR",
        danger: 4,
        description: "Heavily plated bio-form resembling a terrestrial beetle. Extremely resilient to kinetic impacts. Slow movement speed allows for kiting tactics."
    },
    [EnemyType.KAMIKAZE]: {
        codeName: "KAMIKAZE",
        classification: "VOLATILE",
        danger: 5,
        description: "Unstable mutation carrying a payload of volatile acid. Self-destructs upon proximity. Glowing purple sac indicates critical mass. Maintain safe distance."
    },
    [EnemyType.VIPER]: {
        codeName: "VIPER",
        classification: "RANGED SUPPORT",
        danger: 3,
        description: "Aerial unit capable of launching corrosive projectiles. Maintains distance while bombarding targets. Green bio-luminescence marks attack vectors."
    },
    [BossType.RED_SUMMONER]: {
        codeName: "THE HIVE LORD",
        classification: "APEX SPAWNER",
        danger: 9,
        description: "Massive biological anchor. Possesses a gestation sac capable of rapidly birthing Grunt drones. Must be destroyed to halt the swarm expansion."
    },
    [BossType.BLUE_BURST]: {
        codeName: "COBALT REAPER",
        classification: "APEX ARTILLERY",
        danger: 9,
        description: "Highly evolved ranged specialist. Fires bursts of high-velocity plasma spines. Plated in dense blue chitin. Prioritize cover during its burst cycle."
    },
    [BossType.PURPLE_ACID]: {
        codeName: "PLAGUE BRINGER",
        classification: "APEX TOXIN",
        danger: 10,
        description: "Walking bio-hazard. Lobs organic mortars that create persistent zones of denial. The purple acid melts durasteel in seconds. Avoid area of effect."
    },
    [BossType.HIVE_MOTHER]: {
        codeName: "MATRIARCH",
        classification: "HIVE CORE",
        danger: 10,
        description: "The central nervous system of the planetary infestation. This massive, stationary bio-structure coordinates all local swarm activities. It is heavily armored and protected by a rapidly regenerating chitinous shell. Destroying it will sever the connection to the hive mind in this sector."
    }
};