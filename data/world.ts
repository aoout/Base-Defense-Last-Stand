
import { BiomeType, PlanetVisualType } from "../types";

export const GAS_INFO = {
    OXYGEN: { id: 'OXYGEN', name: "Oxygen", color: "#3b82f6", description: "Essential for biological respiration. Influences local fauna metabolism." },
    NITROGEN: { id: 'NITROGEN', name: "Nitrogen", color: "#9ca3af", description: "Inert gas. Standard atmospheric filler." },
    CO2: { id: 'CO2', name: "Carbon Dioxide", color: "#4b5563", description: "Greenhouse gas. Indicates heavy respiration or combustion." },
    ARGON: { id: 'ARGON', name: "Argon", color: "#a855f7", description: "Noble gas. Common in radioactive decay environments." },
    METHANE: { id: 'METHANE', name: "Methane", color: "#f59e0b", description: "Highly flammable organic compound." },
    SULFUR: { id: 'SULFUR', name: "Sulfur Dioxide", color: "#eab308", description: "Toxic volcanic byproduct." },
    HELIUM: { id: 'HELIUM', name: "Helium", color: "#fca5a5", description: "Light noble gas." }
};

export const BIOME_STYLES: Record<BiomeType, {
    name: string;
    planetColor: string;
    groundColor: string;
    rockColor: string;
    craterColor: string;
    dustColor: string;
    atmosphereColor: string;
}> = {
    [BiomeType.BARREN]: {
        name: "Barren Moon",
        planetColor: "#94a3b8", // slate-400
        groundColor: "#111827", // gray-900
        rockColor: "#4B5563", // gray-600
        craterColor: "#1F2937", // gray-800
        dustColor: "#9CA3AF", // gray-400
        atmosphereColor: "rgba(0,0,0,0)" 
    },
    [BiomeType.ICE]: {
        name: "Cryo World",
        planetColor: "#38bdf8", // sky-400
        groundColor: "#162a36", // dark blueish
        rockColor: "#7dd3fc", // sky-300
        craterColor: "#0c4a6e", // sky-900
        dustColor: "#bae6fd", // sky-200
        atmosphereColor: "rgba(186, 230, 253, 0.05)" // slight cyan tint
    },
    [BiomeType.VOLCANIC]: {
        name: "Molten Core",
        planetColor: "#ef4444", // red-500
        groundColor: "#1a0505", // very dark red
        rockColor: "#7f1d1d", // red-900
        craterColor: "#450a0a", // red-950
        dustColor: "#f87171", // red-400
        atmosphereColor: "rgba(239, 68, 68, 0.05)" // slight red tint
    },
    [BiomeType.DESERT]: {
        name: "Arid Wastes",
        planetColor: "#f59e0b", // amber-500
        groundColor: "#271b0a", // dark amber/brown
        rockColor: "#92400e", // amber-800
        craterColor: "#451a03", // amber-950
        dustColor: "#fcd34d", // amber-300
        atmosphereColor: "rgba(245, 158, 11, 0.05)" // slight amber tint
    },
    [BiomeType.TOXIC]: {
        name: "Xeno Swamp",
        planetColor: "#10b981", // emerald-500
        groundColor: "#031c12", // dark emerald
        rockColor: "#065f46", // emerald-800
        craterColor: "#064e3b", // emerald-900
        dustColor: "#6ee7b7", // emerald-300
        atmosphereColor: "rgba(16, 185, 129, 0.05)" // slight green tint
    }
};

/**
 * Procedural Generation Rules
 * Decouples logic from data for better maintainability.
 */
export const GEN_RULES = {
    // Probability of visual types per Biome
    VISUAL_WEIGHTS: {
        [BiomeType.TOXIC]: [
            { item: PlanetVisualType.GAS_GIANT, weight: 0.4 },
            { item: PlanetVisualType.TERRAN, weight: 0.6 }
        ],
        [BiomeType.ICE]: [
            { item: PlanetVisualType.RINGED, weight: 0.2 },
            { item: PlanetVisualType.ICE, weight: 0.8 }
        ],
        [BiomeType.VOLCANIC]: [
            { item: PlanetVisualType.LAVA, weight: 1.0 }
        ],
        [BiomeType.DESERT]: [
            { item: PlanetVisualType.RINGED, weight: 0.3 },
            { item: PlanetVisualType.BARREN, weight: 0.7 }
        ],
        [BiomeType.BARREN]: [
            { item: PlanetVisualType.BARREN, weight: 0.5 },
            { item: PlanetVisualType.TERRAN, weight: 0.5 }
        ]
    },
    // Atmosphere Composition Rules (Base + Variance)
    ATMOSPHERE: {
        [BiomeType.BARREN]: { oxygen: 0.05, toxic: 0 },
        [BiomeType.ICE]: { oxygen: 0.15, toxic: 0, helium: 0.05 },
        [BiomeType.VOLCANIC]: { oxygen: 0.1, toxic: 0.15 }, // Sulfur
        [BiomeType.DESERT]: { oxygen: 0.2, toxic: 0 },
        [BiomeType.TOXIC]: { oxygen: 0.1, toxic: 0.2 }, // Methane
    },
    // Difficulty calculation weights
    DIFFICULTY: {
        BASE_LOW: 5,
        BASE_HIGH: 25,
        VISUAL_MODIFIER: {
            [PlanetVisualType.LAVA]: 10,
            [PlanetVisualType.GAS_GIANT]: 8,
            [PlanetVisualType.RINGED]: 5,
            [PlanetVisualType.TERRAN]: 2,
            [PlanetVisualType.ICE]: 0,
            [PlanetVisualType.BARREN]: -2
        }
    }
};
