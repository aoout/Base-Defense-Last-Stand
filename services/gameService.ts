
import {
  GameState,
  WeaponType,
  EnemyType,
  Enemy,
  Projectile,
  GameStats,
  InventoryItem,
  SpecialEventType,
  BossType,
  AppMode,
  GameMode,
  Planet,
  PersistentPlayerState,
  SaveFile,
  DefenseUpgradeType,
  SpaceshipModuleType,
  PlanetVisualType,
  OrbitalUpgradeNode,
  OrbitalUpgradeEffect,
  MissionType,
  FloatingText,
  FloatingTextType,
  GameSettings,
  DamageSource,
  PlanetBuildingType,
  GalacticEventType,
  PlanetYieldInfo,
  PerformanceMode,
  BioResource,
  GameEventType,
  SpawnProjectileEvent,
  PlaySoundEvent,
  ShowFloatingTextEvent,
  SpawnParticleEvent,
  DamagePlayerEvent,
  DamageBaseEvent,
  DamageAreaEvent,
  GalaxyConfig,
  UserAction,
  WeaponState,
  WeaponModule
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMPAIGN_WIDTH,
  CAMPAIGN_HEIGHT,
  INVENTORY_SIZE,
} from '../constants';
import {
  PLAYER_STATS,
  WEAPONS,
  INITIAL_AMMO,
  BASE_STATS,
} from '../data/registry';
import { AudioService } from './audioService';
import { generatePlanets, generateTerrain } from '../utils/worldGenerator';
import { generateSectorName } from '../utils/nameGenerator';
import { SaveManager } from './managers/SaveManager';
import { ShopManager } from './managers/ShopManager';
import { EnemyManager } from './managers/EnemyManager';
import { ProjectileManager } from './managers/ProjectileManager';
import { PlayerManager } from './managers/PlayerManager';
import { DefenseManager } from './managers/DefenseManager';
import { FXManager } from './managers/FXManager';
import { SpaceshipManager } from './managers/SpaceshipManager';
import { TimeManager } from './managers/TimeManager';
import { MissionManager } from './managers/MissionManager';
import { GalaxyManager } from './managers/GalaxyManager';
import { StatManager } from './managers/StatManager';
import { PhysicsSystem } from './PhysicsSystem';
import { TRANSLATIONS } from '../data/locales';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';

const TURRET_POSITIONS = [
  { x: -150, y: -150 },
  { x: 150, y: -150 },
  { x: -250, y: -100 },
  { x: 250, y: -100 },
  { x: 0, y: -250 },
  { x: -350, y: -300 },
  { x: 350, y: -300 },
  { x: 0, y: -450 },
];

export class GameEngine {
  state!: GameState;
  inputManager: InputManager;
  audio: AudioService;
  eventBus: EventBus;
  statManager: StatManager;
  
  // Systems
  physics: PhysicsSystem;

  // Managers
  time: TimeManager;
  saveManager: SaveManager;
  shopManager: ShopManager;
  enemyManager: EnemyManager;
  projectileManager: ProjectileManager;
  playerManager: PlayerManager;
  defenseManager: DefenseManager;
  fxManager: FXManager;
  spaceshipManager: SpaceshipManager;
  missionManager: MissionManager;
  galaxyManager: GalaxyManager;

  // Shared Systems
  private floatingTextPool: FloatingText[] = [];
  private aoeCache: Enemy[] = []; 
  
  // Performance: Loop Listeners for Transient UI
  private loopListeners: Set<(dt: number, time: number) => void> = new Set();

  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_STEP: number = 1000 / 60;

  constructor() {
    this.inputManager = new InputManager();
    this.audio = new AudioService();
    this.eventBus = new EventBus();
    this.statManager = new StatManager();
    
    // Initialize Core Systems
    this.time = new TimeManager();
    
    // Initialize Physics System
    this.physics = new PhysicsSystem(() => this.state, this.eventBus, this.statManager);

    // Initialize temporary state
    this.reset(true); 
    
    // --- INSTANTIATE MANAGERS (With Dependency Injection) ---
    this.saveManager = new SaveManager(this);
    this.shopManager = new ShopManager(this);
    
    this.spaceshipManager = new SpaceshipManager(() => this.state, this.eventBus, this.statManager);
    
    this.fxManager = new FXManager(() => this.state, this.eventBus);
    
    // Projectile Manager no longer needs Physics/Grid dependencies, PhysicsSystem handles collision
    this.projectileManager = new ProjectileManager(() => this.state, this.eventBus);
    
    this.enemyManager = new EnemyManager(this, this.eventBus, this.statManager);
    
    this.playerManager = new PlayerManager(() => this.state, this.eventBus, this.inputManager, this.statManager);
    
    // Defense Manager needs spatial grid for targeting AI
    this.defenseManager = new DefenseManager(() => this.state, this.eventBus, this.physics.spatialGrid, this.statManager);
    
    this.missionManager = new MissionManager(this);
    this.galaxyManager = new GalaxyManager(this);
    
    this.setupEventListeners();

    this.state.appMode = AppMode.START_MENU;
    this.state.saveSlots = this.saveManager.loadSavesFromStorage();
  }

