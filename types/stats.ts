
export enum ModifierType {
    FLAT = 'FLAT',
    PERCENT_ADD = 'PERCENT_ADD', // Additive percentage (e.g. +0.1 + 0.1 = +0.2)
    PERCENT_MULT = 'PERCENT_MULT' // Multiplicative percentage (e.g. *1.1 * 1.1 = *1.21)
}

export enum StatId {
    // Player
    PLAYER_DAMAGE = 'PLAYER_DAMAGE',
    PLAYER_MAX_HP = 'PLAYER_MAX_HP',
    PLAYER_MAX_ARMOR = 'PLAYER_MAX_ARMOR',
    PLAYER_ARMOR_DMG_REDUCTION = 'PLAYER_ARMOR_DMG_REDUCTION', // Infection Disposal
    PLAYER_DMG_TAKEN_MULT = 'PLAYER_DMG_TAKEN_MULT', // Impact Plate

    // Base
    BASE_MAX_HP = 'BASE_MAX_HP',
    
    // Economy
    DROP_COST_REDUCTION = 'DROP_COST_REDUCTION',
    TURRET_COST = 'TURRET_COST',

    // Turrets
    TURRET_HP = 'TURRET_HP',
    TURRET_DAMAGE_GLOBAL = 'TURRET_DAMAGE_GLOBAL',
    TURRET_RATE_GLOBAL = 'TURRET_RATE_GLOBAL',
    
    TURRET_L1_DAMAGE = 'TURRET_L1_DAMAGE',
    TURRET_L1_RATE = 'TURRET_L1_RATE',
    TURRET_L1_RANGE = 'TURRET_L1_RANGE',
    
    TURRET_GAUSS_DAMAGE = 'TURRET_GAUSS_DAMAGE',
    TURRET_GAUSS_RATE = 'TURRET_GAUSS_RATE',
    TURRET_GAUSS_RANGE = 'TURRET_GAUSS_RANGE',

    TURRET_SNIPER_DAMAGE = 'TURRET_SNIPER_DAMAGE',
    TURRET_SNIPER_RATE = 'TURRET_SNIPER_RATE',
    TURRET_SNIPER_RANGE = 'TURRET_SNIPER_RANGE',

    TURRET_MISSILE_DAMAGE = 'TURRET_MISSILE_DAMAGE',
    TURRET_MISSILE_RATE = 'TURRET_MISSILE_RATE',
    TURRET_MISSILE_RANGE = 'TURRET_MISSILE_RANGE',

    // Allies
    ALLY_MAX_HP = 'ALLY_MAX_HP',
    ALLY_DAMAGE = 'ALLY_DAMAGE',

    // Environment / Meta
    LURE_BONUS = 'LURE_BONUS',
    GENE_REDUCTION = 'GENE_REDUCTION',
    
    // Yields
    YIELD_ALPHA = 'YIELD_ALPHA',
    YIELD_BETA = 'YIELD_BETA',
    YIELD_GAMMA = 'YIELD_GAMMA',

    // Enemy Specific Damage Multipliers (Carapace)
    DMG_VS_GRUNT = 'DMG_VS_GRUNT',
    DMG_VS_RUSHER = 'DMG_VS_RUSHER',
    DMG_VS_TANK = 'DMG_VS_TANK',
    DMG_VS_KAMIKAZE = 'DMG_VS_KAMIKAZE',
    DMG_VS_VIPER = 'DMG_VS_VIPER'
}

export interface StatModifier {
    statId: string; // Can use StatId enum or dynamic string
    value: number;
    type: ModifierType;
    source: string; // To allow removing all modifiers from a specific source
}
