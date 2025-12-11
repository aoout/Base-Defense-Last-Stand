
import { BiomeType, MissionType, PlanetVisualType, SectorPreset } from "../types";

export const FAMOUS_SECTORS: SectorPreset[] = [
    {
        id: "SOL_ORIGIN",
        nameKey: "SECTOR_SOL_NAME",
        descKey: "SECTOR_SOL_DESC",
        difficultyColor: "purple",
        planets: [
            { name: "Terra Ruin", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.OFFENSE, geneStrength: 2.8, sulfurIndex: 8, landingDifficulty: 25, totalWaves: 0 },
            { name: "Luna Base", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.5, sulfurIndex: 2, landingDifficulty: 5, totalWaves: 15 },
            { name: "Mars Forge", biome: BiomeType.DESERT, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 2.2, sulfurIndex: 5, landingDifficulty: 15, totalWaves: 25 },
            { name: "Titan", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.8, sulfurIndex: 9, landingDifficulty: 20, totalWaves: 20 },
            { name: "Jovian Grid", biome: BiomeType.TOXIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 3.5, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 },
            { name: "Venus Siphon", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.DEFENSE, geneStrength: 2.5, sulfurIndex: 10, landingDifficulty: 25, totalWaves: 30 },
            { name: "Mercury Core", biome: BiomeType.BARREN, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 1.2, sulfurIndex: 3, landingDifficulty: 10, totalWaves: 12 },
            { name: "Pluto Outpost", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.6, sulfurIndex: 1, landingDifficulty: 18, totalWaves: 18 },
            { name: "Ceres Mining", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.4, sulfurIndex: 0, landingDifficulty: 8, totalWaves: 15 },
            { name: "Europa Depth", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.OFFENSE, geneStrength: 3.2, sulfurIndex: 4, landingDifficulty: 22, totalWaves: 0 },
            { name: "Saturn Ring", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 1.9, sulfurIndex: 2, landingDifficulty: 15, totalWaves: 22 },
            { name: "Neptune Drift", biome: BiomeType.ICE, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.DEFENSE, geneStrength: 2.0, sulfurIndex: 6, landingDifficulty: 20, totalWaves: 25 }
        ]
    },
    {
        id: "ISHIMURA_WAKE",
        nameKey: "SECTOR_ISHIMURA_NAME",
        descKey: "SECTOR_ISHIMURA_DESC",
        difficultyColor: "red",
        planets: [
            { name: "Aegis VII", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.OFFENSE, geneStrength: 3.8, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 },
            { name: "Sprawl Station", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.8, sulfurIndex: 4, landingDifficulty: 20, totalWaves: 40 },
            { name: "Necro-Prime", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 3.5, sulfurIndex: 8, landingDifficulty: 25, totalWaves: 35 },
            { name: "Dead Echo", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 2.0, sulfurIndex: 1, landingDifficulty: 10, totalWaves: 20 },
            { name: "Black Marker", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.OFFENSE, geneStrength: 4.2, sulfurIndex: 5, landingDifficulty: 28, totalWaves: 0 },
            { name: "USG Wreckage", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.5, sulfurIndex: 3, landingDifficulty: 15, totalWaves: 25 },
            { name: "Red Marker", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.OFFENSE, geneStrength: 4.5, sulfurIndex: 9, landingDifficulty: 30, totalWaves: 0 },
            { name: "Mining Pit A", biome: BiomeType.DESERT, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 2.2, sulfurIndex: 6, landingDifficulty: 12, totalWaves: 30 },
            { name: "Mining Pit B", biome: BiomeType.DESERT, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 2.3, sulfurIndex: 7, landingDifficulty: 14, totalWaves: 32 },
            { name: "Ishimura Hull", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 3.0, sulfurIndex: 2, landingDifficulty: 20, totalWaves: 45 },
            { name: "Titan Shard", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 2.1, sulfurIndex: 4, landingDifficulty: 18, totalWaves: 28 },
            { name: "Colony 12", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 2.9, sulfurIndex: 5, landingDifficulty: 22, totalWaves: 38 },
            { name: "Infection Zero", biome: BiomeType.TOXIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 5.0, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 },
            { name: "Hive Heart", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.OFFENSE, geneStrength: 4.8, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 }
        ]
    },
    {
        id: "HELIX_NEBULA",
        nameKey: "SECTOR_HELIX_NAME",
        descKey: "SECTOR_HELIX_DESC",
        difficultyColor: "cyan",
        planets: [
            { name: "Lab-01", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 2.2, sulfurIndex: 6, landingDifficulty: 15, totalWaves: 20 },
            { name: "Sample Storage", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.8, sulfurIndex: 2, landingDifficulty: 10, totalWaves: 15 },
            { name: "Genetic Core", biome: BiomeType.TOXIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 4.0, sulfurIndex: 5, landingDifficulty: 30, totalWaves: 0 },
            { name: "Disposal Site", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 2.5, sulfurIndex: 9, landingDifficulty: 20, totalWaves: 30 },
            { name: "Quarantine", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.0, sulfurIndex: 0, landingDifficulty: 12, totalWaves: 18 },
            { name: "Observation", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.2, sulfurIndex: 0, landingDifficulty: 5, totalWaves: 10 },
            { name: "Helix Alpha", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 2.8, sulfurIndex: 4, landingDifficulty: 18, totalWaves: 25 },
            { name: "Helix Beta", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 3.0, sulfurIndex: 5, landingDifficulty: 20, totalWaves: 28 },
            { name: "Test Site Delta", biome: BiomeType.DESERT, visualType: PlanetVisualType.BARREN, missionType: MissionType.OFFENSE, geneStrength: 3.5, sulfurIndex: 2, landingDifficulty: 22, totalWaves: 0 },
            { name: "Bio-Dome 4", biome: BiomeType.TOXIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.DEFENSE, geneStrength: 2.6, sulfurIndex: 7, landingDifficulty: 16, totalWaves: 24 },
            { name: "Specimen Tank", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.9, sulfurIndex: 1, landingDifficulty: 12, totalWaves: 20 },
            { name: "Cloning Vat", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.OFFENSE, geneStrength: 4.2, sulfurIndex: 8, landingDifficulty: 28, totalWaves: 0 },
            { name: "Data Archive", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 1.5, sulfurIndex: 0, landingDifficulty: 8, totalWaves: 15 }
        ]
    },
    {
        id: "VANGUARD_HUB",
        nameKey: "SECTOR_HUB_NAME",
        descKey: "SECTOR_HUB_DESC",
        difficultyColor: "emerald",
        planets: [
            { name: "Training Grounds", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 0.8, sulfurIndex: 0, landingDifficulty: 1, totalWaves: 10 },
            { name: "Supply Depot A", biome: BiomeType.DESERT, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 1.0, sulfurIndex: 2, landingDifficulty: 5, totalWaves: 15 },
            { name: "Supply Depot B", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.2, sulfurIndex: 3, landingDifficulty: 5, totalWaves: 15 },
            { name: "Forward Command", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 1.5, sulfurIndex: 4, landingDifficulty: 10, totalWaves: 25 },
            { name: "Recruit Barracks", biome: BiomeType.BARREN, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 0.9, sulfurIndex: 0, landingDifficulty: 2, totalWaves: 12 },
            { name: "Simulator 1", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.1, sulfurIndex: 1, landingDifficulty: 5, totalWaves: 18 },
            { name: "Simulator 2", biome: BiomeType.DESERT, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.3, sulfurIndex: 2, landingDifficulty: 6, totalWaves: 20 },
            { name: "Logistics Hub", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 1.4, sulfurIndex: 0, landingDifficulty: 8, totalWaves: 22 },
            { name: "Drydock", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.0, sulfurIndex: 0, landingDifficulty: 4, totalWaves: 15 },
            { name: "Medical Bay", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.2, sulfurIndex: 1, landingDifficulty: 5, totalWaves: 16 }
        ]
    },
    {
        id: "IRON_VEIL",
        nameKey: "SECTOR_IRON_NAME",
        descKey: "SECTOR_IRON_DESC",
        difficultyColor: "yellow",
        planets: [
            { name: "Ferro-1", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 1.8, sulfurIndex: 7, landingDifficulty: 18, totalWaves: 30 },
            { name: "Ferro-2", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 1.9, sulfurIndex: 8, landingDifficulty: 18, totalWaves: 30 },
            { name: "Ferro-3", biome: BiomeType.DESERT, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.5, sulfurIndex: 5, landingDifficulty: 12, totalWaves: 20 },
            { name: "The Anvil", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 3.2, sulfurIndex: 10, landingDifficulty: 28, totalWaves: 0 },
            { name: "Slag Heap", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 2.2, sulfurIndex: 9, landingDifficulty: 22, totalWaves: 35 },
            { name: "Blast Furnace", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 2.5, sulfurIndex: 8, landingDifficulty: 20, totalWaves: 32 },
            { name: "Molten River", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 2.4, sulfurIndex: 7, landingDifficulty: 19, totalWaves: 28 },
            { name: "Heavy Metal", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.0, sulfurIndex: 4, landingDifficulty: 15, totalWaves: 25 },
            { name: "Steelworks", biome: BiomeType.DESERT, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.7, sulfurIndex: 3, landingDifficulty: 12, totalWaves: 22 },
            { name: "Refinery Alpha", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 2.1, sulfurIndex: 6, landingDifficulty: 16, totalWaves: 26 },
            { name: "Refinery Beta", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 2.3, sulfurIndex: 7, landingDifficulty: 18, totalWaves: 28 },
            { name: "Ash World", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.OFFENSE, geneStrength: 3.5, sulfurIndex: 9, landingDifficulty: 26, totalWaves: 0 },
            { name: "Magma Chamber", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 2.8, sulfurIndex: 10, landingDifficulty: 24, totalWaves: 35 },
            { name: "Obsidian Ridge", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.9, sulfurIndex: 2, landingDifficulty: 14, totalWaves: 24 },
            { name: "Core Bore", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 4.0, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 }
        ]
    },
    {
        id: "VOID_TERMINUS",
        nameKey: "SECTOR_VOID_NAME",
        descKey: "SECTOR_VOID_DESC",
        difficultyColor: "cyan",
        planets: [
            { name: "Last Light", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.6, sulfurIndex: 0, landingDifficulty: 10, totalWaves: 50 },
            { name: "Null Point", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.8, sulfurIndex: 0, landingDifficulty: 10, totalWaves: 50 },
            { name: "Deep Freeze", biome: BiomeType.ICE, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.0, sulfurIndex: 0, landingDifficulty: 15, totalWaves: 50 },
            { name: "Entropy", biome: BiomeType.TOXIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 3.5, sulfurIndex: 5, landingDifficulty: 30, totalWaves: 0 },
            { name: "Absolute Zero", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 2.2, sulfurIndex: 0, landingDifficulty: 18, totalWaves: 45 },
            { name: "Dark Matter", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.OFFENSE, geneStrength: 4.0, sulfurIndex: 2, landingDifficulty: 28, totalWaves: 0 },
            { name: "Void Edge", biome: BiomeType.ICE, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.5, sulfurIndex: 1, landingDifficulty: 20, totalWaves: 60 },
            { name: "Frozen Tomb", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.9, sulfurIndex: 0, landingDifficulty: 12, totalWaves: 40 },
            { name: "Cryo-Stasis", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.7, sulfurIndex: 0, landingDifficulty: 10, totalWaves: 35 },
            { name: "Nowhere", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 2.1, sulfurIndex: 0, landingDifficulty: 15, totalWaves: 55 },
            { name: "Silent Expanse", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.4, sulfurIndex: 0, landingDifficulty: 18, totalWaves: 48 }
        ]
    }
];
