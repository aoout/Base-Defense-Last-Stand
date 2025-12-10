
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

export interface BaseDropState {
    active: boolean;
    y: number;       // Current visual Y position of the base
    targetY: number; // The final ground Y position
    velocity: number;
    phase: 'ORBIT' | 'ENTRY' | 'IMPACT' | 'DEPLOY';
    deployTimer: number; // Timer for door opening/player spawn
}

export interface GameState {
  appMode: AppMode;
  gameMode: GameMode;
  
  // World Bounds (Dynamic based on mode)
  worldWidth: number;
  worldHeight: number;
  
  // Viewport Dimensions (Current visible area)
  viewportWidth: number;
  viewportHeight: number;

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

  // Base Drop Animation State (Replaces dropPod)
  baseDrop: BaseDropState | null;

  // Save System
  saveSlots: SaveFile[];

  camera: { x: number; y: number };
  player: Player;
  
  // Bases
  base: {
    x: number;
    y: number
    width: number;
    height: number;
    hp: number;
    maxHp: number;
  };
  
  // Campaign Mode Only: Second Base
  secondaryBase?: {
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
  // Campaign specific timers
  pustuleTimer: number; 
  nextPustuleSpawnTime: number;

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
  time: number;
}
