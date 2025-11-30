


import { BossType, EnemyType, TurretType, WeaponStats, WeaponType } from "./types";

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;

// New World Dimensions (Long and Narrow)
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 3200; 

export const BASE_STATS = {
  maxHp: 5000,
  width: 200,
  height: 100,
};

export const INVENTORY_SIZE = 30;

export const PLAYER_STATS = {
  maxHp: 200,
  maxArmor: 100,
  speed: 4, // Slightly faster for larger map
  armorRegenDelay: 5000,
  armorRegenRate: 6 / 60, // per frame (approx 60fps)
  hpRegenDelay: 10000,
  hpRegenRate: 0.5 / 60,
  grenadeDamage: 500,
  grenadeRadius: 150,
  maxGrenades: 3,
  initialScore: 300, // Initial Scraps
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
    damage: 300, // Direct hit
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

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; damage: number; score: number; radius: number; color: string; attackRate?: number; range?: number }> = {
  [EnemyType.GRUNT]: { hp: 100, speed: 1.2, damage: 10, score: 10, radius: 15, color: '#F87171' }, // Red 400
  [EnemyType.RUSHER]: { hp: 300, speed: 2.1, damage: 15, score: 20, radius: 12, color: '#FCD34D' }, // Yellow 300
  [EnemyType.TANK]: { hp: 1500, speed: 0.6, damage: 30, score: 50, radius: 25, color: '#1F2937' }, // Gray 800
  [EnemyType.KAMIKAZE]: { hp: 50, speed: 3.0, damage: 200, score: 15, radius: 10, color: '#A855F7' }, // Purple 500
  [EnemyType.VIPER]: { hp: 150, speed: 0.9, damage: 40, score: 30, radius: 18, color: '#10B981', attackRate: 2000, range: 450 }, // Green 500
};

export const BOSS_STATS = {
    [BossType.RED_SUMMONER]: {
        hp: 10000,
        damage: 50,
        speed: 1.4,
        score: 1000,
        radius: 40,
        color: '#7f1d1d', // Dark Red
        summonRate: 2000, // 2s
    },
    [BossType.BLUE_BURST]: {
        hp: 8000,
        damage: 30,
        speed: 1.2,
        score: 1000,
        radius: 35,
        color: '#1e3a8a', // Dark Blue
        fireRate: 1200, // 1.2s
        burstDelay: 100, // 100ms between shots in burst
    },
    [BossType.PURPLE_ACID]: {
        hp: 12000,
        damage: 40,
        speed: 1.3,
        score: 1000,
        radius: 45,
        color: '#581c87', // Dark Purple
        fireRate: 4000, // 4s
        projectileDamage: 60,
    }
};

export const TOXIC_ZONE_STATS = {
    dps: 10, // 10 damage per second
    radius: 60,
    duration: 8000, // 8s
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
  [TurretType.MISSILE]:  { hp: 1000, range: 9999, damage: 160, fireRate: 840 }, // Global range, slower fire rate
};

export const ALLY_STATS = {
  hp: 200,
  speed: 1.8,
  damage: 20,
  range: 400,
  maxCount: 5,
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
