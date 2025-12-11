
import { Planet, PlanetVisualType, BiomeType, AtmosphereGas, TerrainFeature, TerrainType, MissionType, GalaxyConfig } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { BIOME_STYLES, GAS_INFO } from '../data/world';
import { FAMOUS_SECTORS } from '../data/sectors';
import { generatePlanetName } from './nameGenerator';

// Simple Linear Congruential Generator for deterministic results based on a string seed
class SeededRNG {
    private seed: number;

    constructor(seedStr: string) {
        // FNV-1a Hash to turn string into initial integer seed
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    // Returns a float between 0 and 1
    public next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        return this.seed / 4294967296;
    }
}

export const generateTerrain = (visualType: PlanetVisualType, biome: BiomeType, width: number = WORLD_WIDTH, height: number = WORLD_HEIGHT): TerrainFeature[] => {
    const terrain: TerrainFeature[] = [];
    const count = 20 + Math.random() * 20;

    for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 10 + Math.random() * 30;
        
        let type = TerrainType.ROCK;
        if (Math.random() > 0.7) type = TerrainType.CRATER;
        else if (Math.random() > 0.8) type = TerrainType.DUST;

        // Biome specific overrides
        if (biome === BiomeType.VOLCANIC && Math.random() > 0.7) type = TerrainType.MAGMA_POOL;
        if (biome === BiomeType.ICE && Math.random() > 0.7) type = TerrainType.ICE_SPIKE;
        if (biome === BiomeType.TOXIC && Math.random() > 0.7) type = TerrainType.ALIEN_TREE;
        if (biome === BiomeType.DESERT && Math.random() > 0.8) type = TerrainType.CRYSTAL;

        terrain.push({
            id: `terrain-${Date.now()}-${i}`,
            type,
            x,
            y,
            radius,
            rotation: Math.random() * Math.PI * 2,
            opacity: 0.1 + Math.random() * 0.4
        });
    }
    return terrain;
};

