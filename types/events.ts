
import { DamageSource, FloatingTextType, WeaponType, AllyOrder, TurretType, EnemyType } from './enums';
import { WeaponModule } from './items';
import { GalaxyConfig } from './world';

export enum GameEventType {
    // Spawning
    SPAWN_PROJECTILE = 'SPAWN_PROJECTILE',
    SPAWN_PARTICLE = 'SPAWN_PARTICLE',
    SPAWN_TOXIC_ZONE = 'SPAWN_TOXIC_ZONE',
    SPAWN_BLOOD_STAIN = 'SPAWN_BLOOD_STAIN',
    ENEMY_SUMMON = 'ENEMY_SUMMON',
    
    // Combat
    DAMAGE_PLAYER = 'DAMAGE_PLAYER',
    DAMAGE_BASE = 'DAMAGE_BASE',
    DAMAGE_ENEMY = 'DAMAGE_ENEMY',
    DAMAGE_AREA = 'DAMAGE_AREA',
    
    // Audio & UI
    PLAY_SOUND = 'PLAY_SOUND',
    SHOW_FLOATING_TEXT = 'SHOW_FLOATING_TEXT',
    UI_UPDATE = 'UI_UPDATE', // New Event for Structural UI Changes
    
    // Game State
    MISSION_COMPLETE = 'MISSION_COMPLETE',

    // Player Actions (Input)
    PLAYER_SWITCH_WEAPON = 'PLAYER_SWITCH_WEAPON',
    PLAYER_RELOAD = 'PLAYER_RELOAD',
    PLAYER_THROW_GRENADE = 'PLAYER_THROW_GRENADE',

    // Shop & Inventory Actions
    SHOP_PURCHASE = 'SHOP_PURCHASE',
    SHOP_EQUIP_MODULE = 'SHOP_EQUIP_MODULE',
    SHOP_UNEQUIP_MODULE = 'SHOP_UNEQUIP_MODULE',
    SHOP_SWAP_LOADOUT = 'SHOP_SWAP_LOADOUT',

    // Defense & Tactical Actions
    DEFENSE_ISSUE_ORDER = 'DEFENSE_ISSUE_ORDER',
    DEFENSE_INTERACT = 'DEFENSE_INTERACT',
    DEFENSE_UPGRADE_TURRET = 'DEFENSE_UPGRADE_TURRET',
    DEFENSE_CLOSE_MENU = 'DEFENSE_CLOSE_MENU'
}

export interface SpawnProjectileEvent {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number;
    damage: number;
    fromPlayer: boolean;
    color: string;
    homingTargetId?: string;
    isHoming?: boolean;
    createsToxicZone?: boolean;
    isExplosive?: boolean;
    isPiercing?: boolean;
    maxRange?: number;
    source: DamageSource;
    activeModules?: WeaponModule[];
    // @ts-ignore
    explosionRadius?: number;
    weaponType?: WeaponType; // Added for precise identification
}

export interface SpawnParticleEvent {
    x: number;
    y: number;
    color: string;
    count: number;
    speed: number;
}

export interface SpawnToxicZoneEvent {
    x: number;
    y: number;
    radius?: number;
}

export interface SpawnBloodStainEvent {
    x: number;
    y: number;
    color: string;
    maxHp: number;
}

export interface EnemySummonEvent {
    type: EnemyType;
    x: number;
    y: number;
    count?: number;
}

export interface DamagePlayerEvent {
    amount: number;
}

export interface DamageBaseEvent {
    amount: number;
}

export interface DamageEnemyEvent {
    targetId: string;
    amount: number;
    source: DamageSource;
    weaponType?: WeaponType; // For type-specific damage logic (e.g. Flamethrower vs Shell)
}

export interface DamageAreaEvent {
    x: number;
    y: number;
    radius: number;
    damage: number;
    source: DamageSource;
}

export interface PlaySoundEvent {
    type: 'WEAPON' | 'TURRET' | 'ALLY' | 'EXPLOSION' | 'GRENADE' | 'GRENADE_THROW' | 'ENEMY_DEATH' | 'VIPER_SHOOT' | 'MELEE_HIT' | 'BASE_DAMAGE' | 'RELOAD' | 'BULLET_HIT' | 'ORBITAL_STRIKE' | 'BOSS_DEATH';
    variant?: WeaponType | number | boolean | string; // WeaponType, TurretLevel, isBoss
    x?: number; // Spatial Audio X
    y?: number; // Spatial Audio Y
}

export interface ShowFloatingTextEvent {
    text: string;
    x: number;
    y: number;
    color: string;
    type: FloatingTextType;
    time?: number;
}

// Action Payloads
export interface PlayerSwitchWeaponEvent {
    index: number;
}

export interface PlayerReloadEvent {
    time: number;
}

export interface ShopPurchaseEvent {
    itemId: string;
}

export interface ShopEquipModuleEvent {
    target: WeaponType | 'GRENADE';
    moduleId: string;
}

export interface ShopUnequipModuleEvent {
    target: WeaponType | 'GRENADE';
    moduleId: string;
}

export interface ShopSwapLoadoutEvent {
    loadoutIndex: number;
    inventoryIndex: number;
}

export interface DefenseIssueOrderEvent {
    order: AllyOrder;
}

export interface DefenseUpgradeTurretEvent {
    type: TurretType;
}