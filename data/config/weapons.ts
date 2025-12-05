
import { WeaponType, WeaponStats, ModuleType } from "../../types";

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
    damage: 480, 
    fireRate: 1100, // BUFF: 1500 -> 1100
    spread: 0.01,
    magSize: 5,
    reloadTime: 2500,
    range: 1200,
    projectileSpeed: 40,
  },
  [WeaponType.PISTOL]: {
    name: 'Pistol',
    damage: 70, // BUFF: 60 -> 70
    fireRate: 300,
    spread: 0.05,
    magSize: 12,
    reloadTime: 1000,
    range: 500,
    projectileSpeed: 18,
  },
  [WeaponType.FLAMETHROWER]: {
    name: 'Flamethrower',
    damage: 18, // BUFF: 15 -> 18
    fireRate: 40,
    spread: 0.15,
    magSize: 100,
    reloadTime: 2200, // BUFF: 3000 -> 2200
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
    reloadTime: 1300, // NERF: 1200 -> 1300
    range: 700,
    projectileSpeed: 30,
    isPiercing: true
  },
  [WeaponType.GRENADE_LAUNCHER]: {
    name: 'Grenade Launcher',
    damage: 360, // BUFF: 300 -> 360
    fireRate: 1200,
    spread: 0.1,
    magSize: 6,
    reloadTime: 3200, // BUFF: 3500 -> 3200
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

export const MODULE_STATS = {
    [ModuleType.GEL_BARREL]: {
        name: "Gel Penetration Diffuser",
        cost: 1900,
        desc: "Damage +40%",
        only: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL]
    },
    [ModuleType.MAG_FEED]: {
        name: "Efficient Stack Feed",
        cost: 1700,
        desc: "Mag Capacity +100%",
        only: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL]
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
    },
    [ModuleType.KINETIC_STABILIZER]: {
        name: "Kinetic Stabilizer Core",
        cost: 2500,
        desc: "Pierces 1 target. 2nd hit deals 80% dmg.",
        only: [WeaponType.SR, WeaponType.AR, WeaponType.SG, WeaponType.PISTOL]
    },
    [ModuleType.TENSION_SPRING]: {
        name: "High Tension Spring",
        cost: 1800,
        desc: "Reload Time -20%, Damage +20%",
        only: [WeaponType.SR, WeaponType.AR, WeaponType.SG, WeaponType.PISTOL]
    }
};
