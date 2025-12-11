
import { BiomeType, MissionType, PlanetVisualType, SectorPreset } from "../types";

export const FAMOUS_SECTORS: SectorPreset[] = [
    {
        id: "SOL_ORIGIN",
        nameKey: "SECTOR_SOL_NAME",
        descKey: "SECTOR_SOL_DESC",
        difficultyColor: "purple",
        planets: [
            { name: "Terra Ruin", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.OFFENSE, geneStrength: 2.5, sulfurIndex: 8, landingDifficulty: 25, totalWaves: 0 },
            { name: "Luna Base", biome: BiomeType.BARREN, visualType: PlanetVisualType.BARREN, missionType: MissionType.DEFENSE, geneStrength: 1.5, sulfurIndex: 2, landingDifficulty: 5, totalWaves: 15 },
            { name: "Mars Forge", biome: BiomeType.DESERT, visualType: PlanetVisualType.LAVA, missionType: MissionType.DEFENSE, geneStrength: 2.0, sulfurIndex: 5, landingDifficulty: 15, totalWaves: 25 },
            { name: "Titan", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.8, sulfurIndex: 9, landingDifficulty: 20, totalWaves: 20 },
            { name: "Jovian Grid", biome: BiomeType.TOXIC, visualType: PlanetVisualType.GAS_GIANT, missionType: MissionType.OFFENSE, geneStrength: 3.0, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 },
        ]
    },
    {
        id: "ISHIMURA_WAKE",
        nameKey: "SECTOR_ISHIMURA_NAME",
        descKey: "SECTOR_ISHIMURA_DESC",
        difficultyColor: "red",
        planets: [
            { name: "Aegis VII", biome: BiomeType.VOLCANIC, visualType: PlanetVisualType.LAVA, missionType: MissionType.OFFENSE, geneStrength: 3.5, sulfurIndex: 10, landingDifficulty: 30, totalWaves: 0 },
            { name: "Sprawl Station", biome: BiomeType.BARREN, visualType: PlanetVisualType.RINGED, missionType: MissionType.DEFENSE, geneStrength: 2.8, sulfurIndex: 4, landingDifficulty: 20, totalWaves: 40 },
            { name: "Necro-Prime", biome: BiomeType.TOXIC, visualType: PlanetVisualType.TERRAN, missionType: MissionType.DEFENSE, geneStrength: 3.0, sulfurIndex: 8, landingDifficulty: 25, totalWaves: 35 },
            { name: "Dead Echo", biome: BiomeType.ICE, visualType: PlanetVisualType.ICE, missionType: MissionType.DEFENSE, geneStrength: 1.5, sulfurIndex: 1, landingDifficulty: 10, totalWaves: 20 },
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
        ]
    }
];
