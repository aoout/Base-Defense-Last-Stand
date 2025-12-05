
import { PerformanceMode } from "../../types";

export const PLAYER_STATS = {
  maxHp: 200,
  maxArmor: 100,
  speed: 3.2, 
  armorRegenDelay: 5000,
  armorRegenRate: 0.001, // 1 per second (0.001 per ms)
  hpRegenDelay: 10000,
  hpRegenRate: 0.0005, // 0.5 per second (0.0005 per ms)
  grenadeRadius: 150,
  grenadeDamage: 600, 
  maxGrenades: 3,
  initialScore: 300, 
};

export const BASE_STATS = {
  maxHp: 5000,
  width: 200,
  height: 100,
};

export const LOD_THRESHOLDS: Record<PerformanceMode, { low: number, superLow: number }> = {
    QUALITY: { low: 120, superLow: 250 },
    BALANCED: { low: 60, superLow: 120 },
    PERFORMANCE: { low: 30, superLow: 60 }
};

export const ALLY_STATS = {
  hp: 200,
  speed: 1.44, 
  damage: 60,
  range: 400,
  maxCount: 5,
};

export const TOXIC_ZONE_STATS = {
    dps: 10,
    radius: 60,
    duration: 8000,
};
