
import { EnemyType, BossType, WeaponType, DefenseUpgradeType, ModuleType, SpaceshipModuleType, ProjectileID } from './enums';

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
    
    // Logic Configuration
    projectilePresetId: ProjectileID; // The ID of the projectile entity to spawn
    pellets?: number;
    isExplosive?: boolean;
    isPiercing?: boolean;

    // Visual Configuration
    visuals: {
        muzzleOffset: number; // Distance from player center to barrel tip
        barrelHeight?: number; // Y offset (optional, default 0)
        flashColor?: string; // Hex or rgba
        flashSize?: number; 
    }
}

export interface GameManifest {
    enemies: Record<EnemyType, UnitStatsDef>;
    bosses: Record<BossType, UnitStatsDef>;
    weapons: Record<WeaponType, WeaponDef>;
    // Can be extended for upgrades, levels, etc.
}
