
import { TurretType, DefenseUpgradeType, SpaceshipModuleType } from "../../types";

export const TURRET_COSTS = {
  baseCost: 1200,
  costIncrement: 100,
  upgrade_gauss: 3500,
  upgrade_sniper: 3700,
  upgrade_missile: 4100,
};

export const TURRET_STATS = {
  [TurretType.STANDARD]: { hp: 1200, range: 400, damage: 60, fireRate: 120 },
  [TurretType.GAUSS]:    { hp: 3600, range: 650, damage: 90, fireRate: 100 },
  [TurretType.SNIPER]:   { hp: 3000, range: 1300, damage: 140, fireRate: 250 },
  [TurretType.MISSILE]:  { hp: 2400, range: 9999, damage: 160, fireRate: 840 }, 
};

export const DEFENSE_UPGRADE_INFO = {
    [DefenseUpgradeType.INFECTION_DISPOSAL]: {
        cost: 3500,
        armorMitigation: 0.9,
        regenRate: 0.01
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
    },
    [SpaceshipModuleType.BIO_SEQUENCING]: {
        name: "Bio-Sequencing Laboratory",
        cost: 5100,
        desc: "Unlock advanced biological augmentations via research and field data."
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
