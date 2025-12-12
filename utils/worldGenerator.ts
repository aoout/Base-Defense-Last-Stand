
import { Planet, PlanetVisualType, BiomeType, AtmosphereGas, TerrainFeature, TerrainType, MissionType, GalaxyConfig, SectorPreset } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { BIOME_STYLES, GAS_INFO, GEN_RULES } from '../data/world';
import { FAMOUS_SECTORS } from '../data/sectors';
import { generatePlanetName } from './nameGenerator';
import { RNG } from './rng';

// --- TERRAIN GENERATION ---

export const generateTerrain = (visualType: PlanetVisualType, biome: BiomeType, width: number = WORLD_WIDTH, height: number = WORLD_HEIGHT): TerrainFeature[] => {
    const terrain: TerrainFeature[] = [];
    const rng = RNG.global; // Terrain is usually transient, static seed not strictly required for background
    
    const count = rng.int(20, 40);

    for (let i = 0; i < count; i++) {
        const x = rng.float(0, width);
        const y = rng.float(0, height);
        const radius = rng.float(10, 40);
        
        let type = TerrainType.ROCK;
        
        // Biome-Specific Features logic
        const roll = rng.next();
        
        if (biome === BiomeType.VOLCANIC && roll > 0.7) type = TerrainType.MAGMA_POOL;
        else if (biome === BiomeType.ICE && roll > 0.7) type = TerrainType.ICE_SPIKE;
        else if (biome === BiomeType.TOXIC && roll > 0.7) type = TerrainType.ALIEN_TREE;
        else if (biome === BiomeType.DESERT && roll > 0.8) type = TerrainType.CRYSTAL;
        else {
            // Standard Features
            if (roll > 0.7) type = TerrainType.CRATER;
            else if (roll > 0.8) type = TerrainType.DUST;
        }

        terrain.push({
            id: `terrain-${Date.now()}-${i}`,
            type,
            x,
            y,
            radius,
            rotation: rng.float(0, Math.PI * 2),
            opacity: rng.float(0.1, 0.5),
            variant: rng.int(0, 3)
        });
    }
    return terrain;
};

// --- PLANET GENERATION PIPELINE ---

/**
 * Generates the atmosphere composition based on biome rules.
 */
const generateAtmosphere = (rng: RNG, biome: BiomeType, maxOxygen: number = 1.0): AtmosphereGas[] => {
    const rules = GEN_RULES.ATMOSPHERE[biome];
    
    // 1. Oxygen (Clamped by Sector Config)
    let oxygenPct = rng.float(rules.oxygen, rules.oxygen + 0.2);
    oxygenPct = Math.min(oxygenPct, maxOxygen);

    const gases: AtmosphereGas[] = [
        { ...GAS_INFO.NITROGEN, percentage: rng.float(0.4, 0.7) },
        { ...GAS_INFO.OXYGEN, percentage: oxygenPct },
    ];

    // 2. Biome Specific Additions
    if (biome === BiomeType.TOXIC) {
        gases.push({ ...GAS_INFO.METHANE, percentage: rng.float(0.1, 0.2) });
    }
    if (biome === BiomeType.VOLCANIC) {
        gases.push({ ...GAS_INFO.SULFUR, percentage: rng.float(0.1, 0.25) });
    }
    if (biome === BiomeType.ICE) {
        gases.push({ ...GAS_INFO.HELIUM, percentage: 0.05 });
    }

    // 3. Normalize to 100%
    let total = gases.reduce((acc, g) => acc + g.percentage, 0);
    
    if (total < 1.0) {
        // Fill remaining with CO2
        gases.push({ ...GAS_INFO.CO2, percentage: 1.0 - total });
    } else {
        // Normalize if over
        gases.forEach(g => g.percentage /= total);
    }

    return gases.sort((a,b) => b.percentage - a.percentage);
};

/**
 * Determines Visual Type based on weighted probabilities defined in GEN_RULES.
 */
const determineVisualType = (rng: RNG, biome: BiomeType): PlanetVisualType => {
    const weights = GEN_RULES.VISUAL_WEIGHTS[biome];
    return rng.weightedPick(weights);
};

/**
 * Calculates difficulty/cost based on visual type and RNG variance.
 */
const calculateDifficulty = (rng: RNG, visualType: PlanetVisualType): number => {
    const baseMod = GEN_RULES.DIFFICULTY.VISUAL_MODIFIER[visualType] || 0;
    const baseDiff = rng.chance(0.6) 
        ? GEN_RULES.DIFFICULTY.BASE_LOW 
        : GEN_RULES.DIFFICULTY.BASE_HIGH;
    
    return Math.max(1, Math.min(30, baseDiff + baseMod + rng.int(-5, 5)));
};

