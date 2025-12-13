
import { ProjectileID, DamageSource, WeaponType } from "../../types/enums";

export interface ProjectileConfigDef {
    speed: number;
    color: string;
    radius?: number;
    maxRange: number;
    fromPlayer: boolean;
    source: DamageSource;
    // Flags
    isHoming?: boolean;
    createsToxicZone?: boolean;
    isExplosive?: boolean;
    explosionRadius?: number;
    isPiercing?: boolean;
    weaponType?: WeaponType; 
}

export const PROJECTILE_PRESETS: Record<ProjectileID, ProjectileConfigDef> = {
    // --- PLAYER WEAPONS ---
    [ProjectileID.P_PISTOL]: {
        speed: 18, color: '#fbbf24', maxRange: 500, fromPlayer: true, source: DamageSource.PLAYER
    },
    [ProjectileID.P_AR]: {
        speed: 20, color: '#fbbf24', maxRange: 600, fromPlayer: true, source: DamageSource.PLAYER
    },
    [ProjectileID.P_SG]: {
        speed: 18, color: '#fbbf24', maxRange: 300, fromPlayer: true, source: DamageSource.PLAYER
    },
    [ProjectileID.P_SR]: {
        speed: 40, color: '#fbbf24', maxRange: 1200, fromPlayer: true, source: DamageSource.PLAYER
    },
    [ProjectileID.P_FLAME]: {
        speed: 12, color: '#f97316', maxRange: 350, fromPlayer: true, source: DamageSource.PLAYER, 
        isPiercing: true, weaponType: WeaponType.FLAMETHROWER
    },
    [ProjectileID.P_PULSE]: {
        speed: 30, color: '#22d3ee', maxRange: 700, fromPlayer: true, source: DamageSource.PLAYER, 
        isPiercing: true, weaponType: WeaponType.PULSE_RIFLE
    },
    [ProjectileID.P_GRENADE]: {
        speed: 15, color: '#fff', maxRange: 600, fromPlayer: true, source: DamageSource.PLAYER, 
        isExplosive: true, explosionRadius: 150, weaponType: WeaponType.GRENADE_LAUNCHER
    },
    // Used for Throwing Grenades via Key G
    [ProjectileID.P_GRENADE_FRAG]: {
        speed: 12, color: '#fff', maxRange: 400, fromPlayer: true, source: DamageSource.PLAYER, 
        isExplosive: true, explosionRadius: 150, weaponType: WeaponType.GRENADE_LAUNCHER
    },

    // --- TURRETS ---
    [ProjectileID.T_STANDARD]: {
        speed: 20, color: '#10b981', maxRange: 400, fromPlayer: true, source: DamageSource.TURRET
    },
    [ProjectileID.T_GAUSS]: {
        speed: 24, color: '#10b981', maxRange: 650, fromPlayer: true, source: DamageSource.TURRET
    },
    [ProjectileID.T_SNIPER]: {
        speed: 60, color: '#FAFAFA', maxRange: 1300, fromPlayer: true, source: DamageSource.TURRET,
        isPiercing: true
    },
    [ProjectileID.T_MISSILE]: {
        speed: 18, color: '#ef4444', maxRange: 9999, fromPlayer: true, source: DamageSource.TURRET,
        isHoming: true, isExplosive: true, explosionRadius: 100
    },

    // --- ALLIES ---
    [ProjectileID.ALLY_STD]: {
        speed: 15, color: '#60a5fa', maxRange: 450, fromPlayer: true, source: DamageSource.ALLY
    },

    // --- ENEMIES ---
    [ProjectileID.E_VIPER]: {
        speed: 8, color: '#10B981', maxRange: 1000, fromPlayer: false, source: DamageSource.ENEMY
    },
    [ProjectileID.E_BOSS_BLUE]: {
        speed: 10, color: '#60a5fa', maxRange: 1000, fromPlayer: false, source: DamageSource.ENEMY
    },
    [ProjectileID.E_BOSS_PURPLE]: {
        speed: 8, color: '#a855f7', maxRange: 1000, fromPlayer: false, source: DamageSource.ENEMY,
        createsToxicZone: true
    },
    [ProjectileID.E_DEVOURER]: {
        speed: 12, color: '#FACC15', maxRange: 550, fromPlayer: false, source: DamageSource.ENEMY,
        createsToxicZone: true
    }
};
