
import { EnemyType, Planet, GameMode, SpecialEventType } from '../types';
import { GAS_INFO } from '../data/world';

interface EnemyBaseStats {
    hp: number;
    damage: number;
    speed: number;
    scoreReward: number;
    radius: number;
    color: string;
    detectionRange: number;
}

interface CalculatedStats {
    maxHp: number;
    damage: number;
    speed?: number; // Added speed override
}

/**
 * Calculates enemy stats based on Game Mode and Planetary Environment.
 */
export const calculateEnemyStats = (
    type: EnemyType, 
    baseStats: EnemyBaseStats, 
    planet: Planet | null, 
    gameMode: GameMode,
    effectiveGeneStrength?: number // Optional override for Bio-Sequencing reduction
): CalculatedStats => {
    // Default fallback for Survival Mode (Standard Stats)
    if (gameMode === GameMode.SURVIVAL || !planet) {
        return {
            maxHp: baseStats.hp,
            damage: baseStats.damage,
            speed: baseStats.speed
        };
    }

    // Exploration Mode Logic
    // Use effective strength if provided, otherwise base planet strength
    let hpMultiplier = effectiveGeneStrength !== undefined ? effectiveGeneStrength : planet.geneStrength;
    let damageMultiplier = 1.0;
    let speedMultiplier = 1.0;

    // Extract Environmental Variables
    const oxygenGas = planet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
    const oxygenPercent = oxygenGas ? oxygenGas.percentage : 0;
    const sulfurIndex = planet.sulfurIndex;

    // Apply Specific Biological Rules
    switch (type) {
        case EnemyType.GRUNT:
            // High oxygen boosts Grunt metabolism significantly
            hpMultiplier *= (1 + 1.4 * oxygenPercent); // Updated from 1.2 to 1.4
            break;
        
        case EnemyType.RUSHER:
            // Rushers benefit moderately from oxygen
            hpMultiplier *= (1 + 0.8 * oxygenPercent);
            // New: Rusher Speed scales with Oxygen
            speedMultiplier = (1 + 0.4 * oxygenPercent);
            break;

        case EnemyType.KAMIKAZE:
            // Sulfur stabilizes/reinforces the volatile chemical sacs
            hpMultiplier *= (1 + 0.1 * sulfurIndex);
            break;

        case EnemyType.VIPER:
            // Sulfur increases the potency of the acid projectiles
            damageMultiplier *= (1 + 0.1 * sulfurIndex);
            break;
            
        case EnemyType.TUBE_WORM:
            // Tube Worm damage scales heavily with Oxygen
            damageMultiplier *= (1 + 1.5 * oxygenPercent);
            break;

        case EnemyType.TANK:
            // Tanks are purely gene-bound, no extra environmental mods defined yet
            break;
    }

    return {
        maxHp: baseStats.hp * hpMultiplier,
        damage: baseStats.damage * damageMultiplier,
        speed: baseStats.speed * speedMultiplier
    };
};

/**
 * Selects an enemy type to spawn based on Wave Number, Game Mode, and Environment.
 */
export const selectEnemyType = (
    wave: number,
    gameMode: GameMode,
    planet: Planet | null,
    specialEvent: SpecialEventType
): EnemyType => {

    // 1. FRENZY EVENT OVERRIDE (Applies to both modes)
    if (specialEvent === SpecialEventType.FRENZY) {
        // Mostly Rushers in Frenzy
        return Math.random() > 0.5 ? EnemyType.RUSHER : EnemyType.GRUNT;
    }

    // 2. SURVIVAL MODE LOGIC (Threshold based)
    if (gameMode === GameMode.SURVIVAL || !planet) {
        const typeRoll = Math.random();
        
        if (wave > 8 && typeRoll > 0.95) return EnemyType.KAMIKAZE;
        if (wave > 6 && typeRoll > 0.9) return EnemyType.TANK;
        if (wave > 4 && typeRoll > 0.85) return EnemyType.VIPER;
        if (wave > 2 && typeRoll > 0.7) return EnemyType.RUSHER;
        
        return EnemyType.GRUNT;
    }

    // 3. EXPLORATION MODE LOGIC (Weighted Probability)
    // Extract Environmental Variables
    const oxygenGas = planet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
    const oxygenPercent = oxygenGas ? oxygenGas.percentage : 0;
    const sulfurIndex = planet.sulfurIndex;

    // Calculate Weights
    // GRUNT: 10 * (1 + O2)
    const wGrunt = 10 * (1 + oxygenPercent);
    // RUSHER: 8 * (1 + 0.5 * O2)
    const wRusher = 8 * (1 + 0.5 * oxygenPercent);
    // VIPER: 4 * (1 + 0.1 * Sulfur)
    const wViper = 4 * (1 + 0.1 * sulfurIndex);
    // TANK: 3
    const wTank = 3;
    // KAMIKAZE: 2 * (1 + 0.05 * Sulfur)
    const wKamikaze = 2 * (1 + 0.05 * sulfurIndex);
    
    // TUBE WORM: 5 (Only if O2 > 18%)
    const wTubeWorm = oxygenPercent > 0.18 ? 5 : 0;

    const totalWeight = wGrunt + wRusher + wViper + wTank + wKamikaze + wTubeWorm;
    let randomWeight = Math.random() * totalWeight;

    if (randomWeight < wGrunt) return EnemyType.GRUNT;
    randomWeight -= wGrunt;

    if (randomWeight < wRusher) return EnemyType.RUSHER;
    randomWeight -= wRusher;

    if (randomWeight < wViper) return EnemyType.VIPER;
    randomWeight -= wViper;

    if (randomWeight < wTank) return EnemyType.TANK;
    randomWeight -= wTank;

    if (randomWeight < wKamikaze) return EnemyType.KAMIKAZE;
    randomWeight -= wKamikaze;

    return EnemyType.TUBE_WORM;
};
