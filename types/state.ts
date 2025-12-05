
import { Ally, BloodStain, Enemy, OrbitalBeam, Particle, Player, Projectile, TurretSpot, ToxicZone } from './entities';
import { AppMode, GameMode, PerformanceMode, SpecialEventType } from './enums';
import { FloatingText, GameStats, PersistentPlayerState, SaveFile, SpaceshipState } from './systems';
import { GalacticEvent, Planet, PlanetYieldReport, TerrainFeature } from './world';

export interface GameSettings {
  showHUD: boolean;
  showBlood: boolean;
  showDamageNumbers: boolean;
  language: 'EN' | 'CN';
  // Performance Settings
  lightingQuality: 'HIGH' | 'LOW'; // Low disables blur/glow
  particleIntensity: 'HIGH' | 'LOW'; // Low reduces particle counts by 70%
  animatedBackground: boolean; // False disables terrain updates
  performanceMode: PerformanceMode; // New LOD control
  
  // New Low-Spec Options
  resolutionScale: number; // 1.0, 0.75, 0.5
  showShadows: boolean; // Toggle drop shadows
}

export interface GameState {
  appMode: AppMode;
  gameMode: GameMode;
  
  // Exploration Data
  sectorName: string; // New: Procedurally generated sector name
  planets: Planet[];
  currentPlanet: Planet | null;
  selectedPlanetId: string | null;
  savedPlayerState: PersistentPlayerState | null;
  activeGalacticEvent: GalacticEvent | null;
  pendingYieldReport: PlanetYieldReport | null; // New Field

  // Spaceship
  spaceship: SpaceshipState;
  orbitalSupportTimer: number; // Tracks time for ORBITAL_CANNON module

  // Save System
  saveSlots: SaveFile[];

  camera: { x: number; y: number };
  player: Player;
  base: {
    x: number;
    y: number
    width: number;
    height: number;
    hp: number;
    maxHp: number;
  };
  terrain: TerrainFeature[];
  bloodStains: BloodStain[];
  enemies: Enemy[];
  allies: Ally[];
  projectiles: Projectile[];
  particles: Particle[];
  orbitalBeams: OrbitalBeam[];
  turretSpots: TurretSpot[];
  toxicZones: ToxicZone[];
  activeSpecialEvent: SpecialEventType;
  
  wave: number;
  waveTimeRemaining: number;
  waveDuration: number;
  spawnTimer: number;
  enemiesPendingSpawn: number;
  enemiesSpawnedInWave: number;
  totalEnemiesInWave: number;
  lastAllySpawnTime: number;

  isGameOver: boolean;
  missionComplete: boolean;
  isPaused: boolean;
  isTacticalMenuOpen: boolean;
  isInventoryOpen: boolean;
  isShopOpen: boolean;
  
  floatingTexts: FloatingText[];
  activeTurretId?: number;

  settings: GameSettings;
  stats: GameStats;
}
