
import { DamageSource, FloatingTextType, WeaponType, AllyOrder, TurretType, EnemyType, ProjectileID } from './enums';
import { WeaponModule } from './items';
import { GalaxyConfig } from './world';
import { Projectile, Enemy, Entity } from './entities';

export enum GameEventType {
    // Spawning
    SPAWN_PROJECTILE = 'SPAWN_PROJECTILE',
    SPAWN_PARTICLE = 'SPAWN_PARTICLE',
    SPAWN_TOXIC_ZONE = 'SPAWN_TOXIC_ZONE',
    SPAWN_BLOOD_STAIN = 'SPAWN_BLOOD_STAIN',
    ENEMY_SUMMON = 'ENEMY_SUMMON',
    
    // Lifecycle
    ENEMY_KILLED = 'ENEMY_KILLED', // New decoupled event

    // Physics & Collisions (NEW)
    COLLISION_PROJECTILE_ENEMY = 'COLLISION_PROJECTILE_ENEMY',
    COLLISION_PROJECTILE_PLAYER = 'COLLISION_PROJECTILE_PLAYER',
    COLLISION_PROJECTILE_BASE = 'COLLISION_PROJECTILE_BASE',
    COLLISION_PROJECTILE_ALLY = 'COLLISION_PROJECTILE_ALLY',
    COLLISION_KAMIKAZE_IMPACT = 'COLLISION_KAMIKAZE_IMPACT',
    
    // Combat
    DAMAGE_PLAYER = 'DAMAGE_PLAYER',
    DAMAGE_BASE = 'DAMAGE_BASE',
    DAMAGE_ENEMY = 'DAMAGE_ENEMY',
    DAMAGE_AREA = 'DAMAGE_AREA',
    
    // Audio & UI
    PLAY_SOUND = 'PLAY_SOUND',
    SHOW_FLOATING_TEXT = 'SHOW_FLOATING_TEXT',
    UI_UPDATE = 'UI_UPDATE',
    
    // Game State
    MISSION_COMPLETE = 'MISSION_COMPLETE',
    GAME_OVER = 'GAME_OVER',

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

export interface EnemyKilledEvent {
    enemy: Enemy;
    x: number;
    y: number;
    scoreReward: number;
    type: EnemyType;
    isBoss: boolean;
    color: string;
    maxHp: number;
    storedScore?: number;
}

export interface SpawnProjectileEvent {
    // Spatial properties are always required
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    damage: number;

    // Optional ID for preset lookup (Recommended)
    presetId?: ProjectileID;

    // Overrides (Can be inferred from presetId)
    speed?: number;
    fromPlayer?: boolean;
    color?: string;
    source?: DamageSource;
    maxRange?: number;
    
    // Specific Logic Flags
    homingTargetId?: string;
    isHoming?: boolean;
    createsToxicZone?: boolean;
    isExplosive?: boolean;
    isPiercing?: boolean;
    activeModules?: WeaponModule[];
    // @ts-ignore
    explosionRadius?: number;
    weaponType?: WeaponType; 
}

// --- NEW COLLISION PAYLOADS ---
export interface CollisionProjectileEnemyEvent {
    projectile: Projectile;
    enemy: Enemy;
}

export interface CollisionProjectilePlayerEvent {
    projectile: Projectile;
}

export interface CollisionProjectileBaseEvent {
    projectile: Projectile;
    // We don't pass the base object because it's a singleton in state, logic can access it
}

export interface CollisionProjectileAllyEvent {
    projectile: Projectile;
    allyId: string;
}

export interface CollisionKamikazeEvent {
    enemy: Enemy;
    targetType: 'PLAYER' | 'BASE' | 'ALLY';
}

// --- EXISTING PAYLOADS ---

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
    weaponType?: WeaponType; 
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
    variant?: WeaponType | number | boolean | string; 
    x?: number; 
    y?: number; 
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