  public registerLoopListener(cb: (dt: number, time: number) => void) {
      this.loopListeners.add(cb);
  }

  public unregisterLoopListener(cb: (dt: number, time: number) => void) {
      this.loopListeners.delete(cb);
  }

  public notifyUI(reason?: string) {
      this.eventBus.emit(GameEventType.UI_UPDATE, { reason });
  }

  public closeShop() {
      this.state.isShopOpen = false;
      this.notifyUI('SHOP_CLOSE');
  }

  private setupEventListeners() {
      // Data-Driven Audio Mapping
      this.eventBus.on<PlaySoundEvent>(GameEventType.PLAY_SOUND, (e) => {
          switch (e.type) {
              case 'WEAPON': 
                  this.audio.play(`WEAPON_${e.variant}`, e.x, e.y); 
                  break;
              case 'RELOAD':
                  this.audio.play(`RELOAD_${e.variant}`, e.x, e.y);
                  break;
              case 'TURRET': 
                  this.audio.play(`TURRET_${e.variant}`, e.x, e.y); 
                  break;
              case 'ALLY': 
                  this.audio.play('ALLY_SHOOT', e.x, e.y); 
                  break;
              case 'EXPLOSION': 
                  this.audio.play('EXPLOSION', e.x, e.y); 
                  break;
              case 'GRENADE': // Generic UI sound or grenade selection
              case 'GRENADE_THROW': 
                  this.audio.play('GRENADE_THROW', e.x, e.y); 
                  break;
              case 'ENEMY_DEATH': 
                  this.audio.play(e.variant ? 'BOSS_DEATH' : 'ENEMY_DEATH', e.x, e.y); 
                  break;
              case 'VIPER_SHOOT': 
                  this.audio.play('VIPER_SHOOT', e.x, e.y); 
                  break;
              case 'MELEE_HIT': 
                  this.audio.play('MELEE_HIT', e.x, e.y); 
                  break;
              case 'BASE_DAMAGE': 
                  this.audio.play('BASE_DAMAGE', e.x, e.y); 
                  break;
              case 'BULLET_HIT':
                  this.audio.play('BULLET_HIT', e.x, e.y);
                  break;
              case 'ORBITAL_STRIKE':
                  this.audio.play('ORBITAL_STRIKE', e.x, e.y);
                  break;
          }
      });

      this.eventBus.on<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, (e) => {
          this.playerManager.damagePlayer(e.amount);
      });
      this.eventBus.on<DamageBaseEvent>(GameEventType.DAMAGE_BASE, (e) => {
          this.damageBase(e.amount);
      });
      this.eventBus.on<DamageAreaEvent>(GameEventType.DAMAGE_AREA, (e) => {
          this.damageArea(e.x, e.y, e.radius, e.damage, e.source);
      });

