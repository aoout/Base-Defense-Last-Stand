
import { EnemyType, BossType, WeaponType, DefenseUpgradeType, ModuleType, SpaceshipModuleType } from './enums';

export interface UnitStatsDef {
    hp: number;
    speed: number;
    damage: number;
    scoreReward: number;
    radius: number;
    color: string;
    detectionRange: number;
    // Optional / Specifics
    attackRate?: number;
    range?: number;
    fireRate?: number;
    burstDelay?: number;
    summonRate?: number;
    projectileDamage?: number;
}

export interface BestiaryEntry {
    codeName: string;
    classification: string;
    danger: number;
    description: string;
}

export interface WeaponDef {
    name: string;
    damage: number;
    fireRate: number; // ms
    spread: number;
    magSize: number;
    reloadTime: number; // ms
    range: number;
    projectileSpeed: number;
    pellets?: number;
    isExplosive?: boolean;
    isPiercing?: boolean;
}

export interface GameManifest {
    enemies: Record<EnemyType, UnitStatsDef>;
    bosses: Record<BossType, UnitStatsDef>;
    weapons: Record<WeaponType, WeaponDef>;
    // Can be extended for upgrades, levels, etc.
}