export const generatePlanets = (config?: GalaxyConfig, width?: number, height?: number): Planet[] => {
    const planets: Planet[] = [];
    const mapW = width || CANVAS_WIDTH;
    const mapH = height || CANVAS_HEIGHT;

    // --- PRESET LOGIC ---
    if (config && config.presetId) {
        const preset = FAMOUS_SECTORS.find(s => s.id === config.presetId);
        if (preset) {
            // Initialize Deterministic RNG with the Sector ID
            // This ensures layout is identical every time we visit this sector
            const rng = new SeededRNG(config.presetId);

            preset.planets.forEach((def, i) => {
                // Use RNG for position instead of Math.random()
                const x = (rng.next() * (mapW - 200)) + 100;
                const y = (rng.next() * (mapH - 200)) + 100;
                
                // Defaults
                const biome = def.biome || BiomeType.BARREN;
                const style = BIOME_STYLES[biome];
                const visualType = def.visualType || PlanetVisualType.TERRAN;
                const geneStrength = def.geneStrength || 1.0;
                const sulfurIndex = def.sulfurIndex !== undefined ? def.sulfurIndex : 0;
                const missionType = def.missionType || MissionType.DEFENSE;
                
                // Basic Atmosphere Calc based on biome/sulfur
                let oxygenPct = 0.2;
                if (biome === BiomeType.TOXIC) oxygenPct = 0.1;
                if (biome === BiomeType.ICE) oxygenPct = 0.15;
                if (biome === BiomeType.BARREN) oxygenPct = 0.05;
                
                const atmosphere: AtmosphereGas[] = [
                    { ...GAS_INFO.NITROGEN, percentage: 0.6 },
                    { ...GAS_INFO.OXYGEN, percentage: oxygenPct },
                ];
                let total = atmosphere.reduce((acc, g) => acc + g.percentage, 0);
                if (total < 1) atmosphere.push({ ...GAS_INFO.CO2, percentage: 1 - total });

                planets.push({
                    id: `planet-${i}`,
                    name: def.name || generatePlanetName(),
                    x, y,
                    radius: visualType === PlanetVisualType.GAS_GIANT ? 70 : 40,
                    color: style.planetColor,
                    missionType,
                    totalWaves: def.totalWaves || 0,
                    geneStrength,
                    sulfurIndex,
                    landingDifficulty: def.landingDifficulty || 10,
                    completed: false,
                    biome,
                    visualType,
                    atmosphere,
                    buildings: []
                });
            });
            return planets;
        }
    }

    // --- RANDOM LOGIC ---
    const biomes = Object.values(BiomeType);
    
    const minGene = config ? config.minGeneStrength : 1.0;
    const maxGene = config ? config.maxGeneStrength : 3.0;
    const maxSulfur = config && config.maxSulfur !== undefined ? config.maxSulfur : 10;
    const maxOxygen = config && config.maxOxygen !== undefined ? config.maxOxygen : 1.0;
    const count = config && config.planetCount ? config.planetCount : 12;
    
    const minWaves = config && config.minWaves !== undefined ? config.minWaves : 8;
    const maxWaves = config && config.maxWaves !== undefined ? config.maxWaves : 40;
    const enableOffense = config && config.enableOffense !== undefined ? config.enableOffense : true;

    for(let i=0; i<count; i++) {
        const x = (Math.random() * (mapW - 200)) + 100;
        const y = (Math.random() * (mapH - 200)) + 100;
        const biome = biomes[Math.floor(Math.random() * biomes.length)];
        const style = BIOME_STYLES[biome];
        
        let visualType = PlanetVisualType.BARREN;
        if (biome === BiomeType.TOXIC) {
            visualType = Math.random() > 0.6 ? PlanetVisualType.GAS_GIANT : PlanetVisualType.TERRAN;
        } else if (biome === BiomeType.ICE) {
            visualType = Math.random() > 0.8 ? PlanetVisualType.RINGED : PlanetVisualType.ICE;
        } else if (biome === BiomeType.VOLCANIC) {
            visualType = PlanetVisualType.LAVA;
        } else if (biome === BiomeType.DESERT) {
            visualType = Math.random() > 0.7 ? PlanetVisualType.RINGED : PlanetVisualType.BARREN;
        } else {
            visualType = Math.random() > 0.5 ? PlanetVisualType.BARREN : PlanetVisualType.TERRAN;
        }

        // Atmosphere Generation with Constraint
        let oxygenPct = 0.1 + Math.random() * 0.2;
        // Cap oxygen if config exists
        oxygenPct = Math.min(oxygenPct, maxOxygen);

        const atmosphere: AtmosphereGas[] = [
            { ...GAS_INFO.NITROGEN, percentage: 0.4 + Math.random() * 0.3 },
            { ...GAS_INFO.OXYGEN, percentage: oxygenPct },
        ];
        if (biome === BiomeType.TOXIC) atmosphere.push({ ...GAS_INFO.METHANE, percentage: 0.1 + Math.random() * 0.1 });
        if (biome === BiomeType.VOLCANIC) atmosphere.push({ ...GAS_INFO.SULFUR, percentage: 0.1 + Math.random() * 0.15 });
        if (biome === BiomeType.ICE) atmosphere.push({ ...GAS_INFO.HELIUM, percentage: 0.05 });
        
        let total = atmosphere.reduce((acc, g) => acc + g.percentage, 0);
        if (total < 1) {
            atmosphere.push({ ...GAS_INFO.CO2, percentage: 1 - total });
        } else {
            atmosphere.forEach(g => g.percentage /= total);
        }

        // Landing Difficulty Logic (Weighted)
        const diffRoll = Math.random();
        let landingDifficulty = 1;
        if (diffRoll < 0.6) {
            landingDifficulty = Math.floor(Math.random() * 10) + 1;
        } else if (diffRoll < 0.9) {
            landingDifficulty = Math.floor(Math.random() * 10) + 11;
        } else {
            landingDifficulty = Math.floor(Math.random() * 10) + 21;
        }

        // Mission Type Selection
        let missionType = MissionType.DEFENSE;
        // Only allow offense if enabled in config
        if (enableOffense && Math.random() > 0.7) {
            missionType = MissionType.OFFENSE;
        }
        
        // Configurable Gene Strength
        const rawGeneStrength = minGene + Math.random() * (maxGene - minGene);
        const geneStrength = Math.round(rawGeneStrength * 100) / 100;

        // Configurable Sulfur Index
        const sulfurIndex = Math.floor(Math.random() * (maxSulfur + 1));

        // Wave Calculation: 
        const waveRandom = Math.random();
        const skewedRandom = waveRandom * waveRandom; 
        
        // Ensure range is valid
        const safeMin = Math.min(minWaves, maxWaves);
        const safeMax = Math.max(minWaves, maxWaves);
        const range = safeMax - safeMin;
        
        const waves = safeMin + Math.floor(skewedRandom * (range + 1));

        planets.push({
            id: `planet-${i}`,
            name: generatePlanetName(), 
            x,
            y,
            radius: visualType === PlanetVisualType.GAS_GIANT ? 50 + Math.random() * 30 : 30 + Math.random() * 30,
            color: style.planetColor,
            missionType,
            totalWaves: missionType === MissionType.OFFENSE ? 0 : waves,
            geneStrength: geneStrength,
            sulfurIndex: sulfurIndex,
            landingDifficulty: landingDifficulty,
            completed: false,
            biome: biome,
            visualType: visualType,
            atmosphere: atmosphere.sort((a,b) => b.percentage - a.percentage),
            buildings: [] // Initialize empty buildings array
        });
    }
    return planets;
};