/**
 * Generates a valid x,y position within safe map bounds.
 */
const generatePosition = (rng: RNG, width: number, height: number): {x: number, y: number} => {
    const marginX = 100;
    const marginY = 160; // Avoid UI bars
    return {
        x: rng.float(marginX, width - marginX),
        y: rng.float(marginY, height - marginY)
    };
};

// --- SUB-GENERATORS ---

const createPlanetFromPreset = (def: Partial<Planet>, index: number, rng: RNG, mapW: number, mapH: number): Planet => {
    const { x, y } = generatePosition(rng, mapW, mapH);
    const biome = def.biome || BiomeType.BARREN;
    const visualType = def.visualType || PlanetVisualType.TERRAN;
    const style = BIOME_STYLES[biome];

    // Basic atmosphere for preset
    const atmosphere = generateAtmosphere(rng, biome, 1.0); 

    return {
        id: `planet-preset-${index}`,
        name: def.name || generatePlanetName(),
        x, y,
        radius: visualType === PlanetVisualType.GAS_GIANT ? 70 : 40,
        color: style.planetColor,
        missionType: def.missionType || MissionType.DEFENSE,
        totalWaves: def.totalWaves || 10,
        geneStrength: def.geneStrength || 1.0,
        sulfurIndex: def.sulfurIndex || 0,
        landingDifficulty: def.landingDifficulty || 10,
        completed: false,
        biome,
        visualType,
        atmosphere,
        buildings: []
    };
};

const createRandomPlanet = (config: GalaxyConfig, index: number, rng: RNG, mapW: number, mapH: number): Planet => {
    const { x, y } = generatePosition(rng, mapW, mapH);
    
    const biome = rng.pick(Object.values(BiomeType));
    const style = BIOME_STYLES[biome];
    
    const visualType = determineVisualType(rng, biome);
    const atmosphere = generateAtmosphere(rng, biome, config.maxOxygen);
    const landingDifficulty = calculateDifficulty(rng, visualType);

    // Mission Type
    let missionType = MissionType.DEFENSE;
    if (config.enableOffense && rng.chance(0.3)) {
        missionType = MissionType.OFFENSE;
    }

    // Stats
    const geneStrength = parseFloat(rng.float(config.minGeneStrength, config.maxGeneStrength).toFixed(2));
    const sulfurIndex = rng.int(0, config.maxSulfur || 10);
    
    // Wave Calc (Non-linear scaling)
    const minW = config.minWaves || 8;
    const maxW = config.maxWaves || 40;
    // Skew towards lower end
    const waveSkew = rng.next() * rng.next(); 
    const waves = Math.floor(minW + waveSkew * (maxW - minW));

    return {
        id: `planet-rnd-${index}`,
        name: generatePlanetName(),
        x, y,
        radius: visualType === PlanetVisualType.GAS_GIANT ? rng.float(50, 80) : rng.float(30, 60),
        color: style.planetColor,
        missionType,
        totalWaves: missionType === MissionType.OFFENSE ? 0 : waves,
        geneStrength,
        sulfurIndex,
        landingDifficulty,
        completed: false,
        biome,
        visualType,
        atmosphere,
        buildings: []
    };
};

// --- MAIN GENERATOR ENTRY POINT ---

export const generatePlanets = (config?: GalaxyConfig, width?: number, height?: number): Planet[] => {
    const mapW = width || CANVAS_WIDTH;
    const mapH = height || CANVAS_HEIGHT;
    const planets: Planet[] = [];

    // 1. Handle Presets (Famous Sectors)
    if (config && config.presetId) {
        const preset = FAMOUS_SECTORS.find(s => s.id === config.presetId);
        if (preset) {
            // Deterministic RNG based on Sector ID
            const seedRng = new RNG(config.presetId);
            preset.planets.forEach((def, i) => {
                planets.push(createPlanetFromPreset(def, i, seedRng, mapW, mapH));
            });
            return planets;
        }
    }

    // 2. Handle Random Generation
    // Uses global non-deterministic RNG for unique runs every scan
    const rng = RNG.global;
    
    // Default Config Fallback
    const safeConfig: GalaxyConfig = {
        minGeneStrength: 1.0,
        maxGeneStrength: 3.0,
        maxSulfur: 10,
        maxOxygen: 1.0,
        planetCount: 12,
        minWaves: 8,
        maxWaves: 40,
        enableOffense: true,
        ...config // Override with provided values
    };

    for(let i = 0; i < (safeConfig.planetCount || 12); i++) {
        planets.push(createRandomPlanet(safeConfig, i, rng, mapW, mapH));
    }

    return planets;
};
