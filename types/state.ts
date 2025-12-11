
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

// Sub-State: Wave System
export interface WaveState {
    index: number;              // Current wave number (formerly 'wave')
    timer: number;              // Time remaining in ms (formerly 'waveTimeRemaining')
    duration: number;           // Total duration of current wave (formerly 'waveDuration')
    spawnTimer: number;         // Time since last spawn check
    pendingCount: number;       // Enemies left to spawn (formerly 'enemiesPendingSpawn')
    spawnedCount: number;       // Enemies already spawned (formerly 'enemiesSpawnedInWave')
    totalCount: number;         // Total enemies for this wave (formerly 'totalEnemiesInWave')
    activeEvent: SpecialEventType; // (formerly 'activeSpecialEvent')
}

// Sub-State: Campaign System
export interface CampaignState {
    pustuleTimer: number;
    nextPustuleSpawnTime: number;
    bossTimer: number;          // formerly 'campaignBossTimer'
    bossHp: number;             // formerly 'campaignBossHp'
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
  sectorName: string; 
  planets: Planet[];
  currentPlanet: Planet | null;
  selectedPlanetId: string | null;
  savedPlayerState: PersistentPlayerState | null;
  activeGalacticEvent: GalacticEvent | null;
  pendingYieldReport: PlanetYieldReport | null; 

  // Spaceship
  spaceship: SpaceshipState;
  orbitalSupportTimer: number; 

  // Base Drop Animation State
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
  
  // --- REFACTORED SUB-STATES ---
  wave: WaveState;
  campaign: CampaignState;
  
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
