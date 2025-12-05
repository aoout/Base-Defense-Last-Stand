
import { Planet, PlanetVisualType, BiomeType, AtmosphereGas, TerrainFeature, TerrainType, MissionType, GalaxyConfig } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { BIOME_STYLES, GAS_INFO } from '../data/world';
import { generatePlanetName } from './nameGenerator';

export const generatePlanets = (config?: GalaxyConfig): Planet[] => {
    const planets: Planet[] = [];
    const biomes = Object.values(BiomeType);
    
    const minGene = config ? config.minGeneStrength : 1.0;
    const maxGene = config ? config.maxGeneStrength : 3.0;
    const maxSulfur = config && config.maxSulfur !== undefined ? config.maxSulfur : 10;
    const maxOxygen = config && config.maxOxygen !== undefined ? config.maxOxygen : 1.0;
    const count = config && config.planetCount ? config.planetCount : 12;

    for(let i=0; i<count; i++) {
        const x = (Math.random() * (CANVAS_WIDTH - 200)) + 100;
        const y = (Math.random() * (CANVAS_HEIGHT - 200)) + 100;
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
        // 60% Chance: 1% - 10%
        // 30% Chance: 11% - 20%
        // 10% Chance: 21% - 30%
        const diffRoll = Math.random();
        let landingDifficulty = 1;
        if (diffRoll < 0.6) {
            landingDifficulty = Math.floor(Math.random() * 10) + 1;
        } else if (diffRoll < 0.9) {
            landingDifficulty = Math.floor(Math.random() * 10) + 11;
        } else {
            landingDifficulty = Math.floor(Math.random() * 10) + 21;
        }

        // 70% Defense, 30% Offense
        const missionType = Math.random() > 0.3 ? MissionType.DEFENSE : MissionType.OFFENSE;
        
        // Configurable Gene Strength
        const rawGeneStrength = minGene + Math.random() * (maxGene - minGene);
        const geneStrength = Math.round(rawGeneStrength * 100) / 100;

        // Configurable Sulfur Index
        const sulfurIndex = Math.floor(Math.random() * (maxSulfur + 1));

        planets.push({
            id: `planet-${i}`,
            name: generatePlanetName(), // Use procedural name generator
            x,
            y,
            radius: visualType === PlanetVisualType.GAS_GIANT ? 50 + Math.random() * 30 : 30 + Math.random() * 30,
            color: style.planetColor,
            missionType,
            totalWaves: missionType === MissionType.OFFENSE ? 0 : 5 + Math.floor(Math.random() * 10),
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

const generateRockPoints = (minR: number, maxR: number) => {
    return Array.from({length: 6}, (_, j) => {
        const angle = (j / 6) * Math.PI * 2;
        const r = minR + Math.random() * (maxR - minR);
        return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
};

export const generateTerrain = (visualType: PlanetVisualType, biome: BiomeType): TerrainFeature[] => {
    const terrain: TerrainFeature[] = [];
    const baseX = WORLD_WIDTH / 2;
    const baseY = WORLD_HEIGHT - 100;

    const isSafe = (x: number, y: number, margin = 400) => {
        const dist = Math.sqrt((x - baseX)**2 + (y - baseY)**2);
        return dist > margin;
    };

    const addFeature = (type: TerrainType, x: number, y: number, r: number, extras: any = {}) => {
        terrain.push({
            id: `feat-${terrain.length}`,
            type, x, y, radius: r,
            rotation: Math.random() * Math.PI * 2,
            ...extras
        });
    };

    // --- DECORATION CLUSTERS (High Density, Low Frequency) ---
    // Reduced frequency by ~5x (from 20 to 4) to make terrain features distinct landmarks
    const createCluster = (count: number, centerX: number, centerY: number, radius: number, typeFn: () => TerrainType, sizeFn: () => number, extraFn: () => any = () => ({})) => {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            
            if (x > 0 && x < WORLD_WIDTH && y > 0 && y < WORLD_HEIGHT && isSafe(x, y, 150)) {
                addFeature(typeFn(), x, y, sizeFn(), extraFn());
            }
        }
    };

    // 1. Global Ambient Dust (Background noise) - Kept high for texture
    createCluster(200, WORLD_WIDTH/2, WORLD_HEIGHT/2, Math.max(WORLD_WIDTH, WORLD_HEIGHT), () => TerrainType.DUST, () => 5 + Math.random() * 10, () => ({ opacity: 0.05 + Math.random() * 0.1 }));

    // 2. Biome Specific Clusters
    const numClusters = 4; // Significantly reduced from 20

    if (visualType === PlanetVisualType.LAVA) {
        for(let c=0; c<numClusters; c++) {
            const cx = Math.random() * WORLD_WIDTH;
            const cy = Math.random() * (WORLD_HEIGHT - 300);
            if (isSafe(cx, cy)) {
                // Magma Cluster - Dangerous looking patch
                createCluster(4, cx, cy, 120, () => TerrainType.MAGMA_POOL, () => 50 + Math.random() * 50, () => ({ variant: Math.floor(Math.random()*3) }));
                // Burnt Rock Cluster surrounding it
                createCluster(12, cx, cy, 180, () => TerrainType.ROCK, () => 20 + Math.random() * 20, () => ({ points: generateRockPoints(15, 30), color: '#450a0a' }));
            }
        }
    }
    else if (visualType === PlanetVisualType.ICE) {
         for(let c=0; c<numClusters; c++) {
            const cx = Math.random() * WORLD_WIDTH;
            const cy = Math.random() * (WORLD_HEIGHT - 300);
            if (isSafe(cx, cy)) {
                // Ice Spike Field
                createCluster(12, cx, cy, 140, () => TerrainType.ICE_SPIKE, () => 25 + Math.random() * 35);
                // Scattered Craters
                createCluster(3, cx, cy, 220, () => TerrainType.CRATER, () => 30 + Math.random() * 40, () => ({ opacity: 0.4 }));
            }
        }
    }
    else if (visualType === PlanetVisualType.TERRAN || (biome === BiomeType.TOXIC && visualType !== PlanetVisualType.GAS_GIANT)) {
         for(let c=0; c<numClusters; c++) {
            const cx = Math.random() * WORLD_WIDTH;
            const cy = Math.random() * (WORLD_HEIGHT - 300);
            if (isSafe(cx, cy)) {
                // Dense Forest Patch
                createCluster(20, cx, cy, 180, () => TerrainType.ALIEN_TREE, () => 35 + Math.random() * 35, () => ({ variant: Math.floor(Math.random()*3) }));
                // Undergrowth / Grass
                createCluster(15, cx, cy, 200, () => TerrainType.DUST, () => 15 + Math.random() * 15, () => ({ opacity: 0.3, color: biome === BiomeType.TOXIC ? '#064e3b' : '#14532d' }));
            }
        }
    }
    else if (visualType === PlanetVisualType.GAS_GIANT) {
        // Crystal Fields
        for(let c=0; c<numClusters; c++) {
            const cx = Math.random() * WORLD_WIDTH;
            const cy = Math.random() * (WORLD_HEIGHT - 300);
            if (isSafe(cx, cy)) {
                createCluster(15, cx, cy, 150, () => TerrainType.CRYSTAL, () => 20 + Math.random() * 30);
                createCluster(6, cx, cy, 150, () => TerrainType.SPORE_POD, () => 25 + Math.random() * 25);
            }
        }
    }
    else {
        // Barren / Default
        for(let c=0; c<numClusters; c++) {
            const cx = Math.random() * WORLD_WIDTH;
            const cy = Math.random() * (WORLD_HEIGHT - 300);
            if (isSafe(cx, cy)) {
                // Rock Field
                createCluster(10, cx, cy, 160, () => TerrainType.ROCK, () => 25 + Math.random() * 35, () => ({ points: generateRockPoints(20, 40) }));
                createCluster(4, cx, cy, 200, () => TerrainType.CRATER, () => 40 + Math.random() * 60);
            }
        }
    }

    return terrain;
}