      this.eventBus.on<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, (e) => {
          this.addMessage(e.text, e.x, e.y, e.color, e.type, e.time);
      });

      this.eventBus.on(GameEventType.MISSION_COMPLETE, () => {
          this.completeMission();
      });
      
      this.eventBus.on(GameEventType.PLAYER_SWITCH_WEAPON, () => this.notifyUI('WEAPON_SWITCH'));
      this.eventBus.on(GameEventType.SHOP_PURCHASE, () => this.notifyUI('SHOP_ACTION'));
      this.eventBus.on(GameEventType.SHOP_SWAP_LOADOUT, () => this.notifyUI('SHOP_ACTION'));
      
      // Fix: Listen for Module Equip/Unequip to notify UI
      this.eventBus.on(GameEventType.SHOP_EQUIP_MODULE, () => this.notifyUI('EQUIP'));
      this.eventBus.on(GameEventType.SHOP_UNEQUIP_MODULE, () => this.notifyUI('EQUIP'));
  }

  // ... (t helper, handleInput helper) ...
  public t(key: string, params?: Record<string, any>): string {
      const lang = this.state.settings.language;
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      let str = (dict as any)[key];
      if (str === undefined) str = (TRANSLATIONS.EN as any)[key] || key;
      if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
      return str;
  }

  public handleInput(code: string, isDown: boolean) {
      const action = isDown ? this.inputManager.handleKeyDown(code) : this.inputManager.handleKeyUp(code);
      if (isDown && action && this.state.appMode === AppMode.GAMEPLAY) {
          switch (action) {
              case UserAction.WEAPON_1: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 0 }); break;
              case UserAction.WEAPON_2: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 1 }); break;
              case UserAction.WEAPON_3: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 2 }); break;
              case UserAction.WEAPON_4: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 3 }); break;
              case UserAction.TACTICAL_MENU: if (!this.state.isPaused && !this.state.isShopOpen && !this.state.isInventoryOpen) this.toggleTacticalMenu(); break;
              case UserAction.ORDER_1: if (this.state.isTacticalMenuOpen) { this.eventBus.emit(GameEventType.DEFENSE_ISSUE_ORDER, { order: 'PATROL' }); this.toggleTacticalMenu(); } break;
              case UserAction.ORDER_2: if (this.state.isTacticalMenuOpen) { this.eventBus.emit(GameEventType.DEFENSE_ISSUE_ORDER, { order: 'FOLLOW' }); this.toggleTacticalMenu(); } break;
              case UserAction.ORDER_3: if (this.state.isTacticalMenuOpen) { this.eventBus.emit(GameEventType.DEFENSE_ISSUE_ORDER, { order: 'ATTACK' }); this.toggleTacticalMenu(); } break;
              case UserAction.INVENTORY: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isShopOpen) this.toggleInventory(); break;
              case UserAction.SHOP: 
                  if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) {
                      const p = this.state.player;
                      const bases = [this.state.base];
                      if (this.state.secondaryBase) bases.push(this.state.secondaryBase);
                      
                      let canOpen = false;
                      for (const base of bases) {
                          const dist = Math.sqrt(Math.pow(p.x - base.x, 2) + Math.pow(p.y - base.y, 2));
                          if (dist < 300) { canOpen = true; break; }
                      }

                      if (canOpen || this.state.isShopOpen) { 
                          if (this.state.isShopOpen) this.closeShop(); 
                          else { this.state.isShopOpen = true; this.notifyUI('SHOP_OPEN'); }
                      }
                  }
                  break;
              case UserAction.INTERACT: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && !this.state.isShopOpen && !this.state.activeTurretId) { this.eventBus.emit(GameEventType.DEFENSE_INTERACT, {}); this.notifyUI('INTERACT'); } break;
              case UserAction.SKIP_WAVE: if (!this.state.isPaused && this.state.appMode === AppMode.GAMEPLAY && !this.state.isGameOver && !this.state.missionComplete) { if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) return; this.skipWave(); } break;
              case UserAction.PAUSE: 
                  if (!this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && this.state.activeTurretId === undefined) {
                      // If shop is open, just close it. Otherwise toggle actual pause.
                      if (this.state.isShopOpen) {
                          this.closeShop();
                      } else {
                          this.togglePause(); 
                      }
                  }
                  break;
              case UserAction.ESCAPE: 
                  let updated = false;
                  if (this.state.isShopOpen) { this.closeShop(); updated = true; }
                  if (this.state.isTacticalMenuOpen) { this.toggleTacticalMenu(); updated = true; }
                  if (this.state.isInventoryOpen) { this.toggleInventory(); updated = true; }
                  if (this.state.activeTurretId !== undefined) { this.eventBus.emit(GameEventType.DEFENSE_CLOSE_MENU, {}); updated = true; } 
                  // Only toggle pause if we didn't just close a menu
                  if (this.state.isPaused && !updated && this.state.activeTurretId === undefined) { this.togglePause(); updated = true; }
                  if (updated) this.notifyUI('ESCAPE');
                  break;
              case UserAction.GRENADE: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) this.eventBus.emit(GameEventType.PLAYER_THROW_GRENADE, {}); break;
              case UserAction.RELOAD: if (!this.state.isPaused) this.eventBus.emit(GameEventType.PLAYER_RELOAD, { time: this.time.now }); break;
          }
      }
  }

  private loadSettings(): GameSettings {
      const defaultSettings: GameSettings = { showHUD: true, showBlood: true, showDamageNumbers: true, language: 'CN', lightingQuality: 'HIGH', particleIntensity: 'HIGH', animatedBackground: true, performanceMode: 'BALANCED', resolutionScale: 1.0, showShadows: true };
      try { const raw = localStorage.getItem('VANGUARD_SETTINGS_V1'); if (raw) { const parsed = JSON.parse(raw); return { ...defaultSettings, ...parsed }; } } catch (e) { console.error("Failed to load settings:", e); }
      return defaultSettings;
  }
  private persistSettings() { if (this.state && this.state.settings) localStorage.setItem('VANGUARD_SETTINGS_V1', JSON.stringify(this.state.settings)); }

  public reset(fullReset: boolean = false, mode: GameMode = GameMode.SURVIVAL) {
    // STOP AMBIENCE
    this.audio.stopAmbience();

    const isCampaign = mode === GameMode.CAMPAIGN;
    
    // Set Dimensions
    const w = isCampaign ? CAMPAIGN_WIDTH : WORLD_WIDTH;
    const h = isCampaign ? CAMPAIGN_HEIGHT : WORLD_HEIGHT;
    
    // Ensure Physics Grid matches the new world size
    if (this.physics) {
        this.physics.resize(w, h);
    }
    
    let basePos = { x: w / 2, y: h - 100 };
    let playerPos = { x: w / 2, y: h - 250 };
    
    // Campaign: Central Base, Symmetric Map
    if (isCampaign) {
        const cx = w / 2;
        const cy = h / 2;
        basePos = { x: cx, y: cy }; 
        playerPos = { x: cx, y: cy + 150 };
    }

    const existingPlanets = !fullReset && this.state?.planets ? this.state.planets : generatePlanets();
    existingPlanets.forEach(p => { if (!p.buildings) p.buildings = []; });
    const existingSaveSlots = !fullReset && this.state?.saveSlots ? this.state.saveSlots : [];
    
    const existingSpaceship = !fullReset && this.state?.spaceship ? this.state.spaceship : { 
        installedModules: [], 
        orbitalUpgradeTree: [], 
        orbitalDamageMultiplier: 1, 
        orbitalRateMultiplier: 1, 
        carapaceGrid: null, 
        infrastructureUpgrades: [], 
        infrastructureOptions: [], 
        infrastructureLocked: false, 
        bioNodes: [], 
        bioResources: { [BioResource.ALPHA]: 0, [BioResource.BETA]: 0, [BioResource.GAMMA]: 0 }, 
        bioTasks: [], 
        activeBioTask: null,
        snakeRewardClaimed: false
    };
    
    let currentSettings: GameSettings;
    if (!fullReset && this.state?.settings) currentSettings = this.state.settings; else currentSettings = this.loadSettings();

    const initialWeapons: Record<string, WeaponState> = {};
    Object.values(WeaponType).forEach(type => { initialWeapons[type] = { type, ammoInMag: WEAPONS[type].magSize, ammoReserve: INITIAL_AMMO[type], lastFireTime: 0, reloading: false, reloadStartTime: 0, modules: [], consecutiveShots: 0 }; });
    
    // Generate Turret Spots
    let initialTurretSpots = [];
    
    if (isCampaign) {
        // Symmetric 8 Spots for Campaign
        const offsets = [
            { x: 0, y: -180 }, { x: 0, y: 180 }, // Top, Bottom
            { x: -220, y: 0 }, { x: 220, y: 0 }, // Left, Right
            { x: -150, y: -150 }, { x: 150, y: -150 }, // Top Diagonals
            { x: -150, y: 150 }, { x: 150, y: 150 }    // Bottom Diagonals
        ];
        initialTurretSpots = offsets.map((pos, idx) => ({ id: idx, x: basePos.x + pos.x, y: basePos.y + pos.y }));
    } else {
        // Default Survival/Exploration Spots
        initialTurretSpots = TURRET_POSITIONS.map((pos, idx) => ({ id: idx, x: basePos.x + pos.x, y: basePos.y + pos.y }));
    }

    const terrain = generateTerrain(PlanetVisualType.BARREN, 'BARREN' as any, w, h);
    const sectorName = !fullReset && this.state?.sectorName ? this.state.sectorName : generateSectorName();

    // Fix: Exploration Mode should start on Map, others in Gameplay
    const initialAppMode = mode === GameMode.EXPLORATION ? AppMode.EXPLORATION_MAP : AppMode.GAMEPLAY;

    this.state = {
      appMode: initialAppMode, gameMode: mode, sectorName, planets: existingPlanets, currentPlanet: null, selectedPlanetId: null, savedPlayerState: null, spaceship: existingSpaceship, orbitalSupportTimer: 0, saveSlots: existingSaveSlots, activeGalacticEvent: null, pendingYieldReport: null,
      worldWidth: w, worldHeight: h,
      camera: { x: 0, y: 0 },
      player: { id: 'player', x: playerPos.x, y: playerPos.y, radius: 15, angle: -Math.PI / 2, color: '#3B82F6', hp: PLAYER_STATS.maxHp, maxHp: PLAYER_STATS.maxHp, armor: PLAYER_STATS.maxArmor, maxArmor: PLAYER_STATS.maxArmor, speed: PLAYER_STATS.speed, lastHitTime: 0, weapons: initialWeapons as Record<WeaponType, WeaponState>, loadout: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL], inventory: new Array(INVENTORY_SIZE).fill(null), upgrades: [], freeModules: [], grenadeModules: [], currentWeaponIndex: 0, grenades: PLAYER_STATS.maxGrenades, score: PLAYER_STATS.initialScore, isAiming: false },
      base: { x: basePos.x, y: basePos.y, width: BASE_STATS.width, height: BASE_STATS.height, hp: BASE_STATS.maxHp, maxHp: BASE_STATS.maxHp, },
      secondaryBase: undefined,
      terrain, bloodStains: [], enemies: [], allies: [], projectiles: [], particles: [], orbitalBeams: [], turretSpots: initialTurretSpots, toxicZones: [], activeSpecialEvent: SpecialEventType.NONE,
      wave: 1, waveTimeRemaining: 30000, waveDuration: 30000, spawnTimer: 0, enemiesPendingSpawn: 17, enemiesSpawnedInWave: 0, totalEnemiesInWave: 99999, lastAllySpawnTime: 0,
      
      pustuleTimer: 0,
      nextPustuleSpawnTime: 65000 + Math.random() * 130000, // 65-195s

      isGameOver: false, missionComplete: false, isPaused: false, isTacticalMenuOpen: false, isInventoryOpen: false, isShopOpen: false, floatingTexts: [],
      settings: currentSettings, stats: { shotsFired: 0, shotsHit: 0, damageDealt: 0, damageBySource: { [DamageSource.PLAYER]: 0, [DamageSource.TURRET]: 0, [DamageSource.ALLY]: 0, [DamageSource.ORBITAL]: 0, [DamageSource.ENEMY]: 0 }, killsByType: { [EnemyType.GRUNT]: 0, [EnemyType.RUSHER]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 0, [EnemyType.VIPER]: 0, [EnemyType.PUSTULE]: 0, 'BOSS': 0 }, encounteredEnemies: [] },
      time: 0
    };

    if (isCampaign) {
        // Init campaign specific stats
        this.state.waveTimeRemaining = 0; // Not used as wave timer
        this.state.wave = 0;
        this.state.enemiesPendingSpawn = 0;
        this.state.base.maxHp *= 2; // Buff base for campaign
        this.state.base.hp = this.state.base.maxHp;
    }

    if (!fullReset) { if (this.spaceshipManager) this.spaceshipManager.registerModifiers(); }
    
    // Reset Timing
    this.lastTime = 0;
    this.accumulator = 0;
    this.time.sync(performance.now());
    
    this.notifyUI('RESET');
  }

  public update(time: number) {
    if (this.lastTime === 0) { 
        this.lastTime = time; 
        this.time.sync(time); // Sync simulation time to initial real time
        return; 
    }
    
    let frameTime = time - this.lastTime;
    this.lastTime = time;
    
    // Cap frame time to prevent spiral of death on lag spikes
    if (frameTime > 250) frameTime = 250;

    // Transient UI updates run every render frame
    this.loopListeners.forEach(cb => cb(frameTime, time));

    if (this.state.isPaused || this.state.isShopOpen || this.state.isGameOver || this.state.appMode !== AppMode.GAMEPLAY) {
        return;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= this.FIXED_STEP) {
        this.time.advance(this.FIXED_STEP);
        this.fixedUpdate(this.FIXED_STEP);
        this.accumulator -= this.FIXED_STEP;
    }
  }

  private fixedUpdate(dt: number) {
    // Fixed Time Step Logic (dt is always ~16.66ms)
    // Scale is 1.0 because we are running at target speed
    const timeScale = 1.0; 
    
    this.state.time += dt;

    // --- PHYSICS UPDATE (Centralized Collision) ---
    this.physics.update(dt);

    // --- Mission Logic ---
    this.missionManager.update(dt);

    // --- Floating Text Lifecycle ---
    const floatingTexts = this.state.floatingTexts;
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const m = floatingTexts[i];
        m.life -= dt;
        m.x += m.vx * timeScale;
        m.y += m.vy * timeScale;
        if (m.type === FloatingTextType.DAMAGE || m.type === FloatingTextType.CRIT) { m.vx *= 0.92; m.vy *= 0.92; } 
        else if (m.type === FloatingTextType.LOOT) { m.vy -= 0.05 * timeScale; } 
        else { m.vy = -0.5 * timeScale; }
        if (m.life <= 0) { this.floatingTextPool.push(m); floatingTexts[i] = floatingTexts[floatingTexts.length - 1]; floatingTexts.pop(); }
    }

    // --- Managers Update ---
    this.spaceshipManager.update(dt);
    this.playerManager.update(dt, this.time.now, timeScale);
    this.projectileManager.update(dt, timeScale);
    this.enemyManager.update(dt, timeScale);
    this.defenseManager.update(dt, this.time.now, timeScale);
    this.fxManager.update(dt, timeScale);

    // --- Camera Follow ---
    const targetCamX = this.state.player.x - CANVAS_WIDTH / 2;
    const targetCamY = this.state.player.y - CANVAS_HEIGHT / 2;
    // Use state dimensions
    this.state.camera.x = Math.max(0, Math.min(targetCamX, this.state.worldWidth - CANVAS_WIDTH));
    this.state.camera.y = Math.max(0, Math.min(targetCamY, this.state.worldHeight - CANVAS_HEIGHT));
    
    // Update Audio Listener Position
    this.audio.updateCamera(this.state.camera.x, this.state.camera.y);
  }
  
  // ... (Remaining delegation methods same as before) ...
  public deployToPlanet(id: string) { this.galaxyManager.deployToPlanet(id); this.notifyUI('DEPLOY'); }
  public constructBuilding(planetId: string, type: PlanetBuildingType, slotIndex: number) { this.galaxyManager.constructBuilding(planetId, type, slotIndex); this.notifyUI('CONSTRUCT'); }
  public completeMission() { 
      this.state.missionComplete = true;
      this.state.isPaused = true;
      if (this.state.currentPlanet) { const pIdx = this.state.planets.findIndex(p => p.id === this.state.currentPlanet?.id); if (pIdx !== -1) { this.state.planets[pIdx].completed = true; } }
      if (this.state.spaceship.infrastructureLocked) { this.state.spaceship.infrastructureLocked = false; this.state.spaceship.infrastructureOptions = []; }
      const yieldItems = this.galaxyManager.calculateYields();
      const totalYield = yieldItems.reduce((sum, item) => sum + item.total, 0);
      if (totalYield > 0) { this.state.pendingYieldReport = { items: yieldItems, totalYield }; } else { this.state.pendingYieldReport = null; }
      this.notifyUI('MISSION_COMPLETE');
  }
  public claimYields() { if (this.state.pendingYieldReport) { this.state.player.score += this.state.pendingYieldReport.totalYield; this.audio.play('TURRET_2', this.state.base.x, this.state.base.y); this.state.pendingYieldReport = null; } this.finalizeMissionReturn(); }
  private finalizeMissionReturn() { this.state.appMode = AppMode.EXPLORATION_MAP; this.galaxyManager.triggerGalacticEvent(); this.audio.stopAmbience(); this.notifyUI('RETURN_MAP'); }
  public skipWave() { this.missionManager.skipWave(); this.notifyUI('WAVE_UPDATE'); }
  public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) { this.enemyManager.damageEnemy(enemy, amount, source); }
  public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange?: number, source: DamageSource = DamageSource.ENEMY, activeModules?: WeaponModule[]) { this.eventBus.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, { x, y, targetX: tx, targetY: ty, speed, damage: dmg, fromPlayer, color, homingTargetId: homingTarget, isHoming, createsToxicZone, maxRange, source, activeModules }); }
  public spawnParticle(x: number, y: number, color: string, count: number, speed: number) { this.eventBus.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x, y, color, count, speed }); }
  
  public damageBase(amount: number) { 
      this.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BASE_DAMAGE' }); 
      
      // Since Campaign no longer uses secondary base in this version, check logic is simpler.
      if (this.state.base.hp <= 0) { 
          this.state.isGameOver = true; 
          this.state.isPaused = true; 
          this.notifyUI('GAME_OVER'); 
      } 
  }
  
  public damageArea(x: number, y: number, radius: number, damage: number, source: DamageSource = DamageSource.PLAYER) {
      this.aoeCache.length = 0;
      this.physics.spatialGrid.query(x, y, radius, this.aoeCache);
      for (const e of this.aoeCache) {
          const dSq = (e.x - x)**2 + (e.y - y)**2;
          if (dSq < radius * radius) { this.damageEnemy(e, damage, source); }
      }
  }

  public toggleTacticalMenu() { this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen; this.notifyUI('TACTICAL_TOGGLE'); }
  public toggleInventory() { this.state.isInventoryOpen = !this.state.isInventoryOpen; this.notifyUI('INVENTORY_TOGGLE'); }
  public togglePause() { this.state.isPaused = !this.state.isPaused; this.notifyUI('PAUSE_TOGGLE'); }
  public toggleSetting(key: keyof GameSettings) { 
      if (key === 'language') { const newLang = this.state.settings.language === 'EN' ? 'CN' : 'EN'; this.state.settings.language = newLang; } 
      else if (key === 'lightingQuality') { this.state.settings.lightingQuality = this.state.settings.lightingQuality === 'HIGH' ? 'LOW' : 'HIGH'; } 
      else if (key === 'particleIntensity') { this.state.settings.particleIntensity = this.state.settings.particleIntensity === 'HIGH' ? 'LOW' : 'HIGH'; } 
      else if (key === 'performanceMode') { const modes: PerformanceMode[] = ['QUALITY', 'BALANCED', 'PERFORMANCE']; const idx = modes.indexOf(this.state.settings.performanceMode || 'BALANCED'); this.state.settings.performanceMode = modes[(idx + 1) % modes.length]; } 
      else if (key === 'resolutionScale') { const cur = this.state.settings.resolutionScale || 1.0; if (cur === 1.0) this.state.settings.resolutionScale = 0.75; else if (cur === 0.75) this.state.settings.resolutionScale = 0.5; else this.state.settings.resolutionScale = 1.0; } 
      else { (this.state.settings as any)[key] = !(this.state.settings as any)[key]; }
      this.persistSettings(); this.notifyUI('SETTING_CHANGE');
  }
  public addMessage(text: string, x: number, y: number, color: string, type: FloatingTextType, time: number = 1000) {
      if (!this.state.settings.showDamageNumbers && (type === FloatingTextType.DAMAGE || type === FloatingTextType.CRIT)) return;
      let vx = 0; let vy = -0.5; let size = 12;
      if (type === FloatingTextType.DAMAGE) { vx = (Math.random() - 0.5) * 4; vy = (Math.random() * -2) - 1; time = 600; size = 14; } 
      else if (type === FloatingTextType.CRIT) { vx = (Math.random() - 0.5) * 6; vy = -3; time = 1000; size = 20; } 
      else if (type === FloatingTextType.LOOT) { vx = 0; vy = -1.5; time = 1500; size = 12; } 
      else { vx = 0; vy = -0.2; size = 16; }
      let ft: FloatingText;
      if (this.floatingTextPool.length > 0) { ft = this.floatingTextPool.pop()!; ft.id = `ft-${Date.now()}-${Math.random()}`; ft.text = text; ft.x = x; ft.y = y; ft.vx = vx; ft.vy = vy; ft.color = color; ft.maxLife = time; ft.life = time; ft.type = type; ft.size = size; } 
      else { ft = { id: `ft-${Date.now()}-${Math.random()}`, text, x, y, vx, vy, color, maxLife: time, type, size, life: time }; }
      this.state.floatingTexts.push(ft);
  }
  public saveGame() { this.saveManager.saveGame(); this.notifyUI('SAVE'); }
  public loadGame(id: string) { this.saveManager.loadGame(id); this.notifyUI('LOAD'); }
  public deleteSave(id: string) { this.saveManager.deleteSave(id); this.notifyUI('SAVE_DELETE'); }
  public togglePin(id: string) { this.saveManager.togglePin(id); this.notifyUI('SAVE_PIN'); }
  public exportSave(id: string) { return this.saveManager.exportSaveString(id); }
  public importSave(json: string) { const res = this.saveManager.importSave(json); if(res) this.notifyUI('SAVE_IMPORT'); return res; }
  public enterSurvivalMode() { this.reset(true, GameMode.SURVIVAL); this.notifyUI('MODE_SWITCH'); }
  public enterExplorationMode() { this.reset(true, GameMode.EXPLORATION); this.notifyUI('MODE_SWITCH'); }
  public enterCampaignMode() { this.reset(true, GameMode.CAMPAIGN); this.notifyUI('MODE_SWITCH'); }
  
  public enterSpaceshipView() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.audio.stopAmbience(); this.notifyUI('MODE_SWITCH'); }
  public exitSpaceshipView() { this.state.appMode = AppMode.EXPLORATION_MAP; this.notifyUI('MODE_SWITCH'); }
  public enterOrbitalUpgradeMenu() { this.state.appMode = AppMode.ORBITAL_UPGRADES; this.notifyUI('MODE_SWITCH'); }
  public exitOrbitalUpgradeMenu() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterCarapaceGrid() { this.state.appMode = AppMode.CARAPACE_GRID; this.notifyUI('MODE_SWITCH'); }
  public exitCarapaceGrid() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterShipComputer() { this.state.appMode = AppMode.SHIP_COMPUTER; this.notifyUI('MODE_SWITCH'); }
  public exitShipComputer() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterInfrastructureResearch() { this.state.appMode = AppMode.INFRASTRUCTURE_RESEARCH; this.notifyUI('MODE_SWITCH'); }
  public exitInfrastructureResearch() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterPlanetConstruction() { this.state.appMode = AppMode.PLANET_CONSTRUCTION; this.notifyUI('MODE_SWITCH'); }
  public exitPlanetConstruction() { this.state.appMode = AppMode.EXPLORATION_MAP; this.notifyUI('MODE_SWITCH'); }
  public selectPlanet(id: string | null) { this.state.selectedPlanetId = id; this.notifyUI('PLANET_SELECT'); }
  public closeGalacticEvent() { this.state.activeGalacticEvent = null; this.notifyUI('EVENT_CLOSE'); }
  public enterBioSequencing() { this.state.appMode = AppMode.BIO_SEQUENCING; this.notifyUI('MODE_SWITCH'); }
  public exitBioSequencing() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public generateBioGrid() { this.spaceshipManager.generateBioGrid(); }
  public conductBioResearch() { this.spaceshipManager.conductBioResearch(); this.notifyUI('BIO_RESEARCH'); }
  public unlockBioNode(nodeId: number) { this.spaceshipManager.unlockBioNode(nodeId); this.notifyUI('BIO_UNLOCK'); }
  public acceptBioTask(taskId: string) { this.spaceshipManager.acceptBioTask(taskId); this.notifyUI('BIO_TASK'); }
  public abortBioTask() { this.spaceshipManager.abortBioTask(); this.notifyUI('BIO_TASK'); }
  public ascendToOrbit() { const wasSuccess = this.state.missionComplete; this.state.missionComplete = false; this.state.isPaused = false; this.state.isGameOver = false; this.state.currentPlanet = null; this.state.selectedPlanetId = null; this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; this.state.turretSpots.forEach(s => s.builtTurret = undefined); if (wasSuccess && this.state.gameMode === GameMode.EXPLORATION) { if (this.state.pendingYieldReport && this.state.pendingYieldReport.totalYield > 0) { this.state.appMode = AppMode.YIELD_REPORT; } else { this.finalizeMissionReturn(); } } else { this.state.appMode = AppMode.EXPLORATION_MAP; this.audio.stopAmbience(); } this.notifyUI('ASCEND'); }
  public emergencyEvac() { this.state.isGameOver = false; this.state.isPaused = false; this.state.appMode = AppMode.EXPLORATION_MAP; this.state.currentPlanet = null; this.state.selectedPlanetId = null; this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; this.audio.stopAmbience(); this.notifyUI('EVAC'); }
  public activateBackdoor() { this.state.player.score += 9999999; this.audio.play('TURRET_2', this.state.base.x, this.state.base.y); this.addMessage("CHEAT ACTIVATED: FUNDS ADDED", this.state.player.x, this.state.player.y, 'yellow', FloatingTextType.SYSTEM); this.notifyUI('CHEAT'); }
  public generateOrbitalUpgradeTree() { this.spaceshipManager.generateOrbitalUpgradeTree(); }
  public purchaseOrbitalUpgrade(nodeId: string) { this.spaceshipManager.purchaseOrbitalUpgrade(nodeId); this.notifyUI('UPGRADE'); }
  public generateCarapaceGrid() { this.spaceshipManager.generateCarapaceGrid(); }
  public purchaseCarapaceNode(row: number, col: number) { this.spaceshipManager.purchaseCarapaceNode(row, col); this.notifyUI('UPGRADE'); }
  public generateInfrastructureOptions() { this.spaceshipManager.generateInfrastructureOptions(); }
  public purchaseInfrastructureUpgrade(optionId: string) { this.spaceshipManager.purchaseInfrastructureUpgrade(optionId); this.notifyUI('UPGRADE'); }
  public equipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.equipModule(target, modId); this.notifyUI('EQUIP'); }
  public unequipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.unequipModule(target, modId); this.notifyUI('EQUIP'); }
}
