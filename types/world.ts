
import { BiomeType, GalacticEventType, MissionType, PlanetBuildingType, PlanetVisualType, TerrainType } from './enums';

export interface AtmosphereGas {
    id: string;
    name: string;
    color: string;
    percentage: number; // 0.0 to 1.0
    description: string;
}

export interface PlanetBuilding {
    id: string;
    type: PlanetBuildingType;
    slotIndex: number;
    createdAt: number;
}

export interface Planet {
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    missionType: MissionType;
    totalWaves: number;
    geneStrength: number;
    sulfurIndex: number; // 0 - 10
    landingDifficulty: number; // 1 - 30 (Percentage cost)
    completed: boolean;
    biome: BiomeType;
    visualType: PlanetVisualType;
    atmosphere: AtmosphereGas[];
    buildings: PlanetBuilding[];
}

export interface TerrainFeature {
  id: string;
  type: TerrainType;
  x: number;
  y: number;
  radius: number;
  rotation?: number;
  points?: {x: number, y: number}[]; // For irregular shapes
  opacity?: number;
  // Visual specific
  variant?: number; // 0-3 for varied sprite looks
  color?: string; // Custom color override
}

export interface GalacticEvent {
    type: GalacticEventType;
    targetPlanetId?: string; // For invasion
    scrapsReward?: number; // For salvage
}

export interface PlanetYieldInfo {
    planetId: string;
    planetName: string;
    biomassYield: number;
    oxygenYield: number;
    total: number;
}

export interface PlanetYieldReport {
    items: PlanetYieldInfo[];
    totalYield: number;
}

export interface GalaxyConfig {
    minGeneStrength: number;
    maxGeneStrength: number;
    maxSulfur?: number;
    maxOxygen?: number;
    planetCount?: number;
}
